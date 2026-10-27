// ================= scenes 30: the road ==============================
// shipped: afternoon, a turmeric van drives through the city and parcel 42
// leans out of the back window with the wind in its face.
// late: the scan that was forgotten at 12:10 rides a snail down a long road,
// and reaches the clerk's desk when the clock already says twenty past three.
(() => {
  // a layer at depth d: world to sheet, and the scale it prints at
  const lay = (cam, d) => { const c = d === 1 ? cam : camFor(cam, d); return { x: wx => (wx - c.cx) * c.s + U / 2, y: wy => (wy - c.cy) * c.s + U / 2, k: c.s, c }; };
  // the indices of things spaced sp apart that a layer at depth d can see
  const span = (cam, d, sp, pad = 400) => { const hw = (U / 2) / (cam.s / d) + pad; return [Math.floor((cam.cx - hw) / sp), Math.ceil((cam.cx + hw) / sp)]; };
  const hh = (i, k, salt) => hash2(i | 0, k | 0, salt);
  const rects = (g, list) => { g.beginPath(); for (const [x, y, w, h] of list) g.rect(x, y, w, h); g.fill(); };
  const bump = (fa, at0, w) => Math.exp(-Math.pow((fa - at0) / w, 2));
  // a glow clipped to its circle. an unclipped one fills its whole square with
  // dithered near-zero ink, and the screen prints that square as a faint box
  const glowC = (drum, x, y, r, d, mid = .38, op = 'mark') => drum[op](d, g => {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(mid, 'rgba(255,255,255,.45)'); gr.addColorStop(lerp(mid, 1, .45), 'rgba(255,255,255,.14)'); gr.addColorStop(lerp(mid, 1, .78), 'rgba(255,255,255,.035)'); gr.addColorStop(.97, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  });

  // ============================ SHIPPED ============================
  const SV = 26;                                   // the van's speed, world units a frame
  const SG = 600;                                  // the road under the wheels
  const vanX = fa => -80 + fa * SV;                // the van's rear bumper
  const vanBob = fa => Math.sin(fa * 1.1) * 1.4 + Math.sin(fa * .47) * 1.1 - 8 * bump(fa, 21, 1.5) - 7 * bump(fa, 43, 1.5);
  const PS = .7;                                   // parcel 42's world scale in the van

  function shipCam(W, u) {
    const fa = u * 64, x = vanX(fa);
    if (u < .5) { const k = ease(u * 2); return [x + lerp(430, 320, k), lerp(290, 395, k), lerp(1300, 900, k)]; }
    const k = (u - .5) * 2;
    return [x + 180 + lerp(-10, 20, k), 368 + vanBob(fa) * .45, lerp(560, 460, easeOutCubic(k))];
  }

  function sky(S, fa) {
    S.light.vgrad([[0, .62], [.4, .34], [.7, .14], [1, .08]]);
    const sx = 800 - fa * .5, sy = 140;
    glowC(S.light, sx, sy, 440, 1, .45, 'cut');
    glowC(S.bright, sx, sy, 360, .5, .3);
    S.bright.disc(sx, sy, 46, .95);
  }

  function clouds(S, cam, fa) {
    const L = lay(cam, 14), r = rng(4242), blobs = [];
    for (let i = 0; i < 7; i++) {
      const wx = -3000 + r() * 9000 + fa * 6, wy = -700 + r() * 500, n = 3 + (r() * 3 | 0), w = 260 + r() * 300;
      for (let j = 0; j < n; j++) blobs.push([L.x(wx + (j / n - .5) * w), L.y(wy - Math.sin(j / (n - 1 || 1) * Math.PI) * 50), (60 + r() * 50) * L.k]);
    }
    S.light.cut(.8, g => soft(g, 10, h => { for (const [x, y, rr] of blobs) { h.beginPath(); h.ellipse(x, y, rr * 1.6, rr, 0, 0, TAU); h.fill(); } }));
  }

  function birds(S, cam, fa) {
    const L = lay(cam, 6), paths = [];
    for (let i = 0; i < 5; i++) {
      const wx = cam.cx - 600 + i * 190 + Math.sin(i * 2.1) * 90 + fa * 9, wy = -250 + Math.sin(i * 1.7) * 90;
      const x = L.x(wx), y = L.y(wy), w = 14 + (i % 2) * 4, fl = Math.sin(fa * .9 + i * 1.4) * 7;
      paths.push([[x - w, y - fl], [x, y + 3], [x + w, y - fl]]);
    }
    S.dark.strokes(paths, { w: 3.2, d: .75 });
  }

  // tall towers far away, then a nearer row, then the street's own facades
  function skyline(S, cam) {
    const L = lay(cam, 5), [i0, i1] = span(cam, 5, 120), bodies = [], masts = [];
    for (let i = i0; i <= i1; i++) {
      const w = 70 + hh(i, 1, 11) * 80, h = 500 + hh(i, 2, 11) * 1100, x = i * 120 + hh(i, 3, 11) * 40;
      bodies.push([L.x(x), L.y(548 - h), w * L.k, h * L.k + 40]);
      if (hh(i, 4, 11) > .7) masts.push([[L.x(x + w / 2), L.y(548 - h)], [L.x(x + w / 2), L.y(548 - h - 160)]]);
    }
    S.dark.mark(.2, g => rects(g, bodies)); S.light.mark(.22, g => rects(g, bodies));
    S.dark.strokes(masts, { w: 2, d: .3 });
    const M = lay(cam, 2.7), [j0, j1] = span(cam, 2.7, 150), mb = [], mw = [];
    for (let i = j0; i <= j1; i++) {
      const w = 110 + hh(i, 1, 23) * 80, h = 380 + hh(i, 2, 23) * 520, x = i * 150 + hh(i, 3, 23) * 30;
      mb.push([M.x(x), M.y(548 - h), w * M.k, h * M.k + 40]);
      for (let ry = 548 - h + 40; ry < 520; ry += 56) mw.push([M.x(x + 14), M.y(ry), (w - 28) * M.k, 16 * M.k]);
    }
    S.light.cut(.6, g => rects(g, mb));
    S.dark.mark(.36, g => rects(g, mb)); S.light.mark(.18, g => rects(g, mb));
    S.dark.cut(.35, g => rects(g, mw));
  }

  function facades(S, cam, fa, smear) {
    const L = lay(cam, 1.7), [i0, i1] = span(cam, 1.7, 230), B = [[], [], []], lit1 = [], panes = [], aw = [], awStripes = [], cornice = [], tanks = [], doors = [];
    const sm = smear;
    for (let i = i0; i <= i1; i++) {
      const x = i * 230, w = 214 + hh(i, 1, 37) * 10, h = 520 + hh(i, 2, 37) * 560, top = 548 - h, tone = hh(i, 3, 37) * 3 | 0;
      B[tone].push([L.x(x), L.y(top), w * L.k, h * L.k + 60]);
      cornice.push([L.x(x - 8), L.y(top - 4), (w + 16) * L.k, 18 * L.k]);
      const cols = 3 + (hh(i, 4, 37) > .5), cw = (w - 40) / cols;
      for (let ry = top + 50; ry < 548 - 150; ry += 92) for (let c = 0; c < cols; c++) {
        const r = [L.x(x + 20 + c * cw + cw * .18) - sm / 2, L.y(ry), cw * .64 * L.k + sm, 56 * L.k];
        (hh(i * 13 + c, ry | 0, 41) > .72 ? lit1 : panes).push(r);
      }
      if (hh(i, 5, 37) > .35) {                       // a shop with an awning at street level
        const ax = x + 14, awW = w - 28;
        aw.push([L.x(ax), L.y(548 - 138), awW * L.k, 36 * L.k]);
        for (let s = 0; s < 7; s += 2) awStripes.push([L.x(ax + s * awW / 7), L.y(548 - 138), awW / 7 * L.k, 36 * L.k]);
        panes.push([L.x(ax + 12) - sm / 2, L.y(548 - 96), (awW - 24) * L.k + sm, 80 * L.k]);
      } else doors.push([L.x(x + w / 2 - 26), L.y(548 - 100), 52 * L.k, 100 * L.k]);
      if (hh(i, 6, 37) > .6) {                        // a water tank on the roof
        const tx = x + 40 + hh(i, 7, 37) * (w - 120);
        tanks.push([L.x(tx), L.y(top - 90), 70 * L.k, 70 * L.k]);
      }
    }
    const all = [...B[0], ...B[1], ...B[2]];
    hole(1, g => rects(g, all));
    [.4, .52, .64].forEach((d, t) => S.dark.mark(d, g => rects(g, B[t])));
    S.light.mark(.3, g => rects(g, B[0])); S.light.mark(.18, g => rects(g, B[1]));
    S.dark.mark(.9, g => rects(g, cornice));
    S.dark.cut(.55, g => rects(g, panes)); S.light.mark(.4, g => rects(g, panes));
    lit('bright', .88, g => rects(g, lit1));
    hole(1, g => rects(g, aw)); S.bright.mark(.95, g => rects(g, awStripes)); S.dark.mark(.18, g => rects(g, aw));
    S.dark.mark(.95, g => rects(g, doors));
    S.dark.mark(.7, g => { for (const [x, y, w, h] of tanks) { g.beginPath(); g.moveTo(x, y + h * .3); g.lineTo(x + w / 2, y); g.lineTo(x + w, y + h * .3); g.lineTo(x + w, y + h * .8); g.lineTo(x, y + h * .8); g.closePath(); g.fill(); g.fillRect(x + w * .15, y + h * .8, w * .08, h * .4); g.fillRect(x + w * .77, y + h * .8, w * .08, h * .4); } });
  }

  function streetTrees(S, cam, fa) {
    const L = lay(cam, 1.32), [i0, i1] = span(cam, 1.32, 330), crowns = [], trunks = [], shade = [], lamps = [], heads = [];
    for (let i = i0; i <= i1; i++) {
      const x = i * 330 + hh(i, 1, 53) * 60, h = 210 + hh(i, 2, 53) * 80, r = 90 + hh(i, 3, 53) * 30;
      trunks.push([[L.x(x), L.y(560)], [L.x(x), L.y(560 - h)]]);
      for (let b = 0; b < 5; b++) {
        const a = b / 5 * TAU + i, bx = x + Math.cos(a) * r * .55, by = 560 - h - r * .35 + Math.sin(a) * r * .4;
        crowns.push([L.x(bx), L.y(by), r * .62 * L.k]);
        if (b < 2) shade.push([L.x(bx + r * .2), L.y(by + r * .25), r * .45 * L.k]);
      }
      crowns.push([L.x(x), L.y(560 - h - r * .5), r * .7 * L.k]);
      const lx = i * 330 + 165;                        // a lamp post between the trees
      lamps.push([[L.x(lx), L.y(562)], [L.x(lx), L.y(562 - 340)], [L.x(lx + 30), L.y(562 - 372)], [L.x(lx + 64), L.y(562 - 366)]]);
      heads.push([L.x(lx + 66), L.y(562 - 360), 11 * L.k]);
    }
    const circ = (g, list) => { g.beginPath(); for (const [x, y, r] of list) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } g.fill(); };
    S.dark.strokes(trunks, { w: 16 * L.k, d: .85 });
    S.dark.strokes(lamps, { w: 7 * L.k, d: .9 });
    lit('bright', .9, g => circ(g, heads));
    hole(1, g => circ(g, crowns));
    S.bright.mark(.82, g => circ(g, crowns)); S.light.mark(.9, g => circ(g, crowns));
    S.dark.mark(.3, g => circ(g, shade));
    S.dark.mark(.14, g => circ(g, crowns));
  }

  function walkers(S, cam, fa) {
    const L = lay(cam, 1.3), [i0, i1] = span(cam, 1.3, 610), bodies = [], limbs = [], balloons = [], strings = [];
    for (let i = i0; i <= i1; i++) {
      const kid = (i & 3) === 1, h = kid ? 110 : 175, dir = hh(i, 1, 81) > .5 ? 1 : -1;
      const wx = i * 610 + 250 + dir * fa * 2.2, b = 556, ph = fa * .45 + i, sw = Math.sin(ph) * .45;
      const x = L.x(wx), y = L.y(b), hy = y - h * L.k, k = L.k * h / 112;
      bodies.push(g => { g.moveTo(x + 10 * k * (kid ? .8 : 1), hy + 10 * k); g.arc(x, hy + 10 * k, 10 * k * (kid ? .8 : 1), 0, TAU); g.roundRect(x - 11 * k, hy + 21 * k, 22 * k, 47 * k, 7 * k); });
      const hip = [x, hy + 66 * k], leg = 44 * k;
      limbs.push([hip, [x + Math.sin(sw) * leg, y]], [hip, [x - Math.sin(sw) * leg, y]]);
      const sh = [x, hy + 26 * k];
      if (kid && fa > 14) { const wave = Math.sin(fa * .9) * .5; limbs.push([sh, [x + Math.cos(-1.9 + wave) * 30 * k, sh[1] + Math.sin(-1.9 + wave) * 30 * k]]); limbs.push([sh, [x - 12 * k, sh[1] + 26 * k]]); }
      else limbs.push([sh, [x - Math.sin(sw) * 22 * k, sh[1] + 28 * k]], [sh, [x + Math.sin(sw) * 22 * k, sh[1] + 28 * k]]);
      if (kid) { const bx = x - 34 * k + Math.sin(fa * .2) * 4 * k, by = hy - 70 * k; balloons.push([bx, by, 20 * k]); strings.push([[x - 12 * k, sh[1] + 26 * k], [bx - 4 * k, by + 30 * k], [bx, by + 20 * k]]); }
    }
    S.dark.mark(.85, g => { g.beginPath(); for (const b of bodies) b(g); g.fill(); });
    S.dark.strokes(limbs, { w: 7 * L.k, d: .85 });
    S.dark.strokes(strings, { w: 1.6 * L.k, d: .6 });
    hole(1, g => { for (const [x, y, r] of balloons) { g.beginPath(); g.ellipse(x, y, r * .86, r, 0, 0, TAU); g.fill(); } });
    S.bright.mark(.95, g => { for (const [x, y, r] of balloons) { g.beginPath(); g.ellipse(x, y, r * .86, r, 0, 0, TAU); g.fill(); } });
    S.dark.mark(.6, g => { g.lineWidth = 1.6 * L.k; for (const [x, y, r] of balloons) { g.beginPath(); g.ellipse(x, y, r * .86, r, 0, 0, TAU); g.stroke(); } });
  }

  function roadBands(S, cam, fa) {
    const yb = lay(cam, 1.7).y(548), yf = lay(cam, 1.3).y(562), yn = lay(cam, .86).y(634);
    hole(1, g => g.fillRect(-10, yb, U + 20, yf - yb));
    S.light.band(yb, yf, .42); S.dark.band(yb, yf, .12);
    S.dark.band(yf - 2, yf + 5, .9);                                  // far curb
    hole(1, g => g.fillRect(-10, yf + 5, U + 20, yn - yf - 5));
    S.dark.band(yf + 5, yn, .6); S.light.band(yf + 5, yn, .3);
    const D = lay(cam, 1.12), [i0, i1] = span(cam, 1.12, 150), dashes = [];
    for (let i = i0; i <= i1; i++) dashes.push([D.x(i * 150), D.y(576), 70 * D.k, 7 * D.k]);
    lit('bright', .85, g => rects(g, dashes));
    hole(1, g => g.fillRect(-10, yn, U + 20, U - yn + 20));
    S.light.band(yn, U + 20, .45); S.dark.band(yn, U + 20, .1);
    S.dark.band(yn - 3, yn + 8, .9);                                  // near curb
    const ys = lay(cam, .8).y(646);
    S.light.cut(.5, g => g.fillRect(-10, yn + 8, U + 20, ys - yn - 8));
    const N = lay(cam, .74), [j0, j1] = span(cam, .74, 160), joints = [];
    for (let i = j0; i <= j1; i++) joints.push([[N.x(i * 160), N.y(646)], [N.x(i * 160 - 40), N.y(700)]]);
    S.dark.strokes(joints, { w: 2 * N.k, d: .22 });
    return { yn };
  }

  // ---- the van, facing right. local units, 0 at the rear bumper, 0 at the road
  function vanBody(g) {
    g.beginPath();
    g.roundRect(0, -302, 390, 240, [18, 14, 4, 4]);
    g.moveTo(388, -224); g.lineTo(468, -224); g.quadraticCurveTo(504, -224, 528, -170); g.lineTo(550, -150);
    g.quadraticCurveTo(570, -142, 570, -120); g.lineTo(570, -62); g.lineTo(388, -62); g.closePath();
  }
  const WIN = [40, -258, 178, 104];                                    // the back window, where parcel 42 rides
  function vanPaint(S, o, fa, clip) {
    const T = fn => g => { g.translate(o[0], o[1]); g.scale(o[2], o[2]); if (clip) { g.beginPath(); clip(g); g.clip(); } fn(g); };
    const bodyFill = g => { vanBody(g); g.fill(); };
    hole(1, T(bodyFill));
    S.bright.mark(.94, T(bodyFill));
    S.dark.mark(1, T(g => { const gr = g.createLinearGradient(0, -300, 0, -62); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.6, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,.28)'); g.fillStyle = gr; vanBody(g); g.fill(); }));
    S.bright.cut(.4, T(g => { g.fillRect(14, -296, 360, 7); }));    // a highlight along the roof
    hole(1, T(g => g.fillRect(0, -132, 570, 15)));                    // the stripe, pale blue on paper
    S.light.mark(.8, T(g => g.fillRect(0, -132, 570, 15)));
    S.dark.mark(.9, T(g => { g.fillRect(4, -84, 564, 24); g.fillRect(-12, -76, 26, 20); g.fillRect(556, -80, 24, 22); }));
    // wheel wells, tyres, hubs
    S.dark.mark(.72, T(g => { for (const wx of [112, 462]) { g.beginPath(); g.arc(wx, -40, 50, Math.PI, 0); g.lineTo(wx + 50, -40); g.fill(); } }));
    S.dark.mark(1, T(g => { for (const wx of [112, 462]) { g.beginPath(); g.arc(wx, -40, 40, 0, TAU); g.fill(); } }));
    hole(1, T(g => { for (const wx of [112, 462]) { g.beginPath(); g.arc(wx, -40, 19, 0, TAU); g.fill(); } }));
    lit('light', .7, T(g => { g.lineWidth = 3; for (const wx of [112, 462]) { g.beginPath(); g.arc(wx, -40, 29, 0, TAU); g.stroke(); } }));
    S.light.mark(.55, T(g => { for (const wx of [112, 462]) { g.beginPath(); g.arc(wx, -40, 19, 0, TAU); g.fill(); } }));
    const a = fa * SV / 40;
    S.dark.mark(.9, T(g => { g.lineWidth = 4; for (const wx of [112, 462]) for (let s = 0; s < 5; s++) { const t = a + s / 5 * TAU; g.beginPath(); g.moveTo(wx, -40); g.lineTo(wx + Math.cos(t) * 17, -40 + Math.sin(t) * 17); g.stroke(); } }));
    // the cab's glass and its driver
    const side = g => { g.beginPath(); g.moveTo(400, -208); g.lineTo(466, -208); g.quadraticCurveTo(484, -206, 496, -156); g.lineTo(400, -156); g.closePath(); };
    hole(1, T(g => { side(g); g.fill(); }));
    S.light.mark(.6, T(g => { side(g); g.fill(); }));
    S.dark.mark(.85, T(g => { side(g); g.clip(); g.beginPath(); g.arc(436, -176, 17, 0, TAU); g.fill(); g.fillRect(418, -162, 40, 20); g.beginPath(); g.ellipse(438, -191, 20, 9, 0, Math.PI, 0); g.fill(); g.fillRect(438, -193, 30, 5); }));
    S.light.cut(.5, T(g => { side(g); g.clip(); g.lineWidth = 7; g.beginPath(); g.moveTo(470, -210); g.lineTo(446, -150); g.stroke(); }));
    // the back window: dark inside, a frame round it
    hole(1, T(g => { g.beginPath(); g.roundRect(...WIN, 12); g.fill(); }));
    S.dark.mark(.88, T(g => { g.beginPath(); g.roundRect(...WIN, 12); g.fill(); }));
    S.light.mark(.3, T(g => { g.beginPath(); g.roundRect(...WIN, 12); g.fill(); }));
    const stack = g => { g.beginPath(); g.roundRect(...WIN, 12); g.clip(); g.beginPath(); g.rect(46, -218, 58, 66); g.rect(58, -262, 44, 44); g.rect(186, -206, 50, 56); g.fill(); };
    S.bright.mark(.5, T(stack)); S.dark.cut(.35, T(stack));
    S.dark.mark(.6, T(g => { g.beginPath(); g.roundRect(...WIN, 12); g.clip(); g.lineWidth = 2; g.beginPath(); g.moveTo(62, -196); g.lineTo(72, -196); g.moveTo(80, -196); g.lineTo(90, -196); g.moveTo(68, -244); g.lineTo(76, -244); g.moveTo(84, -244); g.lineTo(92, -244); g.stroke(); }));
    S.dark.mark(.9, T(g => { g.lineWidth = 6; g.beginPath(); g.roundRect(...WIN, 12); g.stroke(); }));
    // a speedy arrow painted on the side, the door seam, lights, and the outline
    S.dark.mark(.88, T(g => { g.beginPath(); g.moveTo(262, -196); g.lineTo(346, -196); g.lineTo(346, -214); g.lineTo(378, -182); g.lineTo(346, -150); g.lineTo(346, -168); g.lineTo(262, -168); g.closePath(); g.fill(); g.fillRect(240, -196, 12, 28); g.fillRect(224, -196, 8, 28); }));
    S.dark.mark(.7, T(g => { g.lineWidth = 3; g.beginPath(); g.moveTo(388, -224); g.lineTo(388, -84); g.stroke(); g.fillRect(404, -120, 26, 6); }));
    lit('bright', .95, T(g => { g.beginPath(); g.ellipse(563, -110, 7, 11, 0, 0, TAU); g.fill(); }));
    S.dark.mark(.95, T(g => g.fillRect(-2, -122, 10, 26)));
    S.dark.mark(.85, T(g => { g.lineWidth = 3.4; vanBody(g); g.stroke(); }));
  }

  function puffs(S, cam, fa) {
    const L = lay(cam, 1), list = [];
    for (let e = Math.floor(fa / 3) * 3; e > fa - 24; e -= 3) {
      if (e < -30) break;
      const age = fa - e, wx = vanX(e) - 14 - age * 3, wy = SG - 48 + vanBob(e) - age * 1.6 - Math.sin(e) * 4;
      list.push([L.x(wx), L.y(wy), (7 + age * 1.5) * L.k, 1 - age / 24]);
    }
    for (const [x, y, r, k] of list) { lit('light', .5 * k, g => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); }
  }

  // the near pavement: a post box, a hydrant, bollards and a bench, then the fast
  // lamp posts and a hedge right under the lens
  function foreground(S, cam, fa, close) {
    const K = lay(cam, .8), [k0, k1] = span(cam, .8, 340), boxes = [], hyd = [], bol = [], bench = [], shadow = [], planters = [];
    for (let i = k0; i <= k1; i++) {
      const x = i * 340 + 90, kind = ((i % 5) + 5) % 5, b = 648;
      shadow.push([K.x(x - 30), K.y(b - 6), 150 * K.k, 12 * K.k]);
      const kk = K.k * 1.25;
      if (kind === 0) boxes.push([K.x(x), K.y(b), kk]);
      else if (kind === 1) hyd.push([K.x(x), K.y(b), kk]);
      else if (kind === 2) bench.push([K.x(x), K.y(b), kk]);
      else if (kind === 3) bol.push([K.x(x), K.y(b), kk]);
      else planters.push([K.x(x), K.y(b), kk]);
    }
    if (close) { boxes.length = hyd.length = bol.length = bench.length = shadow.length = planters.length = 0; }
    S.dark.mark(.3, g => soft(g, 4, h => { for (const [x, y, w, hh2] of shadow) { h.beginPath(); h.ellipse(x + w / 2, y + hh2, w / 2, hh2, 0, 0, TAU); h.fill(); } }));
    const box = g => { g.beginPath(); for (const [x, y, k] of boxes) { g.roundRect(x - 34 * k, y - 150 * k, 68 * k, 150 * k, [30 * k, 30 * k, 3 * k, 3 * k]); } };
    hole(1, g => { box(g); g.fill(); }); S.dark.mark(.8, g => { box(g); g.fill(); }); S.light.mark(.4, g => { box(g); g.fill(); });
    lit('bright', .95, g => { for (const [x, y, k] of boxes) g.fillRect(x - 22 * k, y - 104 * k, 44 * k, 7 * k); });   // the letter slot
    const hydP = g => { g.beginPath(); for (const [x, y, k] of hyd) { g.roundRect(x - 16 * k, y - 70 * k, 32 * k, 70 * k, 6 * k); g.moveTo(x + 14 * k, y - 70 * k); g.arc(x, y - 70 * k, 14 * k, 0, Math.PI, true); g.rect(x - 26 * k, y - 50 * k, 52 * k, 12 * k); } };
    hole(1, g => { hydP(g); g.fill(); }); S.bright.mark(.95, g => { hydP(g); g.fill(); }); S.dark.mark(.3, g => { hydP(g); g.fill(); });
    S.dark.mark(.85, g => { g.lineWidth = 2.5 * (hyd[0]?.[2] || 1); hydP(g); g.stroke(); });
    S.dark.mark(.9, g => { for (const [x, y, k] of bol) for (let q = 0; q < 3; q++) { g.beginPath(); g.roundRect(x + (q * 46 - 46) * k - 8 * k, y - 56 * k, 16 * k, 56 * k, 8 * k); g.fill(); } });
    // planters with turmeric flowers
    const pl = g => { for (const [x, y, k] of planters) g.rect(x - 60 * k, y - 46 * k, 120 * k, 46 * k); };
    const bush = g => { for (const [x, y, k] of planters) for (let q = 0; q < 4; q++) { const bx = x - 42 * k + q * 28 * k, by = y - 58 * k - (q % 2) * 12 * k; g.moveTo(bx + 24 * k, by); g.arc(bx, by, 24 * k, 0, TAU); } };
    hole(1, g => { g.beginPath(); pl(g); bush(g); g.fill(); });
    S.dark.mark(.8, g => { g.beginPath(); pl(g); g.fill(); });
    S.bright.mark(.8, g => { g.beginPath(); bush(g); g.fill(); }); S.light.mark(.9, g => { g.beginPath(); bush(g); g.fill(); }); S.dark.mark(.2, g => { g.beginPath(); bush(g); g.fill(); });
    lit('bright', .95, g => { g.beginPath(); for (const [x, y, k] of planters) for (let q = 0; q < 7; q++) { const fx = x - 50 * k + q * 17 * k, fy = y - 70 * k - ((q * 37) % 23) * k; g.moveTo(fx + 6 * k, fy); g.arc(fx, fy, 6 * k, 0, TAU); } g.fill(); });
    S.dark.mark(.9, g => { for (const [x, y, k] of bench) { g.fillRect(x - 70 * k, y - 44 * k, 140 * k, 9 * k); g.fillRect(x - 70 * k, y - 78 * k, 140 * k, 8 * k); g.fillRect(x - 70 * k, y - 64 * k, 140 * k, 8 * k); g.fillRect(x - 60 * k, y - 44 * k, 8 * k, 44 * k); g.fillRect(x + 52 * k, y - 44 * k, 8 * k, 44 * k); } });
    // lamp posts close to the lens, smeared by speed
    const L = lay(cam, .6), [i0, i1] = span(cam, .6, 1000), posts = [];
    for (let i = i0; i <= i1; i++) posts.push(L.x(i * 1000 + 804));
    const sm = close ? 50 : 12, top = L.y(-600), bot = L.y(680), w = 26 * L.k;
    const post = h => { for (const x of posts) { h.fillRect(x - w / 2 - sm / 2, top, w + sm, bot - top); h.fillRect(x - 120 * L.k - sm / 2, L.y(-560), 120 * L.k + sm, 22 * L.k); } };
    hole(1, g => soft(g, close ? 18 : 2, post)); S.dark.mark(1, g => soft(g, close ? 18 : 2, post));
    // a hedge along the near edge
    const H = lay(cam, .66), [j0, j1] = span(cam, .66, 60), edge = [];
    for (let i = j0; i <= j1; i++) edge.push([H.x(i * 60), H.y(662 - 18 * hh(i, 1, 71) - 10 * Math.sin(i * 1.3))]);
    const hedge = g => { g.beginPath(); g.moveTo(edge[0][0], U + 40); for (const p of edge) g.lineTo(p[0], p[1]); g.lineTo(edge[edge.length - 1][0], U + 40); g.closePath(); g.fill(); };
    hole(1, hedge); S.bright.mark(.75, hedge); S.light.mark(.95, hedge); S.dark.mark(.42, hedge);
    const leaves = [];
    for (let i = j0 * 3; i <= j1 * 3; i++) { const x = H.x(i * 20 + 7), y = H.y(690 + 70 * hh(i, 2, 73)); leaves.push([[x - sm * .6, y], [x + 14 * H.k, y - 3]]); }
    S.dark.strokes(leaves, { w: 5 * H.k, d: .35, tin: .3 });
  }

  // a sparrow that keeps pace with the van for a while, and parcel 42 watches it
  function sparrowAt(fa) {
    const k = easeOutCubic(seg(fa, 34, 47)), off = seg(fa, 56, 64);
    return [lerp(760, 330, k) + 60 * off * off, -330 + Math.sin(fa * .5) * 8 - 140 * off * off];
  }
  function sparrow(S, o, fa) {
    if (fa < 34) return;
    const [bx, by] = sparrowAt(fa), k = o[2], x = o[0] + bx * k, y = o[1] + by * k, fl = Math.sin(fa * 1.6);
    const body = g => { g.beginPath(); g.ellipse(x, y, 30 * k, 19 * k, -.12, 0, TAU); g.moveTo(x - 24 * k, y - 2 * k); g.lineTo(x - 58 * k, y - 14 * k); g.lineTo(x - 54 * k, y + 6 * k); g.closePath(); g.moveTo(x + 40 * k, y - 10 * k); g.arc(x + 26 * k, y - 10 * k, 14 * k, 0, TAU); };
    hole(1, g => { body(g); g.fill(); });
    S.dark.mark(.85, g => { body(g); g.fill(); });
    S.light.mark(.35, g => { g.beginPath(); g.ellipse(x + 4 * k, y + 6 * k, 20 * k, 10 * k, -.1, 0, TAU); g.fill(); });
    S.dark.cut(.5, g => { g.beginPath(); g.ellipse(x + 4 * k, y + 6 * k, 20 * k, 10 * k, -.1, 0, TAU); g.fill(); });
    lit('bright', .95, g => { g.beginPath(); g.moveTo(x + 38 * k, y - 14 * k); g.lineTo(x + 54 * k, y - 8 * k); g.lineTo(x + 38 * k, y - 4 * k); g.closePath(); g.fill(); });
    hole(1, g => { g.beginPath(); g.arc(x + 30 * k, y - 14 * k, 5 * k, 0, TAU); g.fill(); });
    S.dark.mark(1, g => { g.beginPath(); g.arc(x + 31.5 * k, y - 14 * k, 2.6 * k, 0, TAU); g.fill(); });
    const wing = g => { g.beginPath(); g.moveTo(x - 14 * k, y - 6 * k); g.quadraticCurveTo(x - 4 * k, y - (10 + 46 * fl) * k, x + 18 * k, y - (4 + 40 * fl) * k); g.lineTo(x + 8 * k, y - 4 * k); g.closePath(); g.fill(); };
    hole(1, wing); S.dark.mark(.95, wing);
  }

  // parcel 42 in the back window: it leans into the wind, and its bow trails behind
  function riders(S, cam, fa, o) {
    const close = fa >= 32, k = o[2];
    const hop = (10 * bump(fa, 24, 2.4) + 9 * bump(fa, 46, 2.4)) * k * PS;
    const tilt = .08 + .035 * Math.sin(fa * .6) + (close ? .08 * seg(fa, 32, 40) : 0);
    const blink = Math.max(bump(fa, 12, .9), bump(fa, 36.5, .9));
    const squint = close ? .3 * seg(fa, 52, 57) : 0;
    // it looks ahead, then at the sparrow once the sparrow is beside it
    let gaze = [.95, -.15];
    if (fa >= 38) { const [bx, by] = sparrowAt(fa), dx = bx - 150, dy = by + 210, n = Math.hypot(dx, dy); gaze = [lerp(.95, dx / n, seg(fa, 40, 45)), lerp(-.15, dy / n, seg(fa, 40, 45))]; }
    const [px, py] = [o[0] + (130 + (close ? 8 * seg(fa, 32, 40) : 0)) * k, o[1] - 148 * k];
    const P = parcel42(px, py, PS * k, { gaze, blink, squint, smile: close ? 1 : .75, tilt, hop });
    // the bow's two tails stream out behind it
    const [bx, by] = P.bow, Lt = 150 * PS * k, tails = [];
    for (const side of [0, 1]) {
      const pts = [];
      for (let j = 0; j <= 12; j++) { const t = j / 12; pts.push([bx - t * Lt * (1 - side * .2), by - 4 * PS * k - t * (side ? 6 : 26) * k * PS + Math.sin(fa * 1.9 + t * 6 + side * 2) * 11 * t * PS * k]); }
      tails.push(pts);
    }
    A.fringe.mark(.85, g => { for (const p of tails) ribbon(g, p, 13 * PS * k, 0, .92); });
    hole(1, g => { for (const p of tails) ribbon(g, p, 13 * PS * k, 0, .92); });
    A.fringe.cut(1, g => { for (const p of tails) ribbon(g, p, 7 * PS * k, 0, .85); });
    return P;
  }

  function wind(S, cam, fa, k) {
    if (k <= 0) return;
    const r = rng(9090), lines = [];
    for (let i = 0; i < 26; i++) {
      const y = 60 + r() * 880, len = 80 + r() * 240, v = 38 + r() * 40, ph = r() * 1400;
      const x = 1200 - ((ph + fa * v) % 1600);
      lines.push([[x, y], [x + len, y + (r() - .5) * 8]]);
    }
    lit('light', .75 * k, g => { for (const l of lines) ribbon(g, l, 3.4, .2, .8); });
  }

  function streamDust(S, cam, fa) {
    const r = rng(5151), pts = [];
    for (let i = 0; i < 26; i++) {
      const y = r() * 1000, v = 30 + r() * 50, ph = r() * 1300, rr = 3 + r() * 9;
      pts.push([1150 - ((ph + fa * v) % 1300), y + Math.sin(fa * .2 + i) * 6, rr]);
    }
    S.light.mark(.35, g => soft(g, 6, h => { for (const [x, y, rr] of pts) { h.beginPath(); h.ellipse(x, y, rr * 2.2, rr, 0, 0, TAU); h.fill(); } }));
  }

  function shippedDraw(S, u, W, cam) {
    inks('#002654', '#FFC61F', '#99E4F0');
    const fa = u * 64, x0 = vanX(fa), bob = vanBob(fa), close = u >= .5;
    const smear = close ? 26 : 0;
    sky(S, fa);
    clouds(S, cam, fa);
    if (!close) birds(S, cam, fa);
    skyline(S, cam);
    facades(S, cam, fa, smear * .7);
    streetTrees(S, cam, fa);
    const { yn } = roadBands(S, cam, fa);
    walkers(S, cam, fa);
    puffs(S, cam, fa);
    const [ox, oy] = at(cam, x0, SG + bob), o = [ox, oy, cam.s];
    // the van's shadow on the road
    S.dark.mark(.5, g => soft(g, 8, h => { h.beginPath(); h.ellipse(ox + 290 * cam.s, oy + 4 * cam.s, 300 * cam.s, 12 * cam.s, 0, 0, TAU); h.fill(); }));
    vanPaint(S, o, fa);
    riders(S, cam, fa, o);
    // the van's side in front of the parcel's lower half, so it rides inside
    const sill = g => g.rect(WIN[0] - 30, WIN[1] + WIN[3], WIN[2] + 60, 110);
    vanPaint(S, o, fa, sill);
    const cutA = g => { g.translate(o[0], o[1]); g.scale(o[2], o[2]); g.beginPath(); sill(g); g.fill(); };
    A.ink.cut(1, cutA); A.fringe.cut(1, cutA);
    S.dark.mark(.9, g => { g.translate(o[0], o[1]); g.scale(o[2], o[2]); g.lineWidth = 6; g.beginPath(); g.moveTo(WIN[0] + 6, WIN[1] + WIN[3]); g.lineTo(WIN[0] + WIN[2] - 6, WIN[1] + WIN[3]); g.stroke(); });
    sparrow(S, o, fa);
    foreground(S, cam, fa, close);
    wind(S, cam, fa, close ? 1 : .35);
    streamDust(S, cam, fa);
  }

  LIVED.shipped = { cam: shipCam, draw: shippedDraw };

  // ============================== LATE ==============================
  // ink a shape with a dark rim: stroke every part, lift the inside to paper,
  // then fill. the rims inside a union of parts are lifted with the rest.
  function inked(S, path, w, fills, od = .85) {
    S.dark.mark(od, g => { path(g); g.lineWidth = w; g.stroke(); });
    hole(1, g => { path(g); g.fill(); });
    for (const [drum, d] of fills) S[drum].mark(d, g => { path(g); g.fill(); });
  }
  function inkedLine(S, lines, w, rim, fills, od = .85) {
    S.dark.mark(od, g => { for (const l of lines) { g.lineWidth = w + rim * 2; g.beginPath(); g.moveTo(...l[0]); for (const p of l.slice(1)) g.lineTo(...p); g.stroke(); } });
    const f = g => { for (const l of lines) { g.lineWidth = w; g.beginPath(); g.moveTo(...l[0]); for (const p of l.slice(1)) g.lineTo(...p); g.stroke(); } };
    hole(1, f);
    for (const [drum, d] of fills) S[drum].mark(d, f);
  }
  const SKIN = [['light', .68], ['bright', .1]];

  // the letter. two lines of the clerk's hand when it is big enough to read
  function envelope(S, cx, cy, w, h, rot, readable) {
    const c = Math.cos(rot), sn = Math.sin(rot), T = (px, py) => [cx + px * c - py * sn, cy + px * sn + py * c];
    const box = [T(-w / 2, -h / 2), T(w / 2, -h / 2), T(w / 2, h / 2), T(-w / 2, h / 2)];
    inked(S, g => poly(g, box), Math.max(2.2, w * .016), [['light', .05]], .9);
    S.dark.strokes([[T(-w / 2, -h / 2), T(-w * .08, -h * .12), T(w * .08, -h * .12), T(w / 2, -h / 2)]], { w: Math.max(1.4, w * .008), d: .4 });
    const st = [T(w / 2 - w * .2, -h / 2 + h * .09), T(w / 2 - w * .06, -h / 2 + h * .09), T(w / 2 - w * .06, -h / 2 + h * .36), T(w / 2 - w * .2, -h / 2 + h * .36)];
    S.bright.mark(.9, g => { poly(g, st); g.fill(); });
    S.dark.mark(.6, g => { g.lineWidth = Math.max(1, w * .006); g.setLineDash([w * .012, w * .01]); poly(g, st); g.stroke(); g.setLineDash([]); });
    if (readable) {
      S.dark.mark(.45, g => { g.lineWidth = w * .007; for (const r of [.1, .135]) { const [px, py] = T(w * .18, -h * .12); g.beginPath(); g.arc(px, py, w * r, -2.2, .9); g.stroke(); } });
      const [ax, ay] = T(-w * .43, -h * .5 + h * .2), [bx, by] = T(-w * .43, h * .1);
      hand(S, 'packed', { x: ax, y: ay, fit: w * .64, rot, ink: 'dark', d: .95, knock: false, seed: 5, wob: 2.4 });
      hand(S, '12:10', { x: bx, y: by, fit: w * .56, rot, ink: 'dark', d: .95, knock: false, seed: 9, wob: 2.4 });
    } else {
      S.dark.strokes([[T(-w * .36, -h * .02), T(w * .1, -h * .04)], [T(-w * .36, h * .2), T(w * .02, h * .19)]], { w: Math.max(1.2, h * .07), d: .75 });
    }
  }

  // the snail, facing right. x, y is the ground under its shell, s = 1 is a
  // shell 64 across the middle. it carries the letter on its back.
  function snail(S, x, y, s, o = {}) {
    const { st = 0, rear = 0, blink = 0, lids = 0, gaze = [1, -.2], smile = .6, tip = 0, happy = 0, env = 'on', readable = false, sweat = 0 } = o;
    const tx = x - (122 - 10 * st) * s, hx = x + (100 + 14 * st) * s, hy = y - (62 + 22 * rear) * s, hr = 30 * s;
    const body = g => {
      g.beginPath();
      g.moveTo(tx, y - 1 * s);
      g.quadraticCurveTo(x - 50 * s, y - 30 * s, x + 30 * s, y - 32 * s);
      g.quadraticCurveTo(hx + 10 * s, y - 34 * s, hx + 42 * s, y - 6 * s);
      g.lineTo(hx + 44 * s, y); g.lineTo(tx + 6 * s, y); g.closePath();
      g.moveTo(hx - 30 * s, y - 16 * s); g.quadraticCurveTo(hx - hr * 1.05, hy + 20 * s, hx - hr * .9, hy + 6 * s); g.lineTo(hx + hr * .9, hy + 8 * s); g.quadraticCurveTo(hx + 30 * s, y - 20 * s, hx + 38 * s, y - 8 * s); g.closePath();
      g.moveTo(hx + hr, hy); g.arc(hx, hy, hr, 0, TAU);
    };
    // the far eye stalk sits behind the head
    const stalk = (bx, by, len, lean) => { const tipx = bx + lean * s + Math.sin(st * 2 + bx) * 2 * s, tipy = by - len * s; return [[bx, by], [lerp(bx, tipx, .5) - 3 * s, lerp(by, tipy, .5)], [tipx, tipy]]; };
    const far = stalk(hx - 6 * s, hy - 18 * s, 62 - 8 * happy, -8 + 4 * rear), near = stalk(hx + 10 * s, hy - 20 * s, 70 - 8 * happy, 12 + 6 * rear);
    inkedLine(S, [far], 10 * s, 2.4 * s, [['light', .62], ['bright', .28]]);
    inked(S, body, 5 * s, SKIN);
    S.bright.mark(.22, g => { body(g); g.clip(); g.fillRect(tx - 10, y - 12 * s, (hx - tx) + 80 * s, 14 * s); });
    const spots = [];
    for (let i = 0; i < 9; i++) spots.push([tx + (30 + i * 22) * s, y - (8 + (i % 3) * 5) * s, (2.2 + (i % 2)) * s]);
    S.dark.mark(.28, g => { g.beginPath(); for (const [px, py, r] of spots) { g.moveTo(px + r, py); g.arc(px, py, r, 0, TAU); } g.fill(); });
    S.light.cut(.45, g => { g.lineWidth = 5 * s; g.beginPath(); g.arc(hx - 4 * s, hy - 2 * s, hr * .66, Math.PI * 1.1, Math.PI * 1.55); g.stroke(); });
    inkedLine(S, [near], 10 * s, 2.4 * s, SKIN);
    // feelers, cheek, mouth
    S.dark.strokes([[[hx + 24 * s, hy + 12 * s], [hx + 40 * s, hy + 20 * s]], [[hx + 20 * s, hy + 18 * s], [hx + 34 * s, hy + 28 * s]]], { w: 5 * s, d: .7, tout: .8 });
    S.bright.mark(.45, g => { g.beginPath(); g.ellipse(hx + 6 * s, hy + 8 * s, 9 * s, 6 * s, 0, 0, TAU); g.fill(); });
    const m = smile, mx = hx + 16 * s, my = hy + 8 * s;
    S.dark.strokes([[[mx - 7 * s, my], [mx - 2 * s, my + 5 * s * m], [mx + 4 * s, my + 5 * s * m], [mx + 8 * s, my - 1 * s]]], { w: 2.6 * s, d: .9 });
    // eyes on the stalk tips
    const eyes = [far[2], near[2]], er = 16 * s;
    const circ = g => { g.beginPath(); for (const [ex, ey] of eyes) { g.moveTo(ex + er, ey); g.arc(ex, ey, er, 0, TAU); } };
    inked(S, circ, 3 * s, [], .9);
    const shut = Math.max(blink, happy);
    if (shut < .8) {
      S.dark.mark(1, g => { for (const [ex, ey] of eyes) { g.beginPath(); g.arc(ex + gaze[0] * 5 * s, ey + gaze[1] * 5 * s, 6.8 * s, 0, TAU); g.fill(); } });
      hole(1, g => { for (const [ex, ey] of eyes) { g.beginPath(); g.arc(ex + gaze[0] * 5 * s + 2.4 * s, ey + gaze[1] * 5 * s - 2.6 * s, 2.2 * s, 0, TAU); g.fill(); } });
    }
    const lid = Math.max(lids, shut);
    if (lid > 0) {
      const lp = g => { g.beginPath(); for (const [ex, ey] of eyes) { g.save(); g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.clip(); g.fillRect(ex - er, ey - er, er * 2, er * 2 * lid); g.restore(); } };
      for (const [drum, d] of SKIN) S[drum].mark(d, lp);
      S.dark.strokes(eyes.map(([ex, ey]) => { const ly = ey - er + er * 2 * lid; const hw = Math.sqrt(Math.max(0, er * er - (ly - ey) ** 2)); return [[ex - hw, ly], [ex + hw, ly]]; }), { w: 2.4 * s, d: .85 });
    }
    if (happy > .5) S.dark.strokes(eyes.map(([ex, ey]) => [[ex - 8 * s, ey + 3 * s], [ex, ey - 4 * s], [ex + 8 * s, ey + 3 * s]]), { w: 3 * s, d: .9 });
    if (sweat > 0) {
      const dx = hx - 34 * s, dy = hy - 30 * s + sweat * 20 * s;
      inked(S, g => { g.beginPath(); g.moveTo(dx, dy - 12 * s); g.quadraticCurveTo(dx + 8 * s, dy, dx, dy + 5 * s); g.quadraticCurveTo(dx - 8 * s, dy, dx, dy - 12 * s); }, 2 * s, [], .7);
    }
    // the shell, tipping forward when it hands the letter over
    const pivot = [x + 20 * s, y - 24 * s], ct = Math.cos(tip), stt = Math.sin(tip);
    const Rt = (px, py) => [pivot[0] + (px - pivot[0]) * ct - (py - pivot[1]) * stt, pivot[1] + (px - pivot[0]) * stt + (py - pivot[1]) * ct];
    const [sx, sy] = Rt(x - 6 * s, y - 80 * s), R = 64 * s;
    inked(S, g => { g.beginPath(); g.arc(sx, sy, R, 0, TAU); }, 5.5 * s, [['bright', .8], ['light', .38]]);
    S.dark.mark(.16, g => { g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip(); g.beginPath(); g.arc(sx - 26 * s, sy - 30 * s, R * 1.25, 0, TAU); g.rect(sx + R * 2, sy - R * 2, -R * 4, R * 4); g.fill('evenodd'); });
    S.bright.cut(.5, g => { g.lineWidth = 9 * s; g.beginPath(); g.arc(sx, sy, R * .78, Math.PI * 1.08, Math.PI * 1.45); g.stroke(); });
    const spiral = [];
    for (let i = 0; i <= 80; i++) { const t = i / 80, a = -Math.PI * .5 + tip + t * TAU * 2.35, r = R * .86 * Math.pow(t, .92); spiral.push([sx + 6 * s * (1 - t) + Math.cos(a) * r, sy + 4 * s * (1 - t) + Math.sin(a) * r]); }
    S.dark.strokes([spiral.reverse()], { w: 5 * s, d: .82, tin: 0, tout: .97 });
    // the letter, strapped on top
    const ew = 172 * s, eh = 112 * s;
    if (env === 'on') {
      const [ex, ey] = Rt(x - 10 * s, y - 80 * s - R - eh / 2 + 26 * s);
      S.dark.strokes([[Rt(x - 60 * s, y - 80 * s - R + 30 * s), Rt(x - 70 * s, y - 60 * s), Rt(x - 30 * s, y - 30 * s)], [Rt(x + 44 * s, y - 80 * s - R + 30 * s), Rt(x + 56 * s, y - 62 * s), Rt(x + 30 * s, y - 34 * s)]], { w: 3 * s, d: .7 });
      envelope(S, ex, ey, ew, eh, -.07 + tip, readable);
    }
    return { eyes, shell: [sx, sy], env: Rt(x - 10 * s, y - 80 * s - R - eh / 2 + 26 * s), ew, eh };
  }

  // ---- the wide shot: a long road, a clock racing, a snail that is not ----
  const LW = 48;                                               // frames in the wide shot
  const lapse = fa => ease(seg(fa, 2, 40));                    // 12:10 to 15:20
  const snailWX = fa => 640 + fa * .5 + Math.sin(fa * .39) * 1.5;
  function clockFace(S, cx, cy, r, mins, whirl, o = {}) {
    inked(S, g => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); }, Math.max(3, r * .11), [['light', .1]], .92);
    const ticks = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = r * (i % 3 ? .8 : .7), r1 = r * .9; ticks.push([[cx + Math.sin(a) * r0, cy - Math.cos(a) * r0], [cx + Math.sin(a) * r1, cy - Math.cos(a) * r1]]); }
    S.dark.strokes(ticks, { w: Math.max(1.6, r * .05), d: .85 });
    const ma = (mins % 60) / 60 * TAU, ha = ((mins / 60) % 12) / 12 * TAU;
    if (whirl > .02) S.dark.mark(.3 * whirl, g => { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r * .8, ma - Math.PI / 2 - 2.4 * whirl, ma - Math.PI / 2); g.closePath(); g.fill(); });
    const hand2 = (a, len, w) => [[cx - Math.sin(a) * len * .15, cy + Math.cos(a) * len * .15], [cx + Math.sin(a) * len, cy - Math.cos(a) * len]];
    S.dark.strokes([hand2(ha, r * .5, 0)], { w: Math.max(2.5, r * .1), d: .95 });
    S.dark.strokes([hand2(ma, r * .78, 0)], { w: Math.max(2, r * .065), d: .95 });
    if (o.sec != null) S.bright.strokes([hand2(o.sec, r * .82, 0)], { w: Math.max(1.2, r * .025), d: .95 });
    S.bright.disc(cx, cy, Math.max(2, r * .07), .95);
  }

  function lateWide(S, cam, fa) {
    const T = lapse(fa), whirl = Math.sin(Math.PI * T) * seg(fa, 2, 8) * (1 - seg(fa, 36, 40));
    // sky, warming as the afternoon goes
    S.light.flood(.16 + .3 * T);
    S.bright.vgrad([[0, .035], [.45, .035 + .1 * T], [.75, .05 + .26 * T]]);   // never near zero, or the screen draws a line where the dots start
    const sx = lerp(470, 860, T), sy = lerp(70, 230, T) - Math.sin(T * Math.PI) * 40;
    glowC(S.bright, sx, sy, 300, .25 + .2 * T, .3);
    hole(1, g => { g.beginPath(); g.arc(sx, sy, 44, 0, TAU); g.fill(); });
    S.light.disc(sx, sy, 44, .55 + .4 * T); S.bright.disc(sx, sy, 44, .05 + .4 * T);
    // clouds racing across in the time-lapse
    const C = lay(cam, 9), r = rng(707), blobs = [];
    for (let i = 0; i < 6; i++) {
      const wx = -2600 + r() * 5200 + T * 2400, wy = -900 + r() * 520, n = 3 + (r() * 3 | 0), w = 300 + r() * 300;
      for (let j = 0; j < n; j++) blobs.push([C.x(wx + (j / n - .5) * w), C.y(wy - Math.sin(j / Math.max(1, n - 1) * Math.PI) * 60), (60 + r() * 40) * C.k]);
    }
    hole(.85, g => soft(g, 8, h => { for (const [x, y, rr] of blobs) { h.beginPath(); h.ellipse(x, y, rr * 1.7, rr, 0, 0, TAU); h.fill(); } }));
    // far hills and a town on them
    const H1 = lay(cam, 5), hill = wavy(cam.cx - 5000, cam.cx + 5000, 590, 30, 900, 1.2, 60).map(([x, y]) => [H1.x(x), H1.y(y - 40 * Math.sin(x / 1700))]);
    const hillP = g => { g.beginPath(); g.moveTo(hill[0][0], U + 50); for (const p of hill) g.lineTo(...p); g.lineTo(hill[hill.length - 1][0], U + 50); g.closePath(); g.fill(); };
    S.dark.mark(.3, hillP); S.bright.mark(.08, hillP);
    const H2 = lay(cam, 2.6), field = wavy(cam.cx - 3000, cam.cx + 3000, 624, 14, 700, .3, 50).map(([x, y]) => [H2.x(x), H2.y(y)]);
    const fieldP = g => { g.beginPath(); g.moveTo(field[0][0], U + 50); for (const p of field) g.lineTo(...p); g.lineTo(field[field.length - 1][0], U + 50); g.closePath(); g.fill(); };
    S.dark.mark(.24, fieldP); S.light.mark(.3, fieldP);
    const pop = [];
    for (let i = -14; i <= 14; i++) { const wx = 620 + i * 170 + hh(i, 1, 91) * 60, hgt = 150 + hh(i, 2, 91) * 90; if (Math.abs(wx - 1000) < 160) continue; pop.push([H2.x(wx), H2.y(626 - hgt / 2), 34 * H2.k, hgt / 2 * H2.k]); }
    S.dark.mark(.72, g => { g.beginPath(); for (const [x, y, rx, ry] of pop) { g.moveTo(x + rx, y); g.ellipse(x, y, rx, ry, 0, 0, TAU); } g.fill(); });
    // the clock tower, in the middle distance, where everyone can see it
    const K = lay(cam, 1.5), tw = 190, tx0 = 1000, top = 640 - 700;
    const towerP = g => { g.beginPath(); g.rect(K.x(tx0 - tw / 2), K.y(top + 60), tw * K.k, (700 - 60) * K.k + 4); g.moveTo(K.x(tx0 - tw / 2 - 16), K.y(top + 62)); g.lineTo(K.x(tx0), K.y(top - 150)); g.lineTo(K.x(tx0 + tw / 2 + 16), K.y(top + 62)); g.closePath(); };
    inked(S, towerP, 3, [['dark', .5], ['light', .25]], .9);
    S.bright.mark(.75, g => { g.beginPath(); g.moveTo(K.x(tx0 - tw / 2 - 16), K.y(top + 62)); g.lineTo(K.x(tx0), K.y(top - 150)); g.lineTo(K.x(tx0 + tw / 2 + 16), K.y(top + 62)); g.closePath(); g.fill(); });
    S.dark.mark(.9, g => { for (let q = 0; q < 3; q++) { g.beginPath(); g.roundRect(K.x(tx0 - 48 + q * 36), K.y(top + 340 + (q === 1 ? -20 : 0)), 20 * K.k, 70 * K.k, [10 * K.k, 10 * K.k, 0, 0]); g.fill(); } g.fillRect(K.x(tx0 - 30), K.y(top + 580), 60 * K.k, 120 * K.k + 4); });
    const mins = 12 * 60 + 10 + 190 * T;
    clockFace(S, K.x(tx0), K.y(top + 180), 80 * K.k, mins, whirl);
    // the warehouse where the scan was forgotten, far back along the road
    const Wh = lay(cam, 1.35), wl = -700, wr = 180, wb = 640, wt = 640 - 230;
    const whP = g => { g.beginPath(); g.moveTo(Wh.x(wl), Wh.y(wb) + 4); g.lineTo(Wh.x(wl), Wh.y(wt)); for (let q = 0; q < 4; q++) { const a = wl + q * (wr - wl) / 4, b = a + (wr - wl) / 4; g.lineTo(Wh.x(a + (b - a) * .7), Wh.y(wt - 70)); g.lineTo(Wh.x(b), Wh.y(wt - 70)); g.lineTo(Wh.x(b), Wh.y(wt)); } g.lineTo(Wh.x(wr), Wh.y(wb) + 4); g.closePath(); };
    inked(S, whP, 3, [['dark', .42], ['bright', .12]], .9);
    lit('light', .55, g => { for (let q = 0; q < 4; q++) { const a = wl + q * (wr - wl) / 4, b = a + (wr - wl) / 4; g.beginPath(); g.moveTo(Wh.x(a + (b - a) * .72), Wh.y(wt - 62)); g.lineTo(Wh.x(b - 6), Wh.y(wt - 62)); g.lineTo(Wh.x(b - 6), Wh.y(wt - 6)); g.closePath(); g.fill(); } });
    S.dark.mark(.95, g => { g.fillRect(Wh.x(-20), Wh.y(wb - 150), 150 * Wh.k, 150 * Wh.k + 4); });
    S.dark.cut(.4, g => { g.lineWidth = 2; for (let q = 1; q < 8; q++) { g.beginPath(); g.moveTo(Wh.x(-20), Wh.y(wb - 150 + q * 18)); g.lineTo(Wh.x(130), Wh.y(wb - 150 + q * 18)); g.stroke(); } });
    lit('light', .95, g => { g.beginPath(); g.arc(Wh.x(55), Wh.y(wb - 172), 8 * Wh.k, 0, TAU); g.fill(); });
    // the road: sandy, long, and a snail on it
    const yf = lay(cam, 1.16).y(640), yn = lay(cam, .9).y(700);
    hole(1, g => g.fillRect(-10, yf, U + 20, yn - yf));
    S.light.band(yf, yn, .5); S.bright.band(yf, yn, .2); S.dark.band(yf, yn, .06);
    S.dark.band(yf - 1.5, yf + 2.5, .5);
    // fence posts on the far side, their shadows swinging and stretching
    const F = lay(cam, 1.16), [i0, i1] = span(cam, 1.16, 150), posts = [], shads = [];
    const sl = 12 + 150 * T, sdy = 10 - 4 * T;
    for (let i = i0; i <= i1; i++) {
      const wx = i * 150 + 40;
      posts.push([F.x(wx - 6), F.y(640 - 74), 12 * F.k, 74 * F.k]);
      shads.push([[F.x(wx), F.y(640)], [F.x(wx - sl), F.y(640 + sdy)]]);
    }
    S.dark.strokes(shads, { w: 9 * F.k, d: .32, tout: .9 });
    S.dark.mark(.8, g => rects(g, posts));
    S.dark.strokes([[[F.x(i0 * 150), F.y(640 - 56)], [F.x(i1 * 150 + 40), F.y(640 - 56)]], [[F.x(i0 * 150), F.y(640 - 30)], [F.x(i1 * 150 + 40), F.y(640 - 30)]]], { w: 3 * F.k, d: .6 });
    // the van went by at 14:08, with parcel 42 in its window, and did not wait
    const vp = seg(fa, 19, 29);
    if (vp > 0 && vp < 1) {
      const V = lay(cam, 1.08), vx = lerp(cam.cx - 1100, cam.cx + 1000, vp), k = V.k * .5, yb = V.y(654);
      const T0 = (x0, fn) => g => { g.translate(x0, yb); g.scale(k, k); fn(g); };
      const bodyFill = g => { vanBody(g); g.fill(); };
      for (let q = 3; q >= 1; q--) { const d = [0, .5, .28, .14][q], x0 = V.x(vx - q * 70); hole(d, T0(x0, bodyFill)); S.light.mark(d, T0(x0, bodyFill)); }
      const x0 = V.x(vx);
      hole(1, T0(x0, bodyFill)); S.light.mark(.95, T0(x0, bodyFill));
      hole(1, T0(x0, g => g.fillRect(0, -132, 570, 15)));
      S.dark.mark(.9, T0(x0, g => { g.beginPath(); g.roundRect(...WIN, 12); g.fill(); g.fillRect(4, -84, 564, 24); g.beginPath(); g.moveTo(400, -208); g.lineTo(466, -208); g.quadraticCurveTo(484, -206, 496, -156); g.lineTo(400, -156); g.closePath(); g.fill(); }));
      S.dark.mark(1, T0(x0, g => { for (const wx of [112, 462]) { g.beginPath(); g.arc(wx, -40, 40, 0, TAU); g.fill(); } }));
      S.dark.mark(.85, T0(x0, g => { g.lineWidth = 5; vanBody(g); g.stroke(); }));
      parcel42(x0 + 128 * k, yb - 156 * k, .7 * k, { gaze: [1, 0], smile: 1, tilt: .12 });
      S.dark.strokes([0, 1, 2].map(q => [[x0 - (160 + q * 60) * k, yb - (250 - q * 70) * k], [x0 - 20 * k, yb - (250 - q * 70) * k]]), { w: 3, d: .6, tin: .2 });
    }
    // the trail it has left, all the way back to the warehouse door
    const R1 = lay(cam, 1), gy = 672, sxw = snailWX(fa);
    const trail = []; for (let wx = 60; wx <= sxw - 50; wx += 20) trail.push([R1.x(wx), R1.y(gy + Math.sin(wx / 90) * 2)]);
    if (trail.length > 1) {
      S.dark.mark(.35, g => { g.translate(0, 2.5 * R1.k); ribbon(g, trail, 3.4 * R1.k + 1); });
      hole(.95, g => ribbon(g, trail, 3.4 * R1.k + 1));
      S.light.mark(.18, g => ribbon(g, trail, 3.4 * R1.k + 1));
      hole(1, g => { for (let i = 2; i < trail.length; i += 5) { g.beginPath(); g.arc(trail[i][0], trail[i][1] - 1, 1.6 + R1.k * 1.4, 0, TAU); g.fill(); } });
    }
    const ss = .5 * R1.k, sxs = R1.x(sxw), sys = R1.y(gy);
    S.dark.mark(.3, g => soft(g, 3, h => { h.beginPath(); h.ellipse(sxs - 20 * ss - T * 60 * ss, sys + 3 * ss, 120 * ss + T * 40 * ss, 9 * ss, 0, 0, TAU); h.fill(); }));
    // it watches the van go past, wide eyed, then gets back to it
    const vpass = seg(fa, 18, 21) * (1 - seg(fa, 30, 34)), vside = fa < 24 ? -1 : 1;
    snail(S, sxs, sys, ss, { st: Math.sin(fa * .39), lids: .45 * (1 - vpass), gaze: [lerp(1, vside, vpass), lerp(0, -.5, vpass)], smile: .3 * (1 - vpass), blink: bump(fa, 36, 1) });
    // the grass bank between the road and the lens, and tall tufts right in front
    const bank = g => g.fillRect(-10, yn, U + 20, U);
    hole(1, bank);
    S.dark.mark(1, g => { const gr = g.createLinearGradient(0, yn, 0, U); gr.addColorStop(0, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,.58)'); g.fillStyle = gr; bank(g); });
    S.light.mark(.62, bank); S.bright.mark(.06, bank);
    S.dark.band(yn - 1, yn + 3, .4);
    const B2 = lay(cam, .8), [b0, b1] = span(cam, .8, 34), tufts = [];
    for (let i = b0; i <= b1; i++) { const wx = i * 34 + hh(i, 5, 97) * 20, h = 14 + 22 * hh(i, 6, 97), yb = 712 + 30 * hh(i, 7, 97); tufts.push([[B2.x(wx), B2.y(yb)], [B2.x(wx + 4), B2.y(yb - h)]], [[B2.x(wx + 6), B2.y(yb)], [B2.x(wx + 14), B2.y(yb - h * .8)]]); }
    S.dark.strokes(tufts, { w: 3.2 * B2.k, d: .45, tout: .8 });
    const G = lay(cam, .6), [j0, j1] = span(cam, .6, 13), blades = [], flowers = [];
    for (let i = j0; i <= j1; i++) {
      const wx = i * 13 + hh(i, 8, 97) * 10, h = 60 + 150 * hh(i, 1, 97), lean = (hh(i, 2, 97) - .5) * 44 + Math.sin(fa * .12 + i) * 5;
      if (hh(i, 9, 97) < .3) continue;
      blades.push([[G.x(wx), G.y(820)], [G.x(wx + lean * .4), G.y(820 - h * .55)], [G.x(wx + lean), G.y(820 - h)]]);
      if (hh(i, 3, 97) > .9) flowers.push([G.x(wx + lean), G.y(820 - h - 6), (6 + 5 * hh(i, 4, 97)) * G.k]);
    }
    S.dark.strokes(blades, { w: 7 * G.k, d: .72, tout: .9 });
    S.light.strokes(blades, { w: 7 * G.k, d: .4, tout: .9 });
    hole(1, g => { for (const [x, y, rr] of flowers) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } });
    S.bright.mark(.9, g => { for (const [x, y, rr] of flowers) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } });
    S.light.mark(.9, g => { for (const [x, y, rr] of flowers) { g.beginPath(); g.arc(x, y, rr * .38, 0, TAU); g.fill(); } });
    const Dn = lay(cam, .6), hx0 = Dn.x(850), hy0 = Dn.y(408), hr0 = 56 * Dn.k;
    const stem = [[Dn.x(870), U + 30], [Dn.x(862), Dn.y(600)], [hx0 + 4, hy0 + hr0 * .4]];
    S.dark.strokes([stem], { w: 6 * Dn.k, d: .75 }); S.light.strokes([stem], { w: 6 * Dn.k, d: .5 });
    S.dark.strokes([[[Dn.x(866), Dn.y(700)], [Dn.x(800), Dn.y(640)], [Dn.x(790), Dn.y(610)]], [[Dn.x(868), Dn.y(760)], [Dn.x(930), Dn.y(700)], [Dn.x(945), Dn.y(660)]]], { w: 9 * Dn.k, d: .6, tout: .9 });
    const rs = rng(606), stay = [], flying = [];
    for (let i = 0; i < 34; i++) {
      const a = rs() * TAU, leave = .05 + rs() * .9, ph = rs() * 6;
      if (T < leave) stay.push(a);
      else { const t = (T - leave) * 3 + seg(fa, 40, 48) * .3, fx = hx0 + Math.cos(a) * hr0 + t * (320 + ph * 40) * Dn.k, fy = hy0 + Math.sin(a) * hr0 - t * (160 + ph * 30) * Dn.k + Math.sin(t * 6 + ph) * 16 * Dn.k; if (fx < U + 40 && fy > -40) flying.push([fx, fy, a]); }
    }
    const seedLines = [], seedTufts = [];
    for (const a of stay) { seedLines.push([[hx0, hy0], [hx0 + Math.cos(a) * hr0 * .82, hy0 + Math.sin(a) * hr0 * .82]]); seedTufts.push([hx0 + Math.cos(a) * hr0, hy0 + Math.sin(a) * hr0, 9 * Dn.k]); }
    for (const [fx, fy, a] of flying) { seedLines.push([[fx, fy], [fx - Math.cos(a) * 14 * Dn.k, fy + 18 * Dn.k]]); seedTufts.push([fx, fy, 8 * Dn.k]); }
    if (stay.length) hole(.45, g => soft(g, 6, h => { h.beginPath(); h.arc(hx0, hy0, hr0 * (.5 + .55 * stay.length / 34), 0, TAU); h.fill(); }));
    hole(1, g => soft(g, 2.2, h => { h.beginPath(); for (const [x, y, rr] of seedTufts) { h.moveTo(x + rr, y); h.arc(x, y, rr, 0, TAU); } h.fill(); }));
    S.dark.strokes(seedLines, { w: 1.5 * Dn.k, d: .5 });
    const fans = [];
    for (const [x, y, rr] of seedTufts) for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + (q - 2) * .5; fans.push([[x, y + rr * .5], [x + Math.cos(a) * rr, y + rr * .5 + Math.sin(a) * rr]]); }
    S.dark.strokes(fans, { w: 1, d: .3 });
    S.dark.disc(hx0, hy0, 7 * Dn.k, .8);
    dust(S, cam, fa, { drum: 'light', op: 'mark', d: .2, n: 18 });
  }

  // ---- the close shot: the clerk's desk, twenty past three ----
  const snailCX = fa => 350 + 66 * easeOutCubic(seg(fa, 48, 70)) + Math.sin(fa * .39) * 1.5 * (1 - seg(fa, 66, 70));
  function envPath(fa, rest) {
    // on the shell until 74, then over the tray's lip, then down into it
    const p = seg(fa, 74, 88);
    if (p <= 0) return null;
    const [x0, y0] = rest, a = [lerp(x0, 690, easeOutCubic(Math.min(1, p / .55))), 0];
    const up = Math.sin(Math.min(1, p / .55) * Math.PI) * 40, fall = easeInQuad(seg(p, .55, 1));
    a[1] = lerp(y0, 560, Math.min(1, p / .55)) - up + fall * 88;
    const rot = lerp(-.07, .5, Math.min(1, p / .5)) - (p > .5 ? lerp(0, .62, easeOutBack(seg(p, .55, 1))) : 0);
    return [a[0], a[1], rot];
  }
  function lateClose(S, cam, fa) {
    const Wl = lay(cam, 1.8), D = lay(cam, 1);
    // the wall, warm, with a small pattern, and the window
    S.light.flood(.34); S.bright.flood(.08);
    const dots = [];
    for (let i = -8; i <= 22; i++) for (let q = -6; q <= 14; q++) dots.push([Wl.x(i * 64 + (q % 2) * 32), Wl.y(q * 64)]);
    S.dark.mark(.14, g => { g.beginPath(); for (const [x, y] of dots) { g.moveTo(x + 4 * Wl.k, y); g.arc(x, y, 4 * Wl.k, 0, TAU); } g.fill(); });
    const win = [Wl.x(800), Wl.y(-20), 250 * Wl.k, 370 * Wl.k];
    hole(1, g => rects(g, [win]));
    S.light.mark(.6, g => rects(g, [win]));
    S.bright.mark(1, g => { g.beginPath(); g.rect(...win); g.clip(); const gr = g.createLinearGradient(0, win[1], 0, win[1] + win[3]); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,.45)'); g.fillStyle = gr; g.fillRect(...win); });
    S.dark.mark(.45, g => { g.beginPath(); g.moveTo(win[0], win[1] + win[3] * .78); for (let q = 0; q <= 6; q++) g.lineTo(win[0] + win[2] * q / 6, win[1] + win[3] * (.74 + .06 * Math.sin(q * 2.3))); g.lineTo(win[0] + win[2], win[1] + win[3]); g.lineTo(win[0], win[1] + win[3]); g.closePath(); g.fill(); });
    S.dark.mark(.9, g => { g.lineWidth = 16 * Wl.k; g.strokeRect(...win); g.lineWidth = 9 * Wl.k; g.beginPath(); g.moveTo(win[0] + win[2] / 2, win[1]); g.lineTo(win[0] + win[2] / 2, win[1] + win[3]); g.moveTo(win[0], win[1] + win[3] * .5); g.lineTo(win[0] + win[2], win[1] + win[3]  * .5); g.stroke(); g.lineWidth = 22 * Wl.k; g.beginPath(); g.moveTo(win[0] - 20 * Wl.k, win[1] + win[3]); g.lineTo(win[0] + win[2] + 20 * Wl.k, win[1] + win[3]); g.stroke(); });
    // the sunbeam falls down and to the left, across the wall and onto the desk
    const bx = -300, by = 330;
    const beam = [[win[0], win[1] + win[3]], [win[0] + win[2], win[1] + win[3]], [Wl.x(800 + 250 + bx) + 60, D.y(700)], [Wl.x(800 + bx) - 60, D.y(700)]];
    S.bright.cut(.08, g => soft(g, 14, h => { poly(h, beam); h.fill(); }));
    S.dark.cut(.6, g => soft(g, 14, h => { poly(h, beam); h.fill(); }));
    S.light.mark(.26, g => soft(g, 14, h => { poly(h, beam); h.fill(); }));
    // a cork board with notes pinned to it, between the clock and the window
    const cb = [Wl.x(360), Wl.y(120), 260 * Wl.k, 180 * Wl.k];
    inked(S, g => { g.beginPath(); g.rect(...cb); }, 7 * Wl.k, [['bright', .3], ['light', .55], ['dark', .1]], .9);
    const notes = [[cb[0] + 24 * Wl.k, cb[1] + 20 * Wl.k, 80, 64, -.08], [cb[0] + 120 * Wl.k, cb[1] + 34 * Wl.k, 96, 70, .06], [cb[0] + 60 * Wl.k, cb[1] + 100 * Wl.k, 70, 56, .1]];
    for (const [nx, ny, nw, nh, nr] of notes) {
      const c = Math.cos(nr), sn2 = Math.sin(nr), P2 = (px, py) => [nx + (px * c - py * sn2) * Wl.k, ny + (px * sn2 + py * c) * Wl.k];
      inked(S, g => poly(g, [P2(0, 0), P2(nw, 0), P2(nw, nh), P2(0, nh)]), 2, [], .6);
      S.dark.strokes([[P2(10, 22), P2(nw - 14, 22)], [P2(10, 36), P2(nw - 24, 36)], [P2(10, 50), P2(nw - 30, 50)]].slice(0, nh > 60 ? 3 : 2), { w: 2.4 * Wl.k, d: .45 });
      S.bright.disc(...P2(nw / 2, 6), 6 * Wl.k, .95);
    }
    // the wall clock says twenty past three
    const [ccx, ccy] = [Wl.x(105), Wl.y(322)], cr = 120 * Wl.k;
    S.dark.mark(.3, g => soft(g, 8, h => { h.beginPath(); h.arc(ccx + 10, ccy + 12, cr * 1.05, 0, TAU); h.fill(); }));
    clockFace(S, ccx, ccy, cr, 15 * 60 + 20 + seg(fa, 48, 96) * .6, 0, { sec: Math.floor(fa / 12) * TAU / 60 * 5 });
    // the desk
    const top0 = D.y(688), top1 = D.y(712);
    hole(1, g => g.fillRect(-10, top0, U + 20, U));
    const deskTop = g => g.fillRect(-10, top0, U + 20, top1 - top0), deskFront = g => g.fillRect(-10, top1, U + 20, U);
    S.bright.mark(.42, deskTop); S.light.mark(.62, deskTop); S.dark.mark(.08, deskTop);
    S.bright.mark(.5, deskFront); S.light.mark(.55, deskFront); S.dark.mark(.3, deskFront);
    S.dark.mark(.85, g => g.fillRect(-10, top1 - 2, U + 20, 5));
    const grain = [];
    for (let i = 0; i < 9; i++) grain.push(wavy(-20, U + 20, top1 + 30 + i * 36, 4, 240 + i * 30, i * 1.7, 40));
    S.dark.strokes(grain, { w: 2.2, d: .2 });
    S.light.cut(.4, g => soft(g, 14, h => { poly(h, [[Wl.x(500) + 60, top0], [Wl.x(750) + 60, top0], [Wl.x(750) - 20, top1], [Wl.x(500) - 20, top1]]); h.fill(); }));
    // the ledger, closed, with its ribbon, and a pencil
    const Lb = lay(cam, 1.02);
    const book = [Lb.x(830), Lb.y(640), 360 * Lb.k, 56 * Lb.k];
    inked(S, g => { g.beginPath(); g.roundRect(...book, 8); }, 3, [['dark', .82]], .95);
    hole(1, g => rects(g, [[book[0] + 8, book[1] + 12, book[2], book[3] - 24]]));
    S.dark.strokes([0, 1, 2, 3].map(q => [[book[0] + 10, book[1] + 17 + q * 7], [book[0] + book[2], book[1] + 17 + q * 7]]), { w: 1.4, d: .35 });
    S.bright.mark(.9, g => { g.beginPath(); g.moveTo(book[0] + 80 * Lb.k, book[1] + book[3]); g.lineTo(book[0] + 94 * Lb.k, book[1] + book[3]); g.lineTo(book[0] + 90 * Lb.k, book[1] + book[3] + 60 * Lb.k); g.lineTo(book[0] + 84 * Lb.k, book[1] + book[3] + 52 * Lb.k); g.lineTo(book[0] + 78 * Lb.k, book[1] + book[3] + 60 * Lb.k); g.closePath(); g.fill(); });
    const pen = [[Lb.x(220), Lb.y(700)], [Lb.x(470), Lb.y(700)]];
    // the tray: back and papers first, the front lip after the letter
    const tr = { l: D.x(575), r: D.x(815), top: D.y(606), lip: D.y(648), bot: D.y(700), k: D.k };
    const trBack = g => { g.beginPath(); g.moveTo(tr.l, tr.bot); g.lineTo(tr.l, tr.top + 14 * tr.k); g.lineTo(tr.l + 14 * tr.k, tr.top); g.lineTo(tr.r - 14 * tr.k, tr.top); g.lineTo(tr.r, tr.top + 14 * tr.k); g.lineTo(tr.r, tr.bot); g.closePath(); };
    inked(S, trBack, 3, [['dark', .62], ['bright', .2]], .9);
    const papers = [[tr.l + 18 * tr.k, D.y(622), 190 * tr.k, 40 * tr.k], [tr.l + 30 * tr.k, D.y(630), 186 * tr.k, 30 * tr.k]];
    inked(S, g => { g.beginPath(); for (const p of papers) g.rect(...p); }, 2, [], .6);
    // the slime trail back along the desk and down its front
    const sxN = D.x(snailCX(fa)), tailX = sxN - 110 * D.k;
    lit('light', .8, g => { g.lineWidth = 6 * D.k; g.beginPath(); g.moveTo(-20, top0 + 16 * D.k); g.lineTo(tailX, D.y(700) - 2); g.stroke(); });
    lit('light', .7, g => { g.lineWidth = 7 * D.k; g.beginPath(); g.moveTo(D.x(120), U + 20); g.quadraticCurveTo(D.x(128), top1 + 40, D.x(150), top1 + 2); g.stroke(); });
    hole(.9, g => { for (let i = 0; i < 7; i++) { const px = lerp(D.x(40), tailX, i / 7) + Math.sin(i * 9.1) * 8; g.beginPath(); g.arc(px, D.y(700) - 3, 2.4, 0, TAU); g.fill(); } });
    // the snail
    const happy = seg(fa, 88, 91), handing = seg(fa, 72, 80) * (1 - seg(fa, 84, 90));
    const ep = envPath(fa, [0, 0]);
    const lookUp = seg(fa, 66, 70);
    let gaze = [lerp(1, .6, lookUp), lerp(-.1, -.8, lookUp)];
    S.dark.mark(.28, g => soft(g, 5, h => { h.beginPath(); h.ellipse(sxN - 40 * D.k, D.y(702), 170 * D.k, 11 * D.k, 0, 0, TAU); h.fill(); }));
    const sn = snail(S, sxN, D.y(700), D.k, {
      st: fa < 70 ? Math.sin(fa * .39) : 0, rear: .5 * handing + .3 * lookUp * (1 - happy), lids: fa < 66 ? .45 : 0,
      gaze, smile: fa < 66 ? .25 : .7 + .3 * happy, tip: .22 * handing, happy, blink: bump(fa, 58, 1),
      env: fa < 74 ? 'on' : 'off', readable: true, sweat: fa > 52 && fa < 66 ? seg(fa, 52, 66) : 0,
    });
    if (fa >= 74) {
      const [ex0, ey0] = sn.env, p = seg(fa, 74, 88);
      const k1 = Math.min(1, p / .55), up = Math.sin(k1 * Math.PI) * 40 * D.k, fall = easeInQuad(seg(p, .55, 1));
      const ex = lerp(ex0, D.x(700), easeOutCubic(k1)), ey = lerp(ey0, D.y(560), k1) - up + fall * 68 * D.k;
      const rot = lerp(-.07, .45, Math.min(1, p / .5)) - (p > .5 ? .55 * easeOutBack(seg(p, .55, 1)) : 0);
      envelope(S, ex, ey, sn.ew, sn.eh, rot, true);
      const fly = seg(fa, 75, 78) * (1 - seg(fa, 82, 86));
      if (fly > 0) S.dark.strokes([-1, 0, 1].map(q => [[ex - (sn.ew * .62 + 80 * D.k), ey + (q * 26 + 30) * D.k], [ex - sn.ew * .6, ey + (q * 26 + 14) * D.k]]), { w: 4 * D.k, d: .6 * fly, tin: .3 });
    }
    // the front lip of the tray hides the bottom of the letter once it is in
    const trFront = g => { g.beginPath(); g.moveTo(tr.l - 6 * tr.k, tr.lip); g.lineTo(tr.r + 6 * tr.k, tr.lip); g.lineTo(tr.r + 6 * tr.k, tr.bot); g.lineTo(tr.l - 6 * tr.k, tr.bot); g.closePath(); };
    inked(S, trFront, 3, [['dark', .7], ['bright', .25]], .95);
    S.light.cut(.35, g => { g.fillRect(tr.l - 4 * tr.k, tr.lip + 3, tr.r - tr.l + 8 * tr.k, 5 * tr.k); });
    // specks turning in the sunbeam, and a mug close to the lens
    const r2 = rng(3131), motes = [];
    for (let i = 0; i < 30; i++) { const t = r2(), px = lerp(beam[0][0], beam[3][0], t) + r2() * (beam[1][0] - beam[0][0]) + Math.sin(fa * .05 + i) * 14, py = lerp(beam[0][1], beam[3][1], t) + Math.cos(fa * .04 + i * 2) * 10; motes.push([px, py, 2.4 + r2() * 3]); }
    lit('light', .85, g => { for (const [x, y, rr] of motes) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } });
    dust(S, cam, fa, { drum: 'light', op: 'mark', d: .16, n: 14 });
  }

  function lateCam(W, u) {
    const fa = u * 96;
    if (u < .5) { const k = ease(seg(fa, 0, 46)); return [lerp(560, 660, k), lerp(270, 440, k), lerp(1500, 900, k)]; }
    const k = easeInOutCubic(seg(fa, 48, 95));
    return [lerp(470, 500, k), lerp(545, 535, k), lerp(700, 580, k)];
  }
  function lateDraw(S, u, W, cam) {
    inks('#145C84', '#F94F8D', '#FFC61F');
    const fa = u * 96;
    if (fa < LW) lateWide(S, cam, fa); else lateClose(S, cam, fa);
  }
  LIVED.late = { cam: lateCam, draw: lateDraw };
})();
