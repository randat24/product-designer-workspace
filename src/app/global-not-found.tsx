import Link from "next/link";
import { headers } from "next/headers";
import "./fonts.css";
import "./globals.css";
import "@/site/signal/signal.css";
import { dict, isLocale, type Locale } from "@/site/content";
import { THEME_INIT_SCRIPT } from "@/site/theme-toggle";
import { FedoOutline } from "@/shared/ui/fedo-mark";
import { BrandMark } from "@/site/brand";
import { button } from "@/site/signal/ui";

// The 404 page for the whole app (experimental.globalNotFound): with several root layouts
// (site per locale, workspace) Next.js renders this instead of a segment not-found.tsx.
// Status 404; Next.js adds robots noindex itself. The language comes from the middleware
// (x-site-locale); without it the request belongs to the private workspace, which gets its own
// short Russian message.

export default async function GlobalNotFound() {
  const h = (await headers()).get("x-site-locale");
  if (!h) return <ToolNotFound />;
  const locale: Locale = isLocale(h) ? h : "uk";
  const d = dict(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <title>{`${d.seo.notFound.title} | ${d.name}`}</title>
        <meta name="description" content={d.seo.notFound.description} />
      </head>
      <body className="signal">
        <div className="flex min-h-dvh flex-col">
          <header className="border-b border-line">
            <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center px-5 sm:h-20 sm:px-8 lg:px-12">
              <Link href={`/${locale}`} className="flex items-center gap-3.5" aria-label={d.name}>
                <BrandMark />
                <span aria-hidden className="text-[14px] font-semibold">{d.name}</span>
              </Link>
            </div>
          </header>
          <main id="main" className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-5 py-24 sm:px-8 lg:px-12">
            <p className="sg-eyebrow text-fg-secondary"><span className="sg-section-index">404 /</span>{d.seo.notFound.title}</p>
            <h1 className="t-page">{d.ui.notFoundTitle}</h1>
            <p className="max-w-[560px] text-[18px] text-fg-secondary">{d.ui.notFoundBody}</p>
            <nav className="flex flex-wrap gap-3" aria-label={d.ui.mainNav}>
              <Link
                href={`/${locale}`}
                className={button({ variant: "primary" })}
              >
                {d.ui.notFoundHome}
              </Link>
              <Link
                href={`/${locale}/cases`}
                className={button({ variant: "secondary" })}
              >
                {d.ui.notFoundWork}
              </Link>
              <Link href={`/${locale}/about`} className={button({ variant: "ghost" })}>
                {d.nav.about}
              </Link>
            </nav>
          </main>
        </div>
      </body>
    </html>
  );
}

function ToolNotFound() {
  return (
    <html lang="uk">
      <head>
        <title>Сторінку не знайдено</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <main className="mx-auto flex max-w-md flex-col gap-3 px-6 py-24">
          <FedoOutline miss className="size-20" />
          <h1 className="text-title font-semibold">Сторінку не знайдено</h1>
          <p className="text-fg-secondary">Проєкту або простору не існує, або у вас немає до нього доступу.</p>
          <Link href="/app" className="text-accent-text hover:underline">До проєктів</Link>
        </main>
      </body>
    </html>
  );
}
