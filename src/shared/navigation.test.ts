import { describe, expect, it } from "vitest";
import { CURRENT_PHASE, PROJECT_NAV, visibleNav } from "./navigation";

describe("project navigation", () => {
  it("shows only shipped sections", () => {
    for (const g of visibleNav()) for (const i of g.items) {
      expect(i.mvp).toBe(true);
      expect(i.phase).toBeLessThanOrEqual(CURRENT_PHASE);
    }
  });
  it("keeps each visible group to 7 items or fewer (Hick's law, UX-04)", () => {
    for (const g of visibleNav()) expect(g.items.length).toBeLessThanOrEqual(7);
  });
  it("has unique segments", () => {
    const segs = PROJECT_NAV.flatMap((g) => g.items.map((i) => i.segment));
    expect(new Set(segs).size).toBe(segs.length);
  });
});
