#!/usr/bin/env python3
"""  ~/.cache/lesson-film/venv/bin/python heard.py <piece> [--write]

Did the voice say every word, at the time the picture thinks it did? Transcribes the
narration with Whisper (small.en, word timestamps) and lines its words up with the cue
file. Reports words missing or misheard, and how far each heard word sits from its cue."""
import json, re, sys
from faster_whisper import WhisperModel
PIECE = next((a for a in sys.argv[1:] if not a.startswith("-")), "piece")
C = json.load(open(f"{PIECE}.cues.json"))
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(f"{PIECE}.voice.wav", word_timestamps=True, language="en")
SAME = {"pino": "pinot", "peno": "pinot", "pinos": "pinots"}      # Whisper spells some names the way they are said. add yours here
norm = lambda w: SAME.get(re.sub(r"[^a-z0-9]", "", w.lower().replace("forty-two", "42").replace("fortytwo", "42")), re.sub(r"[^a-z0-9]", "", w.lower().replace("forty-two", "42").replace("fortytwo", "42")))
heard = [(norm(w.word), w.start) for s in segs for w in s.words if norm(w.word)]
# spoken numbers come back from Whisper as digits: "fourteen oh eight" is "1408". merge each run of number words
NUM = {"oh": "0", "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8",
       "nine": "9", "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15", "sixteen": "16",
       "seventeen": "17", "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50"}
SAME.update({"postmark": "postmarked"})
# a line spoken from a respelling ("say") is heard as its real spelling. map the real word to the spoken one
try:
    for ln in json.load(open(f"{PIECE}.lines.json"))["lines"]:
        if "say" in ln:
            for a, b in zip(ln["text"].split(), ln["say"].split()):
                if norm(a) != norm(b): SAME[norm(a)] = norm(b)
except FileNotFoundError:
    pass
# the heard words were normalised before these spellings were added, so normalise them again. without this
# line every alias here silently never applied, and "postmarked" was reported missing in every build
heard = [(norm(h), t) for h, t in heard]
want = []
for l in C["lines"]:
    run = None
    for w in l["words"]:
        k = norm(w["w"])
        # "one" and "two" stay words when they are not part of a time
        if k in NUM and k not in ("one", "two") or (run and k in NUM):
            run = (run[0] + NUM[k], run[1]) if run else (NUM[k], w["s"])
            continue
        if run: want.append(run); run = None
        want.append((k, w["s"]))
    if run: want.append(run)
print("  heard:", " ".join(h for h, _ in heard))
j, offs, miss = 0, [], []
for w, t in want:
    k = next((i for i in range(j, min(j + 4, len(heard))) if heard[i][0] == w), None)
    if k is None: miss.append(w); continue
    offs.append((heard[k][1] - t, w)); j = k + 1
print(f"  {len(want) - len(miss)} of {len(want)} words heard" + (f", missing or misheard: {' '.join(miss)}" if miss else ""))
if offs:
    offs_ms = sorted((abs(o) * 1000, w) for o, w in offs)
    late = [f"{w} {o:.0f} ms" for o, w in offs_ms if o > 120]
    print(f"  heard time against cue time: median {offs_ms[len(offs_ms) // 2][0]:.0f} ms, worst {offs_ms[-1][0]:.0f} ms ({offs_ms[-1][1]})")
    if late: print("  over 120 ms: " + ", ".join(late))

# onsets: after every pause of 60 ms or more, where does the sound actually start?
import numpy as np, soundfile as sf
v, sr = sf.read(f"{PIECE}.voice.wav")
hop = int(sr * .005); rms = np.sqrt(np.convolve(v ** 2, np.ones(hop * 2) / (hop * 2), "same"))[::hop]
thr = max(np.percentile(rms, 20) * 4, rms.max() * .04)
ws = [w for l in C["lines"] for w in l["words"]]
lags = []
for i, w in enumerate(ws):
    if i and w["s"] - ws[i - 1]["e"] < .06: continue
    a, b = int((w["s"] - .25) / .005), int((w["s"] + .25) / .005)
    on = next((k for k in range(max(1, a), min(b, len(rms))) if rms[k] > thr and rms[k - 1] <= thr), None)
    if on is not None: lags.append(on * .005 - w["s"])
lag = float(np.median(lags)) if lags else 0.0
print(f"  sound starts {lag * 1000:+.0f} ms after the cue time, median of {len(lags)} words after a pause")
if "--write" in sys.argv:
    C["heard_lag"] = round(lag, 3); json.dump(C, open(f"{PIECE}.cues.json", "w"), indent=1)
    print(f"  wrote heard_lag into {PIECE}.cues.json")
