import { defineConfig, devices } from "@playwright/test";

// End-to-end checks (docs/QUALITY_REVIEW.md, stage 0). The site runs anywhere; the tool needs a
// Supabase with a test user: E2E_EMAIL / E2E_PASSWORD (CI starts a local one, see .github/workflows/ci.yml).
const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
export const hasToolUser = !!(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", locale: "ru-RU" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } }, dependencies: ["setup"] },
    // Phone width: the tool must work fully on a phone (owner decision, docs/QUALITY_REVIEW.md §4).
    { name: "phone", use: { ...devices["Pixel 7"] }, dependencies: ["setup"] },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm start -- -p ${port}`, url: `${baseURL}/uk`, reuseExistingServer: true, timeout: 120_000 },
});
