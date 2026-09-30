"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { addEdgeCase, deleteEdgeCase, saveEdgeCase } from "./actions";
import { EDGE_CASE_STATUSES, type EdgeCaseKind, type EdgeCaseStatus } from "./schema";
import type { EdgeCase } from "./queries";

const ec = t.flows.edgeCases;

const STATUS_STYLE: Record<EdgeCaseStatus, string> = {
  missing: "border-warning bg-warning text-white",
  covered: "border-success bg-success text-white",
  not_applicable: "border-fg-secondary bg-fg-secondary text-canvas",
};

/** Edge-case checklist of a flow: missing / covered / not needed, with the step that handles it. */
export function EdgeCasesPanel({ flowId, initial, nodes, canEdit, onFocusNode }: {
  flowId: string;
  initial: EdgeCase[];
  nodes: { id: string; label: string }[];
  canEdit: boolean;
  onFocusNode: (id: string) => void;
}) {
  const [cases, setCases] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const missing = cases.filter((c) => c.status === "missing").length;

  const patch = async (id: string, p: { status?: EdgeCaseStatus; description?: string; nodeId?: string | null }) => {
    const before = cases;
    setCases((cs) => cs.map((c) => (c.id === id ? {
      ...c,
      ...(p.status ? { status: p.status } : {}),
      ...(p.description !== undefined ? { description: p.description || null } : {}),
      ...(p.nodeId !== undefined ? { nodeId: p.nodeId } : {}),
    } : c)));
    const res = await saveEdgeCase(id, p);
    if (!res.ok) { setCases(before); setError(res.error); } else setError(null);
  };

  return (
    <section aria-labelledby="edge-cases-h" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="edge-cases-h" className="text-heading font-semibold">{ec.title}</h2>
        <span className={cn("text-meta font-semibold", missing ? "text-warning" : "text-success")}>
          {missing ? ec.summary(missing, cases.length) : t.flows.allCovered}
        </span>
      </div>
      <p className="text-meta text-fg-secondary">{ec.lede}</p>
      {error && <p role="alert" className="text-meta font-semibold text-danger">{error}</p>}

      <ul className="flex flex-col gap-2">
        {cases.map((c) => {
          const title = c.kind === "custom" ? (c.description ?? ec.kinds.custom) : ec.kinds[c.kind as EdgeCaseKind];
          const node = nodes.find((n) => n.id === c.nodeId);
          return (
            <li key={c.id} className="flex flex-col gap-2.5 rounded-panel border border-line bg-surface p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{title}</span>
                <div role="group" aria-label={`${title}: ${t.flows.fields.status}`} className="flex flex-wrap gap-1">
                  {EDGE_CASE_STATUSES.map((s) => (
                    <button key={s.value} type="button" aria-pressed={c.status === s.value} disabled={!canEdit}
                      onClick={() => c.status !== s.value && patch(c.id, { status: s.value })}
                      className={cn("rounded-full border-[1.5px] px-2.5 py-0.5 text-caption font-semibold disabled:cursor-default",
                        c.status === s.value ? STATUS_STYLE[s.value] : "border-line text-fg-secondary hover:border-fg")}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
                {c.kind !== "custom" ? (
                  <NoteInput id={c.id} label={`${ec.note}: ${title}`} initial={c.description ?? ""} readOnly={!canEdit}
                    onSave={(description) => patch(c.id, { description })} />
                ) : <span />}
                <div className="flex items-center gap-1.5">
                  <label htmlFor={`node-${c.id}`} className="sr-only">{`${ec.node}: ${title}`}</label>
                  <select id={`node-${c.id}`} value={c.nodeId ?? ""} disabled={!canEdit}
                    onChange={(e) => patch(c.id, { nodeId: e.target.value || null })}
                    className="h-9 min-w-0 flex-1 rounded-control border border-line bg-surface px-2 text-meta disabled:opacity-70">
                    <option value="">{ec.nodeNone}</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                  {node && (
                    <button type="button" onClick={() => onFocusNode(node.id)} aria-label={`${ec.node}: ${node.label}`}
                      className="grid size-9 shrink-0 place-items-center rounded-control border border-line text-fg-secondary hover:border-fg hover:text-fg">
                      <span aria-hidden>◎</span>
                    </button>
                  )}
                  {canEdit && c.kind === "custom" && (
                    <button type="button" aria-label={`${ec.remove}: ${title}`}
                      onClick={async () => {
                        const res = await deleteEdgeCase(c.id);
                        if (res.ok) setCases((cs) => cs.filter((x) => x.id !== c.id)); else setError(res.error);
                      }}
                      className="grid size-9 shrink-0 place-items-center rounded-control text-fg-secondary hover:bg-subtle hover:text-danger">
                      <span aria-hidden>×</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {canEdit && (
        <form className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const description = draft.trim();
            if (!description) return;
            const res = await addEdgeCase(flowId, description);
            if (!res.ok || !res.id) { setError(res.ok ? t.autosave.failed : res.error); return; }
            setCases((cs) => [...cs, { id: res.id!, kind: "custom", description, status: "missing", nodeId: null }]);
            setDraft("");
          }}>
          <Input aria-label={ec.addCustom} value={draft} maxLength={500} placeholder={ec.customPlaceholder}
            onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1" />
          <Button type="submit" variant="secondary" disabled={!draft.trim()}>{ec.addCustom}</Button>
        </form>
      )}
    </section>
  );
}

function NoteInput({ id, label, initial, readOnly, onSave }: {
  id: string; label: string; initial: string; readOnly: boolean; onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor={`note-${id}`} className="sr-only">{label}</label>
      <Input id={`note-${id}`} value={value} readOnly={readOnly} maxLength={500} placeholder={ec.note}
        onChange={(e) => setValue(e.target.value)} onBlur={() => value !== initial && onSave(value)} className="h-9 text-meta" />
    </>
  );
}
