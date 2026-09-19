Yes. The feature should be **Demo Lead Tracker**, not a generic CRM.

Your existing project was deliberately structured around `/docs/architecture.md`, `/docs/roadmap.md`, and `/docs/requirements.md` as the source of truth, so this new feature should be added to those docs before implementation. 

## How it fits *The 1-Page Marketing Plan*

For Kriana/Young Engineers demos, the important part of the framework is:

**Prospect → Lead → Nurture → Customer → Advocate**

Your demo registration is the point where an anonymous prospect becomes a **real lead**.

So I would build the funnel like this:

```text
Facebook / Instagram / Google / Referral
                ↓
        Demo Registration
                ↓
         NEW REGISTRATION
                ↓
       Confirmation Sent
                ↓
          Demo Reminder
                ↓
        Attended / No-show
            ↙         ↘
       Interested     Follow-up
            ↓
         Enrolled
            ↓
      Parent Experience
            ↓
       Review / Referral
```

### Lead record

Every registration automatically creates one lead:

```text
Parent
├── Parent name
├── Email
├── Phone
│
Child
├── Child name
├── Age
├── Grade
│
Interest
├── Smartivo
├── Bricks Challenge
├── AlgoPlay
├── Tutoring
│
Demo
├── Demo date
├── Demo time
├── Registration date
├── Registration ID
├── Attended?
│
Marketing
├── Lead source
├── Campaign
├── Facebook / Instagram / Google / Referral
│
Sales
├── Lead status
├── Last contact
├── Next action
├── Follow-up date
├── Notes
└── Enrollment outcome
```

## Statuses

Keep these simple. Don't build 20 CRM statuses.

| Stage      | Status              |
| ---------- | ------------------- |
| Lead       | 🆕 New Registration |
| Lead       | ✅ Demo Confirmed    |
| Nurture    | 🔔 Reminder Sent    |
| Demo       | 👨‍👩‍👧 Attended   |
| Demo       | ❌ No Show           |
| Conversion | 🔥 Interested       |
| Conversion | 📞 Follow-up Needed |
| Customer   | 🎉 Enrolled         |
| Nurture    | 🕒 Not Ready        |
| Closed     | ❌ Lost              |

I'd also add a **Next Action** field. This is more useful than a vague lead score.

Examples:

```text
Call parent
Send Bricks information
Send pricing
Book free trial
Send registration link
Follow up Monday
No action required
```

## The most important part: automation

When somebody registers for your October 2 demo, for example:

```text
10:34 AM
Registration received
        ↓
Lead automatically created
        ↓
Status = New Registration
        ↓
Confirmation email sent
        ↓
Status = Demo Confirmed
        ↓
Lead timeline updated
```

Then the system drives the follow-up.

### Before demo

**Immediately**

Confirmation email including:

* confirmed date/time
* address
* what the child should expect
* Gallery: `krianatutoring.com/gallery`
* relevant program information: `krianatutoring.com/robotics`

**1 day before**

```text
Reminder email/SMS
```

### After demo

This is where the tracker becomes valuable.

For an attendee:

```text
ATTENDED
   ↓
Same day:
Thank-you message

   ↓
Interested program selected

   ↓
Relevant program + pricing

   ↓
NEXT ACTION:
Follow up tomorrow
```

Then:

```text
Day 1 → registration CTA
Day 3 → follow-up
Day 7 → final nurturing follow-up
```

For a no-show:

```text
NO SHOW
   ↓
"Sorry we missed you"
   ↓
Offer next demo / trial
   ↓
Follow-up date
```

---

# Lead Tracker screen

I would make the main UI something like this:

```text
Demo Lead Tracker

October 2 Workshop                    + Add Lead

┌────────────────────────────────────────────────────┐
│ 18 Registered │ 15 Confirmed │ 12 Attended │ 5 Enrolled │
└────────────────────────────────────────────────────┘

Search ___________   Program ▼   Status ▼   Source ▼


Parent       Child     Program    Status          Next Action

Sarah M.     Jacob     Bricks     🔥 Interested   Call today
Priya S.     Aarav     Smartivo   ✅ Confirmed    Demo Oct 2
John D.      Ethan     Bricks     👨‍👩‍👧 Attended Send pricing
Mary L.      Emma      AlgoPlay   🎉 Enrolled     —
Alex P.      Noah      Bricks     ❌ No Show      Invite next demo
```

Clicking a parent opens:

```text
Sarah Mitchell
Jacob — Age 8

BRICKS CHALLENGE

🔥 Interested

──────────────────────────

Oct 2  11:42 AM
✓ Demo attended

Oct 2  9:15 AM
✓ Reminder sent

Sep 29  4:23 PM
✓ Confirmation sent

Sep 29  4:22 PM
✓ Registration received
  Source: Facebook Demo Campaign

──────────────────────────

NEXT ACTION

Call parent
Oct 3

[ Mark Enrolled ]
[ Add Note ]
[ Send Follow-up ]
```

That **timeline** is important. It lets you know exactly what happened without digging through email.

---

# Dashboard metrics

Don't overbuild analytics initially.

Track these six:

```text
Registrations
      ↓
Confirmation Rate
      ↓
Attendance Rate
      ↓
Interested Leads
      ↓
Enrollment Rate
      ↓
Cost per Enrollment
```

And source:

```text
                 Leads   Attended   Enrolled

Facebook Ads       20       15          7
Instagram           6        5          2
Referral            4        4          3
WhatsApp            3        3          2
Organic Website     5        3          1
```

This eventually answers the most important marketing question:

> **Which marketing channel actually produces paying students?**

Not just likes, clicks, or Facebook leads.

---

# One-Page Marketing Plan connection

The system ultimately covers almost the entire middle and back end of the plan:

```text
BEFORE
Target Market
Message
Media
        ↓
Facebook / Instagram / Google
        ↓

DURING
Lead Capture       ← Registration
Lead Nurturing     ← Tracker + emails/SMS
Sales Conversion   ← Enrollment
        ↓

AFTER
Experience
Lifetime Value
Referrals
        ↓
Reviews / siblings / camps / birthdays /
robotics / tutoring
```

Later, when a child enrolls, **don't delete the lead**.

Convert:

```text
Lead → Customer
```

That gives us the foundation to later add:

```text
Customer
├── Program
├── Package
├── Start date
├── Renewal opportunity
├── Sibling opportunity
├── Birthday opportunity
├── Camp opportunity
├── Review requested
└── Referral requested
```

That's where the marketing plan becomes much more powerful for Kriana.

---

# What I would build in Version 1

Don't build everything above immediately.

### Phase 1 — Lead Tracker MVP

1. Automatically create lead from demo registration.
2. Lead table.
3. Lead detail/timeline.
4. Status management.
5. Next action + follow-up date.
6. Demo attendance.
7. Enrollment outcome.
8. Lead source/campaign.
9. Basic dashboard metrics.

Then we add automated nurturing.

---

## Give this to Codex

```text
NEW FEATURE: Kriana Demo Lead Tracker

Before modifying code:

1. Read all files under /docs.
2. Treat architecture.md, roadmap.md and requirements.md as the
   project's source of truth.
3. Inspect the existing repository and registration/demo implementation.
4. Do not replace or duplicate existing registration functionality.
5. First show me the implementation plan and affected files.

BUSINESS OBJECTIVE

Build a lightweight lead-management feature for Kriana Tutoring /
Young Engineers demos.

The system follows the marketing lifecycle:

Prospect -> Lead -> Nurture -> Customer -> Advocate.

A visitor becomes a Lead when a demo/workshop registration is submitted.

Do NOT build a generic enterprise CRM.

--------------------------------------------------

CORE REQUIREMENT

Whenever a demo registration is successfully created, automatically
create or update a corresponding lead record.

Prevent duplicate leads where appropriate.

The lead should remain connected to the original registration.

--------------------------------------------------

LEAD DATA

Store where available:

- id
- registrationId
- parentName
- parentEmail
- parentPhone
- childName
- childAge
- childGrade
- interestedProgram
- demoEventId
- demoDate
- registrationDate
- leadSource
- campaign
- status
- attendanceStatus
- enrollmentOutcome
- lastContactAt
- nextAction
- followUpAt
- notes
- createdAt
- updatedAt

Do not duplicate information unnecessarily if the existing domain model
already owns some of these fields. Prefer appropriate relationships.

--------------------------------------------------

LEAD STATUSES

Use a small controlled lifecycle:

NEW
CONFIRMED
REMINDER_SENT
ATTENDED
NO_SHOW
INTERESTED
FOLLOW_UP_NEEDED
ENROLLED
NOT_READY
LOST

Avoid arbitrary lead scoring in this version.

--------------------------------------------------

LEAD TRACKER UI

Create a Demo Lead Tracker page.

Top summary cards:

- Total registrations
- Confirmed
- Attended
- Interested
- Enrolled

Create a searchable/filterable table showing:

Parent
Child
Program
Demo
Lead Source
Status
Next Action
Follow-up Date

Filters:

- event/demo
- program
- lead status
- source

--------------------------------------------------

LEAD DETAIL

Clicking a lead should show:

Parent information
Child information
Program
Demo information
Current status
Next action
Follow-up date
Notes

Also display a chronological activity timeline.

Examples:

Registration received
Confirmation sent
Reminder sent
Demo attended
Follow-up sent
Status changed
Enrolled

--------------------------------------------------

ACTIONS

Allow the administrator to:

- change lead status
- mark attended
- mark no-show
- mark interested
- mark enrolled
- set next action
- set follow-up date
- add notes

Changes should appear in the activity timeline.

--------------------------------------------------

REGISTRATION INTEGRATION

Find the existing successful demo-registration flow.

After a registration is persisted successfully:

createLeadFromRegistration(registration)

or equivalent domain/service implementation.

The registration process must continue to work if lead tracking encounters
a recoverable problem.

Use the project's existing architectural conventions rather than forcing
this exact function name.

--------------------------------------------------

DUPLICATION

Do not create duplicate leads every time the same registration is updated.

Use registrationId as the strongest relationship where available.

If duplicate registration handling already exists, reuse it.

--------------------------------------------------

ANALYTICS

For the selected demo/event calculate:

registrationCount
confirmedCount
attendedCount
interestedCount
enrolledCount

Also calculate:

attendanceRate =
attended / registrations

enrollmentRate =
enrolled / attended

Handle divide-by-zero correctly.

--------------------------------------------------

MARKETING ATTRIBUTION

Preserve source information where available.

Examples:

Facebook
Instagram
Google
WhatsApp
Referral
Organic Website
Other

Also preserve campaign/UTM information if the existing registration
system already captures it.

Do not invent attribution when no source is known.

--------------------------------------------------

FUTURE CAPABILITY — DO NOT IMPLEMENT YET

Design so a later phase can support:

- automatic confirmation emails
- demo reminders
- post-demo nurturing
- SMS
- email templates
- enrollment links
- review requests
- referral requests
- customer lifetime-value tracking
- sibling opportunities
- birthdays/workshops/camps cross-sell

Do not implement these unless equivalent infrastructure already exists
and the change is trivial.

--------------------------------------------------

DOCUMENTATION

Update:

/docs/requirements.md
/docs/architecture.md
/docs/roadmap.md

Add the Demo Lead Tracker feature and clearly distinguish what is
implemented now versus planned later.

--------------------------------------------------

TESTING

Add tests for at least:

1. Registration creates one lead.
2. Updating registration does not duplicate a lead.
3. Status can be changed.
4. Attendance can be recorded.
5. Enrollment can be recorded.
6. Timeline event is created for important status changes.
7. Dashboard counts are accurate.
8. Rates handle zero registrations/attendance.
9. Existing registration functionality continues to work.

--------------------------------------------------

IMPORTANT

Do not begin coding immediately.

First respond with:

1. Current registration flow you found.
2. Existing files/components/services that can be reused.
3. Proposed data model.
4. Proposed API changes.
5. Proposed UI components/pages.
6. Files you expect to modify/create.
7. Any migrations required.

Keep the solution simple and consistent with the existing project.
```

### One change I strongly recommend

**Do not make the lead tracker depend only on Facebook leads.**

Your website registration should be the central record.

```text
Facebook ──────┐
Instagram ─────┤
Google ────────┤
WhatsApp ──────┼──> Registration → Lead Tracker
Referral ──────┤
Website ───────┘
```

That way, when you start running multiple demos, workshops, birthday events, Bricks Challenge, Smartivo and tutoring campaigns, you have **one place that tells you which marketing actually turns into students.**

This is the feature I would build next before adding more social-media automation.
