"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { readConsent } from "@/lib/consent";

/**
 * Analytics, gated.
 *
 * The privacy page states that Google Analytics loads only after opt-in and is
 * "never requested" otherwise. That is a promise, so GA is mounted only once
 * consent is stored, not merely configured to deny.
 *
 * Vercel Analytics and Speed Insights are first-party and cookieless, and are
 * declared separately in the privacy page. They load for everyone.
 */
export function Analytics({ gaId, nonce }: { gaId?: string; nonce?: string }) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const sync = () => setGranted(readConsent()?.analytics === true);
    sync();
    window.addEventListener("handover:consent", sync);
    return () => window.removeEventListener("handover:consent", sync);
  }, []);

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />

      {gaId && granted && (
        <>
          <Script
            id="ga-src"
            strategy="afterInteractive"
            nonce={nonce}
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied'
              });
              gtag('consent', 'update', { analytics_storage: 'granted' });
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}
    </>
  );
}
