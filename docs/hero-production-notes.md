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

**0.24 levels apart**, inside the 0.3-level tolerance that defines `head` in the
first place. And `--clip-lift` is applied to `.stage img` as well as
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
