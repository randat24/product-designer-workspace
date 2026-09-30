import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTACTS, DICTIONARIES, LOCALES, dict, isLocale } from "@/site/content";
import { CaseStoryView } from "@/site/case-story-view";
import { CaseCover, Eyebrow, PrimaryLink, container } from "@/site/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => DICTIONARIES[locale].cases_list.map((c) => ({ locale, slug: c.slug })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const item = dict(locale).cases_list.find((c) => c.slug === slug);
  return item
    ? {
        title: item.title,
        description: item.summary,
        alternates: { languages: { uk: `/uk/cases/${slug}`, en: `/en/cases/${slug}` } },
      }
    : {};
}

export default async function CasePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const index = d.cases_list.findIndex((c) => c.slug === slug);
  const item = d.cases_list[index];
  if (!item) notFound();
  const next = d.cases_list[(index + 1) % d.cases_list.length]!;

  return (
    <article className="pb-20 pt-10">
      <div className={`${container} flex flex-col gap-8`}>
        <Link href={`/${locale}/cases`} className="w-fit text-[14px] font-semibold text-fg-secondary hover:text-fg">
          ← {d.cases.back}
        </Link>
        <header className="flex max-w-[820px] flex-col gap-5">
          <h1 className="font-display text-[clamp(38px,6vw,72px)] font-bold uppercase leading-[0.92]">{item.title}</h1>
          <p className="text-[clamp(17px,2vw,20px)] text-fg-secondary">{item.summary}</p>
        </header>
        <dl className={`grid grid-cols-2 gap-4 border-y border-line py-5 ${item.story ? "lg:grid-cols-6" : "sm:grid-cols-3"}`}>
          {[
            [d.cases.client, item.client],
            [d.cases.role, item.role],
            [d.cases.year, item.year],
            ...(item.story?.meta.map((m) => [m.label, m.value]) ?? []),
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt><Eyebrow>{k}</Eyebrow></dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <CaseCover item={item} label={d.cases.placeholder} large />
        {item.story && (
          <p className="rounded-[10px] border border-dashed border-line px-4 py-3 text-[14px] text-fg-secondary">{d.story.sample}</p>
        )}
        {!item.story && (
        <ul className="grid gap-4 sm:grid-cols-3">
          {item.metrics.map((m) => (
            <li key={m.label} className="rounded-[14px] border border-line bg-surface p-5">
              <p className="display-num text-[44px] leading-none">{m.value}</p>
              <p className="mt-2 text-[14px] text-fg-secondary">{m.label}</p>
            </li>
          ))}
        </ul>
        )}
      </div>

      {item.story ? (
        <div className="mt-12">
          <CaseStoryView story={item.story} labels={d.story} sticker={item.sticker} />
        </div>
      ) : (
      <div className={`${container} mt-14 flex flex-col gap-12`}>
        {item.sections.map((s, i) => (
          <section key={s.title} className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="flex items-baseline gap-3">
              <span className="display-num text-[14px] text-fg-secondary">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="font-display text-[28px] font-bold uppercase leading-none">{s.title}</h2>
            </div>
            <div className="flex max-w-[680px] flex-col gap-6">
              <p className="text-[18px] leading-[1.65]">{s.body}</p>
              {i % 2 === 1 && (
                <div className="flex aspect-[16/9] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-line bg-subtle text-[14px] text-fg-secondary">
                  {d.cases.placeholder}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      )}

      <div className={`${container} mt-20`}>
      <div className="flex flex-col gap-6 border-t-[1.5px] border-fg pt-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/${locale}/cases/${next.slug}`} className="group flex flex-col gap-1">
          <Eyebrow>{d.cases.next}</Eyebrow>
          <span className="font-display text-[28px] font-bold uppercase leading-none group-hover:underline">{next.title} →</span>
        </Link>
        <PrimaryLink href={`mailto:${CONTACTS.email}`}>{d.home.cta}</PrimaryLink>
      </div>
      </div>
    </article>
  );
}
