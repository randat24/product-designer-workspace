"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";
import { requestPasswordReset, type ResetState } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, undefined);
  if (state?.sent) return <p role="status" className="rounded-panel border border-line bg-surface p-4 text-body">{t.auth.linkSent}</p>;
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <Field label={t.auth.email} htmlFor="email" error={state?.error}>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus
          placeholder={t.auth.emailPlaceholder} aria-invalid={!!state?.error}
          aria-describedby={state?.error ? "email-error" : undefined} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? t.auth.sending : t.auth.sendLink}</Button>
    </form>
  );
}
