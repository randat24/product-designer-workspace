import { z } from "zod";
import { imageSchema } from "@/domains/cases/schema";

export const NOTE_MAX = 1500;
export const NOTE_TAGS_MAX = 5;
export const REACTIONS = ["agree", "disagree", "new"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** A tag as the site shows it: lower case, no «#», no spaces at the ends. */
export const normalizeTag = (tag: string) => tag.trim().replace(/^#+/, "").toLowerCase().slice(0, 30);

/** One note as the editor saves it; the database checks the same limits (migration 025). */
export const noteSchema = z.object({
  body_uk: z.string().max(NOTE_MAX),
  body_en: z.string().max(NOTE_MAX),
  image: imageSchema.omit({ caption: true, device: true }).nullable(),
  tags: z.array(z.string().transform(normalizeTag)).max(NOTE_TAGS_MAX).transform((t) => [...new Set(t.filter(Boolean))]),
  parent_id: z.uuid().nullable(),
});
export type NoteInput = z.input<typeof noteSchema>;
