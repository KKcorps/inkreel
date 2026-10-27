// ============================================================================
// compact: street 7, close, as night falls. A night crew with lanterns works the
// crane. On "rebuilds old streets" the crane lifts every dark house out, 42's old
// house 12 among them. On "without the dark houses" the lit houses close up and
// the street is shorter. Old rows stay until this runs, then only live ones remain.
// ============================================================================
const COMPACT_BASE = 872, COMPACT_S = 1.3, COMPACT_X0 = 230, COMPACT_STEP = 212;   // seven houses inside the closer shot
// street 7's houses in this shot: which are lit, and 42's old one with its plate
const COMPACT_HOUSES = [
  { lit: false }, { lit: true }, { lit: false, plate: '42' }, { lit: false }, { lit: true }, { lit: false }, { lit: true },
].map((h, i) => ({ ...h, i, x: COMPACT_X0 + i * COMPACT_STEP, body: HOUSE_INKS[(i * 5 + 1) % 6], roof: ROOF_INKS[(i * 3) % 4] }));
const COMPACT_JIB = 214, COMPACT_TOWER = 1680;   // low and near enough that the crane is in shot
function compactBase() {
  sky(0, 0, W, 620, 540);
  stars(0, 0, W, 380, 180, 91);
  moon(1480, 150, 42);
  hills(540, 30, mix(GRAPE, DEEP, .45), 92, mix(BLOSSOM_D, DEEP, .3));
  hills(560, 18, mix(INDIGO, GRAPE, .25), 93, null);
  const floor = rough([[0, 566], [W, 560], [W, H], [0, H]], 3, 94, 40);
  inkFill(floor, [0, 556, W, H - 556], mix(INDIGO, OCEAN, .35), 94, .1, 'cool');
  dots(floor, [0, 556, W, H - 556], { cell: 6, color: mix(OCEAN, RIVER, .2), density: .18, seed: 95, angle: 1.2 });
  // street 6 behind, small and far, so street 7 stands in a town
  for (let i = 0; i < 12; i++) house(40 + i * 150, 640, .62, { body: HOUSE_INKS[(i * 7 + 2) % 6], roof: ROOF_INKS[(i * 5 + 1) % 4], lit: i === 3 || i === 9, seed: 950 + i, haze: .25 });
  lights();
  // street 7's road
  const road = rough([[-20, COMPACT_BASE - 2], [W + 20, COMPACT_BASE - 2], [W + 20, COMPACT_BASE + 36], [-20, COMPACT_BASE + 36]], 2, 96, 30);
  inkFill(road, [-20, COMPACT_BASE - 2, W + 40, 40], mix('#B98C5A', DEEP, .55), 96, .1, 'warm');
  edge(subdiv([[-20, COMPACT_BASE + 36], [W + 20, COMPACT_BASE + 36]], 20, false), alph(DUSK[4], .5), 2, 97, { close: false, al: .6 });
  // the crane's tower and jib, which run across the top of the shot
  const wood = mix(TURMERIC, TURM_D, .35);
  c.save(); c.strokeStyle = wood; c.lineWidth = 9;
  c.beginPath(); c.moveTo(COMPACT_TOWER, COMPACT_BASE + 30); c.lineTo(COMPACT_TOWER, COMPACT_JIB - 60); c.moveTo(COMPACT_TOWER + 34, COMPACT_BASE + 30); c.lineTo(COMPACT_TOWER + 34, COMPACT_JIB - 60); c.stroke();
  c.lineWidth = 3.4; c.beginPath(); for (let y = COMPACT_BASE + 30; y > COMPACT_JIB - 40; y -= 40) { c.moveTo(COMPACT_TOWER, y); c.lineTo(COMPACT_TOWER + 34, y - 40); } c.stroke();
  c.lineWidth = 10; c.beginPath(); c.moveTo(40, COMPACT_JIB); c.lineTo(W + 40, COMPACT_JIB); c.stroke();
  c.lineWidth = 3; c.beginPath(); for (let x = 60; x < W; x += 46) { c.moveTo(x, COMPACT_JIB - 14); c.lineTo(x + 46, COMPACT_JIB + 6); } c.moveTo(40, COMPACT_JIB - 16); c.lineTo(W + 40, COMPACT_JIB - 16); c.stroke();
  c.restore();
  sign(214, COMPACT_BASE + 78, 'segment 7', { xh: 34, rot: -.03, post: 20, seed: 98 });   // in front of the street, below the crew's feet
}
const COMPACT_LAYER = () => layer('compact-base', compactBase, 1.3);

// a crew member with a hard hat and a lantern
function compactWorker(x, y, s, sway, seed) {
  c.save(); c.translate(x, y); c.scale(s, s);
  shadowOf(() => { c.beginPath(); c.ellipse(0, 0, 26, 7, 0, 0, TAU); c.fill(); }, 0, 2, 4, .45);
  const coat = rrect(-18, -78, 36, 60, 1.4, seed);
  inkFill(coat, [-18, -78, 36, 60], mix(OCEAN, DEEP, .2), seed, .1, 'cool');
  c.fillStyle = alph(LOCEAN, .9); c.fillRect(-18, -52, 36, 6);            // a reflective band
  c.strokeStyle = DEEP; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, -20); c.lineTo(-10, -2); c.moveTo(8, -20); c.lineTo(10, -2); c.stroke();
  c.fillStyle = '#F2C6A4'; c.beginPath(); c.arc(0, -92, 13, 0, TAU); c.fill();
  c.fillStyle = TURMERIC; c.beginPath(); c.arc(0, -96, 15, Math.PI, 0); c.fill(); c.fillRect(-19, -97, 38, 4);
  // the arm out, and the lantern swinging from it
  const lx = 30 + Math.sin(sway) * 4, ly = -52 + Math.cos(sway) * 2;
  c.strokeStyle = mix(OCEAN, DEEP, .2); c.lineWidth = 8; c.beginPath(); c.moveTo(12, -68); c.lineTo(lx - 2, ly - 16); c.stroke();
  c.strokeStyle = '#3A2410'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(lx - 2, ly - 16); c.lineTo(lx, ly - 8); c.stroke();
  c.fillStyle = mix('#FFD98A', TURMERIC, .3); c.beginPath(); c.roundRect(lx - 6, ly - 8, 12, 15, 2); c.fill();
  c.restore();
  return [x + lx * s, y + ly * s];
}

SCENE_DRAW.compact = (f, u, sc) => {
  const night = word('compact', 'night').s, word0 = word('compact', 'compaction').s;
  const lift0 = word('compact', 'rebuilds').s, without = word('compact', 'without').s;
  const WIDE = [940, 637, 1.22], CLOSE = [760, 660, 1.35];
  let cam = WIDE;
  if (f >= without - 2) cam = camMove(f, without - 2, without + 16, WIDE, CLOSE);
  cam = drift(cam, f, .5);
  showLayer(COMPACT_LAYER(), cam);
  ALL_LIT.length = 0;
  const lanterns = [];
  inCam(cam, () => {
    const dark = COMPACT_HOUSES.filter(h => !h.lit), lit = COMPACT_HOUSES.filter(h => h.lit);
    // the lit houses close up toward the start of the street, into the gaps
    const close = ease(seg(f, without - 1, without + 16));
    lit.forEach((h, j) => house(lerp(h.x, COMPACT_X0 + j * COMPACT_STEP, close), COMPACT_BASE, COMPACT_S, { body: h.body, roof: h.roof, lit: true, seed: 970 + h.i }));
    lights();
    // the dark houses: cables come down, then each is lifted out and away
    dark.forEach((h, j) => {
      const t0 = lift0 + j * 4, cable = easeOut(seg(f, t0 - 10, t0)), up = seg(f, t0, t0 + 26);
      const dy = -1200 * up * up, rot = Math.sin(up * 5 + j) * .05 * up;
      const cx = h.x + 146 * .5, peak = COMPACT_BASE - 109 - 57 + dy;
      if (up >= 1) return;
      // trolley on the jib, and its cable to the roof
      c.save(); c.fillStyle = '#3A2410'; c.fillRect(cx - 16, COMPACT_JIB + 4, 32, 14); c.restore();
      if (cable > 0) { c.save(); c.strokeStyle = alph('#1B1F2E', .9); c.lineWidth = 2.6; c.beginPath(); c.moveTo(cx, COMPACT_JIB + 18); c.lineTo(cx, lerp(COMPACT_JIB + 18, peak, cable)); c.stroke(); c.restore(); }
      c.save(); c.translate(cx, peak); c.rotate(rot); c.translate(-cx, -peak); c.translate(0, dy);
      house(h.x, COMPACT_BASE, COMPACT_S, { body: h.body, roof: h.roof, lit: false, seed: 970 + h.i, plate: h.plate || null });
      c.restore();
    });
    // the crane's board, painted as the word is said
    const bx = 1170, by = 262;                      // hung from the jib, inside the shot
    const board = rrect(bx, by, 300, 84, 2, 980);
    shadowOf(() => c.fill(board), 5, 6, 4, .4);
    inkFill(board, [bx, by, 300, 84], '#D9B27A', 980, .14, 'warm');
    c.save(); c.strokeStyle = '#3A2410'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx + 30, COMPACT_JIB + 14); c.lineTo(bx + 30, by); c.moveTo(bx + 270, COMPACT_JIB + 14); c.lineTo(bx + 270, by); c.stroke(); c.restore();
    handPart('compaction', seg(f, word0 - 1, word0 + 12), { x: bx + 150, y: by + 18, xh: 42, w: 6, color: INDIGO, center: true, seed: 981 });
    // the crew on the road, lanterns out
    // in the gaps between houses
    for (const [x, s, ph, seed] of [[406, 1.25, 0, 990], [830, 1.35, 1.7, 991], [1466, 1.25, 3.1, 992]]) lanterns.push(compactWorker(x, COMPACT_BASE + 60, s, f * .09 + ph, seed));
  });
  // night falls: the print goes down into indigo, then the windows and lanterns shine again
  const k = ease(seg(f, night - 4, night + 22));
  if (k > 0) {
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = alph('#28306A', k * .72); c.fillRect(0, 0, W, H); c.restore();
    inCam(cam, () => {
      for (const [x, y, s, kk] of ALL_LIT) { glow(x, y, 130 * s, TURMERIC, .55 * kk * k); glow(x, y, 28 * s, '#FFE9A8', .7 * kk * k); }
      stars(0, 0, W, 360, Math.round(140 * k), 99);
    });
  }
  inCam(cam, () => { for (const [x, y] of lanterns) { glow(x, y, 120, '#FFD98A', .35 + .35 * k); glow(x, y, 22, '#FFF1CC', .7); } });
};
