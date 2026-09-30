"use client";

import { useState, useTransition } from "react";
import { t } from "@/shared/i18n/ru";

type ActionResult = { ok: boolean; error?: string } | void | undefined;

/**
 * Runs a server action from a button (not a form) and never fails silently (docs/UX_LAWS.md UX-27,
 * docs/QUALITY_REVIEW.md B1): a `{ ok: false }` result or a thrown error becomes a visible message.
 * The action revalidates the page itself, so no router.refresh() is needed afterwards.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<ActionResult>, onSuccess?: () => void) =>
    startTransition(async () => {
      setError(null);
      const res = await action().catch((): ActionResult => ({ ok: false }));
      if (res && !res.ok) setError(res.error || t.status.actionFailed);
      else onSuccess?.();
    });

  return { pending, run, error, clearError: () => setError(null) };
}

/** The message of a failed action, announced to screen readers; renders nothing otherwise. */
export function ActionError({ error, className }: { error: string | null; className?: string }) {
  if (!error) return null;
  return <p role="alert" className={className ?? "text-[13px] text-danger"}>{error}</p>;
}
