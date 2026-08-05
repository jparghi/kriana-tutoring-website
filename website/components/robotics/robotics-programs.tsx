"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getProgramsWithOfferings,
  isOfferingRequestWindowOpen,
  isOfferingSoldOut,
} from "../../lib/booking";
import { ROBOTICS_CATEGORY } from "../../lib/site-links";
import {
  imageForCategory,
  licensedRoboticsPrograms,
  placeholderImageForIndex,
  themeColorForCategory,
} from "../../lib/robotics-content";

type Program = Record<string, any>;
type Offering = Record<string, any>;

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
  offerings,
  isPlaceholder = false,
  image,
}: {
  program: Program;
  offerings: Offering[];
  isPlaceholder?: boolean;
  image?: string;
}) {
  const nextOffering = offerings[0];
  const hasSchedule = offerings.length > 0;
  const allSoldOut = hasSchedule && offerings.every(isOfferingSoldOut);
  const isOpen = offerings.some(
    (offering) => isOfferingRequestWindowOpen(offering) && !isOfferingSoldOut(offering)
  );
  const hasWaitlist = offerings.some(
    (offering) => isOfferingRequestWindowOpen(offering) && isOfferingSoldOut(offering) && offering.waitlistEnabled
  );
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

  const availabilityLabel = isOpen
    ? "Requests Open"
    : hasWaitlist ? "Waitlist Open"
      : allSoldOut ? "Full"
        : hasSchedule ? "Schedule Published" : "Schedule Pending";
  const availabilityClasses = allSoldOut && !hasWaitlist
    ? "bg-red-50 text-red-600"
    : isOpen
      ? "bg-emerald-50 text-emerald-700"
      : hasWaitlist ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600";

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
          {(nextOffering?.durationMin ?? program.durationMin) && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              {nextOffering?.durationMin ?? program.durationMin} min
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${availabilityClasses}`}>
            {availabilityLabel}
          </span>
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
              href="/contact#consultation-form"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#0c6162] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
            >
              {isPlaceholder ? "Ask About Program" : "Ask About Schedule"}
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
              {isOpen ? "Request a Spot" : hasWaitlist ? "Join Waitlist" : "View Schedule"}
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
  const [offeringsByProgram, setOfferingsByProgram] = useState<Record<string, Offering[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { programs: robotics, offeringsByProgram: map } = await getProgramsWithOfferings({
          category: ROBOTICS_CATEGORY,
          activeOnly: true,
        });
        setPrograms(robotics);
        setOfferingsByProgram(map);
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
            offerings={savedProgram ? offeringsByProgram[savedProgram.id] ?? [] : []}
            isPlaceholder={!savedProgram}
            image={displayProgram.image ?? placeholderImageForIndex(i)}
          />
        );
      })}
    </div>
  );
}

export function useRoboticsAvailability() {
  const [hasPublishedSchedule, setHasPublishedSchedule] = useState(false);
  const [hasOpenRequests, setHasOpenRequests] = useState(false);
  const [hasOpenWaitlist, setHasOpenWaitlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { offeringsByProgram } = await getProgramsWithOfferings({
          category: ROBOTICS_CATEGORY,
          activeOnly: true,
        });
        const offeringLists = Object.values(offeringsByProgram);
        setHasPublishedSchedule(offeringLists.some((offerings) => offerings.length > 0));
        setHasOpenRequests(offeringLists.some((offerings) => offerings.some(
          (offering: any) => isOfferingRequestWindowOpen(offering) && !isOfferingSoldOut(offering)
        )));
        setHasOpenWaitlist(offeringLists.some((offerings) => offerings.some(
          (offering: any) => isOfferingRequestWindowOpen(offering)
            && isOfferingSoldOut(offering)
            && offering.waitlistEnabled
        )));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { hasPublishedSchedule, hasOpenRequests, hasOpenWaitlist, loading };
}
