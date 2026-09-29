"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { addFeature, deleteFeature, setFeatureValue, updateFeature } from "./actions";
import { nextFeatureValue, type FeatureValue } from "./schema";

const m = t.competitors.matrix;
const STICKY = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)"];
const MARK: Record<FeatureValue, string> = { yes: "✓", partial: "◐", no: "✕", unknown: "?" };

type Product = { id: string; code: string; name: string; is_own_product: boolean };
type Feature = { id: string; name: string; group_name: string | null };

/** Feature × Product comparison (docs/IA.md: /competitors/matrix). Cells save optimistically. */
export function ComparisonMatrix({ projectId, base, products, features, cells: initialCells, canEdit }: {
  projectId: string;
  base: string;
  products: Product[];
  features: Feature[];
  cells: Record<string, FeatureValue>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [cells, setCells] = useState(initialCells);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState({ name: "", group_name: "" });
  const [pending, startTransition] = useTransition();

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

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    startTransition(async () => {
      const res = await addFeature(projectId, draft);
      if (res.ok) setDraft((d) => ({ name: "", group_name: d.group_name }));
      router.refresh();
    });
  }

  // Group rows, keeping first-appearance order of groups.
  const groups: { name: string | null; rows: Feature[] }[] = [];
  for (const f of features) {
    const g = groups.find((x) => x.name === f.group_name) ?? groups[groups.push({ name: f.group_name, rows: [] }) - 1]!;
    g.rows.push(f);
  }
  const score = (p: string) =>
    features.reduce((s, f) => s + ({ yes: 1, partial: 0.5, no: 0, unknown: 0 } as const)[cellValue(f.id, p)], 0);

  if (products.length === 0) {
    return <p className="rounded-[14px] border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{m.noCompetitors}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-[1] min-w-[150px] sm:min-w-[220px] border-r border-b border-line bg-surface p-3 text-left align-bottom text-[13px] font-bold">
                {m.feature}
              </th>
              {products.map((p, i) => (
                <th key={p.id} scope="col" className="min-w-[132px] border-b border-line p-2.5 align-bottom" style={{ "--c": STICKY[i % 7] } as React.CSSProperties}>
                  <Link href={`${base}/competitors/${p.code}`}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-[3px] bg-[var(--c)] px-2.5 pt-3 pb-2 text-center text-on-sticky shadow-[0_6px_10px_-6px_rgba(0,0,0,.35)] transition-transform hover:rotate-0",
                      i % 2 ? "rotate-[.7deg]" : "-rotate-[.6deg]",
                    )}>
                    <span className="text-[14px] leading-tight font-bold">{p.name}</span>
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
                    {products.map((p, i) => {
                      const v = cellValue(f.id, p.id);
                      const label = `${f.name} — ${p.name}: ${m.values[v]}`;
                      return (
                        <td key={p.id} className="border-b border-line p-1.5 text-center"
                          style={{ background: `color-mix(in srgb, ${STICKY[i % 7]} 16%, var(--surface))` }}>
                          <button type="button" disabled={!canEdit} onClick={() => cycle(f.id, p.id)} aria-label={label} title={label}
                            className={cn(
                              "inline-flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold disabled:cursor-default",
                              canEdit && "hover:bg-surface/70",
                              v === "yes" && "text-success",
                              v === "no" && "text-danger",
                              v === "unknown" && "text-fg-secondary/70",
                            )}>
                            <span aria-hidden className="text-base leading-none">{MARK[v]}</span>
                            <span aria-hidden>{m.values[v]}</span>
                          </button>
                        </td>
                      );
                    })}
                    {canEdit && (
                      <td className="border-b border-line p-1 text-center">
                        <button type="button" aria-label={`${m.deleteFeature}: ${f.name}`}
                          onClick={() => startTransition(async () => { await deleteFeature(f.id); router.refresh(); })}
                          className="grid size-8 place-items-center rounded-[7px] text-fg-secondary opacity-0 group-hover/row:opacity-100 focus:opacity-100 hover:bg-subtle hover:text-danger">
                          <span aria-hidden>×</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </MatrixGroup>
            ))}
            {features.length > 0 && (
              <tr>
                <th scope="row" className="sticky left-0 z-[1] border-r border-line bg-surface p-3 text-left text-[13px] font-bold">Итого</th>
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

      {features.length === 0 && <p className="text-fg-secondary">{m.empty}</p>}
      {failed && <p role="alert" className="text-[13px] text-danger">{m.saveFailed}</p>}

      {canEdit && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <Input aria-label={m.newFeature} placeholder={m.featurePlaceholder} value={draft.name} maxLength={200}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-72" />
          <Input aria-label={m.groupPlaceholder} placeholder={m.groupPlaceholder} value={draft.group_name} maxLength={80}
            onChange={(e) => setDraft({ ...draft, group_name: e.target.value })} className="w-44" list="matrix-groups" />
          <datalist id="matrix-groups">
            {groups.filter((g) => g.name).map((g) => <option key={g.name} value={g.name!} />)}
          </datalist>
          <Button type="submit" disabled={pending || !draft.name.trim()}>{m.addFeature}</Button>
        </form>
      )}
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
    <Input aria-label={m.feature} value={name} maxLength={200} onChange={(e) => setName(e.target.value)} onBlur={save}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className="h-8 bg-transparent font-semibold" />
  );
}
