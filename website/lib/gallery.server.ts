import "server-only";

import { galleryMedia, type GalleryVideo } from "../data/gallery";

export function getPublicGalleryMedia() {
  return galleryMedia
    .filter((media) => media.publicApproved === true)
    .sort((a, b) => a.order - b.order);
}

/** The /gallery event highlight (shown first), the build spotlights (wide
 * videos shown below the real-moments reels; `spotlight` is the first, used
 * for the share image), plus every other approved video in order. */
export function getGalleryVideos(): {
  highlight: GalleryVideo | undefined;
  spotlight: GalleryVideo | undefined;
  spotlights: GalleryVideo[];
  more: GalleryVideo[];
} {
  const videos = getPublicGalleryMedia().filter(
    (media): media is GalleryVideo => media.type === "video",
  );
  const highlight = videos.find((media) => media.highlight);
  const marked = videos.filter((media) => media.spotlight);
  const fallback =
    videos.find((media) => media.featured) ?? videos[0];
  const spotlights = marked.length ? marked : fallback ? [fallback] : [];
  return {
    highlight,
    spotlight: spotlights[0],
    spotlights,
    more: videos.filter(
      (media) => !spotlights.includes(media) && media !== highlight,
    ),
  };
}
