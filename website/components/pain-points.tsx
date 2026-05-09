import { SectionHeading } from "./section-heading";

const painPoints = [
  {
    emoji: "😔",
    title: "My child is falling behind",
    description:
      "Report cards show gaps and teacher comments are worrying. You want to act before the gap gets wider.",
  },
  {
    emoji: "😤",
    title: "Homework is a nightly battle",
    description:
      "Every evening ends in frustration — for your child and for you. Learning shouldn't feel like a fight.",
  },
  {
    emoji: "📉",
    title: "Math or reading confidence is low",
    description:
      "Your child says \"I'm just not good at math\" or avoids reading altogether. That belief needs to change.",
  },
  {
    emoji: "🏫",
    title: "School can't give one-on-one time",
    description:
      "With 25+ students in a classroom, your child's specific gaps don't always get addressed. That's where we come in.",
  },
  {
    emoji: "📋",
    title: "No structure outside of school",
    description:
      "Your child needs regular, consistent practice with a plan — not just random worksheets or YouTube videos.",
  },
  {
    emoji: "🤝",
    title: "You want a trusted learning partner",
    description:
      "You're looking for someone patient, caring, and experienced — not just a high schooler doing homework help.",
  },
];

export function PainPoints() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50/80 py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Sound familiar?"
          title="Every parent deserves peace of mind about their child's learning"
          description="You're not alone. These are the concerns we hear most from Ottawa families — and exactly what Kriana Tutoring was built to solve."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-rose/20 hover:shadow-[0_12px_36px_rgba(255,138,101,0.1)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-amber/15 text-2xl transition-transform duration-300 group-hover:scale-110">
                {point.emoji}
              </span>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900">{point.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
