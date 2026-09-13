import "server-only";

import { galleryMedia, type GalleryVideo } from "../data/gallery";

export function getPublicGalleryMedia() {
  return galleryMedia
    .filter((media) => media.publicApproved === true)
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedGalleryVideo(): GalleryVideo | undefined {
  const videos = getPublicGalleryMedia().filter(
    (media): media is GalleryVideo => media.type === "video",
  );
  return videos.find((media) => media.featured) ?? videos[0];
}
