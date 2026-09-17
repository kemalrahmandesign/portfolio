# Hub frame — the prompt to run

Run this the moment the daily generation cap resets. Model `nano_banana_pro`,
`aspect_ratio` 16:9, `resolution` 2k, `count` 1.

## References — pass all seven

Dropping the three object photos is what made the bike, guitar and amp go wrong
in the 2026-09-17 attempts. They are individual object photos, not scene
compositions, so they do not lock the framing. Only a previous *full frame* does
that, and that must never be passed.

```
fc39e6cc-91c9-4fc5-bdc1-01299706aaa0   face closeup
7c955619-104c-40a6-93eb-f8ec99078462   face smiling
48839646-77be-49cb-af61-f9fdc987b999   full body
7d9079c7-f8b9-410e-83cb-9ffdf1619225   cartoon style reference
619bd981-6a0d-41a0-acb0-51dda9b4a656   motorcycle
dbebeddb-6068-490d-8a47-90bd0f399617   guitar
7b7f77c9-c08a-4d5d-b2be-7ca1dc6297b8   amp
```

## Prompt

> Stylized 3D animated character render in the exact look of the cartoon style
> reference image: modern animated feature film style, appealing slightly
> exaggerated proportions with a larger head and big expressive eyes, smooth
> subsurface-scattering skin, detailed hair strands, soft matte cloth textures.
> Wide 16:9 hero banner shot inside a seamless infinite studio cyclorama with
> soft floor shadows and no walls, corners or edges visible.
>
> FRAMING, the most important requirement. This is a very wide, very distant
> shot of a small figure in a huge open room, laid out as a website hero banner
> with a large blank area at the top for a headline. The upper 55 percent of the
> image is empty background and nothing at all rises into it. Everything in the
> scene sits in the bottom 45 percent. The man's entire body from the top of his
> hair to his sneakers spans only about 40 percent of the picture height, and the
> top of his hair sits roughly 55 percent down from the top edge. His sneakers
> rest on the floor a little above the bottom edge, with both feet fully visible
> and not cropped. He must look small and far away, not close to camera.
>
> SPACING. Because the room is huge and the camera is far back, the props are
> spread far apart across the full width of the frame with generous empty floor
> between them. They are not clustered around him. Each object sits on the floor
> in its own pool of space, naturally arranged like a real studio set, low and
> wide so nothing intrudes into the empty upper half.
>
> THE MAN. A cartoon version of the man in the reference photographs, with his
> identity clearly recognisable: Southeast Asian features, tan skin, long dark
> black wavy hair to the shoulders parted in the middle, thin round wire-frame
> glasses, a thin dark moustache, athletic build, adult facial structure. One
> change from the photographs: his chin and jawline are completely clean-shaven
> with no goatee and no beard, only the thin moustache remains. He wears a plain
> cream-white crew-neck t-shirt, light-blue plaid flannel pajama pants and plain
> cream-white low sneakers. He stands relaxed and confident, weight on one leg,
> left hand tucked in his pajama pocket, right arm hanging loose at his side,
> chin level, looking straight at camera with a small easy closed-mouth smile.
>
> THE PROPS, matched faithfully to the object reference photographs and rendered
> in the same stylized 3D cartoon look:
> - Far left, the red sport motorcycle from the reference photo, a sportbike
>   painted in Lightning McQueen livery with glossy red bodywork, yellow flame
>   and lightning-bolt graphics along the fairing and tail, and a large number 95
>   on the side fairing, angled toward camera on its side stand.
> - Behind him to the left, a pair of black skis leaning upright, kept low.
> - To his right in the mid-ground, the pale mint-green Fender Mustang style
>   electric guitar from the reference photo, with its white pickguard, chrome
>   hardware and rosewood fretboard, standing on a guitar stand, with a cable
>   running to the small cream-white leather practice amp from the reference
>   photo, which has a tan woven grille cloth, gold corner trim and a red leather
>   carry handle, sitting on the floor beside it.
> - Foreground left, a skateboard lying flat on the floor.
> - To the right, a classic black-and-white soccer ball resting on the floor.
> Keep the right third of the frame open and uncluttered.
>
> BACKGROUND. A seamless pure neutral white studio, clean and slightly cool,
> evenly lit, with only soft neutral grey contact shadows beneath each object.
> The white must be perfectly neutral with red, green and blue equal, with no
> pink, no magenta, no peach, no cream, no beige and no warm tint whatsoever, and
> no vignette or darkening at any edge or corner. Soft global illumination with a
> gentle rim light. No text, no letters, no logos, no watermark, no other people,
> no cat, no desk, no furniture.

## Why it is written this way

The framing numbers are deliberately wrong. Reference photographs bias the
character larger, so asking for 40% height and 55% headroom lands near 60% and
35%, which is the target. Asking for 60% directly returns about 70%.

The prop descriptions repeat detail that is already in the photographs on
purpose. The object references fix the shape and colour; the words stop the model
from simplifying away the number 95, the white pickguard and the red amp handle.

## How to check the result without looking at it

The egress proxy blocks the result CDN from the agent container, so verify by
measuring in `sandbox_exec` instead. Targets:

| Measure | Target |
|---|---|
| Headroom above the hair | 33 to 40% |
| Character height | 58 to 63% |
| Background red minus green | under 1.5 |
| Corner-to-corner evenness | under 5 levels |
| Dark pixels in the bottom 3 rows | 0%, else the feet are cropped |
| Content in the top 35% outside the centre third | 0% |

Likeness and prop accuracy cannot be measured. Those need Kemal's eye.
