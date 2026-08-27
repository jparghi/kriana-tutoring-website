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
                src="/images/kriana-tutoring-logo-horizontal-5.png"
                alt="Kriana Tutoring"
                width={1266}
                height={294}
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
              <div className="flex items-center gap-1.5 pr-1">
                <a
                  href="https://www.instagram.com/krianatutoring.youngengineers"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Kriana Tutoring on Instagram"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-200 hover:border-brand-rose/60 hover:text-brand-rose"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61559123522942"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Kriana Tutoring on Facebook"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-200 hover:border-brand-sky/60 hover:text-brand-sky"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/16134006921"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp Kriana Tutoring"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-200 hover:border-brand-teal/60 hover:text-brand-teal"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
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
