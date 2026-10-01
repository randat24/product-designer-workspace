import type { MetadataRoute } from "next";
import { LOCALES, type Locale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { absoluteUrl } from "@/site/seo";

// Built from the real routes and the published cases, so a newly published case appears here on
// its own (revalidated with the case data). Sample cases (placeholder content) are left out:
// they are noindex until real content replaces them.
export const revalidate = 3600;

/** Date of the last content change of the static pages (content.ts). Update with the content. */
const CONTENT_UPDATED = "2026-09-30";

type Entry = MetadataRoute.Sitemap[number];

function entry(path: string, lastModified: string, priority: number, changeFrequency: Entry["changeFrequency"]): Entry[] {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(`/${l}${path}`)]));
  return LOCALES.map((l: Locale) => ({
    url: absoluteUrl(`/${l}${path}`),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cases = (await getCases("uk")).filter((c) => !c.sample);
  const newest = cases.map((c) => c.updatedAt ?? CONTENT_UPDATED).sort().at(-1) ?? CONTENT_UPDATED;
  const latest = newest > CONTENT_UPDATED ? newest : CONTENT_UPDATED;
  return [
    ...entry("", latest, 1, "monthly"),
    ...entry("/cases", latest, 0.8, "monthly"),
    ...entry("/about", CONTENT_UPDATED, 0.7, "yearly"),
    ...entry("/start-project", "2026-10-01", 0.6, "yearly"),
    ...entry("/privacy", "2026-10-01", 0.2, "yearly"),
    ...cases.flatMap((c) => entry(`/cases/${c.slug}`, c.updatedAt ?? CONTENT_UPDATED, 0.9, "yearly")),
  ];
}
