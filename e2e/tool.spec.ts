import { expect, test, type Page } from "@playwright/test";
import { hasToolUser } from "../playwright.config";
import { AUTH_FILE, contrastViolations, expectAccessible, horizontalOverflow, watchErrors } from "./helpers";

// The workspace tool, signed in, on the demo project: every section and one detail page of each list
// renders without errors and passes axe. Colour contrast and phone overflow are reported on every run and
// become strict with E2E_STRICT_A11Y / E2E_STRICT_MOBILE (stages 3 and 4 of docs/QUALITY_REVIEW.md).
test.skip(!hasToolUser, "E2E_EMAIL / E2E_PASSWORD not set");
test.use({ storageState: AUTH_FILE });

const ERROR_TITLE = "Не получилось открыть страницу";

async function openDemoProject(page: Page): Promise<string> {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/w\/[^/]+$/);
  // A fresh account shows the demo button; later runs already have the project. Wait for either.
  const demo = page.getByRole("button", { name: "Открыть демо-проект" });
  const existing = page.locator('main a[href*="/p/"]').first();
  await expect(demo.or(existing)).toBeVisible();
  if (await demo.isVisible()) await demo.click();
  else await existing.click();
  await expect(page).toHaveURL(/\/w\/[^/]+\/p\/[^/]+$/);
  return new URL(page.url()).pathname;
}

/** Section pages from the navigation rail plus the first detail page of each list. */
async function collectPages(page: Page, base: string) {
  const sections = await page.getByRole("navigation", { name: "Разделы проекта" })
    .locator(`a[href^="${base}"]`).evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  const pages = [...sections];
  for (const s of sections) {
    if (s === base) continue;
    await page.goto(s);
    const detail = await page.locator(`main a[href^="${s}/"]`).first().getAttribute("href").catch(() => null);
    if (detail && !pages.includes(detail)) pages.push(detail);
  }
  return pages;
}

test("every section and detail page renders and is accessible", async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const base = await openDemoProject(page);
  const pages = await collectPages(page, base);
  expect(pages.length).toBeGreaterThan(10);

  const contrast: Record<string, string[]> = {};
  const overflow: Record<string, string[]> = {};
  for (const path of pages) {
    await test.step(path.replace(base, "") || "overview", async () => {
      const errors = watchErrors(page);
      await page.goto(path);
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
  const field = page.getByLabel("Что за продукт");
  const text = `Проверка автосохранения ${Date.now()}`;
  await field.fill(text);
  await expect(page.getByRole("status").filter({ hasText: "Сохранено" })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByLabel("Что за продукт")).toHaveValue(text);
});

test("command palette: Ctrl+K, type, Enter navigates; Esc closes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "keyboard shortcut — desktop");
  const base = await openDemoProject(page);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.type("Экраны");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${base}/screens`);
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
