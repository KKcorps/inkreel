// ============================================================================
// THE LEDGER. The inside of the table, drawn as a clerk's book. It has its own
// scope so its names never meet the engine's. The film calls LEDGER.init(at, cards)
// once and LEDGER.render(ctx, frame, size) on every ledger act.
// Right page: the rows for each parcel, struck in pencil when a newer row lands,
// and parcel 42's thread pinned to its live row. Left page: an album. Each row's
// moment is pinned there as a postcard, and it fades when its row is struck.
// ============================================================================
const LEDGER = (() => {
  const W = 1080, H = 1080, TAU = Math.PI * 2, SEED = 7;
  const INDIGO = '#002654', DEEP = '#001E43', OCEAN = '#145C84';
  const TURMERIC = '#FFC61F', BLOSSOM = '#F94F8D', BLOSSOM_D = '#C01A5B';
  const PAPER = '#F5EEDC', DRIED = '#1B3D6E';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (u, a, b) => b === a ? +(u >= a) : clamp((u - a) / (b - a), 0, 1);
  const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const easeOutCubic = u => 1 - Math.pow(1 - u, 3);
  const easeOutBack = u => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let x = Math.imul(a ^ a >>> 15, 1 | a);
      x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
      return ((x ^ x >>> 14) >>> 0) / 4294967296;
    };
  }
  let at = () => 0, CARDS = [];

  // ---- handwriting ------------------------------------------------------------
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
  const plen = p => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
  const SCRIPTS = new Map();
  function script(text, { x = 0, y = 0, xh = 42, slant = .2, seed = 1, wob = 4.5, gap = 14, jit = 1 } = {}) {
    const key = [text, x, y, xh, slant, seed, wob, gap, jit].join('|');
    if (SCRIPTS.has(key)) return SCRIPTS.get(key);
    const r = rng((seed * 7919 + SEED * 13) >>> 0);
    const s = xh / 100, paths = [];
    let cx = 0;
    for (const ch of [...text.toLowerCase()]) {
      const strokes = PEN[ch];
      const by = (r() - .5) * 6 * jit, lx = (r() - .5) * 4 * jit;
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
    const out = { paths, width: cx * s, len: paths.map(plen) };
    out.total = out.len.reduce((a, b) => a + b, 0);
    SCRIPTS.set(key, out);
    return out;
  }
  function partial(sc, k) {
    if (k >= 1) return { paths: sc.paths, tip: sc.paths.length ? sc.paths.at(-1).at(-1) : null };
    let left = sc.total * k; const out = [];
    for (let i = 0; i < sc.paths.length; i++) {
      const p = sc.paths[i], L = sc.len[i];
      if (left >= L) { out.push(p); left -= L; continue; }
      const q = [p[0]];
      for (let j = 1; j < p.length && left > 0; j++) {
        const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]);
        if (d <= left) { q.push(p[j]); left -= d; }
        else { const t = left / d; q.push([lerp(p[j - 1][0], p[j][0], t), lerp(p[j - 1][1], p[j][1], t)]); left = 0; }
      }
      out.push(q);
      return { paths: out, tip: q.at(-1) };
    }
    return { paths: out, tip: out.length ? out.at(-1).at(-1) : null };
  }
  const cut = (pts, k) => partial({ paths: [pts], len: [plen(pts)], total: plen(pts) }, k);
  // a writing tool slides along the line at the right edge of the fresh ink
  function sweepTip(paths, y, xh) {
    let mx = -1e9; for (const p of paths) for (const q of p) if (q[0] > mx) mx = q[0];
    return mx > -1e9 ? [mx + 3, y + xh * .62] : null;
  }
  function nib(ctx, pts, w, { angle = -0.62, minK = .42, seed = 1 } = {}) {
    const n = pts.length; if (n < 2) return;
    const L = [0];
    for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const T = L[n - 1] || 1, r = rng(seed), ph = r() * TAU;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < n - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const a = Math.atan2(y1 - y0, x1 - x0), k = minK + (1 - minK) * Math.abs(Math.sin(a - angle)), s = L[i] / T;
      let p = .9 + .1 * Math.sin(ph + s * 7);
      if (s < .05) p *= .6 + .4 * s / .05;
      ctx.lineWidth = Math.max(.9, w * k * p);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  }
  function graphite(g, pts, w, seed = 1, passes = 5) {
    if (pts.length < 2) return;
    const r = rng(seed);
    for (let p = 0; p < passes; p++) {
      g.globalAlpha = .28 + r() * .2; g.lineWidth = w * (.45 + r() * .4);
      g.beginPath();
      pts.forEach(([x, y], i) => { const jx = x + (r() - .5) * w * .5, jy = y + (r() - .5) * w * .7; i ? g.lineTo(jx, jy) : g.moveTo(jx, jy); });
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  function wobbleLine(x0, y0, x1, y1, amp, seed, n = 40) {
    const r = rng(seed), ph = r() * TAU, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(x0, x1, t), lerp(y0, y1, t) + Math.sin(ph + t * 5.2) * amp + (r() - .5) * amp * .5]); }
    return pts;
  }
  function ringPts(cx, cy, rx, ry, seed = 3, turns = 1.18) {
    const r = rng(seed), pts = [], n = 110;
    for (let i = 0; i <= n; i++) { const t = i / n, a = -2.4 + t * TAU * turns, k = 1 + (r() - .5) * .04 + t * .05; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return pts;
  }

  // ---- surfaces ------------------------------------------------------------------
  const cv = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const SHEET = cv(), G = SHEET.getContext('2d');
  const POOL = [cv(), cv(), cv()];
  const GRAIN = (() => { const c = cv(), g = c.getContext('2d'), im = g.createImageData(W, H), r = rng(SEED * 31 + 1); for (let i = 0; i < im.data.length; i += 4) { const v = r(); im.data[i + 3] = Math.floor(255 * v * v); } g.putImageData(im, 0, 0); return c; })();
  const blotch = (() => { const c = cv(), g = c.getContext('2d'), r = rng(SEED * 97); g.filter = 'blur(40px)'; for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(120,90,40,${.03 + r() * .05})`; g.beginPath(); g.arc(r() * W, r() * H, 40 + r() * 140, 0, TAU); g.fill(); } return c; })();
  const fibers = (() => { const c = cv(), g = c.getContext('2d'), r = rng(SEED * 53); g.lineCap = 'round'; for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 22; g.strokeStyle = `rgba(110,85,45,${.05 + r() * .09})`; g.lineWidth = .5 + r() * .8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } return c; })();

  // ---- layout ----------------------------------------------------------------------
  const GUTTER = 134, PAGE_R = 1058, PAGE_T = 16, PAGE_B = 1210, MARGIN = 230;
  const COL = { key: 262, status: 404, time: 744 };
  const DIV = [386, 726];
  const RULES = []; for (let y = 410; y < PAGE_B; y += 92) RULES.push(y);
  const XH = 42, HEAD_Y = 244;
  const rowTop = i => RULES[i] - 11 - XH;

  // ---- the camera ----------------------------------------------------------------
  const BOOK_ROT = -0.022, BC = [540, 620];
  let CAM = { cx: 540, cy: 540, s: 1 }, SHOTS = [];
  function camAt(f) {
    let cur = SHOTS[0].c;
    for (let i = 0; i < SHOTS.length && SHOTS[i].f <= f; i++) {
      const s = SHOTS[i];
      if (s.kind === 'move') { const k = ease(seg(f, s.f, s.f + s.dur)); cur = k >= 1 ? s.c : [lerp(cur[0], s.c[0], k), lerp(cur[1], s.c[1], k), lerp(cur[2], s.c[2], k)]; }
      else cur = s.c;
    }
    const drift = 1 - seg(f, at('ending', 0), at('ending', 1));
    return { cx: cur[0] + Math.sin(f * .011) * 4 * drift, cy: cur[1] + Math.cos(f * .009) * 3 * drift, s: cur[2] * (1 + .006 * Math.sin(f * .013) * drift) };
  }
  function book(ctx) {
    ctx.setTransform(CAM.s, 0, 0, CAM.s, 540 - CAM.cx * CAM.s, 540 - CAM.cy * CAM.s);
    ctx.translate(BC[0], BC[1]); ctx.rotate(BOOK_ROT); ctx.translate(-BC[0], -BC[1]);
  }
  function inkSheet(draw, colour, { bleed = 1.3, feather = .32, alpha = .94, tooth = .16, i = 0 } = {}) {
    const c = POOL[i], g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    g.strokeStyle = colour; g.fillStyle = colour;
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = tooth; g.globalCompositeOperation = 'destination-out'; g.drawImage(GRAIN, 0, 0);
    G.save(); G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'multiply';
    G.filter = `blur(${bleed * CAM.s}px)`; G.globalAlpha = feather; G.drawImage(c, 0, 0);
    G.filter = 'none'; G.globalAlpha = alpha; G.drawImage(c, 0, 0);
    G.restore();
  }
  function pencilSheet(draw, { alpha = .9, tooth = .5 } = {}) {
    const c = POOL[1], g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    g.strokeStyle = '#3E4654'; g.fillStyle = '#3E4654'; g.lineCap = 'round'; g.lineJoin = 'round';
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = tooth; g.globalCompositeOperation = 'destination-out'; g.drawImage(GRAIN, 0, 0);
    G.save(); G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'multiply'; G.globalAlpha = alpha; G.drawImage(c, 0, 0); G.restore();
  }
  function shadowed(fn, { dx = 8, dy = 12, blur = 7, a = .34 } = {}) {
    const c = POOL[2], g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    fn(g, true);
    G.save(); G.setTransform(1, 0, 0, 1, 0, 0);
    G.filter = `blur(${blur * CAM.s}px)`; G.globalAlpha = a; G.globalCompositeOperation = 'multiply';
    G.drawImage(c, dx * CAM.s, dy * CAM.s);
    G.restore();
    G.save(); fn(G, false); G.restore();
  }

  // ---- the schedule, built in init from the film's own clock ------------------------
  let ROWS = [], LIVE = [], TALLY = [], SEEN_AT = 0, QUESTION, ANSWER, POINT, LATE, QRY;
  function schedule() {
    const R = [
      { key: '42', status: 'placed', time: '09:02', w: ['plate1', .2, 2.0], x: ['plate2', 1.5, 2.1], card: 0 },
      { key: '17', status: 'placed', time: '09:30', w: ['plate1', 2.3, 3.5] },
      { key: '42', status: 'packed', time: '11:15', w: ['plate2', .1, 1.4], x: ['plate3', 1.5, 2.1], card: 1 },
      { key: '42', status: 'shipped', time: '14:08', w: ['plate3', .1, 1.4], x: ['plate5', 1.5, 2.1], card: 2 },
      { key: '42', status: 'packed', time: '12:10', w: ['plate4', .1, 1.5], x: ['plate4', 3.4, 4.0], late: true, card: 3 },
      { key: '42', status: 'delivered', time: '16:30', w: ['plate5', .1, 1.4], card: 4 },
    ];
    ROWS = R.map((r, i) => ({ ...r, i, w0: at(r.w[0], r.w[1]), w1: at(r.w[0], r.w[2]), x0: r.x ? at(r.x[0], r.x[1]) : Infinity, x1: r.x ? at(r.x[0], r.x[2]) : Infinity }));
    LIVE = [[0, at('plate1', 2.1)], [2, at('plate2', 2.2)], [3, at('plate3', 2.2)], [5, at('plate5', 2.2)]];
    TALLY = ROWS.filter(r => r.key === '42').map(r => r.w1 + 6);
    SEEN_AT = LIVE[0][1] + 4;
    QUESTION = { text: 'where is parcel 42?', x: 372, y: 44, xh: 40, seed: 51 };
    ANSWER = { text: 'delivered.', x: 420, y: 124, xh: 44, seed: 52, t0: at('query', 2.9), t1: at('query', 3.8) };
    POINT = [];   // the closing line is the film's hook now, drawn over the frame
    LATE = { r0: at('plate4', 1.7), r1: at('plate4', 2.4), o0: at('plate4', 2.5), o1: at('plate4', 3.2), g0: at('plate4', 4.2), g1: at('plate4', 4.75) };
    QRY = { q0: at('query', .3), q1: at('query', 2.2), out0: at('query', 2.5), out1: at('query', 2.9) };
    const close = y => [590, y + 30, 1.35], MID = [560, 600, .94];
    SHOTS = [
      ['plate1', 0, 'cut', close(rowTop(0))], ['plate1', 2.0, 'move', MID, 12],
      ['plate2', 0, 'cut', close(rowTop(2))], ['plate2', 1.4, 'move', MID, 10],
      ['plate3', 0, 'cut', close(rowTop(3))], ['plate3', 1.4, 'move', MID, 10],
      ['plate4', 0, 'cut', close(rowTop(4))], ['plate4', 1.6, 'cut', [830, rowTop(4) - 20, 2.0]], ['plate4', 3.3, 'move', MID, 10], ['plate4', 4.1, 'cut', [260, 150, 2.1]],
      ['plate5', 0, 'cut', close(rowTop(5))], ['plate5', 1.4, 'move', MID, 10],
      ['query', 0, 'cut', MID], ['query', 2.5, 'move', [520, 210, 1.2], 12],
      ['ending', 0, 'move', [330, 660, .66], 18], ['ending', 1.25, 'move', [338, 692, .7], 40],
    ].map(([act, b, kind, c, dur]) => ({ f: at(act, b), kind, c, dur: dur || 0 }));
  }
  const liveRowAt = f => { let r = -1; for (const [i, t] of LIVE) if (f >= t) r = i; return r; };
  const rowScripts = row => ['key', 'status', 'time'].map((k, j) => script(row[k], { x: COL[k], y: rowTop(row.i), xh: XH, seed: 100 + row.i * 10 + j }));
  function rowWrite(row, f) {
    const sc = rowScripts(row), tot = sc.reduce((a, s) => a + s.total, 0);
    let left = tot * ease(seg(f, row.w0, row.w1)); const paths = [];
    for (const s of sc) { if (left <= 0) break; paths.push(...partial(s, Math.min(1, left / s.total)).paths); left -= s.total; }
    return { paths, tip: sweepTip(paths, rowTop(row.i), XH), done: f >= row.w1 };
  }
  function answerWrite(f) {
    if (f < ANSWER.t0) return null;
    const sc = script(ANSWER.text, { x: ANSWER.x, y: ANSWER.y, xh: ANSWER.xh, seed: ANSWER.seed, slant: .22 });
    const k = ease(seg(f, ANSWER.t0, ANSWER.t1)), p = partial(sc, k);
    return { paths: p.paths, tip: sweepTip(p.paths, ANSWER.y, ANSWER.xh), done: k >= 1, end: ANSWER.t1 };
  }

  // ---- the page ------------------------------------------------------------------
  function desk() {
    G.setTransform(1, 0, 0, 1, 0, 0);
    G.fillStyle = DEEP; G.fillRect(0, 0, W, H);
    const lamp = G.createRadialGradient(260, 120, 40, 420, 380, 1100);
    lamp.addColorStop(0, 'rgba(60,110,160,.55)'); lamp.addColorStop(1, 'rgba(0,0,0,0)');
    G.fillStyle = lamp; G.fillRect(0, 0, W, H);
    G.globalAlpha = .22; G.globalCompositeOperation = 'overlay'; G.drawImage(GRAIN, 0, 0);
    G.globalAlpha = 1; G.globalCompositeOperation = 'source-over';
  }
  function bookBody() {
    G.save(); book(G);
    G.filter = `blur(${18 * CAM.s}px)`; G.fillStyle = 'rgba(0,8,20,.6)';
    G.fillRect(-400 + 14, PAGE_T + 8, PAGE_R + 434, PAGE_B - PAGE_T + 30);
    G.filter = 'none';
    G.fillStyle = OCEAN; G.beginPath(); G.roundRect(-422, PAGE_T - 22, PAGE_R + 444, PAGE_B - PAGE_T + 44, 12); G.fill();
    for (let i = 5; i >= 1; i--) {
      G.fillStyle = i % 2 ? '#E7DDC4' : '#EFE6D0';
      G.fillRect(GUTTER, PAGE_T - i * 2.4, PAGE_R - GUTTER + i * 2.6, PAGE_B - PAGE_T + i * 2);
      G.fillStyle = '#E7DDC4'; G.fillRect(-400 - i * 2.6, PAGE_T - i * 2.4, GUTTER + 400 - 6 + i * 2.6, PAGE_B - PAGE_T + i * 2);
    }
    G.fillStyle = PAPER; G.fillRect(-400, PAGE_T, GUTTER + 400, PAGE_B - PAGE_T); G.fillRect(GUTTER, PAGE_T, PAGE_R - GUTTER, PAGE_B - PAGE_T);
    G.restore();
  }
  function paperFinish() {
    G.save(); book(G);
    G.beginPath(); G.rect(-400, PAGE_T, PAGE_R + 400, PAGE_B - PAGE_T); G.clip();
    G.globalCompositeOperation = 'multiply';
    G.drawImage(blotch, -420, PAGE_T, 1500, 1200); G.drawImage(fibers, -420, PAGE_T, 1500, 1200);
    let gr = G.createLinearGradient(GUTTER, 0, GUTTER + 110, 0);
    gr.addColorStop(0, 'rgba(60,45,20,.42)'); gr.addColorStop(.25, 'rgba(90,70,35,.14)'); gr.addColorStop(1, 'rgba(90,70,35,0)');
    G.fillStyle = gr; G.fillRect(GUTTER, PAGE_T, 110, PAGE_B);
    gr = G.createLinearGradient(GUTTER, 0, GUTTER - 90, 0);
    gr.addColorStop(0, 'rgba(60,45,20,.5)'); gr.addColorStop(.3, 'rgba(90,70,35,.16)'); gr.addColorStop(1, 'rgba(90,70,35,0)');
    G.fillStyle = gr; G.fillRect(GUTTER - 90, PAGE_T, 90, PAGE_B);
    G.restore();
    G.save(); G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'multiply'; G.globalAlpha = .06; G.drawImage(GRAIN, 0, 0); G.restore();
  }
  function rulings() {
    G.save(); book(G);
    G.globalCompositeOperation = 'multiply';
    G.strokeStyle = '#8DD3E3'; G.lineWidth = 1.7;
    for (const y of RULES) { G.beginPath(); G.moveTo(GUTTER + 6, y); G.lineTo(PAGE_R - 4, y); G.stroke(); }
    G.strokeStyle = 'rgba(192,26,91,.62)'; G.lineWidth = 1.4;
    for (const x of [MARGIN, MARGIN + 6]) { G.beginPath(); G.moveTo(x, HEAD_Y - 30); G.lineTo(x, PAGE_B); G.stroke(); }
    for (const y of [HEAD_Y + 56, HEAD_Y + 63]) { G.beginPath(); G.moveTo(GUTTER + 6, y); G.lineTo(PAGE_R - 4, y); G.stroke(); }
    G.strokeStyle = 'rgba(20,92,132,.34)'; G.lineWidth = 1.3;
    for (const x of DIV) { G.beginPath(); G.moveTo(x, HEAD_Y - 20); G.lineTo(x, RULES[5] + 20); G.stroke(); }
    G.restore();
  }
  function highlighter(f) {
    const c = POOL[0], g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    book(g); g.fillStyle = TURMERIC;
    LIVE.forEach(([i, t], n) => {
      const next = LIVE[n + 1], on = easeOutCubic(seg(f, t, t + 8)), off = next ? seg(f, next[1] - 2, next[1] + 6) : 0;
      const a = on * (1 - off); if (a <= 0) return;
      const top = rowTop(i), r = rng(SEED * 5 + i);
      for (const [dy, x0, x1] of [[-2, 244, 916], [10, 250, 928]]) {
        const xe = lerp(x0, x1, on), y0 = top - 16 + dy, y1 = top + XH + 14 + dy, pts = [];
        for (let k = 0; k <= 30; k++) pts.push([lerp(x0 + 6, xe, k / 30), y0 + (r() - .5) * 2.2]);
        for (let k = 30; k >= 0; k--) pts.push([lerp(x0, xe - 6, k / 30), y1 + (r() - .5) * 2.2]);
        g.globalAlpha = .62 * a; g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
      }
    });
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .25; g.globalCompositeOperation = 'destination-out'; g.drawImage(GRAIN, 0, 0);
    G.save(); G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'multiply'; G.globalAlpha = .8; G.drawImage(c, 0, 0); G.restore();
  }

  // the album: each row's moment pinned as a postcard on the left page
  const CARD_W = 380, CARD_H = 222;
  const CARD_AT = [[-150, 145, -.05], [-118, 380, .04], [-160, 612, -.03], [-112, 842, .05], [-140, 1072, -.02]];
  function album(f) {
    const live = liveRowAt(f);
    for (const row of ROWS) {
      if (row.card === undefined || f < row.w1) continue;
      const img = CARDS[row.card]; if (!img) continue;
      const [cx, cy, rot] = CARD_AT[row.card];
      const pin = easeOutBack(seg(f, row.w1, row.w1 + 8));
      const off = row.late ? seg(f, row.x0, row.x1 + 4) : seg(f, row.x0, row.x1 + 8);
      const lit = row.i === live;
      shadowed((g, sh) => {
        book(g); g.translate(cx, cy); g.rotate(rot * pin); g.scale(.9 + .1 * pin, .9 + .1 * pin);
        g.globalAlpha = Math.min(1, pin * 1.4);
        g.fillStyle = sh ? '#000' : '#FFFDF6'; g.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
        if (sh) return;
        g.drawImage(img, -CARD_W / 2 + 12, -CARD_H / 2 + 12, CARD_W - 24, CARD_H - 24);
        // switched off: the print fades toward the paper
        if (off > 0) { g.fillStyle = `rgba(245,238,220,${.62 * off})`; g.fillRect(-CARD_W / 2 + 12, -CARD_H / 2 + 12, CARD_W - 24, CARD_H - 24); }
        // tape at the top; turmeric on the one that is switched on
        g.fillStyle = lit ? 'rgba(255,198,31,.85)' : 'rgba(232,220,190,.8)';
        g.save(); g.translate(0, -CARD_H / 2 + 2); g.rotate(-.04); g.fillRect(-46, -14, 92, 28); g.restore();
      }, { dx: 6, dy: 9, blur: 6, a: .35 });
    }
  }

  let PEN_TIP = null, PENCIL_TIP = null;
  function entries(f) {
    inkSheet(g => {
      book(g);
      [['key', COL.key], ['status', COL.status], ['time', COL.time]].forEach(([t, x], j) => { for (const p of script(t, { x, y: HEAD_Y, xh: 36, seed: 40 + j, slant: .16 }).paths) nib(g, p, 5.2, { seed: j }); });
      for (const p of script('stored', { x: COL.key, y: rowTop(6) + 6, xh: 36, seed: 71 }).paths) nib(g, p, 5, { seed: 71 });
      for (const p of script('seen', { x: COL.key, y: rowTop(7) + 6, xh: 36, seed: 72 }).paths) nib(g, p, 5, { seed: 72 });
    }, OCEAN, { alpha: .95 });
    const wet = [];
    inkSheet(g => {
      book(g);
      for (const row of ROWS) {
        if (f < row.w0) continue;
        const w = rowWrite(row, f);
        if (!w.done || f < row.w1 + 20) { wet.push(w); continue; }
        for (const p of w.paths) nib(g, p, 5.6, { seed: row.i });
      }
      const aw = answerWrite(f); if (aw && aw.done && f > aw.end + 20) for (const p of aw.paths) nib(g, p, 5.8, { seed: 91 });
    }, DRIED, { alpha: .92 });
    inkSheet(g => {
      book(g);
      for (const w of wet) for (const p of w.paths) nib(g, p, 6.2, { seed: 9, minK: .38 });
      const aw = answerWrite(f);
      if (aw && !(aw.done && f > aw.end + 20)) for (const p of aw.paths) nib(g, p, 6.4, { seed: 91, minK: .38 });
    }, INDIGO, { alpha: 1, feather: .45, bleed: 1.6, tooth: .06 });
  }
  function pencilWork(f) {
    pencilSheet(g => {
      book(g);
      for (const p of [...script('comparison', { x: COL.time + 40, y: 142, xh: 26, seed: 61, slant: .18, wob: 5 }).paths, ...script('column', { x: COL.time + 70, y: 176, xh: 26, seed: 62, slant: .18, wob: 5 }).paths]) graphite(g, p, 3.4, 13, 3);
      graphite(g, ringPts(COL.time + 44, HEAD_Y + 20, 70, 34, 11), 3, 12, 4);
      for (const p of script('primary key', { x: 150, y: 206, xh: 22, seed: 63, slant: .16, wob: 5 }).paths) graphite(g, p, 3, 14, 3);
      for (const p of script(QUESTION.text, { x: QUESTION.x, y: QUESTION.y, xh: QUESTION.xh, seed: QUESTION.seed, slant: .2, wob: 5 }).paths) graphite(g, p, 4.2, 21, 4);
      if (f >= at('query', 2.6)) {
        const arr = smooth([[QUESTION.x + 120, QUESTION.y + 62], [QUESTION.x + 100, QUESTION.y + 100], [ANSWER.x - 30, ANSWER.y + 30]], 10);
        const ak = seg(f, at('query', 2.6), at('query', 2.9));
        for (const p of cut(arr, ak).paths) graphite(g, p, 3.6, 22, 4);
        if (ak >= 1) graphite(g, [[ANSWER.x - 48, ANSWER.y + 14], [ANSWER.x - 28, ANSWER.y + 30], [ANSWER.x - 50, ANSWER.y + 42]], 3.6, 23, 4);
      }
      for (const row of ROWS) {
        if (f < row.x0) continue;
        const y = rowTop(row.i) + XH * .52, k = ease(seg(f, row.x0, row.x1));
        for (const pp of cut(wobbleLine(244, y + 3, 912, y - 5, 1.6, 70 + row.i), k).paths) graphite(g, pp, 4.4, 80 + row.i, 6);
      }
      if (f >= LATE.r0) for (const pp of cut(ringPts(COL.time + 66, rowTop(4) + 20, 88, 38, 17), ease(seg(f, LATE.r0, LATE.r1))).paths) graphite(g, pp, 3.4, 18, 4);
      if (f >= LATE.o0) for (const pp of partial(script('older', { x: COL.time + 172, y: rowTop(4) + 12, xh: 26, seed: 64, slant: .18, wob: 5 }), ease(seg(f, LATE.o0, LATE.o1))).paths) graphite(g, pp, 3.4, 19, 4);
      for (const pt of POINT) {
        if (f < pt.t0) continue;
        for (const pp of partial(script(pt.text, { x: pt.x, y: pt.y, xh: pt.xh, seed: pt.seed, slant: .2, wob: 5 }), ease(seg(f, pt.t0, pt.t1))).paths) graphite(g, pp, 4.2, 24, 4);
      }
    });
  }
  function tallies(f) {
    inkSheet(g => {
      book(g);
      const r = rng(77);
      const mark = (x, base, k, seed) => { for (const pp of cut([[x + 6, base - 76], [x + 2, base - 38], [x - 3, base + 2]], easeOutCubic(k)).paths) nib(g, pp, 7.5, { seed, angle: -.3, minK: .6 }); };
      const b6 = RULES[6] - 10, b7 = RULES[7] - 10;
      TALLY.forEach((t, n) => {
        if (f < t) return;
        const k = seg(f, t, t + 4);
        if (n < 4) mark(470 + n * 32 + (r() - .5) * 5, b6, k, 78 + n);
        else for (const pp of cut([[450, b6 - 58], [500, b6 - 34], [590, b6 - 14]], easeOutCubic(k)).paths) nib(g, pp, 7, { seed: 83, angle: -.3, minK: .6 });
      });
      if (f >= SEEN_AT) mark(470, b7, seg(f, SEEN_AT, SEEN_AT + 4), 84);
      if (f >= TALLY[0]) {
        for (const p of script('42', { x: 150, y: RULES[6] + 6, xh: 40, seed: 79, slant: .15 }).paths) nib(g, p, 6, { seed: 79 });
        const bx = 222, y0 = RULES[6] - 88, y1 = RULES[7] - 4, ym = (y0 + y1) / 2;
        nib(g, smooth([[bx + 8, y0], [bx, y0 + 10], [bx, ym - 12], [bx - 8, ym], [bx, ym + 12], [bx, y1 - 10], [bx + 8, y1]], 8), 4.5, { seed: 80, minK: .5 });
      }
    }, BLOSSOM_D, { alpha: .95, i: 0 });
  }

  // ---- the parcel, the primary key, on the right page's top corner ---------------------
  const PX = 148, PY = 70, PW = 148, PH = 128, PDX = 34, PDY = 26, PS = 1.1;
  const grow = ([x, y]) => [PX + (x - PX) * PS, PY + PH + (y - PY - PH) * PS];
  const BOW_S = grow([PX + PW / 2 + PDX / 2, PY - PDY / 2]);
  function parcelSpace(g, hop) { book(g); g.translate(0, -hop); g.translate(PX, PY + PH); g.scale(PS, PS); g.translate(-PX, -PY - PH); }
  function gazeAt(f) {
    const live = liveRowAt(f);
    let tx = live < 0 ? 640 : 520, ty = live < 0 ? 60 : rowTop(live) + 20;
    if (f >= LATE.g0 - 4 && f < LATE.g1 + 6) { const k = seg(f, LATE.g0 - 4, LATE.g0) * (1 - seg(f, LATE.g1, LATE.g1 + 6)); tx = lerp(tx, 600, k); ty = lerp(ty, rowTop(4) + 20, k); }
    const [cx, cy] = grow([PX + PW / 2, PY + 34]), a = Math.atan2(ty - cy, tx - cx);
    return [Math.cos(a), Math.sin(a)];
  }
  const blinkAt = f => { let b = 0; for (const t of [at('plate1', 1), at('plate3', 1), at('ending', 4)]) b = Math.max(b, 1 - Math.abs(f - t) / 3); return clamp(b, 0, 1); };
  const smug = f => seg(f, LATE.g1, LATE.g1 + 4) * (1 - seg(f, at('delivered', 0), at('delivered', .25)));
  const smile = f => Math.max(smug(f), seg(f, at('ending', 4), at('ending', 4.3)));
  function parcel(f) {
    const [gx, gy] = gazeAt(f), bl = blinkAt(f), sm = smug(f);
    const hop = f >= at('ending', 4) ? Math.sin(seg(f, at('ending', 4), at('ending', 4.5)) * Math.PI) * 10 : 0;
    shadowed((g, sh) => {
      parcelSpace(g, hop);
      const poly = (pts, col) => { g.fillStyle = sh ? '#000' : col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
      poly([[PX + PW, PY], [PX + PW + PDX, PY - PDY], [PX + PW + PDX, PY + PH - PDY], [PX + PW, PY + PH]], '#A9793F');
      poly([[PX, PY], [PX + PDX, PY - PDY], [PX + PW + PDX, PY - PDY], [PX + PW, PY]], '#D8AE72');
      poly([[PX, PY], [PX + PW, PY], [PX + PW, PY + PH], [PX, PY + PH]], '#C49257');
      if (sh) return;
      g.save(); g.beginPath(); g.rect(PX - 2, PY - PDY - 2, PW + PDX + 4, PH + PDY + 4); g.clip();
      g.globalCompositeOperation = 'multiply'; g.globalAlpha = .6; g.drawImage(fibers, PX - 60, PY - 60, 400, 400); g.restore();
      const by = PY - PDY / 2, bx = PX + PW / 2 + PDX / 2;
      const twine = pts => { g.strokeStyle = '#8C6C40'; g.lineWidth = 5; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.strokeStyle = '#E4CFA2'; g.lineWidth = 3; g.stroke(); };
      twine([[PX + PDX / 2, by], [PX + PW + PDX / 2, by]]);
      twine(smooth([[bx, by], [bx - 26, by - 16], [bx - 30, by - 2], [bx, by]], 6));
      twine(smooth([[bx, by], [bx + 28, by - 14], [bx + 30, by], [bx, by]], 6));
      g.fillStyle = '#FFFBF0'; g.beginPath(); g.roundRect(PX + 18, PY + 62, PW - 36, PH - 74, 3); g.fill();
      g.strokeStyle = 'rgba(20,92,132,.4)'; g.lineWidth = 1.2; g.stroke();
      for (const ex of [PX + PW / 2 - 24, PX + PW / 2 + 24]) {
        const ey = PY + 32;
        g.save();
        g.beginPath(); g.ellipse(ex, ey, 11, 13 * (1 - bl * .92), 0, 0, TAU); g.fillStyle = '#FFFDF6'; g.fill();
        g.strokeStyle = 'rgba(0,19,44,.6)'; g.lineWidth = 1.5; g.stroke();
        if (bl < .7) {
          g.clip();
          g.fillStyle = INDIGO; g.beginPath(); g.arc(ex + gx * 4.5, ey + gy * 5, 6.4, 0, TAU); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + gx * 4.5 + 2, ey + gy * 5 - 2.5, 1.9, 0, TAU); g.fill();
          if (sm > 0) { g.fillStyle = '#C49257'; g.fillRect(ex - 13, ey - 15, 26, 15 * sm); g.strokeStyle = 'rgba(78,50,20,.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex - 12, ey - 15 + 15 * sm); g.lineTo(ex + 12, ey - 15 + 15 * sm); g.stroke(); }
        }
        g.restore();
      }
      const s = smile(f);
      if (s > 0) { g.strokeStyle = 'rgba(40,24,8,.8)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(PX + PW / 2 - 12, PY + 52); g.quadraticCurveTo(PX + PW / 2, PY + 52 + 8 * s, PX + PW / 2 + 12, PY + 52); g.stroke(); }
    }, { dx: 7, dy: 11, blur: 7, a: .4 });
    inkSheet(g => {
      parcelSpace(g, hop);
      const lab = script('42', { x: 0, y: PY + 76, xh: 34, seed: 81, slant: .12, wob: 3 });
      for (const p of script('42', { x: PX + PW / 2 - lab.width / 2 + 4, y: PY + 76, xh: 34, seed: 81, slant: .12, wob: 3 }).paths) nib(g, p, 5.4, { seed: 81, minK: .4 });
    }, INDIGO, { alpha: 1, feather: .4, i: 2 });
  }

  // ---- the thread: the in-memory map from the key to its live row ----------------------
  const PIN_X = 206;
  function pinY(f) {
    let y = null;
    for (const [i, t] of LIVE) { if (f < t) break; const target = rowTop(i) + XH * .5; y = y === null ? target : lerp(y, target, ease(seg(f, t, t + 10))); }
    return y;
  }
  function thread(f) {
    const t0 = LIVE[0][1];
    if (f < t0 - 8) return;
    const py = pinY(f) ?? rowTop(0) + XH * .5, drop = easeOutCubic(seg(f, t0 - 8, t0 + 2)), b = BOW_S;
    const end = [lerp(b[0] - 60, PIN_X, drop), lerp(b[1] + 40, py, drop)];
    // over the top of the box, down its left side, then along the margin to the pin
    const pts = smooth([[b[0], b[1]], [b[0] - 60, b[1] - 18], [140, b[1] + 60], [lerp(150, 176, drop), lerp(b[1] + 150, Math.max(260, (b[1] + end[1]) / 2), drop)], [end[0] - 10, end[1] - 60], end], 14);
    shadowed((g, sh) => {
      book(g);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = sh ? '#000' : BLOSSOM_D; g.lineWidth = 5.2;
      g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      if (sh) return;
      g.strokeStyle = BLOSSOM; g.lineWidth = 3.4; g.stroke();
      if (drop > .9) {
        const [x, y] = end;
        g.fillStyle = BLOSSOM_D; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill();
        const hl = g.createRadialGradient(x - 4, y - 5, 1, x, y, 12);
        hl.addColorStop(0, 'rgba(255,220,235,.95)'); hl.addColorStop(.35, 'rgba(249,79,141,.9)'); hl.addColorStop(1, 'rgba(120,10,50,0)');
        g.fillStyle = hl; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill();
      }
    }, { dx: 5, dy: 8, blur: 3.5, a: .3 });
  }

  // ---- the query: a ruler that stops only on the switched-on row --------------------
  function ruler(f) {
    const { q0, q1, out0, out1 } = QRY;
    if (f < q0 - 6 || f > out1) return;
    const stops = 6, dur = (q1 - q0) / stops;
    let y;
    if (f < q0) y = lerp(PAGE_T - 120, rowTop(0) - 18, easeOutCubic(seg(f, q0 - 6, q0)));
    else { const n = Math.min(stops - 1, Math.floor((f - q0) / dur)), k = seg(f - q0 - n * dur, 0, dur * .45); y = n === 0 ? rowTop(0) - 18 : lerp(rowTop(n - 1) - 18, rowTop(n) - 18, easeOutBack(k)); }
    const fade = 1 - seg(f, out0, out1), found = f >= q0 + dur * 5;
    shadowed((g, sh) => {
      book(g); g.globalAlpha = fade;
      const x0 = 236, x1 = 944, h = 40;
      g.fillStyle = sh ? '#000' : '#E2C58E';
      g.beginPath(); g.roundRect(x0, y + XH + 26, x1 - x0, h, 4); g.fill();
      if (sh) return;
      g.fillStyle = '#9C7438'; g.fillRect(x0, y + XH + 26, x1 - x0, 4);
      g.fillStyle = INDIGO; g.font = '700 30px monospace'; g.textBaseline = 'middle'; g.fillText('query', x0 + 12, y + XH + 48);
      g.strokeStyle = 'rgba(80,50,15,.6)'; g.lineWidth = 1.2;
      for (let x = x0 + 128, n = 0; x < x1 - 6; x += 20, n++) { g.beginPath(); g.moveTo(x, y + XH + 30); g.lineTo(x, y + XH + 30 + (n % 5 === 0 ? 11 : 6)); g.stroke(); }
      if (found) { const k = seg(f, q0 + dur * 5, q0 + dur * 5 + 8); g.globalAlpha = fade * (1 - k) * .9; g.fillStyle = '#FFF6D0'; g.beginPath(); g.arc(lerp(x0, x1, k), y + XH + 46, 18, 0, TAU); g.fill(); }
    }, { dx: 6, dy: 9, blur: 5, a: .35 });
  }

  // ---- the tools, sliding along the ink -----------------------------------------------
  const PEN_PARK = [1600, 1800], PENCIL_PARK = [-700, 1800];
  function fountainPen(tip, lift) {
    shadowed((g, sh) => {
      book(g); g.translate(tip[0], tip[1]); g.rotate(0.72);
      const barrel = (x0, x1, hw, base) => {
        if (sh) { g.fillStyle = '#000'; g.beginPath(); g.roundRect(x0, -hw, x1 - x0, hw * 2, 6); g.fill(); return; }
        const gr = g.createLinearGradient(0, -hw, 0, hw);
        gr.addColorStop(0, '#000D1E'); gr.addColorStop(.18, base); gr.addColorStop(.32, '#3F6D9C'); gr.addColorStop(.42, base); gr.addColorStop(.85, '#00132B'); gr.addColorStop(1, '#000A18');
        g.fillStyle = gr; g.beginPath(); g.roundRect(x0, -hw, x1 - x0, hw * 2, 6); g.fill();
      };
      const band = (x0, x1, hw) => { if (sh) return; const gr = g.createLinearGradient(0, -hw, 0, hw); gr.addColorStop(0, '#8A5A08'); gr.addColorStop(.3, '#FFE08A'); gr.addColorStop(.5, TURMERIC); gr.addColorStop(1, '#8A5A08'); g.fillStyle = gr; g.fillRect(x0, -hw, x1 - x0, hw * 2); };
      g.fillStyle = sh ? '#000' : '#D9A417';
      g.beginPath(); g.moveTo(-1, -1.6); g.quadraticCurveTo(30, -6, 58, -13); g.lineTo(82, -15); g.lineTo(82, 15); g.lineTo(58, 13); g.quadraticCurveTo(30, 6, -1, 1.6); g.closePath(); g.fill();
      if (!sh) { g.strokeStyle = '#3A2604'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(3, 0); g.lineTo(46, 0); g.stroke(); }
      barrel(78, 170, 16, '#0B1F3E'); band(166, 176, 17.5); barrel(174, 760, 21, INDIGO); band(560, 574, 21.5);
    }, { dx: 12 + lift * 10, dy: 18 + lift * 14, blur: 9 + lift * 4, a: .42 - lift * .12 });
  }
  function pencil(tip, lift) {
    shadowed((g, sh) => {
      book(g); g.translate(tip[0], tip[1]); g.rotate(1.98);
      const hw = 13;
      if (sh) { g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, -hw); g.lineTo(700, -hw); g.lineTo(700, hw); g.lineTo(64, hw); g.closePath(); g.fill(); return; }
      g.fillStyle = '#EBCFA4'; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, -hw); g.lineTo(64, hw); g.closePath(); g.fill();
      g.fillStyle = '#2E3440'; g.beginPath(); g.moveTo(0, 0); g.lineTo(18, -3.7); g.lineTo(18, 3.7); g.closePath(); g.fill();
      for (const [c, a, b] of [['#FFD95E', -hw, -hw / 3], [TURMERIC, -hw / 3, hw / 3], ['#D9A000', hw / 3, hw]]) { g.fillStyle = c; g.beginPath(); g.moveTo(64 + 4 * Math.abs(a) / hw, a); g.lineTo(700, a); g.lineTo(700, b); g.lineTo(64 + 4 * Math.abs(b) / hw, b); g.closePath(); g.fill(); }
    }, { dx: 9 + lift * 10, dy: 13 + lift * 14, blur: 6 + lift * 4, a: .38 - lift * .12 });
  }
  let penJobs = [], pencilJobs = [];
  function jobs() {
    penJobs = [...ROWS.map(r => [r.w0, r.w1, f => rowWrite(r, f).tip]), [ANSWER.t0, ANSWER.t1, f => answerWrite(f).tip]];
    pencilJobs = [];
    for (const row of ROWS) if (row.x0 < Infinity) { const y = rowTop(row.i) + XH * .52, line = wobbleLine(244, y + 3, 912, y - 5, 1.6, 70 + row.i); pencilJobs.push([row.x0, row.x1, f => cut(line, ease(seg(f, row.x0, row.x1))).tip]); }
    const ring = ringPts(COL.time + 66, rowTop(4) + 20, 88, 38, 17);
    pencilJobs.push([LATE.r0, LATE.r1, f => cut(ring, ease(seg(f, LATE.r0, LATE.r1))).tip]);
    const o = script('older', { x: COL.time + 172, y: rowTop(4) + 12, xh: 26, seed: 64, slant: .18, wob: 5 });
    pencilJobs.push([LATE.o0, LATE.o1, f => sweepTip(partial(o, ease(seg(f, LATE.o0, LATE.o1))).paths, rowTop(4) + 12, 26)]);
    for (const pt of POINT) { const sc = script(pt.text, { x: pt.x, y: pt.y, xh: pt.xh, seed: pt.seed, slant: .2, wob: 5 }); pencilJobs.push([pt.t0, pt.t1, f => sweepTip(partial(sc, ease(seg(f, pt.t0, pt.t1))).paths, pt.y, pt.xh)]); }
  }
  function toolPose(list, park, f) {
    for (const [a, b, fn] of list) if (f >= a && f < b) { const t = fn(f); if (t) return { tip: t, lift: 0 }; }
    let prevEnd = -1e9, nextStart = 1e9, pj = null, nj = null;
    for (const j of list) { if (j[1] <= f && j[1] > prevEnd) { prevEnd = j[1]; pj = j; } if (j[0] > f && j[0] < nextStart) { nextStart = j[0]; nj = j; } }
    const from = pj ? pj[2](prevEnd - 1) || park : park, to = nj ? nj[2](nextStart) || park : park;
    if (nextStart - prevEnd < 30 && pj && nj) { const k = ease(seg(f, prevEnd, nextStart)); return { tip: [lerp(from[0], to[0], k), lerp(from[1], to[1], k)], lift: Math.sin(k * Math.PI) }; }
    const kOut = ease(seg(f, prevEnd, prevEnd + 10)), kIn = ease(seg(f, nextStart - 10, nextStart));
    if (f < nextStart - 10) return { tip: [lerp(from[0], park[0], kOut), lerp(from[1], park[1], kOut)], lift: kOut };
    return { tip: [lerp(park[0], to[0], kIn), lerp(park[1], to[1], kIn)], lift: 1 - kIn };
  }
  function finish() {
    G.setTransform(1, 0, 0, 1, 0, 0);
    const v = G.createRadialGradient(420, 330, 200, 540, 540, 900);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,20,50,.34)');
    G.fillStyle = v; G.fillRect(0, 0, W, H);
  }
  function pull(f) {
    CAM = camAt(f);
    G.setTransform(1, 0, 0, 1, 0, 0); G.globalAlpha = 1; G.globalCompositeOperation = 'source-over'; G.filter = 'none';
    desk(); bookBody(); paperFinish(); rulings(); album(f); highlighter(f);
    entries(f); pencilWork(f); tallies(f); ruler(f); parcel(f); thread(f);
    const pc = toolPose(pencilJobs, PENCIL_PARK, f), pn = toolPose(penJobs, PEN_PARK, f);
    pencil(pc.tip, pc.lift); fountainPen(pn.tip, pn.lift);
    finish();
  }
  return {
    init(atFn, cards) { at = atFn; CARDS = cards; schedule(); jobs(); },
    setCards(cards) { CARDS = cards; },
    render(ctx, f, size) { pull(f); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(SHEET, 0, 0, size, size); ctx.restore(); },
    shots() { return SHOTS; },
  };
})();
