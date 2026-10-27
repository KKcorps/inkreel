#!/usr/bin/env python3
"""  python3 shiftcheck.py <piece>.html [samples_per_scene=3] [scene_id]

Is every event timed from the voice? Renders sampled frames of the page twice, once as it is and once
with the whole voice moved two seconds later (?shift=2), with the camera's drift held still, and compares
frame f with frame f + 48. A scene that times anything from a fixed frame number looks different in the
two. The road letters of the approved lesson ran on frames 120 to 440, and when the voice moved 12 s
later for a new opening they had all arrived before the scene was on screen. The first scene may time
its opening from frame 0, so it only informs. Exits 1 if any later scene differs."""
import json, os, re, subprocess, sys, tempfile
import numpy as np
from PIL import Image
page = os.path.abspath(sys.argv[1]); n = int(sys.argv[2]) if len(sys.argv) > 2 else 3; only = sys.argv[3] if len(sys.argv) > 3 else None
# $CHROME if set, else the usual macOS and Linux locations
CHROME = os.environ.get("CHROME") or next((p for p in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(p)), "google-chrome")
def title(q):
    out = subprocess.run([CHROME, "--headless=new", "--disable-gpu", f"--window-size={os.environ.get('FRAME_W', '1920')},{os.environ.get('FRAME_H', '1080')}", "--dump-dom", f"file://{page}?{q}"], capture_output=True, text=True).stdout
    m = re.search(r"<title>([^<]*)", out); return m.group(1) if m else ""
def shot(q, path):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={os.environ.get('FRAME_W', '1920')},{os.environ.get('FRAME_H', '1080')}", f"--screenshot={path}", f"file://{page}?{q}"], capture_output=True)
    return np.asarray(Image.open(path).convert("L").resize((480, 270)), dtype=np.float32)
t = title("scenes=1")
if not t.startswith("scenes "): print("the page did not list its scenes:", t); sys.exit(2)
scenes = json.loads(t[len("scenes "):])
SH = 48; tmp = tempfile.mkdtemp(); bad = 0
for i, (sid, a, b) in enumerate(scenes):
    if only and sid != only: continue
    diffs = []
    for k in range(1, n + 1):
        f = a + (b - a) * k // (n + 1)
        x = shot(f"f={f}&draft=1&nodrift=1", f"{tmp}/a.png"); y = shot(f"f={f + SH}&draft=1&nodrift=1&shift=2", f"{tmp}/b.png")
        diffs.append(float(np.abs(x - y).mean()))
    worst = max(diffs); off = worst > 2.0
    if off and i > 0: bad += 1
    tag = "ok  " if not off else ("info" if i == 0 else "MISS")
    print(f"  {tag} {sid:10s} frames {a:5d}-{b:5d}  worst difference {worst:5.1f} of 255" + ("   something here is timed from a fixed frame" if off and i > 0 else ""))
checked = [s for i, s in enumerate(scenes) if i > 0 and (not only or s[0] == only)]
print(f"  {len(checked) - bad} of {len(checked)} checked scenes after the first are timed from the voice")
sys.exit(1 if bad else 0)
