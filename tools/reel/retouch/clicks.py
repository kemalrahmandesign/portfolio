#!/usr/bin/env python3
"""Guess click times: the UI under a resting cursor changes sharply.

    python3 clicks.py in.mov track.json  -> prints candidate times (s)
"""
import json, subprocess, sys
import numpy as np

src, tj = sys.argv[1:3]
T = json.load(open(tj))
W, H, tr = T["w"], T["h"], T["track"]
fps = 60.0
S = 4  # analyse at quarter size
w, h = W // S, H // S
dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", src, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
hist = []
ev = []
i = 0
while True:
    b = dec.stdout.read(w * h)
    if len(b) < w * h:
        break
    g = np.frombuffer(b, np.uint8).reshape(h, w).astype(np.int16)
    hist.append(g)
    if len(hist) > 6:
        hist.pop(0)
        x, y = tr[i]["x"] // S, tr[i]["y"] // S
        still = all(abs(tr[j]["x"] - tr[i]["x"]) < 4 and abs(tr[j]["y"] - tr[i]["y"]) < 4 for j in range(i - 8, i + 1))
        if still:
            x0, y0, x1, y1 = max(0, x - 60), max(0, y - 40), min(w, x + 60), min(h, y + 40)
            d = np.abs(hist[-1][y0:y1, x0:x1] - hist[0][y0:y1, x0:x1])
            d[max(0, y - y0 - 4):y - y0 + 12, max(0, x - x0 - 4):x - x0 + 10] = 0  # ignore the cursor itself
            ev.append((i, float(d.mean())))
    i += 1
cand = [(f, s) for f, s in ev if s > 2.0]
out = []
for f, s in cand:
    if out and f - out[-1][0] < 36:
        if s > out[-1][1]:
            out[-1] = (out[-1][0], s)
        continue
    out.append((f, s))
for f, s in out:
    print(f"{(f - 6) / fps:6.2f}s  x={tr[f]['x']} y={tr[f]['y']}  change={s:.1f}")
