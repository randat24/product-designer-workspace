"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { t } from "@/shared/i18n/ru";

/**
 * Peak-end rule and Postel's law (docs/UX_LAWS.md, UX-27, UX-28): a failed page explains itself in
 * plain words and offers a way forward — retry or back to the overview — inside the project layout.
 */
export default function ProjectError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { ws, project } = useParams<{ ws: string; project: string }>();
  useEffect(() => console.error(error), [error]);
  return (
    <div role="alert" className="flex max-w-xl flex-col gap-4 py-10">
      <h1 className="page-title">{t.status.errorTitle}</h1>
      <p className="text-fg-secondary">{t.status.errorBody}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={reset}>{t.status.retry}</Button>
        <Link href={`/w/${ws}/p/${project}`} className="inline-flex h-9 items-center px-2 text-sm font-semibold underline underline-offset-4">
          {t.status.toOverview}
        </Link>
      </div>
      {error.digest && <p className="text-caption text-fg-secondary">ID: {error.digest}</p>}
    </div>
  );
}
