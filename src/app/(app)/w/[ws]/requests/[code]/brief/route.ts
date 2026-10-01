import { getWorkspaceBySlug } from "@/domains/projects";
import { briefFileName } from "@/domains/requests/file-name";
import { renderBriefPdf } from "@/domains/requests/pdf/brief";
import type { BriefDocument } from "@/domains/requests/snapshot";
import { createClient } from "@/shared/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The designer's copy of a brief document (any version, uk or en). Members only: RLS decides what is visible. */
export async function GET(req: Request, { params }: { params: Promise<{ ws: string; code: string }> }) {
  const { ws, code } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "uk";
  const version = Math.max(1, Number(url.searchParams.get("v")) || 1);
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) return new Response(null, { status: 404, headers });
  const supabase = await createClient();
  const { data: request } = await supabase.from("project_requests").select("id, code")
    .eq("workspace_id", workspace.id).eq("code", code).maybeSingle();
  if (!request) return new Response(null, { status: 404, headers });
  const { data: doc } = await supabase.from("project_request_documents").select("version, generated_at, template_version, content")
    .eq("request_id", request.id).eq("document_type", "project_brief").eq("version", version).maybeSingle();
  if (!doc) return new Response(null, { status: 404, headers });

  const brief = { code: request.code, ...doc } as unknown as BriefDocument;
  const pdf = await renderBriefPdf(brief, locale);
  const name = briefFileName(brief.content.project.name, brief.code, brief.content.submitted_at).replace(/\.pdf$/, `-${locale}.pdf`);
  return new Response(new Uint8Array(pdf), {
    headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
