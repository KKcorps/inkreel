---
name: code-film
description: Makes short films where every frame and every sound is computed by code in one HTML page, with no images, footage or samples. Covers any kind (explainers of technical systems, music videos, story films, ads, visual poems) in any hand-made look (riso, paper collage, ink, watercolour, pixel, blueprint, sand). Starts from a written intent card, judges against a gallery of 29 code-drawn films people loved, and verifies the finished MP4 against that intent. Ships a frame engine with a riso press and moves, a computed score, a one-command build to MP4, and checks for defects, joins, look and sound. Also pulls apart a reference clip, still or HTML page. Use when the user wants an animated explainer video, a code-drawn film, music video or still, a riso or print look, or to match or learn from a reference film. Not for a narrated lesson for YouTube, which belongs to lesson-film, or an animated diagram inside a page or doc.
---

# Code-drawn films

This skill makes one HTML page that draws frame `f` from `(f, seed)`, a
soundtrack computed the same way, and an MP4. What the film is about, how it
looks and how it moves is yours to decide. The skill holds three things: the
intent you write down first, the taste you judge by, and the checks that say
whether the finished film did what the intent said.

## Setup

Run `bash assets/doctor.sh` once on a new machine. It checks for Chrome (or a
`CHROME` path), Node 22 or later, ffmpeg, and Python 3 with numpy and Pillow,
and says how to fix anything missing.

## 1. Write the intent

Copy `assets/intent.md` next to the page as `piece.intent.md`. Fill in the
takeaway and the feeling first: what a newcomer can say after one watch, and
what they feel when it ends. Leave the rest until a sketch is picked, because a
card written first fixes the idea, and the sketches can then only change its
look. That is how the ledger film's three sketches became one idea in three
skins.

Once a sketch is picked, finish the card. Its Judged lines say what we follow, the point
only this subject could give, the look and why, whether and how text appears,
the gallery films it learns from, and how the end answers the start. Its
Measured lines give the length, pace, sound and beat. Every later choice
serves this card. When the work shows the card was wrong, change the card and
say so.

## 2. Judge by the gallery

`reference/gallery.md` holds 29 films where Claude drew every frame in code,
across music, explainers, stories and experiments, and what the loved ones
share:

- There is a thing to follow through every scene.
- Every picture says something. None is there only for variety.
- It ends where it began, changed.
- Something shows where we are: a gauge, a counter, a clock.
- The look is a real material, used with its flaws, chosen for this story.
- Sound and picture are one piece.
- Text is rare, big and part of the world.
- It has a point of view and some warmth.
- It is as short as the idea.

These are judgements, not rules. Break one when the card says why.
`reference/taste.md` holds the corrections Kartik, the skill's author, made
while it was built: a starting taste, not yours. Where they and the gallery disagree, say so
and ask the person the film is for.

## 3. Verify the outcome

Report all three layers in the delivery note.

- **Defects block the build.** The page parses, runs and draws the same frame
  every time. No frame flashes or pops off a cut. The mix sits between -28 and
  -8 dBFS and does not clip. `check.py`, `seamcheck.py`, `verify.py` and
  `build.sh` enforce these.
- **The intent is measured.** `python3 assets/verify.py piece.mp4` checks the
  card's Measured lines. A miss means the film or the card is wrong. Fix one
  and say which.
- **The watch test is yours.** every-row-twice passed every number and was still
  bad. Answer the five questions `verify.py` prints: retell it as a newcomer,
  name every tile, watch with the sound off, watch it next to its gallery film,
  judge the last frame.

`lookcheck.py` and `soundcheck.py` never block. They describe pace, colour,
sync and beat, and you read them against the card.

## Workflow

Each step has a report line, so it cannot be ticked without saying how.

0. **If they shared a reference, pull it apart first.** A clip, a still or an
   HTML page all count. Read `reference/references.md`. Report which form it
   is, what it does, which gaps are closeable, and what you take and leave.
1. **Write the takeaway and the feeling.** Only those two lines. Report them.
2. **Watch the two or three nearest gallery films whole.** Report what you take
   from each, and what you will not copy.
3. **Sketch three different stories as stills.** Each one is a different thing
   that happens, told in one line, not the same idea in three looks. At least
   one should be a world the viewer could live in, not a diagram. Draw each
   one at the finished look with the engine and the print finish, never as a
   wireframe. A sketch skips the defect checks, not the craft.
   `assets/sketchcheck.py` fails a flat one, and a copy when you give it the
   approved frames with `--refs`. Show the person it is for and let them pick
   or mix. Report each story's line. Then finish the card.
4. **Write the words, if there are any.** One paragraph in one voice, before
   any code, saved as `piece.chain.txt`. Read "Words that read like a voice"
   in `reference/story.md`. Report the paragraph and its connective ratio.
5. **Plan it.** The beats in order, what each picture means in one line, what
   shows where we are, and the ending. Report the plan. It is a plan, not a
   contract.
6. **Build the page.** Start from `assets/engine.html`, or write your own page
   to the contract below. Check each scene alone before joining them. Report
   what you redrew after looking.
7. **Make the sound.** Write the tune first, in `TUNE` and `SECTIONS`, then
   the four to eight accents for the story's turns. Or bring your own
   `piece.score.py`, a `piece.wav` the page makes, or silence. Report the tune
   sheet `score.py` prints, and why the sound fits the card.
8. **Build.** `assets/build.sh piece.html out.mp4`. `ROUGH=1` in front of it
   makes a draft to show early. Report the numbers.
9. **Verify.** All three layers. Report each.
10. **Deliver as a new file.** Never overwrite the last build.

## Two looks in one film

A film can cut between two renderers, like riso scenes and an ink ledger. Give
the second one its own scope, draw its acts with the plate option
`{ raw: (ctx, u, f, size) => {} }`, and put its cuts in `EXTRA_CUTS`.
`assets/examples/parcel42-day/` does exactly this. It is also the canonical
worked example of the whole workflow, so read its README, and read it for the
method, never the look.

## The page contract

Any page that meets this builds and verifies. It sets `const FPS = n`. In
`?capture=1` it sets `window.__frames` to the frame count and
`window.__render(f)` to draw frame `f` the same way every time, then sets its
title to `capture ready N`. Its first line of script writes any error into
`document.title`, so a crash cannot look like a blank page.

Pages built on the engine also get `?play=1`, `?f=N`, `?grid=1`, `?scene=id`
and `?cuts=1`, and `score.py` reads their acts from `plate()`.

## The files

| file | what it is |
|---|---|
| `assets/intent.md` | the intent card template |
| `assets/engine.html` | an optional start: frame grid, acts and shots, scene library, moves, a riso press, the handwriting pen, three demo worlds |
| `assets/score.py` | the computed score on the page's beat grid, with per-piece key, harmony, kit, swing and ending |
| `assets/build.sh` | gate, capture, seams, score, encode, measure, verify, in one command |
| `assets/verify.py` | the film against its intent card, plus loudness and clipping, then the watch-test questions |
| `assets/check.py` | the page gate: parse, error handler, modes, grid, render |
| `assets/seamcheck.py` | flashes, pops off a cut, jerks inside a move, a pinned anchor that drifts |
| `assets/sketchcheck.py` | the story sketches: not flat, not a copy of approved frames (`--refs`), no off-limits world (`--world`), no stub left in |
| `assets/lookcheck.py`, `assets/soundcheck.py` | measurements of the picture and the sound, read against the card and the gallery |
| `assets/printcheck.py` | does a frame look printed or computed, against a reference image. Centre-crops a wide frame to a square |
| `assets/refpage.mjs` | pulls apart a reference that is an HTML page: its palette, marks, layers and audio kit as it draws them, plus an MP4 so the clip checks work on it |
| `assets/capture.mjs` | frame capture over CDP. build.sh calls it |
| `assets/capture-range.mjs`, `assets/capture-par.sh` | capture at any width and height, in several Chromes at once. For 16:9 and anything past a minute |
| `assets/doctor.sh` | is this machine ready: Chrome, Node 22+, ffmpeg, numpy, Pillow |
| `assets/examples/parcel42-day/` | the approved film's source, with a README on how it was built |
| `assets/example-print-still.html` | the riso finish model |

## When to read what

Read each file whole, with one call per file. A Codex run read three or four
skill files per call under an output cap. It lost about 13k tokens from the
middle of those reads without noticing, including half of `gallery.md`. If a
read says tokens were truncated, read that file again on its own.

- **Before the intent card, and before you show anything**, read
  `reference/gallery.md`. Then `reference/taste.md`.
- **When they share a reference clip, still or HTML page**, read `reference/references.md`.
- **When you plan the story or write captions**, read `reference/story.md`.
- **When picture and sound share a beat grid**, read `reference/time.md`.
- **When you plan transitions or the camera**, read `reference/moves.md`.
- **When the look is riso or any print**, read `reference/press.md`, then
  `reference/surface.md` before tuning texture.
- **When you add handwriting**, read `reference/hand.md`.
- **When you make the sound**, read `reference/sound.md`.
- **When you build**, read `reference/export.md`.
- **When the film runs past a minute**, read the end of `reference/export.md`.
- **When the film is a narrated lesson for YouTube**, use the `lesson-film` skill, which builds on this one.
- **The traps**, every way this has broken so far, as checklists by phase.
  Before the card and the sketches, and before you show anything,
  `reference/traps-story.md`. Before you build the page,
  `reference/traps-page.md`. When you plan moves, the camera or the beat
  grid, `reference/traps-motion.md`. When the look is print,
  `reference/traps-print.md`. When you make the sound,
  `reference/traps-sound.md`. Before the first full build,
  `reference/traps-build.md`.

## Changing this skill

State intent and judgement, and check the outcome against the intent. Never
turn one film's style into a rule: that is how every piece became a copy of one
reference. A lesson goes into the one file that owns it, and every other file
points there in a line. A new film someone approves goes into the gallery's
Ours section, with why it works.

## Borrowed, with thanks

The flat-fill-plus-clipped-finish model, and the shape of `wob`, `crayon`,
`hatch`, `grain`, `dotScreen` and `scribble`, come from the
`hand-drawn-canvas-animation` skill by alesha-pro (MIT,
github.com/alesha-pro/tools). Its rule that texture is a finish rather
than a gradient, and that a shape's fill and its outline must never
coincide, is the thing that unblocked this skill's print look.

## What good looks like

A newcomer watches it once and retells it, and the retelling matches the
takeaway line. Every tile of the contact sheet is a picture of something that
means something. It could sit next to the gallery films without being a copy
of one. The last frame ends it. The defects are zero, the card matches, and
you watched it anyway.
