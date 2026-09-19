# Scene clips

The hero fetches its clips from here. They are not in the repository yet.

Hotlinking Higgsfield's CDN does not work: the artifact sandbox blocks that
origin, so both the video and the poster fail and the hero renders as bare
text. The files have to be served from the same place as the site.

## What to drop in

| File | What it is | Source |
|---|---|---|
| `wave.mp4` | Plays once on load. Holds still ~0.5s, waves, returns to the hub pose. | job `6d4ffc81-5326-46e9-aabf-671343174afb` |
| `idle.mp4` | Loops forever after the wave. Crossfade baked in, so a plain `loop` attribute is seamless. | job `472793d1-9f22-4ba9-b0b6-3187bd87ddc3`, then loop-baked |
| `hub.png` | The hub frame. Poster, and the whole hero on mobile and reduced motion. | generation `3f470988-9df8-4d61-98f6-e316d6f6ad9e` |
| `walk.mp4` | Not generated yet. | |

Download them from Higgsfield, put them here, then point `CLIPS` and `POSTER`
in `index.html` at `media/<name>` instead of the CDN.

Do not re-encode `idle.mp4`. Its loop is closed by a crossfade baked over the
first 15 frames, and a re-encode that trims or re-times frames will reopen the
seam. See `docs/hero-production-notes.md` for how it was built.
