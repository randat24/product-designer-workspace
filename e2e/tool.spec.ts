import { expect, test, type Page } from "@playwright/test";
import { hasToolUser } from "../playwright.config";
import { AUTH_FILE, contrastViolations, expectAccessible, horizontalOverflow, watchErrors } from "./helpers";

// The workspace tool, signed in, on the demo project: every section and one detail page of each list
// renders without errors and passes axe. Colour contrast and phone overflow are reported on every run and
// become strict with E2E_STRICT_A11Y / E2E_STRICT_MOBILE (stages 3 and 4 of docs/QUALITY_REVIEW.md).
test.skip(!hasToolUser, "E2E_EMAIL / E2E_PASSWORD not set");
test.use({ storageState: AUTH_FILE });

const ERROR_TITLE = "Не вдалося відкрити сторінку";

async function openDemoProject(page: Page): Promise<string> {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/w\/[^/]+$/);
  // A fresh account shows the demo button; later runs already have the project. Wait for either.
  const demo = page.getByRole("button", { name: "Відкрити демо-проєкт" });
  // The demo project by its slug: other projects (e.g. one made from a project request) may be listed first.
  const existing = page.locator('main a[href*="/p/restaurant-app"]').first();
  await expect(demo.or(existing)).toBeVisible();
  if (await demo.isVisible()) await demo.click();
  else await existing.click();
  await expect(page).toHaveURL(/\/w\/[^/]+\/p\/[^/]+$/);
  await ready(page);
  return new URL(page.url()).pathname;
}

/** The project shell is rendered (past the loading skeleton) and React has hydrated. */
async function ready(page: Page) {
  await expect(page.getByRole("navigation", { name: "Розділи проєкту" }).locator("a").first()).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState("networkidle");
}

/** Section pages from the navigation rail plus the first detail page of each list. */
async function collectPages(page: Page, base: string) {
  const sections = await page.getByRole("navigation", { name: "Розділи проєкту" })
    .locator(`a[href^="${base}"]`).evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  const pages = [...sections];
  for (const s of sections) {
    if (s === base) continue;
    // A page that never finishes rendering fails here, named, instead of using up the whole test timeout.
    await test.step(`collect ${s.replace(base, "")}`, () => page.goto(s, { waitUntil: "domcontentloaded", timeout: 60_000 }));
    await page.locator("main h1").first().waitFor({ timeout: 20_000 }).catch(() => {});
    // Read without waiting: a section without detail pages (settings) has no such link, and a waiting
    // getAttribute would block until the test timeout.
    const detail = await page.locator(`main a[href^="${s}/"]`).evaluateAll((as) => as[0]?.getAttribute("href") ?? null);
    if (detail && !pages.includes(detail)) pages.push(detail);
  }
  return pages;
}

test("every section and detail page renders and is accessible", async ({ page }, testInfo) => {
  test.setTimeout(900_000);
  const base = await openDemoProject(page);
  const pages = await collectPages(page, base);
  expect(pages.length).toBeGreaterThan(10);

  const contrast: Record<string, string[]> = {};
  const overflow: Record<string, string[]> = {};
  for (const path of pages) {
    await test.step(path.replace(base, "") || "overview", async () => {
      const errors = watchErrors(page);
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await expect(page.getByText(ERROR_TITLE)).toHaveCount(0);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expectAccessible(page, testInfo);
      const c = await contrastViolations(page);
      if (c.length) contrast[path] = c;
      const o = await horizontalOverflow(page);
      if (o.length) overflow[path] = o;
      expect(errors, `errors on ${path}`).toEqual([]);
    });
  }

  await testInfo.attach("contrast-report", { body: JSON.stringify(contrast, null, 2), contentType: "application/json" });
  await testInfo.attach("phone-overflow-report", { body: JSON.stringify(overflow, null, 2), contentType: "application/json" });
  console.log(`[${testInfo.project.name}] pages: ${pages.length}, contrast issues on ${Object.keys(contrast).length}, sideways scroll on ${Object.keys(overflow).length}`);
  if (process.env.E2E_STRICT_A11Y) expect(contrast).toEqual({});
  if (process.env.E2E_STRICT_MOBILE && testInfo.project.name === "phone") expect(overflow).toEqual({});
});

test("brief autosaves and keeps the text after reload", async ({ page }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/brief`);
  await ready(page);
  const field = page.getByLabel("Що за продукт");
  const text = `Перевірка автозбереження ${Date.now()}`;
  await field.clear();
  await field.fill(text);
  await expect(page.getByRole("status").filter({ hasText: "Збережено" })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Що за продукт")).toHaveValue(text);
});

test("offline: edits wait for the connection and save once it is back", async ({ page, context }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/brief`);
  await ready(page);
  await context.setOffline(true);
  await expect(page.getByText("Немає з'єднання з інтернетом", { exact: false })).toBeVisible();
  const text = `Офлайн-правка ${Date.now()}`;
  await page.getByLabel("Що за продукт").fill(text);
  await expect(page.getByRole("status").filter({ hasText: "Зміни збережуться, щойно зв'язок повернеться" }).first()).toBeVisible({ timeout: 10_000 });
  await context.setOffline(false);
  await expect(page.getByText("З'єднання відновлено")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Збережено" })).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Що за продукт")).toHaveValue(text);
});

test("date field: a typed date that is not a date is explained", async ({ page }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/brief`);
  await ready(page);
  const date = page.locator('input[placeholder="дд.мм.рррр"]').first();
  await date.fill("31.02.2026");
  await date.press("Enter");
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert").filter({ hasText: "Це не схоже на дату" })).toBeVisible();
  await date.fill("");
  await date.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "Це не схоже на дату" })).toHaveCount(0);
});

test("a record that does not exist says so and leads back", async ({ page }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/insights/INS-999`);
  await expect(page.getByRole("heading", { level: 1, name: "Цього вже немає або доступ закрито" })).toBeVisible();
  await expect(page.getByRole("link", { name: "До огляду проєкту" })).toHaveAttribute("href", base);
});

test("command palette: Ctrl+K, type, Enter navigates; Esc closes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "keyboard shortcut — desktop");
  const base = await openDemoProject(page);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.type("Екрани");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${base}/screens`);
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("project backup: settings download the whole project as JSON", async ({ page }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/settings`);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Завантажити проєкт (JSON)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.json$/);
  const fs = await import("node:fs/promises");
  const data = JSON.parse(await fs.readFile((await download.path())!, "utf8"));
  expect(data.format).toBe("pdw-project-export");
  expect(data.project.slug).toBe(base.split("/").pop());
  // The demo project has research and synthesis: the backup is not an empty shell.
  expect(data.counts.interviews).toBeGreaterThan(0);
  expect(data.counts.insights).toBeGreaterThan(0);
  expect(data.tables.project_counters).toBeUndefined();
});

/** Sends a project request the way the public form does (the anon RPC with the narrow secret); returns its code. */
async function submitRequest(name: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
  const res = await fetch(`${url}/rest/v1/rpc/submit_project_request`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_payload: {
        locale: "uk",
        client: { name: "Олена", email: "olena@example.com" },
        project: { types: ["redesign"], name },
        about: { summary: "Онлайн-бібліотека з підпискою", problem: "Складно обрати книжку" },
        competitors: [{ name: "Yakaboo", url: "https://yakaboo.ua" }],
        timeline: { has_deadline: true, deadline_date: "2026-12-01" },
        consent: { given: true },
      },
      p_secret: process.env.INTAKE_SUBMIT_SECRET,
      p_ip_hash: hex(),
      p_idempotency_key: crypto.randomUUID(),
    }),
  });
  expect(res.ok, await res.clone().text()).toBe(true);
  return ((await res.json()) as { code: string }).code;
}

// Last in this file: converting adds a project, and the tests above expect the demo project to exist first.
// Each run (desktop, phone) sends and converts its own request, so the two never pick the same one.
test("requests: review a request and turn it into a project", async ({ page }, testInfo) => {
  test.skip(!process.env.INTAKE_SUBMIT_SECRET || !process.env.NEXT_PUBLIC_SUPABASE_URL,
    "no project requests without INTAKE_SUBMIT_SECRET and the database URL");
  test.setTimeout(120_000);
  const code = await submitRequest(`E2E ${testInfo.project.name} ${Date.now()}`);
  const errors = watchErrors(page);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/w\/[^/]+$/);
  await page.getByRole("link", { name: /^Заявки/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Заявки" })).toBeVisible();
  await expectAccessible(page, testInfo);
  expect(await horizontalOverflow(page)).toEqual([]);

  // The new request is listed under «Новые». It is opened by its address: on a busy runner a click right
  // after the filter navigation was sometimes dropped by the client router.
  const newFilter = page.getByRole("link", { name: "Нові", exact: true });
  await newFilter.click();
  await expect(newFilter).toHaveAttribute("aria-current", "page");
  const row = page.locator(`main a[href$="/requests/${code}"]`);
  await expect(row).toBeVisible();
  await page.goto((await row.getAttribute("href"))!);
  await expect(page.getByText("Дані клієнта — не перевірені дослідженням")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Про проєкт" })).toBeVisible();
  await expectAccessible(page, testInfo);
  expect(await horizontalOverflow(page)).toEqual([]);

  // The designer's PDF copy.
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Бриф (PDF, UK)" }).first().click()]);
  expect(download.suggestedFilename()).toMatch(/^Project-Brief-.+-uk\.pdf$/);

  // Status and a private note.
  await page.getByLabel("Статус").selectOption("qualified");
  await page.getByRole("button", { name: "Зберегти" }).click();
  await expect(page.locator("article header").getByText("Підходить", { exact: true })).toBeVisible();
  await page.getByLabel("Додати нотатку").fill("Уточнити терміни");
  await page.getByRole("button", { name: "Додати нотатку" }).click();
  await expect(page.getByText("Уточнити терміни")).toBeVisible();

  // Request → project: the brief says where its text came from.
  await page.getByRole("button", { name: "Зробити проєктом" }).click();
  await expect(page).toHaveURL(/\/p\/[^/]+\/brief$/, { timeout: 20_000 });
  await expect(page.getByText(/Частину брифу заповнено із заявки REQ-/)).toBeVisible();
  await expect(page.getByText(/Зі слів клієнта \(REQ-/).first()).toBeVisible();
  expect(errors).toEqual([]);
});
