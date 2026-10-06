"use client";

import { useEffect, useRef, useState } from "react";
import type { Failure, FailureKind } from "@/shared/lib/action-result";
import { cn } from "@/shared/lib/cn";
import { isOffline, retryDelay, SLOW_MS, TimeoutError, withTimeout } from "@/shared/lib/network";
import { useOnReconnect } from "@/shared/ui/network";
import { t } from "@/shared/i18n/uk";

export type AutosaveStatus = "idle" | "dirty" | "saving" | "slow" | "saved" | "offline" | "error" | "conflict";
/** What a save action answers. `version` is the row's new `updated_at` when the action checks for conflicts. */
export type AutosaveResult = { ok: true; version?: string | null } | Failure;
export type AutosaveError = { message: string; field?: string; kind?: FailureKind };

const AUTOSAVE_MS = 800;
/** How long a save that timed out is still awaited before the next one may go: a late answer is still applied,
 *  and a newer value never overtakes an older one on the way to the server. */
const SETTLE_MS = 60_000;

type Outcome = AutosaveResult | "offline" | "network";

/**
 * The save engine shared by the form and field hooks (docs/HANDOFF_TRIAGE.md, F01):
 * - writes go one at a time, newest value last, so an older answer never overwrites a newer edit;
 * - every edit counts (not its text), so returning to an earlier value is saved too;
 * - only a transient failure is retried, on a back-off; the pause before saving stays after retries;
 * - leaving the page sends what is not saved yet; when it cannot be saved, in-app links ask first;
 * - a timeout means "unknown": the answer is still awaited and applied when it comes.
 */
function useSaver<T>(save: (value: T, version: string | null) => Promise<AutosaveResult>, enabled: boolean, version: string | null) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<AutosaveError | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const s = useRef({
    latest: undefined as T | undefined,
    seq: 0, // edits made
    savedSeq: 0, // the newest edit the server has confirmed
    version,
    inFlight: false,
    queued: false,
    conflicted: false,
    failures: 0,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    retry: undefined as ReturnType<typeof setTimeout> | undefined,
    mounted: true,
    status: "idle" as AutosaveStatus,
    errorKind: undefined as FailureKind | undefined,
  }).current;

  const show = (next: AutosaveStatus, err: AutosaveError | null = null) => {
    s.status = next;
    s.errorKind = err?.kind;
    if (!s.mounted) return;
    setStatus(next);
    setError(err);
  };

  const apply = (outcome: Outcome, seq: number) => {
    if (outcome === "offline") return show("offline");
    if (outcome === "network" || (!outcome.ok && outcome.kind === "transient")) {
      // After the editor is gone a few quiet retries still try to land the last value, then it stops.
      if (s.mounted || s.failures < 3) s.retry = setTimeout(() => void run(), retryDelay(++s.failures));
      return show("error", { message: t.autosave.retrying, kind: "transient" });
    }
    if (!outcome.ok) {
      if (outcome.kind === "conflict") s.conflicted = true;
      return show(outcome.kind === "conflict" ? "conflict" : "error", { message: outcome.error, field: outcome.field, kind: outcome.kind });
    }
    if (outcome.version !== undefined) s.version = outcome.version;
    s.savedSeq = Math.max(s.savedSeq, seq);
    s.failures = 0;
    show(s.savedSeq === s.seq ? "saved" : "dirty");
  };

  async function run() {
    clearTimeout(s.timer);
    clearTimeout(s.retry);
    if (!enabledRef.current || s.conflicted) return;
    if (s.inFlight) { s.queued = true; return; }
    if (s.seq === s.savedSeq) return;
    if (isOffline()) return show("offline");
    s.inFlight = true;
    const seq = s.seq;
    show("saving");
    const slow = setTimeout(() => { if (s.status === "saving") show("slow"); }, SLOW_MS);
    const request = saveRef.current(s.latest as T, s.version);
    let outcome: Outcome;
    try {
      outcome = await withTimeout(request);
    } catch (e) {
      if (e instanceof TimeoutError) {
        // Not "failed": the write may still land. Say so, and wait for the real answer before anything else goes.
        show("error", { message: t.autosave.timeout, kind: "transient" });
        try { outcome = await withTimeout(request, SETTLE_MS); } catch { outcome = isOffline() ? "offline" : "network"; }
      } else {
        outcome = isOffline() ? "offline" : "network";
      }
    }
    clearTimeout(slow);
    s.inFlight = false;
    apply(outcome, seq);
    if (s.queued) {
      s.queued = false;
      void run();
    }
  }

  const schedule = (value: T) => {
    s.latest = value;
    s.seq += 1;
    if (s.conflicted) return;
    // While a failed save waits for its retry, the error stays on screen; the new value goes with that retry.
    if (s.status !== "error" || s.errorKind !== "transient") show("dirty");
    clearTimeout(s.timer);
    s.timer = setTimeout(() => void run(), AUTOSAVE_MS);
  };

  useOnReconnect(() => {
    if (s.status === "offline" || (s.status === "error" && s.errorKind === "transient")) void run();
  });

  // A newer row from the server (the page re-rendered after another action) becomes the base for the next save,
  // unless there are edits of our own still on the way.
  useEffect(() => {
    if (version && s.seq === s.savedSeq && !s.inFlight) s.version = version;
  }, [version, s]);

  useEffect(() => {
    s.mounted = true;
    return () => {
      // Leaving the page (or the field) mid-pause still sends the last value; its answer has no one to show it to.
      s.mounted = false;
      clearTimeout(s.timer);
      clearTimeout(s.retry);
      if (s.inFlight) s.queued = true;
      else void run();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; `run` reads everything from refs
  }, []);

  useLeaveGuard(status, () => s.seq !== s.savedSeq);

  return { status, error, schedule, flush: () => void run() };
}

const PENDING: AutosaveStatus[] = ["dirty", "saving", "slow"];
const STUCK: AutosaveStatus[] = ["offline", "error", "conflict"];

/**
 * Leaving with unsaved edits. A pending save is sent on its own when the editor unmounts, so in-app navigation
 * goes ahead; edits that cannot be saved right now (no connection, an error, a conflict) make in-app links ask
 * first. Closing or reloading the tab gets the browser's own warning. Back/Forward cannot be held in the App
 * Router: the unmount still sends a pending save, and a stuck one stays unsaved — the limit of this guard.
 */
function useLeaveGuard(status: AutosaveStatus, unsaved: () => boolean) {
  useEffect(() => {
    const pending = PENDING.includes(status) || (STUCK.includes(status) && unsaved());
    if (!pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    const stuck = STUCK.includes(status);
    const onClick = (e: MouseEvent) => {
      if (!stuck || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== window.location.origin || a.pathname === window.location.pathname) return;
      if (!window.confirm(t.autosave.leaveUnsaved)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [status, unsaved]);
}

/**
 * Debounced autosave of a whole form value. `version` (the row's `updated_at`) turns on the conflict check:
 * a save then fails instead of overwriting a newer edit from another tab or member.
 */
export function useAutosave<T>(
  initial: T,
  save: (value: T, version: string | null) => Promise<AutosaveResult>,
  enabled: boolean,
  version: string | null = null,
) {
  const [value, setValue] = useState(initial);
  const latest = useRef(initial);
  const saver = useSaver(save, enabled, version);

  const update = (patch: Partial<T>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setValue(next);
    saver.schedule(next);
  };

  return { value, update, status: saver.status, error: saver.error };
}

/** Text for a save status; the toast and the inline field notes share it. */
export function autosaveLabel(status: AutosaveStatus, error?: string) {
  return {
    idle: "", dirty: t.autosave.unsaved, saving: t.autosave.saving, slow: t.autosave.slow, saved: t.autosave.saved,
    offline: t.autosave.offline, error: error ?? t.autosave.retrying, conflict: error ?? t.autosave.conflict,
  }[status];
}

/** Floating status pill, like the notebook's toast. Always in the DOM so screen readers get updates. */
export function SaveToast({ id, status, error, readOnly }: { id: string; status: AutosaveStatus; error?: string; readOnly: boolean }) {
  const label = readOnly ? t.autosave.readOnly : autosaveLabel(status, error);
  const problem = !readOnly && (status === "error" || status === "offline" || status === "conflict");
  return (
    <p id={id} role="status" aria-live="polite"
      className={cn(
        "fixed bottom-5 left-1/2 z-10 flex max-w-sm -translate-x-1/2 flex-wrap items-center gap-x-3 gap-y-1 rounded-control bg-fg px-4 py-2 text-sm font-semibold text-canvas shadow-lg",
        !label && "opacity-0",
        problem && "bg-danger text-on-status",
      )}>
      {label}
      {!readOnly && status === "conflict" && (
        <button type="button" onClick={() => window.location.reload()} className="underline underline-offset-2">{t.autosave.reload}</button>
      )}
    </p>
  );
}

/**
 * A single text field that saves itself (answers, matrix cells, question text).
 * Keeps typing local; saves after a pause and on blur; reports failures inline and retries the transient ones.
 */
export function useFieldAutosave(initial: string, save: (value: string) => Promise<AutosaveResult>, enabled: boolean) {
  const [value, setValue] = useState(initial);
  const saver = useSaver<string>((v) => save(v), enabled, null);

  const onChange = (v: string) => {
    setValue(v);
    saver.schedule(v);
  };

  return {
    value, onChange, onBlur: saver.flush, status: saver.status, error: saver.error?.message ?? null,
    // Only a rejected value is invalid input; a timeout or a lost connection is not the user's mistake.
    invalid: saver.status === "error" && saver.error?.kind === "validation",
  };
}

/** A field's own note when its text is not saved yet (no connection, server failure, rejected value). */
export function FieldSaveNote({ status, error, className }: { status: AutosaveStatus; error?: string | null; className?: string }) {
  if (status !== "error" && status !== "offline" && status !== "conflict") return null;
  return <p role="alert" className={className ?? "text-meta text-danger"}>{autosaveLabel(status, error ?? undefined)}</p>;
}
