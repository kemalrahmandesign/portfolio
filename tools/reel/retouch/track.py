#!/usr/bin/env python3
"""Track the macOS cursor through a screen recording.

    python3 track.py in.mov template.npz out.json

Masked SQDIFF template matching on the grey frame, in a window around the
last hit, with a full-frame search when the window misses. Writes per-frame
{x, y, score, kind} where (x, y) is the cursor's hot spot.
"""
import json
import subprocess
import sys

import cv2
import numpy as np

src, tpl_path, out = sys.argv[1:4]
tpls = np.load(tpl_path, allow_pickle=True)["tpls"]  # list of (name, img, mask, hx, hy)

probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                        "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")
W, H = int(probe[0]), int(probe[1])
dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                       stdout=subprocess.PIPE, bufsize=W * H * 2)


def best(g, x0, y0, x1, y1):
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(W, x1), min(H, y1)
    res = None
    for name, t, m, hx, hy in tpls:
        th, tw = t.shape
        if x1 - x0 < tw or y1 - y0 < th:
            continue
        r = cv2.matchTemplate(g[y0:y1, x0:x1], t, cv2.TM_SQDIFF, mask=m)
        mn, _, loc, _ = cv2.minMaxLoc(r)
        s = mn / (m > 0).sum() / 255.0**2  # mean squared error, 0..1
        if res is None or s < res[0]:
            res = (s, x0 + loc[0] + hx, y0 + loc[1] + hy, name)
    return res


track = []
last = None
i = 0
GOOD = 0.02
while True:
    buf = dec.stdout.read(W * H)
    if len(buf) < W * H:
        break
    g = np.frombuffer(buf, np.uint8).reshape(H, W)
    r = None
    if last:
        r = best(g, last[0] - 260, last[1] - 260, last[0] + 260, last[1] + 260)
    if r is None or r[0] > GOOD:
        # coarse full search at half size, then refine
        small = cv2.resize(g, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        cand = []
        for name, t, m, hx, hy in tpls:
            ts = cv2.resize(t, (t.shape[1] // 2, t.shape[0] // 2), interpolation=cv2.INTER_AREA)
            ms = cv2.resize(m, (m.shape[1] // 2, m.shape[0] // 2), interpolation=cv2.INTER_NEAREST)
            rr = cv2.matchTemplate(small, ts, cv2.TM_SQDIFF, mask=ms)
            mn, _, loc, _ = cv2.minMaxLoc(rr)
            cand.append((mn / max(1, (ms > 0).sum()), loc[0] * 2 + hx, loc[1] * 2 + hy))
        _, cx, cy = min(cand)
        r2 = best(g, cx - 80, cy - 80, cx + 80, cy + 80)
        if r2 and (r is None or r2[0] < r[0]):
            r = r2
    track.append({"f": i, "x": r[1], "y": r[2], "s": round(r[0], 5), "k": r[3]})
    if r[0] <= GOOD:
        last = (r[1], r[2])
    i += 1
    if i % 120 == 0:
        print(i, track[-1], flush=True)

json.dump({"w": W, "h": H, "track": track}, open(out, "w"))
print("frames", i)
