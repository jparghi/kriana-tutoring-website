import { NextResponse } from "next/server";

type ChatRequestBody = {
  message?: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

const SUBJECT_GUIDANCE: Record<string, string> = {
  math:
    "We offer concept reviews, step-by-step problem solving, and adaptive practice for everything from foundational numeracy through AP Calculus.",
  science:
    "Our tutors blend experiments, visual explanations, and lab prep to make biology, chemistry, and physics feel intuitive.",
  english:
    "We coach close reading, writing craft, and discussion skills so learners build confidence in essays and exams.",
  coding:
    "Students can prototype real projects while learning Python, JavaScript, and foundational CS thinking.",
};

const FAQ_RESPONSES: Array<{
  matchers: string[];
  reply: string;
}> = [
  {
    matchers: ["price", "cost", "pricing", "rate"],
    reply:
      "We create tailored tutoring plans. Most families schedule a free planning call first so we can recommend the right cadence and share pricing transparently.",
  },
  {
    matchers: ["schedule", "availability", "time", "slot"],
    reply:
      "We run tutoring after school, weekends, and during school days for microschools. Let me know your preferred time zone and we'll coordinate a schedule that works.",
  },
  {
    matchers: ["worksheet", "resources", "materials"],
    reply:
      "Our tutors design custom worksheets and projects, and our AI generator can create extra practice on-demand between sessions.",
  },
  {
    matchers: ["contact", "call", "phone", "email"],
    reply:
      "You can call (469) 640-1412 or email hello@kriana.com. I'm also happy to collect a few details and connect you with a learning advisor.",
  },
];

function buildResponse(message: string): string {
  const normalized = message.toLowerCase();
  const subject = Object.keys(SUBJECT_GUIDANCE).find((key) =>
    normalized.includes(key)
  );

  const faqMatch = FAQ_RESPONSES.find(({ matchers }) =>
    matchers.some((matcher) => normalized.includes(matcher))
  );

  const intro =
    "I'm Kriana's AI tutor! I can answer questions about our programs, suggest learning paths, or help you plan next steps.";

  const subjectHint = subject
    ? `\n\nFor ${subject} specifically, ${SUBJECT_GUIDANCE[subject]}`
    :
      "\n\nWe cover core academics, test prep, enrichment, and microschool partnerships for learners in elementary through high school.";

  const faqDetails = faqMatch
    ? `\n\n${faqMatch.reply}`
    :
      "\n\nIf you're exploring tutoring, I can outline a sample plan, share success stories, or help you schedule a discovery call.";

  const closing =
    "\n\nJust ask another question, or share your learner's grade and goals so I can recommend the best program.";

  return `${intro}${subjectHint}${faqDetails}${closing}`;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json(
      { error: "A message is required." },
      { status: 400 }
    );
  }

  const reply = buildResponse(message);

  return NextResponse.json({ reply });
}
