import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

export const AUTH_FILE = "e2e/.auth/user.json";

/** Collects uncaught page errors and console errors (network noise from blocked third parties aside). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (/Failed to load resource|ERR_TUNNEL|googletagmanager|speed-insights/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

/**
 * WCAG 2.2 A/AA check with axe. Colour contrast is checked separately (`contrastViolations`):
 * the tool's success/warning/danger tokens are fixed in stage 3 of the quality plan.
 */
export async function expectAccessible(page: Page, testInfo: TestInfo, opts: { contrast?: boolean } = {}) {
  let axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  if (!opts.contrast) axe = axe.disableRules(["color-contrast"]);
  const { violations } = await axe.analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length) {
    await testInfo.attach(`axe-${page.url()}`, { body: JSON.stringify(serious, null, 2), contentType: "application/json" });
  }
  expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`), `axe on ${page.url()}`).toEqual([]);
}

export async function contrastViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  return violations.flatMap((v) => v.nodes.map((n) => n.target.join(" ")));
}

/** Elements that make the page scroll sideways at the current width. */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= w + 1) return [];
    return [...document.querySelectorAll("body *")]
      .filter((el) => el.getBoundingClientRect().right > w + 1 && getComputedStyle(el).position !== "fixed")
      .filter((el) => !el.closest("[data-scroll-x], .overflow-x-auto, .overflow-auto"))
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`);
  });
}
