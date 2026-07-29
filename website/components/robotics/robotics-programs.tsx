"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getActiveSessions, getPrograms, SESSION_STATUS, formatDate } from "../../lib/booking";
import { ROBOTICS_BOOKING_URL, ROBOTICS_CATEGORY } from "../../lib/site-links";
import {
  imageForCategory,
  licensedRoboticsPrograms,
  placeholderImageForIndex,
  skillTagsForCategory,
  themeColorForCategory,
} from "../../lib/robotics-content";

type Program = Record<string, any>;
type Session = Record<string, any>;

function normalizeProgramName(value?: string) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function withLicensedProgramAssets(program: Program) {
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
  const skills = skillTagsForCategory(program.category);

  const availabilityLabel = allSoldOut ? "Sold Out" : isOpen ? "Registration Open" : "Coming Soon";
  const availabilityClasses = allSoldOut
    ? "bg-red-50 text-red-600"
    : isOpen
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  return (
    <div
      className="group grid overflow-hidden rounded-[24px] border border-slate-200 border-l-4 bg-white shadow-sm transition-all duration-300 hover:-translate-x-0.5 hover:shadow-[0_16px_44px_rgba(15,23,42,0.1)] lg:grid-cols-[18rem_minmax(0,1fr)_11rem]"
      style={{ borderLeftColor: accent }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 lg:aspect-auto lg:min-h-[18rem]">
        <Image
          src={cardImage}
          alt={`${program.title} — Young Engineers program at Kriana Tutoring`}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent sm:hidden" />
        <span
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          {program.category ?? "Robotics"}
        </span>
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
          <p className="text-sm leading-relaxed text-slate-600">{program.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {program.ageRange && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Ages {program.ageRange}
            </span>
          )}
          {program.gradeRange && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Grades {program.gradeRange}
            </span>
          )}
          {(nextSession?.durationMin ?? program.durationMin) && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {nextSession?.durationMin ?? program.durationMin} min
            </span>
          )}
          {nextSession?.location && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {nextSession.location}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill} className="text-xs font-semibold" style={{ color: accent }}>
              #{skill.replace(/\s+/g, "")}
            </span>
          ))}
        </div>

        {nextSession?.startDateTime && (
          <p className="text-xs font-semibold text-slate-400">Next session: {formatDate(nextSession.startDateTime)}</p>
        )}

        {isPlaceholder ? (
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            <Link
              href={ROBOTICS_BOOKING_URL}
              className="inline-flex items-center justify-center rounded-full bg-[#0c6162] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
            >
              Register for This Program
            </Link>
            {program.learnMoreUrl && (
              <a
                href={program.learnMoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 transition-all duration-200 hover:border-brand-sky hover:text-brand-sky"
              >
                Learn More
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        ) : (
          <Link
            href={`/booking/${program.id}`}
            className="group/cta mt-auto inline-flex w-fit items-center justify-center gap-1.5 rounded-full bg-[#0c6162] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
          >
            Register for This Program
            <span aria-hidden="true" className="transition-transform duration-200 group-hover/cta:translate-x-1">
              →
            </span>
          </Link>
        )}
      </div>

      {program.logo && (
        <div className="flex min-h-32 items-center justify-center border-t border-slate-100 bg-white px-8 py-6 lg:min-h-0 lg:border-l lg:border-t-0">
          <Image
            src={program.logo}
            alt={`${program.title} logo`}
            width={140}
            height={110}
            className="max-h-28 w-auto max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

function LaunchListPanel() {
  return (
    <div className="flex flex-col gap-5">
      {licensedRoboticsPrograms.map((program, i) => (
        <ProgramCard
          key={program.id}
          program={{ ...program, category: "Robotics" }}
          sessions={[]}
          isPlaceholder
          image={program.image ?? placeholderImageForIndex(i)}
        />
      ))}
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
      <div className="flex flex-col gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-[24px] border border-slate-100 bg-slate-50" />
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return <LaunchListPanel />;
  }

  return (
    <div className="flex flex-col gap-5">
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={withLicensedProgramAssets(program)}
          sessions={sessionsByProgram[program.id] ?? []}
        />
      ))}
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
