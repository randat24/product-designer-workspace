"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/field";
import { t } from "@/shared/i18n/uk";
import { signInWithGoogle, signInWithPassword, type LoginState } from "./actions";

// Show the Google button only once the provider is enabled in Supabase → Authentication → Providers.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "on";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signInWithPassword, initialError ? { error: initialError } : undefined);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <Field label={t.auth.email} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="username" required autoFocus
            placeholder={t.auth.emailPlaceholder} aria-invalid={!!state?.error} />
        </Field>
        <Field label={t.auth.password} htmlFor="password" error={state?.error}>
          <Input id="password" name="password" type="password" autoComplete="current-password" required
            aria-invalid={!!state?.error} aria-describedby={state?.error ? "password-error" : undefined} />
        </Field>
        <Button type="submit" disabled={pending}>{pending ? t.auth.signingIn : t.auth.signIn}</Button>
        <Link href="/login/forgot" className="hit w-fit text-meta font-semibold text-fg-secondary underline underline-offset-4 hover:text-fg">
          {t.auth.forgot}
        </Link>
      </form>
      {GOOGLE_ENABLED && (
        <>
          <div className="flex items-center gap-3 text-caption text-fg-secondary">
            <span className="h-px flex-1 bg-line" />{t.auth.or}<span className="h-px flex-1 bg-line" />
          </div>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="secondary" className="w-full">{t.auth.google}</Button>
          </form>
        </>
      )}
    </div>
  );
}
