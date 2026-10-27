// ============================================================================
// An example scene, to copy. It builds one object to the finished look, in the order
// that makes it read as a thing in a place: a ground, a floor, light, a cast shadow,
// the body in ink, a lit top and a shade side, a halftone, a broken edge and a second
// plate. The block stands in for your own world's subject, so replace it. It rises on
// the line's first word, and the word is written by hand as it is said, so the scene
// moves on the word it is tied to and passes wordsync.py. Rename the file and the id.
// ============================================================================
SCENE_DRAW[SCENES[0].id] = (f, u, sc) => {
  const L = layer('example-ground', () => {
    const g = P([[0, 0], [W, 0], [W, H], [0, H]]);
    inkFill(g, [0, 0, W, H], mix(PAPER, ICE, .3), 1, .14, 'cool');
    dots(g, [0, 0, W, H], { cell: 7, color: SEA, density: .12, seed: 2, angle: 1.3 });
    const floor = rough([[-20, 700], [W + 20, 668], [W + 20, H + 20], [-20, H + 20]], 3, 3, 40);
    inkFill(floor, [0, 668, W, 412], mix(PAPER, SUN_D, .32), 3, .16, 'warm');
    hatch(floor, [0, 668, W, 412], { angle: .1, gap: 15, len: 44, color: SUN_D, alpha: .2, seed: 4 });
    glow(760, 380, 700, CREAM, .5);
  }, 1.2);
  const line = CUES.lines[0], first = word(line.id, line.words[0].w);
  const cam = drift(camMove(f, sc.start, sc.end, [960, 540, 1.0], [960, 560, 1.12]), f);
  showLayer(L, cam);
  inCam(cam, () => {
    const rise = easeOutBack(seg(f, first.s - 1, first.s + 10));
    exampleBlock(960, 760, 1, 40 * rise);
    handPart(line.words[0].w, easeOut(seg(f, first.s - 1, first.e + 4)), { x: 960, y: 820, xh: 96, w: 12, color: NIGHT, center: true, seed: 5 });
  });
};

// the stand-in object: a block lit from the upper left, sitting on the floor, lifted by `lift`
function exampleBlock(x, base, s, lift = 0) {
  const w = 340 * s, h = 250 * s, dx = 80 * s, dy = -56 * s, y = base - lift, x0 = x - w / 2, x1 = x + w / 2;
  const front = [[x0, y - h], [x1, y - h], [x1, y], [x0, y]];
  const top = [[x0, y - h], [x0 + dx, y - h + dy], [x1 + dx, y - h + dy], [x1, y - h]];
  const side = [[x1, y - h], [x1 + dx, y - h + dy], [x1 + dx, y + dy], [x1, y]];
  const box = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; };
  // the shadow stays on the floor and softens as the block lifts
  shadowOf(() => c.fill(P(ell(x + 60 * s, base + 4 * s, w * .66, 30 * s))), 0, 0, 14 * s + lift * .3, .42 - lift * .004);
  const frontP = rough(front, 2.4, 11), topP = rough(top, 2.4, 12), sideP = rough(side, 2.4, 13);
  inkFill(frontP, box(front), mix(SEA, MINT_D, .35), 11, .12);
  inkFill(topP, box(top), mix(MINT, PAPER, .45), 12, .1, 'warm');
  inkFill(sideP, box(side), mix(SEA, DEEP, .5), 13, .12, 'cool');
  hatch(sideP, box(side), { angle: -.7, gap: 8, len: 16, color: DEEP, alpha: .35, seed: 14 });
  // the halftone darkens toward the floor, which is what gives the front its turn
  dots(frontP, box(front), { cell: 8, color: DEEP, density: (px, py) => .08 + .42 * clamp((py - (y - h)) / h, 0, 1), seed: 15 });
  fringe(frontP, MINT, 3, 2, .45);
  for (const [pts, seed] of [[front, 16], [top, 17], [side, 18]]) edge(subdiv(pts, 14), NIGHT, 3.2 * s, seed);
  glow(x0 + w * .3, y - h - 10 * s, 220 * s, CREAM, .35);
}
