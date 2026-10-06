import { z } from "zod";
import type { Case, Locale } from "./content";

/**
 * What the site needs from a case snapshot (`case_studies.content` or the draft), checked before it is
 * rendered (docs/HANDOFF_TRIAGE.md, F04). Only the shape the page relies on is checked; anything extra
 * passes through, so a snapshot made by an older version of the tool still shows.
 */
const str = z.string().nullish();
const image = z.object({ src: z.string(), alt: z.string() }).passthrough();
const localeSnapshot = z.object({
  title: z.string().min(1),
  summary: str, year: str, client: str, role: str, sticker: str,
  tags: z.array(z.string()).nullish(),
  metrics: z.array(z.object({ value: z.string(), label: z.string() })).nullish(),
  sections: z.array(z.object({ title: z.string(), body: z.string(), image: image.nullish() }).passthrough()).nullish(),
  kind: z.enum(["real", "concept"]).nullish(),
  liveUrl: str, figma: str,
  gallery: z.array(image).nullish(),
  cover: image.nullish(),
  sample: z.boolean().nullish(), adult: z.boolean().nullish(), coverSafe: z.boolean().nullish(),
  story: z.object({ meta: z.array(z.object({ label: z.string(), value: z.string() })) }).passthrough().nullish(),
  product: z.object({ disciplines: z.array(z.string()) }).passthrough().nullish(),
  seo: z.object({ title: z.string(), description: z.string() }).nullish(),
}).passthrough();

type Snapshot = Partial<Record<Locale, unknown>>;

/** One language of a snapshot as a site case; the Ukrainian text stands in when a translation is missing. */
export function snapshotToCase(slug: string, content: unknown, locale: Locale, updatedAt?: string): Case | null {
  const snapshot = (content ?? {}) as Snapshot;
  const parsed = localeSnapshot.safeParse(snapshot[locale] ?? snapshot.uk);
  if (!parsed.success) return null;
  const c = parsed.data;
  return {
    slug,
    sticker: c.sticker ?? "var(--s3)",
    year: c.year ?? "",
    title: c.title,
    client: c.client ?? "",
    role: c.role ?? "",
    summary: c.summary ?? "",
    tags: c.tags ?? [],
    metrics: c.metrics ?? [],
    sections: (c.sections ?? []) as Case["sections"],
    story: (c.story ?? undefined) as Case["story"],
    kind: c.kind ?? undefined,
    liveUrl: c.liveUrl ?? undefined,
    gallery: (c.gallery ?? undefined) as Case["gallery"],
    cover: (c.cover ?? undefined) as Case["cover"],
    figma: c.figma ?? undefined,
    sample: c.sample ?? undefined,
    adult: c.adult ?? undefined,
    coverSafe: c.coverSafe ?? undefined,
    product: (c.product ?? undefined) as Case["product"],
    seo: c.seo ?? undefined,
    updatedAt,
  };
}

/** Why a snapshot cannot be shown, for the editor: the first problem, or null when it is fine. */
export function snapshotProblem(content: unknown, locale: Locale): string | null {
  const snapshot = (content ?? {}) as Snapshot;
  const parsed = localeSnapshot.safeParse(snapshot[locale] ?? snapshot.uk);
  if (parsed.success) return null;
  const issue = parsed.error.issues[0];
  return issue ? `${issue.path.join(".") || "—"}: ${issue.message}` : "invalid";
}
