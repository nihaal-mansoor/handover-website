"use client";

import Script from "next/script";
import { useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { readConsent, applyConsentMode } from "@/lib/consent";

/**
 * Analytics under Consent Mode v2.
 *
 * Google Analytics loads for everyone, but every storage type starts denied,
 * so nothing is written to the device and no one is identified until consent
 * is given. Denied traffic still produces a cookieless ping, which is the
 * difference between usable totals and losing every non-consenting visitor.
 *
 * Vercel Analytics and Speed Insights are first-party and cookieless.
 */
export function Analytics({ gaId, nonce }: { gaId?: string; nonce?: string }) {
  useEffect(() => {
    applyConsentMode(readConsent()?.analytics === true);
    const sync = () => applyConsentMode(readConsent()?.analytics === true);
    window.addEventListener("handover:consent", sync);
    return () => window.removeEventListener("handover:consent", sync);
  }, []);

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />

      {gaId && (
        <>
          {/* Defaults must be registered before the tag loads, or the first
              hit is sent under the wrong assumption. */}
          <Script id="ga-consent-default" strategy="beforeInteractive" nonce={nonce}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                wait_for_update: 500
              });
            `}
          </Script>
          {/* lazyOnload, not afterInteractive: the tag is 170 KB, a third of
              the weight of a page, and §4.1 requires analytics to load after the
              load event rather than merely after hydration. The consent defaults
              above still register first, so nothing is measured under the wrong
              assumption while the tag is on its way. */}
          <Script
            id="ga-src" strategy="lazyOnload" nonce={nonce}
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script id="ga-init" strategy="lazyOnload" nonce={nonce}>
            {`
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}
    </>
  );
}
