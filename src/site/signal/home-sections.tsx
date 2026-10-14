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
import { NoteEntry } from "@/site/note-entry";
import type { Note } from "@/site/notes-source";

/** «02 /» before a section's eyebrow, in the accent. */
export function SectionEyebrow({ index, children, className }: { index: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`sg-eyebrow text-fg-secondary ${className ?? ""}`}>
      <span className="sg-section-index">{index} /</span>{children}
    </p>
  );
}

/** «Нотатки»: the three newest notes, so the home page shows what is new, and the way to the feed. */
export function SignalNotes({ locale, notes }: { locale: Locale; notes: Note[] }) {
  const v = signalCopy(locale).notes;
  if (notes.length === 0) return null;
  const shown = notes.slice(0, 3);
  return (
    <section id="notes" className="sg-section" aria-labelledby="notes-heading">
      <div className={container}>
        <div className="sg-section-header">
          <div>
            <SectionEyebrow index={v.index}>{v.eyebrow}</SectionEyebrow>
            <h2 className="sg-heading" id="notes-heading">
              {v.title}<span className="sg-heading-count">[{String(shown.length).padStart(2, "0")}]</span>
            </h2>
          </div>
        </div>
        <div className="sg-notes">
          {shown.map((note) => <NoteEntry key={note.number} note={note} locale={locale} link location="home" />)}
        </div>
        {notes.length > shown.length && (
          <p className="mt-10">
            <Link href={`/${locale}/notes`} className="sg-link">{v.all} →</Link>
          </p>
        )}
      </div>
    </section>
  );
}

/** «Чим можу допомогти»: the four formats people hire for, each with what they get, and the way to the brief. */
export function SignalServices({ locale }: { locale: Locale }) {
  const v = signalCopy(locale).services;
  return (
    <section id="services" className="sg-section" aria-labelledby="services-heading">
      <div className={container}>
        <div className="sg-section-header">
          <div>
            <SectionEyebrow index={v.index}>{v.eyebrow}</SectionEyebrow>
            <h2 className="sg-heading" id="services-heading">{v.title[0]}<br />{v.title[1]}</h2>
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
export function SignalAbout({ locale }: { locale: Locale }) {
  const a = signalCopy(locale).about;
  return (
    <section id="about" className={`${container} sg-section sg-about`} aria-labelledby="about-heading">
      <div className="flex flex-col gap-8">
        <SectionEyebrow index={a.index}>{a.eyebrow}</SectionEyebrow>
        {/* eslint-disable-next-line @next/next/no-img-element -- the owner's photo, size known */}
        <img className="sg-about-photo" {...responsive(PHOTO.portrait.src, PHOTO.portrait.width, SIZES.thumb)}
          alt={PHOTO.alt[locale]} width={PHOTO.portrait.width} height={PHOTO.portrait.height} loading="lazy" decoding="async" />
      </div>
      <div className="min-w-0">
        <h2 className="sg-heading sg-about-title" id="about-heading">{a.title[0]}<br />{a.title[1]}</h2>
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
export function SignalProcess({ locale }: { locale: Locale }) {
  const p = signalCopy(locale).process;
  return (
    <section id={APPROACH_ANCHOR} className="sg-section sg-process" aria-labelledby="process-heading">
      <div className={container}>
        <div className="sg-section-header">
          <div>
            <SectionEyebrow index={p.index}>{p.eyebrow}</SectionEyebrow>
            <h2 className="sg-heading" id="process-heading">{p.title[0]}<br />{p.title[1]}</h2>
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
export function SignalContact({ locale }: { locale: Locale }) {
  const c = signalCopy(locale).contact;
  const links = [
    { label: "Email", href: `mailto:${CONTACTS.email}`, event: "contact_email_click" },
    { label: "Telegram", href: CONTACTS.telegram, event: "telegram_click" },
    { label: "LinkedIn", href: CONTACTS.linkedin, event: "linkedin_click" },
  ] as const;
  return (
    <section id="contact" className={`${container} sg-contact`} aria-labelledby="contact-heading">
      <SectionEyebrow index={c.index}>{c.eyebrow}</SectionEyebrow>
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
