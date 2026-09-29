import { SectionTabs } from "@/shared/ui/section-tabs";
import { t } from "@/shared/i18n/ru";

/** Cards | Matrix switch for the competitors section. */
export function CompetitorTabs({ base, current }: { base: string; current: "cards" | "matrix" }) {
  return (
    <SectionTabs label={t.competitors.title} current={current} tabs={[
      { key: "cards", href: `${base}/competitors`, label: t.competitors.tabs.cards },
      { key: "matrix", href: `${base}/competitors/matrix`, label: t.competitors.tabs.matrix },
    ]} />
  );
}
