# The words

Read this before you write a single line. It owns the script: how it sounds,
how it joins, and how it maps onto scenes.

## Contents

- Write the explanation, then cut it
- What went wrong in the first cut
- Hinges
- The line that names the real thing
- One world per sentence
- Checks before recording

## Write the explanation, then cut it

Write the whole script as one paragraph first, in one voice, talking to one
smart friend who does not know the subject. Save it as `<piece>.chain.txt`.
Only then cut it into lines in `<piece>.lines.json`, one line per change in the
picture. Several lines may share a scene.

Write from the viewer's changing picture. At each line, know what they believe,
what question is alive, and what the next picture will change. The voice is
someone who noticed something worth sharing, not a narrator reading labels.
code-film's `reference/story.md` "Words that read like a voice" and the
connective ratio apply here too.

## What went wrong in the first cut

Kartik on v1: "the language felt a bit terse and doesn't flow naturally from
one frame to next as a conversation". v1 was written as lines first. Each line
was true, and each one stood alone:

> Every letter for forty-two takes one road, to one post office.
> That's the partition, so one server sees them all.
> The postmaster keeps one address book: the primary key map.
> Forty-two lives on street seven, house twelve, since fourteen oh eight.

v2 was written as a paragraph first, then cut. The same facts, joined:

> So how does your query find only the newest one? It starts with the post:
> every letter for forty-two comes down this one road, to this one post
> office. That's the partition, and it means one server sees every update for
> forty-two. Inside, the postmaster keeps an address book, one line per key.
> In Pinot, that's the primary key map. Right now, it says forty-two lives on
> street seven, house twelve, since fourteen oh eight.

What changed: the answer starts by pointing back at the question ("It starts
with..."). "And it means" says why the partition matters. "Inside" carries the
viewer through the door. "Right now" sets up the change that is coming. The
v2 script is about 40% longer and it is the one he liked.

## The first line

The first line needs no context and speaks to the viewer's own life. v2's
first line named a character the viewer had never met, and the start felt
abrupt. v3's is "Every time you track a parcel, you only want one answer.
Where is it right now?" Kurzgesagt's are five to twelve words: "Every second
of your life, you are under attack." See `pace-and-ending.md` for the whole
opening. The last line calls the first one back.

## The viewer's side of the conversation

The viewer is talking back the whole time, so meet their reactions in the
lines themselves, not in one question card. Say the wrong guess out loud when
the film is about to prove it wrong ("you might expect Pinot to erase the old
row"). Answer the obvious objection where it arises ("And the dark houses?"
after the query is exactly that). And when a fix sounds too easy, give room for
"if it were that simple, why isn't it always done?". The pause to guess is one
of these moments, not the only one.

## Hinges

A hinge is where one scene hands over to the next. Read each pair aloud: the
last line of a scene and the first line of the next. The new line should pick
up the live question, not announce a new topic. The example's hinges:

- "...how does your query find only the newest one?" then "It starts with the post:"
- "...one server sees every update for forty-two." then "Inside, the postmaster..."
- "...he flips two switches." then "House twelve goes dark..."
- "...one bit for every row." then "But suppose a letter shows up late."
- "...its window stays dark." then "That's why your query, this telescope, only reads the lit windows."
- "...only reads the lit windows." then "And the dark houses?"

Joining words that did real work: so, but, because, and it means, then, now,
right now, that's why, inside, next time. Filler that did none: "well", "now
let's look at".

## The line that names the real thing

Each metaphor gets one spoken line that names what it stands for, said once,
where the picture shows it: "That's the partition", "In Pinot, that's the
primary key map", "Those switches are the valid doc IDs bitmap". The picture
carries the same term as an in-world label at that moment. After that, use the
world's words. Do not keep switching names for the same thing.

The thing comes first, always. The viewer meets the road, sees it do its job,
and only then hears "that's the partition". A term said before its thing is
on stage is a bare word, and the viewer has nothing to hang it on. v8 asked
"how does your query find only the newest one?" eleven lines before the
telescope showed up and "this telescope" made the link. For those eleven
lines "query" meant nothing in the picture. It said "compaction" over a crew
the voice never mentioned. Either bring the thing on first ("so how does the
kid's telescope find only the newest one?") or keep the question in plain
words until the naming line ("so how do you find only the newest one?").

This holds for every real word, not only the ones in `"terms"`. A word such
as "flush", "commit", "evict" or "closed" is a term too if the viewer has to
learn it. Either give it a thing and a naming line, or say it in the world's
words and never say it at all.

## One world per sentence

Outside its naming sentence, a sentence lives in one world. When a sentence
is about a thing in the world, its nouns, verbs and states all come from that
world too. The real system's word for a state does not go on a world noun.

- A garden where each flower is a segment: "the flowers are closed" puts the
  database's word (a closed segment) on a flower. Flowers do not close like
  that. Say what a flower does: "this flower has stopped growing", "it has
  gone to seed", "it has died". Then the naming line says it once: "a flower
  that has stopped growing is a closed segment".
- "Nothing gets overwritten, and only one window is lit" joins two worlds with
  an "and". "Every house is still standing, and only one window is lit" stays
  in the town.
- "The address book gets updated" is the system talking. "The postmaster
  rewrites the line" is the world.

The fix always comes from the map (`teaching.md`, "One thing per term"),
written before the paragraph: each term has its thing, and each real state and
action has a verb in the world. If the world has no verb for a state, the metaphor is the
wrong one for this term, so change the thing rather than borrow the word.

The one place the two worlds meet is the naming sentence ("each house is a
row"). The recap and the payoff can come back to the real terms when they are
where the viewer lands, but each one is a decision, not an accident.

## Checks before recording

- Read every absolute word (never, always, every, all, only, nothing) against
  the whole film, not just its own scene. v3 said "Pinot never knocks the old
  house down" in the hook and "Every house is kept" in the payoff, and between
  them the compaction scene showed a crew knocking the dark houses down.
  Kartik: "why do we say, pinot doesn't knock old house down or something? i
  feel that's wrong phrase??" v5 says what is true at that moment, in the real
  term first: "Pinot doesn't overwrite its old row, so every house it ever
  lived in is still standing." and "Nothing gets overwritten, and for each key,
  only one window is lit."
- Say every term aloud once, where the picture shows it, in the plain words of
  the world first: "each house is a row, and each street is a segment".
  `scriptcheck.py` fails a term in `"terms"` that is never said, and lists
  words drawn on screen that the voice never says.
- Fill in `"things"` (each term's thing in the world) and `"tech"` (the real
  system's verbs and states that the world must not say: closed, flushed,
  overwritten, updated) in lines.json. `scriptcheck.py` blocks a term with no
  thing, or one said before its thing is, and lists each sentence that puts a
  world noun next to a real word outside its naming sentence.
- Read each world sentence and ask if someone in that world would say it. A
  gardener says "stopped growing", never "closed".
- Give a metaphor's action only after the viewer knows what the metaphor maps.
  "Knocks the old house down" came before anyone had said a house is a row, so
  it read as an odd thing for a database to do. Say the real action, and let
  the picture carry the world.

- Read the chain aloud without the pictures. Every sentence should follow from
  the one before it.
- Read each hinge pair aloud.
- Say numbers the way the voice should say them, as words: "fourteen oh
  eight", not "14:08". The captions put the digits back.
- Keep every word a scene is tied to present exactly once in its line, or give
  the tie an index (`word('swap', 'the', 1)`). A word used twice in one line
  ties to the first, which is how a cue lands a second early.
- Run `check.py` with the chain to get the connective ratio. The example's is
  about 1.3.
