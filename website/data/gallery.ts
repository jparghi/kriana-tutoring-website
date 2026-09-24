export const galleryCategories = [
  { id: "center", label: "Our Center" },
  { id: "academic", label: "Academic Tutoring" },
  { id: "robotics", label: "Robotics & STEM" },
  { id: "demo", label: "Demos & Events" },
] as const;

export type GalleryCategory = (typeof galleryCategories)[number]["id"];

interface GalleryMediaBase {
  id: string;
  src: string;
  alt: string;
  title: string;
  caption: string;
  width: number;
  height: number;
  categories: GalleryCategory[];
  publicApproved: boolean;
  // Highlighted by the homepage/tutoring GalleryPreview.
  featured?: boolean;
  // Leads the /gallery page, above the rest of the collection.
  spotlight?: boolean;
  order: number;
  event?: { title: string; date: string; location: string };
}

export interface GalleryVideo extends GalleryMediaBase {
  type: "video";
  poster: string;
  durationLabel: string;
}

export interface GalleryImage extends GalleryMediaBase {
  type: "image";
  thumbnail: string;
}

export type GalleryMedia = GalleryVideo | GalleryImage;

// Curated entries only. Never populate this collection by scanning a folder.
// Keep unapproved originals outside public/, even when publicApproved is false.
export const galleryMedia: GalleryMedia[] = [
  {
    id: "bricks-challenge-carousel",
    type: "video",
    src: "/videos/gallery/bricks-challenge-carousel-v1.mp4",
    poster: "/images/gallery/bricks-challenge-carousel-v1.jpg",
    alt: "A motorized Young Engineers Bricks Challenge carousel model spinning on a white background",
    title: "Bricks Challenge: Carousel in Action",
    caption:
      "Gears, motors and a lot of spin: the Bricks Challenge carousel, one of the builds kids make in our Young Engineers workshops.",
    width: 1280,
    height: 720,
    durationLabel: "31 seconds",
    categories: ["robotics"],
    publicApproved: true,
    spotlight: true,
    order: 0,
  },
  {
    id: "young-engineers-demo-sept-2026",
    type: "video",
    src: "/videos/gallery/young-engineers-demo-sept-2026-v1.mp4",
    poster: "/images/gallery/young-engineers-demo-sept-2026-v1.jpg",
    alt: "A young builder working on a model at Kriana's Young Engineers demo in Kanata",
    title: "Little builders. Big discoveries.",
    caption:
      "A few moments from our September 12 Young Engineers demo: building, experimenting, and discovering together.",
    width: 720,
    height: 1280,
    durationLabel: "26 seconds",
    categories: ["robotics", "demo"],
    publicApproved: true,
    featured: true,
    order: 1,
    event: {
      title: "Young Engineers Demo",
      date: "2026-09-12",
      location: "Kanata, Ottawa",
    },
  },
];
