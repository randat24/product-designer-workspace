import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
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
import { CaseCover, PrimaryLink, ProcessStrip, SecondaryLink, container } from "@/site/ui";
import { TraceGraph } from "@/site/trace-graph";
import { INTAKE } from "@/site/intake/content";
import { signalCopy } from "@/site/signal/home-content";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The case page body, laid out as the SIGNAL case (the package's case.html): back link, eyebrow, the title set large,
 * the deck beside the facts, the cover in a frame, then the chapters and the next case. The public page renders the
 * published snapshot; the tool's preview renders the draft with the same component, so what is checked there is
 * what «Опублікувати» puts on the site.
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
  const s = signalCopy(locale);
  // The snapshot is data from the tool: show the window only for a real Figma file link.
  const figma = item.figma ? figmaFileUrl(item.figma) : null;
  const kind = item.kind === "concept" ? d.project.concept : item.kind === "real" ? d.project.real : null;
  // 18+ cases: everything below the facts waits for the visitor's age confirmation. A product case is
  // diagrams and brand work only (no product imagery of the audience), so it is not hidden behind the gate.
  const cover = (
    <figure className="sg-case-cover">
      {item.cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- static screenshot, sizes known
        <img src={item.cover.src} alt={item.cover.alt} width={item.cover.width} height={item.cover.height} fetchPriority="high" decoding="async" />
      ) : (
        <CaseCover item={item} label={d.cases.placeholder} large />
      )}
      <figcaption className="sg-case-caption">
        <span>{item.cover?.caption ?? item.title}</span>
        {position && <span>{d.cases.title} · {pad(position.index)} / {pad(position.total)}</span>}
      </figcaption>
    </figure>
  );
  const gate = (node: React.ReactNode) =>
    item.adult && !item.product ? <AdultGate labels={d.adult} backHref={`/${locale}/cases`}>{node}</AdultGate> : node;
  const facts = [
    [d.cases.client, item.client],
    [d.cases.role, item.role],
    [d.cases.year, item.year],
    ...(item.story?.meta.map((m) => [m.label, m.value]) ?? []),
  ].filter(([, v]) => v);

  return (
    <article className="sg-case">
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
      <div className={container}>
        <header className="sg-case-hero">
          <Link href={`/${locale}/cases`} className="sg-case-back"><ArrowLeft aria-hidden className="size-4" />{s.back}</Link>
          <p className="sg-eyebrow text-fg-secondary">
            {position && <span className="sg-section-index">{pad(position.index)} /</span>}
            {[kind, item.year].filter(Boolean).join(" · ")}
            {item.adult && <span className="ml-3 text-danger">{d.adult.badge}</span>}
          </p>
          {/* The case is the headline: its title is the largest type on the page. */}
          <h1 className="sg-case-title">{item.title}</h1>
          <div className="sg-case-hero-bottom">
            <div className="flex flex-col gap-5">
              <p className="sg-case-deck">{item.summary}</p>
              {item.product && (
                <>
                  <ul className="flex flex-wrap gap-2">
                    {item.product.disciplines.map((x) => (
                      <li key={x} className="rounded-[4px] border border-line px-3 py-1 text-[13px]">{x}</li>
                    ))}
                  </ul>
                  {item.product.note && <p className="text-[13px] text-fg-secondary">{item.product.note}</p>}
                </>
              )}
            </div>
            <dl className="sg-case-meta">
              {facts.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        </header>
        {item.coverSafe && cover}
        {item.process && (
          <section aria-label={d.process.title} className="mb-16"><ProcessStrip process={item.process} locale={locale} full /></section>
        )}
      </div>
      {gate(<>
      <div className={`${container} flex flex-col gap-6`}>
        {!item.coverSafe && cover}
        {/* Live product, or a note that the pages can be browsed here (no site / a concept). */}
        {item.liveUrl ? (
          <div className="flex">
            <SecondaryLink href={item.liveUrl} icon={<ArrowUpRight aria-hidden className="size-4" />} track={trackAttrs("case_live_open", { case_slug: item.slug, location: "case" })}>
              {d.project.live}
            </SecondaryLink>
          </div>
        ) : item.gallery?.length ? (
          <p className="sg-case-disclosure">
            {item.kind === "concept" ? d.project.conceptNote : d.project.noLive}{" "}
            <a href="#pages" className="text-fg underline underline-offset-4 hover:text-accent-text">{d.project.pages} ↓</a>
          </p>
        ) : null}
        {item.story && item.sample && <p className="sg-case-disclosure">{d.story.sample}</p>}
        {!item.story && item.metrics.length > 0 && (
          <dl className="sg-case-result">
            {item.metrics.map((m) => (
              <div key={m.label}><dt className="sr-only">{m.label}</dt><dd><strong>{m.value}</strong><span>{m.label}</span></dd></div>
            ))}
          </dl>
        )}
      </div>
      {item.trace && (
        <section aria-labelledby="trace-h" className={`${container} mt-16 flex flex-col gap-5`}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <h2 id="trace-h" className="sg-chapter-title">{d.fedo.trace.title}</h2>
            <p className="max-w-[58ch] text-fg-secondary">{d.fedo.trace.lead}</p>
          </div>
          <TraceGraph trace={item.trace} locale={locale}
            labels={{ ...d.fedo.trace, stages: d.process.stages, forms: { records: d.fedo.forms.records, links: d.fedo.forms.links } }} />
        </section>
      )}

      {item.gallery && item.gallery.length > 0 && (
        <section id="pages" aria-labelledby="pages-h" className={`${container} mt-16 scroll-mt-28`}>
          <h2 id="pages-h" className="sg-chapter-title mb-3">{d.project.pages}</h2>
          <CaseGallery items={item.gallery} labels={d.project} caseSlug={item.slug} />
        </section>
      )}

      {figma && (
        <section id="figma" aria-labelledby="figma-h" className={`${container} mt-16 scroll-mt-28`}>
          <h2 id="figma-h" className="sg-chapter-title mb-3">{d.project.figma}</h2>
          <p className="mb-5 max-w-[680px] text-fg-secondary">{d.project.figmaLead}</p>
          <CaseFigma url={figma} poster={item.cover?.src} labels={d.project} caseSlug={item.slug} />
        </section>
      )}

      {item.product ? (
        <div className="mt-20"><ProductStoryView story={item.product} /></div>
      ) : item.story ? (
        <div className="mt-20">
          <CaseStoryView story={item.story} labels={d.story} sticker={item.sticker} />
        </div>
      ) : (
      <div className={`${container} mt-20`}>
        {item.sections.map((sec, i) => (
          <section key={`${i}-${sec.title}`} className="sg-chapter grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-[clamp(48px,7vw,112px)]">
            <p className="sg-eyebrow text-fg-secondary"><span className="sg-section-index">{pad(i + 1)} /</span>{pad(item.sections.length)}</p>
            <div className="flex min-w-0 flex-col gap-6">
              <h2>{sec.title}</h2>
              <p className="whitespace-pre-line">{sec.body}</p>
              {/* Sample cases keep a dashed slot where a picture will go; real sections bring their own. */}
              {item.sample && !sec.image && i % 2 === 1 && (
                <div className="flex aspect-[16/9] items-center justify-center rounded-[4px] border border-dashed border-line bg-subtle text-[14px] text-fg-secondary">
                  {d.cases.placeholder}
                </div>
              )}
              {sec.image && (
                <figure className="sg-case-figure">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static case images with known size */}
                  <img src={sec.image.src} alt={sec.image.alt} width={sec.image.width} height={sec.image.height} loading="lazy" decoding="async" />
                  {sec.image.caption && <figcaption className="sg-case-caption"><span>{sec.image.caption}</span></figcaption>}
                </figure>
              )}
            </div>
          </section>
        ))}
      </div>
      )}

      </>)}

      <div className={container}>
        {next && (
          // The next case: the way out of a case is into the next piece of work.
          <section className="sg-case-next" aria-labelledby="case-next-title">
            <div>
              <p className="sg-eyebrow text-fg-secondary">
                {d.cases.next}{position && ` · ${pad((position.index % position.total) + 1)} / ${pad(position.total)}`}
              </p>
              <h2 id="case-next-title">{next.title}</h2>
            </div>
            <Link href={`/${locale}/cases/${next.slug}`} className="sg-button sg-button--primary"
              {...trackAttrs("case_next", { case_slug: item.slug, next_slug: next.slug })}>
              {d.cases.open}<ArrowUpRight aria-hidden className="size-4" />
            </Link>
          </section>
        )}
        <div className="flex flex-col gap-5 border-t border-line py-10 sm:flex-row sm:items-center sm:justify-between">
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
