"use client";

import Link from "next/link";
import { motion } from "../lib/motion";
import { SectionHeading } from "./section-heading";

const scenes = [
  {
    scene: "01",
    duration: "0–10s",
    title: "Every Child Learns Differently",
    visual: "Three animated children sit at the same desk with identical worksheets. One looks confident, one confused, one staring out the window. A question mark floats above each.",
    voiceover:
      "Every child is different. They think differently. They learn differently. They grow differently.",
    onScreen: "Every Child Learns Differently.",
    animationNote: "Gentle fade-in. Each child appears one at a time. Question marks animate in with a soft bounce.",
    color: "from-brand-sky/15 to-brand-teal/5 border-brand-sky/20",
    sceneColor: "bg-brand-sky/15 text-brand-sky",
    durationColor: "text-brand-sky",
  },
  {
    scene: "02",
    duration: "10–25s",
    title: "The Problem with One-Size-Fits-All",
    visual: "A conveyor belt moves children past a teacher handing each one an identical worksheet. Children look defeated. Report cards float down showing missed marks.",
    voiceover:
      "When every child gets the same plan, most children fall behind. Not because they can't learn — but because no one built a plan around how they learn.",
    onScreen: "One plan. One worksheet. One result.",
    animationNote: "Conveyor belt moves left to right. Report cards flutter down like leaves. Colours are muted greys.",
    color: "from-slate-100 to-slate-50 border-slate-200",
    sceneColor: "bg-slate-200 text-slate-500",
    durationColor: "text-slate-400",
  },
  {
    scene: "03",
    duration: "25–40s",
    title: "The Kriana Assessment",
    visual: "A tutor sits with a child at a warm wooden table. Gentle light. The tutor holds a clipboard and smiles. Small icons (math, reading, writing) light up one by one as the child answers.",
    voiceover:
      "At Kriana, we start by getting to know your child. Before a single lesson, we run a thorough assessment — to understand exactly where they are and how they learn best.",
    onScreen: "Step 1: Assessment — Know Before You Plan",
    animationNote: "Warm amber glow enters from the left. Icons pulse softly as they activate. Tutor nods encouragingly.",
    color: "from-brand-amber/15 to-brand-rose/5 border-brand-amber/20",
    sceneColor: "bg-brand-amber/15 text-amber-700",
    durationColor: "text-amber-600",
  },
  {
    scene: "04",
    duration: "40–55s",
    title: "The Personalized Learning Plan",
    visual: "A document unfolds on screen — labelled with the child's name. Custom icons appear beside each subject: a pencil, a calculator, a book. A path glows forward, unique to this child.",
    voiceover:
      "Then we build a plan made for your child — not for every child. A personalized learning path that starts where they are and takes them where they need to go.",
    onScreen: "Step 2: Your Child's Personalized Learning Plan",
    animationNote: "Document rolls out like a scroll. Each item on the plan animates in sequentially. Path glows teal as it traces forward.",
    color: "from-brand-teal/15 to-brand-sky/5 border-brand-teal/20",
    sceneColor: "bg-brand-teal/15 text-brand-teal",
    durationColor: "text-brand-teal",
  },
  {
    scene: "05",
    duration: "55–70s",
    title: "Monthly Progress & Parent Updates",
    visual: "A progress bar fills on screen. A smiling parent looks at their phone showing a progress update notification. The child high-fives the tutor in the background.",
    voiceover:
      "Every month, we review your child's progress. And you're always kept in the loop — because when parents and tutors work together, children thrive.",
    onScreen: "Monthly Progress Reviews · Parent Updates Included",
    animationNote: "Progress bar animates left to right filling with teal. Phone notification slides in from right. High-five freeze-frames with a sparkle.",
    color: "from-brand-rose/15 to-brand-amber/5 border-brand-rose/20",
    sceneColor: "bg-brand-rose/15 text-brand-rose",
    durationColor: "text-brand-rose",
  },
  {
    scene: "06",
    duration: "70–82s",
    title: "Confidence & Academic Growth",
    visual: "The same three children from Scene 1 — now all look confident. Worksheets are filled in. Stars appear. The previously confused child raises their hand enthusiastically. Smiles all around.",
    voiceover:
      "The result? Children who believe in themselves. Who walk into class ready. Who stop saying 'I can't' — and start saying 'I've got this.'",
    onScreen: "Confident Learners. Real Results.",
    animationNote: "Stars burst from each child. Scene transitions from muted to vibrant full colour. Upbeat music swells.",
    color: "from-brand-amber/15 to-brand-teal/5 border-brand-amber/20",
    sceneColor: "bg-brand-amber/15 text-amber-700",
    durationColor: "text-amber-600",
  },
  {
    scene: "07",
    duration: "82–90s",
    title: "Call to Action",
    visual: "Kriana logo animates in centre screen. Tagline appears below. A glowing button pulses: 'Book a Free Assessment'. Ottawa skyline silhouette in the background.",
    voiceover:
      "Kriana Tutoring. Personalized Learning For Every Child. Book your free assessment today — and let's build a plan around your child.",
    onScreen: "Kriana Tutoring · Personalized Learning For Every Child\nBook a Free Assessment — krianatutoring.com",
    animationNote: "Logo scales up from centre with soft glow. Tagline types in. Button pulses with brand-sky glow. Ottawa skyline fades in at 20% opacity.",
    color: "from-brand-sky/20 to-brand-teal/10 border-brand-sky/25",
    sceneColor: "bg-brand-sky/15 text-brand-sky",
    durationColor: "text-brand-sky",
  },
];

export function VideoStoryboard() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-brand-sky/10 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-brand-teal/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-teal/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Animated Explainer · 60–90 seconds"
          title="Our Story in Seven Scenes"
          description="A complete storyboard for Kriana's animated explainer video — showing every child's journey from confusion to confidence."
          tone="dark"
        />

        {/* Video format badge */}
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3 justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {["No real people required", "Animated characters", "60–90 second runtime", "Voice-over script included"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* Scenes */}
        <div className="mt-14 space-y-6">
          {scenes.map((scene, index) => (
            <motion.div
              key={scene.scene}
              className={`overflow-hidden rounded-2xl border bg-gradient-to-br ${scene.color} backdrop-blur-sm`}
              initial={{ opacity: 0, transform: "translateY(20px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
            >
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_1fr]">
                {/* Scene number + duration */}
                <div className="flex flex-row items-start gap-4 lg:flex-col lg:gap-2 lg:w-24">
                  <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] ${scene.sceneColor}`}>
                    Scene {scene.scene}
                  </span>
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${scene.durationColor}`}>
                    {scene.duration}
                  </span>
                </div>

                {/* Left: Visual + On-screen text */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">{scene.title}</h3>

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Visual</p>
                    <p className="text-sm leading-relaxed text-slate-700">{scene.visual}</p>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">On-Screen Text</p>
                    <p className="rounded-lg bg-slate-900/8 px-3 py-2 text-sm font-semibold italic text-slate-800">
                      &ldquo;{scene.onScreen}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Right: Voiceover + Animation */}
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Voiceover Script</p>
                    <p className="text-sm leading-relaxed text-slate-700 italic">
                      &ldquo;{scene.voiceover}&rdquo;
                    </p>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Animation Notes</p>
                    <p className="text-sm leading-relaxed text-slate-600">{scene.animationNote}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Production note */}
        <motion.div
          className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold text-slate-300">
            This storyboard is ready for an animation studio or motion-graphics designer.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Recommended tools: Adobe After Effects · Vyond · Animaker · Doodly · professional 2D animation studio
          </p>
          <Link
            href="/contact#consultation-form"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-7 py-3 text-sm font-bold text-white shadow-[0_6px_24px_rgba(74,144,226,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_36px_rgba(74,144,226,0.6)]"
          >
            Book a Free Assessment Instead
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
