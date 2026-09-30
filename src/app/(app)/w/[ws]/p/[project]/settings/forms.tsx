"use client";

import { useActionState } from "react";
import { deleteProject, updateProject, type DeleteProjectState, type UpdateProjectState } from "@/domains/projects/actions";
import { PLATFORMS, PROJECT_STATUSES } from "@/domains/projects/constants";
import { Button } from "@/shared/ui/button";
import { Field, Input, Textarea } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";

type Project = { id: string; name: string; description: string | null; platforms: string[]; status: string };

export function GeneralForm({ project, readOnly }: { project: Project; readOnly: boolean }) {
  const [state, action, pending] = useActionState<UpdateProjectState, FormData>(updateProject, undefined);
  const nameError = state?.fieldErrors?.name;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={project.id} />
      <fieldset disabled={readOnly} className="flex flex-col gap-4">
        <Field label={t.workspace.name} htmlFor="name" error={nameError}>
          <Input id="name" name="name" required maxLength={120} defaultValue={project.name}
            aria-invalid={!!nameError} aria-describedby={nameError ? "name-error" : undefined} />
        </Field>
        <Field label={t.workspace.description} htmlFor="description">
          <Textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={project.description ?? ""} />
        </Field>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-meta font-semibold text-fg-secondary">{t.workspace.platforms}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {PLATFORMS.map((p) => (
              <label key={p.value} className="flex items-center gap-1.5">
                <input type="checkbox" name="platforms" value={p.value} defaultChecked={project.platforms.includes(p.value)}
                  className="size-4 accent-[var(--accent)]" />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={t.settings.status} htmlFor="status">
          <select id="status" name="status" defaultValue={project.status === "archived" ? "active" : project.status}
            className="h-9 w-48 rounded-control border border-transparent bg-subtle px-2.5 text-body font-medium hover:border-line focus:border-fg focus:outline-none">
            {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
      </fieldset>
      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? t.settings.saving : t.settings.save}</Button>
          <p role="status" aria-live="polite" className={state?.error ? "text-meta text-danger" : "text-meta text-fg-secondary"}>
            {state?.error ?? (state?.ok && !pending ? t.settings.saved : "")}
          </p>
        </div>
      )}
    </form>
  );
}

export function DeleteForm({ projectId, name }: { projectId: string; name: string }) {
  const [state, action, pending] = useActionState<DeleteProjectState, FormData>(deleteProject, undefined);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <Field label={t.settings.deleteConfirm(name)} htmlFor="confirm" error={state?.error}>
        <Input id="confirm" name="confirm" autoComplete="off" className="max-w-sm"
          aria-invalid={!!state?.error} aria-describedby={state?.error ? "confirm-error" : undefined} />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending} className="self-start text-danger">
        {pending ? t.settings.deleting : t.settings.deleteAction}
      </Button>
    </form>
  );
}
