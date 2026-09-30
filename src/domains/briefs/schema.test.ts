import { describe, expect, it } from "vitest";
import { BRIEF_KEY_FIELDS, briefCompleteness, briefSchema, EMPTY_BRIEF } from "./schema";

describe("briefCompleteness", () => {
  it("is 0 of all key fields for an empty brief", () => {
    expect(briefCompleteness(EMPTY_BRIEF)).toEqual({ filled: 0, total: BRIEF_KEY_FIELDS.length, missing: BRIEF_KEY_FIELDS.map((f) => f.key) });
  });
  it("counts constraints from either field and the timeline only with both dates", () => {
    const b = briefSchema.parse({ technical_constraints: "iOS 16+", timeline_start: "2026-10-01" });
    const r = briefCompleteness(b);
    expect(r.missing).not.toContain("constraints");
    expect(r.missing).toContain("timeline");
  });
});

describe("briefSchema", () => {
  it("drops empty rows and completes link schemes", () => {
    const b = briefSchema.parse({
      goals: ["Grow", ""],
      links: [{ title: "", url: "" }, { title: "Figma", url: "figma.com/file/1" }],
    });
    expect(b.goals).toEqual(["Grow"]);
    expect(b.links).toEqual([{ title: "Figma", url: "https://figma.com/file/1" }]);
  });
  it("rejects an end date before the start", () => {
    expect(briefSchema.safeParse({ timeline_start: "2026-10-10", timeline_end: "2026-10-01" }).success).toBe(false);
  });
  it("ignores a malformed date instead of failing the whole save", () => {
    expect(briefSchema.parse({ timeline_start: "soon" }).timeline_start).toBeNull();
  });
});
