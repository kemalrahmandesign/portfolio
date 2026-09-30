# reel

Screen-recorded product takes for the case studies, with a FigJam-style
multiplayer cursor, cursor chat, emoji bursts and Screen Studio-style zooms.

## How it works

1. **Record** (`reel.js`): a headed, fullscreen Chromium on a virtual X display
   (Xvfb) at 1.5x DPR, so a 1920x1080 viewport is captured at 2880x1620,
   60fps, by ffmpeg `x11grab`. The script drives the real mouse (so hovers
   fire) and logs every cursor position, click, zoom beat and chat line to
   `track.json`. The cursor is **not** on the capture.
2. **Render** (`render.py`): composites the cursor from sprites at a true
   60fps (press squish, click ring, chat bubble pop) and runs the camera as a
   critically damped spring, so zooms ease in/out and follow the cursor with a
   dead zone. A magenta sync flash at the start of each capture aligns the
   video to the track to the frame.

4K capture works with `REEL_SCALE=2`, but needs more than 4 cores to encode
live; on the cloud container it drops to ~25fps, which is why 1.5x is the
default. Zooms up to 1.5x are native in a 1080p export.

## Use

    node tools/reel/shots/osmosis.js swap limit       # record takes
    python3 tools/reel/render.py tools/reel/out/osmosis-swap            # 1080p, full-bleed
    python3 tools/reel/render.py tools/reel/out/osmosis-swap --framed   # window on gradient

Linux only (Xvfb + x11grab); needs ffmpeg, Playwright's Chromium and Pillow. Outputs land in
`tools/reel/out/` (git-ignored). `shots/_demo.js` is a smoke test against the
local site.

## In a shot

```js
await r.move('text=Swap');                 // eased, slightly arced path
await r.click('button:has-text("Buy")');
await r.type('250');
await r.zoom(1.8, { focus: 'cursor' });    // or a selector, or {x,y}
await r.unzoom();
await r.say('no pop-ups 🙌');              // FigJam cursor chat
await r.react('⚡');                        // emoji burst
await r.highlight('text=1-Click Trading'); // outline an element
await r.scroll(900);
```

## 1-Click Trading needs a wallet

The container has no wallet. For the 1CT take, run with a Chromium profile
where Keplr is installed, unlocked and 1-Click Trading already enabled:

    USER_DATA_DIR=~/reel-profile EXTENSIONS=/path/to/keplr node tools/reel/shots/osmosis.js oneclick

It stops short of submitting unless `EXECUTE=1`, which places a real trade.
