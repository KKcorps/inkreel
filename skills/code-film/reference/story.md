# The story

Read this before you write a caption or cut an act. It owns the shape of the
piece and the words in it.

## Contents

- Pick a shape first
- What persists
- Words that read like a voice
- The reader model, for any piece with words
- The connective ratio
- Cutting the paragraph across acts
- The ending
- Silence

## Pick a shape first

The first three pieces this skill made all had the same shape. A promise, a
mechanism, something dies in the middle, it comes back, a twist, the promise
broken. That was the worked example's shape, and with one example to copy,
every piece copied it. The films in `gallery.md` have many different shapes.
Pick one on purpose and name it in the act sheet. The five below are shapes
that worked, not a menu. A new shape is welcome: name it, and say what
persists, where it turns and how it ends.

- **A journey and return.** One subject crosses many places and ends where it
  started, changed. The paper boat is written as a letter, sails through a
  lake, a storm, a sunset and a night, and unfolds back into the letter. For a
  system: a request, a record, a message, crossing the parts of the system.
- **A montage on a motif.** One visual idea recurs while the scenes around it
  change completely. Concentric circles are a record, a wave's curl, fireworks,
  a ferris wheel, and the piece returns to the bare circles. For a system: one
  shape that every component turns out to contain.
- **A life cycle with cutaways.** A subject grows through stages, and the piece
  cuts between the lived scene and a schematic of what is happening inside.
  The fly is an egg, a larva, a pupa, a fly, and every stage has a blue cutaway.
  For a system: a thing being built, with the diagram of its insides between
  scenes.
- **A promise, its cost, its failure.** The mechanism is shown keeping a
  promise, then what it costs, then the case where it breaks. None of the six
  films uses it. It suits a failure story and nothing else.
- **A call and its answer.** Someone asks, and the answer comes back changed.
  In the town a girl sends Claude one question, "what do you love?". Claude
  answers with a montage of the things it loves, with itself inside each
  picture, and the answer flies back to her window. For a system: a query and
  its answer, a leader and a follower, a replica catching up.

A story with a second voice needs three things the others do not.

- **The low point is a subtraction.** Take things off the sheet one at a
  time: the colour drains to one ink, the pictures scatter, the kit stops,
  and one dot sits on bare paper for two beats. Loss drawn by adding a sad
  picture reads as a slide. Loss drawn by taking the picture away is felt.
- **The second voice is hinted before it is seen.** A pink glow creeps in
  from a corner and pink rings roll in from off the sheet a beat before the
  camera finds the dot. Arriving unannounced reads as a cut to a new piece.
- **The two are told apart by colour and pitch, not by labels.** Give each
  voice its own ink and its own note, a minor third apart. Every call and
  response after that needs no caption.

## What persists

Whatever the shape, one thing persists through every act and every act draws
it. In the journey it is the subject. In the montage it is the motif. In the
cycle it is the creature. In the failure story it is the state of the
machine. In the call and its answer it is the question, carried out and
carried back. It is what makes a piece a story rather than an anthology of
feature pictures, and it is the "thing to follow" in `gallery.md`.

## Words that read like a voice

The approved Parcel 42 film first shipped with words that were a record: a
question, rows of data, pencil labels, and a closing line. Kartik said they
felt boring and read like separate phrases next to the music videos. The
difference was never where the words sat. It was how they read. Here is the
pop-punk video, shot by shot: "I've never even seen a band. / So I built a
guitar out of math, / and a drummer out of noise, / a bass made out of numbers,
/ and the singer? That's my voice."

- **One line of thought.** The words across the whole film are one paragraph,
  cut into pieces. "so", "and" and "but" join each piece to the last.
- **Someone is speaking.** The character, the narrator, the singer. A label or
  a row of data has no speaker, so it reads as a list.
- **A pattern, then a payoff.** Repeat a frame ("then I got packed", "then I got
  shipped") until the viewer can predict it, then break it at the turn.
- **Each word lands with its picture and on the beat.** The noun appears as its
  thing appears. The key word gets a colour or a marker.
- **Two sizes with two jobs.** Small words carry the running line. Giant words
  carry the hook or the refrain, and appear only at the turns.
- **Play with the words** where the topic allows it. "I don't dig through the
  crates, I dig through the code."

This holds whatever the text choice on the card. In-world words, captions and
lyrics are all written as one paragraph first. Labels on objects are fine as
well, but they are not the words, and they never replace the voice.

## The reader model, for any piece with words

If the piece has any words, write them as one paragraph first, eight to twelve
sentences of prose, before any code. Save it next to the page as
`piece.chain.txt`, and `build.sh` hands it to the gate. Then run the reader model down it.

- **What they know.** Only what earlier sentences told them. A pronoun with no
  referent is the most common failure. "It only sees the lit ones" is fine if
  the last sentence lit something.
- **What they are asking.** Every sentence raises the next question, and the
  next sentence answers it or raises the stakes.
- **What they are feeling.** Give them the conclusion a beat before you state
  it. Hand them each word before you spend it.

Promise first, not chronology. The mechanism is explained by what it is for,
then how it works, then what that costs. A feature list is what you get when
you start from the parts.

## The connective ratio

Paste the caption chain together as one paragraph and count.

```
and    how many times you joined with and
logic  how many times you joined with so, but, except, because, only
```

Ratio under 1.0 means you wrote a list. Over 2.0 means you wrote an argument.
`assets/check.py` does the count when you hand it a chain file and flags
anything under 1.0. One early piece went from 0.64 to 2.20 with no new facts, purely
by restructuring.

A wordless piece, when the person it is for asks for one, has no chain to count, and its
argument is in what the subject does next.

Two more tells that the ratio will not catch.

- **A dead beat.** Delete the sentence. If nothing is lost, it was filler.
- **An unpaid thread.** A line that promises something the piece never returns
  to. Long range payoffs are what make it feel written rather than assembled.

## Cutting the paragraph across acts

Write the paragraph as prose first. Then cut it. Do not write acts and bolt
captions on afterwards, which is how you end up with a list.

- One sentence may run over a cut. "so the old row can only go dark" ends one
  act, three beats happen, and "never go away" finishes the clause in the next.
- A sentence may span three acts.
- One word can be a whole act. A single huge word at a turning point is the
  strongest thing in the piece.
- Every act is a whole number of beats, `beats(2)` or `beats(4)`, 16 frames a
  beat. The score shares that grid, so a cut on a beat is a cut on a kick, and
  the events inside an act sit on sixteenths. `check.py` blocks an act that is
  not. See `time.md`.

## The ending

Every piece before this one ended mid sentence, and Kartik said so: "it feels
like we are midway into the story and it is cut off". Two causes, both
structural. The chord progression cycled four chords and the last bar landed
on whichever came up, in the one-row piece the V, the chord that most wants to
continue. And the kit played to the last frame and faded, which is how a loop
seams, not how a piece ends. The references hold a final card for two to four
seconds with the music resolved.

- **Every film, of any length, ends on a recap or payoff and fades off.** Kartik
  asked for this on 25 Sep 2026. After the final hit the chord rings and the
  picture and the sound fade out together over a few seconds. A narrated
  lesson's longer ending is in `lesson-film`'s `reference/pace-and-ending.md`.
- **The last act is the ending, it starts on a bar line, and it resolves.**
  `score.py` treats the last act as the ending by default. Two bars is the
  default shape: an outro bar on the chord that leads home, then the final hit
  on the next downbeat, on the home chord, struck once and left to ring. Each
  piece picks how it gets there: which chord leads home, a run up or down or
  none, the kit on the hit or the chord alone (`sound.md`). What stays fixed
  is the goal. The first version was a hit, a fade and a lone pluck after it,
  and Kartik heard it as "off and detached from the jolly theme". The ending
  has to be the theme resolving, not a coda bolted onto it. Nothing plays
  after the hit.
- **The picture holds a still.** The subject at rest, where the shape says it
  ends. The boat back on the desk as the letter. The cat asleep on its
  pillow. One framing, no second shot, `{ travel: 1 }` so the camera does not drift toward
  the title.
- **Something lands with the final hit.** The letter settles on the desk on
  the downbeat of the final hit, so the eye and the ear get the same downbeat.
- **The closing line writes on in the middle of the ending**, not at its edge,
  and a small credit mark appears in the last beat. Then the frame holds.
- **The loop seam is not the ending.** A piece is watched once as an MP4. Write
  the ending for that viewer. `ENDING = None` in the score makes a seamless
  loop for the rare case that wants one.

## Silence

Silence for one beat before a turn earns the turn. Silence across three acts
because the paragraph had no line for them does not, and the reviewer will ask for it
fixed. When a captioned act has no sentence, write one that extends the
argument rather than restarting it as a feature list.

The picture has to earn every act on its own even when there is a caption.
The caption says something about the picture. It is not the picture.
