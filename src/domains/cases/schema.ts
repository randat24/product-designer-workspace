import { z } from "zod";

export const CASE_LOCALES = ["uk", "en"] as const;
export type CaseLocale = (typeof CASE_LOCALES)[number];

/** Case images: the public `case-media` bucket takes these (no SVG, see migration 020). */
export const CASE_MEDIA_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const CASE_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

const text = (max: number) => z.string().trim().max(max);

/** A picture of the case: a file in `case-media` or a built-in one under /cases/. */
const imageSchema = z.object({
  src: z.string().max(2000).regex(/^(\/|https?:\/\/)/),
  alt: text(300),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  caption: text(300).optional(),
  device: z.enum(["desktop", "mobile"]).optional(),
});
export type CaseImage = z.infer<typeof imageSchema>;

/** One language of a case as the editor sees it; the rest of the snapshot (story, gallery, flags) is kept as is. */
export const caseDraftSchema = z.object({
  title: text(200),
  summary: text(1000),
  role: text(200),
  client: text(200),
  year: text(50),
  kind: z.enum(["real", "concept"]),
  liveUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(2000)]),
  tags: z.array(text(60)).max(12),
  metrics: z.array(z.object({ value: text(40), label: text(200) })).max(8),
  cover: imageSchema.nullable(),
  sections: z.array(z.object({ title: text(200), body: text(10000), image: imageSchema.nullable() })).max(40),
});
export type CaseDraft = z.infer<typeof caseDraftSchema>;

type Snapshot = Record<string, Record<string, unknown> | undefined>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const img = (v: unknown): CaseImage | null => {
  const parsed = imageSchema.safeParse(v);
  return parsed.success ? parsed.data : null;
};

/** The editor's view of one language of the stored snapshot. */
export function draftFromSnapshot(content: unknown, locale: CaseLocale): CaseDraft {
  const c = (content as Snapshot | null)?.[locale] ?? {};
  const sections = Array.isArray(c.sections) ? (c.sections as Record<string, unknown>[]) : [];
  const metrics = Array.isArray(c.metrics) ? (c.metrics as Record<string, unknown>[]) : [];
  return {
    title: str(c.title),
    summary: str(c.summary),
    role: str(c.role),
    client: str(c.client),
    year: str(c.year),
    kind: c.kind === "concept" ? "concept" : "real",
    liveUrl: str(c.liveUrl),
    tags: Array.isArray(c.tags) ? c.tags.filter((x): x is string => typeof x === "string") : [],
    metrics: metrics.map((m) => ({ value: str(m.value), label: str(m.label) })),
    cover: img(c.cover),
    sections: sections.map((s) => ({ title: str(s.title), body: str(s.body), image: img(s.image) })),
  };
}

/** A picture's orientation decides the device frame the site draws around it. */
function toGalleryItem(image: CaseImage) {
  return { ...image, device: image.device ?? (image.width >= image.height ? "desktop" : "mobile") };
}

/**
 * Writes one language back into the snapshot. Fields the editor does not show (story, gallery, sticker,
 * the 18+ / sample flags, Figma link) stay untouched; empty optional fields are dropped, as the site expects.
 */
export function mergeDraft(content: unknown, locale: CaseLocale, draft: CaseDraft): Snapshot {
  const snapshot = { ...((content ?? {}) as Snapshot) };
  const { cover: _cover, liveUrl: _live, ...previous } = snapshot[locale] ?? {};
  snapshot[locale] = {
    ...previous,
    title: draft.title,
    summary: draft.summary,
    role: draft.role,
    client: draft.client,
    year: draft.year,
    kind: draft.kind,
    tags: draft.tags.filter(Boolean),
    metrics: draft.metrics.filter((m) => m.value || m.label),
    sections: draft.sections.map((s) => ({
      title: s.title,
      body: s.body,
      ...(s.image ? { image: toGalleryItem(s.image) } : {}),
    })),
    ...(draft.liveUrl ? { liveUrl: draft.liveUrl } : {}),
    ...(draft.cover ? { cover: toGalleryItem(draft.cover) } : {}),
  };
  return snapshot;
}
