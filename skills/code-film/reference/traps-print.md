# Traps: the print finish

Read this when the look is riso or any print, before you tune the texture.
Every item is a way this has actually broken on a real build. Work it as a
checklist.

## Surface and print traps

Every one of these cost a round on the owl build. `surface.md` owns the
rules; this is the checklist. `assets/printcheck.py` measures the first
five.

- [ ] **Halftoning the whole sheet at a visible screen.** A solid only
      closes at density exactly 1, so a flat colour prints as a
      checkerboard of diamonds and every edge steps. Fine screen, the
      separations model is fine. Visible rosette, fill flat and clip the
      finish inside it. `press.md` owns the choice.
- [ ] **Per pixel `rng()` as grain.** That is digital static. Ink mottles,
      so neighbours have to vary together: sample a small tiling grid of
      gaussian noise bilinearly, about four output pixels per texel.
      This is the single biggest tell.
- [ ] **Neutral RGB noise.** Measured on a real reference, its dark
      mottles 15.0 red against green and only 8.6 blue against yellow.
      Grain runs on the opponent axes with separate amplitudes, over one
      shared luma term.
- [ ] **One blur instead of two.** A wide one before the grain, a small
      one after. Without the second, the grain sits on top as speckle
      instead of being absorbed into the ink.
- [ ] **Pores lerped toward white.** They read as holes punched in the
      sheet. Lerp toward the paper colour.
- [ ] **Integer channel offsets for misregistration.** They step, and a
      stepped fringe is a coloured jaggy. Displace subpixel and bilinear,
      with the direction driven by a slow noise octave so it wanders.
- [ ] **A heavy finish over a thin drawing.** This is a pairing, not two
      knobs. Porting a 1px blur onto a drawing full of thin tapered
      strokes took fine detail DOWN from 6.1 to 4.8, worse than before
      the finish existed. Bolden the drawing; do not back off the blur.
- [ ] **An outline that drops spans, on a short path.** The owl's mouth
      came out as a row of dots. Below about two dozen spans, drop none.
- [ ] **Wobble on the geometry instead of the ink.** Arbitrary wobble on
      a small contour reads as badly drawn, not hand made. Draw the shape
      you mean and print it badly. Controlled shapes underneath, uneven
      ink across them.
- [ ] **Chasing the field's colour with grain.** A pale field's colour
      swing comes from the DOT STRUCTURE, not the grain. It needs paper
      surviving between the dots. Small strong dots, never big weak ones.
- [ ] **Forgetting the dot halo fights the field.** The halo is what stops
      a dot reading as a crisp circle on a colour, and it also fills the
      paper gaps. At 0.26 alpha the field's chroma collapsed; at 0.13 it
      came back. Tune the two together.
- [ ] **Trusting one sample patch.** The trap that cost the most here. A
      single patch in the dark clipped a bright dot, read 23 against a
      true 9, and sent three rounds into flattening a dark that was fine.
      Five patches per region, median. `printcheck.py` does this now.
      Corrected numbers: no finish 4.3, reference 9.2, any build with the
      finish on 10.3 to 10.7.
