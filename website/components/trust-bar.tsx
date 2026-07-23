import { GraduationCapIcon, HeartIcon, ShieldCheckIcon, UsersIcon } from "./icons";

const trustPoints = [
  {
    icon: UsersIcon,
    label: "Trusted by Parents in Kanata & Stittsville",
  },
  {
    icon: GraduationCapIcon,
    label: "Experienced & Caring Instructors",
  },
  {
    icon: HeartIcon,
    label: "Safe, Supportive & Engaging Environment",
  },
  {
    icon: ShieldCheckIcon,
    label: "Curriculum-Aligned & Results-Driven",
  },
];

export function TrustBar() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
              Authorized Partner of
            </span>
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-sky to-brand-teal text-[10px] font-black text-white">
                YE
              </span>
              <span className="text-sm font-bold uppercase tracking-[0.1em] text-slate-900">
                Young Engineers
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 lg:flex lg:flex-1 lg:justify-end lg:gap-10">
            {trustPoints.map((point) => (
              <div key={point.label} className="flex items-center gap-2.5">
                <point.icon className="h-5 w-5 shrink-0 text-brand-sky" />
                <p className="text-xs font-semibold leading-snug text-slate-700">{point.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
