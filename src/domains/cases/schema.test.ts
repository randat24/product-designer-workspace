import { describe, expect, it } from "vitest";
import { caseDraftSchema, draftFromSnapshot, mergeDraft, type CaseDraft } from "./schema";

const snapshot = {
  uk: {
    title: "Neural WebCam: айдентика",
    summary: "Знак",
    tags: ["Айдентика"],
    adult: true,
    coverSafe: true,
    figma: "https://www.figma.com/design/x",
    story: { kept: true },
    cover: { src: "/cases/n/00.webp", alt: "Логотип", width: 2400, height: 1500, caption: "Neural WebCam", device: "desktop" },
    sections: [{ title: "Огляд", body: "Текст", image: { src: "/cases/n/01.webp", alt: "", width: 2400, height: 1500 } }],
  },
  en: { title: "Neural WebCam identity" },
};

describe("case draft", () => {
  it("reads one language of the snapshot, with defaults for missing fields", () => {
    const d = draftFromSnapshot(snapshot, "uk");
    expect(d.title).toBe("Neural WebCam: айдентика");
    expect(d.kind).toBe("real");
    expect(d.cover?.src).toBe("/cases/n/00.webp");
    expect(d.sections[0]?.image?.width).toBe(2400);
    expect(draftFromSnapshot({}, "en").sections).toEqual([]);
  });

  it("writes back without losing fields the editor does not show", () => {
    const draft: CaseDraft = { ...draftFromSnapshot(snapshot, "uk"), title: "Нова назва", liveUrl: "" };
    const merged = mergeDraft(snapshot, "uk", draft);
    expect(merged.uk).toMatchObject({ title: "Нова назва", adult: true, coverSafe: true, figma: "https://www.figma.com/design/x", story: { kept: true } });
    expect(merged.uk).not.toHaveProperty("liveUrl");
    expect(merged.en).toEqual(snapshot.en);
  });

  it("gives new pictures a device frame from their shape", () => {
    const draft: CaseDraft = {
      ...draftFromSnapshot({}, "en"),
      title: "Case",
      cover: null,
      sections: [{ title: "Mobile", body: "", image: { src: "https://x.supabase.co/a.webp", alt: "", width: 390, height: 844 } }],
    };
    const merged = mergeDraft({}, "en", draft);
    expect((merged.en?.sections as { image: object }[])[0]?.image).toMatchObject({ device: "mobile" });
    expect(merged.en).not.toHaveProperty("cover");
  });

  it("refuses links that are not web pages and images that are not a path or a web address", () => {
    const base = draftFromSnapshot({}, "uk");
    expect(caseDraftSchema.safeParse({ ...base, liveUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(caseDraftSchema.safeParse({ ...base, cover: { src: "data:image/png;base64,x", alt: "", width: 1, height: 1 } }).success).toBe(false);
    expect(caseDraftSchema.safeParse({ ...base, liveUrl: "https://nudesmaker.com" }).success).toBe(true);
  });
});
