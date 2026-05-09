import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function CompassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 8 16 12 12 16 8 12" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="1 6 9 2 15 6 23 2 23 18 15 22 9 18 1 22 1 6" />
      <line x1="9" y1="2" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="22" />
    </svg>
  );
}

export function RocketIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 16c0-4 5-10 8-13 3 3 8 9 8 13a8 8 0 0 1-16 0Z" />
      <path d="M9 18a3 3 0 0 0 6 0" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M5.22 5.22l1.42 1.42" />
      <path d="M17.36 17.36l1.42 1.42" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.22 18.78l1.42-1.42" />
      <path d="M17.36 6.64l1.42-1.42" />
      <path d="M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z" />
    </svg>
  );
}

export function GraduationCapIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8 12 4l9 4-9 4-9-4Z" />
      <path d="M7 12v5c0 1.1 2.24 2 5 2s5-.9 5-2v-5" />
      <path d="M22 13v4" />
      <path d="M22 17v1" />
    </svg>
  );
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8.5 8.5Z" />
    </svg>
  );
}

export function BrainCircuitIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 2a4 4 0 0 1 4 4c0 .93-.32 1.78-.85 2.46a3.99 3.99 0 0 1 0 6.08A4 4 0 0 1 16 22h-2v-6h2" />
      <path d="M8 2a4 4 0 0 0-4 4c0 .93.32 1.78.85 2.46a3.99 3.99 0 0 0 0 6.08A4 4 0 0 0 8 22h2v-6H8" />
      <path d="M12 6v12" />
      <circle cx="10" cy="8" r="1" />
      <circle cx="14" cy="16" r="1" />
    </svg>
  );
}

export function CalendarStarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M12 13l1.45 2.9 3.2.47-2.32 2.26.55 3.19L12 20.6l-2.88 1.52.55-3.19-2.32-2.26 3.2-.47Z" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21c-4.5-4.5-6-7.5-6-9a6 6 0 1 1 12 0c0 1.5-1.5 4.5-6 9Z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function PhoneCallIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.05 2h3a2 2 0 0 1 2 1.72c.14 1.05.47 2.06.96 3 .31.63.1 1.38-.44 1.79l-1.27.95a2 2 0 0 0-.57 2.57 13 13 0 0 0 6.1 6.1 2 2 0 0 0 2.57-.57l.95-1.27c.41-.54 1.16-.75 1.79-.44a12.84 12.84 0 0 0 3 1c.96.24 1.64 1.1 1.64 2.09Z" />
    </svg>
  );
}

export function MessageSquareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 2 2.31 6.63L21 9.27l-4.5 4.38 1.06 6.35L12 17.77l-5.56 3.23L7.5 13.65 3 9.27l6.69-.64Z" />
    </svg>
  );
}
