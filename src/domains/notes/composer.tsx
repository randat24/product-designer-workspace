"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { t } from "@/shared/i18n/uk";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/field";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { createNote } from "./actions";
import { NOTE_MAX } from "./schema";

const n = t.notes;

/** The quick composer above the list: write, «Опублікувати», and the note is on the site within a minute. */
export function NoteComposer({ workspaceId, wsSlug }: { workspaceId: string; wsSlug: string }) {
  const id = useId();
  const [body, setBody] = useState("");
  const [done, setDone] = useState<{ number: number; published: boolean } | null>(null);
  const { pending, run, error } = useAction();

  // Which button was pressed: only it shows the spinner.
  const [publishing, setPublishing] = useState(true);
  const submit = (publish: boolean) => {
    setPublishing(publish);
    setDone(null);
    let number = 0;
    run(async () => {
      const res = await createNote(workspaceId, body, publish);
      if (res.ok) number = res.number;
      return res;
    }, () => {
      setBody("");
      setDone({ number, published: publish });
    });
  };

  return (
    <form className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4"
      onSubmit={(e) => { e.preventDefault(); submit(true); }}>
      <label htmlFor={`${id}-body`} className="text-meta font-semibold text-fg-secondary">{n.composerLabel}</label>
      <Textarea id={`${id}-body`} value={body} maxLength={NOTE_MAX} rows={4} aria-describedby={`${id}-hint`}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(true); } }}
        className="resize-y [field-sizing:content]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={`${id}-hint`} className="max-w-prose text-caption text-fg-secondary">{n.composerHint(NOTE_MAX)}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-caption text-fg-secondary tabular-nums" aria-hidden>{n.count(body.length, NOTE_MAX)}</span>
          <Button variant="secondary" busy={pending && !publishing} disabled={pending || !body.trim()} onClick={() => submit(false)}>{n.saveDraft}</Button>
          <Button type="submit" busy={pending && publishing} disabled={pending || !body.trim()}>{pending && publishing ? n.publishing : n.publish}</Button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="text-meta text-success empty:hidden">
        {done && (
          <>
            {done.published ? n.published(done.number) : n.drafted(done.number)}{" "}
            <Link href={`/w/${wsSlug}/notes/${done.number}`} className="font-semibold underline underline-offset-2">{n.open}</Link>
          </>
        )}
      </p>
      <ActionError error={error} />
    </form>
  );
}
