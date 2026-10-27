#!/usr/bin/env python3
"""Do the joins hold? Run it on the captured frames, after build.sh's capture.

  python3 seamcheck.py piece.html frames_dir

The contact sheet and the full size acts show what each shot is. They cannot
show what happens between frames, which is where quality dies: a picture that
pops on a frame that is not a cut, a one frame flash, an anchor that wanders
off the centre. The page says where its cuts are and where its anchor is
pinned (?cuts=1). This compares the frames against that.

  pop     a big change on a frame that is neither a cut nor inside a move
  jerk    inside a move, one frame that jumps far more than its neighbours
  flash   one frame that differs from both neighbours, which are alike
  anchor  in a pinned act, no dot of the anchor's size sits on the centre

Needs Chrome, numpy and Pillow. Exits 1 while any BLOCK stands.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

def _find_chrome():
    """$CHROME if set, else the usual macOS and Linux locations"""
    import os, shutil
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for p in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              "/Applications/Chromium.app/Contents/MacOS/Chromium"]:
        if os.path.exists(p):
            return p
    for name in ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]:
        if shutil.which(name):
            return shutil.which(name)
    return "google-chrome"


CHROME = _find_chrome()
SMALL = 120
ANCHOR_R = 11          # the anchor's radius in design units, of 1000 across
DARK = 90              # luma under which a pixel counts as the anchor's ink, for indigo.
                       # a page that reports its anchor ink (?cuts=1 "anchor") moves it


def components(mask):
    """(size, cx, cy) of every 4-connected blob in a small boolean image"""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack, xs, ys = [(y0, x0)], [], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            ys.append(y); xs.append(x)
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    stack.append((yy, xx))
        out.append((len(xs), float(np.mean(xs)), float(np.mean(ys))))
    return out


def cuts_of(page):
    r = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--virtual-time-budget=60000",
                        "--dump-dom", Path(page).resolve().as_uri() + "?cuts=1"], capture_output=True, text=True)
    m = re.search(r"<title>cuts (.*?)</title>", r.stdout, re.S)
    if not m:
        return None      # a film without the engine. only flashes can be checked
    return json.loads(m.group(1).replace("&quot;", '"'))


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    page, fdir = sys.argv[1], Path(sys.argv[2])
    info = cuts_of(page)
    files = sorted(fdir.glob("*.png"))
    if info is None:
        # without the page's own cut list, a big change could be a cut or a pop.
        # a one frame flash is a defect either way, so that is what gets checked
        print("  seams  no ?cuts=1 mode, so only one frame flashes are checked")
        info = {"total": len(files), "cuts": [], "pinned": [], "moves": [], "names": {}, "flash_only": True}
    if len(files) != info["total"]:
        sys.exit(f"{len(files)} frames in {fdir}, the page has {info['total']}")
    cuts = set(info["cuts"])
    dark = min(200, info["anchor"] * 255 + 31) if info.get("anchor") is not None else DARK
    pinned = [f for a, b in info["pinned"] for f in range(a, b)]
    moving = {f for a, b in info.get("moves", []) for f in range(a, b + 1)}
    names = info.get("names", {})
    name = lambda f: names.get(str(max(int(k) for k in names if int(k) <= f)), "") if names else ""

    small, centre, pinset = [], {}, set(pinned)
    for i, p in enumerate(files):
        im = Image.open(p).convert("RGB")
        w = im.width
        small.append(np.asarray(im.resize((SMALL, SMALL), Image.BILINEAR).convert("L"), dtype=np.float32))
        if i in pinset:
            r = int(w * .05)
            c = np.asarray(im.crop((w // 2 - r, w // 2 - r, w // 2 + r, w // 2 + r)), dtype=np.float32)
            centre[i] = (c, w)
    small = np.stack(small)
    d = np.abs(np.diff(small, axis=0)).mean(axis=(1, 2))          # d[k]: change from frame k to k+1

    block, review = [], []
    # pops. a change several times the shot's own motion, on a frame that is not a cut
    starts = sorted(cuts | {len(files)})
    for a, b in zip(starts, starts[1:]):
        inner = [k for k in range(a, b - 1)]                          # boundaries k -> k+1 inside the shot
        if len(inner) < 3:
            continue
        base = float(np.median(d[inner]))
        for k in inner:
            if (k + 1) in moving:
                # a move may change fast, but smoothly. one frame far above both neighbours is a jerk
                hi = max(d[k - 1] if k > a else 0, d[k + 1] if k + 1 < b - 1 else 0)
                if d[k] > 20 and d[k] > 2.2 * hi:
                    block.append(f"jerk at frame {k + 1} ({name(k + 1)}): change {d[k]:.1f} inside a move, its neighbours at most {hi:.1f}")
            elif d[k] > max(4 * base, base + 14):
                block.append(f"pop at frame {k + 1} ({name(k + 1)}): change {d[k]:.1f} against {base:.1f} in its shot, not a cut and not a move")
    # flashes. frame k unlike both neighbours while they are alike
    for k in range(1, len(files) - 1):
        if k in cuts or (k + 1) in cuts:
            continue
        a2 = float(np.abs(small[k + 1] - small[k - 1]).mean())
        if d[k - 1] > 10 and d[k] > 10 and a2 < .35 * min(d[k - 1], d[k]):
            block.append(f"one frame flash at {k} ({name(k)}): {d[k - 1]:.1f} in, {d[k]:.1f} out, {a2:.1f} across")
    # the anchor. a dark blob of the anchor's size, round, on the centre. a blob
    # that is too big has merged with dark ink around it, so it cannot be seen
    drift, faint = [], []
    for f, (c, w) in centre.items():
        lum = c @ np.array([.299, .587, .114], dtype=np.float32)
        want = np.pi * (ANCHOR_R * w / 1000) ** 2
        blobs = components(lum < dark)
        r = c.shape[0] / 2
        fits = [(float(np.hypot(cx - r + .5, cy - r + .5)) / w * 1000, n) for n, cx, cy in blobs if .4 * want <= n <= 2.2 * want]
        at_centre = [b for b in blobs if b[0] > 2.2 * want and np.hypot(b[1] - r, b[2] - r) < r * .5]
        if fits and min(fits)[0] <= 4:
            continue
        if fits:
            drift.append((f, min(fits)[0]))
        else:
            faint.append((f, 0 if at_centre else -1))
    if drift:
        worst = max(drift, key=lambda x: x[1])
        block.append(f"anchor off the centre on {len(drift)} pinned frames, worst {worst[1]:.1f} units at frame {worst[0]} ({name(worst[0])})")
    if faint:
        worst = min(faint, key=lambda x: x[1])
        review.append(f"no anchor-sized dot found on the centre on {len(faint)} pinned frames, first at frame {faint[0][0]} ({name(faint[0][0])}). it has merged with dark ink or is missing. give it its paper halo")

    cps = len(cuts) / (len(files) / info.get("fps", 18))
    print(f"  seams  {len(files)} frames, {len(cuts)} cuts ({cps:.1f} a second), {len(pinned)} pinned")
    print()
    for b in block[:25]:
        print("BLOCK   " + b)
    if len(block) > 25:
        print(f"BLOCK   ... and {len(block) - 25} more")
    for r in review:
        print("REVIEW  " + r)
    if not block and not review:
        print("clean")
    return 1 if block else 0


if __name__ == "__main__":
    sys.exit(main())
