// ============================================================================
// The drawing kit: ink that takes unevenly, halftone dots, a misregistered second
// plate, broken outlines, hatching, light, shadow, handwriting and the print finish.
// It holds no world. Your lesson's objects go in its own files. To see how a whole
// object is layered from these, read one in examples/parcel42-lesson/film/kit.js,
// then draw your own. Never call the example's objects (reference/traps.md).
// ============================================================================
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
const NIGHT = '#0D2147', DEEP = '#08173A', SEA = '#1F5F8B', CYAN = '#3FB8D0', ICE = '#A7DDEB';
const SUN = '#FFB511', SUN_D = '#8C5A0A', MINT = '#2BB673', MINT_D = '#11734B', PLUM = '#765BA7';
const PINK = '#FF48B0', PINK_D = '#B8236F', PAPER = '#F3EFE3', CREAM = '#F5EEDC';

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
  const { cell = 7, color = NIGHT, density = .4, angle = .26, jitter = .14, seed = 1, alpha = 1, which = 'ink', vary = .25 } = o;
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
  const { angle = .9, gap = 9, len = 18, jitter = 5, color = NIGHT, alpha = .25, width = 2.2, seed = 1 } = o;
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

// ---- the pen: the house handwriting, from code-film's pen glyphs ------------------
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
  const { x = 0, y = 0, xh = 30, color = NIGHT, w = xh / 7, seed = 3, slant = .18, al = 1, pencil = false, center = false } = o;
  let sc = script(text, { x: 0, y: 0, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  const ox = center ? x - sc.width / 2 : x;
  sc = script(text, { x: ox, y, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  for (let i = 0; i < sc.paths.length; i++) {
    if (pencil) { const r = rng(seed + i); for (let p = 0; p < 4; p++) { c.save(); c.globalAlpha = (.3 + r() * .2) * al; c.strokeStyle = color; c.lineWidth = w * (.5 + r() * .4); c.beginPath(); sc.paths[i].forEach(([px, py], j) => j ? c.lineTo(px + (r() - .5) * w * .5, py + (r() - .5) * w * .6) : c.moveTo(px, py)); c.stroke(); c.restore(); } }
    else nibStroke(sc.paths[i], w, color, { seed: seed + i, al });
  }
  return sc.width;
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