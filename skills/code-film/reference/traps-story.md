# Traps: the story and the look

Read this before the card and the sketches, again before you show anything,
and when they share a reference. Every item is a way this has actually broken
on a real build. Work it as a checklist.

## Contents

- Story traps
- Look traps
- Comparison traps

## Story traps

- [ ] **Did you write the paragraph before the code?** See `story.md`.
- [ ] **A shared reference sets the craft bar, never the world.** See
      "Take the craft, leave the world" in `references.md`.
- [ ] **A fade must not un-write the words.** The refrain faded by shrinking how
      much of each word was drawn, so every word lost its last letter in its
      final frames: "the old one stays" read "the olc on> stay". Stills taken
      before the fade looked fine. Fade with opacity, and check a frame inside
      every fade-out.
- [ ] **A refrain must still sound like the voice.** "new line. old one off."
      read as a label, too terse. "the old one stays, just switched off." is a
      sentence, says the point, and sets up the closing line.
- [ ] **Labels and data are not words.** The Parcel 42 film's first words were a
      question, rows, "older", "primary key" and a closing line. Nobody spoke,
      nothing joined them, and they read as separate phrases. Write one voice
      as one paragraph, whatever the text choice.
- [ ] **Is the state persistent and simulated?** If each act builds its own
      world, you have an anthology. This is the big one.
- [ ] **Did you implement the paragraph you agreed, or find and replace over the
      old one?** This happened. The user approved a nine sentence paragraph and
      eight of its phrases never made it in, because the old captions were
      patched instead of replaced. When a paragraph is approved, it is the
      script. Delete the old copy and cut the new one up.
- [ ] **Is the connective ratio over 1.0?** `check.py` flags it under 1.0.
- [ ] **Does anything after the climax dissipate it?** Put maintenance and
      housekeeping acts before the turn, not after.
- [ ] **Does it end, or does it stop?** Four pieces ended on whatever chord the
      cycle reached, with the kit still going, and read as cut off midway. The
      last act starts on a bar line and resolves to the home chord on a
      downbeat, then nothing. The picture lands something on that downbeat
      and holds. See `story.md`.
- [ ] **A coda is not an ending.** A hit, a fade, and one lone pluck after it
      read as "off and detached from the jolly theme". Nothing plays after the
      final hit. The theme resolves, it is not followed by something else.
- [ ] **An even pace read as rushed.** At 24 fps with every act two to four
      beats, he asked for 0.75x. The films in `gallery.md` mostly run at 24 fps and
      read fine because their pace swings. Pick `FPS` and `BEAT` per piece and
      vary the pace inside it. `time.md` owns the pace curve.

- [ ] **Three skins of one idea.** The ledger film's sketches were tags, a
      ledger and windows, all showing rows switching off. The card had fixed
      the idea first. Sketch three different stories, then write the card.
- [ ] **One page with a camera is a slide deck.** The ledger film stayed on one
      sheet and measured one palette for 29 seconds. The loved explainers cut
      between a world you could live in and the diagram of its insides.

## Look traps

- [ ] **The engine was one piece's world.** For three pieces the template
      shipped a 24 by 24 grid of cells as "the engine", and every piece
      inherited a dot field on an indigo ground. The press is the engine. The
      world is yours. Three demo worlds in `engine.html` prove it, delete two.
- [ ] **Copying one film instead of learning from six.** every-row-twice
      redrew Kevin Ngo's flipbook shot for shot: the dot, the bell, the
      turntable, the ferris wheel, the medallions, the two-dot end card. It
      passed every gate and was still bad. Say which film in `gallery.md` the
      piece learns from and what it does that the film does not.
- [ ] **Pictures that mean nothing.** Twenty pictures chosen because the
      montage needed twenty. Say what each one means, in one line, before
      you draw it. If it only adds variety, cut it.
- [ ] **No one to care about.** A dot is a motif, not a character. Five of
      the six films have a character with a face or a body that acts.
- [ ] **Nothing you can name in the frame.** A rule against labels and arrows
      was read as a rule against drawing. Draw the thing. See `taste.md`.
- [ ] **Every act in the same three inks.** Re-ink the drums per act from the
      chart in `press.md`. One motif ink carries the piece.
- [ ] **Light ink over a dark flood prints black.** The blueprint act was empty
      until every line went through `lit()`. Stars, rain, foam, holes first.
- [ ] **Two captions in every act, in the same two places.** The text carried
      the meaning and every frame had the same layout. Decide text at the act
      sheet. The references have none.
- [ ] **One shape for every story.** Promise, cost, dies, comes back, twist.
      Three pieces, one arc, because there was one example. Pick a shape on
      purpose and name it, one of the five in `story.md` or a new one.
- [ ] **One shot per act, when the card says brisk.** Nine scenes over twenty
      seconds measured 0.4 cuts a second and read as a slideshow. A second
      framing on beat two, `cam(W, u)` with `u < .5`, and `{ travel: .75 }`,
      fixes it. A calm card is different, so check against the card.
- [ ] **A contact sheet you cannot tell apart.** Read `lookcheck.py` with the
      contact sheet open. It describes, it does not judge. every-row-twice
      measured fine and was still bad.

- [ ] **A film on one material measured as calm.** Eleven cuts between
      shots of the same cream page counted as three, because the old cut
      count only saw a change of palette. lookcheck now also counts framing
      cuts. If pace still misses, compare with the cut list the page declares
      before changing the film or the card.

## Comparison traps

- [ ] **Zoom six times into a flat area before you explain a reference.** It
      tells you whether the texture is a layer over art or the mechanism that
      made the picture, and that decides the whole answer. See
      `references.md`.
- [ ] **Do not assert a difference you have not measured.** The obvious claim
      about a reference having a wider palette was wrong by a factor that only
      showed up when it was counted.
- [ ] **Measure the reference per region, not as one image.** The owl's
      background varies most and its dark mass least, which is the
      opposite of what it looks like. Eye alone got three of the four
      surface properties backwards at least once.
- [ ] **Count the plates before you count the dots.** Reading two
      interleaved colour screens as one lattice made the first estimate
      of the pitch twice too fine, and every later number followed it.
- [ ] **Say which gaps are closeable and which are somebody else's drawing.**
      Promising to close the second kind by tuning wastes everyone's time.
