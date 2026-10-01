// Google Analytics consent, kept in the visitor's browser only. Consent Mode v2: until «Дозволити» GA runs
// without cookies (analytics_storage denied); ad storage is always denied.

export const CONSENT_KEY = "analytics-consent";
/** Fired on window when the choice changes or is reset (the banner and the privacy page listen). */
export const CONSENT_EVENT = "analytics-consent-change";

export type Consent = "granted" | "denied";

type Gtag = (command: "consent", action: "update", params: Record<string, string>) => void;

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent | null): void {
  try {
    if (value) localStorage.setItem(CONSENT_KEY, value);
    else localStorage.removeItem(CONSENT_KEY);
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("consent", "update", { analytics_storage: value === "granted" ? "granted" : "denied" });
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Inline before gtag.js: the stored choice becomes the default, so a returning visitor sees no banner and no gap. */
export const CONSENT_DEFAULT_SCRIPT = `var c;try{c=localStorage.getItem('${CONSENT_KEY}')}catch(e){}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:c==='granted'?'granted':'denied'});`;
