# The film page

Read this when you plan scenes, split them across helpers, or build the page.
It describes `assets/template/`, which the approved example is built on.

## Contents

- How the page is put together
- The world state
- Scenes
- Layers and the camera
- Moves between scenes
- Splitting the work
- Speed

## How the page is put together

Open `../examples/parcel42-lesson/contact.jpg` first. It is the approved
lesson whole, every 36th frame, and it shows what a scene system buys you: one
town, one desk and one switchboard, returned to from different distances, so
thirteen scenes read as one place rather than thirteen pictures.

`assemble.py` writes `<piece>.html` from, in order: `film/kit.js` (the drawing
kit), `film/core.js` (with the cues pasted in), every `film/scenes/*.js` in
name order, and `film/main.js` (the modes). It meets code-film's page contract,
so its gate and seam checks run on it. Modes:

- `?capture=1` for the build, `?f=N` for one frame, `?play=1` to watch,
  `?scenes=1` puts the scene windows in the title.
- `?scene=<id>&u=0.5` renders the frame half way through a scene.
- `&draft=1` keeps every texture and skips the print finish, which is most of
  a frame's cost. `&flat=1` drops all texture for layout checks.

The kit is optional. The template's `kit.js` holds only the craft: ink that
takes unevenly, halftone dots, a misregistered second plate, broken outlines,
hatching, light, shadow, handwriting and the full-page print finish. It has no
world in it, for the reason in the Story section of `traps.md`.
`scenes/10-example.js` builds one stand-in block the full way. The example's own `kit.js` adds the town (Parcel 42,
houses, a kid, a telescope, a switch board, a book). Read one of those to see
how a whole object is layered, then draw your own world's objects. A new
lesson may use another look, drawn with code-film's press or anything else, as
long as `c` is the canvas every scene draws into.

## The world state

Put the facts the film shows into one block in `core.js`, built from
`facts.md`: the rows, their times, where each lives, and the moments each
change happens, as frames from words. In the example that is `K42`, `AT`,
`liveRow(f)`, `isOn(row, f)` and `rowExists(row, f)`. Every scene reads it, so
a house that goes dark on the switch board is dark through the window, in the
town and in the recap. This is code-film's "one persistent state" rule, for a
lesson.

## Scenes

A scene is `SCENE_DRAW.<id> = (f, u, sc) => {}` in its own file, drawing the
whole frame from `f` alone. The scene list in `core.js` starts each scene two
frames before a word, usually its first line's start. Inside a scene, events
land on `word(line, w).s`, the heard frame of a word, or one frame before it.
`film/SCENES.md` is the contract for anyone writing a scene: prefixes, no edits
to shared files, layers, camera bounds, text sizes, how to check.

A scene of about 3 to 13 seconds held the eye in the example when its camera
moved on the words. Longer than that, split it or give it a slow move.

## Layers and the camera

`layer(key, draw, k)` draws a still background once into its own canvas at `k`
times the resolution and caches it. `showLayer(L, [cx, cy, s])` places it
through a camera: `(cx, cy)` at the frame's centre, zoom `s`. Live parts are
drawn every frame inside `inCam(cam, fn)`. `camMove`, `drift` and `handPart`
(writing by hand, part way) are in `core.js`.

- Draw a layer at `k` at least as big as the largest zoom it is seen at, or
  the push-in goes soft.
- Keep the camera inside its layer: `W/2/s <= cx <= W - W/2/s`, the same for
  `cy`. The first push-in in the example ran off the town's right edge and
  showed a dark band.
- A layer's key names its state (`town-before`, `payoff-night`). Two states
  are two layers.

## Moves between scenes

A scene arrives by a hard cut on a word, or by a move set on its entry in the
scene list: `SCENES.find(s => s.id === 'desk').move = { kind: 'dive', x, y }`.
`core.js` runs it around the scene, which draws the same either way.

- **dive.** A disc opens on `(x, y)` inside the last picture, holds three
  frames, then grows until the new place fills the frame, in 20 frames. Put the
  disc on the thing the next place grows out of, like a window, a lens or a
  letter. It is how one place leads into the next.
- **iris.** The new place opens out of `(x, y)` over bare ground in 12 frames.
  Use it where the last picture has already gone, like the first scene or
  after a pause on bare ground. After a live scene it starts with a hard cut
  to the ground, so use a dive there.

Never crossfade two whole scenes. code-film's `reference/moves.md` owns the
other moves (ripple, coin, slide, pull back, drain), which live in its
`engine.html` and have to be ported by hand, the way these two were.

## Splitting the work

Scenes are independent once the world state and the kit exist, so helpers can
draw them in parallel. What worked: one helper per place, not per scene. One
drew the five post office scenes and wrote a shared, parameterised room they
all call, and one drew the four outdoor scenes. Each got `SCENES.md`, the
facts, the scene windows, what each scene must show on which words, and the
instruction to check its own frames in draft. The main author wrote the
opening, the recap, the ending, the score and the build, and read every
contact sheet. Each helper took about 15 minutes.

## Speed

A full-finish frame took 0.5 to 0.65 s once its layers were built. The first
frame of a scene costs 1 to 10 s while its layers build (a 3x layer is the
slow one). code-film's `capture-par.sh` runs one headless Chrome per core on
contiguous runs of frames, so each builds only the layers its scenes use: 1541
frames took 135 s with 10 Chromes, and 2405 frames about 3.5 minutes with 12.
PNG frames at 1080p are about 3.7 MB each, so a 100 s film needs about 9 GB free
until it is encoded. Delete old frame folders.
