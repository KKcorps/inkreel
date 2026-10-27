// ============================================================================
// scale: a letter lands on the desk, postmarked 16:30. The postmaster weighs it
// against the time the book holds for 42, 14:08, on the brass scale. The newer
// time is the heavier one, so the pan with the letter goes down: it is not older.
// ============================================================================
// the letter on the desk, where it lands, and its postmark in desk space
const SCALE_LETTER = [560, 890, -.06];
const scalePostmark = () => { const [x, y, r] = SCALE_LETTER, lx = 330 / 2 - 110, ly = -200 / 2 + 58; return [x + lx * Math.cos(r) - ly * Math.sin(r), y + lx * Math.sin(r) + ly * Math.cos(r)]; };
// how far the beam has tipped toward the new letter
const scaleTilt = f => .22 * easeOutBack(seg(f, AT.weigh, AT.weigh + 12));
// a slip for a pan: who it is from on top, the time big below, with room between them
function scaleSlip(time, from, { seed = 300, ink = INDIGO } = {}) {
  const sp = rrect(-100, -176, 200, 172, 1.2, seed);
  shadowOf(() => c.fill(sp), 5, 6, 5, .35);
  inkFill(sp, [-100, -176, 200, 172], '#F7F1E1', seed, .06, 'warm');
  const fx = Math.min(26, 26 * 176 / script(from, { xh: 26, seed: seed + 1, slant: .18 }).width);
  hand(from, { x: 0, y: -164, xh: fx, w: fx / 7.2, color: OCEAN, seed: seed + 1, center: true });
  hand(time, { x: 0, y: -100, xh: 48, w: 6.4, color: ink, seed: seed + 2, center: true, slant: .08 });
}
SCENE_DRAW.scale = (f, u, sc) => {
  const lands = AT.letterLands, sixteen = word('lands', 'sixteen').s, onPan = word('flip', "it's").s;
  const drop = seg(f, sc.start + 2, lands);                   // it falls from above the frame and lands on the word
  if (f < onPan) {
    const pm = scalePostmark();
    const wide = [960, 548, 1.03], close = [pm[0] + 30, pm[1] - 10, 2.5];
    const cam = f < sixteen - 10 ? drift(camMove(f, sc.start, lands + 8, [960, 544, 1.06], wide), f, .6) : camMove(f, sixteen - 10, sixteen + 2, wide, close);
    showLayer(DESK_SCALEDESK(), cam);
    inCam(cam, () => {
      deskScale(0, null, () => scaleSlip('14:08', 'the book', { seed: 320 }));
      parcel(1500, 760, 1.1, { gaze: f < lands ? [-.3, -.9] : [-.95, .45] });
      const [x, y, r] = SCALE_LETTER, k = easeOutBack(drop);
      if (f >= sc.start + 2) {
        const yy = lerp(-260, y, k), rr = r + (1 - k) * .35;
        // the shadow firms up as it comes down to the desk
        c.save(); c.globalAlpha = .45 * drop; c.filter = `blur(${lerp(24, 8, drop)}px)`; c.fillStyle = 'rgba(40,18,4,.9)'; c.fillRect(x - 150, y - 80 + 20, 320, 190); c.restore();
        letter(x, yy, rr);
      }
      // a ring in pencil round the postmark as the narrator reads it
      const rk = seg(f, sixteen - 1, sixteen + 8);
      if (rk > 0) { const [px, py] = pm; c.save(); c.strokeStyle = '#3E4654'; c.globalAlpha = .75; c.lineWidth = 3; c.beginPath(); c.ellipse(px, py, 66, 60, -.1, .2, .2 + TAU * 1.05 * rk); c.stroke(); c.restore(); }
    });
    return;
  }
  // on the pans: the letter's time against the book's. newer is heavier, so the letter's side goes down
  const cam = drift([1150, 640, 1.25], f, .5);
  showLayer(DESK_SCALEDESK(), cam);
  inCam(cam, () => {
    deskScale(scaleTilt(f), () => scaleSlip('16:30', 'the letter', { seed: 330, ink: BLOSSOM_D }), () => scaleSlip('14:08', 'the book', { seed: 320 }));
    parcel(1500, 760, 1.1, { gaze: f < AT.weigh + 6 ? [-.9, -.2] : [-.95, .5] });
    // not older: the word, in pencil, under the pan that went down
    const nk = seg(f, word('flip', 'older').s, word('flip', 'older').s + 10);
    if (nk > 0) handPart('not older', nk, { x: 690, y: 930, xh: 44, w: 5, color: '#3E4654', seed: 340, pencil: true });
  });
};
