# Kriana gallery

The first release features only the explicitly selected September 12 demo reel.
The source is `Young_Engineers_Kanata_Demo_Reel_28.25s_Music.mp4` in the workspace's
`demo/sept 12 2026/post demo social media/` folder. The published copy preserves
the music and full sequence, scaled to 720 × 1280 with H.264/AAC and MP4 fast start.
The poster is a frame at 8 seconds from that same reel.

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
