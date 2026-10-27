const Q = new URLSearchParams(location.search);
const FLAT = Q.get('flat') === '1';
const W = 1920, H = 1080, TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
function rng(a) {
  a = (a * 1000003) >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(hex(a).map((v, i) => lerp(v, hex(b)[i], t)));
const alph = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };

// ---- the inks: five hues, and dusk mixes of them ---------------------------------
const INDIGO = '#002654', DEEP = '#001E43', OCEAN = '#145C84', RIVER = '#21C6DC', LOCEAN = '#99E4F0';
const TURMERIC = '#FFC61F', TURM_D = '#8A5A08', JADE = '#37D992', JADE_D = '#0F7A52', GRAPE = '#6F42C1';
const BLOSSOM = '#F94F8D', BLOSSOM_D = '#C01A5B', PAPER = '#F3EFE3', CREAM = '#F5EEDC';
const DUSK = [DEEP, '#1E2462', '#4B2F74', '#933F77', '#DA6A5F', '#F4A94B'];
const HOUSE_INKS = [mix(OCEAN, DEEP, .15), mix(GRAPE, DEEP, .35), mix(BLOSSOM_D, DEEP, .38), mix(LOCEAN, DEEP, .45), mix(OCEAN, GRAPE, .5), '#9C7E62'];
const ROOF_INKS = [mix(INDIGO, DEEP, .3), mix(BLOSSOM_D, DEEP, .55), mix(OCEAN, DEEP, .55), mix(GRAPE, DEEP, .6)];
const DARK_WIN = '#15203F';

const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');
cvs.width = W; cvs.height = H;
const big = document.createElement('canvas'); big.width = W; big.height = H;
const BIG = big.getContext('2d');
let c = BIG;                                   // the target. layer() points it at a cached canvas while it draws
c.lineCap = 'round'; c.lineJoin = 'round';

// ---- the ink coverage field: plates take unevenly, in different places per ink --------
function octave(seed, N) {
  const r = rng(seed), f = [];
  for (let i = 0; i < (N + 1) * (N + 1); i++) f.push(r());
  return (x, y) => {
    const u = clamp(x / W, 0, 1) * N, v = clamp(y / H, 0, 1) * N;
    const x0 = Math.min(N - 1, u | 0), y0 = Math.min(N - 1, v | 0), ax = u - x0, ay = v - y0;
    const sx = ax * ax * (3 - 2 * ax), sy = ay * ay * (3 - 2 * ay);
    const a = f[y0 * (N + 1) + x0], b = f[y0 * (N + 1) + x0 + 1], p = f[(y0 + 1) * (N + 1) + x0], q = f[(y0 + 1) * (N + 1) + x0 + 1];
    return (a * (1 - sx) + b * sx) * (1 - sy) + (p * (1 - sx) + q * sx) * sy;
  };
}
const field = seed => { const lo = octave(seed, 9), hi = octave(seed + 91, 29); return (x, y) => lo(x, y) * .68 + hi(x, y) * .32; };
const FIELD = { ink: field(67), warm: field(23), cool: field(51) };
const cov = (base, amt, which = 'ink') => (x, y) => clamp(base * (1 - amt + 2 * amt * FIELD[which](x, y)), 0, 1);

// ---- shapes ------------------------------------------------------------------------
const P = (pts, close = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (close) p.closePath(); return p; };
function subdiv(pts, step, close = true) {
  const out = [];
  const n = close ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / step));
    for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
  }
  if (!close) out.push(pts[pts.length - 1]);
  return out;
}
const jit = (pts, amp, seed) => { const r = rng(seed); return pts.map(p => [p[0] + (r() - .5) * amp, p[1] + (r() - .5) * amp]); };
const rough = (pts, amp, seed, step = 16) => P(jit(subdiv(pts, step), amp, seed));
const rrect = (x, y, w, h, amp, seed) => rough([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], amp, seed, Math.max(6, Math.min(w, h) / 3));
const bez = (segs, per = 18) => {
  const out = [];
  for (const [p0, p1, p2] of segs) for (let i = 0; i <= per; i++) { const t = i / per, m = 1 - t; out.push([m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0], m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1]]); }
  return out;
};
const ell = (cx, cy, rx, ry, n = 48, rot = 0) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, x = rx * Math.cos(a), y = ry * Math.sin(a); p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return p; };

// ---- ink ---------------------------------------------------------------------------
// a flat fill whose coverage drifts: the solid, then paper knocked back where the ink took badly
function inkFill(path, box, color, seed, bite = .12, which = 'ink') {
  c.save(); c.fillStyle = color; c.fill(path); c.restore();
  if (FLAT || bite <= 0) return;
  const f = FIELD[which], r = rng(seed), [bx, by, bw, bh] = box, n = Math.min(900, bw * bh / 260 | 0);
  c.save(); c.clip(path); c.fillStyle = PAPER;
  for (let i = 0; i < n; i++) {
    const x = bx + r() * bw, y = by + r() * bh, k = 1 - f(x, y);
    if (k < .52) continue;
    c.globalAlpha = bite * (k - .5) * 2 * (.4 + r() * .9);
    c.beginPath(); c.arc(x, y, 1.4 + r() * 3.6, 0, TAU); c.fill();
  }
  c.restore();
}
// a dot screen clipped inside a shape, its density drifting with the field
function dots(path, box, o = {}) {
  const { cell = 7, color = INDIGO, density = .4, angle = .26, jitter = .14, seed = 1, alpha = 1, which = 'ink', vary = .25 } = o;
  if (FLAT) return;
  const r = rng(seed), dens = typeof density === 'function' ? density : cov(density, vary, which);
  c.save(); c.clip(path); c.fillStyle = color;
  const [bx, by, bw, bh] = box, cx = bx + bw / 2, cy = by + bh / 2, R = Math.hypot(bw, bh) / 2, ca = Math.cos(angle), sa = Math.sin(angle);
  const core = [new Path2D(), new Path2D(), new Path2D()], halo = new Path2D();
  for (let v = -R; v <= R; v += cell) for (let u = -R; u <= R; u += cell) {
    const x = cx + ca * u - sa * v + (r() - .5) * jitter * cell, y = cy + sa * u + ca * v + (r() - .5) * jitter * cell;
    if (x < bx - cell || x > bx + bw + cell || y < by - cell || y > by + bh + cell) continue;
    const d = clamp(dens(x, y), 0, 1); if (d <= .02) continue;
    const rad = cell * .62 * Math.sqrt(d) * (.82 + r() * .36), k = (r() * 3) | 0;
    core[k].moveTo(x + rad, y); core[k].arc(x, y, rad, 0, TAU);
    halo.moveTo(x + rad * 1.45, y); halo.arc(x, y, rad * 1.45, 0, TAU);
  }
  c.globalAlpha = alpha * .13; c.fill(halo);
  for (let k = 0; k < 3; k++) { c.globalAlpha = alpha * (.66 + .17 * k); c.fill(core[k]); }
  c.restore();
}
// the second plate landed a little off: a shifted edge in a neighbouring ink
function fringe(path, color, dx, dy, al = .5, wide = 4) {
  if (FLAT) return;
  c.save(); c.globalAlpha = al; c.strokeStyle = color; c.lineWidth = wide; c.translate(dx, dy); c.stroke(path); c.restore();
}
// an outline that is never one width and drops out in places
function edge(pts, color, w, seed, { gap = .06, al = .85, close = true } = {}) {
  if (FLAT) { c.save(); c.strokeStyle = color; c.lineWidth = w; c.stroke(P(pts, close)); c.restore(); return; }
  const r = rng(seed), n = close ? pts.length : pts.length - 1;
  c.save(); c.strokeStyle = color; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    if (n > 24 && r() < gap) continue;
    const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
    c.globalAlpha = al * (.62 + r() * .38); c.lineWidth = w * (.5 + r() * 1.0);
    c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
  }
  c.restore();
}
function hatch(path, box, o = {}) {
  if (FLAT) return;
  const { angle = .9, gap = 9, len = 18, jitter = 5, color = INDIGO, alpha = .25, width = 2.2, seed = 1 } = o;
  const r = rng(seed);
  c.save(); c.clip(path); c.strokeStyle = color; c.globalAlpha = alpha; c.lineWidth = width;
  const [bx, by, bw, bh] = box, cx = bx + bw / 2, cy = by + bh / 2, R = Math.hypot(bw, bh) / 2, ca = Math.cos(angle), sa = Math.sin(angle);
  c.beginPath();
  for (let v = -R; v <= R; v += gap) for (let u = -R; u <= R; u += len * 1.7) {
    const uu = u + (r() - .5) * jitter * 2, L = len * (.6 + r() * .8);
    const x0 = cx + ca * uu - sa * v + (r() - .5) * jitter * .6, y0 = cy + sa * uu + ca * v + (r() - .5) * jitter * .6;
    c.moveTo(x0, y0); c.lineTo(x0 + ca * L, y0 + sa * L);
  }
  c.stroke(); c.restore();
}
// light is added, not painted: a warm pool screened over whatever is under it
function glow(x, y, r, color, a = .6) {
  c.save(); c.globalCompositeOperation = 'screen';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, alph(color, a)); g.addColorStop(.35, alph(color, a * .45)); g.addColorStop(1, alph(color, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
}
function shadowOf(draw, dx, dy, blur, a = .4, color = '#000814') {
  c.save(); c.filter = `blur(${blur}px)`; c.globalAlpha = a; c.fillStyle = color; c.translate(dx, dy); draw(); c.restore();
}

// ---- the pen: Parcel 42's handwriting --------------------------------------------
/*PEN_GLYPHS*/
const PENW = {}, PENL = {};
for (const k in PEN) {
  let mx = 0, mn = 1e9;
  for (const s of PEN[k]) for (let i = 0; i < s.length; i += 2) { mx = Math.max(mx, s[i]); mn = Math.min(mn, s[i]); }
  PENW[k] = k === ' ' ? 44 : mx + 20; PENL[k] = PEN[k].length ? mn : 0;
}
function smooth(pts, n) {
  if (pts.length < 3) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([
        .5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const PAD = { ':': 11, '1': 4, '.': 4 };
const adv = (ch, gap) => ch === ' ' ? 40 : (PENW[ch] ?? 70) - 20 - (PENL[ch] ?? 0) + gap + 2 * (PAD[ch] ?? 0);
function script(text, { x = 0, y = 0, xh = 42, slant = .2, seed = 1, wob = 4.5, gap = 14, jit: jj = 1 } = {}) {
  const r = rng(seed * 7919 + 91);
  const s = xh / 100, paths = [];
  let cx = 0;
  for (const ch of [...text.toLowerCase()]) {
    const strokes = PEN[ch];
    const by = (r() - .5) * 6 * jj, lx = (r() - .5) * 4 * jj;
    if (strokes) for (const st of strokes) {
      const pts = [];
      for (let i = 0; i < st.length; i += 2) {
        const gx = cx + (PAD[ch] ?? 0) + st[i] - (PENL[ch] ?? 0) + lx + (r() - .5) * wob, gy = st[i + 1] + by + (r() - .5) * wob;
        pts.push([x + (gx + (100 - gy) * slant) * s, y + gy * s]);
      }
      paths.push(smooth(pts, 6));
    }
    cx += adv(ch, gap);
  }
  return { paths, width: cx * s };
}
function nibStroke(pts, w, color, { angle = -0.62, minK = .42, seed = 1, al = 1 } = {}) {
  const n = pts.length; if (n < 2) return;
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const T = L[n - 1] || 1, r = rng(seed), ph = r() * TAU;
  c.save(); c.strokeStyle = color; c.globalAlpha = al; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const a = Math.atan2(y1 - y0, x1 - x0), k = minK + (1 - minK) * Math.abs(Math.sin(a - angle)), s = L[i] / T;
    let p = .9 + .1 * Math.sin(ph + s * 7);
    if (s < .05) p *= .6 + .4 * s / .05;
    c.lineWidth = Math.max(.9, w * k * p);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  c.restore();
}
// write a line by hand. returns its width so signs and plates can be sized to their words
function hand(text, o = {}) {
  const { x = 0, y = 0, xh = 30, color = INDIGO, w = xh / 7, seed = 3, slant = .18, al = 1, pencil = false, center = false } = o;
  let sc = script(text, { x: 0, y: 0, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  const ox = center ? x - sc.width / 2 : x;
  sc = script(text, { x: ox, y, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  for (let i = 0; i < sc.paths.length; i++) {
    if (pencil) { const r = rng(seed + i); for (let p = 0; p < 4; p++) { c.save(); c.globalAlpha = (.3 + r() * .2) * al; c.strokeStyle = color; c.lineWidth = w * (.5 + r() * .4); c.beginPath(); sc.paths[i].forEach(([px, py], j) => j ? c.lineTo(px + (r() - .5) * w * .5, py + (r() - .5) * w * .6) : c.moveTo(px, py)); c.stroke(); c.restore(); } }
    else nibStroke(sc.paths[i], w, color, { seed: seed + i, al });
  }
  return sc.width;
}

// ---- parcel 42, the pilot's kraft box with eyes -----------------------------------
const PW = 148, PH = 128, PDX = 34, PDY = 26;
function parcel(x, y, s, { gaze = [0, .12], happy = 0 } = {}) {
  const box = () => { c.beginPath(); c.moveTo(0, 0); c.lineTo(PDX, -PDY); c.lineTo(PW + PDX, -PDY); c.lineTo(PW + PDX, PH - PDY); c.lineTo(PW, PH); c.lineTo(0, PH); c.closePath(); c.fill(); };
  shadowOf(() => { c.translate(x, y); c.scale(s, s); box(); }, 10 * s, 14 * s, 9 * s, .45);
  c.save(); c.translate(x, y); c.scale(s, s);
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill(); };
  poly([[PW, 0], [PW + PDX, -PDY], [PW + PDX, PH - PDY], [PW, PH]], '#A9793F');
  poly([[0, 0], [PDX, -PDY], [PW + PDX, -PDY], [PW, 0]], '#D8AE72');
  poly([[0, 0], [PW, 0], [PW, PH], [0, PH]], '#C49257');
  if (!FLAT) { const r = rng(5); c.save(); c.beginPath(); c.rect(-2, -PDY - 2, PW + PDX + 4, PH + PDY + 4); c.clip(); c.strokeStyle = 'rgba(110,85,45,.22)'; c.lineWidth = .9; for (let i = 0; i < 140; i++) { const fx = r() * (PW + PDX), fy = -PDY + r() * (PH + PDY), a = r() * TAU, l = 4 + r() * 10; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l); c.stroke(); } c.restore(); }
  const by = -PDY / 2, bx = PW / 2 + PDX / 2;
  const twine = pts => { c.strokeStyle = '#8C6C40'; c.lineWidth = 5; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); c.strokeStyle = '#E4CFA2'; c.lineWidth = 3; c.stroke(); };
  twine([[PDX / 2, by], [PW + PDX / 2, by]]);
  twine(smooth([[bx, by], [bx - 26, by - 16], [bx - 30, by - 2], [bx, by]], 6));
  twine(smooth([[bx, by], [bx + 28, by - 14], [bx + 30, by], [bx, by]], 6));
  c.fillStyle = '#FFFBF0'; c.beginPath(); c.roundRect(18, 62, PW - 36, PH - 74, 3); c.fill();
  c.strokeStyle = 'rgba(20,92,132,.4)'; c.lineWidth = 1.2; c.stroke();
  for (const [ex, ey] of [[PW / 2 - 24, 32], [PW / 2 + 24, 32]]) {
    if (happy) { c.strokeStyle = INDIGO; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey + 5, 9, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); continue; }
    c.save(); c.beginPath(); c.ellipse(ex, ey, 11, 13, 0, 0, TAU); c.fillStyle = '#FFFDF6'; c.fill();
    c.strokeStyle = 'rgba(0,19,44,.6)'; c.lineWidth = 1.5; c.stroke(); c.clip();
    c.fillStyle = INDIGO; c.beginPath(); c.arc(ex + gaze[0] * 4.5, ey + gaze[1] * 5, 6.4, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + gaze[0] * 4.5 + 2, ey + gaze[1] * 5 - 2.5, 1.9, 0, TAU); c.fill();
    c.restore();
  }
  c.restore();
  const lw = script('42', { xh: 27 * s, seed: 81, slant: .12, wob: 3 }).width;
  hand('42', { x: x + (PW / 2 + 3) * s - lw / 2, y: y + 81 * s, xh: 27 * s, w: 5 * s, seed: 81, slant: .12 });
}

// ---- a house is a row. its window is the row's bit ------------------------------------
const LIT = [];                                   // windows to light once the street is down
const ALL_LIT = [];                               // every lit window drawn into the current picture, for the night pass
function house(x, base, s, o) {
  const { body, roof, lit = false, dim = 0, seed = 1, haze = 0, plate = null, door = true } = o;
  const w = 112 * s, h = 84 * s, rh = 44 * s;
  const bodyP = rrect(x, base - h, w, h, 2.2 * s, seed);
  const roofPts = [[x - 9 * s, base - h + 3 * s], [x + w * .5, base - h - rh], [x + w + 9 * s, base - h + 3 * s]];
  const roofP = rough(roofPts, 2.4 * s, seed + 1, 10 * s);
  shadowOf(() => c.fill(bodyP), 5 * s, 3 * s, 3 * s, .35);
  inkFill(bodyP, [x, base - h, w, h], body, seed, .12);
  dots(bodyP, [x, base - h, w, h], { cell: Math.max(4, 6 * s), color: mix(body, DEEP, .55), density: .22, seed: seed + 2, alpha: .8 });
  fringe(bodyP, BLOSSOM, 1.6 * s, -1.2 * s, .28, 2.2 * s);
  inkFill(roofP, [x - 9 * s, base - h - rh, w + 18 * s, rh + 4 * s], roof, seed + 3, .1);
  dots(roofP, [x - 9 * s, base - h - rh, w + 18 * s, rh], { cell: Math.max(4, 5 * s), color: DEEP, density: .3, seed: seed + 4, alpha: .7, angle: 1.1 });
  // a strip of last light along the roof's sunward edge
  edge(subdiv([roofPts[1], roofPts[2]], 8 * s, false), alph('#F4A94B', .9), 2.2 * s, seed + 5, { close: false, al: .7 });
  if (door) { const d = rrect(x + w * .14, base - h * .52, w * .2, h * .52, 1.2 * s, seed + 6); inkFill(d, [x, base - h, w, h], mix(body, DEEP, .6), seed + 7, .05); }
  // the window
  const wx = x + w * .5, wy = base - h * .74, ww = w * .32, wh = h * .36;
  const winP = rrect(wx, wy, ww, wh, 1.2 * s, seed + 8);
  if (lit || dim) {
    inkFill(winP, [wx, wy, ww, wh], dim && !lit ? mix(TURMERIC, DARK_WIN, 1 - dim) : TURMERIC, seed + 9, .08, 'warm');
    LIT.push([wx + ww / 2, wy + wh / 2, s, lit ? 1 : dim]);
  } else {
    inkFill(winP, [wx, wy, ww, wh], DARK_WIN, seed + 9, .06);
    c.save(); c.strokeStyle = alph(LOCEAN, .22); c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(wx + ww * .2, wy + wh * .75); c.lineTo(wx + ww * .6, wy + wh * .25); c.stroke(); c.restore();
  }
  c.save(); c.strokeStyle = alph(DEEP, .85); c.lineWidth = 2 * s; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke(); c.restore();
  if (plate) {                                    // a door plate, for the house we follow
    const px = x + w * .1, py = base - h * .72, pw = w * .3, ph = h * .2;
    c.save(); c.fillStyle = '#FFFBF0'; c.beginPath(); c.roundRect(px, py, pw, ph, 3); c.fill(); c.restore();
    hand(plate, { x: px + pw / 2, y: py + ph * .12, xh: ph * .6, w: 2.6 * s, center: true, seed: 12 });
  }
  if (haze > 0) { c.save(); c.globalAlpha = haze; c.fillStyle = DUSK[3]; c.fill(bodyP); c.fill(roofP); c.restore(); }
}
function tree(x, base, s, seed, haze = 0) {
  const r = rng(seed), h = (70 + r() * 30) * s, rad = (34 + r() * 10) * s;
  c.save(); c.strokeStyle = '#3A2410'; c.lineWidth = 6 * s; c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - h * .6); c.stroke(); c.restore();
  const crown = rough(ell(x, base - h, rad, rad * 1.1, 28), 4 * s, seed, 8);
  inkFill(crown, [x - rad, base - h - rad * 1.1, 2 * rad, 2.2 * rad], mix(JADE_D, DEEP, .5), seed, .12, 'cool');
  dots(crown, [x - rad, base - h - rad * 1.1, 2 * rad, 2.2 * rad], { cell: Math.max(4, 6 * s), color: mix(JADE, DEEP, .45), density: .35, seed: seed + 1, angle: .9 });
  edge(ell(x + rad * .15, base - h - rad * .2, rad * .8, rad * .8, 16).slice(10, 16), alph(DUSK[4], .8), 2 * s, seed + 2, { close: false, al: .6 });
  if (haze > 0) { c.save(); c.globalAlpha = haze; c.fillStyle = DUSK[3]; c.fill(crown); c.restore(); }
}
function lights() {
  ALL_LIT.push(...LIT);
  for (const [x, y, s, k] of LIT) { glow(x, y, 110 * s * (.6 + .4 * k), TURMERIC, .6 * k); glow(x, y, 30 * s, '#FFE9A8', .6 * k); }
  LIT.length = 0;
}
function sign(x, y, text, { xh = 30, rot = -.03, arrow = 0, post = 70, seed = 1 } = {}) {
  const tw = script(text, { xh, seed, slant: .16 }).width, pw = tw + xh * 1.2, ph = xh * 2.1;
  c.save(); c.translate(x, y); c.rotate(rot);
  const postP = rrect(pw * .45, ph * .6, 10, post, 1.4, seed + 1);
  inkFill(postP, [pw * .45, 0, 10, post + ph], '#5B3B1E', seed, .1);
  const pts = arrow ? [[0, 0], [pw, 0], [pw + arrow, ph / 2], [pw, ph], [0, ph]] : [[0, 0], [pw, 0], [pw, ph], [0, ph]];
  const boardP = rough(pts, 2.2, seed + 2, 12);
  shadowOf(() => c.fill(boardP), 4, 5, 3, .4);
  inkFill(boardP, [0, 0, pw + arrow, ph], '#D9B27A', seed + 3, .14, 'warm');
  hatch(boardP, [0, 0, pw + arrow, ph], { angle: .02, gap: 7, len: 40, color: '#8A5A2B', alpha: .22, width: 1.6, seed: seed + 4 });
  fringe(boardP, BLOSSOM_D, 2, 1.5, .3, 2);
  c.restore();
  // the words are written on the board, level with it
  c.save(); c.translate(x, y); c.rotate(rot);
  hand(text, { x: xh * .55, y: ph * .5 - xh * .52, xh, w: xh / 6.5, color: INDIGO, seed: seed + 5, slant: .16 });
  c.restore();
}

// ---- the kid, from Parcel 42's day, sitting on the hill and looking through a telescope --
function kid(x, y, s) {
  const B = () => { c.translate(x, y); c.scale(s, s); };
  const SKIN = '#F2C6A4', PJ = BLOSSOM, HAIR = DEEP;
  // body: sitting, facing right, knees up
  c.save(); B();
  const torso = P(bez([[[-38, 44], [-60, 70], [-56, 150]], [[-56, 150], [0, 160], [48, 150]], [[48, 150], [52, 80], [34, 44]]]));
  shadowOf(() => { c.fill(torso); }, 6, 8, 6, .35);
  c.fillStyle = PJ; c.fill(torso);
  c.save(); c.clip(torso); c.fillStyle = PAPER; for (let yy = 56; yy < 160; yy += 20) for (let xx = -64 + ((yy / 20) % 2) * 10; xx < 60; xx += 20) { c.beginPath(); c.arc(xx, yy, 3.6, 0, TAU); c.fill(); } c.restore();
  // legs: thigh forward to the knee, shin down, slippers
  c.strokeStyle = mix(PJ, DEEP, .12); c.lineWidth = 40;
  c.beginPath(); c.moveTo(-10, 140); c.quadraticCurveTo(60, 130, 104, 104); c.lineTo(122, 176); c.stroke();
  c.strokeStyle = PJ; c.lineWidth = 38;
  c.beginPath(); c.moveTo(0, 146); c.quadraticCurveTo(70, 142, 118, 118); c.lineTo(138, 186); c.stroke();
  c.fillStyle = INDIGO; c.beginPath(); c.ellipse(148, 196, 30, 14, .1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(132, 188, 28, 13, .1, 0, TAU); c.fill();
  // the arm that steadies the telescope
  c.strokeStyle = PJ; c.lineWidth = 26; c.beginPath(); c.moveTo(24, 66); c.quadraticCurveTo(70, 70, 96, 28); c.stroke();
  c.fillStyle = SKIN; c.beginPath(); c.arc(98, 24, 14, 0, TAU); c.fill();
  c.strokeStyle = alph(DEEP, .8); c.lineWidth = 3.2; c.stroke(torso);
  // head, turned right toward the eyepiece
  c.fillStyle = SKIN; c.beginPath(); c.arc(0, 0, 50, 0, TAU); c.fill();
  c.beginPath(); c.arc(-40, 10, 11, 0, TAU); c.fill();
  // hair: the back of the head and a scalloped fringe on the side facing us
  c.fillStyle = HAIR; c.beginPath();
  c.moveTo(-49, 18); c.bezierCurveTo(-66, -34, -30, -66, 10, -62); c.bezierCurveTo(42, -58, 58, -34, 52, -6);
  c.quadraticCurveTo(44, -16, 36, -10); c.quadraticCurveTo(30, -26, 18, -8); c.quadraticCurveTo(8, -26, -4, -8);
  c.quadraticCurveTo(-16, -22, -22, -2); c.quadraticCurveTo(-34, 4, -49, 18); c.closePath(); c.fill();
  c.save(); c.translate(6, -60); c.rotate(.2); c.beginPath(); c.moveTo(-9, 3); c.quadraticCurveTo(-14, -20, 2, -27); c.quadraticCurveTo(18, -32, 21, -19); c.quadraticCurveTo(22, -9, 12, -10); c.quadraticCurveTo(14, -18, 6, -18); c.quadraticCurveTo(-3, -16, 7, 3); c.closePath(); c.fill(); c.restore();
  c.strokeStyle = alph(PAPER, .35); c.lineWidth = 5; c.beginPath(); c.arc(-4, -10, 42, -2.6, -2.0); c.stroke();
  // the near eye squeezed shut, the far one at the glass
  c.strokeStyle = DEEP; c.lineWidth = 4; c.beginPath(); c.moveTo(12, 8); c.quadraticCurveTo(21, 13, 30, 8); c.stroke();
  c.fillStyle = alph(BLOSSOM, .5); c.beginPath(); c.arc(16, 26, 10, 0, TAU); c.fill();
  c.strokeStyle = DEEP; c.lineWidth = 2.6; c.beginPath(); c.moveTo(26, 34); c.quadraticCurveTo(34, 38, 40, 32); c.stroke();
  c.strokeStyle = alph(DEEP, .85); c.lineWidth = 3.2; c.beginPath(); c.arc(0, 0, 50, -1.2, 2.6); c.stroke();
  c.restore();
}
function telescope(x0, y0, x1, y1, s = 1) {
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
  // tripod first, it stands behind the tube
  const mx = lerp(x0, x1, .52), my = lerp(y0, y1, .52);
  c.save(); c.strokeStyle = '#4A2F16'; c.lineWidth = 7 * s;
  for (const [fx, fy] of [[mx - 58, my + 150], [mx + 44, my + 146], [mx - 8, my + 160]]) { c.beginPath(); c.moveTo(mx, my + 8); c.lineTo(fx, fy); c.stroke(); }
  c.restore();
  c.save(); c.translate(x0, y0); c.rotate(a);
  const tube = P([[0, -11 * s], [L, -19 * s], [L, 19 * s], [0, 11 * s]]);
  shadowOf(() => c.fill(tube), 6, 9, 5, .4);
  c.fillStyle = '#C8902C'; c.fill(tube);
  c.save(); c.clip(tube); c.fillStyle = alph('#FFE7A0', .55); c.fillRect(0, -18 * s, L, 7 * s); c.fillStyle = alph(TURM_D, .7); c.fillRect(0, 8 * s, L, 12 * s); c.restore();
  for (const t of [.18, .55, .9]) { c.fillStyle = INDIGO; c.fillRect(L * t - 5, -(11 + 8 * t) * s - 2, 10, (22 + 16 * t) * s + 4); }
  c.fillStyle = mix(INDIGO, DEEP, .5); c.beginPath(); c.ellipse(L, 0, 6 * s, 20 * s, 0, 0, TAU); c.fill();
  c.fillStyle = alph(LOCEAN, .8); c.beginPath(); c.ellipse(L + 1, -6 * s, 2.5 * s, 6 * s, 0, 0, TAU); c.fill();
  c.restore();
}
function snail(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#E7C08A'; c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-10, -8, 34, -4); c.quadraticCurveTo(46, -10, 44, -22); c.lineTo(50, -24); c.quadraticCurveTo(52, -6, 36, 2); c.closePath(); c.fill();
  c.strokeStyle = '#E7C08A'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(44, -20); c.lineTo(50, -36); c.moveTo(47, -21); c.lineTo(58, -33); c.stroke();
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.arc(4, -18, 20, 0, TAU); c.fill();
  c.strokeStyle = alph(PAPER, .7); c.lineWidth = 3; c.beginPath(); for (let k = 0; k < 40; k++) { const t = k / 40, r = 17 * (1 - t), an = t * 12; c.lineTo(4 + Math.cos(an) * r, -18 + Math.sin(an) * r); } c.stroke();
  // the late letter, riding on the shell
  c.save(); c.translate(2, -44); c.rotate(-.12); c.fillStyle = PAPER; c.fillRect(-18, -11, 36, 24); c.strokeStyle = alph(INDIGO, .6); c.lineWidth = 1.5; c.beginPath(); c.moveTo(-18, -11); c.lineTo(0, 3); c.lineTo(18, -11); c.stroke(); c.restore();
  c.restore();
}

// ---- the sky and the far land -------------------------------------------------------
function sky(x0, y0, w, h, hz) {
  // bands of flat ink, and a dot screen of each lower band feathered up into the one above
  const bands = DUSK, n = bands.length;
  const by = i => y0 + (hz - y0) * Math.pow(i / (n - 1), .8);
  c.save(); c.fillStyle = bands[0]; c.fillRect(x0, y0, w, h); c.restore();
  for (let i = 1; i < n; i++) {
    const yb = by(i) - 40, r = rng(300 + i), pts = [];
    for (let k = 0; k <= 30; k++) pts.push([x0 + w * k / 30, yb + Math.sin(k * .7 + i) * 6 + (r() - .5) * 5]);
    pts.push([x0 + w, y0 + h], [x0, y0 + h]);
    const bandP = P(pts); inkFill(bandP, [x0, yb - 20, w, y0 + h - yb], bands[i], 40 + i, .06, 'warm');
    const fade = P([[x0, yb - 90], [x0 + w, yb - 90], [x0 + w, yb + 12], [x0, yb + 12]]);
    dots(fade, [x0, yb - 90, w, 102], { cell: 6, color: bands[i], density: (x, y) => clamp((y - (yb - 90)) / 100, 0, 1) * .75, seed: 60 + i, angle: .4 + i * .3 });
  }
}
function stars(x0, y0, w, h, n, seed) {
  if (FLAT) return;
  const r = rng(seed);
  c.save(); c.fillStyle = PAPER;
  for (let i = 0; i < n; i++) { const x = x0 + r() * w, y = y0 + Math.pow(r(), 1.6) * h, s = .7 + r() * 1.7; c.globalAlpha = .45 + r() * .5; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
  c.restore();
}
function moon(x, y, r) {
  const g = c.createRadialGradient(x, y, r * .8, x, y, r * 3.2); g.addColorStop(0, alph('#FFF3D6', .22)); g.addColorStop(1, alph('#FFF3D6', 0));
  c.save(); c.fillStyle = g; c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  const m = new Path2D(); m.arc(x, y, r, 0, TAU);
  c.clip(m);
  const cres = new Path2D(); cres.rect(x - r - 2, y - r - 2, 2 * r + 4, 2 * r + 4); cres.arc(x + r * .42, y - r * .22, r * .92, 0, TAU);
  c.fillStyle = '#FFF1CC'; c.fill(cres, 'evenodd');
  c.restore();
}
function hills(y, amp, color, seed, dotsInk) {
  const r = rng(seed), pts = [];
  for (let k = 0; k <= 40; k++) pts.push([W * k / 40, y - amp * (.5 + .5 * Math.sin(k * .45 + seed)) - (r() - .5) * amp * .3]);
  pts.push([W, H], [0, H]);
  const p = P(pts);
  inkFill(p, [0, y - amp * 1.4, W, H - y + amp * 1.4], color, seed, .1, 'cool');
  if (dotsInk) dots(p, [0, y - amp * 1.4, W, 220], { cell: 6, color: dotsInk, density: .32, seed: seed + 1, angle: .8 });
  return p;
}

// ---- a street is a segment ----------------------------------------------------------
// seed per house, one lit window per key. 42's current house is the lit one in the new street
const STREETS = [
  { id: 3, base: 626, s: .40, x0: 880, x1: 1905 },
  { id: 4, base: 672, s: .50, x0: 850, x1: 1905 },
  { id: 5, base: 730, s: .62, x0: 820, x1: 1905 },
  { id: 6, base: 800, s: .76, x0: 800, x1: 1905 },
  { id: 7, base: 884, s: .92, x0: 790, x1: 1905 },
];
const STREET_AT = {};                          // street id -> [{ x, base, s }] per house index, filled as streets are drawn
function street(st, litAt, seed, plates = {}) {
  const { base, s, x0, x1 } = st, step = 172 * s, r = rng(seed);
  const road = rough([[x0 - 30 * s, base - 2], [x1 + 40, base - 2], [x1 + 40, base + 26 * s], [x0 - 30 * s, base + 26 * s]], 2, seed, 30);
  inkFill(road, [x0 - 30, base - 2, x1 - x0 + 70, 28 * s + 4], mix('#B98C5A', DEEP, .62), seed, .1, 'warm');
  edge(subdiv([[x0 - 30 * s, base + 26 * s], [x1 + 40, base + 26 * s]], 20, false), alph(DUSK[4], .5), 1.6 * s, seed + 1, { close: false, al: .6 });
  let i = 0;
  const haze = clamp((.85 - s) * .9, 0, .42);
  for (let x = x0; x + 112 * s < x1 + 60; x += step * (.94 + r() * .12), i++) {
    const pl = plates[i];
    if (!pl && !litAt.includes(i) && r() < .16) { tree(x + 50 * s, base, s, seed * 17 + i, haze); continue; }
    (STREET_AT[st.id] ||= [])[i] = { x, base, s };
    const body = HOUSE_INKS[(r() * HOUSE_INKS.length) | 0], roof = ROOF_INKS[(r() * ROOF_INKS.length) | 0];
    if (pl && pl.skip) continue;                 // drawn live by the scene instead
    house(x, base, s, { body, roof, lit: pl ? !!pl.lit : litAt.includes(i), seed: seed * 31 + i, haze, plate: pl ? pl.plate : null });
  }
  lights();
}

// ==================================================================================
// STILL 1. the town from the hill, at dusk
// ==================================================================================
function stillTown() {
  sky(0, 0, W, 640, 600);
  stars(0, 0, W, 420, 160, 7);
  moon(1655, 150, 44);
  hills(600, 34, mix(GRAPE, DEEP, .45), 11, mix(BLOSSOM_D, DEEP, .3));
  hills(622, 22, mix(INDIGO, GRAPE, .25), 12, null);
  // the valley floor the town stands on
  const floor = rough([[0, 612], [W, 604], [W, H], [0, H]], 3, 13, 40);
  inkFill(floor, [0, 600, W, H - 600], mix(INDIGO, OCEAN, .35), 13, .1, 'cool');
  dots(floor, [0, 600, W, 480], { cell: 6, color: mix(OCEAN, RIVER, .2), density: .18, seed: 14, angle: 1.2 });
  // the one road in, from the horizon down to the post office
  const road = bez([[[250, 600], [420, 604], [500, 626]], [[500, 626], [580, 646], [600, 690]], [[600, 690], [612, 712], [616, 736]]], 16);
  const left = road.map(([x, y], i) => [x - (2 + i * .5), y]), right = road.map(([x, y], i) => [x + (2 + i * .5), y]).reverse();
  const roadP = P([...left, ...right]);
  inkFill(roadP, [240, 596, 440, 170], mix('#D9B27A', DUSK[3], .35), 15, .1, 'warm');
  // far streets first, so the near ones stand in front of them
  street(STREETS[0], [2, 9], 21);
  street(STREETS[1], [5], 22);
  street(STREETS[2], [1, 7], 23);
  street(STREETS[3], [4, 8], 24);
  street(STREETS[4], [2, 5], 25);
  // the post office, where every letter for 42 comes in
  postOffice(530, 738, .9);
  // a mail van on the road, and the snail with its late letter, far behind it
  van(520, 634, .55);
  snail(384, 604, .42);
  // the new street, still being built: the consuming segment
  newStreet(1016, 1.1);
  // the hill, the kid, the telescope and parcel 42
  const crest = bez([[[-40, 706], [150, 660], [360, 680]], [[360, 680], [520, 694], [640, 800]], [[640, 800], [720, 900], [760, 1090]]], 22);
  const hill = P([...crest, [-40, 1090]]);
  inkFill(hill, [-40, 650, 820, 440], mix(JADE_D, DEEP, .55), 30, .14, 'cool');
  dots(hill, [-40, 650, 820, 440], { cell: 7, color: mix(JADE_D, INDIGO, .25), density: .45, seed: 31, angle: .5 });
  hatch(hill, [-40, 650, 820, 440], { angle: -.9, gap: 14, len: 16, color: mix(JADE, DEEP, .3), alpha: .35, width: 2.4, seed: 32 });
  edge(crest, alph('#F4A94B', .95), 3.4, 33, { close: false, al: .75 });
  // grass on the crest, against the last light
  if (!FLAT) { const r = rng(34); c.save(); c.strokeStyle = mix(JADE_D, DEEP, .7); c.lineWidth = 2.4; for (let i = 0; i < 90; i++) { const k = r(), [gx, gy] = crest[Math.floor(k * (crest.length - 1))]; c.beginPath(); c.moveTo(gx, gy + 2); c.quadraticCurveTo(gx + 4, gy - 10, gx + 2 + (r() - .5) * 10, gy - 12 - r() * 12); c.stroke(); } c.restore(); }
  sign(418, 804, 'partition 3', { xh: 30, rot: -.1, arrow: 34, post: 120, seed: 40 });
  telescope(368, 552, 556, 584, 1.05);
  kid(318, 548, .84);
  parcel(118, 580, .82, { gaze: [.95, .35] });
  // near specks, out of focus, and a few fireflies over the hill
  if (!FLAT) { const r = rng(50); for (let i = 0; i < 12; i++) { const x = 60 + r() * 880, y = 640 + r() * 380; c.save(); c.filter = 'blur(3px)'; c.fillStyle = alph(TURMERIC, .8); c.beginPath(); c.arc(x, y, 3 + r() * 3, 0, TAU); c.fill(); c.restore(); glow(x, y, 18, TURMERIC, .35); } }
  // the dusk cools toward the frame's edges
  const v = c.createRadialGradient(W * .55, H * .55, 380, W * .5, H * .5, 1300);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,14,40,.42)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}
function postOffice(x, base, s) {
  const w = 190 * s, h = 132 * s;
  const bodyP = rrect(x, base - h, w, h, 2.2, 70);
  shadowOf(() => c.fill(bodyP), 6, 4, 4, .35);
  inkFill(bodyP, [x, base - h, w, h], '#B98C5A', 70, .14, 'warm');
  dots(bodyP, [x, base - h, w, h], { cell: 6, color: TURM_D, density: .22, seed: 71 });
  const roofP = rough([[x - 12, base - h + 3], [x + w / 2, base - h - 50 * s], [x + w + 12, base - h + 3]], 2.4, 72, 10);
  inkFill(roofP, [x - 12, base - h - 50, w + 24, 54], BLOSSOM_D, 72, .12);
  dots(roofP, [x - 12, base - h - 50, w + 24, 54], { cell: 5, color: DEEP, density: .3, seed: 73, angle: 1.1 });
  // an envelope over the door, the only sign it needs
  const ex = x + w / 2 - 22 * s, ey = base - h + 16 * s;
  c.save(); c.fillStyle = PAPER; c.fillRect(ex, ey, 44 * s, 28 * s); c.strokeStyle = BLOSSOM_D; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + 22 * s, ey + 15 * s); c.lineTo(ex + 44 * s, ey); c.stroke(); c.restore();
  const d = rrect(x + w / 2 - 20 * s, base - 62 * s, 40 * s, 62 * s, 1.2, 74); inkFill(d, [x, base - 70, w, 70], mix(INDIGO, DEEP, .3), 74, .05);
  // its windows are the counter lamps, not rows, so they stay a cool indoor blue
  for (const wx of [x + 18 * s, x + w - 54 * s]) { const wp = rrect(wx, base - 92 * s, 36 * s, 34 * s, 1, 75 + wx); inkFill(wp, [wx, base - 92, 36, 34], mix(LOCEAN, OCEAN, .45), 76, .05); }
  // the flag
  c.save(); c.strokeStyle = '#3A2410'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w - 14, base - h - 20 * s); c.lineTo(x + w - 14, base - h - 96 * s); c.stroke();
  c.fillStyle = BLOSSOM; c.beginPath(); c.moveTo(x + w - 14, base - h - 96 * s); c.quadraticCurveTo(x + w + 20, base - h - 92 * s, x + w + 38, base - h - 84 * s); c.lineTo(x + w - 14, base - h - 70 * s); c.closePath(); c.fill(); c.restore();
}
function van(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(.22);
  const b = rrect(-50, -40, 100, 40, 1.5, 80); inkFill(b, [-50, -40, 100, 40], BLOSSOM, 80, .1);
  const cab = rrect(40, -30, 26, 30, 1, 81); inkFill(cab, [40, -30, 26, 30], BLOSSOM_D, 81, .05);
  c.fillStyle = PAPER; c.fillRect(-20, -30, 30, 18); c.strokeStyle = BLOSSOM_D; c.lineWidth = 2; c.beginPath(); c.moveTo(-20, -30); c.lineTo(-5, -20); c.lineTo(10, -30); c.stroke();
  c.fillStyle = DEEP; for (const wx of [-30, 40]) { c.beginPath(); c.arc(wx, 2, 10, 0, TAU); c.fill(); }
  c.restore();
  glow(x + 40 * s, y + 8, 30, '#FFE9A8', .35);
}
// the street still being built: three finished houses, the frames of the next, a crane
function newStreet(base, s, { newRow = true, newLit = true, lateRow = false } = {}) {
  const x0 = 880, step = 158 * s;
  const road = rough([[x0 - 40, base - 2], [W + 40, base - 2], [W + 40, base + 20 * s], [x0 - 40, base + 20 * s]], 2, 90, 30);
  inkFill(road, [x0 - 40, base - 2, W - x0 + 80, 24 * s], mix('#B98C5A', DEEP, .55), 90, .1, 'warm');
  // a raw earth edge in front, fresh cut
  const dirt = rough([[x0 - 40, base + 18 * s], [W + 40, base + 14 * s], [W + 40, H + 10], [x0 - 40, H + 10]], 5, 91, 20);
  inkFill(dirt, [x0 - 40, base, W - x0 + 80, H - base], mix('#8A5A2B', DEEP, .5), 91, .16, 'warm');
  dots(dirt, [x0 - 40, base, W - x0 + 80, H - base], { cell: 7, color: mix('#D9B27A', DEEP, .3), density: .25, seed: 92, angle: .7 });
  STREET_AT[8] = [0, 1, 2, 3, 4].map(k => ({ x: x0 + 40 + k * step, base, s }));
  house(x0 + 40, base, s, { body: HOUSE_INKS[0], roof: ROOF_INKS[1], lit: true, seed: 900 });
  if (newRow) house(x0 + 40 + step, base, s, { body: HOUSE_INKS[2], roof: ROOF_INKS[0], lit: newLit, plate: '42', seed: 901 });
  if (lateRow) house(x0 + 40 + 2 * step, base, s, { body: HOUSE_INKS[4], roof: ROOF_INKS[2], plate: '42', seed: 902 });
  lights();
  // frames: posts and beams of the rows not written yet
  const wood = '#D9B27A';
  for (let k = newRow ? (lateRow ? 3 : 2) : 1; k < 5; k++) {
    const fx = x0 + 40 + k * step, w = 112 * s, h = 84 * s;
    c.save(); c.strokeStyle = wood; c.lineWidth = 5; c.globalAlpha = .95;
    c.beginPath();
    for (const px of [0, w * .5, w]) { c.moveTo(fx + px, base); c.lineTo(fx + px, base - h * (k === 4 ? .55 : 1)); }
    c.moveTo(fx, base - h * (k === 4 ? .55 : 1)); c.lineTo(fx + w, base - h * (k === 4 ? .55 : 1));
    if (k === 3) { c.moveTo(fx - 8, base - h + 2); c.lineTo(fx + w / 2, base - h - 40 * s); c.lineTo(fx + w + 8, base - h + 2); c.moveTo(fx, base); c.lineTo(fx + w * .5, base - h); }
    c.stroke(); c.restore();
  }
  // the crane, lifting the next wall into place
  const cx = x0 + 40 + 5 * step + 40, top = base - 330 * s;
  c.save(); c.strokeStyle = mix(TURMERIC, TURM_D, .35); c.lineWidth = 6;
  c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, top); c.moveTo(cx + 22, base); c.lineTo(cx + 22, top); c.stroke();
  c.lineWidth = 2.6; c.beginPath(); for (let yy = base; yy > top; yy -= 28) { c.moveTo(cx, yy); c.lineTo(cx + 22, yy - 28); } c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 260, top + 6); c.lineTo(cx + 110, top + 6); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 11, top - 40); c.lineTo(cx - 240, top + 6); c.moveTo(cx + 11, top - 40); c.lineTo(cx + 100, top + 6); c.moveTo(cx - 170, top + 6); c.lineTo(cx - 170, top + 120); c.stroke();
  c.restore();
  const panel = rrect(cx - 212, top + 120, 84, 60, 1.5, 93); inkFill(panel, [cx - 212, top + 120, 84, 60], HOUSE_INKS[1], 93, .1);
  c.save(); c.fillStyle = DARK_WIN; c.fillRect(cx - 186, top + 134, 28, 22); c.restore();
  sign(x0 - 140, base - 112, 'segment 8', { xh: 30, rot: -.04, post: 100, seed: 95 });
  // street 7's sign, at the near end of the sealed row behind
  sign(700, STREETS[4].base - 150, 'segment 7', { xh: 28, rot: .03, post: 110, seed: 96 });
}

// ==================================================================================
// STILL 2. inside the post office. the address book, the letter, the switch board
// ==================================================================================
function stillPost() {
  // the back wall, warm plaster, and a wood dado
  const wall = P([[0, 0], [W, 0], [W, 700], [0, 700]]);
  inkFill(wall, [0, 0, W, 700], '#E9C991', 100, .16, 'warm');
  dots(wall, [0, 0, W, 700], { cell: 6, color: BLOSSOM, density: .12, seed: 101, angle: .3 });
  const dado = rough([[0, 560], [W, 560], [W, 710], [0, 710]], 2, 102, 24);
  inkFill(dado, [0, 560, W, 150], '#8A5A2B', 102, .12, 'warm');
  hatch(dado, [0, 560, W, 150], { angle: 1.52, gap: 46, len: 160, color: '#5B3B1E', alpha: .35, width: 3, seed: 103 });
  // lamp light on the wall, behind everything else
  glow(760, 520, 700, '#FFD98A', .35);
  pigeonholes(70, 170, 430, 360);
  clock(610, 190, 74);
  switchBoard(810, 150, 310, 420);
  windowView(1170, 96, 640, 470);
  // the desk
  const desk = P([[0, 690], [W, 668], [W, H], [0, H]]);
  inkFill(desk, [0, 660, W, 420], '#A36A35', 110, .14, 'warm');
  hatch(desk, [0, 660, W, 420], { angle: -.04, gap: 11, len: 120, jitter: 8, color: '#6B4020', alpha: .3, width: 2.4, seed: 111 });
  dots(desk, [0, 660, W, 420], { cell: 7, color: '#6B4020', density: .2, seed: 112, angle: 1.3 });
  c.save(); c.fillStyle = alph('#3A2410', .55); c.fillRect(0, 684, W, 8); c.restore();
  // the desk lamp's pool
  glow(820, 860, 620, '#FFD98A', .4);
  addressBook();
  letter(1460, 830, .06);
  pen(1262, 862);
  parcel(1690, 820, .95, { gaze: [-.95, .35] });
  lamp(40, 900);
  const v = c.createRadialGradient(W * .45, H * .6, 420, W * .5, H * .5, 1300);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,18,4,.42)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}
function pigeonholes(x, y, w, h) {
  const frame = rrect(x - 12, y - 12, w + 24, h + 24, 2, 120);
  shadowOf(() => c.fill(frame), 8, 10, 8, .35);
  inkFill(frame, [x - 12, y - 12, w + 24, h + 24], '#6B4020', 120, .1, 'warm');
  const cols = 4, rows = 4, cw = w / cols, ch = h / rows, r = rng(121);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const bx = x + i * cw + 5, byy = y + j * ch + 5, bw = cw - 10, bh = ch - 10;
    const cell = rrect(bx, byy, bw, bh, 1.4, 122 + i * 7 + j);
    inkFill(cell, [bx, byy, bw, bh], '#3A2410', 123, .06);
    const n = (r() * 3) | 0;
    for (let k = 0; k < n; k++) {
      const ew = bw * (.6 + r() * .3), eh = bh * (.38 + r() * .2), ex = bx + (bw - ew) * r(), ey = byy + bh - eh - 4 - k * 6;
      c.save(); c.translate(ex + ew / 2, ey + eh / 2); c.rotate((r() - .5) * .3);
      c.fillStyle = [PAPER, '#F1E2C2', '#E6F2F6'][(r() * 3) | 0]; c.fillRect(-ew / 2, -eh / 2, ew, eh);
      c.fillStyle = [BLOSSOM, TURMERIC, OCEAN, JADE][(r() * 4) | 0]; c.fillRect(ew / 2 - 16, -eh / 2 + 4, 11, 13);
      c.restore();
    }
  }
}
function clock(x, y, r) {
  shadowOf(() => { c.beginPath(); c.arc(x, y, r + 8, 0, TAU); c.fill(); }, 6, 8, 6, .35);
  c.save(); c.fillStyle = '#5B3B1E'; c.beginPath(); c.arc(x, y, r + 8, 0, TAU); c.fill();
  c.fillStyle = CREAM; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = INDIGO; c.lineWidth = 3;
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); c.lineTo(x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92); c.stroke(); }
  // half past four, the moment the delivered letter came in
  const hA = (4.5 / 12) * TAU - Math.PI / 2, mA = (30 / 60) * TAU - Math.PI / 2;
  c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(hA) * r * .5, y + Math.sin(hA) * r * .5); c.stroke();
  c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(mA) * r * .78, y + Math.sin(mA) * r * .78); c.stroke();
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
  c.restore();
}
// the town's windows are wired to this board, one switch per house, one row per street
function switchBoard(x, y, w, h) {
  const board = rrect(x, y, w, h, 2, 130);
  shadowOf(() => c.fill(board), 8, 10, 8, .4);
  inkFill(board, [x, y, w, h], '#5B3B1E', 130, .12, 'warm');
  hatch(board, [x, y, w, h], { angle: 1.55, gap: 9, len: 60, color: '#3A2410', alpha: .35, width: 1.8, seed: 131 });
  // the brass plate, with the real name of the thing
  const px = x + 20, py = y + 18, pw = w - 40, ph = 56;
  const plate = rrect(px, py, pw, ph, 1.2, 132);
  inkFill(plate, [px, py, pw, ph], '#D7A43C', 132, .1, 'warm');
  c.save(); c.strokeStyle = alph('#FFE7A0', .6); c.lineWidth = 2; c.stroke(plate); c.restore();
  // a code name keeps its capitals, so it is stamped in type, like the query ruler in Parcel 42
  c.save(); c.fillStyle = INDIGO; c.font = '700 34px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('validDocIds', px + pw / 2, py + ph / 2 + 2); c.restore();
  const rowsY = [y + 150, y + 310];
  const rows = [{ n: 6, label: '7', on: [4], flip: 2 }, { n: 6, label: '8', on: [5], up: 1 }];
  rows.forEach((row, ri) => {
    const ry = rowsY[ri];
    hand(row.label, { x: x + 26, y: ry - 20, xh: 40, w: 6, color: CREAM, seed: 140 + ri });
    const sx0 = x + 82, gap = (w - 102) / row.n;
    for (let k = 0; k < row.n; k++) {
      const sx = sx0 + k * gap + gap / 2;
      const on = row.on.includes(k) || row.up === k, flipping = row.flip === k;
      // the little bulb above each switch
      c.save(); c.fillStyle = on ? TURMERIC : flipping ? mix(TURMERIC, DARK_WIN, .55) : mix(DARK_WIN, '#5B3B1E', .3); c.beginPath(); c.arc(sx, ry - 50, 11, 0, TAU); c.fill(); c.restore();
      if (on) glow(sx, ry - 50, 40, TURMERIC, .75);
      if (flipping) glow(sx, ry - 50, 26, TURMERIC, .22);
      if (flipping || row.up === k) hand(flipping ? '12' : '3', { x: sx, y: ry + 34, xh: 28, w: 3.4, color: CREAM, seed: 160 + k, center: true, pencil: true });
      // the switch plate and its lever: up is on
      c.save(); c.fillStyle = CREAM; c.beginPath(); c.roundRect(sx - 12, ry - 26, 24, 52, 4); c.fill();
      c.strokeStyle = INDIGO; c.lineWidth = 7; c.lineCap = 'round';
      const lv = on ? -1 : 1, la = flipping ? .75 : 0;
      const ex = sx + Math.sin(la) * 20, ey = ry + lv * Math.cos(la) * 20 * (flipping ? -.2 : 1);
      c.beginPath(); c.moveTo(sx, ry); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = INDIGO; c.beginPath(); c.arc(ex, ey, 5.5, 0, TAU); c.fill(); c.restore();
      if (flipping) { c.save(); c.strokeStyle = CREAM; c.lineWidth = 2.6; for (const dx of [-24, 24]) { c.beginPath(); c.moveTo(sx + dx, ry - 8); c.quadraticCurveTo(sx + dx * 1.2, ry + 4, sx + dx, ry + 16); c.stroke(); } c.restore(); }
      if (row.up === k) { c.save(); c.strokeStyle = TURMERIC; c.lineWidth = 2.6; for (const dx of [-24, 24]) { c.beginPath(); c.moveTo(sx + dx, ry + 12); c.quadraticCurveTo(sx + dx * 1.2, ry, sx + dx, ry - 12); c.stroke(); } c.restore(); }
    }
  });
  // a pencilled note on the board, as the postmaster keeps it
  hand('one on per key', { x: x + 24, y: y + h - 58, xh: 28, w: 3.2, color: CREAM, seed: 150, pencil: true, al: .9 });
}
// through the window: street 7 with the old house going dark, street 8 with the new one lighting
function windowView(x, y, w, h) {
  const frame = rrect(x - 22, y - 22, w + 44, h + 44, 2, 160);
  shadowOf(() => c.fill(frame), 10, 12, 10, .45);
  inkFill(frame, [x - 22, y - 22, w + 44, h + 44], '#5B3B1E', 160, .12, 'warm');
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.translate(x, y);
  // the same dusk, closer
  const sx = w / W;
  c.save(); c.scale(sx, sx); sky(0, 0, W, 900, 560); stars(0, 0, W, 360, 80, 17); c.restore();
  const hz = h * .42;
  const floor = P([[0, hz], [w, hz - 4], [w, h], [0, h]]);
  inkFill(floor, [0, hz - 6, w, h], mix(INDIGO, OCEAN, .35), 161, .1, 'cool');
  // street 7, sealed
  const s7 = .62, b7 = h * .66;
  const road7 = P([[0, b7 - 1], [w, b7 - 1], [w, b7 + 11], [0, b7 + 11]]); inkFill(road7, [0, b7, w, 12], mix(OCEAN, DEEP, .55), 162, .06);
  for (let i = 0; i < 6; i++) house(10 + i * 104, b7, s7, { body: HOUSE_INKS[(i * 3 + 1) % 6], roof: ROOF_INKS[i % 4], seed: 170 + i, lit: i === 4, dim: i === 2 ? .38 : 0, plate: i === 2 ? '42' : null });
  lights();
  // street 8, being built, nearer
  const s8 = .9, b8 = h * .97;
  const road8 = P([[0, b8 - 1], [w, b8 - 1], [w, h], [0, h]]); inkFill(road8, [0, b8, w, h - b8], mix('#B98C5A', DEEP, .55), 163, .06);
  for (let i = 0; i < 4; i++) house(-30 + i * 150, b8, s8, { body: HOUSE_INKS[(i * 2 + 2) % 6], roof: ROOF_INKS[(i + 1) % 4], seed: 180 + i, lit: i === 1 || i === 3, plate: i === 3 ? '42' : null });
  lights();
  c.save(); c.strokeStyle = '#D9B27A'; c.lineWidth = 4; const fx = 575; c.beginPath(); c.moveTo(fx, b8); c.lineTo(fx, b8 - 76); c.moveTo(fx + 50, b8); c.lineTo(fx + 50, b8 - 76); c.moveTo(fx, b8 - 76); c.lineTo(fx + 60, b8 - 76); c.stroke(); c.restore();
  c.restore();
  // the glass: a cool sheen, and the mullions
  c.save(); c.globalCompositeOperation = 'screen'; const sh = c.createLinearGradient(x, y, x + w, y + h); sh.addColorStop(0, 'rgba(160,210,240,.12)'); sh.addColorStop(.5, 'rgba(160,210,240,0)'); c.fillStyle = sh; c.fillRect(x, y, w, h); c.restore();
  const mull = P([[x + w / 2 - 7, y], [x + w / 2 + 7, y], [x + w / 2 + 7, y + h], [x + w / 2 - 7, y + h]]);
  inkFill(mull, [x, y, w, h], '#5B3B1E', 164, .1, 'warm');
  const bar = P([[x, y + h * .36 - 6], [x + w, y + h * .36 - 6], [x + w, y + h * .36 + 6], [x, y + h * .36 + 6]]);
  inkFill(bar, [x, y, w, h], '#5B3B1E', 165, .1, 'warm');
}
// the address book: one line per key, where its live row is and what time it holds
function addressBook() {
  c.save();
  c.translate(300, 700); c.transform(1, 0, -.16, .8, 0, 0);
  const BW = 1000, BH = 420;
  c.save(); c.filter = 'blur(14px)'; c.fillStyle = 'rgba(40,18,4,.5)'; c.fillRect(24, 30, BW, BH); c.restore();
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.roundRect(-16, -14, BW + 32, BH + 28, 10); c.fill();
  for (let i = 4; i >= 1; i--) { c.fillStyle = i % 2 ? '#E7DDC4' : '#EFE6D0'; c.fillRect(-i * 2, -i * 2, BW + i * 4, BH + i * 2); }
  c.fillStyle = CREAM; c.fillRect(0, 0, BW, BH);
  const gut = c.createLinearGradient(BW / 2 - 70, 0, BW / 2 + 70, 0);
  gut.addColorStop(0, 'rgba(90,70,35,0)'); gut.addColorStop(.5, 'rgba(60,45,20,.45)'); gut.addColorStop(1, 'rgba(90,70,35,0)');
  c.fillStyle = gut; c.fillRect(BW / 2 - 70, 0, 140, BH);
  c.strokeStyle = '#8DD3E3'; c.lineWidth = 1.6;
  for (let yy = 110; yy < BH; yy += 62) { c.beginPath(); c.moveTo(20, yy); c.lineTo(BW / 2 - 20, yy); c.moveTo(BW / 2 + 20, yy); c.lineTo(BW - 20, yy); c.stroke(); }
  c.strokeStyle = 'rgba(192,26,91,.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(BW / 2 + 90, 30); c.lineTo(BW / 2 + 90, BH - 10); c.stroke();
  // left page: what the book is
  hand('address book', { x: 60, y: 34, xh: 44, w: 6, color: OCEAN, seed: 200, slant: .16 });
  hand('partition 3', { x: 60, y: 130, xh: 34, w: 4.4, color: OCEAN, seed: 201 });
  hand('key: where it lives', { x: 60, y: 195, xh: 30, w: 4, color: '#3E4654', seed: 202, pencil: true });
  // right page: the lines. 42's is the one the letter is laid against
  const cx = [BW / 2 + 26, BW / 2 + 104, BW / 2 + 236, BW / 2 + 358];
  ['key', 'street', 'house', 'time'].forEach((t, k) => hand(t, { x: cx[k], y: 62, xh: 26, w: 3.2, color: '#3E4654', seed: 210 + k, pencil: true }));
  const lines = [['17', '6', '4', '13:40'], ['42', '7', '12', '14:08'], ['58', '7', '9', '15:02']];
  lines.forEach((ln, j) => {
    const ly = 124 + j * 62;
    if (ln[0] === '42') { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = alph(TURMERIC, .55); c.fillRect(cx[0] - 12, ly - 8, 476, 52); c.restore(); }
    ln.forEach((t, k) => hand(t, { x: cx[k] + (k === 1 || k === 2 ? 16 : 0), y: ly, xh: 34, w: 5, color: INDIGO, seed: 220 + j * 5 + k }));
  });
  // a pencil ring round the time it holds
  c.save(); c.strokeStyle = '#3E4654'; c.globalAlpha = .7; c.lineWidth = 3; c.beginPath(); c.ellipse(cx[3] + 52, 124 + 62 + 20, 68, 31, -.05, .3, TAU + .1); c.stroke(); c.restore();
  c.restore();
}
function letter(x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const ew = 330, eh = 200;
  c.save(); c.filter = 'blur(8px)'; c.fillStyle = 'rgba(40,18,4,.45)'; c.fillRect(-ew / 2 + 12, -eh / 2 + 16, ew, eh); c.restore();
  const env = rrect(-ew / 2, -eh / 2, ew, eh, 1.2, 240);
  inkFill(env, [-ew / 2, -eh / 2, ew, eh], '#F7F1E1', 240, .06, 'warm');
  c.strokeStyle = alph('#C9B28A', .9); c.lineWidth = 2; c.beginPath(); c.moveTo(-ew / 2, -eh / 2); c.lineTo(0, 10); c.lineTo(ew / 2, -eh / 2); c.stroke();
  // the stamp, a tiny parcel on turmeric
  c.fillStyle = TURMERIC; c.fillRect(ew / 2 - 72, -eh / 2 + 16, 52, 62);
  c.fillStyle = '#C49257'; c.fillRect(ew / 2 - 60, -eh / 2 + 36, 28, 26);
  c.fillStyle = '#D8AE72'; c.beginPath(); c.moveTo(ew / 2 - 60, -eh / 2 + 36); c.lineTo(ew / 2 - 54, -eh / 2 + 30); c.lineTo(ew / 2 - 26, -eh / 2 + 30); c.lineTo(ew / 2 - 32, -eh / 2 + 36); c.closePath(); c.fill();
  // the postmark, 16:30, inked over the stamp's corner
  c.save(); c.strokeStyle = alph(BLOSSOM_D, .85); c.lineWidth = 4; c.beginPath(); c.arc(ew / 2 - 110, -eh / 2 + 58, 50, 0, TAU); c.stroke();
  c.lineWidth = 3; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(ew / 2 - 58, -eh / 2 + 36 + k * 12); c.bezierCurveTo(ew / 2 - 30, -eh / 2 + 28 + k * 12, ew / 2 - 10, -eh / 2 + 44 + k * 12, ew / 2 + 8, -eh / 2 + 34 + k * 12); c.stroke(); }
  c.restore();
  hand('16:30', { x: ew / 2 - 110, y: -eh / 2 + 42, xh: 30, w: 4.4, color: BLOSSOM_D, seed: 241, center: true, slant: .05 });
  hand('to 42', { x: -ew / 2 + 36, y: 22, xh: 40, w: 5.6, color: INDIGO, seed: 242 });
  hand('delivered', { x: -ew / 2 + 36, y: 88, xh: 32, w: 4.6, color: OCEAN, seed: 243 });
  c.restore();
}
function pen(tx, ty) {
  c.save(); c.translate(tx, ty); c.rotate(.98);
  c.save(); c.filter = 'blur(7px)'; c.globalAlpha = .4; c.fillStyle = '#281204'; c.fillRect(20, 10, 640, 40); c.restore();
  c.fillStyle = '#D9A417'; c.beginPath(); c.moveTo(-1, -1.6); c.quadraticCurveTo(30, -6, 58, -13); c.lineTo(82, -15); c.lineTo(82, 15); c.lineTo(58, 13); c.quadraticCurveTo(30, 6, -1, 1.6); c.closePath(); c.fill();
  const barrel = (x0, x1, hw) => { const g = c.createLinearGradient(0, -hw, 0, hw); g.addColorStop(0, '#000D1E'); g.addColorStop(.2, INDIGO); g.addColorStop(.33, '#3F6D9C'); g.addColorStop(.45, INDIGO); g.addColorStop(1, '#000A18'); c.fillStyle = g; c.beginPath(); c.roundRect(x0, -hw, x1 - x0, hw * 2, 6); c.fill(); };
  barrel(78, 170, 16); barrel(174, 620, 21);
  c.fillStyle = TURMERIC; c.fillRect(166, -17.5, 10, 35); c.fillRect(480, -21.5, 14, 43);
  c.restore();
}
function lamp(x, y) {
  // a brass desk lamp at the left, its green shade tipped over the book
  c.save(); c.filter = 'blur(8px)'; c.fillStyle = 'rgba(40,18,4,.45)'; c.beginPath(); c.ellipse(x + 130, y + 40, 120, 26, 0, 0, TAU); c.fill(); c.restore();
  c.save(); c.fillStyle = '#B8862B'; c.beginPath(); c.ellipse(x + 120, y + 26, 100, 24, 0, 0, TAU); c.fill();
  c.strokeStyle = '#B8862B'; c.lineWidth = 14; c.beginPath(); c.moveTo(x + 120, y + 20); c.lineTo(x + 170, y - 250); c.lineTo(x + 330, y - 330); c.stroke();
  c.strokeStyle = alph('#FFE7A0', .6); c.lineWidth = 4; c.beginPath(); c.moveTo(x + 116, y + 14); c.lineTo(x + 166, y - 252); c.stroke(); c.restore();
  const shade = rough([[x + 250, y - 380], [x + 420, y - 330], [x + 440, y - 250], [x + 230, y - 300]], 2, 260, 12);
  shadowOf(() => c.fill(shade), 8, 10, 7, .4);
  inkFill(shade, [x + 230, y - 380, 210, 130], mix(JADE_D, DEEP, .25), 260, .12, 'cool');
  dots(shade, [x + 230, y - 380, 210, 130], { cell: 6, color: mix(JADE, PAPER, .2), density: .25, seed: 261, angle: .5 });
  glow(x + 340, y - 270, 90, '#FFE9A8', .7);
}
function stamp(x, y) {
  c.save(); c.filter = 'blur(6px)'; c.fillStyle = 'rgba(40,18,4,.45)'; c.fillRect(x - 70, y + 10, 190, 90); c.restore();
  const pad = rrect(x - 80, y, 180, 90, 1.5, 250); inkFill(pad, [x - 80, y, 180, 90], '#2E3440', 250, .06);
  c.fillStyle = mix(BLOSSOM_D, DEEP, .3); c.beginPath(); c.roundRect(x - 64, y + 12, 148, 64, 6); c.fill();
  const hdl = rrect(x + 110, y - 90, 70, 130, 1.5, 251); inkFill(hdl, [x + 110, y - 90, 70, 130], '#8A5A2B', 251, .1, 'warm');
  c.fillStyle = '#5B3B1E'; c.beginPath(); c.ellipse(x + 145, y - 94, 50, 26, 0, 0, TAU); c.fill();
}

// ==================================================================================
// the print finish, over the whole sheet (code-film surface.md)
// ==================================================================================
function finishPrint() {
  const SOFT = .62, CHROMA = .7, SPREAD = .9;
  const GS = 260, gr = rng(4242);
  const GRAIN = Array.from({ length: 4 }, () => { const d = new Float32Array(GS * GS); for (let i = 0; i < d.length; i++) d[i] = (gr() + gr() + gr() - 1.5) * 2; return d; });
  const samp = (g, x, y) => { x = (x % GS + GS) % GS; y = (y % GS + GS) % GS; const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, nx = (ix + 1) % GS, ny = (iy + 1) % GS; return lerp(lerp(g[iy * GS + ix], g[iy * GS + nx], fx), lerp(g[ny * GS + ix], g[ny * GS + nx], fx), fy); };
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  const bg = base.getContext('2d', { willReadFrequently: true });
  bg.filter = `blur(${SOFT}px)`; bg.drawImage(big, 0, 0); bg.filter = 'none';
  const img = bg.getImageData(0, 0, W, H), src = img.data, out = new Uint8ClampedArray(src.length);
  const at = (x, y, k) => { x = clamp(x, 0, W - 1); y = clamp(y, 0, H - 1); const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, nx = Math.min(ix + 1, W - 1), ny = Math.min(iy + 1, H - 1); return lerp(lerp(src[(iy * W + ix) * 4 + k], src[(iy * W + nx) * 4 + k], fx), lerp(src[(ny * W + ix) * 4 + k], src[(ny * W + nx) * 4 + k], fx), fy); };
  const sc = GS / 1080 * 1.6;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, gx = x * sc, gy = y * sc;
    const n = samp(GRAIN[0], gx, gy), rgn = samp(GRAIN[1], gx + .7, gy + .3), byn = samp(GRAIN[2], gx, gy), coarse = samp(GRAIN[3], gx * .31, gy * .31);
    const dx = (.45 + coarse * .28) * SPREAD, dy = .18 * SPREAD;
    let R = at(x + dx, y - dy, 0), G = at(x, y, 1), B = at(x - dx * .7, y + dy, 2);
    const lum = (R * .299 + G * .587 + B * .114) / 255, ink = 1 - lum, amp = CHROMA * (.26 + .74 * Math.sqrt(ink));
    const luma = (n * 8 + coarse * 4) * amp;
    R += luma + rgn * 25 * amp; G += luma - rgn * 10 * amp; B += luma + byn * 17 * amp;
    const pore = Math.max(0, n - .68) * ink * .31 * CHROMA;
    R = lerp(R, 237, pore); G = lerp(G, 224, pore); B = lerp(B, 178, pore);
    out[i] = R; out[i + 1] = G; out[i + 2] = B; out[i + 3] = 255;
  }
  img.data.set(out);
  const fin = document.createElement('canvas'); fin.width = W; fin.height = H; fin.getContext('2d').putImageData(img, 0, 0);
  ctx.filter = 'blur(.34px)'; ctx.drawImage(fin, 0, 0); ctx.filter = 'none';
}