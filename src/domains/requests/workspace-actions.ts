"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { slugify } from "@/shared/lib/slug";
import type { Json } from "@/types/database";
import type { BriefSnapshot } from "./snapshot";
import { requestPlatforms, requestToBrief } from "./to-brief";

// Status changes a person can make; «converted» belongs to the conversion only.
const manualStatus = z.enum(["submitted", "reviewing", "qualified", "accepted", "declined"]);
const uuid = z.string().uuid();

async function wsSlugOf(requestId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("project_requests").select("code, workspace_id").eq("id", requestId).single();
  const { data: w } = data ? await supabase.from("workspaces").select("slug").eq("id", data.workspace_id).single() : { data: null };
  return { supabase, code: data?.code ?? "", ws: w?.slug ?? "" };
}

export async function setRequestStatus(formData: FormData) {
  const id = uuid.parse(formData.get("requestId"));
  const status = manualStatus.parse(formData.get("status"));
  const { supabase, code, ws } = await wsSlugOf(id);
  const { error } = await supabase.from("project_requests").update({ status }).eq("id", id);
  if (error) throw error;
  revalidatePath(`/w/${ws}/requests`);
  revalidatePath(`/w/${ws}/requests/${code}`);
}

export async function setRequestArchived(formData: FormData) {
  const id = uuid.parse(formData.get("requestId"));
  const archive = formData.get("archive") === "1";
  const { supabase, code, ws } = await wsSlugOf(id);
  const { error } = await supabase.from("project_requests").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
  revalidatePath(`/w/${ws}/requests`);
  revalidatePath(`/w/${ws}/requests/${code}`);
}

export async function addRequestNote(formData: FormData) {
  const id = uuid.parse(formData.get("requestId"));
  const body = z.string().trim().min(1).max(4000).parse(formData.get("body"));
  const { supabase, code, ws } = await wsSlugOf(id);
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from("project_request_notes").insert({ request_id: id, body, author_id: user.user?.id });
  if (error) throw error;
  revalidatePath(`/w/${ws}/requests/${code}`);
}

export async function deleteRequestNote(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const supabase = await createClient();
  const { data: note } = await supabase.from("project_request_notes").select("request_id").eq("id", id).single();
  const { error } = await supabase.from("project_request_notes").delete().eq("id", id);
  if (error) throw error;
  if (note) {
    const { code, ws } = await wsSlugOf(note.request_id);
    revalidatePath(`/w/${ws}/requests/${code}`);
  }
}

/** Owners only (RLS); a converted request is refused by the database and stays as project history. */
export async function deleteRequest(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const { supabase, ws } = await wsSlugOf(id);
  const { data: req } = await supabase.from("project_requests").select("client_id").eq("id", id).single();
  const { error } = await supabase.from("project_requests").delete().eq("id", id);
  if (error) throw error;
  // Competitors, references, links, notes and documents go with the request (on delete cascade). The client's
  // contacts go too when no other request of theirs remains: nothing personal is left behind without a reason.
  if (req) {
    const { count } = await supabase.from("project_requests").select("id", { count: "exact", head: true }).eq("client_id", req.client_id);
    if (!count) await supabase.from("clients").delete().eq("id", req.client_id);
  }
  revalidatePath(`/w/${ws}/requests`);
  redirect(`/w/${ws}/requests`);
}

/** Request → project with a prepared brief and the client's competitors (see convert_project_request). */
export async function convertRequest(formData: FormData) {
  const id = uuid.parse(formData.get("requestId"));
  const { supabase, ws } = await wsSlugOf(id);
  const { data: doc, error: docError } = await supabase.from("project_request_documents")
    .select("content").eq("request_id", id).eq("document_type", "project_brief").eq("version", 1).single();
  if (docError) throw docError;
  const snap = doc.content as unknown as BriefSnapshot;
  const name = (snap.project.name ?? snap.code).slice(0, 120);
  const { data: slug, error } = await supabase.rpc("convert_project_request", {
    p_request: id,
    p_name: name,
    p_slug: slugify(snap.project.name ?? snap.code.toLowerCase()),
    p_platforms: requestPlatforms(snap.project.types),
    p_brief: requestToBrief(snap) as unknown as Json,
  });
  if (error) throw error;
  revalidatePath(`/w/${ws}`);
  revalidatePath(`/w/${ws}/requests`);
  redirect(`/w/${ws}/p/${slug}/brief`);
}
