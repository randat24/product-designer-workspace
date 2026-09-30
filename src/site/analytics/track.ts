import type { AnalyticsEvent, AnalyticsParams } from "./events";

type Gtag = (command: "event", name: string, params?: Record<string, unknown>) => void;

/**
 * Sends a GA4 event when analytics is loaded (production with NEXT_PUBLIC_GA_ID);
 * a no-op everywhere else. Client-side only.
 */
export function track(name: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("event", name, params);
}

/**
 * Data attributes for server components: `<a {...trackAttrs("case_open", { case_slug })}>`.
 * The click listener in the site layout turns them into track() calls.
 */
export function trackAttrs(name: AnalyticsEvent, params: AnalyticsParams = {}): Record<string, string> {
  return { "data-track": name, "data-track-params": JSON.stringify(params) };
}
