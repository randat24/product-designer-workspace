import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { JsonLd } from "@/site/json-ld";
import { graph, pageMetadata, personLd, websiteLd } from "@/site/seo";
import { SignalHero, WORK_ANCHOR } from "@/site/signal/hero";
import { HERO_TRACE_CASE } from "@/site/signal/hero-trace";
import { signalCopy } from "@/site/signal/home-content";
import { SectionEyebrow, SignalAbout, SignalContact, SignalProcess, SignalServices } from "@/site/signal/home-sections";
import { SignalWork } from "@/site/signal/work";
import { container } from "@/site/ui";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "", title: d.seo.home.title, description: d.seo.home.description, absoluteTitle: true, type: "profile" });
}

/** Home (SIGNAL package, index.html): hero, selected work, services, the designer, the approach, contact. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dict(locale);
  const s = signalCopy(locale);
  // Sample cases (illustrative numbers) stay on the work page with their badge, not on the front page.
  const cases = await getCases(locale);
  const shown = cases.filter((c) => !c.sample).slice(0, 4);

  return (
    <>
      <JsonLd data={graph(websiteLd(locale), personLd(locale))} />
      <SignalHero locale={locale} traceCase={cases.find((c) => c.slug === HERO_TRACE_CASE)} />
      <section id={WORK_ANCHOR} className="sg-section sg-work" aria-labelledby="work-heading">
        <div className={container}>
          <SignalWork
            cases={shown}
            locale={locale}
            location="home"
            heading={
              <div>
                <SectionEyebrow index={1}>{s.work.eyebrow}</SectionEyebrow>
                <h2 className="sg-heading" id="work-heading">
                  {s.work.title}<span className="sg-heading-count">[{String(shown.length).padStart(2, "0")}]</span>
                </h2>
              </div>
            }
          />
          {cases.length > shown.length && (
            <p className="mt-10">
              <Link href={`/${locale}/cases`} className="sg-link">{d.home.all} →</Link>
            </p>
          )}
        </div>
      </section>
      {/* Sections after the work, in page order; their «NN /» numbers come from this order. */}
      {[SignalServices, SignalAbout, SignalProcess, SignalContact].map((Section, i) => (
        <Section key={i} locale={locale} index={i + 2} />
      ))}
    </>
  );
}
