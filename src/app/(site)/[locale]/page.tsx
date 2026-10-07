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
import { ArrowRight, FileText, Mail } from "lucide-react";
import { ContactMenu } from "@/site/contact-menu";
import { INTAKE } from "@/site/intake/content";
import { LinkedInIcon, TelegramIcon } from "@/site/social-icons";
import { CaseList } from "@/site/case-list";
import { CaseCanvas, type CanvasCase } from "@/site/case-canvas";
import { count, plural } from "@/site/plural";
import { Eyebrow, PrimaryLink, SecondaryLink, container } from "@/site/ui";

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
  const shown = cases.slice(0, 4);
  const f = d.fedo;
  const recordsOf = (c: (typeof cases)[number]) => (c.process ? Object.values(c.process).reduce((a, b) => a + b, 0) : 0);
  const records = shown.reduce((a, c) => a + recordsOf(c), 0);
  // What the FEDO cursor says at each frame: the chain from research to screens when the process is published.
  const say = (c: (typeof cases)[number]) => {
    const p = c.process;
    const chain = p && [
      p.observations && count(locale, p.observations, f.forms.observations),
      p.insights && count(locale, p.insights, f.forms.insights),
      p.screens && count(locale, p.screens, f.forms.screens),
    ].filter(Boolean);
    return chain && chain.length ? `${c.title}: ${chain.join(" → ")}` : [c.title, c.client, c.year].filter(Boolean).join(" · ");
  };
  const canvasCases: CanvasCase[] = shown.map((c, i) => ({
    slug: c.slug,
    href: `/${locale}/cases/${c.slug}`,
    title: c.title,
    label: `${String(i + 1).padStart(2, "0")} · ${c.title}`,
    cover: c.cover ? { src: c.cover.src, width: c.cover.width, height: c.cover.height, alt: c.cover.alt } : undefined,
    screens: c.cover ? undefined : c.gallery?.slice(0, 4).map((g) => ({ src: g.src, width: g.width, height: g.height })),
    sticker: c.sticker,
    blurred: !!c.adult && !c.coverSafe,
    process: c.process,
    say: say(c),
    track: trackAttrs("case_open", { case_slug: c.slug, location: "home" }),
  }));
  const canvasLabels = {
    ...f.canvas,
    open: d.cases.open,
    placeholder: d.cases.placeholder,
    stages: d.process.stages,
    records: Object.fromEntries(shown.map((c) => {
      const n = recordsOf(c);
      return [c.slug, { n, rest: f.canvas.inWorkbook.replace("{records}", plural(locale, n, f.forms.records)) }];
    })),
  };
  const thesis = f.thesis
    .replace("{cases}", count(locale, shown.length, f.forms.cases))
    .replace("{records}", count(locale, records, f.forms.records));

  return (
    <>
      <JsonLd data={graph(websiteLd(locale), personLd(locale))} />
      {/* The work opens the page: a one-line introduction, then the first case large, then the rest. */}
      <section className={`${container} flex flex-col gap-10 pb-12 pt-8 sm:pt-10`} aria-labelledby="work">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          {/* The name is already in the header; the page says what it is. */}
          <h1 className="font-label text-[13px] font-medium uppercase tracking-[0.06em]">
            <span className="sr-only">{d.name}. </span>{d.home.portfolio} <span className="text-fg-secondary">· {d.role}</span>
          </h1>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            {d.home.available}
          </p>
        </div>
        {/* Desktop: the work as frames on a canvas, with the records of the workbook beside each. Phones: cards. */}
        <div className="hidden flex-col gap-6 md:flex">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="work" className="t-section max-w-[26ch]" data-spec="text">
              {records > 0 ? thesis : d.home.selected}
            </h2>
            <Link href={`/${locale}/cases`} className="hit shrink-0 border-b-[1.5px] border-current text-[14px] font-semibold">{d.home.all} →</Link>
          </div>
          {canvasCases.length > 0 && <CaseCanvas cases={canvasCases} labels={canvasLabels} />}
        </div>
        <div className="md:hidden">
          <CaseList
          cases={cases.slice(0, 4)}
          locale={locale}
          location="home"
          hero
          heading={
            <h2 className="t-section">
              {d.home.selected}
              <sup className="ml-2 align-top font-label text-[14px] font-normal tracking-normal text-fg-secondary">({String(Math.min(cases.length, 4)).padStart(2, "0")})</sup>
            </h2>
          }
          extra={
            <Link href={`/${locale}/cases`} className="hit ml-1 shrink-0 border-b-[1.5px] border-current text-[14px] font-semibold">
              {d.home.all} →
            </Link>
          }
        />
        </div>
      </section>

      {/* Who is behind the work: after it, for those who got interested. */}
      <section className={`${container} grid gap-10 py-12 lg:grid-cols-[1fr_330px] lg:items-center`} aria-labelledby="about-me">
        <div className="flex flex-col gap-6 border-t-[1.5px] border-fg pt-10">
          <h2 id="about-me" className="t-section">{d.about.title}</h2>
          <p className="max-w-[640px] text-[clamp(17px,2vw,20px)] leading-[1.5] text-fg-secondary">
            <span className="text-fg">{d.home.hello}</span> {d.home.lead}
          </p>
          <Signature className="signature-draw -my-2 h-16 w-auto self-start text-fg sm:h-20" title={d.name} />
          <div className="flex flex-wrap items-center gap-3">
            <ContactMenu
              label={d.home.cta}
              heading={d.ui.writeVia}
              copyLabel={d.ui.copyEmail}
              copiedLabel={d.ui.copied}
              contacts={CONTACTS}
              location="hero"
            />
            <SecondaryLink href={CONTACTS.cv[locale]} download icon={<FileText aria-hidden className="size-4" />} track={trackAttrs("resume_download", { location: "hero" })}>
              {d.home.ctaCv}
            </SecondaryLink>
            <Link href={`/${locale}/about`} className="hit ml-1 border-b-[1.5px] border-current text-[14px] font-semibold">{d.home.aboutMore} →</Link>
          </div>
        </div>
        <ul className="relative hidden h-[300px] origin-right scale-[.8] lg:block" aria-hidden="true">
          {STICKERS.map((s, i) => (
            <li
              key={s.text}
              className="absolute flex h-[120px] w-[150px] items-end rounded-[4px] p-3 font-display text-[21px] font-bold uppercase leading-[1.1] text-on-sticky shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
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

      {/* Service */}
      <section className={`${container} py-12`}>
        <div className="grid gap-6 rounded-[18px] bg-rail p-6 text-rail-fg sm:p-10 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-2">
            <Eyebrow className="text-rail-fg opacity-70">{d.jobs[0]!.period}</Eyebrow>
            <p className="font-display text-[32px] font-bold uppercase leading-[1.1]">{d.about.serviceTitle}</p>
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
        <h2 className="t-section">{d.contact.title}</h2>
        <p className="max-w-[560px] text-[18px] text-fg-secondary">{d.contact.lead}</p>
        <div className="flex flex-wrap gap-3">
          <PrimaryLink href={`/${locale}/start-project`} icon={<ArrowRight aria-hidden className="size-4" />} track={trackAttrs("project_request_cta", { location: "contact" })}>
            {INTAKE[locale].cta}
          </PrimaryLink>
          <SecondaryLink href={`mailto:${CONTACTS.email}`} icon={<Mail aria-hidden className="size-4" />} track={trackAttrs("contact_email_click", { location: "contact" })}>
            {d.contact.write}
          </SecondaryLink>
          <SecondaryLink href={CONTACTS.telegram} icon={<TelegramIcon className="size-4" />} track={trackAttrs("telegram_click", { location: "contact" })}>Telegram</SecondaryLink>
          <SecondaryLink href={CONTACTS.linkedin} icon={<LinkedInIcon className="size-4" />} track={trackAttrs("linkedin_click", { location: "contact" })}>LinkedIn</SecondaryLink>
        </div>
      </div>
    </section>
  );
}
