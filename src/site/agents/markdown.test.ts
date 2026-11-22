import { describe, expect, it } from "vitest";
import { DICTIONARIES, type Case } from "../content";
import { markdownPath } from "../seo";
import { aboutMarkdown, caseMarkdown, casesMarkdown, homeMarkdown, notesMarkdown } from "./markdown";

describe("markdownPath: which pages have a Markdown twin", () => {
  it("home, about, the case list, a case and the notes", () => {
    expect(markdownPath("uk", "")).toBe("/uk.md");
    expect(markdownPath("en", "/about")).toBe("/en/about.md");
    expect(markdownPath("uk", "/cases")).toBe("/uk/cases.md");
    expect(markdownPath("en", "/cases/neural-webcam")).toBe("/en/cases/neural-webcam.md");
    expect(markdownPath("uk", "/notes")).toBe("/uk/notes.md");
  });
  it("not the form, privacy or a single note", () => {
    expect(markdownPath("uk", "/start-project")).toBeNull();
    expect(markdownPath("uk", "/privacy")).toBeNull();
    expect(markdownPath("uk", "/notes/3")).toBeNull();
  });
});

const sample: Case = {
  slug: "demo",
  sticker: "",
  year: "2026",
  title: "Demo | case",
  client: "Acme",
  role: "Product designer",
  summary: "A short\nsummary.",
  tags: ["fintech"],
  metrics: [{ value: "+20%", label: "conversion" }],
  sections: [{ title: "Problem", body: "Para one.\n\nPara two." }],
  kind: "real",
  sample: true,
  gallery: [{ src: "/cases/demo/1.png", alt: "Main screen", width: 10, height: 10 }],
};

describe("case Markdown", () => {
  it("has the title, facts, sections, numbers and a link back to the HTML page", () => {
    const md = caseMarkdown("en", DICTIONARIES.en, sample);
    expect(md).toMatch(/^# Demo \| case\n\n> A short summary\.\n/);
    expect(md).toContain("/en/cases/demo");
    expect(md).toContain("/uk/cases/demo.md");
    expect(md).toContain("- Client: Acme");
    expect(md).toContain("- Type: real project");
    expect(md).toContain("- +20%: conversion");
    expect(md).toContain("## Problem\n\nPara one.\n\nPara two.");
    expect(md).toContain("Sample case");
    expect(md).toMatch(/- Main screen: https?:\/\/.+\/cases\/demo\/1\.png/);
  });
  it("leaves the mockups of an 18+ case out", () => {
    expect(caseMarkdown("en", DICTIONARIES.en, { ...sample, adult: true })).not.toContain("Main screen");
  });
  it("renders a full story with every block", () => {
    const md = caseMarkdown("uk", DICTIONARIES.uk, {
      ...sample,
      sample: false,
      story: {
        meta: [],
        overview: { challenge: "C", solution: "S", outcome: "O" },
        process: [],
        insights: [{ code: "INS-001", title: "People forget", body: "Body", evidence: "3 of 5" }],
        competitors: { intro: "I", products: ["Ours", "Them"], rows: [{ feature: "Search", marks: ["yes", "no"] }] },
        decisions: [{ code: "DEC-001", title: "One step", why: "Because", rejected: ["Two steps"], evidence: ["INS-001"] }],
      },
    });
    expect(md).toContain("### INS-001: People forget");
    expect(md).toContain("| Search | Є | Немає |");
    expect(md).toContain("### DEC-001: One step");
    expect(md).not.toContain("## Problem");
  });
});

describe("page Markdown", () => {
  it("home and the case list skip sample cases", () => {
    const real = { ...sample, slug: "real", title: "Real one", sample: false };
    for (const md of [homeMarkdown("en", DICTIONARIES.en, [sample, real]), casesMarkdown("en", DICTIONARIES.en, [sample, real])]) {
      expect(md).toContain("[Real one]");
      expect(md).not.toContain("[Demo");
    }
  });
  it("about has the name, experience and contacts", () => {
    const md = aboutMarkdown("uk", DICTIONARIES.uk);
    expect(md).toContain(DICTIONARIES.uk.name);
    expect(md).toContain(`## ${DICTIONARIES.uk.about.skills}`);
    expect(md).toContain("## Контакти");
  });
  it("notes: the text, its date and a link", () => {
    const md = notesMarkdown("en", DICTIONARIES.en, [
      { number: 2, body: "Second", image: null, tags: ["ux"], parent: 1, publishedAt: "2026-11-01T10:00:00Z", reactions: {} },
    ]);
    expect(md).toContain("## #2 · 2026-11-01");
    expect(md).toContain("/en/notes/2");
    expect(md).toContain("continues note #1");
  });
});
