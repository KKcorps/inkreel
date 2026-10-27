# The look Kartik wants

Read this before you pick a look, and again before you show anything. Every
line here is a correction Kartik, the skill's author, made while it was built,
so it is a starting taste. Where the person you make the film for wants
something else, they win. Start from these and you skip three
rounds. The wider taste, 29 films people loved, is in `gallery.md`.

## Contents

- Draw the thing
- How loudly it explains itself
- Fine screen, quiet grain
- No chrome in the art
- Text is a choice on the intent card
- Handwriting, not set type
- Depth, because flat is the tell
- The prose rules apply to captions too

## Draw the thing

Every act has a subject you can name, and the best ones have a face. A boat.
A fly. A cat. A girl and a star that smiles. The films in `gallery.md` nearly all do
this in every frame, and the three pieces
this skill made first did it in none. They drew a grid of dots on an indigo
ground for thirty seconds and let the captions carry the meaning.

The mechanism is carried by what the subject does and what happens to it, not
by a field of abstract marks. A row is a thing that can be drawn. A segment is
a thing that can be drawn. If you cannot say what the picture is a picture of,
it is not done.

This was measured, not felt. Across the six films a new palette and
composition arrived every 2.3 to 5.8 seconds. In our first three pieces it
arrived every five to sixteen. `lookcheck.py` holds those numbers.

## How loudly it explains itself

Ask this at kickoff. There are three registers and he has rejected two.

- **Diagram.** Labelled boxes, arrows pointing at parts, an icon standing in
  for every noun, a headline on every plate. He called this "on the face".
- **Pure form.** Fields, orbits, interference, no subject at all. He asked for
  it, looked at it, and asked to come back.
- **A scene with a subject.** This is the answer, and it is what the
  references do. A boat on a lake at sunset is not a diagram of a boat. Nothing
  is labelled. The meaning is in what the boat does next.

So the rule is against labels, arrows and boxes, never against drawing. The
tell that you have drifted back to a diagram is a caption that names a part of
the picture instead of saying something about it. The tell that you have
drifted into pure form is a frame you cannot describe in a sentence.

## Slower than you think

The one-row piece at 24 fps read as rushed and he asked for 0.75x. That is
18 fps with the same frames, so the template starts at `const FPS = 18`, a
67.5 BPM beat. That is a starting point, not the house tempo. All six films in
`gallery.md` mostly run at 24 fps and the good ones do not read as rushed, because their pace is uneven.
Pick the pace for each piece and say why at the act sheet. Do not speed a
piece up to fit a length. Cut an act.

That note came from a piece paced evenly, every act two to four beats.
`time.md` owns the pace curve.

## Fine screen, quiet grain

Do not ship it coarse. He asked for finer twice in a row from a starting point
that looked reasonable to me.

The defaults in `engine.html` are where he settled after asking for finer
twice. Start there. A piece can move them on purpose, when the act sheet says
why, and then `printcheck.py` checks the result. The boat in `gallery.md` uses a
coarse screen on purpose and it works.

| knob | value | what it does |
|---|---|---|
| `CELL` | 1.7 | halftone pitch in device pixels. lower is finer |
| `GRAIN` | `.06, .09` | density noise and the uneven pull of the drum |
| paper tooth | `.08` alpha, 234 to 255 | the sheet texture over everything |

A coarse screen by accident reads as a filter. A fine one reads as a print.
Visible riso dots are a choice for a frame or a piece, never a default.

Cost is not a reason to go coarser. The halftone is a per pixel walk, so
fineness is nearly free. See `traps-page.md`.

## No chrome in the art

The art is the art. Nothing debug goes in the frame.

- No frame counter, no fps readout, no draw time.
- No act index, no "05 / 14".
- No caption slab, no label plate, no corner tag.

Those all exist in the tooling, in `?grid=1` and `?bench=20`, where they belong.
He asked for every one of them to be taken out of the piece itself.

## Text is a choice on the intent card

On 25 September he made text a per-piece choice. The card's `text:` line says
which, and why: none, in-world, captions or lyrics. There is no default.

- **None.** The picture carries it all. Two of the 29 gallery films are silent
  and several have no words at all.
- **In-world.** Words that are part of the picture. The town writes the question
  on a note a character holds, and puts one big word under each picture. The
  doodles paint sound words next to the thing making the sound. Small print
  builds its pictures out of the words themselves.
- **Captions.** Handwriting that writes on over the art. When he chose this in
  September, the rule was one sentence an act, as data on the beat grid
  (`time.md`), split over two lines at different sizes and corners when it is
  long, holding while the shots cut under it. A captioned piece must not go
  silent for three acts because the paragraph ran out.
- **Lyrics.** Small word-by-word subtitles for verses and giant type for the
  hook, as the music films do.

Whatever the choice, the words are one voice written as one paragraph first.
`story.md` owns how they should read. And the picture has to stand without
them. A caption
says something about the picture, never names a part of it. every-row-twice put
a small line in the top corner of every frame, and it read as a subtitle.

## Handwriting, not set type

When there are captions or in-world words, they are drawn with the pen, at varied
angles and sizes, and they **write on** as the act runs. Set type is for the
title plate and a closing line and nothing else.

Vary it. A word at 800 units across a frame and a phrase at 400 in a corner, at
different tilts, is the texture he wants. Do not set every caption at the same
size in the same place, which is just a label with a wobble.

Text only acts are a real device, not filler. A single huge word at a turning
point carries a beat on its own. Use them at the turns.

See `hand.md` for the mechanics.

## Depth, because flat is the tell

A single flat plane seen head on is what makes a computed piece look computed.
Layers fix most of it.

- A **far** layer, coarser and fainter, running past the subject so this reads
  as part of something bigger. Hills behind the lake. Stars behind the moon.
- The **subject** at depth 1.
- A few **near** specks at depth 0.42, soft because they are out of the plane
  of focus. `dust()` in `engine.html`. This is the layer that actually sells it.

The catch is that **parallax needs the camera to move**. A slow perpetual drift
runs under every act, and the camera holds, cuts to a second shot on beat two,
then travels to the next act's opening framing. Take the drift out and the
layers collapse back into a flat picture.

## The prose rules apply to captions too

Short sentences, one idea each. Everyday verbs. No em dashes and no semicolons.
Plain language that keeps every real technical term.

The caption method itself is in `story.md`. If you are writing more than a
few lines, run its reader model properly.
