"use client";

import { useEffect, useRef, useState } from "react";
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Tutoring", href: "/tutoring" },
  { label: "Robotics & Coding", href: "/robotics" },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "Worksheets", href: "/worksheets" },
      { label: "Practice Tests", href: "/practice-tests" },
    ],
  },
  {
    label: "About",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Why Kriana", href: "/why-kriana" },
      { label: "Contact", href: "/contact#consultation-form" },
    ],
  },
];

const phoneHref = "tel:+16134006921";
const phoneLabel = "(613) 400-6921";
const phoneCompactLabel = "613-400-6921";

type NavLinkItem = {
  label: string;
  href: string;
};

type NavGroupItem = {
  label: string;
  children: NavLinkItem[];
};

function isNavGroupItem(item: NavLinkItem | NavGroupItem): item is NavGroupItem {
  return "children" in item;
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function NavigationBar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);
  const [desktopOpenGroup, setDesktopOpenGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setDesktopOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close desktop dropdown on route change
  useEffect(() => {
    setDesktopOpenGroup(null);
  }, [pathname]);

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
    setMobileOpenGroup(null);
  };

  const isNavItemActive = (item: NavLinkItem | NavGroupItem) =>
    isNavGroupItem(item)
      ? item.children.some((child) => isActivePath(pathname, child.href))
      : isActivePath(pathname, item.href);

  return (
    <header className="sticky top-0 z-40 transition-all duration-300">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-rose/0 via-brand-sky/50 to-brand-teal/0 transition-opacity duration-300 ${
          scrolled ? "opacity-0" : "opacity-100"
        }`}
      />
      <div className="mx-auto max-w-6xl px-6 pb-1 pt-1 sm:px-10">
        <div
          className={`relative rounded-[2rem] border px-4 py-1 ring-1 backdrop-blur-xl transition-all duration-300 sm:px-5 ${
            scrolled
              ? "border-[#5AC8FA]/50 bg-white/95 shadow-[0_8px_32px_rgba(6,11,26,0.12)] ring-[#5AC8FA]/20"
              : "border-[#5AC8FA]/40 bg-[#E8F9FF]/90 shadow-[0_18px_48px_rgba(6,11,26,0.08)] ring-[#5AC8FA]/30"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[2rem] bg-gradient-to-r from-transparent via-brand-sky/40 to-transparent" />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5">
            <Link href="/" className="flex min-w-0 items-center py-1.5 pr-2" aria-label="Kriana Tutoring home">
              <Image
                src="/images/kriana-tutoring-logo-horizontal-6.png"
                alt="Kriana Tutoring"
                width={1355}
                height={242}
                priority
                className="h-7 w-auto flex-shrink-0 object-contain sm:h-7"
              />
            </Link>

            <nav ref={navRef} className="hidden min-w-0 items-center justify-center gap-0.5 xl:flex xl:w-full xl:px-3">
              {navItems.map((item) => {
                const active = isNavItemActive(item);

                if (isNavGroupItem(item)) {
                  const isOpen = desktopOpenGroup === item.label;
                  return (
                    <div key={item.label} className="relative">
                      <button
                        type="button"
                        onClick={() => setDesktopOpenGroup(isOpen ? null : item.label)}
                        className={`relative inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.82rem] font-medium transition-all duration-200 2xl:px-3 2xl:text-[0.88rem] ${
                          active || isOpen
                            ? "text-[#0A2D5A]"
                            : "text-[#003B73] hover:bg-[#5AC8FA]/16 hover:text-[#0A2D5A]"
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        {active ? (
                          <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal" />
                        ) : null}
                      </button>

                      {isOpen ? (
                        <div className="absolute left-1/2 top-full z-30 mt-1 w-52 -translate-x-1/2 rounded-3xl border border-[#5AC8FA]/30 bg-white/95 p-3 shadow-[0_20px_50px_rgba(6,11,26,0.16)] ring-1 ring-[#5AC8FA]/10 backdrop-blur-xl">
                          <div className="space-y-1">
                            {item.children.map((child) => {
                              const childActive = isActivePath(pathname, child.href);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setDesktopOpenGroup(null)}
                                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                    childActive
                                      ? "bg-gradient-to-r from-brand-sky/18 to-brand-teal/10 text-[#0A2D5A]"
                                      : "text-[#003B73] hover:bg-[#E8F9FF] hover:text-[#0A2D5A]"
                                  }`}
                                >
                                  <span>{child.label}</span>
                                  {childActive ? <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal" /> : null}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.82rem] font-medium transition-all duration-200 2xl:px-3 2xl:text-[0.88rem] ${
                      active
                        ? "text-[#0A2D5A]"
                        : "text-[#003B73] hover:bg-[#5AC8FA]/16 hover:text-[#0A2D5A]"
                    }`}
                  >
                    {item.label}
                    {active ? (
                      <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 xl:flex xl:pl-3">
              <Link
                href={phoneHref}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#5AC8FA]/50 bg-white/90 px-3.5 py-1.5 text-[0.72rem] font-semibold text-[#0A2D5A] shadow-sm transition-all duration-200 hover:border-[#5AC8FA] hover:bg-white hover:shadow-[0_4px_16px_rgba(74,144,226,0.2)]"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-brand-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.05 2h3a2 2 0 0 1 2 1.72c.14 1.05.47 2.06.96 3 .31.63.1 1.38-.44 1.79l-1.27.95a2 2 0 0 0-.57 2.57 13 13 0 0 0 6.1 6.1 2 2 0 0 0 2.57-.57l.95-1.27c.41-.54 1.16-.75 1.79-.44a12.84 12.84 0 0 0 3 1c.96.24 1.64 1.1 1.64 2.09Z" />
                </svg>
                {phoneCompactLabel}
              </Link>
              <Link
                href="/booking"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0c6162] px-4 py-1.5 text-[0.72rem] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051] hover:shadow-[0_4px_16px_rgba(12,97,98,0.35)]"
              >
                View Programs
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="flex items-center justify-self-end gap-2 xl:hidden">
              <Link
                href={phoneHref}
                className="inline-flex h-14 flex-col items-center justify-center rounded-full border border-[#5AC8FA]/60 bg-white/85 px-3 text-[#003B73] transition-all duration-200 hover:border-[#5AC8FA] hover:bg-[#5AC8FA]/10 sm:px-4"
                aria-label={`Call ${phoneLabel}`}
              >
                <span className="text-[0.5rem] font-bold uppercase tracking-[0.14em] leading-none">Call or Text</span>
                <span className="mt-1 text-[0.64rem] font-bold tracking-[0.08em] leading-none sm:text-[0.68rem]">{phoneCompactLabel}</span>
              </Link>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#5AC8FA]/60 text-[#003B73] transition-all duration-200 hover:border-[#5AC8FA] hover:bg-[#5AC8FA]/10"
                aria-label="Toggle navigation menu"
                onClick={() => setIsMobileOpen((open) => !open)}
              >
                {isMobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileOpen ? (
        <div className="xl:hidden">
          <div className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm" onClick={closeMobileMenu} />
          <div className="absolute inset-x-4 top-full z-40 mt-4 rounded-3xl border border-[#5AC8FA]/40 bg-white/95 p-6 shadow-[0_24px_65px_rgba(6,11,26,0.15)] ring-1 ring-[#5AC8FA]/20 backdrop-blur-xl sm:inset-x-6">
            <div className="mb-4 rounded-2xl border border-[#5AC8FA]/25 bg-[#E8F9FF]/70 p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#1F5B99]">Call or Text</p>
              <Link
                href={phoneHref}
                className="mt-2 block text-lg font-bold text-[#0A2D5A]"
                onClick={closeMobileMenu}
              >
                {phoneLabel}
              </Link>
            </div>
            <nav className="flex flex-col gap-2 text-base font-semibold text-[#003B73]">
              {navItems.map((item) => {
                const active = isNavItemActive(item);

                if (isNavGroupItem(item)) {
                  const isGroupOpen = mobileOpenGroup === item.label;
                  return (
                    <div key={item.label} className="rounded-2xl bg-[#E8F9FF]">
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                          active ? "font-bold text-[#0A2D5A]" : "hover:bg-[#5AC8FA]/20"
                        }`}
                        onClick={() => setMobileOpenGroup(isGroupOpen ? null : item.label)}
                      >
                        <span>{item.label}</span>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isGroupOpen ? (
                        <div className="space-y-1 px-2 pb-2">
                          {item.children.map((child) => {
                            const childActive = isActivePath(pathname, child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${
                                  childActive
                                    ? "bg-white font-bold text-[#0A2D5A]"
                                    : "text-[#003B73] hover:bg-white/80"
                                }`}
                                onClick={closeMobileMenu}
                              >
                                <span>{child.label}</span>
                                {childActive ? <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal" /> : null}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-brand-sky/20 to-brand-teal/10 font-bold text-[#0A2D5A]"
                        : "bg-[#E8F9FF] hover:bg-[#5AC8FA]/20"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <span>{item.label}</span>
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal" /> : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/booking"
                onClick={closeMobileMenu}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0c6162] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(12,97,98,0.3)]"
              >
                View Programs
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href={phoneHref}
                onClick={closeMobileMenu}
                className="flex w-full items-center justify-center rounded-full border border-[#5AC8FA]/50 bg-white py-3 text-sm font-bold uppercase tracking-[0.22em] text-[#0A2D5A] shadow-[0_4px_20px_rgba(74,144,226,0.12)]"
              >
                Call or Text
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
