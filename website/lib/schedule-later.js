// Client-safe — imported by the booking pages and submit-enrollment-request.js.
//
// Robotics programs listed here take registrations without the family
// picking a class day/time: they choose a learning path (Builder/Engineer),
// submit, and staff confirm the schedule and payment details afterwards.
// Every other weekly program still shows "Contact us to schedule" (see
// PUBLIC_SCHEDULE_REQUESTS_ENABLED in app/booking/[programId]/register).
// Keyed by the real Firestore `programs/{id}` document ID; the program must
// also be isActive in Firestore, which the server checks on every request.
export const SCHEDULE_LATER_PROGRAM_IDS = Object.freeze([
  'lqA6LK62gr7AphDOpesA', // Bricks Challenge
])

export function isScheduleLaterProgramId(id) {
  return SCHEDULE_LATER_PROGRAM_IDS.includes(id)
}

// Stored as the registration's scheduleSnapshot title and shown in emails and
// the staff portal until staff place the child in a real batch.
export const SCHEDULE_LATER_TITLE = 'Schedule to be confirmed'
