"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/shared/lib/env";
import type { Database, Json } from "@/types/database";
import { requestSchema, toDbPayload } from "./schema";
import { notifyNewRequest } from "./notify";
import { verifyTurnstile } from "./turnstile";

export type SubmitMeta = {
  /** uuid of the draft: a retry (double click, network) returns the same request. */
  idempotencyKey: string;
  /** Hidden field; people never fill it. */
  honeypot?: string;
  /** Date.now() when the form was opened. */
  startedAt?: number;
  turnstileToken?: string;
};

export type SubmitResult =
  | { ok: true; code: string; token: string; submittedAt: string; projectName: string | null; duplicate: boolean }
  | { ok: false; error: "validation"; fields: string[] }
  | { ok: false; error: "spam" | "captcha" | "rate_limit" | "unavailable" | "server" };

const MAX_PAYLOAD = 64 * 1024;
const MIN_FILL_MS = 8000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The public project request. Runs on the server only: validates the whole form again, checks the anti-spam
 * signals and calls submit_project_request with the server secret. The database is the source of truth;
 * e-mail notifications come after a successful save and never block it.
 */
export async function submitProjectRequest(input: unknown, meta: SubmitMeta): Promise<SubmitResult> {
  if (JSON.stringify(input ?? null).length > MAX_PAYLOAD) return { ok: false, error: "validation", fields: ["payload"] };
  if (meta.honeypot || (meta.startedAt && Date.now() - meta.startedAt < MIN_FILL_MS)) return { ok: false, error: "spam" };
  if (!UUID.test(meta.idempotencyKey ?? "")) return { ok: false, error: "validation", fields: ["request"] };

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation", fields: [...new Set(parsed.error.issues.map((i) => i.path.join(".")))] };
  }

  const secret = process.env.INTAKE_SUBMIT_SECRET?.trim();
  if (!secret) {
    console.error("project request: INTAKE_SUBMIT_SECRET is not set");
    return { ok: false, error: "unavailable" };
  }

  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(meta.turnstileToken, ip))) return { ok: false, error: "captcha" };
  // The IP is never stored: only a keyed hash, for rate limiting.
  const ipHash = createHmac("sha256", secret).update(ip ?? "unknown").digest("hex");

  const db = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("submit_project_request", {
    p_payload: toDbPayload(parsed.data) as unknown as Json,
    p_secret: secret,
    p_ip_hash: ipHash,
    p_idempotency_key: meta.idempotencyKey,
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg === "rate_limited") return { ok: false, error: "rate_limit" };
    if (msg.startsWith("invalid:")) return { ok: false, error: "validation", fields: [msg.slice(8)] };
    if (msg === "intake_disabled" || msg === "forbidden") {
      console.error("project request:", msg);
      return { ok: false, error: "unavailable" };
    }
    console.error("project request: database error", error.code);
    return { ok: false, error: "server" };
  }
  const r = data as { code: string; token: string; submitted_at: string; project_name: string | null; duplicate: boolean };
  // After the response: a slow or failing mail service never delays or breaks the submission.
  if (!r.duplicate) after(() => notifyNewRequest(parsed.data, r.code));
  return { ok: true, code: r.code, token: r.token, submittedAt: r.submitted_at, projectName: r.project_name, duplicate: r.duplicate };
}
