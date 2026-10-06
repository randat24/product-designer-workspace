import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const result = vi.hoisted(() => ({ value: { data: [] as unknown[] | null, error: null as unknown } }));
vi.mock("@supabase/supabase-js", () => {
  // Every query builder call returns the builder; awaiting it gives the prepared result.
  const builder: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "order"]) builder[m] = () => builder;
  builder.then = (resolve: (v: unknown) => void) => resolve(result.value);
  return { createClient: () => builder };
});

const { getCases, CasesUnavailableError } = await import("./cases-source");
const { DICTIONARIES } = await import("./content");

describe("getCases (docs/HANDOFF_TRIAGE.md, F04)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://db.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "key");
    // CI sets the sample mode for its build job; each test here chooses its own mode.
    vi.stubEnv("SITE_SAMPLE_CASES", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("data: the published snapshots, in order", async () => {
    result.value = { data: [
      { slug: "a", content: { uk: { title: "А" } }, content_updated_at: "2026-10-01" },
      { slug: "b", content: { uk: { title: "Б" } }, content_updated_at: null },
    ], error: null };
    const cases = await getCases("uk");
    expect(cases.map((c) => c.slug)).toEqual(["a", "b"]);
    expect(cases[0]!.updatedAt).toBe("2026-10-01");
  });

  it("empty: nothing published means no cases, not the samples", async () => {
    result.value = { data: [], error: null };
    expect(await getCases("uk")).toEqual([]);
  });

  it("a snapshot the page cannot render is left out", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    result.value = { data: [
      { slug: "ok", content: { uk: { title: "Так" } }, content_updated_at: null },
      { slug: "broken", content: { uk: { title: "Ні", sections: "текст" } }, content_updated_at: null },
    ], error: null };
    expect((await getCases("uk")).map((c) => c.slug)).toEqual(["ok"]);
  });

  it("failure: the database error is not hidden behind sample cases", async () => {
    result.value = { data: null, error: { message: "connection refused" } };
    await expect(getCases("uk")).rejects.toBeInstanceOf(CasesUnavailableError);
  });

  it("no configuration: the built-in samples (a local build without a database)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(await getCases("en")).toBe(DICTIONARIES.en.cases_list);
  });

  it("explicit sample mode (CI build with no database): the samples, the database is not asked", async () => {
    vi.stubEnv("SITE_SAMPLE_CASES", "1");
    result.value = { data: null, error: { message: "would fail" } };
    expect(await getCases("uk")).toBe(DICTIONARIES.uk.cases_list);
  });
});
