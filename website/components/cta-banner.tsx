import Link from "next/link";
import { CalendarStarIcon } from "./icons";

export function CtaBanner() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-[#0A2D5A] px-8 py-10 sm:px-12">
          {/* Decorative sparkles */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-sky/20 blur-3xl" />
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-brand-teal/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="flex items-center gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white sm:flex">
                <CalendarStarIcon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-white sm:text-2xl">Spots fill up fast!</h3>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-white/75">
                  Book your free assessment today and find the perfect learning plan for your child.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Link
                href="/booking/VQNj7NfFGCI5oun5PXQE"
                className="inline-flex items-center justify-center rounded-full bg-[#0c6162] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(12,97,98,0.4)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051] hover:shadow-[0_12px_40px_rgba(12,97,98,0.6)]"
              >
                Book Free Assessment
              </Link>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                No Obligation. No Pressure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
