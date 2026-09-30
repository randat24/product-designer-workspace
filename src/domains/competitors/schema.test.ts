import { describe, expect, it } from "vitest";
import { competitorSchema, FEATURE_VALUES, nextFeatureValue, UX_TEMPLATES, type FeatureValue } from "./schema";

describe("competitorSchema", () => {
  it("accepts a site without a scheme", () => {
    const r = competitorSchema.safeParse({ name: " Acme ", url: "acme.com", kind: "direct" });
    expect(r.success && r.data.url).toBe("https://acme.com");
  });
  it("requires a name", () => {
    expect(competitorSchema.safeParse({ name: "  ", kind: "direct" }).success).toBe(false);
  });
});

describe("nextFeatureValue", () => {
  it("cycles through all values and back", () => {
    let v: FeatureValue = FEATURE_VALUES[0];
    const seen: FeatureValue[] = [v];
    for (let i = 0; i < FEATURE_VALUES.length; i++) seen.push((v = nextFeatureValue(v)));
    expect(seen.slice(0, FEATURE_VALUES.length)).toEqual([...FEATURE_VALUES]);
    expect(v).toBe(FEATURE_VALUES[0]);
  });
});

describe("UX review presets", () => {
  it("keep every set within 10 rows (choice overload, UX-05)", () => {
    for (const tpl of Object.values(UX_TEMPLATES)) expect(tpl.rows.length).toBeLessThanOrEqual(10);
  });
  it("have no duplicate rows inside a set and unique group names", () => {
    for (const tpl of Object.values(UX_TEMPLATES)) expect(new Set(tpl.rows).size).toBe(tpl.rows.length);
    const groups = Object.values(UX_TEMPLATES).map((t) => t.group);
    expect(new Set(groups).size).toBe(groups.length);
  });
});
