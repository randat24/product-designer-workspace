import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn knows the design-system scales", () => {
  it("a font-size token replaces the size, not the colour", () => {
    expect(cn("text-sm text-on-accent", "text-body")).toBe("text-on-accent text-body");
  });
  it("a colour replaces the colour, not the size token", () => {
    expect(cn("text-meta text-fg-secondary", "text-danger")).toBe("text-meta text-danger");
  });
  it("display sizes are sizes too", () => {
    expect(cn("display-num text-display-lg text-fg", "text-display-xs")).toBe("display-num text-fg text-display-xs");
  });
  it("a radius token replaces the radius", () => {
    expect(cn("rounded-control", "rounded-panel")).toBe("rounded-panel");
  });
});
