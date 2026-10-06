"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { figmaFileUrl } from "@/shared/lib/figma";
import type { Json } from "@/types/database";
import { t } from "@/shared/i18n/uk";
import { denied, invalid, transient, type Failure } from "@/shared/lib/action-result";
import { snapshotProblem } from "@/site/case-snapshot";
import type { AutosaveResult } from "@/shared/ui/autosave";
import { CASE_LOCALES, caseDraftSchema, mergeDraft, type CaseDraft, type CaseLocale } from "./schema";

/** Creates a draft case for a project; the site address follows the project slug. */
export async function createCaseStudy(formData: FormData) {
  const projectId = z.string().uuid().parse(formData.get("projectId"));
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").select("slug").eq("id", projectId).single();
  if (error) throw error;

  // Slugs are unique across the whole site: slug, slug-2, slug-3…
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? project.slug : `${project.slug.slice(0, 55)}-${attempt}`;
    const { error: insertError } = await supabase.from("case_studies").insert({ project_id: projectId, slug });
    if (!insertError) break;
    if (insertError.code !== "23505") throw insertError;
    // One case per project: a duplicate project_id also raises 23505 — nothing to create then.
    const { count } = await supabase.from("case_studies").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    if (count) break;
  }
  revalidatePath("/w", "layout");
}

/**
 * Case settings: workflow status (draft / review) and the 18+, sample and Figma marks. The marks go into the
 * draft like the texts do, so the site changes only on «Опублікувати». A published case keeps its status here:
 * it is taken down with «Зняти з публікації» in the case editor.
 */
export async function setCaseStatus(formData: FormData) {
  const caseId = z.string().uuid().parse(formData.get("caseId"));
  const status = z.enum(["draft", "review"]).safeParse(formData.get("caseStatus")).data;
  const adult = formData.get("adult") === "1";
  const sample = formData.get("sample") === "1";
  // Figma link: empty clears it; anything that is not a Figma file link is refused rather than saved.
  const figmaInput = String(formData.get("figma") ?? "").trim();
  const figma = figmaInput ? figmaFileUrl(figmaInput) : null;
  if (figmaInput && !figma) throw new Error("setCaseStatus: not a Figma file link");
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("case_studies").select("draft, status").eq("id", caseId).single();
  if (readError) throw readError;
  // The marks live in each language of the snapshot, next to the rest of the case, so the site reads them as is.
  const draft = { ...((current.draft ?? {}) as Record<string, Record<string, unknown>>) };
  for (const locale of ["uk", "en"]) {
    if (!draft[locale]) continue;
    const { figma: _old, ...rest } = draft[locale];
    draft[locale] = { ...rest, adult, sample, ...(figma ? { figma } : {}) };
  }
  const nextStatus = current.status === "published" ? "published" : (status ?? current.status);
  const { error } = await supabase.from("case_studies").update({ status: nextStatus, draft: draft as Json }).eq("id", caseId);
  if (error) throw error;
  revalidatePath("/w", "layout");
}

/** The site re-reads cases on its own (revalidate = 60); this refreshes the "cases" data cache and its pages now. */
function refreshSite() {
  revalidateTag("cases");
  revalidatePath("/[locale]", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/w", "layout");
}

type PublishResult = { ok: true } | Failure;

/**
 * «Опублікувати»: the draft becomes what the site shows (docs/HANDOFF_TRIAGE.md, V06). Refused when the draft
 * has no Ukrainian title or a shape the case page cannot render, so a broken case never reaches the site.
 */
export async function publishCase(caseId: string): Promise<PublishResult> {
  if (!z.uuid().safeParse(caseId).success) return invalid();
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("case_studies").select("draft").eq("id", caseId).maybeSingle();
  if (readError) return transient();
  if (!current) return denied(t.caseEditor.readOnly);
  if (snapshotProblem(current.draft, "uk") || snapshotProblem(current.draft, "en")) return invalid(t.caseEditor.publishInvalid);
  const { data, error } = await supabase.from("case_studies")
    .update({ content: current.draft, status: "published", content_updated_at: new Date().toISOString() })
    .eq("id", caseId).select("id");
  if (error) return transient();
  if (!data.length) return denied(t.caseEditor.readOnly);
  refreshSite();
  return { ok: true };
}

/** «Зняти з публікації»: the case leaves the site (list, page, sitemap); its draft and last snapshot stay. */
export async function unpublishCase(caseId: string): Promise<PublishResult> {
  if (!z.uuid().safeParse(caseId).success) return invalid();
  const supabase = await createClient();
  const { data, error } = await supabase.from("case_studies").update({ status: "draft" }).eq("id", caseId).select("id");
  if (error) return transient();
  if (!data.length) return denied(t.caseEditor.readOnly);
  refreshSite();
  return { ok: true };
}

/**
 * Saves one language of the case from the editor (autosave) into the draft; the site changes only on «Опублікувати».
 * No conflict check: both language tabs and the settings form write this row from the same page; each save merges
 * only its own language into the current draft.
 */
export async function saveCaseDraft(caseId: string, locale: CaseLocale, input: CaseDraft): Promise<AutosaveResult> {
  if (!z.uuid().safeParse(caseId).success || !CASE_LOCALES.includes(locale)) return invalid();
  const parsed = caseDraftSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(t.caseEditor.invalid, issue?.path[0]?.toString());
  }
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("case_studies").select("draft").eq("id", caseId).single();
  if (readError) return transient();
  const draft = mergeDraft(current.draft, locale, parsed.data);
  const { data, error } = await supabase.from("case_studies").update({ draft: draft as Json }).eq("id", caseId).select("id");
  if (error) return transient();
  // Row-level security filters the update instead of failing: nothing written means no right to edit.
  if (!data.length) return denied(t.caseEditor.readOnly);
  // The editor page re-renders so its publish bar knows the draft now differs from the site.
  revalidatePath("/w/[ws]/p/[project]/case", "page");
  return { ok: true };
}
