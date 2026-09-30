"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { t } from "@/shared/i18n/ru";

/** Workspace-level failure (docs/UX_LAWS.md, UX-27): plain words, retry, a way back to projects. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-24">
      <h1 className="page-title">{t.status.errorTitle}</h1>
      <p className="text-fg-secondary">{t.status.errorBody}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={reset}>{t.status.retry}</Button>
        <Link href="/app" className="inline-flex h-9 items-center px-2 text-sm font-semibold underline underline-offset-4">
          {t.status.toProjects}
        </Link>
      </div>
      {error.digest && <p className="text-[12px] text-fg-secondary">ID: {error.digest}</p>}
    </div>
  );
}
