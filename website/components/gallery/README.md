# Kriana gallery

The first release features only the explicitly selected September 12 demo reel.
The source is `Young_Engineers_Kanata_Demo_Reel_28.25s_Music.mp4` in the workspace's
`demo/sept 12 2026/post demo social media/` folder. The published copy preserves
the music and full sequence, scaled to 720 × 1280 with H.264/AAC and MP4 fast start.
The poster is a frame at 8 seconds from that same reel.

The `/gallery` spotlight (`spotlight: true`) is "Bricks Challenge: Carousel in
Action", published at the owner's explicit request. Source: `Carousel BC.002.mp4`
(1920 × 1080, 31 s, 75 MB; kept outside `public/`). Web copy: 1280 × 720 H.264
CRF 27 (maxrate 1600k), AAC 112k, MP4 fast start, metadata stripped, ≈6 MB.
Poster is the frame at 20 seconds. Both videos use `preload="none"`, so nothing
downloads until the visitor presses play, and nothing autoplays.

The `/gallery` event highlight (`highlight: {...}`) is "October 2 Workshop
Highlights", shown first, right below the page heading, with its own copy and two
CTAs (regular classes → `/robotics`, next-workshop waitlist → `/events`). The Reel
was made only from media with parent photo consent (owner confirmed 2026-10-03).
Source: `Oct2_Workshop_Reel_v6_40.0s_Music.mp4` in the resources repo's
`Social Media/03 - Photos & Videos/oct 2 social media/oct 2 reel/v6/` (1080 × 1920,
40 s, 60 MB; kept outside `public/`). Music: `The Circuit Maker` (the
`The Circuit Maker [xtTZ2qfftRo].mp3` file in the same folder), the track mixed into
that render. Web copy: 720 × 1280 H.264 CRF 26 (maxrate 1400k), AAC 112k, MP4 fast
start, metadata stripped, ≈7 MB. Poster is the v6 cover photo without its text
(`reel-build/cards/cover-bg.jpg`, so the play overlay does not cover baked-in text)
at 720 × 1280.
`october-2-workshop-highlights-email.jpg` is a 720 × 1000 crop of that cover with a
play button drawn on, for the Reel follow-up email, which links to
`/gallery#october-2-workshop-highlights`. Only one entry should carry `highlight`;
move it to the next event's Reel when there is one.

`featured` picks the homepage/tutoring GalleryPreview (still the Sept 12 reel);
`spotlight` picks the video that leads `/gallery`. Other approved videos follow
below it as social proof.

`data/gallery.ts` is the central collection. `lib/gallery.server.ts` filters
strictly approved entries before the page or preview receives them. The owner's
explicit request to publish this specific reel authorizes its approval flag;
it does not approve any other files in the source folder.

## When photos arrive

- Curate and confirm approval for each image. Never scan/import a whole folder.
- Keep originals outside `public/`. Publish only resized, metadata-stripped web
  versions with neutral filenames in `public/images/gallery/`.
- Add `image` entries with dimensions, thumbnail, caption, categories and order.
  Missing or false `publicApproved` entries must never appear publicly.
- Add the photo grid below the featured video, replacing the coming-soon strip.
  Use the category definitions already in the collection and hide empty filters.
  Provide an accessible lightbox for photos; the current reel uses native inline
  video controls and fullscreen support.
- Use the same approved collection for homepage/tutoring previews and update
  their introductory copy as the media grows. Rebuild and deploy to publish.

Use a new versioned filename when replacing a published asset so browsers do not
keep a stale copy. Confirm playback, image cropping and loading on mobile.
