import type { Metadata } from "next";
import { t } from "@/shared/i18n/ru";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.title };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1">
        <p className="text-caption font-medium text-fg-secondary">{t.app.name}</p>
        <h1 className="text-title font-semibold">{t.auth.title}</h1>
        <p className="text-fg-secondary">{t.auth.lede}</p>
      </div>
      <LoginForm next={next ?? "/"} initialError={error ? t.auth.callbackFailed : undefined} />
    </main>
  );
}
