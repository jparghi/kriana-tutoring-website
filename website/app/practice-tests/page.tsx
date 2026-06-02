import type { Metadata } from "next";
import { ExamSearchExperience } from "../../components/exam-search-experience";
import { examCatalog } from "../../data/exam-catalog";

export const metadata: Metadata = {
  title: "Ontario Practice Tests & Assessments Grade 1–8 | Kriana",
  description:
    "Browse Ontario-aligned practice tests and assessments for Grade 1 to Grade 8. Filter by subject, difficulty, and grade level. Curated by Kriana Tutoring Ottawa.",
  alternates: { canonical: "https://www.krianatutoring.com/practice-tests" }
};

export default function PracticeTestsPage() {
  return (
    <main className="relative mx-auto max-w-6xl space-y-16 px-6 pb-24 pt-6 sm:px-10 lg:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-sky/20 via-white/60 to-transparent" aria-hidden="true" />
      <ExamSearchExperience tests={examCatalog.filter((e) => e.gradeLevel !== "Grade 9")} />
    </main>
  );
}
