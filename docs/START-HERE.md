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
| Wave clip, 3s | done and wired, `d6974c93-3cf7-4790-ada6-4ba84737426f` |
| Idle loop, 10s | done and wired, `adac86ab-3d37-41ff-860a-4c713b405a9c` |
| End frame (monitor on its arm) | done, media `f9a03660-1c4b-47b0-8323-95918531479d` |
| **Walk clip** | **done**, Genjutsu armrest fix over the best take, wired |
| Hero page, handoff, flash fixes | done, measured, pushed |
| Hosting the clips in the repo | page repointed at `media/`; **all four files ready to download** |
| Behind the monitor | menu, back button, statement, montage placeholder; **copy is placeholder** |
| Social trinkets | 3D renders done, cut out, hanging top-left of the hero |
| Hero overscroll | rubber-band with the curved note underneath |
| The rest of the site | sections drafted, content not written |

## Do this first: download four files

`index.html` no longer references a CDN anywhere. It loads `media/hub.jpg`,
`media/wave.mp4`, `media/idle.mp4` and `media/walk.mp4` by relative path. All
four are re-encoded and waiting; **the page is broken until they land.**

This was urgent for a reason that already came true: the walk clip the page
used to point at, `4d06b164`, now returns **403**. The call to action was dead
before anyone touched it.

The agent cannot download them. The result CDN is blocked from its container
(verified: connection refused), and the sandbox that can reach it cannot write
to the repo.

**Save these four into `media/` under exactly these names** (links good 24h from
2026-09-20 19:35 UTC; ask for fresh ones after that):

```
media/hub.jpg    .../f215c1e8-2364-4cf0-a950-cb1851e8c8b4.jpg    0.21 MB
media/wave.mp4   .../2229135a-3e3c-4651-a827-66c8a7af5f4c.mp4    0.78 MB
media/idle.mp4   .../9b16a3ef-b3fe-441f-99e6-414ffac6f442.mp4    2.63 MB
media/walk.mp4   .../f8373f35-e3dc-4469-9533-66738f840f3c.mp4    3.90 MB
```

all on `https://d2ol7oe51mr4n9.cloudfront.net/user_3FE0Xjh16Sot9aoCPbOwO7vYemS/`.
Full URLs and the reasoning are in `media/README.md`.

These are re-encoded, not raw: CRF 21, preset slow, `+faststart`, no re-timing.
48 MB of raw generation becomes 8.4 MB. Frame counts and durations are identical
across the encode and the luminance shift is under 0.1 levels, so every `head`
in the player still holds.

**Then merge into `claude/portfolio-hero-brainstorm-oonxku` to deploy.** Do not
merge before the files are committed: the page would go live pointing at
`media/` paths that 404, which is worse than what is deployed now.

## The walk clip, settled

`walk.mp4` is job `22c175dd-3735-4641-9e00-0eb372b89db3`: a Genjutsu object
replacement over candidate `82780415`, run to give the chair its missing
armrest. Measured: no dissolve, he is never lost from frame, 2.2% duplicate
frames (better than the 5.4% of the take it replaces), and the last frame lands
on the pinned end frame within 3.8% of pixels.

### How that was arrived at, so nobody repeats it

Seven generations came out of this prompt. **One** was clean. The rest
dissolved mid-shot, dropped the hobby props and the painting, or lost him from
frame. The last three ran a prompt verified byte-identical by sha256 to the
original, and still differed, so **the variation is the model's seed, not the
text**. Re-rolling was about a one-in-seven draw.

Two dead ends worth not re-walking:

- **Editing the prompt to fix a defect broke something else, every time.** The
  armrest fix worked and introduced a fade cut. Buying back the character budget
  by deleting a redundant description stripped the background. Length correlated
  with failure across three samples, which looked like a clean signal and was
  not one; with n=1 per variant it could not be separated from seed variance,
  and the evidence now says variance dominated.
- **A cut detector cannot see a dissolve.** Frame-to-frame motion never spikes,
  so a >55%-of-pixels-moved test passes a fade cut silently. What catches one is
  a drop in edge energy against a local baseline: validated against three clips
  with known labels, it read 8.9% on the clean one and 30-31% on the two with
  fades. Cross-check any hit against motion, though — a frame that flattens
  because the camera is filling frame with a black monitor drops edge energy
  too, and that produced a false positive at 7.60s on another take.

**The lesson: when a take is close and the defect is one object, edit the video,
not the prompt.** `hf_mult_replace_object` takes the source video plus a
reference image and swaps the object, keeping the camera move, the background
and the take's luck. It cost one generation where re-rolling had cost six.

### What the re-render changed

It is a re-render rather than an overlay, so it came back **24fps, 9.71s**
instead of 30fps, 10.00s, and about **7 luminance levels brighter**. Neither is
corrected, on measurement — the full reasoning and numbers are in
`media/README.md` and in the comments in `index.html`.

The one real cost is the stitch into the idle, and it is handled:

| | opens on the hub pose within | his pixels differ vs idle |
|---|---|---|
| the original take | 3.1% | 20.6% |
| this one | 6.6% | 47.7% |

The studio, 87% of the frame, matches to 0.85% once both layers carry
`--clip-lift`, because both clip to white. The mismatch is him, it is pose not
level, and no filter removes it. So `head` is **0** (frame 0 is the closest
match to the hub pose; every later frame is worse as he turns) and the
idle-to-walk crossfade is **500ms** rather than 320ms, spent over the half
second where he is turning away.

**When a clip both opens dark and opens on a pose, the pose wins.** The
luminance rule that sets `head` for the wave and the idle wanted frame 9 here,
which would have traded a visible pose jump for a 1.5-level dip the crossfade
hides anyway.

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

1. Scope of the rest of the site. Deferred until the hero is confirmed live.
2. Agency name, if one is wanted anywhere.
3. A real typeface. Inter is still the placeholder. The reference frame's
   headline looks like a tighter grotesque than Inter, and the layout is
   pinned to measured percentages rather than to text widths, so swapping the
   face will shift the headline's width without breaking the composition.
4. Whether to warm `--bg` past `#f1f0ee`. Worth re-judging now the lift taper
   stops the handoff blowing out to pure white.
5. The 9:16 regeneration. Mobile now plays the full sequence, but letterboxed:
   the 16:9 clips are shown with `object-fit: contain` on portrait, because
   covering a phone viewport shows only ~26% of the frame width and the walk
   pans right out of that slice. Regenerating at 9:16 is the real fix and
   replaces the `max-aspect-ratio: 1/1` media query.

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
