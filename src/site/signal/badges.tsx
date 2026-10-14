import { AwardSvg } from "@/site/award-icons";
import { dict, type Case, type Locale } from "@/site/content";
import { cn } from "@/shared/lib/cn";
import { sg } from "./ui";

/** «Ветеран» beside the name (hero, About, and the CV in scripts/build-cv.ts), as on the work.ua resume. */
export function VeteranBadge({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span className={cn(sg.badge, "sg-badge--veteran", className)}>
      <AwardSvg icon="veteran-of-war" />
      {dict(locale).veteran}
    </span>
  );
}

/** Real (shipped, client or own running product) or a concept, on work cards and the case page. */
export function KindBadge({ item, locale, className }: { item: Case; locale: Locale; className?: string }) {
  const d = dict(locale);
  const concept = item.kind === "concept";
  return (
    <span className={cn(sg.badge, concept ? "sg-badge--concept" : "sg-badge--real", className)}>
      {concept ? d.project.concept : d.project.real}
    </span>
  );
}
