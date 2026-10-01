import { expect, test } from "@playwright/test";
import { expectAccessible, watchErrors } from "./helpers";

// Password recovery: reachable from the sign-in form without an account session, accessible,
// and the same answer for any address (the form must not reveal which emails are registered).
test("forgot password: from sign-in to the «link sent» message", async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto("/login");
  await page.getByRole("link", { name: "Забыли пароль?" }).click();
  await expect(page).toHaveURL(/\/login\/forgot$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Восстановить пароль");
  await expectAccessible(page, testInfo);

  await page.getByLabel("Эл. почта").fill("not-an-email");
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByText("Введите адрес эл. почты целиком", { exact: false })).toBeVisible();

  await page.getByLabel("Эл. почта").fill("nobody@example.test");
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByRole("status")).toContainText("Если такой аккаунт есть");
  expect(errors).toEqual([]);
});
