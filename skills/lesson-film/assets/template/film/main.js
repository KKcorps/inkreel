// ---- modes: ?capture=1 for the build, ?f=N or ?scene=id&u=0..1 for one frame, ?play=1 to watch ----
if (Q.get('capture') === '1') {
  window.__frames = TOTAL;
  window.__render = f => { drawFrame(f); return TOTAL; };
  window.__render(0);
  document.title = 'capture ready ' + TOTAL;
} else if (Q.get('play') === '1') {
  const t0 = performance.now();
  const tick = () => { drawFrame(Math.floor((performance.now() - t0) / 1000 * FPS) % TOTAL); requestAnimationFrame(tick); };
  tick(); document.title = 'playing';
} else if (Q.get('scenes') === '1') {
  document.title = 'scenes ' + JSON.stringify(SCENES.map(s => [s.id, s.start, s.end]));
} else {
  let f = +(Q.get('f') || 0);
  const sid = Q.get('scene');
  if (sid) { const s = SCENE(sid); f = s.start + Math.round(+(Q.get('u') || 0) * (s.end - s.start - 1)); }
  drawFrame(f);
  document.title = 'frame ' + f + ' of ' + TOTAL + ' ready';
}
