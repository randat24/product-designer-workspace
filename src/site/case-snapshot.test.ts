import { describe, expect, it } from "vitest";
import { DICTIONARIES, LOCALES } from "./content";
import { snapshotProblem, snapshotToCase } from "./case-snapshot";

// A snapshot goes through JSON on its way to the database and back.
const roundTrip = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe("case snapshot check", () => {
  it("accepts every built-in case and gives it back unchanged", () => {
    for (const locale of LOCALES) {
      for (const item of DICTIONARIES[locale].cases_list) {
        const { slug, updatedAt: _u, ...rest } = item;
        const back = snapshotToCase(slug, { [locale]: roundTrip(rest) }, locale);
        expect(back, `${locale}/${slug}`).not.toBeNull();
        expect(back!.title).toBe(item.title);
        expect(back!.product?.disciplines).toEqual(item.product?.disciplines);
        expect(back!.sections.length).toBe(item.sections.length);
      }
    }
  });

  it("falls back to Ukrainian when a translation is missing", () => {
    expect(snapshotToCase("x", { uk: { title: "Назва" } }, "en")?.title).toBe("Назва");
  });

  it("leaves out what the page cannot render", () => {
    expect(snapshotToCase("x", {}, "uk")).toBeNull();
    expect(snapshotToCase("x", { uk: { title: "" } }, "uk")).toBeNull();
    expect(snapshotToCase("x", { uk: { title: "T", sections: "not a list" } }, "uk")).toBeNull();
    expect(snapshotToCase("x", { uk: { title: "T", metrics: [{ value: 1 }] } }, "uk")).toBeNull();
    expect(snapshotToCase("x", { uk: { title: "T", product: { disciplines: null } } }, "uk")).toBeNull();
  });

  it("tolerates nulls the editor may leave", () => {
    const c = snapshotToCase("x", { uk: { title: "T", liveUrl: null, cover: null, summary: null } }, "uk");
    expect(c?.liveUrl).toBeUndefined();
    expect(c?.summary).toBe("");
  });

  it("names the first problem for the editor", () => {
    expect(snapshotProblem({ uk: { title: "T" } }, "uk")).toBeNull();
    expect(snapshotProblem({}, "uk")).not.toBeNull();
  });
});
