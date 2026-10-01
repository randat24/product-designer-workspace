import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectAccessible, horizontalOverflow, hydrationDiff, watchErrors } from "./helpers";

// Public site: every page renders, has one h1 and the right language, passes axe, and does not
// scroll sideways on a phone.
const PAGES = [
  { path: "/uk", lang: "uk" },
  { path: "/en/cases", lang: "en" },
  { path: "/uk/about", lang: "uk" },
  { path: "/en/privacy", lang: "en" },
  { path: "/uk/start-project", lang: "uk" },
];

async function checkPage(page: Page, testInfo: TestInfo, path: string, lang: string, contrast = true) {
  const errors = watchErrors(page);
  const res = await page.goto(path);
  expect(res?.status()).toBe(200);
  const serverHtml = (await res?.text()) ?? "";
  await expect(page.locator("html")).toHaveAttribute("lang", lang);
  await expect(page.locator("h1")).toHaveCount(1);
  await expectAccessible(page, testInfo, { contrast });
  expect(await horizontalOverflow(page)).toEqual([]);
  // A hydration error says nothing about where it happened: put the first server/client difference in the message.
  const hydration = errors.some((e) => /Minified React error #4(18|19|23|25)|Hydration/i.test(e))
    ? `\n${await hydrationDiff(page, testInfo, serverHtml)}`
    : "";
  expect(errors, `page errors${hydration}`).toEqual([]);
}

for (const p of PAGES) {
  test(`site ${p.path}`, async ({ page }, testInfo) => checkPage(page, testInfo, p.path, p.lang));
}

// Cases come from the database; a fresh database (CI) may have none published.
test("site: first published case", async ({ page }, testInfo) => {
  await page.goto("/en/cases");
  const href = await page.locator('main a[href^="/en/cases/"]').first().getAttribute("href", { timeout: 5_000 }).catch(() => null);
  test.skip(!href, "no published cases in this database");
  await checkPage(page, testInfo, href!, "en");
});

test("site 404 is a real, localized page", async ({ page }) => {
  const res = await page.goto("/en/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("theme toggle switches and remembers", async ({ page }) => {
  await page.goto("/uk");
  const before = await page.evaluate(() => document.documentElement.dataset.theme ?? "system");
  await page.locator("header button:has(.theme-icon-moon), header button:has(.theme-icon-sun)").first().click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
});
