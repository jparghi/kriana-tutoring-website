// The Young Engineers Demo Hub's event list — the single place to add, edit
// or retire a demo. Never populate media by scanning a folder: only add files
// that are approved for public use (see components/gallery/README.md).
//
// `status` is the editorial state. The live booking state comes from each
// session's Firestore offering (lib/demo-campaign.server.js): a session is
// bookable only while its offering is open; once every session is full the
// demo shows SOLD_OUT and each session offers its waitlist. `status` can only
// make the page more conservative (SOLD_OUT / WAITLIST / COMPLETED pin it).
// A demo whose last session has ended is treated as COMPLETED automatically.

export type DemoStatus = "WAITLIST" | "REGISTRATION_OPEN" | "SOLD_OUT" | "COMPLETED";

export interface DemoSession {
  label: string; // "10:30 AM–12:00 PM"
  // Firestore programOfferings id for this session (one offering per session,
  // each with its own capacity and waitlist). Omit for past demos.
  offeringId?: string;
  startIso: string; // with explicit offset, e.g. 2026-10-02T10:30:00-04:00
  endIso: string;
}

export interface DemoMedia {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface DemoEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (Ottawa local date)
  location: string; // short area name: "Kanata"
  address: string; // full street address, or "" when not public
  status: DemoStatus;
  soldOut?: boolean; // completed demos that filled up
  price: number; // CAD
  ageRange: string;
  sessions: DemoSession[];
  program: string;
  build?: string; // the model children built
  learningTopics: string[];
  heroImage?: DemoMedia;
  highlightVideo?: { src: string; poster: string; durationLabel: string };
  galleryImages?: DemoMedia[]; // curated, approved photos only — 8 max
  registrationUrl: string;
  // Firestore programs id the session offerings belong to (must also be in
  // DEMO_ELIGIBLE_PROGRAM_IDS in lib/demo-eligibility.js).
  programId?: string;
}

export const demos: DemoEvent[] = [
  {
    id: "2026-09-12-kanata",
    title: "Young Engineers Demo — Kanata",
    date: "2026-09-12",
    location: "Kanata",
    address: "",
    status: "COMPLETED",
    soldOut: true,
    price: 10,
    ageRange: "7–12",
    sessions: [
      {
        label: "10:30–11:30 AM",
        startIso: "2026-09-12T10:30:00-04:00",
        endIso: "2026-09-12T11:30:00-04:00",
      },
    ],
    program: "Bricks Challenge",
    build: "Carousel",
    learningTopics: ["Electric motors", "Centrifugal force", "Mechanical movement", "Building and testing"],
    heroImage: {
      src: "/images/gallery/young-engineers-demo-sept-2026-v1.jpg",
      alt: "A child building a Bricks Challenge model at the September Young Engineers demo",
      width: 720,
      height: 1280,
    },
    highlightVideo: {
      src: "/videos/demo/young-engineers-demo-sept-2026-highlight.mp4",
      poster: "/images/demo/demo-sept-2026-highlight-poster.jpg",
      durationLabel: "26 seconds",
    },
    galleryImages: [],
    registrationUrl: "https://krianatutoring.com/demo",
  },
  {
    id: "2026-10-02-stittsville",
    title: "Young Engineers Demo — Stittsville",
    date: "2026-10-02",
    location: "Stittsville",
    address: "205 Metric Circle, Stittsville, ON K2V 0L3",
    status: "REGISTRATION_OPEN",
    price: 10,
    ageRange: "6–12",
    sessions: [
      {
        label: "10:30 AM–12:00 PM",
        offeringId: "young-engineers-demo-stittsville-oct-2026-am",
        startIso: "2026-10-02T10:30:00-04:00",
        endIso: "2026-10-02T12:00:00-04:00",
      },
      {
        label: "2:00 PM–3:30 PM",
        offeringId: "young-engineers-demo-stittsville-oct-2026-pm",
        startIso: "2026-10-02T14:00:00-04:00",
        endIso: "2026-10-02T15:30:00-04:00",
      },
    ],
    program: "Bricks Challenge",
    learningTopics: ["Gears", "Forces", "Structures", "Motors", "Problem-solving"],
    // No approved October media yet: the hero falls back to the latest
    // completed demo's approved image.
    registrationUrl: "https://krianatutoring.com/demo",
    programId: "young-engineers-demo-stittsville-oct-2026",
  },
];
