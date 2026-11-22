import { CONTACTS, LOCALES, dict, type Case, type Locale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { getSiteProfile } from "@/site/profile-source";
import { applyProfile } from "@/site/site-profile";
import { signalCopy } from "@/site/signal/home-content";
import { absoluteUrl, localeUrl } from "@/site/seo";
import { markdownUrl } from "@/site/agents/markdown";
import { agentResponse } from "@/site/agents/source";

// /portfolio.json: the portfolio as data for agents that call tools rather than read pages: who, services,
// contacts and the published cases with links to their HTML and Markdown. Same facts as the pages; sample
// cases are left out. The full text of a case is its Markdown (`markdown` below).
export const revalidate = 3600;

const caseEntry = (locale: Locale, c: Case) => ({
  slug: c.slug,
  title: c.title,
  summary: c.summary,
  year: c.year,
  client: c.client,
  role: c.role,
  kind: c.kind ?? null,
  tags: c.tags,
  metrics: c.metrics,
  liveUrl: c.liveUrl ?? null,
  url: localeUrl(locale, `/cases/${c.slug}`),
  markdown: markdownUrl(locale, `/cases/${c.slug}`),
  updatedAt: c.updatedAt ?? null,
});

async function profile(locale: Locale) {
  const d = applyProfile(dict(locale), await getSiteProfile(locale));
  const s = signalCopy(locale);
  const cases = (await getCases(locale)).filter((c) => !c.sample);
  return {
    name: d.name,
    role: d.role,
    location: d.location,
    summary: d.about.summary,
    facts: d.about.facts,
    skills: d.skills,
    experience: d.jobs.filter((j) => !j.military).map((j) => ({ period: j.period, title: j.title, place: j.place, points: j.points })),
    languages: d.languages,
    availability: d.availability,
    awards: d.awards.map((a) => ({ title: a.title, issuer: a.issuer })),
    services: s.services.items.map((i) => ({ title: i.title, description: i.text, result: i.result })),
    pages: {
      home: { url: localeUrl(locale, ""), markdown: markdownUrl(locale, "") },
      about: { url: localeUrl(locale, "/about"), markdown: markdownUrl(locale, "/about") },
      cases: { url: localeUrl(locale, "/cases"), markdown: markdownUrl(locale, "/cases") },
      notes: { url: localeUrl(locale, "/notes"), markdown: markdownUrl(locale, "/notes") },
      startProject: { url: localeUrl(locale, "/start-project") },
      cv: absoluteUrl(CONTACTS.cv[locale]),
    },
    cases: cases.map((c) => caseEntry(locale, c)),
  };
}

export async function GET() {
  const locales = await Promise.all(LOCALES.map(async (l) => [l, await profile(l)] as const));
  const body = {
    site: absoluteUrl("/"),
    llms: absoluteUrl("/llms.txt"),
    llmsFull: absoluteUrl("/llms-full.txt"),
    contact: {
      email: CONTACTS.email,
      telegram: CONTACTS.telegram,
      linkedin: CONTACTS.linkedin,
      dribbble: CONTACTS.dribbble,
    },
    ...Object.fromEntries(locales),
  };
  return agentResponse(`${JSON.stringify(body, null, 2)}\n`, "application/json");
}
