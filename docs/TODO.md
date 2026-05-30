# Kriana Tutoring Website — TODO List

---

## 🎬 Animated Explainer (video-storyboard.tsx) — HIDDEN

**Status:** Built, hidden from site pending improvements  
**Location:** `website/components/video-storyboard.tsx`  
**Re-enable in:** `website/app/why-kriana/page.tsx` (uncomment VideoStoryboard import + usage)  
**Full scripts:** `STORYBOARD_SCRIPTS.md` in project root

### What's done
- 7-scene animated player with auto-advance, play/pause, scene dots
- CSS/SVG animations for all 7 scenes
- Browser speech synthesis voiceover with sentence-by-sentence pacing and pauses
- Subtitle captions overlaid on the animation
- Scene 7: Ottawa skyline, pulsing CTA button

### What needs improvement before going live

- [ ] **Scene 2 — Conveyor Belt**
  - Children figures need more personality (currently flat grey shapes)
  - Conveyor belt motion could be smoother
  - Consider adding a colour-desaturation CSS filter only on the children, not the whole scene
  - "SAME FOR ALL" machine could be more visually distinct

- [ ] **Scene 3 — Assessment**
  - Amber glow effect is subtle — increase contrast
  - Subject icons (Math/Reading/Writing) are small — scale up or use branded icons
  - Tutor/child figures could be more expressive

- [ ] **Scene 4 — Learning Plan**
  - Document unroll animation could be more dramatic
  - Path trace could use a brighter glow

- [ ] **Scene 6 — Confidence & Growth**
  - Star burst polygons are complex SVG — simplify or replace with cleaner shapes
  - Colour pop transition from grey to vibrant could be stronger

- [ ] **Audio / Voiceover**
  - Current: browser Web Speech API (robotic, varies by device)
  - Upgrade path: record a real voiceover using Voice Memos → upload 7 MP3 files
  - Or use ElevenLabs / Murf.ai to generate professional TTS from the scripts in STORYBOARD_SCRIPTS.md
  - Wire audio files into the player via `<audio>` element instead of SpeechSynthesis

- [ ] **Mobile layout**
  - Scene illustrations need responsive sizing review on small screens
  - Controls bar may be too cramped below 400px

- [ ] **Production video option**
  - Consider commissioning a real 60–90s animated video from Vyond / Animaker / Fiverr studio
  - Embed as `<video>` or YouTube iframe to replace the CSS animation
  - All scripts and storyboard are documented and ready in STORYBOARD_SCRIPTS.md

---

## 🌐 General Website

- [ ] Add `/why-kriana` to sitemap.ts (currently missing)
- [ ] Update page metadata descriptions for SEO across all pages
- [ ] Add structured data (JSON-LD) for LocalBusiness schema on homepage
- [ ] Review and update Google Business profile to match new "Personalized Learning" positioning

---

## 📋 Content

- [ ] Add real student success stories / before-after examples to testimonials
- [ ] Add more Google reviews as they come in (testimonial-carousel.tsx uses testimonials.json)
- [ ] Consider adding a "Meet Your Tutor" section to the About page or Why Kriana page
- [ ] Blog: write posts around the new "Kriana Learning Method™" positioning

---

## 🏗️ Future / Franchise Readiness

- [ ] Build a printable "Kriana Learning Method™" one-pager PDF for parent consultations
- [ ] Create a tutor onboarding guide based on the 6-step method
- [ ] Design a franchise operations manual template
- [ ] Build a student progress tracking dashboard (admin side)
