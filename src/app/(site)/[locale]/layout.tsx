import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../../fonts.css";
import "../../globals.css";
import { getSiteUrl } from "@/shared/lib/site-url";
import { CONTACTS, LOCALES, dict, isLocale, type Locale } from "@/site/content";
import { AnalyticsClickListener } from "@/site/analytics/click-listener";
import { GoogleAnalytics, gaId } from "@/site/analytics/google-analytics";
import { ConsentBanner } from "@/site/consent-banner";
import { trackAttrs } from "@/site/analytics/track";
import { BackToTop } from "@/site/back-to-top";
import { LangSwitch } from "@/site/lang-switch";
import { Signature } from "@/site/signature";
import { DribbbleIcon, LinkedInIcon, MailIcon, TelegramIcon } from "@/site/social-icons";
import { THEME_INIT_SCRIPT, ThemeToggle } from "@/site/theme-toggle";
import { container } from "@/site/ui";
import { SiteNav } from "@/site/site-nav";
import { INTAKE } from "@/site/intake/content";

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
    { media: "(prefers-color-scheme: light)", color: "#eef0f3" },
    { media: "(prefers-color-scheme: dark)", color: "#10132a" },
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
  { key: "email", href: `mailto:${CONTACTS.email}`, label: CONTACTS.email, Icon: MailIcon, event: "contact_email_click" },
  { key: "telegram", href: CONTACTS.telegram, label: "Telegram", Icon: TelegramIcon, event: "telegram_click" },
  { key: "linkedin", href: CONTACTS.linkedin, label: "LinkedIn", Icon: LinkedInIcon, event: "linkedin_click" },
  { key: "dribbble", href: CONTACTS.dribbble, label: "Dribbble", Icon: DribbbleIcon, event: "dribbble_click" },
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
  const year = new Date().getFullYear();
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Before paint: a saved light/dark choice, so the page never flashes the other theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[8px] focus:bg-fg focus:px-4 focus:py-2 focus:text-canvas"
        >
          {d.ui.skip}
        </a>
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
            <div className={`${container} flex h-16 items-center gap-3 sm:gap-4`}>
              <Link href={`/${locale}`} className="hit shrink-0 whitespace-nowrap font-display text-[20px] font-bold uppercase leading-[1.1] tracking-[0.01em]">
                {d.name}
              </Link>
              <SiteNav locale={locale} labels={d.nav} ariaLabel={d.ui.mainNav} />
              <Link href={`/${locale}/start-project`} {...trackAttrs("project_request_cta", { location: "header" })}
                className="hidden h-9 shrink-0 items-center whitespace-nowrap rounded-[8px] bg-accent px-3.5 text-[14px] font-semibold text-on-accent transition-colors duration-[120ms] hover:bg-accent-hover md:ml-auto md:inline-flex lg:ml-0">
                {INTAKE[locale].cta}
              </Link>
              <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
                <ThemeToggle labelLight={d.ui.themeLight} labelDark={d.ui.themeDark} />
                <LangSwitch current={locale} />
              </div>
            </div>
            {/* Phones and tablets (below lg): the links take a second row instead of a hamburger — only three links.
                One row needs about 910px (name, links, «Обговорити проєкт», theme, language); squeezed below that, the
                labels wrapped onto two lines. */}
            <div className={container}>
              <SiteNav locale={locale} labels={d.nav} ariaLabel={d.ui.mainNav} mobile />
            </div>
          </header>

          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>

          <footer className="bg-rail text-rail-fg">
            <div className={`${container} flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-3">
                    <p className="font-display text-[24px] font-bold uppercase leading-[1.1]">{d.name}</p>
                    <Signature className="-mb-2 h-10 w-auto opacity-80" />
                  </div>
                  <p className="text-[14px] opacity-70">{d.role} · {d.location}</p>
                </div>
                <nav aria-label={d.ui.footerNav}>
                  <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
                    <li><Link href={`/${locale}`} className="hit hover:underline">{d.ui.home}</Link></li>
                    <li><Link href={`/${locale}/cases`} className="hit hover:underline">{d.nav.work}</Link></li>
                    <li><Link href={`/${locale}/about`} className="hit hover:underline">{d.nav.about}</Link></li>
                    <li><Link href={`/${locale}/start-project`} className="hit hover:underline" {...trackAttrs("project_request_cta", { location: "footer" })}>{INTAKE[locale].cta}</Link></li>
                  </ul>
                </nav>
              </div>
              <div className="flex flex-col gap-4 sm:items-end">
                <ul className="flex gap-2">
                  {SOCIAL.map(({ key, href, label, Icon, event }) => (
                    <li key={key}>
                      <a
                        href={href}
                        aria-label={label}
                        title={label}
                        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
                        {...trackAttrs(event, { location: "footer" })}
                        className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-current/25 transition-colors hover:border-current hover:bg-current/10"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:${CONTACTS.email}`}
                  {...trackAttrs("contact_email_click", { location: "footer" })}
                  className="hit text-[14px] font-semibold hover:underline"
                >
                  {CONTACTS.email}
                </a>
              </div>
            </div>
            <div className={`${container} flex items-center justify-between gap-4 border-t border-current/15 py-4`}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] opacity-60">
                <span>© {year} · {d.footer.rights}</span>
                {/* The private workspace: not for crawlers. */}
                <Link href={`/${locale}/privacy`} className="hit hover:underline">{d.footer.privacy}</Link>
                <Link href="/app" rel="nofollow" prefetch={false} className="hit hover:underline">{d.footer.login}</Link>
              </div>
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
