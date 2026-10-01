"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { env } from "@/shared/lib/env";
import { t } from "@/shared/i18n/ru";

export type LoginState = { error?: string } | undefined;

async function origin() {
  const h = await headers();
  return h.get("origin") ?? env.siteUrl;
}

function safeNext(next: FormDataEntryValue | null) {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && v !== "/" ? v : "/app";
}

export async function signInWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { error: t.auth.invalidEmail };
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: t.auth.passwordRequired };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  // One message for every failure so the form does not reveal which accounts exist.
  if (error) return { error: error.status === 429 ? t.auth.tooManyAttempts : t.auth.wrongCredentials };
  redirect(safeNext(formData.get("next")));
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export type ResetState = { sent?: boolean; error?: string } | undefined;

/**
 * Sends a password-recovery link. The link goes through /auth/callback (PKCE code → session) and lands on
 * /account?reset=1, where the person sets a new password. The answer is the same whether the account exists
 * or not, so the form does not reveal which emails are registered.
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { error: t.auth.invalidEmail };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent("/account?reset=1")}`,
  });
  if (error?.status === 429) return { error: t.auth.tooManyAttempts };
  return { sent: true };
}
