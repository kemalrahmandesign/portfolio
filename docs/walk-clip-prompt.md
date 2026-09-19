# Walk clip — the prompt to run

One continuous take, no cut. Starts on the hub frame, ends on the end frame.
Run the end frame first; this call needs it.

Model Wan 3.0. `duration` 10, `resolution` 1080p, `generate_audio` false.
Pass `declined_preset_id` if a preset recommendation blocks submission.

```
start frame   3f470988-9df8-4d61-98f6-e316d6f6ad9e   (the hub frame Kemal chose)
end frame     <the generation id from end-frame-prompt.md>
```

## Why ten seconds

The choreography is: turn, walk, camera swing right, cat enters and crosses,
cat jumps twice, he sits, he reaches out, screen powers on, camera arrives.
That is a lot of beats. At five seconds they collide and the model drops some.
Ten gives each beat roughly a second, which is about how long each one reads.

If ten drifts the character badly, the fallback is eight, and the beat to cut is
the cat's second jump: she goes to the desk and settles there rather than onto
the tower. It costs the least.

## Prompt

> One single continuous camera move with no cuts and no edits, in the same
> stylized 3D animated feature film look as the first frame.
>
> The man turns away from camera and walks off to the right. The camera follows
> him from behind, drifting forward so we see his back and his long dark wavy
> hair, and swinging smoothly to the right as he crosses the room. The
> motorcycle, the skis, the guitar, the amp, the skateboard and the soccer ball
> all slide out of frame to the left and are left behind. They stay perfectly
> still as they pass; nothing rolls, tips or drifts.
>
> As the camera comes around to the right, a simple desk is already there in the
> white studio, with a computer monitor on it, a keyboard, and a desktop
> computer tower standing beside the monitor. A small painting on a wooden easel
> sits at the side of the desk. The monitor screen is switched off and
> completely black.
>
> A grey tabby cat trots in from off-frame at the right, crosses to the desk and
> follows him. She jumps up onto the desk, then up onto the top of the computer
> tower, turns once and lies down. He reaches the chair and sits down, seen from
> behind over his shoulder.
>
> Through all of this the camera keeps moving forward, past his shoulder and in
> toward the monitor, which grows steadily larger in frame until the screen
> fills almost the entire picture. He raises one hand and reaches out to pet the
> cat's head as the screen is nearly filling the frame.
>
> Right at the end, with the screen already filling almost the whole frame, the
> monitor switches on like an old cartoon television: a thin bright horizontal
> line snaps across the middle of the black screen, flares, and blooms outward
> to fill the whole screen with clean even white. The final frame is the white
> screen filling the picture with the cat lying along the top edge.
>
> Smooth continuous camera motion throughout. No cuts, no jump cuts, no fades to
> black, no shot changes. No text, no letters, no logos, no watermark, no user
> interface on the screen, no other people.

## What matters when checking it

Likeness and choreography need Kemal's eye. Two things can be measured in
`sandbox_exec` and are worth measuring before showing him:

| Measure | Why |
|---|---|
| Frame-to-frame motion over the whole clip | A spike means a cut. There should be no spike. |
| Mean luminance of the last 15 frames | Should rise steeply and finish above 235. |

The first one is the important one. He asked for no cut, and a model asked for a
long continuous move will sometimes insert one. A single frame where the motion
measure jumps an order of magnitude is that cut, and it means regenerate rather
than accept.
