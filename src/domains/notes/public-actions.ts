"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/shared/lib/env";
import type { Database } from "@/types/database";
import { REACTIONS, type Reaction } from "./schema";

export type ReactResult = { ok: true; counts: Partial<Record<Reaction, number>> } | { ok: false; error: "rate_limit" | "unavailable" };

/**
 * The visitor, as the database sees them: a keyed hash of the IP (the IP itself is never stored), and the
 * server secret the reaction function requires (the same one as the project request form).
 */
async function visitor() {
  const secret = process.env.INTAKE_SUBMIT_SECRET?.trim();
  if (!secret) return null;
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const hash = createHmac("sha256", secret).update(`note:${ip ?? "unknown"}`).digest("hex");
  const db = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return { secret, hash, db };
}

/** One click on a reaction: set (`on`) or take back. Returns the note's counts after it. */
export async function reactToNote(number: number, kind: Reaction, on: boolean): Promise<ReactResult> {
  if (!Number.isInteger(number) || number < 1 || !REACTIONS.includes(kind) || typeof on !== "boolean") return { ok: false, error: "unavailable" };
  const v = await visitor();
  if (!v) {
    console.error("note reaction: INTAKE_SUBMIT_SECRET is not set");
    return { ok: false, error: "unavailable" };
  }
  const { data, error } = await v.db.rpc("note_react", { p_number: number, p_kind: kind, p_on: on, p_secret: v.secret, p_voter_hash: v.hash });
  if (error) {
    if (error.message !== "rate_limited") console.error("note reaction:", error.code, error.message);
    return { ok: false, error: error.message === "rate_limited" ? "rate_limit" : "unavailable" };
  }
  return { ok: true, counts: (data ?? {}) as Partial<Record<Reaction, number>> };
}
