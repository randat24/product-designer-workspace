import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/shared/lib/supabase/server";
import { PageHeader } from "@/shared/ui/page-header";
import { t } from "@/shared/i18n/ru";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: t.auth.account };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-[clamp(18px,4vw,56px)] py-10">
      <Link href="/app" className="text-meta font-semibold text-fg-secondary hover:text-fg">{t.auth.back}</Link>
      <PageHeader title={t.auth.account} />
      <p className="text-fg-secondary">{user?.email}</p>
      <section aria-labelledby="pw-h" className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
        <h2 id="pw-h" className="text-heading font-semibold">{t.auth.changePassword}</h2>
        <PasswordForm />
      </section>
    </main>
  );
}
