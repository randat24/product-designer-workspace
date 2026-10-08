import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { dict, type Locale } from "@/site/content";
import { container } from "@/site/ui";

/** SIGNAL hero copy (uk, en). Kept here while the redesign is on trial, so content.ts stays untouched. */
const HERO = {
  uk: {
    title: ["Дизайн,", "що має", "значення."],
    intro: "Допомагаю перетворювати складні задачі на зрозумілі цифрові продукти. Від першого «чому» до останньої деталі.",
    work: "Дивитися роботи",
    approach: "Мій підхід",
    artTop: "[ from complexity to clarity ]",
    artBottom: "research → structure → form",
    captionTitle: "Кожна лінія має причину.",
    captionText: "Кожне рішення — свій доказ.",
    strip: "Продумані інтерфейси. Цілісний досвід.",
    next: "Далі — роботи ↓",
  },
  en: {
    title: ["Design", "that", "matters."],
    intro: "I help turn complex problems into clear digital products. From the first “why” to the last detail.",
    work: "See the work",
    approach: "My approach",
    artTop: "[ from complexity to clarity ]",
    artBottom: "research → structure → form",
    captionTitle: "Every line has a reason.",
    captionText: "Every decision has its proof.",
    strip: "Considered interfaces. Coherent experience.",
    next: "Next — work ↓",
  },
} as const;

/** Anchor of the work section right under the hero. */
export const WORK_ANCHOR = "selected-work";

export function SignalHero({ locale }: { locale: Locale }) {
  const d = dict(locale);
  const h = HERO[locale];
  const [first, second, last] = h.title;
  return (
    <>
      <section className={`${container} sg-hero`} aria-labelledby="hero-heading">
        <div className="sg-hero-copy">
          <p className="sg-availability">{d.home.available}</p>
          <h1 id="hero-heading">
            <span className="sr-only">{d.name}. </span>
            {first}<br />{second}<br /><em>{last}</em>
          </h1>
          <p className="sg-hero-intro">{h.intro}</p>
          <div className="sg-hero-actions">
            <a href={`#${WORK_ANCHOR}`} className="sg-button sg-button--primary">
              {h.work}<ArrowDownRight aria-hidden className="size-4" />
            </a>
            <Link href={`/${locale}/about`} className="sg-button sg-button--ghost">
              {h.approach}<ArrowUpRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
        <div className="sg-hero-art" aria-hidden="true">
          <span className="sg-art-label sg-art-label--top">{h.artTop.toUpperCase()}</span>
          {/* eslint-disable-next-line @next/next/no-img-element -- static vector drawing, size known */}
          <img className="sg-art-light" src="/signal/signal-light.svg" alt="" width={700} height={650} loading="lazy" decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static vector drawing, size known */}
          <img className="sg-art-dark" src="/signal/signal-dark.svg" alt="" width={700} height={650} loading="lazy" decoding="async" />
          <span className="sg-art-label sg-art-label--bottom">{h.artBottom.toUpperCase()}</span>
          <div className="sg-art-caption">
            <strong>{h.captionTitle}</strong>
            <span>{h.captionText}</span>
          </div>
        </div>
      </section>
      <div className={container}>
        <div className="sg-hero-bottom">
          <span>{h.strip}</span>
          <span className="sg-hero-coordinate">{d.location}</span>
          <a href={`#${WORK_ANCHOR}`}>{h.next}</a>
        </div>
      </div>
    </>
  );
}
