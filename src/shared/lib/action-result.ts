import { t } from "@/shared/i18n/uk";

/**
 * Why an action did not do its work. The kind decides what happens next, never the message text
 * (docs/HANDOFF_TRIAGE.md, F01): only a transient failure is retried on its own; invalid input waits
 * for the user, a lost right or a conflicting edit is reported and left alone.
 */
export type FailureKind = "validation" | "denied" | "conflict" | "transient";
export type Failure = { ok: false; error: string; field?: string; kind: FailureKind };

/** The server or the network failed; sending the same value again may work. */
export const transient = (error: string = t.autosave.failed): Failure => ({ ok: false, error, kind: "transient" });
/** The value (or a reference in it) is not accepted; repeating it changes nothing. */
export const invalid = (error: string = t.autosave.invalid, field?: string): Failure => ({ ok: false, error, field, kind: "validation" });
/** No right to change the record (read-only role, expired session, row hidden by RLS). */
export const denied = (error: string = t.autosave.readOnly): Failure => ({ ok: false, error, kind: "denied" });
/** The record changed since this page loaded it (another tab or another member). */
export const conflict = (error: string = t.autosave.conflict): Failure => ({ ok: false, error, kind: "conflict" });
