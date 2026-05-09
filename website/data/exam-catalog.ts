export const gradeOrder = [
  "JK",
  "SK",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9"
] as const;

// Grade 9 data is kept in the catalog but not shown on the website yet.
export const publishedGradeOrder = gradeOrder.filter((g) => g !== "Grade 9") as readonly Exclude<GradeLevel, "Grade 9">[];

export type GradeLevel = (typeof gradeOrder)[number];

export type TestType = "Quiz" | "Mini Quiz" | "Test" | "Assessment";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface PracticeTest {
  id: string;
  title: string;
  subject: string;
  gradeLevel: GradeLevel;
  summary: string;
  skills: string[];
  topics: string[];
  duration: string;
  questionsCount: number;
  difficulty: Difficulty;
  type: TestType;
  previewPalette: {
    from: string;
    to: string;
    accent: string;
  };
  downloadUrl: string;
  answerKeyUrl?: string;
}

export const examCatalog: PracticeTest[] = [
  // ── Grade 1 ─────────────────────────────────────────────────────────────────
  {
    id: "gr1-reading-writing-assessment",
    title: "Grade 1 Reading & Writing Assessment",
    subject: "English",
    gradeLevel: "Grade 1",
    summary: "A balanced reading and writing check-in assessing comprehension, vocabulary, letter formation, and early sentence writing skills.",
    skills: ["Reading Comprehension", "Vocabulary", "Sentence Writing", "Letter Formation"],
    topics: ["Ontario Grade 1 Language"],
    duration: "40 min",
    questionsCount: 12,
    difficulty: "Easy",
    type: "Assessment",
    previewPalette: { from: "from-rose-100", to: "to-sky-50", accent: "bg-rose-500" },
    downloadUrl: "/worksheets/grade-1/gr1-reading-writing-assessment.pdf"
  },

  // ── Grade 2 ─────────────────────────────────────────────────────────────────
  {
    id: "gr2-writing-reading-math-assessment",
    title: "Grade 2 Writing, Reading & Math Assessment",
    subject: "Math & English",
    gradeLevel: "Grade 2",
    summary: "A cross-curricular term check-in covering reading comprehension, writing, and key math concepts including addition, subtraction, and data.",
    skills: ["Reading", "Writing", "Addition/Subtraction", "Data"],
    topics: ["Ontario Grade 2 Math", "Ontario Grade 2 Language"],
    duration: "45 min",
    questionsCount: 15,
    difficulty: "Easy",
    type: "Assessment",
    previewPalette: { from: "from-amber-100", to: "to-indigo-50", accent: "bg-amber-500" },
    downloadUrl: "/worksheets/grade-2/gr2-writing-reading-math-assessment.pdf"
  },

  // ── Grade 4 ─────────────────────────────────────────────────────────────────
  {
    id: "gr4-math-test-harder-add-sub-mult-div",
    title: "Grade 4 Math Test",
    subject: "Mathematics",
    gradeLevel: "Grade 4",
    summary: "32-question harder math test covering 4-digit addition (with triple addends), subtraction across zeros, 2- and 3-digit multiplication, and long division with remainders.",
    skills: ["4-Digit Addition", "Subtraction Across Zeros", "Multi-Digit Multiplication", "Long Division", "Remainders"],
    topics: ["Ontario Grade 4 Mathematics", "Number Sense", "Computation"],
    duration: "55 min",
    questionsCount: 32,
    difficulty: "Hard",
    type: "Test",
    previewPalette: { from: "from-indigo-100", to: "to-slate-50", accent: "bg-indigo-600" },
    downloadUrl: "/worksheets/grade-4/gr4-math-test-harder-add-sub-mult-div.pdf",
    answerKeyUrl: "/worksheets/grade-4/gr4-math-test-harder-add-sub-mult-div-answerkey.pdf"
  },

  {
    id: "gr4-math-assessment-term",
    title: "Grade 4 Math Assessment – Term Check",
    subject: "Mathematics",
    gradeLevel: "Grade 4",
    summary: "A comprehensive Grade 4 math assessment covering number operations, word problems, measurement, geometry, and data handling to evaluate overall term progress.",
    skills: ["Addition & Subtraction", "Multiplication & Division", "Word Problems", "Measurement", "Geometry", "Data Handling"],
    topics: ["Ontario Grade 4 Mathematics"],
    duration: "45 min",
    questionsCount: 20,
    difficulty: "Medium",
    type: "Assessment",
    previewPalette: { from: "from-indigo-100", to: "to-slate-50", accent: "bg-indigo-500" },
    downloadUrl: "/worksheets/grade-4/gr4-math-assessment.pdf"
  },

  // ── Grade 5 ─────────────────────────────────────────────────────────────────
  {
    id: "gr5-math-english-mixed-assessment-term-checkin",
    title: "Grade 5 Mixed Assessment – Term Check-in",
    subject: "Math & English",
    gradeLevel: "Grade 5",
    summary: "15-question check-in with 75% math and 25% English to review operations, fractions, time, money, and reading skills.",
    skills: ["Operations", "Fractions", "Time & Money", "Reading", "Writing"],
    topics: ["Ontario Grade 5 Math", "Ontario Grade 5 Language"],
    duration: "45 min",
    questionsCount: 15,
    difficulty: "Medium",
    type: "Test",
    previewPalette: { from: "from-sky-100", to: "to-slate-50", accent: "bg-sky-500" },
    downloadUrl: "/worksheets/grade-5/gr5-math-english-mixed-assessment-term-checkin.pdf"
  },

  {
    id: "gr5-math-test-add-sub-mult",
    title: "Grade 5 Math Test – Addition, Subtraction & Multiplication",
    subject: "Mathematics",
    gradeLevel: "Grade 5",
    summary: "28-question math test covering multi-digit addition, subtraction, multiplication, word problems, and order-of-operations expressions.",
    skills: ["Multi-Digit Addition", "Subtraction", "Multiplication", "Word Problems", "Order of Operations"],
    topics: ["Ontario Grade 5 Math", "Number Sense", "Problem Solving"],
    duration: "45 min",
    questionsCount: 28,
    difficulty: "Medium",
    type: "Test",
    previewPalette: { from: "from-teal-100", to: "to-slate-50", accent: "bg-teal-500" },
    downloadUrl: "/worksheets/grade-5/gr5-math-test-add-sub-mult.pdf",
    answerKeyUrl: "/worksheets/grade-5/gr5-math-test-add-sub-mult-answerkey.pdf"
  },

  // ── Grade 6 ─────────────────────────────────────────────────────────────────
  {
    id: "gr6-math-assessment-term-checkin",
    title: "Grade 6 Math Assessment – Term Check-in",
    subject: "Mathematics",
    gradeLevel: "Grade 6",
    summary: "18-question check-in covering operations, decimals, fractions, percent, geometry, and data in one printable snapshot.",
    skills: ["Operations", "Fractions & Decimals", "Percent", "Geometry", "Data"],
    topics: ["Ontario Grade 6 Math", "Problem Solving"],
    duration: "45 min",
    questionsCount: 18,
    difficulty: "Medium",
    type: "Assessment",
    previewPalette: { from: "from-emerald-100", to: "to-slate-50", accent: "bg-emerald-500" },
    downloadUrl: "/worksheets/grade-6/gr6-math-assessment-term-checkin.pdf"
  },

  // ── Grade 8 ─────────────────────────────────────────────────────────────────
  {
    id: "gr8-math-assessment",
    title: "Grade 8 Math Assessment – Term Check",
    subject: "Mathematics",
    gradeLevel: "Grade 8",
    summary: "A 25-question Grade 8 math term assessment focusing on integers, fractions and decimals, percentages, algebra, geometry, and data analysis at a medium complexity level.",
    skills: ["Integers", "Fractions & Decimals", "Percentages", "Algebra", "Geometry", "Data Analysis", "Problem Solving"],
    topics: ["Ontario Grade 8 Mathematics"],
    duration: "50 min",
    questionsCount: 25,
    difficulty: "Hard",
    type: "Assessment",
    previewPalette: { from: "from-violet-100", to: "to-slate-50", accent: "bg-violet-500" },
    downloadUrl: "/worksheets/grade-8/gr8-math-assessment.pdf"
  },

  // ── Grade 9 ─────────────────────────────────────────────────────────────────
  {
    id: "gr9-science-climate-change-impacts-miniquiz",
    title: "Climate Change & Impacts – Mini Quiz",
    subject: "Science",
    gradeLevel: "Grade 9",
    summary: "A focused 10-question mini quiz assessing understanding of climate change causes, effects, and key terminology.",
    skills: ["Climate Change", "Terminology", "Key Concepts"],
    topics: ["Ontario Grade 9 Science (SNC1W)"],
    duration: "20 min",
    questionsCount: 10,
    difficulty: "Medium",
    type: "Mini Quiz",
    previewPalette: { from: "from-teal-100", to: "to-slate-50", accent: "bg-teal-500" },
    downloadUrl: "/worksheets/grade-9/g9-science-climate-change-and-impacts-miniquiz.pdf"
  },
  {
    id: "gr9-science-ecosystems-miniquiz",
    title: "Ecosystems – Mini Quiz",
    subject: "Science",
    gradeLevel: "Grade 9",
    summary: "A focused mini quiz covering ecosystem structure, food webs, biodiversity, and ecological relationships.",
    skills: ["Ecosystems", "Food Webs", "Biodiversity"],
    topics: ["Ontario Grade 9 Science (SNC1W)"],
    duration: "20 min",
    questionsCount: 10,
    difficulty: "Medium",
    type: "Mini Quiz",
    previewPalette: { from: "from-lime-100", to: "to-slate-50", accent: "bg-lime-500" },
    downloadUrl: "/worksheets/grade-9/g9-science-ecosystems-miniquiz.pdf"
  },
  {
    id: "gr9-science-human-impacts-miniquiz",
    title: "Human Impacts – Mini Quiz",
    subject: "Science",
    gradeLevel: "Grade 9",
    summary: "A targeted mini quiz assessing knowledge of how human activities affect ecosystems, climate, and biodiversity.",
    skills: ["Human Impacts", "Environmental Science", "Key Concepts"],
    topics: ["Ontario Grade 9 Science (SNC1W)"],
    duration: "20 min",
    questionsCount: 10,
    difficulty: "Medium",
    type: "Mini Quiz",
    previewPalette: { from: "from-orange-100", to: "to-slate-50", accent: "bg-orange-500" },
    downloadUrl: "/worksheets/grade-9/g9-science-human-impacts-miniquiz.pdf"
  },
  {
    id: "gr9-science-sustainable-practices-miniquiz",
    title: "Sustainable Practices – Mini Quiz",
    subject: "Science",
    gradeLevel: "Grade 9",
    summary: "Test understanding of sustainability principles, conservation strategies, and environmental stewardship through targeted questions.",
    skills: ["Sustainability", "Conservation", "Environmental Stewardship"],
    topics: ["Ontario Grade 9 Science (SNC1W)"],
    duration: "20 min",
    questionsCount: 10,
    difficulty: "Medium",
    type: "Mini Quiz",
    previewPalette: { from: "from-green-100", to: "to-slate-50", accent: "bg-green-500" },
    downloadUrl: "/worksheets/grade-9/g9-science-sustainablepractices-miniquiz.pdf"
  },
];

export const gradeToIndex = new Map(gradeOrder.map((grade, index) => [grade, index]));
