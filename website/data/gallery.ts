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
  // A /gallery "Build spotlight" video (wide), shown after the real-moments
  // reels; several may carry it, shown in order.
  spotlight?: boolean;
  // The /gallery event highlight, shown first with its own copy and CTAs.
  highlight?: { heading: string; subheading: string; takeaway: string };
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
    id: "halloween-ghost-buddies",
    type: "video",
    src: "/videos/gallery/halloween-ghost-buddies-v1.mp4",
    poster: "/images/gallery/halloween-ghost-buddies-v1.jpg",
    alt: "Two brick-built Young Engineers ghost models moving on a motorized gear base",
    title: "Halloween Build: Ghost Buddies",
    caption:
      "A motor and a train of gears bring these two ghosts to life: the kind of spooky moving machine kids build at our Halloween STEM Workshop.",
    width: 1280,
    height: 720,
    durationLabel: "46 seconds",
    categories: ["robotics"],
    publicApproved: true,
    spotlight: true,
    order: -1,
  },
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
  {
    id: "october-2-workshop-highlights",
    type: "video",
    src: "/videos/gallery/october-2-workshop-highlights-v1.mp4",
    poster: "/images/gallery/october-2-workshop-highlights-v1.jpg",
    alt: "Children at Kriana's October 2 Young Engineers PA/PD Day STEM Workshop building and testing motorized Carousel models",
    title: "October 2 Young Engineers PA/PD Day STEM Workshop",
    caption:
      "Kids built the Carousel while exploring electric motors, centrifugal force and hands-on engineering.",
    width: 720,
    height: 1280,
    durationLabel: "40 seconds",
    categories: ["robotics", "demo"],
    publicApproved: true,
    order: 2,
    event: {
      title: "Young Engineers PA/PD Day STEM Workshop",
      date: "2026-10-02",
      location: "Kanata, Ottawa",
    },
  },
  {
    id: "halloween-workshop-highlights",
    type: "video",
    src: "/videos/demo/young-engineers-halloween-workshop-oct-2026-highlight.mp4",
    poster: "/images/demo/halloween-workshop-oct-2026-highlight-poster.jpg",
    alt: "Children at Kriana's October 25 Young Engineers Halloween STEM Workshop building motorized Ghost Buddies models",
    title: "October 25 Young Engineers Halloween STEM Workshop",
    caption:
      "Kids built Ghost Buddies, spooky moving machines powered by gears and motors, with a little help from our instructors.",
    width: 720,
    height: 1280,
    durationLabel: "30 seconds",
    categories: ["robotics", "demo"],
    publicApproved: true,
    highlight: {
      heading: "Halloween Workshop Highlights",
      subheading: "Ghost Buddies came to life! 👻",
      takeaway: "Spooky fun on the outside, real engineering on the inside.",
    },
    order: 3,
    event: {
      title: "Young Engineers Halloween STEM Workshop",
      date: "2026-10-25",
      location: "Stittsville, Ottawa",
    },
  },
];
