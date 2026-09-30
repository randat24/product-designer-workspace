import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { JsonLd } from "@/site/json-ld";
import { breadcrumbLd, graph, localeUrl, pageMetadata } from "@/site/seo";
import { CaseCard, container } from "@/site/ui";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "/cases", title: d.seo.cases.title, description: d.seo.cases.description });
}

export default async function Cases({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const cases = await getCases(locale);

  return (
    <div className={`${container} flex flex-col gap-10 pb-20 pt-12`}>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.cases.title, url: localeUrl(locale, "/cases") },
          ]),
        )}
      />
      <header className="flex max-w-[640px] flex-col gap-4">
        <h1 className="page-title">{d.cases.title}</h1>
        <p className="text-[18px] text-fg-secondary">{d.cases.lead}</p>
      </header>
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
        {cases.map((item) => (
          <CaseCard key={item.slug} item={item} locale={locale} label={d.cases.placeholder} />
        ))}
      </div>
    </div>
  );
}
