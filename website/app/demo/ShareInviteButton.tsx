'use client'

import { useState } from 'react'

// Lets someone re-share the /demo link itself (the whole point of this page
// doubling as a flyer) — Web Share API on mobile (opens the native
// WhatsApp/Messenger/etc. share sheet), falling back to copy-to-clipboard
// on desktop browsers that don't support it.
export function ShareInviteButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled the native share sheet — do nothing.
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — nothing more we can do silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 shrink-0">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49" />
      </svg>
      {copied ? 'Link Copied!' : 'Share This Invite'}
    </button>
  )
}
