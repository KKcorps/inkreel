#!/usr/bin/env python3
"""  python3 captions.py <piece> > <piece>.srt

An exact SRT from the voice's word times. A cue breaks at punctuation once it holds 16
characters, and at any word past 38. A cue ends a quarter second after its last word, or
just before the next cue starts, whichever comes first."""
import json, sys
PIECE = sys.argv[1] if len(sys.argv) > 1 else "piece"
C = json.load(open(f"{PIECE}.cues.json"))
ts = lambda t: f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}"
cues = []
for l in C["lines"]:
    cur, start = [], None
    pairs = list(zip(l["text"].split(), l["words"]))
    for j, (tok, w) in enumerate(pairs):
        start = w["s"] if start is None else start
        cur.append(tok.replace("forty-two", "42"))
        n, left = len(" ".join(cur)), len(pairs) - j - 1
        # never leave one word alone on the next cue
        if ((tok[-1] in ",.?:" and n >= 16) or n > 38) and left != 1 or w is l["words"][-1]:
            cues.append([start, w["e"] + .25, " ".join(cur)]); cur, start = [], None
for a, b in zip(cues, cues[1:]):
    a[1] = min(a[1], b[0] - .04)
for i, (s, e, t) in enumerate(cues, 1):
    print(f"{i}\n{ts(s)} --> {ts(e)}\n{t}\n")
