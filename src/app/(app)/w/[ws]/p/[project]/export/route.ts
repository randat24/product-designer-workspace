import { NextResponse } from "next/server";
import { getProjectBySlug, getWorkspaceBySlug } from "@/domains/projects";
import { buildProjectExport } from "@/domains/projects/export";

// Always fresh: a download of the current state, never a cached copy.
export const dynamic = "force-dynamic";

/** «Скачать проект (JSON)»: every table of the project as one file (a backup the owner keeps). */
export async function GET(_req: Request, { params }: { params: Promise<{ ws: string; project: string }> }) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  const project = workspace && (await getProjectBySlug(workspace.id, slug));
  if (!workspace || !project) return new NextResponse("Not found", { status: 404 });

  const body = JSON.stringify(await buildProjectExport(project.id), null, 2);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
