#!/usr/bin/env python3
"""Does it look printed, or does it look computed.

  python3 printcheck.py mine.png [reference.png]

Four properties, measured. Without a reference it checks against the bands
in reference/surface.md. With one it compares the two directly, which is
what you want when you are matching a specific look.

BLOCK findings must be zero before showing anything to the user.

Why these four. Every round of notes on the owl build reduced to one of
them, and eye alone got three of the four backwards at least once:

  acut    fine detail overall. Too low is mush, too high is harsh and
          un-printed. A heavy blur over a thin drawing tanks it.
  chroma  the colour grain, on the OPPONENT axes. A printed dark mottles
          red against green far more than blue against yellow, and
          neutral RGB noise measures and looks wrong.
  mottle  per region luma spread. Catches a dark flecked into soup, and
          a pale field whose dots have no paper left to swing against.
  hue     mean colour per region, so the tuning above does not quietly
          drift the palette.

It measures the SURFACE, not the construction. A solid that has come out
as a checkerboard of halftone diamonds still has plenty of fine contrast
and passes acut happily. `?flat=1` on the page, which draws the shapes
with every finish switched off, is the construction check. Run both.
"""
import math
import subprocess
import sys
from pathlib import Path

clamp = lambda x, a, b: a if x < a else (b if x > b else x)
block, review = [], []

# regions as fractions of the frame, so any size works. a build should name
# its own in a REGIONS file next to the page if these do not suit it.
# ONE sample point is not a measurement. The first version of this took a
# single patch per region; "dark mass" clipped the edge of a bright 17px
# dot and read 23 of variation in a mass that measures 10, which sent this
# build chasing an over-flecked dark that was never over-flecked. Every
# region is now five patches in a plus, reported as the median, so one
# feature cannot carry a number.
REGIONS = {
    "pale field":  (.80, .22),
    "mid field":   (.08, .65),
    "dark mass":   (.55, .74),
    "focal shape": (.21, .18),
}
# From reference/surface.md, measured on ONE real printed reference: a
# detail-dense close-up with a near-black mass and a high-contrast pale
# field. A calmer subject legitimately fails several of them. A seascape
# measured acut 3.7 and field chroma 22/30 and was correct; the owl bands
# want 6+ and 35/40. TREAT THESE AS A SANITY CHECK ONLY. Comparing against
# a reference image is the mode that actually discriminates.
BANDS = {
    "acut":        (6.0, 11.0),
    "dark rg":     (8.0, 17.0),
    "dark by":     (5.0, 13.0),
    "field rg":    (35.0, 70.0),
    "field by":    (40.0, 90.0),
}


def load(path, w=None):
    """Decode to raw RGB. Returns (bytes, side, cropped_from).

    Everything below indexes with one side, so a wide frame is centre-cropped
    to a square first. A 16:9 lesson frame used to read past the buffer and
    die. A square frame crops to itself, so nothing about it changes."""
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True).stdout.strip()
    if not probe:
        sys.exit(f"cannot read {path}")
    sw, sh = (int(v) for v in probe.split(",")[:2])
    side = min(sw, sh)
    vf = [f"crop={side}:{side}:{(sw - side) // 2}:{(sh - side) // 2}"]
    if w and side != w:
        vf.append(f"scale={w}:{w}")
        side = w
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf", ",".join(vf),
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True).stdout
    return raw, side, (sw, sh)


def px(raw, w, x, y):
    i = (y * w + x) * 3
    return raw[i], raw[i + 1], raw[i + 2]


def acut(raw, w):
    """Mean neighbour luma contrast: how much fine detail survives."""
    tot = n = 0
    lo, hi = int(w * .09), int(w * .91)
    for y in range(lo, hi, 3):
        for x in range(lo, hi - 1, 3):
            a, b = px(raw, w, x, y), px(raw, w, x + 1, y)
            tot += abs((a[0] * .299 + a[1] * .587 + a[2] * .114) -
                       (b[0] * .299 + b[1] * .587 + b[2] * .114))
            n += 1
    return tot / max(1, n)


def _sd(v):
    m = sum(v) / len(v)
    return (sum((z - m) ** 2 for z in v) / len(v)) ** .5


def _patch(raw, w, x0, y0, n):
    rs, gs, bs, rg, by = [], [], [], [], []
    for y in range(y0, y0 + n):
        for x in range(x0, x0 + n):
            r, g, b = px(raw, w, x, y)
            rs.append(r); gs.append(g); bs.append(b)
            rg.append(r - g); by.append(b - g)
    return ((sum(rs) // len(rs), sum(gs) // len(gs), sum(bs) // len(bs)),
            _sd(gs), _sd(rg), _sd(by))


def _med(v):
    v = sorted(v)
    return v[len(v) // 2]


def region(raw, w, fx, fy):
    """(mean rgb, luma spread, red-green spread, blue-yellow spread).

    Five patches in a plus, reported as the median, so one feature clipping
    one patch cannot carry the number."""
    n = max(20, w // 22)
    d = n
    out = []
    for ox, oy in ((0, 0), (-d, 0), (d, 0), (0, -d), (0, d)):
        x0 = clamp(int(fx * w) + ox, 0, w - n - 1)
        y0 = clamp(int(fy * w) + oy, 0, w - n - 1)
        out.append(_patch(raw, w, x0, y0, n))
    mean = tuple(_med([o[0][k] for o in out]) for k in range(3))
    return mean, _med([o[1] for o in out]), _med([o[2] for o in out]), _med([o[3] for o in out])


def band(name, value, lo, hi, why):
    if value < lo:
        block.append(f"{name} {value:.1f}, under {lo:.1f}. {why[0]}")
    elif value > hi:
        block.append(f"{name} {value:.1f}, over {hi:.1f}. {why[1]}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    mine_p = Path(sys.argv[1])
    ref_p = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    mine, w, src = load(mine_p)
    note = "" if src[0] == src[1] else f"  (centre square of {src[0]}x{src[1]})"
    print(f"  {mine_p.name}  {w}x{w}{note}")
    a = acut(mine, w)
    print(f"  acut   {a:5.2f}   fine detail overall")

    rows = {k: region(mine, w, *v) for k, v in REGIONS.items()}
    for k, (mean, lum, rg, by) in rows.items():
        print(f"  {k:12s} #{mean[0]:02x}{mean[1]:02x}{mean[2]:02x}  "
              f"mottle {lum:5.1f}  chroma {rg:5.1f} rg / {by:5.1f} by")

    if ref_p:
        ref, _, _ = load(ref_p, w)
        print(f"\n  against {ref_p.name}")
        ra = acut(ref, w)
        print(f"  acut   {a:5.2f} vs {ra:5.2f}")
        if ra > 0 and abs(math.log(a / ra)) > .25:
            (block if abs(math.log(a / ra)) > .45 else review).append(
                f"acut {a:.1f} against the reference's {ra:.1f}. "
                + ("Too soft: the marks underneath are too fine to survive the blur. "
                   "Bolden the drawing, do not reduce the blur. See reference/surface.md."
                   if a < ra else
                   "Too crisp: nothing has been softened as one surface. "
                   "Add the finish passes. See reference/surface.md."))
        ce = me = 0.0
        for k, v in REGIONS.items():
            rm, rl, rrg, rby = region(ref, w, *v)
            mm, ml, mrg, mby = rows[k]
            d = sum(abs(rm[i] - mm[i]) for i in range(3)) / 3
            ce += d; me += abs(rl - ml)
            print(f"  {k:12s} colour off {d:4.0f}   mottle {ml:5.1f} vs {rl:5.1f}"
                  f"   chroma {mrg:5.1f}/{mby:5.1f} vs {rrg:5.1f}/{rby:5.1f}")
            # A note, not a gate. EVERY build of the owl over-mottled its dark,
            # including the one the user preferred, so blocking on it stops
            # the gate discriminating. Read it, then look.
            if rl > 2 and ml > rl * 3.5:
                block.append(f"{k} varies {ml:.1f} against the reference's {rl:.1f}. "
                             "Flecked into soup.")
            elif rl > 2 and ml > rl * 2.0:
                review.append(f"{k} varies {ml:.1f} against the reference's {rl:.1f}. "
                              "Look before you flatten it: read the number off five "
                              "patches, not one, and check what the patches are sitting on.")
        ce /= len(REGIONS); me /= len(REGIONS)
        print(f"\n  mean colour error {ce:.0f} of 255,  mean mottle error {me:.1f}")
        if ce > 22:
            block.append(f"mean colour error {ce:.0f}. Sample the reference and match the fills.")
        elif ce > 14:
            review.append(f"mean colour error {ce:.0f}.")
    else:
        band("acut", a, *BANDS["acut"],
             why=("Mush. Bolden the drawing before touching the blur.",
                  "Nothing is softened as one surface. Add the finish passes."))
        _, _, drg, dby = rows["dark mass"]
        band("dark rg", drg, *BANDS["dark rg"],
             why=("The dark has no red-green grain. Neutral noise does not count.",
                  "The dark is flecked into soup."))
        band("dark by", dby, *BANDS["dark by"],
             why=("No blue-yellow grain in the dark.",
                  "Blue-yellow grain is over the red-green. They are not equal."))
        _, _, frg, fby = rows["pale field"]
        band("field rg", frg, *BANDS["field rg"],
             why=("The field is flat. Its swing comes from dot STRUCTURE, not grain: "
                  "smaller, stronger dots with paper surviving between them.",
                  "The field is shouting. Fewer or weaker dots."))
        band("field by", fby, *BANDS["field by"],
             why=("Dots are overlapping, so no paper survives to swing against.",
                  "The field is shouting."))

    print()
    for b in block:
        print("BLOCK   " + b)
    for r in review:
        print("REVIEW  " + r)
    if not block and not review:
        print("clean")
    return 1 if block else 0


if __name__ == "__main__":
    sys.exit(main())
