import { SectionTabs } from "@/shared/ui/section-tabs";
import { t } from "@/shared/i18n/uk";

/** Cards | Feature matrix | UX review switch for the competitors section. */
export function CompetitorTabs({ base, current }: { base: string; current: "cards" | "matrix" | "ux" }) {
  return (
    <SectionTabs label={t.competitors.title} current={current} tabs={[
      { key: "cards", href: `${base}/competitors`, label: t.competitors.tabs.cards },
      { key: "matrix", href: `${base}/competitors/matrix`, label: t.competitors.tabs.matrix },
      { key: "ux", href: `${base}/competitors/ux`, label: t.competitors.tabs.ux },
    ]} />
  );
}
