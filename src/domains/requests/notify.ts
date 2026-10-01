import "server-only";
import { env } from "@/shared/lib/env";
import { buildNewRequestNotice } from "./notification";
import type { RequestData } from "./schema";

/**
 * Notification about a new request. Delivery is optional and never blocks the submission: the database is the
 * source of truth, e-mail is only a heads-up. Without RESEND_API_KEY / INTAKE_NOTIFY_EMAIL nothing is sent.
 * Without a verified domain Resend delivers only to the address of the Resend account owner — enough here.
 */
export async function notifyNewRequest(d: RequestData, code: string): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const to = process.env.INTAKE_NOTIFY_EMAIL?.trim();
  if (!key || !to) return;
  const from = process.env.INTAKE_EMAIL_FROM?.trim() || "Portfolio <onboarding@resend.dev>";
  const notice = buildNewRequestNotice(d, code, `${env.siteUrl}/app/requests/${encodeURIComponent(code)}`);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: notice.subject, text: notice.text, html: notice.html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("project request: notification failed", res.status, code);
  } catch (e) {
    console.error("project request: notification failed", (e as Error).name, code);
  }
}
