import type { Metadata } from "next";
import Image from "next/image";

const leadership = [
  {
    name: "Jignasa Parghi",
    role: "Founder & Lead Educator",
    bio: "A former Environmental scientist & Software Tester turned education entrepreneur, Jignasa founded Kriana Tutoring to blend hands-on learning with compassionate mentorship for every child.",
    image: "/images/team/jignasa-parghi.png"
  },
  {
    name: "Jigish Parghi",
    role: "Co-Founder & Curriculum Designer",
    bio: "Jigish co-founded Kriana Tutoring with a vision to make learning feel approachable and fun. With 15+ years in IT, he designs the curriculum, builds the learning materials, and keeps the platform running — ensuring every student gets a thoughtful, well-crafted experience.",
    image: "/images/team/jigish-parghi.png"
  },
];

const values = [
  {
    title: "Learning with Heart",
    description: "We nurture relationships first, building trust so students feel safe to take risks, ask questions, and discover their authentic brilliance."
  },
  {
    title: "Future-Ready Skills",
    description: "Our curriculum mixes core academics with AI literacy, design thinking, and collaboration to prepare students for tomorrow's opportunities."
  },
  {
    title: "Data-Informed Growth",
    description: "Every plan is personalized through diagnostics, ongoing feedback, and transparent progress data shared with families each step of the way."
  }
];

const milestones = [
  {
    year: "2024",
    title: "Origins in One-on-One Tutoring",
    description: "Jignasa launches Kriana to support local students with compassionate, individualized sessions after witnessing gaps in traditional learning."
  },
  {
    year: "2025",
    title: "Expanding into STEM & Coding",
    description: "Jigish joins to design robotics, coding, and makerspace labs that introduce hands-on STEM journeys for curious learners."
  },
  {
    year: "2023",
    title: "Hybrid Learning Studio",
    description: "Kriana opens a collaborative studio combining virtual whiteboards, AI study buddies, and in-person mentorship hubs."
  },
  {
    year: "Today",
    title: "Community of Confident Scholars",
    description: "Hundreds of students across grades K–12 partner with our tutors to spark creativity, strengthen fundamentals, and celebrate wins."
  }
];

const highlights = [
  //{ label: "Students served", value: "850+" },
  //{ label: "Personalized lesson plans delivered", value: "4,200" },
  { label: "Average grade improvement", value: "1.5 levels" },
  { label: "Parent satisfaction score", value: "98%" }
];

export const metadata: Metadata = {
  title: "About Us",
  description: "Discover the story, mission, and team behind Kriana Tutoring's modern learning experience."
};

export default function AboutPage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col bg-white">
      <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-teal/40 via-brand-sky/40 to-brand-amber/40 blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-24 sm:px-10 lg:pt-32">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-brand-sky/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-brand-sky">
              About Kriana tutoring
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Where compassionate mentors and future-ready learning come together
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              After more than a decade in the tech industry, I realized that while I enjoyed the challenges of my career, my true passion was education—sparking curiosity and a lifelong love of learning in young minds. Today, Kriana Tutoring brings together dedicated educators, joyful learning spaces, and adaptive teaching approaches to help every student grow from uncertainty to unstoppable confidence.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-[0_16px_40px_rgba(6,11,26,0.08)] backdrop-blur"
                >
                  <div className="text-3xl font-semibold text-slate-900">{highlight.value}</div>
                  <div className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                    {highlight.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-midnight via-slate-900 to-slate-800 shadow-[0_30px_60px_rgba(6,11,26,0.25)]" />
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/90 to-white/70 p-1 backdrop-blur-lg">
              <div className="rounded-[2.3rem] bg-slate-950/90 p-10 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-amber">
                  Our Promise
                </p>
                <p className="mt-6 text-2xl font-semibold leading-snug">
                  “We meet every student where they are and craft a pathway to where they dream to be—academically, socially, and emotionally.”
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/40">
                    <Image src="/images/team/jignasa-parghi.png" alt="Jignasa Parghi" fill className="object-cover" sizes="56px" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Jignasa Parghi</div>
                    <div className="text-xs uppercase tracking-[0.3em] text-white/60">Founder</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 hidden h-32 w-32 rounded-3xl bg-brand-amber/30 blur-2xl lg:block" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 hidden h-28 w-28 rounded-full bg-brand-rose/20 blur-2xl lg:block" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-brand-sky/10 py-24 text-slate-900">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 12px 12px, rgba(14,165,233,0.06) 1px, transparent 0)" }} />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 sm:px-10 lg:flex-row lg:items-start">
          <div className="max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-[0_18px_48px_rgba(6,11,26,0.08)] backdrop-blur">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-brand-sky/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
              Mission & Vision
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Elevating curiosity, resilience, and purpose-driven scholars
            </h2>
            <p className="text-base leading-relaxed text-slate-600">
              From foundational reading skills to accelerated STEM exploration, we guide learners to master concepts, advocate for themselves, and lead with empathy. Parents partner with us through transparent communication, progress dashboards, and collaborative goal-setting.
            </p>
          </div>
          <div className="grid flex-1 gap-8 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_18px_48px_rgba(6,11,26,0.08)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(6,11,26,0.12)]"
              >
                <h3 className="text-lg font-semibold text-slate-900">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*
      <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-teal">
            Our Story
          </p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            The journey from a single study table to a thriving innovation hub
          </h2>
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {milestones.map((milestone) => (
            <div key={milestone.year} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_18px_48px_rgba(6,11,26,0.08)]">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-sky">{milestone.year}</span>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">{milestone.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{milestone.description}</p>
              <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-brand-sky/20 blur-2xl" />
            </div>
          ))}
        </div>
      </section>*/}

      <section className="relative bg-slate-50 py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/40 to-transparent" />
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-rose/30 bg-brand-rose/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-rose">
              Meet the Team
            </p>
            <h2 className="mt-6 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              A multidisciplinary crew of educators, technologists, and mentors
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Every student is supported by a collaborative team who blends academic mastery with social-emotional coaching and real-world problem-solving experiences.
            </p>
          </div>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.map((member) => (
              <article
                key={member.name}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(6,11,26,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(6,11,26,0.12)]"
              >
                <div className="relative h-72 w-full overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-4 p-8">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-sky">{member.role}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-midnight via-slate-900 to-slate-950 py-24 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)" }} />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 text-center sm:px-10">
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Ready to build a custom learning blueprint?</h2>
          <p className="max-w-2xl text-base leading-relaxed text-white/70">
            Let’s co-create a roadmap that sparks curiosity and celebrates progress every week. We’ll start with a discovery call, pair your learner with the right mentor, and design measurable goals that amplify strengths.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-amber hover:text-slate-900"
              href="/contact#consultation-form"
            >
              Schedule a conversation
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-white/60 px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-brand-teal hover:text-brand-teal"
              href="/register"
            >
              Explore enrollment
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
