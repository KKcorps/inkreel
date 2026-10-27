# The handwriting

Read this when you add handwriting. It is in `engine.html` already.

## Why it is strokes and not a font

A system font cannot be written on over time, and it does not tilt
convincingly. So the captions are drawn. Each glyph in `PEN` is a set of pen
strokes through control points. The points get a seeded wobble, then
Catmull-Rom smoothing, then the same tapered ribbon everything else uses.

Coordinates are x-height 0 to 100, baseline 100, ascender -70, descender 150.
Lowercase, digits and basic punctuation are covered. There is no uppercase, on
purpose.

## Using it

```js
hand(S, 'and it is back in seconds', {
  x: 95, y: 185,      // x, and the TOP of the x-height band
  fit: 560,           // the width the phrase should occupy. never pass size:
  rot: -.06,          // radians
  ink: 'yellow',      // which plate the visible stroke goes on
  d: .95,
  p: seg(u, .12, .45) // writing on. 0 is nothing, 1 is finished
});
```

`fit` is the important one. Sizing by eye overflows the sheet every time.

## Writing on

`written(paths, p)` accumulates arc length across all the strokes and truncates
at `p`. So the words appear letter by letter as the pen moves. The knockout pool
is built from the same truncated paths, so the paper clears with the writing
rather than appearing ahead of it.

Stagger the `p` ranges of two phrases in one act so the second starts after the
first finishes. That is what makes it read as someone writing rather than two
labels fading in.

## The knockout

`knockout(paths, wide, blur, d)` lifts one soft pool of bare paper out of all
three plates. It is rendered once into a temp canvas and stamped three times,
so it costs one pass rather than three.

It has to be a pool and not a per stroke outline, or the field shows through the
gaps between letters and inside the counters of o, e and a. See `traps-page.md`.

## Ink choice

With an anchor, write in the anchor's own ink: `ink: A.ink`. The line
then keeps one colour through every re-inked scene, and it reads as the
anchor's voice. `fringe: true` adds the anchor's second drum under it, out of register,
which is right for a closing line and too loud for every caption. Captions as
data on the beat grid are in `time.md`.

Without an anchor:

On a `deep` ground use yellow or pink. On `paper`, `wash` or `warm` use blue.
The knockout does the work either way, but blue on a light ground and warm ink
on a dark one is what reads.

## Scrawled rings

`ringPaths(cx, cy, r, seed, turns)` draws a wobbly ring at a bit more than one
turn, so it looks drawn rather than plotted. Use it to point at one thing. Give
it the same knockout treatment as text.
