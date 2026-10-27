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

// ================================ THIS PIECE ================================
// The world's facts, built from facts.md. Every scene reads these, so every view of the world agrees.
// The approved example keeps its rows, the moments each change happens (as frames from words) and
// small functions that answer "is this row on at frame f" here. See examples/parcel42-lesson/film/core.js.
const WORLD = {};
const AT = {};                                   // e.g. AT.flip = word('swap', 'dark').s

// Scenes. By default one scene per spoken line, starting two frames before it, so the page runs as
// soon as the voice exists and every scene shows a placeholder until its file draws it. Replace this
// with your own list: [id, first frame], each start two frames before a word. A scene arrives by a hard cut unless
// its entry has a move, set after this list: SCENES.find(s => s.id === 'desk').move = { kind: 'dive', x: 1210, y: 430 }.
const SCENES = CUES.lines.map((l, i) => [l.id, i ? lineStart(l.id) - 2 : 0])
  .map(([id, start], i, a) => ({ id, start, end: i + 1 < a.length ? a[i + 1][1] : TOTAL }));
// ============================== END THIS PIECE ==============================
const SCENE = id => SCENES.find(s => s.id === id);
const SCENE_DRAW = {};                           // scenes/*.js fill this: SCENE_DRAW.id = (f, local, scene) => {}

// ---- moves between scenes (code-film reference/moves.md) ------------------------------------
//   dive  a disc opens on (x, y) inside the last picture, holds, then grows until the new scene fills the frame
//   iris  the new scene opens out of (x, y) over bare ground (`ground`, DEEP by default)
// Put the disc on the thing the next place grows out of: a window, a lens, a letter. Both start on the scene's
// first frame, so on a word. Never crossfade two whole scenes
const MOVE_FRAMES = { dive: 20, iris: 12 };      // at 24 fps. a move that crosses the frame needs eight frames or more
const OPEN_R = 170;                              // a dive first opens this big, inside the last picture
const MOVEC = document.createElement('canvas'); MOVEC.width = W; MOVEC.height = H;
const MOVEG = MOVEC.getContext('2d');
const coverR = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)) + 8;
function moveRadius(mv, u) {
  const R = coverR(mv.x, mv.y);
  if (mv.kind === 'dive') return u < 8 ? OPEN_R * easeOutBack(seg(u, 0, 5)) : lerp(OPEN_R, R, ease(seg(u, 8, MOVE_FRAMES.dive)));
  return R * ease(seg(u, 0, MOVE_FRAMES.iris));
}

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
  const { x = 0, y = 0, xh = 30, color = NIGHT, w = xh / 7, seed = 3, slant = .18, al = 1, pencil = false, center = false } = o;
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

// ---- the frame --------------------------------------------------------------------------------
const DRAFT = Q.get('draft') === '1';            // textures on, print finish off, for quick checks
function sceneAt(f) { let s = SCENES[0]; for (const x of SCENES) if (f >= x.start) s = x; return s; }
function placeholder(id, f) {
  c.fillStyle = DEEP; c.fillRect(0, 0, W, H);
  hand(id + ' ' + f, { x: W / 2, y: H / 2 - 40, xh: 80, color: CREAM, center: true, seed: 9 });
}
const drawScene = (sc, f) => (SCENE_DRAW[sc.id] || ((ff) => placeholder(sc.id, ff)))(f, f - sc.start, sc);
// a scene arriving by a move: the last scene or bare ground, then the new one seen through a growing disc. the new
// one settles from a little closer as the disc fills, and is exactly itself when the move ends, so nothing jumps
function drawMove(f, sc, mv) {
  const i = SCENES.indexOf(sc), r = moveRadius(mv, f - sc.start), k = r / coverR(mv.x, mv.y);
  if (mv.kind === 'dive' && i > 0) drawScene(SCENES[i - 1], f);
  else { c.fillStyle = mv.ground || DEEP; c.fillRect(0, 0, W, H); }
  if (r <= 1) return;
  const prev = c; c = MOVEG;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.lineCap = 'round'; c.lineJoin = 'round'; c.clearRect(0, 0, W, H);
  try { drawScene(sc, f); } finally { c = prev; }
  const s = 1 + .18 * (1 - k);
  c.save(); c.beginPath(); c.arc(mv.x, mv.y, r, 0, TAU); c.clip();
  c.translate(mv.x, mv.y); c.scale(s, s); c.translate(-mv.x, -mv.y); c.drawImage(MOVEC, 0, 0); c.restore();
  // a rim in the dark ink, broken like every edge, gone before it reaches the corners
  edge(ell(mv.x, mv.y, r, r, 72), NIGHT, 5, 7, { al: .85 * (1 - seg(k, .6, .95)) });
}
function drawFrame(f) {
  c = BIG; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.clearRect(0, 0, W, H);
  const sc = sceneAt(f), mv = sc.move;
  if (mv && f - sc.start < MOVE_FRAMES[mv.kind]) drawMove(f, sc, mv); else drawScene(sc, f);
  if (FLAT || DRAFT) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(big, 0, 0); } else finishPrint();
  const k = seg(f, FADE0, TOTAL - 1);
  if (k > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,8,22,${ease(k)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
