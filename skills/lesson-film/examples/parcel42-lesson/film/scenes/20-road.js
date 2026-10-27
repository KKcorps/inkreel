// ============================================================================
// road: the valley just below the hill. Letters come over the horizon to one
// fork. Every letter for 42 takes the near road to this post office. Letters for
// other keys turn off toward far post offices, partition 1 and partition 2.
// On "partition" the partition 3 sign, on "one server" the post office door.
// road's layer and paths are shared with 70-snail.js, which is set on the same road.
// ============================================================================
const ROAD_J = [960, 494];                      // the fork, at the foot of the far hills
const ROAD_PO = { x: 440, base: 965, s: 2.0 };  // our post office, low enough that the far roads pass above its roof. door centre x = x + 95 * s
const ROAD_DOOR = [ROAD_PO.x + 95 * ROAD_PO.s, ROAD_PO.base];
// the three roads as centrelines, far to near, and how wide each is where it passes
const ROAD_PATHS = {
  r3: bez([[[960, 494], [1010, 560], [1170, 612]], [[1170, 612], [1330, 668], [1200, 776]], [[1200, 776], [1060, 880], [860, 950]], [[860, 950], [720, 984], [ROAD_DOOR[0] + 10, 976]]], 26),
  r1: bez([[[960, 494], [760, 516], [560, 540]], [[560, 540], [420, 556], [ROAD_PO_FAR1()[0], 578]]], 22),
  r2: bez([[[960, 494], [1160, 514], [1360, 536]], [[1360, 536], [1500, 552], [ROAD_PO_FAR2()[0], 580]]], 22),
};
function ROAD_PO_FAR1() { return [200 + 47, 578]; }
function ROAD_PO_FAR2() { return [1590 + 47, 580]; }
// arc length along a polyline, so a letter moves at an even pace
function roadLens(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
const ROAD_LEN = Object.fromEntries(Object.entries(ROAD_PATHS).map(([k, p]) => [k, roadLens(p)]));
function roadPoint(key, t) {
  const p = ROAD_PATHS[key], L = ROAD_LEN[key], d = clamp(t, 0, 1) * L[L.length - 1];
  let i = 1; while (i < L.length - 1 && L[i] < d) i++;
  const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k), Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0])];
}
// perspective: things near the valley floor's front are bigger
const roadScale = y => lerp(.42, 1.45, Math.pow(clamp((y - 494) / (940 - 494), 0, 1), 1.1));
// a road as a filled band around its centreline, wider as it comes toward us
function roadBand(key, ink, seed, wmul = 1) {
  const p = ROAD_PATHS[key], left = [], right = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
    const hw = (3 + 62 * Math.pow(clamp((p[i][1] - 494) / (940 - 494), 0, 1), 1.25)) * wmul;
    left.push([p[i][0] - dy / n * hw, p[i][1] + dx / n * hw]); right.push([p[i][0] + dy / n * hw, p[i][1] - dx / n * hw]);
  }
  const path = P([...left, ...right.reverse()]);
  inkFill(path, [0, 480, W, 600], ink, seed, .12, 'warm');
  dots(path, [0, 480, W, 600], { cell: 6, color: mix(ink, DEEP, .35), density: .2, seed: seed + 1, angle: .9 });
  edge(left, alph(DUSK[4], .55), 1.8, seed + 2, { close: false, al: .55 });
}
function roadBase() {
  sky(0, 0, W, 560, 480);
  stars(0, 0, W, 300, 130, 71);
  moon(1690, 120, 38);
  hills(472, 28, mix(GRAPE, DEEP, .45), 61, mix(BLOSSOM_D, DEEP, .3));
  hills(490, 16, mix(INDIGO, GRAPE, .25), 62, null);
  const floor = rough([[0, 492], [W, 488], [W, H], [0, H]], 3, 63, 40);
  inkFill(floor, [0, 486, W, H - 486], mix(INDIGO, OCEAN, .35), 63, .1, 'cool');
  dots(floor, [0, 486, W, H - 486], { cell: 6, color: mix(OCEAN, RIVER, .2), density: .18, seed: 64, angle: 1.2 });
  // far streets round the far post offices, so they read as other towns' post offices
  for (const [x0, seed] of [[40, 65], [1470, 66]]) for (let i = 0; i < 4; i++) house(x0 + i * 52, 560 + (i % 2) * 4, .34, { body: HOUSE_INKS[(i + seed) % 6], roof: ROOF_INKS[(i + seed) % 4], seed: seed * 10 + i, lit: i === 2, haze: .3 });
  lights();
  roadBand('r1', mix('#D9B27A', DUSK[3], .45), 67, .55);
  roadBand('r2', mix('#D9B27A', DUSK[3], .45), 68, .55);
  roadBand('r3', mix('#D9B27A', DUSK[3], .3), 69);
  postOffice(200, 578, .5);
  postOffice(1590, 580, .5);
  sign(300, 596, 'partition 1', { xh: 28, rot: .04, post: 60, seed: 72 });
  sign(1500, 588, 'partition 2', { xh: 28, rot: -.04, post: 50, seed: 73 });   // below road 2, so its letters pass above it
  // trees along the near road, for depth
  for (const [x, b, s, seed] of [[1420, 700, .9, 74], [1520, 760, 1.1, 75], [260, 760, 1.05, 76], [1660, 860, 1.3, 77], [90, 900, 1.4, 78], [1080, 640, .7, 79]]) tree(x, b, s, seed);
  postOffice(ROAD_PO.x, ROAD_PO.base, ROAD_PO.s);
  sign(1330, 676, 'partition 3', { xh: 36, rot: -.05, arrow: 40, post: 96, seed: 80 });
  // the same name on the post office itself: this building is partition 3's one server
  { const s = ROAD_PO.s, px = ROAD_DOOR[0] + 26 * s, py = ROAD_PO.base - 44 * s, pw = 44 * s, ph = 15 * s;   // right of the door, under the lantern
    const plate = rrect(px, py, pw, ph, 1, 81); shadowOf(() => c.fill(plate), 3, 4, 3, .35);
    inkFill(plate, [px, py, pw, ph], '#D9B27A', 81, .12, 'warm');
    hand('partition 3', { x: px + pw / 2, y: py + ph * .18, xh: ph * .5, w: 3, color: INDIGO, center: true, seed: 82 }); }
  const v = c.createRadialGradient(W * .5, H * .55, 380, W * .5, H * .5, 1300);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,14,40,.4)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}
const ROAD_LAYER = () => layer('road-base', roadBase, 2.6);

// an envelope for a key, hopping along its road
function roadEnvelope(x, y, s, label, hop = 0, al = 1) {
  if (al <= 0) return;
  c.save(); c.globalAlpha = al;
  c.save(); c.filter = `blur(${3 * s}px)`; c.fillStyle = 'rgba(0,8,20,.45)'; c.beginPath(); c.ellipse(x, y + 4 * s, 34 * s * (1 - hop * .25), 7 * s, 0, 0, TAU); c.fill(); c.restore();
  c.translate(x, y - (26 + hop * 16) * s); c.rotate(Math.sin(hop * 3) * .06);
  const ew = 72 * s, eh = 48 * s;
  const env = rrect(-ew / 2, -eh / 2, ew, eh, .9 * s, 400 + label.length);
  inkFill(env, [-ew / 2, -eh / 2, ew, eh], '#F7F1E1', 401, .05, 'warm');
  c.strokeStyle = alph('#C9B28A', .95); c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(-ew / 2, -eh / 2); c.lineTo(0, 2 * s); c.lineTo(ew / 2, -eh / 2); c.stroke();
  c.fillStyle = label === '42' ? TURMERIC : [OCEAN, JADE, BLOSSOM][label.length % 3]; c.fillRect(ew / 2 - 16 * s, -eh / 2 + 4 * s, 11 * s, 13 * s);
  hand(label, { x: -4 * s, y: -6 * s, xh: 24 * s, w: 3.4 * s, color: label === '42' ? INDIGO : OCEAN, center: true, seed: 402 + label.length, slant: .1 });
  c.restore();
}
// the letters: [road, key, start in frames from the word "one" in "this one road", frames to travel].
// 42's always take r3. The first cut timed these from frame 0, and when the voice moved later for the
// new opening every letter had arrived before the scene was on screen. Time them from the words.
const ROAD_MAIL_ONE = [
  ['r3', '42', -140, 150], ['r3', '42', -74, 150], ['r3', '42', -24, 150], ['r3', '42', 30, 150],
  ['r1', '17', -110, 120], ['r2', '58', -84, 120], ['r1', '23', -48, 110], ['r2', '9', -28, 110],
  ['r2', '31', 2, 110], ['r1', '64', 24, 110], ['r2', '5', 52, 110],
];
// the same flow again, 200 frames on, so letters keep coming while the partition is named and the door opens
const ROAD_MAIL = [...ROAD_MAIL_ONE, ...ROAD_MAIL_ONE.map(([k, l, f0, d]) => [k, l, f0 + 200, d])];
function roadMail(f) {
  const one = word('road', 'one').s;
  // far to near, so a near letter covers a far one
  const live = ROAD_MAIL.map(([key, label, f0, dur]) => ({ key, label, t: (f - one - f0) / dur }))
    .filter(m => m.t > 0 && m.t < 1.02)
    .map(m => ({ ...m, pt: roadPoint(m.key, m.t) }))
    .sort((a, b) => a.pt[1] - b.pt[1]);
  for (const m of live) {
    const [x, y] = m.pt, s = m.key === 'r3' ? roadScale(y) : Math.max(.72, roadScale(y));
    const hop = Math.abs(Math.sin((m.t * 150) * .42));
    const al = Math.min(seg(m.t, 0, .04), 1 - seg(m.t, .96, 1.02));
    roadEnvelope(x, y, s, m.label, hop, al);
  }
}
// the door opens and lamplight comes out of it
function roadLantern(k) {
  const s = ROAD_PO.s, x = ROAD_DOOR[0] + 34 * s, y = ROAD_PO.base - 70 * s;
  c.save(); c.strokeStyle = '#3A2410'; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(x - 10 * s, y - 14 * s); c.lineTo(x, y - 14 * s); c.lineTo(x, y - 6 * s); c.stroke();
  c.fillStyle = mix('#FFD98A', TURMERIC, .4); c.beginPath(); c.roundRect(x - 5 * s, y - 6 * s, 10 * s, 13 * s, 2 * s); c.fill();
  c.strokeStyle = INDIGO; c.lineWidth = 1.4 * s; c.stroke(); c.restore();
  glow(x, y, 60 * s, '#FFD98A', .45 + .25 * k);
}
function roadDoorLight(k) {
  if (k <= 0) return;
  const s = ROAD_PO.s, dx = ROAD_DOOR[0] - 20 * s, dy = ROAD_PO.base - 62 * s, dw = 40 * s, dh = 62 * s;
  c.save(); c.fillStyle = mix('#FFD98A', TURMERIC, .3); c.fillRect(dx, dy, dw * ease(k), dh); c.restore();
  glow(ROAD_DOOR[0], ROAD_PO.base - 30 * s, 160 + 260 * k, '#FFD98A', .55 * k);
}

SCENE_DRAW.road = (f, u, sc) => {
  const WIDE = [960, 590, 1.08], NEAR = [900, 660, 1.3], SIGN = [1440, 716, 2.0], DOOR = [ROAD_DOOR[0] + 8, 850, 2.4], IN = [ROAD_DOOR[0] + 4, 868, 2.62];
  const one = word('road', 'one').s, part = word('part', 'partition').s, server = word('part', 'one').s;
  let cam = WIDE;
  if (f >= one - 2) cam = camMove(f, one - 2, one + 14, WIDE, NEAR);
  if (f >= part - 3) cam = camMove(f, part - 3, part + 13, NEAR, SIGN);
  if (f >= server - 2) cam = camMove(f, server - 2, server + 20, SIGN, DOOR);
  if (f >= server + 20) cam = camMove(f, server + 20, sc.end, DOOR, IN);
  cam = drift(cam, f, .6);
  showLayer(ROAD_LAYER(), cam);
  inCam(cam, () => {
    roadLantern(seg(f, server - 2, server + 20));
    roadMail(f);
    roadDoorLight(seg(f, server + 6, sc.end - 2));
  });
};
