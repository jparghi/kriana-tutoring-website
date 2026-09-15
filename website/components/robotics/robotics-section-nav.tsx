"use client";

import { useEffect, useState } from "react";

// The /robotics page is long, and a parent hunting for price shouldn't have
// to scroll past the whole curriculum to find it. This bar appears once the
// hero is out of the way and jumps straight to any section.
//
// Each href must match a section `id` on app/robotics/page.tsx; those
// sections carry `scroll-mt-*` so the sticky bar never covers their heading.
const SECTIONS = [
  { href: "#programs", label: "Programs" },
  { href: "#pricing", label: "Pricing" },
  { href: "#schedule", label: "Schedule" },
  { href: "#demo", label: "Demo" },
  { href: "#faq", label: "FAQ" },
];

export function RoboticsSectionNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only after the reader has left the hero, so it never competes
    // with the page's own headline on first paint.
    function onScroll() {
      setVisible(window.scrollY > 560);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Robotics page sections"
      className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 ${
        visible ? "opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-10">
        {SECTIONS.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-[#0083CB]/10 hover:text-[#0083CB]"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
