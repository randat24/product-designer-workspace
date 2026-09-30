import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Signature } from "@/site/signature";
import { AWARD_TILE, AwardSvg } from "@/site/award-icons";
import { trackAttrs } from "@/site/analytics/track";
import { CONTACTS, dict, isLocale, type Locale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { JsonLd } from "@/site/json-ld";
import { graph, pageMetadata, personLd, websiteLd } from "@/site/seo";
import { CaseCard, Eyebrow, PrimaryLink, SecondaryLink, SectionTitle, container } from "@/site/ui";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "", title: d.seo.home.title, description: d.seo.home.description, absoluteTitle: true, type: "profile" });
}

const STICKERS = [
  { text: "Research", bg: "var(--s7)", rot: "-6deg" },
  { text: "Flows", bg: "var(--s3)", rot: "4deg" },
  { text: "Design system", bg: "var(--s6)", rot: "-2deg" },
  { text: "Handoff", bg: "var(--s5)", rot: "5deg" },
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const cases = await getCases(locale);

  return (
    <>
      <JsonLd data={graph(websiteLd(locale), personLd(locale))} />
      {/* Hero */}
      <section className={`${container} grid gap-10 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1fr_330px] lg:items-center`}>
        <div className="flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            {d.home.available}
          </p>
          <h1 className="font-display text-[clamp(44px,8vw,96px)] font-bold uppercase leading-[0.9] tracking-[-0.01em]">
            {d.name}
          </h1>
          <p className="max-w-[640px] text-[clamp(17px,2vw,20px)] leading-[1.5] text-fg-secondary">
            <span className="text-fg">{d.home.hello}</span> {d.home.lead}
          </p>
          <Signature className="signature-draw -my-2 h-16 w-auto self-start text-fg sm:h-20" title={d.name} />
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href={`mailto:${CONTACTS.email}`} track={trackAttrs("contact_email_click", { location: "hero" })}>
              {d.home.cta}
            </PrimaryLink>
            <SecondaryLink href={CONTACTS.cv} download track={trackAttrs("resume_download", { location: "hero" })}>
              {d.home.ctaCv}
            </SecondaryLink>
          </div>
        </div>
        <ul className="relative hidden h-[300px] lg:block" aria-hidden="true">
          {STICKERS.map((s, i) => (
            <li
              key={s.text}
              className="absolute flex h-[120px] w-[150px] items-end rounded-[4px] p-3 font-display text-[21px] font-bold uppercase leading-[0.95] text-on-sticky shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
              style={{
                background: s.bg,
                transform: `rotate(${s.rot})`,
                left: `${(i % 2) * 165}px`,
                top: `${Math.floor(i / 2) * 150 + (i % 2) * 30}px`,
              }}
            >
              {s.text}
            </li>
          ))}
        </ul>
      </section>

      {/* Selected work */}
      <section className={`${container} flex flex-col gap-8 py-12`} aria-labelledby="work">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle id="work">{d.home.selected}</SectionTitle>
          <Link href={`/${locale}/cases`} className="shrink-0 text-[14px] font-semibold hover:underline">
            {d.home.all} →
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {cases.slice(0, 4).map((item) => (
            <CaseCard key={item.slug} item={item} locale={locale} label={d.cases.placeholder} location="home" />
          ))}
        </div>
      </section>

      {/* Service */}
      <section className={`${container} py-12`}>
        <div className="grid gap-6 rounded-[18px] bg-rail p-6 text-rail-fg sm:p-10 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-2">
            <Eyebrow className="text-rail-fg opacity-70">{d.jobs[0]!.period}</Eyebrow>
            <p className="font-display text-[32px] font-bold uppercase leading-none">{d.about.serviceTitle}</p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-[17px] leading-[1.6]">{d.about.serviceText}</p>
            <Link href={`/${locale}/about#service`} className="group flex w-fit flex-wrap items-center gap-3">
              <span className="flex -space-x-3">
                {d.awards.map((a) => (
                  <span
                    key={a.icon}
                    className="flex h-14 w-12 items-center justify-center rounded-[8px] border-2 border-rail text-[#b3b8e6]"
                    style={{ background: AWARD_TILE }}
                  >
                    <AwardSvg icon={a.icon} className="h-[82%] w-auto" />
                  </span>
                ))}
              </span>
              <span className="text-[14px] font-semibold underline underline-offset-4">
                {d.about.awards} · {d.awards.length} →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Contact locale={locale} />
    </>
  );
}

function Contact({ locale }: { locale: Locale }) {
  const d = dict(locale);
  return (
    <section id="contact" className={`${container} scroll-mt-24 py-16`}>
      <div className="flex flex-col gap-6 border-t-[1.5px] border-fg pt-10">
        <SectionTitle>{d.contact.title}</SectionTitle>
        <p className="max-w-[560px] text-[18px] text-fg-secondary">{d.contact.lead}</p>
        <div className="flex flex-wrap gap-3">
          <PrimaryLink href={`mailto:${CONTACTS.email}`} track={trackAttrs("contact_email_click", { location: "contact" })}>
            {d.contact.write}
          </PrimaryLink>
          <SecondaryLink href={CONTACTS.telegram} track={trackAttrs("telegram_click", { location: "contact" })}>Telegram</SecondaryLink>
          <SecondaryLink href={CONTACTS.linkedin} track={trackAttrs("linkedin_click", { location: "contact" })}>LinkedIn</SecondaryLink>
        </div>
      </div>
    </section>
  );
}
