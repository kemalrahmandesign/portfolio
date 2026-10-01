#!/usr/bin/env python3
"""Re-cut a real screen recording: paint out the macOS cursor, draw the
FigJam cursor (with chat bubbles and click rings), cut, and zoom.

    python3 edit.py edl.json

edl.json:
{
  "src": "rec.mov", "track": "track.json", "templates": "tpl.npz",
  "sprites": "sprites/", "css_scale": 2,            # retina: src px per CSS px
  "keep": [[0.3, 25.0], [28.2, 37.8]],             # source seconds
  "clicks": [2.75, ...],                           # source seconds
  "say": [[1.0, 2.6, "let's swap"], ...],          # [start, end, text] source s
  "camera": [[0.3, 1.0, null], [1.0, 1.7, [1700, 330]], ...],  # [t, zoom, focus src px | null=centre]
  "out": "edit.mp4", "size": "1920x1200", "framed": false
}
"""
import bisect, json, math, os, subprocess, sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

E = json.load(open(sys.argv[1]))
base = os.path.dirname(os.path.abspath(sys.argv[1]))
P = lambda p: p if os.path.isabs(p) else os.path.join(base, p)

T = json.load(open(P(E["track"])))
SW, SH = T["w"], T["h"]
tr = T["track"]
tpls = {t[0]: t for t in np.load(P(E["templates"]), allow_pickle=True)["tpls"]}
GOOD = {"arrow": 0.04, "hand": 0.07}
CSS = E.get("css_scale", 2)
OW, OH = map(int, E.get("size", "1920x1200").split("x"))
FRAMED = E.get("framed", False)
CURSOR = E.get("cursor_size", 1.2)
OMEGA = E.get("omega", 6.0)

fps_s = eval(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate",
                             "-of", "csv=p=0", P(E["src"])], capture_output=True, text=True).stdout.strip())

# ---- cursor path: hold the last confident hit, light smoothing
pos = []
last = (SW / 2, SH / 2, "arrow")
for r in tr:
    if r["s"] <= GOOD[r["k"]]:
        last = (r["x"], r["y"], r["k"])
    pos.append(last)
sm = []
ax, ay = pos[0][0], pos[0][1]
for x, y, k in pos:
    if math.hypot(x - ax, y - ay) > 60:  # a jump (cut, teleport): don't smear it
        ax, ay = x, y
    ax += (x - ax) * 0.6
    ay += (y - ay) * 0.6
    sm.append((ax, ay))


def cursor_at(ts):
    f = min(len(sm) - 1, max(0, ts * fps_s))
    i = int(f)
    j = min(len(sm) - 1, i + 1)
    k = f - i
    return sm[i][0] + (sm[j][0] - sm[i][0]) * k, sm[i][1] + (sm[j][1] - sm[i][1]) * k


# ---- edit list: output time -> source time
keep = E["keep"]
offs = []
acc = 0.0
for a, b in keep:
    offs.append(acc)
    acc += b - a
DUR = acc


def src_t(t):
    for (a, b), o in zip(keep, offs):
        if t < o + (b - a):
            return a + (t - o)
    return keep[-1][1]


# ---- camera
cam = E["camera"]
cam_t = [c[0] for c in cam]


def cam_at(ts):
    i = bisect.bisect_right(cam_t, ts) - 1
    c = cam[max(0, i)]
    z = c[1]
    f = c[2] or [SW / 2, SH / 2]
    sp = c[3] if len(c) > 3 else 1.0
    return z, f, sp


class Spring:
    def __init__(self, v):
        self.x, self.v = v, 0.0

    def step(self, target, w, dt):
        h = dt / 4
        for _ in range(4):
            self.v += (w * w * (target - self.x) - 2 * w * self.v) * h
            self.x += self.v * h
        return self.x

    def snap(self, v):
        self.x, self.v = v, 0.0


AR = OW / OH  # output aspect; the view is a source rect of this aspect


def view_wh(z):
    # largest source rect of the output aspect, divided by zoom
    if SW / SH > AR:
        h = SH
        w = SH * AR
    else:
        w = SW
        h = SW / AR
    return w / z, h / z


def clamp(cx, cy, z):
    w, h = view_wh(z)
    return min(max(cx, w / 2), SW - w / 2), min(max(cy, h / 2), SH - h / 2)


# ---- sprites
SP = P(E["sprites"])
man = json.load(open(os.path.join(SP, "manifest.json")))
PAD, SDPR = man["pad"], man["dpr"]
S_ARROW = Image.open(os.path.join(SP, "arrow.png")).convert("RGBA")
S_TAG = Image.open(os.path.join(SP, "tag.png")).convert("RGBA")
S_CHAT = {t: Image.open(os.path.join(SP, f"{k}.png")).convert("RGBA") for t, k in man["chats"].items()}
TIP = (PAD + 1.6, PAD + 1.4)
TAG_OFF = (16 - PAD, 23 - PAD)
COLOR = tuple(int(E.get("color", "#8C8AF9").lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
_sc = {}


def scaled(img, k, key):
    ck = (key, round(k, 3))
    if ck not in _sc:
        if len(_sc) > 300:
            _sc.clear()
        _sc[ck] = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    return _sc[ck]


def paste(frame, img, x, y):
    x, y = int(round(x)), int(round(y))
    sx, sy = max(0, -x), max(0, -y)
    if sx >= img.width or sy >= img.height or x >= frame.width or y >= frame.height:
        return
    frame.alpha_composite(img, (max(0, x), max(0, y)), (sx, sy, img.width, img.height))


def ease_out_back(k, s=1.7):
    k = min(max(k, 0), 1) - 1
    return 1 + k * k * ((s + 1) * k + s)


clicks = E.get("clicks", [])
says = E.get("say", [])


def draw_cursor(frame, ts, px, py, k):
    press, rings = 0.0, []
    for c in clicks:
        d = ts - c
        if 0 <= d < 0.6:
            press = max(press, min(1, d / 0.05) if d < 0.1 else math.exp(-(d - 0.1) * 14) * math.cos((d - 0.1) * 28))
            if d < 0.55:
                rings.append(1 - (1 - d / 0.55) ** 3)
    for kk in rings:
        ss, r, wd, al = 4, (0.2 + 1.15 * kk) * 22 * k, 3 * k, 0.95 * (1 - kk)
        R = int(r + wd + 2)
        patch = Image.new("RGBA", (2 * R * ss, 2 * R * ss), (0, 0, 0, 0))
        c0 = R * ss
        ImageDraw.Draw(patch).ellipse([c0 - r * ss, c0 - r * ss, c0 + r * ss, c0 + r * ss], outline=COLOR + (int(255 * al),), width=max(1, int(wd * ss)))
        paste(frame, patch.resize((2 * R, 2 * R), Image.LANCZOS), px - R, py - R)
    sa = k / SDPR * (1 - 0.18 * max(0.0, press))
    arr = scaled(S_ARROW, sa, "arrow")
    paste(frame, arr, px - TIP[0] * SDPR * sa, py - TIP[1] * SDPR * sa)
    img, key, pop = S_TAG, "tag", 1.0
    for a, b, text in says:
        if a <= ts < b:
            img, key, pop = S_CHAT[text], text, ease_out_back((ts - a) / 0.38)
        elif b <= ts < b + 0.3:
            pop = ease_out_back((ts - b) / 0.3)
    pop = 0.6 + 0.4 * pop
    st = k / SDPR * pop
    tg = scaled(img, st, key)
    ox = px + TAG_OFF[0] * k - PAD * SDPR * (st - k / SDPR)
    oy = py + TAG_OFF[1] * k - PAD * SDPR * (st - k / SDPR)
    full = img.width * k / SDPR  # settled width, so the side doesn't flip mid-pop
    if ox + full > frame.width - 8:
        # no room on the right: hang the tag off the cursor's left instead
        ox = px - 6 * k - tg.width + PAD * SDPR * st
    paste(frame, tg, ox, oy)


# ---- cursor removal: the tracked template's footprint, dilated, inpainted
def erase(img, f):
    r = tr[f]
    if r["s"] > GOOD[r["k"]] * 1.6:
        return img
    _, t, m, hx, hy = tpls[r["k"]]
    th, tw = t.shape
    x0, y0 = r["x"] - hx, r["y"] - hy
    pad = 10
    X0, Y0 = max(0, x0 - pad), max(0, y0 - pad)
    X1, Y1 = min(SW, x0 + tw + pad), min(SH, y0 + th + pad)
    crop = img[Y0:Y1, X0:X1].copy()
    mask = np.zeros(crop.shape[:2], np.uint8)
    mx0, my0 = x0 - X0, y0 - Y0
    sub = (m > 0).astype(np.uint8) * 255
    ys, xs = slice(max(0, my0), min(mask.shape[0], my0 + th)), slice(max(0, mx0), min(mask.shape[1], mx0 + tw))
    mask[ys, xs] = sub[ys.start - my0:ys.stop - my0, xs.start - mx0:xs.stop - mx0]
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
    img[Y0:Y1, X0:X1] = cv2.inpaint(crop, mask, 4, cv2.INPAINT_TELEA)
    return img


# ---- framing
if FRAMED:
    cols = [(18, 8, 46), (58, 28, 140), (140, 138, 249)]
    g = Image.new("RGB", (320, int(320 * OH / OW)))
    px_ = g.load()
    for yy in range(g.height):
        for xx in range(g.width):
            kq = xx / g.width * 0.6 + yy / g.height * 0.4
            seg = min(len(cols) - 2, int(kq * (len(cols) - 1)))
            fq = kq * (len(cols) - 1) - seg
            px_[xx, yy] = tuple(int(cols[seg][j] + (cols[seg + 1][j] - cols[seg][j]) * fq) for j in range(3))
    BG = g.resize((OW, OH), Image.BICUBIC)
    sc = min(OW * 0.86 / SW, OH * 0.86 / SH)
    VW, VH = int(SW * sc), int(SH * sc)
    VX, VY = (OW - VW) // 2, (OH - VH) // 2
    rad = int(min(VW, VH) * 0.03)
    MASK = Image.new("L", (VW, VH), 0)
    ImageDraw.Draw(MASK).rounded_rectangle([0, 0, VW - 1, VH - 1], rad, fill=255)
    sh = Image.new("L", (OW, OH), 0)
    ImageDraw.Draw(sh).rounded_rectangle([VX, VY + int(OH * .02), VX + VW, VY + VH + int(OH * .02)], rad, fill=160)
    BG = Image.composite(Image.new("RGB", (OW, OH), (6, 2, 20)), BG, sh.filter(ImageFilter.GaussianBlur(OH * .03))).convert("RGBA")
    AR = SW / SH
else:
    VW, VH, VX, VY = OW, OH, 0, 0

# ---- render
dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", P(E["src"]), "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                       stdout=subprocess.PIPE, bufsize=SW * SH * 6)
enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}", "-r", "60", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", P(E["out"])],
                       stdin=subprocess.PIPE)
FB = SW * SH * 3
cur_i, cur = -1, None

z0, f0, _ = cam_at(src_t(0))
zs = Spring(math.log(z0))
cx, cy = Spring(f0[0]), Spring(f0[1])
dt = 1 / 60
n = int(DUR * 60)
prev_seg = 0
for fi in range(n):
    t = fi * dt
    ts = src_t(t)
    seg = bisect.bisect_right(offs, t) - 1
    want = int(round(ts * fps_s))
    while cur_i < want:
        b = dec.stdout.read(FB)
        if len(b) < FB:
            break
        cur_i += 1
        if cur_i >= want:
            cur = np.frombuffer(b, np.uint8).reshape(SH, SW, 3).copy()
    z_t, foc, sp = cam_at(ts)
    if seg != prev_seg and E.get("snap_on_cut", True):
        zs.snap(math.log(z_t))
        cx.snap(foc[0]); cy.snap(foc[1])
        prev_seg = seg
    w = OMEGA * sp
    z = max(1.0, math.exp(zs.step(math.log(z_t), w, dt)))
    tx, ty = clamp(foc[0], foc[1], z_t)
    x, y = clamp(cx.step(tx, w, dt), cy.step(ty, w, dt), z)
    img = erase(cur.copy(), min(cur_i, len(tr) - 1))
    vw, vh = view_wh(z)
    box = (x - vw / 2, y - vh / 2, x + vw / 2, y + vh / 2)
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    view = pil.resize((VW, VH), Image.LANCZOS, box=box).convert("RGBA")
    mx, my = cursor_at(ts)
    kv = VW / vw  # output px per source px
    draw_cursor(view, ts, (mx - box[0]) * kv, (my - box[1]) * kv, kv * CSS * CURSOR * z ** -0.2)
    if FRAMED:
        fr = BG.copy()
        fr.paste(view, (VX, VY), MASK)
        view = fr
    enc.stdin.write(view.convert("RGB").tobytes())
    if fi % 120 == 0:
        print(f"\r[edit] {fi}/{n}", end="", flush=True)
enc.stdin.close()
enc.wait()
dec.kill()
print(f"\r[edit] {n} frames -> {P(E['out'])}")
