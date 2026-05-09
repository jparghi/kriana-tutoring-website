"use client";

import { ReactNode, useId, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left text-lg font-semibold text-slate-800"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-brand-sky transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      <div
        id={contentId}
        className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden px-6 pb-6 text-slate-600">{children}</div>
      </div>
    </div>
  );
}
