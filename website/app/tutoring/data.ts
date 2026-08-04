export type ServicePage = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string;
  imageAlt: string;
  accent: string;
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
    image: "/images/services/math-tutoring-realistic.png",
    imageAlt: "A tutor helping a student understand fractions with colorful hands-on learning tools",
    accent: "#4A90E2",
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
    image: "/images/services/reading-help-realistic.png",
    imageAlt: "A tutor encouraging a young student as they read an illustrated book together",
    accent: "#00A99D",
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
    slug: "science-tutoring-for-kids-ottawa",
    title: "Science Tutoring for Kids in Ottawa",
    shortTitle: "Science tutoring for kids",
    description:
      "Engaging science support that helps students understand key concepts, strengthen problem-solving skills, and build confidence through curiosity and real-world examples.",
    image: "/images/services/science-tutoring-realistic.png",
    imageAlt: "A tutor and student examining a leaf during a hands-on science lesson",
    accent: "#FF8A65",
    metaTitle: "Science Tutoring for Kids in Ottawa | Kriana Tutoring",
    metaDescription:
      "Kriana Tutoring offers personalized science tutoring for kids in Ottawa, Kanata, and Stittsville with clear explanations and hands-on learning.",
    intro:
      "Our science tutoring helps children connect classroom concepts to the world around them through clear explanations, observation, and guided problem-solving.",
    sections: [
      {
        title: "Stronger science foundations",
        description:
          "We make life science, physical science, Earth science, and classroom vocabulary easier to understand through patient, age-appropriate instruction."
      },
      {
        title: "Curiosity-led problem-solving",
        description:
          "Students learn to observe, ask useful questions, interpret information, and explain their reasoning instead of memorizing isolated facts."
      },
      {
        title: "Support for Ottawa-area learners",
        description:
          "We support students in Ottawa, Kanata, and Stittsville who want stronger science understanding and greater confidence in class."
      }
    ]
  }
];

export function getServicePageBySlug(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}
