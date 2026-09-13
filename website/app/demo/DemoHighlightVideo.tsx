'use client'

import { useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics'

// Real footage from the sold-out September 12 Kanata demo.
//
// preload="none" + a poster keeps the ~4 MB file off the critical path —
// nothing but the poster image is fetched until a parent taps play, so the
// video can't hurt LCP on the mobile visits this page is built for. No
// autoplay: the reel is scored to music, and an autoplaying muted version
// would throw that away while still costing every visitor the download.
export function DemoHighlightVideo({ offeringId }: { offeringId: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const playTracked = useRef(false)

  function handlePlay() {
    setStarted(true)
    if (!playTracked.current) {
      playTracked.current = true
      trackEvent('demo_video_played', { offeringId })
    }
  }

  return (
    // Fixed 9:16 box reserved up front so the poster loading can't shift
    // anything below it (CLS), capped so the vertical reel never eats a
    // whole phone screen.
    <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_20px_50px_rgba(242,161,0,0.25)] sm:max-w-[340px]">
      <video
        ref={videoRef}
        className="aspect-[9/16] w-full bg-slate-900 object-cover"
        src="/videos/demo/young-engineers-demo-sept-2026-highlight.mp4"
        poster="/images/demo/demo-sept-2026-highlight-poster.jpg"
        preload="none"
        controls
        playsInline
        onPlay={handlePlay}
      />
      {!started && (
        <button
          type="button"
          aria-label="Play the September 12 demo highlight video"
          onClick={() => videoRef.current?.play()}
          className="absolute inset-0 flex items-center justify-center bg-slate-900/20 transition-colors hover:bg-slate-900/30"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <svg viewBox="0 0 24 24" fill="#F2A100" className="ml-1 h-7 w-7">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
