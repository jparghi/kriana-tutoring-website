"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getActiveSessions, getPrograms, SESSION_STATUS } from "../../lib/booking";
import { ROBOTICS_BOOKING_URL, ROBOTICS_CATEGORY } from "../../lib/site-links";
import {
  imageForCategory,
  licensedRoboticsPrograms,
  placeholderImageForIndex,
  themeColorForCategory,
} from "../../lib/robotics-content";

type Program = Record<string, any>;
type Session = Record<string, any>;

function normalizeProgramName(value?: string) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function withLicensedProgramAssets(program: Program): Program {
  const id = normalizeProgramName(program.id);
  const title = normalizeProgramName(program.title);
  const licensedProgram = licensedRoboticsPrograms.find(
    (item) => normalizeProgramName(item.id) === id || normalizeProgramName(item.title) === title
  );

  if (!licensedProgram) return program;

  return {
    ...licensedProgram,
    ...program,
    image: program.image || licensedProgram.image,
    logo: program.logo || licensedProgram.logo,
  };
}

function ProgramCard({
  program,
  sessions,
  isPlaceholder = false,
  image,
}: {
  program: Program;
  sessions: Session[];
  isPlaceholder?: boolean;
  image?: string;
}) {
  const activeSessions = sessions.filter(
    (s) => s.status !== SESSION_STATUS.DRAFT && s.status !== SESSION_STATUS.CANCELLED
  );
  const nextSession = activeSessions[0];
  const allSoldOut = activeSessions.length > 0 && activeSessions.every((s) => s.status === SESSION_STATUS.SOLD_OUT);
  const isOpen = activeSessions.length > 0 && !allSoldOut;
  const accent = themeColorForCategory(program.category);
  const cardImage = image ?? program.image ?? imageForCategory(program.category);
  const programId = normalizeProgramName(program.id);
  const programTitle = normalizeProgramName(program.title);
  const shouldContainImage =
    programId === "smartivo" ||
    programTitle === "smartivo" ||
    programId === "brickschallenge" ||
    programTitle === "brickschallenge" ||
    programId === "galileotechnic" ||
    programTitle === "galileotechnic" ||
    programId === "robotoys" ||
    programTitle === "robotoys";

  const availabilityLabel = allSoldOut ? "Sold Out" : isOpen ? "Registration Open" : "Coming Soon";
  const availabilityClasses = allSoldOut
    ? "bg-red-50 text-red-600"
    : isOpen
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 border-l-4 bg-white shadow-sm transition-all duration-300 hover:-translate-x-0.5 hover:shadow-[0_16px_44px_rgba(15,23,42,0.1)]"
      style={{ borderLeftColor: accent }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50">
        <Image
          src={cardImage}
          alt={`${program.title} — Young Engineers program at Kriana Tutoring`}
          fill
          className={`transition-transform duration-500 group-hover:scale-[1.04] ${
            shouldContainImage ? "object-contain p-2" : "object-cover"
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
          {program.ageRange && (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              Ages {program.ageRange}
            </span>
          )}
          {(nextSession?.durationMin ?? program.durationMin) && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              {nextSession?.durationMin ?? program.durationMin} min
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
          {!isPlaceholder && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${availabilityClasses}`}>
              {availabilityLabel}
            </span>
          )}
        </div>

        {program.description && (
          <div>
            <p
              className={`text-sm leading-relaxed text-slate-600 ${
                descriptionExpanded ? "" : "line-clamp-3"
              }`}
            >
              {program.description}
            </p>
            <button
              type="button"
              onClick={() => setDescriptionExpanded((prev) => !prev)}
              className="mt-1 text-xs font-bold"
              style={{ color: accent }}
            >
              {descriptionExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}

        {program.gradeRange && (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Grades {program.gradeRange}
            </span>
          </div>
        )}

        {isPlaceholder ? (
          <div className="mt-auto flex gap-3 pt-2">
            <Link
              href={ROBOTICS_BOOKING_URL}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#0c6162] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
            >
              Register
            </Link>
            {program.learnMoreUrl && (
              <a
                href={program.learnMoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 transition-all duration-200 hover:border-brand-sky hover:text-brand-sky"
              >
                Learn More
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        ) : (
          <div className="mt-auto flex gap-3 pt-2">
            <Link
              href={`/booking/${program.id}`}
              className="group/cta inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0c6162] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
            >
              Register
              <span aria-hidden="true" className="transition-transform duration-200 group-hover/cta:translate-x-1">
                →
              </span>
            </Link>
            {program.learnMoreUrl && (
              <a
                href={program.learnMoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 transition-all duration-200 hover:border-brand-sky hover:text-brand-sky"
              >
                Learn More
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RoboticsPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessionsByProgram, setSessionsByProgram] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getPrograms({ activeOnly: true });
        const robotics = all.filter((p: Program) => p.category === ROBOTICS_CATEGORY);
        setPrograms(robotics);
        const map: Record<string, Session[]> = {};
        await Promise.all(
          robotics.map(async (p: Program) => {
            map[p.id] = await getActiveSessions(p.id);
          })
        );
        setSessionsByProgram(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-[24px] border border-slate-100 bg-slate-50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {licensedRoboticsPrograms.map((licensedProgram, i) => {
        const savedProgram = programs.find(
          (program) =>
            normalizeProgramName(program.id) === normalizeProgramName(licensedProgram.id) ||
            normalizeProgramName(program.title) === normalizeProgramName(licensedProgram.title)
        );
        const displayProgram: Program = savedProgram
          ? { ...withLicensedProgramAssets(savedProgram), title: licensedProgram.title }
          : { ...licensedProgram, category: ROBOTICS_CATEGORY };

        return (
          <ProgramCard
            key={licensedProgram.id}
            program={displayProgram}
            sessions={savedProgram ? sessionsByProgram[savedProgram.id] ?? [] : []}
            isPlaceholder={!savedProgram}
            image={displayProgram.image ?? placeholderImageForIndex(i)}
          />
        );
      })}
    </div>
  );
}

export function useRoboticsAvailability() {
  const [hasOpenRegistration, setHasOpenRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getPrograms({ activeOnly: true });
        const robotics = all.filter((p: Program) => p.category === ROBOTICS_CATEGORY);
        const sessionLists = await Promise.all(robotics.map((p: Program) => getActiveSessions(p.id)));
        const anyOpen = sessionLists.some((sessions) =>
          sessions.some(
            (s: Session) => s.status === SESSION_STATUS.ACTIVE || s.status === SESSION_STATUS.SOLD_OUT
          )
        );
        setHasOpenRegistration(anyOpen);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { hasOpenRegistration, loading };
}
