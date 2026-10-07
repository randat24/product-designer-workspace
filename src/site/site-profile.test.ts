import { describe, expect, it } from "vitest";
import { dict } from "./content";
import { applyProfile, profileFromDictionary, readProfileLocale, siteProfileLocaleSchema } from "./site-profile";

const uk = dict("uk");

describe("readProfileLocale", () => {
  it("reads one language and ignores a broken or missing one", () => {
    expect(readProfileLocale({ uk: { summary: "Привіт" } }, "uk")).toEqual({ summary: "Привіт" });
    expect(readProfileLocale({ uk: { summary: "Привіт" } }, "en")).toBeNull();
    expect(readProfileLocale({ uk: { facts: "7 років" } }, "uk")).toBeNull();
    expect(readProfileLocale(null, "uk")).toBeNull();
    expect(readProfileLocale("text", "uk")).toBeNull();
  });

  it("accepts only https certificate links; an empty one means no link", () => {
    const edu = (certificate: string) => siteProfileLocaleSchema.safeParse({ education: [{ title: "Курс", place: "Coursera", year: "2024", certificate }] });
    expect(edu("https://coursera.org/verify/1").success).toBe(true);
    expect(edu("javascript:alert(1)").success).toBe(false);
    expect(edu("http://example.com").success).toBe(false);
    const empty = edu("");
    expect(empty.success && empty.data.education?.[0]?.certificate).toBeUndefined();
  });
});

describe("profileFromDictionary", () => {
  it("starts the editor from the design career, without the service", () => {
    const p = profileFromDictionary(uk);
    expect(p.summary).toBe(uk.about.summary);
    expect(p.facts).toHaveLength(uk.about.facts.length);
    expect(p.jobs).toHaveLength(uk.jobs.filter((j) => !j.military).length);
    expect(siteProfileLocaleSchema.safeParse(p).success).toBe(true);
  });
});

describe("applyProfile", () => {
  it("keeps the page from the code when nothing is written", () => {
    expect(applyProfile(uk, null)).toBe(uk);
    expect(applyProfile(uk, {})).toEqual(uk);
  });

  it("puts in the written fields and keeps the service job", () => {
    const d = applyProfile(uk, {
      summary: "Новий опис",
      facts: [{ value: "8", label: "років" }],
      jobs: [{ period: "2025 —", title: "Lead", place: "Студія", points: ["UX", ""], details: [] }],
    });
    expect(d.about.summary).toBe("Новий опис");
    expect(d.about.facts).toEqual([{ value: "8", label: "років" }]);
    expect(d.about.title).toBe(uk.about.title);
    const design = d.jobs.filter((j) => !j.military);
    expect(design).toEqual([{ period: "2025 —", title: "Lead", place: "Студія", points: ["UX"], details: undefined }]);
    expect(d.jobs.filter((j) => j.military)).toEqual(uk.jobs.filter((j) => j.military));
    expect(d.skills).toBe(uk.skills);
  });

  it("skips the empty rows and lines the editor leaves while typing", () => {
    const d = applyProfile(uk, {
      facts: [{ value: "", label: "" }],
      availability: ["Віддалено", "", "  "],
      languages: [{ name: "", level: "B2" }, { name: "Польська", level: "A2" }],
    });
    expect(d.about.facts).toBe(uk.about.facts);
    expect(d.availability).toEqual(["Віддалено"]);
    expect(d.languages).toEqual([{ name: "Польська", level: "A2" }]);
  });
});
