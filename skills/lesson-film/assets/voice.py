#!/usr/bin/env python3
"""Speak a lesson's lines with Kokoro and lay them on the film's clock. The voice is the clock.

  ~/.cache/lesson-film/venv/bin/python voice.py <piece>

Reads <piece>.lines.json:
  { "voice": "af_heart", "speed": 1.0, "bpm": 100, "lead_beats": 1, "breath": 0.3, "tail": 12.0,
    "lines": [ { "id": "hook", "text": "...", "say": "only when it differs", "speed": 1.0, "hold": 0.6 }, ... ] }
Each line starts on the first half beat after the previous line ends plus the breath and that
line's hold. The end chord lands on the first beat after the last word, and the film runs `tail`
seconds past it. Writes <piece>.voice.wav (48 kHz mono) and <piece>.cues.json (every word's start
and end, in seconds). Run heard.py <piece> --write after it."""
import json, math, sys
import numpy as np, soundfile as sf
from kokoro import KPipeline

piece = sys.argv[1] if len(sys.argv) > 1 else "piece"
cfg = json.load(open(f"{piece}.lines.json"))
VOICE, SPEED, BPM = cfg.get("voice", "af_heart"), cfg.get("speed", 1.0), cfg.get("bpm", 100)
BEAT = 60 / BPM
LEAD, BREATH, TAIL = cfg.get("lead_beats", 1) * BEAT, cfg.get("breath", 0.3), cfg.get("tail", 12.0)

p = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
t, out, cues = LEAD, [], []
for ln in cfg["lines"]:
    audio, words, off = [], [], 0.0
    # "say" is what the voice reads when a word needs respelling to be said right ("upsurts" for "upserts").
    # "text" stays the caption and the script. saytest.py finds a respelling Whisper hears correctly
    for r in p(ln.get("say", ln["text"]), voice=VOICE, speed=ln.get("speed", SPEED)):
        for tk in r.tokens:
            if tk.start_ts is None or not any(ch.isalnum() for ch in tk.text): continue
            words.append({"w": tk.text.lower().strip(".,:?!;"), "s": off + tk.start_ts, "e": off + tk.end_ts})
        a = r.audio.numpy(); audio.append(a); off += len(a) / 24000
    a = np.concatenate(audio)
    # trim the model's lead silence so the line's first word sits on the beat
    trim = max(0.0, words[0]["s"] - 0.03)
    a = a[int(trim * 24000):]
    start = math.ceil((t - 1e-6) / (BEAT / 2)) * (BEAT / 2)
    for w in words: w["s"] = round(w["s"] - trim + start, 3); w["e"] = round(w["e"] - trim + start, 3)
    cues.append({"id": ln["id"], "text": ln["text"], "start": round(start, 3), "end": words[-1]["e"], "words": words})
    out.append((start, a))
    t = words[-1]["e"] + BREATH + ln.get("hold", 0)
hit = math.ceil((t - BREATH + 0.05) / BEAT) * BEAT
total = hit + TAIL
buf = np.zeros(int(total * 24000) + 1)
for s, a in out:
    i = int(round(s * 24000)); buf[i:i + len(a)] += a[: len(buf) - i]
buf48 = np.interp(np.arange(len(buf) * 2) / 2, np.arange(len(buf)), buf)
sf.write(f"{piece}.voice.wav", buf48.astype(np.float32), 48000)
json.dump({"bpm": BPM, "beat": BEAT, "hit": round(hit, 3), "total": round(total, 3), "voice": VOICE, "speed": SPEED, "lines": cues},
          open(f"{piece}.cues.json", "w"), indent=1)
for c in cues: print(f'{c["start"]:6.2f}-{c["end"]:6.2f}  {c["id"]:8s} ' + " ".join(f'{w["w"]}@{w["s"]:.2f}' for w in c["words"])[:110])
print(f"hit {hit:.2f}s  total {total:.2f}s")
