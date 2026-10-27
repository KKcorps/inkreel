# The printed surface

Read this before you tune any texture, and again whenever someone says a
render looks computed, harsh, or like a filter. It owns everything that
happens to the picture AFTER it is drawn. `press.md` owns how a shape gets
its colour in the first place.

Every number here was measured against a reference frame, not chosen.
`assets/printcheck.py` is the validator and it prints the same numbers.

## Contents

- The one decision
- Flat fill, clipped finish. Never halftone the whole sheet
- The finish is three passes over the composite
- Clustered grain, not per pixel noise
- Grain runs on the opponent axes
- Pores go toward paper
- Two blurs, and the drawing has to survive them
- What to measure, and the bands

## The one decision

**Controlled shapes and repeating patterns underneath. Soft, uneven ink
across their surfaces.**

Irregularity belongs to the SURFACE, not to the geometry. A wobbled
contour on a small shape does not read as hand-made, it reads as badly
drawn. The owl's eyes got arbitrary wobble on their outlines and looked
sloppy; the fix was to make the contour confident and let the ink be
uneven over it. Draw the shape you mean, then print it badly.

The corollary is that every shape underneath should be one you could name
and defend on its own, with the finish switched off. `?flat=1` on the
worked example does exactly that, and it is the fastest check there is.

## Flat fill, clipped finish. Never halftone the whole sheet

The first version of this owl wrote every mark as density onto five drums
and halftoned the whole sheet at the end. That is what a press physically
does and it is the wrong model.

A solid area only closes up when density reaches exactly 1, so at a 21px
screen the owl's face came out as a checkerboard of diamonds and every
edge stepped. The reference has a **solid** vermilion face with a crisp
edge AND a dotted background in the same frame, which the whole-sheet
model cannot produce.

So: fill a shape flat with a `Path2D`, then clip a dot screen inside it
as texture. A solid stays solid, a tint shows its rosette, and the edge
stays a curve. `press.md` owns this rule. The architecture is borrowed,
with thanks, from the `hand-drawn-canvas-animation` skill by alesha-pro
(MIT, github.com/alesha-pro/tools).

## The finish is three passes over the composite

Per shape texture can never make one printed surface, because every shape
gets its own treatment and the differences between them are exactly what
reads as collage. These run over the finished pixels and know nothing
about what is underneath, which is why they unify it.

1. **Soften.** Blur the whole composite, about 1 delivered pixel, before
   resolving down. Outlines, dots and fills soften together.
2. **Spread and grain.** One pixel walk: displace the channels, then add
   the grain and the pores.
3. **Absorb.** A second, much smaller blur, about 0.34px, AFTER the grain.
   Without it the grain sits on top as speckle instead of being part of
   the ink. This pass is cheap and it is the one people skip.

## Clustered grain, not per pixel noise

The single biggest difference between a computed surface and a printed
one. Calling `rng()` per pixel gives digital static. Ink mottles, which
means neighbouring pixels vary TOGETHER.

Build a few small tiling grids of roughly gaussian noise and sample them
bilinearly, at about four output pixels per texel.

```js
const GS = 260, gr = rng(4242);
const GRAIN = Array.from({ length: 4 }, () => {
  const d = new Float32Array(GS * GS);
  // three uniforms summed is near enough gaussian, and gaussian is what
  // stops it reading as a dither pattern
  for (let i = 0; i < d.length; i++) d[i] = (gr() + gr() + gr() - 1.5) * 2;
  return d;
});
```

Four grids: one luma, one red-green, one blue-yellow, and one sampled at
about a third of the frequency. That fourth coarse one drives both a slow
luma drift and the direction of the channel displacement, so the
misregistration wanders across the sheet instead of being constant.

Sample with bilinear interpolation, and make the channel displacement
subpixel and bilinear too. Integer offsets step, and a stepped fringe
reads as a coloured jaggy rather than as ink spread.

## Grain runs on the opponent axes

Measured on the reference, over five patches: in its dark mass the
red-green spread is **11.6** and the blue-yellow spread is **9.2**. Red
against green leads. It is speckle on the opponent axes, not neutral RGB
noise, and neutral noise measured wrong and looked wrong.

Those numbers are lower than an earlier draft of this file claimed, which
said 15.0 and 8.6. That reading came from a single sample patch that
clipped the edge of a bright dot. See the trap below.

So: one shared luma term across all three channels, then the two opponent
axes on top with separate amplitudes.

```js
const lum = (R*.299 + G*.587 + B*.114) / 255, ink = 1 - lum;
const amp = CHROMA * (.26 + .74 * Math.sqrt(ink));
const luma = (n*8 + coarse*4) * amp;
R += luma + rg*25*amp;
G += luma - rg*10*amp;
B += luma + by*17*amp;
```

Amplitude rises with ink, on a **square root** curve. Squared leaves the
midtones flat and piles everything into the darks, which is what the
owl's face looked like for two rounds.

## Pores go toward paper

Where the grain peaks and there is ink, the ink simply did not take.

```js
const pore = Math.max(0, n - .68) * ink * .31 * CHROMA;
R = lerp(R, 237, pore); G = lerp(G, 224, pore); B = lerp(B, 178, pore);
```

Toward the **paper colour**, never toward white. Lerping to white makes
the gaps read as holes punched in the sheet rather than as bare stock.

## Two blurs, and the drawing has to survive them

A one pixel blur is only affordable if the marks underneath are bold
enough to live through it. This is a pairing, not two independent knobs:

- coarse bold drawing + heavy softening → a print
- fine drawing + light softening → an illustration with grain on it
- fine drawing + heavy softening → mush, and the worst of the three

Porting a heavy finish onto a drawing full of thin tapered strokes took
the fine-detail number DOWN from 6.1 to 4.8, below where it started. The
fix is in the drawing: feather marks became compact filled wedges rather
than tapered strokes, hatching went from 1.5px at gap 9 to 2.8px at gap
13, and the mouth became one filled wedge instead of a stroke.

A related trap: an outline that randomly drops spans will eat a SHORT
path alive. The owl's mouth came out as a row of dots. Below about two
dozen spans, drop nothing.

## What to measure, and the bands

`python3 assets/printcheck.py mine.png reference.png`. Four numbers, each
next to what a real printed reference measures. With no reference of your
own, run it with one argument and it checks against the bands below.

All medians of five patches. These are the reference's own numbers, so a
build is aiming at the row, not at a band.

| number | what it is | reference | a bad build |
|---|---|---|---|
| `acut` | mean neighbour luma contrast, fine detail overall | 8.5 | 4.8 mush, 23 unsoftened |
| `chroma` dark mass | red-green / blue-yellow spread in the darkest mass | 11.6 / 9.2 | 3.1 / 2.4 with no finish |
| `chroma` pale field | the same in the palest field | 54.1 / 81.3 | 34 / 40 when dots overlap |
| `mottle` dark mass | luma spread in the dark | 9.2 | 4.3 no finish, 23.4 whole-sheet halftone |
| `mottle` pale field | luma spread in the field | 61.5 | under 45 when the dots have no paper to swing against |

**The bands are one subject's bands.** They come from a detail-dense
close-up with a near-black mass and a high-contrast pale field. A calm
seascape built the right way measured `acut` 3.7 and field chroma 22/30,
and was correct: it has no near-black and no shouting field. Run the
numbers against a reference image whenever you have one, and treat the
standalone bands as a sanity check rather than a target.

Three traps in reading them.

**The field's colour swing comes from the DOT STRUCTURE, not the grain.**
It needs paper surviving between the dots to swing against. Density sets
dot size and alpha sets saturation, so a pale lively field is small
strong dots, never big weak ones. Raising density past the point where
dots touch collapses the number.

**A dot halo fights the field.** The soft halo under each dot is what
stops it reading as a crisp circle placed on a colour, but it also fills
the paper gaps. At 0.26 alpha the field's chroma fell to 34. At 0.13 it
came back to 46. Tune the two together or you will chase your tail.

**One sample point is not a measurement.** This is the trap that cost the
most on this build. A single patch in the dark mass clipped the edge of a
17px dot and read 23 of variation in a mass that actually measures 9.
Three rounds went into flattening a dark that was never over-flecked, and
an earlier draft of this file taught that as the most repeated mistake
here. It was not. `printcheck.py` now takes five patches per region and
reports the median.

What the corrected numbers actually say: a dark with no finish at all
measures 4.3, the reference measures 9.2, and every build with the finish
on lands at 10.3 to 10.7. So the finish gets the dark about right and
very slightly over, and the only build that was genuinely far out was the
one using the whole-sheet halftone, at 23.4. Its problem was the
architecture, not the grain.
