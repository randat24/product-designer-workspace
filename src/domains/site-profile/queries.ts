import "server-only";
import { createClient } from "@/shared/lib/supabase/server";
import { readProfileLocale, type SiteProfile } from "@/site/site-profile";
import { SITE_LOCALES } from "./locales";

/**
 * The workspace's site profile as its owner sees it, and whether the site shows this workspace (the request form
 * delivers here). Both tables are owner-only, so another role gets an empty profile and `isSite: false`.
 */
export async function getSiteProfileForEditor(workspaceId: string): Promise<{ profile: SiteProfile; isSite: boolean }> {
  const supabase = await createClient();
  const [row, intake] = await Promise.all([
    supabase.from("site_profile").select("content").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("intake_settings").select("workspace_id").eq("workspace_id", workspaceId).maybeSingle(),
  ]);
  if (row.error) throw row.error;
  if (intake.error) throw intake.error;
  const profile: SiteProfile = {};
  for (const l of SITE_LOCALES) {
    const value = readProfileLocale(row.data?.content, l);
    if (value) profile[l] = value;
  }
  return { profile, isSite: !!intake.data };
}
