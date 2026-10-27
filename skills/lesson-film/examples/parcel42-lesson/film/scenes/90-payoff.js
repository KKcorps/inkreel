// ============================================================================
// payoff: "Nothing gets overwritten, and for each key, only one window is lit."
// The town at night from the hill, after compaction: 42's old dark houses are
// gone from the old streets. On "one" a pink 42 pennant rises over its single
// lit window, which burns brighter on "lit". The chord lands, the parcel is
// pleased, and the camera rises to the title in the sky as it all fades.
// ============================================================================
const PAYOFF_HOUSES = () => [[5, 1], [6, 4], [7, 2], [8, 1], [8, 2]];   // parcel 42's five rows, the fourth is live
function payoffPennant(h, i, f, up, dim) {
  const k = easeOutBack(seg(f, up, up + 7)); if (k <= 0) return;
  // pennants drawn 1.7 times the house's scale, so "every house is kept" reads in the wide shot. at 1x they
  // were too small to register as motion on the word
  const x = h.x + 112 * h.s * .5, top = h.base - (84 + 44) * h.s - 6, s = h.s * 1.7;
  const pole = 34 * s * k;                        // short, so the flag stays over its own roof, not the street behind
  c.save(); c.globalAlpha = 1 - .62 * dim;
  c.strokeStyle = '#3A2410'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - pole); c.stroke();
  const flag = rough([[x, top - pole], [x + 58 * s, top - pole + 12 * s], [x, top - pole + 26 * s]], 1.4 * s, 740 + i, 8 * s);
  inkFill(flag, [x, top - pole, 60 * s, 28 * s], BLOSSOM, 741 + i, .08);
  hand('42', { x: x + 22 * s, y: top - pole + 4 * s, xh: 17 * s, w: 2.4 * s, color: PAPER, seed: 742 + i, center: true });
  c.restore();
}
SCENE_DRAW.payoff = (f, u, sc) => {
  const L = layer('payoff-night', () => town({ phase: 'compacted', late: true, night: 1 }), 1.25);
  const kept = word('payoff', 'nothing').s, one = word('payoff', 'one').s, lit = word('payoff', 'lit').s;
  // it pulls back to the whole town, then after the chord drifts up toward the night sky, the way the film came in
  const back = camMove(f, sc.start, HIT + 30, [900, 600, 1.15], [960, 540, 1.0]);
  const cam = drift(f < HIT + 30 ? back : camMove(f, HIT + 30, TOTAL, [960, 540, 1.0], [960, 436, 1.24]), f, .5 * (1 - seg(f, HIT, HIT + 24)));
  showLayer(L, cam);
  inCam(cam, () => {
    PAYOFF_HOUSES().filter(([st, i]) => st === 8 && i === 1).forEach(([st, i], n) => {
      const h = houseAt(st, i), live = true;
      payoffPennant(h, 3, f, one - 1, 0);
      if (live) {
        // it brightens on "one window is lit", and pulses once more on "which window to check"
        const [wx, wy] = windowOf(h), b = seg(f, one, lit + 6), wn = word('outro', 'window').s, p = Math.sin(seg(f, wn - 1, wn + 14) * Math.PI);
        glow(wx, wy, 150 * h.s * (1 + .4 * b + .5 * p), TURMERIC, .35 + .45 * b + .2 * p); glow(wx, wy, 34 * h.s, '#FFF4C8', .5 + .4 * b + .1 * p);
      }
    });
    // the parcel looks at its lit window, then at us, pleased, as the chord lands
    const happy = f >= HIT ? 1 : 0, hop = f >= HIT ? Math.sin(seg(f, HIT, HIT + 10) * Math.PI) * 12 : 0;
    c.save(); c.translate(0, -hop); hillParcel(f, { gaze: f < kept ? [.95, .35] : f < word('outro', 'window').s ? [0, .12] : [.95, .35], happy }); c.restore();
    // the title comes back in the sky, and the credit under it, as the camera rises to them
    handPart('the switch', easeOut(seg(f, HIT + 36, HIT + 66)), { x: 960, y: 150, xh: 76, w: 8, color: CREAM, seed: 770, center: true });
    handPart('apache pinot · upserts', easeOut(seg(f, HIT + 60, HIT + 84)), { x: 960, y: 268, xh: 34, w: 3.6, color: CREAM, seed: 760, center: true, pencil: true, al: .9 });
  });
};
