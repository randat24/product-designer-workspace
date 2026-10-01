import Script from "next/script";
import { isAnalyticsEnabled } from "@/shared/lib/site-url";
import { CONSENT_DEFAULT_SCRIPT } from "./consent";

const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

/**
 * GA4 for the public site only (never the private workspace). Loads when
 * NEXT_PUBLIC_GA_ID is a valid Measurement ID and the deployment is production.
 * Page views: the initial one from `config`, later client-side navigations from GA4's
 * enhanced measurement ("page changes based on browser history events"), so nothing is sent twice.
 * Consent Mode v2: no GA cookies until the visitor allows them in the banner (consent.ts).
 */
/** The Measurement ID when GA4 runs on this deployment, else null (also decides whether the consent banner shows). */
export function gaId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  return id && GA_ID_PATTERN.test(id) && isAnalyticsEnabled() ? id : null;
}

export function GoogleAnalytics() {
  const id = gaId();
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
${CONSENT_DEFAULT_SCRIPT}
gtag('js',new Date());
gtag('config','${id}',{page_location:location.origin+location.pathname,allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}
