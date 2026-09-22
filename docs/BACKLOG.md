# Backlog

Things agreed and deliberately not built yet, with enough detail that picking
one up does not mean rediscovering the decision.

## 1. Mobile, at 9:16 — next up

Kemal is rationing Higgsfield credits for this, so it comes before anything
else that generates. The desktop clips are 16:9 and are shown letterboxed on a
phone, because covering a portrait viewport crops to about 26% of the frame
width and the walk pans right out of that slice. Regenerating at 9:16 is the
real fix and retires the `max-aspect-ratio: 1/1` media query.

**Three clips, and the middle one is deliberately simpler than its desktop
twin:**

| clip | what happens |
|---|---|
| wave | Standing, smiles, one quick wave. Nova at his feet. Props behind him. |
| idle | The same framing, holding, loopable. |
| take | **He pulls out his phone**, and the camera pushes into the phone. |

The take is the important change. On desktop he walks across the studio to a
desk, sits, the cat settles on the tower, and the camera pushes into the
monitor. That sequence cost seven generations and never fully landed. On
mobile there is no walk, no desk, no sitting, no cat to place and no monitor
arm: he stands still and takes out a phone. One beat instead of five, which
is the whole reason it should work.

The player needs no changes in principle. `CLIPS` gains a portrait set and the
existing `max-aspect-ratio` query picks it; the push-in keyframe needs its own
translate, since it re-centres an off-axis panel and the phone will not be in
the same place as the monitor.

## 2. The character meshes — after mobile

The static mesh was removed from the site (`git log` for "Put the skater on
the ramp" has the code, the GLB and `tools/shrink-glb.js` if it is wanted
back). What it proved:

- `image_to_3d` returns a genuinely good likeness at 12000 triangles.
- `SKATER.yaw = Math.PI / 2` is the profile travelling right.
- The texture is the whole payload. 3.66MB of 2048px JPEG on a figure that
  renders 130px tall; `tools/shrink-glb.js` took the file from 4.29MB to
  0.91MB with no visible difference.
- **It has no skeleton.** `animations: 0`, `skins: 0`, no JOINTS or WEIGHTS.
  One rigid pose. Rolling, a manual, a tail scrape and a 180 all work because
  they are whole-body moves. A kickflip, a pop, a catch and stepping off do
  not, because there are no joints to bend.

**The generation that changes that:** him with **no board**, in an **A-pose**
(`pose_mode: 'a-pose'`, which the model documents as the one to use with
rigging), `enable_rigging: true`. Bones are then driven from code, which is
the only route to a kickflip, because the clip library has **no skate
animations at all** — its groups are WalkAndRun, BodyMovements, DailyActions,
Dancing and Fighting, and a search for "skate" returns nothing. The board
becomes procedural geometry: free, silver without a chrome texture, and
spinnable on its own.

**Cost, measured not estimated:** 35 credits for a rigged textured mesh
(`multi_image_to_3d` is the same 35 and takes 2 to 4 views, which gives the
auto-rigger better geometry to work with), plus 2 for a batch of four source
images. So 37 if it works first time. Budget two or three attempts: auto-rig
quality on a stylised cartoon in baggy pyjamas is the unknown, and bad weights
show as pinching at the hips and knees.

`Big_Wave_Hello` is clip id 28 and is a real rigged animation, so the contact
section's goodbye can be done properly whenever the rigging route is taken.

## 3. Smaller, still open

- **The prop arrows** still need work. Kemal's coordinates are in and correct;
  the geometry of the curl is what he is unhappy with.
- **Real social URLs.** Every link in the hero is still `href="#"`.
- **"Cool Sh\*t" or "My work".** Floated, never decided. Copy comes last.
- **Case study content.** Four cards are built with placeholder gradients and
  a sheet that says so. They need shots and the actual stories.
- **The montage** is a grey placeholder. It needs the real reel.
