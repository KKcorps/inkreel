// ============================================================================
// ask and delivered. The kid who waits for parcel 42, on the same front porch:
// at dusk behind a sign that asks the question, and in late-afternoon sun when
// the parcel is on the mat. World units match the plain frame. Every helper
// lives in the block below so other scene files never meet its names. Only
// kid() is global.
// ============================================================================

// The kid. x, y is the centre of the head in sheet units. s = 1 is a head 50
// units round. Dark drum for hair and line, light for skin, bright for the
// pajamas. `parts` picks what prints, so a scene can slip a sign or a parcel
// between the body and the arms. `over` also lifts the parcel's own drums.
function kid(x, y, s = 1, o = {}) {
  const {
    pose = 'stand', parts = ['body', 'head', 'arms'], gaze = [0, 0], blink = 0, lids = 0, happy = 0,
    mouth = 'smile', open = 0, tilt = 0, tuft = 0, wide = 0, arms = [], hands = [], over = false, cheeks = .42,
  } = o;
  const B = g => { g.translate(x, y); g.scale(s, s); };
  const Hd = g => { g.translate(x, y); g.rotate(tilt); g.scale(s, s); };
  const lift = fn => { hole(1, fn); if (over) { A.ink.cut(1, fn); A.fringe.cut(1, fn); } };
  const LW = 3.4;
  const has = p => parts.includes(p);

  // ---- body ----
  const torso = g => {
    g.beginPath();
    if (pose === 'hug') { g.moveTo(-16, 36); g.quadraticCurveTo(-60, 36, -64, 72); g.lineTo(-62, 150); g.lineTo(62, 150); g.lineTo(64, 72); g.quadraticCurveTo(60, 36, 16, 36); }
    else { g.moveTo(-14, 38); g.quadraticCurveTo(-46, 38, -50, 66); g.lineTo(-56, 152); g.lineTo(56, 152); g.lineTo(50, 66); g.quadraticCurveTo(46, 38, 14, 38); }
    g.closePath();
  };
  const legs = g => { g.beginPath(); g.roundRect(-47, 140, 43, 84, 12); g.roundRect(4, 140, 43, 84, 12); };
  const slippers = g => { g.beginPath(); g.ellipse(-28, 228, 27, 12, 0, 0, TAU); g.moveTo(53, 228); g.ellipse(28, 228, 27, 12, 0, 0, TAU); };
  const neck = g => { g.beginPath(); g.rect(-11, 28, 22, 16); };
  const collar = g => { g.beginPath(); g.ellipse(-12, 42, 13, 8, .35, 0, TAU); g.moveTo(25, 42); g.ellipse(12, 42, 13, 8, -.35, 0, TAU); };
  const standing = pose === 'stand';
  if (has('body')) {
    lift(g => { B(g); torso(g); g.fill(); neck(g); g.fill(); if (standing) { legs(g); g.fill(); slippers(g); g.fill(); } });
    S.light.mark(.22, g => { B(g); neck(g); g.fill(); });
    S.bright.mark(.62, g => { B(g); torso(g); g.fill(); if (standing) { legs(g); g.fill(); } });
    // paper polka dots on the pajamas, and a round collar
    S.bright.cut(1, g => {
      B(g); g.save(); torso(g); if (standing) { g.rect(-47, 140, 94, 84); } g.clip();
      for (let yy = 52; yy < 230; yy += 22) for (let xx = -66 + ((yy / 22) % 2) * 11; xx < 70; xx += 22) { g.moveTo(xx + 4, yy); g.arc(xx, yy, 4, 0, TAU); }
      g.fill(); g.restore(); collar(g); g.fill();
    });
    if (standing) S.bright.mark(.9, g => { B(g); slippers(g); g.fill(); });
    S.dark.mark(.85, g => {
      B(g); g.lineWidth = LW; torso(g); g.stroke(); collar(g); g.stroke();
      if (standing) { legs(g); g.stroke(); slippers(g); g.stroke(); }
      g.beginPath(); for (const by of [66, 92, 118]) { g.moveTo(3.5, by); g.arc(0, by, 3.5, 0, TAU); } g.fill();   // buttons
    });
  }

  // ---- head ----
  const skull = g => { g.beginPath(); g.arc(0, 0, 50, 0, TAU); };
  const ears = g => { g.beginPath(); g.arc(-49, 8, 11, 0, TAU); g.moveTo(60, 8); g.arc(49, 8, 11, 0, TAU); };
  const hair = g => {
    g.beginPath();
    g.moveTo(-51, 12);
    g.bezierCurveTo(-64, -30, -40, -63, 0, -63);
    g.bezierCurveTo(40, -63, 64, -30, 51, 12);
    // the fringe, right to left, in scallops
    g.quadraticCurveTo(48, -8, 38, -12);
    g.quadraticCurveTo(32, -26, 22, -8);
    g.quadraticCurveTo(14, -26, 2, -10);
    g.quadraticCurveTo(-8, -28, -20, -9);
    g.quadraticCurveTo(-30, -26, -39, -11);
    g.quadraticCurveTo(-48, -8, -51, 12);
    g.closePath();
  };
  const curl = g => {
    g.save(); g.translate(4, -60); g.rotate(tuft);
    g.beginPath(); g.moveTo(-9, 3); g.quadraticCurveTo(-14, -20, 2, -27); g.quadraticCurveTo(18, -32, 21, -19);
    g.quadraticCurveTo(22, -9, 12, -10); g.quadraticCurveTo(14, -18, 6, -18); g.quadraticCurveTo(-3, -16, 7, 3);
    g.closePath(); g.restore();
  };
  if (has('head')) {
    lift(g => { Hd(g); skull(g); g.fill(); ears(g); g.fill(); hair(g); g.fill(); curl(g); g.fill(); });
    S.light.mark(.22, g => { Hd(g); skull(g); g.fill(); ears(g); g.fill(); });
    S.bright.mark(.07, g => { Hd(g); skull(g); g.fill(); ears(g); g.fill(); });
    S.bright.mark(cheeks, g => soft(g, 5, h => { Hd(h); h.beginPath(); h.arc(-31, 22, 10, 0, TAU); h.moveTo(41, 22); h.arc(31, 22, 10, 0, TAU); h.fill(); }));
    S.dark.mark(.93, g => { Hd(g); hair(g); g.fill(); curl(g); g.fill(); });
    S.dark.cut(.45, g => { Hd(g); g.lineWidth = 5; g.beginPath(); g.arc(0, -8, 44, -2.5, -1.9); g.stroke(); });   // a shine on the hair
    S.dark.mark(.85, g => { Hd(g); g.lineWidth = LW; skull(g); g.stroke(); ears(g); g.stroke(); });
    // eyes: open ovals, or happy arcs, with a half lid for boredom
    const eyes = [[-18, 5], [18, 5]];
    const rx = 7 + wide * 2, ry = (9.5 + wide * 2.5) * (1 - blink * .9);
    if (happy > .5) {
      S.dark.mark(1, g => { Hd(g); g.lineWidth = 4.4; g.beginPath(); for (const [ex, ey] of eyes) { g.moveTo(ex - 9, ey + 3); g.quadraticCurveTo(ex, ey - 10, ex + 9, ey + 3); } g.stroke(); });
    } else if (blink > .75) {
      S.dark.mark(1, g => { Hd(g); g.lineWidth = 3.6; g.beginPath(); for (const [ex, ey] of eyes) { g.moveTo(ex - 8, ey + 1); g.quadraticCurveTo(ex, ey + 5, ex + 8, ey + 1); } g.stroke(); });
    } else {
      const gx = gaze[0] * 3.2, gy = gaze[1] * 2.6;
      S.dark.mark(1, g => {
        Hd(g); g.save();
        if (lids > 0) { g.beginPath(); for (const [ex, ey] of eyes) g.rect(ex - 14, ey - ry + gy + 2 * ry * lids, 28, 30); g.clip(); }
        g.beginPath(); for (const [ex, ey] of eyes) { g.moveTo(ex + gx + rx, ey + gy); g.ellipse(ex + gx, ey + gy, rx, ry, 0, 0, TAU); } g.fill(); g.restore();
        if (lids > 0) { g.lineWidth = 3.2; g.beginPath(); for (const [ex, ey] of eyes) { const ly = ey - ry + gy + 2 * ry * lids; g.moveTo(ex + gx - rx - 2, ly); g.lineTo(ex + gx + rx + 2, ly); } g.stroke(); }
      });
      hole(1, g => { Hd(g); g.beginPath(); for (const [ex, ey] of eyes) { const hx = ex + gx + 2.4, hy = ey + gy - 3.6 + (lids > .4 ? 3 : 0); g.moveTo(hx + 2.8 + wide, hy); g.arc(hx, hy, 2.8 + wide, 0, TAU); if (wide > .3) { g.moveTo(hx - 3, hy + 7); g.arc(hx - 4.5, hy + 7, 1.5, 0, TAU); } } g.fill(); });
    }
    S.dark.mark(.55, g => { Hd(g); g.lineWidth = 2.6; g.beginPath(); g.moveTo(-3.5, 17); g.quadraticCurveTo(0, 20.5, 3.5, 17); g.stroke(); });
    if (mouth === 'grin') {
      const m = g => { g.beginPath(); g.moveTo(-16, 25); g.quadraticCurveTo(0, 27, 16, 25); g.quadraticCurveTo(15, 46, 0, 47); g.quadraticCurveTo(-15, 46, -16, 25); g.closePath(); };
      S.dark.mark(.92, g => { Hd(g); m(g); g.fill(); });
      S.dark.cut(1, g => { Hd(g); g.save(); m(g); g.clip(); g.beginPath(); g.ellipse(0, 44, 9, 6, 0, 0, TAU); g.fill(); g.restore(); });
      S.bright.mark(.85, g => { Hd(g); g.save(); m(g); g.clip(); g.beginPath(); g.ellipse(0, 44, 9, 6, 0, 0, TAU); g.fill(); g.restore(); });
    } else if (mouth === 'o') {
      S.dark.mark(.92, g => { Hd(g); g.beginPath(); g.ellipse(0, 31, 4.5 + 3 * open, 4 + 6 * open, 0, 0, TAU); g.fill(); });
    } else if (mouth === 'pout') {
      S.dark.mark(.9, g => { Hd(g); g.lineWidth = 3.4; g.beginPath(); g.moveTo(-8, 33); g.quadraticCurveTo(0, 27, 8, 32); g.stroke(); });
    } else {
      S.dark.mark(.9, g => { Hd(g); g.lineWidth = 3.6; g.beginPath(); g.moveTo(-11, 27); g.quadraticCurveTo(0, 37 + open * 4, 11, 27); g.stroke(); });
    }
  }

  // ---- arms: shoulder, bend, hand, as sleeves with a hand on the end ----
  if (has('arms') && arms.length) {
    const sl = (g, a) => { g.beginPath(); g.moveTo(...a[0]); g.quadraticCurveTo(...a[1], ...a[2]); };
    const palm = (g, a) => { const [hx, hy] = a[2]; g.moveTo(hx + 12, hy); g.arc(hx, hy, 12, 0, TAU); };
    lift(g => { B(g); g.lineWidth = 24 + 2 * LW; for (const a of arms) { sl(g, a); g.stroke(); } g.beginPath(); for (const a of arms) palm(g, a); g.fill(); });
    S.dark.mark(.85, g => { B(g); g.lineWidth = 24 + 2 * LW; for (const a of arms) { sl(g, a); g.stroke(); } });
    S.dark.cut(1, g => { B(g); g.lineWidth = 24; for (const a of arms) { sl(g, a); g.stroke(); } });
    S.bright.mark(.62, g => { B(g); g.lineWidth = 24; for (const a of arms) { sl(g, a); g.stroke(); } });
    S.dark.cut(1, g => { B(g); g.beginPath(); for (const a of arms) palm(g, a); g.fill(); });
    S.bright.cut(1, g => { B(g); g.beginPath(); for (const a of arms) palm(g, a); g.fill(); });
    S.light.mark(.22, g => { B(g); g.beginPath(); for (const a of arms) palm(g, a); g.fill(); });
    S.dark.mark(.85, g => { B(g); g.lineWidth = LW; g.beginPath(); for (const a of arms) palm(g, a); g.stroke(); });
  }
  // hands curled over an edge: an oval and three knuckle lines
  if (has('hands') && hands.length) {
    const hp = g => { g.beginPath(); for (const [hx, hy] of hands) { g.moveTo(hx + 15, hy); g.ellipse(hx, hy, 15, 12, 0, 0, TAU); } };
    lift(g => { B(g); hp(g); g.fill(); });
    S.light.mark(.24, g => { B(g); hp(g); g.fill(); });
    S.bright.mark(.08, g => { B(g); hp(g); g.fill(); });
    S.dark.mark(.85, g => {
      B(g); g.lineWidth = LW; hp(g); g.stroke();
      g.lineWidth = 2.4; g.beginPath(); for (const [hx, hy] of hands) for (const k of [-6, 0, 6]) { g.moveTo(hx + k, hy + 3); g.lineTo(hx + k, hy + 11); } g.stroke();
    });
  }
}

{
  // a layer further back moves and grows less. at the opening framing it sits
  // exactly where it was drawn, so every layer is authored in plain frame units
  const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const lay = (cam, d) => ({ cx: 500 + (cam.cx - 500) / d, cy: 500 + (cam.cy - 500) / d, s: 1 + (cam.s - 1) / d });
  const PP = (c, a) => a.map(([x, y]) => at(c, x, y));
  const R4 = (c, x0, y0, x1, y1) => PP(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const polyAll = (g, list) => { for (const p of list) { g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); } };
  const bump = (u, a, b) => Math.sin(seg(u, a, b) * Math.PI);
  // a vertical gradient pinned to world heights, so a sky moves with its layer
  const vgw = (drum, c, stops, op = 'mark') => S[drum][op](1, g => {
    const ys = stops.map(([wy]) => at(c, 0, wy)[1]), y0 = ys[0], y1 = ys[ys.length - 1];
    const gr = g.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([, d], i) => gr.addColorStop(clamp((ys[i] - y0) / (y1 - y0 || 1), 0, 1), 'rgba(255,255,255,' + d + ')'));
    g.fillStyle = gr; g.fillRect(-50, -50, U + 100, U + 100);
  });
  // the pen's words with letters set by their inked width, so "parcel" does not
  // open a gap before its l the way the engine's fixed advance does
  const penTight = (text, { x = 0, y = 0, size = 40, align = 'left', seed = 1, wob = 3.6, gap = 17 } = {}) => {
    const r = rng((seed * 7919 + SEED * 13) >>> 0), sc = size / 100, chars = [...text.toLowerCase()], offs = [];
    let adv = 0;
    for (const ch of chars) {
      const st = PEN[ch] || []; let mn = 1e9, mx = -1e9;
      for (const s of st) for (let i = 0; i < s.length; i += 2) { mn = Math.min(mn, s[i]); mx = Math.max(mx, s[i]); }
      if (!st.length) { offs.push(adv); adv += 52; continue; }
      offs.push(adv - mn); adv += mx - mn + gap;
    }
    adv -= gap;
    const ox = align === 'center' ? -adv * sc / 2 : align === 'right' ? -adv * sc : 0, paths = [];
    chars.forEach((ch, i) => { for (const s of PEN[ch] || []) { const pts = []; for (let k = 0; k < s.length; k += 2) pts.push([x + ox + (offs[i] + s[k] + (r() - .5) * wob) * sc, y + (s[k + 1] + (r() - .5) * wob) * sc]); paths.push(smooth(pts, 5)); } });
    return paths;
  };
  const heart = (g, x, y, r) => {
    g.moveTo(x, y + r * .95);
    g.bezierCurveTo(x - r * 1.7, y - r * .15, x - r * .75, y - r * 1.35, x, y - r * .42);
    g.bezierCurveTo(x + r * .75, y - r * 1.35, x + r * 1.7, y - r * .15, x, y + r * .95);
  };

  // ---- the porch, in world units, shared by both scenes -------------------
  const DOOR = [140, 380, 300, 730], WIN = [386, 394, 554, 598], LAMP = [336, 470];
  const MAT = [[150, 744], [286, 744], [300, 792], [136, 792]];
  const PORCH = 800, STEP = 848, WALK = 896, CORNER = 604;
  // the potted bush left of the door, the same pot at dusk and in sun
  const plant = (c, day) => {
    const x = 50, y = 794, r = rng(9), blobs = [];
    for (let i = 0; i < 12; i++) { const a = -Math.PI * (.06 + .88 * r()), rr = 30 + r() * 62; blobs.push([x + Math.cos(a) * rr * 1.05, y - 84 + Math.sin(a) * rr * .9, 24 + r() * 14]); }
    const bush = (g, dx = 0, dy = 0, k = 1) => { g.beginPath(); for (const [bx, by, br] of blobs) { const [px, py] = at(c, bx + dx, by + dy); g.moveTo(px + br * k * c.s, py); g.arc(px, py, br * k * c.s, 0, TAU); } };
    const pot = PP(c, [[x - 36, y - 64], [x + 36, y - 64], [x + 28, y], [x - 28, y]]), rim = R4(c, x - 43, y - 76, x + 43, y - 62);
    hole(1, g => { bush(g); g.fill(); g.beginPath(); polyAll(g, [pot, rim]); g.fill(); });
    if (day) {
      S.dark.mark(.52, g => { bush(g); g.fill(); }); S.light.mark(.7, g => { bush(g); g.fill(); });
      S.dark.cut(.4, g => { bush(g, 7, -6, .55); g.fill(); });
    } else {
      S.dark.mark(.86, g => { bush(g); g.fill(); }); S.bright.mark(.14, g => { bush(g); g.fill(); });
      S.dark.cut(.3, g => { bush(g, 8, -4, .45); g.fill(); });
    }
    S.bright.mark(.62, g => { g.beginPath(); polyAll(g, [pot, rim]); g.fill(); });
    S.light.mark(day ? .62 : .3, g => { g.beginPath(); polyAll(g, [pot, rim]); g.fill(); });
    S.dark.mark(day ? .1 : .42, g => { g.beginPath(); polyAll(g, [pot, rim]); g.fill(); });
    S.dark.mark(.8, g => { g.lineWidth = 3 * c.s; g.beginPath(); polyAll(g, [pot, rim]); g.stroke(); });
  };

  // ======================= ask ============================================
  // Evening. The kid sits on the porch edge under the lamp, peeking over a
  // sketchbook held up for the street. The question writes on while the kid
  // asks it. Down the hill the road's lamps come on one by one. The mat by
  // the door is empty. A slow push in, from the whole porch to the kid.
  const KX = 445, KY = 600, KS = 1.1;                       // the kid's head, and its size
  const SIGN = [295, 668, 595, 850];
  LIVED.ask = {
    cam: (W, u) => { const k = ease(u); return [lerp(500, 400, k), lerp(505, 612, k), lerp(1000, 720, k)]; },
    draw: (S, u, W, cam) => {
      inks('#001E43', '#F94F8D', '#FFC61F');
      const f = W.frame, r = rng((SEED * 131 + 17) >>> 0);
      const sky = lay(cam, 5), far = lay(cam, 3.2), hill = lay(cam, 2), mid = lay(cam, 1.25), fg = lay(cam, .62);

      // sky: deep indigo overhead, violet, then a rose band on the horizon
      vgw('dark', sky, [[-200, .93], [150, .82], [420, .56], [560, .26], [640, .18]]);
      vgw('bright', sky, [[-200, .06], [200, .2], [430, .42], [560, .62], [640, .66]]);
      vgw('light', sky, [[430, 0], [560, .16], [620, .3]]);
      // stars, a few of them breathing
      const stars = [];
      for (let i = 0; i < 70; i++) { const x = -100 + r() * 1300, y = -250 + r() * 700, sz = .9 + r() * 2.1, ph = r() * TAU; stars.push([x, y, sz * (i % 5 ? 1 : .6 + .5 * Math.sin(f * .21 + ph))]); }
      lit('light', .9, g => { g.beginPath(); for (const [x, y, sz] of stars) { const [px, py] = at(sky, x, y); g.moveTo(px + sz, py); g.arc(px, py, sz * sky.s, 0, TAU); } g.fill(); });
      // the moon, low over the hill
      const [mx, my] = at(sky, 862, 112), mr = 44 * sky.s;
      S.light.glow(mx, my, 230 * sky.s, .3, .25);
      hole(1, g => { g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill(); });
      S.light.disc(mx, my, mr, .5);
      S.light.mark(.35, g => { g.beginPath(); g.arc(mx - 12 * sky.s, my - 8 * sky.s, 9 * sky.s, 0, TAU); g.arc(mx + 14 * sky.s, my + 12 * sky.s, 6 * sky.s, 0, TAU); g.fill(); });

      // the far ridge, violet haze
      const ridge = wavy(380, 1500, 578, 14, 260, .8, 60);
      const ridgeP = PP(far, [...ridge, [1500, 1300], [380, 1300]]);
      S.dark.shape(ridgeP, .46); S.bright.shape(ridgeP, .4);
      // the near hill with its town and the winding road down to our street
      const hy = x => 648 - (x - 560) * .09 + Math.sin(x / 70) * 9;
      const crest = []; for (let x = 520; x <= 1500; x += 20) crest.push([x, hy(x)]);
      const hillP = PP(hill, [...crest, [1500, 1300], [520, 1300]]);
      S.dark.shape(hillP, .8); S.bright.shape(hillP, .3);
      const houses = [];
      for (let i = 0; i < 16; i++) { const x = 600 + i * 58 + (r() - .5) * 20, w = 26 + r() * 16, h = 16 + r() * 12, y = hy(x + w / 2) + 6 + r() * 8; houses.push([x, y, w, h, r()]); }
      S.dark.mark(.9, g => { g.beginPath(); for (const [x, y, w, h] of houses) polyAll(g, [PP(hill, [[x, y], [x, y - h], [x + w / 2, y - h - 12], [x + w, y - h], [x + w, y]])]); g.fill(); });
      const wins = [];
      for (const [x, y, w, h, k] of houses) { if (k > .25) wins.push([x + w * .3, y - h * .6]); if (k > .6) wins.push([x + w * .68, y - h * .6]); }
      for (let i = 0; i < 34; i++) { const x = 600 + r() * 800, y = hy(x) + 34 + r() * 150; wins.push([x, y]); }
      lit('light', .88, g => { g.beginPath(); for (const [x, y] of wins) { const [px, py] = at(hill, x, y), q = 3.4 * hill.s; g.rect(px - q, py - q, q * 2, q * 2); } g.fill(); });
      // the road winds up the hill toward the ridge
      const road = smooth([[930, 870], [748, 812], [868, 752], [762, 704], [812, 668]], 8);
      const roadP = road.map(([x, y]) => at(hill, x, y));
      S.dark.cut(.42, g => { for (let i = 0; i < roadP.length - 1; i++) { g.lineWidth = lerp(30, 5, i / roadP.length) * hill.s; g.beginPath(); g.moveTo(...roadP[i]); g.lineTo(...roadP[i + 1]); g.stroke(); } });
      // its lamps come on one by one, from our street up to the ridge
      const lamps = []; for (let i = 0; i < 10; i++) { const p = roadP[Math.min(roadP.length - 1, 1 + Math.round(i * 3.4))], on = seg(u, .04 + i * .08, .1 + i * .08); if (on > 0) lamps.push([p[0] + 14 * hill.s * (i % 2 ? 1 : -1) * lerp(1, .3, i / 9), p[1], on, lerp(7, 3, i / 9)]); }
      if (lamps.length) {
        for (const [x, y, on, sz] of lamps) { S.dark.glow(x, y, sz * 8 * hill.s, .5 * on, .3, 'cut'); S.light.glow(x, y, sz * 8 * hill.s, .6 * on, .3); }
        lit('light', .95, g => { g.beginPath(); for (const [x, y, on, sz] of lamps) { g.moveTo(x + sz, y); g.arc(x, y, sz * hill.s * on, 0, TAU); } g.fill(); });
      }

      // mid: garden shrubs, a white picket fence in the lamp light, the street lamp
      const shrubs = []; for (let i = 0; i < 9; i++) shrubs.push([630 + i * 95 + r() * 40, 846 + r() * 14, 40 + r() * 34]);
      S.dark.mark(.92, g => { g.beginPath(); for (const [x, y, rr] of shrubs) { const [px, py] = at(mid, x, y); for (let k = 0; k < 4; k++) { g.moveTo(px + rr * mid.s, py); g.arc(px + (k - 1.5) * rr * .45 * mid.s, py - (k % 2) * rr * .3 * mid.s, rr * (.6 + (k % 2) * .2) * mid.s, 0, TAU); } } g.fill(); });
      const lampOn = u < .03 && f % 3 === 1 ? .2 : 1;
      const LP = [770, 432];                                 // the street lamp's head
      const [lx, ly] = at(cam, ...LP);
      S.dark.glow(lx, ly + 20 * cam.s, 230 * cam.s, .5 * lampOn, .3, 'cut');
      S.light.glow(lx, ly + 20 * cam.s, 250 * cam.s, .5 * lampOn, .3);
      const pickets = [];
      for (let x = CORNER + 16; x < 1500; x += 27) pickets.push(PP(cam, [[x, 906], [x, 846], [x + 7, 834], [x + 14, 846], [x + 14, 906]]));
      const rails = [R4(cam, CORNER + 8, 856, 1500, 864), R4(cam, CORNER + 8, 886, 1500, 894)];
      hole(.75, g => { g.beginPath(); polyAll(g, pickets); polyAll(g, rails); g.fill(); });
      S.dark.mark(.42, g => { g.beginPath(); polyAll(g, pickets); polyAll(g, rails); g.fill(); });
      S.bright.mark(.22, g => { g.beginPath(); polyAll(g, pickets); polyAll(g, rails); g.fill(); });
      S.light.glow(lx, at(cam, 0, 870)[1], 200 * cam.s, .45 * lampOn, .3);
      S.dark.mark(.95, g => {
        g.lineWidth = 11 * cam.s; g.beginPath(); g.moveTo(...at(cam, LP[0] + 30, 940)); g.lineTo(...at(cam, LP[0] + 30, LP[1] + 4)); g.quadraticCurveTo(...at(cam, LP[0] + 30, LP[1] - 26), ...at(cam, LP[0], LP[1] - 18)); g.stroke();
        g.beginPath(); polyAll(g, [PP(cam, [[LP[0] - 20, LP[1] - 16], [LP[0] + 20, LP[1] - 16], [LP[0] + 12, LP[1] - 28], [LP[0] - 12, LP[1] - 28]])]); g.fill();
        g.fillRect(...at(cam, LP[0] + 20, 925), 20 * cam.s, 15 * cam.s);
      });
      const lampGlass = PP(cam, [[LP[0] - 16, LP[1] - 16], [LP[0] + 16, LP[1] - 16], [LP[0] + 10, LP[1] + 10], [LP[0] - 10, LP[1] + 10]]);
      hole(lampOn, g => { g.beginPath(); polyAll(g, [lampGlass]); g.fill(); });
      S.light.mark(.95 * lampOn, g => { g.beginPath(); polyAll(g, [lampGlass]); g.fill(); });

      // ---- the house front ----
      const roof = PP(cam, [[-600, 188], [652, 188], [626, 150], [170, -120], [-600, -120]]);
      const wall = R4(cam, -600, 185, CORNER, PORCH);
      S.dark.shape(wall, .74); S.bright.shape(wall, .24);
      S.dark.strokes([...Array(24)].map((_, i) => [at(cam, -600, 206 + i * 25), at(cam, CORNER, 206 + i * 25)]), { w: 2.2 * cam.s, d: .3 });
      // the porch lamp's pool of light on the wall
      const [px, py] = at(cam, ...LAMP);
      S.dark.glow(px, py + 20 * cam.s, 330 * cam.s, .5, .35, 'cut');
      S.light.glow(px, py + 20 * cam.s, 300 * cam.s, .34, .3);
      S.dark.shape(roof, .97);
      // shingles in staggered rows, and the moon catching the roof's edge
      const tiles = [];
      for (let row = 0; row < 10; row++) { const y = 176 - row * 27, xe = 626 - (150 - y) / .59; for (let x = -600 + (row % 2) * 22; x < Math.min(xe, 640) - 20; x += 44) tiles.push([at(cam, x + 4, y), at(cam, x + 36, y)]); }
      S.dark.strokes(tiles, { w: 2.4 * cam.s, d: .36, op: 'cut' });
      lit('light', .4, g => { g.lineWidth = 4 * cam.s; g.beginPath(); g.moveTo(...at(cam, 170, -120)); g.lineTo(...at(cam, 626, 150)); g.lineTo(...at(cam, 652, 188)); g.stroke(); });
      hole(.55, g => { g.beginPath(); polyAll(g, [R4(cam, -600, 186, 652, 196)]); g.fill(); });           // the fascia board
      S.dark.mark(.25, g => { g.beginPath(); polyAll(g, [R4(cam, -600, 186, 652, 196), R4(cam, CORNER - 12, 196, CORNER, PORCH)]); g.fill(); });
      hole(.4, g => { g.beginPath(); polyAll(g, [R4(cam, CORNER - 12, 196, CORNER, PORCH)]); g.fill(); });

      // the window, a warm room behind curtains, a cat asleep on the sill
      const winFrame = R4(cam, WIN[0] - 14, WIN[1] - 14, WIN[2] + 14, WIN[3] + 8);
      hole(1, g => { g.beginPath(); polyAll(g, [winFrame]); g.fill(); });
      S.dark.mark(.5, g => { g.beginPath(); polyAll(g, [winFrame]); g.fill(); });
      S.bright.mark(.2, g => { g.beginPath(); polyAll(g, [winFrame]); g.fill(); });
      const glass = R4(cam, ...WIN);
      hole(1, g => { g.beginPath(); polyAll(g, [glass]); g.fill(); });
      S.light.mark(.8, g => { g.beginPath(); polyAll(g, [glass]); g.fill(); });
      S.bright.mark(.14, g => { g.beginPath(); polyAll(g, [glass]); g.fill(); });
      const curtains = [PP(cam, [[WIN[0], WIN[1]], [WIN[0] + 48, WIN[1]], [WIN[0] + 26, WIN[3]], [WIN[0], WIN[3]]]), PP(cam, [[WIN[2], WIN[1]], [WIN[2] - 48, WIN[1]], [WIN[2] - 26, WIN[3]], [WIN[2], WIN[3]]])];
      S.bright.mark(.62, g => { g.beginPath(); polyAll(g, curtains); g.fill(); });
      S.dark.mark(.18, g => { g.beginPath(); polyAll(g, curtains); g.fill(); });
      S.dark.mark(.92, g => { g.lineWidth = 9 * cam.s; g.beginPath(); g.moveTo(...at(cam, 470, WIN[1])); g.lineTo(...at(cam, 470, WIN[3])); g.moveTo(...at(cam, WIN[0], 496)); g.lineTo(...at(cam, WIN[2], 496)); g.stroke(); });
      const tail = Math.sin(f * .16) * 6;
      S.dark.mark(.88, g => {
        const c = (x, y) => at(cam, x, y), k = cam.s;
        g.beginPath(); g.ellipse(...c(522, 584), 26 * k, 14 * k, 0, 0, TAU); g.fill();
        g.beginPath(); g.arc(...c(504, 572), 11 * k, 0, TAU); g.fill();
        g.beginPath(); polyAll(g, [PP(cam, [[495, 566], [498, 552], [504, 563]]), PP(cam, [[506, 562], [512, 550], [514, 565]])]); g.fill();
        g.lineWidth = 5 * k; g.beginPath(); g.moveTo(...c(546, 590)); g.quadraticCurveTo(...c(560 + tail, 578), ...c(552 + tail, 566)); g.stroke();
      });
      const sill = R4(cam, WIN[0] - 26, WIN[3] + 6, WIN[2] + 26, WIN[3] + 20);
      hole(.7, g => { g.beginPath(); polyAll(g, [sill]); g.fill(); });
      S.dark.mark(.45, g => { g.beginPath(); polyAll(g, [sill]); g.fill(); });

      // the door, deep rose under the lamp, with a warm fanlight
      const trim = R4(cam, DOOR[0] - 14, DOOR[1] - 44, DOOR[2] + 14, DOOR[3]);
      hole(.7, g => { g.beginPath(); polyAll(g, [trim]); g.fill(); });
      S.dark.mark(.35, g => { g.beginPath(); polyAll(g, [trim]); g.fill(); });
      const fan = R4(cam, DOOR[0], DOOR[1] - 32, DOOR[2], DOOR[1] - 6);
      hole(1, g => { g.beginPath(); polyAll(g, [fan]); g.fill(); });
      S.light.mark(.62, g => { g.beginPath(); polyAll(g, [fan]); g.fill(); });
      S.dark.mark(.85, g => { g.lineWidth = 4 * cam.s; g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(...at(cam, DOOR[0] + i * 40, DOOR[1] - 32)); g.lineTo(...at(cam, DOOR[0] + i * 40, DOOR[1] - 6)); } g.stroke(); });
      const door = R4(cam, ...DOOR);
      S.dark.cut(1, g => { g.beginPath(); polyAll(g, [door]); g.fill(); }); S.bright.cut(1, g => { g.beginPath(); polyAll(g, [door]); g.fill(); });
      S.bright.mark(.78, g => { g.beginPath(); polyAll(g, [door]); g.fill(); });
      S.dark.mark(.4, g => { g.beginPath(); polyAll(g, [door]); g.fill(); });
      const panels = [R4(cam, 158, 402, 212, 540), R4(cam, 228, 402, 282, 540), R4(cam, 158, 562, 212, 712), R4(cam, 228, 562, 282, 712)];
      S.dark.mark(.4, g => { g.lineWidth = 3.5 * cam.s; g.beginPath(); polyAll(g, panels); g.stroke(); });
      S.light.disc(...at(cam, 284, 578), 7 * cam.s, .9);
      // the porch lamp, with two moths going round it
      const lampP = PP(cam, [[LAMP[0] - 12, LAMP[1] - 18], [LAMP[0] + 12, LAMP[1] - 18], [LAMP[0] + 10, LAMP[1] + 18], [LAMP[0] - 10, LAMP[1] + 18]]);
      hole(1, g => { g.beginPath(); polyAll(g, [lampP]); g.fill(); });
      S.light.mark(.95, g => { g.beginPath(); polyAll(g, [lampP]); g.fill(); });
      S.dark.mark(.95, g => { g.lineWidth = 3.4 * cam.s; g.beginPath(); polyAll(g, [lampP]); g.stroke();
        g.beginPath(); polyAll(g, [PP(cam, [[LAMP[0] - 17, LAMP[1] - 18], [LAMP[0] + 17, LAMP[1] - 18], [LAMP[0], LAMP[1] - 34]])]); g.fill(); g.fillRect(...at(cam, LAMP[0] - 12, LAMP[1] + 18), 24 * cam.s, 6 * cam.s); });
      lit('light', .85, g => { g.beginPath(); for (let i = 0; i < 2; i++) { const a = f * (.23 + i * .07) + i * 2.4, [mx2, my2] = at(cam, LAMP[0] + Math.cos(a) * (34 + i * 12), LAMP[1] + Math.sin(a * 1.3) * (22 + i * 8)); g.moveTo(mx2 + 3.2 * cam.s, my2); g.arc(mx2, my2, 3.2 * cam.s, 0, TAU); } g.fill(); });

      // porch floor, the empty mat, the potted bush, the step, the walk
      const floor = R4(cam, -600, DOOR[3], CORNER + 8, PORCH);
      S.dark.shape(floor, .6); S.bright.shape(floor, .16);
      S.dark.strokes([750, 770, 788].map(y => [at(cam, -600, y), at(cam, CORNER + 8, y)]), { w: 2 * cam.s, d: .35 });
      S.dark.glow(...at(cam, 300, 770), 260 * cam.s, .32, .4, 'cut');
      const mat = PP(cam, MAT);
      hole(.8, g => { g.beginPath(); polyAll(g, [mat]); g.fill(); });
      S.bright.mark(.55, g => { g.beginPath(); polyAll(g, [mat]); g.fill(); });
      S.dark.mark(.3, g => { g.beginPath(); polyAll(g, [mat]); g.fill(); });
      S.dark.mark(.5, g => { g.lineWidth = 3 * cam.s; g.beginPath(); for (const t of [.25, .5, .75]) { g.moveTo(...at(cam, lerp(150, 286, t), 748)); g.lineTo(...at(cam, lerp(136, 300, t), 788)); } g.stroke(); });
      plant(cam, false);
      hole(.5, g => { g.beginPath(); polyAll(g, [R4(cam, -600, PORCH, CORNER + 8, PORCH + 7)]); g.fill(); });
      S.dark.shape(R4(cam, -600, PORCH + 7, CORNER + 8, STEP), .86);
      S.dark.shape(R4(cam, 60, STEP, 620, STEP + 10), .45); hole(.35, g => { g.beginPath(); polyAll(g, [R4(cam, 60, STEP, 620, STEP + 10)]); g.fill(); });
      S.dark.shape(R4(cam, 60, STEP + 10, 620, WALK), .84);
      const walk = R4(cam, -600, WALK, 1600, 1400);
      S.dark.shape(walk, .62); S.bright.shape(walk, .2);
      S.dark.strokes([...Array(14)].map((_, i) => [at(cam, -400 + i * 110, WALK), at(cam, -500 + i * 128, 1300)]), { w: 2 * cam.s, d: .3 });
      S.dark.glow(lx + 20 * cam.s, at(cam, 0, 960)[1], 260 * cam.s, .45 * lampOn, .4, 'cut');
      S.light.glow(lx + 20 * cam.s, at(cam, 0, 960)[1], 220 * cam.s, .3 * lampOn, .4);
      // chalk on the walk for the courier: a box with a face, and an arrow to the steps
      const ch = (x, y) => at(cam, x, y);
      const chalk = [
        [ch(640, 972), ch(700, 972), ch(700, 940), ch(640, 940), ch(640, 972)], [ch(640, 940), ch(656, 928), ch(716, 928), ch(700, 940)], [ch(716, 928), ch(716, 960), ch(700, 972)],
        [ch(656, 956), ch(662, 962), ch(678, 962), ch(684, 956)], [ch(658, 949), ch(659, 950)], [ch(682, 949), ch(683, 950)],
        [ch(620, 962), ch(580, 950), ch(548, 930), ch(530, 912)], [ch(546, 912), ch(530, 912), ch(534, 928)],
      ];
      lit('light', .5, g => soft(g, 1.2, h => { h.lineWidth = 3.6 * cam.s; h.lineCap = 'round'; h.lineJoin = 'round'; for (const p of chalk) { h.beginPath(); h.moveTo(...p[0]); for (const q of p.slice(1)) h.lineTo(...q); h.stroke(); } }));

      // ---- the kid behind the sign ----
      const breathe = Math.sin(f * .19) * 1.6;
      const lean = ease(seg(u, .5, .62)) * (1 - ease(seg(u, .78, .9)));
      const slump = ease(seg(u, .78, .92));
      const hx = KX + lean * 8, hyk = KY + breathe + slump * 10;
      const ks = KS * cam.s, [kx, ky] = at(cam, hx, hyk);
      const talking = u > .05 && u < .52;
      const blink = Math.max(bump(u, .4, .46), bump(u, .88, .93));
      const face = {
        pose: 'sit', gaze: [1, lerp(-.2, -.55, lean) + slump * .5], blink, lids: slump * .42,
        mouth: talking ? 'o' : slump > .3 ? 'pout' : 'smile', open: talking ? .25 + .6 * Math.abs(Math.sin(f * .62)) : 0,
        tilt: lean * .09 - slump * .04, tuft: Math.sin(f * .31) * .1 + lean * .18, cheeks: .45 + slump * .15,
      };
      kid(kx, ky, ks, { ...face, parts: ['body', 'head'] });
      // the sketchbook: paper, a spiral along the top, warm on the lamp side
      const sg = R4(cam, ...SIGN);
      hole(1, g => { g.beginPath(); polyAll(g, [sg]); g.fill(); });
      S.light.mark(.14, g => { g.beginPath(); polyAll(g, [sg]); g.fill(); });
      S.light.glow(...at(cam, SIGN[0], SIGN[1]), 260 * cam.s, .22, .3);
      S.dark.mark(.18, g => { g.beginPath(); polyAll(g, [R4(cam, SIGN[0], SIGN[3] - 10, SIGN[2], SIGN[3])]); g.fill(); });
      S.dark.mark(.9, g => {
        g.lineWidth = 3 * cam.s; g.beginPath(); polyAll(g, [sg]); g.stroke();
        g.lineWidth = 3.2 * cam.s; g.beginPath();
        for (let x = SIGN[0] + 16; x < SIGN[2] - 8; x += 17) { const [a, b] = at(cam, x, SIGN[1] + 8); g.moveTo(a + 4 * cam.s, b); g.ellipse(a, b - 6 * cam.s, 4 * cam.s, 10 * cam.s, 0, 0, TAU); }
        g.stroke();
      });
      // the question, in marker, written as it is asked
      const tk = 31 * cam.s, mw = Math.max(6, tk * .15);
      const [t1x, t1y] = at(cam, KX, 698), [t2x, t2y] = at(cam, KX, 770);
      S.dark.strokes(written(penTight('where is', { x: t1x, y: t1y, size: tk, align: 'center', seed: 4 }), seg(u, .04, .26)), { w: mw, d: .96, tin: .04, tout: .96 });
      S.dark.strokes(written(penTight('parcel 42?', { x: t2x, y: t2y, size: tk, align: 'center', seed: 5 }), seg(u, .26, .5)), { w: mw, d: .96, tin: .04, tout: .96 });
      // hands on the top corners. in the last beat one of them drums on the edge
      const tap = u > .76 ? Math.abs(Math.sin(f * .95)) * 7 : 0;
      const hl = [[(SIGN[0] + 24 - hx) / KS, (SIGN[1] + 2 - hyk) / KS], [(SIGN[2] - 24 - hx) / KS, (SIGN[1] + 2 - tap - hyk) / KS]];
      kid(kx, ky, ks, { ...face, parts: ['hands'], hands: hl });

      // near: a shrub out of focus in the corner, and specks in the air
      const leaves = []; for (let i = 0; i < 9; i++) leaves.push([-60 + r() * 220, 880 + r() * 200, 60 + r() * 50, r() * TAU]);
      S.dark.mark(.95, g => soft(g, 7, h => { h.beginPath(); for (const [x, y, rr, a] of leaves) { const [qx, qy] = at(fg, x, y); h.moveTo(qx + rr * fg.s, qy); h.ellipse(qx, qy, rr * fg.s, rr * .5 * fg.s, a, 0, TAU); } h.fill(); }));
      S.bright.mark(.3, g => soft(g, 7, h => { h.beginPath(); for (const [x, y, rr, a] of leaves) { const [qx, qy] = at(fg, x, y); h.moveTo(qx + rr * fg.s, qy); h.ellipse(qx, qy, rr * fg.s, rr * .5 * fg.s, a, 0, TAU); } h.fill(); }));
      dust(S, cam, f, { drum: 'dark', op: 'cut', d: .5, n: 30 });
    },
  };

  // ======================= delivered ======================================
  // Golden late-afternoon light on the same porch. The kid's sign is taped to
  // the door. Parcel 42 sits on the mat and smiles up. The door swings open
  // and takes the question away with it, and the kid is there. Cut close: the
  // kid kneels and hugs the parcel. Beat three is the postcard.
  const PX = 222, PB = 786, PS = .95;                      // the parcel on the mat
  const doorAngle = u => 1.22 * easeOutCubic(seg(u, .3, .43));
  LIVED.delivered = {
    cam: (W, u) => u < .5 ? [lerp(240, 236, u * 2), lerp(584, 582, u * 2), lerp(664, 630, u * 2)]
      : [220, 641, lerp(570, 540, (u - .5) * 2)],
    draw: (S, u, W, cam) => {
      inks('#002654', '#F94F8D', '#FFC61F');
      const f = W.frame, r = rng((SEED * 173 + 29) >>> 0), close = u >= .5;

      // the warm ground: gold, deepening to rose toward the sun on the right
      S.light.flood(.46);
      const [sx, sy] = at(cam, 900, 420);
      S.bright.glow(sx, sy, 1300 * cam.s, .1, .5);
      S.light.glow(sx, sy, 900 * cam.s, .34, .4);
      S.dark.mark(.14, g => { const [x0] = at(cam, -100, 0), [x1] = at(cam, 200, 0); const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-50, -50, x1 + 50, U + 100); });

      // the wall, its siding, the eave's shadow
      const wall = R4(cam, -600, 185, CORNER, PORCH);
      S.bright.shape(wall, .08);
      S.dark.strokes([...Array(24)].map((_, i) => [at(cam, -600, 206 + i * 25), at(cam, CORNER, 206 + i * 25)]), { w: 2.2 * cam.s, d: .14 });
      S.dark.mark(.22, g => { const [, y0] = at(cam, 0, 196), [, y1] = at(cam, 0, 300); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-50, y0, U + 100, y1 - y0); });
      // dappled shade from a tree out of frame, stirring in the breeze
      const dap = []; { const rd = rng(61); for (let i = 0; i < 26; i++) { const x = -80 + rd() * 360, y = 190 + rd() * 260, rr = 14 + rd() * 26, ph = rd() * TAU; dap.push([x + Math.sin(f * .045 + ph) * 6, y + Math.cos(f * .04 + ph) * 4, rr]); } }
      S.dark.mark(.13, g => { g.save(); g.beginPath(); polyAll(g, [wall]); g.clip(); soft(g, 7, h => { h.beginPath(); for (const [x, y, rr] of dap) { const [qx, qy] = at(cam, x, y); h.moveTo(qx + rr * cam.s, qy); h.ellipse(qx, qy, rr * cam.s, rr * .7 * cam.s, .4, 0, TAU); } h.fill(); }); g.restore(); });
      // light shafts from the low sun, across the wall
      S.light.mark(.22, g => soft(g, 30, h => { h.beginPath(); for (const [a, b] of [[120, 60], [330, 90], [520, 50]]) polyAll(h, [PP(cam, [[a + 420, 120], [a + b + 420, 120], [a + b - 330, 900], [a - 330, 900]])]); h.fill(); }));

      // the window at the right, with the sky in it
      const winFrame = R4(cam, WIN[0] - 14, WIN[1] - 14, WIN[2] + 14, WIN[3] + 8);
      hole(1, g => { g.beginPath(); polyAll(g, [winFrame]); g.fill(); });
      S.light.mark(.3, g => { g.beginPath(); polyAll(g, [winFrame]); g.fill(); });
      const glass = R4(cam, ...WIN);
      S.dark.mark(.28, g => { g.beginPath(); polyAll(g, [glass]); g.fill(); });
      S.bright.mark(.3, g => { g.beginPath(); polyAll(g, [glass]); g.fill(); });
      S.light.mark(.4, g => { g.beginPath(); polyAll(g, [glass]); g.fill(); });
      S.dark.mark(.2, g => { g.save(); g.beginPath(); polyAll(g, [glass]); g.clip(); g.beginPath(); polyAll(g, [PP(cam, [[WIN[0] + 20, WIN[1]], [WIN[0] + 60, WIN[1]], [WIN[0] + 10, WIN[3]], [WIN[0] - 30, WIN[3]]])]); g.fill(); g.restore(); });
      hole(.8, g => { g.save(); g.beginPath(); polyAll(g, [glass]); g.clip(); g.beginPath(); polyAll(g, [PP(cam, [[WIN[0] + 90, WIN[1]], [WIN[0] + 112, WIN[1]], [WIN[0] + 62, WIN[3]], [WIN[0] + 40, WIN[3]]])]); g.fill(); g.restore(); });
      S.dark.mark(.85, g => { g.lineWidth = 9 * cam.s; g.beginPath(); g.moveTo(...at(cam, 470, WIN[1])); g.lineTo(...at(cam, 470, WIN[3])); g.moveTo(...at(cam, WIN[0], 496)); g.lineTo(...at(cam, WIN[2], 496)); g.stroke(); g.lineWidth = 3 * cam.s; g.beginPath(); polyAll(g, [winFrame]); g.stroke(); });
      const sill = R4(cam, WIN[0] - 26, WIN[3] + 6, WIN[2] + 26, WIN[3] + 20);
      hole(1, g => { g.beginPath(); polyAll(g, [sill]); g.fill(); });
      S.light.mark(.35, g => { g.beginPath(); polyAll(g, [sill]); g.fill(); });
      S.dark.mark(.7, g => { g.lineWidth = 2.6 * cam.s; g.beginPath(); polyAll(g, [sill]); g.stroke(); });

      // the lamp, off in daylight
      const lampP = PP(cam, [[LAMP[0] - 12, LAMP[1] - 18], [LAMP[0] + 12, LAMP[1] - 18], [LAMP[0] + 10, LAMP[1] + 18], [LAMP[0] - 10, LAMP[1] + 18]]);
      hole(1, g => { g.beginPath(); polyAll(g, [lampP]); g.fill(); });
      S.light.mark(.3, g => { g.beginPath(); polyAll(g, [lampP]); g.fill(); });
      S.dark.mark(.9, g => { g.lineWidth = 3.4 * cam.s; g.beginPath(); polyAll(g, [lampP]); g.stroke();
        g.beginPath(); polyAll(g, [PP(cam, [[LAMP[0] - 17, LAMP[1] - 18], [LAMP[0] + 17, LAMP[1] - 18], [LAMP[0], LAMP[1] - 34]])]); g.fill(); g.fillRect(...at(cam, LAMP[0] - 12, LAMP[1] + 18), 24 * cam.s, 6 * cam.s); });

      // the doorway: trim, fanlight, and behind the door a dim hall
      const trim = R4(cam, DOOR[0] - 14, DOOR[1] - 44, DOOR[2] + 14, DOOR[3]);
      hole(1, g => { g.beginPath(); polyAll(g, [trim]); g.fill(); });
      S.light.mark(.2, g => { g.beginPath(); polyAll(g, [trim]); g.fill(); });
      S.dark.mark(.7, g => { g.lineWidth = 2.6 * cam.s; g.beginPath(); polyAll(g, [trim]); g.stroke(); });
      const fan = R4(cam, DOOR[0], DOOR[1] - 32, DOOR[2], DOOR[1] - 6);
      S.dark.mark(.3, g => { g.beginPath(); polyAll(g, [fan]); g.fill(); }); S.bright.mark(.25, g => { g.beginPath(); polyAll(g, [fan]); g.fill(); });
      S.dark.mark(.8, g => { g.lineWidth = 4 * cam.s; g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(...at(cam, DOOR[0] + i * 40, DOOR[1] - 32)); g.lineTo(...at(cam, DOOR[0] + i * 40, DOOR[1] - 6)); } g.stroke(); });
      const th = doorAngle(u), open = th > .01;
      const hall = R4(cam, ...DOOR);
      if (open) {
        S.dark.mark(.66, g => { g.beginPath(); polyAll(g, [hall]); g.fill(); });
        S.bright.mark(.3, g => { g.beginPath(); polyAll(g, [hall]); g.fill(); });
        S.dark.mark(.2, g => { g.beginPath(); polyAll(g, [R4(cam, DOOR[0], 640, DOOR[2], DOOR[3])]); g.fill(); });
        const [gx, gy] = at(cam, 262, 470);
        S.dark.glow(gx, gy, 90 * cam.s, .5, .4, 'cut'); S.light.glow(gx, gy, 80 * cam.s, .5, .35);   // a lamp deep in the hall
        // sunlight falls in across the floor
        S.dark.cut(.35, g => { g.beginPath(); polyAll(g, [PP(cam, [[DOOR[0] + 40, DOOR[3]], [DOOR[2], DOOR[3]], [DOOR[2], 690], [DOOR[0] + 60, 700]])]); g.fill(); });
      }

      // ---- the kid in the doorway (first shot), behind the door and the parcel
      const appear = seg(u, .33, .4);
      if (!close && open) {
        const jump = bump(u, .43, .5) * 14;
        const [kx, ky] = at(cam, 236, 516 - jump), ks = .96 * cam.s;
        const joy = seg(u, .4, .44);
        kid(kx, ky, ks, {
          pose: 'stand', parts: ['body', 'head', 'arms'], gaze: [-.2, .7], wide: 1 - joy * .2, happy: u > .455 && u < .49 ? 1 : 0,
          mouth: joy > .5 ? 'grin' : 'o', open: .9, tuft: -.25 * bump(u, .42, .5) + Math.sin(f * .4) * .06, cheeks: .55,
          arms: [[[-40, 52], [-78, 110], [-46, 26 + (1 - joy) * 60]], [[40, 52], [78, 110], [46, 26 + (1 - joy) * 60]]],
        });
        if (appear > 0) {
          const burst = [];
          for (let i = 0; i < 9; i++) { const a = -Math.PI * .95 + i / 8 * Math.PI * .9, r0 = 78 + 10 * appear, r1 = r0 + 26 * easeOutBack(appear); burst.push([[kx + Math.cos(a) * r0 * ks, ky + Math.sin(a) * r0 * ks], [kx + Math.cos(a) * r1 * ks, ky + Math.sin(a) * r1 * ks]]); }
          lit('light', .9 * appear, g => { for (const b of burst) ribbon(g, b, 6 * cam.s); });
        }
      }

      // the door on its hinge, with the kid's sign still taped to it
      {
        const c = Math.cos(th), sn = Math.sin(th), fx = DOOR[0] + (DOOR[2] - DOOR[0]) * c;
        const q = [[DOOR[0], DOOR[1]], [fx, DOOR[1] + 22 * sn], [fx, DOOR[3] - 8 * sn], [DOOR[0], DOOR[3]]];
        const map = (a, b) => { const top = [lerp(q[0][0], q[1][0], a), lerp(q[0][1], q[1][1], a)], bot = [lerp(q[3][0], q[2][0], a), lerp(q[3][1], q[2][1], a)]; return at(cam, lerp(top[0], bot[0], b), lerp(top[1], bot[1], b)); };
        const panel = [map(0, 0), map(1, 0), map(1, 1), map(0, 1)];
        hole(1, g => { g.beginPath(); polyAll(g, [panel]); g.fill(); });
        S.bright.mark(.8, g => { g.beginPath(); polyAll(g, [panel]); g.fill(); });
        S.dark.mark(.2 + .35 * sn, g => { g.beginPath(); polyAll(g, [panel]); g.fill(); });
        S.light.mark(.3, g => { g.beginPath(); polyAll(g, [panel]); g.fill(); });
        const pan = [[.11, .06, .45, .45], [.55, .06, .89, .45], [.11, .52, .45, .95], [.55, .52, .89, .95]].map(([a0, b0, a1, b1]) => [map(a0, b0), map(a1, b0), map(a1, b1), map(a0, b1)]);
        S.dark.mark(.45, g => { g.lineWidth = 3.5 * cam.s; g.beginPath(); polyAll(g, pan); g.stroke(); g.lineWidth = 3 * cam.s; g.beginPath(); polyAll(g, [panel]); g.stroke(); });
        hole(1, g => { const [a, b] = map(.9, .57); g.beginPath(); g.arc(a, b, 7 * cam.s, 0, TAU); g.fill(); });
        S.light.mark(.9, g => { const [a, b] = map(.9, .57); g.beginPath(); g.arc(a, b, 7 * cam.s, 0, TAU); g.fill(); });
        // the sign from last night, taped on with two strips
        if (c > .12) {
          const sg = [map(.06, .15), map(.94, .15), map(.94, .42), map(.06, .42)];
          hole(1, g => { g.beginPath(); polyAll(g, [sg]); g.fill(); });
          S.light.mark(.12 + .25 * sn, g => { g.beginPath(); polyAll(g, [sg]); g.fill(); });
          S.dark.mark(.18 * sn, g => { g.beginPath(); polyAll(g, [sg]); g.fill(); });
          S.dark.mark(.85, g => { g.lineWidth = 2.4 * cam.s; g.beginPath(); polyAll(g, [sg]); g.stroke(); });
          const tape = [[.1, .13], [.8, .13]].map(([a, b]) => [map(a, b), map(a + .12, b), map(a + .12, b + .045), map(a, b + .045)]);
          S.light.mark(.55, g => { g.beginPath(); polyAll(g, tape); g.fill(); });
          const dw = DOOR[2] - DOOR[0], dh = DOOR[3] - DOOR[1];
          const lines = [['where is', .205], ['parcel 42?', .318]], out = [];
          lines.forEach(([t, b], j) => {
            const paths = penTight(t, { x: 0, y: 0, size: 16, align: 'center', seed: 4 + j });
            for (const p of paths) out.push(p.map(([px, py]) => map(.5 + px / dw, b + py / dh)));
          });
          S.dark.strokes(out, { w: Math.max(2.2, 2.5 * cam.s * c), d: .95, tin: .04, tout: .96 });
        }
      }

      // porch floor, warm boards, the potted bush, the step
      const floor = R4(cam, -600, DOOR[3], CORNER + 8, PORCH);
      S.dark.shape(floor, .3); S.bright.shape(floor, .26);
      S.dark.strokes([750, 770, 788].map(y => [at(cam, -600, y), at(cam, CORNER + 8, y)]), { w: 2 * cam.s, d: .22 });
      plant(cam, true);
      hole(.5, g => { g.beginPath(); polyAll(g, [R4(cam, -600, PORCH, CORNER + 8, PORCH + 7)]); g.fill(); });
      S.light.mark(.3, g => { g.beginPath(); polyAll(g, [R4(cam, -600, PORCH, CORNER + 8, PORCH + 7)]); g.fill(); });
      S.dark.shape(R4(cam, -600, PORCH + 7, CORNER + 8, STEP), .55); S.bright.shape(R4(cam, -600, PORCH + 7, CORNER + 8, STEP), .24);
      S.dark.shape(R4(cam, -600, STEP, 620, STEP + 10), .22);
      S.dark.shape(R4(cam, -600, STEP + 10, 620, WALK), .5); S.bright.shape(R4(cam, -600, STEP + 10, 620, WALK), .2);
      // the mat, and the parcel's long shadow falling left from the low sun
      const mat = PP(cam, MAT);
      hole(.6, g => { g.beginPath(); polyAll(g, [mat]); g.fill(); });
      S.bright.mark(.62, g => { g.beginPath(); polyAll(g, [mat]); g.fill(); });
      S.dark.mark(.2, g => { g.beginPath(); polyAll(g, [mat]); g.fill(); });
      S.dark.mark(.4, g => { g.lineWidth = 3 * cam.s; g.beginPath(); for (const t of [.25, .5, .75]) { g.moveTo(...at(cam, lerp(150, 286, t), 748)); g.lineTo(...at(cam, lerp(136, 300, t), 788)); } g.stroke(); });
      const [bx, by] = at(cam, PX, PB), bs = PS * cam.s;
      const lift0 = close ? 0 : bump(u, .22, .29) * 16;
      S.dark.mark(.34 - lift0 * .01, g => soft(g, 5, h => { h.beginPath(); polyAll(h, [PP(cam, [[PX - 72, PB], [PX + 70, PB], [PX + 28, PB - 12], [PX - 170, PB - 12]])]); h.fill(); }));

      // ---- parcel 42, and in the close shot the kid wrapped round it ----
      if (!close) {
        const look = seg(u, .14, .2), up = seg(u, .36, .42);
        const gz = [lerp(lerp(-.25, 0, look), -.35, up), lerp(lerp(-1, .1, look), -1, up)];
        parcel42(bx, by, bs, { gaze: gz, blink: bump(u, .07, .11), smile: lerp(.35, 1, seg(u, .16, .24)), squint: seg(u, .42, .46) * .45, hop: lift0 * cam.s });
      } else {
        const v = (u - .5) * 2;                                    // 0..1 across the close shot
        const drop = easeOutCubic(seg(v, 0, .16));
        const sway = Math.sin((v - .16) * 7.5) * seg(v, .16, .3) * (1 - seg(v, .8, .95));
        const look = seg(v, .84, .9);
        // the box in world units, so the hands land on it
        const w = 150 * PS, h = 130 * PS, dx = 34 * PS, dy = 26 * PS, L = PX - w / 2, T = PB - h;
        const hx = lerp(226, 220, drop) + sway * 3, hyk = lerp(534, 578, drop);
        const ws = 1.04, ks = ws * cam.s, [kx, ky] = at(cam, hx, hyk);
        const loc = (x, y) => [(x - hx) / ws, (y - hyk) / ws];
        const lh = loc(L + 12, T + 40), rh = loc(L + w - 10, T + 40);
        const arms = [
          [[-46, 64], lerp2([-86, 70], loc(L - 12, T - 6), drop), lerp2([-92, 10], lh, drop)],
          [[46, 64], lerp2([86, 70], loc(L + w + 14, T - 8), drop), lerp2([92, 10], rh, drop)],
        ];
        const face = { pose: 'hug', gaze: look > 0 ? [-.1, .15] : [.3, -.2], happy: look > .5 ? 0 : 1, mouth: 'grin', open: 1, tilt: .16 * drop * (1 - look * .6) + sway * .05, tuft: Math.sin(f * .33) * .12 - sway * .1, cheeks: .62, wide: look };
        // warmth behind them: the hall lamp and the sun meet round the pair
        S.light.glow(...at(cam, 222, 640), 320 * cam.s, .3 * drop, .35);
        kid(kx, ky, ks, { ...face, parts: ['body'] });
        parcel42(bx, by, bs, { gaze: look > .5 ? [0, .1] : [-.2, -1], smile: 1, squint: .5 * (1 - bump(v, .88, .96)), tilt: sway * .02, blink: bump(v, .88, .96) });
        kid(kx, ky, ks, { ...face, parts: ['head', 'arms'], arms, over: true });
        // hearts rise off them
        const hearts = [[.2, 300, 604, 1.1], [.3, 132, 590, .85], [.46, 318, 556, .8], [.62, 140, 548, .75], [.76, 290, 570, .7]];
        const hs = [];
        for (const [t0, x0, y0, sz] of hearts) {
          const a = seg(v, t0, t0 + .5); if (a <= 0 || a >= 1) continue;
          const [qx, qy] = at(cam, x0 + Math.sin(a * 5 + x0) * 10, y0 - a * 110);
          hs.push([qx, qy, 17 * sz * cam.s * easeOutBack(seg(a, 0, .22)) * (1 - seg(a, .82, 1))]);
        }
        if (hs.length) {
          hole(1, g => { g.beginPath(); for (const [x, y, rr] of hs) heart(g, x, y, rr); g.fill(); });
          S.bright.mark(.92, g => { g.beginPath(); for (const [x, y, rr] of hs) heart(g, x, y, rr); g.fill(); });
          S.dark.mark(.8, g => { g.lineWidth = 2.6 * cam.s; g.beginPath(); for (const [x, y, rr] of hs) heart(g, x, y, rr); g.stroke(); });
        }
      }

      // near: gold motes drifting in the sun, and a few soft specks
      const motes = [];
      for (let i = 0; i < 26; i++) { const x = r() * 1000, y0 = r() * 1000, ph = r() * TAU; motes.push([x + Math.sin(f * .05 + ph) * 16, (y0 - f * .9 + 2000) % 1000, 2 + r() * 3.5]); }
      for (const k of ['light', 'bright', 'dark']) S[k].cut(.75, g => soft(g, 2, h => { h.beginPath(); for (const [x, y, rr] of motes) { h.moveTo(x + rr, y); h.arc(x, y, rr, 0, TAU); } h.fill(); }));
      dust(S, cam, f, { drum: 'dark', op: 'mark', d: .12, n: 14 });
    },
  };
}
