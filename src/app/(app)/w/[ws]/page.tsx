import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug, listMyWorkspaces, listProjects, getCurrentUser, PLATFORMS } from "@/domains/projects";
import { createDemoProject } from "@/domains/projects/actions";
import { Button } from "@/shared/ui/button";
import { t } from "@/shared/i18n/ru";
import { NewProjectForm } from "./new-project-form";
import { WorkspaceSwitcher } from "./workspace-switcher";

export const metadata: Metadata = { title: t.workspace.projects };

export default async function WorkspacePage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const [workspace, workspaces, user] = await Promise.all([getWorkspaceBySlug(ws), listMyWorkspaces(), getCurrentUser()]);
  if (!workspace) notFound();
  const all = await listProjects(workspace.id);
  const projects = all.filter((p) => !p.archived_at);
  const archived = all.filter((p) => p.archived_at);

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between gap-4 bg-rail px-[clamp(18px,4vw,56px)] text-rail-fg">
        <span className="flex min-w-0 items-center gap-4">
          <span className="font-display text-lg leading-none font-bold whitespace-nowrap uppercase">{t.auth.brand}</span>
          <WorkspaceSwitcher current={workspace.slug} workspaces={workspaces} />
        </span>
        <form action="/auth/signout" method="post" className="flex items-center gap-3 text-[13px]">
          <Link href="/account" className="hidden opacity-70 hover:opacity-100 hover:underline sm:inline">{user?.email}</Link>
          <button className="rounded-lg border border-rail-fg/30 px-2.5 py-1 hover:border-rail-fg/70">{t.auth.signOut}</button>
        </form>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-[clamp(18px,4vw,56px)] py-10">
        <section aria-labelledby="new-h" className="flex flex-col gap-4 rounded-[18px] border-[1.5px] border-fg bg-surface p-6 md:p-8">
          <h1 id="new-h" className="page-title">{t.workspace.newProject}</h1>
          <NewProjectForm workspaceId={workspace.id} autoFocus />
        </section>

        <section aria-labelledby="projects-h" className="flex flex-col gap-4">
          <h2 id="projects-h" className="text-heading font-semibold">{t.workspace.projects}</h2>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">
              <p>{t.workspace.empty}</p>
              <form action={createDemoProject}>
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <Button type="submit" variant="ghost" className="underline underline-offset-2">{t.workspace.demoCreate}</Button>
              </form>
            </div>
          ) : (
            <ProjectList wsSlug={workspace.slug} projects={projects} />
          )}
          {archived.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-fg-secondary hover:text-fg">
                {t.workspace.archived(archived.length)}
              </summary>
              <div className="mt-2"><ProjectList wsSlug={workspace.slug} projects={archived} /></div>
            </details>
          )}
        </section>
      </main>
    </div>
  );
}

type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

function ProjectList({ wsSlug, projects }: { wsSlug: string; projects: ProjectListItem[] }) {
  const platformLabel = (v: string) => PLATFORMS.find((p) => p.value === v)?.label ?? v;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <Link href={`/w/${wsSlug}/p/${p.slug}`}
            className="flex h-full min-h-24 flex-col gap-1 rounded-[14px] border border-line bg-surface p-5 transition-colors duration-[120ms] hover:border-fg">
            <span className="line-clamp-2 text-base leading-snug font-bold">{p.name}</span>
            {(p.description || p.platforms.length > 0) && (
              <span className="line-clamp-2 text-[13px] text-fg-secondary">
                {[p.platforms.map(platformLabel).join(", "), p.description].filter(Boolean).join(" — ")}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
