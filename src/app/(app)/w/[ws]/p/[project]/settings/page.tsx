import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug } from "@/domains/projects";
import { setProjectArchived } from "@/domains/projects/actions";
import { getCaseForProject } from "@/domains/cases";
import { createCaseStudy, setCaseStatus } from "@/domains/cases/actions";
import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox, Input, Panel, Select } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";
import { DeleteForm, GeneralForm } from "./forms";

export const metadata: Metadata = { title: t.settings.title };

export default async function ProjectSettingsPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const [role, caseStudy] = await Promise.all([getMyRole(workspace.id), getCaseForProject(project.id)]);
  const canEdit = role === "owner" || role === "editor";

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <PageHeader title={t.settings.title} />

      <section aria-labelledby="general-h" className="flex flex-col gap-4">
        <h2 id="general-h" className="text-heading font-semibold">{t.settings.general}</h2>
        <Panel className="flex flex-col gap-4">
          <GeneralForm project={project} readOnly={!canEdit} />
          <p className="text-meta text-fg-secondary">{t.settings.slugNote(project.slug)}</p>
        </Panel>
      </section>

      <section aria-labelledby="case-h" className="flex flex-col gap-3">
        <h2 id="case-h" className="text-heading font-semibold">{t.cases.title}</h2>
        <p className="max-w-prose text-fg-secondary">{t.cases.lede}</p>
        <Panel className="flex flex-col gap-4">
          {caseStudy ? (
            <>
              <form action={setCaseStatus} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="caseId" value={caseStudy.id} />
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  {t.cases.statusLabel}
                  <Select name="caseStatus" defaultValue={caseStudy.status} disabled={!canEdit}
                    className="w-auto">
                    {(["draft", "review", "published"] as const).map((s) => (
                      <option key={s} value={s}>{t.cases.status[s]}</option>
                    ))}
                  </Select>
                </label>
                <label className="flex h-9 items-center gap-2 text-sm font-semibold" title={t.cases.adultHint}>
                  <Checkbox name="adult" value="1" defaultChecked={caseStudy.adult} disabled={!canEdit} aria-describedby="case-adult-hint" />
                  {t.cases.adult}
                </label>
                <label className="flex h-9 items-center gap-2 text-sm font-semibold" title={t.cases.sampleHint}>
                  <Checkbox name="sample" value="1" defaultChecked={caseStudy.sample} disabled={!canEdit} aria-describedby="case-sample-hint" />
                  {t.cases.sample}
                </label>
                <label className="flex w-full flex-col gap-1.5 text-sm font-semibold">
                  {t.cases.figma}
                  <Input name="figma" type="text" inputMode="url" defaultValue={caseStudy.figma} disabled={!canEdit}
                    placeholder={t.cases.figmaPlaceholder} pattern="\s*(https://)?(www\.)?figma\.com/(design|file|proto|board|slides|deck)/.+"
                    aria-describedby="case-figma-hint" />
                </label>
                {canEdit && <Button type="submit" variant="secondary">{t.cases.save}</Button>}
                {caseStudy.status === "published" && caseStudy.hasContent && (
                  <a href={`/uk/cases/${caseStudy.slug}`} target="_blank" rel="noreferrer"
                    className="ml-auto self-center text-sm font-semibold underline underline-offset-4">{t.cases.open}</a>
                )}
              </form>
              <p className="text-meta text-fg-secondary">{t.cases.address(caseStudy.slug)}</p>
              <p id="case-adult-hint" className="text-meta text-fg-secondary">{t.cases.adultHint}</p>
              <p id="case-sample-hint" className="text-meta text-fg-secondary">{t.cases.sampleHint}</p>
              <p id="case-figma-hint" className="text-meta text-fg-secondary">{t.cases.figmaHint}</p>
              {!caseStudy.hasContent && <p className="text-meta text-warning">{t.cases.emptyContent}</p>}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-fg-secondary">{t.cases.none}</p>
              {canEdit && (
                <form action={createCaseStudy}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <Button type="submit" variant="secondary">{t.cases.create}</Button>
                </form>
              )}
            </div>
          )}
        </Panel>
      </section>

      <section aria-labelledby="export-h" className="flex flex-col gap-3">
        <h2 id="export-h" className="text-heading font-semibold">{t.settings.exportTitle}</h2>
        <p className="max-w-prose text-fg-secondary">{t.settings.exportBody}</p>
        {/* A plain link: the route answers with a file (Content-Disposition), the page stays. */}
        <a href={`/w/${workspace.slug}/p/${project.slug}/export`} download
          className="inline-flex h-9 w-fit items-center gap-1.5 rounded-control border-[1.5px] border-fg px-3.5 text-sm font-semibold transition-colors duration-[120ms] hover:bg-subtle">
          <Download aria-hidden className="size-4" />
          {t.settings.exportAction}
        </a>
      </section>

      {canEdit && (
        <section aria-labelledby="archive-h" className="flex flex-col gap-3">
          <h2 id="archive-h" className="text-heading font-semibold">{t.settings.archive}</h2>
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
          <h2 id="delete-h" className="text-heading font-semibold text-danger">{t.settings.delete}</h2>
          <p className="max-w-prose text-fg-secondary">{t.settings.deleteBody}</p>
          <DeleteForm projectId={project.id} name={project.name} />
        </section>
      )}
    </div>
  );
}
