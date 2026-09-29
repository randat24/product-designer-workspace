import { ENTITIES, GROUP_COLOR, type EntityType } from "@/shared/entities";
import { cn } from "@/shared/lib/cn";

/** Code + type colour. The building block of trace chains (docs/DESIGN-SYSTEM.md §3). */
export function EntityChip({ type, code, title, className }: { type: EntityType; code: string; title?: string; className?: string }) {
  const def = ENTITIES[type];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[4px] border border-line bg-surface px-1.5 text-caption font-medium tabular-nums",
        className,
      )}
      title={title ? `${def.label}: ${title}` : def.label}
    >
      <span aria-hidden className="size-2 rounded-full" style={{ background: GROUP_COLOR[def.group] }} />
      {code}
      <span className="sr-only">({def.label})</span>
    </span>
  );
}
