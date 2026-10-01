// Draft of the project request in this browser only (localStorage), so a long form is not lost on a reload.
// Contact details are never stored; drafts expire after 7 days and are removed after a successful submit.

const KEY = "project-request-draft";
const VERSION = 1;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type Draft<T> = { v: number; savedAt: number; step: number; data: T; idempotencyKey: string; startedAt: number };

export function readDraft<T>(): Draft<T> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft<T>;
    if (d.v !== VERSION || !d.savedAt || Date.now() - d.savedAt > TTL_MS || !d.idempotencyKey) {
      localStorage.removeItem(KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function writeDraft<T>(d: Omit<Draft<T>, "v" | "savedAt">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...d, v: VERSION, savedAt: Date.now() }));
  } catch {
    // Storage full or blocked (private mode): the form still works, only without a draft.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** The confirmation of a sent request, for this tab only (a reload keeps showing it, a new tab does not). */
const DONE_KEY = "project-request-done";
export type DoneState = { code: string; token: string; submittedAt: string; projectName: string | null; duplicate: boolean };
export function readDone(): DoneState | null {
  try {
    const raw = sessionStorage.getItem(DONE_KEY);
    return raw ? (JSON.parse(raw) as DoneState) : null;
  } catch {
    return null;
  }
}
export function writeDone(d: DoneState | null): void {
  try {
    if (d) sessionStorage.setItem(DONE_KEY, JSON.stringify(d));
    else sessionStorage.removeItem(DONE_KEY);
  } catch {
    // ignore
  }
}
