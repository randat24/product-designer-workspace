"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { isOffline, retryDelay, SLOW_MS, TimeoutError, withTimeout } from "@/shared/lib/network";
import { useOnReconnect } from "@/shared/ui/network";
import { t } from "@/shared/i18n/uk";

export type AutosaveStatus = "idle" | "dirty" | "saving" | "slow" | "saved" | "offline" | "error";
export type AutosaveResult = { ok: true } | { ok: false; error: string; field?: string };

const AUTOSAVE_MS = 800;

/**
 * One save attempt with the network edge cases folded in (docs/UX_LAWS.md UX-27):
 * no connection → "offline" (sent again on reconnect); no answer in time or a failed request → retried
 * on a back-off; a server-side failure (`t.autosave.failed`) → retried too; a validation error → shown, not retried.
 */
type Outcome = { status: "saved" } | { status: "offline" } | { status: "error"; message: string; field?: string; retry: boolean };

async function attempt(save: () => Promise<AutosaveResult>): Promise<Outcome> {
  if (isOffline()) return { status: "offline" };
  try {
    const res = await withTimeout(save());
    if (res.ok) return { status: "saved" };
    const retry = res.error === t.autosave.failed;
    return { status: "error", message: retry ? t.autosave.retrying : res.error, field: res.field, retry };
  } catch (e) {
    if (isOffline()) return { status: "offline" };
    return { status: "error", message: e instanceof TimeoutError ? t.autosave.timeout : t.autosave.retrying, retry: true };
  }
}

/** Shows "slow" after SLOW_MS while a save is still in flight. Returns the cleanup. */
function slowAfter(setStatus: (fn: (s: AutosaveStatus) => AutosaveStatus) => void) {
  const timer = setTimeout(() => setStatus((s) => (s === "saving" ? "slow" : s)), SLOW_MS);
  return () => clearTimeout(timer);
}

const UNSAVED: AutosaveStatus[] = ["dirty", "saving", "slow", "offline", "error"];

/** The browser warns before leaving while edits are not saved yet. */
function useLeaveWarning(status: AutosaveStatus) {
  useEffect(() => {
    if (!UNSAVED.includes(status)) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);
}

/**
 * Debounced autosave of a whole value. A stale response never overwrites a newer status.
 * Offline edits stay on the page and are sent when the connection returns; failures retry on their own.
 */
export function useAutosave<T>(initial: T, save: (value: T) => Promise<AutosaveResult>, enabled: boolean) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  // Bumped to send the same value again (retry, reconnect) without waiting for the next edit.
  const [round, setRound] = useState(0);
  const version = useRef(0);
  const saved = useRef(0);
  const failures = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;
  const statusRef = useRef(status);
  statusRef.current = status;

  const update = (patch: Partial<T>) => {
    version.current += 1;
    setValue((v) => ({ ...v, ...patch }));
    setStatus("dirty");
  };

  useOnReconnect(() => {
    if (statusRef.current === "offline" || statusRef.current === "error") setRound((r) => r + 1);
  });

  useEffect(() => {
    if (!enabled || version.current === saved.current) return;
    const v = version.current;
    let stale = false;
    let stopSlow = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      setStatus("saving");
      stopSlow = slowAfter(setStatus);
      const out = await attempt(() => saveRef.current(value));
      stopSlow();
      if (stale || v !== version.current) return;
      if (out.status === "saved") {
        saved.current = v;
        failures.current = 0;
        setError(null);
      } else if (out.status === "error") {
        setError({ message: out.message, field: out.field });
        if (out.retry) retryTimer = setTimeout(() => setRound((r) => r + 1), retryDelay(++failures.current));
      } else {
        setError(null);
      }
      setStatus(out.status);
    }, round === 0 ? AUTOSAVE_MS : 0);
    return () => {
      stale = true;
      clearTimeout(timer);
      clearTimeout(retryTimer);
      stopSlow();
    };
  }, [value, enabled, round]);

  useLeaveWarning(status);

  return { value, update, status, error };
}

/** Text for a save status; the toast and the inline field notes share it. */
export function autosaveLabel(status: AutosaveStatus, error?: string) {
  return {
    idle: "", dirty: t.autosave.unsaved, saving: t.autosave.saving, slow: t.autosave.slow, saved: t.autosave.saved,
    offline: t.autosave.offline, error: error ?? t.autosave.retrying,
  }[status];
}

/** Floating status pill, like the notebook's toast. Always in the DOM so screen readers get updates. */
export function SaveToast({ id, status, error, readOnly }: { id: string; status: AutosaveStatus; error?: string; readOnly: boolean }) {
  const label = readOnly ? t.autosave.readOnly : autosaveLabel(status, error);
  return (
    <p id={id} role="status" aria-live="polite"
      className={cn(
        "fixed bottom-5 left-1/2 z-10 max-w-sm -translate-x-1/2 rounded-control bg-fg px-4 py-2 text-sm font-semibold text-canvas shadow-lg",
        !label && "opacity-0",
        (status === "error" || status === "offline") && "bg-danger text-on-status",
      )}>
      {label}
    </p>
  );
}

/**
 * A single text field that saves itself (answers, matrix cells, question text).
 * Keeps typing local; saves after a pause and on blur; reports failures inline and retries them.
 */
export function useFieldAutosave(initial: string, save: (value: string) => Promise<AutosaveResult>, enabled: boolean) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef(initial);
  const saveRef = useRef(save);
  saveRef.current = save;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initial);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const failures = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;

  const flush = async (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabledRef.current || v === lastSaved.current) return;
    setStatus("saving");
    const stopSlow = slowAfter(setStatus);
    const out = await attempt(() => saveRef.current(v));
    stopSlow();
    if (v !== latest.current) return; // a newer edit has its own save on the way
    if (out.status === "saved") {
      lastSaved.current = v;
      failures.current = 0;
    } else if (out.status === "error" && out.retry) {
      timer.current = setTimeout(() => flush(latest.current), retryDelay(++failures.current));
    }
    setError(out.status === "error" ? out.message : null);
    setStatus(out.status);
  };

  const onChange = (v: string) => {
    latest.current = v;
    setValue(v);
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(v), AUTOSAVE_MS);
  };

  useOnReconnect(() => {
    if (statusRef.current === "offline" || statusRef.current === "error") void flush(latest.current);
  });

  // Unmounting mid-pause (e.g. moving to the next question) still sends the last text.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (enabledRef.current && latest.current !== lastSaved.current) void saveRef.current(latest.current).catch(() => {});
  }, []);

  useLeaveWarning(status);

  // Only a rejected value is invalid input; a timeout or a lost connection is not the user's mistake.
  const invalid = status === "error" && error !== t.autosave.retrying && error !== t.autosave.timeout;
  return { value, onChange, onBlur: () => flush(value), status, error, invalid };
}

/** A field's own note when its text is not saved yet (no connection, server failure, rejected value). */
export function FieldSaveNote({ status, error, className }: { status: AutosaveStatus; error?: string | null; className?: string }) {
  if (status !== "error" && status !== "offline") return null;
  return <p role="alert" className={className ?? "text-meta text-danger"}>{autosaveLabel(status, error ?? undefined)}</p>;
}
