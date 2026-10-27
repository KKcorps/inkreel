// Three story sketches, one still each, drawn with the film's own kit. ?s=A for one, ?capture=1 for sketch.py.
// Each is a frame from the finished film, not a wireframe. Draw each world's own objects here from the kit's
// ink, dots, edges, light, shadow and handwriting, the way film/scenes/10-example.js builds its block.
// A. <one line: what happens in this world>
// B. <one line>
// C. <one line>
const STORIES = ['A', 'B', 'C'];
const SKETCH = {
  A: () => sketchStub('A'),
  B: () => sketchStub('B'),
  C: () => sketchStub('C'),
};
// SKETCH_STUB: delete this function once every story draws its own world. sketchcheck.py fails while it is here
function sketchStub(id) {
  inkFill(P([[0, 0], [W, 0], [W, H], [0, H]]), [0, 0, W, H], mix(PAPER, SEA, .2), 1, .12);
  hand('story ' + id.toLowerCase() + ' goes here', { x: W / 2, y: H / 2 - 40, xh: 70, color: NIGHT, center: true, seed: 9 });
}
function drawSketch(id) {
  c = BIG; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.clearRect(0, 0, W, H);
  (SKETCH[id] || SKETCH.A)();
  if (FLAT) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(big, 0, 0); } else finishPrint();
}
if (Q.get('capture') === '1') {
  window.__frames = STORIES.length;
  window.__render = i => { drawSketch(STORIES[i]); return STORIES.length; };
} else {
  drawSketch(Q.get('s') || 'A');
  if (!document.title.startsWith('ERR')) document.title = 'sketch ' + (Q.get('s') || 'A') + ' ready';
}
