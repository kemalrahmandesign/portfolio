# The reel

`portfolio-reel.mp4` is the montage on the home page. The site plays the copies
in `media/` (`reel.mp4`, `reel.webm`, `reel-poster.jpg`); this file is the same
encode, kept here so it is easy to find.

1920x1080, 60fps, 15.18s, silent, and it loops without a seam: the first and
last frames are both the blank page colour (`#f1f0ee`), so the type that opens
it can arrive straight out of the type that closes it.

## The edit

Every project is cut into pieces and the pieces are interleaved, so the reel
keeps moving between projects and comes back to each one. Times are where each
shot starts.

| | Shot | Source | Into the next shot |
|---|---|---|---|
| 0.0s | "Selected work" over Vanta's window opening on the GT3 RS | `luxury-clipA` 0-1.3s | Type is drawn in difference, so it flips white as the black window grows under it |
| 1.2s | Loco Exotics, the name landing | `loco-clip1` at 1.6x | Hard cut, car to car |
| 1.8s | Flowerbx, "Everything in season" | `flowerdemo` at 2x | Hard cut |
| 2.3s | Osmosis, first half: dive into the hero | `osmosis` 0.45-1.6s at 2.25x | Digital zoom into the hero, motion blurred |
| 2.8s | G-Force on the iPhone, pulled back out of the dive | 3D render | Whip pan left |
| 4.0s | Vanta, side profile into x-ray | `luxury-clipC` 0.1-1.1s | Hard cut on the punch |
| 5.1s | Loco, the service gear, then into its dark centre | `loco-clip2` 0.1-1.85s | Out of the dark |
| 6.1s | Polaris on the MacBook Pro: half spin, lid opens, push into the screen | 3D render | The push ends with the screen exactly filling the frame |
| 8.1s | Polaris screenshot, still pushing, straight into "trade" | `polaris.png` | "Track and **trade** everything" becomes "Discover and **trade** TIA" |
| 8.4s | Osmosis, second half: TIA to DYDX, the swap card, Akash | `osmosis` 1.95-4.75s at 2x | Bloom to white |
| 9.8s | Flowerbx, close on the ranunculus | `flowerdemo` 1.8-3.0s | Hard cut to black |
| 10.8s | Vanta, the name | `luxury-clipA` 1.4-1.97s | Hard cut |
| 11.4s | Loco, rotor and caliper, then a push into the disc | `loco-clip2` 1.93-3.15s | Match cut: the rotor becomes Vanta's x-ray wheel and pulls out |
| 12.4s | Vanta x-ray, "ONE CAR. EVERY DISCIPLINE." | `luxury-clipC` 0.95-2.27s | Page colour wipes up |
| 13.4s | "One designer. Every *discipline*." and the signature | type | Type leaves, page is blank, loop |

Project labels (name, then a mono line saying what it is) sit bottom left on
the longer shots. Everything that has to be read stays inside the middle 80%,
because the site shows the reel with `object-fit: cover` and crops the sides
on anything narrower than 16:9.

The two 3D shots were rendered for this edit at 60fps rather than reused: the
iPhone pull-back starts close so it can catch the dive out of Osmosis, and the
MacBook push ends on a calibrated pose where the screenshot sits at exactly
(-23, -96, 1966x1272), which is what lets the flat screenshot take over with
no visible cut.

## Rebuilding it

Everything that made it is in `src/`. It is a canvas compositor
(`montage.html`) that draws each frame from the shot list, rendered frame by
frame in headless Chromium (`montrender.mjs`), then encoded with ffmpeg.

1. Work in a scratch directory with `three@0.170` and `playwright` installed,
   containing everything in `src/`, and serve it on port 8123
   (`npx http-server -p 8123 -c-1 .`).
2. Extract the clips in `incoming/` to 60fps frames under `mont/src/<KEY>/0001.jpg`:
   `VA` luxury-clipA, `VC` luxury-clipC, `LA` loco-clip1, `LB` loco-clip2,
   `FL` flowerdemo, `OS` osmosis.
   `ffmpeg -i in.mp4 -vsync 0 -q:v 3 mont/src/VA/%04d.jpg`
3. Extract `incoming/gforce-app-recording.mp4` to `frames/001.jpg...` (the
   iPhone screen), then render the 3D shots:
   `node gf60.mjs 1920 1080 mont/gf` and `node pm60.mjs 1920 1080 mont/pm`.
4. `node montrender.mjs mont/full`, then encode:

```bash
ffmpeg -framerate 60 -i mont/full/%04d.jpg -c:v libx264 -preset slow -crf 21 \
  -profile:v high -pix_fmt yuv420p -movflags +faststart -an reel.mp4
ffmpeg -framerate 60 -i mont/full/%04d.jpg -c:v libvpx-vp9 -crf 34 -b:v 0 \
  -row-mt 1 -pix_fmt yuv420p -an reel.webm
```

Shot timing, speed ramps, transitions and labels are all in the `SHOTS`,
`LABELS` and `WARP` tables at the top of `montage.html`. `WARP` plays a stretch
of the edit faster without touching the shot list: the G-Force settle and the
MacBook spin both run at 1.3x through it.

## Credits

- iPhone: "Apple iPhone 15 Pro Max Black" by polyman, Sketchfab, CC-BY-4.0
- MacBook Pro: "macbook pro M3 16 inch 2024" by jackbaeten, Sketchfab, CC-BY-4.0
