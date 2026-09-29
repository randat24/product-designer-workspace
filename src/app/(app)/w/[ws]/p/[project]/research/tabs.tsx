import { SectionTabs } from "@/shared/ui/section-tabs";
import { t } from "@/shared/i18n/ru";

export function ResearchTabs({ base, current }: { base: string; current: "overview" | "participants" | "matrix" }) {
  return (
    <SectionTabs label={t.research.title} current={current} tabs={[
      { key: "overview", href: `${base}/research`, label: t.project.overview },
      { key: "participants", href: `${base}/research/participants`, label: t.research.participants.title },
      { key: "matrix", href: `${base}/research/matrix`, label: t.research.matrix.title },
    ]} />
  );
}
