# The sketches

Read this before step 4. It owns what a story sketch is, how to draw one, and
how it is judged. The Story section of `traps.md` holds the ways it went wrong.

## Contents

- What a sketch is
- Draw them
- Judge them
- The sheet
- Sent back
- Keep the sheet growing

## What a sketch is

A sketch is one frame of the finished film, drawn with the film's own kit and
print finish before anything else is built. It is never a wireframe. The
person picks a world from the three, so a flat sketch hides the one thing they
are choosing on. The three are three different stories, each a different thing
that happens, and at least one is a world the viewer could live in.

The bar in words: depth from overlapping planes, with a near thing, a middle
and a far back. A subject that something happens to. Light on what is live.
Surfaces where the ink takes unevenly, dots that turn a form, edges that break.
Lettering by hand, in the world.

## Draw them

Copy `assets/template/` into the piece's folder now, not at step 8. Write each
story as one function in `sketches/sketch.js`, drawing that world's own
objects from `film/kit.js`. `film/scenes/10-example.js` builds one object the
full way, in the order that makes it read as a thing in a place. Then render
and check:

```bash
python3 sketch.py
python3 <this skill>/assets/sketchcheck.py sketches/A.png sketches/B.png sketches/C.png --src sketches/sketch.js
```

`sketch.py` renders every story in `STORIES` at 1920x1080 through the print
finish. `sketchcheck.py` fails a still that is mostly flat colour, a near copy
of an approved frame, a source that calls the example's town, and the
template's stub left in place. Fix every BLOCK and look at the PNGs before you
judge.

## Judge them

Open `stills/sketch-bar.jpg` only after your three exist and pass the check.
Never open it, or the example's sketches, while you are still finding the
ideas. A picture seen first becomes your idea.

Answer these for each sketch, in the step 4 report:

1. **What happens, with the words covered?** Say it in one sentence. If you
   can't, the labels are doing the teaching and the picture is a diagram.
   Send it back.
2. **Is it built to the same craft as the sheet?** Look for depth, a subject,
   light on what is live, ink that takes unevenly, and hand lettering.
3. **Does it look like none of them?** The sheet sets the bar, not the look. A
   depot, a switchboard, a town, lanterns or a lighthouse in a lesson that is
   not about those is borrowed. Every frame on the sheet is at dusk or night,
   and that is not a rule either.

You can send a sketch back, but you can't approve taste. Show the person all
three, each with its story's line, and let them pick or mix.

## The sheet

`stills/sketch-bar.jpg` is five frames from five worlds, each at the bar:

- **depot aisle, switchboard, town.** The approved lesson's three story
  sketches. The town was picked.
- **lanterns, lighthouse.** Two of the three story sketches for a 10 s lesson
  on deletes. Its third reused the town and is left off.

The frames are in `stills/bar/`. `sketchcheck.py` compares every new sketch to
them and to the example's `sketches/`.

## Sent back

`stills/sent-back.jpg`. The top row is Codex's first three for the deletes
lesson: flat rectangles with Arial labels, 71 to 75% flat colour. They fail
question 2 and the check. The bottom row is the depot sketch it was then shown,
and the copy it made of it. The copy passes on craft and fails question 3.

## Keep the sheet growing

Add a frame only from work the person you make films for approved, from a
world or a palette the sheet does not have yet. A daylight frame is the most
wanted. Put it in `stills/bar/`, run `assets/barsheet.py`, and show them the
new sheet to sign off before any agent judges against it.
