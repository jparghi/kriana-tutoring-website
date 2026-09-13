# $10 Demo: Fully Booked, Waitlist, and Future Demo Scheduling

Last updated: 2026-09-11

This folder documents the $10 Young Engineers demo funnel (`/demo`), the
"fully booked + waitlist" behavior added for the September 12, 2026 Kanata
demo, how to run the next demo, and the planned portal feature that would let
staff schedule demos without code or Netlify changes.

It spans two repositories:

- public website: `kriana-tutoring-website` (the `/demo` page, register form,
  booking and waitlist endpoints);
- staff portal: `kriana-tutoring-platform` (Waitlist tab, lifecycle guards,
  admin script).

## Documents

| Document | Read it when |
|---|---|
| [01-how-it-works.md](./01-how-it-works.md) | You need to understand the demo states, the two offering switches, what a waitlist entry is, and which files do what. |
| [02-operations-runbook.md](./02-operations-runbook.md) | You are deploying this change, pausing/reopening public booking, turning the waitlist on/off, or previewing locally. |
| [03-next-demo-runbook.md](./03-next-demo-runbook.md) | **You need another demo.** Starts with a what-to-do-next checklist (setup → launch → while booking → day before → after), then detailed steps and the code-reuse breakdown. |
| [04-portal-demo-campaigns-plan.md](./04-portal-demo-campaigns-plan.md) | You are building the portal "Demo Campaigns" feature (enter date + capacity, everything else automatic). Not built yet. |
| [05-decisions-and-findings.md](./05-decisions-and-findings.md) | You want the history: what production looked like on 2026-09-11, what the owner decided, and bugs found along the way. |

## One-paragraph summary

A demo offering is publicly bookable only while it is live, inside its
registration window, has seats left, and is not paused. When it fills up —
or staff set `publicRegistrationPaused: true` to close it early — the public
`/demo` page switches to "Our {date} demo is fully booked!", the server
rejects new bookings (including direct register links), and, if the
offering's `waitlistEnabled` switch is on, the **same register link** shows a
free "Join the Waitlist" form. A waitlist entry is inert: it never holds a
seat, never creates a demo credit, never requests payment, and never blocks
the child from a future $10 demo. Staff see entries in the portal's Waitlist
tab (tagged **$10 Demo**) and contact families directly.

## Status (2026-09-11)

- Code complete and tested in both repositories; committed as website
  `98a6455` ("Add demo waitlist and public booking pause for fully booked
  demos") and platform `4d063e7` ("Handle demo waitlist entries and add demo
  public-booking script").
- **Live since 2026-09-11.** Both repos are deployed (platform deploy of
  `4d063e7` on 2026-09-11), and `publicRegistrationPaused` and
  `waitlistEnabled` are set on `young-engineers-demo-kanata-sep-2026-offering`.
  Public `/demo` shows fully booked + Join the Waitlist; 13/20 seats
  confirmed internally. Steps, verification, undo, and troubleshooting are in
  [02-operations-runbook.md](./02-operations-runbook.md#go-live-for-the-september-12-demo).
- Portal "Demo Campaigns" feature: planned, not started.
