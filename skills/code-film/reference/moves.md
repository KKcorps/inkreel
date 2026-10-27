# The moves

Read this before you cut shots or write any transition. It owns the anchor,
the shots inside an act, and every move between two pictures. `time.md` owns
when they happen. `press.md` owns the inks they print in.

## Contents

- Why the moves come first
- The anchor
- Shots inside an act
- The toolkit
- One easing per kind of move
- A disc over a scene needs a second press
- The camera's scale arc
- Callbacks are reprints
- How this was learned

## Why the moves come first

The prompt behind a reference Kartik counts as high quality had one budget
rule: if you run short, cut scenes, never the transitions or the late acts. Twenty
pictures joined by hard cuts read as a slideshow. The same twenty joined by
moves that all grow out of one point read as one piece. So when time runs out,
drop a scene before you drop a move, and never drop the ending.

## The anchor

One small thing pinned to one spot on the sheet. In Kevin Ngo's flipbook
(`gallery.md`) it is a small indigo dot on the exact centre. In the town it is a
character: Claude's star sits inside every picture of the montage. The
engine's dot is 2.2 percent of the frame.

This is the flipbook's grammar, and the other five films do not use it. It
only works when the pictures mean something together, the way every picture in
the flipbook is a circle that makes a sound. every-row-twice used it on twenty
pictures that meant nothing and was rejected. Use it on purpose, not by
default.

- **Every scene is drawn around it.** The dot lands on something that matters:
  the dial's hub, the lamp, the flower's heart, the whale's eye. A scene where
  it lands on nothing is not finished.
- **Every move is a circle on it.** Ripples leave it, discs open on it, dives
  go through it, the rewind looks at it through a lens.
- **It never moves while pinned.** `{ pin: true }` on a plate gives the act a
  camera with no drift and no travel, and the engine prints the dot last.

It works because every hard cut lines up on the same point, so the eye never
has to find its place again. That is what lets twenty unrelated pictures read
as one piece. It is also cheap. A dot costs nothing to put in a scene, and a
boat does not.

The anchor prints on its own two drums, out of register, picked once per
piece in `ANCHOR_INKS`. Every piece so far used indigo over fluorescent pink.
Pick a pair that suits the story, with a first ink dark enough to read on
paper, because `seamcheck.py` finds the dot by its darkness. Once picked, it
never changes colour when a scene re-inks. `anchorDot` checks the ink under it
and gives it a pool of bare paper on a dark scene. The second drum alone is
the second voice, if the story has one. In the engine these drums are `A.ink`
and `A.fringe`, and `anchorDot(x, y, r, { second: true })` prints the second
voice.

Pick the anchor at the act sheet. For a system it is the thing the claim is
about: the server, the query, the record. In a journey, pin the camera to the
travelling subject so it holds the same spot on the sheet.

## Shots inside an act

An act carries a story beat and a palette. A shot carries one picture. An act
holds a list of `[scene, sixteenths, move]`, and the engine cuts between them
on the grid.

```js
const MONTAGE = [['lighthouse', 4, 'dive'], ['phone', 4], ['card', 2], /* ... */ ['radar', 1], ['kettle', 1]];
plate('montage', beats(8), PIN, (S, u, W, cam, sh) => shotFrame(MONTAGE, sh.i, sh.fa, null),
      { pin: true, shots: MONTAGE, answers: true });
```

The shots must add up to the act, or the page throws on load and the gate
fails. `?grid=1` shows one tile per shot. `answers: true` puts every scene
the act shows into the state's memory, which the archive and the rewind draw
from.

Scenes are a library, not acts. `scene(id, inks, draw, { pair })` draws in
0..1000 units around (500, 500). `?scene=phone&t=6` prints one alone,
`&pair=1` adds the pink dot at its second spot, `?scenes=1` prints them all.
Helpers can draw scenes at once in separate files when the scenes stand
alone. Three helpers once drew nineteen scenes in about seven minutes. But a
scene is only a function in the page. It can read the state, draw inside
another scene, or carry a thing across a cut into the next shot. Scenes that
touch like that are drawn together, by one hand.

A scene you only see for four frames must be the boldest picture in the
piece: a huge silhouette, strong value contrast, almost a poster.

## The toolkit

| move | what it does | easing | length | where |
|---|---|---|---|---|
| ripple | a ring leaves the anchor and grows past the corner, thinning. open, with tapered ends and tick arcs at the rim | easeOutCubic | 12 frames | `ripple()`, born in `stepWorld` |
| grow | a tiny world in a disc on bare paper, riding a ripple | easeOutBack | 6 frames | `'grow'` |
| coin | the disc flips in, its edge showing on one side | easeOutCubic on its width | 7 frames | `'coin'` |
| slide | the disc slides in from the right, turning a little | easeOutCubic | 8 frames | `'slide'` |
| dive | a small disc opens inside the last picture, holds, then fills the frame | easeOutBack, then `ease` | 4 + 2 + 9 frames | `'dive'` |
| iris | the scene opens out of the anchor over bare paper | `ease` | 9 frames | `'iris'` |
| breath | bare paper and one ripple, between two runs of cuts | none | 3 sixteenths | `'breath'` |
| cut | a hard cut on a sixteenth | none | 1 frame | no move |
| lens | two pale rings round the anchor, tighter each shot of a rewind | none | per shot | `lens(r)` |
| pull back | the picture shrinks into a medallion as the rest pop onto orbits | `ease`, easeOutBack staggered | 11 frames | `medallions()` |
| drain | every medallion reprinted in one ink from its own darkness | easeInOutCubic | 1 beat | `medallions(list, k)` |
| scatter | the medallions fly out and shrink to nothing | easeInQuad | 1 beat | not in the engine, write it |
| bloom | petals unfold one after another, then turn slowly | easeOutBack | 1 beat | not in the engine, write it |

Never crossfade two full scenes. The drain is the one crossfade, and it is
between two printings of the same picture.

## One easing per kind of move

- Arrivals slow down: `easeOutCubic`.
- Exits speed up: `easeInQuad`.
- A thing that pops in overshoots a little and settles: `easeOutBack`. This
  is most of what reads as alive.
- A move between two holds eases both ends: `ease`, which is the quad.

At 18 fps a move is only a few frames long, and a steep curve spends most of
its travel in the middle two. A six frame dive on easeInOutCubic grew the disc
from 236 to 644 units between two frames, and seamcheck flagged it. Give any
move that crosses the frame eight frames or more, and prefer the quad. Every
move's length is in `MOVE_FRAMES`, which seamcheck reads.

The engine used to have one `ease` for everything, so every move in the first
five pieces had the same shape.

## A disc over a scene needs a second press

A frame has one set of three inks. A disc of one scene opening over another
would print the lower scene in the upper scene's inks, and its corners would
change colour on the cut. So the engine has two presses. `over()` prints the
lower scene on press 0 with a hole where the disc is, and the upper scene on
press 1 in its own inks. A press nothing touched costs nothing, so a frame
with one scene pays for one press.

## The camera's scale arc

Plan where the camera goes across the whole piece, not act by act. The
flipbook starts on bare rings, dives into full pictures, pulls back to a ring
of medallions and pulls out to a sky of dots. The rooms glide from room to
room, then pull back to all 25 at once. The fly goes from a whole orange down
to single cells and back.

The pull back does two jobs at once. It turns everything the viewer has seen
into one picture, so it is a callback and a climax together.
`bake(id)` renders a scene once, small, so forty medallions cost three marks.

## Callbacks are reprints

Earlier scenes come back reprinted, not redrawn. `INKMAP` maps a scene's inks
to new ones while it draws: swapped for the rewind, the house three for the
archive, blue and pink for the pair. The scene's code never changes. The
palette arc these serve is in `press.md`.

## How this was learned

On 23 September Kartik shared the prompt behind the record montage, one of the
three reference clips from 17 September. The skill had measured that clip and
learned how often its picture changed. The prompt showed how it got away with
changing that often: one pinned anchor, many shots under a few acts, a named
set of moves each with its own easing, the palette as a story, a camera with a
scale arc, and an inspection of every join. every-row-twice was built to test
all six. It passed every gate and Kartik still called it bad, because it
redrew the flipbook instead of learning from it. `gallery.md` owns that lesson.

What broke while building it is in `traps-motion.md`.
