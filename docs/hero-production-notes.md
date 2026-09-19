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
