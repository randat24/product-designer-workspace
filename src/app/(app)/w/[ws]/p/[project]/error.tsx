"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/shared/ui/error-state";
import { t } from "@/shared/i18n/uk";

/**
 * Peak-end rule and Postel's law (docs/UX_LAWS.md, UX-27, UX-28): a failed page explains itself in
 * plain words and offers a way forward — retry or back to the overview — inside the project layout.
 */
export default function ProjectError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { ws, project } = useParams<{ ws: string; project: string }>();
  return <ErrorState error={error} reset={reset} back={{ href: `/w/${ws}/p/${project}`, label: t.status.toOverview }} className="py-10" />;
}
