# The soundtrack

Read this when you write the moments in `score.py`. It owns the instruments,
the mix and the checks. `time.md` owns the clock, and the clock comes first.

## Contents

- The rule that keeps it honest
- Write the tune first
- Pick the sound per piece
- Accents sit under the tune
- What it is made of
- Shaping the arc
- Checking it without listening
- What the reference taught
- Muxing

## The rule that keeps it honest

Nothing is a sample. Every value is computed, the same way every pixel is.
`assets/score.py` writes a WAV with nothing but the Python standard library.

It reads the act list and `BEAT` from the page, so the grid has one source.
Everything above "the moments" in the file is the engine and works for any act
list. The moments are the piece's, written from the act sheet's sound column
with `beat_in(act, b)`. Copy the file to `piece.score.py` next to `piece.html`
and rewrite that section. `build.sh` uses the sibling when it exists and the
skill's `score.py` otherwise. Until you rewrite it, act names that do not
exist are skipped and you still get a track that lands on every cut. The
skill's own `score.py` carries the demo worlds' moments.

```bash
python3 assets/score.py piece.html score.wav motion.txt
```

`build.sh` runs it with `motion.txt` made from the frames. Run it once by hand
without motion early, to hear the arc.

## Write the tune first

The upsert ledger film had a sound on every pen stroke, strike and ruler step,
with no melody at all, and Kartik called it "just beats on every motion and not
something like music". The picture was the clock and the score chased it. The
music films in `gallery.md` go the other way: there is a song, and the picture
moves with its phrases.

So compose before you place a single accent.

- **A motif.** Four to eight notes, about two bars, that someone could hum.
  Write it in `TUNE` as scale degrees.
- **Say it, then vary it.** State it, answer it, bring it back changed. A
  shape like A A' B A'' across the piece is enough for 30 seconds.
- **Give it a range and a home.** Stay inside about an octave and a half.
  End phrases on chord tones, and end the last one on the tonic, on the final
  hit.
- **Arrange it.** One voice carries the tune, from `string`, `bell`, `epiano`,
  `marimba` or `keys`. `KIT_LEVEL` takes the kit out where the tune needs
  room, and `COMP` lowers the chords under a busy tune. A section with a new
  voice or a missing kit is how the music follows the story.
- **Read it, because you cannot hear it.** `score.py` prints a tune sheet in
  note names. Check the motif comes back, the range, and the last note.

`ACT_TICKS`, `MOTION_TICKS` and `SWELL` are off by default. Each one adds sound
on the picture's motion, and together they made the beeping.

## Pick the sound per piece

Every piece so far used the same key, the same four chords, the same kit and
the same ending, so they all sounded alike. The top of `score.py` has six
settings. Pick them at the act sheet, from the story, and name them at the top
of the sound column.

- `KEY`, in semitones up from C. -5 to +6 keeps the bass in range.
- `HARMONY`. `lofi` is I vi IV V. `minor` is i VI iv V, darker. `plagal` ends
  IV to I, softer. `dorian` rocks between two chords and floats. `lift` ends
  bVII to I, bright. Or write your own list. The first chord is home and the
  last one leads home, so the last chord picks how the ending feels.
- `SWING`. 0 for straight eighths, 0.16 for the lofi lean.
- `KIT`. `backbeat`, `halftime` for a slow heavy piece, `four` for a driving one.
- `END_RUN`. The outro bar's run goes `down` to settle, `up` to lift, or `None`.
- `END_KIT`. `True` puts kick and open hat on the final hit. `False` lands on
  the chord alone.

None of these is a default to keep. A journey can float in dorian with no
kit on the hit. A failure story can sit in minor at halftime. The instruments
are code too. Change them when a piece wants a sound this file does not make.
The films in `gallery.md` mix brighter than our pieces did, so listen to one
before you settle the mix.

## Accents sit under the tune

Accents mark the story's moments: the turn, the reveal, the thing that lands.
A 30 second piece has four to eight of them, not one per motion. They sit
under the tune and borrow its notes.

The first mix went wrong the other way: 93 percent sub bass, with the plucks
that followed the picture 30 to 40 dB under the kick, and on a laptop the
whole track became a thud. The fix then was to make hits loud, and the next
pieces over-corrected into a beep on every motion. The rules below still hold
for the few accents you keep.

- **Heard, not loudest.** An accent should be clearly heard over the kit. The
  tune is still the loudest thing in the mix.
- **A click on the front of every hit.** Eight milliseconds of noise above
  2 kHz. The ear times a hit by its high frequency edge, and a 60 Hz thud has
  none. The kick has a beater click and the keys a key click for the same
  reason. The ceiling is two poles at 9 kHz so the clicks keep their air.
- **Knocks sit above 160 Hz.** A tom in the kick's band is a second kick on its
  own cadence, and the groove check hears it as a tempo change.
- **Take the note from the bar's chord.** An arbitrary frequency reads as an
  alert.
- **Give each moment a shape.** Things arriving run up the chord. Things
  settling run down. Things moving glide, and `glide()` slides one note into
  another. Collisions knock. In the spectrogram the runs are stepped diagonals
  and the glides are smooth ones, which is how you check them without
  listening.
- **Hits follow the act's energy a little.** `hit_gain` is 0.55 plus 0.45 times
  the act's energy. A busy scene hits harder, a quiet one softer, and a hit in
  a quiet act is still heard.

## What it is made of

- **The tune**, from `TUNE` and `SECTIONS`, on one of the five voices. It is
  the loudest layer and it carries the piece.
- **A pad** on the bar's chord, following the act's energy through a 20 ms
  ramp, so a change lands inside two frames.
- **The chords** the keys comp at `COMP`, and a bass on the root.
- **The kit**, always on, in the pattern `KIT` names. The backbeat puts the
  kick on one and three through every act, quieter where nothing moves. Snare, ghost kick and open hat only where the act's
  energy is over 0.6. Swung hats scaled by energy.
- **The accents**, written by hand in the moments section for the story's
  four to eight turns. Plucks with clicks, knocks, glides and runs.
- **Off unless asked for:** a tick on every act's first frame (`ACT_TICKS`),
  a tick on every motion peak nobody scored (`MOTION_TICKS`), and a tremolo
  whose level is the frame's motion (`SWELL`).
- **Vinyl, as discrete pops**, five to fifteen a second. Denser is hiss.
- **Tape.** Wow and flutter, detune on the keys, soft `tanh` saturation at a
  drive of 1.9, then two poles at about 9 kHz.
- **One idea that is not decoration.** The ghost act plays two tones one beat
  apart in frequency, one beat, so the beat you hear is the pulse you
  see. Find the equivalent for your topic. It is the difference between a
  backing track and a score.

## Shaping the arc

- **The ending resolves.** The last act is the ending by default and should
  be two bars. Its first bar plays the chord that leads home, `PROG[-1]`, with
  the kit forced full and the run `END_RUN` names. The final hit lands on the
  second bar's downbeat on the home chord, struck once and left to ring for
  three seconds, with a long root and the motif note, and with kick and open
  hat if `END_KIT` is on. The pad fades from the hit to the end. Nothing plays
  after the hit. `story.md` has why. `ENDING = None` for a seamless loop.
- **Silence is the loudest move you have, when the shape has a fall.**
  `SILENCE = ("crash", "delete")` names the act where everything stops and the
  act whose first frame brings the kick back. Both are bar lines. One low drop
  falls into the gap and the frame empties at the same moment. A journey or a
  montage has no fall. Leave it `None` rather than invent one.
- Every layer goes through one `playing(t)` test, so the drop is one line
  rather than an envelope on each part.
- Energy per act comes from `motion.txt` and writes the rest of the arc. Read
  the printed `energy` line and override in `ENERGY` only where the story
  disagrees with the pixels.

## Checking it without listening

Measure the muxed file, not the WAV, because sync is a property of the two
together. `build.sh` does this last.

```bash
python3 assets/soundcheck.py out.mp4
```

Eleven numbers, each next to the spread the gallery films measured. None of
them blocks. Read them against the intent card, and let `verify.py` check the
lines the card declared. A high sync number is not the goal. The ledger film
scored 91 percent sync and was beeps. For `sound: music` the card checks a
steady beat, enough notes, and the big moments landing on sound.

- **sync.** Motion peaks with a sound inside two frames. Fly 86%. First build 38%.
- **events.** Cuts and bursts with an accent inside two frames. Fly 86%. First
  build 38%. The detector merges sounds under 80 ms apart, so 94 can mean 100.
- **breath.** Correlation of per-second loudness with per-second motion. Fly
  0.53. First build 0.15.
- **rest.** Still seconds against moving seconds, in dB. Fly -8. First build -0.5.
- **mids.** The 500 to 1000 Hz band against the sub. Fly -12. First build -25.
- **laptop.** What survives above 250 Hz. Fly -8.5. First build -15.3.
- **edge.** 2 to 8 kHz on each hit. Fly -25. First build -47.
- **groove.** Four second windows in which the kit's global period is still a
  strong periodicity. Fly 91%. The build that restarted the pulse per act 45%,
  and that is the one that sounded broken. The grid build 96%.
- **notes** and **density.** Distinct pitches, and events a second. Fly 31 and
  5.0. First build 11 and 2.3.

`breath`, `rest` and `edge` read pixels.
On a two shot piece with a steady kit the seconds that measure as moving are
the seconds with a cut in them, so the two checks end up asking whether cuts
are louder than everything else, which is not a quality anyone wants. The
fly's -8 on `rest` came from whole quiet scenes. The upserts piece Kartik
called perfect sat at -2.5, the one-row journey at -0.3 with a cadence he
asked for under a still picture. Read the numbers, then listen.

Then watch and listen once, whole. The numbers passed on the build with broken
beats and on the build whose runs started before the rows landed. The ear
caught both. `groove` exists because of the first, and nothing measures the
second.

`check.py` still measures the octave rolloff on the WAV, which is the hiss
check. Read the spectrogram too. You should be able to point at the crash, the
runs and the swell without being told where they are.

## What the reference taught

The fly clip that felt delightful and in sync had a composed track first. Its
big visual events sat on its sound events, its loudness rested where the
picture held still, and its kit kept one tempo because the cuts were made to
the beat. We copied the sync and missed the song. Every one of those is a mix and timing decision, not a drawing.
`references.md` has the command to measure a reference the same way, and
`time.md` has the rule the last one turned into.

## Muxing

`build.sh` encodes the video and the audio in one pass. See `export.md`.
