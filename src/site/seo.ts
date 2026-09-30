import type { Metadata } from "next";
import { getSiteUrl, isIndexable } from "@/shared/lib/site-url";
import { CONTACTS, LOCALES, dict, type Case, type Locale } from "./content";

// SEO for the public site. Every page builds its metadata here, so canonical URLs, hreflang,
// Open Graph, Twitter and robots stay consistent. Paths are locale-less: "" (home), "/about",
// "/cases", "/cases/<slug>".

const OG_LOCALE: Record<Locale, string> = { uk: "uk_UA", en: "en_US" };

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localeUrl(locale: Locale, path: string): string {
  return absoluteUrl(`/${locale}${path}`);
}

/** Open Graph image of a page: the site card, or a case card when a slug is given. */
export function ogImageUrl(locale: Locale, slug?: string): string {
  const q = new URLSearchParams({ locale });
  if (slug) q.set("case", slug);
  return absoluteUrl(`/og?${q.toString()}`);
}

type PageMeta = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** Home uses the title as is; other pages get "| Name" from the layout template. */
  absoluteTitle?: boolean;
  noindex?: boolean;
  caseSlug?: string;
  type?: "website" | "article" | "profile";
};

export function pageMetadata(p: PageMeta): Metadata {
  const d = dict(p.locale);
  const url = localeUrl(p.locale, p.path);
  const languages: Record<string, string> = Object.fromEntries(LOCALES.map((l) => [l, localeUrl(l, p.path)]));
  // x-default: the language-picking root for the home page, the Ukrainian page elsewhere.
  languages["x-default"] = p.path === "" ? absoluteUrl("/") : localeUrl("uk", p.path);
  const index = isIndexable() && !p.noindex;
  const image = { url: ogImageUrl(p.locale, p.caseSlug), width: 1200, height: 630, alt: p.title };

  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: { canonical: url, languages },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : // Sample pages on production: out of the index, links still followed. Previews: neither.
        { index: false, follow: isIndexable() },
    openGraph: {
      type: p.type ?? "website",
      url,
      siteName: d.name,
      title: p.title,
      description: p.description,
      locale: OG_LOCALE[p.locale],
      alternateLocale: LOCALES.filter((l) => l !== p.locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: p.title, description: p.description, images: [image.url] },
  };
}

// ---------------------------------------------------------------------------------------
// JSON-LD. Only facts that are visible on the site: name, role, location, public profiles,
// skills. Nothing invented (no ratings, reviews or clients).
// ---------------------------------------------------------------------------------------

type Json = Record<string, unknown>;

export const personId = () => absoluteUrl("/#person");
export const websiteId = () => absoluteUrl("/#website");

export function personLd(locale: Locale): Json {
  const d = dict(locale);
  const other = dict(locale === "uk" ? "en" : "uk");
  return {
    "@type": "Person",
    "@id": personId(),
    name: d.name,
    alternateName: other.name,
    jobTitle: d.seo.ogRole,
    description: d.seo.home.description,
    url: localeUrl(locale, ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: locale === "uk" ? "Миколаїв" : "Mykolaiv",
      addressCountry: "UA",
    },
    knowsAbout: d.skills.flatMap((s) => s.items.split(/,\s*/)).slice(0, 12),
    knowsLanguage: ["uk", "en"],
    sameAs: [CONTACTS.linkedin, CONTACTS.dribbble, CONTACTS.telegram],
  };
}

export function websiteLd(locale: Locale): Json {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    url: absoluteUrl("/"),
    name: dict(locale).name,
    inLanguage: ["uk", "en"],
    publisher: { "@id": personId() },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function caseLd(locale: Locale, c: Case): Json {
  return {
    "@type": "CreativeWork",
    "@id": `${localeUrl(locale, `/cases/${c.slug}`)}#case`,
    name: c.title,
    headline: c.title,
    description: c.summary,
    url: localeUrl(locale, `/cases/${c.slug}`),
    inLanguage: locale,
    author: { "@id": personId() },
    creator: { "@id": personId() },
    keywords: c.tags.join(", "),
    ...(c.adult ? { isFamilyFriendly: false, audience: { "@type": "PeopleAudience", suggestedMinAge: 18 } } : {}),
    genre: c.kind === "concept" ? "Design concept" : "Product design case study",
    ...(c.year ? { temporalCoverage: c.year.replace(/\s*—\s*/, "/") } : {}),
    ...(c.updatedAt ? { dateModified: c.updatedAt } : {}),
    image: ogImageUrl(locale, c.slug),
  };
}

/** A @graph document; serialize with jsonLdScript(). */
export function graph(...nodes: Json[]): Json {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * Safe for a <script type="application/ld+json">: `<` is escaped so content (case titles from the
 * database) can never close the script tag; U+2028/2029 are escaped for old parsers.
 */
export function jsonLdScript(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
