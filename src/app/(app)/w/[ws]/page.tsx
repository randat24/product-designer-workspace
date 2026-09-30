import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug, listMyWorkspaces, listProjects, getCurrentUser, PLATFORMS } from "@/domains/projects";
import { createDemoProject } from "@/domains/projects/actions";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";
import { NewProjectForm } from "./new-project-form";
import { WorkspaceSwitcher } from "./workspace-switcher";

export const metadata: Metadata = { title: t.workspace.projects };

const dateFmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });

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

      <main className="mx-auto grid max-w-6xl gap-10 px-[clamp(18px,4vw,56px)] py-10 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="projects-h" className="min-w-0">
          <div id="projects-h"><PageHeader title={t.workspace.projects} /></div>
          {projects.length === 0 ? (
            <p className="rounded-[14px] border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{t.workspace.empty}</p>
          ) : (
            <ProjectList wsSlug={workspace.slug} projects={projects} />
          )}
          {archived.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-fg-secondary hover:text-fg">
                {t.workspace.archived(archived.length)}
              </summary>
              <div className="mt-2"><ProjectList wsSlug={workspace.slug} projects={archived} /></div>
            </details>
          )}
        </section>

        <section aria-labelledby="new-h" className="h-fit rounded-[14px] border border-line bg-surface p-5 lg:mt-[76px]">
          <h2 id="new-h" className="mb-3 text-heading font-semibold">{t.workspace.newProject}</h2>
          <NewProjectForm workspaceId={workspace.id} />
          <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
            <h2 className="text-sm font-semibold">{t.workspace.demoTitle}</h2>
            <p className="text-[13px] text-fg-secondary">{t.workspace.demoBody}</p>
            <form action={createDemoProject}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <Button type="submit" variant="secondary">{t.workspace.demoCreate}</Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

function ProjectList({ wsSlug, projects }: { wsSlug: string; projects: ProjectListItem[] }) {
  const platformLabel = (v: string) => PLATFORMS.find((p) => p.value === v)?.label ?? v;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {projects.map((p) => (
        <li key={p.id}>
          <Link href={`/w/${wsSlug}/p/${p.slug}`}
            className="grid h-full grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 rounded-[14px] border border-line bg-surface p-5 transition-colors duration-[120ms] hover:border-fg">
            <span className="truncate text-base font-bold">{p.name}</span>
            <span className="text-caption text-fg-secondary tabular-nums">
              {p.archived_at ? t.workspace.archivedBadge : `${t.workspace.updated} ${dateFmt.format(new Date(p.updated_at))}`}
            </span>
            <span className="col-span-2 line-clamp-2 text-[13px] text-fg-secondary">
              {[p.platforms.map(platformLabel).join(", "), p.description].filter(Boolean).join(" — ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
