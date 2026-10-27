# When they show you a reference

Read this the moment someone shares a reference and asks why it looks better
than yours. Answer it with measurements, not impressions, and be honest about
which gap is closeable. A reference arrives in one of three forms, and the
first question is always which one you have.

- **A clip.** An MP4 or a link. Start at "Pull it apart first".
- **A still.** One image. Skip to "Measure the surface, per region".
- **A page.** An HTML file, ours or someone else's. Start at "When the
  reference is a page", because a page answers questions a clip cannot, and
  then come back here for the pixels.

## Contents

- Take the craft, leave the world
- When the reference is a page
- Pull it apart first
- The question that decides everything
- Do not assert a difference you have not measured
- Pull the sound apart too
- Measure the surface, per region
- What is actually closeable

## Take the craft, leave the world

A reference sets the bar, not the subject. Take what it does to the eye: the
depth, the light on what is live, the surface, and how the words sit in the
world. Leave its world, its characters, its objects and its layout, and make
your own at that bar. Report what you take and what you leave on the step 0
line.

Drawing code carries its subject. Shown the depot sketch as an example of
craft for a lesson on deletes, a Codex run cut the depot's drawing code out of
the page and used it as its kit. The cabinet, the lamp, the chute and parcel
42 came with it, down to the 14:08 and 16:30 times, and the two-minute
follow-up stayed at that desk. Kartik: "it reused same parcel metaphor without
giving ideas." So copy a technique as a function you rewrite for your own
world, never a scene.

## When the reference is a page

A clip gives you pixels. A page gives you the machine that made them, so you
can read the palette as it was authored, the marks it draws with, and the
instruments it built, instead of guessing them back out of a screenshot.

```bash
node assets/refpage.mjs ref.html refpage 20
```

It opens the page in headless Chrome and wraps the canvas and Web Audio APIs
before any of the page's code runs, so it watches the page draw rather than
reading its source. That matters, because minified, bundled or generated
source defeats grep and none of it defeats this. It writes `refpage/ref.mp4`,
a contact sheet, the frames and `report.json`, so the picture half of this
file works on a page too. Run `lookcheck.py` on that MP4 and `printcheck.py`
against a frame, exactly as you would for a clip. The one gap is sound, because
the capture is muted and the MP4 comes out silent, so `soundcheck.py` has
nothing to read. The report's kit block is what you get instead, and it is
better than a waveform anyway, since it names the nodes rather than guessing
them.

**The question that decides everything, for a page, is whether it is really all
code.** The report's first block answers it. Raster draws counts every
`drawImage` of a photo, a video or a bitmap, and decoded samples counts every
`decodeAudioData`. If either is above zero, the reference is illustration or
recording with code laid over it, and comparing your palette or your kit to
theirs is not a fair fight. Say that before you say anything else. It is the
page version of the halftone question below, and it is a harder fact, because
it is a count rather than a judgement about a zoomed crop.

Three things to know before you read a report.

**A page of ours steps, a foreign page gets sampled.** Ours exposes
`window.__render` under `?capture=1`, so the capture is frame exact. Anything
else runs on its own clock, and the script advances Chrome's virtual time in
40 ms steps instead of sleeping, so a slow machine cannot stretch the sampling.
The "per sample" line says which one you got.

**Zero text calls does not mean no words on screen.** The approved lesson
measures zero `fillText` and is full of letters, because it draws them as pen
strokes. Read that line as "the letters are paths", not "there is no type".

**Count the canvases.** One canvas the size of the frame is a single plane.
Several, or `drawImage` of another canvas, means layers, and layers are most of
what makes a computed piece stop looking flat. The approved lesson draws its
own canvas back into itself about three times a frame.

## Pull it apart first

Four commands, in this order.

```bash
# what is it, technically
ffprobe -v error -show_entries format=duration,bit_rate \
  -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1 ref.mp4

# a contact sheet, so you see the whole thing at once
ffmpeg -y -i ref.mp4 -vf "select='not(mod(n\,36))',scale=340:340,tile=5x4" -frames:v 1 contact.png

# one frame at full size, then a hard zoom into a flat area
ffmpeg -y -i ref.mp4 -vf "select='eq(n\,430)'" -frames:v 1 frame.png
ffmpeg -y -i ref.mp4 -vf "select='eq(n\,430)',crop=120:120:700:560,scale=720:720:flags=neighbor" -frames:v 1 zoom.png
```

The zoom is the important one and it is the step that gets skipped.

If they share the prompt that made the clip, read it before measuring. The
clip tells you how often the picture changes. The prompt tells you how it gets
away with it: what is pinned, how the moves are built, what the palette does.
That is how `moves.md` was learned.

## The question that decides everything

**Is the texture a layer over finished art, or is it the mechanism that made the
picture?**

Zoom to six times on a flat area and look for a halftone screen.

- **No screen, and the grain resolves into drawn marks.** It is illustration
  with a print texture laid over it. The texture constrains nothing, so the
  artist can draw anything and then age it.
- **A regular dot lattice.** It is a press simulation, like this skill. Every
  mark has to survive the screen, which is why text under about 28 units dies
  and fine detail disappears.

These are opposite architectures and the difference explains most of what a
viewer calls quality. Say which one the reference is before saying anything
else. Ours is the second kind, which is more honest to how a Risograph works
and strictly more limiting.

## Do not assert a difference you have not measured

On this build the obvious claim was that the reference used a far wider palette
than three inks. Measuring it killed the hypothesis. The reference had **131**
quantised colour buckets in a frame and ours had **182**, because halftone
antialiasing generates more distinct values than flat illustration does.

The real difference was that theirs are designed per scene and ours fall out of
multiplying three fixed inks. That is a better and truer answer, and it only
appeared because the first one was checked.

```bash
ffmpeg -y -i frame.png -vf scale=200:200 -f rawvideo -pix_fmt rgb24 - 2>/dev/null | python3 -c "
import sys,collections
d=sys.stdin.buffer.read(); px=[tuple(d[i:i+3]) for i in range(0,len(d),3)]
q=collections.Counter((r//24*24,g//24*24,b//24*24) for r,g,b in px)
print('buckets:',len(q))
for c,n in q.most_common(10): print(f'  #{c[0]:02x}{c[1]:02x}{c[2]:02x} {n*100//len(px)}%')"
```

## Pull the sound and the look apart too

Run the same validators on the reference that you run on your own export.

```bash
python3 assets/soundcheck.py ref.mp4
python3 assets/lookcheck.py ref.mp4
```

`lookcheck.py` is how the visual gap was found. Three references measured a new
palette and composition every two to three seconds, composition difference
between seconds of 0.91 to 0.96, four to seven hue families and one to two
cuts a second. Our first three pieces measured a new look every five to
sixteen seconds, 0.63 to 0.72, three to four families, one cut every two to
four seconds. Nothing in that gap was drawing skill. It was a grid shipped as
the engine, a ban on drawing subjects, four grounds and three fixed inks.
`taste.md` and `press.md` own the fixes. Since 25 September the check only
measures, against the films in `gallery.md`, and never blocks.

On this build the fly clip measured 86 percent of its motion peaks with a
sound inside two frames, loudness that followed motion at 0.53, hits with a
high frequency edge, and a kit that held one tempo in 91 percent of windows.
Ours measured 38 percent, 0.15, no edge, and a steady kit that ignored the
picture. Nothing in that gap was an instrument or a sample. It was which layer
is loud and which layer owns the clock. It took four builds to close, and the
last one changed the picture, not the sound. `time.md` owns that rule and
`sound.md` owns the mix.

## Measure the surface, per region

`python3 assets/printcheck.py mine.png reference.png` does this. Run it the
moment the job is to match a look rather than to tell a story.

Four properties, and eye alone got three of them backwards at least once
on the owl build.

- **acut**, mean neighbour luma contrast, is fine detail overall. Too low
  is mush, too high is harsh and un-printed.
- **chroma**, on the opponent axes. A printed dark mottles red against
  green more than blue against yellow. The owl reference measures 11.6
  red-green and 9.2 blue-yellow, so neutral RGB noise is wrong.
- **mottle**, per region luma spread. The reference's background varies
  most and its dark mass least, which is the opposite of how it looks.
- **hue**, mean colour per region, so tuning the other three does not
  quietly drift the palette.

Two things that only showed up by measuring one region at a time.

**Count the plates before you count the dots.** Two interleaved colour
screens read as one lattice, which made the first pitch estimate twice too
fine, and every number after it inherited the error.

**Take more than one patch per region.** A single patch that clips a
feature will happily report a number three times the truth, and you will
spend the afternoon fixing something that was never wrong. Five patches,
median.

**A pale field's colour swing is structural.** It comes from dot size and
saturation with paper surviving between, not from grain. Adding grain to
fix it does nothing, and adding density makes it worse.

`reference/surface.md` owns what to do about any of it.

## What is actually closeable

Separate the two piles and say so plainly.

**Closeable, and cheap.** Resolution and frame rate. Depth, because a single
flat plane is what makes a computed piece look computed. Sound. All three are
parameters or a few dozen lines, and together they move a lot.

**Not closeable by tuning.** Somebody drew that. Wing venation, a room in
perspective, pencil shading. No procedural rule produces it and no amount of
knob turning gets there. If that is the target, the honest path is an
illustrator, and this engine's job changes from generating the picture to
texturing it.

Saying that clearly is more useful than promising to close a gap that is made
of weeks of somebody else's drawing.
