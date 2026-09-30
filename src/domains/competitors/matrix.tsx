"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ConfirmIconButton } from "@/shared/ui/confirm-delete";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { addFeature, addUxTemplate, deleteFeature, setCellNote, setFeatureValue, updateFeature } from "./actions";
import { nextFeatureValue, type FeatureValue, type UxTemplate } from "./schema";
import type { CellNote, MatrixKind } from "./queries";

const m = t.competitors.matrix;
const ux = t.competitors.ux;
const STICKY = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)"];
const MARK: Record<FeatureValue, string> = { yes: "✓", partial: "◐", no: "✕", unknown: "?" };
// Cell colours as in a competitor-analysis spreadsheet: green / yellow / red.
const CELL_BG: Record<FeatureValue, string> = {
  yes: "color-mix(in srgb, var(--success) 12%, var(--surface))",
  partial: "color-mix(in srgb, var(--s3) 45%, var(--surface))",
  no: "color-mix(in srgb, var(--danger) 12%, var(--surface))",
  unknown: "var(--surface)",
};
const COLUMN_GROUPS = ["own", "direct", "indirect", "substitute"] as const;

type Product = { id: string; code: string; name: string; is_own_product: boolean; kind: string };
type Feature = { id: string; name: string; group_name: string | null };

/**
 * Feature × Product comparison (docs/IA.md: /competitors/matrix) and the same grid for the UX review
 * (Nielsen heuristics / UX laws). Cells cycle their value on click and carry an optional note;
 * a note on a competitor's red cell becomes a design reminder.
 */
export function ComparisonMatrix({ projectId, base, products: rawProducts, features, cells: initialCells, notes: initialNotes, canEdit, kind = "feature" }: {
  projectId: string;
  base: string;
  products: Product[];
  features: Feature[];
  cells: Record<string, FeatureValue>;
  notes: Record<string, CellNote>;
  canEdit: boolean;
  kind?: MatrixKind;
}) {
  const router = useRouter();
  const [cells, setCells] = useState(initialCells);
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState({ name: "", group_name: "" });
  const [pending, startTransition] = useTransition();
  const values = kind === "ux" ? ux.values : m.values;

  // Columns: our product, then direct, indirect and substitute competitors.
  const groupOf = (p: Product) => (p.is_own_product ? "own" : (p.kind as (typeof COLUMN_GROUPS)[number]));
  const products = COLUMN_GROUPS.flatMap((g) => rawProducts.filter((p) => groupOf(p) === g));
  const columnGroups = COLUMN_GROUPS.map((g) => ({ g, n: products.filter((p) => groupOf(p) === g).length })).filter((x) => x.n > 0);

  const cellValue = (f: string, p: string): FeatureValue => cells[`${f}:${p}`] ?? "unknown";

  async function cycle(f: string, p: string) {
    const key = `${f}:${p}`;
    const prev = cellValue(f, p);
    const next = nextFeatureValue(prev);
    setCells((c) => ({ ...c, [key]: next }));
    const res = await setFeatureValue(p, f, next);
    if (!res.ok) {
      setCells((c) => ({ ...c, [key]: prev }));
      setFailed(true);
    } else setFailed(false);
  }

  async function saveNote(f: string, p: string, text: string) {
    const key = `${f}:${p}`;
    const prev = notes[key];
    setEditing(null);
    if ((prev?.note ?? "") === text.trim()) return;
    setNotes((n) => {
      const next = { ...n };
      if (text.trim()) next[key] = { note: text.trim(), done: false }; else delete next[key];
      return next;
    });
    const res = await setCellNote(p, f, text);
    if (!res.ok) {
      setNotes((n) => ({ ...n, ...(prev ? { [key]: prev } : {}) }));
      setFailed(true);
    } else setFailed(false);
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    startTransition(async () => {
      const res = await addFeature(projectId, draft, kind);
      if (res.ok) setDraft((d) => ({ name: "", group_name: d.group_name }));
      router.refresh();
    });
  }

  const rows = useAction();
  const addTemplate = (tpl: UxTemplate) => rows.run(() => addUxTemplate(projectId, tpl));

  // Group rows, keeping first-appearance order of groups.
  const groups: { name: string | null; rows: Feature[] }[] = [];
  for (const f of features) {
    const g = groups.find((x) => x.name === f.group_name) ?? groups[groups.push({ name: f.group_name, rows: [] }) - 1]!;
    g.rows.push(f);
  }
  const score = (p: string) =>
    features.reduce((s, f) => s + ({ yes: 1, partial: 0.5, no: 0, unknown: 0 } as const)[cellValue(f.id, p)], 0);

  if (products.length === 0) {
    return <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{m.noCompetitors}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-meta text-fg-secondary">{m.redHint}</p>
      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th aria-hidden className="sticky left-0 z-[1] border-r border-line bg-surface" />
              {columnGroups.map(({ g, n }) => (
                <th key={g} scope="colgroup" colSpan={n}
                  className="border-b border-l border-line bg-subtle px-2 py-1.5 text-caption font-bold tracking-wide text-fg-secondary uppercase first-of-type:border-l-0">
                  {m.columnGroups[g]}
                </th>
              ))}
              {canEdit && <th aria-hidden className="w-10" />}
            </tr>
            <tr>
              <th scope="col" className="sticky left-0 z-[1] min-w-[170px] sm:min-w-[280px] sm:max-w-[320px] border-r border-b border-line bg-surface p-3 text-left align-bottom text-meta font-bold">
                {kind === "ux" ? ux.criterion : m.feature}
              </th>
              {products.map((p, i) => (
                <th key={p.id} scope="col" className="min-w-[150px] border-b border-line p-2.5 align-bottom" style={{ "--c": STICKY[i % 7] } as React.CSSProperties}>
                  <Link href={`${base}/competitors/${p.code}`}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-chip bg-[var(--c)] px-2.5 pt-3 pb-2 text-center text-on-sticky shadow-[0_6px_10px_-6px_rgba(0,0,0,.35)] transition-transform hover:rotate-0",
                      i % 2 ? "rotate-[.7deg]" : "-rotate-[.6deg]",
                    )}>
                    <span className="text-sm leading-tight font-bold">{p.name}</span>
                    <span className="text-caption font-semibold opacity-70">{p.is_own_product ? t.competitors.ownBadge : p.code}</span>
                  </Link>
                </th>
              ))}
              {canEdit && <th className="w-10 border-b border-line" aria-hidden />}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <MatrixGroup key={g.name ?? ""} name={g.name} showHeader={groups.length > 1 || !!g.name} colSpan={products.length + (canEdit ? 2 : 1)}>
                {g.rows.map((f) => (
                  <tr key={f.id} className="group/row">
                    <th scope="row" className="sticky left-0 z-[1] border-r border-b border-line bg-surface p-1.5 text-left font-semibold">
                      {canEdit ? <FeatureName feature={f} /> : <span className="block px-2 py-1.5">{f.name}</span>}
                    </th>
                    {products.map((p) => {
                      const key = `${f.id}:${p.id}`;
                      const v = cellValue(f.id, p.id);
                      const note = notes[key];
                      const cellName = `${f.name} — ${p.name}`;
                      const reminder = v === "no" && !p.is_own_product;
                      return (
                        <td key={p.id} className="group/cell relative border-b border-l border-line p-1.5 text-center align-top" style={{ background: CELL_BG[v] }}>
                          <button type="button" disabled={!canEdit} onClick={() => cycle(f.id, p.id)}
                            aria-label={`${cellName}: ${values[v]}`} title={`${cellName}: ${values[v]}`}
                            className={cn(
                              "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-control px-2 text-meta font-semibold disabled:cursor-default",
                              canEdit && "hover:bg-surface/60",
                              v === "yes" && "text-success",
                              v === "no" && "text-danger",
                              v === "unknown" && "text-fg-secondary",
                            )}>
                            <span aria-hidden className="text-base leading-none">{MARK[v]}</span>
                            <span aria-hidden>{values[v]}</span>
                          </button>
                          {editing === key ? (
                            <NoteEditor initial={note?.note ?? ""} label={m.editNote(cellName)}
                              placeholder={reminder ? m.reminderPlaceholder : m.notePlaceholder}
                              onSave={(text) => saveNote(f.id, p.id, text)} onCancel={() => setEditing(null)} />
                          ) : note ? (
                            <button type="button" disabled={!canEdit} onClick={() => setEditing(key)} aria-label={m.editNote(cellName)}
                              className={cn("mt-1 block w-full rounded-chip px-1.5 py-1 text-left text-caption leading-snug text-fg disabled:cursor-default",
                                canEdit && "hover:bg-surface/70", note.done && "text-fg-secondary line-through")}>
                              {reminder && <span className="mr-1 rounded-chip bg-danger px-1 text-caption font-bold text-white uppercase">{m.reminderBadge}</span>}
                              {note.note}
                            </button>
                          ) : canEdit && (
                            <button type="button" onClick={() => setEditing(key)} aria-label={m.editNote(cellName)}
                              className="absolute top-1 right-1 grid size-6 place-items-center rounded-chip text-caption text-fg-secondary [@media(hover:hover)]:opacity-0 group-hover/cell:opacity-100 focus:opacity-100 hover:bg-surface/80 hover:text-fg">
                              <span aria-hidden>✎</span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                    {canEdit && (
                      <td className="border-b border-line p-1 text-center">
                        <ConfirmIconButton label={`${m.deleteFeature}: ${f.name}`} confirm={t.status.confirmDelete}
                          disabled={rows.pending} onConfirm={() => rows.run(() => deleteFeature(f.id))}
                          className="hit grid size-8 place-items-center rounded-control text-fg-secondary [@media(hover:hover)]:opacity-0 group-hover/row:opacity-100 focus:opacity-100 hover:bg-subtle hover:text-danger" />
                      </td>
                    )}
                  </tr>
                ))}
              </MatrixGroup>
            ))}
            {features.length > 0 && (
              <tr>
                <th scope="row" className="sticky left-0 z-[1] border-r border-line bg-surface p-3 text-left text-meta font-bold">Итого</th>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center">
                    <span className="display-num text-[22px] tabular-nums">{score(p.id)}</span>
                    <span className="text-caption text-fg-secondary"> / {features.length}</span>
                  </td>
                ))}
                {canEdit && <td />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {features.length === 0 && <p className="text-fg-secondary">{kind === "ux" ? ux.empty : m.empty}</p>}
      {failed && <p role="alert" className="text-meta text-danger">{m.saveFailed}</p>}
      <ActionError error={rows.error} />

      {canEdit && (
        <div className="flex flex-wrap items-end gap-2">
          {kind === "ux" && (
            <>
              <Button type="button" variant="secondary" disabled={pending || rows.pending} onClick={() => addTemplate("nielsen")}>{ux.addNielsen}</Button>
              <Button type="button" variant="secondary" disabled={pending || rows.pending} onClick={() => addTemplate("laws")}>{ux.addLaws}</Button>
              <Button type="button" variant="secondary" disabled={pending || rows.pending} onClick={() => addTemplate("gestalt")}>{ux.addGestalt}</Button>
              <Button type="button" variant="secondary" disabled={pending || rows.pending} onClick={() => addTemplate("memory")}>{ux.addMemory}</Button>
              <Link href="/app/ux-laws" target="_blank" className="inline-flex h-9 items-center px-2 text-sm font-semibold underline underline-offset-4">
                {t.uxLaws.open}
              </Link>
            </>
          )}
          <form onSubmit={add} className="flex flex-wrap items-end gap-2">
            <Input aria-label={kind === "ux" ? ux.criterionPlaceholder : m.newFeature}
              placeholder={kind === "ux" ? ux.criterionPlaceholder : m.featurePlaceholder} value={draft.name} maxLength={200}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-72" />
            <Input aria-label={m.groupPlaceholder} placeholder={m.groupPlaceholder} value={draft.group_name} maxLength={80}
              onChange={(e) => setDraft({ ...draft, group_name: e.target.value })} className="w-44" list={`matrix-groups-${kind}`} />
            <datalist id={`matrix-groups-${kind}`}>
              {groups.filter((g) => g.name).map((g) => <option key={g.name} value={g.name!} />)}
            </datalist>
            <Button type="submit" disabled={pending || !draft.name.trim()}>{m.addFeature}</Button>
          </form>
        </div>
      )}
    </div>
  );
}

function NoteEditor({ initial, label, placeholder, onSave, onCancel }: {
  initial: string; label: string; placeholder: string; onSave: (text: string) => void; onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div className="mt-1 flex flex-col gap-1 text-left">
      <textarea aria-label={label} autoFocus value={text} maxLength={500} rows={3} placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(text); }
        }}
        className="w-full resize-none rounded-chip border border-line bg-surface px-1.5 py-1 text-caption leading-snug focus:border-fg focus:outline-none" />
      <div className="flex gap-1">
        <button type="button" onClick={() => onSave(text)} className="rounded-chip bg-fg px-2 py-0.5 text-caption font-semibold text-canvas">{m.saveNote}</button>
        <button type="button" onClick={onCancel} className="rounded-chip px-2 py-0.5 text-caption font-semibold text-fg-secondary hover:text-fg">{m.cancelNote}</button>
      </div>
    </div>
  );
}

function MatrixGroup({ name, showHeader, colSpan, children }: { name: string | null; showHeader: boolean; colSpan: number; children: React.ReactNode }) {
  return (
    <>
      {showHeader && (
        <tr>
          <th scope="rowgroup" colSpan={colSpan} className="border-b border-line bg-subtle px-3 py-1.5 text-left text-caption font-bold tracking-wide text-fg-secondary uppercase">
            {name ?? m.ungrouped}
          </th>
        </tr>
      )}
      {children}
    </>
  );
}

/** Row title editable in place; saves on blur or Enter. */
function FeatureName({ feature }: { feature: Feature }) {
  const router = useRouter();
  const [name, setName] = useState(feature.name);
  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setName(feature.name);
    if (trimmed === feature.name) return;
    const res = await updateFeature(feature.id, { name: trimmed, group_name: feature.group_name });
    if (!res.ok) setName(feature.name);
    router.refresh();
  };
  return (
    <textarea aria-label={m.feature} value={name} maxLength={200} rows={1} onChange={(e) => setName(e.target.value)} onBlur={save}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
      className="block w-full resize-none rounded-control border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug font-semibold [field-sizing:content] hover:border-line focus:border-fg focus:bg-surface focus:outline-none" />
  );
}
