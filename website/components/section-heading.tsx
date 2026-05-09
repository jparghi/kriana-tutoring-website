import { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  gradient?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  gradient = false,
}: SectionHeadingProps) {
  const isLight = tone === "light";
  const eyebrowClasses = isLight
    ? "bg-brand-rose/10 text-brand-rose border border-brand-rose/20 shadow-none"
    : "border border-white/20 bg-white/10 text-white/90 shadow-none backdrop-blur";
  const descriptionClasses = isLight ? "text-slate-600" : "text-white/70";

  return (
    <div className={`space-y-5 ${align === "center" ? "text-center" : "text-left"}`}>
      {eyebrow ? (
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] ${eyebrowClasses}`}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2 className={`text-3xl font-bold sm:text-4xl md:text-5xl ${gradient ? "gradient-text" : isLight ? "text-slate-900" : "text-white"}`}>
        {title}
      </h2>
      {description ? (
        <div className={`mx-auto max-w-2xl text-base leading-relaxed md:text-lg ${descriptionClasses}`}>
          {description}
        </div>
      ) : null}
    </div>
  );
}
