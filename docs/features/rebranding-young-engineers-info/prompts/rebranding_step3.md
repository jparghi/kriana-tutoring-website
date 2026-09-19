You are acting as a senior product designer, conversion-focused UX designer,
frontend developer and local education marketing specialist.

Redesign and improve the existing Kriana Tutoring robotics page:

/robotics

The page already exists and has a good structural foundation, but it currently
feels too plain, text-heavy and visually unfinished.

Do not rebuild the entire website or change the overall Kriana brand.

PRIMARY OBJECTIVE

Turn the robotics page into an exciting, polished and visually memorable
experience that communicates:

- Hands-on mechanical engineering
- Robotics and coding
- Building and experimentation
- Progressive learning
- Young Engineers program credibility
- Local availability in Kanata and Stittsville
- A simple path to registration or the launch list

The page must remain parent-friendly, trustworthy and professional. It should
feel exciting for children without becoming childish or resembling a
futuristic gaming website.

REFERENCE

Use the content organization of this page as inspiration:

https://kanata.youngengineers.org/enrichment-programs/

Do not copy its page design or large amounts of its written content.

The useful reference pattern is:

- Program image
- Program name
- Age or school stage
- Short explanation
- Learn More action

Kriana’s implementation must be more polished, easier to scan and visually
consistent with the existing Kriana website.

IMPORTANT PROGRAM ACCURACY RULE

Do not automatically publish every program shown on the worldwide or Kanata
Young Engineers website.

Only display programs that Kriana is licensed, approved and ready to promote.

Inspect the existing repository for confirmed program information. Create a
central program-data configuration so programs can be enabled or disabled.

Potential program names may include:

- Bricks Challenge
- Galileo Technic
- RoboBricks
- Robotics and Coding
- Advanced Robotics or OSC

These are examples only. Do not assume that every program is available.

Do not invent:

- Age ranges
- Lesson duration
- Number of lessons
- Prices
- Schedules
- Locations
- Curriculum claims
- Registration availability

If information is unconfirmed, omit it from the public UI and report what needs
business confirmation.

ASSETS

Use the newly supplied robotics images. Copy and rename them using appropriate
project conventions, preferably:

/public/images/robotics/robotics-hero.png
/public/images/robotics/build-test-improve.png
/public/images/robotics/robotics-tablet-coding.png
/public/images/robotics/robotics-success-banner.png

Asset assignments:

1. robotics-hero.png
   Use in the main hero.

2. build-test-improve.png
   Use in the hands-on engineering/story section.

3. robotics-tablet-coding.png
   Use in a coding-focused program card or coding section.

4. robotics-success-banner.png
   Use in the final registration or launch-list CTA.

Also inspect existing robotics images already available in the project. Reuse
the best ones for individual program cards instead of repeating the same image
on every card.

Do not stretch low-resolution images. Use responsive image handling, explicit
dimensions, proper object positioning and descriptive alt text.

PAGE STRUCTURE

Reorganize the page into this sequence:

1. Immersive robotics hero
2. Short hands-on learning introduction
3. Imagine → Build → Test → Improve → Code journey
4. Fancy Young Engineers program cards
5. Large visual engineering story
6. Dark, high-contrast skills section
7. Upcoming classes or launch-list section
8. Camps, parties and school-program opportunities
9. FAQ
10. Strong final registration CTA

TASK 1: REDESIGN THE HERO

The current hero has a large unused area on the right. Replace that empty area
with robotics-hero.png.

Use a two-part immersive composition:

- Left: headline, supporting text, location and CTAs
- Right: children actively building the robot
- On mobile: image should appear below the copy without awkward cropping

Suggested eyebrow:

YOUNG ENGINEERS AT KRIANA

Suggested heading:

Build. Code. Create Something Amazing.

Supporting copy:

Hands-on robotics, engineering and coding programs where children learn by
building, testing and bringing their ideas to life.

Location line:

Serving Kanata and Stittsville

If registration is not open, use:

Primary CTA:
Explore Programs

Secondary CTA:
Join the Launch List

If registration is genuinely open, use:

Primary CTA:
View Upcoming Classes

Secondary CTA:
Register Now

Do not show “Register Now” when no registration sessions are available.

Add only subtle mechanical visual details, such as:

- Faint gear outlines
- Blueprint grid treatment
- Small connecting lines
- Soft blue radial background
- Controlled red accent

Do not make these details compete with the children or headline.

TASK 2: ADD THE LEARNING JOURNEY

Create an attractive visual journey:

Imagine → Build → Test → Improve → Code

Each stage should have:

- A simple icon
- One short supporting sentence
- A connected visual path on desktop
- A stacked or horizontally scrollable accessible presentation on mobile

Example descriptions:

Imagine
Turn an idea or challenge into a possible design.

Build
Construct a working mechanical or robotic model.

Test
Observe how the model moves and responds.

Improve
Adjust gears, structures or code to make it work better.

Code
Use age-appropriate programming to control the creation.

Use these as direction, but adjust the wording to match confirmed program
curriculum.

Add subtle entrance motion only if the site already supports animation.

Respect prefers-reduced-motion.

TASK 3: CREATE A PREMIUM PROGRAM-CARD SYSTEM

Add a section with the heading:

Find the Right Engineering Challenge

Supporting copy:

Explore hands-on programs designed for different ages, interests and experience
levels.

Build a reusable ProgramCard component and a centralized program-data source.

Each program card must support:

- id
- slug
- name
- category
- shortDescription
- ageRange
- schoolStage
- duration
- experienceLevel
- skills
- image
- imageAlt
- themeColor
- availabilityStatus
- registrationUrl
- detailsUrl
- isPublished
- isFeatured

Only display optional values when they are confirmed.

CARD VISUAL DESIGN

Make the cards feel substantially more polished than ordinary white cards.

Each card should contain:

1. Large 16:10 image
2. Gradient overlay at the lower edge of the image
3. Category badge, such as:
   - Mechanics
   - Robotics
   - Coding
   - Advanced Engineering
4. Program name
5. Short two- or three-line parent-focused description
6. Confirmed information chips:
   - Ages
   - Lesson duration
   - Experience level
7. Two or three skill tags
8. Availability indicator:
   - Registration Open
   - Coming Soon
   - Join Interest List
9. Clear action:
   - Explore Program
   - View Details
   - Join the Launch List

Use theme variations:

- Bricks/mechanics: warm yellow or amber accent
- Advanced mechanics: red accent
- Robotics: blue accent
- Coding: navy or purple-blue accent

Keep the overall design within Kriana’s visual identity.

DESKTOP CARD LAYOUT

Use a responsive two-column grid.

If there is one especially important or introductory program, allow it to use
a featured card treatment spanning additional width, but do not create an
unbalanced layout.

Cards should have:

- Rounded corners consistent with the website
- Refined shadow
- Thin colored top or side accent
- Strong internal spacing
- Equal visual heights where practical
- Image zoom of approximately 1.03 on hover
- Small upward card movement on hover
- Arrow movement on the CTA
- Optional subtle gear rotation in a decorative icon

Keep animation restrained and professional.

MOBILE CARD LAYOUT

On mobile:

- Use one card per row
- Keep the full program name visible
- Do not hide essential information behind hover
- Keep tap targets at least 44px
- Avoid horizontal page overflow
- Prevent overly tall cards
- Preserve readable chips and buttons

Do not use an inaccessible carousel as the only way to discover programs.

TASK 4: PROGRAM DETAILS

The primary card action should open either:

- An existing individual program route
- A reusable program-details dialog/drawer
- A program section within /robotics

Choose the option that best fits the existing application architecture.

The details experience should support:

- Program overview
- What children build
- What children learn
- Recommended age or stage
- Experience requirements
- Confirmed schedule and location
- Registration or interest-list action

Do not make the user leave KrianaTutoring.com merely to understand a program.

The official Young Engineers website may appear as a secondary credibility
link, not the primary registration journey.

TASK 5: REPLACE THE PLAIN LEARNING CHECKLIST

Replace the existing simple “What Children Learn” checklist with a deep-navy,
high-contrast section.

Suggested heading:

Skills Built Through Every Challenge

Use six visual skill items:

- Engineering thinking
- Problem-solving
- Creativity
- Teamwork
- Mechanical understanding
- Coding and logical thinking

Each item should have:

- A clean line icon
- Short explanation
- Good contrast
- Spacious responsive layout

Avoid oversized icon circles or a generic feature-card appearance.

Use build-test-improve.png nearby or as an alternating image-and-content
section before this dark section.

TASK 6: FIX THE UPCOMING-PROGRAM EMPTY STATE

The existing page shows an empty “Upcoming Programs” section. This makes the
business appear inactive.

If sessions are available, show real session cards with:

- Program
- Age
- Location
- Dates
- Time
- Seats or registration status
- Price
- Registration action

If no sessions are available, replace the empty box with an attractive launch
panel:

Heading:

Robotics Classes Are Coming to Kanata and Stittsville

Copy:

Join the priority list to receive launch dates, registration announcements and
details about introductory sessions.

CTA:

Join the Robotics Launch List

Add a secondary text action:

Ask About School or Group Programs

Do not display fake schedules, prices or countdown timers.

TASK 7: ADD ADDITIONAL ROBOTICS EXPERIENCES

Add a visually compact three-card strip for:

- Camps and PA Days
- STEM Birthday Parties
- School and Community Programs

Each card should include:

- Existing relevant image
- One-sentence description
- Internal link or inquiry action

Do not let this section compete with the main enrichment programs.

TASK 8: FINAL CTA

Use robotics-success-banner.png for the final CTA.

The image has a darker, cleaner area intended for overlaid text.

Suggested content:

Ready to Build Their Next Big Idea?

Explore upcoming robotics programs or join the launch list for Kanata and
Stittsville.

Actions:

- Explore Programs
- Join the Launch List

Use a dark navy overlay where required for accessible contrast.

Do not cover important faces or robotics models with text.

TASK 9: VISUAL RHYTHM

The current page uses too many similar light sections.

Create stronger rhythm by alternating:

- Pale-blue immersive hero
- White introduction
- Light blueprint-style journey
- Soft grey/blue program-card area
- White image-and-story section
- Deep navy skills section
- Light launch panel
- Dark photographic final CTA

Do not use excessive gradients or decorative backgrounds.

TASK 10: NAVIGATION AND CUSTOMER JOURNEY

Ensure that:

- The main Robotics & Coding navigation item links to /robotics
- Homepage robotics links lead to /robotics
- Program cards remain inside the Kriana experience
- Registration links use the centralized booking configuration
- Young Engineers external links are secondary
- Parents are not sent back and forth between two websites

Preferred journey:

Homepage or marketing material
→ /robotics
→ Select a program
→ View details
→ Register or join launch list

TASK 11: CONTENT AND BRAND PROTECTION

Preserve:

- Kriana Tutoring as the primary local business
- Young Engineers as the official program provider
- Existing tutoring content and navigation
- Existing booking functionality
- Authentic business details
- Existing SEO value

Do not:

- Copy the Young Engineers page design
- Copy large passages from its website
- Publish unlicensed programs
- Invent curriculum information
- Invent registration availability
- Fabricate reviews or student results
- Download unauthorized logos or branded photos
- Use trademarked logos unless approved assets are already available
- Introduce humanoid or science-fiction robotics imagery
- Redesign unrelated pages

Recommended relationship wording:

Young Engineers Robotics & Coding
Offered locally by Kriana Tutoring

TASK 12: SEO AND ACCESSIBILITY

Update or verify:

Page title:
Robotics & Coding Classes in Kanata | Young Engineers at Kriana

Meta description:
Explore hands-on robotics, engineering and coding programs for children in
Kanata and Stittsville, offered locally by Kriana Tutoring.

Also verify:

- One clear H1
- Semantic heading order
- Image alt text
- Responsive image sizing
- Canonical URL
- Open Graph metadata
- Sitemap inclusion
- Breadcrumbs if supported
- Keyboard-accessible cards and dialogs
- Visible focus states
- Sufficient color contrast
- Reduced-motion support
- No horizontal mobile overflow

IMPLEMENTATION REQUIREMENTS

1. Inspect the current code and existing components first.
2. Reuse the project’s existing styling and component conventions.
3. Create reusable program and program-card components.
4. Keep program information in centralized data/configuration.
5. Avoid unnecessary dependencies.
6. Preserve existing routes and booking logic.
7. Ensure CTAs accurately reflect registration availability.
8. Run formatting, linting, type checking, tests and production build.
9. Fix issues introduced by this work.
10. Report pre-existing failures separately.

EXPECTED DELIVERABLES

At completion, report:

1. What made the original page feel too simple
2. Design and customer-journey changes implemented
3. Program cards created
4. Program data and configuration introduced
5. Images added and where each is used
6. Routes or dialogs created
7. Registration and launch-list behaviour
8. Responsive and accessibility validation
9. SEO changes
10. Files changed
11. Lint, type-check, test and build results
12. Program names, ages, durations or policies still requiring confirmation

SUCCESS CRITERIA

The redesign is successful when:

- The hero no longer looks half empty.
- The page immediately feels like hands-on robotics.
- Parents can compare programs easily.
- Program cards look premium and distinctive.
- Only locally approved programs are public.
- Registration and coming-soon states never contradict one another.
- Kriana owns the local customer journey.
- Young Engineers provides program credibility.
- The page works cleanly on desktop and mobile.