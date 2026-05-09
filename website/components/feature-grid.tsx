import Link from "next/link";
import { SectionHeading } from "./section-heading";

const programs = [
  {
    emoji: "🔢",
    title: "Math Tutoring",
    description:
      "From number sense and addition in JK/SK through fractions, integers, and algebra in Grades 6-8, our math tutoring for kids builds the foundation first and advances from there.",
    tags: ["Number sense", "Fractions", "Mental math", "Problem solving"],
    grades: "JK to Grade 8",
    color: "text-brand-sky",
    bg: "from-brand-sky/15 to-brand-teal/5",
    border: "border-brand-sky/20",
    tagBg: "bg-brand-sky/10 text-brand-sky",
  },
  {
    emoji: "📖",
    title: "English · Reading · Writing",
    description:
      "Phonics, reading comprehension, vocabulary, and guided writing practice. We help children read with confidence and give families reading help for grade 1-3 and beyond.",
    tags: ["Phonics", "Comprehension", "Writing", "Vocabulary"],
    grades: "JK to Grade 8",
    color: "text-brand-teal",
    bg: "from-brand-teal/15 to-brand-sky/5",
    border: "border-brand-teal/20",
    tagBg: "bg-brand-teal/10 text-brand-teal",
  },
  {
    emoji: "📝",
    title: "Homework Support",
    description:
      "Structured, focused homework sessions that turn the nightly battle into a productive routine. Our homework help for kids helps children get unstuck, build independence, and finish feeling good.",
    tags: ["Daily homework", "Study skills", "Organization", "All subjects"],
    grades: "Grades 1 to 8",
    color: "text-brand-rose",
    bg: "from-brand-rose/15 to-brand-amber/5",
    border: "border-brand-rose/20",
    tagBg: "bg-brand-rose/10 text-brand-rose",
  },
  {
    emoji: "🌱",
    title: "JK–Grade 4 Foundation Support",
    description:
      "Early years are the most important. We focus on foundational literacy and numeracy skills that set children up for a lifetime of academic confidence.",
    tags: ["Early literacy", "Numeracy", "Fine motor", "School readiness"],
    grades: "JK to Grade 4",
    color: "text-amber-600",
    bg: "from-brand-amber/15 to-brand-rose/5",
    border: "border-brand-amber/20",
    tagBg: "bg-brand-amber/15 text-amber-700",
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-gradient-to-b from-white via-slate-50 to-brand-sky/10 py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Programs"
          title="Every program is built around your child's needs"
          description="Whether your child needs to catch up, keep up, or get ahead — we have a structured, personalized program that fits."
          align="left"
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {programs.map((program) => (
            <article
              key={program.title}
              className={`group flex flex-col gap-5 rounded-[28px] border bg-gradient-to-br p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(15,23,42,0.1)] ${program.bg} ${program.border}`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {program.emoji}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">
                  {program.grades}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">{program.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{program.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {program.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${program.tagBg}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href="/contact#consultation-form"
                className={`mt-auto inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 ${program.color} hover:opacity-70`}
              >
                Ask about this program
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 rounded-3xl border border-brand-sky/20 bg-gradient-to-r from-brand-sky/8 to-brand-teal/8 p-8 text-center">
          <p className="text-xl font-bold text-slate-900">Not sure which program fits your child?</p>
          <p className="max-w-md text-sm text-slate-600">Book a free assessment and we&apos;ll create a personalized plan together.</p>
          <Link
            href="/contact#consultation-form"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(74,144,226,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(74,144,226,0.6)]"
          >
            Book a Free Assessment
          </Link>
        </div>
      </div>
    </section>
  );
}
