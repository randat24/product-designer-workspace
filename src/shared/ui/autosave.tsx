"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
export type AutosaveResult = { ok: true } | { ok: false; error: string; field?: string };

const AUTOSAVE_MS = 800;

/**
 * Debounced autosave of a whole value. A stale response never overwrites a newer status;
 * the browser warns before leaving with unsaved edits.
 */
export function useAutosave<T>(initial: T, save: (value: T) => Promise<AutosaveResult>, enabled: boolean) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const version = useRef(0);
  const saved = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;

  const update = (patch: Partial<T>) => {
    version.current += 1;
    setValue((v) => ({ ...v, ...patch }));
    setStatus("dirty");
  };

  useEffect(() => {
    if (!enabled || version.current === saved.current) return;
    const v = version.current;
    const timer = setTimeout(async () => {
      setStatus("saving");
      const res = await saveRef.current(value).catch((): AutosaveResult => ({ ok: false, error: t.autosave.failed }));
      if (v !== version.current) return;
      if (res.ok) {
        saved.current = v;
        setStatus("saved");
        setError(null);
      } else {
        setStatus("error");
        setError({ message: res.error, field: res.field });
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [value, enabled]);

  useEffect(() => {
    if (status !== "dirty" && status !== "saving" && status !== "error") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  return { value, update, status, error };
}

/** Floating status pill, like the notebook's toast. Always in the DOM so screen readers get updates. */
export function SaveToast({ id, status, error, readOnly }: { id: string; status: AutosaveStatus; error?: string; readOnly: boolean }) {
  const label = readOnly
    ? t.autosave.readOnly
    : { idle: "", dirty: t.autosave.unsaved, saving: t.autosave.saving, saved: t.autosave.saved, error: error ?? t.autosave.failed }[status];
  return (
    <p id={id} role="status" aria-live="polite"
      className={cn(
        "fixed bottom-5 left-1/2 z-10 max-w-sm -translate-x-1/2 rounded-control bg-fg px-4 py-2 text-sm font-semibold text-canvas shadow-lg",
        !label && "opacity-0",
        status === "error" && "bg-danger text-white",
      )}>
      {label}
    </p>
  );
}

/**
 * A single text field that saves itself (answers, matrix cells, question text).
 * Keeps typing local; saves after a pause and on blur; reports failures inline.
 */
export function useFieldAutosave(initial: string, save: (value: string) => Promise<AutosaveResult>, enabled: boolean) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const lastSaved = useRef(initial);
  const saveRef = useRef(save);
  saveRef.current = save;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initial);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const flush = async (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabled || v === lastSaved.current) return;
    setStatus("saving");
    const res = await saveRef.current(v).catch((): AutosaveResult => ({ ok: false, error: t.autosave.failed }));
    if (res.ok) lastSaved.current = v;
    setStatus(res.ok ? "saved" : "error");
  };

  const onChange = (v: string) => {
    latest.current = v;
    setValue(v);
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(v), AUTOSAVE_MS);
  };

  // Unmounting mid-pause (e.g. moving to the next question) still sends the last text.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (enabledRef.current && latest.current !== lastSaved.current) void saveRef.current(latest.current);
  }, []);

  return { value, onChange, onBlur: () => flush(value), status };
}
