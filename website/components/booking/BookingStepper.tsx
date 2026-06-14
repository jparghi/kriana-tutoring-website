'use client'

function Step({ num, label, state }: { num: number; label: string; state: 'done' | 'active' | 'upcoming' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
        state === 'done'
          ? 'bg-[#0c6162] text-white'
          : state === 'active'
            ? 'bg-[#0c6162] text-white ring-4 ring-[#0c6162]/20'
            : 'bg-slate-200 text-slate-400'
      }`}>
        {state === 'done'
          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
          : num
        }
      </div>
      <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight max-w-[52px] ${
        state === 'active' ? 'text-slate-800' : state === 'done' ? 'text-[#0c6162]' : 'text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  )
}

function Connector({ done }: { done: boolean }) {
  return <div className={`w-6 sm:w-10 h-0.5 mx-1 mb-4 shrink-0 ${done ? 'bg-[#0c6162]' : 'bg-slate-200'}`} />
}

export function BookingStepper({ step }: { step: number }) {
  const s = (n: number): 'done' | 'active' | 'upcoming' => step > n ? 'done' : step === n ? 'active' : 'upcoming'
  return (
    <div className="flex items-start justify-center py-4 mb-6">
      <Step num={1} label="Choose Session" state={s(1)} />
      <Connector done={step > 1} />
      <Step num={2} label="Your Info" state={s(2)} />
      <Connector done={step > 2} />
      <Step num={3} label="Payment" state={s(3)} />
      <Connector done={step > 3} />
      <Step num={4} label="Confirmed" state={s(4)} />
    </div>
  )
}
