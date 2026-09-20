# The walk, as two clips

> **Superseded, kept for the reasoning.** The two-clip split described here was
> not what shipped. Wan 3.0 produced an acceptable single 10s take pinned hub
> frame to end frame, and the surviving candidates and their measurements are in
> `START-HERE.md`. The prompt analysis below is still the record of *why* each
> clause exists, and the chair, cat and petting notes were all carried into the
> single-clip prompt. Do not generate from the two-clip plan below without
> reading `START-HERE.md` first.

Superseded the single 10s clip. The reason is accuracy, not length.

Wan 3.0 will not take `start_image`/`end_image` together with
`image_references` (422), and it is otherwise the best model here: 1080p at
30fps, no cuts, a `head` of 0, and the tightest landing on a pinned end frame.
So the objects cannot be passed to the video call as photographs.

**They go into a keyframe instead.** Image generation always takes references,
so the desk, the computer, the chair, the painting and the cat are locked into
an intermediate still generated *with* Kemal's photographs, and the walk is cut
in two at that still. Both clips pin both ends, so both seams are invisible for
the same reason the wave and idle loops are.

It also fixes a second problem. Ten beats in ten seconds made the model drop
some. Five beats per five-second clip is the density the plan actually wanted.

```
clip A   hub frame  ->  desk frame     Wan 3.0, 5s, 1080p
clip B   desk frame ->  end frame      Wan 3.0, 5s, 1080p
```

`generate_audio: false`, `enable_thinking: true`, and pass
`declined_preset_id` when a preset recommendation blocks submission — this
prompt reliably draws "IN THE DARK".

## What changed from the first attempt, and why

Kemal's notes on the 10s Wan clip, each of which is a prompt bug:

**He sat on air.** The prompt said "he reaches the chair and sits down" and
never established that a chair existed. Same failure as the floating monitor:
an object referenced without ever being described into the scene. The chair is
now a real object, in the desk frame *and* in the text.

**The cat was blue.** The prompt said "short plush blue-grey fur". That is
where the blue came from. She is plain grey, said in the positive and then
fenced with negatives.

**The petting looked staged.** The prompt wrote it as a beat: "he raises one
hand and reaches across to pet the cat's head". That instructs the model to
stage and feature the action, so it reads as posed. It is meant to be
incidental — something caught in passing while the camera is busy going
somewhere else, with his arm partly blocking the frame. The camera must not
stop for it, slow for it, or centre it.

**His chin came out too sharp.** Character drift from the hub frame. Named
explicitly now.

**The painting changed.** The green cartoon figure is dropped; it is a simple
sunset over mountains.

**The computer was too busy.** Simplified to a glass side panel, three blue
ring fans and one dark graphics card. Semi-accurate beats cluttered-accurate.

## Clip A — hub frame to desk frame

> One single continuous camera move with no cuts and no edits, in the same
> stylized 3D animated feature film look as the first frame.
>
> THE CAMERA MOVES CONSTANTLY AND NEVER STOPS. It is a dolly move, not a
> locked-off shot. It tracks forward through the room the whole time and swings
> smoothly to the right as it goes. It is never static, never holds still.
>
> The man turns away from camera and walks off to the right. The camera follows
> him from behind, drifting forward so we see his back and his long dark wavy
> hair, and swinging smoothly right as he crosses the room. His jaw and chin are
> soft and rounded, not sharp, not angular, not pointed.
>
> The motorcycle, the skis, the guitar, the amp, the skateboard and the soccer
> ball all slide out of frame to the left and are left behind. They stay
> perfectly still as they pass; nothing rolls, tips or drifts.
>
> As the camera comes around to the right his desk is already there in the same
> seamless white studio: a plain black rectangular desk on straight black legs,
> a grey mesh-backed office chair on castors standing at it, a wide black
> monitor held on a chunky black articulating arm that meets it at its lower
> left, and to the right of the monitor a plain black tower computer with a
> clear dark glass side panel, three glowing blue ring fans and one dark
> graphics card inside. The monitor screen is switched off and completely black.
> At the left end of the desk a small pale wooden easel holds a canvas painted
> with a simple sunset over mountains, purple peaks against bands of orange and
> pink.
>
> A cat trots in from off-frame at the right and crosses toward the desk: short
> plush fur in a plain ordinary neutral grey, the grey of wet slate, with
> yellow-green eyes. Her fur is NOT blue, NOT blue-grey, NOT silver-blue.
>
> He reaches the desk and stands at the chair, seen from behind over his
> shoulder, one hand going to it. The clip ends there, with him standing.
>
> The studio stays the same clean neutral white throughout. No warm lamp light,
> no beige walls, no wood floor, no door, no domestic room.
>
> Smooth continuous forward camera motion. No cuts, no jump cuts, no fades. No
> text, no letters, no logos, no watermark, no other people.

## Clip B — desk frame to end frame

> One single continuous camera move with no cuts and no edits, in the same
> stylized 3D animated feature film look as the first frame.
>
> THE CAMERA MOVES CONSTANTLY AND NEVER STOPS, pushing steadily forward toward
> the monitor for the entire shot, which grows larger in frame throughout. It
> never stops, never holds, never pulls back.
>
> The cat jumps from the desk up onto the flat top of the tower computer, turns
> once and lies down along it with one front paw over the front edge. Her fur is
> plain ordinary grey, NOT blue, NOT blue-grey.
>
> The man pulls the chair in and sits down on it properly, seen from behind over
> his shoulder, his weight clearly supported by the chair.
>
> While the camera continues moving toward the monitor, his arm swings up and
> across into the near foreground, briefly and partly blocking the view as he
> brushes his hand over the cat's head in passing, then drops away again. The
> camera does NOT stop for this, does NOT slow down for it, does NOT turn toward
> it and does NOT centre it. It is incidental, caught in passing while the
> camera is going somewhere else. He is partly in the way as it happens.
>
> Right at the end the monitor switches on like an old cartoon television: a
> thin bright horizontal line snaps across the middle of the black screen,
> flares, and blooms outward to fill the whole screen with clean even white. The
> camera settles dead straight on to the monitor, exactly square and level with
> it, and the final frame is the monitor seen perfectly head on: its flat even
> white screen filling most of the picture, its black bezel even on all four
> sides, and its black arm running down and out of the bottom left corner,
> against the plain white studio.
>
> Smooth continuous forward camera motion. No cuts, no jump cuts, no fades to
> black. No text, no letters, no logos, no watermark, no user interface on the
> screen, no other people.

## Checking the result

Measured in `sandbox_exec`; the agent cannot see the clips.

| Measure | Target | Why |
|---|---|---|
| Cut test: motion vs the median of the 20 surrounding frames | ratio under 3 | A global threshold cannot work; see the notes |
| Directional pan bias | high | Low means jitter that cancels, not a camera move |
| Last frame vs the pinned end frame | under ~10% of pixels | Wan reached 6.0% on the 10s clip |
| `head` | measure it | The 10s walk had none where the others have 2.8 levels |

Likeness, the cat's colour, the chair and whether the petting reads as
incidental all need Kemal's eye. None of them are luminance.
