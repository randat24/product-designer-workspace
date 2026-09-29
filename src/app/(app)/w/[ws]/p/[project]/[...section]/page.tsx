import Link from "next/link";
import { notFound } from "next/navigation";
import { findNavItem } from "@/shared/navigation";
import { t } from "@/shared/i18n/ru";

/** Placeholder for sections whose phase has not shipped yet. Each phase replaces its routes with real pages. */
export default async function SectionPlaceholder({ params }: { params: Promise<{ ws: string; project: string; section: string[] }> }) {
  const { ws, project, section } = await params;
  const item = findNavItem(section.join("/"));
  if (!item) notFound();

  return (
    <div className="flex max-w-prose flex-col gap-3">
      <h1 className="text-title font-semibold">{item.label}</h1>
      <div className="rounded-md border border-dashed border-line p-6">
        <p className="font-medium">{t.project.sectionSoonTitle(item.label)}</p>
        <p className="mt-1 text-fg-secondary">{t.project.sectionSoonBody(item.phase)}</p>
      </div>
      <Link href={`/w/${ws}/p/${project}`} className="text-accent hover:underline">{t.project.back}</Link>
    </div>
  );
}
