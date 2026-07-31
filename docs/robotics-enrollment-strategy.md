# Robotics Enrollment and Deferred-Payment Strategy

- **Status:** Proposed for implementation
- **Decision date:** 2026-07-31
- **Scope:** Kriana Tutoring public website and Kriana tutoring platform
- **Payment posture:** Registration request only; online payment disabled

## Executive decision

Robotics programs should use a **cohort-based registration-request flow**.

A parent registers their child once for a fixed weekly program offering, such as:

> Bricks Challenge — Mondays, 5:00–6:15 PM — Fall/Winter — 24 classes

The parent does not register separately for every weekly class and does not pay during the initial request. Staff reviews the request, confirms suitability and availability, and then sends payment instructions separately. Enrollment is confirmed only after staff approval and the applicable payment is received.

The parent journey should be:

```text
Choose program
  -> Choose a weekly cohort
  -> Request a spot
  -> Request received (no payment due today)
  -> Staff review
       -> Seat offered -> Payment requested -> Payment received -> Enrolled
       -> Waitlisted
       -> More information requested
       -> Declined
```

Automated Stripe Checkout and static Stripe Payment Links must remain unavailable during this phase. Existing Stripe code should be preserved as dormant reference code, clearly documented as not production-ready, and protected by server-side feature gates.

## Working assumptions

This plan currently assumes:

1. “Five sessions” means approximately five weekly cohorts in total, likely one program on each weekday, rather than five separate cohorts every evening.
2. A family enrolls once in a fixed program series rather than purchasing individual weekly classes.
3. The program duration and billing cadence are separate decisions. A six- or eight-month enrollment can be billed termly without requiring the parent to register again.
4. Form submission does not reserve a seat. A seat hold begins only when staff offers the seat.
5. No payment is collected during the initial registration request.

These assumptions must be confirmed before final schedules and policies are published.

## Product rationale

Robotics is a structured group program, not an appointment marketplace. The sellable unit is the cohort or term, while each weekly class is an occurrence used for calendars and attendance.

The City of Ottawa similarly describes registered programs as structured activities that run weekly or seasonally and require advance enrollment. Young Engineers describes the licensed programs as multi-lesson curricula; many of the current programs contain 36 lessons.

Personalized tutoring can continue to use an assessment or consultation-first intake. Robotics needs a fixed-schedule cohort flow with a light staff-review step. The two services should not be forced into the same registration model.

## Recommended program structure

### Program

The reusable curriculum or product definition:

- Smartivo
- Bricks Challenge
- Galileo Technic
- Algo Play
- Robo Toys

Program data includes the public description, licensed age range, default duration, images, logo and curriculum information. It should not own a particular term's schedule, capacity or price.

### Program offering or cohort

The actual bookable series:

- Program reference
- Term name
- Location and timezone
- First and last class dates
- Weekday
- Start and end time
- Authoritative class dates
- Number of classes
- Holiday exclusions and make-up dates
- Registration opening and closing dates
- Capacity
- Cohort-specific tuition and deposit rules
- Enrollment status

Example:

```text
Program: Bricks Challenge
Offering: 2026-27 Fall/Winter
Schedule: Mondays, 5:00-6:15 PM
Dates: [to be confirmed]
Number of classes: [to be confirmed]
Location: Kriana Learning Centre, Ottawa
Capacity: 12
```

### Class meeting

An individual class date belonging to an offering. Meeting records support:

- Attendance
- Cancellations
- Holiday exclusions
- Make-up classes
- Instructor assignment
- Calendar exports

Parents do not purchase or register for meetings individually.

### Enrollment

One child's request and eventual place in one offering. It should snapshot the schedule, tuition and policy accepted by the parent so that later offering edits do not rewrite historical enrollment terms.

### Payment

Payments must be independent records rather than fields that define enrollment state. This supports deposits, installments, partial payments, refunds and future provider integrations without confusing payment status with roster status.

### Waitlist entry

A queue entry for one specific offering. An interest list for an unpublished schedule is a separate concept and must not be treated as a capacity waitlist.

## Schedule and duration guidance

The current licensed duration data is:

| Program | Age | Lesson duration |
|---|---:|---:|
| Smartivo | 4–6 | 45 minutes |
| Bricks Challenge | 6–10 | 75 minutes |
| Galileo Technic | 7–10 | 75 minutes |
| Algo Play | 6–10 | 75 minutes |
| Robo Toys | 9–12 | 75 minutes |

The scheduling model must preserve these program-specific durations instead of forcing every program into a 90-minute block. A 5:00–6:30 operating window may contain a 45- or 75-minute class plus arrival, pickup and room-reset time.

The system must support a full six- or eight-month series. Billing can still happen in two or three term installments. Program length, enrollment commitment and billing cadence must remain separate fields.

## Parent-facing experience

### Offering available

The program card and detail page should display:

- Program name and image
- Age range
- Weekly day and time
- First and last class dates
- Number of classes
- Location
- Tuition summary or “Payment arranged after approval”
- Availability state
- **Request a Spot** call to action

### Schedule not finalized

Use **Join the Interest List**. Do not display “Register,” “Book,” available seat counts or a payment option when there is no real offering.

### Offering full

Use **Join the Waitlist**. The waitlist must be tied to the offering and managed transactionally.

### Request form

The form may collect:

- Parent or guardian contact information
- Child's name, age and grade
- Program-specific experience questions if needed
- Emergency contact
- Allergies or medical notes, with stricter access controls
- Required waiver and policy consent
- Optional photo consent

It must not show a payment-method selector in `request_only` mode.

### Confirmation language

Recommended message:

> We received your request. No payment is due today. Our team will review program fit and availability and contact you within one business day with next steps.

The UI and email must not say that a seat is reserved or enrollment is confirmed at this point.

## Staff workflow

The management portal must provide an operational queue:

1. View new requests.
2. Review child age, program fit, schedule and capacity.
3. Request missing information if necessary.
4. Offer a seat, waitlist the request or decline it.
5. When offering a seat, create an expiring hold; 72 hours is the recommended starting policy.
6. Send approved payment instructions.
7. Record the payment.
8. Confirm enrollment and add the child to the roster atomically.
9. Release expired or declined holds and offer the next waitlisted family a place.

No request should become `Enrolled` solely because a public form was submitted.

## Status model

Enrollment status and payment status must remain independent.

### Enrollment

```text
Submitted
  -> Under Review
  -> Offered
  -> Awaiting Payment
  -> Enrolled
```

Alternative terminal or branch states:

```text
Waitlisted
Declined
Offer Expired
Cancelled
Withdrawn
Completed
```

### Payment

```text
Not Requested
  -> Pending
  -> Partially Paid
  -> Paid
```

Additional states:

```text
Failed
Partially Refunded
Refunded
Waived
```

Capacity rules must define whether `Offered` and `Awaiting Payment` consume held capacity. `Submitted` and `Under Review` should not consume capacity.

## Recommended Firestore model

Introduce new collections rather than expanding the overloaded `sessions` collection:

```text
programs/{programId}
programOfferings/{offeringId}
programOfferings/{offeringId}/meetings/{meetingId}
enrollments/{enrollmentId}
payments/{paymentId}
waitlistEntries/{waitlistEntryId}
interestEntries/{interestEntryId}
```

The existing `sessions` collection is used in the management platform for both tutoring lessons and program-booking records. Reusing it for recurring cohorts would deepen an existing naming and schema collision.

### Migration compatibility

- Do not destructively rewrite current sessions or registrations.
- Keep legacy registrations readable through their existing `sessionId`.
- New enrollment records use `offeringId`.
- Add a compatibility adapter for old records during the transition.
- Migrate only after current Started, Pending Payment and Confirmed records have been reconciled.
- Snapshot public schedule, tuition, currency and accepted policy version in every new enrollment.

## Current implementation findings

### Event-shaped sessions

`website/lib/booking.ts` and `website/app/booking/[programId]/page.tsx` model one start timestamp, one end timestamp, duration, capacity and confirmed count. This works for an event but cannot accurately represent a recurring six- or eight-month series.

### Pricing is attached to the wrong level

Price and deposit fields live on the program. Different terms, locations, class counts or promotional rates therefore cannot have independent tuition.

The current robotics seed data stores `$30/class`, while the public registration flow treats that value as the entire amount due. This is ambiguous and can result in a parent paying for one class while believing they registered for the series.

### Capacity is not safely reserved

Availability is calculated as `capacity - confirmedCount`. A pending e-transfer is described as a 24-hour hold but does not consume held capacity. The public request and count update are not one atomic server transaction.

### Multiple unrelated registration systems exist

The website currently contains:

1. Firestore program booking under `/booking`.
2. General tutoring intake under `/register`, using a separate API and schema.
3. Legacy `/admin/registrations` pages that administer the general tutoring schema rather than program enrollments.

The tutoring form's request-first wording can be reused as a UX reference, but robotics enrollment should not be stored in the unrelated tutoring-registration schema.

### Code is split across two repositories

- `kriana-tutoring-website` owns the public parent journey.
- `kriana-tutoring-platform` owns staff administration and the deployed Firestore rules.
- Both repositories contain copies of some booking and Netlify function code.

Changes must be coordinated so status names, schema fields and operational behavior cannot drift.

## Payment strategy

### Current mode

The authoritative mode must be:

```text
BOOKING_FLOW_MODE=request_only
ENABLE_AUTOMATED_STRIPE_PAYMENTS=false
```

If the mode is absent or invalid, the system must fail closed to `request_only`.

The browser may receive derived capabilities for presentation, but a public environment variable or hidden button must never be the only control. Server endpoints must enforce the mode independently.

Recommended future modes:

```text
request_only
manual_payment
stripe_invoice
stripe_checkout
```

Program-level Stripe fields are subordinate to the global mode and must not activate a payment path on their own.

### Existing Stripe implementations

There are two distinct implementations:

1. **Automated Checkout and webhook:** already guarded by `ENABLE_AUTOMATED_STRIPE_PAYMENTS`, but not safe to re-enable unchanged.
2. **Static Payment Links:** still exposed whenever a program document contains an enabled Stripe link. This path is manual and does not reliably associate payment with enrollment.

Disabling automated Checkout does not disable static Payment Links.

### Safe cutover

1. Reconcile existing Stripe, Started and Pending Payment registrations.
2. Disable every program's `stripePaymentLinkEnabled` field.
3. Deactivate existing Payment Links in the Stripe Dashboard after reconciliation; hiding links on the website does not invalidate a previously shared URL.
4. Ensure automated Stripe remains disabled in both Netlify sites.
5. Deploy the server-authoritative `request_only` mode.
6. Guard `/booking/pay`, `/booking/success`, `/booking/cancel` and `/booking/etransfer` against direct visits.
7. Stop creating new e-transfer holds.
8. Keep the e-transfer expiry job temporarily only for legacy pending records, then disable it.

### How to preserve Stripe for later

Do not leave large commented blocks inside UI components. Keep payment integration behind a provider or adapter boundary and rely on version control for history.

Suggested responsibilities:

```text
PaymentProvider
  DisabledPaymentProvider
  ManualPaymentProvider
  StripeInvoiceProvider       # future
  StripeCheckoutProvider      # later, if instant self-service is required
```

For the staff-approved flow, the preferred future first step is a unique Stripe Hosted Invoice created after staff offers the seat. This provides a customer-specific payment URL and clearer reconciliation than a generic program Payment Link.

### Conditions before Stripe can be re-enabled

Stripe must remain disabled until all of the following are true:

- Server loads authoritative enrollment and offering prices.
- Browser-supplied amounts and titles are ignored.
- Currency, tuition, discounts, deposits and installment schedule are snapshotted.
- Program/offering relationship and registration window are validated.
- Capacity reservation and confirmation are atomic.
- Webhook processing is idempotent and records processed Stripe event IDs.
- Payment-to-enrollment association is automatic.
- Refunds and cancellations update payment and capacity consistently.
- Direct payment routes verify the authenticated or signed enrollment context.
- Success pages verify actual payment state.
- Parent lookup requires verified email or a signed magic link.
- End-to-end tests cover success, failure, retry, duplicate webhook, expiry, full capacity, refund and rollback.
- Monitoring and an operational rollback procedure exist.

The current `docs/stripe-integration.md` must not be treated as a one-flag activation guide. It describes an older automated path and does not reflect the active Payment Link behavior or known safety gaps.

## Security requirements

This work has a higher-priority privacy dependency.

The management platform's current Firestore rules permit unauthenticated listing of registrations and waitlist records and public reading of every document in the shared `sessions` collection. These records may expose child, medical, emergency-contact or tutoring-schedule information. The current “My Bookings” endpoint also returns registration records using an email address without proving ownership.

Before launching the revised flow:

- Move public enrollment creation behind a validated server endpoint.
- Use Firebase Admin credentials or another authenticated service identity for trusted writes.
- Deny public reads, lists and updates on enrollment, payment, waitlist and medical data.
- Validate allowed fields, lengths, program/offering relationship, age and status server-side.
- Add rate limiting and abuse protection to public submission endpoints.
- Disable My Bookings until email verification, OTP or a signed magic-link flow exists.
- Return only the minimum required fields from parent-facing endpoints.
- Keep medical information out of ordinary confirmation emails.
- Document retention and deletion rules for child and medical data.
- Rotate credentials found in local documentation or previous Git history and keep secrets only in managed secret storage.

## Repository responsibilities and required changes

### Public website: `kriana-tutoring-website`

This repository requires changes to:

- Introduce booking-flow configuration and fail-closed route guards.
- Replace session selection with program-offering selection.
- Change “Book,” “Register” and payment-oriented copy to request-oriented copy.
- Add request, interest-list and waitlist confirmation experiences.
- Submit enrollment requests to a trusted server endpoint rather than writing sensitive records directly from the browser.
- Update robotics availability logic and placeholder CTAs.
- Update confirmation emails.
- Disable or redirect dormant payment routes.
- Replace stale Stripe documentation.
- Add domain types and tests.

Primary affected areas include:

```text
website/lib/booking.ts
website/lib/site-links.ts
website/components/robotics/robotics-programs.tsx
website/components/robotics/robotics-cta-buttons.tsx
website/app/booking/**
website/app/my-bookings/**
website/netlify/functions/**
docs/stripe-integration.md
```

### Management platform: `kriana-tutoring-platform`

Yes, this separate project also requires changes. The public website cannot complete this strategy alone because the platform owns staff operations and Firestore rules.

Required platform work includes:

- Add program-offering administration with recurring schedules, class dates, capacity and offering-level tuition.
- Add an enrollment-request queue and the new state transitions.
- Add offer expiry, capacity holds, waitlist promotion and atomic enrollment confirmation.
- Separate enrollment and payment state in the data layer and UI.
- Hide or disable Stripe Payment Link configuration in `request_only` mode.
- Replace “Confirm Stripe Payment” with the appropriate manual-payment workflow until Stripe invoices are introduced.
- Update booking dashboards, counts, CSV exports and filters for the new states.
- Update seed data to create offerings instead of placeholder event-shaped sessions.
- Lock down Firestore rules and add required indexes.
- Update duplicated email, payment, expiry and waitlist functions.
- Disable the old e-transfer expiry schedule in `netlify.toml` after legacy holds are resolved.
- Archive or remove the orphaned public booking pages under `apps/app/src/pages/booking/**` so the platform cannot become a second source for the parent flow.
- Reconcile and preserve legacy registration/session records.
- Update the platform's booking architecture, progress and Stripe documents.

Primary affected areas include:

```text
apps/app/src/lib/booking.js
apps/app/src/pages/admin/ProgramsAdmin.jsx
apps/app/src/pages/admin/SessionsAdmin.jsx
apps/app/src/pages/admin/RegistrationsAdmin.jsx
apps/app/src/pages/admin/BookingDashboard.jsx
apps/app/src/pages/admin/WaitlistAdmin.jsx
apps/app/src/pages/TutorDashboard.jsx
apps/app/src/pages/SeedPage.jsx
apps/app/src/App.jsx
apps/app/src/pages/booking/**
apps/app/netlify/functions/**
apps/app/firestore.rules
apps/app/firebase.json
apps/app/netlify.toml
docs/features/booking system/**
docs/product/booking-system/**
```

The platform work is not optional: without a staff approval queue, requests collected by the public website would be stranded.

## Implementation sequence

### Phase 0 — Confirm business rules

- Confirm whether there are five cohorts total or five per evening.
- Confirm program-to-weekday assignments.
- Confirm term dates and authoritative class dates.
- Confirm capacity and staffing.
- Confirm tuition, full-year discount and installment policy.
- Confirm seat-offer expiry.
- Confirm missed-class, make-up, withdrawal, refund and mid-term entry policies.

### Phase 1 — Privacy and payment safety

- Reconcile current registrations and payments.
- Lock down Firestore rules.
- Disable insecure My Bookings access.
- Activate `request_only` globally.
- Disable Payment Links and guard payment routes.
- Preserve legacy records.

### Phase 2 — Domain and portal operations

- Add `programOfferings`, meetings, enrollments, payments and waitlist entries.
- Add server-side enrollment creation and validation.
- Build offering administration.
- Build the staff review, offer and confirmation queue.
- Add atomic capacity and waitlist operations.

### Phase 3 — Public registration request

- Update robotics cards and offering pages.
- Add the request form and request-received confirmation.
- Add interest-list and waitlist states.
- Update email templates and public copy.
- Add analytics for started, submitted, offered and enrolled conversion.

### Phase 4 — Future payment

- Introduce per-enrollment hosted invoices after staff approval.
- Test reconciliation, installments, refunds and reminders.
- Consider automated Checkout only if instant self-service enrollment becomes a real operational requirement.

## Acceptance criteria for the request-only launch

- No parent-facing page offers Stripe, card or e-transfer payment during registration.
- Direct payment-route visits cannot expose an outdated payment journey.
- A valid request is stored as `Submitted` with payment `Not Requested`.
- Confirmation copy clearly says that the request is not yet an enrollment or seat reservation.
- Staff can review and progress every request without editing Firestore manually.
- Staff can offer, expire, waitlist, decline and confirm an enrollment.
- Capacity and holds update atomically.
- Existing registrations remain readable and administrable.
- Public users cannot list or read other families' records.
- Medical and emergency data is restricted to authorized staff.
- Automated Stripe endpoints remain fail-closed.
- Documentation describes current behavior rather than future intent.
- Automated tests cover the critical enrollment and capacity transitions.

## External references

- [City of Ottawa — Browse and register for courses and camps](https://ottawa.ca/en/registered-programs-what-you-need-know/browse-and-register-courses-and-camps)
- [Young Engineers — Bricks Challenge](https://robokidsclub.youngengineers.org/enrichment-programs/bricks-challenge-enrichment-program/)
- [Young Engineers — Smartivo](https://robokidsclub.youngengineers.org/enrichment-programs/smartivo/)
- [Stripe — Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page)
- [Stripe — Checkout Sessions API](https://docs.stripe.com/payments/checkout-sessions)

## Decision still needed

Before implementation begins, confirm whether the intended schedule is **five weekly cohorts total** or **five cohorts every evening**. This document and its implementation sequence currently assume five total weekly cohorts.
