import { afterEach, describe, expect, it, vi } from "vitest";
import { trustedOrigin } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("trustedOrigin", () => {
  it("keeps the site URL and this Vercel deployment, and nothing else", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "app-abc123-team.vercel.app");
    expect(trustedOrigin("https://example.com")).toBe("https://example.com");
    expect(trustedOrigin("https://app-abc123-team.vercel.app")).toBe("https://app-abc123-team.vercel.app");
    expect(trustedOrigin("https://evil.example")).toBe("https://example.com");
    expect(trustedOrigin("https://example.com.evil.example")).toBe("https://example.com");
    expect(trustedOrigin("http://localhost:3000")).toBe("https://example.com");
    expect(trustedOrigin(null)).toBe("https://example.com");
  });
  it("keeps localhost on any port when not on Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("VERCEL", "");
    expect(trustedOrigin("http://localhost:3111")).toBe("http://localhost:3111");
    expect(trustedOrigin("http://localhost.evil.example")).toBe("https://example.com");
  });
});
