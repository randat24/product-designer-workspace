import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/site/content";
import { INTAKE } from "@/site/intake/content";
import { IntakeWizard } from "@/site/intake/wizard";
import { pageMetadata } from "@/site/seo";
import { container } from "@/site/ui";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = INTAKE[locale];
  return pageMetadata({ locale, path: "/start-project", title: t.seo.title, description: t.seo.description });
}

/**
 * «Обговорити проєкт»: the public project request. The page itself is indexable; everything the visitor
 * types stays in the browser until it is submitted, and the result has no public URL.
 */
export default async function StartProject({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
  return (
    <div className={`${container} max-w-[800px] pb-20 pt-10 sm:pt-14`}>
      <IntakeWizard locale={locale} turnstileSiteKey={siteKey} privacyHref={`/${locale}/privacy#requests`} />
    </div>
  );
}
