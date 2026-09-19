'use client'

import { useEffect, useState } from 'react'
import { DemoRegisterCta } from './DemoRegisterCta'

// Mobile-only reserve bar. Appears once the hero CTA has scrolled out of view
// and hides again while the page's own reserve section is on screen, so it
// never doubles up with a CTA the parent is already looking at. It only links
// to the same registration page — it doesn't touch checkout itself.
// Rendered only when registration is genuinely bookable (see page.tsx).
//
// Right padding leaves room for the site-wide chat button, which is fixed to
// the bottom-right corner.
export function StickyReserveBar({
  href, label, offeringId, watchIds,
}: {
  href: string
  label: string
  offeringId: string
  watchIds: string[] // element ids whose visibility hides the bar
}) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const targets = watchIds.map(id => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el))
    if (!targets.length || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      setVisibleIds(prev => {
        const next = new Set(prev)
        for (const entry of entries) {
          if (entry.isIntersecting) next.add(entry.target.id)
          else next.delete(entry.target.id)
        }
        return next
      })
    })
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [watchIds])

  const show = visibleIds.size === 0

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-20 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-200 sm:hidden ${show ? 'translate-y-0' : 'invisible translate-y-full'}`}
    >
      <DemoRegisterCta
        href={href}
        offeringId={offeringId}
        label={label}
        content="sticky_mobile"
        className="block w-full rounded-xl bg-[#F2A100] px-5 py-3.5 text-center text-base font-black text-white"
      />
    </div>
  )
}
