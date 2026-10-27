// ============================================================================
// query: the kid's telescope is the query. First the kid at the eyepiece, then the
// view through it, in the town as it is now: 16:30 lit on street 8, house 12 on
// street 7 dark, the late 12:10 house on street 8 dark. The view slides past the
// dark windows, 42's old ones too, and stops only on the lit one, then reads it.
// ============================================================================
const QUERY_TOWN = () => layer('query-town-after', () => town({ phase: 'after', late: true }), 3);
// the brass eyepiece and the dark round it, drawn in screen space
function queryEyepiece(inside) {
  c.fillStyle = '#000814'; c.fillRect(0, 0, W, H);
  c.save(); c.beginPath(); c.arc(W / 2, H / 2, 430, 0, TAU); c.clip();
  inside();
  const vg = c.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 440); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,8,20,.8)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.strokeStyle = '#C8902C'; c.lineWidth = 26; c.beginPath(); c.arc(W / 2, H / 2, 442, 0, TAU); c.stroke();
  c.strokeStyle = alph('#FFE7A0', .5); c.lineWidth = 5; c.beginPath(); c.arc(W / 2, H / 2, 452, -2.4, -1.2); c.stroke(); c.restore();
}
// the stops the view makes, as window centres in the town: past 42's old house, past a dark
// neighbour, down past the late 12:10 house, and home on the lit one
function queryStops() {
  const s7 = Object.keys(STREET_AT[7]).map(Number).sort((a, b) => a - b), past = s7.find(i => i > 2) ?? s7[s7.length - 1];
  const q = word('query', 'query').s, lit = word('query', 'lit').s;
  return [
    [q - 2, windowOf(houseAt(7, 2))],
    [q + 13, windowOf(houseAt(7, past))],
    [lit - 11, windowOf(houseAt(8, 2))],
    [lit, windowOf(houseAt(8, 1))],
  ];
}
const QUERY_ZOOM = 3.2;
function queryAim(f) {
  const st = queryStops();
  let p = st[0][1];
  for (let i = 1; i < st.length; i++) {
    const [a, pa] = st[i - 1], [b, pb] = st[i];
    if (f >= a) { const k = i === st.length - 1 ? easeOutBack(seg(f, a, b)) : ease(seg(f, a, b)); p = [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k)]; }
  }
  // keep the view inside the town's picture, so the window may sit low in the circle
  const lim = 540 / QUERY_ZOOM;
  return [clamp(p[0], 960 / QUERY_ZOOM, W - 960 / QUERY_ZOOM), clamp(p[1], lim, H - lim - 2)];
}
// the answer the query reads off the lit house, on a paper slip in the view
function querySlip(k) {
  if (k <= 0) return;
  const s = .6 + .4 * easeOutBack(clamp(k, 0, 1));
  c.save(); c.translate(W / 2 + 10, H / 2 - 215); c.rotate(-.035); c.scale(s, s); c.globalAlpha = clamp(k * 2, 0, 1);
  const sp = rrect(-250, -104, 500, 208, 1.5, 820);
  shadowOf(() => c.fill(sp), 8, 10, 8, .45);
  inkFill(sp, [-250, -104, 500, 208], '#F7F1E1', 821, .06, 'warm');
  c.save(); c.fillStyle = alph(TURMERIC, .85); c.translate(0, -106); c.rotate(.05); c.fillRect(-50, -12, 100, 24); c.restore();
  // digits stand taller than the x-height, so the two lines sit well apart
  hand('42 delivered', { x: 0, y: -62, xh: 44, w: 6, color: INDIGO, center: true, seed: 822 });
  hand('16:30', { x: 0, y: 26, xh: 46, w: 6.4, color: BLOSSOM_D, center: true, seed: 823, slant: .06 });
  c.restore();
}

SCENE_DRAW.query = (f, u, sc) => {
  const L = QUERY_TOWN();
  const q = word('query', 'query').s, lit = word('query', 'lit').s;
  if (f < q - 2) {
    // the kid at the eyepiece, parcel 42 beside, both turned to the town
    const cam = drift(camMove(f, sc.start, q - 2, [470, 600, 2.1], [456, 596, 2.25]), f, .4);
    showLayer(L, cam);
    inCam(cam, () => hillParcel(f, { gaze: [.95, .3] }));
    return;
  }
  const [cx, cy] = queryAim(f);
  queryEyepiece(() => {
    showLayer(L, [cx, cy, QUERY_ZOOM]);
    // a pen ring round the lit window once the view has stopped on it
    const w = windowOf(houseAt(8, 1)), sx = W / 2 + (w[0] - cx) * QUERY_ZOOM, sy = H / 2 + (w[1] - cy) * QUERY_ZOOM;
    const k = ease(seg(f, lit + 1, lit + 10));
    if (k > 0) {
      c.save(); c.strokeStyle = alph(BLOSSOM_D, .9); c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
      c.ellipse(sx, sy, 108, 84, -.08, -1.9, -1.9 + TAU * 1.08 * k); c.stroke(); c.restore();
    }
    querySlip(seg(f, lit + 5, lit + 14));
  });
};
