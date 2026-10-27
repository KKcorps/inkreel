// ============================================================================
// title: the breath after the question. The words stop for about five seconds,
// the title is written by hand across the dusk sky while the tune states its
// motif in full, and the camera drifts down toward the road where the answer
// starts. Kurzgesagt puts its logo sting in the same place: after the cold
// open's question, before the first grounding line.
// ============================================================================
SCENE_DRAW.title = (f, u, sc) => {
  const cam = drift(camMove(f, sc.start, sc.end, [960, 430, 1.26], [900, 468, 1.3]), f, .5);
  showLayer(TOWN_BEFORE_HI(), cam);
  inCam(cam, () => {
    hillParcel(f, { gaze: [0, .12] });
    const a = sc.start + 4;
    handPart('the switch', easeOut(seg(f, a, a + 34)), { x: 960, y: 118, xh: 118, w: 12, color: CREAM, seed: 780, center: true });
    // a turmeric stroke under it, as if the pen came back for it
    if (f >= a + 30) {
      const k = easeOut(seg(f, a + 30, a + 42)), x0 = 700, x1 = lerp(700, 1220, k);
      c.save(); c.strokeStyle = TURMERIC; c.globalAlpha = .9; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, 300); c.quadraticCurveTo((x0 + x1) / 2, 292 + 6 * k, x1, 304); c.stroke(); c.restore();
    }
    handPart('how pinot upserts hide old rows', easeOut(seg(f, a + 40, a + 70)), { x: 960, y: 336, xh: 40, w: 4.2, color: CREAM, seed: 781, center: true, pencil: true, al: .95 });
  });
};
