import { notFound, redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";

/**
 * Short link from the notification e-mail: /app/requests/REQ-2026-0012 → the request in its workspace.
 * RLS shows only requests of workspaces the signed-in user belongs to.
 */
export default async function RequestShortLink({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("project_requests").select("workspace_id").eq("code", code).limit(1).maybeSingle();
  if (!data) notFound();
  const { data: ws } = await supabase.from("workspaces").select("slug").eq("id", data.workspace_id).single();
  if (!ws) notFound();
  redirect(`/w/${ws.slug}/requests/${encodeURIComponent(code)}`);
}
