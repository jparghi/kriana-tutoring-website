import type { Metadata } from "next";

import { CtaBanner } from "../components/cta-banner";
import { Footer } from "../components/footer";
import { HeroSplit } from "../components/hero-split";
import { ProgramsGrid } from "../components/programs-grid";
import { TestimonialCarousel } from "../components/testimonial-carousel";
import { TrustBar } from "../components/trust-bar";

export const metadata: Metadata = {
  title: "Kriana Tutoring | Tutoring, Robotics & STEM in Kanata",
  description:
    "Personalized tutoring, robotics, coding, camps and hands-on STEM programs for children in Kanata and Stittsville. Explore programs or register today.",
  alternates: { canonical: "https://www.krianatutoring.com" },
  openGraph: {
    title: "Kriana Tutoring | Tutoring, Robotics & STEM in Kanata",
    description:
      "Personalized tutoring, robotics, coding, camps and hands-on STEM programs for children in Kanata and Stittsville. Explore programs or register today."
  }
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
      {/* 4. Parent testimonials */}
      <TestimonialCarousel />
      {/* 5. Final CTA banner */}
      <CtaBanner />
      <Footer />
    </main>
  );
}
