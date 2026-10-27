# Time

Read this before you cut the paragraph into acts, and again before you score.
It owns the clock. `sound.md` owns the instruments.

## Contents

- One clock
- The grid in frames
- Two levels, acts and shots
- The act sheet
- Pace with extremes
- What sits where
- Captions as data
- Two layers, one grid
- When the page is not on the grid
- How this was learned

## One clock

When the score comes from `score.py`, the piece has one grid of beats. Every
cut is on it. Every event inside an act is on it. The score names the same
beats. A piece cut to an outside song follows the song's phrases instead, and
a silent piece has no grid at all. The gallery has all three.

A viewer cannot tell which came first, the picture or the music, because
neither did. Both were written from the act sheet.

## The grid in frames

The template's beat is 16 frames. A sixteenth is then 4 frames, an eighth is
8, a bar is 64. The page declares the grid and its export frame rate once and
everything derives from them. At 18 fps a 16 frame beat is 67.5 BPM. At 24 fps
it is 90. The one-row piece at 24 fps read as rushed and Kartik asked for
0.75x, which is exactly 18 fps with every frame and every beat unchanged. So
the template starts at 18. Most films in `gallery.md` run at 24. Pick the pace
per piece.

```js
const BEAT = 16, BAR = 4 * BEAT;
const FPS = 18;
const beats = n => n * BEAT;
plate('collide', beats(4), ...)
```

`score.py` and `build.sh` read `FPS` and `BEAT` from the page, so pace is one
number and the score's grid is the page's grid whatever BPM that comes out as.
`lookcheck.py` judges cuts a second and seconds a look at the reference pace
of 24 fps, so a slower piece is not marked down for being slower.

Other grids that are whole frames. `check.py` and `score.py` read `BEAT` from
the page, so any of these works:

| frames a beat | BPM at 18 fps | BPM at 24 fps | sixteenth |
|---|---|---|---|
| 12 | 90 | 120 | 3 frames |
| 16 | 67.5 | 90 | 4 frames |
| 20 | 54 | 72 | 5 frames |

`check.py` blocks an act that is not whole beats and a loop that is not whole
bars. `score.py` reads `BEAT` and the `plate()` list from the page, so the
tempo and the act list have one source.

## Two levels, acts and shots

An act is whole beats and carries a story beat and a palette. A shot is whole
sixteenths inside an act and carries one picture. `check.py` holds the acts to
the beat, and the page throws on load if an act's shots do not add up to it.

A shot of one sixteenth is 4 frames at 18 fps, 0.22 seconds. That is the
floor, and only the peak of a montage goes there. The reference prompt ran its
montage from half a second a shot down to a quarter. A montage written as data
can run from four sixteenths down to one:

```js
const MONTAGE = [
  ['lighthouse', 4, 'dive'], ['phone', 4], ['card', 2], ['turntable', 2], ['drone', 2], ['ferris', 2],
  ['breath', 3], ['turbine', 3, 'iris'],
  ['radar', 1], ['kettle', 1], ['fireworks', 1], ['bike', 1], ['dish', 1], /* ... */
];
```

Order the shots so dark and light grounds take turns. Two dark scenes back to
back at one sixteenth each read as one smeared frame.

## The act sheet

Write it after the shape is picked (`story.md`) and the paragraph is written
if there is one, and before any code. Name the shape and the text choice at
the top. One row per act.

Shape: a journey and return. Captions handwritten, one per shot.

| act | beats | picture | inks | caption | what the state does, and on which sixteenth | sound | energy |
|---|---|---|---|---|---|---|---|
| stream | 4 | slips on a dark river, ours stamped | federal blue, teal, sunflower | a row is written once / but it never stops moving | ours drifts right every frame, close shot on beat 2 | rising run on eighths | moving |
| consume | 4 | a tower at dusk, then the stack inside | purple, orange, sunflower | it lands in the segment that is still open / so a query sees it at once | flies to the door beats 0 to 2, a slip lands every sixteenth after | two plucks, a tick per landing | moving |
| store | 4 | night, aqua shelves, ours slides in | black, aqua, sunflower | there it waits / one crate among many | slides into its slot over beat 2 | knock on arrival | still |

For a piece with shots, add a shots column: each shot's scene, its length in
sixteenths and its move from `moves.md`. Then write three lines under the
sheet, because they span every row.

- **The palette arc.** How colour changes across the piece. The flipbook
  goes from one blue on paper, to every picture in its own inks, to blue and
  pink together at the end. `press.md` owns it.
- **The camera's scale arc.** Where the camera goes across the whole piece,
  near to far and back. `moves.md` owns it.
- **The pace curve.** Where it is still, where it is fastest, where it
  breathes. The next section owns it.

The upserts piece's sheet had the same columns with the grid as the picture
and the house inks in every row, which is exactly why it looked like one long
tile. The sheet is the storyboard and the score at once. `plate()`, `inks()`
and `stepWorld` read the picture, inks and state columns. The moments section
of `score.py` reads the last two, with `beat_in(act, b)`. Report the sheet
before writing either, and check it against `lookcheck.py`'s targets: a new
picture and ink set every few seconds, no two neighbouring rows alike.

## Pace with extremes

A piece paced evenly is flat however fast or slow it is. The reference prompt
opened on a second and a half of near-empty paper, sped its montage from half
a second a shot to a quarter, went back to blank paper three times inside it,
and held one beat of stillness before its turn. So the pace curve needs both
ends.

- **Stillness.** Two beats of paper and a dot to open. Two beats of the lone
  dot before the turn, with the kit stopped.
- **A flurry.** The montage's last bar at one sixteenth a shot.
- **Breaths.** Inside a run of cuts, three sixteenths of bare paper and one
  ripple, then the next scene opens out of the anchor.

This matters more than the frame rate. Kartik's note that 24 fps read as
rushed came from a piece whose acts were all two to four beats long. The
flipbook runs at 24 fps, cuts twice a second at its peak and holds bare paper
for whole seconds either side, and it does not read as rushed. Fast shots are
fine. An even pace is what read as rushed.

## What sits where

- **Cuts on beats.** Acts of 2 or 4 beats keep every cut on a kick. Put the
  turns on bar lines: the silence, the climax, the close.
- **Discrete events on eighths.** A key coming back, a tombstone, a word
  stamping in. `fa % 8 === 0`.
- **Runs and bursts on sixteenths.** Rows landing, a scan's arpeggio,
  compaction landing one batch per sixteenth. `fa % 4 === 0`.
- **Captions in eighths of the act.** `seg(u, 0, .4375)` then `seg(u, .5, .875)`
  for a two beat act. A caption that ends on a landing makes the landing.
  "So we write it down" finishes on beat four as the disc settles.
- **Silence from a bar line, return on a bar line.** The crash act starts a
  bar. The kick returns on the first frame of the act after it.
- **The ending starts a bar, resolves, and holds.** One framing,
  `{ travel: 1 }`. By default the score plays an outro through the first bar
  and the final hit on the second bar's downbeat. Whatever the picture lands, lands there.
  See `story.md`.
- **A pulse you see at the rate of a beat you hear.** The ghost bit pulses once
  a beat, `cos(u * TAU * 4)` over four beats, and the score's two tones beat
  at the same 1.5 Hz.
- **Two shots an act, the second cut on beat two.** An act's `cam(W, u)`
  returns the establishing framing for `u < .5` and a closer one after. Pass
  `{ travel: .75 }` to the plate so the travel to the next act starts after the
  second shot has held, and a cut never also carries a jump. Add
  `{ cutsAt: [.5] }` so seamcheck knows the second framing is a cut, not a pop. Use it when the
  card says brisk. A calm piece can hold one framing for a whole act.

## Captions as data

When shots are shorter than a beat, a caption cannot write on with each one.
So captions are a list on the beat grid, one sentence an act, drawn by the
engine over whatever shots are under them.

```js
const CAPTIONS = [
  { text: 'and everything that happens answers', from: 8.25, to: 10.5, off: 16, x: 70, y: 850, fit: 860, rot: -.03 },
];
```

A line starts writing at `from`, is written by `to` and holds until `off`, all
in beats from the start. A sentence may run over a cut, which is how "a server
asks the stream" ends one act and "for anything new" lands in the next. The
line holds still while the shots cut under it.

## Two layers, one grid

The **music layer** is kit, chords and bass. One tempo for the whole loop, a
whole number of bars so it seams, chords on bar lines, never restarted. It
thins where the picture is still, the snare drops and the hats come down, and
it stops only at the silence.

The **picture layer** is accents, hits and the swell. A bright tick on the
first frame of every act, a hit shaped like each event, a tremolo whose level
is the frame's motion. Nothing in it is a kick or a chord, so nothing in it
can break the beat, even a hit that sits between eighths.

## When the page is not on the grid

Score a page you cannot rebuild from its motion, not from its act starts. An
act spends its first beat writing its caption and moves later, often for less
than half its length. `score.py` reads `motion.txt` and finds, per act, the
span where the mechanism moves and the isolated spikes where something
discrete happens. `run_over(act)` lays a run across the span, `knocks(act)`
returns the spikes, `span(act)` gives the ends. Where the picture is flat at
120 pixels, rows landing as single dots, it falls back to the offsets you
give it. This is the fallback. Rebuilding the page on the grid is the fix.

## How this was learned

One afternoon, four builds, against a reference clip that felt delightful.
The first score buried the picture's hits 30 to 40 dB under a fixed kit. The
second made the picture the clock, restarted the kit in every act, passed
every sync number, and Kartik heard broken beats. The third put the music on
one tempo and the hits on frames, and was better, and the runs still started
before the rows landed because the acts were cut at 26, 34 and 44 frames and
no tempo could land on them. The fourth rebuilt the page on the grid, and the
score stopped chasing the picture because there was nothing to chase. The
reference had done this all along. Its kit held one tempo in 91 percent of
windows and its cuts sat on it, because its animators cut to the beat.

The lesson under the lesson: when the sound feels wrong, the picture's timing
is a variable too. Three builds fixed the sound alone.
