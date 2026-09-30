import { expect, test } from "@playwright/test";
import { expectAccessible, horizontalOverflow, watchErrors } from "./helpers";

// Public site: every page renders, has one h1 and the right language, passes axe, and does not
// scroll sideways on a phone.
const PAGES = [
  { path: "/uk", lang: "uk" },
  { path: "/en/cases", lang: "en" },
  { path: "/uk/about", lang: "uk" },
  // Sample case: its illustrations are placeholders, so contrast is checked once real images land.
  { path: "/en/cases/restaurant-booking", lang: "en", contrast: false },
];

for (const p of PAGES) {
  test(`site ${p.path}`, async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    const res = await page.goto(p.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
    await expect(page.locator("h1")).toHaveCount(1);
    await expectAccessible(page, testInfo, { contrast: p.contrast ?? true });
    expect(await horizontalOverflow(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

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
