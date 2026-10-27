# Sound under a voice

Read this when you make the sound. code-film's `reference/sound.md` owns the
instruments and the mix. This file owns what changes when a narrator talks
over the music.

- **The voice wins.** The music drops 16 dB under every spoken word, 60 ms
  ahead of it and 180 ms after, drawn from the word times, so there is no
  pumping and no sidechain to tune. In the example the music sat at about -42
  dBFS under speech and -17 to -20 in the gaps. Background music splits ADHD
  viewers, so keep it out of the way of the words (`teaching.md`).
- **A bed that follows the lines.** One soft low-passed chord per line, so the
  harmony moves as the explanation does. The example walks I vi IV V in D and
  lands on I at the end.
- **Nothing is louder than the voice, and nothing is bright.** Every note and
  every in-world sound peaks at least 10 dB under the voice's peak. The score
  enforces it with a ceiling on the music track (a 5 ms block peak envelope
  with look-ahead, not a per-sample one, which lets peaks through at every zero
  crossing). v2 played a two-note e-piano fill an octave up in 14 of the breaths
  between lines. Each peaked near -5 dBFS, above the voice, and about 20 dB
  brighter in 4 to 12 kHz than the opening bell. Kartik: "there's a beat that
  occurs after every few transitions and it is too painful." Removing the fills
  made mastering raise everything else, so the clinks and clicks became the
  new loudest things. Soften and darken the whole kit, then check the music
  track on its own against the voice.
- **The tune lives in a few gaps, not every gap.** A three-note motif asks at
  the start, hangs low and soft after the question, climbs and stops short of
  home in the guess, rings once per phrase in the recap, and falls home in the
  outro. The other breaths get no notes: the bed rises back up by itself when
  the voice pauses, and that is enough.
- **In-world sounds only for state changes.** Six in the example, each on the
  exact frame its picture changes: the letter landing, the scale settling
  twice, the two switches, the telescope finding the lit window. A sound for
  every motion was rejected in code-film as "beats on every motion".
- **The guess has a clock.** Ticks every half beat, on the same frames the
  picture's clock hand moves. Line them up from the page's own moment
  (`AT.guess0` in the example), not from the voice file.
- **The ending resolves, then fades with the picture.** See
  `pace-and-ending.md` for the shape. The score's fade starts on the same frame
  as the picture's.
- **Master to -14 LUFS, true peak -1.5 dBTP.** Two-pass `loudnorm` in
  `build.sh`. YouTube turns loud uploads down and never turns quiet ones up.
  code-film's `verify.py` still reports RMS dBFS, which is a different number
  (about -17 for a -14 LUFS master here).

`assets/score_template.py` is the example's score with the piece-specific part
marked. Copy it to `<piece>.score.py` and change that block: the chord per
line, the motif, the in-world sounds and the words they sit on.
