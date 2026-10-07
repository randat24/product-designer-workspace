import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Locale } from "./content";
import { readProfileLocale, type SiteProfileLocale } from "./site-profile";

/** The profile is re-read at most once a minute; saving it in the tool also refreshes the page at once. */
export const PROFILE_REVALIDATE = 60;
export const PROFILE_TAG = "profile";

/**
 * The «Про мене» page as the owner wrote it in the tool («Профіль сайту»), one language. Unlike the cases, a
 * failure here never breaks the page: no database settings, an error or an unwritten profile give null, and the
 * page shows the text from the code.
 */
export async function getSiteProfile(locale: Locale): Promise<SiteProfileLocale | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.SITE_SAMPLE_CASES === "1" || !url || !key) return null;
  try {
    const db = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: PROFILE_REVALIDATE, tags: [PROFILE_TAG] } }),
      },
    });
    const { data, error } = await db.rpc("site_profile");
    if (error) throw error;
    return readProfileLocale(data, locale);
  } catch (e) {
    console.error("profile: the site profile could not be read; the page shows the text from the code", e);
    return null;
  }
}
