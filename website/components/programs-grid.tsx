import Image from "next/image";
import Link from "next/link";
import { BookOpenIcon, BuildingIcon, CalendarStarIcon, RocketIcon, SparkleIcon } from "./icons";
import { SectionHeading } from "./section-heading";
import { ROBOTICS_PATH } from "../lib/site-links";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const programs: {
  icon: IconComponent;
  image: string;
  title: string;
  description: string;
  href: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    icon: BookOpenIcon,
    image: "/images/math-magicians.jpg",
    title: "Academic Tutoring",
    description: "JK to Grade 8 Math, English, Reading & Writing.",
    href: "/services",
    iconBg: "bg-brand-teal/15",
    iconColor: "text-brand-teal",
  },
  {
    icon: RocketIcon,
    image: "/images/young-engineers/robotics-and-coding.png",
    title: "Robotics & Coding",
    description: "STEM programs that build creativity, logic & future-ready skills.",
    href: ROBOTICS_PATH,
    iconBg: "bg-brand-sky/15",
    iconColor: "text-brand-sky",
  },
  {
    icon: SparkleIcon,
    image: "/images/young-engineers/summer-camps.png",
    title: "Summer Camps",
    description: "Fun and educational camps filled with STEM, games & creativity.",
    href: "/booking",
    iconBg: "bg-brand-amber/20",
    iconColor: "text-amber-600",
  },
  {
    icon: CalendarStarIcon,
    image: "/images/young-engineers/birthday-party.png",
    title: "Birthday Parties",
    description: "Make birthdays unforgettable with LEGO robotics & STEM fun!",
    href: "/booking",
    iconBg: "bg-brand-rose/15",
    iconColor: "text-brand-rose",
  },
  {
    icon: BuildingIcon,
    image: "/images/young-engineers/school-programs.png",
    title: "School Programs",
    description: "After-school programs, workshops & PA day activities.",
    href: "/booking",
    iconBg: "bg-slate-200",
    iconColor: "text-slate-600",
  },
];

export function ProgramsGrid() {
  return (
    <section className="bg-white pb-10 pt-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading eyebrow="What we offer" title="Our Programs" align="center" />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {programs.map((program) => (
            <article
              key={program.title}
              className="group flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(15,23,42,0.1)]"
            >
              <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  className={`absolute -bottom-5 left-5 flex h-11 w-11 items-center justify-center rounded-full ${program.iconBg} shadow-md`}
                >
                  <program.icon className={`h-5 w-5 ${program.iconColor}`} />
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 px-5 pb-6 pt-8">
                <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-slate-600">{program.description}</p>
                <Link
                  href={program.href}
                  className={`mt-2 inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 ${program.iconColor} hover:opacity-70`}
                >
                  Learn more
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
