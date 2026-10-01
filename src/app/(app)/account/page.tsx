import type { Metadata } from "next";
import { createClient } from "@/shared/lib/supabase/server";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";
import { PasswordForm } from "./password-form";
import { BackLink } from "@/shared/ui/back-link";

export const metadata: Metadata = { title: t.auth.account };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  // Arrived from the recovery email: say why they are here and put the cursor in the new-password field.
  const reset = (await searchParams).reset === "1";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-[clamp(18px,4vw,56px)] py-10">
      <BackLink href="/app" className="mb-0">{t.auth.back}</BackLink>
      <PageHeader title={t.auth.account} />
      <p className="text-fg-secondary">{user?.email}</p>
      {reset && <p role="status" className="rounded-panel border-[1.5px] border-fg bg-surface p-4 text-body font-semibold">{t.auth.resetBanner}</p>}
      <section aria-labelledby="pw-h" className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
        <h2 id="pw-h" className="text-heading font-semibold">{t.auth.changePassword}</h2>
        <PasswordForm autoFocus={reset} />
      </section>
    </main>
  );
}
