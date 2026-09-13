"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PlayIcon } from "@heroicons/react/24/solid";
import type { GalleryVideo as GalleryVideoMedia } from "../../data/gallery";

export function GalleryVideo({ media }: { media: GalleryVideoMedia }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  async function play() {
    setError(false);
    try {
      await videoRef.current?.play();
    } catch {
      setError(true);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] bg-[#071C36]">
      <video
        ref={videoRef}
        width={media.width}
        height={media.height}
        poster={media.poster}
        src={media.src}
        preload="none"
        controls
        playsInline
        aria-label={`${media.title} ${media.durationLabel}. Music accompanies footage of children building robotics models.`}
        className="block aspect-[9/16] h-auto w-full"
        onPlay={() => {
          setStarted(true);
          setError(false);
        }}
        onError={() => setError(true)}
      >
        Your browser does not support this video.{" "}
        <a href={media.src}>Watch the demo video</a>.
      </video>
      {!started && !error && (
        <Image
          src={media.poster}
          alt=""
          fill
          priority
          sizes="(min-width: 640px) 334px, 314px"
          className="pointer-events-none object-cover"
        />
      )}
      {!started && !error && (
        <button
          type="button"
          onClick={play}
          aria-label={`Play ${media.title}`}
          className="group absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-[#071C36]/85 via-transparent to-[#071C36]/10 px-5 pb-16 text-white focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-[#FFD166]"
        >
          <span className="mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white text-[#0c6162] shadow-lg transition-transform motion-safe:group-hover:scale-110">
            <PlayIcon className="ml-1 h-8 w-8" />
          </span>
          <span className="text-base font-semibold">
            Watch the happy little moments
          </span>
          <span className="mt-1 text-xs tracking-wide text-white/80">
            {media.durationLabel} · Sound on
          </span>
        </button>
      )}
      {error && (
        <p role="status" className="px-5 py-4 text-sm text-white">
          Having trouble playing?{" "}
          <a href={media.src} className="underline underline-offset-4">
            Open the video directly
          </a>
          .
        </p>
      )}
    </div>
  );
}
