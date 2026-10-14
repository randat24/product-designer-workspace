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

/** Visitors' replies, newest first, with the number of the note each answers. */
export async function listReplies(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("note_replies")
    .select("id, body, contact, locale, created_at, read_at, site_notes(number, body_uk)")
    .eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data;
}

/** Unread replies, for the badge on the «Нотатки» tab. Zero for anyone but the owner. */
export async function countUnreadReplies(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("note_replies").select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId).is("read_at", null);
  return error ? 0 : (count ?? 0);
}

/** Whether the site shows this workspace's notes: the request form delivers here. Owner-only, like the notes. */
export async function isSiteWorkspace(workspaceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("intake_settings").select("workspace_id").eq("workspace_id", workspaceId).maybeSingle();
  return !!data;
}
