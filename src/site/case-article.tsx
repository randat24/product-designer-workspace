import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CONTACTS, dict, type Case, type Locale } from "@/site/content";
import { trackAttrs } from "@/site/analytics/track";
import { CaseFigma } from "@/site/case-figma";
import { CaseGallery } from "@/site/case-gallery";
import { figmaFileUrl } from "@/shared/lib/figma";
import { CaseStoryView } from "@/site/case-story-view";
import { ProductStoryView } from "@/site/product-story-view";
import { JsonLd } from "@/site/json-ld";
import { breadcrumbLd, caseLd, graph, localeUrl } from "@/site/seo";
import { ContactMenu } from "@/site/contact-menu";
import { AdultGate } from "@/site/adult-gate";
import { AdultBadge, KindBadge, NotchedCover, PrimaryLink, ProcessStrip, SecondaryLink, container } from "@/site/ui";
import { CursorIcon } from "@/shared/ui/fedo-mark";
import { TraceGraph } from "@/site/trace-graph";
import { INTAKE } from "@/site/intake/content";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The case page body. The public page renders the published snapshot; the tool's preview renders the draft
 * with the same component, so what is checked there is what «Опублікувати» puts on the site.
 */
export function CaseArticle({ item, locale, next, position, banner }: {
  item: Case;
  locale: Locale;
  next: Case | null;
  /** 1-based place of the case among the published ones, shown as «02 / 04». */
  position?: { index: number; total: number };
  /** Shown above the case instead of structured data: the draft preview. */
  banner?: React.ReactNode;
}) {
  const d = dict(locale);
  // The snapshot is data from the tool: show the window only for a real Figma file link.
  const figma = item.figma ? figmaFileUrl(item.figma) : null;
  // 18+ cases: everything below the facts waits for the visitor's age confirmation. A product case is
  // diagrams and brand work only (no product imagery of the audience), so it is not hidden behind the gate.
  // The cover keeps the bar and the stem of the F; its type and place in the list sit in the notch.
  const cover = (
    <NotchedCover item={item} label={d.cases.placeholder} large>
      <dl className="grid gap-2.5 pr-1">
        <div className="flex flex-col-reverse gap-0.5">
          <dd className="text-[15px] font-semibold">{item.kind === "concept" ? d.project.concept : d.project.real}</dd>
          <dt className="font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">{d.cases.type}</dt>
        </div>
        {position && (
          <div className="flex flex-col-reverse gap-0.5">
            <dd className="flex items-center gap-2 text-[15px] font-semibold"><CursorIcon className="size-4" />{pad(position.index)} / {pad(position.total)}</dd>
            <dt className="font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">{d.cases.title}</dt>
          </div>
        )}
      </dl>
    </NotchedCover>
  );
  const gate = (node: React.ReactNode) =>
    item.adult && !item.product ? <AdultGate labels={d.adult} backHref={`/${locale}/cases`}>{node}</AdultGate> : node;

  return (
    <article className="pb-20 pt-10">
      {banner ?? <JsonLd
        data={graph(
          caseLd(locale, item),
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.cases.title, url: localeUrl(locale, "/cases") },
            { name: item.title, url: localeUrl(locale, `/cases/${item.slug}`) },
          ]),
        )}
      />}
      <div className={`${container} flex flex-col gap-8`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav aria-label={d.ui.breadcrumbs}>
            <ol className="flex flex-wrap items-center gap-1.5 font-label text-[12px] uppercase tracking-[0.04em] text-fg-secondary">
              <li><Link href={`/${locale}`} className="hover:text-fg">{d.ui.home}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href={`/${locale}/cases`} className="hover:text-fg">{d.cases.title}</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">{item.title}</li>
            </ol>
          </nav>
          {position && (
            <span className="font-label text-[12px] text-fg-secondary">{pad(position.index)} / {pad(position.total)}</span>
          )}
        </div>
        {/* The case is the headline: its title is the largest type on the site. */}
        <header className="flex flex-col gap-5">
          {(item.kind || item.adult) && (
            <div className="flex gap-2">
              {item.kind && <KindBadge kind={item.kind} label={item.kind === "concept" ? d.project.concept : d.project.real} />}
              {item.adult && <AdultBadge label={d.adult.badge} />}
            </div>
          )}
          <h1 className="t-page">{item.title}</h1>
          <p className="max-w-[62ch] text-[clamp(18px,2vw,22px)] leading-[1.45]">{item.summary}</p>
          {item.product && (
            <>
              <ul className="flex flex-wrap gap-2">
                {item.product.disciplines.map((x) => (
                  <li key={x} className="rounded-full border border-line px-3.5 py-1.5 text-[14px] font-semibold">{x}</li>
                ))}
              </ul>
              {item.product.note && <p className="text-[14px] text-fg-secondary">{item.product.note}</p>}
            </>
          )}
        </header>
        <dl className={`grid grid-cols-2 border-y border-t-fg border-b-line ${item.story ? "lg:grid-cols-6" : "sm:grid-cols-3"}`}>
          {[
            [d.cases.client, item.client],
            [d.cases.role, item.role],
            [d.cases.year, item.year],
            ...(item.story?.meta.map((m) => [m.label, m.value]) ?? []),
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse justify-end gap-1 py-3.5 pr-4">
              <dd className="font-semibold">{v}</dd>
              <dt className="font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">{k}</dt>
            </div>
          ))}
        </dl>
      </div>
      {item.coverSafe && (
        <div className={`${container} mt-8`}>{cover}</div>
      )}
      {item.process && (
        <section aria-label={d.process.title} className={`${container} mt-10`}>
          <div className="rounded-[20px] border border-line bg-surface p-5 sm:p-7"><ProcessStrip process={item.process} locale={locale} full /></div>
        </section>
      )}
      {gate(<>
      <div className={`${container} mt-8 flex flex-col gap-8`}>
        {!item.coverSafe && cover}
        {/* Live product, or a note that the pages can be browsed here (no site / a concept). */}
        {item.liveUrl ? (
          <div className="flex">
            <SecondaryLink href={item.liveUrl} icon={<ArrowUpRight aria-hidden className="size-4" />} track={trackAttrs("case_live_open", { case_slug: item.slug, location: "case" })}>
              {d.project.live}
            </SecondaryLink>
          </div>
        ) : item.gallery?.length ? (
          <p className="text-[15px] text-fg-secondary">
            {item.kind === "concept" ? d.project.conceptNote : d.project.noLive}{" "}
            <a href="#pages" className="font-semibold text-fg underline underline-offset-4">{d.project.pages} ↓</a>
          </p>
        ) : null}
        {item.story && item.sample && (
          <p className="rounded-[10px] border border-dashed border-line px-4 py-3 text-[14px] text-fg-secondary">{d.story.sample}</p>
        )}
        {!item.story && item.metrics.length > 0 && (
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
      {item.trace && (
        <section aria-labelledby="trace-h" className={`${container} mt-14 flex flex-col gap-4`}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <h2 id="trace-h" className="t-section">{d.fedo.trace.title}</h2>
            <p className="max-w-[58ch] text-fg-secondary">{d.fedo.trace.lead}</p>
          </div>
          <TraceGraph trace={item.trace} locale={locale}
            labels={{ ...d.fedo.trace, stages: d.process.stages, forms: { records: d.fedo.forms.records, links: d.fedo.forms.links } }} />
        </section>
      )}

      {item.gallery && item.gallery.length > 0 && (
        <section id="pages" aria-labelledby="pages-h" className={`${container} mt-14 scroll-mt-24`}>
          <h2 id="pages-h" className="mb-3 font-display text-[28px] font-bold uppercase leading-[1.1]">{d.project.pages}</h2>
          <CaseGallery items={item.gallery} labels={d.project} caseSlug={item.slug} />
        </section>
      )}

      {figma && (
        <section id="figma" aria-labelledby="figma-h" className={`${container} mt-14 scroll-mt-24`}>
          <h2 id="figma-h" className="mb-3 font-display text-[28px] font-bold uppercase leading-[1.1]">{d.project.figma}</h2>
          <p className="mb-5 max-w-[680px] text-fg-secondary">{d.project.figmaLead}</p>
          <CaseFigma url={figma} poster={item.cover?.src} labels={d.project} caseSlug={item.slug} />
        </section>
      )}

      {item.product ? (
        <div className="mt-12"><ProductStoryView story={item.product} /></div>
      ) : item.story ? (
        <div className="mt-12">
          <CaseStoryView story={item.story} labels={d.story} sticker={item.sticker} />
        </div>
      ) : (
      <div className={`${container} mt-14 flex flex-col gap-12`}>
        {item.sections.map((s, i) => (
          <section key={`${i}-${s.title}`} className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="flex items-baseline gap-3">
              <span className="display-num text-[14px] text-fg-secondary">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="font-display text-[28px] font-bold uppercase leading-[1.1]">{s.title}</h2>
            </div>
            <div className="flex max-w-[680px] flex-col gap-6">
              <p className="whitespace-pre-line text-[18px] leading-[1.65]">{s.body}</p>
              {/* Sample cases keep a dashed slot where a picture will go; real sections bring their own. */}
              {item.sample && !s.image && i % 2 === 1 && (
                <div className="flex aspect-[16/9] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-line bg-subtle text-[14px] text-fg-secondary">
                  {d.cases.placeholder}
                </div>
              )}
            </div>
            {s.image && (
              <figure className="flex flex-col gap-2 md:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- static case images with known size */}
                <img src={s.image.src} alt={s.image.alt} width={s.image.width} height={s.image.height} loading="lazy" decoding="async"
                  className="h-auto w-full rounded-[14px] border border-line" />
                {s.image.caption && <figcaption className="text-[14px] text-fg-secondary">{s.image.caption}</figcaption>}
              </figure>
            )}
          </section>
        ))}
      </div>
      )}

      </>)}

      <div className={`${container} mt-20 flex flex-col gap-12`}>
        {next && (
          // The next case, large: the way out of a case is into the next piece of work.
          <Link
            href={`/${locale}/cases/${next.slug}`}
            className="group grid gap-6 border-t-[1.5px] border-fg pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:items-end md:gap-10"
            data-cursor={d.cases.next}
            {...trackAttrs("case_next", { case_slug: item.slug, next_slug: next.slug })}
          >
            <div className="flex min-w-0 flex-col gap-3">
              <p className="font-label text-[12px] uppercase tracking-[0.04em] text-fg-secondary">
                {d.cases.next}{position && ` · ${pad((position.index % position.total) + 1)} / ${pad(position.total)}`}
              </p>
              <span className="t-section">
                {next.title} <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-2 motion-reduce:transition-none">→</span>
              </span>
            </div>
            <NotchedCover item={next} label={d.cases.placeholder} className={cn(next.adult && !next.coverSafe && "[&_img]:blur-xl")}>
              <span className="flex items-center gap-2 text-[14px] font-semibold">
                <CursorIcon className="size-4 transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none" />{d.cases.open}
              </span>
            </NotchedCover>
          </Link>
        )}
        <div className="flex flex-col gap-5 rounded-[20px] border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-[46ch] text-[17px] text-fg-secondary">{d.contact.lead}</p>
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href={`/${locale}/start-project`} icon={<ArrowRight aria-hidden className="size-4" />} track={trackAttrs("project_request_cta", { location: "case" })}>
              {INTAKE[locale].cta}
            </PrimaryLink>
            <ContactMenu
              label={d.home.cta}
              heading={d.ui.writeVia}
              copyLabel={d.ui.copyEmail}
              copiedLabel={d.ui.copied}
              contacts={CONTACTS}
              location="case"
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
