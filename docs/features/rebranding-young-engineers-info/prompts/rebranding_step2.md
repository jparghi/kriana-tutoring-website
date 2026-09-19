You are acting as a senior UX designer, conversion strategist, local SEO specialist, and full-stack developer.

Update the existing Kriana Tutoring website to create a seamless customer journey for the new Young Engineers robotics and coding programs.

Website/project:
https://6a637582f9e9faafe9452f10--ye-krianatutoring.netlify.app/

Official Young Engineers reference site:
https://kanata.youngengineers.org/

STRATEGIC DECISION

Kriana Tutoring must own the local parent journey, marketing relationship, and registration entry point.

Young Engineers provides the specialized robotics curriculum, brand credibility, and supporting program information.

The primary robotics URL used on trifolds, QR codes, advertisements, social media, and other marketing materials will be:

https://krianatutoring.com/robotics

Parents must not be required to visit the Young Engineers website before registering.

REQUIRED CUSTOMER JOURNEY

Trifold, QR code, Google, social media, or referral
→ KrianaTutoring.com/robotics
→ Local program information
→ Register Now
→ Existing Kriana booking system

The Young Engineers website may be linked as an optional source for official program and curriculum information, but it must not interrupt the main registration journey.

TASK 1: ADD ROBOTICS TO THE MAIN NAVIGATION

Add a visible primary navigation item:

Robotics & Coding

It must link internally to:

/robotics

Recommended desktop navigation:

- Home
- Tutoring
- Robotics & Coding
- Programs
  - Camps & PA Days
  - Birthday Parties
  - School Programs
- About
- Contact
- Book/Register

If the current navigation structure or available screen width makes this exact arrangement impractical, preserve the existing visual system and create the clearest equivalent.

Requirements:

- Robotics & Coding must be easy to find.
- It must not be hidden inside a generic menu on desktop.
- Book/Register must remain visually prominent.
- The mobile menu must remain accessible and uncluttered.
- Do not link the primary Robotics & Coding navigation item directly to the external Young Engineers website.

TASK 2: CREATE THE /ROBOTICS LANDING PAGE

Create a polished, mobile-responsive page at:

/robotics

SEO focus:

Robotics and coding classes for children in Kanata and Stittsville

The page must feel like part of the Kriana Tutoring website while displaying the approved Young Engineers identity and credibility.

Use this brand relationship:

Young Engineers Robotics & Coding
Offered locally by Kriana Tutoring

An acceptable shorter phrase is:

Robotics programs powered by Young Engineers

Do not imply that Young Engineers owns or operates all Kriana services.

PAGE STRUCTURE

1. Hero section

Suggested heading:

Young Engineers Robotics & Coding in Kanata and Stittsville

Suggested supporting copy:

Hands-on engineering, building and age-appropriate coding programs that help children develop creativity, problem-solving skills and confidence.

Primary CTA:

View Upcoming Programs

Secondary CTA:

Register Now

Both CTAs should remain within the Kriana customer journey. If schedules are not yet available, use a clearly configurable registration or interest-list destination rather than inventing information.

Include:

- A suitable existing robotics image
- Kriana branding
- Approved Young Engineers branding, if the authorized asset already exists
- A clear “Serving Kanata and Stittsville” location signal

2. Program introduction

Explain that children learn through hands-on building, engineering challenges and coding activities.

Use only approved or verified Young Engineers curriculum information.

Do not invent program details, ages, prices, schedules or learning claims.

3. Program options

Create reusable, data-driven program cards or sections for the available Young Engineers programs.

Each program should support configurable fields for:

- Program name
- Short description
- Age range
- Schedule
- Duration
- Location
- Price
- Capacity
- Registration status
- Registration URL

If any value is not confirmed, omit it from the public interface or identify it clearly in configuration. Do not publish placeholders such as “$TBD” unless that treatment already matches the product’s content strategy.

4. What children learn

Present verified benefits, where applicable:

- Engineering thinking
- Problem-solving
- Creativity
- Teamwork
- Mechanical understanding
- Coding concepts
- Confidence through building and experimentation

Avoid guarantees and exaggerated claims.

5. How registration works

Show a short process:

Choose a program
→ Enter parent and child information
→ Complete payment or reservation
→ Receive confirmation

The main registration CTA must lead to the existing Kriana booking system or a centralized configurable registration URL.

Do not duplicate hardcoded booking URLs throughout the codebase.

6. Local program information

Provide a structured section that can display:

- Kanata/Stittsville service area
- Class location
- Upcoming dates
- Age group
- Class duration
- Number of sessions
- Capacity
- Price
- Availability

Only display confirmed values.

7. Young Engineers credibility

Add a concise section explaining that Kriana Tutoring is offering official Young Engineers programs locally.

Include an optional external link:

Learn About Young Engineers

Destination:
https://kanata.youngengineers.org/

The external link should open safely and must be visually secondary to the local registration CTA.

8. Additional offerings

Add internal calls to action for relevant services such as:

- Camps and PA Days
- STEM birthday parties
- School and community programs

Only link to routes that exist. If these pages do not yet exist, preserve a scalable implementation and report the missing destinations.

9. FAQ

Include useful questions such as:

- Does my child need previous robotics experience?
- What ages can participate?
- Are all building materials provided?
- Does my child need to bring a tablet?
- Where are classes held?
- What happens if my child misses a class?
- What are the cancellation and refund policies?
- Are birthday parties and school workshops available?

Use only verified answers. Do not invent policies.

10. Final CTA

End with a strong local call to action:

Find the Right Robotics Program

and/or:

Register Now

TASK 3: UPDATE HOMEPAGE LINKS

Audit every robotics-related link on the homepage.

Update these elements to lead to /robotics:

- The Robotics & Coding program card
- The hero’s “Explore Robotics & Coding” CTA
- Any Young Engineers promotional section whose primary purpose is local program discovery
- Relevant internal text links

Do not send these primary discovery links directly to /booking or to the external Young Engineers website.

The intended flow is:

Homepage
→ /robotics
→ Booking

TASK 4: ADD LOCATION MESSAGING

Add this line in an appropriate location near the homepage hero:

Serving families in Kanata and Stittsville

Keep the wording natural and visually integrated. Do not make it compete with the main headline.

TASK 5: UPDATE HOMEPAGE SEO

Review the existing metadata and update it to reflect the expanded services.

Suggested homepage title:

Kriana Tutoring | Tutoring, Robotics & STEM in Kanata

Suggested meta description:

Personalized tutoring, robotics, coding, camps and hands-on STEM programs for children in Kanata and Stittsville. Explore programs or register today.

Suggested robotics page title:

Robotics & Coding Classes in Kanata | Young Engineers at Kriana

Suggested robotics meta description:

Explore hands-on Young Engineers robotics, engineering and coding programs offered locally by Kriana Tutoring in Kanata and Stittsville.

Also implement or verify:

- Canonical URLs
- Open Graph metadata
- Heading hierarchy
- Internal links
- Image alt text
- Sitemap inclusion
- Breadcrumbs where appropriate
- LocalBusiness or EducationalOrganization structured data, where accurate
- Mobile responsiveness
- Page performance

Do not keyword-stuff the content.

TASK 6: CENTRALIZE BOOKING DESTINATIONS

Inspect the project for hardcoded booking and registration links.

Create or reuse a centralized configuration approach for:

- General booking URL
- Robotics registration URL
- Robotics interest-list URL, if needed
- Young Engineers external website URL
- School-program inquiry URL
- Birthday-party inquiry URL

Use the existing project conventions, environment variables or configuration files.

Do not change payment processing, booking business logic or database schemas as part of this task unless absolutely necessary.

TASK 7: PROTECT BRAND AND CONTENT ACCURACY

Preserve:

- Kriana Tutoring as the primary business name
- Existing Kriana logo and visual identity
- Existing tutoring content and URLs
- Authentic testimonials
- Current working booking functionality
- Existing SEO value

Do not:

- Rename the company to Kriana Learning Centre
- Migrate the website to kriana.ca
- Make Young Engineers the umbrella brand
- Fabricate testimonials, schedules, prices, age ranges or policies
- Copy large amounts of content from the Young Engineers website
- Download or fabricate trademarked assets
- Add unsupported partner or franchise claims
- redesign unrelated parts of the website

If an approved Young Engineers logo or program asset is missing, use a documented placeholder and report the exact file required.

TASK 8: ANALYTICS

If the site already has analytics, add or verify events for:

- Robotics navigation clicks
- Robotics card clicks
- Robotics hero CTA clicks
- Robotics page registration clicks
- Booking starts
- Outbound Young Engineers website clicks
- Successful registrations, if the existing booking flow supports this event

Do not add a new analytics provider without approval.

ACCESSIBILITY AND QUALITY

Ensure:

- Keyboard-accessible navigation
- Accessible dropdown and mobile menus
- Visible focus states
- Proper semantic headings
- Sufficient contrast
- Descriptive link and button labels
- Responsive images with dimensions
- No horizontal mobile overflow
- No broken links
- No console or hydration errors
- Existing tutoring workflows remain functional

IMPLEMENTATION PROCESS

1. Inspect the project architecture and existing routes.
2. Review the current header, homepage, booking links, metadata and reusable components.
3. Provide a concise implementation plan.
4. Implement the safe and clearly defined changes.
5. Reuse existing components and design conventions.
6. Keep program content data-driven and easy to update.
7. Run formatting, linting, type checking, tests and production build.
8. Fix problems introduced by this work.
9. Clearly distinguish any pre-existing failures from new failures.

EXPECTED DELIVERABLES

At completion, provide:

1. Audit summary
2. Implementation summary
3. Files changed
4. Routes created or updated
5. Homepage links changed
6. SEO changes
7. Centralized booking/configuration changes
8. Analytics changes
9. Tests and validation performed
10. Build, lint and type-check results
11. Missing business details or approved Young Engineers assets
12. Exact items requiring franchise confirmation

SUCCESS CRITERIA

The task is successful when:

- Robotics & Coding is visible in the main navigation.
- KrianaTutoring.com/robotics is the main robotics destination.
- Homepage robotics links lead to /robotics.
- The robotics page clearly explains the local Young Engineers offering.
- Parents can move from discovery to registration without unnecessary website switching.
- Young Engineers strengthens Kriana’s credibility without competing with the Kriana brand.
- The page is ready to be used as the destination for trifold materials and QR codes.

Start by auditing the existing project, then implement the changes.