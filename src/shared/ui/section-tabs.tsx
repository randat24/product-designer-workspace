import Link from "next/link";
import { cn } from "@/shared/lib/cn";

/** Pill tabs between the pages of one section (competitors, research). */
export function SectionTabs({ label, tabs, current }: {
  label: string;
  tabs: { key: string; href: string; label: string }[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-1.5">
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
