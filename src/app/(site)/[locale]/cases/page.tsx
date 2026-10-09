import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { JsonLd } from "@/site/json-ld";
import { breadcrumbLd, casesCollectionLd, graph, localeUrl, pageMetadata } from "@/site/seo";
import { SignalWork } from "@/site/signal/work";
import { container } from "@/site/ui";

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
    <div className={`${container} pb-20 pt-12 sm:pt-16`}>
      <JsonLd
        data={graph(
          casesCollectionLd(locale, cases, d.seo.cases.title, d.seo.cases.description),
          breadcrumbLd([
            { name: d.ui.home, url: localeUrl(locale, "") },
            { name: d.cases.title, url: localeUrl(locale, "/cases") },
          ]),
        )}
      />
      <SignalWork
        cases={cases}
        locale={locale}
        location="cases"
        heading={
          <header className="flex max-w-[640px] flex-col gap-5">
            <p className="sg-eyebrow text-fg-secondary"><span className="sg-section-index">{String(cases.length).padStart(2, "0")} /</span>{d.nav.work}</p>
            <h1 className="sg-heading">{d.cases.title}</h1>
            <p className="sg-lead">{d.cases.lead}</p>
          </header>
        }
      />
    </div>
  );
}
