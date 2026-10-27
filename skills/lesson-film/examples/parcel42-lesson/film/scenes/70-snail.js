// ============================================================================
// snail: on the same road as 20-road.js, later. A snail crawls to the post office
// with a late letter postmarked 12:10. Then the guess: it waits at the door, the
// clock in the gable ticks, and parcel 42 looks from the snail to us and back.
// No answer here. The next scene, inside, gives it.
// ============================================================================
// how far along road 3 the snail is at frame f
function snailT(f) {
  const a = SCENE('snail').start, stop = word('snail', 'what').s + 6;
  return lerp(.64, 1, seg(f, a, stop));        // a steady crawl, the whole way
}
function snailPos(f) { const [x, y] = roadPoint('r3', snailT(f)); return [x, y + 8, roadScale(y) * .8]; }
// the late letter it carries, stood up on its shell
function snailLetter(s) {
  const ew = 88 * s, eh = 58 * s;
  c.save(); c.rotate(-.08);
  const env = rrect(-ew / 2, -eh / 2, ew, eh, .8 * s, 610);
  inkFill(env, [-ew / 2, -eh / 2, ew, eh], '#F7F1E1', 611, .05, 'warm');
  c.strokeStyle = alph('#C9B28A', .95); c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(-ew / 2, -eh / 2); c.lineTo(0, 2 * s); c.lineTo(ew / 2, -eh / 2); c.stroke();
  // the postmark ring, and 12:10 inside it, big enough to read in the close shot
  const rx = 16 * s, ry = 4 * s;
  c.strokeStyle = alph(BLOSSOM_D, .85); c.lineWidth = 1.8 * s; c.beginPath(); c.arc(rx, ry, 24 * s, 0, TAU); c.stroke();
  hand('12:10', { x: rx, y: ry - 7 * s, xh: 11 * s, w: 1.9 * s, color: BLOSSOM_D, center: true, seed: 612, slant: .04 });
  hand('to 42', { x: -ew / 2 + 5 * s, y: 8 * s, xh: 10 * s, w: 1.5 * s, color: INDIGO, seed: 613 });
  c.restore();
}
// a snail with a face, heading left. look: where its eyes point, crawl: a phase for the ripple
function snailCritter(x, y, s, { look = [-1, -.2], crawl = 0, blink = 0 } = {}) {
  c.save(); c.translate(x, y); c.scale(-s, s);            // drawn facing right, flipped to head left
  c.save(); c.filter = `blur(${4}px)`; c.fillStyle = 'rgba(0,8,20,.4)'; c.beginPath(); c.ellipse(4, 2, 44, 6, 0, 0, TAU); c.fill(); c.restore();
  const rip = Math.sin(crawl) * 1.6;
  const foot = P([[-38, 0], [-20, -6 - rip], [10, -9 + rip], [34, -8], [48, -18], [52, -30], [60, -32], [62, -18], [54, -2], [36, 2], [-10, 2]]);
  inkFill(foot, [-40, -34, 104, 38], '#E7C08A', 620, .1, 'warm');
  dots(foot, [-40, -34, 104, 38], { cell: 4, color: '#B9884A', density: .25, seed: 621, alpha: .7 });
  // eye stalks and eyes, which look where it looks
  for (const [bx, len, ph] of [[52, 26, 0], [58, 22, 1.3]]) {
    const tx = bx + 4 + look[0] * -2, ty = -30 - len + look[1] * 2;
    c.strokeStyle = '#E7C08A'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, -28); c.quadraticCurveTo(bx + 2, -30 - len * .6, tx, ty); c.stroke();
    c.fillStyle = '#FFFDF6'; c.beginPath(); c.ellipse(tx, ty, 5, 5 * (1 - blink * .9), 0, 0, TAU); c.fill();
    if (blink < .6) { c.fillStyle = INDIGO; c.beginPath(); c.arc(tx - look[0] * 1.8, ty + look[1] * 1.8, 2.4, 0, TAU); c.fill(); }
  }
  c.strokeStyle = alph('#6B4020', .8); c.lineWidth = 1.6; c.beginPath(); c.arc(56, -16, 5, .2, 1.4); c.stroke();
  // the shell, a blossom spiral
  const shell = P(ell(4, -26, 26, 24, 40));
  shadowOf(() => c.fill(shell), 3, 4, 3, .3);
  inkFill(shell, [-22, -50, 52, 48], BLOSSOM_D, 622, .12);
  dots(shell, [-22, -50, 52, 48], { cell: 4, color: mix(BLOSSOM_D, DEEP, .45), density: .3, seed: 623, alpha: .75 });
  c.strokeStyle = alph(PAPER, .75); c.lineWidth = 3; c.beginPath();
  for (let k = 0; k < 44; k++) { const t = k / 44, r = 21 * (1 - t), an = t * 12.5; k ? c.lineTo(4 + Math.cos(an) * r, -26 + Math.sin(an) * r) : c.moveTo(4 + r, -26); }
  c.stroke();
  fringe(shell, BLOSSOM, 1.4, -1, .35, 2);
  c.restore();
  // the letter rides upright on the shell, unflipped so its writing reads
  c.save(); c.translate(x - 12 * s, y - 58 * s); snailLetter(s); c.restore();   // a little forward, so at the door it clears the partition 3 plate
}
// the gable clock over the door. its minute hand ticks through the guess
function snailClock(x, y, r, minute) {
  shadowOf(() => { c.beginPath(); c.arc(x, y, r + 6, 0, TAU); c.fill(); }, 4, 5, 4, .35);
  c.save(); c.fillStyle = '#5B3B1E'; c.beginPath(); c.arc(x, y, r + 6, 0, TAU); c.fill();
  c.fillStyle = CREAM; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = INDIGO; c.lineWidth = 2.4;
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78); c.lineTo(x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92); c.stroke(); }
  const hA = ((4 + minute / 60) / 12) * TAU - Math.PI / 2, mA = (minute / 60) * TAU - Math.PI / 2;
  c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(hA) * r * .5, y + Math.sin(hA) * r * .5); c.stroke();
  c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(mA) * r * .8, y + Math.sin(mA) * r * .8); c.stroke();
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill();
  c.restore();
}
// parcel 42 on the step, left of the door
const SNAIL_PARCEL = [ROAD_DOOR[0] - 72 - 148 * .6, ROAD_PO.base - 128 * .6 - 4, .6];   // left of the door, clear of the snail's path
// it watches the snail come in, then through the guess looks at us, at the snail, at us, at the snail
function snailGazeTarget(f) {
  const a = AT.guess0;
  const atUs = (f >= a && f < a + 18) || (f >= a + 38 && f < a + 58);
  if (atUs) return [0, .12];
  const [sx, sy] = snailPos(f), ang = Math.atan2(sy - 40 - (SNAIL_PARCEL[1] + 19), sx - (SNAIL_PARCEL[0] + 44));
  return [Math.cos(ang), Math.sin(ang) * .8];
}
// eased over six frames, so the eyes move and never jump
function snailParcelGaze(f) { const o = [0, 0]; for (let d = 5; d >= 0; d--) { const t = snailGazeTarget(f - d); o[0] += t[0] / 6; o[1] += t[1] / 6; } return o; }

SCENE_DRAW.snail = (f, u, sc) => {
  const tw = word('snail', 'twelve').s, what = word('snail', 'what').s;
  const [x, y, s] = snailPos(f);
  const letter = [x - 12 * s, y - 58 * s];
  const MID = [880, 708, 1.45], STEP = [700, 845, 2.3];
  const close = [clamp(letter[0], 320, 1600), clamp(letter[1], 180, 900), 3.0];
  let cam = MID;
  if (f >= tw - 2) cam = camMove(f, tw - 2, tw + 10, MID, close);
  if (f >= what - 2) cam = camMove(f, what - 2, what + 14, close, STEP);
  cam = drift(cam, f, f >= what ? .35 : .6);
  showLayer(ROAD_LAYER(), cam);
  inCam(cam, () => {
    // the clock ticks each half beat from the start of the guess, and runs slow before it
    const half = CUES.beat / 2 * FPS, ticks = f < AT.guess0 ? 0 : Math.floor((f - AT.guess0) / half) + 1;
    snailClock(ROAD_DOOR[0], ROAD_PO.base - 132 * ROAD_PO.s - 36, 24, 52 + (f - sc.start) / 90 + ticks);
    roadLantern(1);
    const moving = f < what + 12;
    const bl = clamp(1 - Math.abs(f - (AT.guess0 + 30)) / 2.5, 0, 1);
    snailCritter(x, y, s, { look: moving ? [-1, -.1] : [-.4, -1], crawl: moving ? f * .5 : 0, blink: bl });
    parcel(SNAIL_PARCEL[0], SNAIL_PARCEL[1], SNAIL_PARCEL[2], { gaze: snailParcelGaze(f) });
  });
};
