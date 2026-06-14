'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BookingLayoutProps {
  children: React.ReactNode
  backTo?: string
  backLabel?: string
  maxWidth?: string
}

export default function BookingLayout({
  children,
  backTo,
  backLabel,
  maxWidth = 'max-w-[1200px]',
}: BookingLayoutProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f3f6fb' }}>
      {backTo && (
        <div className={`${maxWidth} mx-auto w-full px-4 pt-4`}>
          <Link
            href={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c6162] hover:underline"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLabel ?? 'Back'}
          </Link>
        </div>
      )}

      <div className="flex-1">
        <div className={`${maxWidth} mx-auto px-4 py-6 sm:py-8`}>
          {children}
        </div>
      </div>

      <footer className="py-5 text-xs text-slate-400 border-t border-slate-100 bg-white mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-center">
          <span>© {new Date().getFullYear()} Kriana Tutoring</span>
          <a href="mailto:info@krianatutoring.com" className="hover:underline hover:text-[#0c6162] transition-colors">
            info@krianatutoring.com
          </a>
          <Link href="/my-bookings" className="hover:underline hover:text-[#0c6162] transition-colors font-semibold text-slate-500">
            My Bookings
          </Link>
        </div>
      </footer>
    </div>
  )
}
