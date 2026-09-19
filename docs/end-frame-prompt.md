# End frame — the prompt to run

The last frame of the walk clip. Generated first, then passed to the video call
as the end image so the clip is guaranteed to land on it.

Model `nano_banana_pro`, `aspect_ratio` 16:9, `resolution` 2k, `count` 1.

## How close it should be — this was the open question

Close. The monitor fills roughly 85 to 90 percent of the frame height, with
only a thin strip of bezel and a little room around it. Not a wide shot of the
whole desk.

The reasoning runs backwards from the seam. The camera never cuts, so the clip
has to finish somewhere along the push-in, and wherever it finishes is where CSS
takes over. Ending wide would leave the last stretch of the push-in to CSS, and
scaling a video frame up eight times is mush. Ending at 85 to 90 percent leaves
CSS almost nothing to do: a short brightening ramp to white, which is invisible
because it moves toward white rather than matching a value.

The wide view of the desk still happens. It happens in the middle of the clip as
the camera pans right, and the middle of a clip does not need to be pinned. Only
the ends do.

## The screen is white here, not black

The old-television power-on lives inside the shot, which was Kemal's idea and is
the better one: the dark beat reads as the monitor waking up rather than as the
page loading. By the last frame that power-on has finished, so the screen is
already white. That is what makes the handoff white-on-white.

Encoded video white lands around 235 in a browser because video is limited
range, so the frame's white will not match the page's `#fff` on its own. It does
not have to. The CSS cover ramps up over the final stretch and the page is
uncovered underneath it.

## References

Desk photographs are worth having but are **not** blocking this frame. At this
distance the desk is mostly out of shot; what is actually on screen is the
monitor, its bezel, and Nova. Those are covered by photographs already uploaded.

```
512cb519-021c-469e-a277-4a87f2db7bfa   PC tower with cat
0beed3b6-923e-45ec-ad8d-a4a8b20c5d80   cat (Nova)
03415c45-a290-4886-b366-d4df6e253c8b   painting on easel
7d9079c7-f8b9-410e-83cb-9ffdf1619225   cartoon style reference
```

Do not pass the hub frame or any other full scene. A previous full frame locks
the composition, which is the mistake documented in the production notes.

## Prompt

> Stylized 3D animated render in the exact look of the cartoon style reference
> image: modern animated feature film style, smooth surfaces, soft matte
> textures, gentle global illumination.
>
> FRAMING, the most important requirement. An extreme close push-in on a
> computer monitor, shot from just behind and slightly above a seated person's
> shoulder. The monitor is enormous in frame: its screen fills about 85 to 90
> percent of the picture height and runs past the left and right edges, with
> only a thin dark bezel visible along the top and sides. The camera is close
> enough that the screen dominates everything. No wide view of the room, no
> visible desk surface beyond a sliver at the very bottom edge.
>
> THE SCREEN. The monitor is switched on and the screen is a clean, even, blank
> white, glowing softly and evenly with no image, no icons, no text, no windows,
> no user interface, no logos and no reflections. Perfectly neutral white with
> red, green and blue equal, no blue tint, no warm tint, slightly brighter at
> the centre and very gently softer toward the edges.
>
> WHAT ELSE IS IN FRAME. Along the very bottom edge, slightly out of focus, the
> top of the seated person's shoulder and the back of his long dark wavy hair,
> dark against the glow, cropped by the frame. In the upper left, the grey
> tabby cat from the reference photograph lying along the top of the monitor,
> seen from behind and below, with her tail hanging down across the edge of the
> screen. She is relaxed and settled. Everything except the screen sits in soft
> shallow focus.
>
> LIGHT. The screen is the only light source. It throws a soft white rim onto
> the cat, the bezel and the shoulder, and everything not lit by it falls into
> soft neutral grey. Clean and calm, not dramatic.
>
> No text, no letters, no logos, no watermark, no user interface elements, no
> other people.

## How to check the result without looking at it

The egress proxy blocks the result CDN from the agent container, so measure in
`sandbox_exec` instead.

| Measure | Target |
|---|---|
| Screen height as a share of frame | 85 to 90% |
| Mean luminance of the central 50% | above 235 |
| Red minus green across the screen area | under 1.5 |
| Evenness across the screen area | under 8 levels |
| Anything resembling text or icons on the screen | none |
