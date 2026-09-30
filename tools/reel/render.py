#!/usr/bin/env python3
"""Turn a reel capture (capture.mp4 + track.json + sprites/) into a 60fps MP4.

- Camera: a critically damped spring on (log zoom, centre), so zooms ease in
  and out like Screen Studio instead of snapping. With focus 'cursor' it only
  re-centres once the cursor nears the edge of the view, so it doesn't swim.
- Cursor: a FigJam-style arrow + name tag composited here from sprites, at a
  true 60fps, with a press squish, a click ring and cursor-chat bubbles.

    python3 render.py out/swap                  # full-bleed 1920x1080
    python3 render.py out/swap --framed         # rounded window on a gradient
    python3 render.py out/swap --size 3840x2160 # 4K master
"""
import argparse
import bisect
import json
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("dir")
ap.add_argument("--fps", type=int, default=60)
ap.add_argument("--size", default="1920x1080")
ap.add_argument("--framed", action="store_true", help="window on a gradient background")
ap.add_argument("--bg", default="#12082e,#3a1c8c,#8c8af9", help="gradient stops for --framed")
ap.add_argument("--omega", type=float, default=6.0, help="camera spring stiffness (rad/s)")
ap.add_argument("--cursor", type=float, default=1.2, help="cursor size multiplier")
ap.add_argument("--no-cursor", action="store_true")
ap.add_argument("--crf", type=int, default=16)
ap.add_argument("--out", default=None)
ap.add_argument("--trim-start", type=float, default=0.0, help="seconds to drop from the start")
ap.add_argument("--trim-end", type=float, default=0.0, help="seconds to drop from the end")
a = ap.parse_args()

D = a.dir.rstrip("/")
meta = json.load(open(os.path.join(D, "track.json")))
W, H = meta["w"], meta["h"]  # viewport in CSS px
style = meta["style"]
track = meta["track"]
T = {e["type"]: e["t"] for e in track if e["type"] in ("sync", "start", "end")}
t_begin = T["start"] + a.trim_start
t_end = T["end"] - a.trim_end

cursor = [(e["t"], e["x"], e["y"]) for e in track if e["type"] == "cursor"]
ctimes = [c[0] for c in cursor]
zooms = [e for e in track if e["type"] == "zoom"]
ztimes = [z["t"] for z in zooms]
downs = [e for e in track if e["type"] == "down"]
ups = [e["t"] for e in track if e["type"] == "up"]
talk = [e for e in track if e["type"] in ("say", "hush")]
talk_t = [e["t"] for e in talk]

OW, OH = map(int, a.size.lower().split("x"))


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


COLOR = hex2rgb(style["color"])


def cursor_at(t):
    i = bisect.bisect_right(ctimes, t) - 1
    if i < 0:
        return cursor[0][1], cursor[0][2]
    if i + 1 < len(cursor):
        t0, x0, y0 = cursor[i]
        t1, x1, y1 = cursor[i + 1]
        if t1 - t0 < 0.1:  # only interpolate inside a continuous move
            k = (t - t0) / max(1e-6, t1 - t0)
            return x0 + (x1 - x0) * k, y0 + (y1 - y0) * k
    return cursor[i][1], cursor[i][2]


def zoom_at(t):
    i = bisect.bisect_right(ztimes, t) - 1
    return zooms[i] if i >= 0 else None


class Spring:
    """Critically damped spring, integrated in small substeps."""

    def __init__(self, v):
        self.x, self.v = v, 0.0

    def step(self, target, w, dt):
        h = dt / 4
        for _ in range(4):
            self.v += (w * w * (target - self.x) - 2 * w * self.v) * h
            self.x += self.v * h
        return self.x


def clamp_center(cx, cy, z):
    hw, hh = W / 2 / z, H / 2 / z
    return min(max(cx, hw), W - hw), min(max(cy, hh), H - hh)


def ease_out_back(k, s=1.7):
    k = min(max(k, 0), 1) - 1
    return 1 + k * k * ((s + 1) * k + s)


# ---------------------------------------------------------------- sprites
SP = os.path.join(D, "sprites")
man = json.load(open(os.path.join(SP, "manifest.json")))
PAD, SDPR = man["pad"], man["dpr"]
S_ARROW = Image.open(os.path.join(SP, "arrow.png")).convert("RGBA")
S_TAG = Image.open(os.path.join(SP, "tag.png")).convert("RGBA")
S_CHAT = {t: Image.open(os.path.join(SP, f"{k}.png")).convert("RGBA") for t, k in man["chats"].items()}
TIP = (PAD + 1.6, PAD + 1.4)  # arrow tip inside the arrow sprite, CSS px
TAG_OFF = (16 - PAD, 23 - PAD)  # tag sprite origin relative to the tip, CSS px
_scache = {}


def scaled(img, k, key):
    k = round(k, 3)
    ck = (key, k)
    if ck not in _scache:
        if len(_scache) > 400:
            _scache.clear()
        _scache[ck] = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    return _scache[ck]


def ring(frame, x, y, r, width, alpha):
    """Anti-aliased ring, drawn 4x and reduced."""
    ss = 4
    R = int(r + width + 2)
    patch = Image.new("RGBA", (2 * R * ss, 2 * R * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(patch)
    c = R * ss
    d.ellipse([c - r * ss, c - r * ss, c + r * ss, c + r * ss], outline=COLOR + (int(255 * alpha),), width=max(1, int(width * ss)))
    patch = patch.resize((2 * R, 2 * R), Image.LANCZOS)
    frame.alpha_composite(patch, *_clip(frame, patch, x - R, y - R))


def draw_cursor(frame, t, px, py, k):
    """k: output px per CSS px for the cursor (already includes zoom)."""
    # press squish
    press = 0.0
    for e in downs:
        if e["t"] <= t < e["t"] + 0.6:
            up = next((u for u in ups if u >= e["t"]), e["t"] + 0.1)
            if t < up:
                press = min(1, (t - e["t"]) / 0.05)
            else:
                d = t - up
                press = max(0.0, math.exp(-d * 14) * math.cos(d * 28))
            # click ring
            d = t - e["t"]
            if d < 0.55:
                kk = 1 - (1 - d / 0.55) ** 3
                ring(frame, px, py, (0.2 + 1.15 * kk) * 22 * k, 3 * k, 0.95 * (1 - kk))
    s_arrow = k / SDPR * (1 - 0.18 * press)
    arr = scaled(S_ARROW, s_arrow, "arrow")
    frame.alpha_composite(arr, *(_clip(frame, arr, px - TIP[0] * SDPR * s_arrow, py - TIP[1] * SDPR * s_arrow)))

    # tag or chat bubble
    i = bisect.bisect_right(talk_t, t) - 1
    ev = talk[i] if i >= 0 else None
    if ev and ev["type"] == "say":
        img, key, pop = S_CHAT[ev["text"]], "chat:" + ev["text"], ease_out_back((t - ev["t"]) / 0.38)
    else:
        img, key = S_TAG, "tag"
        pop = ease_out_back((t - ev["t"]) / 0.3) if ev else 1.0
    pop = 0.6 + 0.4 * pop
    s_tag = k / SDPR * pop
    tg = scaled(img, s_tag, key)
    ox = px + TAG_OFF[0] * k - PAD * SDPR * (s_tag - k / SDPR)
    oy = py + TAG_OFF[1] * k - PAD * SDPR * (s_tag - k / SDPR)
    frame.alpha_composite(tg, *(_clip(frame, tg, ox, oy)))


def _clip(frame, img, x, y):
    """alpha_composite needs a non-negative dest; crop the sprite instead."""
    x, y = int(round(x)), int(round(y))
    sx, sy = max(0, -x), max(0, -y)
    return (max(0, x), max(0, y)), (sx, sy, img.width, img.height)


# ---------------------------------------------------------------- framing
if a.framed:
    cols = [hex2rgb(s.strip()) for s in a.bg.split(",")]
    gw, gh = 320, int(320 * OH / OW)
    g = Image.new("RGB", (gw, gh))
    px_ = g.load()
    for yy in range(gh):
        for xx in range(gw):
            k = xx / gw * 0.6 + yy / gh * 0.4
            seg = min(len(cols) - 2, int(k * (len(cols) - 1)))
            f = k * (len(cols) - 1) - seg
            c0, c1 = cols[seg], cols[seg + 1]
            px_[xx, yy] = tuple(int(c0[j] + (c1[j] - c0[j]) * f) for j in range(3))
    BG = g.resize((OW, OH), Image.BICUBIC).filter(ImageFilter.GaussianBlur(2))
    pad = 0.07
    s = min(OW * (1 - 2 * pad) / W, OH * (1 - 2 * pad) / H)
    VW, VH = int(W * s), int(H * s)
    VX, VY = (OW - VW) // 2, (OH - VH) // 2
    rad = int(min(VW, VH) * 0.03)
    MASK = Image.new("L", (VW, VH), 0)
    ImageDraw.Draw(MASK).rounded_rectangle([0, 0, VW - 1, VH - 1], rad, fill=255)
    sh = Image.new("L", (OW, OH), 0)
    off = int(OH * 0.02)
    ImageDraw.Draw(sh).rounded_rectangle([VX, VY + off, VX + VW, VY + VH + off], rad, fill=160)
    sh = sh.filter(ImageFilter.GaussianBlur(OH * 0.03))
    BG = Image.composite(Image.new("RGB", (OW, OH), (6, 2, 20)), BG, sh).convert("RGBA")
else:
    VW, VH, VX, VY = OW, OH, 0, 0

# ---------------------------------------------------------------- capture
probe = subprocess.run(
    ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", os.path.join(D, "capture.mp4")],
    capture_output=True, text=True,
).stdout.strip().split(",")
CW, CH = int(probe[0]), int(probe[1])
FB = CW * CH * 3
dec = subprocess.Popen(
    ["ffmpeg", "-loglevel", "error", "-i", os.path.join(D, "capture.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    stdout=subprocess.PIPE, bufsize=FB * 2,
)
cap_i = -1
cap_img = None


def read_frame():
    global cap_i
    buf = dec.stdout.read(FB)
    if len(buf) < FB:
        return None
    cap_i += 1
    return buf


# Find the sync flash: the first frame whose top-left corner is magenta.
k_sync = None
while k_sync is None:
    buf = read_frame()
    if buf is None:
        sys.exit("no sync flash found in capture")
    o = (20 * CW + 20) * 3
    r, g_, b = buf[o], buf[o + 1], buf[o + 2]
    if r > 200 and g_ < 60 and b > 200:
        k_sync = cap_i
FPS_CAP = 60.0


def cap_index(t):
    return int(round(k_sync + (t - T["sync"]) * FPS_CAP))


# ---------------------------------------------------------------- render
name = os.path.basename(D) + ("-framed" if a.framed else "") + (f"-{OH}p" if OH not in (1080, 1920) else "")
out = a.out or os.path.join(os.path.dirname(os.path.abspath(D)), name + ".mp4")
enc = subprocess.Popen(
    [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", str(a.fps), "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-movflags", "+faststart", out,
    ],
    stdin=subprocess.PIPE,
)

zs = Spring(0.0)
cx, cy = Spring(W / 2), Spring(H / 2)
follow = [W / 2, H / 2]
last_ev = None
dt = 1 / a.fps
# Warm the springs up over the trimmed head so a trim never starts mid-snap.
n = int((t_end - t_begin) * a.fps)
t = T["start"]
while t < t_begin:
    ev = zoom_at(t)
    if ev is not None:
        zs.step(math.log(max(1, ev["zoom"])), a.omega * ev.get("speed", 1), dt)
    t += dt

for fi in range(n):
    t = t_begin + fi * dt
    ev = zoom_at(t)
    z_target = max(1.0, float(ev["zoom"])) if ev else 1.0
    w = a.omega * float(ev.get("speed", 1)) if ev else a.omega
    mx, my = cursor_at(t)

    if ev is not last_ev and ev is not None:
        f = ev["focus"]
        follow = [mx, my] if f == "cursor" else [f["x"], f["y"]]
        last_ev = ev
    elif ev and ev["focus"] == "cursor" and z_target > 1.01:
        hw, hh = W / 2 / z_target, H / 2 / z_target
        if abs(mx - follow[0]) > hw * 0.55:
            follow[0] = mx - math.copysign(hw * 0.25, mx - follow[0])
        if abs(my - follow[1]) > hh * 0.55:
            follow[1] = my - math.copysign(hh * 0.25, my - follow[1])

    tx, ty = clamp_center(follow[0], follow[1], z_target) if z_target > 1.01 else (W / 2, H / 2)
    z = max(1.0, math.exp(zs.step(math.log(z_target), w, dt)))
    x, y = clamp_center(cx.step(tx, w, dt), cy.step(ty, w, dt), z)

    want = cap_index(t)
    while cap_i < want:
        buf = read_frame()
        if buf is None:
            break
        if cap_i >= want:
            cap_img = Image.frombuffer("RGB", (CW, CH), buf, "raw", "RGB", 0, 1)
    if cap_img is None:
        continue

    sx, sy = CW / W, CH / H
    hw, hh = W / 2 / z, H / 2 / z
    box = ((x - hw) * sx, (y - hh) * sy, (x + hw) * sx, (y + hh) * sy)
    view = cap_img.resize((VW, VH), Image.LANCZOS, box=box).convert("RGBA")

    if not a.no_cursor:
        k_view = VW / (W / z)  # output px per CSS px at this zoom
        cpx, cpy = (mx - (x - hw)) * k_view, (my - (y - hh)) * k_view
        draw_cursor(view, t, cpx, cpy, (VW / W) * a.cursor * z ** 0.8)

    if a.framed:
        frame = BG.copy()
        frame.paste(view, (VX, VY), MASK)
    else:
        frame = view
    enc.stdin.write(frame.convert("RGB").tobytes())
    if fi % 60 == 0:
        sys.stdout.write(f"\r[render] {os.path.basename(D)} {fi}/{n}")
        sys.stdout.flush()

enc.stdin.close()
enc.wait()
dec.kill()
print(f"\r[render] {n} frames -> {out}          ")
