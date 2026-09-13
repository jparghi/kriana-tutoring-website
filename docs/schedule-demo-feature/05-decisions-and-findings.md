# Decisions and Findings

Last updated: 2026-09-11

## Production state found on 2026-09-11 (read-only check)

Offering `young-engineers-demo-kanata-sep-2026-offering`:

| Field | Value |
|---|---|
| status / isPublished | `Open` / `true` |
| capacity | 20 |
| confirmedCount | 13 |
| heldCount | 1 |
| Publicly shown seats left | 6 |
| demoRegistrations | 13, all `registered / paid / confirmedSeatActive` |
| enrollmentCloseAt | 2026-09-12 10:30 America/Toronto (event start) |
| waitlistEnabled | not set |
| waitlist entries | 0 |

Findings:

- The demo was **not full** in the system. It was still publicly bookable,
  contrary to the initial assumption that it had reached capacity.
- **Seat-count drift:** `heldCount` is 1 but no registration holds a seat
  (left over from the retired checkout flow). Real occupancy is 13.
  `reconcile-demo-offering-capacity.mjs` fixes it; not applied.
- A `FullyBookedState` draft mentioned in the original brief did **not**
  exist (clean working tree, no stash); it was built from scratch.

## Owner decisions

| Decision | Detail |
|---|---|
| Keep capacity at 20 internally | Do not shrink capacity to close the demo. |
| Stop public booking from `/demo` | Implemented as `publicRegistrationPaused`, enforced server-side. |
| No over-capacity admin add | Any squeeze-in is handled manually outside the system. The earlier "manual add beyond capacity" plan was dropped. |
| Waitlist instead of booking when full | Same register link, "Join the Waitlist" form, no seat/payment/credit. Staff don't "confirm" waitlist entries. |
| Waitlist on/off switch | Per offering (`waitlistEnabled`); on for September 12. |
| Reusable for future demos | Page details read from the offering, and the capacity-driven waitlist is automatic. |
| Manage demos from portal | Wanted; planned in [04-portal-demo-campaigns-plan.md](./04-portal-demo-campaigns-plan.md). |

Alternatives considered and rejected:

- **Reuse the booking flow for waitlist ("book but don't confirm").**
  Rejected because every booking holds a seat, sends e-transfer instructions,
  creates a $10 credit, locks the child's one-time eligibility, and uses a
  DEMO number. Each would need special-casing, with risk of a waitlisted
  family ending up with a seat or payment request.
- **Set status to "Full" instead of a pause flag.** Rejected because the
  lifecycle recomputes status from counts on attendance/cancel and would
  flip it back to Open.
- **Edit the demo offering in the portal's Offerings form.** Not possible:
  its required weekly-class fields don't apply to demos, and the security
  rules reject the demo event fields.

## Copy approved for the fully booked page

- Heading: **"Our {Month Day} demo is fully booked!"**
- Message: **"Thank you for your interest. We've reached capacity, and
  registration for this demo is closed."**
- **"Already registered? Please refer to your registration email for your
  booking and payment details."**
- Waitlist incentive: **"Families on the waitlist will be the first to hear
  about our next demo."** No promised date or guaranteed spot.
- Buttons: **Join the Waitlist** (if enabled), **Explore Regular Programs**
  → `/robotics#programs`, **Call 613-400-6921** (`tel:`), **Text
  613-400-6921** (`sms:`).

## Bugs fixed along the way

- **Missing event date on the demo register form and e-transfer page.** The
  public catalog didn't expose `eventTitle` / `eventStartAt` / `eventEndAt`,
  so the form showed "Our team will follow up to confirm your child's demo
  class details." Fixed by adding the fields to the catalog allowlist.
- **Duplicated brand in the `/demo` page title** ("… | Kriana Tutoring ·
  Kriana Tutoring") because of the root layout's title template. Fixed with
  an absolute title.
- **Regular enrollment endpoint accepted demo offerings.** It now rejects
  `offeringType: 'demo'` for both enrollment and waitlist requests.

## Verification performed (2026-09-11)

- Website: 198/198 tests (22 new), TypeScript and ESLint clean.
- Platform: 145/145 unit tests (1 new); Vite build succeeds. The integration
  test needs the emulator and was not run.
- Local emulator end-to-end:
  - Booking while paused → 409, nothing written.
  - Waitlist join → 201 `WL-…`, one `waitlist` doc, seat counts unchanged,
    zero registrations/credits/locks/DEMO counters.
  - Repeated submit → same reference.
- Visual check at 390px and 1280px: fully booked (waitlist on and off), the
  waitlist form, and the open state (unchanged).
- Portal: local admin can read the demo waitlist entry under real security
  rules.
- Not run locally: `next build`, because a separate dev server was using the
  same `.next` folder. The first full build is Netlify's (Node 18.20.3).

## Go-live timeline (2026-09-11)

1. Owner committed website `98a6455` and platform `4d063e7`.
2. Both deployed. Platform Netlify production deploy of `4d063e7` was
   `ready`; the live `/demo` served the new code (single-brand title, new
   description).
3. `/demo` still showed "Reserve" because the offering switches weren't set
   yet. Diagnosed with a read-only check (`publicRegistrationPaused` and
   `waitlistEnabled` unset, 14/20 occupied → correctly open).
4. Owner ran `set-demo-offering-public-booking.mjs … --public-booking paused
   --waitlist on --apply`.
5. Verified: dry run shows `true -> true` for both fields; live `/demo` shows
   the fully booked page with Join the Waitlist and no "Reserve"; public
   catalog returns both switches `true`; seat counts unchanged.
