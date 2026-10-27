// ---- parcel 42, drawn the same in every scene -----------------------------------
// its box prints on the anchor's own two drums, which no act re-inks, so it is
// the same kraft brown with indigo eyes in every world. x, y is the bottom
// centre of the box in sheet units, s = 1 is 150 units wide.
function parcel42(x, y, s = 1, { gaze = [0, .3], blink = 0, squint = 0, smile = 0, tilt = 0, hop = 0 } = {}) {
  y -= hop;
  const w = 150 * s, h = 130 * s, dx = 34 * s, dy = 26 * s, L = x - w / 2, T = y - h;
  const c = Math.cos(tilt), sn = Math.sin(tilt);
  const R = ([px, py]) => [x + (px - x) * c - (py - y) * sn, y + (px - x) * sn + (py - y) * c];
  const P = pts => pts.map(R);
  const front = P([[L, T], [L + w, T], [L + w, y], [L, y]]);
  const top = P([[L, T], [L + dx, T - dy], [L + w + dx, T - dy], [L + w, T]]);
  const side = P([[L + w, T], [L + w + dx, T - dy], [L + w + dx, y - dy], [L + w, y]]);
  const outline = P([[L, y], [L, T], [L + dx, T - dy], [L + w + dx, T - dy], [L + w + dx, y - dy], [L + w, y]]);
  hole(1, g => { poly(g, outline); g.fill(); });
  A.ink.mark(.78, g => { poly(g, front); g.fill(); });
  A.ink.mark(1, g => { poly(g, side); g.fill(); });
  A.ink.mark(.55, g => { poly(g, top); g.fill(); });
  A.fringe.mark(.35, g => { poly(g, side); g.fill(); });
  A.fringe.mark(.7, g => { g.lineWidth = 2.4 * s; poly(g, outline); g.stroke(); const [a, b] = P([[L + w / 2, T], [L + w / 2 + dx, T - dy]]); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); });
  // twine as a light line, and a bow on top
  const bx = L + w / 2 + dx / 2, by = T - dy / 2;
  A.ink.cut(.75, g => {
    g.lineWidth = 5 * s;
    const seg2 = pts => { const q = P(pts); g.beginPath(); g.moveTo(...q[0]); for (const p of q.slice(1)) g.lineTo(...p); g.stroke(); };
    seg2([[L + dx / 2, by], [L + w + dx / 2, by]]); seg2([[L + w + dx / 2, by], [L + w + dx / 2, y - dy / 2]]);
    const b1 = P([[bx, by], [bx - 26 * s, by - 16 * s], [bx - 30 * s, by - 2 * s]]), b2 = P([[bx, by], [bx + 28 * s, by - 14 * s], [bx + 30 * s, by]]);
    for (const b of [b1, b2]) { g.beginPath(); g.moveTo(...b[0]); g.quadraticCurveTo(...b[1], ...b[2]); g.closePath(); g.stroke(); }
  });
  // the address label with its key
  const lab = P([[L + 22 * s, T + 64 * s], [L + w - 22 * s, T + 64 * s], [L + w - 22 * s, y - 12 * s], [L + 22 * s, y - 12 * s]]);
  A.ink.cut(1, g => { poly(g, lab); g.fill(); }); A.fringe.cut(1, g => { poly(g, lab); g.fill(); });
  A.fringe.mark(.9, g => { g.lineWidth = 1.4 * s; poly(g, lab); g.stroke(); });
  const [lx, ly] = R([L + w / 2, y - 12 * s - (h - 76 * s) / 2]);
  A.fringe.labels([['42', lx, ly + 2 * s]], 44 * s, .95, { align: 'center', font: SANS, weight: 800 });
  // eyes: paper whites, indigo pupils, a blink, a smug half lid, a small mouth
  for (const ox of [-24, 24]) {
    const [ex, ey] = R([L + w / 2 + ox * s, T + 32 * s]);
    const ry = 13 * s * (1 - blink * .92);
    A.ink.cut(1, g => { g.beginPath(); g.ellipse(ex, ey, 11 * s, ry, tilt, 0, TAU); g.fill(); });
    A.fringe.cut(1, g => { g.beginPath(); g.ellipse(ex, ey, 11 * s, ry, tilt, 0, TAU); g.fill(); });
    A.fringe.mark(.8, g => { g.lineWidth = 1.5 * s; g.beginPath(); g.ellipse(ex, ey, 11 * s, ry, tilt, 0, TAU); g.stroke(); });
    if (blink < .7) {
      A.fringe.mark(1, g => { g.beginPath(); g.ellipse(ex, ey, 11 * s, ry, tilt, 0, TAU); g.clip(); g.beginPath(); g.arc(ex + gaze[0] * 4.5 * s, ey + gaze[1] * 5 * s, 6.4 * s, 0, TAU); g.fill(); });
      A.fringe.cut(1, g => { g.beginPath(); g.arc(ex + gaze[0] * 4.5 * s + 2 * s, ey + gaze[1] * 5 * s - 2.5 * s, 1.9 * s, 0, TAU); g.fill(); });
      if (squint > 0) A.ink.mark(.95, g => { g.beginPath(); g.ellipse(ex, ey, 11 * s, ry, tilt, 0, TAU); g.clip(); g.fillRect(ex - 13 * s, ey - 15 * s, 26 * s, 15 * s * squint); });
    }
  }
  if (smile > 0) { const [mx, my] = R([L + w / 2, T + 52 * s]); A.fringe.strokes([[[mx - 12 * s, my], [mx - 4 * s, my + 6 * s * smile], [mx + 4 * s, my + 6 * s * smile], [mx + 12 * s, my]]], { w: 2.6 * s, d: .9 }); }
  return { bow: R([bx, by]), top: R([L + w / 2, T - dy]) };
}
const LIVED = {};
function placeholder(name) {
  return (S, u) => { inks('#002654', '#F94F8D', '#FFC61F'); S.light.flood(.35); S.dark.labels([[name + ' (to draw)', 500, 500]], 60, .9, { align: 'center', font: SANS, weight: 800 }); parcel42(500, 760, 1.2, { gaze: [Math.sin(u * 6), .2] }); };
}

// ---- the words: parcel 42 answering the kid, one line of thought ------------------
// film.chain.txt is the paragraph these are cut from. Small words on a paper
// strip carry the running line. Giant words carry the refrain at the turns.
// Every word lands on a sixteenth of the grid, and key words get a marker.
// Drawn over the finished frame through the engine's OVERLAYS, so they stay
// crisp over riso scenes and the ledger alike.
const WORDS = (() => {
  const B = b => Math.round(b * BEAT);
  const line = (text, from, to, off, key = [], at = 'low') => ({ kind: 'line', text, from: B(from), to: B(to), off: B(off), key, at });
  const big = (text, beats, off, at = 'mid') => ({ kind: 'big', text, beats: beats.map(B), off: B(off), at });
  return [
    line('i got placed at nine,', 4.75, 6.5, 8, ['placed']),
    line('so the table wrote it down.', 8.5, 10.5, 12, ['table'], 'high'),
    line('then i got packed.', 12.75, 14.25, 16, ['packed.']),
    line('a new line, and the old one?', 16.1, 17.3, 19, ['new'], 'high'),
    big('switched off.', [17.5, 18.0], 19, 'mid'),
    line('then i got shipped!', 19.5, 21, 23, ['shipped!']),
    big('the old one stays, just switched off.', [23.5, 23.75, 24.0, 24.25, 24.75, 25.0, 25.25], 26, 'top'),
    line('but a slow note said i got packed at 12:10.', 26.75, 30.5, 32, ['12:10.']),
    line("that's older than shipped, so it lands already off.", 32.3, 35.3, 37, ['older', 'off.'], 'high'),
    line('then i got home.', 37.75, 39.25, 41, ['home.']),
    big('the old one stays, just switched off.', [41.5, 41.75, 42.0, 42.25, 42.75, 43.0, 43.25], 44, 'top'),
    line('ask the table, and it reads only one line.', 44.25, 46.5, 48, ['one', 'line.'], 'high'),
    { kind: 'hook', lines: ['every line kept.', 'one switched on.'], from: B(48.5), mid: B(50.25), to: B(51.9), off: 1e9, key: ['kept.', 'on.'] },
  ];
})();
const WORD_INK = '#002654', WORD_KEY = 'rgba(255,198,31,.78)', WORD_PAPER = '#FFF8EA', WORD_LAST = '#C01A5B';
const LAYOUTS = new Map();
function layoutWords(text, size, seed) {
  const k = text + '|' + size + '|' + seed;
  if (LAYOUTS.has(k)) return LAYOUTS.get(k);
  const words = [], gap = size * .5;
  let x = 0;
  text.split(' ').forEach((t, i) => {
    const p = penPaths(t, { x: 0, y: 0, size, seed: seed + i * 7, wob: 2.4 });
    words.push({ t, x, w: p.width, paths: p.paths });
    x += p.width + gap;
  });
  const out = { words, width: x - gap };
  LAYOUTS.set(k, out);
  return out;
}
const snap16 = f => Math.round(f / (BEAT / 4)) * (BEAT / 4);
// reveal is how much of each word is written. fading is opacity only: a word
// that fades by un-writing loses its last letter first
function strokeWords(g, words, reveal, ox, oy, size, { halo = 0, colourLast = false, alpha = 1 } = {}) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const passes = halo ? [[WORD_PAPER, size * halo, .92], [null, size * .12, 1]] : [[null, size * .11, 1]];
  for (const [col, lw, a] of passes) {
    words.forEach((w, i) => {
      if (reveal[i] <= 0) return;
      g.strokeStyle = col || (colourLast && i === words.length - 1 ? WORD_LAST : WORD_INK);
      g.lineWidth = lw; g.globalAlpha = a * alpha;
      for (const p of written(w.paths, reveal[i])) { g.beginPath(); p.forEach(([x, y], j) => j ? g.lineTo(ox + w.x + x, oy + y) : g.moveTo(ox + w.x + x, oy + y)); g.stroke(); }
    });
  }
  g.globalAlpha = 1;
}
function paperStrip(g, x0, y0, x1, y1, seed, alpha) {
  const r = rng(seed), pts = [];
  for (let i = 0; i <= 18; i++) pts.push([lerp(x0, x1, i / 18), y0 + (r() - .5) * 5]);
  for (let i = 18; i >= 0; i--) pts.push([lerp(x0, x1, i / 18), y1 + (r() - .5) * 5]);
  g.save(); g.globalAlpha = alpha;
  g.shadowColor = 'rgba(0,15,40,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 5;
  g.fillStyle = WORD_PAPER; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
  g.restore();
}
// split a line into rows no wider than max, at the word nearest the middle
function rowsOf(text, sz, seed, max) {
  const L = layoutWords(text, sz, seed);
  if (L.width <= max) return [L];
  const words = text.split(' ');
  let best = 1, bestD = 1e9;
  for (let k = 1; k < words.length; k++) {
    const a = layoutWords(words.slice(0, k).join(' '), sz, seed).width, b = layoutWords(words.slice(k).join(' '), sz, seed + 1).width;
    const d = Math.max(a, b); if (d < bestD) { bestD = d; best = k; }
  }
  return [layoutWords(words.slice(0, best).join(' '), sz, seed), layoutWords(words.slice(best).join(' '), sz, seed + 1)];
}
function wordsOverlay(g, f, size) {
  const K = size / 1000;           // the sheet is 1000 units on each side
  g.save(); g.setTransform(K, 0, 0, K, 0, 0);
  for (const w of WORDS) {
    if (w.kind === 'line' || w.kind === 'hook') {
      const start = w.from - 4;
      if (f < start || f >= w.off) continue;
      const sz = w.kind === 'hook' ? 38 : 34, lh = sz * 1.72;
      const texts = w.kind === 'hook' ? w.lines : null;
      const rows = texts ? texts.map((t, k) => layoutWords(t, sz, 400 + k)) : rowsOf(w.text, sz, hashStr(w.text) % 997, 860);
      const n = rows.length, top = w.at === 'high' ? 58 : (w.kind === 'hook' ? 988 : 950) - lh * n - sz * .55;
      const alpha = easeOutCubic(seg(f, w.from - 4, w.from)) * (1 - seg(f, w.off - 4, w.off));
      const wmax = Math.max(...rows.map(r => r.width)), rot = ((hashStr(texts ? texts[0] : w.text) % 100) / 100 - .5) * .02;
      g.save(); g.translate(500, top + lh * n / 2); g.rotate(rot); g.translate(-500, -(top + lh * n / 2));
      paperStrip(g, 500 - wmax / 2 - 28, top - sz * 1.0, 500 + wmax / 2 + 28, top + lh * (n - 1) + sz * 1.6, hashStr(texts ? texts[0] : w.text), alpha);
      // every word of every row, in reading order, lands on its sixteenth
      const all = rows.flatMap((r, k) => r.words.map(wd => ({ wd, k, r })));
      const span = w.kind === 'hook' ? null : [w.from, w.to];
      all.forEach((it, i) => {
        let t;
        if (span) t = snap16(span[0] + (span[1] - span[0]) * i / Math.max(1, all.length - 1));
        else { const a = it.k ? w.mid : w.from, b = it.k ? w.to : w.mid - 6, idx = it.r.words.indexOf(it.wd), m = it.r.words.length; t = snap16(a + (b - a) * idx / Math.max(1, m - 1)); }
        it.reveal = seg(f, t, t + 4);
      });
      g.globalAlpha = alpha;
      for (const it of all) {
        const x0 = 500 - it.r.width / 2, y = top + lh * it.k;
        if (w.key.includes(it.wd.t) && it.reveal > 0) { g.fillStyle = WORD_KEY; g.fillRect(x0 + it.wd.x - 4, y + sz * .18, (it.wd.w + 8) * easeOutCubic(it.reveal), sz * .9); }
      }
      for (const it of all) {
        if (it.reveal <= 0) continue;
        strokeWords(g, [it.wd], [it.reveal], 500 - it.r.width / 2, top + lh * it.k, sz, { alpha });
      }
      g.restore();
    } else if (w.kind === 'big') {
      if (f < w.beats[0] || f >= w.off) continue;
      // giant words: one row if it fits, two rows if not, never shrunk to a caption
      const seed = hashStr(w.text) % 997;
      let sz = w.at === 'top' || w.at === 'mid' ? 64 : 82;
      let rows = rowsOf(w.text, sz, seed, 900);
      const widest = Math.max(...rows.map(r => r.width));
      if (widest > 900) { sz = Math.floor(sz * 900 / widest); rows = rowsOf(w.text, sz, seed, 900); }
      // a row's tall letters reach .7 of a size up and its tails 1.5 down, so rows sit 1.75 apart
      const lh = rows.length > 1 ? sz * 1.75 : 0, y0 = w.at === 'top' ? 64 : w.at === 'mid' ? 590 : 640, fade = 1 - seg(f, w.off - 5, w.off);
      let i = 0;
      rows.forEach((L, k) => {
        const x0 = 500 - L.width / 2, y = y0 + lh * k;
        L.words.forEach(wd => {
          const t = w.beats[i] ?? w.beats.at(-1), r = seg(f, t, t + 3); i++;
          if (r <= 0) return;
          const s = 1 + .22 * (1 - easeOutBack(seg(f, t, t + 5))), cx = x0 + wd.x + wd.w / 2, cy = y + sz * .5;
          g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
          strokeWords(g, [wd], [r], x0, y, sz, { halo: .34, alpha: fade });
          g.restore();
        });
      });
    }
  }
  g.restore();
}
OVERLAYS.push(wordsOverlay);
