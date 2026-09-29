import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

/** Cards | Matrix switch for the competitors section. */
export function CompetitorTabs({ base, current }: { base: string; current: "cards" | "matrix" }) {
  const tabs = [
    { key: "cards", href: `${base}/competitors`, label: t.competitors.tabs.cards },
    { key: "matrix", href: `${base}/competitors/matrix`, label: t.competitors.tabs.matrix },
  ] as const;
  return (
    <nav aria-label={t.competitors.title} className="mb-6 flex gap-1.5">
      {tabs.map((tab) => (
        <Link key={tab.key} href={tab.href} aria-current={tab.key === current ? "page" : undefined}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-1 text-sm font-semibold",
            tab.key === current ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg hover:text-fg",
          )}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
