import "server-only";
import { createClient } from "@/shared/lib/supabase/server";

const NOTE_FIELDS = "id, number, body_uk, body_en, image, tags, parent_id, status, published_at, created_at, updated_at";

/** The workspace's notes for its owner, newest first. Other roles get none (row-level security). */
export async function listNotes(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_notes").select(NOTE_FIELDS)
    .eq("workspace_id", workspaceId).order("number", { ascending: false });
  if (error) throw error;
  return data;
}
export type NoteRow = Awaited<ReturnType<typeof listNotes>>[number];

export async function getNote(workspaceId: string, number: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_notes").select(NOTE_FIELDS)
    .eq("workspace_id", workspaceId).eq("number", number).maybeSingle();
  if (error) throw error;
  return data;
}

/** Whether the site shows this workspace's notes: the request form delivers here. Owner-only, like the notes. */
export async function isSiteWorkspace(workspaceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("intake_settings").select("workspace_id").eq("workspace_id", workspaceId).maybeSingle();
  return !!data;
}
