# Traps: moves and time

Read this when you plan the transitions, the camera or the beat grid, and
after any note on a join. `moves.md` and `time.md` own the rules. Every item
is a way this has actually broken on a real build. Work it as a checklist.

## Anchor and move traps

`moves.md` owns these rules. This is the checklist.

- [ ] **A montage with nothing pinned.** Twenty scenes joined by hard cuts,
      each composed on its own, read as a slideshow. Pin one anchor, and draw
      every scene so it lands on something that matters.
- [ ] **A dive that opens at full size.** The first dive opened its disc to
      full size in four frames and covered the old disc before anyone saw it
      open, so the move read as a cut. Open small inside the old picture,
      hold, then dive.
- [ ] **A disc over a scene on one press.** One set of inks per frame, so the
      lower scene reprints in the upper scene's inks and its corners change
      colour on the cut. Print the upper scene on the second press, `over()`.
- [ ] **A cache that borrows a live press.** `bake()` once rendered scenes on
      press 1 and reset it, which wiped the disc the archive had already
      printed there. Every frame that baked a new medallion lost the disc, a
      one frame flash. The contact sheet cannot show it. `seamcheck.py` found
      it on its first run. Bake on a press of its own.
- [ ] **The second voice vanishes in its own glow.** The pink dot inside the
      pink glow could not be seen. Give it a pool of bare paper, `halo: true`.
- [ ] **The anchor sinks into a mid-dark scene.** At a darkness threshold of
      .42 the paper halo came in too late and the dot merged with the scene.
      It is .33 now. `seamcheck.py` reports a pinned frame with no dot of the
      anchor's size.
- [ ] **A steep curve on a short move.** At 18 fps a six frame dive on
      easeInOutCubic did two thirds of its growth in two frames, and the
      archive's five frame pull back did the same. Both read as a jump. Eight
      frames or more, on the quad. `moves.md` owns the rule.
- [ ] **Every move on one easing.** The engine had one `ease`, so every move
      had the same shape. Arrive on easeOutCubic, leave on easeInQuad, pop on
      easeOutBack.
- [ ] **A cut that is not declared.** The ending's cut from night to paper sat
      inside one act, so seamcheck called it a pop. Make it two shots, or list
      the span in the act's `moves`.
- [ ] **Check the joins, not only the shots.** Run `seamcheck.py` on the
      captured frames and render a strip of `?f=` stills round every act
      boundary. The contact sheet shows one frame of each shot and nothing
      between.

## Time traps

- [ ] **Acts that are not whole beats.** The picture was cut at 26, 34 and 44
      frames, no tempo could land on those cuts, and the score chased the
      picture for three builds. `beats(n)`, events on `fa % 4 === 0`, and the
      score names the same beats. `check.py` blocks it. See `time.md`.
- [ ] **One clock doing two jobs.** A kit that restarted in every act at a
      tempo fitted to the act measured as in sync and sounded like broken
      beats. Music on one tempo for the whole loop. Nothing in the picture
      layer is a kick or a chord.
- [ ] **Fixing the sound when the picture is the variable.** Three builds
      changed only the score. The fourth changed the page and everything fell
      into place. When the sound feels wrong, look at the frame counts first.
- [ ] **Runs that start with the act, not with the motion**, on a page you
      cannot rebuild. An act writes its caption first and moves later. Use
      `run_over`, `knocks` and `span` from `motion.txt`, and check the printed
      spans against the contact sheet.
- [ ] **Cadences that flam against the hats.** A run every 3 frames under a
      sixteenth of 4 frames beats against the kit. Write runs in the grid's
      unit.
- [ ] **Sync numbers cannot see a broken beat.** The build that restarted the
      pulse per act passed every sync number. Run `soundcheck.py` and
      `verify.py`, then watch and listen to the whole clip once. Nothing measures a run that
      starts a beat before the rows land.
- [ ] **`rest` and `edge` read pixels, not story.** Rows landing are single
      dots at 120 pixels, so an act full of events measures as still, and the
      grid build sat at REVIEW on both while every cut was on a kick. A REVIEW
      there is a prompt to listen, not a fault to fix.
