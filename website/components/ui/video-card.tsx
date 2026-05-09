"use client";

import { useId, useState } from "react";
import { PlayCircleIcon } from "@heroicons/react/24/solid";

interface VideoCardProps {
  title: string;
  duration: string;
  src: string;
  thumbnail?: string;
}

function isVideoFile(src: string) {
  return src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".ogg");
}

export function VideoCard({ title, duration, src, thumbnail }: VideoCardProps) {
  const isFile = isVideoFile(src);
  const [isActive, setIsActive] = useState(false);
  const controlId = useId();
  const playerId = `${controlId}-player`;

  const previewBackground = thumbnail
    ? {
        backgroundImage: `linear-gradient(rgba(10,25,66,0.35), rgba(10,25,66,0.35)), url(${thumbnail})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: "linear-gradient(135deg, rgba(0,74,173,0.15), rgba(9,138,222,0.35))",
      };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-lg">
      <div className="relative aspect-video w-full bg-slate-100">
        {isActive ? (
          isFile ? (
            <video
              id={playerId}
              controls
              className="h-full w-full object-cover"
              poster={thumbnail}
              preload="metadata"
              autoPlay
            >
              <source src={src} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              id={playerId}
              src={src}
              title={title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-none"
            />
          )
        ) : (
          <button
            type="button"
            aria-label={`Play ${title}`}
            aria-controls={playerId}
            onClick={() => setIsActive(true)}
            className="group flex h-full w-full items-center justify-center overflow-hidden"
            style={previewBackground}
          >
            <PlayCircleIcon className="h-16 w-16 text-white drop-shadow-[0_8px_18px_rgba(15,43,104,0.45)] transition group-hover:scale-105" />
          </button>
        )}
        {!isActive ? <span id={playerId} className="sr-only">Video player placeholder</span> : null}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#004aad]">
          <span aria-hidden="true">⏱️</span>
          {duration}
        </span>
      </div>
    </article>
  );
}
