import { countProcess } from "@/domains/cases/process";
import { collectTrace } from "@/domains/cases/trace";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/site/content";
import { CaseArticle } from "@/site/case-article";
import { snapshotProblem, snapshotToCase } from "@/site/case-snapshot";
import { createClient } from "@/shared/lib/supabase/server";
import { t } from "@/shared/i18n/uk";

// The draft of a case, rendered by the site's own case page (docs/HANDOFF_TRIAGE.md, V06). Only members of the
// project's workspace can read a draft (row-level security), so this page needs the tool's sign-in. Never cached,
// never indexed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Params = Promise<{ locale: string; slug: string }>;

export default async function CasePreview({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${locale}/cases/${slug}/preview`)}`);
  const { data } = await supabase.from("case_studies").select("slug, draft, project_id").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const { data: project } = await supabase.from("projects").select("slug, workspaces(slug)").eq("id", data.project_id).maybeSingle();
  const editor = project?.workspaces ? `/w/${project.workspaces.slug}/p/${project.slug}/case` : "/app";
  // Counted and collected live, as «Опублікувати» will.
  const [process, trace] = await Promise.all([countProcess(supabase, data.project_id), collectTrace(supabase, data.project_id)]);
  const item = snapshotToCase(data.slug, { ...(data.draft as object), process, trace }, locale);

  const banner = (
    <div role="note" className="mb-8 border-y-[1.5px] border-dashed border-fg bg-subtle">
      <p className="mx-auto flex w-full max-w-[1120px] flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-[15px] sm:px-8">
        <span className="font-semibold">{t.caseEditor.previewBanner}</span>
        <Link href={editor} className="font-semibold underline underline-offset-4">{t.caseEditor.backToEditor}</Link>
      </p>
    </div>
  );
  if (!item) {
    // Nothing to render yet (no title) or a shape the page cannot show: say so instead of a 404.
    return (
      <article className="pb-20 pt-10">
        {banner}
        <p role="alert" className="mx-auto max-w-[1120px] px-4 text-[18px] sm:px-8">
          {t.caseEditor.publishInvalid} <span className="text-fg-secondary">({snapshotProblem(data.draft, locale)})</span>
        </p>
      </article>
    );
  }
  return <CaseArticle item={item} locale={locale} next={null} banner={banner} />;
}
