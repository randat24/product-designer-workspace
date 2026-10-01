import { describe, expect, it } from "vitest";
import { budgetBand, findBudgetRange } from "./config";
import { briefFileName } from "./file-name";
import { budgetLabel } from "./labels";
import { normalizeUrl, requestSchema, toDbPayload } from "./schema";

const valid = () => ({
  locale: "uk",
  project: { types: ["redesign", "web_app"], name: "Stefa Books" },
  existing: { has: true, url: "stefa.example", dislikes: "Повільний пошук", links: [{ kind: "figma", url: "https://www.figma.com/design/abc/x" }] },
  about: { summary: "Онлайн-бібліотека з підпискою", goals: ["improve_usability"] },
  audience: { audience: "Батьки", market: "b2c" },
  competitors: { knows_competitors: true, competitors: [{ name: "Yakaboo", url: "yakaboo.ua" }], references: [{ url: "https://linear.app", note: "Чистота" }] },
  scope: { items: ["ux_design"], needs_advice: false },
  materials: { items: ["existing_website"], links: [] },
  budget: { range: "usd_2500_5000", currency: "USD", start: "month", has_deadline: true, deadline_date: "2026-12-01", deadline_reason: "Запуск" },
  contact: { name: "Олена", email: "olena@example.com", preferred_channel: "email" },
  consent: true,
});
const paths = (input: unknown) => {
  const r = requestSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`);
};

describe("normalizeUrl", () => {
  it("adds https, keeps http(s), refuses other schemes, credentials and hosts without a dot", () => {
    expect(normalizeUrl("stefa.example/books")).toBe("https://stefa.example/books");
    expect(normalizeUrl("http://a.b")).toBe("http://a.b/");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("https://user:pass@a.b")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
    expect(normalizeUrl(`https://a.b/${"x".repeat(600)}`)).toBeNull();
  });
});

describe("requestSchema", () => {
  it("accepts a full redesign request and maps it to the database payload", () => {
    const r = requestSchema.parse(valid());
    const p = toDbPayload(r);
    expect(p.existing).toMatchObject({ has: true, url: "https://stefa.example/" });
    expect(p.competitors[0]).toMatchObject({ name: "Yakaboo", url: "https://yakaboo.ua/" });
    expect(p.budget).toEqual({ range: "usd_2500_5000", min: 2500, max: 5000, currency: "USD", note: undefined });
    expect(p.timeline).toMatchObject({ start: "month", has_deadline: true, deadline_date: "2026-12-01" });
    expect(p.client).toMatchObject({ name: "Олена", email: "olena@example.com" });
    expect(p.consent).toEqual({ given: true });
  });

  it("drops answers of hidden questions: no existing product, unknown competitors, no deadline", () => {
    const v = valid();
    v.existing = { has: false, url: "https://ignored.example", dislikes: "x", links: [] } as never;
    v.competitors.knows_competitors = false;
    v.budget = { ...v.budget, has_deadline: false, deadline_date: "bad" };
    const p = toDbPayload(requestSchema.parse(v));
    expect(p.existing).toEqual({ has: false, links: [] });
    expect(p.competitors).toEqual([]);
    expect(p.references).toHaveLength(1);
    expect(p.timeline.deadline_date).toBeUndefined();
  });

  it("requires the explanation for «other» and a name unless the client has none yet", () => {
    const v = valid();
    v.project = { types: ["other"], name: "" } as never;
    expect(paths(v)).toEqual(expect.arrayContaining(["project.type_other:required", "project.name:required"]));
    v.project = { types: ["other"], type_other: "Чат-бот", name_unknown: true } as never;
    expect(paths(v)).toEqual([]);
  });

  it("validates e-mail, URLs, lengths, list sizes and consent", () => {
    const v = valid();
    v.contact.email = "olena@";
    v.competitors.references = [{ url: "ftp://x.y", note: "" }];
    v.about.summary = "я".repeat(4001);
    v.competitors.competitors = Array.from({ length: 11 }, (_, i) => ({ name: `C${i}`, url: "" }));
    (v as { consent: unknown }).consent = false;
    expect(paths(v)).toEqual(expect.arrayContaining([
      "contact.email:invalid_email",
      "competitors.references.0.url:invalid_url",
      "about.summary:too_long",
      "competitors.competitors:too_many",
      "consent:consent",
    ]));
  });

  it("custom budget needs an amount, ranges must match the currency, a deadline needs a date", () => {
    const v = valid();
    v.budget = { ...v.budget, range: "custom", has_deadline: true, deadline_date: "" } as never;
    expect(paths(v)).toEqual(expect.arrayContaining(["budget.min:required", "budget.deadline_date:invalid_date"]));
    v.budget = { ...v.budget, range: "usd_2500_5000", currency: "UAH", deadline_date: "2026-12-01" } as never;
    expect(paths(v)).toEqual(["budget.range:invalid_budget"]);
    v.budget = { ...v.budget, range: "custom", currency: "EUR", min: "3 000", max: 2000 } as never;
    expect(paths(v)).toEqual(["budget.max:invalid_budget"]);
    v.budget = { ...v.budget, range: "custom", currency: "EUR", min: "3 000", max: 4500 } as never;
    expect(toDbPayload(requestSchema.parse(v)).budget).toMatchObject({ range: "custom", min: 3000, max: 4500, currency: "EUR" });
  });

  it("a preferred channel needs its contact", () => {
    const v = valid();
    v.contact = { ...v.contact, preferred_channel: "telegram" };
    expect(paths(v)).toEqual(["contact.telegram:required"]);
  });

  it("«I don't know — I need your advice» replaces picking services", () => {
    const v = valid();
    v.scope = { items: [], needs_advice: false };
    expect(paths(v)).toEqual(["scope.items:pick_one"]);
    v.scope = { items: [], needs_advice: true };
    expect(paths(v)).toEqual([]);
  });
});

describe("budget config", () => {
  it("finds ranges in any currency and buckets them for analytics without amounts", () => {
    expect(findBudgetRange("uah_40000_100000")).toMatchObject({ currency: "UAH", tier: 3 });
    expect(budgetBand("usd_lt_500")).toBe("lt_1k");
    expect(budgetBand("eur_2500_5000")).toBe("1k_5k");
    expect(budgetBand("uah_400000_plus")).toBe("5k_plus");
    expect(budgetBand("estimate")).toBe("estimate");
    expect(budgetBand(null)).toBe("undecided");
  });
});

describe("budgetLabel", () => {
  it("formats ranges, open bounds and special answers per language", () => {
    expect(budgetLabel({ range: "usd_2500_5000", min: 2500, max: 5000, currency: "USD" }, "en")).toBe("$2,500–5,000");
    expect(budgetLabel({ range: "usd_lt_500", min: 0, max: 500, currency: "USD" }, "uk")).toBe("До $500");
    expect(budgetLabel({ range: "uah_400000_plus", min: 400000, max: null, currency: "UAH" }, "uk")).toMatch(/^₴400\s000\+$/);
    expect(budgetLabel({ range: "estimate" }, "uk")).toBe("Потрібна оцінка");
    expect(budgetLabel({ range: "custom", min: 3000, currency: "EUR" }, "en")).toBe("€3,000+");
  });
});

describe("briefFileName", () => {
  it("transliterates Ukrainian names and falls back to the request code", () => {
    expect(briefFileName("Стефа Книжки", "REQ-2026-0001", "2026-10-01T10:00:00Z")).toBe("Project-Brief-Stefa-Knyzhky-2026-10-01.pdf");
    expect(briefFileName("Stefa Books", "REQ-2026-0001", "2026-10-01T10:00:00Z")).toBe("Project-Brief-Stefa-Books-2026-10-01.pdf");
    expect(briefFileName(null, "REQ-2026-0012", "2026-10-01T10:00:00Z")).toBe("Project-Brief-REQ-2026-0012-2026-10-01.pdf");
    expect(briefFileName("Їжак / ґанок!", "REQ-1", "2026-01-02")).toBe("Project-Brief-Yizhak-ganok-2026-01-02.pdf");
  });
});
