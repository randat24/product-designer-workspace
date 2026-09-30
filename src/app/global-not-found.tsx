import Link from "next/link";
import { headers } from "next/headers";
import "@fontsource-variable/manrope";
import "@fontsource-variable/oswald";
import "./globals.css";
import { dict, isLocale, type Locale } from "@/site/content";
import { THEME_INIT_SCRIPT } from "@/site/theme-toggle";

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
      <body>
        <div className="flex min-h-dvh flex-col">
          <header className="border-b border-line">
            <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-4 sm:px-8">
              <Link href={`/${locale}`} className="font-display text-[20px] font-bold uppercase leading-none">
                {d.name}
              </Link>
            </div>
          </header>
          <main id="main" className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 px-4 py-24 sm:px-8">
            <p className="display-num text-[clamp(64px,12vw,140px)] leading-none text-fg-secondary">404</p>
            <h1 className="page-title">{d.ui.notFoundTitle}</h1>
            <p className="max-w-[560px] text-[18px] text-fg-secondary">{d.ui.notFoundBody}</p>
            <nav className="flex flex-wrap gap-3" aria-label={d.ui.mainNav}>
              <Link
                href={`/${locale}`}
                className="inline-flex h-11 items-center rounded-[10px] border-[1.5px] border-accent bg-accent px-5 text-[15px] font-semibold text-on-accent hover:bg-accent-hover"
              >
                {d.ui.notFoundHome}
              </Link>
              <Link
                href={`/${locale}/cases`}
                className="inline-flex h-11 items-center rounded-[10px] border-[1.5px] border-fg px-5 text-[15px] font-semibold text-fg hover:bg-subtle"
              >
                {d.ui.notFoundWork}
              </Link>
              <Link href={`/${locale}/about`} className="inline-flex h-11 items-center px-2 text-[15px] font-semibold underline underline-offset-4">
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
    <html lang="ru">
      <head>
        <title>Страница не найдена</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <main className="mx-auto flex max-w-md flex-col gap-3 px-6 py-24">
          <h1 className="text-title font-semibold">Страница не найдена</h1>
          <p className="text-fg-secondary">Проект или пространство не существует, либо у вас нет к нему доступа.</p>
          <Link href="/app" className="text-accent hover:underline">К проектам</Link>
        </main>
      </body>
    </html>
  );
}
