import type { Metadata } from "next";
import { t } from "@/shared/i18n/ru";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.title };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(280px,420px)_1fr]">
      <aside className="flex flex-col justify-between gap-6 bg-rail p-8 text-rail-fg md:p-10">
        <p className="font-display text-[26px] leading-none font-bold uppercase md:text-[34px]">
          {t.auth.brand}
          <span className="mt-3 block font-sans text-sm font-medium normal-case opacity-70">{t.auth.brandLede}</span>
        </p>
        <p className="hidden text-[13px] opacity-60 md:block">{t.auth.chain}</p>
      </aside>
      <main className="flex items-center px-6 py-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="page-title">{t.auth.title}</h1>
            <p className="text-fg-secondary">{t.auth.lede}</p>
          </div>
          <LoginForm next={next ?? "/"} initialError={error ? t.auth.callbackFailed : undefined} />
        </div>
      </main>
    </div>
  );
}
