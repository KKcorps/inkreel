// ============================================================================
// The film's core: the voice clock, the world's facts, layers and the camera.
// Every scene draws the whole frame into `c` from the frame number alone.
// ============================================================================
const FPS = 24;
const CUES = /*CUES*/;
// ?shift=2 moves the whole voice two seconds later. shiftcheck.py renders both and compares them, so any event
// timed from a fixed frame number instead of a word shows up. ?nodrift=1 holds the camera's slow drift still for it
const SHIFT = +(Q.get('shift') || 0), NODRIFT = Q.get('nodrift') === '1';
if (SHIFT) { for (const l of CUES.lines) { l.start += SHIFT; l.end += SHIFT; for (const w of l.words) { w.s += SHIFT; w.e += SHIFT; } } CUES.hit += SHIFT; CUES.total += SHIFT; }
const LAG = CUES.heard_lag || 0;               // Kokoro's word times run ahead of the sound. heard.py measured it
const Fr = t => Math.round(t * FPS);
const TOTAL = Math.round(CUES.total * FPS);
const LINE = id => { const l = CUES.lines.find(x => x.id === id); if (!l) throw new Error('no line ' + id); return l; };
// a word's first and last frame, as heard. picture events land on the first
function word(id, w, n = 0) {
  const hit = LINE(id).words.filter(x => x.w === w)[n];
  if (!hit) throw new Error('no word ' + id + ':' + w + '#' + n);
  return { s: Fr(hit.s + LAG), e: Fr(hit.e + LAG) };
}
const lineStart = id => Fr(LINE(id).start + LAG), lineEnd = id => Fr(LINE(id).end + LAG);
const HIT = Fr(CUES.hit);                      // the final chord
const FADE0 = Math.min(HIT + 96, TOTAL - 36);    // four seconds after the chord, or a second and a half before the end on a short tail. the score's FADE_AFTER must match

// b at or before a is a step at a. a reversed range once faded a whole short film to black
const seg = (u, a, b) => b <= a ? +(u >= a) : clamp((u - a) / (b - a), 0, 1);
const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const easeOut = u => 1 - Math.pow(1 - u, 3);
const easeOutBack = u => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };

// ---- the world's facts. every scene reads these, so the street, the book and the board agree ----
// Parcel 42's rows, from facts.md. The time column is the comparison column.
const K42 = {
  rows: [
    { status: 'placed', time: '09:02', street: 5, house: 1 },
    { status: 'packed', time: '11:15', street: 6, house: 4 },
    { status: 'shipped', time: '14:08', street: 7, house: 12 },    // live when the film opens
    { status: 'delivered', time: '16:30', street: 8, house: 3 },   // arrives, is not older, becomes live
    { status: 'packed', time: '12:10', street: 8, house: 4, late: true }, // arrives late, is older, stays dark
  ],
  partition: 3,
};
// the moments the voice sets for the state changes, so a scene that shows the state before or after agrees
const AT = {
  mapLine: word('addr', 'forty-two').s,          // the book's line for 42 is written from here
  letterLands: word('lands', 'lands').s,         // the 16:30 letter drops on the desk
  weigh: word('flip', 'not').s,                  // the scale tips toward the new letter
  offOld: word('swap', 'dark').s,                // house 12's switch goes down, its window goes dark
  onNew: word('swap', 'lights').s,               // street 8 house 3's switch goes up, its window lights
  rewrite: word('swap', 'rewritten').s - 6,      // the book line is struck and rewritten
  snailIn: word('snail', 'snail').s,
  guess0: lineEnd('snail') + 2, guess1: lineStart('older') - 3, // the pause while you guess
  weighLate: word('older', 'older').s,           // the scale tips back: 12:10 is older than 16:30
  lateKept: word('older', 'kept').s,             // the late row is written into street 8, house 4, dark
  compact0: word('compact', 'rebuilds').s,
};
const liveRow = f => f >= AT.onNew ? 3 : 2;     // which of K42.rows the map points at, frame by frame
const isOn = (row, f) => row === liveRow(f) && !(row === 2 && f >= AT.offOld); // a row's bit
const rowExists = (row, f) => row < 3 || (row === 3 && f >= AT.letterLands) || (row === 4 && f >= AT.lateKept);

// ---- scenes: each starts two frames before its first line, so the cut leads the voice ----
const SCENES = [
  ['hill', 0], ['title', lineEnd('ask') + 6], ['road', lineStart('road') - 2], ['desk', lineStart('book') - 2], ['scale', word('lands', 'letter').s - 2],
  ['board', word('flip', 'two').s - 2], ['bits', lineStart('bits') - 2], ['snail', lineStart('snail') - 2],
  ['older', lineStart('older') - 2], ['query', lineStart('query') - 2], ['compact', lineStart('compact') - 2],
  ['recap', word('recap', 'one').s - 4], ['payoff', lineStart('payoff') - 2],
].map(([id, start], i, a) => ({ id, start, end: i + 1 < a.length ? a[i + 1][1] : TOTAL }));
const SCENE = id => SCENES.find(s => s.id === id);
const SCENE_DRAW = {};                           // scenes/*.js fill this: SCENE_DRAW.id = (f, local, scene) => {}

// ---- layers: a still background drawn once, then placed through the camera ----------------
const LAYERS = new Map();
function layer(key, draw, k = 1) {
  if (LAYERS.has(key)) return LAYERS.get(key);
  const cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  const g = cv.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round'; g.scale(k, k);
  const prev = c; c = g;
  try { draw(); } finally { c = prev; }
  const L = { cv, k }; LAYERS.set(key, L); return L;
}
// the camera: (cx, cy) in design units sits at the frame's centre, s is the zoom
function inCam(cam, fn) { c.save(); c.translate(W / 2, H / 2); c.scale(cam[2], cam[2]); c.translate(-cam[0], -cam[1]); fn(); c.restore(); }
function showLayer(L, cam = [W / 2, H / 2, 1]) { inCam(cam, () => c.drawImage(L.cv, 0, 0, W, H)); }
// an eased move from one camera to another between frames a and b
const camMove = (f, a, b, from, to) => { const k = ease(seg(f, a, b)); return from.map((v, i) => lerp(v, to[i], k)); };
// a slow drift so a held shot still breathes
const drift = (cam, f, amt = 1) => NODRIFT ? cam : [cam[0] + Math.sin(f * .011) * 5 * amt, cam[1] + Math.cos(f * .009) * 4 * amt, cam[2] * (1 + .004 * Math.sin(f * .013) * amt)];
// write text progressively by hand: k from 0 to 1 draws that share of the strokes
function handPart(text, k, o = {}) {
  if (k <= 0) return;
  const { x = 0, y = 0, xh = 30, color = INDIGO, w = xh / 7, seed = 3, slant = .18, al = 1, pencil = false, center = false } = o;
  let sc = script(text, { x: 0, y: 0, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  const ox = center ? x - sc.width / 2 : x;
  sc = script(text, { x: ox, y, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  const lens = sc.paths.map(p => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; });
  let left = lens.reduce((a, b) => a + b, 0) * clamp(k, 0, 1);
  for (let i = 0; i < sc.paths.length && left > 0; i++) {
    let p = sc.paths[i];
    if (left < lens[i]) { const q = [p[0]]; let L = left; for (let j = 1; j < p.length && L > 0; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (d <= L) { q.push(p[j]); L -= d; } else { const t = L / d; q.push([lerp(p[j - 1][0], p[j][0], t), lerp(p[j - 1][1], p[j][1], t)]); L = 0; } } p = q; }
    left -= lens[i];
    if (pencil) { const r = rng(seed + i); for (let pp = 0; pp < 4; pp++) { c.save(); c.globalAlpha = (.3 + r() * .2) * al; c.strokeStyle = color; c.lineWidth = w * (.5 + r() * .4); c.beginPath(); p.forEach(([px, py], j) => j ? c.lineTo(px + (r() - .5) * w * .5, py + (r() - .5) * w * .6) : c.moveTo(px, py)); c.stroke(); c.restore(); } }
    else nibStroke(p, w, color, { seed: seed + i, al });
  }
  return sc.width;
}

// ---- the brass scale, from sketch A, in this kit's inks. tilt > 0 drops the left pan ----------
const BRASS = '#C9962E', BRASS_D = '#8A5A08', BRASS_L = '#F2D27A';
function brassScale(px, base, beamY, tilt, { left = null, right = null, s = 1 } = {}) {
  c.save(); c.translate(px, base); c.scale(s, s); c.translate(-px, -base);
  const foot = P([[px - 110, base], [px + 110, base], [px + 80, base - 32], [px - 80, base - 32]]);
  shadowOf(() => c.fill(foot), 8, 10, 8, .4);
  inkFill(foot, [px - 110, base - 32, 220, 32], BRASS_D, 180, .12, 'warm');
  const post = P([[px - 16, base - 32], [px + 16, base - 32], [px + 10, beamY + 10], [px - 10, beamY + 10]]);
  inkFill(post, [px - 16, beamY, 32, base - beamY], BRASS, 181, .12, 'warm');
  dots(post, [px - 16, beamY, 32, base - beamY], { cell: 5, color: BRASS_D, density: .3, seed: 182, alpha: .5 });
  const L = [px - 210 * Math.cos(tilt), beamY + 210 * Math.sin(tilt)], R = [px + 210 * Math.cos(tilt), beamY - 210 * Math.sin(tilt)];
  c.save(); c.lineCap = 'round'; c.strokeStyle = BRASS_D; c.lineWidth = 16; c.beginPath(); c.moveTo(...L); c.lineTo(...R); c.stroke();
  c.strokeStyle = BRASS; c.lineWidth = 10; c.stroke(); c.strokeStyle = BRASS_L; c.lineWidth = 3; c.beginPath(); c.moveTo(L[0], L[1] - 3); c.lineTo(R[0], R[1] - 3); c.stroke(); c.restore();
  const hub = P(ell(px, beamY, 20, 20, 24)); inkFill(hub, [px - 20, beamY - 20, 40, 40], BRASS_L, 183, .1, 'warm');
  // the needle leans to the heavier side
  c.save(); c.strokeStyle = INDIGO; c.lineWidth = 4; c.beginPath(); c.moveTo(px, beamY); c.lineTo(px - Math.sin(tilt) * 100, beamY - 90); c.stroke(); c.restore();
  const pan = ([ex, ey], seed, item) => {
    const py = ey + 130;
    c.save(); c.strokeStyle = BRASS_D; c.lineWidth = 2.4;
    for (const o of [-62, 0, 62]) { c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + o, py); c.stroke(); }
    c.restore();
    const dish = P([[ex - 90, py], [ex + 90, py], [ex + 64, py + 26], [ex - 64, py + 26]]);
    inkFill(dish, [ex - 90, py, 180, 26], BRASS, seed, .12, 'warm');
    dots(dish, [ex - 90, py, 180, 26], { cell: 5, color: BRASS_D, density: .35, seed: seed + 1, alpha: .6 });
    const rim = P(ell(ex, py, 90, 10, 32)); inkFill(rim, [ex - 90, py - 10, 180, 20], BRASS_L, seed + 2, .1, 'warm');
    if (item) { c.save(); c.translate(ex, py - 4); item(); c.restore(); }
  };
  pan(L, 184, left); pan(R, 188, right);
  c.restore();
}
// a slip of paper for a scale pan: a time in big hand, a status above it
function slip(time, status, { ink = INDIGO, stampInk = BLOSSOM_D, seed = 300 } = {}) {
  const sp = rrect(-96, -150, 192, 146, 1.2, seed);
  shadowOf(() => c.fill(sp), 5, 6, 5, .35);
  inkFill(sp, [-96, -150, 192, 146], '#F7F1E1', seed, .06, 'warm');
  if (status) hand(status, { x: 0, y: -134, xh: 28, w: 4, color: OCEAN, seed: seed + 1, center: true });
  hand(time, { x: 0, y: -92, xh: 50, w: 6.6, color: ink, seed: seed + 2, center: true, slant: .08 });
  c.save(); c.strokeStyle = alph(stampInk, .7); c.lineWidth = 3; c.beginPath(); c.arc(62, -38, 24, 0, TAU); c.stroke(); c.restore();
}

// ---- the frame --------------------------------------------------------------------------------
const DRAFT = Q.get('draft') === '1';            // textures on, print finish off, for quick checks
function sceneAt(f) { let s = SCENES[0]; for (const x of SCENES) if (f >= x.start) s = x; return s; }
function placeholder(id, f) {
  c.fillStyle = DEEP; c.fillRect(0, 0, W, H);
  hand(id + ' ' + f, { x: W / 2, y: H / 2 - 40, xh: 80, color: CREAM, center: true, seed: 9 });
}
function drawFrame(f) {
  c = BIG; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.clearRect(0, 0, W, H); LIT.length = 0;
  const sc = sceneAt(f);
  (SCENE_DRAW[sc.id] || ((ff) => placeholder(sc.id, ff)))(f, f - sc.start, sc);
  if (FLAT || DRAFT) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(big, 0, 0); } else finishPrint();
  const k = seg(f, FADE0, TOTAL - 1);
  if (k > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,8,22,${ease(k)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
