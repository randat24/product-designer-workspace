import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CONTACTS, dict, isLocale } from "@/site/content";
import { getSiteProfile } from "@/site/profile-source";
import { applyProfile } from "@/site/site-profile";
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

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Summary, facts, experience, skills and the rest come from «Профіль сайту» in the tool when written there.
  const d = applyProfile(dict(locale), await getSiteProfile(locale));
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
      {/* SIGNAL page opening, as on a case: eyebrow, the title set large, the summary beside the facts. */}
      <section className={container} aria-labelledby="about-h">
        <header className="sg-case-hero">
          <p className="sg-eyebrow text-fg-secondary">{d.about.eyebrow}</p>
          <h1 id="about-h" className="sg-case-title">{d.about.title}</h1>
          <div className="sg-case-hero-bottom">
            <p className="sg-case-deck">{d.about.summary}</p>
            <div className="flex flex-col gap-7">
              <dl className="sg-about-facts !mt-0">
                {d.about.facts.map((f, i) => (
                  <div key={i}><dt className="sr-only">{f.label}</dt><dd><strong>{f.value}</strong><span>{f.label}</span></dd></div>
                ))}
              </dl>
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
            </div>
          </div>
        </header>
      </section>

      {/* The design career as an index of roles: each row opens to what was done there. */}
      <section className={`${container} grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-[clamp(48px,7vw,112px)]`} aria-labelledby="experience-h">
        <h2 id="experience-h" className="sg-eyebrow text-fg-secondary">{d.about.experience}</h2>
        <ol className="flex flex-col border-b border-line">
          {designJobs.map((job, i) => (
            <li key={`${i}`} className="border-t border-line">
              <details className="group" open={i === 0}>
                <summary className="hit grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_24px] gap-x-4 gap-y-1 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="font-label text-[11px] uppercase tracking-[0.08em] text-fg-secondary">{job.period}</span>
                  <h3 className="col-start-1 text-[clamp(20px,2vw,26px)] font-medium leading-[1.25] tracking-[-0.03em]">{job.title}</h3>
                  <span className="col-start-1 text-[15px] text-fg-secondary">{job.place}</span>
                  <span aria-hidden className="col-start-2 row-span-3 row-start-1 self-center font-label text-[20px] leading-none text-accent-text transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">+</span>
                </summary>
                <div className="flex max-w-[72ch] flex-col gap-3 pb-7">
                  <ul className="flex flex-wrap gap-1.5">
                    {job.points.map((p, k) => (
                      <li key={k} className="rounded-[4px] border border-line px-3 py-1 text-[13px]">{p}</li>
                    ))}
                  </ul>
                  {job.details?.map((p, k) => <p key={k} className="leading-[1.7] text-fg-secondary">{p}</p>)}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {/* How I work: the process, step by step */}
      <section aria-labelledby="approach-h" className={`${container} mt-24 flex flex-col gap-8`}>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 id="approach-h" className={bigTitle}>{d.about.approach}</h2>
          <p className="max-w-[52ch] text-[17px] leading-[1.55] text-fg-secondary">{d.about.approachLead}</p>
        </div>
        <ol className="sg-process-grid">
          {d.about.steps.map((step, i) => (
            <li key={step.title} className="sg-process-step flex flex-col">
              <p className="sg-eyebrow" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="mt-auto pt-5 font-label text-[11px] uppercase leading-[1.5] tracking-[0.04em] text-fg">
                <span className="text-fg-secondary">{d.about.inWorkbook}:</span> {step.tie}
              </div>
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

      {/* Skills, education, languages, availability */}
      <section className={`${container} mt-16 grid gap-10 md:grid-cols-2`}>
        <Block title={d.about.skills}>
          <dl className="flex flex-col gap-4">
            {d.skills.map((s, i) => (
              <div key={i}>
                <dt className="font-semibold">{s.group}</dt>
                <dd className="text-fg-secondary">{s.items}</dd>
              </div>
            ))}
          </dl>
        </Block>
        <Block title={d.about.availability}>
          <ul className="flex flex-col gap-2">
            {d.availability.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Block>
        <Block title={d.about.education}>
          <ul className="flex flex-col gap-3">
            {d.education.map((e, i) => (
              <li key={i} className="flex justify-between gap-4">
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
            {d.languages.map((l, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span className="font-semibold">{l.name}</span>
                <span className="text-fg-secondary">{l.level}</span>
              </li>
            ))}
          </ul>
        </Block>
      </section>

      {/* Service and awards: after the design story */}
      <section id="service" className={`${container} mt-20 scroll-mt-24`}>
        <div className="flex flex-col gap-10 border-t border-line pt-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-3">
              {serviceJob && <Eyebrow className="text-accent-text">{serviceJob.period}</Eyebrow>}
              <h2 className="t-section">{d.about.serviceTitle}</h2>
            </div>
            <div className="flex flex-col gap-3">
              <p className="max-w-[62ch] text-[17px] leading-[1.7]">{d.about.serviceText}</p>
              {serviceJob && <p className="text-[15px] text-fg-secondary">{serviceJob.title} · {serviceJob.place}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-[21px] font-semibold tracking-[-0.02em]">{d.about.awards}</h3>
            <AwardsShowcase awards={d.awards} label={d.about.awards} />
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="cta-h" className={`${container} mt-20`}>
        <div className="flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-end md:justify-between">
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
    <div className={cn("flex flex-col gap-4 border-t border-line pt-5", className)}>
      <h2 className="text-[21px] font-semibold tracking-[-0.02em]">{title}</h2>
      {children}
    </div>
  );
}
