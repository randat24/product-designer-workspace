"use client";

import { useState, useTransition } from "react";
import { isOffline, TimeoutError, withTimeout } from "@/shared/lib/network";
import { t } from "@/shared/i18n/uk";

type ActionResult = { ok: boolean; error?: string } | void | undefined;

/** The message for a request that never got an answer: no connection, a server that took too long, or a crash. */
export function failureMessage(e: unknown) {
  if (isOffline()) return t.network.offlineAction;
  if (e instanceof TimeoutError) return t.network.timeout;
  return t.status.actionFailed;
}

/**
 * Runs a server action from a button (not a form) and never fails silently (docs/UX_LAWS.md UX-27,
 * docs/QUALITY_REVIEW.md B1): a `{ ok: false }` result, a thrown error, no connection or no answer in time
 * becomes a visible message. Offline the action is not sent at all.
 * The action revalidates the page itself, so no router.refresh() is needed afterwards.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<ActionResult>, onSuccess?: () => void) =>
    startTransition(async () => {
      setError(null);
      if (isOffline()) {
        setError(t.network.offlineAction);
        return;
      }
      let res: ActionResult;
      try {
        res = await withTimeout(action());
      } catch (e) {
        setError(failureMessage(e));
        return;
      }
      if (res && !res.ok) setError(res.error || t.status.actionFailed);
      else onSuccess?.();
    });

  return { pending, run, error, clearError: () => setError(null) };
}

/** The message of a failed action, announced to screen readers; renders nothing otherwise. */
export function ActionError({ error, className }: { error: string | null; className?: string }) {
  if (!error) return null;
  return <p role="alert" className={className ?? "text-meta text-danger"}>{error}</p>;
}
