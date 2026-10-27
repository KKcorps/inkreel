# Teaching in a film

Read this before the facts and the intent card. It says what the evidence
supports for teaching by video, for STEM viewers with short attention spans,
and what it does not. The sources were checked on 25 Sep 2026. Effect sizes are
from meta-analyses unless marked.

## Contents

- What landing on the word looks like
- What the evidence supports
- What it does not support
- The lesson's shape
- The guess
- The recap
- One thing per term
- Facts first

## What landing on the word looks like

Open `stills/on-the-word.jpg`. Four frames of the approved lesson, captioned
with the word each one is tied to. The switchboard is `validDocIds` and the
window beside it is the same rows as houses, so one picture carries the term
and the thing it names.

The two frames on the top row are four frames apart. In the first, house
twelve is lit. In the second the viewer hears "dark" and the house goes out,
and the switch above it drops at the same moment. That is the whole rule. A
change the viewer cannot tie to a word reads as decoration, and a word with
no change reads as a caption.

The bottom row is the other half of it. Only the part being explained moves,
so the late row arriving is the only thing that changes when the voice says
it is kept. `assets/wordsync.py` measures this and `assets/shiftcheck.py`
catches the cheat, which is an event timed from a fixed frame that happens to
look right until the voice moves.

## What the evidence supports

- **Cut what does not carry the idea.** Interesting extras that are off topic
  hurt learning across 68 studies (Sundararajan and Adesope 2020), and they hurt
  most for viewers with low working memory (Sanchez and Wiley 2006). A world
  with a face is fine. A detail that means nothing is not.
- **Put motion and colour only on the part being explained.** Signaling helps
  retention (g = 0.52) and transfer (g = 0.31) (Schneider 2018). In an eye
  tracking study of 16 adults with ADHD, animated cues caught the eye 90% of the
  time and new text 41% (Zhu et al., ASSETS 2026).
- **Draw each thing when the voice names it.** Watching a diagram being drawn
  beats seeing it finished (Fiorella and Mayer 2016), and text that arrived in
  sync with the words helped the ADHD viewers.
- **Narrate, and keep on-screen text to the terms.** Narration beats written
  text (d = 0.72) when the video sets the pace (Ginns 2005). Short key terms on
  screen beat full sentences (Adesope and Nesbit 2012). Full sentences go in
  the SRT, which viewers can turn on.
- **Talk to the viewer.** Conversational style helps transfer (d = 0.54)
  (Ginns, Martin and Marsh 2013). "Your query", "what do you think happens",
  "next time you look".
- **Ask, then answer.** Questions spread through a lecture halved mind
  wandering (Szpunar 2013, two experiments). Answering in your head works about
  as well as answering aloud (Smith, Roediger and Karpicke 2013), so a pause to
  guess works without any clicks. A prediction helps most when the answer
  surprises (Brod 2021).
- **Chunk it.** Breaks set by the video still help (d = 0.42 retention)
  (Rey 2019). Each scene is one chunk with one job.
- **Change the scene without jumping.** The ADHD viewers were thrown by abrupt
  switches and bored by monotone narration over still frames. Grow or move
  through the same world, and cut on a word when the place changes.

## What it does not support

- An "attention span of 8 seconds", or a drop at 10 to 15 minutes. Bradbury
  (2016) found no data behind either.
- A "pattern interrupt" every N seconds. That comes from creators reading
  retention graphs, which measure clicking away, not learning. ADHD viewers
  list pop-ups and sound effects as distractions (FocusView 2025).
- More stimulation for ADHD viewers. The one direct study found overload and
  boredom both fail.
- Burned-in full captions for learning. Nobody has tested it properly. Key
  terms on screen and an exact SRT are the supported choice.

## The lesson's shape

The approved lesson runs this way, and each step answers a need the step
before it created:

1. **A human first line, then a puzzle with a wrong guess in it.** "Every time
   you track a parcel, you only want one answer." Then "Pinot never knocks the
   old house down. So how does your query find only the newest one?" A
   newcomer's picture is that the old row is overwritten. The puzzle says it is
   not. A title sting follows (`pace-and-ending.md`).
2. **The mechanism, one piece per scene.** Where updates go, what is looked up,
   what is compared, what changes. Each piece is visible as a thing in the
   world and named once with its real term.
3. **A case that tests the rule.** The late letter. It only works because the
   viewer now holds the rule and can apply it.
4. **Why it matters for the viewer.** The query reads only lit windows.
5. **What happens after.** Compaction. It closes the question a smart viewer
   would ask next.
6. **The recap and the payoff.** See `pace-and-ending.md`.

A different topic may need a different order. What stays is that each scene
carries a question into the next one.

## The guess

Ask a question the viewer can answer with what they have just seen, then hold
for about three seconds with an in-world clock, then answer. The line before
the question must not give the answer away. The guess in the example is "what
do you think happens" to a letter that is older than the book, after the
viewer has seen a newer letter win. The pause has a clock that ticks on the
score's ticks, and the parcel looks at you. No answer is shown until the next
line.

## The recap

Bring back the earlier pictures, not new ones. The example reprints three of
its own frames as postcards that land on the words "one road, one book, and
two switches". A recap that shows new pictures makes the viewer learn again
instead of remember.

## One thing per term

Every term the lesson teaches gets its own thing in the world, and that thing
does what the real one does when the voice says the term. In the approved
lesson the road and post office are the partition, a street is a segment, a
house is a row, a lit window is its bit in `validDocIds`, the address book is
the primary key map, the scale is the comparison, the telescope is the query
and the crew is compaction. That is eight terms and eight things, and each one
moves on its word.

A term that only appears as text on a prop has no thing. A Codex lesson on
deletes put TTL on a ruler labelled `deletedKeysTTL = 28` and the guard on a
plate reading `enableDeletedKeysCompactionConsistency = true`, and chapter
titles did the teaching. The parcel was the only metaphor left, and the film
stayed at one desk for two minutes. Write the map in the plan before you draw,
one line per term with its thing and the action it takes on its word. If a
term has no thing, find one or cut the term.

The map also gives every real state and action a verb from the world, since
the script will need them: a segment is a street, a closed segment is a
street where no more houses get built, a row is a house, a hidden row is a
house with a dark window. The voice uses these verbs in every world sentence
(`words.md`, "One world per sentence"). A map with only nouns leaves the
writer to borrow the system's verb, which is how "the flowers are closed"
happens.

## Facts first

On every rewrite of the script, re-derive each claim from `facts.md` and the
source, never from the last script. "Pinot never knocks the old house down"
survived from v1 to v3 because each rewrite trusted the one before it. This is
the blog-writer skill's "verify inherited claims", for films.

Write `facts.md` before any drawing: each claim, and the file, class or line in
the real source that says so. The example's has eight claims checked against
apache/pinot master, from the map's type to the `>=` tie rule to which query
code reads the bitmap. The world state in the page (`K42`, `AT` in the
example's `core.js`) is built from that file, and every scene draws from the
world state, so the book, the board and the street never disagree. A metaphor
gets one spoken line naming the real thing ("that's the primary key map"), and
a label with the real term appears in the world ("validDocIds" on the board's
brass plate).
