// Pull apart a reference that arrives as an HTML page instead of a clip.
//
//   node refpage.mjs ref.html [outdir=refpage] [seconds=20] [width=1280]
//
// A clip only gives you pixels. A page gives you the machine that made them,
// so this watches the page draw rather than reading its source: every colour
// it sets, every canvas call it makes, every audio node it builds. Minified,
// bundled or generated source defeats grep, and none of it defeats this.
//
// It writes frames, a contact sheet and ref.mp4, so everything that already
// works on a clip (lookcheck.py, soundcheck.py, printcheck.py, and the ffmpeg
// zoom in references.md) works on a page too. Read references.md for what the
// numbers mean and which gaps are worth closing.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const [, , pageArg, outArg, secArg, wArg] = process.argv;
if (!pageArg) { console.error('usage: node refpage.mjs ref.html [outdir] [seconds] [width]'); process.exit(2); }
const OUT = resolve(outArg || 'refpage');
const SECONDS = +(secArg || 20);
const WIDTH = +(wArg || 1280), HEIGHT = Math.round(WIDTH * 9 / 16);
const FPS = 25;
const URL_IN = /^\w+:/.test(pageArg) ? pageArg : `file://${resolve(pageArg)}`;

const PORT = 9333 + (process.pid % 600);
const PROFILE = mkdtempSync(join(tmpdir(), 'refpage-'));
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => existsSync(p)) || 'google-chrome';

const FRAMES = join(OUT, 'frames');
mkdirSync(FRAMES, { recursive: true });
for (const f of readdirSync(FRAMES)) if (/^\d{4}\.png$/.test(f)) rmSync(join(FRAMES, f));

// Runs before any of the page's own code, so every wrapper is in place by the
// first draw. Everything is wrapped in try/catch: a reference we cannot read
// must still render, because half a report beats none.
const INSTRUMENT = `(() => {
  const T = { fill:{}, stroke:{}, font:{}, alpha:{}, comp:{}, filter:{}, call:{},
              audio:{}, osc:{}, biquad:{}, raster:0, samples:0, media:0, steps:[] };
  window.__ref = T;
  const bump = (o, k) => { k = String(k); o[k] = (o[k] || 0) + 1; };
  const nameOf = v => (v && v.constructor && v.constructor.name) || typeof v;
  try {
    const C = CanvasRenderingContext2D.prototype;
    for (const [prop, bin] of [['fillStyle','fill'], ['strokeStyle','stroke'], ['font','font'],
                               ['globalAlpha','alpha'], ['globalCompositeOperation','comp'], ['filter','filter']]) {
      const d = Object.getOwnPropertyDescriptor(C, prop);
      if (!d || !d.set) continue;
      Object.defineProperty(C, prop, { configurable: true, enumerable: d.enumerable, get: d.get,
        set(v) {
          try { bump(T[bin], bin === 'alpha' ? Number(v).toFixed(2) : (typeof v === 'object' ? nameOf(v) : v)); } catch (e) {}
          return d.set.call(this, v);
        } });
    }
    for (const m of ['fillRect','strokeRect','clearRect','fillText','strokeText','measureText',
                     'arc','arcTo','ellipse','rect','roundRect','moveTo','lineTo','quadraticCurveTo','bezierCurveTo',
                     'fill','stroke','clip','beginPath','closePath',
                     'translate','rotate','scale','transform','setTransform','save','restore',
                     'drawImage','putImageData','getImageData','createImageData',
                     'createLinearGradient','createRadialGradient','createConicGradient','createPattern']) {
      const fn = C[m];
      if (typeof fn !== 'function') continue;
      C[m] = function (...a) {
        bump(T.call, m);
        if (m === 'drawImage') {
          const n = nameOf(a[0]);
          bump(T.call, 'drawImage<' + n + '>');
          if (n === 'HTMLImageElement' || n === 'HTMLVideoElement' || n === 'ImageBitmap' || n === 'SVGImageElement') T.raster++;
        }
        return fn.apply(this, a);
      };
    }
  } catch (e) {}
  try {
    // createOscillator and the rest sit on BaseAudioContext.prototype, so only
    // walking AudioContext's own names finds none of them.
    const seen = new Set();
    for (const Ctx of [window.AudioContext, window.OfflineAudioContext, window.webkitAudioContext]) {
      if (!Ctx) continue;
      for (let P = Ctx.prototype; P && P !== Object.prototype; P = Object.getPrototypeOf(P)) {
        if (seen.has(P)) break;
        seen.add(P);
        for (const m of Object.getOwnPropertyNames(P)) {
          if (!/^create/.test(m) || typeof P[m] !== 'function') continue;
          const fn = P[m];
          P[m] = function (...a) { bump(T.audio, m.slice(6)); return fn.apply(this, a); };
        }
        if (typeof P.decodeAudioData === 'function') {
          const dec = P.decodeAudioData;
          P.decodeAudioData = function (...a) { T.samples++; return dec.apply(this, a); };
        }
      }
    }
    for (const [Node, bin] of [[window.OscillatorNode, 'osc'], [window.BiquadFilterNode, 'biquad']]) {
      if (!Node) continue;
      const d = Object.getOwnPropertyDescriptor(Node.prototype, 'type');
      if (!d || !d.set) continue;
      Object.defineProperty(Node.prototype, 'type', { configurable: true, get: d.get,
        set(v) { try { bump(T[bin], v); } catch (e) {} return d.set.call(this, v); } });
    }
  } catch (e) {}
  // Reset the per-step counters and hand back what changed, so the caller can
  // see draw calls per frame and where new colours enter.
  window.__refStep = () => {
    const calls = Object.values(T.call).reduce((a, b) => a + b, 0);
    const s = { calls, fills: Object.keys(T.fill).length, texts: T.call.fillText || 0 };
    T.steps.push(s);
    return s;
  };
})()`;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--force-device-scale-factor=1', `--window-size=${WIDTH},${HEIGHT}`,
  '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  'about:blank',
], { stdio: 'ignore' });

const quit = async code => {
  const gone = new Promise(r => chrome.once('exit', r));
  chrome.kill();
  await Promise.race([gone, sleep(5000)]);
  try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 }); } catch {}
  process.exit(code);
};

let target;
for (let i = 0; i < 60; i++) {
  await sleep(300);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    target = list.find(t => t.type === 'page');
    if (target) break;
  } catch {}
}
if (!target) { console.error('chrome never came up'); await quit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const waiters = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method && waiters.has(m.method)) { waiters.get(m.method)(m.params); waiters.delete(m.method); }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});
const once = (method, ms) => Promise.race([
  new Promise(res => waiters.set(method, res)),
  sleep(ms).then(() => null),
]);
// A reference we cannot read still has to render, so this returns null on a
// throw rather than failing the capture the way capture-range.mjs does.
const evaluate = async expression => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails || r.error) return null;
  return r.result?.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });

// A page built by this skill only exposes its frame hook under ?capture=1, and
// a foreign page ignores the parameter, so it always goes on.
const url = `${URL_IN}${URL_IN.includes('?') ? '&' : '?'}capture=1&w=${WIDTH}`;
await send('Page.navigate', { url });
await once('Page.loadEventFired', 15000);

let total = 0;
for (let i = 0; i < 20; i++) {
  total = (await evaluate('window.__frames || 0')) || 0;
  if (total) break;
  await sleep(300);
}
const ours = total > 0 && (await evaluate('typeof window.__render === "function"')) === true;
const want = Math.min(ours ? total : Infinity, Math.round(SECONDS * FPS));

const shoot = async f => {
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, optimizeForSpeed: true });
  const data = shot.result?.data;
  if (!data) return false;
  writeFileSync(join(FRAMES, `${String(f).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
  return true;
};

let shot = 0;
if (ours) {
  console.log(`page exposes __render, ${total} frames. stepping ${want} of them at ${WIDTH}x${HEIGHT}`);
  for (let f = 0; f < want; f++) {
    await evaluate(`window.__render(${f})`);
    await evaluate('window.__refStep && window.__refStep()');
    if (!await shoot(f)) break;
    shot++;
    if (f % 50 === 0) process.stdout.write(`  ${f}/${want}\n`);
  }
} else {
  // A foreign page runs on its own clock. Virtual time advances that clock in
  // 40 ms steps without waiting 40 ms, so the sampling is even and a slow
  // machine cannot stretch it. Real sleeps are the fallback.
  console.log(`no __render hook, sampling on its own clock for ${SECONDS}s at ${FPS} fps`);
  const virt = await send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: 1 });
  const useVirtual = !virt.error;
  for (let f = 0; f < want; f++) {
    if (useVirtual) {
      await send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: 1000 / FPS });
      await once('Emulation.virtualTimeBudgetExpired', 2000);
    } else {
      await sleep(1000 / FPS);
    }
    await evaluate('window.__refStep && window.__refStep()');
    if (!await shoot(f)) break;
    shot++;
    if (f % 50 === 0) process.stdout.write(`  ${f}/${want}\n`);
  }
}

const T = (await evaluate('JSON.stringify(window.__ref || {})')) || '{}';
const ref = JSON.parse(T);
const dom = (await evaluate(`JSON.stringify({
  imgs: document.querySelectorAll('img').length,
  videos: document.querySelectorAll('video').length,
  svgs: document.querySelectorAll('svg').length,
  canvases: [...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height),
  webgl: [...document.querySelectorAll('canvas')].filter(c => { try { return !!c.getContext('webgl2', {}) || !!c.getContext('webgl', {}); } catch (e) { return false; } }).length,
  fonts: [...new Set([...document.fonts].map(f => f.family))],
  title: document.title,
})`)) || '{}';
ws.close();

if (!shot) { console.error('captured nothing'); await quit(1); }

// Everything downstream already speaks mp4, so hand it one.
const mp4 = join(OUT, 'ref.mp4');
spawn('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(FRAMES, '%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', mp4], { stdio: 'inherit' });
const sheetEvery = Math.max(1, Math.floor(shot / 20));
spawn('ffmpeg', ['-y', '-v', 'error', '-i', join(FRAMES, '%04d.png'),
  '-vf', `select='not(mod(n\\,${sheetEvery}))',scale=340:-1,tile=5x4`, '-frames:v', '1', join(OUT, 'contact.png')],
  { stdio: 'inherit' });

const top = (o, n = 12) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
const steps = ref.steps || [];
const perFrame = steps.map((s, i) => (i ? s.calls - steps[i - 1].calls : s.calls));
const med = a => (a.length ? [...a].sort((x, y) => x - y)[a.length >> 1] : 0);
// Where the cumulative distinct-colour count jumps is where a new scene's
// palette enters, which is the one boundary the pixels alone will not give you.
const newInk = steps.map((s, i) => (i && s.fills > steps[i - 1].fills ? i : -1)).filter(i => i > 0);

const report = {
  page: URL_IN, frames: shot, fps: FPS, size: `${WIDTH}x${HEIGHT}`,
  driven: ours ? `__render hook, ${total} frames total` : 'own clock, sampled',
  dom: JSON.parse(dom),
  raster_draws: ref.raster || 0, decoded_samples: ref.samples || 0,
  palette: { distinct: Object.keys(ref.fill || {}).length + Object.keys(ref.stroke || {}).length,
             fill: top(ref.fill, 24), stroke: top(ref.stroke, 12) },
  type: { fonts: top(ref.font, 12),
          textCalls: ((ref.call || {}).fillText || 0) + ((ref.call || {}).strokeText || 0) },
  moves: { alpha: top(ref.alpha, 8), composite: top(ref.comp, 8), filter: top(ref.filter, 8),
           transform: top(Object.fromEntries(Object.entries(ref.call || {}).filter(([k]) =>
             /^(translate|rotate|scale|transform|setTransform|save|restore|clip)$/.test(k))), 8) },
  marks: top(ref.call, 20),
  kit: { nodes: top(ref.audio, 16), oscillators: top(ref.osc, 8), filters: top(ref.biquad, 8) },
  load: { callsPerSample: med(perFrame), sampleIs: ours ? 'one frame' : 'one 40 ms step of the page clock',
          newInkAtSample: newInk.slice(0, 40) },
};
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const line = (k, v) => console.log(`  ${k.padEnd(16)} ${v}`);
const pairs = a => a.map(([k, n]) => `${k} x${n}`).join('  ');
console.log(`\n${report.dom.title || '(no title)'}  —  ${shot} frames, ${report.driven}`);
console.log('\nis it all code');
line('raster draws', `${report.raster_draws}  (drawImage of a photo, video or bitmap)`);
line('decoded audio', `${report.decoded_samples}  (samples, not synthesis)`);
line('dom', `${report.dom.imgs} img, ${report.dom.videos} video, ${report.dom.svgs} svg, ${report.dom.webgl} webgl`);
line('canvases', (report.dom.canvases || []).join(', ') || 'none');
console.log('\npalette');
line('distinct', report.palette.distinct);
line('fill', pairs(report.palette.fill));
line('stroke', pairs(report.palette.stroke));
console.log('\ntype');
line('text calls', report.type.textCalls || '0  (any letters are drawn as paths, not set as type)');
line('fonts', pairs(report.type.fonts) || '-');
line('loaded', (report.dom.fonts || []).join(', ') || 'system only');
console.log('\nmoves');
line('transform', pairs(report.moves.transform) || 'none');
line('alpha', pairs(report.moves.alpha) || 'opaque');
line('composite', pairs(report.moves.composite) || 'source-over only');
line('filter', pairs(report.moves.filter) || 'none');
console.log('\nmarks');
line('calls', pairs(report.marks));
line('per sample', `${report.load.callsPerSample} median, one sample is ${report.load.sampleIs}`);
console.log('\nkit');
line('nodes', pairs(report.kit.nodes) || 'no web audio');
line('oscillators', pairs(report.kit.oscillators) || '-');
line('filters', pairs(report.kit.filters) || '-');
console.log(`\nwrote ${OUT}/ref.mp4, ${OUT}/contact.png, ${OUT}/report.json and ${shot} frames`);
console.log(`next: python3 lookcheck.py ${OUT}/ref.mp4   and   python3 printcheck.py mine.png ${FRAMES}/0000.png`);
await quit(0);
