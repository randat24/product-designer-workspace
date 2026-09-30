"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/ru";

export type PasswordState = { ok?: boolean; error?: string } | undefined;

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 12) return { error: t.auth.passwordTooShort };
  if (password !== String(formData.get("confirm") ?? "")) return { error: t.auth.passwordMismatch };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { error: error.message } : { ok: true };
}
