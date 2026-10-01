import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "@/shared/lib/env";

// Route map (see docs/SEO.md):
// - public site: /uk/**, /en/** — no Supabase call at all (fast TTFB, cacheable);
// - public files and metadata routes: robots.txt, sitemap.xml, icons, /og, /cv, /awards, /api/project-request;
// - private workspace: /app, /w/**, /account — session required, else → /login;
// - auth: /login, /auth/** — session refreshed, a signed-in user is sent from /login to /app;
// - "/" picks the language; any other path is a localized 404 (never a redirect to /login).

const LOCALES = ["uk", "en"] as const;
const PRIVATE_PREFIXES = ["/app", "/w", "/account"];
const AUTH_PREFIXES = ["/login", "/auth"];
const PUBLIC_FILES = ["/robots.txt", "/sitemap.xml", "/favicon.ico", "/icon.svg", "/apple-icon.png", "/manifest.webmanifest"];
// /api/project-request: the client's copy of a project brief, gated by a one-time token, not by a session.
const PUBLIC_PREFIXES = ["/og", "/cv", "/awards", "/api/project-request"];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

/** Language from the URL, else from the browser (Ukrainian by default). */
function pickLocale(request: NextRequest): (typeof LOCALES)[number] {
  const first = request.nextUrl.pathname.split("/")[1];
  if (first === "uk" || first === "en") return first;
  const lang = request.headers.get("accept-language") ?? "";
  return /^en\b/i.test(lang.trim()) && !/\buk\b/i.test(lang) ? "en" : "uk";
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // "/" → /uk or /en. 307: the answer depends on the browser language (Vary), so it must not be
  // cached as permanent. Crawlers without Accept-Language get /uk; hreflang x-default points here.
  if (path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${pickLocale(request)}`;
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Vary", "Accept-Language");
    return res;
  }

  // Public site and files: no session work. The locale header lets the 404 pages speak the page's language.
  if (LOCALES.some((l) => matches(path, `/${l}`))) {
    const headers = new Headers(request.headers);
    headers.set("x-site-locale", pickLocale(request));
    return NextResponse.next({ request: { headers } });
  }
  if (PUBLIC_FILES.includes(path) || PUBLIC_PREFIXES.some((p) => matches(path, p)) || path.startsWith("/icon") || path.startsWith("/apple-icon")) {
    return NextResponse.next();
  }

  const isPrivate = PRIVATE_PREFIXES.some((p) => matches(path, p));
  const isAuth = AUTH_PREFIXES.some((p) => matches(path, p));

  // Unknown URL: the site 404 in the visitor's language — never a redirect to /login. The rewrite
  // goes to a path no route matches (a one-segment path like /foo would match /[locale]), so
  // Next.js serves app/global-not-found.tsx: status 404, fully server-rendered.
  if (!isPrivate && !isAuth) {
    const headers = new Headers(request.headers);
    headers.set("x-site-locale", pickLocale(request));
    const url = request.nextUrl.clone();
    url.pathname = "/_/not-found";
    return NextResponse.rewrite(url, { request: { headers } });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not put code between client creation and getUser(): it revalidates the token.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isPrivate) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
