import { z } from "zod";
import type { BrandShape, ProductSection, ProductStory, TrustIcon } from "@/site/product-story";

/**
 * The product story of a case (src/site/product-story.ts), described once for the editor: which fields each
 * block has, how a new block starts and what the server accepts. The site renders the same data with
 * ProductStoryView, so whatever is edited here is what «Опублікувати» puts on the case page.
 *
 * Field types:
 * - line / text: one string (a short line or a longer text);
 * - paragraphs: string[], typed as text with an empty line between paragraphs;
 * - lines: string[], one item per line;
 * - select: one of fixed options;
 * - image / images: pictures uploaded to the case media;
 * - rows: a list of small records (name + summary + abilities, title + steps…).
 */
export type Column =
  | { key: string; type: "line" | "text" | "lines" }
  | { key: string; type: "select"; options: readonly string[] };
export type Field =
  | { key: string; type: "line" | "text" | "paragraphs" | "lines" | "image" | "images" }
  | { key: string; type: "select"; options: readonly string[] }
  | { key: string; type: "rows"; columns: Column[] };

export const BRAND_SHAPES: readonly BrandShape[] = ["circle", "base", "dot"];
export const TRUST_ICONS: readonly TrustIcon[] = ["age", "identity", "security", "privacy", "gdpr", "scam", "payment", "access"];

const line = (key: string): Column => ({ key, type: "line" });
const text = (key: string): Column => ({ key, type: "text" });
const lines = (key: string): Column => ({ key, type: "lines" });

/** Block kinds in the order a story usually goes: from the start of the project to its outcome. */
export const BLOCKS = {
  overview: [{ key: "body", type: "paragraphs" }, { key: "facts", type: "rows", columns: [line("label"), line("value")] }],
  timeline: [{ key: "steps", type: "rows", columns: [line("title"), text("body")] }],
  role: [{ key: "areas", type: "lines" }],
  challenge: [{ key: "body", type: "paragraphs" }, { key: "behaviors", type: "rows", columns: [line("who"), text("goal")] }],
  ecosystem: [{ key: "center", type: "line" }, { key: "nodes", type: "lines" }],
  roles: [{ key: "items", type: "rows", columns: [line("name"), text("summary"), lines("can")] }],
  ia: [{ key: "groups", type: "rows", columns: [line("title"), lines("items")] }],
  flows: [{ key: "items", type: "rows", columns: [line("title"), lines("steps")] }],
  monetization: [
    { key: "chain", type: "lines" }, { key: "actions", type: "lines" },
    { key: "models", type: "rows", columns: [line("title"), text("body")] },
  ],
  principles: [{ key: "items", type: "rows", columns: [line("title"), text("body")] }],
  brand: [
    { key: "body", type: "paragraphs" },
    { key: "parts", type: "rows", columns: [{ key: "shape", type: "select", options: BRAND_SHAPES }, line("title"), text("meaning")] },
    { key: "formula", type: "line" },
    { key: "image", type: "image" },
  ],
  system: [{ key: "body", type: "paragraphs" }, { key: "groups", type: "rows", columns: [line("title"), lines("items")] }],
  screens: [{ key: "items", type: "images" }],
  figure: [{ key: "body", type: "paragraphs" }, { key: "images", type: "images" }],
  checklist: [{ key: "body", type: "paragraphs" }, { key: "items", type: "lines" }],
  trust: [{ key: "items", type: "rows", columns: [{ key: "icon", type: "select", options: TRUST_ICONS }, line("title"), text("body")] }],
  outcome: [{ key: "body", type: "paragraphs" }],
} as const satisfies Record<ProductSection["kind"], readonly Field[]>;

export type BlockKind = keyof typeof BLOCKS;
export const BLOCK_KINDS = Object.keys(BLOCKS) as BlockKind[];

// ---------------------------------------------------------------- validation

const LINE = 300;
const TEXT = 5000;
const LIST = 60;

/** A picture: the same shape the site renders (src, alt, size); extra keys such as `device` pass through. */
export const galleryImageSchema = z.object({
  src: z.string().max(2000).regex(/^(\/|https?:\/\/)/),
  alt: z.string().max(LINE),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  caption: z.string().max(LINE).optional(),
}).passthrough();

const columnSchema = (c: Column) =>
  c.type === "select" ? z.enum(c.options as [string, ...string[]])
    : c.type === "lines" ? z.array(z.string().max(LINE)).max(LIST)
      : z.string().max(c.type === "line" ? LINE : TEXT);

function fieldSchema(f: Field) {
  switch (f.type) {
    case "line": return z.string().max(LINE);
    case "text": return z.string().max(TEXT);
    case "paragraphs": return z.array(z.string().max(TEXT)).max(LIST);
    case "lines": return z.array(z.string().max(LINE)).max(LIST);
    case "select": return z.enum(f.options as [string, ...string[]]);
    // A brand block may wait for its picture; the site shows the block without it.
    case "image": return galleryImageSchema.optional();
    case "images": return z.array(galleryImageSchema).max(40);
    case "rows": return z.array(z.object(Object.fromEntries(f.columns.map((c) => [c.key, columnSchema(c)]))).passthrough()).max(LIST);
  }
}

const sectionSchema = z.discriminatedUnion("kind", BLOCK_KINDS.map((kind) =>
  z.object({
    kind: z.literal(kind),
    id: z.string().regex(/^[a-z0-9-]{1,60}$/),
    title: z.string().max(LINE),
    lede: z.string().max(TEXT).optional(),
    ...Object.fromEntries((BLOCKS[kind] as readonly Field[]).map((f) => [f.key, fieldSchema(f)])),
  }).passthrough(),
) as unknown as [z.ZodObject<z.ZodRawShape>, ...z.ZodObject<z.ZodRawShape>[]]);

/** What the server accepts as the product story of one language. Unknown keys pass through untouched. */
export const productStorySchema = z.object({
  disciplines: z.array(z.string().max(LINE)).max(12),
  note: z.string().max(TEXT).optional(),
  contents: z.string().max(LINE),
  sections: z.array(sectionSchema).max(40),
}).passthrough();

// ---------------------------------------------------------------- new blocks

function emptyField(f: Field): unknown {
  switch (f.type) {
    case "line": case "text": return "";
    case "select": return f.options[0];
    case "image": return undefined;
    default: return [];
  }
}

/** An empty row of a list field: every column blank (a select takes its first option). */
export function emptyRow(columns: readonly Column[]): Record<string, unknown> {
  return Object.fromEntries(columns.map((c) => [c.key, c.type === "select" ? c.options[0] : c.type === "lines" ? [] : ""]));
}

/** A new block of a kind, with a unique anchor id for the page's contents. */
export function emptyBlock(kind: BlockKind, taken: readonly string[]): ProductSection {
  let id: string = kind;
  for (let n = 2; taken.includes(id); n++) id = `${kind}-${n}`;
  const fields = Object.fromEntries((BLOCKS[kind] as readonly Field[]).map((f) => [f.key, emptyField(f)]).filter(([, v]) => v !== undefined));
  return { kind, id, title: "", ...fields } as ProductSection;
}

export function emptyStory(contents: string): ProductStory {
  return { disciplines: [], contents, sections: [] };
}
