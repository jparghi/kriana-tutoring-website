import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../../components/footer";
import { licensedRoboticsPrograms } from "../../../lib/robotics-content";
import { siteUrl } from "../../../lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Young Engineers Parent Guides | Kriana Tutoring" },
  description:
    "Short digital parent guides to the Young Engineers programs at Kriana Tutoring: Bricks Challenge, Smartivo and AlgoPlay. See what your child learns and how a class runs.",
  alternates: { canonical: `${siteUrl}/resources/parent-guides` },
};

// The PDFs live in public/resources/parent-guides. Family emails sent from the
// portal (Marketing → Family Emails) link here — to the page or to a guide's
// #anchor — so keep these ids stable. Ages come from the /robotics program
// data so the two pages always agree.
const guides = [
  {
    id: "bricks-challenge",
    programId: "bricks-challenge",
    title: "Bricks Challenge",
    focus: "Hands-on engineering, mechanics and problem-solving",
    summary:
      "Children build real mechanical models to discover structures, gears, levers and the physics behind everyday machines, with AI support from the BuildWise app to explain how each model works.",
    file: "/resources/parent-guides/bricks-challenge-parent-guide.pdf",
    size: "2.9 MB",
  },
  {
    id: "smartivo",
    programId: "smartivo",
    title: "Smartivo",
    focus: "Early coding and interactive STEM learning for younger children",
    summary:
      "Story-based missions turn first coding steps into an adventure. Children build code in the GoAlgo app and watch their Smartivo robot carry it out, learning sequences, conditions and loops through play.",
    file: "/resources/parent-guides/smartivo-parent-guide.pdf",
    size: "5.7 MB",
  },
  {
    id: "algoplay",
    programId: "algo-play",
    title: "AlgoPlay",
    focus: "Coding, algorithms, robotics and AI-focused learning",
    summary:
      "Children build robots and bring them to life with code: algorithms, conditions, loops, sensors and debugging, plus an introduction to AI-supported coding and machine learning.",
    file: "/resources/parent-guides/algoplay-parent-guide.pdf",
    size: "26 MB",
  },
];

function programFor(programId: string) {
  return licensedRoboticsPrograms.find((program) => program.id === programId);
}

export default function ParentGuidesPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
        <section
          className="px-4 pb-12 pt-10 sm:px-8"
          style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 50%, #F1F8F8 100%)" }}
        >
          <div className="mx-auto max-w-4xl">
            <div className="flex max-w-md items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Image src="/images/young-engineers/logo.png" alt="Young Engineers" width={180} height={52} className="h-9 w-auto" />
              <span className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">in partnership with</span>
              <Image src="/images/kriana-tutoring-logo-horizontal-5.png" alt="Kriana Tutoring" width={1266} height={294} className="h-8 w-auto" />
            </div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-[#0c6162]">Parent resources</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[#0A2D5A] sm:text-4xl">Young Engineers Parent Guides</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Three short guides to explore at your convenience. Each one explains what children learn, how a class runs and the
              skills it builds. There&apos;s no need to choose anything yet. We&apos;re happy to help you find the right fit.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-8">
          <div className="mx-auto grid max-w-4xl gap-6">
            {guides.map((guide) => {
              const program = programFor(guide.programId);
              return (
                <article
                  key={guide.id}
                  id={guide.id}
                  className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:grid sm:grid-cols-[220px_1fr]"
                >
                  {program?.image && (
                    <div className="relative h-48 bg-slate-50 sm:h-full">
                      <Image src={program.image} alt="" fill sizes="(min-width: 640px) 220px, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-black text-[#0A2D5A]">{guide.title}</h2>
                      {program?.ageRange && (
                        <span className="rounded-full bg-[#F1F8F8] px-3 py-1 text-xs font-bold text-[#0c6162]">
                          Ages {program.ageRange.replace("-", "–")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#0c6162]">{guide.focus}</p>
                    <p className="mt-3 leading-7 text-slate-700">{guide.summary}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={guide.file}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0c6162] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a5051]"
                      >
                        Read the {guide.title} guide
                      </a>
                      <span className="self-center text-xs text-slate-500">PDF · {guide.size}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-10 text-center sm:px-10">
            <h2 className="text-2xl font-bold text-[#0A2D5A]">Programs, schedules &amp; pricing</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              See class times and the latest pricing, or watch Young Engineers in action. Questions? Call or text{" "}
              <a href="tel:+16134006921" className="font-semibold text-[#0c6162] hover:underline">613-400-6921</a>.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/robotics#pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0c6162] px-7 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:bg-[#0a5051]"
              >
                Programs &amp; Pricing
              </Link>
              <Link
                href="/gallery"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-[#0c6162] hover:text-[#0c6162]"
              >
                See It in Action
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
