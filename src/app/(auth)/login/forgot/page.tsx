import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/shared/i18n/ru";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: t.auth.forgotTitle };

/** Password recovery: same two-column layout as the sign-in page. */
export default function ForgotPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(280px,420px)_1fr]">
      <aside className="flex flex-col justify-between gap-6 bg-rail p-8 text-rail-fg md:p-10">
        <p className="font-display text-display-sm leading-[1.1] font-bold uppercase md:text-display-md">
          {t.auth.brand}
          <span className="mt-3 block font-sans text-sm font-medium normal-case opacity-70">{t.auth.brandLede}</span>
        </p>
        <p className="hidden text-meta opacity-60 md:block">{t.auth.chain}</p>
      </aside>
      <main className="flex items-center px-6 py-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="page-title">{t.auth.forgotTitle}</h1>
            <p className="text-fg-secondary">{t.auth.forgotLede}</p>
          </div>
          <ForgotForm />
          <Link href="/login" className="hit w-fit text-meta font-semibold underline underline-offset-4">{t.auth.backToLogin}</Link>
        </div>
      </main>
    </div>
  );
}
