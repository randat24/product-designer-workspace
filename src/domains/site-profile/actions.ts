"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/uk";
import { denied, invalid, transient } from "@/shared/lib/action-result";
import type { AutosaveResult } from "@/shared/ui/autosave";
import type { Json } from "@/types/database";
import { PROFILE_TAG } from "@/site/profile-source";
import { siteProfileLocaleSchema, type SiteProfileLocale } from "@/site/site-profile";
import { SITE_LOCALES } from "./locales";

const sectionLabels = t.siteProfile.sections as Record<string, string>;

/** Saves one language of the workspace's site profile; the other language stays as stored. The site shows it at once. */
export async function saveSiteProfile(workspaceId: string, locale: string, input: SiteProfileLocale): Promise<AutosaveResult> {
  if (!z.uuid().safeParse(workspaceId).success || !(SITE_LOCALES as readonly string[]).includes(locale)) return invalid();
  const parsed = siteProfileLocaleSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]?.toString();
    return invalid(`${t.siteProfile.invalid}${field && sectionLabels[field] ? ` «${sectionLabels[field]}»` : ""}.`, field);
  }
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("site_profile").select("content").eq("workspace_id", workspaceId).maybeSingle();
  if (readError) return transient();
  const stored = current?.content && typeof current.content === "object" && !Array.isArray(current.content) ? current.content : {};
  const content = { ...stored, [locale]: parsed.data } as Json;
  if (current) {
    const { data, error } = await supabase.from("site_profile").update({ content }).eq("workspace_id", workspaceId).select("workspace_id");
    if (error) return transient();
    // Row-level security filters the update instead of failing: nothing written means no right to edit.
    if (!data.length) return denied(t.siteProfile.readOnly);
  } else {
    // No row seen: either none yet, or it is hidden from a non-owner, whose insert RLS then refuses.
    const { error } = await supabase.from("site_profile").insert({ workspace_id: workspaceId, content });
    if (error) return error.code === "42501" || error.code === "23505" ? denied(t.siteProfile.readOnly) : transient();
  }
  revalidateTag(PROFILE_TAG);
  revalidatePath("/[locale]/about", "page");
  return { ok: true };
}
