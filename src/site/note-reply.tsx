"use client";

import { useCallback, useId, useRef, useState } from "react";
import { replyToNote, type ReplyResult } from "@/domains/notes/public-actions";
import { REPLY_MAX } from "@/domains/notes/schema";
import { cn } from "@/shared/lib/cn";
import { track } from "./analytics/track";
import type { Dictionary, Locale } from "./content";
import { Turnstile } from "./intake/turnstile";
import { button, sg } from "./signal/ui";

type Copy = Dictionary["notes"]["reply"];

/**
 * «Відповісти автору»: a private reply that lands in the tool. The same guards as the project request form —
 * a honeypot, a minimum time on the page and Turnstile when it is configured — with database rate limits behind.
 */
export function NoteReply({ number, locale, copy, turnstileSiteKey }: { number: number; locale: Locale; copy: Copy; turnstileSiteKey?: string }) {
  const id = useId();
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<Exclude<ReplyResult, { ok: true }>["error"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("validation");
      bodyRef.current?.focus();
      return;
    }
    setError(null);
    setState("sending");
    let res: ReplyResult;
    try {
      res = await replyToNote(number, { body, contact }, { locale, honeypot: honeypot.current?.value, startedAt: startedAt.current, turnstileToken: token ?? undefined });
    } catch {
      res = { ok: false, error: "unavailable" };
    }
    if (res.ok) {
      setState("sent");
      setBody("");
      setContact("");
      track("note_reply_sent", { note_number: number });
    } else {
      setState("idle");
      setError(res.error);
    }
  }

  const invalid = error === "validation";
  return (
    <section className={cn(sg.panel, "sg-note-reply")} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{copy.title}</h2>
      <p className="sg-note-reply-lead">{copy.lead}</p>
      {state === "sent" ? (
        <p role="status" className="mt-5 font-semibold">{copy.sent}</p>
      ) : (
        <form noValidate onSubmit={submit}>
          {/* Honeypot: hidden from people and assistive tech; bots fill every field. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor={`${id}-fax`}>Fax</label>
            <input ref={honeypot} id={`${id}-fax`} name="company_fax" tabIndex={-1} autoComplete="off" />
          </div>
          <div className={sg.field}>
            <label htmlFor={`${id}-body`} className={sg.label}>{copy.body}</label>
            <textarea ref={bodyRef} id={`${id}-body`} className={cn(sg.input, "leading-[1.5]")} value={body} maxLength={REPLY_MAX} required
              aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined}
              onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className={sg.field}>
            <label htmlFor={`${id}-contact`} className={sg.label}>{copy.contact}</label>
            <input id={`${id}-contact`} className={sg.input} value={contact} maxLength={200} autoComplete="email"
              aria-describedby={`${id}-contact-hint`} onChange={(e) => setContact(e.target.value)} />
            <p id={`${id}-contact-hint`} className={sg.hint}>{copy.contactHint}</p>
          </div>
          {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} locale={locale} onToken={onToken} />}
          {error && <p id={`${id}-error`} role="alert" className={cn(sg.error, "font-semibold")}>{copy.errors[error]}</p>}
          <div>
            <button type="submit" className={button({ variant: "primary" })} disabled={state === "sending"} aria-busy={state === "sending" || undefined}>
              {state === "sending" ? copy.sending : copy.send}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
