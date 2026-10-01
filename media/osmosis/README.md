# Osmosis case study clips

Screen recordings of osmosis.zone (the marketing site), 1080p, 60fps, H.264.
Recorded with `tools/reel` (FigJam-style "Kemal" cursor, cursor chat, smooth zooms).

| File | Length | Shows |
|---|---|---|
| `hero.mp4` | 12s | "gm" chat, zoom on the rotating "Discover and trade ___" headline, swap card, hover Start Trading, 🚀 |
| `hero-quick.mp4` | 6s | No cursor. Fast ease into the headline, pan right to the swap card, pull back |
| `tokens.mp4` | 13s | Hovering Top Volume / New token rows, "live prices" |
| `orbit.mp4` | 16s | The orbit of chain logos, hovering several, "100+ chains" |
| `stats.mp4` | 14s | Zoom on the $44B all-time volume card and the other stat cards |
| `ecosystem.mp4` | 19s | Hovering Liquidity Pools, Perps, Margin, Liquid Staking, Apps |
| `cta.mp4` | 11s | "Start trading today" section, hover Get Started, 💜 |
| `tour.mp4` | 44s | Slow full-page scroll, b-roll |

Not here yet: anything from the trading app (app.osmosis.zone), including
1-Click Trading. That host was blocked from the recording environment, and
1-Click Trading also needs a connected wallet.

## From Kemal's own recording (app.osmosis.zone)

| File | Length | Shows |
|---|---|---|
| `app-1ct-full.mp4` | 34s | 1920x1200. Buy/Sell/Swap tabs, 50% BTC to OSMO quote, route expanded, profile, 1-Click Trading enabled, success toasts, "59 minutes remaining". macOS cursor painted out and replaced with the FigJam cursor; the Keplr approval window is cut |
| `app-1ct-full-framed.mp4` | 34s | Same, 1920x1080, in a rounded window on the purple gradient |

Re-cut with `tools/reel/retouch/` (track.py finds the macOS arrow and hand,
edit.py paints them out, draws the cursor, cuts and zooms).

## web/

Lighter encodes (1600px, CRF 24) and posters used by `work/osmosis.html`:
`cover` (hero-quick), `ecosystem`, `trade` and `oneclick` (the two halves of
app-1ct-full), and `tokens`.
