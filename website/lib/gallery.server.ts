import "server-only";

import { galleryMedia, type GalleryVideo } from "../data/gallery";

export function getPublicGalleryMedia() {
  return galleryMedia
    .filter((media) => media.publicApproved === true)
    .sort((a, b) => a.order - b.order);
}

/** The /gallery build spotlight (shown below the real-moments reels), plus
 * every other approved video in order. */
export function getGalleryVideos(): {
  spotlight: GalleryVideo | undefined;
  more: GalleryVideo[];
} {
  const videos = getPublicGalleryMedia().filter(
    (media): media is GalleryVideo => media.type === "video",
  );
  const spotlight =
    videos.find((media) => media.spotlight) ??
    videos.find((media) => media.featured) ??
    videos[0];
  return { spotlight, more: videos.filter((media) => media !== spotlight) };
}
