'use client'

import { useState } from 'react'
import { DemoRegisterCta } from './DemoRegisterCta'

// Session picker + register button. Each session is its own offering (its own
// registrations in the portal), so the chosen session simply decides which
// offeringId the register page is opened with — the register page and its
// endpoint still make every real decision (open / paused / waitlist).
//
// Never shows counts or seats left: capacity is managed manually by staff. A
// session staff have paused reads as "Full" and offers the waitlist instead.
export interface PickerSession {
  label: string
  offeringId: string
  state: 'open' | 'full' | 'closed' | 'unavailable'
  waitlistOpen: boolean
}

export function SessionReserve({
  sessions, programId, priceDisplay, attributionQuery, name, content,
}: {
  sessions: PickerSession[]
  programId: string
  priceDisplay: string
  attributionQuery: string // already URL-encoded, allowlisted params only
  name: string // radio group name, unique per instance on the page
  content: string
}) {
  const selectable = (s: PickerSession) => s.state === 'open' || (s.state === 'full' && s.waitlistOpen)
  const firstOpen = sessions.find(s => s.state === 'open') ?? sessions.find(selectable)
  const [selectedId, setSelectedId] = useState(firstOpen?.offeringId ?? '')
  const selected = sessions.find(s => s.offeringId === selectedId)

  const isWaitlist = selected?.state === 'full'
  const params = selected ? new URLSearchParams({ offeringId: selected.offeringId, registrationType: 'demo' }) : null
  const href = selected && params ? `/booking/${programId}/register?${params.toString()}${attributionQuery ? `&${attributionQuery}` : ''}` : ''

  return (
    <div>
      <fieldset>
        <legend className="mb-2 text-sm font-black text-slate-700">Choose a session</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {sessions.map(session => {
            const enabled = selectable(session)
            const checked = session.offeringId === selectedId
            return (
              <label
                key={session.offeringId}
                className={`flex min-h-[56px] items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  !enabled ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                    : checked ? 'cursor-pointer border-[#F2A100] bg-[#FFF7E8]' : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={session.offeringId}
                  checked={checked}
                  disabled={!enabled}
                  onChange={() => setSelectedId(session.offeringId)}
                  className="h-5 w-5 shrink-0 accent-[#F2A100]"
                />
                <span>
                  <span className="block text-[15px] font-black text-[#0A2D5A]">{session.label}</span>
                  {session.state === 'full' && <span className="block text-xs font-bold text-[#ED174B]">{session.waitlistOpen ? 'Full — join the waitlist' : 'Full'}</span>}
                  {(session.state === 'closed' || session.state === 'unavailable') && <span className="block text-xs font-semibold text-slate-500">Registration closed</span>}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {selected && (
        <DemoRegisterCta
          href={href}
          offeringId={selected.offeringId}
          label={isWaitlist ? 'Join the Waitlist for This Session' : `Reserve My Child’s Spot — ${priceDisplay}`}
          eventName={isWaitlist ? 'demo_waitlist_click' : 'demo_registration_click'}
          content={content}
          className="mt-4 inline-block w-full rounded-xl bg-[#F2A100] px-6 py-4 text-center text-base font-black text-white shadow-sm transition-transform active:scale-[0.98] sm:w-auto sm:px-10"
        />
      )}
    </div>
  )
}
