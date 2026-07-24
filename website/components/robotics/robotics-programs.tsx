"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveSessions, getPrograms, SESSION_STATUS, formatDate } from "../../lib/booking";
import { ROBOTICS_CATEGORY } from "../../lib/site-links";

type Program = Record<string, any>;
type Session = Record<string, any>;

function ProgramCard({ program, sessions }: { program: Program; sessions: Session[] }) {
  const activeSessions = sessions.filter(
    (s) => s.status !== SESSION_STATUS.DRAFT && s.status !== SESSION_STATUS.CANCELLED
  );
  const nextSession = activeSessions[0];
  const allSoldOut = activeSessions.length > 0 && activeSessions.every((s) => s.status === SESSION_STATUS.SOLD_OUT);
  const price = program.isDepositOnly ? program.depositAmount : program.price;

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
        {allSoldOut && (
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">Sold Out</span>
        )}
      </div>

      {program.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{program.description}</p>}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
        {program.ageRange && <span>Ages {program.ageRange}</span>}
        {program.gradeRange && <span>Grades {program.gradeRange}</span>}
        {nextSession?.location && <span>{nextSession.location}</span>}
        {nextSession?.startDateTime && <span>Next session: {formatDate(nextSession.startDateTime)}</span>}
        {activeSessions.length > 0 && (
          <span>
            {activeSessions.length} session{activeSessions.length !== 1 ? "s" : ""} available
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
        {typeof price === "number" ? (
          <span className="text-xl font-black text-slate-900">
            ${(price / 100).toFixed(0)}
            {program.isDepositOnly && <span className="ml-1 text-xs font-semibold text-slate-400">deposit</span>}
          </span>
        ) : (
          <span />
        )}
        <Link
          href={`/booking/${program.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0c6162] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
        >
          View &amp; Register
          <span aria-hidden="true">→</span>
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
          <div key={i} className="h-56 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-16 text-center">
        <p className="font-semibold text-slate-700">No robotics sessions are open for registration right now.</p>
        <p className="mt-1 text-sm text-slate-500">
          Check back soon, or{" "}
          <Link href="/contact#consultation-form" className="font-semibold text-[#0c6162] hover:underline">
            contact us
          </Link>{" "}
          to be notified when new sessions open.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} sessions={sessionsByProgram[program.id] ?? []} />
      ))}
    </div>
  );
}
