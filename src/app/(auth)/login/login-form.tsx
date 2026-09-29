"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, initialError ? { error: initialError } : undefined);

  if (state?.sentTo) {
    return <p role="status" className="rounded-md border border-line bg-surface p-4">{t.auth.sent(state.sentTo)}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <Field label={t.auth.email} htmlFor="email" error={state?.error}>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus
            placeholder={t.auth.emailPlaceholder} aria-invalid={!!state?.error}
            aria-describedby={state?.error ? "email-error" : undefined} />
        </Field>
        <Button type="submit" disabled={pending}>{t.auth.sendLink}</Button>
      </form>
      <div className="flex items-center gap-3 text-caption text-fg-secondary">
        <span className="h-px flex-1 bg-line" />{t.auth.or}<span className="h-px flex-1 bg-line" />
      </div>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" className="w-full">{t.auth.google}</Button>
      </form>
    </div>
  );
}
