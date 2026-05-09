interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  background?: "white" | "slate-50" | "brand-sky";
  accent?: "blue-500" | "brand-sky" | "brand-rose" | "brand-teal";
}

const backgroundClassMap: Record<NonNullable<SectionHeaderProps["background"]>, string> = {
  white: "bg-white",
  "slate-50": "bg-slate-50",
  "brand-sky": "bg-brand-sky/5"
};

const accentClassMap: Record<NonNullable<SectionHeaderProps["accent"]>, string> = {
  "blue-500": "bg-blue-500",
  "brand-sky": "bg-brand-sky",
  "brand-rose": "bg-brand-rose",
  "brand-teal": "bg-brand-teal"
};

export function SectionHeader({
  title,
  subtitle,
  background = "white",
  accent = "brand-sky"
}: SectionHeaderProps) {
  const backgroundClass = backgroundClassMap[background] ?? "bg-white";
  const accentClass = accentClassMap[accent] ?? "bg-[#004aad]";

  return (
    <section className={`${backgroundClass} py-16`}>
      <div className="mx-auto max-w-5xl px-6 text-center">
        <div className={`mx-auto mb-5 h-1 w-20 rounded-full ${accentClass}`} />
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl md:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-4 text-base text-slate-600 sm:text-lg md:text-xl">{subtitle}</p> : null}
      </div>
    </section>
  );
}
