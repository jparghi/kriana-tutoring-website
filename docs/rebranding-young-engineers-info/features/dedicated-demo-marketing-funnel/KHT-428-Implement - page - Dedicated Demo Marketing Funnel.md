# Jira Story — Dedicated Demo Marketing Funnel

**Title:** Create Dedicated `/demo` Landing Page and Attribution Funnel for the September Young Engineers Demo

## User story

As a parent arriving from Facebook, Instagram, WhatsApp, email, a flyer, or a QR code, I want a short, mobile-friendly Young Engineers demo page with clear event information and one registration action, so I can reserve my child’s spot without navigating the general booking catalogue.

## Business objective

Create a dedicated conversion funnel for the September 12 Young Engineers demo:

```text
Marketing channel
  → krianatutoring.com/demo
  → Demo registration
  → $10 payment instructions
  → Staff-confirmed registration
  → Attendance
  → Regular Young Engineers enrollment
```

The funnel must:

- Give paid social and community promotions one stable destination.
- Minimize steps and duplicate data entry.
- Keep the event-specific funnel separate from general Young Engineers lead nurturing.
- Capture enough attribution to compare Facebook, Instagram, WhatsApp, QR, flyer and email performance.
- Reuse the existing `$10 Demo Class` registration, capacity and enrollment-credit infrastructure.

## Demo campaign

| Field | Value |
|---|---|
| Event | Young Engineers Demo Class — Kanata |
| Audience | Children ages 6–12 |
| Date | Saturday, September 12, 2026 |
| Time | 10:30–11:30 AM |
| Timezone | America/Toronto |
| Location | Beaverbrook Library, Kanata |
| Reservation fee | $10 CAD |
| Primary activity | Bricks Challenge |
| Also showcased | AlgoPlay and Smartivo |
| Contact | Call or text 613-400-6921 |
| Registration type | `demo` |

The exact library address and room must be confirmed before publishing.

## Public URL

```text
https://www.krianatutoring.com/demo
```

This URL must remain stable across future campaigns and must not expose Firestore IDs or the internal booking URL in advertisements or printed QR codes.

The active underlying program and offering IDs may be controlled through server configuration or an equivalent safe campaign mapping.

Example internal destination:

```text
/booking/{programId}/register?offeringId={offeringId}&registrationType=demo
```

## Landing-page requirements

The `/demo` page must be intentionally short, mobile-first and conversion-focused.

It should not reproduce the full Robotics page or general booking catalogue.

### Hero content

**Young Engineers Demo Class — Kanata**

A hands-on engineering and coding experience for children ages 6–12.

**Saturday, September 12, 2026**  
**10:30–11:30 AM**  
**Beaverbrook Library, Kanata**

### Main offer

**Reserve Your Child’s Spot for $10**

Attend the demo and enroll in an eligible Young Engineers program afterward, and your $10 demo fee will be credited toward registration.

### Primary CTA

**Reserve My Child’s Spot — $10**

The CTA must open the existing demo registration form with:

```text
registrationType=demo
```

Do not place an additional lead or intake form on `/demo`.

### Supporting content

Keep supporting information brief:

- Build a hands-on Bricks Challenge model.
- Experience coding and robotics.
- Discover Bricks Challenge, AlgoPlay and Smartivo.
- Designed for children ages 6–12.
- Limited capacity.
- Call or text 613-400-6921.

### Trust and clarity

The page must clearly explain:

- The fee is $10 CAD.
- Submitting the form temporarily holds a seat.
- The seat is confirmed after Kriana receives and verifies payment.
- The $10 credit becomes available after the child attends.
- No-shows do not receive an enrollment credit.
- The event has limited capacity.

## Registration journey

```text
Parent visits /demo
  → Reviews event information
  → Selects “Reserve My Child’s Spot — $10”
  → Existing five-field demo form opens
  → Parent submits registration
  → Capacity hold is created
  → Parent receives e-transfer instructions
  → Staff verifies the $10 payment
  → Seat moves from held to confirmed
  → Parent receives confirmation
  → Staff records attendance
  → $10 enrollment credit becomes available
```

A form submission alone must not be described as a confirmed registration.

## Existing functionality to reuse

Reuse the current demo functionality wherever possible:

- `registrationType: "demo"`
- `$10` price resolved server-side
- Five-field demo registration form
- `demoRegistrations`
- `demoCredits`
- One-demo-per-child eligibility lock
- Transactional capacity holds
- E-transfer instructions
- Admin payment verification
- Attendance and no-show statuses
- Automatic credit application to eligible Young Engineers enrollments
- Demo registration numbering and idempotency

Do not create a second demo registration backend.

## Required modifications to existing flow

### Fixed event information

The current demo form and emails say Kriana will contact the parent to schedule the demo. That wording is incorrect for this campaign.

Update the demo journey to display the selected offering’s:

- Event title
- Date
- Start and end time
- Timezone
- Location
- Age range
- Registration reference

This information must appear consistently on:

- `/demo`
- Demo registration form
- E-transfer instructions page
- Parent acknowledgement email
- Admin notification
- Payment confirmation communication
- Post-registration confirmation page

The registration must store an event/offering snapshot so later admin edits do not change historical registration details.

### Stable campaign mapping

`/demo` must resolve to one configured, published demo offering.

If the configured offering is missing, unpublished, closed, full or past, the page must show an appropriate unavailable state rather than linking to a broken registration route.

### Multiple demo offerings

The current booking catalogue selects a demo offering using `.find()`, which is unsafe when a program has more than one demo.

The developer must ensure:

- The campaign uses the explicitly configured offering ID.
- It does not depend on the first demo returned by Firestore.
- Existing individual demo offerings remain unaffected.
- The September campaign can coexist with another demo.

## Marketing attribution

Attribution is part of the core scope because this page exists specifically for marketing campaigns.

### Supported parameters

Preserve these allowlisted query parameters:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
ref
```

Examples:

```text
/demo?utm_source=facebook&utm_medium=paid_social&utm_campaign=demo_sep_2026
/demo?utm_source=instagram&utm_medium=paid_social&utm_campaign=demo_sep_2026
/demo?utm_source=whatsapp&utm_medium=message&utm_campaign=demo_sep_2026
/demo?utm_source=flyer&utm_medium=qr&utm_campaign=demo_sep_2026
```

### Attribution persistence

Attribution must survive:

```text
/demo
  → registration form
  → e-transfer instructions
  → saved demo registration
```

Store a sanitized attribution snapshot on the demo registration:

```ts
marketingAttribution: {
  landingPath: "/demo",
  source: "facebook",
  medium: "paid_social",
  campaign: "demo_sep_2026",
  content: "vertical_video_01",
  term: null,
  referrer: "<sanitized origin or null>",
  capturedAt: "<server timestamp>"
}
```

Requirements:

- Never trust arbitrary client objects.
- Validate and length-limit every field server-side.
- Do not store full URLs containing unnecessary or sensitive query data.
- A missing attribution value must not block registration.
- Admin must be able to see the source, medium and campaign.
- Attribution must not affect payment, capacity or credit eligibility.

## Funnel measurement

Track these funnel events through the site’s approved analytics mechanism:

- `demo_landing_view`
- `demo_registration_click`
- `demo_registration_started`
- `demo_registration_submitted`
- `demo_payment_instructions_viewed`
- `demo_payment_confirmed`
- `demo_attended`
- `demo_enrollment_credit_applied`

Each event should include only non-sensitive campaign data:

- Campaign identifier
- Source
- Medium
- Content identifier
- Offering ID
- Event identifier

Do not send parent or child names, email addresses, phone numbers or ages to Meta Pixel, Google Analytics or other advertising analytics.

If marketing cookies or Meta Pixel are added, they must follow the site’s consent requirements. Server-side attribution stored with the registration should still work when analytics cookies are declined.

## Capacity and availability

- Capacity is configured on the selected demo offering.
- Form submission creates a temporary hold transactionally.
- Confirmed payment moves the seat from held to confirmed.
- Expired or cancelled unpaid holds release capacity.
- New registrations are rejected once confirmed plus held seats reach capacity.
- Direct booking URLs must enforce the same rules as `/demo`.
- The landing page must display a full state when no seats remain.
- Registration must close automatically at the configured deadline.
- Registration must never remain open after the event begins.
- Admin can unpublish or disable the offering without a code deployment.

## Payment scope

For this story, reuse the current e-transfer flow:

1. Parent submits the demo registration.
2. A temporary seat hold is created.
3. Parent receives the $10 e-transfer instructions.
4. Staff confirms the payment in the admin system.
5. The seat becomes confirmed.

The landing page must not say “instant confirmation” or “payment completed online.”

Enabling Stripe Checkout would improve paid-ad conversion but requires webhook, payment-expiry, refund and deployment work. Track that as a separate Jira story unless the business explicitly expands this story’s scope.

## Confirmation experience

After submitting the form, display:

- Registration received
- Payment still required
- $10 e-transfer instructions
- Payment deadline
- Event name
- Date and time
- Location
- Registration reference
- Call/text number
- Explanation that the seat is temporarily held

After staff confirms payment, the parent confirmation should state that the seat is confirmed.

The confirmation experience should also offer:

- Add to calendar
- Open location in maps
- Contact Kriana
- Explanation of the $10 enrollment credit

## SEO and social sharing

Because `/demo` may be shared through WhatsApp and Facebook, add:

- Page title
- Meta description
- Canonical URL
- Open Graph title
- Open Graph description
- Campaign-specific share image
- `Event` structured data when the venue address is confirmed

The page should produce a useful preview when pasted into WhatsApp, Facebook Messenger and other social platforms.

Recommended title:

```text
$10 Young Engineers Demo Class in Kanata | Kriana Tutoring
```

Recommended description:

```text
Reserve a hands-on Young Engineers demo for ages 6–12 at Beaverbrook Library in Kanata. Your $10 demo fee is credited when you enroll.
```

## General lead funnel separation

The dedicated event funnel remains:

```text
Demo advertisement
  → /demo
  → $10 demo registration
```

The broader Young Engineers awareness funnel remains separate:

```text
Meta lead form
  → WhatsApp follow-up
  → Child age
  → Recommended programs
  → Program videos
  → Staff conversation
```

Program matching remains:

- Ages 4–5: Smartivo
- Age 6: Smartivo, Bricks Challenge and AlgoPlay
- Ages 7–12: Bricks Challenge and AlgoPlay

Do not redirect general-interest leads to the paid demo automatically unless the marketing campaign specifically promotes the September event.

## Acceptance criteria

### Landing page

- [ ] `/demo` is publicly accessible.
- [ ] It displays the configured event’s date, time, location, age and price.
- [ ] It has one dominant registration CTA.
- [ ] It is optimized for mobile social traffic.
- [ ] It loads without first loading the general booking catalogue.
- [ ] Phone number 613-400-6921 is visible and clickable.
- [ ] The page has correct Open Graph metadata.
- [ ] A shared `/demo` link produces an appropriate social preview.
- [ ] Full, closed, disabled and past-event states are handled.

### Registration

- [ ] CTA opens the existing demo form with the configured offering.
- [ ] No duplicate landing-page intake form is introduced.
- [ ] Registration retains `registrationType: "demo"`.
- [ ] The fixed event schedule and venue appear on the form.
- [ ] The server revalidates program, offering, registration window and capacity.
- [ ] Form submission creates a temporary seat hold.
- [ ] Event information is snapshotted on the registration.
- [ ] Existing eligibility-lock and idempotency behavior is preserved.

### Payment and confirmation

- [ ] Parent receives accurate $10 e-transfer instructions.
- [ ] The seat remains pending until staff verifies payment.
- [ ] Staff can view the registration and payment status.
- [ ] Staff confirmation moves capacity from held to confirmed.
- [ ] Parent communications display the fixed event details.
- [ ] Existing attendance and $10 credit behavior is preserved.
- [ ] No page promises instant payment confirmation.

### Attribution

- [ ] Allowlisted UTM and `ref` values are captured.
- [ ] Attribution persists through registration.
- [ ] Sanitized attribution is saved on the demo registration.
- [ ] Admin can view campaign source, medium and campaign.
- [ ] Missing or invalid attribution never prevents registration.
- [ ] No child or parent personal information is sent to advertising analytics.

### Stable URL

- [ ] Printed QR codes only use `https://www.krianatutoring.com/demo`.
- [ ] Changing the underlying program or offering does not change `/demo`.
- [ ] The configured offering is selected explicitly—not through `.find()`.
- [ ] An invalid campaign configuration fails closed.

## Testing requirements

Automated and manual testing must cover:

- `/demo` with a valid open offering
- Missing or invalid campaign configuration
- Unpublished offering
- Registration not yet open
- Registration closed
- Full capacity
- Past event
- Last-seat concurrent registrations
- Duplicate form submission
- Multiple demo offerings for the same program
- Attribution with valid, missing and oversized values
- Attribution preserved through registration
- E-transfer instructions showing the correct event
- Payment confirmation updating capacity
- Attendance activating the credit
- No-show not activating the credit
- Credit applying only once
- Mobile layouts used by Facebook and Instagram browsers
- WhatsApp link preview
- QR-code navigation
- Existing demo and regular enrollment regression tests

## Out of scope

- Replacing the general Young Engineers lead funnel
- Adding another pre-registration form
- Redesigning the full booking catalogue
- Enabling Stripe Checkout
- Creating a second demo backend
- Changing regular program payment behavior
- Creating WhatsApp automation
- Producing new advertisement graphics or video
- Changing the one-demo-per-child eligibility policy

## Definition of done

- `/demo` is deployed and connected to the correct September offering.
- The complete landing-to-registration journey works on mobile.
- Fixed event information is consistent across all customer communications.
- Capacity holds and payment confirmation work correctly.
- Marketing attribution is visible to staff.
- QR and social links use the stable `/demo` URL.
- Existing demo, credit and regular enrollment flows pass regression testing.
- Production configuration is verified before advertisements or printed QR codes are released.