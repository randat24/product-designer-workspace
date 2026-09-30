import { expect, test as setup } from "@playwright/test";
import { hasToolUser } from "../playwright.config";
import { AUTH_FILE } from "./helpers";

setup("sign in to the tool", async ({ page }) => {
  setup.skip(!hasToolUser, "E2E_EMAIL / E2E_PASSWORD not set — tool tests are skipped");
  await page.goto("/login");
  await page.getByLabel("Эл. почта").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Пароль").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/w\//);
  await page.context().storageState({ path: AUTH_FILE });
});
