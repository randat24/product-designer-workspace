import { z } from "zod";
import type { Dictionary, Locale } from "./content";

/**
 * The «Про мене» page as the owner edits it in the tool («Профіль сайту», table site_profile). One language of it;
 * every field is optional: a field that is not written keeps the text from the code (content.ts), so the page
 * is never empty. The service and its awards stay in the code.
 */
const line = z.string().trim().max(300);
const text = z.string().trim().max(5000);
const lines = z.array(line).max(30);
// A link the page opens: https only (no javascript: or data: URLs); an empty field means no link.
const certificateUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().max(500).regex(/^https:\/\/[^\s]+$/).optional(),
);

export const siteProfileLocaleSchema = z.object({
  summary: text.optional(),
  facts: z.array(z.object({ value: z.string().trim().max(20), label: line })).max(6).optional(),
  jobs: z.array(z.object({ period: line, title: line, place: line, points: lines, details: z.array(text).max(10) })).max(20).optional(),
  skills: z.array(z.object({ group: line, items: text })).max(12).optional(),
  availability: lines.optional(),
  education: z.array(z.object({ title: line, place: line, year: line, certificate: certificateUrl })).max(12).optional(),
  languages: z.array(z.object({ name: line, level: line })).max(10).optional(),
});

export type SiteProfileLocale = z.infer<typeof siteProfileLocaleSchema>;
export type SiteProfile = Partial<Record<Locale, SiteProfileLocale>>;

/** One language of a stored profile; a broken or missing one gives null (the page then uses the code). */
export function readProfileLocale(content: unknown, locale: Locale): SiteProfileLocale | null {
  if (!content || typeof content !== "object") return null;
  const parsed = siteProfileLocaleSchema.safeParse((content as Record<string, unknown>)[locale]);
  return parsed.success ? parsed.data : null;
}

/** The editable part of the dictionary, as the profile editor starts from it. */
export function profileFromDictionary(d: Dictionary): Required<SiteProfileLocale> {
  return {
    summary: d.about.summary,
    facts: d.about.facts.map((f) => ({ value: f.value, label: f.label })),
    jobs: d.jobs.filter((j) => !j.military).map((j) => ({ period: j.period, title: j.title, place: j.place, points: j.points, details: j.details ?? [] })),
    skills: d.skills.map((s) => ({ group: s.group, items: s.items })),
    availability: d.availability,
    education: d.education.map((e) => ({ title: e.title, place: e.place, year: e.year, ...(e.certificate ? { certificate: e.certificate } : {}) })),
    languages: d.languages.map((l) => ({ name: l.name, level: l.level })),
  };
}

/**
 * The dictionary with the profile's fields put in. Experience replaces the design jobs only: the service
 * (military: true) stays where the code has it.
 */
export function applyProfile(d: Dictionary, profile: SiteProfileLocale | null): Dictionary {
  if (!profile) return d;
  const p = clean(profile);
  const has = <T,>(v: T[] | undefined): v is T[] => Array.isArray(v) && v.length > 0;
  return {
    ...d,
    about: {
      ...d.about,
      ...(p.summary ? { summary: p.summary } : {}),
      ...(has(p.facts) ? { facts: p.facts } : {}),
    },
    jobs: has(p.jobs) ? [...d.jobs.filter((j) => j.military), ...p.jobs.map((j) => ({ ...j, details: j.details.length ? j.details : undefined }))] : d.jobs,
    skills: has(p.skills) ? p.skills : d.skills,
    availability: has(p.availability) ? p.availability : d.availability,
    education: has(p.education) ? p.education : d.education,
    languages: has(p.languages) ? p.languages : d.languages,
  };
}

/** Drops what the editor leaves while typing: empty lines and rows with nothing in their main field. */
function clean(p: SiteProfileLocale): SiteProfileLocale {
  const filled = (v: string[]) => v.filter((x) => x.trim() !== "");
  return {
    ...p,
    facts: p.facts?.filter((f) => f.value || f.label),
    jobs: p.jobs?.filter((j) => j.title).map((j) => ({ ...j, points: filled(j.points), details: filled(j.details) })),
    skills: p.skills?.filter((x) => x.group || x.items),
    availability: p.availability && filled(p.availability),
    education: p.education?.filter((e) => e.title),
    languages: p.languages?.filter((l) => l.name),
  };
}
