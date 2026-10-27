// ============================================================================
// hill: the town at dusk from the hill. Parcel 42 has moved house again, the old
// houses still stand, and the kid's telescope finds only one lit window.
// Also holds town(), the shared picture of the town that query and payoff reuse.
// ============================================================================
// other keys' live rows, one lit window each, per street (index along the street)
const OTHERS = { 3: [2, 9], 4: [5], 5: [7], 6: [8], 7: [5] };
// parcel 42's houses: placed on street 5, packed on 6, shipped on 7 (live until the flip)
function plates42(phase) {
  // after compaction the old streets are rebuilt without 42's dark houses, so the ending shows them gone
  if (phase === 'compacted') return { 5: { 1: { skip: true } }, 6: { 4: { skip: true } }, 7: { 2: { skip: true } } };
  return {
    5: { 1: { plate: '42', lit: false } },
    6: { 4: { plate: '42', lit: false } },
    7: { 2: { plate: '42', lit: phase === 'before' } },
  };
}
// the whole town, drawn into c. phase 'before' is the opening state, 'after' is once 16:30 is live
function town({ phase = 'before', late = false, kid: withKid = true, night = 0 } = {}) {
  ALL_LIT.length = 0;
  sky(0, 0, W, 640, 600);
  stars(0, 0, W, 420, 160 + night * 260, 7);
  moon(1655, 150, 44);
  hills(600, 34, mix(GRAPE, DEEP, .45), 11, mix(BLOSSOM_D, DEEP, .3));
  hills(622, 22, mix(INDIGO, GRAPE, .25), 12, null);
  const floor = rough([[0, 612], [W, 604], [W, H], [0, H]], 3, 13, 40);
  inkFill(floor, [0, 600, W, H - 600], mix(INDIGO, OCEAN, .35), 13, .1, 'cool');
  dots(floor, [0, 600, W, 480], { cell: 6, color: mix(OCEAN, RIVER, .2), density: .18, seed: 14, angle: 1.2 });
  const road = bez([[[250, 600], [420, 604], [500, 626]], [[500, 626], [580, 646], [600, 690]], [[600, 690], [612, 712], [616, 736]]], 16);
  const left = road.map(([x, y], i) => [x - (2 + i * .5), y]), right = road.map(([x, y], i) => [x + (2 + i * .5), y]).reverse();
  inkFill(P([...left, ...right]), [240, 596, 440, 170], mix('#D9B27A', DUSK[3], .35), 15, .1, 'warm');
  const pl = plates42(phase);
  STREETS.forEach((st, i) => street(st, OTHERS[st.id] || [], 21 + i, pl[st.id] || {}));
  postOffice(530, 738, .9);
  newStreet(1016, 1.1, { newRow: phase !== 'before', newLit: phase !== 'before', lateRow: late });
  const crest = bez([[[-40, 706], [150, 660], [360, 680]], [[360, 680], [520, 694], [640, 800]], [[640, 800], [720, 900], [760, 1090]]], 22);
  const hill = P([...crest, [-40, 1090]]);
  inkFill(hill, [-40, 650, 820, 440], mix(JADE_D, DEEP, .55), 30, .14, 'cool');
  dots(hill, [-40, 650, 820, 440], { cell: 7, color: mix(JADE_D, INDIGO, .25), density: .45, seed: 31, angle: .5 });
  hatch(hill, [-40, 650, 820, 440], { angle: -.9, gap: 14, len: 16, color: mix(JADE, DEEP, .3), alpha: .35, width: 2.4, seed: 32 });
  edge(crest, alph('#F4A94B', .95), 3.4, 33, { close: false, al: .75 });
  if (!FLAT) { const r = rng(34); c.save(); c.strokeStyle = mix(JADE_D, DEEP, .7); c.lineWidth = 2.4; for (let i = 0; i < 90; i++) { const k = r(), [gx, gy] = crest[Math.floor(k * (crest.length - 1))]; c.beginPath(); c.moveTo(gx, gy + 2); c.quadraticCurveTo(gx + 4, gy - 10, gx + 2 + (r() - .5) * 10, gy - 12 - r() * 12); c.stroke(); } c.restore(); }
  sign(418, 804, 'partition 3', { xh: 30, rot: -.1, arrow: 34, post: 120, seed: 40 });
  if (withKid) { telescope(368, 552, 556, 584, 1.05); kid(318, 548, .84); }
  const v = c.createRadialGradient(W * .55, H * .55, 380, W * .5, H * .5, 1300);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,14,40,.42)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
  if (night > 0) {
    // night falls: the whole print goes down into indigo, then the windows are lit again on top
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = alph('#28306A', night * .5); c.fillRect(0, 0, W, H); c.restore();
    for (const [x, y, s, k] of ALL_LIT) { glow(x, y, 120 * s, TURMERIC, .55 * k * night); glow(x, y, 26 * s, '#FFE9A8', .7 * k * night); }
    stars(0, 0, W, 360, 120 * night, 19);
  }
}
// "each house is a row": a pencil ring round 42's live house. "each street is a segment": a turmeric
// stroke under each segment sign. Both drawn on their word and gone a couple of seconds later
function hillNames(f, row, segw) {
  const fade = (a) => 1 - seg(f, a + 44, a + 60);
  if (f >= row - 1 && fade(row) > 0) {
    const h = houseAt(7, 2), cx = h.x + 112 * h.s * .5, cy = h.base - 60 * h.s, k = easeOut(seg(f, row - 1, row + 10));
    c.save(); c.globalAlpha = fade(row); c.strokeStyle = CREAM; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i <= 60 * k; i++) { const a = -2.2 + i / 60 * TAU * 1.1, r = 1 + .05 * Math.sin(i * .7); c.lineTo(cx + Math.cos(a) * 92 * h.s * r, cy + Math.sin(a) * 64 * h.s * r); }
    c.stroke(); c.restore();
  }
  if (f >= segw - 1 && fade(segw) > 0) {
    const k = easeOut(seg(f, segw - 1, segw + 10));
    for (const [x, y, xh, seed] of [[700, STREETS[4].base - 150, 28, 96], [740, 1016 - 112, 30, 95]]) {
      const pw = script('segment 7', { xh, seed, slant: .16 }).width + xh * 1.2, y1 = y + xh * 2.1 + 9;
      c.save(); c.globalAlpha = .9 * fade(segw); c.strokeStyle = TURMERIC; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y1); c.quadraticCurveTo(x + pw * k / 2, y1 + 4, x + pw * k, y1 - 1); c.stroke(); c.restore();
    }
  }
}
// where a house of a street sits, once its town layer has been drawn
function houseAt(street, i) { const h = (STREET_AT[street] || [])[i]; if (!h) throw new Error('no house ' + street + ':' + i); return h; }
// a window's centre on a house drawn by house()
const windowOf = h => [h.x + 112 * h.s * .66, h.base - 84 * h.s * .56];

// parcel 42 on the hill, beside the kid. it looks where the film is looking
function hillParcel(f, { gaze = [.95, .35], happy = 0 } = {}) { parcel(118, 580, .82, { gaze, happy }); }

// the van carrying the 16:30 letter from the post office toward the new street
function vanOnRoad(f, f0, f1) {
  const k = ease(seg(f, f0, f1));
  const x = lerp(640, 1000, k), y = lerp(760, 1004, k);
  van(x, y, .55 + .2 * k);
}

const TOWN_BEFORE = () => layer('town-before', () => town({ phase: 'before' }), 1);
const TOWN_BEFORE_HI = () => layer('town-before-hi', () => town({ phase: 'before' }), 2);

SCENE_DRAW.hill = (f, u, sc) => {
  // the push into the streets lands on "still standing"
  const never = word('kept', 'still').s, query = word('ask', 'query').s, row = word('hook', 'row').s, segw = word('hook', 'segment').s;
  if (f < query - 1) {
    // wide, then a push into the streets where 42's old houses still stand
    // it opens on the kid and the parcel, pulls out to the town on "moved", then pushes into the streets
    // where 42's old houses still stand. every camera stays inside the town: W/2/s <= cx <= W - W/2/s
    // it opens on the dusk sky and tilts down onto the town while the first line is said, settles on the kid and the
    // parcel for "where is it right now?", pulls out to the town on "moved", and pushes into the streets on "never"
    // sky: the dusk sky and the moon, with the hill out of frame
    const sky = [1320, 420, 1.6], close = [520, 600, 1.9], wide = [990, 556, 1.04], mid = [1120, 625, 1.22], near = [1280, 725, 1.55];
    const moved = word('hook', 'moved').s, where = word('open', 'where').s;
    const cam = f < where - 4 ? drift(camMove(f, 0, where - 4, sky, wide), f, .4)
      : f < moved - 2 ? drift(camMove(f, where - 4, where + 14, wide, close), f)
      : f < row - 4 ? drift(camMove(f, moved - 2, moved + 18, close, wide), f)
      // a slow push while the voice says what the town is, so the long line never sits on a still frame
      : f < never - 2 ? drift(camMove(f, row - 4, row + 60, wide, mid), f, .6)
      : drift(camMove(f, never - 2, never + 14, mid, near), f, .5);
    showLayer(cam[2] > 1.2 ? TOWN_BEFORE_HI() : TOWN_BEFORE(), cam);
    inCam(cam, () => { vanOnRoad(f, moved - 10, never + 10); hillNames(f, row, segw); hillParcel(f, { gaze: f < word('hook', 'parcel').s ? [0, .12] : [.95, .35] }); });
  } else {
    // through the telescope: the circle pans past dark windows and stops on the one that is lit
    const L = layer('town-before-x3', () => town({ phase: 'before' }), 3);
    const idx = Object.keys(STREET_AT[7]).map(Number).filter(i => i !== 2).sort((a, b) => a - b);
    const h0 = windowOf(houseAt(7, idx[0])), h2 = windowOf(houseAt(7, 2));
    const k = easeOutBack(seg(f, query - 1, query + 16));
    const cx = lerp(h0[0], h2[0], k), cy = lerp(h0[1], h2[1], k);
    c.fillStyle = '#000814'; c.fillRect(0, 0, W, H);
    c.save(); c.beginPath(); c.arc(W / 2, H / 2, 430, 0, TAU); c.clip();
    showLayer(L, [cx, cy, 3.2]);
    const vg = c.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 440); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,8,20,.8)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H); c.restore();
    // the brass rim of the eyepiece
    c.save(); c.strokeStyle = '#C8902C'; c.lineWidth = 26; c.beginPath(); c.arc(W / 2, H / 2, 442, 0, TAU); c.stroke();
    c.strokeStyle = alph('#FFE7A0', .5); c.lineWidth = 5; c.beginPath(); c.arc(W / 2, H / 2, 452, -2.4, -1.2); c.stroke(); c.restore();
  }
};
