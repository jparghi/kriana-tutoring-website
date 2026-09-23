# Kriana Tutoring — Demo Lead Tracker Feature

I want you to build a new **Demo Lead Tracker** feature inside the existing Kriana Tutoring project.

The purpose is to automatically capture and manage a lead whenever a parent registers for a demo, workshop, robotics session, or similar event.

This should be a lightweight lead-management system designed specifically for Kriana Tutoring / Young Engineers.

Do **not** build a generic enterprise CRM.

---

# 1. BEFORE WRITING CODE

First inspect the existing project completely.

Read all relevant project documentation, especially anything under:

```text
/docs
```

If these files exist, treat them as the current source of truth:

```text
/docs/architecture.md
/docs/requirements.md
/docs/roadmap.md
```

Also inspect:

* existing demo registration flow
* registration database/domain model
* API endpoints
* admin portal
* authentication/authorization
* email handling
* current dashboard/admin navigation
* existing UI components
* database migration strategy
* testing conventions

Do not start coding immediately.

First give me:

1. Current demo registration flow you found.
2. Database entities/models currently involved.
3. APIs currently involved.
4. Existing admin pages/components that can be reused.
5. Proposed architecture for the Lead Tracker.
6. Proposed data model.
7. Proposed API changes.
8. Proposed UI pages/components.
9. Database migrations required.
10. Files you expect to create.
11. Files you expect to modify.
12. Risks or conflicts with the existing registration implementation.

Keep the implementation consistent with the current application architecture.

---

# 2. BUSINESS OBJECTIVE

Use this lifecycle:

```text
Prospect
   ↓
Lead
   ↓
Nurture
   ↓
Customer
   ↓
Advocate
```

A visitor becomes a **Lead** once a valid demo/workshop registration is submitted.

The immediate goal is to track:

```text
Marketing Source
      ↓
Registration
      ↓
Demo Confirmation
      ↓
Attendance
      ↓
Interest
      ↓
Follow-up
      ↓
Enrollment
```

This feature should help answer:

* How many people registered?
* Where did they come from?
* Who attended?
* Who did not attend?
* Who is interested?
* Who needs follow-up?
* Who enrolled?
* Which campaign/source creates paying students?

---

# 3. CORE FUNCTIONAL REQUIREMENT

Whenever a valid demo registration is successfully created, automatically create or update a corresponding Lead.

Conceptually:

```text
Registration Created
        ↓
Create / Update Lead
        ↓
Status = NEW
        ↓
Create Timeline Activity
```

Use the project's architecture and naming conventions.

Do not force the exact method name below, but conceptually the feature should support:

```text
createLeadFromRegistration(registration)
```

The existing registration flow must continue to work.

Lead tracking must not accidentally break successful registration.

---

# 4. LEAD DATA MODEL

Create an appropriate Lead domain/entity/model.

Prefer relationships instead of unnecessarily duplicating registration information.

Suggested data:

```text
Lead
--------------------------------
id

registrationId
eventId

parentName
parentEmail
parentPhone

childName
childAge
childGrade

interestedProgram

leadSource
campaign
utmSource
utmMedium
utmCampaign

status

attendanceStatus

nextAction
followUpAt

enrollmentOutcome

createdAt
updatedAt
```

Use existing parent/child/registration entities when those already exist.

Do not duplicate information if the application already has a proper relationship.

---

# 5. LEAD STATUS

Use a controlled lifecycle.

Suggested statuses:

```text
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
```

Do not introduce complicated lead scoring in Version 1.

---

# 6. ATTENDANCE

Attendance must be tracked separately where appropriate.

Examples:

```text
PENDING
ATTENDED
NO_SHOW
```

Admin should be able to easily mark:

```text
Mark Attended
Mark No Show
```

Updating attendance should also generate an activity timeline record.

Example:

```text
Demo attended
October 2, 2026 — 11:05 AM
```

---

# 7. LEAD SOURCE / MARKETING ATTRIBUTION

Preserve the marketing source whenever available.

Supported examples:

```text
Facebook
Instagram
Google
WhatsApp
Referral
Organic Website
Direct
Other
Unknown
```

Also preserve existing UTM/campaign information when available:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Do not invent marketing attribution.

If the source cannot be determined:

```text
Unknown
```

is acceptable.

---

# 8. DUPLICATE PREVENTION

Do not create duplicate Leads when the same registration is modified.

The strongest relationship should normally be:

```text
registrationId
```

One registration should correspond to one Lead unless the existing application architecture provides a better model.

Use:

* unique constraint where appropriate
* idempotent service logic
* transactional consistency where appropriate

Updating a registration should update the existing Lead rather than creating another one.

---

# 9. LEAD TRACKER PAGE

Add an Admin page:

```text
Demo Lead Tracker
```

The page should show summary metrics at the top.

Example:

```text
---------------------------------------------------------
 Registrations     Confirmed     Attended     Enrolled
      18               15            12            5
---------------------------------------------------------
```

Also include:

```text
Interested
Follow-up Needed
No Shows
```

where appropriate.

---

# 10. LEAD TABLE

Create a searchable and filterable lead table.

Columns:

```text
Parent
Child
Age / Grade
Program
Demo / Event
Registration Date
Lead Source
Status
Attendance
Next Action
Follow-up Date
```

Actions may include:

```text
View Lead
Mark Attended
Mark No Show
Mark Interested
Mark Enrolled
Add Follow-up
```

Do not overload the table with too many buttons.

Prefer opening the Lead Detail page/drawer for more advanced actions.

---

# 11. FILTERING

Provide useful filters:

```text
Demo / Event
Program
Lead Status
Attendance
Lead Source
Follow-up Status
```

Also provide search.

Search should ideally support:

```text
Parent name
Child name
Email
Phone
Registration ID
```

---

# 12. LEAD DETAIL VIEW

When the administrator clicks a lead, display a detailed view.

Example structure:

```text
Sarah Mitchell

Child
Jacob Mitchell
Age 8
Grade 3

Program
Bricks Challenge

Demo
October 2, 2026
5:30 PM

Status
INTERESTED

Source
Facebook

Campaign
October Robotics Demo

Next Action
Call parent

Follow-up
October 3, 2026
```

Provide actions such as:

```text
Edit Status
Mark Attended
Mark No Show
Mark Interested
Mark Enrolled
Set Follow-up
Add Note
```

---

# 13. ACTIVITY TIMELINE

Every Lead should have an activity timeline.

Examples:

```text
Registration received

Confirmation email sent

Status changed:
NEW → CONFIRMED

Reminder sent

Demo attended

Status changed:
ATTENDED → INTERESTED

Follow-up scheduled

Parent contacted

Marked enrolled
```

Create an appropriate model such as:

```text
LeadActivity
```

Possible fields:

```text
id
leadId
activityType
description
metadata
createdAt
createdBy
```

Adapt this to existing architecture.

Important status changes and admin actions should create timeline entries.

---

# 14. NOTES

Admin should be able to add notes.

Example:

```text
Parent liked Bricks Challenge.

Child was very engaged with the motorized model.

Parent wants Wednesday class.

Follow up after speaking with spouse.
```

Notes should include:

```text
createdAt
createdBy
```

Use a separate notes model if appropriate.

---

# 15. NEXT ACTION

Every active Lead should optionally have:

```text
nextAction
followUpAt
```

Examples:

```text
Call parent
Send pricing
Send registration link
Send Bricks Challenge details
Follow up Monday
Book trial
No action required
```

On the Lead Tracker page, overdue follow-ups should be easy to notice.

Example categories:

```text
Overdue
Today
Upcoming
No Follow-up
```

Do not create aggressive automated reminders yet unless existing infrastructure already supports them cleanly.

---

# 16. MARK ENROLLED

Admin should be able to mark a Lead as:

```text
ENROLLED
```

Record information such as:

```text
enrolledAt
program
package
```

if those concepts already exist.

Do not build the full student/customer-management system as part of this feature.

The important thing for Version 1 is:

```text
Lead → Enrolled
```

and preserving that conversion information for marketing analytics.

---

# 17. EVENT-LEVEL ANALYTICS

For every demo/workshop/event calculate:

```text
registrationCount
confirmedCount
attendedCount
noShowCount
interestedCount
followUpNeededCount
enrolledCount
```

Also calculate:

```text
attendanceRate =
attended / registrations

interestRate =
interested / attended

enrollmentRate =
enrolled / attended
```

Handle divide-by-zero safely.

Example:

```text
0 registrations = 0%
0 attendees = 0%
```

---

# 18. MARKETING SOURCE ANALYTICS

Allow us to understand performance by source.

Example:

```text
Source          Leads    Attended    Enrolled
------------------------------------------------
Facebook          20        15           7
Instagram          6         5           2
Referral           4         4           3
WhatsApp           3         3           2
Organic            5         3           1
```

Do not add complicated analytics libraries if the project does not need them.

Simple aggregation APIs/queries are sufficient initially.

---

# 19. DASHBOARD EXPERIENCE

The Lead Tracker should make the most important leads obvious.

Examples:

```text
FOLLOW UP TODAY

Sarah M.
Bricks Challenge
Demo attended yesterday
Interested
Call today
```

```text
OVERDUE FOLLOW-UP

John D.
Smartivo
Follow-up was due 2 days ago
```

```text
NEW REGISTRATIONS

3 registrations received today
```

Keep it useful rather than visually complicated.

---

# 20. REGISTRATION INTEGRATION

Find the current registration creation flow.

Only after a registration has successfully been persisted should Lead creation occur.

Conceptually:

```text
registrationService.createRegistration()
        ↓
registration saved
        ↓
leadService.createOrUpdateFromRegistration()
```

Use the architecture that best fits the existing application.

Important requirements:

* do not create Lead before registration succeeds
* avoid duplicate Lead
* preserve transaction consistency
* do not silently corrupt registration if Lead creation fails
* log recoverable failures appropriately
* follow existing application's error-handling patterns

---

# 21. CONFIRMATION EMAIL TRACKING

If the application already sends a confirmation email after registration, connect that action to the Lead timeline.

Example:

```text
Registration created
       ↓
Lead created
       ↓
Confirmation email sent
       ↓
Activity:
CONFIRMATION_EMAIL_SENT
```

Do not redesign the entire email subsystem.

Reuse existing email infrastructure.

---

# 22. FUTURE EMAIL AUTOMATION

Design for these future capabilities but DO NOT fully implement them yet:

```text
Registration
    ↓
Immediate confirmation email

1 day before demo
    ↓
Reminder email/SMS

After attendance
    ↓
Thank-you message

1 day later
    ↓
Enrollment follow-up

3 days later
    ↓
Reminder

7 days later
    ↓
Final nurture message
```

Future email content may include:

```text
https://krianatutoring.com/gallery

https://krianatutoring.com/robotics
```

But Version 1 should focus mainly on tracking and admin workflow.

---

# 23. NO-SHOW FLOW

Support:

```text
Registered
    ↓
NO_SHOW
```

Then admin can set:

```text
Next Action:
Invite to next demo
```

Future automation may send:

```text
Sorry we missed you.

Would you like to attend our next demo?
```

Do not build the full automated no-show campaign yet.

---

# 24. CUSTOMER / ADVOCATE FUTURE DESIGN

Do not implement this now, but design Lead data so that later we can support:

```text
Lead
 ↓
Customer
 ↓
Repeat Customer
 ↓
Advocate
```

Future capabilities could include:

```text
Review requested
Review received
Referral requested
Referral received

Sibling opportunity
Birthday opportunity
Summer camp
Winter camp
Workshop
Robotics upgrade
Tutoring cross-sell
```

Again, do not build these now.

Just avoid architectural decisions that would block them.

---

# 25. VERSION 1 SCOPE

Implement only the MVP.

Version 1 should include:

```text
1. Registration automatically creates Lead.

2. No duplicate Lead for the same registration.

3. Demo Lead Tracker admin page.

4. Lead table.

5. Filtering and search.

6. Lead detail.

7. Lead status.

8. Attendance.

9. Next action.

10. Follow-up date.

11. Notes.

12. Activity timeline.

13. Enrollment status.

14. Lead source / campaign.

15. Event-level metrics.

16. Basic source/conversion analytics.
```

---

# 26. DO NOT IMPLEMENT YET

Do NOT build these unless the application already contains infrastructure where adding them is trivial:

```text
SMS automation

Complex drip campaigns

AI lead scoring

WhatsApp API automation

Automatic phone calling

Complex CRM pipelines

Customer lifetime value engine

Referral automation

Review automation

Birthday marketing

Camp cross-selling

Full student management

Payment processing changes

Facebook API integration

Instagram API integration
```

These are later phases.

---

# 27. DATABASE MIGRATION

Use the project's existing database migration strategy.

Possible new tables may include:

```text
leads

lead_activities

lead_notes
```

But inspect the current architecture first.

Do not automatically introduce three tables if the existing design allows a cleaner solution.

Add:

* primary keys
* foreign keys
* indexes
* unique constraints
* created/updated timestamps

where appropriate.

Pay special attention to indexing:

```text
registrationId
eventId
status
followUpAt
leadSource
```

---

# 28. API DESIGN

Follow existing API conventions.

Potential endpoints could conceptually include:

```text
GET    /api/admin/leads

GET    /api/admin/leads/{id}

PATCH  /api/admin/leads/{id}

POST   /api/admin/leads/{id}/activities

POST   /api/admin/leads/{id}/notes

POST   /api/admin/leads/{id}/attendance

POST   /api/admin/leads/{id}/enroll

GET    /api/admin/leads/metrics

GET    /api/admin/events/{eventId}/lead-metrics
```

These are examples.

Do not blindly implement this endpoint structure if the application already follows another pattern.

Follow the project's conventions.

---

# 29. SECURITY

The Lead Tracker contains parent/child information.

Use the existing admin authorization model.

Do not expose Lead endpoints publicly.

Ensure:

```text
Admin authentication required
Appropriate authorization
Server-side access control
```

Do not rely only on hiding UI routes.

---

# 30. TESTING

Add meaningful tests.

At minimum test:

### Registration

```text
Registration creates exactly one Lead.
```

### Duplicate prevention

```text
Updating registration does not create another Lead.
```

### Status

```text
Lead status can change correctly.
```

### Attendance

```text
Admin can mark attended.

Admin can mark no-show.
```

### Timeline

```text
Important actions create LeadActivity records.
```

### Notes

```text
Admin can create notes.
```

### Follow-up

```text
nextAction and followUpAt can be updated.
```

### Enrollment

```text
Lead can be marked ENROLLED.
```

### Analytics

Validate:

```text
registrationCount
attendedCount
interestedCount
enrolledCount
attendanceRate
enrollmentRate
```

### Edge cases

```text
0 registrations

0 attendees

missing marketing source

missing phone

missing optional data
```

### Regression

Existing demo registration must continue to work.

---

# 31. UI QUALITY

Reuse existing design system/components.

Keep the page professional, clean and operational.

The administrator should be able to answer within seconds:

```text
Who registered?

Who is attending?

Who attended?

Who needs follow-up?

Who enrolled?
```

Avoid unnecessarily complex charts.

Prioritize:

```text
Status
Next Action
Follow-up
Conversion
```

---

# 32. DOCUMENTATION

Update the project documentation.

Update as appropriate:

```text
/docs/requirements.md
/docs/architecture.md
/docs/roadmap.md
```

Document:

```text
Demo Lead Tracker

Registration → Lead integration

Lead lifecycle

Lead status definitions

Lead activity timeline

Marketing attribution

Analytics

Version 1 scope

Future phases
```

Clearly distinguish:

```text
IMPLEMENTED NOW

vs

PLANNED / FUTURE
```

---

# 33. IMPLEMENTATION APPROACH

After you provide your initial analysis and I approve the approach, implement incrementally.

Suggested order:

```text
Phase 1
Domain/database model

Phase 2
Registration → Lead integration

Phase 3
Lead APIs/services

Phase 4
Lead Tracker table

Phase 5
Lead Detail + Timeline

Phase 6
Attendance + Follow-up + Enrollment

Phase 7
Dashboard metrics

Phase 8
Tests

Phase 9
Documentation
```

Keep the application runnable after each logical phase.

Do not rewrite unrelated parts of the system.

---

# 34. FINAL VALIDATION

Before considering the feature complete:

Run the application's normal:

```text
build
tests
lint
type checking
```

Fix failures introduced by this feature.

Then manually verify this workflow:

```text
Create demo registration
      ↓
Lead appears automatically
      ↓
Open Lead
      ↓
Mark confirmed
      ↓
Mark attended
      ↓
Mark interested
      ↓
Add:
Call parent tomorrow
      ↓
Set follow-up date
      ↓
Add note
      ↓
Mark enrolled
      ↓
Dashboard metrics update correctly
```

---

# 35. IMPORTANT IMPLEMENTATION RULES

Follow these rules throughout the work:

1. Read the existing code before designing replacements.
2. Reuse existing registration functionality.
3. Reuse existing admin components.
4. Reuse existing authentication.
5. Reuse existing email infrastructure.
6. Follow existing naming conventions.
7. Follow existing architecture.
8. Keep the design simple.
9. Avoid premature abstractions.
10. Do not build a generic CRM.
11. Do not add unnecessary dependencies.
12. Preserve current functionality.
13. Add tests for important behavior.
14. Update documentation.
15. Keep future automation possible without implementing it now.

---

# FIRST RESPONSE REQUIRED

Do NOT code yet.

Your first response must contain:

## A. Existing System

Explain the current registration flow you discovered.

## B. Reusable Components

List existing:

* entities
* services
* repositories
* APIs
* admin components
* email components

that should be reused.

## C. Proposed Architecture

Explain where Lead tracking fits into the current application.

## D. Proposed Database Model

Show proposed entities/tables and relationships.

## E. Proposed Registration Integration

Explain exactly where:

```text
Registration → Lead
```

will happen.

## F. Proposed APIs

List APIs or service operations required.

## G. Proposed UI

Show the planned pages/components.

## H. File Changes

Separate into:

```text
Files to create

Files to modify
```

## I. Migration

Explain required database migration.

## J. Implementation Sequence

Give the safest implementation order.

Stop after presenting this plan and wait for approval before implementing the feature.
