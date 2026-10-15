"use client";

import { useId, useState } from "react";
import { ImageField } from "@/domains/cases/client";
import { t } from "@/shared/i18n/uk";
import { SaveToast, useAutosave } from "@/shared/ui/autosave";
import { Button } from "@/shared/ui/button";
import { Input, Select, Textarea } from "@/shared/ui/field";
import { Section } from "@/shared/ui/form-section";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { saveNote, setNoteStatus } from "./actions";
import { NOTE_MAX, NOTE_TAGS_MAX, normalizeTag, type NoteInput } from "./schema";

const n = t.notes;
const f = n.fields;

export type NoteDraft = { body_uk: string; body_en: string; image: NoteInput["image"]; tags: string[]; parent_id: string | null };

/** One note: its text in both languages, picture, tags and the note it continues. Saves itself. */
export function NoteEditor({ noteId, workspaceId, initial, parents }: {
  noteId: string;
  workspaceId: string;
  initial: NoteDraft;
  /** Notes it can continue: the other notes of the workspace, newest first. */
  parents: { id: string; number: number; excerpt: string }[];
}) {
  const id = useId();
  const { value: d, update, status, error } = useAutosave(initial, (v) => saveNote(noteId, v), true);
  // Tags are typed as one line; the saved list is what the line means once it is normalized.
  const [tagsLine, setTagsLine] = useState(initial.tags.join(", "));
  const [showEn, setShowEn] = useState(!!initial.body_en);

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="note-status" status={status} error={error?.message} readOnly={false} />
      <Section id={`${id}-text`} title={n.sections.text}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-uk`} className="text-meta font-semibold text-fg-secondary">{f.body_uk}</label>
          <Textarea id={`${id}-uk`} value={d.body_uk} maxLength={NOTE_MAX} rows={5}
            onChange={(e) => update({ body_uk: e.target.value })} className="resize-y [field-sizing:content]" />
          <span className="self-end text-caption text-fg-secondary tabular-nums">{n.count(d.body_uk.length, NOTE_MAX)}</span>
        </div>
        <details open={showEn} onToggle={(e) => setShowEn(e.currentTarget.open)} className="flex flex-col gap-1.5">
          <summary className="cursor-pointer text-meta font-semibold text-fg-secondary">{f.body_en}</summary>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <p id={`${id}-en-hint`} className="text-caption text-fg-secondary">{f.enHint}</p>
            <Textarea id={`${id}-en`} aria-label={f.body_en} aria-describedby={`${id}-en-hint`} value={d.body_en} maxLength={NOTE_MAX} rows={5}
              onChange={(e) => update({ body_en: e.target.value })} className="resize-y [field-sizing:content]" />
          </div>
        </details>
      </Section>

      <Section id={`${id}-image-section`} title={n.sections.image}>
        <ImageField store={{ bucket: "note-media", folder: `${workspaceId}/notes` }} id={`${id}-image`} value={d.image ? { ...d.image } : null}
          readOnly={false} onChange={(image) => update({ image: image ? { src: image.src, alt: image.alt, width: image.width, height: image.height } : null })} />
      </Section>

      <Section id={`${id}-meta`} title={n.sections.meta}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-tags`} className="text-meta font-semibold text-fg-secondary">{f.tags}</label>
          <Input id={`${id}-tags`} value={tagsLine} maxLength={200} aria-describedby={`${id}-tags-hint`}
            onChange={(e) => {
              setTagsLine(e.target.value);
              update({ tags: [...new Set(e.target.value.split(",").map(normalizeTag).filter(Boolean))].slice(0, NOTE_TAGS_MAX) });
            }} />
          <p id={`${id}-tags-hint`} className="text-caption text-fg-secondary">{f.tagsHint}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-parent`} className="text-meta font-semibold text-fg-secondary">{f.parent}</label>
          <Select id={`${id}-parent`} value={d.parent_id ?? ""} aria-describedby={`${id}-parent-hint`}
            onChange={(e) => update({ parent_id: e.target.value || null })}>
            <option value="">{f.parentNone}</option>
            {parents.map((p) => <option key={p.id} value={p.id}>N-{p.number} · {p.excerpt}</option>)}
          </Select>
          <p id={`${id}-parent-hint`} className="text-caption text-fg-secondary">{f.parentHint}</p>
        </div>
      </Section>
    </div>
  );
}

/** «Опублікувати» / «Зняти з публікації», apart from the autosave: publishing is a decision, not an edit. */
export function NotePublish({ noteId, number, published }: { noteId: string; number: number; published: boolean }) {
  const { pending, run, error } = useAction();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {published ? (
          <Button variant="secondary" busy={pending} disabled={pending} onClick={() => run(() => setNoteStatus(noteId, "draft"))}>{n.unpublish}</Button>
        ) : (
          <Button busy={pending} disabled={pending} onClick={() => run(() => setNoteStatus(noteId, "published"))}>{pending ? n.publishing : n.publish}</Button>
        )}
        {published && (
          <a href={`/uk/notes/${number}`} target="_blank" rel="noreferrer" className="text-sm font-semibold underline underline-offset-2">{n.onSite}</a>
        )}
      </div>
      <ActionError error={error} />
    </div>
  );
}
