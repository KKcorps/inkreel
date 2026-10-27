# Parcel 42, the switch

The approved worked example: a 130 s lesson on how Apache Pinot upserts keep only the
newest row visible. Read it for the method, never the look. This source is v8.
Kartik called v1 (64 s) "really good" with three notes: too fast, terse words
that did not flow as a conversation, and an abrupt ending. v2 (100 s) answered
those. On v2 he found a painful repeated beat (a bright fill in every breath,
now gone and capped 10 dB under the voice), said the start felt abrupt and to
look at how Kurzgesagt starts, ends and paces (v3 added a human first line, a
title sting and a 12 s outro), and questioned "Pinot never knocks the old house
down", which the film's own compaction scene made false (v5 rewrote it and the
payoff). He then saw the road letters had vanished, because they were timed
from fixed frames (now from the words, and caught by `shiftcheck.py`). Porting
the blog-writer skill's core found "segment" and "upsert" never said and
"Pinot" never introduced (v7). v8 respells "upserts" for the voice, because
Kokoro said it so that it was heard as "absurd". Kartik called v8 "perfect".

v8 was approved before the rule that each term's thing comes first
(`reference/words.md`), and it breaks it twice. `scriptcheck.py` now blocks
both: "your query" is said eleven lines before the telescope, and
"compaction" is said over a crew the voice never names. It also asks about
the payoff, "Nothing gets overwritten, and only one window is lit", which
joins the system's word to the town. A v9 would say "so how does the kid's
telescope find only the newest one?" and "At night, a crew rebuilds the old
streets without them. That's compaction." `lesson60.lines.json` carries the
`"things"` and `"tech"` map these checks read.

Watch it first: [`lesson60-v8-preview.mp4`](https://github.com/KKcorps/inkreel/releases/download/v0.1.0/lesson60-v8-preview.mp4) (a 24 MB copy of the approved master, kept out of the repo to keep it small; `curl -LO` it next to `lesson60-v8.srt`).

![contact sheet, one frame every 1.5 s](contact.jpg)

## What happens

It opens on the dusk sky: "Every time you track a parcel, you only want one
answer. Where is it right now?" Parcel 42 sits on a hill with a kid and a
telescope, above a town at dusk.
Each street is a segment, each house a row, and a lit window is a row whose
bit is on. Every letter for 42 comes down one road to one post office (the
partition). Inside, the postmaster's address book holds one line per key (the
primary key map): 42 lives on street 7, house 12, since 14:08. A letter
postmarked 16:30 lands, a brass scale says it is not older, and two switches
flip on the board marked validDocIds: house 12 goes dark, street 8's house 3
lights, and the book's line is rewritten. A snail brings a late letter
postmarked 12:10, the viewer gets three seconds to guess, and the scale tips
the other way: the letter is kept, its window stays dark. The telescope is the
query and reads only lit windows. At night a crew (compaction) lifts the dark
houses out of an old street. Three postcards recap one road, one book, two
switches. The night town, with 42's old houses gone, gets one pennant over its
one lit window: "Nothing gets overwritten, and for each key, only one window is
lit." The closing line calls the first one back, the chord lands, and the
camera rises to the title in the sky as picture and sound fade.

## How it was made, in order

1. `facts.md`: eight claims, each checked against apache/pinot master.
2. `lesson60.intent.md`: the card. The Measured lines were changed after v1
   (length 64 s to 100 s, pace steady to calm), and the card says why.
3. Three story sketches as stills, in `sketches/`: a night depot, a
   switchboard, a town of windows. Kartik picked the town with the depot's
   brass scale.
4. `lesson60.chain.txt`: the script as one paragraph. `lesson60.v1.chain.txt`
   is the terse first version and `lesson60.v2.chain.txt` the one before the
   Kurzgesagt opening and the phrase fix, kept for `reference/words.md`.
5. `lesson60.lines.json`: the script cut into 19 lines, with its terms and a
   `say` respelling for the upsert line, with speeds and holds
   (the question's 4.6 s hold is the title sting).
   `voice.py lesson60` speaks it, `heard.py lesson60 --write` checks it and
   stores the lag. `lesson60.cues.json` and `lesson60.voice.wav` are the result, kept
   here so the example rebuilds exactly as the approved v8, without Kokoro.
6. `film/core.js`: the voice clock, the world state (`K42`, `AT`, `liveRow`,
   `isOn`, `rowExists`), the scene list, layers, camera, the brass scale.
   `film/kit.js` is sketch C's riso kit.
7. `film/scenes/`: 13 scenes. `10-hill`, `15-title`, `88-recap` and
   `90-payoff` by the main author. `20-road`, `70-snail`, `80-query` and `85-compact` by one helper,
   `30-desk` (which holds the shared post office room), `40-scale`, `50-board`,
   `60-bits` and `75-older` by another, in parallel, to `film/SCENES.md`.
8. `lesson60.score.py`: the bed per line, the motif in the gaps, the snail's
   phrase, the guess with ticks on the clock's frames, the title sting, the
   recap bells, six soft in-world sounds, the outro, and the ceiling that keeps
   all of it 10 dB under the voice.
9. Built with `bash ../../assets/build.sh lesson60 lesson60-v8.mp4` from this
   folder (after `voice.py`): 3110 frames in about 5 minutes with 12 Chromes,
   -14.0 LUFS, 287 of 287 words heard, 29 of 29 tied words moving, every scene
   timed from the voice, 0.16 cuts a second.

## What is weak

The postmaster is never shown, only a pen and a hand. The book shot holds
still for about 2.5 s before it starts to move. There is a one-second moment
where neither of 42's windows is lit, which follows the narration and is true
of Pinot's two separate bitmap writes.
