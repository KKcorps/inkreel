// ============================================================================
// older: the late letter the snail brought, postmarked 12:10, is weighed against
// the time the book now holds for 42, 16:30. The book's side is heavier, so the
// letter is older. Nothing flips on the board. The letter is kept all the same:
// its house is built on street 8, and its window stays dark.
// ============================================================================
// the snail from the town, resting on the desk now its letter is on the pan
function olderSnail(x, y, s, look = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.save(); c.filter = 'blur(4px)'; c.globalAlpha = .35; c.fillStyle = '#281204'; c.beginPath(); c.ellipse(8, 4, 44, 7, 0, 0, TAU); c.fill(); c.restore();
  c.fillStyle = '#E7C08A'; c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-10, -8, 34, -4); c.quadraticCurveTo(46, -10, 44, -22); c.lineTo(50, -24); c.quadraticCurveTo(52, -6, 36, 2); c.closePath(); c.fill();
  c.strokeStyle = '#E7C08A'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(44, -20); c.lineTo(50 + look * 4, -36); c.moveTo(47, -21); c.lineTo(58 + look * 4, -33); c.stroke();
  c.fillStyle = DEEP; for (const [ex, ey] of [[50 + look * 4, -37], [58 + look * 4, -34]]) { c.beginPath(); c.arc(ex, ey, 2.2, 0, TAU); c.fill(); }
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.arc(4, -18, 20, 0, TAU); c.fill();
  c.strokeStyle = alph(PAPER, .7); c.lineWidth = 3; c.beginPath(); for (let k = 0; k < 40; k++) { const t = k / 40, r = 17 * (1 - t), an = t * 12; c.lineTo(4 + Math.cos(an) * r, -18 + Math.sin(an) * r); } c.stroke();
  c.restore();
}
// the book's side is heavier now, so the beam tips the other way
const olderTilt = f => -.22 * easeOutBack(seg(f, AT.weighLate, AT.weighLate + 12));
SCENE_DRAW.older = (f, u, sc) => {
  const nothing = word('older', 'nothing').s, letterW = word('older', 'letter').s, win = word('older', 'window').s;
  if (f < nothing - 1) {
    const cam = drift([1150, 640, 1.25], f, .5);
    showLayer(DESK_SCALEDESK(), cam);
    inCam(cam, () => {
      deskScale(olderTilt(f), () => scaleSlip('12:10', 'late letter', { seed: 350, ink: BLOSSOM_D }), () => scaleSlip('16:30', 'the book', { seed: 360 }));
      olderSnail(640, 960, 2.2, f >= AT.weighLate ? 1 : 0);
      // parcel 42 looks at the late slip, then at the snail
      parcel(1500, 760, 1.1, { gaze: f < AT.weighLate + 4 ? [-.95, -.1] : [-.97, .35] });
      const ok = seg(f, word('older', 'older').s + 2, word('older', 'older').s + 12);
      if (ok > 0) handPart('older', ok, { x: 1260, y: 930, xh: 44, w: 5, color: '#3E4654', seed: 370, pencil: true });
    });
    return;
  }
  // the board: nothing flips. the pen comes to switch 3, the live one, and goes away again
  const toWin = camMove(f, letterW - 2, letterW + 12, BOARD_CAM, [1414, 332, 1.9]);
  const cam = f < win - 2 ? drift(toWin, f, .4) : drift(camMove(f, win - 2, win + 12, [1414, 332, 1.9], [1520, 440, 2.4]), f, .3);
  deskRoom(f, cam, {
    extra: () => {
      const b = DESK_BOARD, sx = deskSwitchX(b, 2), ry = deskRowsY(b)[1];
      const come = ease(seg(f, nothing, nothing + 9)), go = ease(seg(f, nothing + 16, nothing + 26));
      if (come > 0 && go < 1) {
        const hover = [sx + 14, ry - 36], park = [1960, 760];
        const t = come < 1 ? [lerp(park[0], hover[0], come), lerp(park[1], hover[1], come)] : [lerp(hover[0], park[0], go), lerp(hover[1], park[1], go) - Math.sin(go * Math.PI) * 30];
        pen(t[0], t[1] + Math.sin(f * .5) * 1.5 * (come >= 1 && go <= 0 ? 1 : 0));
      }
    },
  });
};
