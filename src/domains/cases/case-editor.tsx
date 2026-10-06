"use client";

import { ArrowDown, ArrowUp, ImagePlus, Plus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { SaveToast, useAutosave } from "@/shared/ui/autosave";
import { Button, IconButton } from "@/shared/ui/button";
import { FieldError, Input, Select, Textarea } from "@/shared/ui/field";
import { Section } from "@/shared/ui/form-section";
import { saveCaseDraft } from "./actions";
import { CASE_LOCALES, CASE_MEDIA_MAX_BYTES, CASE_MEDIA_MIME, type CaseDraft, type CaseImage, type CaseLocale } from "./schema";

const e = t.caseEditor;
const f = e.fields;
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

/**
 * The case page of a project, edited in place: one tab per language, each saving itself.
 * Both tabs stay mounted, so switching language never drops an unsaved edit.
 */
export function CaseEditor({ caseId, projectId, drafts, canEdit, hasStory }: {
  caseId: string;
  projectId: string;
  drafts: Record<CaseLocale, CaseDraft>;
  canEdit: boolean;
  /** The site shows the full story built from the project instead of the sections. */
  hasStory: boolean;
}) {
  const [locale, setLocale] = useState<CaseLocale>("uk");
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const id = useId();

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    ev.preventDefault();
    const next: CaseLocale = locale === "uk" ? "en" : "uk";
    setLocale(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={e.localesLabel} className="flex gap-1 self-start rounded-control bg-subtle p-1">
        {CASE_LOCALES.map((l) => (
          <button key={l} ref={(el) => { tabs.current[l] = el; }} type="button" role="tab" id={`${id}-tab-${l}`}
            aria-controls={`${id}-panel-${l}`} aria-selected={locale === l} tabIndex={locale === l ? 0 : -1}
            onClick={() => setLocale(l)} onKeyDown={onKey}
            className={cn("h-8 rounded-control px-3 text-meta font-semibold text-fg-secondary",
              locale === l && "bg-surface text-fg shadow-sm")}>
            {e.locales[l]}
          </button>
        ))}
      </div>
      {CASE_LOCALES.map((l) => (
        <div key={l} role="tabpanel" id={`${id}-panel-${l}`} aria-labelledby={`${id}-tab-${l}`} hidden={locale !== l}>
          <LocaleEditor caseId={caseId} projectId={projectId} locale={l} initial={drafts[l]} canEdit={canEdit}
            hasStory={hasStory} active={locale === l} />
        </div>
      ))}
    </div>
  );
}

function LocaleEditor({ caseId, projectId, locale, initial, canEdit, hasStory, active }: {
  caseId: string; projectId: string; locale: CaseLocale; initial: CaseDraft; canEdit: boolean; hasStory: boolean; active: boolean;
}) {
  const { value: d, update, status, error } = useAutosave(initial, (v) => saveCaseDraft(caseId, locale, v), canEdit);
  // Tags are typed as one line; the list is what gets saved.
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const p = `${locale}-`;
  const ro = !canEdit;
  const invalid = (field: string) => error?.field === field;

  const line = (key: "title" | "role" | "client" | "year", label: string, max: number) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p + key} className="text-meta font-semibold text-fg-secondary">{label}</label>
      <Input id={p + key} value={d[key]} readOnly={ro} maxLength={max} aria-invalid={invalid(key) || undefined}
        aria-describedby={invalid(key) ? `${p + key}-error` : undefined} onChange={(ev) => update({ [key]: ev.target.value })} />
      <FieldError id={p + key} message={invalid(key) ? error?.message : null} />
    </div>
  );

  const setSection = (i: number, patch: Partial<CaseDraft["sections"][number]>) =>
    update({ sections: d.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const moveSection = (i: number, by: number) => {
    const next = [...d.sections];
    const [moved] = next.splice(i, 1);
    if (moved) next.splice(i + by, 0, moved);
    update({ sections: next });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Only the visible language reports its status; the other tab saves silently in the background. */}
      {active && <SaveToast id={`case-status-${locale}`} status={status} error={error?.message} readOnly={ro} />}

      <Section id={`${p}header`} title={e.sections.header}>
        {line("title", f.title, 200)}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${p}summary`} className="text-meta font-semibold text-fg-secondary">{f.summary}</label>
          <Textarea id={`${p}summary`} value={d.summary} readOnly={ro} maxLength={1000} rows={2} placeholder={f.summaryHint}
            onChange={(ev) => update({ summary: ev.target.value })} className="resize-y [field-sizing:content]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {line("role", f.role, 200)}
          {line("client", f.client, 200)}
          {line("year", f.year, 50)}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${p}kind`} className="text-meta font-semibold text-fg-secondary">{f.kind}</label>
            <Select id={`${p}kind`} value={d.kind} disabled={ro} onChange={(ev) => update({ kind: ev.target.value as CaseDraft["kind"] })}>
              {(["real", "concept"] as const).map((k) => <option key={k} value={k}>{f.kinds[k]}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${p}liveUrl`} className="text-meta font-semibold text-fg-secondary">{f.liveUrl}</label>
          <Input id={`${p}liveUrl`} type="url" inputMode="url" placeholder="https://" value={d.liveUrl} readOnly={ro} maxLength={2000}
            aria-invalid={invalid("liveUrl") || undefined} aria-describedby={invalid("liveUrl") ? `${p}liveUrl-error` : undefined}
            onChange={(ev) => update({ liveUrl: ev.target.value.trim() })} />
          <FieldError id={`${p}liveUrl`} message={invalid("liveUrl") ? error?.message : null} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${p}tags`} className="text-meta font-semibold text-fg-secondary">{f.tags}</label>
          <Input id={`${p}tags`} value={tagsText} readOnly={ro} maxLength={400} placeholder={f.tagsHint}
            onChange={(ev) => {
              setTagsText(ev.target.value);
              update({ tags: ev.target.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12) });
            }} />
        </div>
      </Section>

      <Section id={`${p}cover`} title={e.sections.cover}>
        <ImageField projectId={projectId} id={`${p}cover-image`} value={d.cover} readOnly={ro} onChange={(cover) => update({ cover })} />
      </Section>

      <Section id={`${p}metrics`} title={e.sections.metrics}>
        {d.metrics.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {d.metrics.map((m, i) => (
              <li key={i} className="flex items-start gap-1">
                <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_3fr]">
                  <Input aria-label={`${f.metricValue} ${i + 1}`} placeholder={f.metricValue} value={m.value} readOnly={ro} maxLength={40}
                    onChange={(ev) => update({ metrics: d.metrics.map((x, j) => (j === i ? { ...x, value: ev.target.value } : x)) })} />
                  <Input aria-label={`${f.metricLabel} ${i + 1}`} placeholder={f.metricLabel} value={m.label} readOnly={ro} maxLength={200}
                    onChange={(ev) => update({ metrics: d.metrics.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)) })} />
                </div>
                {!ro && (
                  <IconButton tone="danger" label={`${f.remove}: ${f.metricValue} ${i + 1}`}
                    onClick={() => update({ metrics: d.metrics.filter((_, j) => j !== i) })}><X className="size-4" /></IconButton>
                )}
              </li>
            ))}
          </ul>
        )}
        {!ro && d.metrics.length < 8 && (
          <Button variant="secondary" size="sm" className="self-start"
            onClick={() => update({ metrics: [...d.metrics, { value: "", label: "" }] })}>
            <Plus aria-hidden className="size-4" />{f.addMetric}
          </Button>
        )}
      </Section>

      <section aria-labelledby={`${p}sections-h`} className="flex flex-col gap-3">
        <h2 id={`${p}sections-h`} className="text-heading font-semibold">{e.sections.body}</h2>
        {hasStory && <p className="max-w-prose text-meta text-fg-secondary">{e.storyNote}</p>}
        <ol className="flex flex-col gap-4">
          {d.sections.map((s, i) => (
            <li key={i} className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-meta font-semibold text-fg-secondary">{f.section(i + 1)}</span>
                {!ro && (
                  <div className="flex gap-1">
                    <IconButton size="sm" label={`${f.moveUp}: ${f.section(i + 1)}`} disabled={i === 0} onClick={() => moveSection(i, -1)}>
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton size="sm" label={`${f.moveDown}: ${f.section(i + 1)}`} disabled={i === d.sections.length - 1} onClick={() => moveSection(i, 1)}>
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton size="sm" tone="danger" label={`${f.removeSection}: ${f.section(i + 1)}`}
                      onClick={() => update({ sections: d.sections.filter((_, j) => j !== i) })}>
                      <X className="size-4" />
                    </IconButton>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${p}s${i}-title`} className="text-meta font-semibold text-fg-secondary">{f.sectionTitle}</label>
                <Input id={`${p}s${i}-title`} value={s.title} readOnly={ro} maxLength={200} onChange={(ev) => setSection(i, { title: ev.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${p}s${i}-body`} className="text-meta font-semibold text-fg-secondary">{f.sectionBody}</label>
                <Textarea id={`${p}s${i}-body`} value={s.body} readOnly={ro} maxLength={10000} rows={4}
                  aria-describedby={`${p}s${i}-body-hint`} onChange={(ev) => setSection(i, { body: ev.target.value })}
                  className="min-h-28 resize-y [field-sizing:content]" />
                <p id={`${p}s${i}-body-hint`} className="text-caption text-fg-secondary">{f.sectionBodyHint}</p>
              </div>
              <ImageField projectId={projectId} id={`${p}s${i}-image`} value={s.image} readOnly={ro} onChange={(image) => setSection(i, { image })} />
            </li>
          ))}
        </ol>
        {!ro && d.sections.length < 40 && (
          <Button variant="secondary" className="self-start"
            onClick={() => update({ sections: [...d.sections, { title: "", body: "", image: null }] })}>
            <Plus aria-hidden className="size-4" />{f.addSection}
          </Button>
        )}
      </section>
    </div>
  );
}

/** Size of a picture before it is uploaded: the site reserves its space, so the page does not jump. */
async function imageSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

/**
 * One picture of the case. The browser uploads straight to the public `case-media` bucket
 * (row-level security checks the project from the path); the editor keeps its address, size and description.
 */
function ImageField({ projectId, id, value, readOnly, onChange }: {
  projectId: string; id: string; value: CaseImage | null; readOnly: boolean; onChange: (v: CaseImage | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setFailed(null);
    if (!(CASE_MEDIA_MIME as readonly string[]).includes(file.type) || file.size > CASE_MEDIA_MAX_BYTES) {
      setFailed(e.image.failed(file.name));
      return;
    }
    setBusy(true);
    try {
      const { width, height } = await imageSize(file);
      const { createBrowserSupabase } = await import("@/shared/lib/supabase/browser");
      const storage = createBrowserSupabase().storage.from("case-media");
      const path = `${projectId}/case/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) throw error;
      onChange({ src: storage.getPublicUrl(path).data.publicUrl, alt: value?.alt ?? "", width, height });
    } catch {
      setFailed(e.image.failed(file.name));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- public Storage or built-in case image */}
          <img src={value.src} alt="" width={value.width} height={value.height} loading="lazy"
            className="h-auto w-full rounded-control border border-line bg-subtle sm:w-56" />
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor={`${id}-alt`} className="text-meta font-semibold text-fg-secondary">{e.image.alt}</label>
            <Input id={`${id}-alt`} value={value.alt} readOnly={readOnly} maxLength={300} placeholder={e.image.altHint}
              onChange={(ev) => onChange({ ...value, alt: ev.target.value })} />
            {!readOnly && (
              <div className="mt-1 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
                  {busy ? e.image.uploading : e.image.replace}
                </Button>
                <Button variant="danger" size="sm" disabled={busy} onClick={() => onChange(null)}>{e.image.remove}</Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        !readOnly && (
          <Button variant="secondary" size="sm" className="self-start" disabled={busy} onClick={() => input.current?.click()}>
            <ImagePlus aria-hidden className="size-4" />{busy ? e.image.uploading : e.image.add}
          </Button>
        )
      )}
      {!readOnly && (
        <>
          <input ref={input} id={id} type="file" accept={CASE_MEDIA_MIME.join(",")} hidden
            onChange={(ev) => { upload(ev.target.files?.[0]); ev.target.value = ""; }} />
          <p className="text-caption text-fg-secondary">{e.image.hint}</p>
        </>
      )}
      {failed && <p role="alert" className="text-meta text-danger">{failed}</p>}
    </div>
  );
}
