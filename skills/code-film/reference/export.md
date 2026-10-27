# Exporting

Read this when you export. One command does it. The sections after it are what
that command runs, kept exact because the sequence is fragile when done by
hand.

## Contents

- The one command
- Capture the frames
- Measure the motion
- Check the joins
- Encode
- GIF, when a venue needs one
- Headless stills

## The one command

```bash
assets/build.sh piece.html out/piece.mp4
```

Gate, capture at 1080, motion track, seamcheck on the frames, score with
motion, encode, soundcheck, lookcheck, then `verify.py` against
`piece.intent.md`. It stops if the gate blocks. It exits 1 at the end if the
seams or the intent check failed, after the MP4 is written. `ROUGH=1` in front
of it builds a draft past all of that, for a rough cut you label as rough.

The score is the page's own `piece.score.py` if there is one, else a
`piece.wav` the page made, else the skill's `score.py`. A card that says
`sound: silent` encodes with no audio track. It reuses `out/piece_frames` when
the folder holds one PNG per frame, newer than the page, from the same seed, so
a change to the score alone takes twenty seconds instead of four minutes. A new
capture replaces only the numbered PNGs in that folder. `SEED=7` in front of it
changes the seed.

Then watch and listen to the file once, whole, before anyone else does.

## Capture the frames

Never launch Chrome once per frame. That is twenty minutes for a 574 frame
piece. `capture.mjs` starts one headless Chrome, connects over the DevTools
protocol with the WebSocket built into Node, and drives `window.__render(f)`
frame by frame. 574 frames takes about 45 seconds.

It needs the page to expose the hook, which `engine.html` already does under
`?capture=1`.

```bash
node assets/capture.mjs "file://$PWD/piece.html?s=11" frames 480
```

Arguments are the page URL, the output directory and the pixel size. The script
adds `capture=1` and `w=` itself.

It pins the viewport with `Emulation.setDeviceMetricsOverride` rather than
trusting `--window-size`. A headless window is not the viewport. Asking for
1080 by 1080 gives a 1080 by 993 viewport, the canvas is clipped, and h264 then
refuses the odd height.

1080 frames are about 2.8MB each, so 574 of them is 1.5GB. **Verify the encode
produced a non empty file before deleting the frame directory.**

## Measure the motion

One number per frame, how much the picture changed. The score reads it to know
which acts rest and where to put ticks, and `soundcheck.py` measures the
finished file against it. Do this before you encode, and run the score again
with it.

```bash
ffmpeg -y -i frames/%04d.png -vf "scale=120:120,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=motion.txt" -f null -
python3 piece.score.py piece.html score.wav motion.txt     # or assets/score.py if you have not written yours
```

## Check the joins

```bash
python3 assets/seamcheck.py piece.html frames
```

It asks the page where its cuts, moves and pinned acts are (`?cuts=1`), then
reads the frames. A big change that is neither a cut nor inside a move is a
pop. A frame unlike both neighbours while they are alike is a flash. A pinned
frame with no dot of the anchor's size on the centre is an anchor that drifted
or sank into the scene. It takes about ten seconds on 640 frames.

On its first run it found a one frame flash in the archive that no still and
no contact sheet could show. `traps-motion.md` has the story.

## Encode

**MP4 at 1080 at the page's frame rate is the deliverable**, 18 fps by default. Not GIF. A 28 second loop in GIF
is 26MB at a size worth watching, and it has no sound. Ship the MP4 and offer a
small GIF alongside it if the venue needs one.

```bash
# the deliverable. 1080, at the page's FPS, with the score muxed in one pass. build.sh reads FPS from the page
ffmpeg -y -framerate 18 -i frames/%04d.png -i score.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 17 -preset medium \
  -c:a aac -b:a 160k -shortest out.mp4
```

Capture at 1080 for this. A frame costs about 200ms to compute at that size, so
574 frames is roughly three minutes, which is nothing for an offline render.

**Expect a big file, and do not fight it too hard.** A full frame halftone is
high frequency noise, which is the worst case for h264. At crf 17 a 24 second
1080 loop came out at 18 Mbps and 53MB. At crf 23 it is 10 Mbps and 29MB, and a
six times zoom confirms the dots and the paper tooth both survive. A comparable
piece made of smooth illustration sits around 6 Mbps. Ours will always be
heavier per second than art with flat fills, and that is the screen, not the
encoder.

Then check the sync on the finished file, not the WAV, because sync is a
property of the two together. Then `verify.py` checks the film against its
intent card. Zero defects and zero misses before you call the build finished.

```bash
python3 assets/soundcheck.py out.mp4
```

Re-encoding from the finished MP4 is fine if you already deleted the frames.
Copy the audio through with `-c:a copy` rather than transcoding it twice.

## GIF, when a venue needs one

A straight full size encode is unusable. 574 frames at 480px came out at 26MB.
Scale down and drop frames.

```bash
# about 11MB, good quality
ffmpeg -y -framerate 20 -i frames/%04d.png -filter_complex \
  "[0:v] fps=14,scale=380:-1:flags=lanczos,split [a][b];[a] palettegen=max_colors=128:stats_mode=diff [p];[b][p] paletteuse=dither=none:diff_mode=rectangle" \
  -loop 0 out.gif

# about 6MB, for chat and Slack
ffmpeg -y -framerate 20 -i frames/%04d.png -filter_complex \
  "[0:v] fps=12,scale=320:-1:flags=lanczos,split [a][b];[a] palettegen=max_colors=96:stats_mode=diff [p];[b][p] paletteuse=dither=none:diff_mode=rectangle" \
  -loop 0 out-small.gif

# MP4, far smaller for the same quality if the venue allows it
ffmpeg -y -framerate 20 -i frames/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 \
  -vf "scale=960:960:flags=neighbor" out.mp4
```

Use `dither=none`. The halftone is already its own texture and GIF dithering
fights it. Scaling down with lanczos softens the dots, which both looks right
and compresses much better.

## Headless stills

```bash
"$CHROME" --headless=new \
  --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1000,1000 --virtual-time-budget=90000 \
  --screenshot=out.png "file://$PWD/piece.html?f=176&s=11"
```

`--virtual-time-budget` matters. Without it the screenshot can fire before the
page has finished computing.

For the contact sheet, size the window to the grid. Columns are
`ceil(sqrt(acts * 1.15))`, so at 250px tiles a 15 act piece needs about
`--window-size=1250,1000`.

## Longer films

Nothing caps the length. The engine, the score and the checks all run on a
film of any length, and the look and sound checks have measured films up to 11
minutes. What grows is time, disk and drawing.

- **Capture** runs at about half a second a frame at 1080 pixels: 441 seconds
  for 896 frames. A 3 minute film at 24 fps is about 35 minutes of capture.
  `assets/capture-par.sh page.html frames N W H` runs N Chromes on neighbouring
  runs of frames, at any width and height: 1541 frames at 1920x1080 took 135 s
  with 10. `build.sh` still captures square frames with one Chrome.
- **Frames** are about 2.4 MB each, so a 3 minute film needs about 10 GB free.
- **Drawing.** Parcel 42's day used six lived scenes for 37 seconds. At that
  pace a 3 minute film needs 30 to 40 scenes, so split them across helpers,
  one file each, as that film did.
- **Music** needs a longer form: verses, a chorus and a bridge, not one motif
  and its answer. `SECTIONS` takes any number of phrases.
- **Taste.** The long films in `gallery.md` sagged into slide layouts. A long
  piece needs chapters and a reason to be long. The music films at 2 to 6
  minutes held because a song carried them.

Chrome is found at `$CHROME` if set, else in the usual macOS and Linux places.
`assets/doctor.sh` checks a new machine.
