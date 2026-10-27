#!/usr/bin/env python3
"""  ~/.cache/lesson-film/venv/bin/python saytest.py "Pinot handles this with {w}." upserts upsurts up-serts

Which spelling does Kokoro say so that Whisper hears the real word? Speaks the sentence once per spelling,
with {w} replaced, transcribes it and says which ones came back as the first spelling given. Kokoro says
"upsert" so that Whisper hears "absurd" in every phrasing tried, and "upsurt" is heard right. Put the
winner in the line's "say", keep the real word in "text"."""
import re, sys, tempfile
import numpy as np, soundfile as sf
from kokoro import KPipeline
from faster_whisper import WhisperModel
sentence, words = sys.argv[1], sys.argv[2:]
voice = "af_heart"
p = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M"); m = WhisperModel("small.en", device="cpu", compute_type="int8")
want = re.sub(r"[^a-z]", "", words[0].lower())
tmp = tempfile.mktemp(suffix=".wav")
for w in words:
    text = sentence.replace("{w}", w)
    a = np.concatenate([r.audio.numpy() for r in p(text, voice=voice, speed=1.0)]); sf.write(tmp, a, 24000)
    heard = " ".join(s.text.strip() for s in m.transcribe(tmp, language="en")[0])
    ok = want in re.sub(r"[^a-z ]", "", heard.lower()).replace(" ", "")
    print(f"  {'ok  ' if ok else 'miss'} {w:14s} heard: {heard}")
