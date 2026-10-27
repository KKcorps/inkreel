#!/usr/bin/env python3
"""  python3 sketchcheck.py A.png B.png C.png --src page.html [--refs DIR] [--world a,b] [--allow NAME] [--marker TEXT]
                                                                  exits 1 while any BLOCK stands

Is each story sketch drawn at the finished look, and is it a new world? Run it on the stills and on the source
that drew them, before anyone sees them. lesson-film's sketchcheck.py runs this with its own settings.

  --refs DIR     a folder of approved frames (jpg or png) to compare against. A tall image is two stills stacked
  --world a,b    function names from an approved piece's world that a new piece must not call or define
  --allow NAME   lets one --world name through, when the piece really is about that thing and its card says why
  --marker TEXT  a string a template's stub carries, which must be gone before anyone sees the sketches

  BLOCK  a still that is not 16:9
  BLOCK  a still with more than 15% of its area in flat colour. Codex drew its first three sketches for a lesson
         as flat rectangles in PIL with Arial, and they measured 71 to 75% flat. Every approved sketch is under 1%
  BLOCK  a still that is a near copy of a --refs frame. A sketch that reused an approved frame scored 0.99. A
         re-staged copy scores lower and is caught by --world or not at all, so the judging still applies
  BLOCK  source that calls or defines a --world name
  BLOCK  source that still holds the --marker
  REVIEW source that draws words in a system font (fillText, a canvas font, PIL's ImageFont). Words are written by
         hand, and only a real code term on a plate may be mono, as `validDocIds` was on the approved depot sketch
  REVIEW source with no print finish (finishPrint, finish(), or the press)
  REVIEW fewer than three stills, where the sketch step asks for three stories

A pass says the sketch is not a wireframe or a copy. It does not say the craft is good."""
import re, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

FLAT_MAX, COPY_STRUCT, COPY_COLOUR = .15, .9, 10

args, stills, srcs, refdirs, world, allow, markers, k = sys.argv[1:], [], [], [], [], set(), [], 0
while k < len(args):
    a = args[k]
    if a in ("--src", "--refs", "--world", "--allow", "--marker") and k + 1 < len(args):
        v = args[k + 1]; k += 2
        if a == "--src": srcs.append(Path(v))
        elif a == "--refs": refdirs.append(Path(v))
        elif a == "--world": world += [n for n in v.split(",") if n]
        elif a == "--allow": allow.add(v)
        else: markers.append(v)
    else: stills.append(Path(a)); k += 1
if not stills and not srcs: sys.exit(__doc__)

def flat_share(im):
    """the share of 8 px cells, at 480x270, whose grey values barely vary: flat fills with no ink, dots or grain"""
    a = np.asarray(im.convert("L").resize((480, 270), Image.LANCZOS), dtype=np.float32)
    cells = a[:264, :480].reshape(33, 8, 60, 8).std(axis=(1, 3))
    return float((cells < 1.5).mean())

def signature(im):
    im = im.convert("RGB").resize((96, 54), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
    g = np.asarray(im, dtype=np.float32).mean(axis=2)
    return (g - g.mean()) / (g.std() + 1e-6), np.asarray(im.resize((8, 6), Image.BOX), dtype=np.float32)

refs = {}
for d in refdirs:
    for p in sorted([*d.glob("*.jpg"), *d.glob("*.png")]):
        im = Image.open(p)
        halves = [im.crop((0, 0, im.width, im.height // 2)), im.crop((0, im.height // 2, im.width, im.height))] \
            if im.height > im.width else [im]
        for i, h in enumerate(halves): refs[f"{d.name}/{p.stem}" + (f"-{i + 1}" if len(halves) > 1 else "")] = signature(h)

block, review = [], []
if stills and not refs: print("  no --refs, so the copy check is skipped")
for p in stills:
    im = Image.open(p)
    if abs(im.width / im.height - 16 / 9) > .02: block.append(f"{p.name}: {im.width}x{im.height} is not 16:9")
    fs = flat_share(im)
    g, col = signature(im)
    near = max(((float((g * rg).mean()), float(np.abs(col - rc).mean()), name) for name, (rg, rc) in refs.items()),
               default=(0, 999, "none"))
    print(f"  {p.name}: {fs:.1%} flat" + (f", nearest approved frame {near[2]} at {near[0]:.2f}" if refs else ""))
    if fs > FLAT_MAX:
        block.append(f"{p.name}: {fs:.0%} of it is flat colour. Draw it at the finished look, with ink that takes unevenly, "
                     "dots, broken edges, light and the print finish, not as a wireframe")
    if near[0] > COPY_STRUCT and near[1] < COPY_COLOUR:
        block.append(f"{p.name}: a near copy of {near[2]} ({near[0]:.2f}). A new topic gets a new world")
if 0 < len(stills) < 3: review.append(f"{len(stills)} still(s). The sketch step is three different stories")

strip = lambda s: re.sub(r"/\*.*?\*/", "", re.sub(r"(?<![:'\"])//[^\n]*", "", s), flags=re.S)
finish = False
for p in srcs:
    raw = p.read_text()
    for m in markers:
        if m in raw: block.append(f"{p.name}: still holds the template's {m}. Draw every story's own world")
    s = strip(raw) if p.suffix != ".py" else re.sub(r"#[^\n]*", "", raw)
    for name in world:
        if name in allow: continue
        n = len(re.findall(rf"(?<![\w.]){re.escape(name)}\s*\(", s))
        if n: block.append(f"{p.name}: {name}() {n} time(s). That is an approved piece's world, and it is off limits "
                           "for a new one. --allow it only if the card says why")
    fonts = re.findall(r"\bfillText\s*\(|\bstrokeText\s*\(|\.font\s*=|\bImageFont\b", s)
    if fonts: review.append(f"{p.name}: words in a system font ({', '.join(sorted(set(fonts)))}). Write them by hand, "
                            "unless it is a real code term on a plate")
    finish |= bool(re.search(r"\bfinish(Print)?\s*\(|\bpress\b", s))
if srcs and not finish: review.append("no print finish in the source. The approved sketches all went through one")

for b in block: print("BLOCK   " + b)
for r in review: print("REVIEW  " + r)
if not block and not review: print("clean")
sys.exit(1 if block else 0)
