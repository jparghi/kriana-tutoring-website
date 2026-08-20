import { BrainCircuitIcon, CompassIcon, GearIcon, SparkleIcon, TargetIcon, UsersIcon } from "../components/icons";
import { formatTimeOfDay } from "./booking";

// Young Engineers' own brand palette (pulled from their site's theme CSS),
// used as accent color so the page reads as a joint Kriana + YE effort.
export const YE_BLUE = "#0083CB";
export const YE_RED = "#ED174B";
export const YE_AMBER = "#F2A100";

// Program category -> card accent, per the design brief:
// bricks/mechanics = amber, advanced mechanics = red, robotics = blue, coding = navy/purple.
export function themeColorForCategory(category?: string) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("coding")) return "#3730A3"; // navy/purple-blue
  if (value.includes("advanced")) return YE_RED;
  if (value.includes("brick") || value.includes("mechanic")) return YE_AMBER;
  return YE_BLUE; // default: Robotics
}

// No per-program image field exists in Firestore yet, so cards are illustrated
// by category using existing project photography instead of repeating one image.
export function imageForCategory(category?: string) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("coding")) return "/images/robotics/robotics-tablet-coding.png";
  if (value.includes("advanced")) return "/images/robotics/build-test-improve.png";
  if (value.includes("brick") || value.includes("mechanic")) return "/images/young-engineers/robotics-and-coding.png";
  return "/images/young-engineers/robotics-and-coding.png"; // default: Robotics
}

// Presentation-only category tags (not business facts like age/price/schedule).
export function skillTagsForCategory(category?: string) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("coding")) return ["Coding", "Logical Thinking"];
  if (value.includes("advanced")) return ["Advanced Engineering", "Problem-Solving"];
  if (value.includes("brick")) return ["Mechanics", "Creativity"];
  return ["Robotics", "Teamwork"];
}

// Confirmed licensed Young Engineers programs (names, ages, durations only —
// no price/location yet). Shown as placeholder cards until each is created
// for real in Firestore via the separate program-management portal.
//
// `weeklySchedules` is the one exception: it's the recurring day/time batches
// these two programs actually run each week, published ahead of the real
// Firestore offerings so families can see them on the program cards. Once
// real offerings with published class dates exist for a program, their live
// schedule takes over and this static one is no longer shown (see
// ProgramCard in robotics-programs.tsx). Each entry's shape matches
// Firestore's offering.weekday / offering.startTime / offering.endTime so it
// formats identically via formatTimeOfDay/formatWeeklyClassSchedule.
export const licensedRoboticsPrograms = [
  {
    id: "smartivo",
    title: "Smartivo",
    ageRange: "4-6",
    durationMin: 60,
    bookingTag: "Robotics & Coding",
    marketingEyebrow: "Early Coding Foundations",
    skillTags: ["Sequencing", "Coding Logic", "AI-Ready Thinking"],
    futureReadyCopy:
      "Children bring robots to life through playful coding missions while building sequencing, logic and computational-thinking foundations.",
    description:
      "Using tangible coding blocks or the GoAlgo app, children explore commands, conditions, loops and multithreading through age-appropriate, story-based missions.",
    learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/smartivo-enrichment-program/",
    image: "/images/robotics/programs/smartivo.png",
    logo: "/images/robotics/programs/smartivo-logo.png",
    weeklySchedules: [
      { label: "Batch 1", weekday: "Monday", startTime: "16:15", endTime: "17:15" },
      { label: "Batch 2", weekday: "Monday", startTime: "17:30", endTime: "18:30" },
    ],
  },
  {
    id: "bricks-challenge",
    title: "Bricks Challenge",
    ageRange: "6-12",
    durationMin: 75,
    bookingTag: "Robotics",
    marketingEyebrow: "Engineering & Problem-Solving",
    skillTags: ["Mechanics", "Design Thinking", "Creative Problem-Solving"],
    futureReadyCopy:
      "Children build and test mechanical models while developing engineering thinking, creativity and systematic problem-solving.",
    description:
      "An educational program that introduces children to the principles of STEM and basic subjects of classical mechanics through the use of building blocks and mechanical parts.",
    learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/bricks-challenge-enrichment-program/",
    image: "/images/robotics/programs/bricks-challenge.png",
    logo: "/images/robotics/programs/bricks-challenge-logo.png",
    weeklySchedules: [
      { label: "Batch 1", weekday: "Wednesday", startTime: "16:15", endTime: "17:30" },
      { label: "Batch 2", weekday: "Wednesday", startTime: "17:45", endTime: "19:00" },
    ],
  },
  // Galileo Technic is a second-level program — hidden for launch, focusing
  // on first-level offerings first. Re-enable when ready to promote it.
  // {
  //   id: "galileo-technic",
  //   title: "Galileo Technic",
  //   ageRange: "7-10",
  //   durationMin: 75,
  //   description:
  //     "An advanced program that delves deep into comprehensive mechanical engineering principles, allowing students to explore new engineering terms through building complex models.",
  //   learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/galileo-technic-enrichment-program/",
  //   image: "/images/robotics/programs/galileo-technic.png",
  //   logo: "/images/robotics/programs/galileo-technic-logo.png",
  // },
  // Robo Toys is hidden for launch, focusing on first-level offerings
  // first. Re-enable when ready to promote it.
  // {
  //   id: "robo-toys",
  //   title: "Robo Toys",
  //   ageRange: "9-12",
  //   durationMin: 75,
  //   description:
  //     "A program designed to provide children with the basic skills to become proficient robotic makers and introduce them robotic-mechanical planning while using programming subjects.",
  //   learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/robotoys-program/",
  //   image: "/images/robotics/programs/robo-toys.png",
  //   logo: "/images/robotics/programs/robo-toys-logo.png",
  // },
  {
    id: "algo-play",
    title: "Algo Play",
    ageRange: "6-12",
    durationMin: 75,
    bookingTag: "Robotics & Coding",
    marketingEyebrow: "Algorithms & Coding",
    skillTags: ["Algorithms", "Debugging", "Robotics & AI Foundations"],
    futureReadyCopy:
      "Children explore algorithms, loops, conditions and debugging—the coding logic behind robotics, automation and future AI technologies.",
    description:
      "Using tangible coding tools or the GoAlgo app, children develop essential coding fundamentals including conditions, loops, multithreading and debugging.",
    learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/algoplay-enrichment-program/",
    image: "/images/robotics/programs/algo-play.png",
    logo: "/images/robotics/programs/algo-play-logo.png",
  },
  // Hidden for now — re-enable when ready to launch.
  // {
  //   id: "algoc",
  //   title: "AlgoC",
  //   ageRange: "13-18",
  //   durationMin: 90,
  //   description:
  //     "AlgoC is a hands-on learning experience designed to equip students with essential coding, robotics, coding with AI, and problem-solving skills. This program focuses on C programming, the foundational language used in robotics, automation, and embedded systems. Through real-world challenges and interactive lessons, children will build, code, and innovate—preparing for a technology-driven future.",
  //   learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/algoc-enrichment-program/",
  //   image: "/images/robotics/programs/algoc.png",
  //   logo: "/images/robotics/programs/algoc-logo.png",
  // },
];

// Formats a single licensedRoboticsPrograms weekly-schedule batch the same
// way real Firestore offerings are formatted (see formatOfferingWeeklySchedule
// in lib/booking.ts), e.g. "Mondays, 4:15 p.m.–5:15 p.m.", so the time format
// stays identical whether a program's schedule is this static placeholder
// or a live published offering.
export function formatWeeklyClassSchedule(
  schedule?: { weekday?: string; startTime?: string; endTime?: string } | null
) {
  if (!schedule?.weekday || !schedule?.startTime) return null;
  const day = schedule.weekday;
  const dayLabel = day.endsWith("s") ? day : `${day}s`;
  const start = formatTimeOfDay(schedule.startTime);
  const end = schedule.endTime ? formatTimeOfDay(schedule.endTime) : "";
  return end ? `${dayLabel}, ${start}–${end}` : `${dayLabel}, ${start}`;
}

// Formats every batch in a licensedRoboticsPrograms `weeklySchedules` list,
// pairing each formatted time with its batch label (e.g. "Batch 1").
export function formatWeeklyClassSchedules(
  schedules?: { label?: string; weekday?: string; startTime?: string; endTime?: string }[] | null
) {
  if (!schedules?.length) return [];
  return schedules
    .map((schedule) => ({ label: schedule.label, time: formatWeeklyClassSchedule(schedule) }))
    .filter((entry) => Boolean(entry.time)) as { label?: string; time: string }[];
}

const PLACEHOLDER_IMAGES = [
  "/images/young-engineers/robotics-and-coding.png",
  "/images/robotics/robotics-tablet-coding.png",
  "/images/robotics/build-test-improve.png",
];

export function placeholderImageForIndex(i: number) {
  return PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];
}

// Marketing claims remain local and curriculum-reviewed even when schedule,
// capacity, and registration data comes from Firestore. Prefer the stable
// licensed-program id; title matching is retained only for older Firestore
// documents whose generated document ids do not match the licensed ids.
export function findLicensedRoboticsProgram(program?: { id?: string; title?: string } | null) {
  if (!program) return null;
  const normalize = (value?: string) => (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const id = normalize(program.id);
  const title = normalize(program.title);

  return licensedRoboticsPrograms.find((item) => normalize(item.id) === id)
    ?? licensedRoboticsPrograms.find((item) => normalize(item.title) === title)
    ?? null;
}

export const skillsBuilt = [
  {
    title: "Computational Thinking",
    icon: CompassIcon,
    description: "Breaking a challenge into clear steps and building a logical path to a solution.",
  },
  {
    title: "Problem-Solving",
    icon: TargetIcon,
    description: "Working through obstacles when a model doesn't behave as planned.",
  },
  {
    title: "Creativity",
    icon: SparkleIcon,
    description: "Exploring original ways to build, move and design.",
  },
  {
    title: "Teamwork",
    icon: UsersIcon,
    description: "Building and troubleshooting alongside classmates.",
  },
  {
    title: "Engineering Design",
    icon: GearIcon,
    description: "Learning how gears, motors and structures work together through building and testing.",
  },
  {
    title: "Coding, Algorithms & Debugging",
    icon: BrainCircuitIcon,
    description: "Using age-appropriate programming, patterns and debugging to control a creation.",
  },
];
