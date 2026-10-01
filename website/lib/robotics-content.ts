import { BrainCircuitIcon, CompassIcon, GearIcon, SparkleIcon, TargetIcon, UsersIcon } from "../components/icons";

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
// no price/location yet). Coming-soon programs remain previews, even if a
// saved offering exists. Other programs show placeholder cards until created
// for real in Firestore via the separate program-management portal.
//
// Class days/times are deliberately NOT published on the site — the
// timetable changes often, so families contact us to arrange a schedule.
type LicensedRoboticsProgram = {
  id: string;
  title: string;
  ageRange: string;
  durationMin: number;
  description: string;
  learnMoreUrl: string;
  image: string;
  logo: string;
  comingSoon?: boolean;
  bookingTag?: string;
  marketingEyebrow?: string;
  skillTags?: string[];
  futureReadyCopy?: string;
};

export const licensedRoboticsPrograms: LicensedRoboticsProgram[] = [
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
  },
  {
    id: "algo-play",
    title: "Algo Play",
    ageRange: "9-12",
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
  {
    id: "galileo-technic",
    title: "Galileo Technic",
    comingSoon: true,
    ageRange: "7-10",
    durationMin: 75,
    description:
      "An advanced program that delves deep into comprehensive mechanical engineering principles, allowing students to explore new engineering terms through building complex models.",
    learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/galileo-technic-enrichment-program/",
    image: "/images/robotics/programs/galileo-technic.png",
    logo: "/images/robotics/programs/galileo-technic-logo.png",
  },
  {
    id: "robo-toys",
    title: "RoboToys",
    comingSoon: true,
    ageRange: "9-12",
    durationMin: 75,
    description:
      "A program designed to provide children with the basic skills to become proficient robotic makers and introduce them robotic-mechanical planning while using programming subjects.",
    learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/robotoys-program/",
    image: "/images/robotics/programs/robo-toys.png",
    logo: "/images/robotics/programs/robo-toys-logo.png",
  },
  {
    id: "algoc",
    title: "AlgoC",
    comingSoon: true,
    ageRange: "13-18",
    durationMin: 90,
    description:
      "AlgoC is a hands-on learning experience designed to equip students with essential coding, robotics, coding with AI, and problem-solving skills. This program focuses on C programming, the foundational language used in robotics, automation, and embedded systems. Through real-world challenges and interactive lessons, children will build, code, and innovate—preparing for a technology-driven future.",
    learnMoreUrl: "https://kanata.youngengineers.org/enrichment-programs/algoc-enrichment-program/",
    image: "/images/robotics/programs/algoc.png",
    logo: "/images/robotics/programs/algoc-logo.png",
  },
];

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
