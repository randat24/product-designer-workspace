import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trackAttrs } from "@/site/analytics/track";
import { CONTACTS, type Locale } from "@/site/content";
import { container } from "@/site/ui";
import { APPROACH_ANCHOR } from "./hero";
import { signalCopy } from "./home-content";

/** «02 /» before a section's eyebrow, in the accent. */
export function SectionEyebrow({ index, children, className }: { index: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`sg-eyebrow text-fg-secondary ${className ?? ""}`}>
      <span className="sg-section-index">{index} /</span>{children}
    </p>
  );
}

/** «Дизайнер за роботами»: who is behind the work, three facts and the way to the full story. */
export function SignalAbout({ locale }: { locale: Locale }) {
  const a = signalCopy(locale).about;
  return (
    <section id="about" className={`${container} sg-section sg-about`} aria-labelledby="about-heading">
      <SectionEyebrow index={a.index}>{a.eyebrow}</SectionEyebrow>
      <div className="min-w-0">
        <h2 className="sg-heading sg-about-title" id="about-heading">{a.title[0]}<br />{a.title[1]}</h2>
        <p className="sg-about-text">{a.text}</p>
        <dl className="sg-about-facts">
          {a.facts.map((f) => (
            <div key={f.value}><dt className="sr-only">{f.label}</dt><dd><strong>{f.value}</strong><span>{f.label}</span></dd></div>
          ))}
        </dl>
        <div className="mt-8">
          <Link href={`/${locale}/about`} className="sg-button sg-button--secondary">
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

/** «Наступний сильний проєкт — ваш?»: the big line opens the brief, the links write directly. */
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
        <p>{c.text[0]}<br />{c.text[1]}</p>
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
