# Start here

Picking this up cold? Read this file, then `hero-production-notes.md` for the
detail and the reasoning behind every decision. Everything else is reference.

## What this is

Kemal Rahman's portfolio site. The whole project so far is the **hero section**:
an animated intro that hands off into the real site.

A stylized 3D cartoon Kemal stands in a white studio surrounded by his hobbies.
He waves while the headline animates in, then idles. Clicking the call to action
sends him walking right to his desk in one continuous take; he sits, his cat
Nova settles on the PC, the camera pushes past his shoulder into the monitor,
the monitor powers on white, and the site is underneath.

Live: **https://kemalrahmandesign.github.io/portfolio/**
Deploys on push to `claude/portfolio-hero-brainstorm-oonxku`, which is also the
default branch. Work has been landing on `claude/eager-bardeen-yde4ng` and
**needs merging before any of it goes live.**

## State

| Piece | Status |
|---|---|
| Hub frame (the still every clip starts on) | done, `3f470988-9df8-4d61-98f6-e316d6f6ad9e` |
| Wave clip, 5s | done and wired, but see the CDN warning below |
| Idle loop, 10s | done and wired, `adac86ab-3d37-41ff-860a-4c713b405a9c` |
| End frame (monitor on its arm) | done, media `f9a03660-1c4b-47b0-8323-95918531479d` |
| **Walk clip** | **two armrest re-runs done, Kemal to judge** |
| Hero page, handoff, flash fixes | done, measured, pushed |
| Hosting the clips in the repo | page repointed at `media/`; **three files ready to download, walk pending** |
| The rest of the site | not started, scope not yet agreed |

## The three walk candidates

All 10s, 1920x1080 at 30fps, Wan 3.0, pinned hub frame to end frame. Kemal kept
these three and deleted the rest.

```
A  82780415-38f5-4ac8-8eb7-42119d3c3ac2   hf_20260920_054506_...
B  929f7158-3e53-4068-b283-af5c1492f022   hf_20260920_021659_...
C  e0fc9680-58ba-4be3-acb2-dd41e94fab18   hf_20260920_002253_...
```

Kemal called **A** "99 percent there", with one defect: the chair was missing an
armrest. A fourth generation fixed that and was measured better on every count,
but it was deleted and its URL now 403s, so it is not recoverable.

Measured on A, which is the best of the three on every number:

| | A | B | C |
|---|---|---|---|
| Cuts | none | none | none |
| Frames where he is lost from frame | 0 | 22 | 0 |
| Duplicate frames | 3.3% | 2.7% | 11.0% |
| Pacing jerk | 3.60 | 2.50 | 3.13 |
| Last frame vs the pinned end frame | 5.8% | 5.3% | 6.1% |

**B is the one where he disappears** between 2.2s and 3.4s. It scores well on the
other measures; do not let that mislead you.

## Do this first: download three files

`index.html` no longer references a CDN anywhere. It loads `media/hub.jpg`,
`media/wave.mp4`, `media/idle.mp4` and `media/walk.mp4` by relative path. Three
of those four are re-encoded and waiting; the page is broken until they land.

This was urgent for a reason that has already come true: the walk clip the page
pointed at, `4d06b164`, now returns **403**. The call to action was dead before
anyone touched it.

The agent cannot download them. The result CDN is blocked from its container,
and the sandbox that can reach it cannot write to the repo.

**Save these three into `media/` under exactly these names** (links good 24h
from 2026-09-20 15:58 UTC; ask for fresh ones after that):

```
media/hub.jpg    .../f215c1e8-2364-4cf0-a950-cb1851e8c8b4.jpg    0.21 MB
media/wave.mp4   .../71520f4b-933c-4ed5-b321-b46e065e0535.mp4    1.65 MB
media/idle.mp4   .../9b16a3ef-b3fe-441f-99e6-414ffac6f442.mp4    2.63 MB
```

all on `https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/`.
Full URLs and the reasoning are in `media/README.md`.

`media/walk.mp4` follows once the candidate is chosen.

These are re-encoded, not raw: CRF 21, preset slow, `+faststart`, no re-timing.
47 MB of raw generation becomes about 9 MB. Frame counts are identical and the
luminance shift is +0.03 levels, so every `head` in the player still holds. The
measurements are in `media/README.md` and the production notes.

## The walk clip: two re-runs are waiting on your eyes

Kemal asked for candidate A to be re-run to fix the missing left armrest, and
allowed a chair swap. Both went out, each derived from A's exact prompt by
replacing the chair paragraph only, with the remainder proven byte-identical.

```
pair      59a0a114-743b-40e6-9dd0-407e14297ac7   two armrests, named as a symmetry
armless   1f05732a-8252-450f-ae6b-4cdfddd0f249   armless chair, the guaranteed fix
```

**Measured against A as the control:**

| | A | pair | armless |
|---|---|---|---|
| Cuts | none | none | none |
| Duplicate frames | 5.4% | 11.7% | 8.0% |
| Last frame vs end frame | 3.6% | 4.0% | 3.7% |
| head | 0.067s | 0.067s | 0.033s |
| Discontinuity at 0.85s | **no** | **yes, 5 frames** | **yes, persistent** |

Both re-runs picked up a discontinuity at ~0.85s that A does not have. In pair
nothing black is on screen for five frames; in armless a third of the dark
content leaves and stays gone. The cut test passes both — it needs >55% of
pixels moving and this does not reach that.

**Two things need eyes, not numbers.** Whether the armrest is fixed, and
whether the 0.85s event shows at speed. The armrest is a small-prop shape
question, the category this project has been wrong about five times.

If both re-runs are worse than A overall, A is still there
(`82780415-38f5-4ac8-8eb7-42119d3c3ac2`) and shipping it with one missing
armrest is a legitimate call.

## Then: wire the walk clip in

1. Re-encode the chosen clip at CRF 21 and upload it, same as the other three.
2. Save it as `media/walk.mp4`.
3. `CLIPS.walk.head` is already 0.067, which is correct for A and for pair. Set
   it to 0.033 if armless wins.
4. The cover handoff does not change: all candidates bloom the monitor from
   8.3s and hold solid white from 8.9s to 10.0s, and `TAKE` is 0.45s.

Optional, free, and worth trying if the motion reads choppy: interpolate to
60fps. It halved the pacing jerk on an earlier clip. Note duplicate frames are
*up* on both re-runs against A, which is what choppiness actually is.

```
ffmpeg -i in.mp4 -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
       -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p out.mp4
```

## Asset IDs

```
hub frame / poster    3f470988-9df8-4d61-98f6-e316d6f6ad9e
end frame             f9a03660-1c4b-47b0-8323-95918531479d

identity, pass ALL THREE on every character generation:
face closeup          fc39e6cc-91c9-4fc5-bdc1-01299706aaa0
face smiling          7c955619-104c-40a6-93eb-f8ec99078462
full body             48839646-77be-49cb-af61-f9fdc987b999

style reference       7d9079c7-f8b9-410e-83cb-9ffdf1619225
painting on easel     c9933ed2-a0f4-4162-a097-3cc6d6f2b15c
Nova on the PC tower  b90c0b3f-e8d0-4724-a6af-062ba4a0abd5
Nova, full body       28c8ae01-229f-47e6-8013-0123338f9e00
PC tower, close       a1c507b8-5093-484d-943b-33144e4d4daa
desk layout, studio   900f41ac-ce38-4bf8-be62-e4f2b345cc06
monitor arm reference fa937b54-f824-4dc1-be5b-ae381e98f566
motorcycle            619bd981-6a0d-41a0-acb0-51dda9b4a656
guitar                dbebeddb-6068-490d-8a47-90bd0f399617
amp                   7b7f77c9-c08a-4d5d-b2be-7ca1dc6297b8
```

## Open questions for Kemal

1. Walk clip: is the armrest fixed in `pair` or `armless`, and does the 0.85s
   event show? Falling back to A with one missing armrest is a valid answer.
2. Scope of the rest of the site. Deferred until the hero is confirmed live.
3. Agency name, and the tagline under "Hi, I'm Kemal".
4. A real typeface. Inter is a placeholder; his Figma uses something tighter.
5. Whether to warm `--bg` past `#f1f0ee`. Worth re-judging now the lift taper
   stops the handoff blowing out to pure white.

## Environment traps

- **The agent cannot see any image or video it generates.** Both the result CDN
  and the input CDN are blocked; only the S3 *input* host is reachable, which is
  why uploads work and reads do not. Images Kemal pastes into the chat *are*
  visible. Ask him to paste a result back rather than reporting statistics as if
  they were a look.
- **`sandbox_exec` is capped at 60s by the client** whatever `timeout_seconds`
  says. Long renders need `background: true`, a sentinel file, and `sleep 45`
  polls, with the upload chained into the same background command.
- **`media_upload_widget` does not render in Claude Code.** Use `media_upload`
  for presigned URLs, PUT the bytes, then `media_confirm`.
- **Do not commit his reference photos.** The repo is public. `refs/` is
  gitignored and must stay that way.
- Preset recommendations block video submission. Retry with
  `declined_preset_id`. The offered preset is matched on prompt text, so it
  changes when the prompt changes.
- Wan 3.0 caps prompts at **5000 characters**, undeclared until a 422.
- `get_cost` does **not** validate media combinations. It priced a call that
  422s on submission. Submitting is the only test, and a rejection is free.

## What cost the most to learn

Full reasoning for each is in `hero-production-notes.md`.

1. **Every generation of the character carries the identity photos.** Dropping
   them gave him a beard, sideburns and a sharpened chin. A shot where his face
   is hidden is not an exemption.
2. **Describe only what the keyframes cannot guarantee.** The pinned start frame
   already fixes his appearance, the props and the studio. Re-describing them
   cost ~120 words of attention taken from beats that were failing.
3. **Attention is conserved.** Adding a clause silently takes from another. Three
   rounds in a row fixed one beat and broke a different one. Four separate
   metrics improved at once when 44 words were *deleted*.
4. **Negatives remove; they do not de-emphasise.** They fixed sideburns, a
   vignette and a warm colour cast. They made the petting beat *more* prominent,
   because a prohibition still spends words on the thing.
5. **Re-read the parts of the prompt you are not changing.** "Walks off to the
   right" survived four rounds and is literally an instruction to exit frame.
6. **When a clip is close, change one paragraph and prove the rest is identical**
   programmatically. A diff that looks small is not the same as one that is.
7. **Do not chase framing through prompt numbers.** Asking 40% returned 65%;
   asking 39% returned 76%. Fix framing in code instead.
8. **Place objects where the camera actually looks**, and check the move passes
   over them.
9. **Confining the edit does not confine the effect.** Two re-runs changed one
   paragraph each, proven byte-identical elsewhere, and both broke the first
   second of the clip. Attention is conserved across the whole prompt, so the
   discipline buys you a clean diff, not a clean result. Re-measure everything
   after every round, including the beats you did not touch.
10. **`head` is per generation.** Not per model, not per clip slot. Do not
   inherit it from the clip you are replacing; the page had `head: 0` on a
   comment written for a generation that no longer exists.

## Measurement, and its limits

Measure in `sandbox_exec`, which can reach the CDNs.

**Reliable** for frame-filling properties: mean luminance, evenness, red-minus-
green, whether the last frame matches a pinned end frame, dark-subject area per
frame (this is what catches a subject leaving the shot), and cut detection *when
done locally* — compare a frame's motion against the median of its twenty
neighbours and flag ratio > 3 with motion > 55%.

**Unreliable, and wrong five times in this project**: anything about a small
prop, anything defined by hue, and anything aesthetic. A saturated-orange scan
reported the painting missing when it was present. A blue-cat test could not
tell a cat from blue plaid pyjamas. A global cut threshold of `6*median+5`
evaluated to 112%, above the 100% ceiling, so it could never fire.

**Say plainly what has not been looked at.** Do not present a table of numbers
in a way that implies the image was reviewed.
