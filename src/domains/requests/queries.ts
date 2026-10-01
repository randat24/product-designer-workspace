import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";
import { findBudgetRange } from "./config";
import type { BriefSnapshot } from "./snapshot";

export const REQUEST_FILTERS = ["open", "submitted", "reviewing", "qualified", "accepted", "declined", "converted", "archived", "all"] as const;
export type RequestFilter = (typeof REQUEST_FILTERS)[number];
export const REQUEST_SORTS = ["new", "budget", "deadline"] as const;
export type RequestSort = (typeof REQUEST_SORTS)[number];

const LIST_COLUMNS =
  "id, code, status, project_name, project_types, budget_range, budget_min, budget_max, budget_currency, start_preference, has_deadline, deadline_date, submitted_at, archived_at, clients(name, company)";

/** Requests of a workspace for the list (RLS: members only). Budget sorts by range tier, then amount. */
export async function listRequests(workspaceId: string, filter: RequestFilter, sort: RequestSort) {
  const supabase = await createClient();
  let q = supabase.from("project_requests").select(LIST_COLUMNS).eq("workspace_id", workspaceId);
  if (filter === "archived") q = q.not("archived_at", "is", null);
  else if (filter !== "all") {
    q = q.is("archived_at", null);
    if (filter === "open") q = q.in("status", ["submitted", "reviewing", "qualified", "accepted"]);
    else q = q.eq("status", filter);
  }
  const { data, error } = await q.order("submitted_at", { ascending: false }).limit(500);
  if (error) throw error;
  const rows = data ?? [];
  if (sort === "budget") {
    const score = (r: (typeof rows)[number]) => (findBudgetRange(r.budget_range)?.tier ?? (r.budget_min ? 3.5 : 0)) * 1e9 + Number(r.budget_min ?? 0);
    rows.sort((a, b) => score(b) - score(a));
  }
  if (sort === "deadline") {
    rows.sort((a, b) => (a.deadline_date ?? "9999") .localeCompare(b.deadline_date ?? "9999"));
  }
  return rows;
}
export type RequestListItem = Awaited<ReturnType<typeof listRequests>>[number];

export async function countNewRequests(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("project_requests").select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId).eq("status", "submitted").is("archived_at", null);
  return count ?? 0;
}

/** One request with everything the detail page shows. The answers come from the immutable brief v1. */
export const getRequest = cache(async (workspaceId: string, code: string) => {
  const supabase = await createClient();
  const { data: r, error } = await supabase.from("project_requests")
    .select("id, code, status, locale, submitted_at, archived_at, client_id, clients(id, name, email, telegram, phone, preferred_channel)")
    .eq("workspace_id", workspaceId).eq("code", code).maybeSingle();
  if (error) throw error;
  if (!r) return null;
  const [docs, notes, project, history] = await Promise.all([
    supabase.from("project_request_documents").select("id, document_type, version, locale, generated_at, content")
      .eq("request_id", r.id).order("version"),
    supabase.from("project_request_notes").select("id, body, author_id, created_at")
      .eq("request_id", r.id).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, slug, name").eq("source_request_id", r.id).maybeSingle(),
    supabase.from("activity_log").select("changed_keys, created_at, actor_id")
      .eq("entity_type", "project_request").eq("entity_id", r.id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (docs.error) throw docs.error;
  const brief = docs.data?.find((d) => d.document_type === "project_brief" && d.version === 1);
  return {
    ...r,
    snapshot: brief?.content as unknown as BriefSnapshot | undefined,
    documents: (docs.data ?? []).map(({ content: _c, ...d }) => d),
    notes: notes.data ?? [],
    project: project.data,
    history: history.data ?? [],
  };
});
export type RequestDetail = NonNullable<Awaited<ReturnType<typeof getRequest>>>;
