import { afterEach, describe, expect, it, vi } from "vitest";
import { trustedOrigin } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("trustedOrigin", () => {
  it("keeps the origin the request was sent to: main domain, alias, preview, localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    expect(trustedOrigin("https://example.com", "example.com")).toBe("https://example.com");
    expect(trustedOrigin("https://www.example.com", "www.example.com")).toBe("https://www.example.com");
    expect(trustedOrigin("https://app-abc123-team.vercel.app", "app-abc123-team.vercel.app")).toBe("https://app-abc123-team.vercel.app");
    expect(trustedOrigin("http://localhost:3111", "localhost:3111")).toBe("http://localhost:3111");
    expect(trustedOrigin("http://192.168.1.20:3000", "192.168.1.20:3000")).toBe("http://192.168.1.20:3000");
    expect(trustedOrigin("https://Example.com", "example.com")).toBe("https://example.com");
  });
  it("falls back to the site URL when the header disagrees with the request or is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    expect(trustedOrigin("https://evil.example", "example.com")).toBe("https://example.com");
    expect(trustedOrigin("https://example.com.evil.example", "example.com")).toBe("https://example.com");
    expect(trustedOrigin("not a url", "example.com")).toBe("https://example.com");
    expect(trustedOrigin("javascript://example.com", "example.com")).toBe("https://example.com");
    expect(trustedOrigin(null, "example.com")).toBe("https://example.com");
    expect(trustedOrigin("https://example.com", null)).toBe("https://example.com");
  });
});
