// ---- the YouTube thumbnail: the telescope finding the one lit window, the parcel watching, one phrase ----
const TV = Q.get('v') || 'a';
const TXT = { a: 'immutable?', b: 'only one is lit' }[TV];
const FQ = word('query', 'lit').s + 14;
c = BIG; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); LIT.length = 0;
const TQ = layer('thumb-query', () => { const sc = SCENE('query'); SCENE_DRAW.query(FQ, FQ - sc.start, sc); }, 1);
c.fillStyle = '#000814'; c.fillRect(0, 0, W, H);
c.drawImage(TQ.cv, -300, 0, W, H);
stars(1180, 0, 740, 1080, 90, 44);
parcel(1330, 610, 2.5, { gaze: [-.95, -.3] });
// the phrase, in the film's hand, sized to the dark space right of the telescope, with a halo so it reads small
const tlines = { a: ['immutable?'], b: ['only one', 'is lit'] }[TV];
const troom = [1150, 1870], ttop = 96;
tlines.forEach((t, i) => {
  let xh = 150; const wid = script(t, { xh, seed: 900 + i, slant: .18 }).width; xh = Math.min(150, xh * (troom[1] - troom[0]) / wid);
  const x = (troom[0] + troom[1]) / 2, y = ttop + i * xh * 1.55;
  for (const [dx, dy] of [[-6, 0], [6, 0], [0, -6], [0, 6], [5, 5], [-5, 5]]) hand(t, { x: x + dx, y: y + dy, xh, w: xh / 5, color: '#000814', center: true, seed: 900 + i });
  hand(t, { x, y, xh, w: xh / 6, color: CREAM, center: true, seed: 900 + i });
});
finishPrint();
document.title = 'thumb ready';
