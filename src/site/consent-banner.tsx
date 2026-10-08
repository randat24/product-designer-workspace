"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, setConsent } from "./analytics/consent";
import { button } from "./signal/ui";

type Labels = { bannerText: string; accept: string; decline: string; more: string };

/**
 * Google Analytics consent. Rendered only where GA4 runs (production with a Measurement ID); shown until the
 * visitor chooses, and again after «Змінити вибір» on the privacy page. Two equal buttons: declining is as easy
 * as allowing. Bottom left, so the floating «Вгору» stays reachable on wide screens.
 */
export function ConsentBanner({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setOpen(readConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);
  if (!open) return null;

  return (
    <section aria-label={labels.more}
      className="sg-panel fixed inset-x-4 bottom-4 z-40 flex flex-col gap-4 p-5 shadow-[var(--sg-shadow-float)] sm:right-auto sm:max-w-[420px]">
      <p className="text-[15px] leading-[1.5]">
        {labels.bannerText}{" "}
        <Link href={privacyHref} className="font-semibold underline underline-offset-4 hover:text-accent-text">{labels.more}</Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setConsent("granted")} className={button({ variant: "primary" }, "flex-1")}>
          {labels.accept}
        </button>
        <button type="button" onClick={() => setConsent("denied")} className={button({ variant: "secondary" }, "flex-1")}>
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
