"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { addState, deleteState, saveState } from "./actions";
import { KEY_STATES, STATE_KINDS, STATE_STATUSES, type StateKind, type StateStatus } from "./schema";
import type { ScreenState } from "./queries";
import { IconButton } from "@/shared/ui/button";

const st = t.screens.states;
const STANDARD = ["default", "loading", "empty", "error", "success"];
const STATUS_STYLE: Record<StateStatus, string> = {
  missing: "border-warning bg-warning text-on-status",
  designed: "border-success bg-success text-on-status",
  n_a: "border-fg-secondary bg-fg-secondary text-canvas",
};

/** States of a screen: which are designed, with a note and a Figma link each. */
export function StatesPanel({ screenId, initial, canEdit }: { screenId: string; initial: ScreenState[]; canEdit: boolean }) {
  const [states, setStates] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const missingKey = states.filter((s) => KEY_STATES.includes(s.kind as StateKind) && s.status === "missing").length;
  const addable = STATE_KINDS.filter((k) => !states.some((s) => s.kind === k.value));

  const patch = async (id: string, p: { status?: StateStatus; description?: string; figma_url?: string }) => {
    const before = states;
    setStates((ss) => ss.map((s) => (s.id === id ? {
      ...s, ...(p.status ? { status: p.status } : {}),
      ...(p.description !== undefined ? { description: p.description || null } : {}),
      ...(p.figma_url !== undefined ? { figma_url: p.figma_url || null } : {}),
    } : s)));
    const res = await saveState(id, p);
    if (!res.ok) { setStates(before); setError(res.error); } else setError(null);
  };

  return (
    <section aria-labelledby="states-h" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="states-h" className="text-heading font-semibold">{st.title}</h2>
        <span className={cn("text-meta font-semibold", missingKey ? "text-warning" : "text-success")}>{st.summary(missingKey)}</span>
      </div>
      <p className="text-meta text-fg-secondary">{st.lede}</p>
      {error && <p role="alert" className="text-meta font-semibold text-danger">{error}</p>}
      <ul className="flex flex-col gap-2">
        {states.map((s) => {
          const label = st.kinds[s.kind as StateKind] ?? s.kind;
          return (
            <li key={s.id} className="flex flex-col gap-2.5 rounded-panel border border-line bg-surface p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">
                  {label}
                  {KEY_STATES.includes(s.kind as StateKind) && <span aria-hidden className="ml-1 text-warning">*</span>}
                </span>
                <div className="flex items-center gap-1.5">
                  <div role="group" aria-label={`${label}: ${t.flows.fields.status}`} className="flex flex-wrap gap-1">
                    {STATE_STATUSES.map((o) => (
                      <button key={o.value} type="button" aria-pressed={s.status === o.value} disabled={!canEdit}
                        onClick={() => s.status !== o.value && patch(s.id, { status: o.value })}
                        className={cn("rounded-full border-[1.5px] px-2.5 py-0.5 text-caption font-semibold disabled:cursor-default",
                          s.status === o.value ? STATUS_STYLE[o.value] : "border-line text-fg-secondary hover:border-fg")}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {canEdit && !STANDARD.includes(s.kind) && (
                    <IconButton tone="danger" size="sm" label={`${st.remove}: ${label}`}
                      onClick={async () => {
                        const res = await deleteState(s.id);
                        if (res.ok) setStates((ss) => ss.filter((x) => x.id !== s.id)); else setError(res.error);
                      }}><X className="size-4" /></IconButton>
                  )}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_260px]">
                <BlurInput label={`${st.note}: ${label}`} placeholder={st.note} initial={s.description ?? ""} readOnly={!canEdit} max={1000}
                  onSave={(description) => patch(s.id, { description })} />
                <BlurInput label={`${st.figma}: ${label}`} placeholder="Figma https://…" initial={s.figma_url ?? ""} readOnly={!canEdit} max={2000}
                  type="url" onSave={(figma_url) => patch(s.id, { figma_url })} />
              </div>
            </li>
          );
        })}
      </ul>
      {canEdit && addable.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-meta font-semibold text-fg-secondary">{st.add}:</span>
          {addable.map((k) => (
            <button key={k.value} type="button"
              onClick={async () => {
                const res = await addState(screenId, k.value);
                if (res.ok && res.id) setStates((ss) => [...ss, { id: res.id!, kind: k.value, description: null, figma_url: null, status: "missing" }]);
                else if (!res.ok) setError(res.error);
              }}
              className="rounded-full border-[1.5px] border-dashed border-line px-2.5 py-0.5 text-caption font-semibold text-fg-secondary hover:border-fg hover:text-fg">
              <Plus aria-hidden className="size-4" />{k.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function BlurInput({ label, placeholder, initial, readOnly, max, type, onSave }: {
  label: string; placeholder: string; initial: string; readOnly: boolean; max: number; type?: string; onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Input aria-label={label} placeholder={placeholder} value={value} readOnly={readOnly} maxLength={max} type={type}
      className="h-9 text-meta" onChange={(e) => setValue(e.target.value)} onBlur={() => value !== initial && onSave(value)} />
  );
}
