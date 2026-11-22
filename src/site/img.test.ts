import { describe, expect, it } from "vitest";
import { SIZES, responsive } from "./img";
import { clampDescription, noteHeadline } from "./seo";

describe("responsive (case pictures through the image optimizer)", () => {
  it("offers the steps up to the first one that covers the original, never larger", () => {
    const r = responsive("/cases/volta/cover-devices.webp", 2400, SIZES.card);
    expect(r.srcSet?.split(", ").map((s) => s.split(" ")[1])).toEqual(["640w", "828w", "1200w", "1920w"]);
    const small = responsive("/cases/x/phone.webp", 780, SIZES.thumb);
    expect(small.srcSet?.split(", ").map((s) => s.split(" ")[1])).toEqual(["640w", "828w"]);
    expect(small.src).toContain("w=828");
  });
  it("encodes remote case media and passes sizes through", () => {
    const r = responsive("https://ref.supabase.co/storage/v1/object/public/case-media/a/b.png", 1672, SIZES.cover);
    expect(r.src).toBe("/_next/image?url=https%3A%2F%2Fref.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fcase-media%2Fa%2Fb.png&w=1920&q=75");
    expect(r.sizes).toBe(SIZES.cover);
  });
  it("leaves SVG, data and plain-http sources alone", () => {
    for (const src of ["/awards/a.svg", "data:image/png;base64,x", "http://example.com/a.png"]) expect(responsive(src, 800, SIZES.card)).toEqual({ src });
  });
});

describe("clampDescription", () => {
  it("keeps a description that fits", () => {
    expect(clampDescription("  Short   text. ")).toBe("Short text.");
  });
  it("drops whole sentences that do not fit", () => {
    const a = "A".repeat(100) + ".", b = " " + "B".repeat(80) + ".";
    expect(clampDescription(a + b)).toBe(a);
  });
  it("cuts at a word with an ellipsis when the first sentence alone is too long", () => {
    const out = clampDescription(("word ".repeat(60)).trim() + ".");
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("word…")).toBe(true);
  });
});

describe("responsive: what stays as it is", () => {
  it("keeps other hosts, protocol-relative URLs and Storage URLs outside the public bucket", () => {
    for (const src of ["https://cdn.example.com/a.png", "//cdn.example.com/a.png", "https://ref.supabase.co/storage/v1/object/sign/case-media/a.png?token=x"])
      expect(responsive(src, 1200, SIZES.card)).toEqual({ src });
  });
});

describe("clampDescription: dots inside a sentence", () => {
  it("keeps «acme.com» and «2.5M» inside the first sentence", () => {
    const a = "Redesign of the acme.com checkout for 2.5M users, from research to the handoff of every screen state.";
    const out = clampDescription(a + " " + "More text follows here to push it past the limit of one hundred and sixty characters.");
    expect(out).toBe(a);
  });
});

describe("noteHeadline", () => {
  it("keeps a short first line and drops its closing period", () => {
    expect(noteHeadline("Продовжу думку про «чому».\nДалі текст.")).toBe("Продовжу думку про «чому»");
    expect(noteHeadline("Why not?\nMore.")).toBe("Why not?");
  });
  it("takes the first sentence of a line too long for a search result", () => {
    expect(noteHeadline("Генерувати екран тепер коштує десять секунд. Три варіанти — тридцять, а вибір — годину."))
      .toBe("Генерувати екран тепер коштує десять секунд");
  });
  it("cuts a long first sentence at a word", () => {
    const out = noteHeadline(("word ".repeat(30)).trim());
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("word…")).toBe(true);
  });
});
