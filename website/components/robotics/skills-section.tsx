import { skillsBuilt } from "../../lib/robotics-content";

export function SkillsSection() {
  return (
    <section className="bg-[#0A2D5A] px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Skills Built Through Every Challenge</h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {skillsBuilt.map((skill) => (
            <div key={skill.title} className="flex items-start gap-4">
              <skill.icon className="h-6 w-6 shrink-0 text-[#5AC8FA]" />
              <div>
                <h3 className="text-base font-bold text-white">{skill.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{skill.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
