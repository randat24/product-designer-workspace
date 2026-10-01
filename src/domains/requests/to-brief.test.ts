import { describe, expect, it } from "vitest";
import type { BriefSnapshot } from "./snapshot";
import { buildNewRequestNotice } from "./notification";
import { requestSchema } from "./schema";
import { requestPlatforms, requestToBrief } from "./to-brief";

const snap = (patch: Partial<BriefSnapshot> = {}): BriefSnapshot => ({
  code: "REQ-2026-0001", submitted_at: "2026-10-01T10:00:00Z", locale: "uk", form_version: 1,
  client: { name: "Олена", email: "o@e.co", company: null, role: null, phone: null, telegram: null, website: null, preferred_channel: "email", preferred_channel_note: null },
  project: { types: ["redesign", "mobile_app"], type_other: null, name: "Stefa", name_unknown: false },
  existing: { has: true, url: "https://stefa.example/", description: "Бібліотека", dislikes: "Пошук", works_well: null, must_change: null, links: [{ kind: "figma", url: "https://figma.com/design/x" }] },
  about: { summary: "Онлайн-бібліотека", what_it_does: null, problem: "Складно обрати", why_now: "Запуск", goals: ["improve_usability", "other"], goal_other: "Інвестори" },
  audience: { audience: "Батьки", primary_users: null, geography: "Україна", market: "b2c", demographics: null, pain_points: "Довго шукати" },
  competitors: [], references: [{ url: "https://linear.app/", note: "Чистота" }],
  scope: { items: ["ux_design"], needs_advice: true }, materials: { items: ["logo"], links: [] },
  budget: { range: "usd_1000_2500", min: 1000, max: 2500, currency: "USD", note: "секрет" },
  timeline: { start: "month", has_deadline: false, deadline_date: null, deadline_reason: null },
  additional_info: "Обмеження API", consent: { at: "2026-10-01T10:00:00Z", privacy_policy_version: "2026-10-01" },
  ...patch,
});

describe("requestToBrief", () => {
  it("maps the client's answers into brief fields with workspace labels", () => {
    const b = requestToBrief(snap());
    expect(b.product_description).toBe("Онлайн-бібліотека\n\nПочему сейчас: Запуск");
    expect(b.problem).toBe("Складно обрати");
    expect(b.goals).toEqual(["Сделать удобнее", "Інвестори"]);
    expect(b.target_audience).toContain("Рынок: B2C");
    expect(b.target_audience).toContain("Боли (со слов клиента): Довго шукати");
    expect(b.business_requirements).toContain("Ожидаемый объём работ: UX-дизайн");
    expect(b.business_requirements).toContain("просит совета");
    expect(b.links).toEqual([
      { title: "Текущий продукт", url: "https://stefa.example/" },
      { title: "Figma", url: "https://figma.com/design/x" },
      { title: "Референс: Чистота", url: "https://linear.app/" },
    ]);
    expect(b.constraints).toBe("Обмеження API");
  });

  it("never copies the budget and leaves out what the client did not answer", () => {
    const b = requestToBrief(snap({ existing: { has: false, url: null, description: null, dislikes: null, works_well: null, must_change: null, links: [] } }));
    expect(JSON.stringify(b)).not.toMatch(/секрет|1000|2500/);
    expect(b.existing_product).toBeUndefined();
  });

  it("derives platforms from the work types", () => {
    expect(requestPlatforms(["mobile_app", "saas"]).sort()).toEqual(["android", "ios", "web"]);
    expect(requestPlatforms(["ux_audit"])).toEqual([]);
  });
});

describe("buildNewRequestNotice", () => {
  it("names the request and links to it, without contact details or answers", () => {
    const d = requestSchema.parse({
      locale: "uk",
      project: { types: ["redesign"], name: "Stefa <Books>" },
      existing: { has: false },
      about: { summary: "Секретний опис" },
      audience: {},
      competitors: {},
      scope: { items: [], needs_advice: true },
      materials: {},
      budget: { range: "usd_2500_5000", currency: "USD", start: "month", has_deadline: false, note: "тільки для вас" },
      contact: { name: "Олена", email: "olena@example.com", phone: "+380 67 000 00 00", telegram: "@olena", preferred_channel: "email" },
      consent: true,
    });
    const n = buildNewRequestNotice(d, "REQ-2026-0012", "https://site.example/app/requests/REQ-2026-0012");
    expect(n.subject).toBe("Новая заявка REQ-2026-0012: Stefa <Books>");
    expect(n.text).toMatch(/Бюджет: \$2\s500–5\s000/);
    expect(n.text).toContain("Открыть заявку: https://site.example/app/requests/REQ-2026-0012");
    for (const secret of ["olena@example.com", "+380", "@olena", "Секретний опис", "тільки для вас"]) {
      expect(n.text + n.html).not.toContain(secret);
    }
    expect(n.html).toContain("Stefa &lt;Books&gt;");
  });
});
