"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { t } from "@/shared/i18n/uk";
import { publishCase, unpublishCase } from "./actions";

const c = t.caseEditor;

/**
 * Publication of a case (docs/HANDOFF_TRIAGE.md, V06): the editor changes a draft; the site shows what was last
 * published. Preview opens the draft rendered by the site's own case page.
 */
export function PublishBar({ caseId, slug, published, hasUnpublished, canEdit }: {
  caseId: string;
  slug: string;
  published: boolean;
  hasUnpublished: boolean;
  canEdit: boolean;
}) {
  const { pending, run, error } = useAction();
  const [done, setDone] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const act = (action: () => ReturnType<typeof publishCase>, message: string) => {
    setDone(null);
    run(action, () => setDone(message));
  };
  const link = "font-semibold underline underline-offset-2";

  return (
    <section aria-label={c.publish} className="mb-6 flex flex-col gap-3 rounded-control border border-line bg-surface px-4 py-3 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold">{published ? c.published : c.notPublished}</span>
        {published && <span className={hasUnpublished ? "text-warning" : "text-fg-secondary"}>{hasUnpublished ? c.unpublishedChanges : c.upToDate}</span>}
      </p>
      <p className="text-fg-secondary">{c.draftNote}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {canEdit && (
          <Button type="button" disabled={pending || (published && !hasUnpublished)}
            onClick={() => act(() => publishCase(caseId), c.publishedNow)}>
            {pending ? c.publishing : published ? c.republish : c.publish}
          </Button>
        )}
        {canEdit && published && (
          <button type="button" disabled={pending} onBlur={() => setArmed(false)}
            onClick={() => {
              if (!armed) return setArmed(true);
              setArmed(false);
              act(() => unpublishCase(caseId), c.unpublishedNow);
            }}
            className={armed
              ? "inline-flex h-9 items-center rounded-control border border-danger bg-danger px-3.5 font-semibold text-on-status"
              : "inline-flex h-9 items-center rounded-control border border-line px-3.5 font-semibold text-danger hover:border-danger"}>
            {armed ? c.unpublishConfirm : c.unpublish}
          </button>
        )}
        <a href={`/uk/cases/${slug}/preview`} target="_blank" rel="noreferrer" className={link}>{c.preview("uk")}</a>
        <a href={`/en/cases/${slug}/preview`} target="_blank" rel="noreferrer" className={link}>{c.preview("en")}</a>
        {published && <a href={`/uk/cases/${slug}`} target="_blank" rel="noreferrer" className={link}>{c.open}</a>}
      </div>
      <p role="status" aria-live="polite" className="text-success empty:hidden">{done}</p>
      <ActionError error={error} />
    </section>
  );
}
