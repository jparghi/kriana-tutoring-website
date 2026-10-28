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

// 'DEMO' (default) or a *_WORKSHOP value. Only the wording differs — see
// lib/demo-event-copy.js. Any other string is treated as a demo.
export type DemoEventType = "DEMO" | "PD_DAY_WORKSHOP" | "STEM_WORKSHOP" | "HOLIDAY_WORKSHOP";

export type DemoStatus = "WAITLIST" | "REGISTRATION_OPEN" | "SOLD_OUT" | "COMPLETED";

export interface DemoSession {
  label: string; // "10:30 AM–12:00 PM"
  name?: string; // "Morning Workshop"
  // Key into the event's `themes` — set on every session of a themed,
  // multi-date event (see WorkshopTheme). The session's date is its startIso's.
  theme?: string;
  // Display fallback only, for when the live offering can't be read (the
  // charged price always comes from the offering's earlyBirdEndsAt).
  earlyBirdEndsIso?: string; // exclusive, like DemoEvent.earlyBird.endsIso
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

// A workshop theme shared by several sessions/dates (e.g. the November PA/PD
// Days run one theme at three times over two dates). An event with `themes` renders
// the date picker + theme cards (app/events/WorkshopPicker.tsx) instead of
// the single-event session picker.
export interface WorkshopTheme {
  name: string; // "Crazy Comical Machines"
  series?: string; // "Power Play"
  focus: string; // short subtitle on the card: "Gears & teamwork"
  palette: "teal" | "purple"; // card colours, see WorkshopPicker
  blurb: string;
  models: string[]; // model names shown with the image
  image: DemoMedia; // approved model render(s) — transparent PNG/WebP
  // "Which workshop fits your child?" rows, in WORKSHOP_COMPARE_ROWS order.
  compare: { goodFor: string; builds: string; bigIdea: string; teamwork: string };
}

export interface DemoFaqItem {
  q: string;
  a: string;
}

export interface DemoEvent {
  id: string;
  title: string;
  eventType: DemoEventType;
  // Optional marketing copy for the hero and SEO. Omit to use generic copy.
  hook?: string[]; // headline lines under the title, e.g. ["No school?", "Make it a day to…"]
  summary?: string; // supporting line under the hook
  priceLabel?: string; // "Introductory Workshop"
  reserveHeadline?: string; // heading over the second registration CTA
  heroVideo?: { src: string }; // autoplays muted in the hero; heroImage is its poster
  seoDescription?: string;
  date: string; // YYYY-MM-DD (Ottawa local date)
  location: string; // short area name: "Kanata"
  address: string; // full street address, or "" when not public
  status: DemoStatus;
  soldOut?: boolean; // completed demos that filled up
  price: number; // CAD, regular price before tax
  // Display only — the charged amount comes from the session offering's
  // earlyBirdTuitionCents/earlyBirdEndsAt/taxRate (see getDemoPricing).
  earlyBird?: { price: number; endsIso: string }; // endsIso is exclusive: the first moment it no longer applies
  plusTax?: boolean; // show "+ tax" (HST is added at registration)
  ageRange: string;
  sessions: DemoSession[];
  program: string;
  build?: string; // the model children built
  learningTopics: string[];
  heroImage?: DemoMedia;
  // caption: optional line shown under the reel in "Previous Events" proof.
  highlightVideo?: { src: string; poster: string; durationLabel: string; caption?: string };
  galleryImages?: DemoMedia[]; // curated, approved photos only — 8 max
  galleryId?: string; // data/gallery.ts entry the "View Highlights" button deep-links to
  registrationUrl: string;
  // Firestore programs id the session offerings belong to (must also be in
  // DEMO_ELIGIBLE_PROGRAM_IDS in lib/demo-eligibility.js).
  programId?: string;
  // Themed, multi-date workshops — see WorkshopTheme.
  themes?: Record<string, WorkshopTheme>;
  // Replaces the generic FAQ questions (the waitlist answer is always added).
  faq?: DemoFaqItem[];
  // "Workshop details" grid: label -> text.
  details?: { label: string; text: string }[];
}

export const demos: DemoEvent[] = [
  {
    id: "2026-09-12-kanata",
    title: "Young Engineers Demo — Kanata",
    eventType: "DEMO",
    date: "2026-09-12",
    location: "Kanata",
    address: "",
    status: "COMPLETED",
    soldOut: true,
    price: 10,
    ageRange: "6–12",
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
    galleryId: "young-engineers-demo-sept-2026",
    galleryImages: [],
    registrationUrl: "https://krianatutoring.com/events",
  },
  {
    id: "2026-10-02-stittsville",
    title: "Young Engineers PA/PD Day STEM Workshop",
    eventType: "PD_DAY_WORKSHOP",
    hook: ["No school?", "Make it a day to build, create and discover."],
    summary: "90 minutes of hands-on engineering and building with the Bricks Challenge for kids ages 6–12.",
    priceLabel: "Introductory Workshop",
    seoDescription:
      "Join our Young Engineers PA/PD Day STEM Workshop in Stittsville on October 2. Kids ages 6–12 build, test and explore hands-on engineering with the Bricks Challenge.",
    date: "2026-10-02",
    location: "Stittsville",
    address: "205 Metric Circle, Stittsville, ON K2V 0L3",
    status: "REGISTRATION_OPEN",
    price: 10,
    ageRange: "6–12",
    sessions: [
      {
        label: "10:30 AM–12:00 PM",
        name: "Morning Workshop",
        offeringId: "young-engineers-demo-stittsville-oct-2026-am",
        startIso: "2026-10-02T10:30:00-04:00",
        endIso: "2026-10-02T12:00:00-04:00",
      },
      {
        label: "2:00 PM–3:30 PM",
        name: "Afternoon Workshop",
        offeringId: "young-engineers-demo-stittsville-oct-2026-pm",
        startIso: "2026-10-02T14:00:00-04:00",
        endIso: "2026-10-02T15:30:00-04:00",
      },
    ],
    program: "Bricks Challenge",
    learningTopics: ["Gears", "Forces", "Structures", "Motors", "Problem-solving"],
    heroImage: {
      src: "/images/demo/young-engineers-pd-day-workshop-oct-2026.jpg",
      alt: "A Young Engineers instructor helping a girl build a gear model from bricks",
      width: 1400,
      height: 1002,
    },
    galleryId: "october-2-workshop-highlights",
    registrationUrl: "https://krianatutoring.com/events",
    programId: "young-engineers-demo-stittsville-oct-2026",
  },
  {
    id: "2026-10-25-stittsville-halloween",
    title: "Young Engineers Halloween STEM Workshop",
    eventType: "HOLIDAY_WORKSHOP",
    hook: ["This Halloween,", "let your child build something SPOOKTACULAR! 🎃👻"],
    summary: "2 hours of hands-on STEM fun for kids ages 6–12: building exciting moving machines while exploring engineering through play.",
    priceLabel: "Halloween Workshop",
    reserveHeadline: "Give Your Child a Spooktacular Halloween",
    seoDescription:
      "Join our Young Engineers Halloween STEM Workshop in Stittsville on Sunday, October 25. Kids ages 6–12 build exciting moving machines in 2 hours of hands-on engineering fun.",
    date: "2026-10-25",
    location: "Stittsville",
    address: "205 Metric Circle, Stittsville, ON K2V 0L3",
    status: "REGISTRATION_OPEN",
    price: 30,
    earlyBird: { price: 25, endsIso: "2026-10-16T00:00:00-04:00" },
    plusTax: true,
    ageRange: "6–12",
    sessions: [
      {
        label: "10:30 AM–12:30 PM",
        name: "Halloween Workshop",
        offeringId: "young-engineers-halloween-stittsville-oct-2026-offering",
        startIso: "2026-10-25T10:30:00-04:00",
        endIso: "2026-10-25T12:30:00-04:00",
      },
    ],
    program: "Halloween Adventure",
    build: "Ghost Buddies",
    learningTopics: ["Moving machines", "Gears", "Motors", "Mechanisms", "Building and testing"],
    heroImage: {
      src: "/images/demo/young-engineers-halloween-workshop-oct-2026.jpg",
      alt: "Young Engineers Halloween Adventure: a brick-built monster machine, October 25, 10:30 AM to 12:30 PM at 205 Metric Circle, Stittsville",
      width: 1080,
      height: 1080,
    },
    heroVideo: { src: "/videos/demo/young-engineers-halloween-workshop-oct-2026.mp4" },
    highlightVideo: {
      src: "/videos/demo/young-engineers-halloween-workshop-oct-2026-highlight.mp4",
      poster: "/images/demo/halloween-workshop-oct-2026-highlight-poster.jpg",
      durationLabel: "30 seconds",
      caption: "Ghost Buddies came to life! 👻 Our young engineers built spooky moving machines with gears and motors, all with a little help from our instructors.",
    },
    galleryId: "halloween-workshop-highlights",
    registrationUrl: "https://krianatutoring.com/events",
    programId: "young-engineers-halloween-stittsville-oct-2026",
  },
  {
    // One workshop, three sessions (Nov 20 morning + afternoon, Nov 23
    // morning), one Firestore offering each (own capacity, waitlist and
    // early-bird deadline). Seeded by
    // scripts/seed-pa-pd-days-nov-2026-offerings.mjs.
    id: "2026-11-pa-pd-days-stittsville",
    title: "Young Engineers PA/PD Day Workshop",
    eventType: "PD_DAY_WORKSHOP",
    hook: ["No School.", "Big Ideas."],
    summary:
      "Crazy Comical Machines: your child builds Ghost Buddies, a hilarious two-character moving machine, and discovers how gears and mechanisms bring it to life. A hands-on engineering workshop on two PA/PD Days in Stittsville.",
    priceLabel: "PA/PD Day Workshop",
    seoDescription:
      "Young Engineers PA/PD Day workshops in Stittsville on Friday, November 20 and Monday, November 23, 2026. Kids ages 6–12 build Ghost Buddies, a comical moving machine, in a 3-hour hands-on engineering workshop.",
    date: "2026-11-20",
    location: "Stittsville",
    address: "205 Metric Circle, Stittsville, ON K2V 0L3",
    status: "REGISTRATION_OPEN",
    price: 39,
    earlyBird: { price: 34, endsIso: "2026-11-11T00:00:00-05:00" },
    plusTax: true,
    ageRange: "6–12",
    themes: {
      "crazy-comical-machines": {
        name: "Crazy Comical Machines",
        series: "Power Play",
        focus: "Build Ghost Buddies",
        palette: "purple",
        blurb: "Build Ghost Buddies, a pair of goofy moving characters powered by a single motor. Discover how gears and clever mechanisms bring a comical machine to life, then upgrade it with your own faces, speeds and moves.",
        models: ["Ghost Buddies"],
        image: {
          src: "/images/workshops/ghost-buddies.webp",
          alt: "Ghost Buddies: a yellow and a red character side by side on a motorised base, built from engineering building blocks",
          width: 592,
          height: 506,
        },
        compare: {
          goodFor: "Love silly ideas, funny faces and making things move in surprising ways",
          builds: "Ghost Buddies, two goofy characters driven by one motor",
          bigIdea: "Turning round-and-round motion into back-and-forth motion",
          teamwork: "Kids upgrade their machines with new expressions and moving parts",
        },
      },
    },
    sessions: [
      {
        label: "Fri, Nov 20 · 9:30 AM–12:30 PM",
        name: "Crazy Comical Machines",
        theme: "crazy-comical-machines",
        offeringId: "ye-pa-pd-2026-11-20-am",
        startIso: "2026-11-20T09:30:00-05:00",
        endIso: "2026-11-20T12:30:00-05:00",
        earlyBirdEndsIso: "2026-11-11T00:00:00-05:00",
      },
      {
        label: "Fri, Nov 20 · 1:30 PM–4:30 PM",
        name: "Crazy Comical Machines",
        theme: "crazy-comical-machines",
        offeringId: "ye-pa-pd-2026-11-20-pm",
        startIso: "2026-11-20T13:30:00-05:00",
        endIso: "2026-11-20T16:30:00-05:00",
        earlyBirdEndsIso: "2026-11-11T00:00:00-05:00",
      },
      {
        label: "Mon, Nov 23 · 9:30 AM–12:30 PM",
        name: "Crazy Comical Machines",
        theme: "crazy-comical-machines",
        offeringId: "ye-pa-pd-2026-11-23-am",
        startIso: "2026-11-23T09:30:00-05:00",
        endIso: "2026-11-23T12:30:00-05:00",
        earlyBirdEndsIso: "2026-11-14T00:00:00-05:00",
      },
    ],
    program: "Power Play",
    learningTopics: ["Gears", "Mechanisms", "Circular to linear motion", "Teamwork", "Building and testing"],
    heroImage: {
      src: "/images/demo/young-engineers-pd-day-workshop-oct-2026.jpg",
      alt: "A Young Engineers instructor helping a girl attach a gear to her model",
      width: 1400,
      height: 1002,
    },
    details: [
      { label: "Times", text: "Fri, Nov 20: 9:30 AM–12:30 PM or 1:30 PM–4:30 PM. Mon, Nov 23: 9:30 AM–12:30 PM." },
      { label: "Location", text: "205 Metric Circle, Stittsville, ON K2V 0L3" },
      { label: "Ages", text: "6–12. No building experience needed." },
      { label: "Provided", text: "All engineering building blocks, motors and tools." },
      { label: "What to bring", text: "A water bottle and a nut-free snack." },
    ],
    faq: [
      { q: "Does my child need previous experience?", a: "No. First-time builders are welcome, and instructors adjust each challenge to your child's level." },
      { q: "Is it right for a 6-year-old and a 12-year-old?", a: "Yes. Younger children follow the step-by-step instructions with help; older children take on the upgrade challenges." },
      {
        q: "Are the November 20 morning and afternoon sessions different?",
        a: "No. Both run the same Crazy Comical Machines workshop, so choose the time that suits your family. Each session is 3 hours.",
      },
      {
        q: "My child has built Ghost Buddies with us before. Is this the same build?",
        a: "Yes, it's the same Ghost Buddies model. If your child has already built it, call or text us before registering and we'll help you decide if this workshop is right for them.",
      },
      { q: "What about snacks?", a: "There's a short snack break in each workshop. Please pack a nut-free snack and a water bottle." },
      { q: "Who supervises the children?", a: "Trained Young Engineers instructors lead every workshop." },
      { q: "How do drop-off and pickup work?", a: "Drop off up to 10 minutes before the start time and pick up right at the end time, at 205 Metric Circle. A parent or guardian signs your child in and out." },
      { q: "How do I pay, and when is my spot confirmed?", a: "After you register, your spot is held for 48 hours while you send the e-Transfer. We confirm your registration by email once the payment arrives." },
      { q: "What if the workshop I want is full?", a: "Join the waitlist for that session. It's free, and if a spot opens we'll contact the next family on the list." },
    ],
    registrationUrl: "https://krianatutoring.com/events",
    programId: "young-engineers-pa-pd-days-stittsville-nov-2026",
  },
];
