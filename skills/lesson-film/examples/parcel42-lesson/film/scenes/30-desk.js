// ============================================================================
// desk: inside the post office. This file holds the one room every inside scene
// uses (desk, scale, board, bits, older), drawn from the state at frame f, and
// the desk scene itself: the address book, labelled the primary key map, and the
// line for 42 written word by word as the narrator says where it lives.
// Three compositions share the room's inks and light:
//   the room      the wall with pigeonholes, clock, switch board and the window onto the town
//   the book      the address book close on the desk, big enough to read every line
//   the scale     the desk with the brass scale, where a letter is weighed against the book
// ============================================================================
const DESK_BOARD = { x: 790, y: 130, w: 350, h: 500 };
const DESK_WIN = { x: 1180, y: 96, w: 630, h: 470 };
const DESK_CLOCK = [620, 190, 74];
const DESK_S7 = [10, 11, 12, 13, 14, 15], DESK_S8 = [1, 2, 3, 4, 5, 6];
// the other keys, so the book, the board and the window all agree
const DESK_LINES = [
  { key: '17', street: '6', house: '4', time: '13:40' },
  { key: '42', street: '7', house: '12', time: '14:08' },
  { key: '58', street: '7', house: '9', time: '15:02' },
  { key: '63', street: '7', house: '14', time: '15:40' },
  { key: '71', street: '8', house: '2', time: '16:12' },
];
// a switch on the board: does its row exist yet, and how far up is it (1 is on)
function deskSwitch(street, house, f) {
  if (street === 7) {
    if (house === 14) return { exists: true, on: 1 };
    if (house === 12) return { exists: true, on: 1 - ease(seg(f, AT.offOld, AT.offOld + 6)) };
    return { exists: true, on: 0 };
  }
  if (house === 1) return { exists: true, on: 0 };           // an older row of some other key, switched off
  if (house === 2) return { exists: true, on: 1 };           // 71's live row
  if (house === 3) return { exists: rowExists(3, f), on: ease(seg(f, AT.onNew, AT.onNew + 6)) };
  if (house === 4) return { exists: rowExists(4, f), on: 0 };
  return { exists: false, on: 0 };                           // not built yet
}
// the time on the wall clock, in minutes, running forward from dusk toward night
const deskClockMin = f => 16 * 60 + 38 + f / 10;

// ---- the room's still parts, drawn once into a layer --------------------------------------
function deskWall() {
  const wall = P([[0, 0], [W, 0], [W, 700], [0, 700]]);
  inkFill(wall, [0, 0, W, 700], '#E9C991', 100, .16, 'warm');
  dots(wall, [0, 0, W, 700], { cell: 6, color: BLOSSOM, density: .12, seed: 101, angle: .3 });
  const dado = rough([[0, 560], [W, 560], [W, 710], [0, 710]], 2, 102, 24);
  inkFill(dado, [0, 560, W, 150], '#8A5A2B', 102, .12, 'warm');
  hatch(dado, [0, 560, W, 150], { angle: 1.52, gap: 46, len: 160, color: '#5B3B1E', alpha: .35, width: 3, seed: 103 });
  glow(760, 520, 700, '#FFD98A', .35);
}
function deskSurface(top = 690) {
  const desk = P([[0, top], [W, top - 22], [W, H], [0, H]]);
  inkFill(desk, [0, top - 30, W, H - top + 30], '#A36A35', 110, .14, 'warm');
  hatch(desk, [0, top - 30, W, H - top + 30], { angle: -.04, gap: 11, len: 120, jitter: 8, color: '#6B4020', alpha: .3, width: 2.4, seed: 111 });
  dots(desk, [0, top - 30, W, H - top + 30], { cell: 7, color: '#6B4020', density: .2, seed: 112, angle: 1.3 });
  c.save(); c.fillStyle = alph('#3A2410', .55); c.fillRect(0, top - 6, W, 8); c.restore();
}
function deskBoardBody(b) {
  const board = rrect(b.x, b.y, b.w, b.h, 2, 130);
  shadowOf(() => c.fill(board), 8, 10, 8, .4);
  inkFill(board, [b.x, b.y, b.w, b.h], '#5B3B1E', 130, .12, 'warm');
  hatch(board, [b.x, b.y, b.w, b.h], { angle: 1.55, gap: 9, len: 60, color: '#3A2410', alpha: .35, width: 1.8, seed: 131 });
  const px = b.x + 20, py = b.y + 18, pw = b.w - 40, ph = 56;
  const plate = rrect(px, py, pw, ph, 1.2, 132);
  inkFill(plate, [px, py, pw, ph], '#D7A43C', 132, .1, 'warm');
  c.save(); c.strokeStyle = alph('#FFE7A0', .6); c.lineWidth = 2; c.stroke(plate); c.restore();
  // a code name keeps its capitals, so it is stamped in type, like the query ruler in Parcel 42
  c.save(); c.fillStyle = INDIGO; c.font = '700 36px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('validDocIds', px + pw / 2, py + ph / 2 + 2); c.restore();
  // one row of switches per street, the street number on the left
  deskRowsY(b).forEach((ry, ri) => {
    hand(ri ? '8' : '7', { x: b.x + 22, y: ry - 24, xh: 42, w: 6, color: CREAM, seed: 140 + ri });
    hand('street', { x: b.x + 14, y: ry + 26, xh: 16, w: 2.2, color: alph(CREAM, .8), seed: 144 + ri, pencil: true });
  });
}
const deskRowsY = b => [b.y + 170, b.y + 375];
const deskSwitchX = (b, k) => b.x + 92 + k * ((b.w - 108) / 6) + ((b.w - 108) / 6) / 2;
// the window: the same dusk as the hill, closer. street 7 behind, street 8 (being built) in front
const DESK_B7 = .66, DESK_B8 = .97, DESK_SC7 = .62, DESK_SC8 = .9;
const deskHouse7 = i => ({ x: 10 + i * 104, base: DESK_WIN.h * DESK_B7, s: DESK_SC7 });
const deskHouse8 = i => ({ x: 30 + i * 150, base: DESK_WIN.h * DESK_B8, s: DESK_SC8 });
function deskWindowStatic(v) {
  const frame = rrect(v.x - 22, v.y - 22, v.w + 44, v.h + 44, 2, 160);
  shadowOf(() => c.fill(frame), 10, 12, 10, .45);
  inkFill(frame, [v.x - 22, v.y - 22, v.w + 44, v.h + 44], '#5B3B1E', 160, .12, 'warm');
  c.save(); c.beginPath(); c.rect(v.x, v.y, v.w, v.h); c.clip(); c.translate(v.x, v.y);
  const sx = v.w / W;
  c.save(); c.scale(sx, sx); sky(0, 0, W, 900, 560); stars(0, 0, W, 360, 80, 17); c.restore();
  const hz = v.h * .42;
  inkFill(P([[0, hz], [v.w, hz - 4], [v.w, v.h], [0, v.h]]), [0, hz - 6, v.w, v.h], mix(INDIGO, OCEAN, .35), 161, .1, 'cool');
  const b7 = v.h * DESK_B7;
  inkFill(P([[0, b7 - 1], [v.w, b7 - 1], [v.w, b7 + 11], [0, b7 + 11]]), [0, b7, v.w, 12], mix(OCEAN, DEEP, .55), 162, .06);
  for (let i = 0; i < 6; i++) { if (i === 2) continue; const h = deskHouse7(i); house(h.x, h.base, h.s, { body: HOUSE_INKS[(i * 3 + 1) % 6], roof: ROOF_INKS[i % 4], seed: 170 + i, lit: DESK_S7[i] === 14 }); }
  lights();
  const b8 = v.h * DESK_B8;
  inkFill(P([[0, b8 - 1], [v.w, b8 - 1], [v.w, v.h], [0, v.h]]), [0, b8, v.w, v.h - b8], mix('#B98C5A', DEEP, .55), 163, .06);
  for (let i = 0; i < 2; i++) { const h = deskHouse8(i); house(h.x, h.base, h.s, { body: HOUSE_INKS[(i * 2 + 2) % 6], roof: ROOF_INKS[(i + 1) % 4], seed: 180 + i, lit: DESK_S8[i] === 2 }); }
  lights();
  // the posts of house 5, not built yet
  c.save(); c.strokeStyle = '#D9B27A'; c.lineWidth = 4; const fx = 612; c.beginPath(); c.moveTo(fx, b8); c.lineTo(fx, b8 - 76); c.moveTo(fx + 50, b8); c.lineTo(fx + 50, b8 - 76); c.moveTo(fx, b8 - 76); c.lineTo(fx + 60, b8 - 76); c.stroke(); c.restore();
  c.restore();
}
function deskRoomStatic() {
  deskWall();
  pigeonholes(70, 170, 430, 360);
  deskBoardBody(DESK_BOARD);
  deskWindowStatic(DESK_WIN);
  deskSurface(690);
  glow(820, 860, 620, '#FFD98A', .4);
  lamp(40, 900);
  const v = c.createRadialGradient(W * .45, H * .6, 420, W * .5, H * .5, 1300);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,18,4,.42)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}
const DESK_ROOM = () => layer('desk-room', deskRoomStatic, 2.5);

// ---- the room's live parts ---------------------------------------------------------------
function deskClock(x, y, r, min) {
  shadowOf(() => { c.beginPath(); c.arc(x, y, r + 8, 0, TAU); c.fill(); }, 6, 8, 6, .35);
  c.save(); c.fillStyle = '#5B3B1E'; c.beginPath(); c.arc(x, y, r + 8, 0, TAU); c.fill();
  c.fillStyle = CREAM; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = INDIGO; c.lineWidth = 3;
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); c.lineTo(x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92); c.stroke(); }
  const hA = ((min / 60) % 12) / 12 * TAU - Math.PI / 2, mA = (min % 60) / 60 * TAU - Math.PI / 2;
  c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(hA) * r * .5, y + Math.sin(hA) * r * .5); c.stroke();
  c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(mA) * r * .78, y + Math.sin(mA) * r * .78); c.stroke();
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
  c.restore();
}
// the switches, bulbs and house numbers. digits: 0..1, how far the pencilled bits are written.
// ring: 0..1, a soft turmeric ring on 42's two switches, to show where to look
function deskBoardLive(b, f, { digits = [0, 0], ring = 0 } = {}) {
  deskRowsY(b).forEach((ry, ri) => {
    const street = ri ? 8 : 7, houses = ri ? DESK_S8 : DESK_S7;
    houses.forEach((hn, k) => {
      const sx = deskSwitchX(b, k), st = deskSwitch(street, hn, f);
      if (!st.exists) {
        // an empty mount: the row is not written yet
        c.save(); c.strokeStyle = alph(CREAM, .35); c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.roundRect(sx - 13, ry - 27, 26, 54, 4); c.stroke(); c.restore();
        hand(String(hn), { x: sx, y: ry + 36, xh: 22, w: 2.6, color: alph(CREAM, .45), seed: 160 + hn + street * 7, center: true, pencil: true });
        return;
      }
      const on = st.on;
      c.save(); c.fillStyle = mix(mix(DARK_WIN, '#5B3B1E', .3), TURMERIC, on); c.beginPath(); c.arc(sx, ry - 52, 12, 0, TAU); c.fill(); c.restore();
      if (on > .02) { glow(sx, ry - 52, 44, TURMERIC, .75 * on); glow(sx, ry - 52, 14, '#FFE9A8', .6 * on); }
      c.save(); c.fillStyle = CREAM; c.beginPath(); c.roundRect(sx - 12, ry - 26, 24, 52, 4); c.fill();
      c.strokeStyle = INDIGO; c.lineWidth = 7; c.lineCap = 'round';
      const la = lerp(1, -1, on);                  // the lever: down is off, up is on
      const ex = sx, ey = ry + la * 20;
      c.beginPath(); c.moveTo(sx, ry); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = INDIGO; c.beginPath(); c.arc(ex, ey, 6, 0, TAU); c.fill(); c.restore();
      const is42 = (street === 7 && hn === 12) || (street === 8 && (hn === 3 || hn === 4));
      hand(String(hn), { x: sx, y: ry + 36, xh: 22, w: 3, color: is42 ? '#FFE08A' : CREAM, seed: 160 + hn + street * 7, center: true });
      if (ring > 0 && ((street === 7 && hn === 12) || (street === 8 && hn === 3))) {
        c.save(); c.strokeStyle = alph(TURMERIC, .9 * Math.sin(ring * Math.PI)); c.lineWidth = 4; c.beginPath(); c.ellipse(sx, ry - 8, 26 + ring * 8, 62 + ring * 8, 0, 0, TAU); c.stroke(); c.restore();
      }
      // the pencilled bit under the switch, 1 when up
      const dk = digits[ri] * houses.length - k;
      if (dk > 0) hand(on > .5 ? '1' : '0', { x: sx, y: ry + 80, xh: 28, w: 4, color: '#FFF3D6', seed: 190 + hn + street * 11, center: true, pencil: true, al: clamp(dk, 0, 1) });
    });
  });
}
// the houses in the window that change: 42's old house on street 7, and its new and late rows on street 8
function deskWindowLive(v, f) {
  c.save(); c.beginPath(); c.rect(v.x, v.y, v.w, v.h); c.clip(); c.translate(v.x, v.y);
  const h12 = deskHouse7(2), a12 = 1 - seg(f, AT.offOld, AT.offOld + 4);
  house(h12.x, h12.base, h12.s, { body: HOUSE_INKS[(2 * 3 + 1) % 6], roof: ROOF_INKS[2], seed: 172, lit: a12 >= 1, dim: a12 > 0 && a12 < 1 ? a12 : 0, plate: '42' });
  const b8 = v.h * DESK_B8;
  if (rowExists(3, f)) {
    const h3 = deskHouse8(2), a3 = seg(f, AT.onNew, AT.onNew + 4);
    house(h3.x, h3.base, h3.s, { body: HOUSE_INKS[(2 * 2 + 2) % 6], roof: ROOF_INKS[3], seed: 182, lit: a3 >= 1, dim: a3 > 0 && a3 < 1 ? a3 : 0, plate: '42' });
  } else deskFrame(deskHouse8(2).x + 12, b8);
  const h4 = deskHouse8(3), kb = seg(f, AT.lateKept - 2, AT.lateKept + 10);
  if (kb > 0) {
    // the late row is written: the house rises into place, and its window stays dark
    const hh = (84 + 44) * h4.s + 12;
    c.save(); c.beginPath(); c.rect(h4.x - 20, h4.base - hh * easeOut(kb), 112 * h4.s + 40, hh * easeOut(kb) + 4); c.clip();
    house(h4.x, h4.base, h4.s, { body: HOUSE_INKS[(3 * 2 + 2) % 6], roof: ROOF_INKS[0], seed: 183, plate: '42' });
    c.restore();
  }
  if (kb < 1) { c.save(); c.globalAlpha = 1 - kb; deskFrame(h4.x + 12, b8); c.restore(); }
  lights();
  c.restore();
  // the glass and the mullions go over whatever the view shows
  c.save(); c.globalCompositeOperation = 'screen'; const sh = c.createLinearGradient(v.x, v.y, v.x + v.w, v.y + v.h); sh.addColorStop(0, 'rgba(160,210,240,.12)'); sh.addColorStop(.5, 'rgba(160,210,240,0)'); c.fillStyle = sh; c.fillRect(v.x, v.y, v.w, v.h); c.restore();
  inkFill(P([[v.x + v.w / 2 - 7, v.y], [v.x + v.w / 2 + 7, v.y], [v.x + v.w / 2 + 7, v.y + v.h], [v.x + v.w / 2 - 7, v.y + v.h]]), [v.x, v.y, v.w, v.h], '#5B3B1E', 164, .1, 'warm');
  inkFill(P([[v.x, v.y + v.h * .36 - 6], [v.x + v.w, v.y + v.h * .36 - 6], [v.x + v.w, v.y + v.h * .36 + 6], [v.x, v.y + v.h * .36 + 6]]), [v.x, v.y, v.w, v.h], '#5B3B1E', 165, .1, 'warm');
}
function deskFrame(fx, base) {
  c.save(); c.strokeStyle = '#D9B27A'; c.lineWidth = 4; c.beginPath(); c.moveTo(fx, base); c.lineTo(fx, base - 76); c.moveTo(fx + 76, base); c.lineTo(fx + 76, base - 76); c.moveTo(fx - 4, base - 76); c.lineTo(fx + 80, base - 76); c.moveTo(fx, base); c.lineTo(fx + 76, base - 76); c.stroke(); c.restore();
}
// the whole room at frame f through camera cam. extra draws desk items in room space
function deskRoom(f, cam, { digits, ring, extra } = {}) {
  showLayer(DESK_ROOM(), cam);
  inCam(cam, () => {
    deskClock(...DESK_CLOCK, deskClockMin(f));
    deskBoardLive(DESK_BOARD, f, { digits, ring });
    deskWindowLive(DESK_WIN, f);
    if (extra) extra();
  });
}

// ---- the address book -----------------------------------------------------------------------
// write part of a line by hand and return where the nib is, in the current coordinates
function deskInk(text, k, o = {}) {
  if (k <= 0) return null;
  const { x = 0, y = 0, xh = 30, color = INDIGO, w = xh / 7, seed = 3, slant = .18, al = 1, pencil = false } = o;
  const sc = script(text, { x, y, xh, slant, seed, wob: pencil ? 5 : 3.2 });
  const lens = sc.paths.map(p => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; });
  let left = lens.reduce((a, b) => a + b, 0) * clamp(k, 0, 1), tip = null;
  for (let i = 0; i < sc.paths.length && left > 0; i++) {
    let p = sc.paths[i];
    if (left < lens[i]) { const q = [p[0]]; let L = left; for (let j = 1; j < p.length && L > 0; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (d <= L) { q.push(p[j]); L -= d; } else { const t = L / d; q.push([lerp(p[j - 1][0], p[j][0], t), lerp(p[j - 1][1], p[j][1], t)]); L = 0; } } p = q; }
    left -= lens[i];
    if (pencil) { const r = rng(seed + i); for (let pp = 0; pp < 4; pp++) { c.save(); c.globalAlpha = (.3 + r() * .2) * al; c.strokeStyle = color; c.lineWidth = w * (.5 + r() * .4); c.beginPath(); p.forEach(([px, py], j) => j ? c.lineTo(px + (r() - .5) * w * .5, py + (r() - .5) * w * .6) : c.moveTo(px, py)); c.stroke(); c.restore(); } }
    else nibStroke(p, w, color, { seed: seed + i, al });
    tip = p[p.length - 1];
  }
  return tip;
}
const DESK_BW = 1000, DESK_BH = 450;
const DESK_COLS = [DESK_BW / 2 + 22, DESK_BW / 2 + 92, DESK_BW / 2 + 214, DESK_BW / 2 + 322];
const deskLineY = j => 118 + j * 66;
// when each part of 42's line is written, from the voice
const deskW42 = () => ({
  label: [word('book', 'primary').s - 1, word('book', 'map').s + 8],
  key: [word('addr', 'forty-two').s - 1, word('addr', 'forty-two').s + 6],
  street: [word('addr', 'seven').s - 1, word('addr', 'seven').s + 5],
  house: [word('addr', 'twelve').s - 1, word('addr', 'twelve').s + 7],
  time: [word('addr', 'fourteen').s - 1, word('addr', 'eight').s + 4],
  lit: [word('addr', 'eight').s + 4, word('addr', 'eight').s + 12],
  strike: [AT.rewrite, AT.rewrite + 8],
  street2: [AT.rewrite + 3, AT.rewrite + 8], house2: [AT.rewrite + 8, AT.rewrite + 13], time2: [AT.rewrite + 13, AT.rewrite + 25],
});
// the book at (bx, by), scale S, as it stands at frame f. returns the pen and pencil tips in screen space
function deskBook(bx, by, S, f) {
  const T = deskW42(), tips = { pen: null, pencil: null };
  const toScreen = p => p && [bx + S * p[0] - .16 * S * p[1], by + .8 * S * p[1]];
  c.save(); c.translate(bx, by); c.transform(S, 0, -.16 * S, .8 * S, 0, 0);
  const BW = DESK_BW, BH = DESK_BH;
  c.save(); c.filter = `blur(${14}px)`; c.fillStyle = 'rgba(40,18,4,.5)'; c.fillRect(24, 30, BW, BH); c.restore();
  c.fillStyle = BLOSSOM_D; c.beginPath(); c.roundRect(-16, -14, BW + 32, BH + 28, 10); c.fill();
  for (let i = 4; i >= 1; i--) { c.fillStyle = i % 2 ? '#E7DDC4' : '#EFE6D0'; c.fillRect(-i * 2, -i * 2, BW + i * 4, BH + i * 2); }
  c.fillStyle = CREAM; c.fillRect(0, 0, BW, BH);
  const gut = c.createLinearGradient(BW / 2 - 70, 0, BW / 2 + 70, 0);
  gut.addColorStop(0, 'rgba(90,70,35,0)'); gut.addColorStop(.5, 'rgba(60,45,20,.45)'); gut.addColorStop(1, 'rgba(90,70,35,0)');
  c.fillStyle = gut; c.fillRect(BW / 2 - 70, 0, 140, BH);
  c.strokeStyle = '#8DD3E3'; c.lineWidth = 1.6;
  for (let yy = 108; yy < BH; yy += 66) { c.beginPath(); c.moveTo(20, yy); c.lineTo(BW / 2 - 20, yy); c.moveTo(BW / 2 + 20, yy); c.lineTo(BW - 20, yy); c.stroke(); }
  c.strokeStyle = 'rgba(192,26,91,.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(BW / 2 + 82, 30); c.lineTo(BW / 2 + 82, BH - 10); c.stroke();
  // left page: what the book is
  hand('address book', { x: 60, y: 34, xh: 44, w: 6, color: OCEAN, seed: 200, slant: .16 });
  hand('partition 3', { x: 60, y: 130, xh: 34, w: 4.4, color: OCEAN, seed: 201 });
  const lt = deskInk('primary key map', ease(seg(f, ...T.label)), { x: 60, y: 212, xh: 40, w: 5.4, color: INDIGO, seed: 202 });
  if (f < T.label[1]) tips.pen = toScreen(lt) || tips.pen;
  if (f >= T.label[1]) hand('one line per key', { x: 60, y: 300, xh: 28, w: 3.4, color: '#3E4654', seed: 203, pencil: true, al: seg(f, T.label[1], T.label[1] + 10) });
  // right page: the lines. 42's is written as it is said, and rewritten when 16:30 goes live
  ['key', 'street', 'house', 'time'].forEach((t, k) => hand(t, { x: DESK_COLS[k], y: 58, xh: 22, w: 3, color: '#3E4654', seed: 210 + k, pencil: true }));
  DESK_LINES.forEach((ln, j) => {
    const ly = deskLineY(j);
    if (ln.key === '42') {
      const lk = easeOut(seg(f, ...T.lit));
      if (lk > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = alph(TURMERIC, .55); c.fillRect(DESK_COLS[0] - 12, ly - 8, 470 * lk, 54); c.restore(); }
      // the rewrite rubs out the old address cell by cell and writes the new one in the same place.
      // a map replaces its entry, so the book keeps one line for 42 and no trace of the old place
      const rubOf = k => k === 0 ? 0 : seg(f, T.strike[0] + (k - 1) * 2.6, T.strike[0] + (k - 1) * 2.6 + 4);
      const parts = [['key', ln.key, 0], ['street', ln.street, 1], ['house', ln.house, 2], ['time', ln.time, 3]];
      for (const [nm, text, k] of parts) {
        const x0 = DESK_COLS[k] + (k === 1 || k === 2 ? 16 : 0), rub = rubOf(k);
        if (rub < 1) { const t = deskInk(text, ease(seg(f, ...T[nm])), { x: x0, y: ly, xh: 34, w: 5, color: INDIGO, seed: 220 + j * 5 + k, al: 1 - rub }); if (f >= T[nm][0] && f < T[nm][1]) tips.pen = toScreen(t); }
        if (rub > 0) { const wdt = k === 3 ? 150 : 70; c.save(); c.globalAlpha = .16 * Math.min(1, rub * 1.5); c.fillStyle = '#8F8068'; c.beginPath(); c.ellipse(x0 + wdt / 2 - 8, ly + 22, wdt / 2 + 4, 22, 0, 0, TAU); c.fill(); c.restore(); }
      }
      const cells = [[1, '8', 'street2'], [2, '3', 'house2'], [3, '16:30', 'time2']];
      for (const [k, newT, nm] of cells) {
        const t = deskInk(newT, ease(seg(f, ...T[nm])), { x: DESK_COLS[k] + (k === 1 || k === 2 ? 16 : 0), y: ly, xh: 34, w: 5, color: BLOSSOM_D, seed: 260 + k });
        if (f >= T[nm][0] && f < T[nm][1]) tips.pen = toScreen(t);
      }
      return;
    }
    [ln.key, ln.street, ln.house, ln.time].forEach((t, k) => hand(t, { x: DESK_COLS[k] + (k === 1 || k === 2 ? 16 : 0), y: ly, xh: 34, w: 5, color: INDIGO, seed: 220 + j * 5 + k }));
  });
  c.restore();
  return tips;
}
// a yellow pencil, its point at tip
function deskPencil(tip) {
  c.save(); c.translate(tip[0], tip[1]); c.rotate(1.98);
  c.save(); c.filter = 'blur(6px)'; c.globalAlpha = .38; c.fillStyle = '#281204'; c.fillRect(20, 6, 600, 30); c.restore();
  const hw = 13;
  c.fillStyle = '#EBCFA4'; c.beginPath(); c.moveTo(0, 0); c.lineTo(64, -hw); c.lineTo(64, hw); c.closePath(); c.fill();
  c.fillStyle = '#2E3440'; c.beginPath(); c.moveTo(0, 0); c.lineTo(18, -3.7); c.lineTo(18, 3.7); c.closePath(); c.fill();
  for (const [col, a, b] of [['#FFD95E', -hw, -hw / 3], [TURMERIC, -hw / 3, hw / 3], ['#D9A000', hw / 3, hw]]) { c.fillStyle = col; c.beginPath(); c.moveTo(64 + 4 * Math.abs(a) / hw, a); c.lineTo(700, a); c.lineTo(700, b); c.lineTo(64 + 4 * Math.abs(b) / hw, b); c.closePath(); c.fill(); }
  c.restore();
}
// a tool's pose over a list of writing jobs [from, to, tipAt(f)]: on the ink while writing,
// gliding between jobs that are close, parked off the frame otherwise
function deskToolPose(jobs, park, f) {
  for (const [a, b, fn] of jobs) if (f >= a && f < b) { const t = fn(f); if (t) return t; }
  let pe = -1e9, ns = 1e9, pj = null, nj = null;
  for (const j of jobs) { if (j[1] <= f && j[1] > pe) { pe = j[1]; pj = j; } if (j[0] > f && j[0] < ns) { ns = j[0]; nj = j; } }
  const from = pj ? pj[2](pe - 1) || park : park, to = nj ? nj[2](ns) || park : park;
  if (ns - pe < 30 && pj && nj) { const k = ease(seg(f, pe, ns)); return [lerp(from[0], to[0], k), lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 30]; }
  const ko = ease(seg(f, pe, pe + 10)), ki = ease(seg(f, ns - 10, ns));
  if (f < ns - 10) return [lerp(from[0], park[0], ko), lerp(from[1], park[1], ko)];
  return [lerp(park[0], to[0], ki), lerp(park[1], to[1], ki)];
}
// the pen's and the pencil's jobs on the close book, so they travel between words rather than jump
function deskBookTools(bx, by, S, f) {
  const T = deskW42();
  const tipAt = ff => { const save = c; const tmp = document.createElement('canvas').getContext('2d'); c = tmp; const t = deskBook(bx, by, S, ff); c = save; return t; };
  // measure tips on a scratch canvas: cheap enough, the book is only strokes
  const cache = deskBookTools.cache || (deskBookTools.cache = new Map());
  const tip = (ff, which) => { const key = bx + ',' + by + ',' + S + ',' + ff; if (!cache.has(key)) cache.set(key, tipAt(ff)); return cache.get(key)[which]; };
  const penJobs = ['label', 'key', 'street', 'house', 'time', 'street2', 'house2', 'time2'].map(n => [T[n][0], T[n][1], ff => tip(ff, 'pen')]);
  const pencilJobs = [];
  return { pen: deskToolPose(penJobs, [2200, 1300], f), pencil: deskToolPose(pencilJobs, [-500, 1400], f) };
}
// the close book composition: the book big on the desk, parcel 42 at its corner
const DESK_BOOK_AT = [250, 300, 1.52];
const DESK_BOOKDESK = () => layer('desk-bookdesk', () => {
  deskSurface(-40);
  glow(900, 560, 900, '#FFD98A', .45);
  const v = c.createRadialGradient(W * .5, H * .5, 420, W * .5, H * .5, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,18,4,.5)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}, 1.3);
function deskBookShot(f, cam, gaze = [-.9, -.4]) {
  showLayer(DESK_BOOKDESK(), cam);
  inCam(cam, () => {
    const [bx, by, S] = DESK_BOOK_AT;
    deskBook(bx, by, S, f);
    parcel(1690, 900, .78, { gaze });
    const t = deskBookTools(bx, by, S, f);
    deskPencil(t.pencil);
    pen(t.pen[0], t.pen[1]);
  });
}

// ---- the scale composition: the desk seen closer, the wall behind, the brass scale on it ----------
const DESK_SCALEDESK = () => layer('desk-scaledesk', () => {
  const wall = P([[0, 0], [W, 0], [W, 440], [0, 440]]);
  inkFill(wall, [0, 0, W, 440], '#E9C991', 400, .16, 'warm');
  dots(wall, [0, 0, W, 440], { cell: 6, color: BLOSSOM, density: .12, seed: 401, angle: .3 });
  const dado = rough([[0, 300], [W, 300], [W, 440], [0, 440]], 2, 402, 24);
  inkFill(dado, [0, 300, W, 140], '#8A5A2B', 402, .12, 'warm');
  hatch(dado, [0, 300, W, 140], { angle: 1.52, gap: 46, len: 160, color: '#5B3B1E', alpha: .35, width: 3, seed: 403 });
  glow(1000, 360, 800, '#FFD98A', .3);
  deskSurface(440);
  glow(1060, 820, 760, '#FFD98A', .45);
  lamp(-80, 690);
  const v = c.createRadialGradient(W * .55, H * .6, 380, W * .5, H * .5, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,18,4,.46)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}, 2.7);
const DESK_SCALE = { px: 1080, base: 930, beamY: 610, s: 1.12 };
// the scale with what is on each pan. tilt > 0 drops the left pan, the heavier (newer) side
function deskScale(tilt, left, right) {
  brassScale(DESK_SCALE.px, DESK_SCALE.base, DESK_SCALE.beamY, tilt, { s: DESK_SCALE.s, left, right });
}

// ================================================================================================
// the desk scene
// ================================================================================================
SCENE_DRAW.desk = (f, u, sc) => {
  const cutBook = word('book', 'address').s;
  if (f < cutBook) {
    // the room: the postmaster's desk, the book open on it, the board and the window behind
    const cam = drift(camMove(f, sc.start, cutBook, [960, 540, 1.0], [900, 580, 1.08]), f);
    deskRoom(f, cam, { extra: () => { deskBook(300, 700, 1, f); pen(1262, 862); parcel(1690, 820, .95, { gaze: [-.95, .35] }); } });
    return;
  }
  // close on the book. it settles as the narrator names it, then leans toward 42's line
  const settle = camMove(f, cutBook, cutBook + 12, [960, 500, 1.08], [960, 540, 1.0]);
  // while the narrator says what the book is, the camera drifts in toward the label being written, so the hold is never still
  const toLabel = camMove(f, word('book', 'primary').s - 14, word('book', 'map').e + 10, settle, [760, 520, 1.18]);
  const lean = camMove(f, word('addr', 'forty-two').s - 8, word('addr', 'forty-two').s + 6, toLabel, [1176, 560, 1.3]);
  const T = deskW42();
  const gaze = f < T.label[1] ? [-.95, -.5] : [-.9, -.62];
  deskBookShot(f, drift(f >= word('addr', 'forty-two').s - 8 ? lean : toLabel, f, .6), gaze);
};
