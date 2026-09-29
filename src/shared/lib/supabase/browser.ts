"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "@/shared/lib/env";

/** Client Components. Uses the session cookie; RLS applies. Used for direct uploads to Storage. */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
