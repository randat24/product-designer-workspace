"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <Field label={t.auth.newPassword} htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required autoFocus={autoFocus}
          aria-describedby="password-hint" />
        <p id="password-hint" className="text-caption text-fg-secondary">{t.auth.passwordHint}</p>
      </Field>
      <Field label={t.auth.confirmPassword} htmlFor="confirm" error={state?.error}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required aria-invalid={!!state?.error}
          aria-describedby={state?.error ? "confirm-error" : undefined} />
      </Field>
      <Button type="submit" disabled={pending} className="self-start">{t.auth.save}</Button>
      {state?.ok && <p role="status" className="text-meta font-semibold text-success">{t.auth.passwordSaved}</p>}
    </form>
  );
}
