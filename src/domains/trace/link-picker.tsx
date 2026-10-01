"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ENTITIES, type EntityType } from "@/shared/entities";
import { EntityChip } from "@/shared/ui/entity-chip";
import { Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { linkEntities, unlinkEntities } from "./actions";
import type { LinkRule, ResolvedEntity } from "./queries";
import { Button, IconButton } from "@/shared/ui/button";

/**
 * "Пов'язати…": pick any entity of an allowed type; the direction and relation come
 * from trace_relation_rules (docs/DESIGN-SYSTEM.md LinkPicker).
 */
export function LinkPicker({ projectId, entity, candidates, upRules, downRules }: {
  projectId: string;
  entity: { type: EntityType; id: string };
  candidates: ResolvedEntity[];
  upRules: LinkRule[];
  downRules: LinkRule[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return candidates
      .filter((c) => !s || `${c.code} ${c.title} ${ENTITIES[c.type].label}`.toLowerCase().includes(s))
      .slice(0, 40);
  }, [candidates, q]);

  const link = (c: ResolvedEntity) => {
    // Prefer "c is a source of this entity"; otherwise "this entity leads to c".
    const up = upRules.find((r) => r.source_type === c.type && r.relation !== "contradicts");
    const down = downRules.find((r) => r.target_type === c.type);
    const rule = up ?? down;
    if (!rule) return;
    startTransition(async () => {
      const res = await linkEntities(up
        ? { projectId, sourceType: c.type, sourceId: c.id, targetType: entity.type, targetId: entity.id, relation: rule.relation }
        : { projectId, sourceType: entity.type, sourceId: entity.id, targetType: c.type, targetId: c.id, relation: rule.relation });
      setError(!res.ok);
      if (res.ok) { setQ(""); router.refresh(); }
    });
  };

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />{t.trace.link}
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.trace.linkPlaceholder} aria-label={t.trace.link}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }} />
      <ul className="max-h-72 overflow-y-auto rounded-control border border-line" aria-busy={pending}>
        {results.length === 0 && <li className="px-3 py-2 text-fg-secondary">{t.palette.empty}</li>}
        {results.map((c) => (
          <li key={`${c.type}:${c.id}`}>
            <button type="button" disabled={pending} onClick={() => link(c)}
              className={cn("flex w-full items-start gap-2 px-2.5 py-1.5 text-left hover:bg-subtle disabled:opacity-50")}>
              <EntityChip type={c.type} code={c.code} />
              <span className="line-clamp-2 text-meta leading-snug">{c.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-meta text-danger">{t.trace.linkFailed}</p>}
      <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>{t.trace.close}</Button>
    </div>
  );
}

export function UnlinkButton({ linkId, label }: { linkId: string; label: string }) {
  const { pending, run, error } = useAction();
  return (
    <span className="relative z-10 flex flex-col items-end">
      <IconButton size="sm" tone="danger" disabled={pending} label={`${t.trace.unlink}: ${label}`}
        onClick={() => run(() => unlinkEntities(linkId))}
        className="size-7 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
        <X className="size-4" />
      </IconButton>
      <ActionError error={error} className="text-caption text-danger" />
    </span>
  );
}
