"use client";

import { useActionState, useRef } from "react";
import { t } from "@/shared/i18n/uk";
import { restoreProject, type RestoreProjectState } from "./actions";

/** Pick an export file and it is restored at once as a new project (same pattern as the notebook import). */
export function RestoreProject({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState<RestoreProjectState, FormData>(restoreProject, undefined);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="flex flex-col gap-2 border-t border-line pt-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-meta text-fg-secondary">{t.workspace.restore.lead}</span>
        <label className="inline-flex h-9 cursor-pointer items-center rounded-control border-[1.5px] border-fg px-3.5 text-sm font-semibold transition-colors duration-[120ms] hover:bg-subtle has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg">
          {pending ? t.workspace.restore.restoring : t.workspace.restore.button}
          <input type="file" name="file" accept="application/json,.json" className="sr-only" disabled={pending}
            aria-describedby="restore-hint" onChange={() => form.current?.requestSubmit()} />
        </label>
      </div>
      <p id="restore-hint" className="text-caption text-fg-secondary">{t.workspace.restore.hint}</p>
      <p role="status" aria-live="polite" className="text-meta font-semibold text-danger">{state?.error ?? ""}</p>
    </form>
  );
}
