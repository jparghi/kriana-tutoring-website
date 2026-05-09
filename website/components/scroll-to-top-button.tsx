"use client";

import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 280);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll back to the top"
        className={`group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-emerald-400 text-white shadow-lg shadow-sky-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
          isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <span
          className="absolute inset-[-30%] -z-10 animate-pulse bg-gradient-to-br from-sky-300 via-blue-300 to-emerald-300 opacity-50 blur-lg"
          aria-hidden="true"
        />
        <ArrowUpIcon className="h-5 w-5 drop-shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
