"use client";

import { ErrorState } from "@/shared/ui/error-state";
import { t } from "@/shared/i18n/uk";

/** Workspace-level failure (docs/UX_LAWS.md, UX-27): plain words, retry, a way back to projects. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState error={error} reset={reset} back={{ href: "/app", label: t.status.toProjects }} className="mx-auto px-6 py-24" />;
}
