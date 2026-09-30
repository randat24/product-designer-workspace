"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ENTITIES, type EntityType } from "@/shared/entities";
import { EntityChip } from "@/shared/ui/entity-chip";
import { Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { linkEntities, unlinkEntities } from "./actions";
import type { LinkRule, ResolvedEntity } from "./queries";

/**
 * "Связать…": pick any entity of an allowed type; the direction and relation come
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
      <button type="button" onClick={() => setOpen(true)}
        className="self-start rounded-control border-[1.5px] border-fg px-3 py-1.5 text-meta font-semibold hover:bg-subtle">
        + {t.trace.link}
      </button>
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
      <button type="button" onClick={() => setOpen(false)} className="self-start text-meta font-semibold text-fg-secondary hover:text-fg">
        {t.trace.close}
      </button>
    </div>
  );
}

export function UnlinkButton({ linkId, label }: { linkId: string; label: string }) {
  const { pending, run, error } = useAction();
  return (
    <>
    <ActionError error={error} className="text-caption text-danger" />
    <button type="button" disabled={pending} aria-label={`${t.trace.unlink}: ${label}`}
      onClick={() => run(() => unlinkEntities(linkId))}
      className="grid size-7 shrink-0 place-items-center rounded-chip text-fg-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-subtle hover:text-danger">
      <span aria-hidden>×</span>
    </button>
    </>
  );
}
