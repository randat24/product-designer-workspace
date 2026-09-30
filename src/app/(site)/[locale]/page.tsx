import Link from "next/link";
import { CONTACTS, dict, isLocale } from "@/site/content";
import { CaseCard, Eyebrow, PrimaryLink, SecondaryLink, SectionTitle, container } from "@/site/ui";
import { notFound } from "next/navigation";

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

  return (
    <>
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
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href={`mailto:${CONTACTS.email}`}>{d.home.cta}</PrimaryLink>
            <SecondaryLink href={CONTACTS.cv} download>{d.home.ctaCv}</SecondaryLink>
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
          {d.cases_list.map((item) => (
            <CaseCard key={item.slug} item={item} locale={locale} label={d.cases.placeholder} />
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
                  // eslint-disable-next-line @next/next/no-img-element -- static files
                  <img
                    key={a.image}
                    src={a.image}
                    alt=""
                    className={`h-14 w-12 rounded-[8px] border-2 border-rail bg-[#1d2447] ${a.fit === "cover" ? "object-cover" : "object-contain"} ${a.fit === "cutout" ? "p-1" : ""}`}
                  />
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

function Contact({ locale }: { locale: "uk" | "en" }) {
  const d = dict(locale);
  return (
    <section id="contact" className={`${container} scroll-mt-24 py-16`}>
      <div className="flex flex-col gap-6 border-t-[1.5px] border-fg pt-10">
        <SectionTitle>{d.contact.title}</SectionTitle>
        <p className="max-w-[560px] text-[18px] text-fg-secondary">{d.contact.lead}</p>
        <div className="flex flex-wrap gap-3">
          <PrimaryLink href={`mailto:${CONTACTS.email}`}>{d.contact.write}</PrimaryLink>
          <SecondaryLink href={CONTACTS.telegram}>Telegram</SecondaryLink>
          <SecondaryLink href={CONTACTS.linkedin}>LinkedIn</SecondaryLink>
        </div>
      </div>
    </section>
  );
}
