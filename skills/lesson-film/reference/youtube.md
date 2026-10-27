# Publishing to YouTube

Read this before you publish. Ask the person before any upload, and never
publish a synthetic voice without saying so.

## The file

`build.sh` encodes to YouTube's recommended settings: MP4, H.264 High profile,
4:2:0, BT.709 tags, a closed GOP of half the frame rate, AAC-LC at 48 kHz and
384 kbps, `+faststart`. At CRF 18 the 100 s example is about 300 MB. That is
the master. `build.sh` also writes a preview under 30 MB for sending in chat.

Kartik chose 1080p. Community tests say uploads at 1440p and above get VP9 or
AV1 at every viewing size, which keeps thin ink lines sharper. If a riso
halftone turns to mush after upload, try an unlisted 1440p upload of one scene
before changing anything else. Nobody has checked this yet.

## Around the file

- **Captions.** Upload `<piece>.srt`. It is exact because it comes from the
  script, so technical terms survive, which auto-captions do not manage.
- **Chapters**, for anything over about a minute: timestamps in the
  description, the first at 0:00, at least three, each at least 10 s. Name
  them as the questions they answer. The scene list in `?scenes=1` gives the
  times.
- **Title and thumbnail.** One striking picture and one or two words. Keep the
  title's promise inside the first minute. Offer five to seven title candidates
  in different shapes and expect a few rounds. These rejection reasons hold: too long, too vague, reads like a
  README, a precise count that reads as bean counting. For a company's channel,
  a title never frames its own product as missing, slow or costly, and never
  confesses a team mistake. Test up to three with YouTube's
  Test & Compare, which picks by watch time. Draw the thumbnail with the
  film's own kit, so it is the same world: the example's `thumb.js` places the
  query scene's answer (the telescope on the one lit window) left of centre,
  a bigger parcel looking at it, and one phrase ("immutable?") fitted to the
  dark space with a halo and thick strokes so it reads at phone size.
  `assemble.py` writes `thumb.html` when a `thumb.js` sits beside it. Open
  `../examples/parcel42-lesson/lesson60-v8-thumbnail.jpg` and its `-alt`
  before you draw yours, and look at them small. The example's title,
  description and chapters are in `lesson60-v8-youtube.md`.
- **End screen**, in the last 5 to 20 s, over the fade.
- **Shorts.** Up to 3 minutes, vertical. Because every frame is code, a scene
  can be drawn again at 9:16 with its own layout instead of cropped. Link the
  Short to the long video, and make the long video pay off the Short in its
  first seconds. Burned-in word-by-word captions belong on Shorts, where the
  ADHD viewers in the FocusView study liked them most.

## What would feel cheap

Shouting faces, red arrows, a whoosh on every change, open loops that never
pay off, a "like and subscribe" before the question. Veritasium's line is
"legitbait" versus "clicktraps": the thumbnail may be bold, but the film has to
deliver it.
