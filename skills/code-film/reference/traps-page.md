# Traps: the page

Read this before you build the page, and again after any note on a render.
Every item is a way this has actually broken on a real build. Work it as a
checklist.

## Contents

- The page silently does nothing
- Drawing traps
- Legibility traps
- Speed traps

## The page silently does nothing

- [ ] **Is `</script>` there?** A missing closing tag can leave the whole script
      unexecuted, and the page just sits there. Cost an hour once. `check.py`
      catches it.
- [ ] **Is the error handler first in the file?**
      `addEventListener('error', e => { document.title = 'ERR ' + e.message + ' @line ' + e.lineno; });`
      Then `--dump-dom | grep title` tells you the error instead of you guessing.
      Without it a runtime throw and a blank canvas look identical.
- [ ] **Did you `node --check` the extracted script?** The browser will not tell
      you about a syntax error, it just will not run.
- [ ] **Name collisions with engine globals.** A world grid called `GRID` will
      quietly overwrite the contact sheet flag, and you will render 336 tiles.
      The world grid is `SIDE`.

## Drawing traps

- [ ] **A two point line cannot taper.** One segment, sitting at `s = 0`, so any
      `tin` multiplies its width by zero and the whole stroke prints as a 0.7px
      hairline. This made one act look weak for four rounds before it was found.
      `ribbon` now subdivides, but do not reintroduce it elsewhere.
- [ ] **Cutting one plate on a dark ground leaves the other two.** Use `hole`.
      See `press.md`.
- [ ] **A path is nothing until it is filled.** `hole(1, g => slipPath(g))`
      with no `g.fill()` cuts nothing. The subject looked fine on paper, where
      its outline carried it, and vanished on every dark ground. It happened
      again on every-row-twice: `S.dark.mark(.95, body)` drew the phone with
      no body. Check every scene alone with `?scene=id`.
- [ ] **Dot area, not dot radius.** `r = c * .70 * sqrt(d)`. See `press.md`.
- [ ] **Does the grid fit the sheet?** `n * spacing + y0` must land inside 1000
      units with room for anything at the bottom. Two grids ran off the bottom
      and into their own captions. The coarse screen hid it until the screen got
      finer.
- [ ] **A hard edged wedge or shaft looks like a diagram.** Render it into a
      temp canvas and draw it back blurred. Clipping after a filter snaps the
      hard edge straight back, so it needs its own canvas. That is what `soft`
      is for.
- [ ] **Overlapping strokes double their density** if you draw them straight
      onto the plate. `mark` goes through a scratch canvas so a stroke that
      crosses itself stays one even weight. Keep it that way.

- [ ] **A writing tool that traces every loop strobes.** At 19 letters a
      second the pen's tip went top right to bottom left and back inside a
      frame, and seamcheck called it a one frame flash. Slide the tool along
      the line at the right edge of the fresh ink instead.
- [ ] **A small thing landing needs a flash.** Records one dot wide barely
      changed the pixels, so the loudest moments looked still. A few frames of
      a hot flash when something lands fixes it, and it is truer anyway.
- [ ] **Measure every handwritten string before you place columns.**
      "delivered" ran into "16:30" and a note sat under the next row. Width
      at the chosen x-height, plus the slant, decides the columns.

- [ ] **`g.fill()` after a loop that drew nothing re-fills the drum's last path.**
      A bird came back as a ghost wing. Begin a path before every fill, and
      skip the fill when there is nothing in it.
- [ ] **`glow()` prints its square on a pale ground.** The soft disc sits in a
      square that shows as a faint box on light paper. Clip it, or use it on
      dark grounds.
- [ ] **A second framing that is not declared is a pop.** Five scenes cut to a
      closer shot at u = .5 and seamcheck blocked all five. `{ cutsAt: [.5] }`.

## Legibility traps

- [ ] **Text under about 28 design units dies under the halftone.** At a fine
      screen the strokes are thinner than the dots. Captions at 24 were mush and
      nobody could see why.
- [ ] **Text sized by eye overflows.** Always pass `fit:` with the width the
      phrase should occupy, never `size:`. The layout derives the size from the
      measured string.
- [ ] **A halo that follows the stroke is not enough.** It clears a band either
      side of the ink and nothing else, so the field pokes through the gaps
      between letters and inside the counters of o, e and a. Use `knockout`,
      which lifts one soft pool of paper behind the whole phrase.
- [ ] **Check the contact sheet AND three acts at full size.** 250px tiles hide
      collisions, overflow and mush. Every legibility bug on this build was
      invisible in the grid.

## Speed traps

- [ ] **One `mark` or `cut` costs a whole sheet.** Batch everything that
      repeats. See `press.md`.
- [ ] **Measure before you optimise.** `?bench=20` reports the split across
      draw, grain and screen. On the first build the halftone was 92 percent of
      the frame and the scene drawing was 2 percent. Guessing would have
      optimised the wrong thing.
- [ ] **Do not buy frame rate by shrinking the canvas.** That was the wrong fix
      and the user noticed. Fix the cost.
- [ ] **The halftone is a per pixel lattice walk, not a path of dots.** Walk the
      pixels, carry the lattice coordinate incrementally so the rotation costs
      two adds, and only do the expensive work when a pixel crosses into a new
      cell. That is `W/c` times a row instead of `W`. It was a 26 times speedup
      and it made cost scale with the sheet rather than with how fine the screen
      is. Do not replace it with a path builder.
- [ ] **The grain pass never needs to touch RGB.** Only alpha is ever read back.
      It can also skip fully transparent pixels outright.
