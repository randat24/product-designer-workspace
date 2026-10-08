import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { JsonLd } from "@/site/json-ld";
import { graph, pageMetadata, personLd, websiteLd } from "@/site/seo";
import { SignalHero, WORK_ANCHOR } from "@/site/signal/hero";
import { signalCopy } from "@/site/signal/home-content";
import { SectionEyebrow, SignalAbout, SignalContact, SignalProcess } from "@/site/signal/home-sections";
import { SignalWork } from "@/site/signal/work";
import { container } from "@/site/ui";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "", title: d.seo.home.title, description: d.seo.home.description, absoluteTitle: true, type: "profile" });
}

/** Home (SIGNAL package, index.html): hero, selected work, the designer, the approach, contact. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const s = signalCopy(locale);
  const cases = await getCases(locale);
  const shown = cases.slice(0, 4);

  return (
    <>
      <JsonLd data={graph(websiteLd(locale), personLd(locale))} />
      <SignalHero locale={locale} />
      <section id={WORK_ANCHOR} className="sg-section sg-work" aria-labelledby="work-heading">
        <div className={container}>
          <SignalWork
            cases={shown}
            locale={locale}
            location="home"
            heading={
              <div>
                <SectionEyebrow index={s.work.index}>{s.work.eyebrow}</SectionEyebrow>
                <h2 className="sg-heading" id="work-heading">
                  {s.work.title}<span className="sg-heading-count">[{String(shown.length).padStart(2, "0")}]</span>
                </h2>
              </div>
            }
          />
          {cases.length > shown.length && (
            <p className="mt-10">
              <Link href={`/${locale}/cases`} className="hit border-b border-current text-[14px] font-semibold">{d.home.all} →</Link>
            </p>
          )}
        </div>
      </section>
      <SignalAbout locale={locale} />
      <SignalProcess locale={locale} />
      <SignalContact locale={locale} />
    </>
  );
}
