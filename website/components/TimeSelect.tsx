'use client'

// Half-hour dropdown, 8:00 AM–8:30 PM — covers realistic birthday-party
// start times without forcing free-text time entry (inconsistent native
// <input type="time"> UX across browsers).
function buildTimeOptions() {
  const options: { value: string; label: string }[] = []
  for (let h = 8; h <= 20; h++) {
    for (const m of [0, 30]) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const period = h >= 12 ? 'PM' : 'AM'
      const hour12 = h % 12 || 12
      const label = `${hour12}:${String(m).padStart(2, '0')} ${period}`
      options.push({ value, label })
    }
  }
  return options
}

const TIME_OPTIONS = buildTimeOptions()

export function TimeSelect({
  id, value, onChange, required, className, placeholder = 'Select a time',
  'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}) {
  return (
    <select
      id={id}
      required={required}
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
    >
      <option value="">{placeholder}</option>
      {TIME_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
