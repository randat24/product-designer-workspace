import { describe, expect, it } from "vitest";
import { NOTE_MAX, noteSchema } from "./schema";

const base = { body_uk: "Текст", body_en: "", image: null, tags: [], parent_id: null };

describe("noteSchema", () => {
  it("normalizes tags: no «#», lower case, no blanks or repeats", () => {
    const v = noteSchema.parse({ ...base, tags: ["#UX", "ux", "  Forms ", ""] });
    expect(v.tags).toEqual(["ux", "forms"]);
  });

  it("refuses more than five tags and text over the limit", () => {
    expect(noteSchema.safeParse({ ...base, tags: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false);
    expect(noteSchema.safeParse({ ...base, body_uk: "x".repeat(NOTE_MAX + 1) }).success).toBe(false);
  });

  it("takes only an http(s) or site picture", () => {
    const image = { src: "javascript:alert(1)", alt: "", width: 10, height: 10 };
    expect(noteSchema.safeParse({ ...base, image }).success).toBe(false);
    expect(noteSchema.safeParse({ ...base, image: { ...image, src: "https://x.supabase.co/a.png" } }).success).toBe(true);
  });
});
