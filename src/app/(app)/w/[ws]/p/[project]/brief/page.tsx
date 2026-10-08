import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyRole, getProjectBySlug, getWorkspaceBySlug, PLATFORMS } from "@/domains/projects";
import Link from "next/link";
import { BriefEditor, briefCompleteness, getBrief } from "@/domains/briefs";
import { createClient } from "@/shared/lib/supabase/server";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/uk";

export const metadata: Metadata = { title: t.brief.title };

export default async function BriefPage({ params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) notFound();

  const [brief, role, source] = await Promise.all([getBrief(project.id), getMyRole(workspace.id), getBriefSource(project.id)]);
  const { updatedAt, ...initial } = brief;
  const progress = briefCompleteness(initial);

  return (
    <div className="max-w-4xl">
      <PageHeader title={t.brief.title} lede={t.brief.lede}
        progress={{ value: (progress.filled / progress.total) * 100, caption: t.project.briefProgress(progress.filled, progress.total) }} />
      {source && (
        <p className="mb-6 rounded-control border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          {t.requests.briefBanner(source.code)}{" "}
          <Link href={`/w/${ws}/requests/${source.code}`} className="font-semibold underline underline-offset-2">{t.requests.openRequest}</Link>
        </p>
      )}
      <BriefEditor
        clientInput={source ?? undefined}
        projectId={project.id}
        initial={initial}
        version={updatedAt}
        canEdit={role === "owner" || role === "editor"}
        platforms={project.platforms.map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p)}
        settingsHref={`/w/${ws}/p/${slug}/settings`}
      />
    </div>
  );
}

/** The request this project came from and the client's original wording, if the brief was prefilled from it. */
async function getBriefSource(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("project_briefs").select("client_input").eq("project_id", projectId).maybeSingle();
  const input = (data?.client_input ?? {}) as Record<string, unknown>;
  const code = typeof input.request_code === "string" ? input.request_code : null;
  if (!code) return null;
  const fields = Object.fromEntries(Object.entries(input).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  return { code, fields };
}
