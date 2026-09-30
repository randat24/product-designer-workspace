import Script from "next/script";
import { isAnalyticsEnabled } from "@/shared/lib/site-url";

const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

/**
 * GA4 for the public site only (never the private workspace). Loads when
 * NEXT_PUBLIC_GA_ID is a valid Measurement ID and the deployment is production.
 * Page views: the initial one from `config`, later client-side navigations from GA4's
 * enhanced measurement ("page changes based on browser history events"), so nothing is sent twice.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!id || !GA_ID_PATTERN.test(id) || !isAnalyticsEnabled()) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());
gtag('config','${id}',{page_location:location.origin+location.pathname,allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}
