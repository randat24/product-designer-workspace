import { expect, test, type Page, type Request, type TestInfo } from "@playwright/test";
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

/**
 * Tests that save into the shared demo project run on the desktop project only. Desktop and phone runs share the
 * account and go in parallel: two runs editing the same record at once would (rightly) meet the two-tab conflict check.
 */
function savesSharedRecord(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "desktop", "edits the shared demo project; covered by the desktop run");
}

/** A server action call (autosave and other in-page writes). */
const isAction = (r: Request) => r.method() === "POST" && !!r.headers()["next-action"];

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

test("brief autosaves and keeps the text after reload", async ({ page }, testInfo) => {
  savesSharedRecord(testInfo);
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

test("offline: edits wait for the connection and save once it is back", async ({ page, context }, testInfo) => {
  savesSharedRecord(testInfo);
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

  // After the reconnect the pause before saving is back: a typed word goes as one save, not one per letter.
  let saves = 0;
  page.on("request", (r) => { if (isAction(r)) saves++; });
  await page.getByLabel("Що за продукт").pressSequentially(" ще", { delay: 120 });
  await expect(page.getByRole("status").filter({ hasText: "Збережено" })).toBeVisible({ timeout: 10_000 });
  expect(saves).toBe(1);

  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Що за продукт")).toHaveValue(`${text} ще`);
});

test("leaving the page right after typing still saves the edit", async ({ page }, testInfo) => {
  savesSharedRecord(testInfo);
  const base = await openDemoProject(page);
  await page.goto(`${base}/brief`);
  await ready(page);
  const text = `Швидкий перехід ${Date.now()}`;
  const saved = page.waitForResponse((r) => isAction(r.request()));
  await page.getByLabel("Що за продукт").fill(text);
  // Well inside the 800 ms pause: the editor unmounts before its timer fires.
  await page.locator(`nav a[href="${base}/competitors"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`${base}/competitors$`));
  await saved;
  await page.goto(`${base}/brief`);
  await ready(page);
  await expect(page.getByLabel("Що за продукт")).toHaveValue(text);
});

test("field autosave: going back to the earlier text while a save is on its way saves it too", async ({ page }, testInfo) => {
  savesSharedRecord(testInfo);
  const base = await openDemoProject(page);
  await page.goto(`${base}/research/matrix`);
  await ready(page);
  const name = page.getByRole("textbox", { name: /^Ім'я / }).first();
  const label = (await name.getAttribute("aria-label"))!;
  const a = `Учасник ${Date.now()}`;
  let done = 0;
  // Answers, not "finished" requests: the browser drops the rest of an action's stream once Next has read it.
  page.on("response", (r) => { if (isAction(r.request())) done++; });
  await name.fill(a);
  await name.blur();
  await expect.poll(() => done).toBe(1);

  // Hold the next saves for a while so "B" is still on its way when the text goes back to "A".
  let sent = 0;
  await page.route("**/*", async (route) => {
    if (isAction(route.request())) {
      sent++;
      await new Promise((r) => setTimeout(r, 1_500));
    }
    await route.continue();
  });
  await name.fill(`${a} Б`);
  await expect.poll(() => sent).toBe(1);
  await name.fill(a);
  await expect.poll(() => done, { timeout: 15_000 }).toBe(3);

  await page.unroute("**/*");
  await page.reload();
  await ready(page);
  await expect(page.getByRole("textbox", { name: label })).toHaveValue(a);
});

test("a rejected value is explained and not sent again and again", async ({ page }, testInfo) => {
  savesSharedRecord(testInfo);
  const base = await openDemoProject(page);
  await page.goto(`${base}/screens`);
  await ready(page);
  await page.locator('main a[href*="/screens/"]').first().click();
  await ready(page);
  const figma = page.getByLabel("Посилання на Figma");
  const before = await figma.inputValue();
  let saves = 0;
  page.on("request", (r) => { if (isAction(r)) saves++; });
  await figma.fill("javascript:alert(1)");
  await expect(page.locator("#figma-error")).toHaveText("Потрібне посилання на Figma: figma.com/… або https://…");
  expect(saves).toBe(1);
  // Longer than the first two automatic retries (3 s and 6 s): a rejected value is not retried.
  await page.waitForTimeout(10_000);
  expect(saves).toBe(1);
  await figma.fill(before);
  await expect(page.getByRole("status").filter({ hasText: "Збережено" })).toBeVisible({ timeout: 10_000 });
});

test("two tabs: a save over a newer edit from the other tab is refused, not written", async ({ page, context }, testInfo) => {
  savesSharedRecord(testInfo);
  const base = await openDemoProject(page);
  await page.goto(`${base}/brief`);
  await ready(page);
  const other = await context.newPage();
  await other.goto(`${base}/brief`);
  await ready(other);

  const theirs = `Друга вкладка ${Date.now()}`;
  await other.getByLabel("Що за продукт").fill(theirs);
  await expect(other.getByRole("status").filter({ hasText: "Збережено" })).toBeVisible({ timeout: 10_000 });
  await other.close();

  await page.getByLabel("Що за продукт").fill(`Перша вкладка ${Date.now()}`);
  await expect(page.getByRole("status").filter({ hasText: "змінили в іншій вкладці" })).toBeVisible({ timeout: 10_000 });
  // The unsaved text is lost on reload, so the browser asks first; agree.
  page.on("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Оновити сторінку" }).click();
  await ready(page);
  await expect(page.getByLabel("Що за продукт")).toHaveValue(theirs);
});

test("a lost answer: create and delete say so, keep the input, and a second press does it once", async ({ page }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/screens`);
  await ready(page);
  const name = `Екран без відповіді ${Date.now()}`;
  const field = page.getByPlaceholder("Наприклад: картка ресторану");
  await field.fill(name);

  // The server gets the request and creates the screen, but the answer never reaches the browser.
  const loseAnswer = async () => {
    await page.route("**/*", async (route) => {
      if (!isAction(route.request())) return route.continue();
      await route.fetch();
      await route.abort("failed");
    });
  };
  await loseAnswer();
  await page.getByRole("button", { name: "Новий екран" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Не вдалося — зміну не збережено" })).toBeVisible();
  await expect(field).toHaveValue(name);

  await page.unroute("**/*");
  await page.getByRole("button", { name: "Новий екран" }).click();
  await expect(page).toHaveURL(/\/screens\/SCR-\d+$/);
  await page.goto(`${base}/screens`);
  await ready(page);
  // The list link reads "SCR-007<name>".
  const row = page.locator("main a").filter({ hasText: name });
  await expect(row).toHaveCount(1);

  // Delete with the answer lost, then again: the second press finds it gone and goes back to the list.
  await row.click();
  await ready(page);
  await loseAnswer();
  await page.getByRole("button", { name: "Видалити екран" }).click();
  await page.getByRole("button", { name: /Точно видалити/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Не вдалося — зміну не збережено" })).toBeVisible();
  await page.unroute("**/*");
  await page.getByRole("button", { name: "Видалити екран" }).click();
  await page.getByRole("button", { name: /Точно видалити/ }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/screens$`));
  await ready(page);
  await expect(row).toHaveCount(0);
});

test("date field: a typed date that is not a date is explained", async ({ page }, testInfo) => {
  savesSharedRecord(testInfo);
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

// A 4×2 PNG: enough for the browser to read its size before uploading.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEklEQVR4nGNUidzCAANMDEgAABxWATVTVbcvAAAAAElFTkSuQmCC", "base64");

test("case editor: texts and a picture save and stay after reload", async ({ page }) => {
  const base = await openDemoProject(page);
  await page.goto(`${base}/case`);
  await ready(page);
  const create = page.getByRole("button", { name: "Створити кейс" });
  if (await create.isVisible()) {
    await create.click();
    await expect(create).toHaveCount(0);
  }
  const title = `Кейс ${Date.now()}`;
  await page.locator("#uk-title").fill(title);
  await page.getByRole("button", { name: "Додати розділ" }).click();
  await page.locator("#uk-s0-title").fill("Задача");
  await page.locator("#uk-s0-image").setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: PNG });
  await expect(page.locator("#uk-s0-image-alt")).toBeVisible({ timeout: 15_000 });
  await page.locator("#uk-s0-image-alt").fill("Знак на білому");
  await expect(page.getByRole("status").filter({ hasText: "Збережено" })).toBeVisible({ timeout: 10_000 });

  // The English tab keeps its own texts.
  await page.getByRole("tab", { name: "English" }).click();
  await expect(page.locator("#en-title")).toBeVisible();

  await page.reload();
  await ready(page);
  await expect(page.locator("#uk-title")).toHaveValue(title);
  await expect(page.locator("#uk-s0-image-alt")).toHaveValue("Знак на білому");
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

  // The new request is listed under «Нові» and opens from the list.
  const newFilter = page.getByRole("link", { name: "Нові", exact: true });
  await newFilter.click();
  await expect(newFilter).toHaveAttribute("aria-current", "page");
  const row = page.locator(`main a[href$="/requests/${code}"]`);
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/requests/${code}$`));
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
