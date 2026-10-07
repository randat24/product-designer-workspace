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

  it("reads the process counts kept beside the languages, and drops a missing, broken or empty one", () => {
    const process = { competitors: 4, research: 1, observations: 8, insights: 3, pains: 2, opportunities: 3, flows: 1, screens: 5, decisions: 4 };
    expect(snapshotToCase("x", { uk: { title: "T" }, process }, "en")?.process).toEqual(process);
    expect(snapshotToCase("x", { uk: { title: "T" } }, "uk")?.process).toBeUndefined();
    expect(snapshotToCase("x", { uk: { title: "T" }, process: { ...process, screens: -1 } }, "uk")?.process).toBeUndefined();
    const zeros = Object.fromEntries(Object.keys(process).map((k) => [k, 0]));
    expect(snapshotToCase("x", { uk: { title: "T" }, process: zeros }, "uk")?.process).toBeUndefined();
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
