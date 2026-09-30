import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CONTACTS, dict, isLocale } from "@/site/content";
import { trackAttrs } from "@/site/analytics/track";
import { JsonLd } from "@/site/json-ld";
import { breadcrumbLd, graph, localeUrl, pageMetadata, personId, personLd } from "@/site/seo";
import { AwardCard, Eyebrow, PrimaryLink, SecondaryLink, SectionTitle, container } from "@/site/ui";
import { cn } from "@/shared/lib/cn";
import { ExternalIcon } from "@/site/social-icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "/about", title: d.seo.about.title, description: d.seo.about.description, type: "profile" });
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);

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
      {/* Intro */}
      <section className={`${container} grid gap-8 md:grid-cols-[1fr_260px]`}>
        <div className="flex flex-col gap-5">
          <h1 className="page-title">{d.about.title}</h1>
          <p className="max-w-[680px] text-[clamp(17px,2vw,20px)] leading-[1.55]">{d.about.summary}</p>
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href={CONTACTS.cv} download track={trackAttrs("resume_download", { location: "about" })}>
              {d.about.download}
            </PrimaryLink>
            <SecondaryLink href={`mailto:${CONTACTS.email}`} track={trackAttrs("contact_email_click", { location: "about" })}>
              {d.home.cta}
            </SecondaryLink>
          </div>
          <Link
            href={`/${locale}/cases`}
            className="w-fit text-[15px] font-semibold underline underline-offset-4"
            {...trackAttrs("portfolio_cta_click", { cta: "cases", location: "about" })}
          >
            {d.ui.seeWork} →
          </Link>
        </div>
        {/* Portrait placeholder */}
        <div
          className="flex aspect-[4/5] items-end rounded-[14px] p-4 font-display text-[22px] font-bold uppercase leading-none text-on-sticky"
          style={{ background: "var(--s5)" }}
          aria-hidden="true"
        >
          {d.name}
        </div>
      </section>

      {/* Service and awards */}
      <section id="service" className={`${container} mt-16 scroll-mt-24`}>
        <div className="flex flex-col gap-8 rounded-[18px] bg-rail p-6 text-rail-fg sm:p-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-2">
              <Eyebrow className="text-rail-fg opacity-70">{d.jobs[0]!.period}</Eyebrow>
              <p className="font-display text-[36px] font-bold uppercase leading-none">{d.about.serviceTitle}</p>
            </div>
            <p className="text-[17px] leading-[1.6]">{d.about.serviceText}</p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-display text-[20px] font-bold uppercase">{d.about.awards}</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {d.awards.map((a) => (
                <AwardCard key={a.icon} award={a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className={`${container} mt-16 flex flex-col gap-8`}>
        <SectionTitle>{d.about.experience}</SectionTitle>
        <ol className="flex flex-col">
          {d.jobs.map((job) => (
            <li key={job.title + job.period} className="grid gap-3 border-t border-line py-6 md:grid-cols-[200px_1fr]">
              <p className="tabular-nums text-[14px] font-semibold text-fg-secondary">{job.period}</p>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-[24px] font-bold uppercase leading-[1.05]">
                  {job.title}
                  {job.military && (
                    <span className="ml-2 inline-block translate-y-[-3px] rounded-full bg-fg px-2 py-0.5 align-middle font-sans text-[11px] font-bold normal-case text-canvas">
                      {d.about.serviceTitle}
                    </span>
                  )}
                </h3>
                <p className="text-fg-secondary">{job.place}</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {job.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-fg-secondary" aria-hidden="true">—</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
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
                      className="inline-flex items-center gap-1 font-semibold underline decoration-line underline-offset-4 hover:decoration-fg"
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
    </div>
  );
}

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 border-t-[1.5px] border-fg pt-5", className)}>
      <h2 className="font-display text-[22px] font-bold uppercase leading-none">{title}</h2>
      {children}
    </div>
  );
}
