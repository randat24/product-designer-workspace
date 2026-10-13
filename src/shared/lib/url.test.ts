import { describe, expect, it } from "vitest";
import { httpUrlOrNull, isHttpUrl, optionalHttpUrl, withScheme } from "./url";

describe("withScheme (Postel's law, UX-28)", () => {
  it("adds https:// to a bare domain and trims spaces", () => {
    expect(withScheme("  figma.com/design/abc  ")).toBe("https://figma.com/design/abc");
  });
  it("keeps a value that already has a scheme", () => {
    expect(withScheme("https://example.com")).toBe("https://example.com");
    expect(withScheme("HTTP://example.com")).toBe("HTTP://example.com");
    expect(withScheme("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("reads host:port as a host, not as a scheme", () => {
    expect(withScheme("acme.com:8080/pricing")).toBe("https://acme.com:8080/pricing");
    expect(withScheme("localhost:3000")).toBe("https://localhost:3000");
    expect(withScheme("javascript:alert(1)")).toBe("javascript:alert(1)");
    expect(withScheme("127.0.0.1:3000/x")).toBe("https://127.0.0.1:3000/x");
  });
  it("keeps scheme:digits as a scheme, not a host with a port", () => {
    for (const v of ["tel:0501234567", "skype:12345", "javascript:1"]) expect(withScheme(v)).toBe(v);
    expect(optionalHttpUrl().safeParse("tel:0501234567").success).toBe(false);
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

describe("optionalHttpUrl and httpUrlOrNull", () => {
  it("accept http(s) and bare hosts, turn empty into null, reject other schemes", () => {
    const schema = optionalHttpUrl();
    expect(schema.parse("acme.com:8080")).toBe("https://acme.com:8080");
    expect(schema.parse("")).toBeNull();
    expect(schema.parse(undefined)).toBeNull();
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "mailto:a@b.co"]) expect(schema.safeParse(bad).success).toBe(false);
    expect(httpUrlOrNull(" acme.com ")).toBe("https://acme.com");
    expect(httpUrlOrNull("javascript:alert(1)")).toBeNull();
    expect(httpUrlOrNull(null)).toBeNull();
  });
  it("treat a scheme being typed by hand as still empty", () => {
    const schema = optionalHttpUrl();
    for (const v of ["http:", "https:", "http:/", "https://", "HTTP:/"]) expect(schema.parse(v)).toBeNull();
    expect(schema.parse("https://a.co")).toBe("https://a.co");
  });
  it("httpUrlOrNull: placeholder cells from an imported file are not links", () => {
    for (const v of ["n/a", "—", "см. сайт", "-", "tbd", "https://n/a"]) expect(httpUrlOrNull(v)).toBeNull();
    expect(httpUrlOrNull("localhost:3000")).toBe("https://localhost:3000");
    expect(httpUrlOrNull("https://acme.com/pricing")).toBe("https://acme.com/pricing");
  });
});
