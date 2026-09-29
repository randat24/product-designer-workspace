import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug } from "@/domains/projects";
import { setProjectArchived } from "@/domains/projects/actions";
import { Button } from "@/shared/ui/button";
import { t } from "@/shared/i18n/ru";
import { DeleteForm, GeneralForm } from "./forms";

export const metadata: Metadata = { title: t.settings.title };

export default async function ProjectSettingsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const role = await getMyRole(workspace.id);
  const canEdit = role === "owner" || role === "editor";

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <h1 className="text-title font-semibold">{t.settings.title}</h1>

      <section aria-labelledby="general-h" className="flex flex-col gap-4">
        <h2 id="general-h" className="border-b border-line pb-2 text-heading font-semibold">{t.settings.general}</h2>
        <GeneralForm project={project} readOnly={!canEdit} />
        <p className="text-[13px] text-fg-secondary">{t.settings.slugNote(project.slug)}</p>
      </section>

      {canEdit && (
        <section aria-labelledby="archive-h" className="flex flex-col gap-3">
          <h2 id="archive-h" className="border-b border-line pb-2 text-heading font-semibold">{t.settings.archive}</h2>
          <p className="max-w-prose text-fg-secondary">{t.settings.archiveBody}</p>
          <form action={setProjectArchived}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="archived" value={project.archived_at ? "0" : "1"} />
            <Button type="submit" variant="secondary">
              {project.archived_at ? t.settings.restoreAction : t.settings.archiveAction}
            </Button>
          </form>
        </section>
      )}

      {role === "owner" && (
        <section aria-labelledby="delete-h" className="flex flex-col gap-3">
          <h2 id="delete-h" className="border-b border-line pb-2 text-heading font-semibold text-danger">{t.settings.delete}</h2>
          <p className="max-w-prose text-fg-secondary">{t.settings.deleteBody}</p>
          <DeleteForm projectId={project.id} name={project.name} />
        </section>
      )}
    </div>
  );
}
