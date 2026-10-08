"use client"

import { useRef, useState } from "react"

// Hero ad video. Browsers only autoplay muted video, so it starts silent with
// a "Tap for sound" button; the first unmute restarts it so the music plays
// from the beginning.
export function HeroVideo({ src, poster, width, height, label }: { src: string; poster: string; width: number; height: number; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [unmutedOnce, setUnmutedOnce] = useState(false)

  function toggle() {
    const video = ref.current
    if (!video) return
    const next = !muted
    video.muted = next
    if (!next && !unmutedOnce) {
      video.currentTime = 0
      setUnmutedOnce(true)
    }
    if (!next) void video.play().catch(() => {})
    setMuted(next)
  }

  return (
    <div className="relative">
      <video
        ref={ref}
        src={src}
        poster={poster}
        width={width}
        height={height}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className="block h-auto w-full"
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!muted}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-2 text-xs font-black text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/80"
      >
        <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
        {muted ? "Tap for sound" : "Sound on"}
      </button>
    </div>
  )
}
