import { createClient } from "@supabase/supabase-js";
import { env } from "@/shared/lib/env";
import { renderBriefPdf } from "@/domains/requests/pdf/brief";
import { briefFileName } from "@/domains/requests/file-name";
import type { BriefDocument } from "@/domains/requests/snapshot";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

/**
 * The client's copy of the project brief. POST with the one-time token from the submission (never a URL that
 * could leak through history or a referrer); the database checks the token's hash and its 30-day expiry.
 */
export async function POST(req: Request) {
  let body: { token?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400, headers: PRIVATE_HEADERS });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const locale = body.locale === "en" ? "en" : "uk";
  if (!/^[0-9a-f]{64}$/.test(token)) return new Response(null, { status: 400, headers: PRIVATE_HEADERS });

  const db = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("get_request_brief", { p_token: token });
  if (error) return new Response(null, { status: 502, headers: PRIVATE_HEADERS });
  if (!data) return new Response(null, { status: 404, headers: PRIVATE_HEADERS });

  const doc = data as unknown as BriefDocument;
  const pdf = await renderBriefPdf(doc, locale);
  const name = briefFileName(doc.content.project.name, doc.code, doc.content.submitted_at);
  return new Response(new Uint8Array(pdf), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
