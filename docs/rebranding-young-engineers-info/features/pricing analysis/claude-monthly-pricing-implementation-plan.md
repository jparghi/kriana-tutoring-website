# Claude Implementation Plan: Monthly-Tuition Robotics Pricing

## Purpose

Update the Young Engineers robotics booking flow so parents compare three clear pricing options:

1. Regular — maximum flexibility
2. Builder — 20-class minimum commitment
3. Engineer — 36-class minimum commitment and best value

The presentation should lead with predictable monthly tuition calculated from the real program calendar. It must not imply that every calendar month contains four classes, and it must not hide the selected plan's commitment or total tuition.

This is not merely a card redesign. The requested Regular plan and rate structure do not match the current package catalogue, so business decisions and server-side changes must be completed before publishing the new claims.

## Mandatory decision gate

Do not modify production pricing until the owner answers all of the following:

### Decision 1: confirm canonical rates

The requested new model is:

| Plan | Rate | Commitment |
|---|---:|---|
| Regular | $30/class | No long-term commitment |
| Builder | $28/class | Minimum 20 classes |
| Engineer | $26/class | Minimum 36 classes |

However, the current Smartivo catalogue is:

| Plan | Pay-in-full rate | Installment rate | Current total |
|---|---:|---:|---:|
| Explorer | $30/class | Not available | $300 for 10 classes |
| Builder | $26/class | $28/class | $520 pay in full; $560 by installments |
| Engineer | $24/class | $28/class | $864 pay in full; $1,008 by installments |

Ask the owner:

> Should Smartivo's actual canonical pricing be changed to $30 Regular, $28 Builder, and $26 Engineer, thereby making Builder $560 and Engineer $936 before promotions?

Do not treat the pasted pricing brief as authorization to overwrite the currently configured $26/$24 pay-in-full rates because the brief also says not to change base rates without confirmation.

### Decision 2: define Regular commercially

The existing Explorer plan is a 10-class, $300 fixed package. It is not a no-commitment monthly plan.

Ask the owner to select one model:

- Recommended: Regular is billed for the actual classes scheduled in the upcoming calendar month at $30/class. The displayed amount can vary when a month contains 3, 4, or 5 classes.
- Alternative: Regular is a four-class rolling pass for $120, which is not calendar-month billing.
- Alternative: Regular has a fixed averaged monthly payment, which requires a defined minimum term or annual reconciliation and therefore is not truly no-commitment.

Important contradiction: a no-commitment plan cannot simultaneously promise a fixed averaged monthly amount across an undefined future term unless the business absorbs/reconciles differences. Claude must not invent a solution or advertise a fixed Regular monthly price until the owner chooses the policy.

### Decision 3: define billing months for committed paths

Confirm how billing months are counted:

- Recommended: every distinct calendar month from the first committed class through the last committed class, inclusive, including a zero-class month inside that continuous term.
- Alternative: only calendar months containing at least one class.
- Alternative: an explicit `billingMonthCount` and billing start date configured on each offering.

The recommended rule provides genuinely stable tuition over the continuous learning-path term. Counting only months containing classes could skip a winter-break month and make the meaning of “monthly” less intuitive.

### Decision 4: define cancellation and missed-class policies

Confirm:

- Regular cancellation notice and effective date;
- whether Regular automatically renews;
- whether committed Builder/Engineer payments continue after withdrawal;
- failed-payment handling;
- missed-class, make-up, credit and refund rules;
- what happens if Kriana cancels or reschedules a class;
- whether a student joining late receives a prorated path or a newly generated full path.

### Decision 5: define the promotion

The current Back-to-School promotion applies only to pay-in-full pricing. Confirm whether the new model should:

- keep first class free only when paying in full;
- deduct one class from the first monthly payment; or
- use a different fixed promotional credit.

Keep the promotion separate from the monthly tuition calculation. Do not reduce every monthly payment unless that is the explicitly approved business rule.

## Current implementation findings

### Canonical package configuration

File: `website/lib/robotics-packages.js`

This file contains:

- Explorer, Builder and Engineer definitions;
- program-specific Smartivo prices;
- allowed installment counts;
- promotional pay-in-full subtotals;
- server-safe pricing resolution;
- package and payment snapshots.

All actual price changes must begin here. UI-only prices would be unsafe because the enrollment function independently resolves prices from this catalogue.

### Public pricing cards

File: `website/app/booking/[programId]/page.tsx`

`PackageChooser` currently:

- shows only packages with `publicVisible: true`;
- displays Builder and Engineer for Smartivo;
- leads with per-class and full pay-in-full totals;
- visually emphasizes Builder;
- sends the selected package through the `package` query parameter;
- asks the user to choose a weekly offering afterward.

The selected offering is not known when the current pricing cards first render. This matters because monthly tuition must be based on a real offering calendar.

### Schedule calculation

Files:

- `website/lib/booking.ts`
- `website/lib/class-schedule.js`

`getPackageClassSchedule(offering, package)` already generates exact weekly class dates using:

- first class date;
- weekday;
- package class count;
- Ontario statutory holidays;
- offering-specific `excludedDates` or `closureDates`;
- configured timezone.

It produces the exact committed class dates, start date and end date. This should be reused rather than building a second calendar engine.

### Registration and payment preference

Files:

- `website/app/booking/[programId]/register/page.tsx`
- `website/netlify/functions/submit-enrollment-request.js`

The current flow supports:

- one pay-in-full payment; or
- a fixed number of installments selected from package configuration.

It does not currently implement a recurring, cancel-anytime monthly subscription. Enrollment is also server-validated against the canonical package catalogue and available offering class count.

### Tests

Primary existing test files:

- `website/tests/robotics-packages.test.mjs`
- tests covering class-schedule generation and booking helpers, to be located with `rg --files website/tests`

Existing tests encode the current Smartivo totals and installment behavior. Update them only after the rate decisions are confirmed.

## Recommended architecture

### Phase 1: introduce explicit plan semantics

Do not overload Explorer and pretend it is Regular.

Add explicit package/plan fields to the canonical catalogue, for example:

```js
{
  id: 'regular',
  name: 'Regular',
  planType: 'rolling_monthly',
  perClassCents: 3000,
  minimumClassCommitment: null,
  publicVisible: true,
  paymentOptions: {
    payInFullEnabled: false,
    installmentPlanEnabled: false,
    recurringMonthlyEnabled: true,
  },
}
```

Committed plans should explicitly declare:

```js
{
  id: 'builder',
  planType: 'fixed_learning_path',
  classCount: 20,
  perClassCents: 2800,
  minimumClassCommitment: 20,
}
```

```js
{
  id: 'engineer',
  planType: 'fixed_learning_path',
  classCount: 36,
  perClassCents: 2600,
  minimumClassCommitment: 36,
}
```

Preserve Explorer as a separate legacy/internal product unless the owner explicitly retires or migrates it. Existing registrations and direct Explorer links must continue to resolve.

### Phase 2: add a monthly-tuition calculation module

Create a pure module, suggested path:

`website/lib/robotics-monthly-tuition.js`

Suggested API:

```js
getBillingMonths(schedule, policy)
computeAveragedMonthlyTuition(totalCents, billingMonthCount)
getLearningPathMonthlyTuition(offering, pkg, policy)
getClassesByCalendarMonth(schedule)
```

Required result shape:

```js
{
  billingMonthCount,
  totalTuitionCents,
  monthlyAmountsCents,
  representativeMonthlyCents,
  firstClassDate,
  lastClassDate,
  classesByMonth,
}
```

Use integer cents. If a total does not divide evenly, distribute the remainder deterministically so all monthly payments sum to the exact total. For example, use the existing cent-safe installment splitter or a generalized equivalent. Never round each payment independently in a way that changes the final total.

Example:

```js
computeAveragedMonthlyTuition(56000, 6)
// [9333, 9333, 9333, 9333, 9333, 9335] or another documented exact split
// Sum must equal 56000.
```

The UI may say “$93.33/month, final payment adjusted by $0.02,” or display the exact first/last payment schedule during registration.

### Phase 3: make schedule selection precede price calculation

The current page asks for a package before an offering, but the requested monthly price depends on the offering.

Recommended flow:

1. Parent selects a weekly schedule/offering.
2. Page generates Builder and Engineer class calendars for that offering.
3. Page calculates actual billing months and stable monthly tuition.
4. Parent compares Regular, Builder and Engineer using real numbers.
5. Parent continues to registration with both `offeringId` and `package`/`plan` in the URL.

This is safer than using the first offering's calendar to advertise a price that may not match the schedule later selected.

Keep this change local to the robotics booking flow. Non-robotics booking flows must remain unchanged.

If changing the selection order is rejected, the safe fallback is to show “Monthly tuition calculated after you choose a schedule” on the initial cards and show the exact monthly amount only after the offering is selected. Do not show a guessed or “typical” monthly amount.

### Phase 4: update pricing cards

On the schedule-specific comparison, render three responsive cards.

#### Regular

- Label: “Maximum Flexibility”
- Dominant price: based on the approved Regular billing policy
- `$30/class`
- “No long-term commitment” visibly displayed
- “Weekly classes”
- “Best for families who want flexibility”
- CTA must connect to a real supported Regular enrollment flow

Do not write “predictable monthly tuition” for Regular if its amount varies with 3/4/5-class months.

#### Builder

- Label: “20-Class Learning Path”
- Dominant price: exact calculated averaged monthly tuition
- Supporting text: “Averaged across your 20-class learning path”
- `$28/class`
- “Minimum commitment: 20 classes” visibly displayed
- “Save $2/class compared with Regular”
- small secondary text: exact total tuition
- exact number of monthly payments

#### Engineer

- `BEST VALUE` badge
- stronger border/background treatment using current Kriana/Young Engineers colours
- Label: “36-Class Learning Path”
- Dominant price: exact calculated averaged monthly tuition
- Supporting text: “Averaged across your 36-class learning path”
- `$26/class`
- “Minimum commitment: 36 classes” visibly displayed
- “Save $4/class compared with Regular”
- “Lowest per-class rate”
- small secondary text: exact total tuition
- exact number of monthly payments

Do not make Engineer visually larger in a way that damages mobile layout. Use colour, border, badge and ordering rather than aggressive scaling.

### Phase 5: shared explanation

Add one shared block below the cards:

> **How monthly tuition works**
>
> Classes are generally scheduled weekly, but the number of class dates may vary from month to month due to holidays, school breaks and the calendar. Builder and Engineer tuition is averaged across the selected learning path, giving families predictable monthly payments while ensuring students receive every class included in their program.

Tooltip near “Monthly tuition”:

> Monthly tuition is averaged across the full learning path and is not based on the number of classes in an individual calendar month.

The tooltip must be keyboard accessible, readable by screen readers, and usable on touch devices. Prefer a visible info button with `aria-expanded` and toggled help text rather than hover-only behavior.

### Phase 6: registration and server snapshots

Extend pricing snapshots to store enough information to reconstruct what the parent agreed to:

- plan ID and version;
- plan type;
- per-class rate;
- class commitment;
- exact class dates or a stable schedule snapshot/version;
- billing month count;
- billing period labels;
- exact payment amounts in cents;
- total tuition;
- promotion/credit separately;
- final payable total;
- cancellation policy version;
- timezone.

The server must recompute and validate this information from the stored offering and canonical catalogue. Never trust monthly amounts, totals, billing counts or dates sent by the browser.

Update `submit-enrollment-request.js` so it validates that the selected offering has sufficient real class dates for the committed path and records a server-generated monthly schedule snapshot.

Do not begin actual recurring Stripe charges unless the existing payment architecture supports them. If recurring billing requires new Stripe subscriptions, invoices, mandates or webhooks, treat that as a separate payment-infrastructure phase. Until then, the site can collect a monthly payment preference/request but must not claim automatic billing is active.

### Phase 7: promotion handling

Represent promotion as a separate credit:

```js
{
  baseTuitionCents,
  promotionCreditCents,
  payableTuitionCents,
  promotionApplied,
}
```

Do not change the base monthly average when the current business rule says the promotion is pay-in-full only. Show the promotion in a separate banner and on the pay-in-full option.

If the owner chooses to credit the first monthly payment, show:

- normal stable monthly tuition;
- first payment after promotional credit;
- remaining monthly payments;
- exact final total.

## Files Claude should expect to modify

Subject to the confirmed decisions:

- `website/lib/robotics-packages.js`
- `website/lib/robotics-monthly-tuition.js` (new)
- `website/lib/booking.ts` only if a schedule/billing helper belongs there
- `website/app/booking/[programId]/page.tsx`
- `website/app/booking/[programId]/register/page.tsx`
- `website/netlify/functions/submit-enrollment-request.js`
- `website/tests/robotics-packages.test.mjs`
- a new `website/tests/robotics-monthly-tuition.test.mjs`
- relevant booking/submission tests discovered in the repository

Potentially modify confirmation/review components or email templates if they display payment information. Locate all consumers with:

```sh
rg -n "packageSnapshot|paymentPreference|installmentAmountsCents|billingCadence|payableSubtotalCents" website
```

Do not modify unrelated landing pages, tutoring pricing, camps, birthdays or generic program pricing.

## Calculation acceptance tests

Use fixed calendar fixtures rather than depending on today's date.

### Calendar distribution tests

Create schedules where the generated path includes:

- a month with 3 classes;
- a month with 4 classes;
- a month with 5 classes;
- an Ontario statutory holiday;
- a configured school-break closure range;
- a path crossing December/January;
- a zero-class calendar month if the approved billing policy includes it.

Verify:

- every committed path contains exactly 20 or 36 actual class dates;
- excluded dates do not count as delivered classes;
- `classesByMonth` correctly reports 3, 4 and 5 without changing monthly tuition;
- every monthly amount remains the same except an unavoidable final cent adjustment;
- monthly payment amounts sum exactly to total tuition;
- Builder total equals `20 × approved Builder rate`;
- Engineer total equals `36 × approved Engineer rate`;
- promotion credits do not mutate the canonical base rate;
- timezone conversion never moves a class into the wrong month.

### Example expected behavior

If the approved Builder total is $560 and its actual schedule spans six billing months:

- display approximately $93.33/month;
- disclose six payments and $560 total;
- months containing 3, 4 or 5 class dates have the same tuition;
- adjust the final payment by the minimum cents necessary to total exactly $560.

If the same 20 classes span five billing months:

- display $112/month;
- disclose five payments and $560 total.

This proves that `$112/month` is a calendar-derived result, not a hardcoded assumption.

## Functional acceptance criteria

A parent must understand within five seconds:

- Regular provides the greatest flexibility at the highest per-class rate;
- Builder lowers the rate in exchange for 20 classes;
- Engineer provides the lowest rate in exchange for 36 classes;
- Builder and Engineer monthly tuition is averaged across the selected real schedule;
- calendar months may contain different numbers of classes;
- the monthly payment, payment count, commitment and total are all visible before submission.

Also verify:

- all cards work at narrow mobile widths;
- Engineer is highlighted as Best Value;
- Builder remains visually credible;
- tax wording matches the rest of checkout;
- direct/legacy Explorer registrations still resolve unless explicitly retired;
- waitlist and sold-out behavior remains intact;
- changing the schedule recalculates monthly tuition;
- changing the plan recalculates the generated class calendar;
- browser back/forward navigation preserves valid selections;
- invalid plan/offering combinations are rejected server-side;
- checkout/review/email amounts match the canonical server result;
- existing registrations remain readable.

## Recommended implementation order

1. Record the owner's answers to the five decision groups in this document or a linked decision record.
2. Add failing unit tests for approved rates, plan semantics and monthly calculations.
3. Implement the pure monthly-tuition calculator.
4. Add/update canonical plan definitions and snapshots.
5. Add server-side validation and snapshot generation.
6. Change the robotics selection flow so schedule-dependent prices use the selected offering.
7. Build the three-card responsive comparison and explanation block.
8. Update registration payment/review UI.
9. Update confirmations/emails that expose payment terms.
10. Run focused tests, then the full project test/build/lint commands.
11. Manually verify mobile and desktop flows with 3-, 4- and 5-class calendar months.
12. Confirm no live rate was changed without explicit approval.

## Instructions to Claude

Use this operating prompt with the plan:

> Read this entire implementation plan and inspect every referenced file before editing. Begin by reporting the current implementation and the unresolved business decisions. Do not code until I answer the mandatory decision gate. After I answer, restate the approved pricing and billing rules, implement in the recommended order, and verify the cent-level calculations, calendar behavior, server validation and responsive UI. Preserve unrelated behavior and existing registrations. Never hardcode a monthly amount that can be derived from the selected offering's actual class schedule.
