import { expect, test, type Page } from "@playwright/test";
import { expectAccessible, horizontalOverflow, watchErrors } from "./helpers";

// Project request («Обговорити проєкт»): conditional steps, validation, review, submission and the PDF brief.
// The submission needs the form secret (CI sets it, see .github/workflows/ci.yml); without it the test stops
// at the review screen.

const next = (page: Page) => page.getByRole("button", { name: /^(Далі|Перевірити заявку|Повернутися до перевірки)/ }).click();
const step = (page: Page, n: number) => expect(page.getByText(`Крок ${n} з 9`)).toBeVisible();

test("project request: from the first question to the brief PDF", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.goto("/uk/start-project");
  await expectAccessible(page, testInfo);
  await page.getByRole("button", { name: "Почати" }).click();
  const started = Date.now();

  // 1. Nothing chosen: errors in a summary and next to the fields.
  await step(page, 1);
  await next(page);
  await expect(page.getByRole("alert").filter({ hasText: "Перевірте поля з помилками" })).toContainText("Оберіть хоча б один варіант");
  await page.getByRole("checkbox", { name: "Редизайн", exact: true }).check();
  await page.getByRole("checkbox", { name: "Інше", exact: true }).check();
  await next(page);
  await expect(page.getByText("Заповніть це поле").first()).toBeVisible(); // «Що саме?» appears for «Інше»
  await page.getByLabel("Що саме?").fill("Чат-бот");
  await page.getByRole("checkbox", { name: "У проєкту ще немає назви" }).check();
  await next(page);

  // 2. «No product yet» hides the questions about it.
  await step(page, 2);
  await page.getByRole("radio", { name: "Ні, починаємо з нуля" }).check();
  await expect(page.getByLabel(/^Адреса продукту/)).toHaveCount(0);
  await next(page);

  // 3.
  await step(page, 3);
  await page.getByLabel("Коротко про проєкт").fill("Онлайн-бібліотека з підпискою — ґ, ї, є.");
  await next(page);
  // 4. All optional.
  await step(page, 4);
  await next(page);
  // 5. Competitor with an invalid link, then fixed; a design reference.
  await step(page, 5);
  await page.getByRole("radio", { name: "Так, знаю" }).check();
  await page.getByLabel("Назва", { exact: true }).fill("Yakaboo");
  await page.getByLabel(/^Сайт/).fill("not a link");
  await next(page);
  await expect(page.getByText("Посилання має виглядати як example.com").first()).toBeVisible();
  await page.getByLabel(/^Сайт/).fill("yakaboo.ua");
  await page.getByRole("button", { name: "Додати приклад" }).click();
  await page.getByLabel("Посилання", { exact: true }).fill("linear.app");
  await next(page);
  // 6. «I don't know» instead of services.
  await step(page, 6);
  await page.getByRole("checkbox", { name: /Не знаю/ }).check();
  await next(page);
  // 7.
  await step(page, 7);
  await next(page);
  // 8. Custom budget and a deadline.
  await step(page, 8);
  await page.getByRole("radio", { name: "Своя сума" }).check();
  await page.getByLabel(/^Від, /).fill("3000");
  await page.getByRole("radio", { name: "Якнайшвидше" }).check();
  await page.getByRole("group", { name: "Чи є дедлайн?" }).getByRole("radio", { name: "Так", exact: true }).check();
  await next(page);
  await expect(page.getByText("Вкажіть дату").first()).toBeVisible();
  await page.getByLabel("Дата дедлайну").fill("2026-12-01");
  await next(page);
  // 9. Contacts: invalid e-mail first.
  await step(page, 9);
  await page.getByLabel("Ім'я").fill("Олена");
  await page.getByRole("textbox", { name: "Email" }).fill("olena@");
  await next(page);
  await expect(page.getByText("Перевірте адресу пошти").first()).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill("olena@example.com");
  await next(page);

  // Review: every section, editable; consent is required and not pre-checked.
  await expect(page.getByRole("heading", { level: 1, name: "Перевірте заявку" })).toBeVisible();
  await expect(page.getByText("linear.app")).toBeVisible();
  await expect(page.getByLabel(/Я погоджуюся/)).not.toBeChecked();
  expect(await horizontalOverflow(page)).toEqual([]);
  await page.getByRole("button", { name: "Змінити: Проєкт" }).click();
  await expect(page.getByRole("button", { name: "Повернутися до перевірки" })).toBeVisible();
  await next(page);
  await page.getByRole("button", { name: "Надіслати заявку" }).click();
  await expect(page.getByText("Потрібна ваша згода").first()).toBeVisible();
  await page.getByLabel(/Я погоджуюся/).check();
  expect(errors).toEqual([]);

  test.skip(!process.env.INTAKE_SUBMIT_SECRET, "submission needs INTAKE_SUBMIT_SECRET and an open form in the database");
  // The server treats a form filled in under 8 seconds as a bot; a person is never that fast.
  await page.waitForTimeout(Math.max(0, 9000 - (Date.now() - started)));
  await page.getByRole("button", { name: "Надіслати заявку" }).click();
  await expect(page.getByRole("heading", { name: /Дякую/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^REQ-\d{4}-\d{4,}$/)).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Завантажити бриф/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^Project-Brief-REQ-\d{4}-\d{4,}-\d{4}-\d{2}-\d{2}\.pdf$/);
  const pdf = await download.createReadStream().then(async (s) => {
    const chunks: Buffer[] = [];
    for await (const c of s) chunks.push(c as Buffer);
    return Buffer.concat(chunks);
  });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(errors).toEqual([]);
});

test("project request: the brief is not reachable without a valid token", async ({ request }) => {
  const res = await request.post("/api/project-request/brief", { data: { token: "0".repeat(64), locale: "uk" } });
  expect(res.status()).toBe(404);
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
  const bad = await request.post("/api/project-request/brief", { data: { token: "../etc/passwd" } });
  expect(bad.status()).toBe(400);
});
