import Link from "next/link";
import { notFound } from "next/navigation";
import { findNavItem } from "@/shared/navigation";
import { t } from "@/shared/i18n/ru";
import { PageHeader } from "@/shared/ui/page-header";

/** Placeholder for sections whose phase has not shipped yet. Each phase replaces its routes with real pages. */
export default async function SectionPlaceholder({ params }: { params: Promise<{ ws: string; project: string; section: string[] }> }) {
  const { ws, project, section } = await params;
  const item = findNavItem(section.join("/"));
  if (!item) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader title={item.label} />
      <div className="rounded-[14px] border-[1.5px] border-dashed border-line p-7 text-center">
        <p className="font-bold">{t.project.sectionSoonTitle(item.label)}</p>
        <p className="mt-1 text-fg-secondary">{t.project.sectionSoonBody(item.phase)}</p>
      </div>
      <Link href={`/w/${ws}/p/${project}`} className="font-semibold underline underline-offset-2">{t.project.back}</Link>
    </div>
  );
}
