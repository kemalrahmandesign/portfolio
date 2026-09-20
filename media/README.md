# Scene clips

`index.html` loads everything in this directory by relative path. Nothing is
fetched from a CDN any more, which is the point: Higgsfield result URLs die when
a generation is deleted, and one already did. The walk clip the page pointed at
(`4d06b164`) returns HTTP 403 today.

## What goes here

Four files, these exact names. The player looks for them and nothing else.

| File | Size | What it is |
|---|---|---|
| `hub.jpg` | 0.21 MB | The hub frame. Poster, and the whole hero on mobile and reduced motion. |
| `wave.mp4` | 1.65 MB | Plays once on load. Holds still ~0.5s, waves, returns to the hub pose. |
| `idle.mp4` | 2.63 MB | Loops forever after the wave, crossfaded in the player. |
| `walk.mp4` | ~5 MB | The take: walk, sit, cat, push-in, monitor on. Not yet chosen. |

## Downloading them

The agent cannot do this. The result CDN is blocked from its container, and the
sandbox that *can* reach the CDN cannot write into the repo. So these are
downloaded by hand, on Kemal's machine, and committed.

These three are already re-encoded and ready. Save each under the name in the
table above:

- `hub.jpg`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/f215c1e8-2364-4cf0-a950-cb1851e8c8b4.jpg
- `wave.mp4`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/71520f4b-933c-4ed5-b321-b46e065e0535.mp4
- `idle.mp4`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/9b16a3ef-b3fe-441f-99e6-414ffac6f442.mp4

`walk.mp4` is pending the candidate choice. Once chosen it gets the same
treatment and a link is added here.

## Why they are re-encoded

The raw generations are 4.8 to 20 Mbps, which is 47 MB across the four files for
a page that streams them on every visit. Re-encoded at CRF 21, preset slow, with
`+faststart` so playback begins before the download finishes:

| | raw | CRF 21 |
|---|---|---|
| wave | 3.00 MB | 1.65 MB |
| idle | 16.42 MB | 2.63 MB |
| hub | 2.81 MB PNG | 0.21 MB JPEG |
| walk (measured on candidate A) | 24.96 MB | 5.56 MB |

Measured, not assumed, because two things here are load-bearing:

**No re-timing.** Frame counts and durations are identical across the encode
(wave 150/150, idle 300/300, both exactly 5.000s and 10.000s). The idle's loop
is closed by a crossfade *in the player*, not baked into the file, so what
matters is that no frame is dropped or retimed. None is.

**No luminance shift.** Against the originals, same mask and same frame numbers,
the re-encodes measure **+0.032** levels (wave) and **+0.042** levels (idle).
The `head` ramps survive intact: wave -2.17, idle -2.73, matching the -2.8 the
originals were measured at. So the `head` values in `index.html` still hold.

The hub frame is additionally cropped 2752x1536 -> 2730x1536 -> 1920x1080, which
is a centre crop to exactly 16:9. The browser was doing that crop at paint time
anyway via `object-fit: cover`; doing it in advance means the poster and the
clips are the same shape before compositing. Against the original PNG put
through the identical crop and scale, the JPEG is +0.033 levels.

Do not re-encode a second time from these files. Re-encode from the raw
generation if it is ever needed again.
