import { Metadata } from "next";

import offlineTutoringData from "../../../data/offlineTutoring.json";
import { SectionHeader } from "../../../components/common/section-header";
import { Accordion } from "../../../components/ui/accordion";
import { VideoCard } from "../../../components/ui/video-card";

type OfflineTutoringEntry = {
  grade: string;
  topic: string;
  videos: { title: string; src: string; duration: string; thumbnail?: string }[];
  worksheet: string;
  plan: string[];
};

const offlineTutoring = offlineTutoringData as OfflineTutoringEntry[];

export const revalidate = false;

export const metadata: Metadata = {
  title: "Offline Tutoring Library – Kriana Tutoring",
  description:
    "Watch short math explainer videos and download printable worksheets for Grades 1–8. Personalized tutoring made simple.",
  keywords:
    "Kriana Tutoring, math videos, Ottawa tutoring, Grade 1 to 8, printable worksheets, Kanata tutoring center"
};

export default function OfflineTutoringPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <SectionHeader
        title="Offline Tutoring Library"
        subtitle="Watch short math explainer videos and download matching worksheets for each grade."
        background="white"
        accent="blue-500"
      />

      <section className="mx-auto mb-16 w-full max-w-6xl px-6 sm:px-10">
        <div className="space-y-6">
          {offlineTutoring.map((entry, index) => (
            <Accordion
              key={entry.grade}
              title={`${entry.grade} – ${entry.topic}`}
              defaultOpen={index === 0}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {entry.videos.map((video) => (
                  <VideoCard key={video.title} {...video} />
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                <a
                  href={entry.worksheet}
                  className="inline-flex items-center justify-center rounded-full bg-[#004aad] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#003a86]"
                >
                  <span className="mr-2" aria-hidden="true">
                    📄
                  </span>
                  Download Worksheet
                </a>
                <div className="space-y-2 md:max-w-2xl">
                  <p className="font-semibold text-slate-900">Learning Plan Overview</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    {entry.plan.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </Accordion>
          ))}
        </div>
      </section>
    </main>
  );
}
