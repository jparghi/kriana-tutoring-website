import type { Metadata } from "next";

import { ContactGrid } from "../components/contact-grid";
import { FeatureGrid } from "../components/feature-grid";
import { Footer } from "../components/footer";
import { HeroSplit } from "../components/hero-split";
import { HowWeHelp } from "../components/how-we-help";
import { HowWereDifferent } from "../components/how-were-different";
import { LocalAreas } from "../components/local-areas";
import { PainPoints } from "../components/pain-points";
import { TestimonialCarousel } from "../components/testimonial-carousel";

export const metadata: Metadata = {
  title: "Math & English Tutoring for Kids in Ottawa | Kriana Tutoring",
  description:
    "Kriana Tutoring helps JK to Grade 8 students build confidence in math, reading, and writing through personalized and engaging learning in Ottawa. Book a free assessment today."
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* 1. Hero — value prop above the fold */}
      <HeroSplit />
      {/* 2. Parent pain points — build empathy */}
      <PainPoints />
      {/* 3. How Kriana helps — solution narrative */}
      <HowWeHelp />
      {/* 4. Local SEO signal */}
      <LocalAreas />
      {/* 4. How we're different — differentiation */}
      <HowWereDifferent />
      {/* 5. Programs — what we offer */}
      <FeatureGrid />
      {/* 6. Testimonials — social proof */}
      <TestimonialCarousel />
      {/* 7. Contact / final CTA */}
      <ContactGrid />
      <Footer />
    </main>
  );
}
