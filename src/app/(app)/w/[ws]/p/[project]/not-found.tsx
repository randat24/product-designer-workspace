"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/shared/ui/error-state";
import { t } from "@/shared/i18n/uk";

/** A record inside the project that was deleted or never existed: back to the overview, inside the project layout. */
export default function ProjectRecordNotFound() {
  const { ws, project } = useParams<{ ws: string; project: string }>();
  return <NotFoundState back={{ href: `/w/${ws}/p/${project}`, label: t.status.toOverview }} className="py-10" />;
}
