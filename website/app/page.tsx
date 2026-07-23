import type { Metadata } from "next";

import { CtaBanner } from "../components/cta-banner";
import { Footer } from "../components/footer";
import { HeroSplit } from "../components/hero-split";
import { ProgramsGrid } from "../components/programs-grid";
import { TrustBar } from "../components/trust-bar";

export const metadata: Metadata = {
  title: "Personalized Tutoring for Kids in Ottawa | Kriana Tutoring",
  description:
    "Kriana Tutoring builds personalized learning plans for JK to Grade 8 students in Ottawa. Every child is assessed before we plan — and parents receive monthly progress updates. Book a free assessment today.",
  alternates: { canonical: "https://www.krianatutoring.com" }
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* 1. Hero — Personalized Learning For Every Child */}
      <HeroSplit />
      {/* 2. Our Programs */}
      <ProgramsGrid />
      {/* 3. Trust bar — Young Engineers partner + trust points */}
      <TrustBar />
      {/* 4. Final CTA banner */}
      <CtaBanner />
      <Footer />
    </main>
  );
}
