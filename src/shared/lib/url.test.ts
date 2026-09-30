import { describe, expect, it } from "vitest";
import { isHttpUrl, withScheme } from "./url";

describe("withScheme (Postel's law, UX-28)", () => {
  it("adds https:// to a bare domain and trims spaces", () => {
    expect(withScheme("  figma.com/design/abc  ")).toBe("https://figma.com/design/abc");
  });
  it("keeps a value that already has a scheme", () => {
    expect(withScheme("https://example.com")).toBe("https://example.com");
    expect(withScheme("HTTP://example.com")).toBe("HTTP://example.com");
    expect(withScheme("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("leaves an empty value empty", () => {
    expect(withScheme("   ")).toBe("");
  });
});

describe("isHttpUrl", () => {
  it("accepts http and https only", () => {
    expect(isHttpUrl("https://x.y")).toBe(true);
    expect(isHttpUrl("HTTP://x.y")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("file:///etc")).toBe(false);
  });
});
