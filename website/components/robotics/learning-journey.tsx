import { learningJourney } from "../../lib/robotics-content";

export function LearningJourney() {
  return (
    <div className="mt-10">
      {/* Desktop: connected path */}
      <div className="relative hidden lg:grid lg:grid-cols-5 lg:gap-6">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"
        />
        {learningJourney.map((item) => (
          <div key={item.step} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0083CB] shadow-sm">
              <item.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900">{item.step}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Mobile / tablet: horizontally scrollable, accessible (not the only way to browse) */}
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {learningJourney.map((item, i) => (
          <div
            key={item.step}
            className="flex w-[220px] shrink-0 snap-start flex-col rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0083CB]/10 text-[#0083CB]">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">{item.step}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
