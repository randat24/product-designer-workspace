import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../../fonts.css";
import "../../globals.css";
// SIGNAL design system (trial): re-skins the public site only; the tool keeps globals.css as is.
import "@/site/signal/signal.css";
import { getSiteUrl } from "@/shared/lib/site-url";
import { CONTACTS, LOCALES, dict, isLocale, type Locale } from "@/site/content";
import { AnalyticsClickListener } from "@/site/analytics/click-listener";
import { GoogleAnalytics, gaId } from "@/site/analytics/google-analytics";
import { ConsentBanner } from "@/site/consent-banner";
import { trackAttrs } from "@/site/analytics/track";
import { BackToTop } from "@/site/back-to-top";
import { LangSwitch } from "@/site/lang-switch";
import { THEME_INIT_SCRIPT, ThemeToggle } from "@/site/theme-toggle";
import { container } from "@/site/ui";
import { BrandMark } from "@/site/brand";
import { SiteNav } from "@/site/site-nav";
import { signalCopy } from "@/site/signal/home-content";

// Root layout of the public site: <html lang> follows the locale. The private workspace has its
// own root (app/_root/tool-root.tsx). Only /uk and /en exist: any other first segment matches no
// route and gets app/global-not-found.tsx (the middleware lets only /uk and /en through).
// No `dynamicParams = false` here: it also applies to the nested [slug] of case pages, and a case
// published after the deploy would 404 until the next build.

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F1EB" },
    { media: "(prefers-color-scheme: dark)", color: "#191B18" },
  ],
};

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: d.seo.home.title, template: `%s | ${d.name}` },
    description: d.seo.home.description,
    applicationName: d.name,
    authors: [{ name: d.name, url: `${getSiteUrl()}/${locale}/about` }],
    creator: d.name,
    formatDetection: { telephone: false, email: false, address: false },
    // Search Console «URL prefix» property on the current address (before a domain with DNS verification exists).
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

const SOCIAL = [
  { key: "email", href: `mailto:${CONTACTS.email}`, label: "Email", event: "contact_email_click" },
  { key: "telegram", href: CONTACTS.telegram, label: "Telegram", event: "telegram_click" },
  { key: "linkedin", href: CONTACTS.linkedin, label: "LinkedIn", event: "linkedin_click" },
  { key: "dribbble", href: CONTACTS.dribbble, label: "Dribbble", event: "dribbble_click" },
] as const;

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  // The middleware lets only /uk and /en through, so a non-locale value is never a real page.
  // No notFound() here: Next renders the 404 tree inside this layout too, and a throw from the
  // root layout would drop the page to the bare error shell.
  const locale: Locale = isLocale(raw) ? raw : "uk";
  const d = dict(locale);
  const s = signalCopy(locale);
  const year = new Date().getFullYear();
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Before paint: a saved light/dark choice, so the page never flashes the other theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="signal">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[4px] focus:bg-fg focus:px-4 focus:py-2 focus:text-canvas"
        >
          {d.ui.skip}
        </a>
        <div className="flex min-h-dvh flex-col">
          {/* SIGNAL header: the hf. monogram with the name and role, two text links and «Обговорити проєкт ↗»,
              then theme and language. */}
          <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
            <div className={`${container} flex h-16 items-center gap-3 sm:h-20 sm:gap-4`}>
              <Link href={`/${locale}`} className="hit flex shrink-0 items-center gap-3.5 whitespace-nowrap" aria-label={d.name}>
                <BrandMark />
                <span aria-hidden className="flex flex-col text-[14px] font-semibold leading-[1.35]">
                  {d.name}
                  <small className="mt-0.5 hidden font-label text-[10px] font-normal uppercase tracking-[0.06em] text-fg-secondary sm:block">{s.role}</small>
                </span>
              </Link>
              <SiteNav locale={locale} labels={{ work: d.nav.work, about: d.nav.about, discuss: s.discuss }} ariaLabel={d.ui.mainNav} />
              <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
                <ThemeToggle labelLight={d.ui.themeLight} labelDark={d.ui.themeDark} />
                <LangSwitch current={locale} />
              </div>
            </div>
            {/* Phones and tablets (below lg): the links take a second row instead of a hamburger — only three links. */}
            <div className={container}>
              <SiteNav locale={locale} labels={{ work: d.nav.work, about: d.nav.about, discuss: s.discuss }} ariaLabel={d.ui.mainNav} mobile />
            </div>
          </header>

          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>

          {/* SIGNAL footer: one mono line under a rule. */}
          <footer className={`${container} mt-16 flex flex-col gap-4 border-t border-line py-7 font-label text-[11px] uppercase leading-[1.6] tracking-[0.04em] text-fg-secondary md:flex-row md:items-center md:justify-between`}>
            <span>© {year} {d.name}</span>
            <ul className="flex flex-wrap gap-x-5 gap-y-1" aria-label={d.ui.footerNav}>
              {SOCIAL.map(({ key, href, label, event }) => (
                <li key={key}>
                  <a href={href}
                    {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
                    {...trackAttrs(event, { location: "footer" })}
                    className="hit hover:text-fg">{label} ↗</a>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href={`/${locale}/privacy`} className="hit hover:text-fg">{d.footer.privacy}</Link>
              {/* The private workspace: not for crawlers. */}
              <Link href="/app" rel="nofollow" prefetch={false} className="hit hover:text-fg">{d.footer.login}</Link>
            </div>
          </footer>
        </div>
        <BackToTop label={d.ui.toTop} />
        <AnalyticsClickListener />
        <GoogleAnalytics />
        {gaId() && <ConsentBanner labels={d.privacy} privacyHref={`/${locale}/privacy`} />}
        {/* Vercel serves /_vercel/speed-insights only on its own deployments. */}
        {/* Vercel Web Analytics (pageviews, no cookies) and Speed Insights; only on Vercel, where /_vercel/* exists. */}
        {process.env.VERCEL && <Analytics />}
        {process.env.VERCEL && <SpeedInsights />}
      </body>
    </html>
  );
}
