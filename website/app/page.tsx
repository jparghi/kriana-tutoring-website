import type { Metadata } from "next";

import { ContactGrid } from "../components/contact-grid";
import { FeatureGrid } from "../components/feature-grid";
import { Footer } from "../components/footer";
import { HeroSplit } from "../components/hero-split";
import { HowWeHelp } from "../components/how-we-help";
import { KrianaMethodTeaser } from "../components/kriana-method-teaser";
import { LocalAreas } from "../components/local-areas";
import { PainPoints } from "../components/pain-points";
import { TestimonialCarousel } from "../components/testimonial-carousel";

export const metadata: Metadata = {
  title: "Personalized Tutoring for Kids in Ottawa | Kriana Tutoring",
  description:
    "Kriana Tutoring builds personalized learning plans for JK to Grade 8 students in Ottawa. Every child is assessed before we plan — and parents receive monthly progress updates. Book a free assessment today."
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* 1. Hero — Personalized Learning For Every Child */}
      <HeroSplit />
      {/* 2. Parent pain points — build empathy */}
      <PainPoints />
      {/* 3. How Kriana helps — solution narrative */}
      <HowWeHelp />
      {/* 4. Method teaser — 4-step preview, links to /why-kriana for full detail */}
      <KrianaMethodTeaser />
      {/* 5. Programs — what we offer */}
      <FeatureGrid />
      {/* 6. Local SEO signal */}
      <LocalAreas />
      {/* 7. Testimonials — social proof */}
      <TestimonialCarousel />
      {/* 8. Contact / final CTA */}
      <ContactGrid />
      <Footer />
    </main>
  );
}
