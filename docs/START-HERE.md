# Start here

Picking this up cold? Read this file top to bottom, then `BACKLOG.md`. The
**Next up** section below is where the last session stopped, mid-conversation,
with a plan Kemal had agreed to and was waiting to see built.

`hero-production-notes.md` (2500 lines) is the full reasoning behind every
decision, appended in order. Search it; do not read it end to end.

## What this is

Kemal Rahman's portfolio. One file, `index.html`, vanilla HTML, CSS and JS, no
build step and no framework. That is deliberate: see "Do not" below.

**The hero:** a stylised 3D cartoon Kemal stands in a white studio among his
hobbies (motorcycle, skis, guitar and amp, skateboard, football). He waves while
the masthead animates in, then idles. The "Come on in" call to action sends him
walking to his desk in one continuous take; he sits, his cat Nova settles on the
PC, the camera pushes into the monitor, it powers on white, and the rest of the
site is underneath.

**Behind the monitor**, in scroll order: About, Experience, the montage (Work),
four case study images, Contact. A face menu (his cartoon head, centred at the
top) appears only once inside the monitor.

Live: **https://kemalrahmandesign.github.io/portfolio/**
Deploy = merge into `claude/portfolio-hero-brainstorm-oonxku` and push. Session 4
developed on `claude/magical-davinci-0ntnlw`; both are in step.

## Next up: motion design for the second scene

Kemal wants the sections behind the monitor to move like a reference reel he
sent: a 15s motion-graphics piece made with Claude (source:
`https://cdn.revid.ai/static/claude-motion-graphics/stephanlivera-2103315922098470926.mp4`,
also imported to Higgsfield as media `9c699afa-7053-4c3c-b4a6-7a4e6f99b733`).
**Not committed here; it is someone else's work.** If you need to see it, ask
Kemal to drop the file into the chat, which is how the last session saw it.

**Decided:** the motion, **not the colour**. The reel runs on saturated flat
fields (black, coral `#ee4938`, cream, electric blue `#2e2ef4`, lime `#c9f13d`).
Kemal wants it on his black and white only. Do not reintroduce colour: a coral
accent on the About section was rejected hard one session earlier.

**Decided:** no Higgsfield. It is all code: SVG, canvas, a little three.js,
timelines in GSAP (`npm` works here; CDNs like jsdelivr do not, so vendor any
library into the repo, as was done for three.js before it was removed).

**What is in the reel, beat by beat, and the agreed home for each:**

| Reel beat | Site section |
|---|---|
| **Easing race.** "Six ways to get from A to B": six rows, each a dot shooting along a line on a different curve (linear, ease-in-out, expo-out, back-out, elastic, bounce), with motion-blur smears and a curve glyph at the start of each row | **Experience.** Each role a row; a dot travels across its dates as the row scrolls in. The best fit in the reel. **Build this first** as the proof of the direction. |
| **Kinetic type.** "EASE IN. EASE OUT. NEVER LINEAR." One word per beat, huge, stretch and squash on entry; outlined repeats of a word scrolling in rows behind the solid one | **About.** The paragraph arrives phrase by phrase with that snap. |
| **Shape morphing.** Circle to triangle to star to square, a ring of small markers orbiting, faint construction lines | **Case studies.** Each image reveals through a shape that morphs open into its rounded frame. |
| **Truchet field and dot grid.** A full-frame maze of quarter-circle tiles with a wave rippling through it; then a perspective dot grid and a dotted wireframe blob morphing sphere, vase, torus | **Montage.** The field the reel grows out of, instead of the flat grey box. |
| **Starburst and lockup.** Dot, ring, then a spinning burst of rays; the name lockup with particles drifting | **Contact.** The sign-off. |

**The chrome** is half of why it reads as a reel: corner brackets, tiny
monospace labels top and bottom, a running timecode, a thin progress line. On
the site: a quiet frame around each section that ticks as you scroll.

**Session 4, launch pass (latest).** The CTA now reads "Come on in" (was
"Cool Sh*t"). Props: no clicking (the sheet is gone; they are divs now, hover
and focus only), inert and unlabelled while the take plays, every hotspot
reaches 18px past its drawn box via `::after` (the PROPS numbers are
untouched since they also steer the arrows; **Kemal still wants to recalibrate
the squiggles himself with `?props`**). Fast forward is just a muted 30px
double-play icon. Montage: ends at 95% width x 80% height, fully grown when
the section is 95% of the way up, one screen tall (no pinned hold), and
"Things I've made" is pulled up under it so the title peeks. Case order:
Osmosis, Loco, Polaris, and the "next story" chain follows it. Email is
kemalrahmandesign@gmail.com (FormSubmit will email an **activation link to that
address on the first submission**). Footer: "supervised by Nova the cat". Roles:
Osmosis and Polaris were two designers (his boss, the lead, and him); Polaris
was a new concept start to finish; Loco and current work are end-to-end design
and dev. The Osmosis card has no film (none exists anywhere reachable): it
crossfades three product screens. Case pages drop the black wall on any menu
choice and the main site starts under it (`sessionStorage.wallIn`, `html.wall-in`).
**Still open before sharing:** the four social trinkets still link to `#`.

**Session 4, seventh pass.** Cursor link state, third attempt: Kemal
wanted no bounce and it looked pixelated (a transform-scaled SVG on a promoted
layer is upscaled from a bitmap). It is now 24px to 30px by real width/height
with a plain 160ms ease, so it stays sharp. Never scale the cursor by transform. Nav
pills no longer tilt: each fills with a black blob that grows from the point
the pointer crossed the edge and drains toward where it left (`.bl`, `--bx/--by`
set from the pointer; same on the case pages).

**Session 4, sixth pass.** Case pages now carry the same face menu
(`work/case.css`+`case.js`; links go to `../index.html#section`, and the main
page treats a section hash as a deep link that skips the greeting). Loco page
opens on a full-window scrubbed hero with the site's own lockup; the
storyboard is two frames over three, each carrying the site's real text
(cycling beats for the services and reviews). Polaris is described as what it
is, a token portal / aggregator (Osmosis Labs, Sept 2024); Toyota/Lexus was an
analogy for the assistant and must never appear on the site. Nav: the face has
a hover state and a "home" tag, pills fill black and the others dim. Cursor:
a spring-loaded link state (arrow tips, ring blooms); disabled cards say
"soon". Hero tagline is Instrument Serif italic. Tests: `tests/pages.js`.

**Session 4, fifth pass.** Desktop menu: no home pill (the face
is home), pills fly out two left and two right of the face at equal widths;
the row is pointer-events:none so the face stays clickable. Phones keep the
card with home. New "Currently building" section (Alexandria Car Clinic,
Tokiwa Matcha) as disabled, striped, taped cards; the line in contact is
gone. Hero videos lost their CSS filter to fix choppy playback (unverified by
eye).

**Session 4, fourth pass.** Kemal did not like any entrance motion
on About (reel smears, then spring hops). About is now **read by scrolling**:
the section is 220svh, the paragraph pins, words go from pale to ink with
scroll progress, the hello starts lit, and a handwritten "keep scrolling"
with a bobbing arrow answers "not clear you can scroll". Desktop menu: the
side-expanding bar is gone; hovering the face drops a row of separate pills
(home first, filled) with the letter-flip ticker; phones keep the rolled-down
card. Prop squiggles no longer flash on load (the lines animated from a
placeholder length when measured; idle lines are now opacity 0). Experience
roles per Kemal: Founder; Polaris Senior Product Designer & Lead UX/UI
Researcher (team of two designers, his boss was lead; "Senior" was his
guess); Osmosis DEX Junior Product Designer & Lead UX/UI Researcher;
Brainfood UX Researcher. No blinking "now" dot (he called it AI slop and is
finding inspiration). Contact is one centred capsule: name, email, "Say hi",
with the two clients named in a line above. Work cards say "View project",
crop the product shots toward the top.

**Session 4, third pass (from Kemal testing on his phone):** the face menu
now rolls a list down on touch screens (`.tn-drop`, home written first; the
desktop hover sides are unchanged). Case links were dead everywhere: a
leftover placeholder handler called `preventDefault` and then crashed on a
missing `.case-title`; removed. Experience: "Kemal Rahman Design", Polaris
2025 above Osmosis DEX 2024. About: the `( about )` tag is gone, the copy is
a first-person hello, and the words hop in on springs (the reel's smears and
tumbles read as too serious). Section titles bounce in word by word. Phone
checks live in `tests/mobile.js`.

**Session 4, second pass.** Kemal rejected the reel
chrome (corner labels, timecode, progress line: "make no sense") and the
easing-race timeline ("0 sense"), and said the site's tone is Disney-like, so
it should be **friendly, not serious**. Kept: the About kinetic type. Built:

- **Experience:** four white rounded cards that pop in on a spring; Osmosis
  and Polaris share a dashed "Osmosis Labs" outline ("same family, two
  products", his Toyota and Lexus). Handwritten notes in Kaushan Script.
- **Work:** three cards (Osmosis, Polaris, Loco Exotics), each opening a page
  in `work/` (`case.css` + `case.js` shared). Copy rewritten from his old
  Framer case studies, leaning on crypto being unsolved and him being one of
  the first designers on those systems. No Brainfood case study, by request.
- **Images:** the crypto shots are **hotlinked from framerusercontent.com**
  (his old Framer site). The container cannot reach Framer, so they were never
  seen here; they sit where the old pages placed them, uncaptioned. If that
  site goes, they go: get the files from Kemal and commit them.
  Loco's films and stills are copied from `kemalrahmandesign/loco-exotic`
  into `media/loco/` (tail.mp4 re-encoded to 2.3MB).
- **Contact:** "Want to work together?" form posting to FormSubmit's AJAX
  endpoint for kemal203@gmail.com (the **first submission sends an
  activation email** he must click), falling back to a pre-filled mailto.
  "On the bench": Alexandria Car Clinic, Tokiwa Matcha.
- GSAP 3.15 is vendored at `vendor/gsap.min.js`. **Trap:** never hand GSAP an
  element inside the hidden `#work`; it reparents it to measure and drops the
  spaces between words. Reset with plain styles.

## State

| Piece | Status |
|---|---|
| Hero clips (hub, wave, idle, walk) | done and wired; served from the Higgsfield CDN via the `FALLBACK` map because **`media/` still does not contain them** (see below) |
| Hero page, handoff, flash fixes | done |
| CTA pill | done: rotating dashes, 25 periods exactly (a non-dividing period stutters at the top-left) |
| Social trinkets | done, bottom centre at his feet, one shake on hover; **links are still `#`** |
| Prop labels (Kaushan Script, write-on) | done; coordinates are Kemal's, dragged in with `?props`; **the arrow curls still need work** |
| Overscroll | done, black arc with curved note, holds 850ms |
| Fast forward | done, speeds the take to 4x, resets between runs |
| Face menu | done: about, experience, work, contact; the face goes home; split-flap hover |
| About | one paragraph, black on white, `( about )` inline; copy approved-ish; **kinetic type entrance + reel chrome** |
| Experience | the easing race, three rows: Own agency (2026 to now), Polaris (2024 to 25), Brainfood (2020 to 21); **agency name unknown; title copy unapproved** |
| Montage | sticky, full window width, grey placeholder; **no reel yet** |
| Case studies | four 21:9 images with parallax and a "view" cursor; **placeholder gradients** |
| Contact | form + next clients; built without a reference, on request |
| Cursor | a pointer arrow with a label pill, FigJam-like |
| Mobile | letterboxed 16:9; **the 9:16 regeneration is in `BACKLOG.md`** |
| Tests | `tests/e2e.js` ~64, `tests/mobile.js` 5, `tests/pages.js` 30 |

## Working with Kemal

- He sends screenshots as references. **Match them; do not invent around them.**
  The worst session in this project was one where an accent colour, a
  headline-plus-footnote layout and a full CV were built from two screenshots
  that showed none of them.
- He will tell you bluntly when something is wrong. Fix it, say what caused it
  in a sentence, move on.
- He is rationing Higgsfield credits. Always `get_cost` before spending and
  quote the number.
- He cannot always check things himself, and cannot see what you see; he can
  see what you cannot (the videos). Say plainly which of those a claim rests on.

## Do not

- **Do not rewrite the site in React.** It was discussed. The effects come from
  shaders and timelines, which work without it, and the hero is one file that
  took many sessions to get right.
- **Do not commit his reference photos.** The repo is public. `refs/` is
  gitignored and must stay that way.
- No em dashes in site copy.

## Still open: the four hero clips are not in the repo

`index.html` loads `media/hub.jpg`, `media/wave.mp4`, `media/idle.mp4` and
`media/walk.mp4` by relative path, and falls back to the Higgsfield CDN when
they 404, which is what the live site is doing today. That works until one of
those generations is deleted. Kemal can now drop files straight into the chat
(the session reads them from `/root/.claude/uploads/`), which is the easiest way
to get them committed. The history below is why this matters.

This was urgent for a reason that already came true: the walk clip the page
used to point at, `4d06b164`, now returns **403**. The call to action was dead
before anyone touched it.

The agent cannot download them. The result CDN is blocked from its container
(verified: connection refused), and the sandbox that can reach it cannot write
to the repo.

**Save these four into `media/` under exactly these names** (links good 24h from
2026-09-20 19:35 UTC; ask for fresh ones after that):

```
media/hub.jpg    .../f215c1e8-2364-4cf0-a950-cb1851e8c8b4.jpg    0.21 MB
media/wave.mp4   .../2229135a-3e3c-4651-a827-66c8a7af5f4c.mp4    0.78 MB
media/idle.mp4   .../9b16a3ef-b3fe-441f-99e6-414ffac6f442.mp4    2.63 MB
media/walk.mp4   .../f8373f35-e3dc-4469-9533-66738f840f3c.mp4    3.90 MB
```

all on `https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/`.
Full URLs and the reasoning are in `media/README.md`.

These are re-encoded, not raw: CRF 21, preset slow, `+faststart`, no re-timing.
48 MB of raw generation becomes 8.4 MB. Frame counts and durations are identical
across the encode and the luminance shift is under 0.1 levels, so every `head`
in the player still holds.

Once they are committed the CDN fallback becomes a safety net rather than the
thing actually serving the page.

## The walk clip, settled

`walk.mp4` is job `22c175dd-3735-4641-9e00-0eb372b89db3`: a Genjutsu object
replacement over candidate `82780415`, run to give the chair its missing
armrest. Measured: no dissolve, he is never lost from frame, 2.2% duplicate
frames (better than the 5.4% of the take it replaces), and the last frame lands
on the pinned end frame within 3.8% of pixels.

### How that was arrived at, so nobody repeats it

Seven generations came out of this prompt. **One** was clean. The rest
dissolved mid-shot, dropped the hobby props and the painting, or lost him from
frame. The last three ran a prompt verified byte-identical by sha256 to the
original, and still differed, so **the variation is the model's seed, not the
text**. Re-rolling was about a one-in-seven draw.

Two dead ends worth not re-walking:

- **Editing the prompt to fix a defect broke something else, every time.** The
  armrest fix worked and introduced a fade cut. Buying back the character budget
  by deleting a redundant description stripped the background. Length correlated
  with failure across three samples, which looked like a clean signal and was
  not one; with n=1 per variant it could not be separated from seed variance,
  and the evidence now says variance dominated.
- **A cut detector cannot see a dissolve.** Frame-to-frame motion never spikes,
  so a >55%-of-pixels-moved test passes a fade cut silently. What catches one is
  a drop in edge energy against a local baseline: validated against three clips
  with known labels, it read 8.9% on the clean one and 30-31% on the two with
  fades. Cross-check any hit against motion, though — a frame that flattens
  because the camera is filling frame with a black monitor drops edge energy
  too, and that produced a false positive at 7.60s on another take.

**The lesson: when a take is close and the defect is one object, edit the video,
not the prompt.** `hf_mult_replace_object` takes the source video plus a
reference image and swaps the object, keeping the camera move, the background
and the take's luck. It cost one generation where re-rolling had cost six.

### What the re-render changed

It is a re-render rather than an overlay, so it came back **24fps, 9.71s**
instead of 30fps, 10.00s, and about **7 luminance levels brighter**. Neither is
corrected, on measurement — the full reasoning and numbers are in
`media/README.md` and in the comments in `index.html`.

The one real cost is the stitch into the idle, and it is handled:

| | opens on the hub pose within | his pixels differ vs idle |
|---|---|---|
| the original take | 3.1% | 20.6% |
| this one | 6.6% | 47.7% |

The studio, 87% of the frame, matches to 0.85% once both layers carry
`--clip-lift`, because both clip to white. The mismatch is him, it is pose not
level, and no filter removes it. So `head` is **0** (frame 0 is the closest
match to the hub pose; every later frame is worse as he turns) and the
idle-to-walk crossfade is **500ms** rather than 320ms, spent over the half
second where he is turning away.

**When a clip both opens dark and opens on a pose, the pose wins.** The
luminance rule that sets `head` for the wave and the idle wanted frame 9 here,
which would have traded a visible pose jump for a 1.5-level dip the crossfade
hides anyway.

## Asset IDs

```
hub frame / poster    3f470988-9df8-4d61-98f6-e316d6f6ad9e
end frame             f9a03660-1c4b-47b0-8323-95918531479d

identity, pass ALL THREE on every character generation:
face closeup          fc39e6cc-91c9-4fc5-bdc1-01299706aaa0
face smiling          7c955619-104c-40a6-93eb-f8ec99078462
full body             48839646-77be-49cb-af61-f9fdc987b999

style reference       7d9079c7-f8b9-410e-83cb-9ffdf1619225
painting on easel     c9933ed2-a0f4-4162-a097-3cc6d6f2b15c
Nova on the PC tower  b90c0b3f-e8d0-4724-a6af-062ba4a0abd5
Nova, full body       28c8ae01-229f-47e6-8013-0123338f9e00
PC tower, close       a1c507b8-5093-484d-943b-33144e4d4daa
desk layout, studio   900f41ac-ce38-4bf8-be62-e4f2b345cc06
monitor arm reference fa937b54-f824-4dc1-be5b-ae381e98f566
motorcycle            619bd981-6a0d-41a0-acb0-51dda9b4a656
guitar                dbebeddb-6068-490d-8a47-90bd0f399617
amp                   7b7f77c9-c08a-4d5d-b2be-7ca1dc6297b8
```

## Open questions for Kemal

1. Scope of the rest of the site. Deferred until the hero is confirmed live.
2. Agency name, if one is wanted anywhere.
3. A real typeface. Inter is still the placeholder. The reference frame's
   headline looks like a tighter grotesque than Inter, and the layout is
   pinned to measured percentages rather than to text widths, so swapping the
   face will shift the headline's width without breaking the composition.
4. Whether to warm `--bg` past `#f1f0ee`. Worth re-judging now the lift taper
   stops the handoff blowing out to pure white.
5. The 9:16 regeneration. Mobile now plays the full sequence, but letterboxed:
   the 16:9 clips are shown with `object-fit: contain` on portrait, because
   covering a phone viewport shows only ~26% of the frame width and the walk
   pans right out of that slice. Regenerating at 9:16 is the real fix and
   replaces the `max-aspect-ratio: 1/1` media query.

## Environment traps

- **Files Kemal drops into the chat are readable** at
  `/root/.claude/uploads/<session>/`. That is the way to see anything the CDNs
  hide: he dropped the reference reel and the skater GLB that way. For video,
  `pip install imageio-ffmpeg` gives a working static ffmpeg locally (there is
  none installed); extract frames or a contact sheet and Read the image.
- **What the container can reach:** npm and PyPI yes. jsdelivr, the Higgsfield
  result and input CDNs, revid.ai and most media CDNs no. Higgsfield's
  `media_import_url` and `sandbox_exec` *can* reach external URLs, so a blocked
  file can be imported or measured there, but `sandbox_exec` stdout truncates at
  about 25KB, so images cannot come back through it.
- No GPU: 4 CPUs, 15GB. WebGL works in headless Chromium through SwiftShader
  (see `tests/README.md`). Blender is available as `pip install bpy`, CPU only.
- Higgsfield `video_analysis_create` sat in `queued` for over twenty minutes and
  never ran. Do not wait on it.
- **The agent cannot see any image or video it generates.** Both the result CDN
  and the input CDN are blocked; only the S3 *input* host is reachable, which is
  why uploads work and reads do not. Images Kemal pastes into the chat *are*
  visible. Ask him to paste a result back rather than reporting statistics as if
  they were a look.
- **`sandbox_exec` is capped at 60s by the client** whatever `timeout_seconds`
  says. Long renders need `background: true`, a sentinel file, and `sleep 45`
  polls, with the upload chained into the same background command.
- **`media_upload_widget` does not render in Claude Code.** Use `media_upload`
  for presigned URLs, PUT the bytes, then `media_confirm`.
- **Do not commit his reference photos.** The repo is public. `refs/` is
  gitignored and must stay that way.
- Preset recommendations block video submission. Retry with
  `declined_preset_id`. The offered preset is matched on prompt text, so it
  changes when the prompt changes.
- Wan 3.0 caps prompts at **5000 characters**, undeclared until a 422.
- `get_cost` does **not** validate media combinations. It priced a call that
  422s on submission. Submitting is the only test, and a rejection is free.

## What cost the most to learn

Full reasoning for each is in `hero-production-notes.md`.

1. **Every generation of the character carries the identity photos.** Dropping
   them gave him a beard, sideburns and a sharpened chin. A shot where his face
   is hidden is not an exemption.
2. **Describe only what the keyframes cannot guarantee.** The pinned start frame
   already fixes his appearance, the props and the studio. Re-describing them
   cost ~120 words of attention taken from beats that were failing.
3. **Attention is conserved.** Adding a clause silently takes from another. Three
   rounds in a row fixed one beat and broke a different one. Four separate
   metrics improved at once when 44 words were *deleted*.
4. **Negatives remove; they do not de-emphasise.** They fixed sideburns, a
   vignette and a warm colour cast. They made the petting beat *more* prominent,
   because a prohibition still spends words on the thing.
5. **Re-read the parts of the prompt you are not changing.** "Walks off to the
   right" survived four rounds and is literally an instruction to exit frame.
6. **When a clip is close, change one paragraph and prove the rest is identical**
   programmatically. A diff that looks small is not the same as one that is.
7. **Do not chase framing through prompt numbers.** Asking 40% returned 65%;
   asking 39% returned 76%. Fix framing in code instead.
8. **Place objects where the camera actually looks**, and check the move passes
   over them.
9. **Confining the edit does not confine the effect.** Two re-runs changed one
   paragraph each, proven byte-identical elsewhere, and both broke the first
   second of the clip. Attention is conserved across the whole prompt, so the
   discipline buys you a clean diff, not a clean result. Re-measure everything
   after every round, including the beats you did not touch.
10. **`head` is per generation.** Not per model, not per clip slot. Do not
   inherit it from the clip you are replacing; the page had `head: 0` on a
   comment written for a generation that no longer exists.

## Measurement, and its limits

Measure in `sandbox_exec`, which can reach the CDNs.

**Reliable** for frame-filling properties: mean luminance, evenness, red-minus-
green, whether the last frame matches a pinned end frame, dark-subject area per
frame (this is what catches a subject leaving the shot), and cut detection *when
done locally* — compare a frame's motion against the median of its twenty
neighbours and flag ratio > 3 with motion > 55%.

**Unreliable, and wrong five times in this project**: anything about a small
prop, anything defined by hue, and anything aesthetic. A saturated-orange scan
reported the painting missing when it was present. A blue-cat test could not
tell a cat from blue plaid pyjamas. A global cut threshold of `6*median+5`
evaluated to 112%, above the 100% ceiling, so it could never fire.

**Say plainly what has not been looked at.** Do not present a table of numbers
in a way that implies the image was reviewed.

## 3D assets are available, and the earlier answer was wrong

An earlier round told Kemal that character drop-ins had to be video on a
near-white plate because nothing in the toolchain produces alpha. That is wrong,
and he was right to push back. Higgsfield exposes a 3D route:

- `generate_3d` with `image_to_3d` (Meshy) takes one image and returns a
  **textured GLB**, with `enable_rigging` for a humanoid skeleton and
  `enable_animation` + `animation_action_id` to bake a clip from a 678-action
  library into the file. `multi_image_to_3d` takes 2 to 4 views and is
  geometrically more accurate. `3d_rigging` rigs a GLB that already exists.
- `animation_actions` searches the clip library. **`Big_Wave_Hello` is id 28**,
  which is exactly the goodbye the contact section wants. There is **no skate
  clip**: the library's groups are WalkAndRun, BodyMovements, DailyActions,
  Dancing and Fighting, and a search for "skate" returns nothing.
- `scene_builder_3d_*` is a separate Blender-backed scene tool with its own GLB
  catalogue and a Python surface, for composing whole scenes rather than lifting
  one character.

What this changes: a GLB rendered in the page with three.js has a genuinely
transparent background, scales to any size, can be moved and re-lit per section,
and is one asset for desktop and mobile instead of a regeneration per aspect
ratio. That is the answer to "can you move the clip around", and it is a better
answer than the one that was given.

The open risk is fidelity, not capability. Image-to-3D on a stylised cartoon can
come back lumpy, and the face is the part that has already cost several rounds.
Generate a single test GLB and look at it before committing to the approach.

For the skate ride specifically: with no clip in the library, the move is a
static model on a board whose transform is animated in the page (travel, lean,
spin at the end) rather than a rigged performance.
