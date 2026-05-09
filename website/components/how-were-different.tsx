import { SectionHeading } from "./section-heading";

const differentiators = [
  {
    icon: "💛",
    title: "Confidence-first approach",
    description:
      "Before we cover content, we rebuild belief. Our teaching style is patient, encouraging, and specifically designed to help children stop saying \"I can't\" and start saying \"I've got this.\"",
    accent: "border-brand-amber/30 from-brand-amber/10 to-brand-rose/5",
    badge: "bg-brand-amber/15 text-amber-700",
    badgeLabel: "Our philosophy",
  },
  {
    icon: "✋",
    title: "Hands-on learning activities",
    description:
      "We use manipulatives, interactive exercises, and engaging worksheets — because children learn by doing, not by passively watching or listening.",
    accent: "border-brand-sky/30 from-brand-sky/10 to-brand-teal/5",
    badge: "bg-brand-sky/15 text-brand-sky",
    badgeLabel: "How we teach",
  },
  {
    icon: "📄",
    title: "Structured worksheets & practice",
    description:
      "Every student gets take-home practice materials that reinforce the session. Progress isn't accidental — it's the result of consistent, structured repetition.",
    accent: "border-brand-teal/30 from-brand-teal/10 to-brand-sky/5",
    badge: "bg-brand-teal/15 text-brand-teal",
    badgeLabel: "What students get",
  },
  {
    icon: "👤",
    title: "Small group & personalized attention",
    description:
      "Unlike a classroom of 25, every child at Kriana gets seen, heard, and understood. Sessions are kept small so nothing slips through the cracks.",
    accent: "border-brand-rose/30 from-brand-rose/10 to-brand-amber/5",
    badge: "bg-brand-rose/15 text-brand-rose",
    badgeLabel: "Class size",
  },
  {
    icon: "🏡",
    title: "Warm, home-based learning environment",
    description:
      "Our cozy center in Stittsville, Ottawa feels like a safe second home — not a stressful classroom. Children arrive nervous and leave smiling.",
    accent: "border-brand-amber/30 from-brand-amber/10 to-brand-teal/5",
    badge: "bg-brand-amber/15 text-amber-700",
    badgeLabel: "Our space",
  },
  {
    icon: "🎒",
    title: "JK to Grade 8 support",
    description:
      "From the very first year of school to Grade 8 transitions, we meet children exactly where they are and support the full primary learning journey.",
    accent: "border-brand-teal/30 from-brand-teal/10 to-brand-sky/5",
    badge: "bg-brand-teal/15 text-brand-teal",
    badgeLabel: "Who we serve",
  },
];

export function HowWereDifferent() {
  return (
    <section className="bg-gradient-to-b from-slate-50/80 to-white py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="How we're different"
          title="Not a generic tutoring center — a confidence-first learning experience"
          description="There are plenty of tutoring options out there. Here's why Kriana families keep coming back and why their children actually look forward to sessions."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className={`group flex flex-col gap-5 rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] ${item.accent}`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] ${item.badge}`}>
                  {item.badgeLabel}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
