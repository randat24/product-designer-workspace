"use client";

import { useActionState } from "react";
import { createProject, type CreateProjectState } from "@/domains/projects/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { t } from "@/shared/i18n/uk";

/** One field and Enter: the project opens right away; description and platforms live in its settings. */
export function NewProjectForm({ workspaceId, autoFocus }: { workspaceId: string; autoFocus?: boolean }) {
  const [state, action, pending] = useActionState<CreateProjectState, FormData>(createProject, undefined);
  const error = state?.fieldErrors?.name ?? state?.error;

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="name" className="sr-only">{t.workspace.name}</label>
        <Input id="name" name="name" required maxLength={120} autoFocus={autoFocus} autoComplete="off"
          placeholder={t.workspace.namePlaceholder} aria-invalid={!!error} aria-describedby={error ? "name-error" : "name-hint"}
          className="h-12 min-w-0 flex-1 text-heading" />
        <Button type="submit" disabled={pending} className="h-12 px-6 text-body">
          {pending ? t.workspace.creating : t.workspace.create}
        </Button>
      </div>
      {error
        ? <p id="name-error" role="alert" className="text-meta text-danger">{error}</p>
        : <p id="name-hint" className="text-caption text-fg-secondary">{t.workspace.createHint}</p>}
    </form>
  );
}
