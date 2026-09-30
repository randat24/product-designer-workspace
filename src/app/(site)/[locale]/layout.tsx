import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/oswald";
import "../../globals.css";
import { getSiteUrl } from "@/shared/lib/site-url";
import { CONTACTS, LOCALES, dict, isLocale, type Locale } from "@/site/content";
import { AnalyticsClickListener } from "@/site/analytics/click-listener";
import { GoogleAnalytics } from "@/site/analytics/google-analytics";
import { trackAttrs } from "@/site/analytics/track";
import { BackToTop } from "@/site/back-to-top";
import { LangSwitch } from "@/site/lang-switch";
import { Signature } from "@/site/signature";
import { DribbbleIcon, LinkedInIcon, MailIcon, TelegramIcon } from "@/site/social-icons";
import { THEME_INIT_SCRIPT, ThemeToggle } from "@/site/theme-toggle";
import { container } from "@/site/ui";

// Root layout of the public site: <html lang> follows the locale. The private workspace has its
// own root (app/_root/tool-root.tsx). Only /uk and /en exist: any other first segment matches no
// route and gets app/global-not-found.tsx. Case pages opt back into dynamic slugs (new cases).
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f3" },
    { media: "(prefers-color-scheme: dark)", color: "#10132a" },
  ],
};

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
  const navLink = "rounded-[8px] px-2.5 py-1.5 hover:bg-subtle";

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
              <Link href={`/${locale}`} className="font-display text-[20px] font-bold uppercase leading-none tracking-[0.01em]">
                {d.name}
              </Link>
              <nav className="ml-auto hidden items-center gap-2 text-[14px] font-semibold sm:flex" aria-label={d.ui.mainNav}>
                <Link href={`/${locale}/cases`} className={navLink}>{d.nav.work}</Link>
                <Link href={`/${locale}/about`} className={navLink}>{d.nav.about}</Link>
                <a href={`/${locale}#contact`} className={navLink}>{d.nav.contact}</a>
              </nav>
              <div className="ml-auto flex items-center gap-2 sm:ml-0">
                <ThemeToggle labelLight={d.ui.themeLight} labelDark={d.ui.themeDark} />
                <LangSwitch current={locale} />
              </div>
            </div>
            {/* Mobile: a second row instead of a hamburger — only three links. */}
            <nav className={`${container} flex gap-4 pb-2.5 text-[14px] font-semibold sm:hidden`} aria-label={d.ui.mainNav}>
              <Link href={`/${locale}/cases`}>{d.nav.work}</Link>
              <Link href={`/${locale}/about`}>{d.nav.about}</Link>
              <a href={`/${locale}#contact`}>{d.nav.contact}</a>
            </nav>
          </header>

          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>

          <footer className="bg-rail text-rail-fg">
            <div className={`${container} flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-3">
                    <p className="font-display text-[24px] font-bold uppercase leading-none">{d.name}</p>
                    <Signature className="-mb-2 h-10 w-auto opacity-80" />
                  </div>
                  <p className="text-[14px] opacity-70">{d.role} · {d.location}</p>
                </div>
                <nav aria-label={d.ui.footerNav}>
                  <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
                    <li><Link href={`/${locale}`} className="hover:underline">{d.ui.home}</Link></li>
                    <li><Link href={`/${locale}/cases`} className="hover:underline">{d.nav.work}</Link></li>
                    <li><Link href={`/${locale}/about`} className="hover:underline">{d.nav.about}</Link></li>
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
                  className="text-[14px] font-semibold hover:underline"
                >
                  {CONTACTS.email}
                </a>
              </div>
            </div>
            <div className={`${container} flex items-center justify-between gap-4 border-t border-current/15 py-4`}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] opacity-60">
                <span>© {year} · {d.footer.rights}</span>
                {/* The private workspace: not for crawlers. */}
                <Link href="/app" rel="nofollow" prefetch={false} className="hover:underline">{d.footer.login}</Link>
              </div>
              <BackToTop label={d.footer.top} />
            </div>
          </footer>
        </div>
        <AnalyticsClickListener />
        <GoogleAnalytics />
        {/* Vercel serves /_vercel/speed-insights only on its own deployments. */}
        {process.env.VERCEL && <SpeedInsights />}
      </body>
    </html>
  );
}
