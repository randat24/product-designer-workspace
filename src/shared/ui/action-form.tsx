"use client";

import { useRef } from "react";
import { ActionError, useAction, type ActionResult } from "@/shared/ui/use-action";

/**
 * A form for a server action that never fails silently (docs/HANDOFF_TRIAGE.md, F03): a refused or failed
 * action shows its message under the form, and what was typed stays in the fields — React's own form
 * actions clear them after every submit. The fields are disabled while the action runs, so a double press
 * does not send it twice.
 *
 * `idempotent` sends a `requestId` that stays the same until the action succeeds: when an answer is lost and
 * the person presses again, the action finds the record it already created instead of making a second one.
 */
export function ActionForm({ action, children, className, idempotent = false }: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  idempotent?: boolean;
}) {
  const { pending, run, error } = useAction();
  const requestId = useRef<string | null>(null);
  return (
    <form className={className} onSubmit={(e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      if (idempotent) data.set("requestId", (requestId.current ??= crypto.randomUUID()));
      run(() => action(data), () => { requestId.current = null; });
    }}>
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      <ActionError error={error} className="basis-full text-meta text-danger" />
    </form>
  );
}
