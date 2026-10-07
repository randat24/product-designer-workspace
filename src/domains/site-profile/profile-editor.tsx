"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { SaveToast, useAutosave } from "@/shared/ui/autosave";
import { Button, IconButton } from "@/shared/ui/button";
import { Input, Textarea } from "@/shared/ui/field";
import { Section } from "@/shared/ui/form-section";
import type { SiteProfileLocale } from "@/site/site-profile";
import { saveSiteProfile } from "./actions";
import { SITE_LOCALES } from "./locales";

const s = t.siteProfile;
const f = s.fields;

type Locale = (typeof SITE_LOCALES)[number];
export type ProfileDraft = Required<SiteProfileLocale>;

/**
 * «Профіль сайту»: the About page, one tab per language, each saving itself. Both tabs stay mounted, so switching
 * language never drops an unsaved edit.
 */
export function ProfileEditor({ workspaceId, drafts, canEdit }: { workspaceId: string; drafts: Record<Locale, ProfileDraft>; canEdit: boolean }) {
  const [locale, setLocale] = useState<Locale>("uk");
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const id = useId();

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    ev.preventDefault();
    const next: Locale = locale === "uk" ? "en" : "uk";
    setLocale(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={s.localesLabel} className="flex gap-1 self-start rounded-control bg-subtle p-1">
        {SITE_LOCALES.map((l) => (
          <button key={l} ref={(el) => { tabs.current[l] = el; }} type="button" role="tab" id={`${id}-tab-${l}`}
            aria-controls={`${id}-panel-${l}`} aria-selected={locale === l} tabIndex={locale === l ? 0 : -1}
            onClick={() => setLocale(l)} onKeyDown={onKey}
            className={cn("h-8 rounded-control px-3 text-meta font-semibold text-fg-secondary", locale === l && "bg-surface text-fg shadow-sm")}>
            {s.locales[l]}
          </button>
        ))}
      </div>
      {SITE_LOCALES.map((l) => (
        <div key={l} role="tabpanel" id={`${id}-panel-${l}`} aria-labelledby={`${id}-tab-${l}`} hidden={locale !== l}>
          <LocaleEditor workspaceId={workspaceId} locale={l} initial={drafts[l]} canEdit={canEdit} active={locale === l} />
        </div>
      ))}
    </div>
  );
}

/** One field of a repeated row: a line, or a box where each line is one list item. */
type FieldDef<T> = { key: keyof T & string; label: string; max: number; kind?: "line" | "lines" | "text"; wide?: boolean };

function LocaleEditor({ workspaceId, locale, initial, canEdit, active }: {
  workspaceId: string; locale: Locale; initial: ProfileDraft; canEdit: boolean; active: boolean;
}) {
  const { value: d, update, status, error } = useAutosave(initial, (v) => saveSiteProfile(workspaceId, locale, v), canEdit);
  const p = `${locale}-`;
  const ro = !canEdit;

  return (
    <div className="flex flex-col gap-8">
      {/* Only the visible language reports its status; the other tab saves silently in the background. */}
      {active && <SaveToast id={`profile-status-${locale}`} status={status} error={error?.message} readOnly={ro} />}

      <Section id={`${p}summary`} title={s.sections.summary}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${p}summary-text`} className="text-meta font-semibold text-fg-secondary">{f.summary}</label>
          <Textarea id={`${p}summary-text`} value={d.summary} readOnly={ro} maxLength={5000} rows={3}
            onChange={(ev) => update({ summary: ev.target.value })} className="resize-y [field-sizing:content]" />
        </div>
      </Section>

      <Rows id={`${p}facts`} kind="facts" hint={s.hints.facts} items={d.facts} max={6} readOnly={ro}
        blank={{ value: "", label: "" }} onChange={(facts) => update({ facts })}
        fields={[{ key: "value", label: f.value, max: 20 }, { key: "label", label: f.label, max: 300, wide: true }]} />

      <Rows id={`${p}jobs`} kind="jobs" hint={s.hints.jobs} items={d.jobs} max={20} readOnly={ro}
        blank={{ period: "", title: "", place: "", points: [], details: [] }} onChange={(jobs) => update({ jobs })}
        fields={[
          { key: "period", label: f.period, max: 300 }, { key: "title", label: f.title, max: 300 }, { key: "place", label: f.place, max: 300 },
          { key: "points", label: f.points, max: 300, kind: "lines", wide: true }, { key: "details", label: f.details, max: 5000, kind: "lines", wide: true },
        ]} />

      <Rows id={`${p}skills`} kind="skills" items={d.skills} max={12} readOnly={ro}
        blank={{ group: "", items: "" }} onChange={(skills) => update({ skills })}
        fields={[{ key: "group", label: f.group, max: 300 }, { key: "items", label: f.items, max: 5000, kind: "text", wide: true }]} />

      <Section id={`${p}availability`} title={s.sections.availability}>
        <LinesField id={`${p}availability-text`} label={`${f.availability}. ${s.hints.lines}`} value={d.availability} max={300} readOnly={ro}
          onChange={(availability) => update({ availability })} />
      </Section>

      <Rows id={`${p}education`} kind="education" items={d.education} max={12} readOnly={ro}
        blank={{ title: "", place: "", year: "" }} onChange={(education) => update({ education })}
        fields={[
          { key: "title", label: f.eduTitle, max: 300, wide: true }, { key: "place", label: f.eduPlace, max: 300 }, { key: "year", label: f.year, max: 300 },
          { key: "certificate", label: f.certificate, max: 500, wide: true },
        ]} />

      <Rows id={`${p}languages`} kind="languages" items={d.languages} max={10} readOnly={ro}
        blank={{ name: "", level: "" }} onChange={(languages) => update({ languages })}
        fields={[{ key: "name", label: f.name, max: 300 }, { key: "level", label: f.level, max: 300 }]} />
    </div>
  );
}

/** A list of items with the same fields: add, remove, reorder. */
function Rows<T extends Record<string, unknown>>({ id, kind, hint, items, fields, blank, max, readOnly, onChange }: {
  id: string;
  kind: keyof typeof s.item;
  hint?: string;
  items: T[];
  fields: FieldDef<T>[];
  blank: T;
  max: number;
  readOnly: boolean;
  onChange: (items: T[]) => void;
}) {
  const name = (i: number) => `${s.item[kind]} ${i + 1}`;
  const set = (i: number, patch: Partial<T>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, by: number) => {
    const next = [...items];
    const [moved] = next.splice(i, 1);
    if (moved) next.splice(i + by, 0, moved);
    onChange(next);
  };
  return (
    <section aria-labelledby={`${id}-h`} className="flex flex-col gap-3">
      <h2 id={`${id}-h`} className="text-heading font-semibold">{s.sections[kind]}</h2>
      {hint && <p className="max-w-prose text-meta text-fg-secondary">{hint}</p>}
      {items.length > 0 && (
        <ol className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-meta font-semibold text-fg-secondary">{name(i)}</span>
                {!readOnly && (
                  <div className="flex gap-1">
                    <IconButton size="sm" label={`${s.moveUp}: ${name(i)}`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconButton>
                    <IconButton size="sm" label={`${s.moveDown}: ${name(i)}`} disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconButton>
                    <IconButton size="sm" tone="danger" label={`${s.remove}: ${name(i)}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><X className="size-4" /></IconButton>
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {fields.map((fd) => {
                  const fid = `${id}-${i}-${fd.key}`;
                  const v = item[fd.key];
                  return (
                    <div key={fd.key} className={cn(fd.wide && "sm:col-span-2", fd.kind && fd.kind !== "line" && "sm:col-span-3")}>
                      {fd.kind === "lines" ? (
                        <LinesField id={fid} label={fd.label} value={(v as string[] | undefined) ?? []} max={fd.max} readOnly={readOnly}
                          onChange={(x) => set(i, { [fd.key]: x } as Partial<T>)} />
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={fid} className="text-meta font-semibold text-fg-secondary">{fd.label}</label>
                          {fd.kind === "text" ? (
                            <Textarea id={fid} value={(v as string | undefined) ?? ""} readOnly={readOnly} maxLength={fd.max} rows={2}
                              onChange={(ev) => set(i, { [fd.key]: ev.target.value } as Partial<T>)} className="resize-y [field-sizing:content]" />
                          ) : (
                            <Input id={fid} value={(v as string | undefined) ?? ""} readOnly={readOnly} maxLength={fd.max}
                              onChange={(ev) => set(i, { [fd.key]: ev.target.value } as Partial<T>)} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
      {!readOnly && items.length < max && (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => onChange([...items, { ...blank }])}>
          <Plus aria-hidden className="size-4" />{s.add[kind]}
        </Button>
      )}
    </section>
  );
}

/** A list typed one item per line. Empty lines stay while typing; the site skips them. */
function LinesField({ id, label, value, max, readOnly, onChange }: {
  id: string; label: string; value: string[]; max: number; readOnly: boolean; onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-meta font-semibold text-fg-secondary">{label}</label>
      <Textarea id={id} value={value.join("\n")} readOnly={readOnly} rows={3}
        onChange={(ev) => onChange(ev.target.value.split("\n").slice(0, 30).map((x) => x.slice(0, max)))}
        className="resize-y [field-sizing:content]" />
    </div>
  );
}
