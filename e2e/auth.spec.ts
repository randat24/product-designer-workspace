import { expect, test } from "@playwright/test";
import { expectAccessible, watchErrors } from "./helpers";

// Password recovery: reachable from the sign-in form without an account session, accessible,
// and the same answer for any address (the form must not reveal which emails are registered).
test("forgot password: from sign-in to the «link sent» message", async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto("/login");
  await page.getByRole("link", { name: "Забули пароль?" }).click();
  await expect(page).toHaveURL(/\/login\/forgot$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Відновити пароль");
  await expectAccessible(page, testInfo);

  await page.getByLabel("Ел. пошта").fill("not-an-email");
  await page.getByRole("button", { name: "Надіслати посилання" }).click();
  await expect(page.getByText("Введіть адресу ел. пошти повністю", { exact: false })).toBeVisible();

  await page.getByLabel("Ел. пошта").fill("nobody@example.test");
  await page.getByRole("button", { name: "Надіслати посилання" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Якщо такий акаунт є");
  expect(errors).toEqual([]);
});
