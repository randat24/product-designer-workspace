import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug, listMyWorkspaces, listProjects, getCurrentUser, PLATFORMS } from "@/domains/projects";
import { t } from "@/shared/i18n/ru";
import { NewProjectForm } from "./new-project-form";
import { WorkspaceSwitcher } from "./workspace-switcher";

export const metadata: Metadata = { title: t.workspace.projects };

const dateFmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });

export default async function WorkspacePage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const [workspace, workspaces, user] = await Promise.all([getWorkspaceBySlug(ws), listMyWorkspaces(), getCurrentUser()]);
  if (!workspace) notFound();
  const projects = await listProjects(workspace.id);
  const platformLabel = (v: string) => PLATFORMS.find((p) => p.value === v)?.label ?? v;

  return (
    <div className="min-h-screen">
      <header className="flex h-12 items-center justify-between border-b border-line bg-surface px-4">
        <WorkspaceSwitcher current={workspace.slug} workspaces={workspaces} />
        <form action="/auth/signout" method="post" className="flex items-center gap-3 text-caption text-fg-secondary">
          <span className="hidden sm:inline">{user?.email}</span>
          <button className="rounded px-2 py-1 hover:bg-subtle hover:text-fg">{t.auth.signOut}</button>
        </form>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="projects-h" className="min-w-0">
          <h1 id="projects-h" className="mb-4 text-title font-semibold">{t.workspace.projects}</h1>
          {projects.length === 0 ? (
            <p className="max-w-prose rounded-md border border-dashed border-line p-6 text-fg-secondary">{t.workspace.empty}</p>
          ) : (
            <ul className="divide-y divide-line rounded-md border border-line bg-surface">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/w/${workspace.slug}/p/${p.slug}`} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 px-4 py-3 hover:bg-subtle">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="text-caption text-fg-secondary tabular-nums">
                      {t.workspace.updated} {dateFmt.format(new Date(p.updated_at))}
                    </span>
                    <span className="truncate text-[13px] text-fg-secondary">
                      {[p.platforms.map(platformLabel).join(", "), p.description].filter(Boolean).join(" — ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="new-h" className="h-fit rounded-md border border-line bg-surface p-4">
          <h2 id="new-h" className="mb-3 text-heading font-semibold">{t.workspace.newProject}</h2>
          <NewProjectForm workspaceId={workspace.id} />
        </section>
      </main>
    </div>
  );
}
