import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/site/content";
import { pageMetadata } from "@/site/seo";
import { container } from "@/site/ui";
import { ConsentControls } from "@/site/consent-banner";
import { gaId } from "@/site/analytics/google-analytics";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = dict(locale);
  return pageMetadata({ locale, path: "/privacy", title: d.privacy.title, description: d.privacy.lede });
}

/** What the site collects (Vercel Web Analytics; GA4 only after consent) and where to change the choice. */
export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const p = dict(locale).privacy;
  // The width limit sits on the article: next to `container` its max-width loses to the 1440 px one.
  return (
    <div className={`${container} pb-20 pt-12`}>
      <article className="flex max-w-[760px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <h1 className="page-title">{p.title}</h1>
          <p className="text-[clamp(17px,2vw,20px)] leading-[1.55] text-fg-secondary">{p.lede}</p>
        </header>
        {p.sections.map((s) => (
          <section key={s.title} id={s.id} className="flex scroll-mt-24 flex-col gap-2 border-t border-line pt-5">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">{s.title}</h2>
            <p className="text-[17px] leading-[1.6]">{s.body}</p>
          </section>
        ))}
        {gaId() && <ConsentControls labels={p} />}
        <p className="text-[13px] text-fg-secondary">{p.updated}</p>
      </article>
    </div>
  );
}
