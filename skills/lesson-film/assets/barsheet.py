#!/usr/bin/env python3
"""Rebuild reference/stills/sketch-bar.jpg from every frame in reference/stills/bar/, three to a row.
  python3 barsheet.py      run it after a frame is added or removed, then show the person the film is for the new sheet to sign off"""
from pathlib import Path
from PIL import Image
stills = Path(__file__).resolve().parent.parent / "reference/stills"
frames = sorted((stills / "bar").glob("*.jpg"))
g, w, h, per = 16, 640, 360, 3
rows = (len(frames) + per - 1) // per
sheet = Image.new("RGB", (per * w + (per + 1) * g, rows * h + (rows + 1) * g), "#F2FBFF")
for i, p in enumerate(frames):
    r, k = divmod(i, per)
    n = min(per, len(frames) - r * per)
    x0 = (sheet.width - (n * w + (n - 1) * g)) // 2
    sheet.paste(Image.open(p).convert("RGB").resize((w, h), Image.LANCZOS), (x0 + k * (w + g), g + r * (h + g)))
sheet.save(stills / "sketch-bar.jpg", quality=84)
print(f"sketch-bar.jpg: {len(frames)} frames, {', '.join(p.stem for p in frames)}")
