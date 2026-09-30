import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTACTS, LOCALES, dict, isLocale } from "@/site/content";
import { LangSwitch } from "@/site/lang-switch";
import { container } from "@/site/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return {
    title: { default: `${d.name} — ${d.role}`, template: `%s — ${d.name}` },
    description: d.home.lead,
    alternates: { languages: { uk: "/uk", en: "/en" } },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const year = new Date().getFullYear();

  return (
    <div lang={locale} className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
        <div className={`${container} flex h-16 items-center gap-4`}>
          <Link href={`/${locale}`} className="font-display text-[20px] font-bold uppercase leading-none tracking-[0.01em]">
            {d.name}
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-[14px] font-semibold sm:gap-2" aria-label={d.nav.work}>
            <Link href={`/${locale}/cases`} className="hidden rounded-[8px] px-2.5 py-1.5 hover:bg-subtle sm:block">
              {d.nav.work}
            </Link>
            <Link href={`/${locale}/about`} className="hidden rounded-[8px] px-2.5 py-1.5 hover:bg-subtle sm:block">
              {d.nav.about}
            </Link>
            <a href={`/${locale}#contact`} className="hidden rounded-[8px] px-2.5 py-1.5 hover:bg-subtle sm:block">
              {d.nav.contact}
            </a>
          </nav>
          <LangSwitch current={locale} />
        </div>
        {/* Mobile nav: a second row instead of a hamburger — only three links. */}
        <nav className={`${container} flex gap-4 pb-2.5 text-[14px] font-semibold sm:hidden`}>
          <Link href={`/${locale}/cases`}>{d.nav.work}</Link>
          <Link href={`/${locale}/about`}>{d.nav.about}</Link>
          <a href={`/${locale}#contact`}>{d.nav.contact}</a>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-rail text-rail-fg">
        <div className={`${container} flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between`}>
          <div className="flex flex-col gap-2">
            <p className="font-display text-[24px] font-bold uppercase leading-none">{d.name}</p>
            <p className="text-[14px] opacity-70">{d.role} · {d.location}</p>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold">
            <li><a href={`mailto:${CONTACTS.email}`} className="hover:underline">{CONTACTS.email}</a></li>
            <li><a href={CONTACTS.telegram} target="_blank" rel="noreferrer" className="hover:underline">Telegram</a></li>
            <li><a href={CONTACTS.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></li>
            <li><a href={CONTACTS.dribbble} target="_blank" rel="noreferrer" className="hover:underline">Dribbble</a></li>
          </ul>
        </div>
        <div className={`${container} flex items-center justify-between border-t border-current/15 py-4 text-[12px] opacity-60`}>
          <span>© {year} · {d.footer.rights}</span>
          <Link href="/app" className="hover:underline">{d.footer.login}</Link>
        </div>
      </footer>
    </div>
  );
}
