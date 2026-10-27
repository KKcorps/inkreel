# How the press works

Read this before you draw anything.

## Contents

- Two models, and the screen decides which
- Three drums, not colours
- The inks, and re-inking per act
- The palette has a story
- The anchor's own press
- A visible screen, for one glow
- Ink adds, ink is left off
- Light on dark is a hole
- Grounds
- The dot area law
- The cost model

## Two models, and the screen decides which

There are two ways to get ink onto a shape and they fail in opposite
directions. Pick on the screen pitch, before you draw anything.

**Separations, halftoned at the end.** Every mark writes density to a
drum; the whole sheet is screened in one pass at the very end. This is
what a press physically does, it is what `engine.html` does, and it is
right **while the screen is fine**, around 1.7px, where you read the
texture but not the lattice.

It breaks the moment the screen gets coarse enough to see. A solid only
closes up when density reaches exactly 1, so at a 21px screen a flat
colour prints as a checkerboard of diamonds and every shape edge steps
along the lattice. One build of the owl lost its whole face this way.

**Flat fill, then a finish clipped inside it.** Fill the shape with a
`Path2D`, then clip a dot screen into it as texture. A solid stays solid,
a tint shows its rosette, and the edge stays a curve. This is the only
model that can put a solid face and a dotted background in one frame,
which is what the riso references actually do.

So: fine screen, separations are fine. Visible rosette, you must fill
flat and clip the finish. The architecture is borrowed, with thanks, from
the `hand-drawn-canvas-animation` skill by alesha-pro (MIT,
github.com/alesha-pro/tools).

Everything below describes the separations model. `surface.md` owns the
flat-fill model and everything that happens to the finished composite.

## Three drums, not colours

A riso print is not painted. It is printed as three separations, and each one
holds nothing but ink **density**. Every drawing call in the piece writes
density to one drum. Colour only happens at the very end, when each drum is
halftoned on its own screen angle, nudged a few pixels out of register and
multiplied down onto paper.

The drums are named by their job. `S.dark` draws, `S.bright` fills, `S.light`
washes. The classic names `S.blue`, `S.pink`, `S.yellow` still work and mean
the same three drums in their house inks.

Overlaps make real ink colours on their own. Blue over pink makes a deep
indigo. You never pick that colour, it falls out. Density lives in the
**alpha channel** of each drum's canvas, which is what makes the next two
sections possible.

## The inks, and re-inking per act

A studio owns a shelf of drums and picks three for a job. `INKS` in
`engine.html` is that shelf, eighteen real riso colours from black and federal
blue through teal, kelly green, sunflower, orange, bright red, fluorescent
pink, purple and brown.

```js
inks('federal blue', 'kelly green', 'sunflower');   // this act's three drums
```

Call it first thing in an act. Every act starts from the house inks, so an act
that does not call it prints blue, pink and yellow. A piece that never re-inks
prints every scene in the same three colours, and that is the tell of a
computed piece. The references measured four to seven hue families across a
clip. Ours measured three.

Two rules keep it a print rather than a palette swap. Three inks per act, never
more, because the press has three drums. And one ink carried through the whole
piece as its motif colour, so the acts read as one job. The demo worlds carry
`sunflower`.

## The palette has a story

Re-inking every act gives variety. It can also carry the plot. The flipbook
in `gallery.md` opens on one blue on bare paper, gives every picture its own inks
in the montage, and ends in blue and pink together when the second dot
arrives. The town keeps one night blue for the town and gives each loved thing
its own warm ground.

These moves are all reprints, with no change to a scene's code.

- **Many.** Every scene in its own three inks, while the world is full.
- **House inks.** A crowd of small pictures reprinted in one job's three inks,
  because forty pictures on one sheet is one print run.
- **One.** Every picture drained to one ink from its own darkness, for a loss.
  It is the one crossfade that works.
- **Two.** Only the two voices' inks, once two things have met. Blue over pink
  gives a violet third tone for free.

The scene code never changes for any of it. `INKMAP` maps a scene's three inks
to new ones while it draws, `bake(id)` keeps a small copy of each scene's
densities and a fourth drained to one ink. Write the arc as a line under the
act sheet (`time.md`) before you pick any act's inks.

## The anchor's own press

The anchor prints on two drums of its own, picked once per piece in
`ANCHOR_INKS` and never re-inked after that. Indigo over fluorescent pink is
where every piece so far started. The second drum sits 2.6 units out of
register. So the anchor keeps its colour through every scene and always shows
a thin fringe on one side, the way a two colour print does. The handwriting
prints on the anchor's first drum too, so the captions are the anchor's voice.
The second drum alone is the second voice.

These two are also the motif inks. The one-ink-carried-through rule above is
met by the anchor, so every act's three drums are free to change.

A frame that shows two scenes at once, a disc opening over another, prints the
second scene on a second press. `moves.md` owns that.

## A visible screen, for one glow

The fine screen is the default and stays. One exception earns its place: a
soft glow with no hard edge, printed on a screen you can see. The pink glow
that announces the second voice sets `S.bright.coarse = 3.4` for that frame,
so the gradient prints as a field of pink dots getting smaller toward the
edge. The engine resets it every frame.

Never do this under a solid or an edge. A coarse screen breaks solids into a
checkerboard, as the two models section above explains. A glow has no solid
to break.

## Ink adds, ink is left off

Two moves carry the whole thing.

- `S.dark.mark(d, fn)` lays ink down at density `d`.
- `S.dark.cut(d, fn)` takes ink off. `d` of 1 is a clean hole, 0.5 thins it by
  half.

Because density is alpha, `mark` is the `lighter` composite and `cut` is
`destination-out`. Both are one line. `disc`, `ring`, `shape`, `band`,
`strokes`, `glow`, `vgrad` and `flood` are all one of the two underneath.

## Light on dark is a hole

Ink multiplies. A light ink drawn over a dark flood prints black. So a bright
line on a dark ground is a **hole first**, all three drums cut, and the tint on
top. `hole(d, fn)` cuts the three drums. `lit(drum, d, fn)` does the hole and
the tint in one call.

```js
lit('bright', .9, g => { g.lineWidth = 2.4; gearPath(g, cx, cy, r, 14, angle); g.stroke(); });
```

This is the single most common way a dark act comes back empty. The
blueprint act of the demo was invisible until every aqua line went through
`lit`. Stars, rain, foam, a moon's path on the water, all holes.

## Grounds

The sheet before the subject goes on. Alternate light and dark across the
running order, and re-ink so two dark grounds are not the same dark.

| ground | what it is |
|---|---|
| `paper` | bare sheet |
| `flat(drum, k)` | one ink, one flood |
| `wash(drum, a, b)` | one ink, top to bottom gradient |
| `warm` | yellow flood under a pink gradient |
| `deep` | all three drums, a near black indigo in the house inks |
| `night` | the dark drum at .94 under a bright gradient. with black ink, a real night |

Or draw your own from `vgrad`, `band` and `flood`. The lake act is a warm sky
gradient, a green bank, a blue water band. The references never reuse a ground
across a cut, and neither should you. The contact sheet is where you check it.

## The dot area law

A halftone dot's **area** carries the density, so the radius goes with the
square root. `r = c * .70 * sqrt(d)`. Get this wrong and midtones either
vanish or block up. It is in `Sep.screen` and you should not need to touch it.

The 0.70 is a fudge that makes solids close at a fine screen, and it is
wrong by a lot once the screen is visible: at a 21px cell it prints 42
percent ink as 72 percent coverage, and a pale field comes out a solid
slab. The honest law is `r = c * .564 * sqrt(d)`, from area, with a push
toward `.72c` as d approaches 1 so solids still close over the cell
corners. At a coarse screen you are in the flat-fill model anyway, where
this law only sizes the texture and never has to make a solid.

Under a fine screen, text under about 28 design units dies, because its strokes
are thinner than the dots. See `traps-page.md`.

## The cost model

One `mark` or `cut` costs a whole sheet, because each goes through a scratch
canvas the size of the page. Anything that repeats gets batched into one call:
every star in one `mark`, every reed in one `strokes`. The halftone itself is a
per pixel lattice walk and costs the same however fine the screen is. Measure
with `?bench=20` before you optimise anything.
