# Traps: the sound

Read this when you make the sound, and after any note on it. `sound.md` owns
the rules. Every item is a way this has actually broken on a real build. Work
it as a checklist.

## Sound traps

- [ ] **Hits buried under the kit.** The picture's own moments sat 30 to 40 dB
      under the kick, so the one layer that was in sync was the one nobody
      heard. Hits are the loud layer. See `sound.md`.
- [ ] **A sub bass mix is a thud on a laptop.** 93 percent of the energy under
      120 Hz lost 15 dB through a 250 Hz highpass. `soundcheck.py` reports it
      as `laptop`.
- [ ] **A hit with no edge cannot be timed.** Put a click above 2 kHz on the
      front of every hit, and keep the ceiling at 9 kHz.
- [ ] **Knocks in the kick band read as a second kick.** Keep toms above
      160 Hz.
- [ ] **Calibrate a gate on the reference before trusting it.** The old
      ceiling gate wanted 48 dB between the low band and 8 to 16 kHz. The fly
      measured 47 and would have failed. It is 40 now.
- [ ] **If you add a noise bed, two poles is not a low pass.** 6 dB an octave
      leaves it at 2 to 4 kHz as hiss. Use four, and measure octave bands in an
      event free stretch, because mean and peak will not show hiss.

- [ ] **Auto energy measures ground brightness, not the mechanism.** Light
      ground acts read four to six times the dark ones from the same camera
      drift, so the energies score.py derived were nonsense. When grounds
      differ, set `ENERGY` per act from the story.
- [ ] **A breath or rest miss is usually one second.** A ground flip on the one
      silent second made it measure as the loudest-motion second. Print motion
      and loudness per second and the bad point is obvious.
- [ ] **A high sync number is not music.** The ledger film put a pluck on every
      pen stroke and strike, scored 91 percent sync, and Kartik heard beeps.
      Write the tune first, and give accents only to the story's turns.
      `sound.md` owns it.
