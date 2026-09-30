import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTACTS, LOCALES, dict, isLocale } from "@/site/content";
import { trackAttrs } from "@/site/analytics/track";
import { getCases } from "@/site/cases-source";
import { CaseGallery } from "@/site/case-gallery";
import { CaseStoryView } from "@/site/case-story-view";
import { JsonLd } from "@/site/json-ld";
import { breadcrumbLd, caseLd, graph, localeUrl, pageMetadata } from "@/site/seo";
import { CaseCover, Eyebrow, KindBadge, PrimaryLink, SecondaryLink, container } from "@/site/ui";

// Cases published later in the tool are rendered on first visit and then cached.
export const revalidate = 60;
// Cases published after the build render on first visit (the layout limits only the locale).
export const dynamicParams = true;

export async function generateStaticParams() {
  const lists = await Promise.all(LOCALES.map(async (locale) => ({ locale, cases: await getCases(locale) })));
  return lists.flatMap(({ locale, cases }) => cases.map((c) => ({ locale, slug: c.slug })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const item = (await getCases(locale)).find((c) => c.slug === slug);
  if (!item) return {};
  // Placeholder cases stay out of search results until real content replaces them.
  return pageMetadata({
    locale,
    path: `/cases/${slug}`,
    title: item.title,
    description: item.summary,
    type: "article",
    caseSlug: slug,
    noindex: item.sample,
  });
}

export default async function CasePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const cases = await getCases(locale);
  const index = cases.findIndex((c) => c.slug === slug);
  const item = cases[index];
  if (!item) notFound();
  const next = cases.length > 1 ? cases[(index + 1) % cases.length]! : null;

  return (
    <article className="pb-20 pt-10">
      <JsonLd
        data={graph(
          caseLd(locale, item),
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.cases.title, url: localeUrl(locale, "/cases") },
            { name: item.title, url: localeUrl(locale, `/cases/${item.slug}`) },
          ]),
        )}
      />
      <div className={`${container} flex flex-col gap-8`}>
        <nav aria-label={d.ui.breadcrumbs}>
          <ol className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-fg-secondary">
            <li><Link href={`/${locale}`} className="hover:text-fg">{d.ui.home}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={`/${locale}/cases`} className="hover:text-fg">{d.cases.title}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">{item.title}</li>
          </ol>
        </nav>
        <header className="flex max-w-[820px] flex-col gap-5">
          {item.kind && (
            <div className="flex">
              <KindBadge kind={item.kind} label={item.kind === "concept" ? d.project.concept : d.project.real} />
            </div>
          )}
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
        {/* Live product, or a note that the pages can be browsed here (no site / a concept). */}
        {item.liveUrl ? (
          <div className="flex">
            <SecondaryLink href={item.liveUrl} track={trackAttrs("case_live_open", { case_slug: item.slug, location: "case" })}>
              {d.project.live} ↗
            </SecondaryLink>
          </div>
        ) : item.gallery?.length ? (
          <p className="text-[15px] text-fg-secondary">
            {item.kind === "concept" ? d.project.conceptNote : d.project.noLive}{" "}
            <a href="#pages" className="font-semibold text-fg underline underline-offset-4">{d.project.pages} ↓</a>
          </p>
        ) : null}
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

      {item.gallery && item.gallery.length > 0 && (
        <section id="pages" aria-labelledby="pages-h" className={`${container} mt-14 scroll-mt-24`}>
          <h2 id="pages-h" className="mb-3 font-display text-[28px] font-bold uppercase leading-none">{d.project.pages}</h2>
          <CaseGallery items={item.gallery} labels={d.project} caseSlug={item.slug} />
        </section>
      )}

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
        {next ? (
          <Link
            href={`/${locale}/cases/${next.slug}`}
            className="group flex flex-col gap-1"
            {...trackAttrs("case_next", { case_slug: item.slug, next_slug: next.slug })}
          >
            <Eyebrow>{d.cases.next}</Eyebrow>
            <span className="font-display text-[28px] font-bold uppercase leading-none group-hover:underline">{next.title} →</span>
          </Link>
        ) : (
          <span />
        )}
        <PrimaryLink href={`mailto:${CONTACTS.email}`} track={trackAttrs("contact_email_click", { location: "case", case_slug: item.slug })}>
          {d.home.cta}
        </PrimaryLink>
      </div>
      </div>
    </article>
  );
}
