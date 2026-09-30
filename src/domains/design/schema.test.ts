import { describe, expect, it } from "vitest";
import { decisionSchema, screenSpecSchema } from "./schema";

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
