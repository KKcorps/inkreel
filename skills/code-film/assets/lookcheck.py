#!/usr/bin/env python3
"""How does the picture change over time? Run it on the finished MP4.

  python3 lookcheck.py piece.mp4           a readable report
  python3 lookcheck.py piece.mp4 --json    the numbers, for verify.py

Samples the film four times a second, in real time, and reports how often a
new look arrives, how often it cuts, how the colour and the camera behave, and
how it ends. These are measurements, not a verdict. A slow film is not a bad
film. verify.py compares them with what the piece's intent card said it would
do, and reference/gallery.md has what the good films measured. Needs ffmpeg and
numpy. Exits 1 only when there is no usable video.
"""
import colorsys
import json
import math
import subprocess
import sys

import numpy as np

np.seterr(all='ignore')

W = 64
FPS = 4
# what the gallery films measured, real time, 25 Sep 2026. a spread, not a target
GALLERY = {
    "look": "2.3 to 14 s", "layout": "0.46 to 0.99", "hues": "1 to 8", "spread": "0.4 to 0.9",
    "range": "0.38 to 0.70", "cuts": "0.1 to 2.0 /s", "camera": "0.1 to 0.9",
}


def frames(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={FPS},scale={W}:{W}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    n = len(raw) // (W * W * 3)
    return np.frombuffer(raw[:n * W * W * 3], dtype=np.uint8).reshape(n, W, W, 3).astype(np.float32) / 255


def framing_cuts(path, side=64):
    """Hard cuts that keep the palette: a cut to a closer shot of the same page.
    Every frame, small and grey. A cut is a frame change far above the frames
    around it. A camera move or a pen changes the frame steadily, so it is not."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={side}:{side},format=gray",
                          "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
    n = len(raw) // (side * side)
    if n < 8:
        return 0, 0
    F = np.frombuffer(raw[:n * side * side], dtype=np.uint8).reshape(n, side, side).astype(np.float32) / 255
    d = np.abs(np.diff(F, axis=0)).mean((1, 2))
    cuts, last = 0, -99
    for k in range(len(d)):
        around = np.concatenate([d[max(0, k - 6):max(0, k - 1)], d[k + 2:k + 7]])
        base = float(np.median(around)) if len(around) else 0.0
        if d[k] > 0.035 and d[k] > 3.0 * max(base, 0.006) and k - last > 4:
            # boiling ink or a texture on twos jumps too, but keeps its layout. a cut does not
            a, b = F[k].ravel() - F[k].mean(), F[k + 1].ravel() - F[k + 1].mean()
            if float(a @ b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9) > 0.6:
                continue
            cuts += 1
            last = k
    return cuts, n


def hist(fr, bins=6):
    q = np.minimum((fr * bins).astype(int), bins - 1)
    idx = q[..., 0] * bins * bins + q[..., 1] * bins + q[..., 2]
    h = np.bincount(idx.ravel(), minlength=bins ** 3).astype(float)
    return h / h.sum()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_json = "--json" in sys.argv
    if not args:
        print(__doc__)
        return 2
    path = args[0]
    F = frames(path)
    n = len(F)
    if n < FPS * 4:
        print(json.dumps({"error": "under four seconds of video"}) if as_json else "no usable video, or under four seconds")
        return 1
    H = np.array([hist(f) for f in F])
    G = F @ np.array([.299, .587, .114], dtype=np.float32)
    secs = n / FPS

    # cuts: a big palette change between consecutive samples, or a hard change of
    # framing on the same palette, whichever finds more
    d = np.abs(np.diff(H, axis=0)).sum(1)
    palette_cuts = int((d > 0.5).sum())
    frame_cuts, _ = framing_cuts(path)
    cuts = max(palette_cuts, frame_cuts) / secs

    # one sample a second for the look comparisons
    sec = np.arange(0, n, FPS)
    Hs = H[sec]
    lay = np.array([g.reshape(8, 8, 8, 8).mean((1, 3)).ravel() for g in G[sec]])
    lay = (lay - lay.mean(1, keepdims=True)) / (lay.std(1, keepdims=True) + 1e-6)
    m = len(sec)
    dl = [1 - np.corrcoef(lay[i], lay[j])[0, 1] for i in range(m) for j in range(i + 2, m)]
    layout = float(np.nanmean(dl)) if dl and not np.all(np.isnan(dl)) else 0.0   # a flat second has no layout
    # a new look is a new palette. films in one or two inks change scene
    # without changing palette, so this undercounts them. read it with the contact sheet
    reps = []
    for i in range(m):
        if not any(np.abs(Hs[i] - Hs[r]).sum() / 2 < 0.45 for r in reps):
            reps.append(i)
    look = secs / max(1, len(reps))

    # hue: how many families carry weight, and how spread they are
    px = F.reshape(-1, 3)[::7]
    mx, mn = px.max(1), px.min(1)
    sat = (mx - mn) / (mx + 1e-6)
    hs = np.array([colorsys.rgb_to_hsv(*p)[0] for p in px[::13]])
    ws = sat[::13]
    ang = hs * 2 * np.pi
    R = math.hypot((np.cos(ang) * ws).sum(), (np.sin(ang) * ws).sum()) / (ws.sum() + 1e-9)
    spread = 1 - R
    hb = np.bincount((hs * 12).astype(int) % 12, weights=ws, minlength=12)
    hb /= hb.sum() + 1e-9
    hues = int((hb > 0.04).sum())

    # contrast across the piece: the lightest second against the darkest
    lum = [G[s].mean() for s in sec]
    rng_ = float(max(lum) - min(lum))

    # camera: samples that move a lot without being a cut
    fd = np.abs(np.diff(G, axis=0)).mean((1, 2))
    camera = float(((fd > 0.02) & (d < 0.5)).mean())

    # the ending. how still the last second and a half is, and how close the
    # last frame is to the first, which is what a loop or a bookend needs
    tail = fd[-6:] if len(fd) >= 6 else fd
    end_motion = float(tail.mean())
    loop = float(np.abs(F[0] - F[-1]).mean())

    out = {"seconds": round(float(secs), 1), "looks": len(reps), "look": round(float(look), 1),
           "layout": round(float(layout), 2), "hues": int(hues), "spread": round(float(spread), 2),
           "range": round(float(rng_), 2), "cuts": round(float(cuts), 2), "camera": round(float(camera), 2),
           "end_motion": round(float(end_motion), 4), "loop": round(float(loop), 3)}
    if as_json:
        print(json.dumps(out))
        return 0
    print(f"{path}  {secs:.1f}s  {len(reps)} distinct palettes  {int(round(cuts * secs))} cuts")
    rows = [("look", f"{look:.1f}s", "seconds per distinct palette"),
            ("cuts", f"{cuts:.2f}/s", "hard changes a second"),
            ("layout", f"{layout:.2f}", "how differently seconds are composed, 0 same, 1 unrelated"),
            ("hues", f"{hues}", "colour families that carry weight"),
            ("spread", f"{spread:.2f}", "how far round the colour wheel the weight goes"),
            ("range", f"{rng_:.2f}", "lightest second against darkest"),
            ("camera", f"{camera:.2f}", "share of time the frame moves without cutting")]
    for k, v, what in rows:
        print(f"  {k:7s} {v:>8}   gallery {GALLERY[k]:14s} {what}")
    print(f"  ending  last 1.5 s motion {end_motion:.4f}   first against last frame {loop:.3f}"
          f"   (a held end is near 0, a loop or bookend is under about 0.08)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
