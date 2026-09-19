# Hero section — production notes

Working state for the animated hero. Written so this can be picked up cold after a
break. No personal reference photos are committed here; they live outside the repo.

## Concept

A stylized 3D cartoon version of Kemal stands in a white studio surrounded by
static hobby props. The frame idles with small motion (breathing, blink, weight
shift) and an opening wave. On clicking the call to action he walks right to a
desk, sits, the cat jumps onto the PC, and the camera pushes past his shoulder
into the monitor, which goes black. The site then boots on underneath.

## Clip plan

| Clip | Start | End | Model | Status |
|---|---|---|---|---|
| Wave | hub | hub | Wan 3.0 | not started |
| Idle loop | hub | hub | Wan 3.0 | **done**, media `7fef8f52-abc3-4ee6-9a7c-fb8df5d995f1` |
| Walk / sit / push-in | hub | black | Veo 3.1 | not started |

The hub frame is the single still every clip starts or ends on. That is what
makes the stitch invisible. The final clip ends on a monitor filling the frame
with the screen off; the last frames are hard-faded to pure black in ffmpeg and
the page background is the same black, so the handoff is black-to-black.

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

## Baking a seamless loop

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

The hub frame is media `bb93a0a8-27ef-4694-9bf3-c9b0aba3d9d5`, **approved by
Kemal on 2026-09-18 and locked**. It is the
generation `f362d44f-7fde-4539-8fbd-93d0c3dd4f5f`, whose props Kemal approved,
scaled down 6% in code to correct the framing. Feed the media id to the video
calls as the start frame.

```
hub frame (current)   media  bb93a0a8-27ef-4694-9bf3-c9b0aba3d9d5
  built from          job    f362d44f-7fde-4539-8fbd-93d0c3dd4f5f
```

Measured: headroom above the hair 35.0%, character height 60.2%, feet at 95.2%,
background red-minus-green `-0.52`, even to within 0.3 levels corner to corner,
nothing in the upper band, no seam detectable at the composite boundary.

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
2. Decide whether the motorcycle wobble in the idle loop is acceptable. The
   props were told to stay rigid; the bike still shifts across 6.3% of its
   pixels between frames, against 1.4% for the guitar and amp. Fixing it means
   regenerating the loop.
3. Generate the wave and walk clips, then extract each clip's real last frame
   with ffmpeg for the poster images rather than trusting the still fed in.
4. Build the page: the video stitcher, a skip control, reduced-motion handling,
   a mobile path that shows the hub still instead of the walk, and the
   black-screen boot handoff.

## Account state

On 2026-09-16 Higgsfield refused generations with "You've reached the daily
generation limit for your grace period." Credits were not the cause; the balance
was about 1,304. The ledger shows subscription credits granted on 6 August and
none in September, so the September renewal did not go through and the account
is in a payment grace period with a daily cap of roughly five generation jobs.
The cap does reset daily; it had cleared by the next morning.

Budget generations accordingly while this lasts, and prefer deterministic image
work over generative retries where the two are interchangeable.
