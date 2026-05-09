export type ServicePage = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: Array<{
    title: string;
    description: string;
  }>;
};

export const servicePages: ServicePage[] = [
  {
    slug: "math-tutoring-for-kids-ottawa",
    title: "Math Tutoring for Kids in Ottawa",
    shortTitle: "Math tutoring for kids",
    description:
      "Personalized math tutoring in Ottawa for JK to Grade 8 students who need stronger fundamentals, clearer strategies, and confidence with daily schoolwork.",
    metaTitle: "Math Tutoring for Kids in Ottawa | Kriana Tutoring",
    metaDescription:
      "Kriana Tutoring offers math tutoring for kids in Ottawa, Kanata, and Stittsville with confidence-building support for JK to Grade 8 learners.",
    intro:
      "Our math tutoring for kids helps Ottawa families build stronger number sense, problem solving, and school confidence through patient, step-by-step instruction.",
    sections: [
      {
        title: "Foundational math support",
        description:
          "We rebuild number sense, operations, fractions, and problem-solving strategies so students stop guessing and start understanding."
      },
      {
        title: "Confidence-building instruction",
        description:
          "Children get the time, repetition, and encouragement they need to ask questions and practise without pressure."
      },
      {
        title: "Support for Ottawa-area families",
        description:
          "We work with students in Ottawa, Kanata, and nearby communities who need consistent support beyond the classroom."
      }
    ]
  },
  {
    slug: "reading-help-grade-1-3-ottawa",
    title: "Reading Help for Grade 1-3 in Ottawa",
    shortTitle: "Reading help for grade 1-3",
    description:
      "Foundational literacy support for young learners who need phonics, fluency, vocabulary, and comprehension practice in a patient setting.",
    metaTitle: "Reading Help for Grade 1-3 in Ottawa | Kriana Tutoring",
    metaDescription:
      "Get reading help for grade 1-3 students in Ottawa with phonics, fluency, comprehension, and confidence-building literacy support.",
    intro:
      "Our reading help for grade 1-3 students gives young learners the structure they need to strengthen phonics, fluency, comprehension, and confidence.",
    sections: [
      {
        title: "Early literacy foundations",
        description:
          "We support decoding, phonics, vocabulary, and comprehension in ways that feel manageable for young learners."
      },
      {
        title: "Reading routines that stick",
        description:
          "Families get practical strategies they can use at home to reinforce what students practise during tutoring."
      },
      {
        title: "Local support in Ottawa and Kanata",
        description:
          "Kriana works with Ottawa-area families who want early reading support before small gaps become long-term struggles."
      }
    ]
  },
  {
    slug: "homework-help-for-kids-ottawa",
    title: "Homework Help for Kids in Ottawa",
    shortTitle: "Homework help for kids",
    description:
      "Structured homework sessions that reduce after-school stress, improve organization, and help students finish work with less frustration.",
    metaTitle: "Homework Help for Kids in Ottawa | Kriana Tutoring",
    metaDescription:
      "Kriana Tutoring offers homework help for kids in Ottawa with structured academic support, study habits, and confidence-building routines.",
    intro:
      "Our homework help for kids turns stressful evenings into structured progress with guided support, stronger routines, and clearer expectations.",
    sections: [
      {
        title: "After-school structure",
        description:
          "We help students plan assignments, break work into smaller steps, and finish with less overwhelm."
      },
      {
        title: "Independent learning habits",
        description:
          "The goal is not just completion. We help children build the organization and focus needed to work more independently over time."
      },
      {
        title: "Built for Ottawa families",
        description:
          "Families across Ottawa, Kanata, and Stittsville choose Kriana when homework time has become a recurring source of stress."
      }
    ]
  }
];

export function getServicePageBySlug(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}
