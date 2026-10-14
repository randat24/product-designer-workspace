"use client";

import { t } from "@/shared/i18n/uk";
import { Button } from "@/shared/ui/button";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { markReplyRead } from "./actions";

/** «Прочитано» / «Непрочитане» on one reply. */
export function ReplyReadToggle({ replyId, read }: { replyId: string; read: boolean }) {
  const { pending, run, error } = useAction();
  return (
    <span className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => markReplyRead(replyId, !read))}>
        {read ? t.notes.replies.markUnread : t.notes.replies.markRead}
      </Button>
      <ActionError error={error} />
    </span>
  );
}
