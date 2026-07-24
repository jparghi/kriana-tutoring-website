import {
  BrainCircuitIcon,
  CodeIcon,
  CompassIcon,
  FlaskIcon,
  GearIcon,
  SlidersIcon,
  SparkleIcon,
  TargetIcon,
  UsersIcon,
} from "../components/icons";

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
// no price/schedule/location yet). Shown as placeholder cards until each is
// created for real in Firestore via the separate program-management portal.
export const licensedRoboticsPrograms = [
  { id: "smartivo", title: "Smartivo", ageRange: "4-6", durationMin: 45 },
  { id: "bricks-challenge", title: "Bricks Challenge", ageRange: "6-10", durationMin: 75 },
  { id: "galileo-technic", title: "Galileo Technic", ageRange: "7-10", durationMin: 75 },
  { id: "algo-play", title: "Algo Play", ageRange: "6-10", durationMin: 75 },
  { id: "robo-toys", title: "Robo Toys", ageRange: "9-12", durationMin: 75 },
  { id: "algoc", title: "AlgoC", ageRange: "13-18", durationMin: 90 },
];

const PLACEHOLDER_IMAGES = [
  "/images/young-engineers/robotics-and-coding.png",
  "/images/robotics/robotics-tablet-coding.png",
  "/images/robotics/build-test-improve.png",
];

export function placeholderImageForIndex(i: number) {
  return PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];
}

export const learningJourney = [
  {
    step: "Imagine",
    icon: SparkleIcon,
    description: "Turn an idea or challenge into a possible design.",
  },
  {
    step: "Build",
    icon: GearIcon,
    description: "Construct a working mechanical or robotic model.",
  },
  {
    step: "Test",
    icon: FlaskIcon,
    description: "Observe how the model moves and responds.",
  },
  {
    step: "Improve",
    icon: SlidersIcon,
    description: "Adjust gears, structures or code to make it work better.",
  },
  {
    step: "Code",
    icon: CodeIcon,
    description: "Use age-appropriate programming to control the creation.",
  },
];

export const skillsBuilt = [
  {
    title: "Engineering Thinking",
    icon: CompassIcon,
    description: "Breaking a challenge into steps and reasoning through a design.",
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
    title: "Mechanical Understanding",
    icon: GearIcon,
    description: "Learning how gears, motors and structures work together.",
  },
  {
    title: "Coding & Logical Thinking",
    icon: BrainCircuitIcon,
    description: "Using age-appropriate programming to control a creation.",
  },
];
