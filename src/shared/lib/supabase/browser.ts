"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/** Client Components. Uses the session cookie; RLS applies. Used for direct uploads to Storage. */
export function createBrowserSupabase() {
  // NEXT_PUBLIC_* are inlined at build time.
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
