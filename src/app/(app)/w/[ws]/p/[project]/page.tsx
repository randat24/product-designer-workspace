import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getWorkspaceBySlug, PLATFORMS } from "@/domains/projects";
import { visibleNav, CURRENT_PHASE } from "@/shared/navigation";
import { t } from "@/shared/i18n/ru";

export default async function ProjectOverview({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const base = `/w/${ws}/p/${slug}`;
  const stages = visibleNav().filter((g) => g.items.some((i) => i.segment));

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-caption text-fg-secondary">{t.project.overview}</p>
        <h1 className="text-title font-semibold">{project.name}</h1>
        {(project.description || project.platforms.length > 0) && (
          <p className="max-w-prose text-fg-secondary">
            {[project.platforms.map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p).join(", "), project.description]
              .filter(Boolean).join(" — ")}
          </p>
        )}
      </header>

      <section aria-labelledby="process-h" className="flex flex-col gap-3">
        <h2 id="process-h" className="text-heading font-semibold">{t.project.process}</h2>
        <ol className="divide-y divide-line rounded-md border border-line bg-surface">
          {stages.map((g) => (
            <li key={g.title} className="grid gap-x-6 gap-y-1 px-4 py-3 sm:grid-cols-[140px_1fr]">
              <span className="text-[13px] font-medium text-fg-secondary">{g.title}</span>
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                {g.items.filter((i) => i.segment).map((i) => (
                  <Link key={i.segment} href={`${base}/${i.segment}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <span aria-hidden className="text-fg-secondary">{i.phase <= CURRENT_PHASE ? "●" : "○"}</span>
                    {i.label}
                  </Link>
                ))}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
