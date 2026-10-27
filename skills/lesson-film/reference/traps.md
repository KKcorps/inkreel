# Traps

Read the Story section before the sketches, and the rest before the first
render and after any note on one. Every way a lesson broke, as a checklist.
code-film's `reference/traps-*.md` files hold the ones for any code-drawn film.
This skill uses its story, print and sound ones, at the moments SKILL.md names.

## Contents

- Story
- Words and voice
- Picture
- Sound and timing
- Captions
- Delivery

## Story

- [ ] The sketches are three new worlds for this topic. A shared sketch or an
      approved film sets the craft bar, never the world. code-film's
      `reference/references.md`, "Take the craft, leave the world", has the
      Codex run that copied the depot for a lesson on deletes.
- [ ] An approval does not carry to the next topic. That run wrote "The user
      explicitly chose the existing depot look by accepting the prior film" on
      its card and skipped the sketches for the two-minute follow-up.
- [ ] The example's town, depot, switchboard and parcel are off limits for a
      new lesson, and so are its kit's `parcel()`, `house()`, `kid()` and
      `telescope()`. The template kit used to ship them, so every new film was
      one call away from the parcel. It now holds only the craft, and
      `sketchcheck.py` fails a source that calls them.

## Words and voice

- [ ] `scriptcheck.py` has no BLOCK, and every REVIEW has a decision. It found
      "segment" and "upsert" never said, and "Pinot" unintroduced, in a film
      that had passed every other check.

- [ ] Every term's thing is on stage before the term is said, and no world
      sentence borrows the system's verb. v8 said "query" eleven lines before
      the telescope, and "the flowers are closed" is the kind of sentence that
      leaves a viewer between two worlds (`words.md`, "One world per sentence").

- [ ] The script was written as a paragraph before it was cut into lines. v1
      was lines first and read as "terse" (`words.md`).
- [ ] Every tied word appears once in its line, or its tie has an index.
      "But what if..." before "What do you think happens?" would tie the guess
      to the first "what".
- [ ] Numbers are words in the lines, digits in the captions.
- [ ] `heard.py --write` ran after the last voice change, so `heard_lag` is in
      the cues. Without it the picture runs about 50 ms ahead of the sound.
- [ ] The voice was not sped up to fit a length (`pace-and-ending.md`).

## Picture

- [ ] Nothing is timed from a fixed frame number. `shiftcheck.py` passes. The
      road letters ran on frames 120 to 440 and vanished when a new opening
      moved the voice 12 s later. Kartik: "in previous versions ... there were
      mails flowing down the roads. this has [dis]appeared, why?" The word
      check had passed, because the camera still moved on the word.

- [ ] No scene holds a still camera for more than about three seconds under a
      talking voice. The v2 book shot held still for 4.5 s and read as dead.
- [ ] Every camera stays inside its layer. The first push-in ran off the town
      and showed a dark band on the right and the bottom.
- [ ] A position looked up from a drawn street exists. The first telescope
      shot panned from house 0, where a tree stood, threw, and rendered black
      with no error on screen. `?f=N` shows `ERR` in the title: read it.
- [ ] A later scene shows the world after every earlier change. The first
      payoff still drew 42's old house on street 7 after the compaction scene
      had lifted it out. Give the world state a phase for each change
      (`town({ phase: 'compacted' })` in the example) and use the latest one.
- [ ] Text fits its surface. The parcel's "42" first overflowed its label into
      the smile.
- [ ] A night pass is not so dark that the payoff disappears after the print
      finish. The first night multiply at 0.75 buried the ending, 0.5 read.
- [ ] The recap's first card lands close to the scene's first frame, or the
      scene opens on an empty desk.

## Sound and timing

- [ ] A short tail still fades. With four seconds or less after the chord, the fade
      started at or after the last frame, `seg` ran backwards, and a whole test
      film came out black while the seam, look and intent checks passed. `FADE0`
      is now capped before the end, `seg` treats a reversed range as a step, and
      `build.sh` fails any flat frame before the fade.

- [ ] No sound repeats at every scene change. v2's bright fill in 14 breaths was
      "too painful". Listen for anything that comes back more than three times.
- [ ] The music track, on its own, peaks at least 10 dB under the voice. Measure
      the stems, not the mix: a sound that lands on a word hides under the voice's
      own peak in the mix.
- [ ] Mastering raises everything when a loud part is removed. Check the
      in-world sounds again after any change to the music.

- [ ] The guess's ticks come from the page's frame for the pause, not the
      voice file's times.
- [ ] The score's fade starts on the same frame as the picture's.
- [ ] True peak is under -1 dBTP after mastering. `loudnorm` at `TP=-1` landed
      at -0.9, so the build asks for -1.5.

## Captions

- [ ] No cue overlaps the next. The first captions ran 0.16 s into the next
      cue.
- [ ] No word sits alone on a cue.

## Delivery

- [ ] No script is edited while a build runs it. v6 died at its last step when `build.sh`
      changed under it. `build.sh` is now one block that bash reads whole before it starts.

- [ ] A new file for every build. `build.sh` refuses to overwrite.
- [ ] The master is over the 30 MB chat limit. Send the preview and say where
      the master is.
- [ ] Old frame folders deleted. Each 100 s build leaves about 9 GB.
