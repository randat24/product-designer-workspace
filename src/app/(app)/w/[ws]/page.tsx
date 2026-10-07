import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug, listProjects, PLATFORMS } from "@/domains/projects";
import { createDemoProject } from "@/domains/projects/actions";
import { listCaseStudies } from "@/domains/cases";
import { Button } from "@/shared/ui/button";
import { t } from "@/shared/i18n/uk";
import { NewProjectForm } from "./new-project-form";
import { WorkspaceHeader, WorkspaceTabs } from "./workspace-header";
import { FedoOutline } from "@/shared/ui/fedo-mark";

export const metadata: Metadata = { title: t.workspace.projects };

export default async function WorkspacePage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const [all, cases] = await Promise.all([listProjects(workspace.id), listCaseStudies(workspace.id)]);
  const projects = all.filter((p) => !p.archived_at);
  const archived = all.filter((p) => p.archived_at);

  return (
    <div className="min-h-screen">
      <WorkspaceHeader current={workspace.slug} />

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-[clamp(18px,4vw,56px)] py-10">
        <WorkspaceTabs wsSlug={workspace.slug} workspaceId={workspace.id} current="projects" />
        <section aria-labelledby="new-h" className="flex flex-col gap-4 rounded-hero border-[1.5px] border-fg bg-surface p-6 md:p-8">
          <h1 id="new-h" className="page-title">{t.workspace.newProject}</h1>
          <NewProjectForm workspaceId={workspace.id} autoFocus />
        </section>

        <section aria-labelledby="projects-h" className="flex flex-col gap-4">
          <h2 id="projects-h" className="text-heading font-semibold">{t.workspace.projects}</h2>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">
              <FedoOutline className="size-16" />
              <p>{t.workspace.empty}</p>
              <form action={createDemoProject}>
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <Button type="submit" variant="ghost" className="underline underline-offset-2">{t.workspace.demoCreate}</Button>
              </form>
            </div>
          ) : (
            <ProjectList wsSlug={workspace.slug} projects={projects} cases={cases} />
          )}
          {archived.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-fg-secondary hover:text-fg">
                {t.workspace.archived(archived.length)}
              </summary>
              <div className="mt-2"><ProjectList wsSlug={workspace.slug} projects={archived} cases={cases} /></div>
            </details>
          )}
        </section>
      </main>
    </div>
  );
}

type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];
type CaseMap = Awaited<ReturnType<typeof listCaseStudies>>;

function ProjectList({ wsSlug, projects, cases }: { wsSlug: string; projects: ProjectListItem[]; cases: CaseMap }) {
  const platformLabel = (v: string) => PLATFORMS.find((p) => p.value === v)?.label ?? v;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => {
        const c = cases.get(p.id);
        return (
          <li key={p.id} className="relative">
            <Link href={`/w/${wsSlug}/p/${p.slug}`}
              className="flex h-full min-h-24 flex-col gap-1 rounded-panel border border-line bg-surface p-5 transition-colors duration-[120ms] hover:border-fg">
              <span className={`line-clamp-2 text-base leading-snug font-bold ${c ? "pr-28" : ""}`}>{p.name}</span>
              {(p.description || p.platforms.length > 0) && (
                <span className="line-clamp-2 text-meta text-fg-secondary">
                  {[p.platforms.map(platformLabel).join(", "), p.description].filter(Boolean).join(" — ")}
                </span>
              )}
            </Link>
            {/* The case badge sits over the card, not inside its link: a published case opens the site. */}
            {c && c.status === "published" ? (
              <a href={`/uk/cases/${c.slug}`} target="_blank" rel="noreferrer"
                className="absolute top-4 right-4 rounded-full bg-success px-2.5 py-1 text-caption font-semibold text-on-status hover:opacity-85">
                {t.cases.badge.published}
              </a>
            ) : c ? (
              <span className={`absolute top-4 right-4 rounded-full border px-2.5 py-1 text-caption font-semibold ${
                c.status === "review" ? "border-warning text-warning" : "border-line text-fg-secondary"}`}>
                {t.cases.badge[c.status]}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
