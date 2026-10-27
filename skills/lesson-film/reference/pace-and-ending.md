# The start, the pace and the ending

Read this when you set the voice's speed, breaths and holds, and before you
plan the first and last scenes. All three were corrected by Kartik on the
approved lesson, and the start and end were then checked against Kurzgesagt.

## Contents

- The four beats, as stills
- How Kurzgesagt does it, measured
- The start
- Pace
- The ending

## The four beats, as stills

Open `stills/opening-and-ending.jpg` before you read the rest. It is the
approved lesson's first frame, the frame its cold open ends on, its title
sting and its last frame, with the frame number and the second on each. The
shape below is easier to copy once you have seen it land.

Three things to take from it. The first frame is already a picture, already
moving and already scored, so there is nothing to sit through. The question
is asked in a vignette that holds one house, so the viewer knows exactly what
is being asked about. The last frame brings the title back and takes it down
with the sound, which is why the ending reads as an ending and not a stop.

## How Kurzgesagt does it, measured

Kartik on v2: "the start feels abrupt. think how famous youtubers like
kurzgesagt in a nutshell ... start, end and pace the videos." These numbers
come from the caption timings of eight Kurzgesagt videos, read with
`youtube-transcript-api` on 25 Sep 2026 (Optimistic Nihilism, The Immune
System Explained I, What Is Life, Why Blue Whales Don't Get Cancer, The Egg,
Loneliness, The Fermi Paradox, Black Holes Explained).

- **The first word comes at once**, at 0.0 to 0.6 s in seven of eight. Music
  and picture are already running under it. There is no silent lead-in.
- **The first line is short, human and needs no context.** "Every second of
  your life, you are under attack." "At this very second, you are on a narrow
  ledge between life and death." "Cancer is a creepy and mysterious thing."
  "Everybody feels lonely from time to time." Five to twelve words, often
  "you", never a term the viewer has not met.
- **The cold open ends on the central question**, 9 to 53 s in. "Where do they
  come from... and what happens if you fall into one?" "How do you avoid that?
  And why are you alive?"
- **Then the words stop for a sting.** Black Holes: the question ends at 9.4 s
  and the next line starts at 15.7 s. What Is Life: the question at 48.4 s, the
  captions mark "[Amazing-sounding Kurz Intro Music]" at 53.3 s, and the next
  line is at 61.0 s. Five to eight seconds of music and picture, no voice.
- **The explanation starts on a grounding line.** "All life is based on the
  cell." "Stars are incredibly massive collections of mostly hydrogen atoms."
- **They talk at 146 to 184 words a minute** over the spoken span, as fast as
  our v1. What keeps it calm is the structure and the continuous picture, not
  a slow voice.
- **The end steps back from the mechanism to what it means**, and it is
  hopeful. "Life is awfully complicated, but if we take the time to understand
  it, we'll encounter endless wonders and great beauty." "Today, we are
  finally beginning to understand it and by doing so, one day we might
  finally overcome it." Then the music runs on: 20 s after the last word in
  Black Holes, over an end card.

## The start

v2 opened on "Parcel forty-two just moved house again", which assumes the
viewer already knows who parcel 42 is, and Kartik found it abrupt. v3 opens
the Kurzgesagt way:

1. **The picture and the tune are running from the first frame.** The camera
   starts on the dusk sky and the moon and tilts down onto the town while the
   first line is said.
2. **A first line anyone can take in**: "Every time you track a parcel, you
   only want one answer. Where is it right now?" It lands on the kid at the
   telescope, who is "you".
3. **Then the concrete world and the puzzle**, then the question: "So how does
   your query find only the newest one?"
4. **A title sting of about five seconds.** No voice. The title is written by
   hand across the sky and underlined, the tune states its motif in full and
   lands home, and the camera drifts toward where the answer starts. It is a
   line with `"hold": 4.6` in `<piece>.lines.json` and its own scene.
5. **A grounding first line for the explanation**: "It starts with the post."

## Pace

v1 ran 64 s with Kokoro at speed 1.12, 0.1 s between lines and 0.36 cuts a
second. Kartik: "I feel this was too fast paced". v2 ran 100 s with the same
pictures and he liked it. What changed, as numbers to start from:

- **Voice speed 1.0**, and 0.95 for the recap and payoff lines.
- **0.3 s breath** between lines, and each line starts on the next half beat.
- **A hold after each reveal**, set per line with `hold` in
  `<piece>.lines.json`: 0.9 s after the flip, 0.8 s after the late letter's
  window stays dark, 0.6 s after the question and after the query's answer,
  0.4 to 0.5 s after other scene ends.
- **A 3 s guess.**
- **The camera never holds still for more than about three seconds.** A long
  line over one picture gets a slow push toward the thing being named (the
  example's book shot drifts toward the "primary key map" label while it is
  said). A still frame under a talking voice is the monotone the ADHD viewers
  called boring.
- **About 0.2 cuts a second** came out of this. Say `pace: calm` on the card.

Do not speed the voice up to fit a length. Cut a scene instead, and say which.

## The ending

Kartik on v1: "the ending is abrupt". v1 said "Every house kept. One window
lit.", struck the home chord and faded in 2.9 s. He also asked that every film,
of any length, "fade off with a recap/payoff". The ending that works has these
parts, in order:

0. **Step back first, if the subject allows it.** Kurzgesagt ends on what the
   mechanism means and why that is hopeful. In a short lesson that is one line,
   folded into the closing line below.
1. **The recap**, one line that names the pieces: "So that's the whole trick.
   One road, one book, and two switches." The pictures are reprints of the
   film's own frames, landing one per phrase.
2. **The payoff**, the takeaway said on the whole picture: "Every house is
   kept, and only one window is lit." The picture shows it: a pennant rises
   over each of 42's houses, then all but one dim.
3. **A closing line that answers the opening**, addressed to the viewer and
   calling back its words: "So the next time you track a parcel, picture the
   town behind the answer, and the one window that's lit for you." The first
   line was "Every time you track a parcel...".
4. **The home chord** on the beat after the last word, with a run falling down
   the chord that leads home just before it (code-film `reference/story.md`,
   "The ending").
5. **The outro, then the fade.** About 12 s after the chord. The chord is
   held, the motif is said once more and then answered lower and slower, and
   the camera pulls back and then rises toward the sky, where the title comes
   back with the credit under it. That rise bookends the opening tilt down.
   The character settles (happy eyes, a small hop on the chord). Four seconds
   after the chord the picture and the sound fade together over the last
   eight. In the example: `"tail": 12.0` in `lesson60.lines.json`, `FADE0 =
   HIT + 96` frames in `core.js`, and `FADE_AFTER = 96` in the score.

Never cut to black on the chord, and never end on a line of narration.
