import { ArrowDownRight } from "lucide-react";
import { button } from "./ui";
import { dict, type Case, type Locale } from "@/site/content";
import { container } from "@/site/ui";
import { HeroTrace } from "./hero-trace";

/** SIGNAL hero copy (uk, en). Kept here while the redesign is on trial, so content.ts stays untouched. */
const HERO = {
  uk: {
    title: ["Дизайн,", "де кожне рішення", "має доказ."],
    intro: "Проєктую вебсервіси й мобільні застосунки: від розмов з користувачами до макетів, за якими розробникам не треба нічого вгадувати.",
    work: "Дивитися роботи",
    approach: "Мій підхід",
    strip: "Продуктовий дизайн · UX · дизайн-системи",
    next: "Далі — роботи ↓",
  },
  en: {
    title: ["Design", "where every decision", "has proof."],
    intro: "I design web services and mobile apps: from talking to users to mockups developers can build without guessing.",
    work: "See the work",
    approach: "My approach",
    strip: "Product design · UX · design systems",
    next: "Next — work ↓",
  },
} as const;

/** Anchor of the work section right under the hero. */
export const WORK_ANCHOR = "selected-work";
/** Anchor of «Мій підхід», the process section further down the home page. */
export const APPROACH_ANCHOR = "approach";

/** `traceCase`: the published case the drawing's chain comes from (src/site/signal/hero-trace.tsx). */
export function SignalHero({ locale, traceCase }: { locale: Locale; traceCase: Case | undefined }) {
  const d = dict(locale);
  const h = HERO[locale];
  const [first, second, last] = h.title;
  return (
    <div className="sg-first-screen">
      <section className={`${container} sg-hero`} aria-labelledby="hero-heading">
        <div className="sg-hero-copy">
          <p className="sg-availability">{d.home.available}</p>
          <h1 id="hero-heading">
            <span className="sr-only">{d.name}. </span>
            {first}<br />{second}<br /><em>{last}</em>
          </h1>
          <p className="sg-hero-intro">{h.intro}</p>
          <div className="sg-hero-actions">
            <a href={`#${WORK_ANCHOR}`} className={button({ variant: "primary" })}>
              {h.work}<ArrowDownRight aria-hidden className="size-4" />
            </a>
            <a href={`#${APPROACH_ANCHOR}`} className={button({ variant: "ghost" })}>
              {h.approach}<ArrowDownRight aria-hidden className="size-4" />
            </a>
          </div>
        </div>
        <div className="sg-hero-stage">
          <HeroTrace locale={locale} item={traceCase} />
        </div>
      </section>
      <div className={container}>
        <div className="sg-hero-bottom">
          <span>{h.strip}</span>
          <span className="sg-hero-coordinate">{d.location}</span>
          <a href={`#${WORK_ANCHOR}`}>{h.next}</a>
        </div>
      </div>
    </div>
  );
}
