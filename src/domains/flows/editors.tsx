"use client";

import { useAutosave, SaveToast } from "@/shared/ui/autosave";
import { TextField } from "@/shared/ui/form-section";
import { ChipGroup } from "@/shared/ui/chips";
import { Input } from "@/shared/ui/field";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { t } from "@/shared/i18n/uk";
import { deleteFlow, saveFlowMeta } from "./actions";
import { FLOW_STATUSES, type FlowMeta } from "./schema";

const f = t.flows;

/** Name, description and status of a flow (autosaved). */
export function FlowMetaEditor({ id, initial, canEdit }: { id: string; initial: FlowMeta; canEdit: boolean }) {
  const { value: v, update, status, error } = useAutosave(initial, (x) => saveFlowMeta(id, x), canEdit);
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
      <SaveToast id="flow-status" status={status} error={error?.message} readOnly={!canEdit} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="flow-name" className="text-meta font-semibold text-fg-secondary">{f.fields.name}</label>
        <Input id="flow-name" value={v.name} readOnly={!canEdit} maxLength={200} className="h-11 text-heading font-bold"
          aria-invalid={error?.field === "name"} onChange={(e) => update({ name: e.target.value })} />
      </div>
      <TextField id="flow-description" label={f.fields.description} value={v.description ?? ""} readOnly={!canEdit}
        onChange={(description) => update({ description })} />
      <ChipGroup label={f.fields.status} options={FLOW_STATUSES} value={v.status} disabled={!canEdit} onChange={(s) => update({ status: s })} />
    </div>
  );
}

export function DeleteFlowButton({ id }: { id: string }) {
  return <ConfirmDelete action={deleteFlow} fields={{ id }} label={f.delete} confirm={f.deleteConfirm} />;
}
