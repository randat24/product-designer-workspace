import type { Metadata } from "next";
import { getSiteUrl, isIndexable } from "@/shared/lib/site-url";
import { CONTACTS, LOCALES, dict, type Case, type Locale } from "./content";
import { signalCopy } from "./signal/home-content";
import { PHOTO } from "./photo";

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

/** Open Graph image of a page: the site card, a case card when a slug is given, or a note card. */
export function ogImageUrl(locale: Locale, slug?: string, note?: number): string {
  const q = new URLSearchParams({ locale });
  if (slug) q.set("case", slug);
  if (note) q.set("note", String(note));
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
  /** A note page: its own preview card. */
  noteNumber?: number;
  /** The languages the page exists in (hreflang); all by default. A note without English text is uk only. */
  locales?: readonly Locale[];
  type?: "website" | "article" | "profile";
};

/**
 * A meta description of at most 160 characters (what a search result shows): whole sentences while they fit,
 * otherwise whole words and an ellipsis. Case descriptions come from the database and can be longer.
 */
export function clampDescription(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  // A sentence ends at . ! ? followed by a space or the end, so «acme.com» or «2.5M» stay inside it.
  const sentences = t.match(/[\s\S]*?[.!?]+(?=\s|$)/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim().length >= max * 0.6) return out.trim();
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]+$/, "").trim()}…`;
}

/** The title template of the site layout («page | name»); pageMetadata measures with the same one. */
export const titleTemplate = (name: string) => `%s | ${name}`;

export function pageMetadata(p: PageMeta): Metadata {
  const d = dict(p.locale);
  const url = localeUrl(p.locale, p.path);
  const languages: Record<string, string> = Object.fromEntries((p.locales ?? LOCALES).map((l) => [l, localeUrl(l, p.path)]));
  // x-default: the language-picking root for the home page, the Ukrainian page elsewhere.
  languages["x-default"] = p.path === "" ? absoluteUrl("/") : localeUrl("uk", p.path);
  const index = isIndexable() && !p.noindex;
  const image = { url: ogImageUrl(p.locale, p.caseSlug, p.noteNumber), width: 1200, height: 630, alt: p.title };

  // Search results cut a title at about 60 characters: when «title | name» would not fit, the title goes alone
  // (the name is still in the site name, the breadcrumbs and the structured data).
  const fits = titleTemplate(d.name).replace("%s", () => p.title).length <= 60;
  const description = clampDescription(p.description);

  return {
    title: p.absoluteTitle || !fits ? { absolute: p.title } : p.title,
    description,
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
      description,
      locale: OG_LOCALE[p.locale],
      alternateLocale: (p.locales ?? LOCALES).filter((l) => l !== p.locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: p.title, description, images: [image.url] },
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
    // Awards and education as listed on the About page; certificates link to their public record.
    award: d.awards.map((a) => a.title),
    alumniOf: d.education
      .filter((e) => !e.certificate)
      .map((e) => ({ "@type": "EducationalOrganization", name: e.place })),
    hasCredential: d.education
      .filter((e) => e.certificate)
      .map((e) => ({
        "@type": "EducationalOccupationalCredential",
        name: e.title,
        credentialCategory: "certificate",
        recognizedBy: { "@type": "EducationalOrganization", name: e.place.split(" · ")[0] },
        url: e.certificate,
      })),
    image: { "@type": "ImageObject", url: absoluteUrl(PHOTO.portrait.src), width: PHOTO.portrait.width, height: PHOTO.portrait.height, caption: PHOTO.alt[locale] },
    sameAs: [CONTACTS.linkedin, CONTACTS.dribbble, CONTACTS.telegram],
    // The services from the home page, so search and AI answers can match «hire a UX designer»-type queries.
    makesOffer: signalCopy(locale).services.items.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, description: s.text, areaServed: "Worldwide" },
    })),
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

/** A plain page (privacy, the project request): what it is, in which language, and where it sits on the site. */
export function pageLd(locale: Locale, path: string, type: "WebPage" | "ContactPage", name: string, description: string): Json {
  const d = dict(locale);
  return graph(
    { "@type": type, "@id": `${localeUrl(locale, path)}#page`, url: localeUrl(locale, path), name, description: clampDescription(description), inLanguage: locale, isPartOf: { "@id": websiteId() }, about: { "@id": personId() } },
    breadcrumbLd([{ name: d.ui.home, url: localeUrl(locale, "") }, { name, url: localeUrl(locale, path) }]),
  );
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

/** The selected work on the home page, in its order: the cases it links to, as a list search engines can read. */
export function homeWorkLd(locale: Locale, cases: Case[], name: string): Json {
  return {
    "@type": "ItemList",
    "@id": `${localeUrl(locale, "")}#work`,
    name,
    itemListElement: cases.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: localeUrl(locale, `/cases/${c.slug}`), name: c.title })),
  };
}

/** The case list page: a collection whose items are the published cases (samples are noindex, so left out). */
export function casesCollectionLd(locale: Locale, cases: Case[], name: string, description: string): Json {
  const url = localeUrl(locale, "/cases");
  return {
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: { "@id": websiteId() },
    author: { "@id": personId() },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cases
        .filter((c) => !c.sample)
        .map((c, i) => ({ "@type": "ListItem", position: i + 1, url: localeUrl(locale, `/cases/${c.slug}`), name: c.title })),
    },
  };
}

/** The notes feed: a blog whose posts are the notes in this language. */
export function notesLd(locale: Locale, notes: { number: number; body: string; publishedAt: string }[], name: string, description: string): Json {
  const url = localeUrl(locale, "/notes");
  return {
    "@type": "Blog",
    "@id": `${url}#blog`,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: { "@id": websiteId() },
    author: { "@id": personId() },
    blogPost: notes.slice(0, 50).map((n) => noteLd(locale, n)),
  };
}

/** One note: a short post by the site's person. */
export function noteLd(locale: Locale, n: { number: number; body: string; publishedAt: string }): Json {
  const url = localeUrl(locale, `/notes/${n.number}`);
  return {
    "@type": "BlogPosting",
    "@id": `${url}#note`,
    url,
    headline: noteHeadline(n.body),
    datePublished: n.publishedAt,
    inLanguage: locale,
    author: { "@id": personId() },
    image: ogImageUrl(locale, undefined, n.number),
  };
}

/** A note's first line, cut to a title's length: notes have no title of their own. */
export function noteHeadline(body: string, max = 70): string {
  const first = body.trim().split(/\n/)[0]!.trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2)).replace(/[,;:—–-]+$/, "").trim()}…`;
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
