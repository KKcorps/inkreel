# How a scene file works

- One file per scene or pair of scenes in `film/scenes/NN-id.js`, loaded in name order after `core.js`.
- `kit.js` holds only the craft: ink, dots, edges, hatching, light, shadow, handwriting and the print finish. Your
  world's objects are drawn from those in your own files, the way `scenes/10-example.js` builds its block. Never call
  or copy the approved example's `parcel()`, `house()`, `kid()`, `telescope()` or the rest of its town.
- A scene sets `SCENE_DRAW.<id> = (f, u, sc) => { ... }`. `f` is the film frame, `u = f - sc.start`, and `sc` has `start` and `end`.
  It draws the whole frame into `c` (1920x1080 design units) from `f` alone. No state carried between frames.
- Never declare a top-level `top`, `name`, `status`, `length`, `parent` or `self`. Those are the browser's own window
  properties, and `const top` stopped a whole thumbnail page with a syntax error and a blank title.
- Every top-level name in a scene file starts with the scene's own prefix (`road`, `desk`, `snail`...), because every file shares one global scope.
  Do not edit `kit.js`, `core.js` or another scene's file. Copy a kit function into your file under your prefix if you need a variant.
- Never time anything from a fixed frame number. Every start, stop and move comes from `word(...)`, `AT`, `sc.start` or `sc.end`.
  The road letters of the approved lesson first ran on frames 120 to 440. When the voice moved 12 s later for a new opening, they had all arrived
  before the road scene was on screen, and nothing but the viewer noticed. `assets/shiftcheck.py` renders the film with the voice moved 2 s later
  and fails any scene that looks different. The build runs it.
- Timing comes from the voice: `word(lineId, 'word').s` is the frame a word is heard. Land a picture event on it or one frame before.
  Lines and words are in `<piece>.cues.json`. Scene windows: open `<piece>.html?scenes=1` and read the title.
- The world's state is the THIS PIECE block in `core.js` (`WORLD`, `AT`, and any small functions such as `isOn(row, f)`).
  Show exactly that state, and change it only at the frames `AT` names. The example's block is in `examples/parcel42-lesson/film/core.js`.
- Still backgrounds go in `layer('<prefix>-name', () => draw(), k)`, drawn once and placed through a camera with `showLayer(L, [cx, cy, s])`.
  Use `k` at least the largest zoom the layer is seen at. Keep the camera inside the layer: `cx` between `W/2/s` and `W - W/2/s`, same for `cy`.
  Live parts are drawn every frame inside `inCam(cam, () => ...)`.
- Camera moves use `camMove(f, a, b, fromCam, toCam)` and `drift(cam, f)`. Cut only on a word. No frame may flash.
- A scene arrives by a hard cut unless its entry in the scene list has a `move` (`reference/film.md`, "Moves between
  scenes"). Your scene draws the same either way, since `core.js` runs the move around it. Draw it from `f` alone,
  because during a dive the scene before yours is drawn past its own end.
- Text is in-world and handwritten with `hand()` or `handPart(text, k, ...)`, at least 28 design px tall at the zoom it is seen, 40 or more for anything the viewer must read.
- Check your scene with `?scene=<id>&u=0.5&draft=1` (textures on, print finish off) at several `u`, look at the PNGs, redraw what reads as a diagram.
  `python3 assemble.py` rebuilds `<piece>.html` after any edit.
