---
name: lesson-film
description: Makes narrated lesson films for YouTube that teach one technical mechanism in about one to two minutes, with every frame drawn by code and a computed score, for STEM viewers with short attention spans. Builds on the code-film skill for the look, the taste and the defect checks, and adds a spoken voice that sets the clock (Kokoro, word timestamps), a script written as one conversation, a pause to guess, a recap and an ending that fades, a scene system in 16:9 with parallel capture, -14 LUFS mastering, exact captions, and checks that the voice said every word and the picture moves on each word it is tied to. Use when the user wants an explainer or lesson video, a YouTube video that teaches something, a narrated version of a code-film, or a Short cut from one. Not for a film with no voice, such as a music video, an ad or a visual poem, which belongs to code-film, or an animated diagram inside a page or doc.
---

# Lesson films

A lesson film teaches one mechanism well enough that a newcomer can explain it
back after one watch. Every picture is drawn by code, the narrator's voice is
the clock, and the music plays in the gaps the voice leaves. It sits on top of
`code-film`: that skill owns the look, the gallery, the taste and the defect
checks. This skill owns the teaching, the words, the voice, the pace, the
ending and the YouTube side.

The worked example is `examples/parcel42-lesson/`, a 130 s lesson on how
Apache Pinot upserts hide old rows. Kartik, the skill's author, called it "perfect" after eight versions,
and every note on the way lives in the reference file that owns it. Read its
README for the method, never the look.

## The core: track the viewer

A lesson film is one half of a conversation, and the viewer supplies the other
half in silence. At every second they have three things:

- **What they know.** Only what the film has shown and said so far, plus
  everyday knowledge. Not the source code, and not what you read to make it.
- **What they are asking.** Every picture and every claim raises the next
  question: "so what happens to the old one?", "what if it arrives late?",
  "doesn't that waste space?"
- **What they believe.** A model of the mechanism built only from the film.
  One wrong word installs a wrong model. "Pinot never knocks the old house
  down" taught that nothing is ever removed, and then the film showed
  compaction removing it.

Making the film is running that model second by second, across the voice and
the picture together:

1. **Answer the question where they have it.** The late letter comes right
   after the rule, and "And the dark houses?" right after the query.
2. **Let them arrive before you announce.** The picture shows the evidence a
   beat before the voice names it. A title, a label or a chapter name never
   gives the answer before the question is asked.
3. **Never cut the thread.** A line that promises something owns the next
   picture. After "two switches flip", the next thing on screen is the
   switches.
4. **Hand them each word before you spend it.** Every term on screen is said
   aloud once, where the picture shows it, and none reaches the first line.
   The thing in the world comes first, and the term is named after it. Outside
   that naming line a sentence stays in one world: a flower has stopped
   growing, it is never "closed". A
   whole film showed "segment 7" on street signs without ever saying segment.
5. **Teach the mechanism, not the code.** Show a real name only when the viewer
   would search for it (`validDocIds`), never a function name that only labels
   machinery.

Every rule in the
references is one of these five applied. When a rule seems to conflict with
another, or nothing covers a case, run the viewer model and it decides.

**A note is never about one instance.** When the person you make the film for
points at one moment, they are pointing at one place the model broke. Find every
other place it broke the same way, fix them all, and report the count. Kartik's
"painful beat" was the fills and also the clinks and clicks. His missing letters were any event timed from a
fixed frame, which is why `shiftcheck.py` exists. His "wrong phrase" was every
absolute word, which is why `scriptcheck.py` lists them.

## Setup

This skill needs `code-film` installed next to it, in the same skills folder.
Its build, gate, capture, seam and sound checks and its handwriting all come
from there, and every script finds it there or at `$CODE_FILM`.

Run `bash assets/setup.sh` once. It checks `code-film`'s doctor, then builds a
Python 3.12 venv at `~/.cache/lesson-film/venv` with Kokoro, soundfile,
faster-whisper and the spaCy English model, and checks ffmpeg has `loudnorm`.

## What good looks like

- **A newcomer can retell it.** Their two sentences match the takeaway line on
  the intent card, with the real terms in the right places.
- **It sounds like one person explaining to you.** Each sentence leads into the
  next, and each scene change carries the live question across. Read the
  script aloud without the pictures. If it sounds like a list of labels, it is
  not done (`reference/words.md`).
- **It breathes.** The viewer has time to see each change before the next one.
  Kartik found a 64 s cut at 0.36 cuts a second "too fast paced". The approved
  cut runs 130 s at 0.16 cuts a second, with the voice at normal speed and real
  breaths (`reference/pace-and-ending.md`).
- **Every claim is true, and checked.** Write the claims into `facts.md`
  against the source before any drawing. The picture shows exactly that state.
- **The picture changes on the word.** Each thing appears the moment the voice
  names it. Motion and colour sit only on the part being explained
  (`reference/teaching.md`).
- **It opens gently and ends slowly.** A first line anyone can take in, with
  the picture and the tune already running, a cold open that ends on the
  question, then a title sting of about five seconds, the way Kurzgesagt does
  it. "The start feels abrupt" was Kartik's note on a film that opened on a
  character the viewer had not met (`reference/pace-and-ending.md`).
- **It ends, it does not stop.** A recap, a payoff, a closing line that answers
  the opening, the home chord, then picture and sound fade together over
  several seconds. "The ending is abrupt" is the note to never get again.
- **The defects are zero.** No flash, no pop, no clip, loudness at -14 LUFS,
  every word heard.

These are judgements, not rules. Break one when the card says why.

## Workflow

Copy this into your notes and report each line as you finish it. A line
cannot be ticked without saying how.

```
[ ] 0 reference  only if they shared one. A clip, a still or an HTML page. Report which form, what it does, which gaps are closeable, and what you take and leave.
[ ] 1 facts      facts.md written against the source. Report the claims and where each was checked.
[ ] 2 intent     assets/intent.md copied to <piece>.intent.md, takeaway, feeling, question, guess. Report them.
[ ] 3 gallery    code-film's reference/gallery.md, the two or three nearest films. Report what you take and what you will not copy.
[ ] 4 sketches   three new stories, each a finished-looking still drawn with the kit (sketch.py), one a world you could live in, none taken from the example or a shared reference. sketchcheck.py clean of BLOCKs, then judged against the sheet. Show them. Report each story's line, the three judging answers and the pick.
[ ] 5 words      the whole script as one paragraph in <piece>.chain.txt, then cut into lines with its "terms", "things" and "tech". Before the paragraph, write each term's thing and the world's verb for each real state it has. scriptcheck.py clean of BLOCKs. Report that map, the script read aloud once, every hinge, and a decision on each REVIEW.
[ ] 6 voice      <piece>.lines.json -> voice.py -> heard.py --write. Report the length, and every word heard or why not.
[ ] 7 plan       scenes, each tied to the words that change it, and the world state they share. Report the plan, with the thing in the world that shows each term and the world's verb for each real state.
[ ] 8 build      page from assets/template/. Scenes checked alone in draft first. Report what you redrew after looking.
[ ] 9 sound      <piece>.score.py from assets/score_template.py. Report the chords, the tune in the gaps, and the in-world sounds.
[ ] 10 render    assets/build.sh. DRAFT=1 first. Report the numbers.
[ ] 11 verify    all three layers below. Report each.
[ ] 12 deliver   a new file each build, never overwrite. The master for YouTube, a small preview under 30 MB to send.
```

Steps 1 to 5 are where lessons are won. Step 5 in particular: write the
script as prose first, then cut it into lines. Cutting first is how a script
becomes a stack of captions.

## Verify

Report all three layers in the delivery note, separately.

- **Defects block.** `build.sh` runs `scriptcheck.py` (every term said, none in
  the first line, ties that exist) and code-film's `check.py` and `seamcheck.py`,
  masters to -14 LUFS integrated with true peak at -1.5 dBTP, and encodes to
  YouTube's spec (`reference/youtube.md`).
- **The lesson is measured.** `verify.py` checks the card's length, pace and
  sound. `heard.py` transcribes the voice and says which words were not heard
  and how far the sound lags the cue times. `wordsync.py` checks that motion
  rises on every word the picture is tied to. `shiftcheck.py` renders the film
  with the voice moved two seconds later and fails any scene that changes,
  which is how an event timed from a fixed frame shows up. `captions.py` writes an exact
  SRT from the same cues.
- **The watch test is yours, then the person's.** Retell it as a newcomer.
  Name every tile of the contact sheet. Watch it with the sound off. Read the
  script aloud without pictures. Judge the last ten seconds on their own. Then
  say plainly what you did not check, such as the voice by ear.

## When to read what

Read each file whole, with one call per file, and read a file again on its
own if the read says tokens were truncated. code-film's "When to read what"
says what a batched read cost.

- **When they share a reference**, read code-film's `reference/references.md`.
  It covers all three forms. A clip and a still get pulled apart with ffmpeg.
  An HTML page, ours or theirs, goes through code-film's `assets/refpage.mjs`,
  which watches the page draw and reports its palette, marks, layers and audio
  kit, and writes an MP4 so the clip checks run on it too.
- **Before the facts and the intent card**, read `reference/teaching.md`.
- **Before the sketches**, read this skill's `reference/sketches.md` and the
  Story section of its own `reference/traps.md`. Then read code-film's
  `reference/story.md` for "Pick a shape first" and "What persists", and
  code-film's `reference/traps-story.md`.
- **Before you write a single line of the script**, read `reference/words.md`.
- **When you plan the opening or the ending, and when you set the voice's speed, breaths and holds**, read `reference/pace-and-ending.md`.
- **When you make or fix the voice**, read `reference/voice.md`.
- **When you plan scenes, split them across helpers, or build the page**, read `reference/film.md`, and code-film's `reference/moves.md`, which owns the moves between two pictures.
- **When you make the sound**, read `reference/sound.md`, and code-film's `reference/sound.md` for the instruments and its `reference/traps-sound.md`.
- **Before the first render and after any note on one**, read `reference/traps.md`.
- **Before you publish**, read `reference/youtube.md`.
- **When a rule needs its source, or someone asks why the skill does something**, read `reference/research.md`: the evidence, effect sizes and links.
- **For the look, the taste and the print finish**, read code-film's `gallery.md`, `taste.md` and `press.md`, and its `traps-print.md` before you tune the finish.

## The files

| file | what it is |
|---|---|
| `assets/setup.sh` | one-time setup: the voice and hearing venv, and the checks |
| `assets/intent.md` | the lesson intent card, code-film's card plus the teaching lines |
| `assets/voice.py` | speaks `<piece>.lines.json` with Kokoro, lays the lines on a beat grid, writes the voice and the cues |
| `assets/heard.py` | transcribes the voice with Whisper, reports missing words and the lag, `--write` stores the lag in the cues |
| `assets/saytest.py` | tries respellings of a word Kokoro says wrong, and says which one Whisper hears right |
| `assets/captions.py`, `assets/wordsync.py` | the SRT from the cues, and the check that motion rises on each tied word |
| `assets/shiftcheck.py` | the check that every scene is timed from the voice, not from fixed frames |
| `assets/scriptcheck.py` | the script's check: terms said, none in the first line, each term's thing said before the term, ties that exist, and a list of absolute words, unsaid on-screen words and sentences that mix the world with the real system to read |
| `assets/sketchcheck.py`, `assets/barsheet.py` | code-film's sketch check, run with this skill's approved frames, the example's town and the template's stub. And the script that rebuilds the judging sheet |
| `assets/score_template.py` | a bed per line, the tune in the gaps, in-world sounds on state changes, a 16 dB duck under speech, the fading outro |
| `assets/build.sh` | page, gate, parallel capture, seams, score, -14 LUFS master, encode, captions, contact sheet, every check |
| `assets/template/` | the page to copy: `assemble.py`, `film/kit.js` (the craft with no world in it: ink, dots, edges, light, handwriting, the print finish), `film/core.js` (voice clock, layers, camera, dive and iris moves), `film/main.js`, `film/SCENES.md`, an example scene that builds one stand-in object, and `sketch.py` with `sketches/sketch.js` for the three story stills |
| `reference/stills/` | frames from the approved lesson, captioned, for the two rules that prose alone does not land: the opening and ending beats, and a picture changing on its word. Also the sketches' judging sheet `sketch-bar.jpg`, opened only after your own three exist, and `sent-back.jpg` |
| `examples/parcel42-lesson/` | the approved lesson's whole source, its voice track, a link to a preview of the film to watch, its README, contact sheet and thumbnails |

Parallel capture lives in code-film (`assets/capture-range.mjs`,
`assets/capture-par.sh`), because any long film needs it.

## Changing this skill

State intent and judgement, and check the outcome against the intent. A new
lesson someone approves becomes a second example, with a line in this file on
why it works. A lesson learned goes into the one reference file that owns it,
and every other file points there in a line.
