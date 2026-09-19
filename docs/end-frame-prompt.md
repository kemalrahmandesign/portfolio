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

```
512cb519-021c-469e-a277-4a87f2db7bfa   PC tower with cat
0beed3b6-923e-45ec-ad8d-a4a8b20c5d80   cat (Nova)
7d9079c7-f8b9-410e-83cb-9ffdf1619225   cartoon style reference
<pending>                              desk, wide
<pending>                              PC tower, close
<pending>                              Nova lying on the tower
<pending>                              painting on its easel
```

Do not pass the hub frame or any other full scene. A previous full frame locks
the composition, which is the mistake documented in the production notes.

**The desk photographs are of a warm beige room with a paper lantern, a wood
floor and a white door.** The scene is a white studio cyclorama. Use the
photographs for the shapes and colours of the objects only; nothing about that
room comes across. Say so in the prompt, because a reference photograph with
strong ambient colour will drag it in.

## Nova is not in this frame, and that is a correction

The first draft of this prompt had her lying along the top of the monitor. She
does not. The photograph shows her on top of the tower, which is where Kemal
said she goes ("she jumps up on desk and then on my pc"), and his monitor is on
a thin articulating arm with no top surface to lie on anyway.

That matters for the framing. The tower stands to the right of the monitor, so
once the screen fills 85 to 90 percent of the frame the tower is outside it and
she is not visible. Putting her in the end frame would mean either shrinking the
monitor or moving her somewhere she does not sit.

So she is not in the last frame. The beat where he reaches out to pet her comes
earlier in the push-in, while the tower is still in shot, which is what Kemal
described anyway: he pets her as the view is *nearly* at the monitor, not at it.

## Prompt

> Stylized 3D animated render in the exact look of the cartoon style reference
> image: modern animated feature film style, smooth surfaces, soft matte
> textures, gentle global illumination.
>
> FRAMING, the most important requirement. An extreme close push-in on a
> widescreen computer monitor, shot from just behind and slightly above a
> seated person's shoulder. The monitor is enormous in frame: its screen fills
> about 85 to 90 percent of the picture height and runs past the left and right
> edges, with only a thin dark bezel visible along the top and sides. The camera
> is close enough that the screen dominates everything.
>
> THE SCREEN. The monitor is switched on and the screen is a clean, even, blank
> white, glowing softly and evenly with no image, no icons, no text, no windows,
> no user interface, no logos and no reflections. Perfectly neutral white with
> red, green and blue equal, no blue tint, no warm tint, slightly brighter at
> the centre and very gently softer toward the edges.
>
> WHAT ELSE IS IN FRAME. Along the very bottom edge, slightly out of focus, the
> top of the seated person's shoulder and the back of his long dark wavy hair,
> dark against the glow, cropped by the frame. Nothing else. No cat.
>
> LIGHT AND SETTING. The room is a seamless pure neutral white studio, not a
> home. The screen is the only light source: it throws a soft white rim onto the
> bezel and the shoulder, and everything not lit by it falls to soft neutral
> grey. Clean and calm, not dramatic. Absolutely no warm or orange ambient
> light, no lamp glow, no beige or tan walls, no wood floor, no door and no
> domestic room of any kind.
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
