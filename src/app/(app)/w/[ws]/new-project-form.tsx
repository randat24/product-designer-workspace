"use client";

import { useActionState } from "react";
import { createProject, type CreateProjectState } from "@/domains/projects/actions";
import { PLATFORMS } from "@/domains/projects/constants";
import { Button } from "@/shared/ui/button";
import { Field, Input, Textarea } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";

export function NewProjectForm({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState<CreateProjectState, FormData>(createProject, undefined);
  const nameError = state?.fieldErrors?.name;

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <Field label={t.workspace.name} htmlFor="name" error={nameError}>
        <Input id="name" name="name" required maxLength={120} placeholder={t.workspace.namePlaceholder}
          aria-invalid={!!nameError} aria-describedby={nameError ? "name-error" : undefined} />
      </Field>
      <Field label={t.workspace.description} htmlFor="description">
        <Textarea id="description" name="description" rows={3} placeholder={t.workspace.descriptionPlaceholder} />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[13px] font-medium text-fg-secondary">{t.workspace.platforms}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {PLATFORMS.map((p) => (
            <label key={p.value} className="flex items-center gap-1.5">
              <input type="checkbox" name="platforms" value={p.value} className="size-4 accent-[var(--accent)]" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error && <p role="alert" className="text-[13px] text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? t.workspace.creating : t.workspace.create}</Button>
    </form>
  );
}
