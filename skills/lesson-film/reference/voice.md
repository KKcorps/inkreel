# The voice

Read this when you make or fix the voice. The voice is the film's clock: every
scene start, every picture event and every music gap comes from its word
times.

## Which voice

- **Drafts: Kokoro-82M**, local, Apache 2.0 weights, word start and end times
  from its own pipeline. `af_heart` is the voice of the approved lesson. It
  takes about 2.5 s to speak a line on this machine.
- **Anything published: the person's own voice**, recorded, or cloned with
  ElevenLabs on a paid plan (commercial use allowed, character timestamps).
  Ask before publishing a synthetic voice. Say it is AI-voiced in the
  description if it is.
- **Never for a published film:** macOS `say` (Apple's licence is personal,
  non-commercial), F5-TTS and XTTS-v2 weights (non-commercial). OpenAI's TTS
  needs an AI-voice disclosure and gives no timestamps.

## How it is laid on the clock

`voice.py <piece>` reads `<piece>.lines.json`:

```json
{ "voice": "af_heart", "speed": 1.0, "bpm": 100, "lead_beats": 1, "breath": 0.3, "tail": 12.0,
  "lines": [ { "id": "hook", "text": "...", "speed": 1.0, "hold": 0.6 } ] }
```

Each line is spoken on its own, its leading silence trimmed so the first word
starts on time, and it starts on the next half beat after the previous line
ends plus the breath and the line's hold. The end chord lands on the first beat
after the last word. It writes `<piece>.voice.wav` (48 kHz) and
`<piece>.cues.json` with every word's start and end.

## Hearing it

`heard.py <piece> --write` transcribes the voice with Whisper small.en and
reports three things:

- **Every word heard, or not.** It joins spoken numbers the way Whisper writes
  them ("fourteen oh eight" is "1408"), knows a few spellings of names ("pino"
  is "Pinot"), and maps each line's `"say"` respelling back to its real word.
  A word still missing is worth a listen and a `saytest.py` run (below).
- **How far the sound lags the cue times.** Kokoro's word times run about 50
  ms ahead of the sound. `--write` stores the measured lag as `heard_lag` in
  the cues, and the page adds it to every word, so the picture lands on the
  sound, not ahead of it. Viewers notice sound that comes early sooner than
  sound that comes late (ITU-R BT.1359 puts the limits near 45 ms early and
  125 ms late).
- **Whisper's own word times are loose.** It placed the first word 630 ms off.
  Trust the onset lag, which is measured from the audio after pauses, not the
  per-word offsets.

## Pronunciation

**Kokoro says "upsert" so that it sounds like "absurd".** Whisper heard
"Pinot calls this an absurd" in every phrasing tried, which in a lesson about
upserts is the worst word it could hear. Phoneme markup did not change it.
Respelling it "upsurt" did. So when `heard.py` reports a word missing, do not
assume Whisper is wrong. Run `saytest.py "a sentence with {w}" word respelling1
respelling2`, pick a spelling that is heard right, and put the whole line with
that spelling in the line's `"say"`, keeping the real word in `"text"` for the
captions and the script check. "Postmarked" also blurred into "postmark"
before a number, and "postmarked at sixteen thirty" fixed it in the text
itself. The script check and the captions read `"text"`, the voice reads
`"say"`, and `heard.py` knows the two apart.

Write numbers and times as words in the lines. Check names by ear the first
time: Kokoro says "Pinot" as "pee-no", which is right for Apache Pinot. If a
word comes out wrong, respell it in the line (the captions come from the
line's text, so keep the display spelling in the chain and the respelling in
the line, and fix the caption in `captions.py` if needed).
