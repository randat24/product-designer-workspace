import type { Instrumentation } from "next";

/**
 * Server-side error reporting to Sentry: render errors, server actions, route handlers and middleware.
 * Off unless SENTRY_DSN is set (local runs, CI). Server only on purpose: the browser SDK would send visitors'
 * data before they agree to analytics. No PII: IPs, cookies and request bodies stay out of the reports.
 */
const dsn = process.env.SENTRY_DSN?.trim();

export async function register() {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    // Failures the code catches and logs (a missing secret, a refused database call) reach Sentry too.
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
