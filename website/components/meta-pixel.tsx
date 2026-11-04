'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { META_PIXEL_ID } from '../lib/meta-pixel'

// Meta Pixel base code, mounted once from app/layout.tsx. Renders nothing
// unless NEXT_PUBLIC_META_PIXEL_ID is set. The `if(f.fbq)return` guard in
// Meta's snippet plus next/script's id dedupe mean it can't double-init.
//
// The snippet fires the first PageView; client-side (App Router) navigations
// don't reload the page, so later PageViews are sent on pathname change.
export function MetaPixel() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!META_PIXEL_ID) return
    if (lastPath.current === null) {
      lastPath.current = pathname
      return
    }
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
    if (typeof fbq === 'function') fbq('track', 'PageView')
  }, [pathname])

  if (!META_PIXEL_ID || !/^\d+$/.test(META_PIXEL_ID)) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  )
}
