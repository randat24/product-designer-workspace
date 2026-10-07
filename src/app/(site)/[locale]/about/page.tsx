import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CONTACTS, dict, isLocale } from "@/site/content";
import { trackAttrs } from "@/site/analytics/track";
import { JsonLd } from "@/site/json-ld";
import { breadcrumbLd, graph, localeUrl, pageMetadata, personId, personLd } from "@/site/seo";
import { ArrowRight, FileDown } from "lucide-react";
import { AwardsShowcase } from "@/site/awards-showcase";
import { ContactMenu } from "@/site/contact-menu";
import { INTAKE } from "@/site/intake/content";
import { Eyebrow, PrimaryLink, container } from "@/site/ui";
import { cn } from "@/shared/lib/cn";
import { ExternalIcon } from "@/site/social-icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "/about", title: d.seo.about.title, description: d.seo.about.description, type: "profile" });
}

const bigTitle = "t-section";
// Research, structure, design, decisions: the workbook's entity colours (globals.css).
const STEP_COLORS = ["var(--entity-research)", "var(--entity-structure)", "var(--entity-design)", "var(--entity-decision)"];

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  // The service is told in its own block near the end; the experience list is the design career.
  const serviceJob = d.jobs.find((j) => j.military);
  const designJobs = d.jobs.filter((j) => !j.military);

  return (
    <div className="pb-20 pt-12">
      <JsonLd
        data={graph(
          {
            "@type": "ProfilePage",
            "@id": `${localeUrl(locale, "/about")}#page`,
            url: localeUrl(locale, "/about"),
            name: d.seo.about.title,
            inLanguage: locale,
            mainEntity: { "@id": personId() },
          },
          personLd(locale),
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.about.title, url: localeUrl(locale, "/about") },
          ]),
        )}
      />
      {/* Intro: who I am as a designer, in facts */}
      <section className={`${container} grid gap-8 md:grid-cols-[1fr_260px]`}>
        <div className="flex flex-col gap-5">
          <p className="font-label text-[12px] uppercase tracking-[0.04em] text-fg-secondary">{d.about.eyebrow}</p>
          {/* The page title is the large word, not the name (the work is the headline of the site). */}
          <h1 className="t-page">{d.about.title}</h1>
          <p className="max-w-[62ch] text-[clamp(18px,2vw,21px)] leading-[1.5]">{d.about.summary}</p>
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href={CONTACTS.cv[locale]} download icon={<FileDown aria-hidden className="size-4" />} track={trackAttrs("resume_download", { location: "about" })}>
              {d.about.download}
            </PrimaryLink>
            <ContactMenu
              label={d.home.cta}
              heading={d.ui.writeVia}
              copyLabel={d.ui.copyEmail}
              copiedLabel={d.ui.copied}
              contacts={CONTACTS}
              location="about"
              variant="secondary"
            />
          </div>
          <dl className="mt-4 grid max-w-[680px] grid-cols-3 gap-4 border-t border-fg pt-5">
            {d.about.facts.map((f) => (
              // Label first in the markup (dt before dd), the number shown on top.
              <div key={f.label} className="flex flex-col-reverse justify-end gap-1">
                <dt className="text-[14px] leading-[1.4] text-fg-secondary">{f.label}</dt>
                <dd className="display-num text-[clamp(30px,3.4vw,40px)] leading-none">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {/* Portrait placeholder; hidden on phones, where it would push the story a screen down. */}
        <div
          className="hidden aspect-[4/5] rotate-2 items-end rounded-[14px] p-4 font-display text-[22px] font-bold uppercase leading-[1.08] text-on-sticky shadow-[0_6px_16px_rgba(0,0,0,0.12)] md:flex"
          style={{ background: "var(--s5)" }}
          aria-hidden="true"
        >
          {d.name}
        </div>
      </section>

      {/* How I work: the process, step by step */}
      <section aria-labelledby="approach-h" className={`${container} mt-20 flex flex-col gap-6`}>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 id="approach-h" className={bigTitle}>{d.about.approach}</h2>
          <p className="max-w-[52ch] text-[17px] leading-[1.55] text-fg-secondary">{d.about.approachLead}</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.about.steps.map((step, i) => (
            // Each step in the colour of the records it leaves in the workbook, as on the case pages.
            <li key={step.title} className="flex flex-col gap-3 rounded-[14px] border border-line border-t-4 bg-surface p-5" style={{ borderTopColor: STEP_COLORS[i] }}>
              <span className="font-label text-[12px] text-fg-secondary" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-[22px] font-bold uppercase leading-[1.08] tracking-[0.01em]">{step.title}</h3>
              <p className="text-[15px] leading-[1.55] text-fg-secondary">{step.text}</p>
              <p className="mt-auto border-t border-line pt-3 font-label text-[11px] uppercase leading-[1.5] tracking-[0.04em]">
                <span className="text-fg-secondary">{d.about.inWorkbook}:</span> {step.tie}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href={`/${locale}/cases`}
          className="hit w-fit text-[15px] font-semibold underline underline-offset-4"
          {...trackAttrs("portfolio_cta_click", { cta: "cases", location: "about" })}
        >
          {d.ui.seeWork} →
        </Link>
      </section>

      {/* Design experience (the service is its own block below) */}
      <section aria-labelledby="experience-h" className={`${container} mt-20 flex flex-col gap-8`}>
        <h2 id="experience-h" className={bigTitle}>{d.about.experience}</h2>
        {/* An index of roles: each row opens to what was done there. */}
        <ol className="flex flex-col border-t-[1.5px] border-fg">
          {designJobs.map((job, i) => (
            <li key={job.title + job.period} className="border-b border-line">
              <details className="group" open={i === 0}>
                <summary className="hit grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_24px] gap-x-4 gap-y-1 py-5 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_24px] md:items-baseline [&::-webkit-details-marker]:hidden">
                  <span className="font-label text-[12px] text-fg-secondary">{job.period}</span>
                  <h3 className="col-start-1 font-display text-[clamp(20px,2.2vw,26px)] font-bold uppercase leading-[1.08] md:col-start-2">{job.title}</h3>
                  <span className="col-start-1 text-[15px] text-fg-secondary md:col-start-3">{job.place}</span>
                  <span aria-hidden className="col-start-2 row-span-3 row-start-1 self-center text-[22px] leading-none transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none md:col-start-4 md:row-span-1">+</span>
                </summary>
                <div className="flex max-w-[calc(180px+72ch)] flex-col gap-3 pb-6 md:pl-[196px]">
                  <ul className="flex flex-wrap gap-1.5">
                    {job.points.map((p) => (
                      <li key={p} className="rounded-full border border-line px-3 py-1 text-[13px]">{p}</li>
                    ))}
                  </ul>
                  {job.details?.map((p) => <p key={p} className="text-fg-secondary">{p}</p>)}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {/* Skills, education, languages, availability */}
      <section className={`${container} mt-16 grid gap-10 md:grid-cols-2`}>
        <Block title={d.about.skills}>
          <dl className="flex flex-col gap-4">
            {d.skills.map((s) => (
              <div key={s.group}>
                <dt className="font-semibold">{s.group}</dt>
                <dd className="text-fg-secondary">{s.items}</dd>
              </div>
            ))}
          </dl>
        </Block>
        <Block title={d.about.availability}>
          <ul className="flex flex-col gap-2">
            {d.availability.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Block>
        <Block title={d.about.education}>
          <ul className="flex flex-col gap-3">
            {d.education.map((e) => (
              <li key={e.title} className="flex justify-between gap-4">
                <div>
                  {e.certificate ? (
                    <a
                      href={e.certificate}
                      {...trackAttrs("certificate_open", { provider: e.place.split(" ")[0] })}
                      target="_blank"
                      rel="noreferrer"
                      title={d.footer.certificate}
                      className="hit inline-flex items-center gap-1 font-semibold underline decoration-line underline-offset-4 hover:decoration-fg"
                    >
                      {e.title}
                      <ExternalIcon className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="font-semibold">{e.title}</p>
                  )}
                  <p className="text-[14px] text-fg-secondary">{e.place}</p>
                </div>
                <span className="shrink-0 tabular-nums text-[14px] text-fg-secondary">{e.year}</span>
              </li>
            ))}
          </ul>
        </Block>
        <Block title={d.about.languages}>
          <ul className="flex flex-col gap-2">
            {d.languages.map((l) => (
              <li key={l.name} className="flex justify-between gap-4">
                <span className="font-semibold">{l.name}</span>
                <span className="text-fg-secondary">{l.level}</span>
              </li>
            ))}
          </ul>
        </Block>
      </section>

      {/* Service and awards: after the design story */}
      <section id="service" className={`${container} mt-20 scroll-mt-24`}>
        <div className="flex flex-col gap-8 rounded-[18px] bg-rail p-6 text-rail-fg sm:p-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-2">
              {serviceJob && <Eyebrow className="text-rail-fg opacity-70">{serviceJob.period}</Eyebrow>}
              <h2 className="font-display text-[36px] font-bold uppercase leading-[1.1]">{d.about.serviceTitle}</h2>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[17px] leading-[1.6]">{d.about.serviceText}</p>
              {serviceJob && <p className="text-[15px] opacity-75">{serviceJob.title} · {serviceJob.place}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-[20px] font-bold uppercase">{d.about.awards}</h3>
            <AwardsShowcase awards={d.awards} label={d.about.awards} />
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="cta-h" className={`${container} mt-20`}>
        <div className="flex flex-col gap-6 border-t-[1.5px] border-fg pt-10 md:flex-row md:items-end md:justify-between">
          <h2 id="cta-h" className={bigTitle}>{d.about.ctaTitle}</h2>
          <div className="flex max-w-[460px] flex-col gap-4">
            <p className="text-[17px] leading-[1.55] text-fg-secondary">{d.about.ctaText}</p>
            <div className="flex flex-wrap gap-3">
              <PrimaryLink href={`/${locale}/start-project`} icon={<ArrowRight aria-hidden className="size-4" />} track={trackAttrs("project_request_cta", { location: "about" })}>
                {INTAKE[locale].cta}
              </PrimaryLink>
              <ContactMenu
                label={d.home.cta}
                heading={d.ui.writeVia}
                copyLabel={d.ui.copyEmail}
                copiedLabel={d.ui.copied}
                contacts={CONTACTS}
                location="about"
                variant="secondary"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 border-t-[1.5px] border-fg pt-5", className)}>
      <h2 className="font-display text-[22px] font-bold uppercase leading-[1.1]">{title}</h2>
      {children}
    </div>
  );
}
