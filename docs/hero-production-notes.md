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

| Clip | Start frame | End frame | Notes |
|---|---|---|---|
| Wave | hub | hub | Plays once on load, hands off to idle |
| Idle loop | hub | hub | Seamless because both ends are the same still |
| Walk / sit / push-in | hub | black monitor | One continuous camera move |

The hub frame is the single still every clip starts or ends on. That is what
makes the stitch invisible. The final clip ends on a monitor filling the frame
with the screen off; the last frames are hard-faded to pure black in ffmpeg and
the page background is the same black, so the handoff is black-to-black.

## Character lock

- Long dark wavy hair to the shoulders, middle part
- Thin round wire-frame glasses
- Thin moustache, **no goatee or chin hair** (removed at Kemal's request)
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

The hub frame is `ff8cc524-3c4c-43ec-b199-65288e916619`, a fresh generation.
Feed that job id straight into the video calls as the start frame.

```
hub frame (current)   job  ff8cc524-3c4c-43ec-b199-65288e916619
```

Measured: headroom above the hair 34.6%, character height 61.8% of frame, feet
clear of the bottom edge, background red-minus-green `+0.63` and even to within
1.9 levels corner to corner, nothing in the upper band, right third open for the
walk path.

Superseded attempts, kept only so the failures are not repeated:
`691206aa` (clean top but feet clipped at the bottom edge), `0a691dcd` (props
intruding into the headline area), `2a672255` (correct in every respect except
the character came out at 70.8% height).

## Getting the framing right

Two things drive the composition and both took several attempts to pin down.

**Passing a full scene as a reference locks the framing.** Asking for a pulled
back camera while passing the previous render as reference returned the character
*larger*, at 80% of frame height. Image-to-image anchors to the reference
composition and will not rescale it. Pass identity photographs only, never a
previous full frame, and describe the scene fresh.

**Reference photographs bias the character larger.** Same prompt, text only, put
him at 61.5% height; adding the four identity photographs pushed it to 70.8%. The
fix is to overshoot: ask for roughly 40% height and 55% headroom and it lands
near 60% and 35%. Do not ask for the number you actually want.

Framing language that works: "wide cinematic hero banner", "the upper N percent
is blank copy space for a headline", "a small distant figure in a gigantic empty
studio", plus an explicit instruction that both sneakers stay clear of the bottom
edge, which one attempt got wrong.

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

1. Sign off the hub frame `ff8cc524` by eye, above all whether the face still
   reads as Kemal.
2. Decide whether the moustache stays.
3. Agency name and the tagline that sits under "Hi, I'm Kemal."
4. Generate the three clips from the hub frame, then extract each clip's real
   last frame with ffmpeg for the poster images rather than trusting the still
   that was fed in.
5. Build the page: the video stitcher, a skip control, reduced-motion handling,
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
