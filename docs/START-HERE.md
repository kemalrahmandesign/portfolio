# Start here

Picking this project up cold? Read this file, then
`hero-production-notes.md`. Everything else is detail.

## What this is

Kemal Rahman's portfolio site for his design agency. The whole project so far is
the **hero section**: an animated intro that hands off into the real site.

A stylized 3D cartoon Kemal stands in a white studio surrounded by his hobbies.
He waves while the headline animates in, then idles. Clicking the call to action
sends him walking right to his desk in one continuous take; he sits, his cat Nova
settles on the PC, the camera pushes past his shoulder into the monitor, the
monitor powers on white, and the site is underneath.

Live: **https://kemalrahmandesign.github.io/portfolio/**
Deploys automatically on push to `claude/portfolio-hero-brainstorm-oonxku`,
which is also the default branch.

## State

| Piece | Status |
|---|---|
| Hub frame (the still every clip starts/ends on) | done, `3f470988-9df8-4d61-98f6-e316d6f6ad9e` |
| Wave clip, 5s | done, `ed3c524f-cea1-4b6c-8683-46edd68f159f` |
| Idle loop, 10s | done, `adac86ab-3d37-41ff-860a-4c713b405a9c` |
| Hero page | built, deployed |
| End frame (monitor, white) | **prompt ready, not generated** — `end-frame-prompt.md` |
| Walk clip | **prompt ready, not generated** — `walk-clip-prompt.md` |

Next two jobs are the end frame, then the walk clip using it as the end image.

## What Kemal needs to re-send

Reference images live in the chat that received them, not in this repo, and
**not in Higgsfield yet**. A new session needs him to re-attach:

1. The **studio version of his desk** — his real desk composited onto a white
   background with the paper lantern. This is the good one; it measures neutral
   (red minus green `-0.24`) and sits at 236 luminance.
2. The **original easel photo** — the green cartoon figure on orange. The studio
   render replaced it with a generic abstract, and it is a personality detail.
3. **Nova lying on the PC tower.**
4. The **PC tower close-up.**

Uploading attached images to Higgsfield needs `media_upload_widget`, called as
the only tool in its turn.

Already uploaded and safe to reference by id:

```
face closeup     fc39e6cc-91c9-4fc5-bdc1-01299706aaa0
face smiling     7c955619-104c-40a6-93eb-f8ec99078462
full body        48839646-77be-49cb-af61-f9fdc987b999
style reference  7d9079c7-f8b9-410e-83cb-9ffdf1619225
cat (Nova)       0beed3b6-923e-45ec-ad8d-a4a8b20c5d80
PC tower + cat   512cb519-021c-469e-a277-4a87f2db7bfa
painting/easel   03415c45-a290-4886-b366-d4df6e253c8b
motorcycle       619bd981-6a0d-41a0-acb0-51dda9b4a656
guitar           dbebeddb-6068-490d-8a47-90bd0f399617
amp              7b7f77c9-c08a-4d5d-b2be-7ca1dc6297b8
```

## Open questions for Kemal

1. **The painting.** Reference his real one, or is a generic canvas fine?
2. **Agency name and the tagline** under "Hi, I'm Kemal".
3. **Typeface.** Inter is a placeholder; his Figma uses something tighter.
4. Whether the new 10s idle reads as calm or as frozen.

## Constraints that will bite you

- **The agent container cannot reach the media CDNs or github.io.** The egress
  proxy denies them on org policy, and the proxy docs say not to route around a
  policy denial. So you cannot download the clips, cannot verify the live page
  yourself, and cannot re-encode anything. Ask Kemal what he sees. Measure clips
  through Higgsfield's `sandbox_exec`, which can reach them.
- **Do not commit his reference photos.** The repo is public. `refs/` is
  gitignored and must stay that way.
- **Higgsfield was capped at 5 generation jobs/day** during a payment grace
  period. Kemal was moving to a paid subscription; confirm before assuming the
  cap is gone.
- **Preset recommendations block video submission.** Retry with
  `declined_preset_id` set to the offered preset.

## The three findings that cost the most to learn

1. **Do not chase framing through prompt numbers.** Asking for 40% body height
   returned 65%; asking 39% returned 76%. Fix framing in code instead.
2. **Pass every object photo, always.** Dropping them made the model invent the
   bike, guitar and amp. Individual object photos do not lock composition; a
   previous *full frame* does, and must never be passed.
3. **Measure the content before rewriting the code.** The "flash" between clips
   was two wrong diagnoses deep before anyone measured luminance and found that
   both clips open 2.8 levels dark.
