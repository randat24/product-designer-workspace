import Link from "next/link";
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
import { AdultBadge, CaseCover, Eyebrow, KindBadge, PrimaryLink, SecondaryLink, container } from "@/site/ui";
import { INTAKE } from "@/site/intake/content";

/**
 * The case page body. The public page renders the published snapshot; the tool's preview renders the draft
 * with the same component, so what is checked there is what «Опублікувати» puts on the site.
 */
export function CaseArticle({ item, locale, next, banner }: {
  item: Case;
  locale: Locale;
  next: Case | null;
  /** Shown above the case instead of structured data: the draft preview. */
  banner?: React.ReactNode;
}) {
  const d = dict(locale);
  // The snapshot is data from the tool: show the window only for a real Figma file link.
  const figma = item.figma ? figmaFileUrl(item.figma) : null;
  // 18+ cases: everything below the facts waits for the visitor's age confirmation. A product case is
  // diagrams and brand work only (no product imagery of the audience), so it is not hidden behind the gate.
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
          {(item.kind || item.adult) && (
            <div className="flex gap-2">
              {item.kind && <KindBadge kind={item.kind} label={item.kind === "concept" ? d.project.concept : d.project.real} />}
              {item.adult && <AdultBadge label={d.adult.badge} />}
            </div>
          )}
          <h1 className="font-display text-[clamp(38px,6vw,72px)] font-bold uppercase leading-[1.1]">{item.title}</h1>
          <p className="text-[clamp(17px,2vw,20px)] text-fg-secondary">{item.summary}</p>
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
      </div>
      {item.coverSafe && (
        <div className={`${container} mt-8`}><CaseCover item={item} label={d.cases.placeholder} large /></div>
      )}
      {gate(<>
      <div className={`${container} mt-8 flex flex-col gap-8`}>
        {!item.coverSafe && <CaseCover item={item} label={d.cases.placeholder} large />}
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

      <div className={`${container} mt-20`}>
      <div className="flex flex-col gap-6 border-t-[1.5px] border-fg pt-10 sm:flex-row sm:items-center sm:justify-between">
        {next ? (
          <Link
            href={`/${locale}/cases/${next.slug}`}
            className="group flex flex-col gap-1"
            {...trackAttrs("case_next", { case_slug: item.slug, next_slug: next.slug })}
          >
            <Eyebrow>{d.cases.next}</Eyebrow>
            <span className="font-display text-[28px] font-bold uppercase leading-[1.1] group-hover:underline">{next.title} →</span>
          </Link>
        ) : (
          <span />
        )}
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
