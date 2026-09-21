# Hero section — production notes

Working state for the animated hero. Written so this can be picked up cold after a
break. No personal reference photos are committed here; they live outside the repo.

## Concept

A stylized 3D cartoon version of Kemal stands in a white studio surrounded by
static hobby props. The frame idles with small motion (breathing, blink, weight
shift) and an opening wave. On clicking the call to action he walks right to a
desk, sits, the cat jumps onto the PC, and the camera pushes past his shoulder
into the monitor, which powers on white. The site is underneath it.

## Clip plan

| Clip | Start | End | Model | Status |
|---|---|---|---|---|
| Wave | hub | hub | Wan 3.0 | **done**, media `ed3c524f-cea1-4b6c-8683-46edd68f159f`, 5s |
| Idle loop | hub | hub | Wan 3.0 | **done**, job `adac86ab-3d37-41ff-860a-4c713b405a9c`, 10s |
| Walk / sit / push-in | hub | end frame | Wan 3.0 | prompt ready, see `walk-clip-prompt.md` |

The hub frame is the single still every clip starts or ends on. That is what
makes the stitch invisible.

In the wave clip the arm starts rising at 0.5s and is up from 1.5 to 3.4s, which
puts the wave in the middle of the headline animation rather than before it.

## The handoff, and why it is white

The earlier plan was to end the clip on black and boot the site out of black.
White is better, for two reasons.

Black costs two transitions where white costs one. The site is white, so ending
dark means fading down and then back up, and a beat of full black in the middle
of a click reads as loading rather than as motion.

The second reason is the one that actually decides it. Video encodes in limited
range, so an encoded white arrives in a browser at roughly 235, not 255. Any
plan that requires the video's colour to match the page's colour is the same
class of bug as the pink cast: a value that looks right in the file and wrong on
the screen. So the seam is drawn in CSS on both sides. A fixed `#fff` cover
ramps from transparent to opaque over the clip's last 450ms and the page is
revealed underneath it. Ramping toward white hides the 235/255 step because the
picture is getting brighter the whole time; it never has to match anything.

The power-on flicker lives inside the clip, which was Kemal's call and is the
better one. A monitor waking up is a thing happening in the scene. The same
flicker drawn in CSS over the top is an effect happening to the page. The clip
carries it, so the cover stays plain.

Timing uses `requestVideoFrameCallback`, which fires per decoded frame.
`timeupdate` fires roughly four times a second and is loose enough to overshoot
a 450ms window.

## Picking the video model

Veo is the better model but the good tiers cannot pin the last frame, which the
loops require.

| Model | End frame | Verdict |
|---|---|---|
| Veo 3.1, Veo 3 | no | disqualified for loops |
| Veo 3.1 Lite | yes, but forces 8s | fallback |
| Wan 3.0 | yes, 2-30s, 1080p | used for the loops |

So: Wan 3.0 for the wave and idle loops, Veo 3.1 at full quality for the walk,
which only has to start on the hub frame and finish dark. Pass
`generate_audio: false`; it defaults to true and costs more. A preset
recommendation can block submission, so pass `declined_preset_id` to retry
literally.

Veo 3.1 Lite refused the idle prompt with an `nsfw` status, a false positive on a
cartoon man in a studio. The credits were refunded automatically.

## Idle motion: measured, not eyeballed

Kemal's note on the 3.5s loop was that he moved too much and it read as an
obvious loop. Both complaints have one cause. A loop is only detectable when it
contains a landmark, and a visible sway every few seconds is a perfect one. Take
the landmark away and the period stops being findable, even at 3.5s.

The 10s replacement (`adac86ab`) asks for a locked-off camera, breathing and
three blinks, and nothing else, with every prop named and forbidden to move.
Measured on the character's own pixels, counting pixels that change by more than
6 levels between frames:

| | 3.5s clip | 10s clip |
|---|---|---|
| Mean per frame | 0.376% | 0.187% |
| Peak frame | 7.6% | 3.6% |
| Share of frames above 1% | 11.4% | 6.7% |
| Motorcycle, own pixels | 4.9% | 0.0% |

The motorcycle drift is gone, which earlier prompt wording never achieved. The
likely difference is `enable_thinking`, plus naming each prop individually
rather than saying "the props".

**This also fixes the click handoff.** The walk clip starts on the hub frame, so
clicking mid-idle blends whatever pose the idle is in against that frame. With
the amplitude halved, every idle frame is close enough to the hub frame that a
320ms crossfade has nothing to hide. Waiting for the loop to reach its end
instead would mean up to a 10s delay between the click and anything happening,
which is worse at every clip length and much worse at this one.

## The generated clips open dark: skip the head on every start

This was the real cause of the flash Kemal kept seeing, and it cost two wrong
diagnoses before anyone measured luminance.

Both clips begin about **2.8 levels darker** than they settle, recovering over
roughly four frames:

| Frame | 0 | 1 | 2 | 3 | 4 | ... | tail |
|---|---|---|---|---|---|---|---|
| Idle, studio pixels | 234.55 | 235.99 | 236.70 | 236.71 | 237.25 | | 237.36 |
| Wave, studio pixels | 234.55 | 235.84 | 236.54 | 236.56 | 236.87 | | 236.84 |

So every time a clip starts, the picture dips and brightens back within 133ms.
That fast dark-to-bright pulse is what reads as a flash, and `--clip-lift`
multiplies it to about 3 levels. It fires at every loop wrap because the wrap is
a start.

It is also why the wrap could not be trimmed away. The 3.88% mismatch was mostly
this luminance offset spread across the whole background, not a pose
difference. Looping in at frame 4 instead of frame 0 takes it to 1.15%.

**Fix:** every clip carries a `head` in the player, the first frame measured
within 0.3 levels of its settled value, and every start seeks there rather than
to zero. Idle 0.14s, wave 0.11s. Measure this for the walk clip too; it is the
same model and will have the same ramp.

**Lesson worth keeping:** when something looks like a compositing bug, measure
the content before rewriting the compositor. Mean luminance per frame would have
found this in one pass, on day one.

## The boot handoff was the last suspect, and it is clean

The previous session closed with one unmeasured suspect for the flash: the
poster-to-wave handoff at boot. The hub PNG is a full-range still and the clips
decode limited-range, so there was no reason to assume they landed on the same
value. Measured now, they do.

Comparing the hub PNG against the wave clip, both at 1920x1080, over the studio
pixels (luminance above 200, which is 86.7% of the frame):

| | studio luminance | red minus green |
|---|---|---|
| Hub PNG, cover-cropped to 16:9 | 235.55 | +0.08 |
| Wave at its head, frame 3 | 235.31 | -1.10 |

**Correction, measured again later.** The hub figure reproduces exactly: the
original PNG, centre-cropped to 16:9 and scaled to 1920x1080, measures 235.553
over a mask covering 86.6% of the frame, against the 86.7% recorded here. The
wave figure does not. Frame 3 of the wave clip measures **237.03** over that
same mask, not 235.31 — and 235.31 does not agree with this document's own
per-frame table above either, which puts wave frame 3 at 236.56.

So the real gap is **1.5 levels, not 0.24**, and it is outside the 0.3-level
tolerance rather than inside it.

**The conclusion still stands, on the other argument given below.** Both layers
carry `--clip-lift` 1.085. The studio is near 235 on the poster and near 237 on
the clip, and 235 x 1.085 = 255.6 while 237 x 1.085 = 257.1, so both clip to 255
and the difference is gone before it reaches the screen. The suspect is cleared
because of the clipping, not because the two values were close. Keep the reason;
discard the number. And `--clip-lift` is applied to `.stage img` as well as
`.stage video`, so both layers are multiplied by 1.085 and both clip to 255 on
the studio. There is nothing for the boot fade to expose. The suspect is
cleared; no code change follows from it.

Two things worth keeping from the measurement.

**Skipping the head helps the boot handoff too, it does not trade against it.**
Against the poster, mean absolute luminance difference is 2.25 levels at the
clip's frame 0 and 1.80 at frame 3. Seeking past the dark ramp moves the first
visible frame closer to the still it is replacing, not further away.

**Cover-crop before comparing a still to a clip.** The hub PNG is 2752x1536,
which is 1.7917, not 16:9's 1.7778. Scaling it to 1920x1080 stretches it by
0.8% horizontally, and that alone reported 7.74% of pixels differing where the
correctly cropped comparison reports 4.35%. Nearly half the apparent mismatch
was measurement error. The browser does `object-fit: cover`; a measurement that
does not is measuring its own resampling.

The residual 4.35% sits almost entirely on the character and props (28% of
those pixels, against a studio that matches to a quarter of a level). That is
codec detail on hair and decals, not an offset, and a 220ms fade covers it.

One small real drift, recorded rather than acted on: the wave clip settles at
red-minus-green -1.1 to -1.4 where the still is +0.08, so the video is very
slightly cyan against the poster. Kemal caught the pink cast by eye at +12.9.
This is an order of magnitude under that, and below the threshold where it is
worth spending a generation.

## Never crossfade two layers by fading both

The first attempt at the player-side loop flashed on every wrap, and on every
clip change. The cause is compositing, not the clips.

Two stacked layers each at opacity a do not sum to one. With the outgoing layer
fading 1 -> 0 while the incoming one fades 0 -> 1, the midpoint is
`0.5*new + 0.25*old + 0.25*page`, so about a quarter of the page background
shows through the middle of every blend. The background is near-white and the
clips sit around 222 against the page's 241, so each transition brightens. It
reads as a flash.

The fix is to keep the picture opaque the whole way through: raise the incoming
layer above the current one, fade it 0 -> 1 while the outgoing one holds at
full opacity, and drop the outgoing one only once it is completely covered. The
blend is then exactly `a*new + (1-a)*old`, which sums to one and never touches
the page beneath.

That is why the stage layers carry no CSS transition. Opacity and z-order are
driven from the script, because the order matters as much as the timing.

One related trap: raise the incoming layer only once its first frame has
decoded. The element has just played to its end, so raising it while the seek
to frame 0 is still in flight shows its last frame for a beat, which is a
glitch at every wrap.

## Closing the loop in the player, not in ffmpeg

The 10s clip does not return to its own first frame: 3.88% of pixels differ, and
searching every frame past the halfway point for a better wrap only reaches
3.59%. Trimming does not help, exactly as with the 3.5s clip.

The 3.5s clip was closed by baking a crossfade with ffmpeg and re-uploading. That
is not available from the agent container any more, because the egress policy
blocks the result CDN and the proxy documentation is explicit that a policy
denial must not be routed around. So the wrap is crossfaded in the player
instead: two video elements hold the same clip, and the outgoing copy plays its
tail while the incoming one restarts underneath it.

This is the better version regardless. Nothing is re-encoded, the full 10s is
kept rather than losing half a second to the overlap, and the technique works
for any clip without a hosting round trip.

## Baking a seamless loop (superseded, kept for reference)

The end-frame constraint does not produce a pixel-exact return. The raw idle clip
differed from its own first frame across 3.06% of pixels, and searching all 120
frames for a better loop point only reached 2.96%, so trimming does not help.

Fix it in post instead. With `L` frames and a `d`-frame overlap, output `N = L-d`
frames where `out[i] = clip[i]` for `i >= d`, and
`out[i] = clip[i]*(i/d) + clip[i+N]*(1-i/d)` for `i < d`. A 15-frame overlap at
30fps took the wrap mismatch from 3.06% to 0.086% of pixels, and the headline
area stays clean through the blend. The result loops with a plain `loop`
attribute, no player-side crossfade needed.

## Character lock

- Long dark wavy hair to the shoulders, middle part
- Thin round wire-frame glasses
- Thin moustache **kept** (confirmed 2026-09-19), no goatee or chin hair
- Cream-white crew-neck tee, light-blue plaid flannel pajama pants, plain
  cream-white low sneakers
- Pose: weight on one leg, left hand in pocket, right arm loose at his side,
  small closed-mouth smile. The free right hand is what waves.

## Props in the hub frame

Motorcycle far left (red, yellow flames, number 95). Black skis leaning at the
back. Mint-green Fender Mustang on a stand cabled to a cream-white practice amp.
Skateboard and soccer ball on the floor. No desk and no cat in frame one; the cat
(Nova, grey) appears in clip two near the desk.

Keep the right third of the frame open. That is the walk path, and props there
smear when the character moves past them.

## Higgsfield job IDs

Job IDs double as media references for later generations, so these are worth
keeping rather than regenerating.

```
hub v1 variant A                     e69f9c04-a0c1-4543-9a1f-45a4555d0931
hub v1 variant B  (Kemal's pick)     d106ad51-f9ef-4ff8-8d0a-8b583c4d5a30
hub v2  = B with chin hair removed   de88ebd0-5db6-4fda-bfcc-955fc6cb00c0
hub v2 outpaint 4:3   2400x1792      03c0350d-a9f3-46f4-83f9-e1c77adf6280
hub v2 outpaint 16:9  2752x1536      ce361baa-0784-43c2-a331-1cd9d8597f83
```

The hub frame is generation `3f470988-9df8-4d61-98f6-e316d6f6ad9e`, **the one
Kemal chose**. Pass that job id straight to the video calls as the start frame;
job ids work as media references.

```
hub frame (current)   job  3f470988-9df8-4d61-98f6-e316d6f6ad9e
```

Measured: headroom above the hair 28.5%, character height 65.5%, feet clear of
the bottom edge, background red-minus-green `+0.09`, even to within 11.7 levels,
nothing in the upper band.

Note the headroom is tighter than the 33-40% the earlier work aimed at, and the
background is less even than the composite that was briefly used instead. Kemal
picked this frame on how it looks, which overrides both numbers. Do not
substitute a "better measuring" frame for it.

**How the wrong frame got used.** A composite built by scaling another
generation was uploaded as a media item and treated as approved. It was the
newest image in the account, but it sat in the media list rather than the
generation history, so it was not what Kemal saw as most recent. Folders and
favourites are not exposed through the API at all: there is no tool that lists
them, and `folder_id` appears only as a write-time destination. When Kemal
refers to a frame by folder or favourite, ask him to paste it or delete the
others, rather than inferring from timestamps.

## Do not chase the framing through the prompt

This cost the most attempts of anything in the project, so the finding matters.

Reference photographs bias the character larger, which is real. What is not real
is any fine-grained control over how much. Asking for a body height of:

| Asked | Returned |
|---|---|
| 40% | 65.2%, 64.1% |
| 39% | 75.6% |
| 38% | 65.5% |
| 33% | 45.7% |

Asking for 39% produced the largest result in the set. Only a large change in the
request (33%) moved the output reliably. Between roughly 38 and 40 the response
is noise, so tuning the number wastes a capped daily budget.

The working method is to stop at any generation whose props, likeness and
background are right, ignore its framing, and fix the framing in code. A 6% scale
correction is visually lossless and lands the numbers exactly.

## Getting the props right

The motorcycle, guitar and amp are only accurate when their photographs are
passed as references. An attempt that dropped them and kept only the identity
photos and the style reference left the model inventing those objects from the
text, and all three degraded. Kemal caught it immediately.

The confusion that caused it is worth stating plainly. A previous *full frame*
passed as a reference does lock the composition and must never be used. Photos of
*individual objects* do not, because there is no scene layout in them to copy.
Both were removed when only the first was the problem.

So: pass all seven references, always. Repeat the identifying detail in the text
as well, since the photographs fix shape and colour but the words are what stop
the model simplifying away the number 95, the white pickguard and the red amp
handle.

## An alternative if generation is unavailable

Before the framing was solved above, the frame was widened by outpainting, and
that is worth avoiding.

**Outpainting drifts the colour.** Each pass re-encodes the whole canvas and adds
a warm cast. Measuring background pixels only, red minus green went `+5.4` in the
first good render, `+7.3` after the chin edit, `+9.5` after one outpaint and
`+12.9` after two. Green falling away from red is what reads as pink. Kemal
spotted it by eye at `+12.9`.

A composite was then built in code, kept here as the fallback for when the daily
generation cap is spent, since it costs nothing. It is media
`eddd6e1f-7352-4b50-97d9-ad1cb759f062`. The studio is a seamless
cyclorama with a gentle vertical brightness gradient and no horizontal structure,
which makes it safe to model: fit a linear vertical gradient to the background
pixels, extrapolate it over a larger canvas, paste the scaled-down scene with a
180px feather, then neutralise the white point by equalising the channel means of
the background.

A first attempt fitted a full 2nd-order polynomial in both axes. Do not do this.
It extrapolates fine inside the fitted region and bends badly outside it, giving
corners that measured 203 against a centre of 238, which looks like a dirty
background. Vertical-only is the right model.

Result: character height 59.9% of frame, head at 35.0% down, feet at 94.9%,
background even to within 1.5 levels corner to corner, red minus green `+0.18`.

Uploaded reference media IDs (Kemal's photos, held on Higgsfield, not in this repo):

Re-uploaded by Kemal on 2026-09-19, and these are the ones to use:

```
painting on easel (the Squidward)  c9933ed2-a0f4-4162-a097-3cc6d6f2b15c
Nova lying on the PC tower         b90c0b3f-e8d0-4724-a6af-062ba4a0abd5
Nova, full body on the floor       28c8ae01-229f-47e6-8013-0123338f9e00
PC tower, close                    a1c507b8-5093-484d-943b-33144e4d4daa
desk layout, already in studio     900f41ac-ce38-4bf8-be62-e4f2b345cc06
```

Earlier uploads, still valid:

```
face closeup          fc39e6cc-91c9-4fc5-bdc1-01299706aaa0
face smiling          7c955619-104c-40a6-93eb-f8ec99078462
full body             48839646-77be-49cb-af61-f9fdc987b999
style reference       7d9079c7-f8b9-410e-83cb-9ffdf1619225
cat (Nova)            0beed3b6-923e-45ec-ad8d-a4a8b20c5d80
PC tower with cat     512cb519-021c-469e-a277-4a87f2db7bfa
painting on easel     03415c45-a290-4886-b366-d4df6e253c8b
motorcycle            619bd981-6a0d-41a0-acb0-51dda9b4a656
guitar                dbebeddb-6068-490d-8a47-90bd0f399617
amp                   7b7f77c9-c08a-4d5d-b2be-7ca1dc6297b8
```

## Models that worked

`nano_banana_pro` at 2k, 16:9, with the four identity photos plus the style
reference passed as `image_references`. For the clips, any model taking both a
start and an end image works; FLUX 3 Video, Wan 3.0 and MiniMax H3 Max all do,
and FLUX 3 covers 5 to 20 seconds at 1080p.

## Open items

1. Agency name and the tagline that sits under "Hi, I'm Kemal."
2. A real typeface. Inter is a placeholder; the Figma uses something tighter.
3. Generate the end frame, then the walk clip. Prompts are written and ready in
   `end-frame-prompt.md` and `walk-clip-prompt.md`; they are the next two
   generations.
4. Host the clips in `media/` rather than off the Higgsfield CDN, and repoint
   `CLIPS` and `POSTER` at local paths. See `media/README.md`. Until then the
   page cannot show its own video from a sandboxed preview, and degrades to a
   dashed placeholder instead.
5. Decide whether the motorcycle wobble in the idle loop is acceptable. The
   props were told to stay rigid; the bike still shifts across 4.9% of its
   pixels between frames, against 1.4% for the guitar and amp. Fixing it means
   regenerating the loop.

## Desk photographs

Kemal offered photographs of his real desk. They are worth having, for the same
reason the motorcycle photograph was: the difference between his desk and a
generic one.

They are not blocking, though, and it is worth being precise about why. The end
frame is 85 to 90 percent monitor screen, so the desk is barely in it; what is
in it is the bezel, Nova and the glow, all of which are covered by photographs
already uploaded. The desk is visible in the middle of the walk clip, which is
driven by text rather than by a pinned frame. So the photographs improve the
walk clip and do almost nothing for the end frame.

## Account state

On 2026-09-16 Higgsfield refused generations with "You've reached the daily
generation limit for your grace period." Credits were not the cause; the balance
was about 1,304.

**Still true on 2026-09-19, and the ledger says why.** `balance` reports
`subscription_plan_type: "plus"` with 1,204 credits, which looks like an active
plan and is not one. The transaction history shows subscription credits granted
on 6 August and nothing since: no September renewal, so the account is still in
the payment grace period with its daily cap of roughly five generation jobs.

Read the ledger, not the plan field. `plan_type` is the plan on record and stays
"plus" through a failed renewal; a grant is the only evidence that a renewal
actually cleared.

The cap counts submissions, not successes. On 19 September it was spent by
15:54, 15:54, 16:17, 17:23 and 18:21 UTC, and one of those five was the Veo 3.1
Lite job that was refused and refunded. A refund returns the credits and does
not return the slot.

Budget generations accordingly while this lasts, and prefer deterministic image
work over generative retries where the two are interchangeable.

## The end frame, and the two lines that were costing the most

**Use media `f9a03660-1c4b-47b0-8323-95918531479d`.** That is generation
`10dffcf6-095a-487c-956e-6478ceebc14b` cropped to 90% and rescaled, nothing
else touched. Pass it to the walk call as the end image.

| Measure | Target | Result |
|---|---|---|
| Screen height | 85-90% | 89.5% |
| Screen luminance | above 235 | 240.88 |
| Red minus green | under 1.5 | -0.06 |
| Blue minus green | under 1.5 | -0.09 |
| Evenness across the panel | under 8 | 1.62 (239.9 to 241.5) |
| Text or icons | none | 0.0000% of pixels |

Four attempts. Each one failed on a line the prompt itself put there.

**"Slightly above the shoulder" is what tilted the camera.** The first frame
read as looking up at the monitor. Kemal caught it. Flat and perpendicular is
right for a reason past taste: the CSS cover is an axis-aligned rectangle, so an
angled monitor means a trapezoid dissolving into a rectangle on exactly the
handoff frame. Naming the camera first and in negatives (no high angle, no low
angle, no tilt, no roll, no keystoning, edges parallel to the frame) fixed it in
one try and has held for every attempt since.

**"Slightly brighter at the centre" is what caused the vignette.** The prompt
asked for a centre-bright falloff and then the result was written up as a defect
for having one. Deleting that clause and replacing it with explicit negatives
(no vignette, no radial glow, no hotspot, no bloom, no gradient, corners as
bright as the centre) took the centre-to-edge difference from +15.8 levels to
**+0.1**. A hedged version of the same idea, "evenly backlit" without the
negatives, still came back at +15.8. The negatives are doing the work.

**Nobody should be in this frame.** Drafts kept a shoulder along the bottom to
ground the shot. Kemal's objection is the correct one and it is about continuity,
not composition: the camera has already pushed *past* him by the final frame, so
he cannot be in it. One attempt rendered the "shoulder" as the top of a chair
back he would supposedly be sitting on, which is worse than either option. The
working prompt lists what is absent item by item: no person, no shoulder, no
head, no hair, no chair, no cat, no desk, no keyboard, no hands.

**Framing did come from the prompt this time**, which is worth recording against
the standing rule that it never does. Asked for 87%, got 89.5%. The difference
from the earlier attempts is that the frame is nearly empty, so there is no
character whose size the model is trading against. The rule still holds wherever
a figure is in shot.

### The white was never the generation's fault

Kemal asked whether the blue-white end frame was really what the site should be
built around, and whether something warmer would suit better. Both halves of
that turned out to be code, not art direction.

The page is `--bg: #f1f0ee`, luminance **240.07**, already slightly warm. The
delivered panel measures **240.88** and dead neutral. Those are the same white.

Two things in the player then break it:

1. **`--clip-lift: 1.085` blows the panel out.** The lift is calibrated for the
   hero studio, taking 222 to 241. The end frame's panel is already at 241, so
   the lift takes it to 261 and it clips to 255 on all three channels. Clipping
   destroys the hue along with the level, so no amount of warming baked into the
   still survives it. This is what reads as a harsh cold white at the handoff.
2. **`#cover` was hardcoded `#fff`**, on a comment asserting the page was 255.
   It is 240. So the cover ramped to pure white and then cleared fifteen levels
   down onto the real page, creating a step at the end of the reveal in order to
   hide one in the middle. Now `var(--bg)`, so clearing it is a no-op.

Fixing the cover is done. Tapering the lift over the take is not, and is the
remaining piece: the panel needs to arrive at 241 rather than 255.

**The lesson, which is the third time this project has learned it in a different
costume:** when a generated result looks wrong, check what the prompt or the
code actually asked for before blaming the model. The tilt, the vignette and the
cold white were all specified, in writing, by us.

### Measuring a frame the agent cannot see

The result CDN is blocked from the agent container. The S3 *input* host is not,
which is what makes `media_upload` work for references.

Two bright-region detectors gave confidently wrong answers before one worked.
"First bright row in each column" found the shoulder; "rows that are mostly
bright" returned the whole frame. Both reported a flat frame as tilted. In a
white studio the wall is as bright as the screen, so brightness alone cannot
find the monitor: **locate the dark bezel bars instead** and take the screen as
what sits between them.

Before trusting any detector, print a 72x26 ASCII luminance map. It settles in
one call what a detector will argue about for three, and it is how the vignette
in variant D was spotted.

## What finally worked on the end frame, and what it cost

Nine generations. Every one of the first six failed on a line the prompt itself
put there, and the run only converged once Kemal supplied a reference and took
over the direction.

**The sequence of self-inflicted failures**, kept because each is a rule:

1. *"from just behind and slightly above a seated person's shoulder"* tilted the
   camera, and the model overshot into a low angle looking up at the monitor.
2. *"slightly brighter at the centre and very gently softer toward the edges"*
   produced a centre hotspot 15.8 levels hot, which was then written up as a
   defect. Explicit negatives (no vignette, no radial glow, no hotspot, no
   bloom, no gradient, corners as bright as the centre) took it to +0.1. The
   hedged phrasing "evenly backlit" on its own did nothing.
3. An exhaustive list of what to *exclude* with no list of what to *include*
   returned a screen floating in empty space. Asking for the arm after that
   produced one so thin Kemal called it wire.
4. Keeping a shoulder in frame contradicts the move: the camera has already
   pushed past him by the last frame. One attempt drew it as the top of a chair
   he would supposedly be sitting on.

**The thing that unlocked it was a reference image, not a better prompt.**
Kemal supplied a product-style render of a monitor on an arm, and it solved a
constraint that had been treated as unavoidable. Shot dead on, an arm mounted
*behind* the monitor is occluded by it, so showing the arm costs screen height.
An arm entering from the **lower left** is visible at any zoom. The trade
disappears once the arm is off-axis.

**The final frame** is generation `10dffcf6` cropped to 90% and rescaled to
2752x1536, aspect preserved to five decimal places, with 30% of the removed
height taken off the top and 70% off the bottom. What was floating was not the
arm, which already ran to the frame edge, but the desk *clamp foot*, which
flares out from about y=1490 and clamps onto nothing. The crop cuts above it.
Screen went from 62.5% x 61.3% to 69.5% x 68.1%. Panel measures 235.58,
red-minus-green -0.12, identical to the source, because nothing but the crop
was applied.

### Which video models take keyframes AND references

This is the constraint that decides the model, and it is not in any model's
declared `medias` roles. Every model below lists `start_image`, `end_image` and
`image_references` as available roles; only some accept them together.

| Model | start+end pin | references | both at once |
|---|---|---|---|
| Wan 3.0 | yes | yes | **no**, 422 |
| FLUX 3 Video | yes | yes | **yes** |
| Veo 3, Veo 3.1 | no, `start_image` only | **none** | n/a |
| Veo 3.1 Lite | yes | **none** | n/a |

**Veo takes no reference images at all.** Veo 3 and Veo 3.1 accept only a
`start_image`; Veo 3.1 Lite accepts `start_image` and `end_image`. There is no
role to put a reference in, so "use Veo with the reference photos" is not a
thing that can be done, however the request is phrased. Veo 3.1 Lite is also
capped at 4, 6 or 8 seconds.

So FLUX 3 Video is the only model here that can pin both ends *and* take the
object photographs. It costs 90 credits for 10s at 1080p against Wan's 35.

When a model will not take both, keyframes win: pinning both ends is the entire
reason the stitch is invisible, and anything not in a keyframe has to be carried
by the prompt text. The fallback for accuracy in that case is to put the objects
into a keyframe instead, by generating an intermediate still *with* references
and splitting the clip in two at it. Image generation always takes references.

### `get_cost` does not validate media combinations

`get_cost: true` returned a cost of 35 credits for the exact Wan 3.0 call that
422s on real submission. It prices the request; it does not check it. Do not use
it to test whether a media combination is legal. The only test is to submit,
which is free when it fails.

### A blocked agent should not pretend to have looked

The result CDN and the input CDN are both blocked from the agent container;
only the S3 *input* host is reachable, which is why uploads work and reads do
not. So the agent cannot see any generation it makes.

Reporting luminance tables in that situation reads as if the image had been
reviewed, and it had not. The tables were accurate and still missed a floating
screen, a wire-thin arm and whatever Kemal saw as glitching, because none of
those are luminance. Say plainly that the image has not been seen, and ask for
it to be pasted into the chat, which is the one path that does work: images the
user attaches are visible.

Three bright-region detectors gave confidently wrong answers before one worked.
In a white studio the background is as bright as the screen, so brightness
cannot locate the monitor. **Find the dark bezel bars and take the screen as
what sits between them.** Print a 72x26 ASCII luminance map before trusting any
detector at all.

## The model bake-off, and why the split is the answer

Three models were run on the same walk prompt with the same pinned frames.

| | Wan 3.0 | Veo 3.1 Lite | FLUX 3 Video |
|---|---|---|---|
| Takes the object photos | no | **no role exists** | yes |
| Cuts inserted | none | none | **two, f93 and f105** |
| Resolution / fps | 1920x1080 @30 | 1280x720 @24 | 1920x1088 @24 |
| `head` | 0 | 0.533s | ~0 |
| Last frame vs the pinned end frame | 6.0% of px | 51.6% | 10.9% |
| Credits, 10s | 35 | - | 90 |

**FLUX is the only model that carries references, and it cut the take twice.**
At f105 luminance jumps 101 to 163 with 98.4% of pixels changing between
consecutive frames, and f104/f105 are plainly different pictures. It is also
1088 pixels tall at 24fps, so it would not have matched the other clips even
without the cuts.

**Veo 3.1 Lite's end pin is weak.** 51.6% of pixels differ from the frame it was
given, against 6.0% for Wan: it produces something resembling the end frame
rather than landing on it. It also opens 3.02 levels *bright* and takes 16
frames to settle, so it needs a 0.533s head, and it is 720p/24.

Wan 3.0 wins on every measurable axis except references. Which is why the way
to get the references in is not a different video model:

**Put the objects in a keyframe, not in the video call.** Image generation
always accepts references. Generate an intermediate still of the desk with the
tower, cat and painting photographs passed in, approve it as a picture, then run
two clips that both pin it: hub -> desk, and desk -> monitor. The objects are
then locked by a frame rather than described in prose, which is the same
mechanism that makes the hub frame's motorcycle accurate. It also halves the
beat density, which the ten-beats-in-ten-seconds note warned about.

### The cut test that could not fail

The first cut test thresholded at `6 * median + 5`. With a median motion of
17.9% that is 112.3%, and no frame can change more than 100% of its pixels, so
the test was incapable of reporting a cut. It passed all three clips, including
the one with two obvious cuts in it.

**A cut is local, not global.** Compare each frame's motion against the median
of the twenty frames around it, and flag a ratio above 3 with absolute motion
above 55%. On that test FLUX shows 4.3x and 3.9x at its two cuts, Wan's worst
real frame is 1.3x, and Veo's is 1.9x. Ignore ratios in the opening frames,
where near-zero motion divided by near-zero neighbours gives meaningless
thousands.

## Veo, corrected: the prompt was the variable, not the model

An earlier comparison ran Veo 3.1 Lite against Wan 3.0 and concluded Veo's end
pin was weak and its camera barely moved. **That conclusion was wrong**, and the
cause was a confound introduced by the comparison itself: the Veo prompt had
been shortened to "fit" 8 seconds, merging beats and cutting the camera
direction down to a clause. Kemal spotted it from the output.

Re-run with the *identical* full prompt, on the same pinned frames:

| | Wan 3.0 | Veo Lite, short prompt | Veo Lite, full prompt |
|---|---|---|---|
| Cuts | none | none | none |
| Directional pan bias | 34.8% | 17.9% | **63.3%** |
| Cumulative pan | -64px | -69px | **-129px** |
| Last frame vs the pinned end frame | 6.6% | 51.6% | **5.8%** |

Veo Lite with the full text pans twice as far as Wan, holds the strongest
directional bias of the three, and lands on the end frame slightly *better*.
Its real drawbacks are format, not craft: 1280x720 at 24fps against Wan's
1920x1080 at 30, and a hard cap of 4, 6 or 8 seconds.

**Never shorten a prompt for one arm of a comparison.** Duration is a parameter;
the text is the variable under test. Compressing it changed two things at once
and produced a confident, wrong answer about a model.

Repeating the camera instruction as its own opening paragraph, in the
imperative and with negatives ("the camera moves constantly and never stops...
never static, never hold still"), is what raised the pan. Same shape as the
fix for the vignette and the tilt: the model does what the prompt insists on,
and a clause buried mid-paragraph is not insistence.

### Veo silently turns reference photos into start frames

Veo exposes no reference role: `veo3` and `veo3_1` take `start_image` only,
`veo3_1_lite` takes `start_image` and `end_image`. Passing `image_references`
anyway does **not** error. The backend coerces every one of them:

```
medias[2].role  requested "image_references"  ->  used "start_image"
reason: "Google Veo 3.1 Lite backend expects schema-key media roles"
```

So attaching four object photographs hands Veo five competing opening frames.
This is worse than omitting them, and it fails silently, which is how it would
be missed. Check the `adjustments` block on every response that carries media.

**The way to give Veo accurate objects is to put them in its start frame.**
Generate the still with the photographs as references, then hand that still to
Veo as `start_image`. The objects are then in the picture it begins from.

### Veo's safety filter rejects this scene

Veo 3.1 at `quality: high` returned status `nsfw` on the walk prompt: a cartoon
man walking to a desk. Veo 3.1 Lite did the same on the idle prompt earlier.
Credits refund automatically, but it is a standing risk on any Veo run here,
and it is the reason a Veo-only plan needs a fallback.

## Dropping the identity photos is what broke the likeness

The desk keyframe came back with a beard and sideburns, and the 10s walk clip
had drifted the chin sharp. Kemal called it: accuracy had been good on the early
stills and had "gone to shit".

The cause is not subtle. The hub frame was generated with **four identity
photographs plus the style reference**. The desk frames were generated with the
style reference, the tower, the cat and the desk layout, and **none of his face
at all**. With nothing to go on, the model invented a man.

This is the rule already written in this document, broken while other parts of
the same document were being quoted:

> pass all seven references, always

It was written after an attempt dropped the *object* photos and the bike, guitar
and amp degraded. The identity photos fail exactly the same way, and a frame
where he is "seen from behind" is not an exemption: the model still has to
decide what the head it is drawing belongs to.

**Every generation of this character carries `fc39e6cc`, `7c955619` and
`48839646`.** No exceptions for shots where the face is meant to be hidden.

Repeating it in the text as well is worth the words, because the photographs fix
shape but the prompt is what forbids additions: clean-shaven apart from the thin
moustache, no beard, no stubble, no goatee, no sideburns, jaw soft and rounded.

## No video model here gives keyframes and references together

Tested, not inferred:

| Model | keyframes + references | continuous take |
|---|---|---|
| Wan 3.0 | 422 | yes |
| MiniMax H3 | 422 | untested |
| FLUX 3 Video | accepted | **cuts, twice** |
| Veo 3 / 3.1 / 3.1 Lite | no reference role; silently coerced to `start_image` | yes |

MiniMax H3's description reads "keyframes **or** references", and that "or" is
literal: `start_image/end_image cannot be mixed with reference media`. The same
sentence as Wan's rejection, different wording.

So the answer to "should we try a different video model" is that the model is
not the variable. Nothing available pins both ends, carries the object
photographs and holds one take. Accuracy has to come from the frame handed to
the model, which is what the two-clip split is for. Changing video model cannot
fix a likeness problem.

A rejected submission is free, so test the combination rather than inferring it
from the model description — and do not use `get_cost`, which prices a request
without validating it.

## Wan 3.0 caps the prompt at 5000 characters

`{"type":"string_too_long","loc":["prompt"],"msg":"String should have at most
5000 characters"}`. It is not in the model's declared parameters and it is not
mentioned anywhere until a submission is rejected. The rejection is free.

This matters because every fix in this project has been made by *adding*
clauses: camera negatives, vignette negatives, an inclusion list to go with the
exclusion list, the cat's colour fenced in three ways. The prompt only grows,
and it now runs close to the ceiling. **Count the characters before submitting.**

The trimming rule that worked: cut description, never constraint. Sneakers,
adjectives and studio boilerplate go; "NO SIDEBURNS", "five-star castor base",
"does NOT centre it" and "HER FUR IS GREY" stay, because each one exists
because something went wrong without it. 5300 characters came down to 4302 with
no constraint lost, checked by grepping the trimmed text for each load-bearing
phrase before sending it.

## Choppiness is duplicate frames, not framerate, and the prompt cannot fix it

Kemal called the walk clip choppy and asked whether it should be 30fps. It
already was: 1920x1080 at 30fps, 300 frames over 10 seconds. Raising the
container framerate fixes nothing when the container is already right.

What "choppy" and "aggy" actually measure as, on the clip he was watching:

- **11.0% of consecutive frames were near-duplicates** (33 of 299). The model
  animates at below 30fps in places and repeats frames. That is the judder.
- **The camera lurched.** Per-frame motion surged and dropped: 19.6% to 5.2% to
  9.7%, then 30.5%, 37.0%, 11.7%, 4.3%. Frame-to-frame change in motion averaged
  3.13 with a peak of 20.8.

**Telling the model not to repeat frames made it worse.** The next generation
added "fluid animation, no judder, no stuttering, no repeated frames" and came
back at **19.1%** duplicates, nearly double, with pacing jerk up from 3.13 to
4.00. Temporal density is not something Wan takes direction on. It is a property
of what it renders.

The same prompt did fix the camera, though: pan bias went from 3.5%, which is
jitter that cancels, to 33.8% directional, and cumulative pan from -69px to
-98px. So "slow, steady, constant speed, never lurch" works on the *path* of the
camera. It does not work on the *rate* of the animation. Two different problems
that both feel like "not smooth".

**Fix the rate in post.** Motion-compensated interpolation to 60fps:

```
ffmpeg -i in.mp4 -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
       -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p out.mp4
```

Pacing jerk fell from **4.00 to 1.76** mean, peak 39.0 to 34.0, at the same
1920x1080. Free, deterministic, no generation spent.

Do not compare duplicate-frame counts across framerates. The interpolated clip
reports 22.8% against the source's 19.1%, which looks like a regression and is
not: at double the rate, adjacent frames are naturally more alike. Pacing jerk
is the measure that survives a framerate change.

### sandbox_exec is capped at 60s by the client

`timeout_seconds` accepts up to 120 but the MCP client cuts the call at 60
regardless. Interpolating 10s of 1080p takes about six minutes. Run it with
`background: true`, write a sentinel file at the end, and poll with
`sleep 45` calls. Chain the upload PUT into the same background command, since
the sandbox is discarded shortly after the call that created the file returns.

## Place objects where the camera actually looks

The sunset canvas did not appear in the clip at all, and the reason was
placement, not wording. The prompt put it "at the LEFT end of the desk". The
camera swings *right* and pushes in on the monitor, so by the time the desk is
framed, the desk's left end is already behind the camera. The object was
specified outside the shot's own path and then asked for.

This is the third instance of one mistake: a chair that was referenced but never
described, a monitor with no arm because only exclusions were listed, and now an
easel placed where the lens never points. **Describing an object is not enough.
Check the camera move will pass over the place you put it.**

The fix keeps it on the left, as asked, but moves it against the monitor's left
edge so it shares the frame the monitor occupies for the whole push-in.

### How to tell "not rendered" from "rendered but missed"

Do not guess. The scene is white, black and blue, so the sunset canvas was the
only warm saturated object in it. Scanning every frame for pixels with
`R > B + 40`, `R > 90` and `R - min(G,B) > 45` found a large warm mass at 6.0 to
7.2 seconds, peaking at 14.9% of the frame.

That was **not** the painting. Its mean colour was R190 G133 B102, a skin tone,
and its behaviour — swelling into the near foreground and vanishing — is the arm
crossing the lens during the petting beat, exactly as scripted. A sunset canvas
would read as saturated orange, nothing near a neutral tan.

Check the *colour* of what a detector finds, not just that it found something.
The warm pixels in the first 1.7 seconds are the red motorcycle, which is also
correct and also not the painting.

### An instruction that made things worse, removed

"Fluid animation, no judder, no stuttering, no repeated frames" took duplicate
frames from 11.0% to 19.1% and pacing jerk from 3.13 to 4.00. It is dropped from
the prompt rather than carried forward: a clause with measured negative effect is
worse than no clause. The camera-path language stays, because that one is
measured to work.

## Negatives remove; they do not de-emphasise

The petting beat was wrong three times running, and each attempt used more
prohibition: "the camera does NOT stop for this, does NOT slow down for it,
does NOT turn toward it and does NOT centre it." Kemal's note each time was the
same, that it looks staged and the camera goes to the cat instead of the screen.

Negatives are the right tool when something should be **absent**. They fixed the
sideburns, the vignette and the warm room. They are the wrong tool when
something should be **present but unimportant**, because prompt attention tracks
word count, and a prohibition is still words spent on the thing. That beat had
its own paragraph and about sixty words, four of which were instructions not to
look at it. The paragraph's size said "this matters" louder than its content
said "ignore this".

**De-emphasis is grammatical.** Name the camera's subject positively, and demote
the unimportant action to a short fragment with no sentence of its own:

> FINAL THIRD. THE CAMERA'S ONLY SUBJECT IS THE MONITOR. It glides steadily
> forward past his shoulder, aimed straight at the black screen... The monitor
> stays dead centre of frame the entire time... His hand brushes the cat's head
> once in passing, low at the edge of the frame.

Sixteen words for the pet, against sixty. One negative rather than four. The
camera is given something to look **at**, which is a stronger instruction than a
list of things not to look at.

The general rule for this model: **say what the shot is about, do not list what
it is not about.** A prompt is a budget, and every clause spends attention on
whatever it names, whichever way it names it.

### The painting was there; the detector was wrong

The previous clip was reported here as missing the canvas, on a scan for
saturated orange that found only skin tones. It was present. That is the fourth
measurement in this project that returned a confident wrong answer, after the
shoulder-versus-screen detector, the cut threshold that could not fire, and the
blue-cat test that could not tell a cat from plaid pyjamas.

The pattern is consistent enough to be a rule: **these detectors are reliable for
large, frame-filling properties** — luminance, evenness, whether a cut exists,
whether the last frame matches the pinned one — **and unreliable for small props
and anything defined by hue.** Do not report on a small object's presence from a
colour test. Ask.

### The result: shortening the prompt improved everything measurable

Cutting the petting beat from about sixty words to sixteen, and its four
negatives to one, moved every frame-filling measure at once:

| | before | after |
|---|---|---|
| Duplicate frames | 4.7% | **2.7%** |
| Pacing jerk | 3.82 | **2.50** |
| Last frame vs pinned end frame | 6.8% | **5.3%** |
| Cuts | none | none |

And the camera held its subject. Tracking the horizontal centre of the large
dark mass through the final third: 53.9%, 54.3%, 55.4%, 58.2%, 55.9%, 53.6%,
51.8%, then 50.2% and holding. It drifts eight points off centre at worst and
returns to dead centre for the push-in, instead of wandering to the cat.

That is four different metrics improving from **removing text**, which is the
clearest evidence yet that this prompt was over budget rather than
under-specified. The instinct through this whole project has been to fix each
problem by adding a clause. Past some point that makes everything worse at once,
and the fix is subtraction.

`walk clip, best version: 2179711b-e1f1-4ab7-8de2-1e22144996fd`

## "Walks off to the right" made him walk out of the shot

Kemal reported a weird cut where he simply disappeared. There was no cut. He
left the frame.

Measured as dark-subject area against the white studio, which is the right
measure for this scene: the frame holds about 9% dark subject at the start, and
between 2.2s and 3.4s it collapses to **3.1%**. In the left half of frame, where
an over-the-shoulder follow should hold him, it goes from 15.1% to **2.94%** and
climbs back only once the desk arrives.

The cause was one phrase, carried unchanged through four prompts without being
re-read: **"He turns away and walks off to the right."** *Walks off* means
exits. It was an instruction to leave the shot, and nothing anywhere in the
prompt said he should stay in it. The camera then had nothing to follow until
the desk appeared.

The "de-emphasise the petting" fix almost certainly compounded it. Naming the
monitor as "THE CAMERA'S ONLY SUBJECT" and adding "never looks at the cat"
removed him from the camera's attention along with the cat.

The replacement states his presence positively and three times over — "visible
in every single frame", "staying in the middle of the picture", "he is always in
shot" — and rebuilds the ending as an over-the-shoulder framing that keeps his
head and shoulder in the foreground rather than erasing him to clear the view.

**Re-read the parts of the prompt that are not being changed.** Every round here
edited one section and carried the rest forward untouched. A phrase that was
wrong from the first draft survives indefinitely, because attention goes to
whatever broke most recently.

### A cut test cannot see a subject vanish against white

The cut detector requires motion above 55% of pixels. In a white studio the
character and props are a small dark fraction of the frame, so a person can
vanish completely while only 10-15% of pixels change. It sails under the
threshold and the test reports "NONE", which it did.

**Track dark-subject area per frame as well.** A sustained collapse in it is a
disappearance; the global motion measure will never show one. This is the fifth
detector in this project to return a confident wrong answer, and the failure
mode is always the same: it measures the whole frame when the thing that matters
occupies a small, specific part of it.

### Result

Stating his presence positively fixed it outright. Frames where the dark-subject
area falls under 4%, meaning he is effectively not in the picture: **22 before,
0 after.** Through the window where he had vanished, 2.2s to 3.0s, the figure
went from 3.1-3.9% of frame to 13.5-14.7%. Minimum across the whole clip rose
from 2.73% to 6.54%.

Nothing else moved much: duplicates 2.7% to 3.7%, pacing jerk 2.50 to 2.66, last
frame against the pinned end frame 5.3% to 5.8%.

`walk clip, current best: a8189d57-e4d2-4fc1-988b-dece3b3c131b`

## The prompt is a fixed budget, and the keyframe is already paying part of it

Kemal's note that it had been "really close not too long ago" is the important
one. It had. Every round since has fixed one beat and broken another:

| Round | fixed | broke |
|---|---|---|
| painting placement | painting appears | petting staged, camera on the cat |
| de-emphasise the pet | camera holds the monitor | he walks out of frame |
| keep him in frame | he stays in shot | chair malformed, **pet gone entirely** |

That is not bad luck three times. Adding ~90 words about his presence pushed the
16-word petting beat below the threshold where the model acts on it, and the
chair lost "plainly something a person can sit on" to a character-count trim in
the same edit. **Attention is conserved.** Every clause added is taken from
somewhere else, silently.

**The keyframe is already paying for a large part of the prompt.** The start
frame is the hub frame: it pins his hair, glasses, clothes, the motorcycle, the
skis, the guitar, the amp, the skateboard, the ball and the studio. All of it is
guaranteed by the pin. Re-describing it in text bought nothing and cost roughly
120 words of attention, taken from the beats that were actually failing.

Cutting everything the keyframe guarantees freed **1,298 characters**, 4,697 down
to 3,399, and that budget went where the failures are:

| | before | after |
|---|---|---|
| The chair | 32 words | **69** |
| Sitting down | 30 words | 32 |
| The petting | 16 words | **39** |

**Describe what the keyframes cannot guarantee, and nothing else.** Anything
visible in the pinned start or end frame does not need words; anything that
happens *between* them does. The chair also gained a list of what it must not be
(warped, melted, bent, half-formed, fused into the desk), since malformed
furniture is a failure of shape, which negatives do address.

One operational note: the preset recommendation is matched on prompt text, so a
rewritten prompt draws a different preset. This one pulled "DROWN IN MUSIC"
rather than "IN THE DARK", and `declined_preset_id` has to match whichever is
actually offered.

## When a clip is close, change one paragraph and prove the rest is identical

The rebalanced prompt landed at "99 percent", with one defect: the chair was
missing an armrest. The whole history of this clip says the danger at that point
is not the fix, it is collateral damage from editing anything else at the same
time. Every previous round edited a section, trimmed something unrelated to stay
under the character cap, and broke a beat that had been working.

So the edit was made programmatically and verified before submitting: replace
the chair paragraph and Kemal's pupils sentence, then substitute a placeholder
for each changed region in both the old and new text and assert the remainders
are equal. `everything outside the chair + pupil edits identical: True`.

Do this whenever a generation is close. A diff that *looks* small is not the
same as a diff that *is* small, and at 3,600 characters an accidental
rewording is easy to miss by eye.

**Name the actual failure mode, not just the object.** A missing armrest is an
asymmetry error, so the fix states the symmetry explicitly: "TWO ARMRESTS, A
MATCHING PAIR, ONE ON THE LEFT SIDE AND ONE ON THE RIGHT SIDE, both fully
present and the same shape as each other", plus "NOT missing an armrest" in the
list of what the chair must not be. Negatives work here because this is a
question of shape, which is what they are good for.

If it misses again, the guaranteed fix is an armless task chair: a chair with no
arms cannot have one missing. That trades the look Kemal asked for against
certainty, so it is the fallback rather than the first move.


## Serving the clips from the repo, and proving the encode is transparent

The page streamed its clips from the Higgsfield result CDN, and those URLs do
not survive deletion of the generation. `f76bd25c` went first. Then the walk
clip wired into `index.html`, `4d06b164`, started returning **403** — so the
call to action was already broken before anyone moved the files.

Everything now loads from `media/` by relative path. `index.html` contains no
CDN reference at all, which is worth asserting on rather than eyeballing.

### The sizes were not survivable as-is

The raw generations run 4.8 to 20 Mbps: 47 MB across four files, on a page that
fetches them on every visit and needs the walk clip ready the instant the button
is clicked. Re-encoded at CRF 21, preset slow, `+faststart`:

| | raw | CRF 21 | |
|---|---|---|---|
| wave | 3.00 MB | 1.65 MB | |
| idle | 16.42 MB | 2.63 MB | |
| walk (candidate A) | 24.96 MB | 5.56 MB | 6.5s to encode |
| hub | 2.81 MB PNG | 0.21 MB JPEG | cropped to 16:9 first |

### Two properties had to be measured, not assumed

**No re-timing.** The idle's loop is closed by a crossfade in the player, not
baked into the file, so a dropped or retimed frame would reopen a seam that
nothing in the file itself protects. Frame counts and durations came through
identical: wave 150/150 at 5.000s, idle 300/300 at 10.000s.

**No luminance shift.** The whole `head` mechanism is calibrated in fractions of
a luminance level, so an encode that brightened the picture by a level would
quietly invalidate every `head` in the player. Measured against the originals,
same mask, same frame numbers:

| | original | re-encoded | delta |
|---|---|---|---|
| wave frame 3 | 237.029 | 237.061 | **+0.032** |
| idle frame 4 | 237.786 | 237.828 | **+0.042** |

And the opening ramps survive: wave -2.17, idle -2.73, against the -2.8 the
originals were measured at. So 0.11 and 0.14 still hold.

The hub frame is cropped 2752x1536 -> 2730x1536 -> 1920x1080 before encoding, a
centre crop to exactly 16:9. The browser was already doing that crop at paint
time through `object-fit: cover`; doing it in advance means the poster and the
clips are the same shape before compositing, and removes the resampling error
that this document records as having accounted for nearly half of an apparent
poster-to-clip mismatch. Against the original PNG put through the identical crop
and scale, the JPEG measures **+0.033** levels.

**The general point.** A lossy re-encode in the middle of a pipeline calibrated
in tenths of a level is a change to the measurement, not just to the file size.
Two comparisons against the original — frame count and masked luminance — cost
one sandbox call and turn "CRF 21 is visually lossless" from a claim into a
number.

## `head` does not carry over between generations of the same prompt

`index.html` carried a comment asserting the walk clip had no opening ramp,
measured at +0.02 levels, and therefore `head: 0`. That was true of the
generation it was written for. It is not true of the ones that replaced it:

| | frame 0 vs settled | head |
|---|---|---|
| candidate A | -0.73 | frame 2, 0.067s |
| candidate B | -0.33 | frame 1, 0.033s |
| candidate C | -0.24 | frame 0 |
| armrest re-run, pair | -0.62 | frame 2, 0.067s |
| armrest re-run, armless | -0.32 | frame 1, 0.033s |

Same model, same prompt to within one paragraph, same keyframes, and the ramp
still moves by half a level between runs. None of these are the -2.8 the wave
and idle open with, so the walk clip's ramp is genuinely shallow — but "shallow"
is not "zero", and the value is per generation, not per model and not per clip
slot. Inheriting it from the clip being replaced is the specific mistake.

## The armrest re-run: one paragraph changed, something else moved anyway

Candidate A was "99 percent there" with one defect, a chair missing its left
armrest. The recorded fix from the generation that solved it and was then
deleted: name the failure mode as asymmetry rather than naming the object.

Two variants went out together, both derived from A's exact prompt by
programmatic replacement of the chair paragraph only, with the remainder proven
byte-identical in both directions before submission. A's prompt is 3,399
characters, which matches this document's own record of the rebalanced prompt
and is a useful checksum on the transcription.

- **pair**: "TWO ARMRESTS, A MATCHING PAIR, ONE ON THE LEFT SIDE AND ONE ON THE
  RIGHT SIDE, both fully present and the same shape as each other", plus "NOT
  MISSING AN ARMREST" in the negatives. 3,541 characters.
- **armless**: an armless task chair. A chair with no arms cannot have one
  missing. 3,476 characters.

Both drew the "DROWN IN MUSIC" preset recommendation and needed
`declined_preset_id`, exactly as this document predicts for this prompt text.

### Both re-runs broke something at 0.85s that A does not have

Measured over the first 40 frames, dark-pixel count and mean luminance:

| frame | A | pair | armless |
|---|---|---|---|
| 22 | 12,303 dark | 11,711 dark | 11,931 dark |
| 25 | 12,320 dark | **1,221 dark** | **4,139 dark** |
| 27 | 12,361 dark | 1,347 dark | 4,850 dark |
| 31 | 12,623 dark | 12,016 dark | 5,749 dark |

A is monotonic across the whole window. In **pair** the darkest pixel anywhere
in the frame goes from 0 to 8 for five frames — nothing truly black is on screen
at all — and then recovers. In **armless** a third of the dark content leaves at
frame 25 and does not come back; mean luminance steps from 216 to 227 and stays
there.

The cut detector reported no cut in either, because it requires >55% of pixels
to move and this does not reach that. **A local discontinuity is not a cut and
will not be caught by a cut test.** The dark-area profile caught it; the cut
test would have passed both clips.

This is the fourth round in a row where fixing one beat moved another, and it
happened despite the edit being provably confined to one paragraph. Confining
the *edit* does not confine the *effect*: attention is conserved across the
whole prompt, so adding 142 characters to the chair takes them from wherever the
model was spending them, which this time was the first second.

### What is not known

Whether the armrest is actually fixed in either clip, and whether the 0.85s
event reads as a defect at speed. Both are eye judgements. The armrest is a
small-prop shape question, which is the category this document already records
as having been wrong five times. Contact sheets were rendered and handed over
rather than guessed at.

## The intro had no exit when the take failed to load

Found by running the page in headless Chromium with the media absent, which is
exactly the state the repo is in between repointing `index.html` at `media/` and
committing the files.

Clicking the call to action did nothing. `#work` stayed hidden, the hero stayed
on screen, and `cta.disabled = true` had already fired, so there was no second
chance. The only way out was the skip link.

The mechanism is in the handoff. `playOnce` does not start anything directly:

```js
el.src = clip.src;
atTime(el, clip.head, () => { el.play(); show(el, fade); });
```

and `atTime` waits on `readyState >= 2`, via a `canplay` listener if it is not
there yet. A clip that 404s, is blocked by a network policy, or stalls on a cold
cache never reaches `readyState 2`, so `canplay` never fires, so the callback
never runs, so `reveal` — which is wired to `onended` inside that callback's
clip — is never reached. The shared `onerror` on the video elements only adds
`is-empty`, which draws a dashed placeholder. Nothing advances the page.

**This was live, not hypothetical.** The walk clip's CDN URL had already started
returning 403, so the deployed hero's call to action was a dead end for anyone
who clicked it.

The fix gives the click somewhere to go in every case: a `playing` listener
marks the take as actually running, an `error` listener and a four-second
watchdog both fall through to the same instant cut the skip button uses, and
`reveal` is made idempotent because the take ending, the watchdog and the skip
button can now all reach it and two of them can race.

**The lesson is about the shape of the code, not the clip.** Any promise-like
handoff that hangs on an event which may never fire needs a failure path, and
media events are exactly that. The page already had careful error handling for
*display* — the `is-empty` fallback, the missing-clips message — and none at all
for *progress*. Degrading the picture is not the same as degrading the flow.

It is also an argument for running the page rather than reading it. Every
measurement in this document is about pixels; this was a control-flow bug that
no amount of luminance analysis would have surfaced, and it took one headless
browser run with the files deliberately missing.


## Edit the video, not the prompt, when a take is close

Seven generations came out of the walk prompt. One was clean. The rest
dissolved mid-shot, dropped the hobby props and the painting, or lost him from
frame. The last three ran a prompt verified **byte-identical by sha256** to the
original and still came out different, which settles the question this document
kept circling: **the variation is the model's seed, not the text.**

That reframes several earlier entries here. "Attention is conserved" is a real
effect and the character-budget rebalance genuinely worked once. But with one
generation per prompt variant, a prompt effect and a lucky draw are the same
measurement. Three variants at 3,399 / 3,476 / 3,541 characters produced
clean / fade / fade, which looked like a clean monotonic and was read as one.
It did not survive: the same 3,476-character prompt later produced a clip with
no fade at all. **One sample per variant cannot separate signal from seed. Say
so rather than narrating a mechanism.**

Two prompt edits made things actively worse:

| edit | fixed | broke |
|---|---|---|
| name the armrest symmetry | (unknown, never judged) | fade cut at 0.85s |
| delete the pinned end-frame description to buy budget back | nothing | hobby props and the painting gone, 20 frames with him lost, fade cut anyway |

The second is the sharper lesson, because the deletion followed this document's
own best-supported rule — do not describe what a keyframe already guarantees —
and still cost the background. The rule is sound; applying it to a take that
was already close was not.

**What worked was not touching the prompt at all.** Genjutsu object replacement
(`hf_mult_replace_object`) takes the source video plus a reference image and
swaps an object, tracking it through the camera move. Fed the one clean take
and a generated image of a correct chair, it returned that take with the chair
fixed: no dissolve, nobody lost from frame, and *smoother* than the source at
2.2% duplicate frames against 5.4%. One generation, against six spent
re-rolling.

**When a take is close and the defect is one object, edit the video.** The
prompt is a lottery ticket; the video edit is a repair.

It is a re-render, not an overlay, so expect it to change global properties.
This one returned 24fps/9.71s instead of 30fps/10.00s and about 7 luminance
levels brighter, and it no longer opened on the pinned hub frame as tightly
(6.6% of pixels against 3.1%). Budget for re-measuring the stitch afterwards.

## A cut test cannot see a dissolve, and edge energy can

The cut detector in this document flags a frame whose motion exceeds three
times the median of its twenty neighbours with more than 55% of pixels moving.
It passed two clips that both contained an obvious fade cut, because a
dissolve is gradual by construction: frame-to-frame motion never spikes.

What catches one is **edge energy**. Blending two shots averages them, which
softens every edge in the frame at once. Mean absolute gradient per frame,
compared against the median over a 31-frame window, and flagged at a 25% drop:

| clip | known | worst drop | verdict |
|---|---|---|---|
| clean take | no fade | 8.9% | none |
| armrest re-run, pair | fade cut | 30% at 0.93s | 8 frames |
| armrest re-run, armless | fade cut | 31% at 0.83s | 3 frames |

8.9% against 30% is a wide gap with the threshold in the middle, and the
detected timings matched both the eye and an independent dark-area measurement.

**Validate a detector on labelled examples before trusting it.** Kemal had
already named the defect, which made three clips with known answers available
for free. A detector that has never been shown a positive and a negative is a
hypothesis.

**And cross-check every hit against motion.** A real dissolve drops edge energy
while motion stays high, because two shots are moving underneath. A frame that
merely flattens — the camera filling the frame with a large black monitor —
drops edge energy while motion goes *low*. That distinction turned a flagged
"dissolve at 7.60s" into a correctly-identified camera slowdown: motion fell
from 7.1 to 2.4 across the window, the opposite of the dissolve signature.
Without the cross-check it would have been reported as a fade cut that was not
there, which is exactly the class of error this document already records five
of.

## When a clip opens both dark and on a pose, the pose wins

`head` exists to skip a dark opening ramp. For the wave and the idle that is
the only constraint, because they open on the hub frame by construction.

The Genjutsu walk clip broke that assumption. Its luminance ramp said frame 9.
Its match to the hub pose said frame 0, and got monotonically worse from there
as he turned away:

| frame | vs hub, brightness-normalised |
|---|---|
| 0 | **6.61%** |
| 9 | 9.57% |
| 23 | 17.29% |

Following the luminance rule would have traded a visible pose jump for a
1.5-level dip that the incoming crossfade hides anyway. So `head` is 0.

The brightness gap was left uncorrected, also on measurement. Both stage layers
carry `--clip-lift` 1.085, and the studio at 221 and 218 both multiply past 255
and clip to white: **0.85%** of studio pixels differ once composited, against
41.9% before the lift on the subject. This is the same clipping argument that
clears the poster-to-clip gap elsewhere in this document, and it is the second
time it has decided not to spend a correction. Correcting here would also have
darkened the final white panel away from `--bg`, which the re-render matches
more closely than the original take did.

What the lift cannot hide is the subject: 47.7% of his pixels differ against
the idle, where the original take managed 20.6%. That is pose, not level, so
the idle-to-walk crossfade went from 320ms to 500ms — spent over the half
second where he is turning away, which is the cheapest half second in the take.

**Decompose a mismatch before trying to fix it.** The raw number was 28.9% of
pixels, which reads like a broken stitch. Two-thirds of it was a flat
brightness offset that the browser clips away, and the third that remained was
in 13% of the frame. Those three components need three different responses, and
the aggregate number suggests none of them.


## Mobile was switched off, and turning it on is not just removing the gate

The player excluded phones from all video: `if (!reduced && !mobile)` skipped
the wave and the idle, and `enter()` sent mobile down the same instant-cut path
as reduced motion. So a phone got a static poster, and the call to action
jumped into the site instead of playing the take. Reported from an actual
phone, which is the only way this surfaces -- every headless check passed,
because "no video on mobile" was the intended behaviour being asserted.

Removing the gate alone would have been worse than leaving it. The clips are
16:9 and `.stage` uses `object-fit: cover`, which on a portrait viewport scales
to fill the height:

| viewport | 16:9 scaled to cover | frame width visible |
|---|---|---|
| 390x844 | 1500px | **26%** |
| 430x932 | 1657px | 26% |
| 820x1180 | 2098px | 39% |

A quarter of the frame width, centred. That is bad for any shot and fatal for
this one: the walk pans right to the desk, so a centred slice watches him leave
and then holds on empty studio for six seconds.

So portrait switches to `object-fit: contain` under a `max-aspect-ratio: 1/1`
query. The whole frame shows as a band against `--bg`, which the stage already
paints, so the composition survives intact. This is interim; the 9:16
regeneration is the real fix and that media query is what it replaces.

Autoplay needs nothing extra: the elements are already `muted` and
`playsinline`, which is what mobile browsers require. If one refuses anyway,
`play()` rejects into the existing catch, the poster stays, and the button
still works because the click is a user gesture.

**The lesson is about what a test asserts.** The headless suite covered mobile
from the start and passed every time, because it asserted the behaviour that
existed rather than the behaviour that was wanted. A test written against a
placeholder pins the placeholder. When the intent changes, the assertion is the
thing to change first.

## The fourth flash: animating opacity on a full-viewport layer

Fading the headline and the call to action when the take starts was done the
obvious way, by animating opacity on `.overlay`, their common parent. Kemal saw
a flash at the moment of the press immediately afterwards.

The compositing was not at fault, and that was worth establishing before
touching anything. The idle-to-walk swap was driven in a headless browser with
synthetic clips dark enough (100 and 110 against a page at 241) that any
background bleed would be unmissable, and the composite was sampled every
~35ms across the transition:

| | result |
|---|---|
| fast local clip | 109 -> 120, monotonic, no spike |
| walk delayed 1.5s | holds 109 with A at opacity 1, no gap |

In both cases the outgoing layer sat at opacity 1 under the incoming one and
only dropped once it was fully covered, exactly as designed. So the layer logic
is sound in both timing regimes.

What was left was the thing that had just changed. `.overlay` is
`min-height:100svh` and stacked over a playing video. Animating opacity on an
element that size makes the compositor promote it to its own layer for the
duration and re-rasterise, and a re-raster over a decoding video shows as a
single-frame flash. The elements that actually needed to fade -- the headline,
the button, the skip link -- are small, so promoting them costs nothing.

**Fade the pieces, not the container.** The container is the convenient handle
and the wrong one, because its size is what makes the promotion expensive.

The measurement lesson is separate and worth keeping: **a screenshot-sampling
test forces a fresh raster, so it cannot see a compositor glitch.** Both runs
above came back clean and the flash was real. What they were good for was
ruling out the blend, which is what made the remaining cause obvious by
elimination rather than by guessing at it.

## The white flash was the dissolve, and lengthening it was the cause

Kemal reported a white flash at the press. The blend was instrumented three
ways before anything was changed:

| instrument | result |
|---|---|
| screenshot sampling, fast local clip | 109 -> 120 monotonic, no spike |
| screenshot sampling, walk delayed 1.5s | holds at 109, outgoing layer opaque |
| **Playwright video recording**, real compositor output | flat 103.5 across the press, 0% bright pixels |

The recording matters because the earlier note here is right that screenshots
force a fresh raster and cannot see a compositor glitch. `recordVideo` captures
what the compositor actually produced, and it was clean. So the swap was not
the problem.

**What narrowed it was asking what on this page is white.** Nothing is whiter
than the clips: `--clip-lift` 1.085 drives the studio at 237 to 257, which
clips to pure 255, while the page and the cover are both 241 and therefore
darker. A white flash cannot be page background showing through, because that
would read as a *darkening*. The only way to get whiter is for something dark
to stop being there -- and the only dark thing is him.

That is exactly what a dissolve between two clips with a pose mismatch does.
The walk clip is a re-render whose opening pose differs from the idle across
47.7% of his pixels. For the length of the blend both versions of him are on
screen at partial opacity over a studio already at 255, so he washes out toward
white and then resolves.

**The crossfade had been lengthened from 320ms to 500ms specifically because
the pose mismatch was bad, which is backwards.** A longer dissolve is the right
treatment for a *level* mismatch, where the two images agree about where
everything is and only differ in brightness. For a *position* mismatch it is
the worst available treatment, because it gives the eye time to resolve the
double exposure. The fix is the opposite: 140ms, short enough that the change
reads as a cut, against 87% of frame that matches to 0.85% and so has nothing
to show a cut in.

**Match the transition to the kind of mismatch.** Level mismatch wants a long
blend. Pose mismatch wants a short one, or a hard cut. Reaching for "fade it
longer" whenever a seam shows is how a fix for one becomes the cause of the
other.

## Finishing the camera move in CSS

The take ends with the monitor head on but only filling 70% of the frame width
and 68% of its height, measured on the final frame, with the bezel and a band
of studio still visible. Kemal wanted the screen at full frame before the
handoff.

Pushing further inside the clip means regenerating it, which this document
already establishes is a one-in-seven lottery. The last part of the move is
done in CSS instead: a `transform: scale(1.5)` on the video element with
`transform-origin` at the panel's measured centre, 53.5% across and 45.8% down,
started 1.5s before the end and running 1400ms.

Two numbers worth keeping. The scale needed to cover is 1.429 horizontally and
1.469 vertically, so 1.5 clears both with margin and no bezel survives at any
viewport aspect. The origin is not the centre of the screen, because the panel
is not centred in the frame; using 50%/50% would drift the screen off to one
side as it grows.

The timing is set by the content: the panel is solid white from about 8.2s of
9.71s, so the push starts once there is nothing left in frame but the screen,
and lands as the cover takes over.

## --clip-lift was matching the wrong two numbers, and that is the white

Third report of a flash at the press, and the first two fixes were both wrong
because they treated the symptom. The cause is one line in `:root`.

The lift was set to 1.085 on this reasoning, recorded in the comment: "the
clips render their studio at about 222 luminance, the design sits nearer 241".

**222 is the whole-frame mean.** It averages the white studio together with his
dark hair, his clothes, the black motorcycle and the amp. It is not the studio,
and the studio is the only part that is supposed to correspond to the page.
Masked to the studio the clips measure 237 (wave), 238 (idle) and 242 (walk),
against a page at 240. They already matched to within three levels.

Multiplying an already-matched 237-242 by 1.085 gives 257-262. Both clip:

| | |
|---|---|
| studio pixels pinned at 255 | **88.8%** (walk), 72.5% (idle) |
| shading in the white room | crushed flat |
| picture against the page it sits in | 15 levels brighter |

So the entire hero has been rendering its studio as blown pure white. That is
why every artefact in it reads as *white* specifically: at 255 there is nothing
brighter on the page, so anything dark that leaves frame -- his body during a
dissolve, or the headline fading out -- exposes maximum contrast against a
clipped background.

With the lift at 1, measured over the press in a recording: **0% of pixels
clipped**, against 88.8% before, and the brightening across the text fade is
gradual, largest frame-to-frame step +6.1 levels.

**Never match a flat background colour against a frame mean.** Mask to the
pixels meant to correspond. The same error is what produced the bogus 0.24
figure corrected earlier in this document; that one was caught because it
failed to reproduce, this one survived for weeks because 1.085 looked like a
plausible number and nothing re-derived it.

Two things fall out of the fix. The `.settle` taper is gone, because with no
lift there is nothing to ease and the panel arrives within a couple of levels
of `--bg` on its own. And the two earlier "fixes" for this flash were both
unnecessary: the crossfade length was never the cause, and it is now back to a
middle value.

## A transition declared on the state class never runs

The monitor push-in teleported. Measured: computed scale went 1 -> 1.5 between
consecutive 50ms samples, with nothing in between.

```css
.stage video.zoom{ transition:transform 1400ms ...; transform:scale(1.5) }
```

A transition cannot start when the `transition` property is introduced by the
same style change that sets the new value. There is no previous computed style
carrying that transition, so the value snaps. The transition has to already be
on the element before the change.

**`.settle` had the identical bug**, which means the `--clip-lift` taper this
document describes as "easing out over the same 450ms as the cover" has never
eased anything since it was written. It was always an instant jump. Two
separate entries here describe its behaviour as if it animated.

Moving the declaration to the base rule fixes the teleport but breaks
elsewhere: `show()` writes an inline `transition` for the crossfade, and an
inline declaration beats the stylesheet, so the transform transition would be
silently dropped whenever a layer was swapped. **A keyframe animation avoids
both traps**, because `animation` is a separate property that neither the
same-frame problem nor `show()` touches. Measured after the change: 21
intermediate samples between 1.0 and 1.5.

**Check that an animation actually animates.** Both of these snapped for months
and read as correct in the source. Sampling the computed value twice, at the
start and in the middle, is the whole test.

## The last flash: the take was loading into the layer that was on screen

Kemal found this one by noticing when it happened rather than what it looked
like: only when the button was pressed during the wave.

The wave plays on element C. So did the take. Pressing during the wave meant
`playOnce` reassigned `.src` on the layer that was live and visible, and
`show()` opens with:

```js
if (el === live) return;
```

so no crossfade ran at all. The element simply emptied while the new file
loaded, exposing whatever was beneath, and then the take appeared. Press during
the idle instead and C is free, the crossfade runs normally, and there is
nothing to see. That is why three rounds of measuring the idle-to-walk blend
all came back clean: **the blend was never broken, the case being measured was
the one that works.**

Two changes, because the trigger and the bug are different problems.

The take now picks a layer that is not live, preferring C and falling back to
whichever of A or B is free. That is the actual fix and it holds regardless of
when the press lands.

The button is also held back until the wave ends. That is not a workaround: the
wave is a greeting, and cutting it off mid-gesture to start walking reads as a
glitch even with the compositing correct. It ships `disabled` and is enabled
when the wave hands over, so while invisible it is also unclickable and out of
the tab order rather than an invisible hit target over the video. A timer
enables it regardless after 8s, because an intro whose only exit never arrives
is the dead end this file already fixed once.

**When a bug is conditional, the condition is the evidence.** "Only during the
wave" pointed straight at the one element the wave and the take share, after
three rounds of instrumenting the wrong transition.

## Scaling about an off-centre point reads as drifting, not pushing

The push-in scaled about the panel's own centre, 53.5% across and 45.8% down.
That pins the panel centre and streams the rest of the frame outward around it.
Because the pinned point is off-axis, the move looks like it slides diagonally
rather than pushing straight in.

Scale about the element centre and translate by the offset instead. A point p,
as a fraction of the box, lands at `0.5 + (p - 0.5) * s`, so bringing the panel
centre to the middle needs `t = -(p - 0.5) * s`:

| | |
|---|---|
| x | -(0.535 - 0.5) x 1.5 = **-5.25%** |
| y | -(0.458 - 0.5) x 1.5 = **+6.30%** |

Verified on the computed matrix: `matrix(1.5, 0, 0, 1.5, -75.6, 56.7)` in a
1440x900 box, which is exactly -5.25% and +6.3%.

**`transform-origin` holds a point still; it does not aim a move.** To push
toward something off-centre, translate it to the middle as it grows.

## Bank the press instead of hiding the button

Holding the call to action back until the wave finished fixed a real problem
and created a worse one: for the first seconds of the page the only
interactive element simply was not there.

The press is banked instead. `enter()` checks whether the greeting has
finished; if not it sets a flag, marks the button as working, and returns
without touching anything else. The wave's end handler either starts the take
or falls through to the idle loop:

```js
const waveOver = () => {
  if (waveEnded) return;
  waveEnded = true;
  if (queued) enter(); else idleLoop();
};
```

So the greeting is never cut short, the button is never missing, and a press
during the wave costs the user nothing but the remainder of the wave. It also
exercises the live-layer fix properly: when a banked press fires, C is the
layer showing the wave, so the take correctly loads into A instead.

Three states worth keeping tested, because they interact: press during the
wave, press during the idle, and skip while a press is banked. The last one
needs the banked press dropped *and* the latch set, or the wave's end handler
revives a take the user has already skipped past.

**A control that cannot be used yet should look busy, not absent.** Hiding it
removes the affordance; disabling it refuses the input; banking it keeps the
promise and just defers the payoff.

## The hero layout, measured off the Figma frame

Kemal supplied a 2000x1102 reference. Rather than eyeballing it, every value
was read off the frame and then verified in the browser:

| | reference | rendered |
|---|---|---|
| headline cap height | 165px, so 227px at Inter's 0.727 cap ratio = **11.35vw** | 227px |
| headline text width | 76.0% of frame | 75.2% |
| headline top inset | 12.3% of height | 12.0% |
| tagline size | 28px = **1.38vw** | 28px |
| tagline centres | 35.8% and 64.3% | 36.3% / 63.6% |
| pill right inset | 11.0% | 11.0% |
| pill vertical centre | 50.8% | 50.8% |

Two things that only fell out of measuring.

**The tagline is one line broken around him.** "A seriously good" left, "Product
designer" right, same baseline, symmetric about 50%. What makes it work is the
gap, 16.2% of the width, which is what clears his head. A flex row with that
gap keeps the two halves symmetric at any width, which matters because he is
centred in the video. On a phone there is no width for both phrases plus a gap
that wide, so they stack.

**The pill has to be positioned against the frame, not the text column.** It
was inside `.overlay`, which is capped at `--stage-max` and centred, so at a
2000px viewport an 11% inset measured inside that container put the pill 16%
in from the real edge. He is centred in the video, which is full bleed, so the
pill moved into `.hero` and is measured against the same box the video fills.
Now 11% holds at every width.

The pill itself: no fill at any time, including hover, which thickens the
outline instead, because a solid fill at this size covers a real part of the
shot. The dashes are `2 2` against `pathLength="100"`, so a dash is 2% of the
perimeter whatever the button's size and the density matches the reference at
every breakpoint. They travel clockwise because an SVG rect is drawn clockwise
from its top-left and a negative `stroke-dashoffset` advances along that
direction; the offset shifts exactly one period (-4) per cycle so the loop is
seamless, at 2s per period, which is a full lap every 50 seconds.

## An SVG rect with rx="999" is an ellipse, not a pill

The call to action rendered as an oval. `border-radius:999px` on a CSS box
gives a pill because the radius is clamped proportionally, but an SVG rect
does not work that way: **rx is clamped to half the width and ry to half the
height, independently.** On a 290x78 button that is a 145px horizontal radius
against a 39px vertical one, which is an ellipse.

Measured across every way of writing it, on that box:

| form | rx | ry | flat top edge |
|---|---|---|---|
| `rx="999" ry="999"` | 999px | 999px | 8.3% |
| `ry="999"` alone | auto | 999px | 8.3% |
| `rx="999"` alone | 999px | auto | 8.3% |
| CSS `rx:999px;ry:999px` | 999px | 999px | 8.3% |
| **CSS `rx:39px;ry:39px`** | 39px | 39px | **33.8%** |

8.3% is just the apex of a curve. A real pill has a third of its outline flat
along the top. Note that `ry` alone does not rescue it: `rx:auto` resolves to
ry's *specified* value and is then clamped to half the width all the same.

A pill needs `rx = ry = height/2`, and CSS has no length that means "half the
height of this element". So the script measures the button and writes the
radius into a custom property, re-measuring on resize, which also covers the
webfont arriving late and the font-size clamp changing with the viewport. The
`em` fallback in the stylesheet is correct at today's metrics and covers the
frame before the script runs; the measured value is what keeps it correct when
the face or the padding changes.

**The general trap: CSS and SVG do not share rounding semantics.** A value
that is idiomatic in one is wrong in the other, and the failure is visual
rather than an error.

## Letter-spacing, measured against the reference rather than judged

The reference sets "Kemal Rahman" 1520px wide at a 227px face. Rather than
nudging the value by eye, Inter's latin subset was fetched and the string
measured at every plausible combination:

| | -.045em | -.05em | -.055em | -.06em |
|---|---|---|---|---|
| Inter 700 | 1522 | 1509 | 1495 | 1482 |
| **Inter 800** | 1545 | 1532 | **1518** | 1505 |
| Inter 900 | 1568 | 1555 | 1541 | 1528 |

Inter 800 at -.055em lands 1.8px off 1520, which is 0.1%. Inter 700 at
-.045em is equally close on width but is a lighter face than the reference.

Worth recording how this was measurable at all: Chromium in this container
cannot load Google Fonts, so every earlier measurement of the headline's width
was taken in a fallback face and was meaningless. `curl` **can** reach
fonts.googleapis.com when pointed at the proxy's CA bundle at
`/root/.ccr/ca-bundle.crt`. Fetching the woff2 and loading it with `FontFace`
makes type metrics measurable locally.

## The reference frame's aspect is not the browser's

The reference put the headline 12.3% down the frame. Transplanted faithfully,
the tagline sat on his head.

The frame is 2000x1102, an aspect of 1.815. The clips are 16:9 and the stage
uses `object-fit: cover`, so at a 16:10 window the video is scaled to fill the
height and cropped horizontally, and he rides higher in the viewport than he
does in the Figma. The masthead moved to 7.5vh.

**A measured proportion transfers only within the aspect it was measured at.**
The horizontal figures here all held exactly, because cover cropping at these
viewports is horizontal and the composition is centred. The vertical one did
not, for the same reason.

## Size the masthead against the thing it collides with

"Too close to my head" had a number behind it. On the hub frame, scanning only
the centre 40-60% band so the motorcycle and the skis cannot be mistaken for
him, his hair starts at y=309 of 1080: **28.6% of the frame height**. With
`object-fit: cover` on a viewport narrower than 16:9 the video is scaled by
height, so that is 28.6% of the viewport too.

Measured against that line, the tagline was not close to his head, it was on
it: bottom at 29.6% on a laptop and 31.8% at 16:9.

Moving the block up was not enough on its own, and the reason is the useful
part. **The headline is sized off the width (11.35vw) but what it collides
with is a height.** At wide viewports it grows, the block gets taller, and the
tagline is pushed further down onto him. So the laptop was fine at 3.3pp of
clearance while 16:9 sat at 1.1pp and the reference's own 1.815 was negative.

`min(11.35vw, 17.5vh)` fixes it by letting whichever dimension is binding
actually bind. Clearance across desktop shapes after the change:

| | tagline bottom | head | clearance |
|---|---|---|---|
| 1440x900 | 24.6% | 28.6% | 36px |
| 1920x1080 | 24.9% | 28.6% | 40px |
| 1512x982 | 24.5% | 28.6% | 40px |
| 2000x1102 | 24.9% | 27.1% | 24px |

It costs about 3% of the headline's size at laptop aspects, which nobody can
see, against a tagline on his hair, which everybody can.

**Ultrawide letterboxes now too.** Past 2:1 cover crops off the top instead of
the sides, 360px of it at 21:9, which puts his hair at 4.8% of the viewport
with the headline across his face. Both extremes now use `contain` and for the
same reason: cover discards the part of the composition the layout is
positioned against. The portrait half remains interim until the 9:16
regeneration.

**A layout positioned against content in a video has to be measured against
that content**, not against the frame the designer drew. The design put the
tagline beside his head deliberately; only measuring showed that in a browser
it was landing on top of it.

### A replace without an assert is a silent no-op

Two edits in this round wrote nothing and reported success, because the
comment text they matched on had been reflowed by an earlier edit. The first
was caught only because the re-measurement came back byte-identical to the
previous run, which is a weak signal that happened to be visible here and
would not be in most cases.

Every programmatic edit in this file asserts its match count first. The two
that skipped it are the two that failed.

## Second scene: trinkets, overscroll, monitor chrome

### The social icons did not need the scene regenerated

They are 3D renders generated separately, background-removed to transparent
PNG, scaled to 320px and layered over the stage as ordinary DOM. Nothing about
the video changed, and nothing about them risks it. This is the pattern for
any future prop that wants to be interactive: **generate it as a separate
cutout and composite in the browser, rather than putting it in the clip**,
because anything inside the clip cannot be hovered, linked or changed without
another trip through the generation lottery.

They sit in `.hero`, not `.overlay`, for the same reason the pill does: they
are positioned against the frame the video fills, not against the capped text
column.

Each drifts on its own clock (5.5s to 7.1s, with negative delays so they start
out of phase) so the column never pulses in unison. Hover pauses the drift and
applies a transform, rather than adding motion on top of motion, so the
reaction is legible instead of fighting the idle.

### The hero answers a scroll it cannot perform

The page is exactly one viewport tall until the take reveals the rest, so a
scroll gesture on the hero has nowhere to go. Swallowing it reads as a broken
page. Instead the hero lifts against resistance, the note underneath comes
into view, and release springs it back.

The resistance is exponential, `PULL_MAX * (1 - exp(-raw / PULL_MAX))`, not
linear. The first pixels move freely and the last barely move at all, which is
what makes it feel elastic rather than like a short scroll. Measured at the
ceiling: 167.5px against a PULL_MAX of 170.

**The arc and the text on it share one SVG whose viewBox is set from the
element's own pixel box.** The alternative, drawing the shape with
`preserveAspectRatio="none"` and the text separately, stretches the glyphs;
matching the viewBox to the box 1:1 means the text sits on the arc exactly
instead of approximately, at any width.

### The wall covers before anything changes

Going back to the hero is two phases on one element: it falls from above to
cover the screen, the hero is restored behind it, then it keeps travelling and
clears off the bottom. Covering first is the whole trick, the same principle
as the crossfade rule elsewhere in this document: the swap is never on screen.

### A `const` inside `boot()` is not available to the back button

The back button restarts the greeting, so it needs the wave's end handler.
That handler was a `const` arrow function declared inside `boot()`, so the
click threw `waveOver is not defined` and, because the exception aborted the
rest of the handler, **the wall stopped mid-fall and stayed covering the
screen**. The visible symptom was a black screen, four statements away from
the actual cause.

Worth keeping as a debugging note: the test reported both the exception and
`wall: matrix(1,0,0,1,0,0)` in the same run, and the second is what made the
first obviously fatal rather than incidental. **Assert on the end state, not
just on the absence of errors** -- and equally, when an error is present, read
the state assertions as its consequences.