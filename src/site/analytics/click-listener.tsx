"use client";

import { useEffect } from "react";
import type { AnalyticsEvent, AnalyticsParams } from "./events";
import { track } from "./track";

/** One delegated listener: any element with data-track sends its event when clicked. */
export function AnalyticsClickListener() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      let params: AnalyticsParams = {};
      try {
        params = JSON.parse(el.dataset.trackParams ?? "{}") as AnalyticsParams;
      } catch {
        // malformed params: send the event without them
      }
      track(el.dataset.track as AnalyticsEvent, params);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
