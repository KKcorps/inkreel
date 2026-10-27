#!/usr/bin/env python3
"""  python3 wordsync.py <piece> <piece>.motion.txt

Does something change on each word the picture is tied to? <piece>.ties.json lists them as
[["lineId", "word"], ...], or [["lineId", "word", n], ...] for the n-th time a word is said in its line
(scriptcheck.py asks for the index when a word appears twice). For each, look for a rise in frame-to-frame motion from 2 frames before
the heard word to 6 after. This only proves that something moves near the word. The timing itself
comes from the page reading the same cue file."""
import json, re, sys, statistics
piece, motion = sys.argv[1], sys.argv[2]
C = json.load(open(f"{piece}.cues.json")); LAG = C.get("heard_lag", 0); FPS = 24
TIED = json.load(open(f"{piece}.ties.json"))
mot = [0.0] + [float(v) for v in re.findall(r"YAVG=([\d.]+)", open(motion).read())]
quiet = statistics.median(sorted(mot)[: len(mot) // 3]) or 1e-3
miss = 0
for tie in TIED:
    lid, w, n = tie[0], tie[1], (tie[2] if len(tie) > 2 else 0)
    line = next(l for l in C["lines"] if l["id"] == lid)
    s = [x for x in line["words"] if x["w"] == w][n]["s"]
    f = round((s + LAG) * FPS)
    peak = max(mot[i] for i in range(max(0, f - 2), min(len(mot), f + 7)))
    ok = peak > 3 * quiet; miss += not ok
    print(f"  {'ok  ' if ok else 'MISS'} {lid}:{w:12s} frame {f:5d}  peak {peak / quiet:6.0f}x quiet")
print(f"  {len(TIED) - miss} of {len(TIED)} tied words have motion on them")
sys.exit(1 if miss else 0)
