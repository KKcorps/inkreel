// ============================================================================
// recap: "One road. One book. Two switches." Three reprints of the film's own
// pictures land as postcards on a pile, one on each phrase (callbacks are reprints).
// ============================================================================
// a scene's frame drawn once into its own canvas, so it can be laid down as a card
function recapPrint(id, f) {
  return layer('recap-' + id + '-' + f, () => { const sc = SCENE(id); (SCENE_DRAW[id] || ((ff) => placeholder(id, ff)))(f, f - sc.start, sc); }, .5);
}
const RECAP_CARDS = () => [
  { id: 'road', f: word('part', 'partition').s + 8, at: word('recap', 'road').s - 1, words: 'one road', x: 430, y: 470, rot: -.05 },
  { id: 'desk', f: word('addr', 'eight').e + 10, at: word('recap', 'book').s - 1, words: 'one book', x: 960, y: 560, rot: .035 },
  { id: 'board', f: AT.onNew + 14, at: word('recap', 'switches').s - 1, words: 'two switches', x: 1490, y: 480, rot: -.03 },
];
function recapCard(card, f) {
  const k = easeOutBack(seg(f, card.at, card.at + 7));
  if (f < card.at) return;
  const img = recapPrint(card.id, card.f).cv, cw = 600, ch = cw * 9 / 16, pad = 22, foot = 92;
  c.save(); c.translate(card.x, card.y + (1 - k) * 80); c.rotate(card.rot * k); c.scale(.9 + .1 * k, .9 + .1 * k); c.globalAlpha = clamp(k * 1.5, 0, 1);
  const outer = rrect(-cw / 2 - pad, -ch / 2 - pad, cw + 2 * pad, ch + pad + foot, 1.4, 700 + card.x);
  shadowOf(() => c.fill(outer), 12, 18, 14, .5);
  inkFill(outer, [-cw / 2 - pad, -ch / 2 - pad, cw + 2 * pad, ch + pad + foot], '#FBF6EA', 701 + card.x, .05, 'warm');
  c.drawImage(img, -cw / 2, -ch / 2, cw, ch);
  hand(card.words, { x: 0, y: ch / 2 + 18, xh: 50, w: 7, color: INDIGO, seed: 710 + card.x, center: true });
  // a strip of tape across the top edge
  c.fillStyle = alph('#E8DCC0', .85); c.save(); c.translate(0, -ch / 2 - pad); c.rotate(-.03); c.fillRect(-70, -16, 140, 32); c.restore();
  c.restore();
}
SCENE_DRAW.recap = (f, u, sc) => {
  // the desk at night, under the lamp, for the cards to land on
  const L = layer('recap-desk', () => {
    const d = P([[0, 0], [W, 0], [W, H], [0, H]]);
    inkFill(d, [0, 0, W, H], mix('#8A5A2B', DEEP, .18), 720, .14, 'warm');
    hatch(d, [0, 0, W, H], { angle: -.04, gap: 12, len: 140, jitter: 8, color: mix('#3A2410', DEEP, .3), alpha: .35, width: 2.4, seed: 721 });
    dots(d, [0, 0, W, H], { cell: 7, color: DEEP, density: .25, seed: 722, angle: 1.3 });
    glow(980, 500, 1000, '#FFD98A', .5);
  }, 1);
  const cam = drift(camMove(f, sc.start, sc.end, [960, 540, 1.0], [990, 552, 1.05]), f, .6);
  showLayer(L, cam);
  inCam(cam, () => { for (const card of RECAP_CARDS()) recapCard(card, f); });
};
