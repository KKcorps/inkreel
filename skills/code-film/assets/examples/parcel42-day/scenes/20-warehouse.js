// ================= scenes 20: the warehouse =========================
// placed: dawn in a huge warehouse. the aisle lamps wake from the far end,
// a yellow arm lifts one plain box off a cart and onto a shelf. a label lands,
// the box opens its eyes, and it is parcel 42.
// packed: the packing table, mid-morning and busy. tape zips over the lid,
// a sticker is slapped on the corner, and parcel 42 looks proud.
(() => {
  const OX = 34 / 150, OY = -26 / 150;            // parcel42's oblique depth, per unit of depth
  const fillAll = list => g => { for (const p of list) { poly(g, p); g.fill(); } };
  const lineAll = (list, w) => g => { g.lineWidth = w; for (const p of list) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.stroke(); } };
  function paint(S, list, { h = 0, c = [], m = [] } = {}) {
    if (!list.length) return;
    const fn = fillAll(list);
    if (h) hole(h, fn);
    for (const [k, d] of c) S[k].cut(d, fn);
    for (const [k, d] of m) S[k].mark(d, fn);
  }
  function softPaint(S, list, px, { h = 0, c = [], m = [] } = {}) {
    if (!list.length) return;
    const fn = g => soft(g, px, t => { for (const p of list) { poly(t, p); t.fill(); } });
    if (h) hole(h, fn);
    for (const [k, d] of c) S[k].cut(d, fn);
    for (const [k, d] of m) S[k].mark(d, fn);
  }
  const mp = (cam, pts) => pts.map(([x, y]) => at(cam, x, y));
  function obox(x0, y0, w, h, d) {
    const ex = d * OX, ey = d * OY, T = y0 - h, R = x0 + w;
    return { front: [[x0, T], [R, T], [R, y0], [x0, y0]], top: [[x0, T], [x0 + ex, T + ey], [R + ex, T + ey], [R, T]], side: [[R, T], [R + ex, T + ey], [R + ex, y0 + ey], [R, y0]], T, R, ex, ey };
  }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const bump = (u, c, w) => Math.exp(-Math.pow((u - c) / w, 2));
  // parcel 42's own frame, so tape and stickers ride its tilt and hop
  function pframe(x, y, s, tilt = 0, hop = 0) {
    y -= hop;
    const w = 150 * s, h = 130 * s, dx = 34 * s, dy = 26 * s, L = x - w / 2, T = y - h;
    const c = Math.cos(tilt), sn = Math.sin(tilt);
    const R = (px, py) => [x + (px - x) * c - (py - y) * sn, y + (px - x) * sn + (py - y) * c];
    return { x, y, s, w, h, dx, dy, L, T, R, P: pts => pts.map(([a, b]) => R(a, b)) };
  }
  // the same box as parcel 42 before it is anyone: no label, no face
  function plainBox(x, y, s, tilt = 0) {
    const B = pframe(x, y, s, tilt), { w, h, dx, dy, L, T, P } = B;
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
    const bx = L + w / 2 + dx / 2, by = T - dy / 2;
    A.ink.cut(.75, g => {
      g.lineWidth = 5 * s;
      const seg2 = pts => { const q = P(pts); g.beginPath(); g.moveTo(...q[0]); for (const p of q.slice(1)) g.lineTo(...p); g.stroke(); };
      seg2([[L + dx / 2, by], [L + w + dx / 2, by]]); seg2([[L + w + dx / 2, by], [L + w + dx / 2, y - dy / 2]]);
      const b1 = P([[bx, by], [bx - 26 * s, by - 16 * s], [bx - 30 * s, by - 2 * s]]), b2 = P([[bx, by], [bx + 28 * s, by - 14 * s], [bx + 30 * s, by]]);
      for (const b of [b1, b2]) { g.beginPath(); g.moveTo(...b[0]); g.quadraticCurveTo(...b[1], ...b[2]); g.closePath(); g.stroke(); }
    });
    return B;
  }
  // the arm's hand: a wrist block, a bar, two fingers hugging the box's sides.
  // (wx, wy) is the top of the wrist, s the box's scale, open spreads the fingers
  function gripper(S, wx, wy, s, open = 0) {
    const half = 92 * s + 12 * s + open * 16 * s;
    const wrist = [[wx - 22 * s, wy], [wx + 22 * s, wy], [wx + 26 * s, wy + 26 * s], [wx - 26 * s, wy + 26 * s]];
    const bar = [[wx - half - 4 * s, wy + 26 * s], [wx + half + 4 * s, wy + 26 * s], [wx + half + 4 * s, wy + 40 * s], [wx - half - 4 * s, wy + 40 * s]];
    const fl = [[wx - half - 4 * s, wy + 40 * s], [wx - half + 9 * s, wy + 40 * s], [wx - half + 9 * s, wy + 150 * s], [wx - half - 4 * s, wy + 142 * s]];
    const fr = [[wx + half - 9 * s, wy + 40 * s], [wx + half + 4 * s, wy + 40 * s], [wx + half + 4 * s, wy + 128 * s], [wx + half - 9 * s, wy + 136 * s]];
    const all = [wrist, bar, fl, fr];
    S.dark.mark(.95, g => { g.lineWidth = 5 * s; for (const p of all) { poly(g, p); g.stroke(); } });
    paint(S, all, { h: 1, m: [['light', .92]] });
    paint(S, [fl, fr, [[wx - 26 * s, wy + 18 * s], [wx + 26 * s, wy + 18 * s], [wx + 26 * s, wy + 26 * s], [wx - 26 * s, wy + 26 * s]]], { m: [['bright', .35], ['dark', .12]] });
    S.dark.mark(.9, g => { g.beginPath(); g.arc(wx, wy + 13 * s, 7 * s, 0, TAU); g.fill(); });
  }
  // a thick arm link with an ink outline, printed as yellow paint on a dark room
  function link(S, pts, w, ow) {
    const path = g => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
    S.dark.mark(.95, g => { g.lineCap = 'round'; g.lineWidth = w + ow; path(g); });
    hole(1, g => { g.lineCap = 'round'; g.lineWidth = w; path(g); });
    S.light.mark(.93, g => { g.lineCap = 'round'; g.lineWidth = w; path(g); });
    S.bright.mark(.3, g => { g.lineCap = 'butt'; g.lineWidth = w * .3; g.translate(w * .22, w * .22); path(g); });
  }
  const star4 = (g, x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); };

  // ============================ PLACED ============================
  // wide shot: a one point aisle in real perspective. X across, Y up, Z away, in metres.
  const VX = 470, VY = 400, F = 560, EH = 3.6, Z0 = 2.0, ZF = 46;
  const BAYS = []; for (let z = 2.6; z < ZF; z += 2.7) BAYS.push(z);
  const LEVELS = [.15, 1.9, 3.65, 5.4, 7.15, 8.9];
  const SLOT = { z0: 7.1, z1: 9.6, j: 2 };          // the empty place on the right rack parcel 42 is lifted into
  let RACK = null;
  function rackBoxes() {
    if (RACK) return RACK;
    const r = rng(4242), out = [];
    for (const sd of [-1, 1]) for (let i = 0; i < BAYS.length; i++) for (let j = 0; j < 5; j++) {
      const z0 = BAYS[i] + .16, z1 = BAYS[i] + 2.7 - .05, y0 = LEVELS[j] + .15, ym = LEVELS[j + 1] - .12;
      let z = z0;
      while (z < z1 - .3) {
        const zb = Math.min(z1, z + .45 + r() * .85), hh = .45 + r() * (ym - y0 - .45), tone = r(), inset = r() * .3, gap = r();
        if (!(sd > 0 && j === SLOT.j && zb > SLOT.z0 && z < SLOT.z1) && gap > .08) out.push({ sd, za: z, zb, y0, y1: y0 + hh, tone, inset });
        z = zb + .04 + r() * .12;
      }
    }
    return RACK = out;
  }
  const L1 = 2.9, L2 = 2.6, SH = [1.15, 1.3, 7.3];
  function armPose(T) {
    const hx = T[0] - SH[0], hz = T[2] - SH[2], r = Math.hypot(hx, hz);
    const ux = r > 1e-3 ? hx / r : 1, uz = r > 1e-3 ? hz / r : 0, v = T[1] - SH[1];
    const d = Math.min(Math.hypot(r, v), L1 + L2 - .01);
    const a = Math.atan2(v, r), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const er = L1 * Math.cos(a + b), ev = L1 * Math.sin(a + b);
    return [SH[0] + ux * er, SH[1] + ev, SH[2] + uz * er];
  }
  // where the wrist is: resting over the cart, a lift through the light, a set down into the slot
  const P0 = [-.85, 1.72, 6.2], APEX = [.9, 6.6, 6.0], P1 = [3.2, 4.95, 8.4];
  function wristAt(u) {
    const k = easeInOutCubic(seg(u, .12, .44));
    const cx = 2 * APEX[0] - (P0[0] + P1[0]) / 2, cy = 2 * APEX[1] - (P0[1] + P1[1]) / 2, cz = 2 * APEX[2] - (P0[2] + P1[2]) / 2;
    const q = (a, c, b) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * c + k * k * b;
    const twitch = .06 * bump(u, .1, .012);
    return [q(P0[0], cx, P1[0]), q(P0[1], cy, P1[1]) + twitch - .3 * ease(seg(u, .44, .5)), q(P0[2], cz, P1[2])];
  }

  function placedWide(S, u, f, cam) {
    const pp = (X, Y, Z) => at(cam, VX + F * X / Z, VY - F * (Y - EH) / Z);
    const sc = Z => cam.s * F / Z;
    const lampOn = z => { const t0 = .02 + (ZF - z) / ZF * .12, k = seg(u, t0, t0 + .018); return k > 0 && k < 1 ? ((f + Math.round(z)) % 3 ? 1 : .15) : k; };
    // the room: dark, with a pink haze where the aisle runs out
    S.dark.flood(.93); S.bright.flood(.12);
    const [gx, gy] = pp(0, 2.2, ZF);
    S.dark.glow(gx, gy, 600 * cam.s, .62, .25, 'cut');
    S.bright.glow(gx, gy, 560 * cam.s, .42, .3);
    S.light.glow(gx, gy, 260 * cam.s, .6, .3);
    // the open dock door at the far end, dawn outside
    const door = [pp(-2.3, 4.8, ZF), pp(2.3, 4.8, ZF), pp(2.3, 0, ZF), pp(-2.3, 0, ZF)];
    hole(1, fillAll([door]));
    S.light.mark(1, g => { const gr = g.createLinearGradient(0, door[0][1], 0, door[2][1]); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(.75, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,.6)'); g.fillStyle = gr; poly(g, door); g.fill(); });
    S.bright.mark(1, g => { const gr = g.createLinearGradient(0, door[0][1], 0, door[2][1]); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,.1)'); g.fillStyle = gr; poly(g, door); g.fill(); });
    // the upper walls and their high windows
    const wallL = [pp(-5, 12, Z0), pp(-5, 12, ZF), pp(-5, 9.1, ZF), pp(-5, 9.1, Z0)], wallR = [pp(5, 12, Z0), pp(5, 12, ZF), pp(5, 9.1, ZF), pp(5, 9.1, Z0)];
    paint(S, [wallL, wallR], { c: [['dark', .1]], m: [['bright', .06]] });
    const winL = [], winR = [], mull = [];
    for (let z = 5.2; z < ZF - 2; z += 4) for (const sd of [-1, 1]) {
      const X = 5 * sd, q = [pp(X, 11.2, z), pp(X, 11.2, z + 1.6), pp(X, 9.6, z + 1.6), pp(X, 9.6, z)];
      (sd < 0 ? winL : winR).push(q);
      mull.push([pp(X, 11.2, z + .8), pp(X, 9.6, z + .8)], [pp(X, 10.4, z), pp(X, 10.4, z + 1.6)]);
    }
    paint(S, winR, { h: .96, m: [['light', .75], ['bright', .25]] });
    paint(S, winL, { h: .8, m: [['bright', .4], ['light', .18], ['dark', .1]] });
    S.dark.mark(.85, lineAll(mull, 3 * cam.s));
    // the roof: a lighter underside, dark trusses
    const ceil = [pp(-5, 12, Z0), pp(5, 12, Z0), pp(5, 12, ZF), pp(-5, 12, ZF)];
    paint(S, [ceil], { c: [['dark', .12]], m: [['bright', .05]] });
    const truss = [];
    for (const X of [-4, -2, 0, 2, 4]) truss.push([pp(X, 12, Z0), pp(X, 12, ZF)]);
    for (let z = 3; z < ZF; z += 3) truss.push([pp(-5, 12, z), pp(5, 12, z)]);
    const zz = []; for (let i = 0; 2.1 + i * 1.1 < ZF; i++) zz.push(pp(0, i % 2 ? 11.3 : 12, 2.1 + i * 1.1));
    truss.push(zz);
    S.dark.mark(.92, lineAll(truss, 3.2 * cam.s));
    // the floor: pale concrete, the door's light running down the middle, painted lanes
    const floor = [pp(-3, 0, Z0), pp(3, 0, Z0), pp(3, 0, ZF), pp(-3, 0, ZF)];
    paint(S, [floor], { c: [['dark', .1]], m: [['bright', .05]] });
    softPaint(S, [[pp(-.8, 0, Z0 + 5), pp(.8, 0, Z0 + 5), pp(.35, 0, ZF), pp(-.35, 0, ZF)]], 24 * cam.s, { c: [['dark', .62]], m: [['bright', .2], ['light', .06]] });
    const lanes = [];
    for (const X of [-2.4, 2.4]) lanes.push([pp(X - .06, 0, Z0), pp(X + .06, 0, Z0), pp(X + .06, 0, ZF), pp(X - .06, 0, ZF)]);
    paint(S, lanes, { h: .5, m: [['light', .6], ['bright', .2]] });
    const joints = []; for (let z = 3; z < ZF; z += 2.2) joints.push([pp(-3, 0, z), pp(3, 0, z)]);
    S.dark.mark(.3, lineAll(joints, 1.6 * cam.s));
    // the racks: box fronts in three tones, orange beams, indigo uprights
    const rk = rackBoxes(), tones = [[], [], []], tape = [], tags = [];
    for (const b of rk) {
      const X = b.sd * (3.06 + b.inset);
      const q = [pp(X, b.y1, b.za), pp(X, b.y1, b.zb), pp(X, b.y0, b.zb), pp(X, b.y0, b.za)];
      tones[b.tone < .55 ? 0 : b.tone < .85 ? 1 : 2].push(q);
      const zm = (b.za + b.zb) / 2;
      if (b.za < 24) {
        tape.push([pp(X, b.y1, zm), pp(X, b.y0 + (b.y1 - b.y0) * .55, zm)]);
        if (b.tone > .4) { const tz = b.za + (b.zb - b.za) * .15, ty = b.y0 + (b.y1 - b.y0) * .3; tags.push([pp(X, ty + .16, tz), pp(X, ty + .16, tz + .22), pp(X, ty, tz + .22), pp(X, ty, tz)]); }
      }
    }
    paint(S, tones[0], { c: [['dark', .4]], m: [['bright', .26]] });
    paint(S, tones[1], { c: [['dark', .52]], m: [['bright', .34], ['light', .2]] });
    paint(S, tones[2], { c: [['dark', .6]], m: [['light', .36], ['bright', .16]] });
    S.dark.mark(.32, lineAll(tape, 2.2 * cam.s));
    S.dark.mark(.55, lineAll(rk.filter(b => b.za < 16).map(b => { const X = b.sd * (3.06 + b.inset); return [pp(X, b.y0, b.za), pp(X, b.y1, b.za), pp(X, b.y1, b.zb), pp(X, b.y0, b.zb)]; }), 1.8 * cam.s));
    paint(S, tags, { h: .6 });
    const beams = [];
    for (const sd of [-1, 1]) for (const Y of LEVELS) beams.push([pp(3 * sd, Y + .15, Z0), pp(3 * sd, Y + .15, ZF), pp(3 * sd, Y, ZF), pp(3 * sd, Y, Z0)]);
    paint(S, beams, { h: .85, m: [['bright', .7], ['light', .8], ['dark', .08]] });
    const ups = [];
    for (const sd of [-1, 1]) for (const z of BAYS) {
      ups.push([pp(3 * sd, 9.05, z), pp(3.12 * sd, 9.05, z), pp(3.12 * sd, 0, z), pp(3 * sd, 0, z)]);
      ups.push([pp(3 * sd, 9.05, z), pp(3 * sd, 9.05, z + .12), pp(3 * sd, 0, z + .12), pp(3 * sd, 0, z)]);
    }
    paint(S, ups, { h: 1, m: [['dark', .95], ['bright', .12]] });
    // haze over the far end, so the aisle reads as long
    S.dark.glow(gx, gy, 300 * cam.s, .5, .2, 'cut');
    S.bright.glow(gx, gy, 240 * cam.s, .25, .3);
    // the lamps hang down the aisle and wake one after another toward us
    const shades = [], cords = [], bulbs = [], cones = [], pools = [], kOn = [];
    for (let z = 9; z < ZF - 3; z += 4.5) {
      shades.push([pp(-.14, 11.05, z), pp(.14, 11.05, z), pp(.42, 10.7, z), pp(-.42, 10.7, z)]);
      cords.push([pp(0, 12, z), pp(0, 11.05, z)]);
      const k = lampOn(z);
      if (k > 0) {
        bulbs.push([pp(-.3, 10.7, z), pp(.3, 10.7, z), pp(.18, 10.6, z), pp(-.18, 10.6, z)]);
        cones.push({ k, q: [pp(-.4, 10.7, z), pp(.4, 10.7, z), pp(2.2, 0, z), pp(-2.2, 0, z)] });
        const [px, py] = pp(0, 0, z), ry = (pp(0, 0, z - 1.4)[1] - pp(0, 0, z + 1.4)[1]) / 2;
        pools.push({ k, px, py, rx: 1.3 * sc(z), ry: ry * .62 });
      }
    }
    const kk = cones.length ? cones.reduce((a, c) => a + c.k, 0) / cones.length : 0;
    if (cones.length) {
      softPaint(S, cones.map(c => c.q), 18 * cam.s, { c: [['dark', .08 * kk]], m: [['light', .06 * kk]] });
      S.dark.cut(.62 * kk, g => soft(g, 20 * cam.s, t => { for (const p of pools) { t.beginPath(); t.ellipse(p.px, p.py, p.rx, Math.max(2, p.ry), 0, 0, TAU); t.fill(); } }));
      S.light.mark(.3 * kk, g => soft(g, 20 * cam.s, t => { for (const p of pools) { t.beginPath(); t.ellipse(p.px, p.py, p.rx, Math.max(2, p.ry), 0, 0, TAU); t.fill(); } }));
      paint(S, bulbs, { h: 1, m: [['light', .9]] });
    }
    S.dark.mark(.9, lineAll(cords, 1.4 * cam.s));
    paint(S, shades, { h: 1, m: [['dark', .92], ['bright', .15]] });
    // the cart the box waits on, with two boxes that stay asleep
    const cartTop = [pp(-1.55, .82, 5.5), pp(-.15, .82, 5.5), pp(-.15, .82, 7.1), pp(-1.55, .82, 7.1)];
    const cartFront = [pp(-1.55, .82, 5.5), pp(-.15, .82, 5.5), pp(-.15, .68, 5.5), pp(-1.55, .68, 5.5)];
    const legs = [[pp(-1.5, .68, 5.55), pp(-1.5, .1, 5.55)], [pp(-.2, .68, 5.55), pp(-.2, .1, 5.55)], [pp(-1.5, .68, 7.05), pp(-1.5, .1, 7.05)], [pp(-.2, .68, 7.05), pp(-.2, .1, 7.05)], [pp(-1.5, .82, 7.1), pp(-1.5, 1.45, 7.1), pp(-.2, 1.45, 7.1), pp(-.2, .82, 7.1)]];
    S.dark.mark(.95, lineAll(legs, 5 * cam.s));
    paint(S, [cartTop], { h: 1, m: [['dark', .38], ['bright', .32], ['light', .1]] });
    paint(S, [cartFront], { h: 1, m: [['dark', .95]] });
    S.dark.mark(.95, g => { for (const [X, Z] of [[-1.5, 5.55], [-.2, 5.55]]) { const [x, y] = pp(X, .08, Z); g.beginPath(); g.arc(x, y, .09 * sc(Z), 0, TAU); g.fill(); } });
    // two sleepers on the cart, behind where ours sat
    {
      const sl = [];
      for (const [X, Z, sz, hh] of [[-1.35, 6.75, .5, .42], [-.95, 6.95, .42, .5]]) {
        const [x0, y0] = pp(X, .82, Z), k = sc(Z);
        sl.push(obox(x0, y0, sz * k, hh * k, sz * k * .9));
      }
      for (const b of sl) {
        paint(S, [b.front, b.top, b.side], { h: 1 });
        paint(S, [b.front], { m: [['bright', .38], ['light', .45], ['dark', .12]] });
        paint(S, [b.top], { m: [['bright', .22], ['light', .4]] });
        paint(S, [b.side], { m: [['bright', .45], ['light', .45], ['dark', .35]] });
      }
    }
    // the arm: pedestal, two yellow links, the gripper and the box it carries
    const Tw = wristAt(u), E = armPose(Tw);
    const ped = [pp(.72, 0, SH[2]), pp(1.58, 0, SH[2]), pp(1.45, 1.1, SH[2]), pp(.85, 1.1, SH[2])];
    softPaint(S, [[pp(.2, 0, SH[2] - .6), pp(2.1, 0, SH[2] - .6), pp(2.1, 0, SH[2] + .8), pp(.2, 0, SH[2] + .8)]], 10 * cam.s, { m: [['dark', .35]] });
    paint(S, [ped], { h: 1, m: [['dark', .95], ['bright', .15]] });
    const beacon = pp(1.15, .72, SH[2] - .02), bOn = u > .135 ? (Math.floor(f / 3) % 2 ? .95 : .5) : .15;   // the order has come in: the arm's lamp wakes with the aisle
    const s2 = pp(...SH), e2 = pp(...E), t2 = pp(...Tw);
    link(S, [s2, e2], .36 * sc(SH[2]), 6 * cam.s);
    link(S, [e2, t2], .28 * sc((E[2] + Tw[2]) / 2), 6 * cam.s);
    S.dark.mark(.95, g => { for (const [p, r] of [[s2, .25 * sc(SH[2])], [e2, .21 * sc(E[2])]]) { g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill(); } });
    lit('light', .9, g => { for (const [p, r] of [[s2, .1 * sc(SH[2])], [e2, .08 * sc(E[2])]]) { g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill(); } });
    S.dark.mark(.95, g => { g.beginPath(); g.arc(beacon[0], beacon[1], .2 * sc(SH[2]), Math.PI, TAU); g.fill(); });
    lit('light', bOn, g => { g.beginPath(); g.arc(beacon[0], beacon[1], .15 * sc(SH[2]), Math.PI, TAU); g.fill(); });
    if (bOn > .9) { S.dark.glow(beacon[0], beacon[1], 1.3 * sc(SH[2]), .5, .25, 'cut'); S.light.glow(beacon[0], beacon[1], 1.3 * sc(SH[2]), .45, .25); }
    const bs = .6 * sc(Tw[2]) / 150;
    plainBox(t2[0] - 17 * bs, t2[1] + 202 * bs, bs);
    gripper(S, t2[0], t2[1], bs, 0);
    // god rays from the sunward windows, falling across the aisle to the floor
    const D = [-1, -1.25, .3], rays = [], lands = [], motes = [];
    const mr = rng(77);
    for (let z = 5.2; z < 30; z += 4) {
      const C = [[5, 11.2, z], [5, 11.2, z + 1.6], [5, 9.6, z + 1.6], [5, 9.6, z]];
      const hit = C.map(([X, Y, Z]) => { const t = Math.min(Y / -D[1], (X + 3) / -D[0]); return [X + D[0] * t, Y + D[1] * t, Z + D[2] * t]; });
      rays.push(hull([...C, ...hit].map(p => pp(...p))));
      lands.push(hit.map(p => pp(...p)));
      for (let i = 0; i < 14; i++) {
        const a = mr(), b = mr(), t = (mr() * 7.5 + f * .01) % 7.5, c0 = [5, 9.6 + 1.6 * a, z + 1.6 * b];
        const Z = c0[2] + D[2] * t, [x, y] = pp(c0[0] + D[0] * t, c0[1] + D[1] * t, Z);
        motes.push([x, y, (.02 + mr() * .025) * sc(Z)]);
      }
    }
    softPaint(S, rays, 12 * cam.s, { c: [['dark', .66]], m: [['light', .26], ['bright', .1]] });
    softPaint(S, lands, 5 * cam.s, { c: [['dark', .6]], m: [['light', .4]] });
    lit('light', .7, g => { for (const [x, y, r] of motes) { g.beginPath(); g.arc(x, y, Math.max(.8, r), 0, TAU); g.fill(); } });
    // a stack of boxes very near on the left, in silhouette with a rim of light
    const nc = camFor(cam, .72);
    const stack = [[90, 900, 210, 190, 130], [118, 712, 150, 96, 110], [-120, 960, 220, 330, 130]].map(([x, y, w, h, d]) => obox(x, y, w, h, d));
    for (const b of stack) paint(S, [mp(nc, b.front), mp(nc, b.top), mp(nc, b.side)], { h: 1 });
    paint(S, stack.map(b => mp(nc, b.front)), { m: [['dark', .97], ['bright', .3]] });
    paint(S, stack.map(b => mp(nc, b.side)), { m: [['dark', .97], ['bright', .12]] });
    paint(S, stack.map(b => mp(nc, b.top)), { m: [['dark', .42], ['bright', .34], ['light', .12]] });
    S.dark.mark(.5, lineAll(stack.map(b => { const cx = (b.front[0][0] + b.front[1][0]) / 2; return mp(nc, [[cx, b.T + 60], [cx, b.T], [cx + b.ex, b.T + b.ey]]); }), 9 * nc.s));
    lit('light', .8, lineAll(stack.map(b => mp(nc, [b.top[1], b.top[2], b.side[2]])), 3 * cam.s));
    dust(S, cam, f, { drum: 'dark', op: 'cut', d: .4, n: 26 });
  }

  // close shot: the right rack face on, the slot, the gripper setting the box down
  function placedClose(S, u, f, cam) {
    const far = camFor(cam, 1.4), mid = camFor(cam, 1.15);
    const P = (x, y) => at(cam, x, y), Q = pts => mp(cam, pts);
    // far layer: the next aisle, a tall dawn window, racks in haze
    S.dark.flood(.9); S.bright.flood(.14);
    const win = mp(far, [[500, 40], [960, 40], [960, 500], [500, 500]]);
    S.dark.glow(...at(far, 730, 330), 620 * far.s, .55, .3, 'cut');
    S.bright.glow(...at(far, 730, 330), 560 * far.s, .38, .3);
    hole(1, fillAll([win]));
    S.light.mark(1, g => { const gr = g.createLinearGradient(0, win[0][1], 0, win[2][1]); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(.6, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,.95)'); g.fillStyle = gr; poly(g, win); g.fill(); });
    S.bright.mark(1, g => { const gr = g.createLinearGradient(0, win[0][1], 0, win[2][1]); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(.7, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,.05)'); g.fillStyle = gr; poly(g, win); g.fill(); });
    const sun = at(far, 560, 250);
    S.light.glow(...sun, 200 * far.s, .55, .3);
    hole(1, g => { g.beginPath(); g.arc(sun[0], sun[1], 56 * far.s, 0, TAU); g.fill(); });
    S.light.disc(...sun, 56 * far.s, .92);    // the sun, just up, over where parcel 42 will sit
    S.bright.disc(...sun, 56 * far.s, .08);
    const wm = [];
    for (const x of [653, 807]) wm.push(mp(far, [[x, 40], [x, 500]]));
    for (const y of [193, 347]) wm.push(mp(far, [[500, y], [960, y]]));
    S.dark.mark(.9, lineAll(wm, 7 * far.s));
    S.dark.mark(.95, lineAll([mp(far, [[500, 40], [960, 40], [960, 500], [500, 500], [500, 40]])], 14 * far.s));
    const fr = [], fb = [], fx = [];
    for (const x of [30, 250, 470]) fr.push(mp(far, [[x, -100], [x + 26, -100], [x + 26, 1100], [x, 1100]]));
    for (const y of [120, 330, 540, 750]) fb.push(mp(far, [[-100, y], [520, y], [520, y + 18], [-100, y + 18]]));
    const fr2 = rng(9);
    for (const y of [120, 330, 540, 750]) for (let x = -90; x < 500; x += 70 + fr2() * 40) { const w = 50 + fr2() * 50, h = 60 + fr2() * 110; fx.push(mp(far, [[x, y - h], [x + w, y - h], [x + w, y], [x, y]])); }
    paint(S, fx, { c: [['dark', .2]], m: [['bright', .12]] });
    paint(S, fb, { h: .5, m: [['bright', .35], ['light', .3], ['dark', .2]] });
    paint(S, fr, { m: [['dark', .6]] });
    // the ray from the window, through the slot, onto parcel 42
    const ray = hull([win[0], win[3], [lerp(win[3][0], win[2][0], .55), win[2][1]], ...Q([[340, 640], [640, 640], [660, 600], [370, 600]])]);
    softPaint(S, [ray], 26 * cam.s, { c: [['dark', .7]], m: [['light', .28], ['bright', .12]] });
    // long streaks from the sun down through the slot
    const streaks = [];
    for (let i = 0; i < 5; i++) { const a = 1.95 + i * .13 + .015 * Math.sin(f * .05 + i), r0 = 70 * far.s, r1 = (at(cam, 0, 596)[1] - sun[1]) / Math.sin(a); streaks.push([[sun[0] + Math.cos(a) * r0, sun[1] + Math.sin(a) * r0], [sun[0] + Math.cos(a) * r1, sun[1] + Math.sin(a) * r1]]); }
    S.dark.cut(.5, g => soft(g, 6 * cam.s, t => { t.lineCap = 'round'; for (const [a, b] of streaks) { t.lineWidth = 16 * cam.s; t.beginPath(); t.moveTo(...a); t.lineTo(...b); t.stroke(); } }));
    S.light.mark(.3, g => soft(g, 6 * cam.s, t => { t.lineCap = 'round'; for (const [a, b] of streaks) { t.lineWidth = 16 * cam.s; t.beginPath(); t.moveTo(...a); t.lineTo(...b); t.stroke(); } }));
    // the level above: bottoms of boxes, the upper beam
    const upper = [], ur = rng(21);
    for (let x = -60; x < 1060; x += 190 + ur() * 60) upper.push(Q([[x, -80], [x + 170 + ur() * 30, -80], [x + 170 + ur() * 30, 150], [x, 150]]));
    paint(S, upper, { h: 1, m: [['dark', .66], ['bright', .24]] });
    S.dark.mark(.5, lineAll(upper.map(q => [q[3], q[2]]), 4 * cam.s));
    // the deck, the level below
    const deck = Q([[110, 640], [900, 640], [960, 594], [170, 594]]);
    paint(S, [deck], { h: 1, m: [['dark', .5], ['bright', .22], ['light', .1]] });
    const mesh = [];
    for (let x = 130; x < 900; x += 28) mesh.push(Q([[x, 640], [x + 60, 594]]));
    for (let k = 1; k < 4; k++) { const t = k / 4; mesh.push(Q([[110 + 60 * t, 640 - 46 * t], [900 + 60 * t, 640 - 46 * t]])); }
    S.dark.mark(.35, lineAll(mesh, 1.6 * cam.s));
    softPaint(S, [Q([[320, 640], [650, 640], [700, 598], [370, 598]])], 16 * cam.s, { c: [['dark', .72]], m: [['light', .45]] });
    const lower = [], lr = rng(33);
    for (let x = -40; x < 1060; x += 220 + lr() * 60) { const w = 190 + lr() * 30; lower.push(obox(x, 1300, w, 480 + lr() * 60, 240)); }
    for (const b of lower) { paint(S, [Q(b.front), Q(b.top), Q(b.side)], { h: 1 }); paint(S, [Q(b.front)], { m: [['dark', .8], ['bright', .2]] }); paint(S, [Q(b.top)], { m: [['dark', .5], ['bright', .3], ['light', .08]] }); paint(S, [Q(b.side)], { m: [['dark', .9]] }); }
    paint(S, lower.map(b => { const cx = (b.front[0][0] + b.front[1][0]) / 2; return Q([[cx - 10, b.T], [cx + 10, b.T], [cx + 10 + b.ex, b.T + b.ey], [cx - 10 + b.ex, b.T + b.ey]]); }), { c: [['dark', .3]], m: [['light', .12]] });
    paint(S, lower.map(b => Q([[b.front[0][0] + 26, b.T + 40], [b.front[0][0] + 96, b.T + 40], [b.front[0][0] + 96, b.T + 84], [b.front[0][0] + 26, b.T + 84]])), { h: .55 });
    // the sleepers either side of the slot
    const sleep = [obox(150, 638, 180, 248, 200), obox(184, 380, 128, 92, 140), obox(612, 638, 250, 168, 220), obox(664, 458, 150, 112, 150)];
    for (const grp of [[sleep[0], sleep[2]], [sleep[1], sleep[3]]]) {       // the bottom row, then the ones stacked on it
      paint(S, grp.flatMap(b => [Q(b.front), Q(b.top), Q(b.side)]), { h: 1 });
      paint(S, grp.map(b => Q(b.front)), { m: [['dark', .6], ['bright', .34]] });
      paint(S, grp.map(b => Q(b.top)), { m: [['dark', .2], ['bright', .32], ['light', .32]] });
      paint(S, grp.map(b => Q(b.side)), { m: [['dark', .82], ['bright', .3]] });
      S.dark.mark(.9, lineAll(grp.map(b => Q([b.front[3], b.front[0], b.top[1], b.top[2], b.side[2], b.side[3], b.front[3], b.front[2], b.front[1], b.top[2]])), 3 * cam.s));
      lit('light', .6, lineAll(grp.map(b => Q([b.top[1], b.top[2]])), 2.5 * cam.s));
    }
    const tp = [];
    for (const b of sleep) { const cx = (b.front[0][0] + b.front[1][0]) / 2; tp.push(Q([[cx - 9, b.T], [cx + 9, b.T], [cx + 9, b.T + 40], [cx - 9, b.T + 40]]), Q([[cx - 9, b.T], [cx + 9, b.T], [cx + 9 + b.ex, b.T + b.ey], [cx - 9 + b.ex, b.T + b.ey]])); }
    paint(S, tp, { c: [['dark', .22]], m: [['light', .16]] });
    const stk = [Q([[190, 560], [262, 560], [262, 612], [190, 612]]), Q([[660, 580], [740, 580], [740, 620], [660, 620]])];
    paint(S, stk, { h: .92 });
    S.dark.mark(.7, lineAll([...[0, 1, 2, 3, 4, 5].map(i => Q([[198 + i * 10, 586], [198 + i * 10, 606]])), ...[0, 1, 2, 3, 4, 5, 6].map(i => Q([[668 + i * 10, 598], [668 + i * 10, 614]]))], 3 * cam.s));
    // beams and uprights, orange and indigo
    const beams = [Q([[-40, 150], [1040, 150], [1040, 196], [-40, 196]]), Q([[-40, 640], [1040, 640], [1040, 690], [-40, 690]])];
    paint(S, beams, { h: 1, m: [['bright', .78], ['light', .9]] });
    S.dark.mark(.35, lineAll([Q([[-40, 690], [1040, 690]]), Q([[-40, 196], [1040, 196]])], 5 * cam.s));
    const cards = [Q([[430, 650], [512, 650], [512, 682], [430, 682]]), Q([[180, 650], [262, 650], [262, 682], [180, 682]]), Q([[700, 650], [782, 650], [782, 682], [700, 682]]), Q([[300, 158], [382, 158], [382, 190], [300, 190]]), Q([[720, 158], [802, 158], [802, 190], [720, 190]])];
    paint(S, cards, { h: 1 });
    const bars = [];
    for (const c of cards) { const x0 = c[0][0], y0 = c[0][1], y1 = c[2][1], wd = c[1][0] - x0; const br = rng(Math.round(x0)); for (let i = 0; i < 14; i++) { const x = x0 + wd * (.1 + .8 * i / 14); bars.push([[x, y0 + (y1 - y0) * .2], [x, y1 - (y1 - y0) * .2]]); } }
    S.dark.mark(.85, lineAll(bars, 2 * cam.s));
    const ups = [Q([[62, -100], [124, -100], [124, 1100], [62, 1100]]), Q([[884, -100], [946, -100], [946, 1100], [884, 1100]])];
    paint(S, ups, { h: 1, m: [['dark', .92], ['bright', .14]] });
    S.dark.cut(.28, fillAll([Q([[70, -100], [82, -100], [82, 1100], [70, 1100]]), Q([[892, -100], [904, -100], [904, 1100], [892, 1100]])]));
    const holesU = [];
    for (let y = -80; y < 1100; y += 34) for (const x of [103, 925]) holesU.push(Q([[x - 5, y], [x + 5, y], [x + 5, y + 14], [x - 5, y + 14]]));
    paint(S, holesU, { h: .8 });
    // the box comes down into the slot, the gripper lets go and rises, the label lands
    const PX = 470, PY = 638, PS = 1.35;
    const land = .535, stamp = .58;
    const drop = u < land ? 80 * (1 - easeOutCubic(seg(u, .5, land))) : 0;
    const settle = u >= land && u < stamp ? 3 * Math.sin((u - land) * 180) * Math.exp(-(u - land) * 60) : 0;
    const open = easeOutCubic(seg(u, .55, .575));
    const rise = 700 * easeInQuad(seg(u, .575, .68));
    // a contact shadow where the box meets the deck
    if (u >= land) softPaint(S, [Q([[PX - 104, PY - 6], [PX + 150, PY - 40], [PX + 150, PY - 30], [PX + 104, PY + 4], [PX - 104, PY + 4]])], 6 * cam.s, { m: [['dark', .5]] });
    const [bx, by] = P(PX, PY - drop), bs = PS * cam.s;
    const wx = bx - (-17 * bs), wy = by - 202 * bs;
    const wxR = wx, wyR = wy - rise * cam.s;
    if (rise < 690) link(S, [[wxR + 10 * bs, wyR - 10 * bs], [wxR + 420 * cam.s, wyR - 760 * cam.s]], 58 * bs, 6 * cam.s);
    let pinfo = null;
    if (u < stamp) plainBox(bx, by + settle, bs);
    else {
      const a = u, bl = a < .62 ? 1 : a < .64 ? lerp(1, .35, seg(a, .62, .64)) : a < .66 ? lerp(.35, .9, seg(a, .64, .66)) : a < .7 ? lerp(.9, 0, seg(a, .66, .7)) : (a > .87 && a < .9 ? Math.sin(seg(a, .87, .9) * Math.PI) : 0);
      const gz = a < .7 ? [0, .3] : a < .8 ? [lerp(0, .85, ease(seg(a, .7, .74))), lerp(.3, -.55, ease(seg(a, .7, .74)))] : a < .92 ? [lerp(.85, -.9, ease(seg(a, .8, .85))), lerp(-.55, .05, ease(seg(a, .8, .85)))] : [lerp(-.9, .1, ease(seg(a, .92, .96))), lerp(.05, .25, ease(seg(a, .92, .96)))];
      const hop = 14 * Math.sin(Math.PI * seg(a, stamp, stamp + .035));
      const tilt = .03 * Math.sin((a - .6) * 22) * seg(a, .66, .72) + (a < .64 ? -.02 * Math.sin(seg(a, stamp, .64) * Math.PI) : 0);
      parcel42(bx, by, bs, { blink: bl, gaze: gz, hop, tilt });
      pinfo = pframe(bx, by, bs, tilt, hop);
    }
    if (rise < 690) gripper(S, wxR, wyR, bs, open);
    // the label lands: a burst of short rays round the box
    if (pinfo && u < stamp + .05) {
      const k = seg(u, stamp, stamp + .05), rr = [], cx = pinfo.L + (pinfo.w + pinfo.dx) / 2, cy = pinfo.T + pinfo.h / 2 - pinfo.dy / 2;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .2, r0 = 150 * bs + 50 * bs * k, r1 = r0 + 40 * bs * (1 - k); rr.push([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .9], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .9]]); }
      lit('light', .95 * (1 - k * .6), lineAll(rr, 6 * bs));
    }
    // it wakes in the light: a few motes catch the sun round its head
    const tw = [];
    for (let i = 0; i < 5; i++) { const ph = seg(u, .64 + i * .05, .74 + i * .05); if (ph > 0 && ph < 1) tw.push([bx + (60 + 60 * Math.cos(i * 2.1)) * bs, by - (190 + 35 * Math.sin(i * 1.7)) * bs, 13 * bs * Math.sin(ph * Math.PI)]); }
    if (tw.length) lit('light', .95, g => { for (const [x, y, r] of tw) star4(g, x, y, r); });
    // motes in the ray, and soft dust very near
    const mr = rng(5), motes = [], box = pinfo || pframe(bx, by, bs);
    for (let i = 0; i < 46; i++) {
      const t = mr(), sx = mr(), r0 = 1 + mr() * 1.8, tt = (t + f * .003) % 1;
      const top = [lerp(win[0][0], lerp(win[3][0], win[2][0], .55), sx), win[3][1]], bot = at(cam, lerp(340, 640, sx), 600);
      const x = lerp(top[0], bot[0], tt) + Math.sin(i * 1.3 + f * .05) * 5, y = lerp(top[1], bot[1], tt);
      if (x > box.L - 6 && x < box.L + box.w + box.dx + 6 && y > box.T - box.dy - 6 && y < box.y + 6) continue;
      motes.push([x, y, r0]);
    }
    lit('light', .8, g => { for (const [x, y, r] of motes) { g.beginPath(); g.arc(x, y, r * cam.s, 0, TAU); g.fill(); } });
    dust(S, cam, f, { drum: 'dark', op: 'cut', d: .42, n: 22 });
  }

  LIVED.placed = {
    cam: (Wd, u) => u < .5 ? [500, lerp(470, 440, ease(u * 2)), lerp(1000, 800, ease(u * 2))] : [495, lerp(478, 484, u * 2 - 1), lerp(1000, 880, easeOutCubic(u * 2 - 1))],
    draw: (S, u, Wd, cam) => {
      inks('#002654', '#F94F8D', '#FFC61F');
      if (u < .5) placedWide(S, u, Wd.frame, cam);
      else placedClose(S, u, Wd.frame, cam);
    },
  };

  // ============================ PACKED ============================
  const PX = 520, PY = 790, PS = 1.3;
  // a work glove seen from the back, fingers along +x, with a cuff and a sleeve to (sx, sy)
  function glove(S, x, y, sz, ang, { curl = 0, sleeve = null, spread = 0 } = {}) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const T = (lx, ly) => [x + (lx * c - ly * s) * sz, y + (lx * s + ly * c) * sz];
    const cap = (ax, ay, bx, by, r) => { const [a0, a1] = T(ax, ay), [b0, b1] = T(bx, by); return [[a0, a1], [b0, b1], r * sz]; };
    const fingers = [];
    const flen = 40 * (1 - curl) + 12;
    for (let i = 0; i < 4; i++) { const fy = -21 + i * 14; fingers.push(cap(20, fy, 20 + flen - Math.abs(i - 1.3) * 4, fy + spread * (i - 1.5) * 4, 7.5)); }
    const thumb = cap(-4, -26, 22 - curl * 10, -44 + curl * 12, 8);
    const palm = [T(-42, -30), T(24, -30), T(28, 30), T(-42, 30)];
    const cuff = [T(-66, -34), T(-40, -34), T(-40, 34), T(-66, 34)];
    const caps = [...fingers, thumb];
    const draw = (g, extra) => {
      poly(g, palm); g.fill(); poly(g, cuff); g.fill();
      for (const [a, b, r] of caps) { g.lineWidth = 2 * r + extra; g.lineCap = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    };
    if (sleeve) {
      const a = T(-60, 0);
      S.dark.mark(.95, g => { g.lineCap = 'round'; g.lineWidth = 78 * sz + 6; g.beginPath(); g.moveTo(...a); g.lineTo(...sleeve); g.stroke(); });
      hole(1, g => { g.lineCap = 'round'; g.lineWidth = 78 * sz; g.beginPath(); g.moveTo(...a); g.lineTo(...sleeve); g.stroke(); });
      S.dark.mark(.5, g => { g.lineCap = 'round'; g.lineWidth = 78 * sz; g.beginPath(); g.moveTo(...a); g.lineTo(...sleeve); g.stroke(); });
      S.bright.mark(.4, g => { g.lineCap = 'round'; g.lineWidth = 78 * sz; g.beginPath(); g.moveTo(...a); g.lineTo(...sleeve); g.stroke(); });
      S.dark.mark(.3, g => { g.lineCap = 'butt'; g.lineWidth = 16 * sz; g.translate(-14 * sz * s, 14 * sz * c); g.beginPath(); g.moveTo(...a); g.lineTo(...sleeve); g.stroke(); });
    }
    S.dark.mark(.95, g => { g.strokeStyle = '#fff'; g.lineJoin = 'round'; g.lineWidth = 6; poly(g, palm); g.stroke(); poly(g, cuff); g.stroke(); draw(g, 6); });
    hole(1, g => draw(g, 0));
    S.light.mark(.88, g => draw(g, 0));
    S.dark.mark(.06, g => draw(g, 0));
    S.light.cut(.9, fillAll([cuff])); S.bright.mark(.85, fillAll([cuff]));
    S.dark.mark(.5, g => { g.lineWidth = 2.2; for (const [a, b] of fingers.slice(1)) { const m = [(a[0] * 2 + b[0]) / 3, (a[1] * 2 + b[1]) / 3]; g.beginPath(); g.moveTo(...a); g.lineTo(...m); g.stroke(); } });
    return T;
  }
  // a pistol tape gun in a gloved fist. (x, y) is where its roller meets the box,
  // ang the way it runs; the sleeve goes off to (sx, sy)
  function tapeGun(S, x, y, sz, ang, sleeveEnd) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const T = (lx, ly) => [x + (lx * c - ly * s) * sz, y + (lx * s + ly * c) * sz];
    const stroke = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
    // the sleeve and the cuff first, they are behind the fist
    const wr = T(-96, -104);
    if (sleeveEnd) {
      S.dark.mark(.95, g => { g.lineWidth = 50 * sz + 6; stroke(g, [wr, sleeveEnd]); });
      hole(1, g => { g.lineWidth = 50 * sz; stroke(g, [wr, sleeveEnd]); });
      S.dark.mark(.42, g => { g.lineWidth = 50 * sz; stroke(g, [wr, sleeveEnd]); });
      S.bright.mark(.45, g => { g.lineWidth = 50 * sz; stroke(g, [wr, sleeveEnd]); });
      S.dark.mark(.25, g => { g.lineWidth = 14 * sz; g.translate(0, 14 * sz); stroke(g, [wr, sleeveEnd]); });
    }
    const cuff = [T(-116, -118), T(-80, -128), T(-72, -96), T(-104, -84)];
    // the roll of tape
    const roll = T(-16, -62), R = 44 * sz;
    S.dark.mark(.95, g => { g.beginPath(); g.arc(roll[0], roll[1], R + 3, 0, TAU); g.fill(); });
    hole(1, g => { g.beginPath(); g.arc(roll[0], roll[1], R, 0, TAU); g.fill(); });
    S.bright.mark(.62, g => { g.beginPath(); g.arc(roll[0], roll[1], R, 0, TAU); g.fill(); });
    S.bright.cut(.4, g => { g.lineWidth = 2.5 * sz; for (const k of [.62, .8]) { g.beginPath(); g.arc(roll[0], roll[1], R * k, 0, TAU); g.stroke(); } });
    hole(1, g => { g.beginPath(); g.arc(roll[0], roll[1], R * .44, 0, TAU); g.fill(); });
    S.light.mark(.85, g => { g.lineWidth = 8 * sz; g.beginPath(); g.arc(roll[0], roll[1], R * .4, 0, TAU); g.stroke(); });
    // the frame: roller arm, hub, handle
    const plate = [T(10, -2), T(8, -38), T(-12, -72), T(-26, -66), T(-12, -34), T(-14, -2)];
    const handle = [T(-24, -66), T(-18, -54), T(-104, -80), T(-110, -94)];
    S.dark.mark(.95, g => { g.lineJoin = 'round'; g.lineWidth = 6; poly(g, plate); g.stroke(); poly(g, handle); g.stroke(); });
    paint(S, [plate, handle], { h: 1, m: [['dark', .85], ['bright', .12]] });
    const hub = T(-16, -62), rl = T(0, -6);
    S.dark.mark(.95, g => { g.beginPath(); g.arc(hub[0], hub[1], 9 * sz, 0, TAU); g.fill(); g.beginPath(); g.arc(rl[0], rl[1], 10 * sz, 0, TAU); g.fill(); });
    lit('light', .9, g => { g.beginPath(); g.arc(rl[0], rl[1], 4 * sz, 0, TAU); g.fill(); g.beginPath(); g.arc(hub[0], hub[1], 3.5 * sz, 0, TAU); g.fill(); });
    const teeth = []; for (let i = 0; i < 5; i++) teeth.push([T(12 + i * 3.2, -16 + i * 3.4), T(19 + i * 3.2, -13 + i * 3.4), T(13 + i * 3.2, -9 + i * 3.4)]);
    paint(S, teeth, { m: [['dark', .95]] });
    // the fist round the handle: a palm, four knuckles on top, a thumb over the front
    const knuck = [T(-54, -84), T(-68, -89), T(-82, -93), T(-96, -97)];
    const palm = [T(-44, -72), T(-100, -86), T(-106, -66), T(-52, -52)];
    const thumbA = T(-50, -58), thumbB = T(-34, -74);
    const fist = (g, e) => { g.lineJoin = 'round'; g.lineCap = 'round'; poly(g, palm); g.fill(); g.lineWidth = e; if (e) g.stroke(); for (const k of knuck) { g.beginPath(); g.arc(k[0], k[1], 10 * sz + e / 2, 0, TAU); g.fill(); } g.lineWidth = 17 * sz + e; g.beginPath(); g.moveTo(...thumbA); g.lineTo(...thumbB); g.stroke(); poly(g, cuff); g.fill(); if (e) g.stroke(); };
    S.dark.mark(.95, g => fist(g, 6));
    hole(1, g => fist(g, 0));
    S.light.mark(.88, g => fist(g, 0)); S.dark.mark(.06, g => fist(g, 0));
    S.light.cut(.9, fillAll([cuff])); S.bright.mark(.85, fillAll([cuff]));
    S.dark.mark(.55, g => { g.lineWidth = 2.2; for (let i = 0; i < 3; i++) { const a = T(-61 - i * 14, -86 - i * 4), b = T(-58 - i * 14, -72 - i * 4); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } });
    return { T };
  }
  // the tape's path on parcel 42: up the front between the eyes, over the edge, along the seam
  function tapePath(B) {
    const p0 = [B.L + B.w / 2, B.T + 13 * B.s], p1 = [B.L + B.w / 2, B.T], p2 = [B.L + B.w / 2 + B.dx, B.T - B.dy];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    return { p0, p1, p2, l1, l2, at: lam => { const d = lam * (l1 + l2); if (d <= l1) { const k = d / l1; return [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), -Math.PI / 2]; } const k = (d - l1) / l2; return [lerp(p1[0], p2[0], k), lerp(p1[1], p2[1], k), Math.atan2(p2[1] - p1[1], p2[0] - p1[0])]; } };
  }
  function tapeOn(S, B, lam) {
    if (lam <= 0) return;
    const tp = tapePath(B), s = B.s, hw = 12 * s;
    const pieces = [];
    const k1 = Math.min(1, lam * (tp.l1 + tp.l2) / tp.l1);
    const yA = tp.p0[1], yB = lerp(tp.p0[1], tp.p1[1], k1);
    pieces.push(B.P([[tp.p0[0] - hw, yA], [tp.p0[0] + hw, yA], [tp.p0[0] + hw, yB], [tp.p0[0] - hw, yB]]));
    if (lam * (tp.l1 + tp.l2) > tp.l1) {
      const [ex, ey] = tp.at(lam);
      pieces.push(B.P([[tp.p1[0] - hw, tp.p1[1]], [tp.p1[0] + hw, tp.p1[1]], [ex + hw, ey], [ex - hw, ey]]));
    }
    A.ink.cut(.22, fillAll(pieces)); A.fringe.cut(.3, fillAll(pieces));
    S.bright.mark(.34, fillAll(pieces));
    S.bright.mark(.6, g => { g.lineWidth = 1.6 * s; for (const p of pieces) { g.beginPath(); g.moveTo(...p[0]); g.lineTo(...p[3]); g.moveTo(...p[1]); g.lineTo(...p[2]); g.stroke(); } });
    hole(.7, g => { g.lineWidth = 2.2 * s; for (const p of pieces) { g.beginPath(); const a = [lerp(p[0][0], p[1][0], .3), lerp(p[0][1], p[1][1], .3)], b = [lerp(p[3][0], p[2][0], .3), lerp(p[3][1], p[2][1], .3)]; g.moveTo(...a); g.lineTo(...b); g.stroke(); } });
  }
  // bubble wrap peeking out of the lid seam, where the tape has not reached yet
  function seamBubbles(S, B, lam) {
    const tp = tapePath(B), start = tp.l1 / (tp.l1 + tp.l2), from = Math.max(start, lam), out = [];
    for (let i = 0; i < 9; i++) { const q = start + (1 - start) * (i + .5) / 9; if (q < from + .03) continue; const [x, y] = tp.at(q); for (const o of [-1, 1]) out.push(B.R(x + o * 5 * B.s, y - 3 * B.s + (i % 2) * 2 * B.s)); }
    if (!out.length) return;
    const circ = g => { for (const [x, y] of out) { g.beginPath(); g.arc(x, y, 5.2 * B.s, 0, TAU); g.fill(); } };
    A.ink.cut(1, circ); A.fringe.cut(1, circ);
    S.bright.mark(.35, circ);
    S.bright.mark(.75, g => { g.lineWidth = 1.3 * B.s; for (const [x, y] of out) { g.beginPath(); g.arc(x, y, 5.2 * B.s, 0, TAU); g.stroke(); } });
  }
  // the shipping sticker, slapped over the top right corner and round onto the side
  function sticker(S, B) {
    const { L, T, w, dx, dy, s } = B;
    const fr = B.P([[L + w - 34 * s, T + 12 * s], [L + w, T + 7 * s], [L + w, T + 58 * s], [L + w - 33 * s, T + 63 * s]]);
    const sd = B.P([[L + w, T + 7 * s], [L + w + dx * .8, T + 7 * s - dy * .8 - 1 * s], [L + w + dx * .8, T + 58 * s - dy * .8 - 1 * s], [L + w, T + 58 * s]]);
    const both = fillAll([fr, sd]);
    A.ink.cut(1, both); A.fringe.cut(1, both);
    const band = pts => [pts[0], pts[1], [lerp(pts[1][0], pts[2][0], .3), lerp(pts[1][1], pts[2][1], .3)], [lerp(pts[0][0], pts[3][0], .3), lerp(pts[0][1], pts[3][1], .3)]];
    S.light.mark(.95, fillAll([band(fr), band(sd)]));
    S.dark.mark(.14, fillAll([sd]));
    const bars = [];
    for (let i = 0; i < 9; i++) { const k = .12 + .76 * i / 8; const a = [lerp(fr[0][0], fr[1][0], k), lerp(fr[0][1], fr[1][1], k)], b = [lerp(fr[3][0], fr[2][0], k), lerp(fr[3][1], fr[2][1], k)]; bars.push([[lerp(a[0], b[0], .42), lerp(a[1], b[1], .42)], [lerp(a[0], b[0], .88), lerp(a[1], b[1], .88)]]); }
    S.dark.mark(.9, lineAll(bars, (i => 2.2 * s)()));
    S.dark.mark(.7, lineAll([[...fr, fr[0]], [sd[1], sd[2], sd[3]]], 1.5 * s));
  }

  function packedDraw(S, u, f, cam) {
    const far = camFor(cam, 1.3), mid = camFor(cam, 1.12), lamps = camFor(cam, 1.2), near = camFor(cam, .62);
    const Q = pts => mp(cam, pts), P = (x, y) => at(cam, x, y);
    // the back wall, pale in the morning, and its big windows
    S.light.flood(.2); S.dark.flood(.03);
    const panes = [];
    for (let r = 0; r < 3; r++) for (let c = -3; c < 13; c++) panes.push(mp(far, [[c * 118 + 10, r * 92 - 90], [c * 118 + 118, r * 92 - 90], [c * 118 + 118, r * 92 - 8], [c * 118 + 10, r * 92 - 8]]));
    paint(S, panes, { h: 1 });
    S.bright.mark(1, g => { const [, y0] = at(far, 0, -90), [, y1] = at(far, 0, 190); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(255,255,255,.42)'); gr.addColorStop(1, 'rgba(255,255,255,.08)'); g.fillStyle = gr; for (const p of panes) { poly(g, p); g.fill(); } });
    const clouds = []; for (const [x, y, w] of [[60, 20, 170], [520, -40, 240], [900, 60, 150]]) clouds.push(mp(far, [[x, y], [x + w, y], [x + w * .8, y - 22], [x + w * .25, y - 26]]));
    softPaint(S, clouds, 10 * far.s, { c: [['bright', .3]] });
    S.dark.mark(.85, lineAll([mp(far, [[-400, 196], [1600, 196]])], 14 * far.s));
    // a plant on the sill
    const pot = mp(far, [[990, 188], [1040, 188], [1046, 146], [984, 146]]);
    const leaves = []; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * .34 + .04 * Math.sin(f * .05 + i); const [x0, y0] = at(far, 1015, 146); leaves.push([[x0, y0], [x0 + Math.cos(a) * 34 * far.s, y0 + Math.sin(a) * 48 * far.s], [x0 + Math.cos(a) * 56 * far.s, y0 + Math.sin(a) * 78 * far.s]]); }
    S.bright.strokes(leaves, { w: 13 * far.s, d: .9, tin: .1, tout: .7 }); S.light.strokes(leaves, { w: 13 * far.s, d: .9, tin: .1, tout: .7 });
    paint(S, [pot], { h: 1, m: [['dark', .7], ['light', .5]] });
    // the clock says ten past ten
    const [ccx, ccy] = at(far, 170, 280), cr = 40 * far.s;
    hole(1, g => { g.beginPath(); g.arc(ccx, ccy, cr, 0, TAU); g.fill(); });
    S.dark.mark(.9, g => { g.lineWidth = 7 * far.s; g.beginPath(); g.arc(ccx, ccy, cr, 0, TAU); g.stroke(); g.lineWidth = 2.4 * far.s; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(ccx + Math.cos(a) * cr * .78, ccy + Math.sin(a) * cr * .78); g.lineTo(ccx + Math.cos(a) * cr * .9, ccy + Math.sin(a) * cr * .9); g.stroke(); } const ha = (10 + 10 / 60) / 12 * TAU - Math.PI / 2, ma = 10 / 60 * TAU - Math.PI / 2; g.lineWidth = 5 * far.s; g.beginPath(); g.moveTo(ccx, ccy); g.lineTo(ccx + Math.cos(ha) * cr * .5, ccy + Math.sin(ha) * cr * .5); g.stroke(); g.lineWidth = 3.4 * far.s; g.beginPath(); g.moveTo(ccx, ccy); g.lineTo(ccx + Math.cos(ma) * cr * .74, ccy + Math.sin(ma) * cr * .74); g.stroke(); });
    const sa = ((f / FPS) % 60) / 60 * TAU - Math.PI / 2 + 2.2;
    S.bright.mark(.95, g => { g.lineWidth = 1.8 * far.s; g.beginPath(); g.moveTo(ccx, ccy); g.lineTo(ccx + Math.cos(sa) * cr * .8, ccy + Math.sin(sa) * cr * .8); g.stroke(); });
    // the pendant lamps, swaying a little
    const lampSh = [], lampCord = [], lampGlow = [];
    for (let i = 0; i < 3; i++) {
      const lx = 160 + i * 360, a = .035 * Math.sin(f * .07 + i * 1.9), top = [lx, -300], len = 470;
      const bx = lx + Math.sin(a) * len, by = -300 + Math.cos(a) * len;
      lampCord.push(mp(lamps, [top, [bx, by]]));
      const dome = []; for (let k = 0; k <= 12; k++) { const t = Math.PI + k / 12 * Math.PI; dome.push([bx + Math.cos(t + a) * 62, by + 58 + Math.sin(t + a) * 58]); }
      lampSh.push(mp(lamps, dome));
      lampGlow.push(at(lamps, bx - Math.sin(a) * 60, by + Math.cos(a) * 62));
    }
    S.dark.mark(.9, lineAll(lampCord, 2.5 * lamps.s));
    paint(S, lampSh, { h: 1, m: [['bright', .8], ['dark', .3]] });
    lit('light', .95, g => { for (const [x, y] of lampGlow) { g.beginPath(); g.ellipse(x, y, 34 * lamps.s, 10 * lamps.s, 0, 0, TAU); g.fill(); } });
    for (const [x, y] of lampGlow) S.light.glow(x, y + 30 * lamps.s, 170 * lamps.s, .3, .3);
    // the conveyor behind the table, boxes riding it right to left
    const belt = mp(mid, [[-500, 470], [1600, 470], [1625, 451], [-475, 451]]);
    const rail = mp(mid, [[-500, 470], [1600, 470], [1600, 500], [-500, 500]]);
    paint(S, [belt], { h: 1, m: [['dark', .75], ['bright', .15]] });
    const legs = []; for (let x = -400; x < 1600; x += 260) legs.push(mp(mid, [[x, 500], [x, 600]]), mp(mid, [[x + 25, 490], [x + 25, 580]]));
    S.dark.mark(.8, lineAll(legs, 7 * mid.s));
    const riders = [];
    for (let i = 0; i < 8; i++) {
      const r = rng(900 + i), w = 90 + r() * 70, h = 60 + r() * 70, span = 1900;
      const x = ((i * 245 + 60 - f * 5.2) % span + span) % span - 450;
      riders.push({ b: obox(x, 466, w, h, 90), tape: r() > .3, tag: r() > .5 });
    }
    for (const { b, tape, tag } of riders) {
      paint(S, [mp(mid, b.front), mp(mid, b.top), mp(mid, b.side)], { h: 1 });
      paint(S, [mp(mid, b.front)], { m: [['light', .62], ['dark', .18]] });
      paint(S, [mp(mid, b.top)], { m: [['light', .42], ['dark', .07]] });
      paint(S, [mp(mid, b.side)], { m: [['light', .66], ['dark', .36]] });
      const cx = (b.front[0][0] + b.front[1][0]) / 2;
      if (tape) paint(S, [mp(mid, [[cx - 8, b.T], [cx + 8, b.T], [cx + 8 + b.ex, b.T + b.ey], [cx - 8 + b.ex, b.T + b.ey]]), mp(mid, [[cx - 8, b.T], [cx + 8, b.T], [cx + 8, b.T + 22], [cx - 8, b.T + 22]])], { m: [['bright', .55]] });
      if (tag) paint(S, [mp(mid, [[b.front[0][0] + 10, b.T + 30], [b.front[0][0] + 44, b.T + 30], [b.front[0][0] + 44, b.T + 52], [b.front[0][0] + 10, b.T + 52]])], { h: 1 });
    }
    softPaint(S, [mp(mid, [[-500, 500], [1600, 500], [1600, 640], [-500, 640]])], 14 * mid.s, { m: [['dark', .2], ['bright', .12]] });
    paint(S, [rail], { h: 1, m: [['bright', .7], ['dark', .35]] });
    const rolDots = []; for (let x = -480; x < 1600; x += 40) rolDots.push(at(mid, x - (f * 5.2 % 40), 485));
    S.dark.mark(.7, g => { for (const [x, y] of rolDots) { g.beginPath(); g.arc(x, y, 5 * mid.s, 0, TAU); g.fill(); } });
    // the table: warm wood, planks, grain
    const top = Q([[-300, 578], [1300, 578], [1300, 1200], [-300, 1200]]);
    paint(S, [top], { h: 1, m: [['light', .74], ['dark', .2], ['bright', .03]] });
    S.dark.mark(.55, lineAll([Q([[-300, 578], [1300, 578]])], 5 * cam.s));
    const planks = [];
    for (const y of [640, 715, 805, 910, 1030]) planks.push(Q([[-300, y], [1300, y]]));
    S.dark.mark(.2, lineAll(planks, 2.5 * cam.s));
    const grain = [], gr2 = rng(12);
    for (let i = 0; i < 26; i++) { const y = 600 + gr2() * 560, x = -200 + gr2() * 1400, l = 80 + gr2() * 200; grain.push(Q(wavy(x, x + l, y, 3, 90, gr2() * 6, 10))); }
    S.dark.mark(.1, lineAll(grain, 1.6 * cam.s));
    // sun through the windows, in long slanted bands
    const sun = [];
    for (const x of [-200, 250, 700, 1150]) sun.push(Q([[x, -100], [x + 150, -100], [x + 620, 1200], [x + 440, 1200]]));
    softPaint(S, sun, 30 * cam.s, { c: [['dark', .12], ['light', .12]] });
    // the cutting mat under parcel 42
    const mat = Q([[250, 840], [820, 840], [1004, 700], [434, 700]]);
    paint(S, [mat], { h: 1, m: [['bright', .6], ['dark', .14]] });
    const grid = [];
    for (let k = 1; k < 13; k++) { const t = k / 13; grid.push(Q([[lerp(250, 820, t), 840], [lerp(434, 1004, t), 700]])); }
    for (let k = 1; k < 6; k++) { const t = k / 6; grid.push(Q([[lerp(250, 434, t), lerp(840, 700, t)], [lerp(820, 1004, t), lerp(840, 700, t)]])); }
    S.bright.cut(.35, lineAll(grid, 1.6 * cam.s));
    S.dark.mark(.5, lineAll([[...mat, mat[0]]], 2.5 * cam.s));
    // bubble wrap roll standing on the left, a sheet pulled off it
    const rcx = 150, rb = 770, rr = 96, rt = 460;
    const body = Q([[rcx - rr, rt], [rcx + rr, rt], [rcx + rr, rb], [rcx - rr, rb]]);
    const ell = (cx, cy, rx, ry) => { const o = []; for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
    const rollAll = [body, Q(ell(rcx, rb, rr, 24)), Q(ell(rcx, rt, rr, 24))];
    S.dark.mark(.7, g => { g.lineWidth = 5 * cam.s; for (const p of rollAll) { poly(g, p); g.stroke(); } });
    paint(S, rollAll, { h: 1, m: [['bright', .24], ['dark', .05]] });
    S.bright.mark(1, g => { const [x0] = P(rcx - rr, 0), [x1] = P(rcx + rr, 0); const grd = g.createLinearGradient(x0, 0, x1, 0); grd.addColorStop(0, 'rgba(255,255,255,.4)'); grd.addColorStop(.35, 'rgba(255,255,255,0)'); grd.addColorStop(.8, 'rgba(255,255,255,.1)'); grd.addColorStop(1, 'rgba(255,255,255,.45)'); g.fillStyle = grd; poly(g, body); g.fill(); });
    paint(S, [Q(ell(rcx, rt, 30, 8))], { h: 1, m: [['light', .7], ['dark', .35]] });
    const sheet = Q([[rcx + rr - 10, 560], [rcx + rr + 60, 610], [360, 860], [120, 880], [110, 800]]);
    paint(S, [sheet], { h: 1, m: [['bright', .2]] });
    const bub = [], br = rng(3);
    for (let y = rt + 20; y < rb; y += 22) for (let x = rcx - rr + 12; x < rcx + rr; x += 22) bub.push([...P(x + ((y / 22) % 2) * 11, y), 7.5 * cam.s]);
    for (let y = 600; y < 880; y += 22) for (let x = 110; x < 440; x += 22) { const px = x + ((y / 22) % 2) * 11; bub.push([...P(px, y), 7.5 * cam.s, 1]); }
    const inSheet = ([x, y]) => { let c = false; for (let i = 0, j = sheet.length - 1; i < sheet.length; j = i++) { const [xi, yi] = sheet[i], [xj, yj] = sheet[j]; if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    const bubs = bub.filter(b => !b[3] || inSheet(b));
    S.bright.mark(.55, g => { g.lineWidth = 1.6 * cam.s; for (const [x, y, r] of bubs) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); } });
    hole(.85, g => { for (const [x, y, r] of bubs) { g.beginPath(); g.arc(x - r * .35, y - r * .35, r * .3, 0, TAU); g.fill(); } });
    // the right side of the table: a label printer, flat cardboard, a mug, scissors, a spare roll
    const flat = [obox(880, 850, 260, 14, 300), obox(892, 836, 250, 14, 290), obox(886, 822, 255, 14, 295)];
    for (const b of flat) { paint(S, [Q(b.front), Q(b.top), Q(b.side)], { h: 1 }); paint(S, [Q(b.front)], { m: [['light', .7], ['dark', .32]] }); paint(S, [Q(b.top)], { m: [['light', .55], ['dark', .14]] }); paint(S, [Q(b.side)], { m: [['light', .7], ['dark', .45]] }); }
    const prn = obox(860, 700, 140, 80, 120);
    paint(S, [Q(prn.front), Q(prn.top), Q(prn.side)], { h: 1 });
    paint(S, [Q(prn.front)], { m: [['dark', .78]] }); paint(S, [Q(prn.top)], { m: [['dark', .5], ['bright', .15]] }); paint(S, [Q(prn.side)], { m: [['dark', .92]] });
    const feed = Math.min(1, ((f % 40) / 40) * 1.4);
    const lbl = Q([[885, prn.T - 2], [950, prn.T - 2], [956 + feed * 8, prn.T - 2 - 60 * feed], [891 + feed * 8, prn.T - 2 - 60 * feed]]);
    paint(S, [lbl], { h: 1 });
    S.dark.mark(.7, lineAll([[...lbl, lbl[0]]], 1.6 * cam.s));
    lit('light', .95, g => { const [x, y] = P(980, prn.T + 30); g.beginPath(); g.arc(x, y, 6 * cam.s, 0, TAU); g.fill(); });
    // the mug, with steam
    const mug = Q([[705, 640], [765, 640], [765, 570], [705, 570]]);
    S.dark.mark(.9, g => { g.lineWidth = 9 * cam.s; const [hx, hy] = P(772, 602); g.beginPath(); g.arc(hx, hy, 18 * cam.s, -Math.PI / 2, Math.PI / 2); g.stroke(); });
    paint(S, [mug, Q(ell(735, 640, 30, 8))], { h: 1, m: [['bright', .75], ['dark', .2]] });
    paint(S, [Q(ell(735, 570, 30, 8))], { h: 1, m: [['dark', .85], ['light', .4]] });
    const steam = []; for (let i = 0; i < 3; i++) { const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(P(720 + i * 15 + Math.sin(t * 5 + f * .18 + i) * 8, 560 - t * 90)); } steam.push(pts); }
    S.dark.strokes(steam, { w: 3 * cam.s, d: .3, tin: .2, tout: .6 });
    const spare = [...P(330, 930)];
    S.dark.mark(.8, g => { g.beginPath(); g.ellipse(spare[0], spare[1], 52 * cam.s, 30 * cam.s, 0, 0, TAU); g.fill(); });
    hole(1, g => { g.beginPath(); g.ellipse(spare[0], spare[1], 48 * cam.s, 26 * cam.s, 0, 0, TAU); g.fill(); });
    S.bright.mark(.55, g => { g.beginPath(); g.ellipse(spare[0], spare[1], 48 * cam.s, 26 * cam.s, 0, 0, TAU); g.fill(); });
    hole(1, g => { g.beginPath(); g.ellipse(spare[0], spare[1] - 2 * cam.s, 22 * cam.s, 12 * cam.s, 0, 0, TAU); g.fill(); });
    const sc2 = [[...P(700, 925), 13 * cam.s], [...P(730, 940), 13 * cam.s]];
    S.dark.mark(.9, g => { g.lineWidth = 6 * cam.s; for (const [x, y, r] of sc2) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); } g.lineWidth = 5 * cam.s; const [a, b] = P(712, 915), [c, d] = P(800, 870), [e, h] = P(740, 928); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.moveTo(e, h); g.lineTo(c + 4, d + 6); g.stroke(); });
    // packing peanuts spilled about
    const pn = [], pr = rng(88);
    for (let i = 0; i < 24; i++) { const x = 40 + pr() * 950, y = 860 + pr() * 250, a = pr() * 3; if (x > 240 && x < 830 && y < 880) continue; pn.push([...P(x, y), a]); }
    S.dark.mark(.6, g => { for (const [x, y, a] of pn) { g.beginPath(); g.ellipse(x, y, 13 * cam.s, 7 * cam.s, a, 0, TAU); g.fill(); } });
    hole(1, g => { for (const [x, y, a] of pn) { g.beginPath(); g.ellipse(x, y, 11 * cam.s, 5.5 * cam.s, a, 0, TAU); g.fill(); } });
    // parcel 42's shadow on the mat
    softPaint(S, [Q([[PX - 100, PY], [PX + 140, PY - 40], [PX + 160, PY + 10], [PX - 90, PY + 26]])], 10 * cam.s, { m: [['dark', .3]] });

    // ---- the acting ----
    const [bx, by] = P(PX, PY), bs = PS * cam.s;
    let gaze = [-.7, -.4], squint = 0, blink = 0, smile = 0, tilt = 0, hop = 0;
    // shot one: the tape
    const zipK = easeInOutCubic(seg(u, .15, .29));
    if (u < .5) {
      gaze = u < .08 ? [-.8, -.3] : u < .3 ? [lerp(-.8, 0, ease(seg(u, .08, .13))), lerp(-.3, -1, ease(seg(u, .08, .13)))] : [lerp(0, .3, seg(u, .36, .42)), lerp(-1, .25, seg(u, .36, .42))];
      squint = seg(u, .13, .18) * (1 - seg(u, .31, .37));
      blink = u > .39 && u < .43 ? Math.sin(seg(u, .39, .43) * Math.PI) : 0;
      tilt = -.035 * seg(u, .15, .2) * (1 - seg(u, .3, .38)) + .02 * bump(u, .44, .02);
    } else {
      const slap = .555;
      blink = u >= slap && u < .6 ? 1 - seg(u, .585, .6) : 0;
      gaze = u < slap ? [.8, -.4] : u < .6 ? [0, .3] : u < .68 ? [lerp(0, .95, ease(seg(u, .6, .63))), lerp(.3, .35, ease(seg(u, .6, .63)))] : [lerp(.95, .1, ease(seg(u, .68, .72))), lerp(.35, -.35, ease(seg(u, .68, .72)))];
      smile = seg(u, .67, .72);
      tilt = u >= slap ? -.07 * Math.exp(-(u - slap) * 40) * Math.cos((u - slap) * 90) : 0;
      tilt += -.025 * seg(u, .72, .76) + .012 * Math.sin((u - .72) * 30) * seg(u, .76, .8);
      hop = 16 * Math.sin(Math.PI * seg(u, .685, .735));
      if (u > .88 && u < .91) blink = Math.sin(seg(u, .88, .91) * Math.PI);
    }
    const puff = u >= .5 ? 1 + .07 * bump(u, .71, .025) + .025 * seg(u, .72, .78) : 1;
    parcel42(bx, by, bs * puff, { gaze, squint, blink, smile, tilt, hop });
    const B = pframe(bx, by, bs * puff, tilt, hop);
    const lam = u < .5 ? zipK : 1;
    seamBubbles(S, B, lam);
    tapeOn(S, B, lam);
    if (u >= .555) sticker(S, B);
    // the tape gun, held in a gloved hand from the top left
    if (u < .46) {
      const tp = tapePath(B);
      let gx, gy, ga;
      if (u < .15) { const k = easeOutCubic(seg(u, .0, .12)); const [px, py] = tp.at(0); gx = lerp(px - 320 * bs, px, k); gy = lerp(py - 300 * bs, py, k) - 6 * bs * bump(u, .135, .01); ga = lerp(-.9, -Math.PI / 2 + .4, k); }
      else if (u < .29) { const [px, py, a] = tp.at(zipK); gx = px; gy = py; ga = a + .25; }
      else { const k = easeInQuad(seg(u, .32, .45)); const [px, py, a] = tp.at(1); const tear = seg(u, .29, .32); gx = px - 420 * bs * k; gy = py - 380 * bs * k; ga = a + .25 + .7 * tear - .4 * k; }
      tapeGun(S, gx, gy, 1.3 * bs, ga, [gx - 620 * bs, gy - 260 * bs]);
      if (u > .16 && u < .29) {
        const sl = [], [px, py, a] = tp.at(zipK);
        for (let i = 0; i < 3; i++) { const o = (70 + i * 24) * bs, nx = Math.sin(a), ny = -Math.cos(a), l0 = (60 + i * 14) * bs, l1 = (150 + i * 30) * bs; sl.push([[px - Math.cos(a) * l0 + nx * o, py - Math.sin(a) * l0 + ny * o], [px - Math.cos(a) * l1 + nx * o, py - Math.sin(a) * l1 + ny * o]]); }
        S.dark.strokes(sl, { w: 4 * bs, d: .6, tin: .1, tout: .6 });
      }
    }
    // the sticker, slapped on by a glove from the top right
    if (u >= .5 && u < .72) {
      const tx = B.L + B.w + 6 * B.s, ty = B.T + 30 * B.s;
      let hx, hy;
      if (u < .555) { const k = easeInQuad(seg(u, .5, .555)); hx = lerp(tx + 360 * bs, tx, k); hy = lerp(ty - 360 * bs, ty, k); }
      else if (u < .62) { hx = tx + Math.sin((u - .555) * 160) * 3 * bs; hy = ty; }
      else { const k = easeInQuad(seg(u, .62, .71)); hx = tx + 380 * bs * k; hy = ty - 420 * bs * k; }
      if (u < .555) {
        const held = [[hx - 60 * bs, hy - 30 * bs], [hx + 6 * bs, hy - 36 * bs], [hx + 10 * bs, hy + 22 * bs], [hx - 56 * bs, hy + 28 * bs]];
        paint(S, [held], { h: 1 }); S.light.mark(.95, fillAll([[held[0], held[1], [lerp(held[1][0], held[2][0], .3), lerp(held[1][1], held[2][1], .3)], [lerp(held[0][0], held[3][0], .3), lerp(held[0][1], held[3][1], .3)]]]));
        S.dark.mark(.7, lineAll([[...held, held[0]]], 1.5 * bs));
      }
      glove(S, hx + 40 * bs, hy - 20 * bs, .92 * bs, Math.PI + .5, { curl: 0, spread: .6, sleeve: [hx + 700 * bs, hy - 560 * bs] });
      if (u >= .555 && u < .61) {
        const k = seg(u, .555, .61), rays = [];
        for (let i = 0; i < 6; i++) { const a = -2.6 + i * .5, r0 = 95 * bs + 40 * bs * k, r1 = r0 + 38 * bs * (1 - k * .5); rays.push([[hx + 30 * bs + Math.cos(a) * r0, hy + Math.sin(a) * r0], [hx + 30 * bs + Math.cos(a) * r1, hy + Math.sin(a) * r1]]); }
        S.dark.strokes(rays, { w: 5 * bs, d: .85 * (1 - k * .5), tin: .1, tout: .9 });
      }
    }
    // pride: a glint runs along the fresh tape, little stars pop round it
    if (u > .76) {
      const tp = tapePath(B), k = seg(u, .76, .86);
      if (k > 0 && k < 1) { const [x, y] = B.R(...tp.at(k).slice(0, 2)), gl = g => star4(g, x, y, 20 * B.s * Math.sin(k * Math.PI)); A.ink.cut(1, gl); A.fringe.cut(1, gl); hole(1, gl); }
      const st = [];
      for (let i = 0; i < 5; i++) { const ph = seg(u, .74 + i * .04, .86 + i * .04); if (ph > 0 && ph < 1) st.push([B.L + B.w * [-.12, 1.2, .1, 1.05, .5][i], B.T - [40, 60, 90, 20, 110][i] * B.s, 20 * B.s * Math.sin(ph * Math.PI)]); }
      if (st.length) { S.dark.mark(.95, g => { for (const [x, y, r] of st) star4(g, x, y, r + 3); }); hole(1, g => { for (const [x, y, r] of st) star4(g, x, y, r * .72); }); S.light.mark(.95, g => { for (const [x, y, r] of st) star4(g, x, y, r * .72); }); }
    }
    // near: the corner of a box right by the lens, out of focus, and dust in the sun
    const nc = camFor(cam, .6), nb = obox(690, 1100, 420, 310, 260);
    const nf = [mp(nc, nb.front), mp(nc, nb.top), mp(nc, nb.side)], blur = 9 * cam.s;
    softPaint(S, nf, blur, { h: 1 });
    softPaint(S, [nf[0]], blur, { m: [['light', .7], ['dark', .3]] });
    softPaint(S, [nf[1]], blur, { m: [['light', .55], ['dark', .14]] });
    softPaint(S, [nf[2]], blur, { m: [['light', .7], ['dark', .48]] });
    softPaint(S, [mp(nc, [[870, nb.T], [900, nb.T], [900 + nb.ex, nb.T + nb.ey], [870 + nb.ex, nb.T + nb.ey]])], blur, { m: [['bright', .6]] });
    dust(S, cam, f, { drum: 'light', op: 'cut', d: .55, n: 18 });
  }

  LIVED.packed = {
    cam: (Wd, u) => u < .5 ? [lerp(520, 530, u * 2), lerp(560, 575, u * 2), lerp(1000, 940, ease(u * 2))] : [lerp(560, 566, u * 2 - 1), lerp(640, 646, u * 2 - 1), lerp(740, 690, easeOutCubic(u * 2 - 1))],
    draw: (S, u, Wd, cam) => {
      inks('#6F42C1', '#21C6DC', '#FFC61F');
      packedDraw(S, u, Wd.frame, cam);
    },
  };
})();
