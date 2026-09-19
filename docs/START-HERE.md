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
| End frame (monitor on its arm) | done, media `f9a03660-1c4b-47b0-8323-95918531479d` |
| Walk clip | **prompt ready, not generated** — `walk-clip-prompt.md` |

The walk clip is the last generation. It starts on the hub frame and ends on
the end frame above.

## Reference images

All re-sent and uploaded on 2026-09-19. Nothing is outstanding.

```
painting on easel (the Squidward)  c9933ed2-a0f4-4162-a097-3cc6d6f2b15c
Nova lying on the PC tower         b90c0b3f-e8d0-4724-a6af-062ba4a0abd5
Nova, full body on the floor       28c8ae01-229f-47e6-8013-0123338f9e00
PC tower, close                    a1c507b8-5093-484d-943b-33144e4d4daa
desk layout, already in studio     900f41ac-ce38-4bf8-be62-e4f2b345cc06
```

`media_upload_widget` does not render in Claude Code. The path that works is
`media_upload` for presigned URLs, PUT the bytes (the S3 *input* host is allowed
through the egress proxy even though the *result* CDN is not), then
`media_confirm`.

Earlier uploads, still valid:

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
5. Whether to fix the Higgsfield billing or wait out the daily cap. Nothing
   further can be generated until one of the two happens.

## Constraints that will bite you

- **The agent container cannot reach the media CDNs or github.io.** The egress
  proxy denies them on org policy, and the proxy docs say not to route around a
  policy denial. So you cannot download the clips, cannot verify the live page
  yourself, and cannot re-encode anything. Ask Kemal what he sees. Measure clips
  through Higgsfield's `sandbox_exec`, which can reach them.
- **Do not commit his reference photos.** The repo is public. `refs/` is
  gitignored and must stay that way.
- **Higgsfield is still capped at 5 generation jobs/day** (confirmed
  2026-09-19). `balance` says `plus` with 1,204 credits and that is misleading:
  the ledger shows no subscription grant since 6 August, so the renewal has not
  cleared and the grace period is still on. Check `transactions` for a grant
  before assuming the cap is gone. The cap counts submissions, so a refused and
  refunded job still costs a slot.
- **Preset recommendations block video submission.** Retry with
  `declined_preset_id` set to the offered preset. The walk prompt drew
  "IN THE DARK".
- **FLUX 3 cuts the take.** It is the only model that carries references, and it
  inserted two hard cuts (f93, f105) on the walk prompt. Do not use it for a
  continuous move. Get references in via an intermediate keyframe instead.
- **Only FLUX 3 Video takes keyframes and references together.** Wan 3.0 rejects
  the combination with a 422, and **Veo accepts no reference images at all** (Veo
  3 and 3.1 take a start frame only; 3.1 Lite takes start and end, capped at 8s).
  FLUX 3 is 90 credits for 10s/1080p against Wan's 35.
- **`get_cost` does not validate media combinations.** It priced the exact Wan
  call that 422s on submission. Submitting is the only test, and it is free when
  it fails.
- **The agent cannot see any image it generates.** Both result and input CDNs
  are blocked; only the S3 input host is reachable, which is why uploads work.
  Images Kemal attaches to the chat *are* visible, so ask him to paste a result
  back rather than reporting statistics as if they were a look.

## The three findings that cost the most to learn

1. **Do not chase framing through prompt numbers.** Asking for 40% body height
   returned 65%; asking 39% returned 76%. Fix framing in code instead.
2. **Pass every object photo, always.** Dropping them made the model invent the
   bike, guitar and amp. Individual object photos do not lock composition; a
   previous *full frame* does, and must never be passed.
3. **Measure the content before rewriting the code.** The "flash" between clips
   was two wrong diagnoses deep before anyone measured luminance and found that
   both clips open 2.8 levels dark. The last open suspect, the poster-to-wave
   handoff at boot, has since been measured and is clean: 0.24 levels apart.
   Kemal's read that the flash is fixed is supported by the numbers.
