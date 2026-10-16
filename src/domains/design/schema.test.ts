import { describe, expect, it } from "vitest";
import { UX_LAW_GROUPS } from "@/domains/ux-laws";
import { decisionSchema, REVIEW_KEYS, reviewOverall, reviewPatchSchema, screenSpecSchema } from "./schema";

const screen = (figma_url: string | null) => ({
  name: "Checkout", content_hierarchy: [], analytics_events: [], status: "sketch" as const, figma_url,
});

describe("screenSpecSchema.figma_url (Postel's law, UX-28)", () => {
  it("accepts a Figma link without https://", () => {
    const r = screenSpecSchema.safeParse(screen("figma.com/design/abc"));
    expect(r.success && r.data.figma_url).toBe("https://figma.com/design/abc");
  });
  it("keeps a full link and allows an empty one", () => {
    expect(screenSpecSchema.parse(screen("https://www.figma.com/x")).figma_url).toBe("https://www.figma.com/x");
    expect(screenSpecSchema.parse(screen("")).figma_url).toBeNull();
    expect(screenSpecSchema.parse(screen(null)).figma_url).toBeNull();
  });
  it("rejects other schemes", () => {
    expect(screenSpecSchema.safeParse(screen("javascript:alert(1)")).success).toBe(false);
  });
});

describe("screenSpecSchema lists", () => {
  it("drops empty hierarchy rows and empty analytics events", () => {
    const r = screenSpecSchema.parse({
      ...screen(null),
      content_hierarchy: ["Title", "", "Price"],
      analytics_events: [{ name: "", trigger: "", props: "" }, { name: "buy", trigger: "tap", props: "" }],
    });
    expect(r.content_hierarchy).toEqual(["Title", "Price"]);
    expect(r.analytics_events).toHaveLength(1);
  });
});

describe("decisionSchema", () => {
  it("turns an empty date and superseding decision into null", () => {
    const r = decisionSchema.parse({ title: "Use tabs", alternatives: [], status: "proposed", decided_at: "", superseded_by_id: "" });
    expect(r.decided_at).toBeNull();
    expect(r.superseded_by_id).toBeNull();
  });
  it("rejects a malformed date", () => {
    expect(decisionSchema.safeParse({ title: "x", alternatives: [], status: "proposed", decided_at: "30.09.2026" }).success).toBe(false);
  });
});

describe("screen review", () => {
  it("averages only the scored criteria", () => {
    expect(reviewOverall({ familiar: 8, choice: 7, memory: null })).toBe(7.5);
    expect(reviewOverall({ familiar: 7, choice: 7, memory: 8 })).toBe(7.3);
    expect(reviewOverall({})).toBeNull();
  });
  it("takes scores 1–10 or empty, and an empty note as none", () => {
    expect(reviewPatchSchema.safeParse({ familiar: 10, quality: null }).success).toBe(true);
    expect(reviewPatchSchema.safeParse({ familiar: 11 }).success).toBe(false);
    expect(reviewPatchSchema.safeParse({ choice: 0 }).success).toBe(false);
    expect(reviewPatchSchema.safeParse({ motion: 7.5 }).success).toBe(false);
    expect(reviewPatchSchema.parse({ note: "   " }).note).toBeNull();
  });
  it("scores each group of the laws of UX, in their order (the columns of migration 027)", () => {
    expect([...REVIEW_KEYS]).toEqual(UX_LAW_GROUPS.map((g) => g.id));
  });
});
