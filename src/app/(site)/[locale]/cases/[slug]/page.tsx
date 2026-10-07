import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { CaseArticle } from "@/site/case-article";
import { pageMetadata } from "@/site/seo";

// Cases published later in the tool are rendered on first visit and then cached.
export const revalidate = 60;
// Cases published after the build render on first visit (the layout limits only the locale).
export const dynamicParams = true;

export async function generateStaticParams() {
  const lists = await Promise.all(LOCALES.map(async (locale) => ({ locale, cases: await getCases(locale) })));
  return lists.flatMap(({ locale, cases }) => cases.map((c) => ({ locale, slug: c.slug })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  // Cases unreadable right now: the page itself shows «temporarily unavailable» (error.tsx); metadata stays empty.
  const item = (await getCases(locale).catch(() => [])).find((c) => c.slug === slug);
  if (!item) return {};
  // Placeholder cases stay out of search results until real content replaces them.
  return pageMetadata({
    locale,
    path: `/cases/${slug}`,
    title: item.seo?.title ?? item.title,
    description: item.seo?.description ?? item.summary,
    type: "article",
    caseSlug: slug,
    noindex: item.sample,
  });
}

export default async function CasePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const cases = await getCases(locale);
  const index = cases.findIndex((c) => c.slug === slug);
  const item = cases[index];
  if (!item) notFound();
  const next = cases.length > 1 ? cases[(index + 1) % cases.length]! : null;
  return <CaseArticle item={item} locale={locale} next={next} position={{ index: index + 1, total: cases.length }} />;
}
