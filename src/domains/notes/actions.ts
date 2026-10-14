"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/uk";
import { denied, invalid, transient, type Failure } from "@/shared/lib/action-result";
import type { AutosaveResult } from "@/shared/ui/autosave";
import type { Json } from "@/types/database";
import { NOTES_TAG } from "@/site/notes-source";
import { NOTE_MAX, noteSchema, type NoteInput } from "./schema";

const n = t.notes;

/** The feed, the note pages, home, RSS and the sitemap show the change within a request. */
function refreshSite() {
  revalidateTag(NOTES_TAG);
  revalidatePath("/[locale]", "layout");
  revalidatePath("/sitemap.xml");
}

/**
 * «Опублікувати» in the quick composer: a new note with Ukrainian text only, published at once
 * (or kept as a draft). Returns its number, so the page can offer to open it.
 */
export async function createNote(workspaceId: string, body: string, publish: boolean): Promise<{ ok: true; number: number } | Failure> {
  if (!z.uuid().safeParse(workspaceId).success) return invalid();
  const text = body.trim();
  if (!text) return invalid(n.empty, "body_uk");
  if (text.length > NOTE_MAX) return invalid(n.tooLong(NOTE_MAX), "body_uk");
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_notes")
    .insert({ workspace_id: workspaceId, body_uk: text, status: publish ? "published" : "draft" })
    .select("number").single();
  if (error) return error.code === "42501" ? denied(n.ownerOnly) : transient();
  if (publish) refreshSite();
  revalidatePath("/w/[ws]/notes", "page");
  return { ok: true, number: data.number };
}

/** Autosave of the note editor. A published note changes on the site at once, like the site profile. */
export async function saveNote(noteId: string, input: NoteInput): Promise<AutosaveResult> {
  if (!z.uuid().safeParse(noteId).success) return invalid();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return invalid(n.invalid, parsed.error.issues[0]?.path[0]?.toString());
  const v = parsed.data;
  if (v.parent_id === noteId) return invalid(n.selfParent, "parent_id");
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_notes")
    .update({ body_uk: v.body_uk, body_en: v.body_en.trim() ? v.body_en : null, image: v.image as Json, tags: v.tags, parent_id: v.parent_id })
    .eq("id", noteId).select("status");
  if (error) {
    // The database refuses an empty published note and a thread outside the workspace.
    if (error.code === "23514") return invalid(n.emptyPublished, "body_uk");
    if (error.code === "22023") return invalid(n.invalid, "parent_id");
    return transient();
  }
  if (!data.length) return denied(n.ownerOnly);
  if (data[0]?.status === "published") refreshSite();
  return { ok: true };
}

/** «Опублікувати» / «Зняти з публікації». The first publication sets the date the site shows. */
export async function setNoteStatus(noteId: string, status: "draft" | "published"): Promise<{ ok: true } | Failure> {
  if (!z.uuid().safeParse(noteId).success || !["draft", "published"].includes(status)) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_notes").update({ status }).eq("id", noteId).select("id");
  if (error) return error.code === "23514" ? invalid(n.emptyPublished) : transient();
  if (!data.length) return denied(n.ownerOnly);
  refreshSite();
  revalidatePath("/w/[ws]/notes", "layout");
  return { ok: true };
}

/**
 * Deletes a note with its reactions, replies and uploaded picture, then returns to the list. A note that
 * continued it starts its own thread.
 */
export async function deleteNote(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const ws = z.string().min(1).max(100).parse(formData.get("ws"));
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_notes").delete().eq("id", id).select("image");
  if (error) return transient();
  if (!data.length) return denied(n.ownerOnly);
  const src = (data[0]?.image as { src?: unknown } | null)?.src;
  const path = typeof src === "string" ? src.split("/note-media/")[1] : undefined;
  if (path) await supabase.storage.from("note-media").remove([decodeURIComponent(path)]);
  refreshSite();
  revalidatePath(`/w/${ws}/notes`);
  redirect(`/w/${ws}/notes`);
}

/** Marks a reply read, or unread again. */
export async function markReplyRead(replyId: string, read: boolean): Promise<{ ok: true } | Failure> {
  if (!z.uuid().safeParse(replyId).success) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("note_replies")
    .update({ read_at: read ? new Date().toISOString() : null }).eq("id", replyId).select("id");
  if (error) return transient();
  if (!data.length) return denied(n.ownerOnly);
  revalidatePath("/w/[ws]", "layout");
  return { ok: true };
}
