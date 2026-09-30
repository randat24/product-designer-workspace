import { describe, expect, it } from "vitest";
import { UX_LAW_GROUPS, UX_LAWS } from ".";

describe("UX laws reference", () => {
  it("has the 30 laws with sequential codes UX-01…UX-30", () => {
    expect(UX_LAWS.map((l) => l.code)).toEqual(Array.from({ length: 30 }, (_, i) => `UX-${String(i + 1).padStart(2, "0")}`));
  });
  it("links each law to its own page", () => {
    expect(new Set(UX_LAWS.map((l) => l.slug)).size).toBe(UX_LAWS.length);
  });
  it("puts every law in a known group and uses every group", () => {
    const ids = new Set(UX_LAW_GROUPS.map((g) => g.id));
    for (const l of UX_LAWS) expect(ids.has(l.group)).toBe(true);
    for (const g of UX_LAW_GROUPS) expect(UX_LAWS.some((l) => l.group === g.id)).toBe(true);
  });
  it("gives each law an origin, at least two takeaways and a check question", () => {
    for (const l of UX_LAWS) {
      expect(l.origin.length).toBeGreaterThan(5);
      expect(l.takeaways.length).toBeGreaterThanOrEqual(2);
      expect(l.check.trim().endsWith("?") || l.check.includes("?")).toBe(true);
    }
  });
});
