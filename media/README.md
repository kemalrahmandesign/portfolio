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
| `wave.mp4` | 0.78 MB | 3s. Plays once on load: smiles, one quick wave, back to the hub pose. |
| `idle.mp4` | 2.63 MB | Loops forever after the wave, crossfaded in the player. |
| `walk.mp4` | 3.9 MB | The take: walk, sit, cat, push-in, monitor on. 24fps, 9.71s. |

## Downloading them

The agent cannot do this. The result CDN is blocked from its container, and the
sandbox that *can* reach the CDN cannot write into the repo. So these are
downloaded by hand, on Kemal's machine, and committed.

These three are already re-encoded and ready. Save each under the name in the
table above:

- `hub.jpg`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/f215c1e8-2364-4cf0-a950-cb1851e8c8b4.jpg
- `wave.mp4`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/2229135a-3e3c-4651-a827-66c8a7af5f4c.mp4
- `idle.mp4`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/9b16a3ef-b3fe-441f-99e6-414ffac6f442.mp4

- `walk.mp4`
  https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/f8373f35-e3dc-4469-9533-66738f840f3c.mp4

## Why they are re-encoded

The raw generations are 4.8 to 20 Mbps, which is 47 MB across the four files for
a page that streams them on every visit. Re-encoded at CRF 21, preset slow, with
`+faststart` so playback begins before the download finishes:

| | raw | CRF 21 |
|---|---|---|
| wave | 5.00 MB | 0.78 MB |
| idle | 16.42 MB | 2.63 MB |
| hub | 2.81 MB PNG | 0.21 MB JPEG |
| walk | 20.85 MB | 3.90 MB |

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


## The walk clip is a Genjutsu re-render, and that has consequences

Seven generations from the walk prompt produced one clean take. The rest
dissolved mid-shot, dropped the background props, or lost him from frame, and
the prompt was proven byte-identical across the last three, so the variation is
the model's seed rather than the text. Re-rolling was roughly a one-in-seven
draw.

The good take had one defect, a chair missing its left armrest. Rather than keep
re-rolling, that take was fixed in place with Genjutsu object replacement
(`hf_mult_replace_object`): the source video plus a generated reference image of
a correct chair. That preserved the camera move, the background and the absence
of a dissolve, and came back smoother than the source (2.2% duplicate frames
against 5.4%).

It is a re-render, not an overlay, so two properties changed:

**24fps, 9.71s** rather than 30fps, 10.00s. Nothing references either; the cover
handoff reads `duration` at runtime, and the monitor still blooms from 8.2s and
holds solid white to the end.

**About 7 luminance levels brighter.** Not corrected, on measurement. Both stage
layers carry `--clip-lift` 1.085, and the studio is 87% of the frame sitting at
221 against the idle's 218; both multiply past 255 and clip to white, so only
0.85% of studio pixels differ once composited. Correcting it would also pull the
final white panel away from `--bg`, which it currently matches more closely than
the original take did.

What the re-render did cost is the stitch. The original opened on the pinned hub
frame to within 3.1% of pixels; this one opens at 6.6%, and the residual is
concentrated on him: 47.7% of his pixels differ against the idle, where the
original managed 20.6%. That is a pose difference, so no filter removes it.

Two things follow, both in `index.html`:

- `head` is **0**. Frame 0 is the closest match to the hub pose and every later
  frame is worse as he turns away. The luminance rule that sets `head` for the
  other clips wanted frame 9; following it would have traded a visible pose jump
  for a 1.5-level dip that the crossfade hides anyway. **When a clip both opens
  dark and opens on a pose, the pose wins.**
- The idle-to-walk crossfade is **500ms**, not the 320ms used elsewhere, spent
  over the half second where he is turning away.

## There is a fallback, and it is not a substitute

`index.html` probes for `media/hub.jpg` once at boot. If it is missing, every
asset loads from the Higgsfield CDN instead, so the hero still runs against an
empty `media/`. Once the files are committed the fallback is never requested.

This exists because the files have to be downloaded and committed by hand, and
until that happens the page renders as bare text. It is a convenience for
previewing, not the plan. The whole reason the CDN references were removed is
that those URLs die: a deleted generation already took the walk clip down with
a 403 and broke the call to action on the deployed page.

The fallback URLs point at *uploaded* media rather than generation results, so
they are not garbage-collected along with a deleted generation, which makes
them steadier than what they replaced. Steadier is not durable. Commit the
files.

## The wave was regenerated shorter

The 5s wave was replaced with a 3s one, job
`d6974c93-3cf7-4790-ada6-4ba84737426f`. It was too long and read as surprised
rather than welcoming.

Measured against the clip it replaces:

| | old 5s | new 3s |
|---|---|---|
| hand up | ~0.5s | ~0.7s |
| wave peaks | 1.8s | 1.8-2.1s |
| settled by | still moving at 4s | 2.4s |
| last frame vs hub pose | 4.12% | **3.53%** |
| head | 0.11s | 0.067s |
| encoded | 1.65 MB | **0.78 MB** |

The prompt was written fresh rather than edited, since the original had been
deleted with its generation. It is about 780 characters against the walk
prompt's 3,399, because the pinned hub frame already guarantees his
appearance, the studio and the props, and a single wave is one beat.

For the expression, the wanted state is stated positively first (a calm, warm,
closed-mouth smile, eyes relaxed, brows level, greeting someone he already
knows) with the negatives after it. This document already records that a bare
prohibition still spends attention on the thing it forbids, so leading with
"not surprised" is a way to get a surprised face.