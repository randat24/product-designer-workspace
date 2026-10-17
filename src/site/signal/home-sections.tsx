import Link from "next/link";
import { button } from "./ui";
import { ArrowUpRight } from "lucide-react";
import { trackAttrs } from "@/site/analytics/track";
import { CONTACTS, type Locale } from "@/site/content";
import { container } from "@/site/ui";
import { APPROACH_ANCHOR } from "./hero";
import { signalCopy } from "./home-content";
import { PHOTO } from "@/site/photo";
import { SIZES, responsive } from "@/site/img";

/** «02 /» before a section's eyebrow, in the accent: the section's place on the page, counted by the page. */
export function SectionEyebrow({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <p className={`sg-eyebrow text-fg-secondary ${className ?? ""}`}>
      <span className="sg-section-index">{String(index).padStart(2, "0")} /</span>{children}
    </p>
  );
}

/** «Чим можу допомогти»: the four formats people hire for, each with what they get, and the way to the brief. */
export function SignalServices({ locale, index }: { locale: Locale; index: number }) {
  const v = signalCopy(locale).services;
  return (
    <section id="services" className="sg-section" aria-labelledby="services-heading">
      <div className={container}>
        <div className="sg-section-header">
          <div>
            <SectionEyebrow index={index}>{v.eyebrow}</SectionEyebrow>
            <h2 className="sg-heading" id="services-heading"><span className="sg-line"><span>{v.title[0]}</span></span>{" "}<span className="sg-line"><span>{v.title[1]}</span></span></h2>
          </div>
          <p className="sg-process-lead">{v.lead}</p>
        </div>
        <ul className="sg-services">
          {v.items.map((item, i) => (
            <li key={item.title} className="sg-service">
              <p className="sg-eyebrow sg-service-index">{String(i + 1).padStart(2, "0")}</p>
              <h3>{item.title}</h3>
              <p className="sg-service-text">{item.text}</p>
              <p className="sg-service-result"><span>{v.resultLabel}</span>{item.result}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Link href={`/${locale}/start-project`} className={button({ variant: "primary" })}
            {...trackAttrs("project_request_cta", { location: "services" })}>
            {v.cta}<ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** «Хто я»: who is behind the work, three facts and the way to the full story. */
export function SignalAbout({ locale, index }: { locale: Locale; index: number }) {
  const a = signalCopy(locale).about;
  return (
    <section id="about" className={`${container} sg-section sg-about`} aria-labelledby="about-heading">
      <div className="flex flex-col gap-8">
        <SectionEyebrow index={index}>{a.eyebrow}</SectionEyebrow>
        {/* eslint-disable-next-line @next/next/no-img-element -- the owner's photo, size known */}
        <img className="sg-about-photo" {...responsive(PHOTO.portrait.src, PHOTO.portrait.width, SIZES.thumb)}
          alt={PHOTO.alt[locale]} width={PHOTO.portrait.width} height={PHOTO.portrait.height} loading="lazy" decoding="async" />
      </div>
      <div className="min-w-0">
        <h2 className="sg-heading sg-about-title" id="about-heading"><span className="sg-line"><span>{a.title[0]}</span></span>{" "}<span className="sg-line"><span>{a.title[1]}</span></span></h2>
        <p className="sg-about-text">{a.text}</p>
        <dl className="sg-about-facts">
          {a.facts.map((f) => (
            <div key={f.value}><dt className="sr-only">{f.label}</dt><dd><strong>{f.value}</strong><span>{f.label}</span></dd></div>
          ))}
        </dl>
        <div className="mt-8">
          <Link href={`/${locale}/about`} className={button({ variant: "secondary" })}>
            {a.more}<ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** «Мій підхід»: four steps from discover to deliver. */
export function SignalProcess({ locale, index }: { locale: Locale; index: number }) {
  const p = signalCopy(locale).process;
  return (
    <section id={APPROACH_ANCHOR} className="sg-section sg-process" aria-labelledby="process-heading">
      <div className={container}>
        <div className="sg-section-header">
          <div>
            <SectionEyebrow index={index}>{p.eyebrow}</SectionEyebrow>
            <h2 className="sg-heading" id="process-heading"><span className="sg-line"><span>{p.title[0]}</span></span>{" "}<span className="sg-line"><span>{p.title[1]}</span></span></h2>
          </div>
          <p className="sg-process-lead">{p.lead}</p>
        </div>
        <ol className="sg-process-grid">
          {p.steps.map((s, i) => (
            <li key={s.code} className="sg-process-step">
              <p className="sg-eyebrow">{String(i + 1).padStart(2, "0")} — {s.code}</p>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** «Контакт»: the big line and the button open the brief, the links write directly. */
export function SignalContact({ locale, index }: { locale: Locale; index: number }) {
  const c = signalCopy(locale).contact;
  const links = [
    { label: "Email", href: `mailto:${CONTACTS.email}`, event: "contact_email_click" },
    { label: "Telegram", href: CONTACTS.telegram, event: "telegram_click" },
    { label: "LinkedIn", href: CONTACTS.linkedin, event: "linkedin_click" },
  ] as const;
  return (
    <section id="contact" className={`${container} sg-contact`} aria-labelledby="contact-heading">
      <SectionEyebrow index={index}>{c.eyebrow}</SectionEyebrow>
      <h2 className="sg-contact-title" id="contact-heading">
        <Link href={`/${locale}/start-project`} {...trackAttrs("project_request_cta", { location: "contact" })}>
          {c.title[0]}<br />{c.title[1]}<span aria-hidden> ↗</span>
        </Link>
      </h2>
      <div className="sg-contact-bottom">
        <div className="sg-contact-lead">
          <p>{c.text[0]}<br />{c.text[1]}</p>
          <Link href={`/${locale}/start-project`} className={button({ variant: "primary" })}
            {...trackAttrs("project_request_cta", { location: "contact" })}>
            {c.brief}<ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
        <ul className="sg-contact-links">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...trackAttrs(l.event, { location: "contact" })}>{l.label} <span aria-hidden>↗</span></a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
