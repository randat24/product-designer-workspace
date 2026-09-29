"use client";

import { useState } from "react";
import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { Section, TextField } from "@/shared/ui/form-section";
import { Input } from "@/shared/ui/field";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { deleteParticipant, saveParticipant } from "./actions";
import type { ParticipantFields } from "./schema";

const f = t.research.participants.fields;

export function ParticipantEditor({ id, initial, consentAt, canEdit }: {
  id: string;
  initial: ParticipantFields;
  consentAt: string | null;
  canEdit: boolean;
}) {
  const { value: p, update, status, error } = useAutosave(initial, (v) => saveParticipant(id, { ...v, consentAt }), canEdit);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [armed, setArmed] = useState(false);

  const input = (key: "role" | "display_name" | "segment_label" | "age_range" | "contact", label: string, hint?: string, max = 200) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={key} className="text-[13px] font-semibold text-fg-secondary">{label}</label>
      <Input id={key} value={p[key] ?? ""} readOnly={!canEdit} maxLength={max} placeholder={hint}
        onChange={(e) => update({ [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <SaveToast id="participant-status" status={status} error={error?.message} readOnly={!canEdit} />
      <Section id="profile" title={t.research.participants.sections.profile}>
        <div className="grid gap-4 sm:grid-cols-2">
          {input("role", f.role)}
          {input("segment_label", f.segment_label, f.segmentHint, 80)}
          {input("age_range", f.age_range, undefined, 40)}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tags" className="text-[13px] font-semibold text-fg-secondary">{f.tags}</label>
            <Input id="tags" value={tagsText} readOnly={!canEdit} placeholder={f.tagsHint}
              onChange={(e) => { setTagsText(e.target.value); update({ tags: e.target.value.split(",") }); }} />
          </div>
        </div>
        <TextField id="context" label={f.context} hint={f.contextHint} value={p.context ?? ""} readOnly={!canEdit} onChange={(context) => update({ context })} />
        <TextField id="notes" label={f.notes} value={p.notes ?? ""} readOnly={!canEdit} onChange={(notes) => update({ notes })} />
      </Section>

      <Section id="private" title={t.research.participants.sections.private}>
        <div className="grid gap-4 sm:grid-cols-2">
          {input("display_name", f.display_name, f.display_nameHint, 120)}
          {input("contact", f.contact, undefined, 300)}
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 font-semibold">
          <input type="checkbox" checked={p.consent} disabled={!canEdit} onChange={(e) => update({ consent: e.target.checked })}
            className="size-5 accent-[var(--success)]" />
          {f.consent}
        </label>
      </Section>

      {canEdit && (
        <form action={deleteParticipant} onSubmit={(e) => { if (!armed) { e.preventDefault(); setArmed(true); } }}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" onBlur={() => setArmed(false)}
            className={cn("rounded-[9px] border-[1.5px] px-3.5 py-1.5 text-sm font-semibold",
              armed ? "border-danger bg-danger text-white" : "border-line text-danger hover:border-danger")}>
            {armed ? t.research.participants.deleteConfirm : t.research.participants.delete}
          </button>
        </form>
      )}
      {error?.field && <span className="sr-only">{error.message}</span>}
    </div>
  );
}
