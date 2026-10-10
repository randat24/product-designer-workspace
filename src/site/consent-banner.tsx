"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readConsent, setConsent } from "./analytics/consent";
import { button } from "./signal/ui";

type Labels = { bannerLabel: string; bannerText: string; accept: string; decline: string; more: string };

/**
 * Google Analytics consent. Rendered only where GA4 runs (production with a Measurement ID); shown until the
 * visitor chooses, and again after «Змінити вибір» on the privacy page. Two equal buttons: declining is as easy
 * as allowing. Bottom left, so the floating «Вгору» stays reachable on wide screens.
 *
 * It floats over the page, so while it is open it reports its height as --consent-space: the page keeps that
 * strip free at the bottom and scrolls a focused control clear of it (globals.css; WCAG 2.4.11). The layout
 * renders it first in the document, so the keyboard reaches its buttons before the rest of the page.
 */
export function ConsentBanner({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const sync = () => setOpen(readConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!open || !el) return;
    const root = document.documentElement;
    const report = () => root.style.setProperty("--consent-space", `${Math.ceil(window.innerHeight - el.getBoundingClientRect().top) + 8}px`);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    window.addEventListener("resize", report);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", report);
      root.style.removeProperty("--consent-space");
    };
  }, [open]);
  if (!open) return null;

  return (
    <section ref={box} aria-label={labels.bannerLabel}
      className="sg-panel fixed inset-x-3 bottom-3 z-40 flex flex-col gap-3 p-4 shadow-[var(--sg-shadow-float)] sm:inset-x-4 sm:bottom-4 sm:right-auto sm:max-w-[420px] sm:gap-4 sm:p-5">
      <p className="text-[14px] leading-[1.5] sm:text-[15px]">
        {labels.bannerText}{" "}
        <Link href={privacyHref} className="font-semibold underline underline-offset-4 hover:text-accent-text">{labels.more}</Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setConsent("granted")} className={button({ variant: "primary", size: "sm" }, "flex-1")}>
          {labels.accept}
        </button>
        <button type="button" onClick={() => setConsent("denied")} className={button({ variant: "secondary", size: "sm" }, "flex-1")}>
          {labels.decline}
        </button>
      </div>
    </section>
  );
}

/** «Змінити вибір» on the privacy page: shows the current state and brings the banner back. */
export function ConsentControls({ labels }: { labels: { manage: string; stateGranted: string; stateDenied: string; stateUnset: string } }) {
  const [state, setState] = useState<"granted" | "denied" | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setState(readConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p role="status" className="text-fg-secondary">
        {state === undefined ? " " : state === "granted" ? labels.stateGranted : state === "denied" ? labels.stateDenied : labels.stateUnset}
      </p>
      <button type="button" onClick={() => setConsent(null)}
        className={button({ variant: "secondary" })}>
        {labels.manage}
      </button>
    </div>
  );
}
