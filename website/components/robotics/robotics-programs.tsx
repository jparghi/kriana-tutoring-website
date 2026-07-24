"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getActiveSessions, getPrograms, SESSION_STATUS, formatDate } from "../../lib/booking";
import { ROBOTICS_CATEGORY, SCHOOL_PROGRAM_BOOKING_URL } from "../../lib/site-links";
import {
  imageForCategory,
  licensedRoboticsPrograms,
  placeholderImageForIndex,
  skillTagsForCategory,
  themeColorForCategory,
} from "../../lib/robotics-content";

type Program = Record<string, any>;
type Session = Record<string, any>;

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
  const cardImage = image ?? imageForCategory(program.category);
  const skills = skillTagsForCategory(program.category);

  const availabilityLabel = isPlaceholder ? "Coming Soon" : allSoldOut ? "Sold Out" : isOpen ? "Registration Open" : "Coming Soon";
  const availabilityClasses = allSoldOut
    ? "bg-red-50 text-red-600"
    : isOpen
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-[24px] border border-slate-200 border-t-4 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
      style={{ borderTopColor: accent }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={cardImage}
          alt={`${program.title} — Young Engineers program at Kriana Tutoring`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
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
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${availabilityClasses}`}>
            {availabilityLabel}
          </span>
        </div>

        {program.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{program.description}</p>
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

        <Link
          href={isPlaceholder ? "/contact#consultation-form" : `/booking/${program.id}`}
          className="group/cta mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-bold text-[#0c6162]"
        >
          {isPlaceholder ? "Join the Launch List" : "View Program Details"}
          <span aria-hidden="true" className="transition-transform duration-200 group-hover/cta:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

function LaunchListPanel() {
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {licensedRoboticsPrograms.map((program, i) => (
          <ProgramCard
            key={program.id}
            program={{ ...program, category: "Robotics" }}
            sessions={[]}
            isPlaceholder
            image={placeholderImageForIndex(i)}
          />
        ))}
      </div>

      <div className="mt-10 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-brand-sky/5 to-brand-amber/5 px-8 py-12 text-center">
        <h3 className="text-xl font-bold text-[#0A2D5A] sm:text-2xl">
          Robotics Classes Are Coming to Kanata and Stittsville
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          Join the priority list to receive launch dates, registration announcements and details about introductory
          sessions.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/contact#consultation-form"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c6162] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.45)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051]"
          >
            Join the Robotics Launch List
          </Link>
        </div>
        <Link
          href={SCHOOL_PROGRAM_BOOKING_URL}
          className="mt-4 inline-block text-sm font-semibold text-slate-500 underline-offset-2 hover:text-[#0c6162] hover:underline"
        >
          Ask About School or Group Programs
        </Link>
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[26rem] animate-pulse rounded-[24px] border border-slate-100 bg-slate-50" />
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return <LaunchListPanel />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} sessions={sessionsByProgram[program.id] ?? []} />
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
