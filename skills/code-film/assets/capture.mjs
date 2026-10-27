// Render every frame of a riso page to PNG, driving one headless Chrome over
// CDP. Launching Chrome per frame would take twenty minutes; this takes one.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const [, , pageUrl, outDir, sizeArg] = process.argv;
const SIZE = +(sizeArg || 480);
// a port and a profile of our own, so a leftover or parallel Chrome is never the one captured
const PORT = 9333 + (process.pid % 600);
const PROFILE = mkdtempSync(join(tmpdir(), 'riso-capture-'));
// $CHROME if set, else the usual macOS and Linux locations
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => existsSync(p)) || 'google-chrome';

// clear only the frames this script writes, never the folder itself
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) if (/^\d{4}\.png$/.test(f)) rmSync(join(outDir, f));

const url = `${pageUrl}${pageUrl.includes('?') ? '&' : '?'}capture=1&w=${SIZE}`;
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--window-size=${SIZE},${SIZE}`,
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  url,
], { stdio: 'ignore' });

let target;
for (let i = 0; i < 60; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    target = list.find(t => t.type === 'page' && t.url.includes('capture=1'));
    if (target) break;
  } catch {}
}
// wait for Chrome to exit before removing its profile, or it is still writing
// into it. a profile left behind in the temp folder never fails the capture
const quit = async code => {
  const gone = new Promise(r => chrome.once('exit', r));
  chrome.kill();
  await Promise.race([gone, sleep(5000)]);
  try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3 }); } catch {}
  process.exit(code);
};
if (!target) { console.error('chrome never came up'); await quit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});
// a frame that throws must fail the capture. Ignoring it saves the last good
// frame again under the new number, and nothing downstream can tell.
const evaluate = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true });
  const ex = r.result?.exceptionDetails;
  if (ex || r.error) throw new Error(`${expr}: ${ex?.exception?.description || ex?.text || r.error?.message}`);
  return r.result?.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
// A headless window is NOT the viewport. --window-size=1080,1080 gives a 1080x993
// viewport, the canvas is clipped, and h264 then refuses the odd height. Pin the
// viewport instead of trusting the window.
await send('Emulation.setDeviceMetricsOverride', {
  width: SIZE, height: SIZE, deviceScaleFactor: 1, mobile: false,
});

// the page renders synchronously on load, so wait for the hook rather than a timer
let total = 0;
for (let i = 0; i < 120; i++) {
  total = await evaluate('window.__frames || 0');
  if (total) break;
  await sleep(500);
}
if (!total) { console.error('page never exposed __frames'); await quit(1); }
console.log(`capturing ${total} frames at ${SIZE}px`);

const t0 = Date.now();
try {
  for (let f = 0; f < total; f++) {
    await evaluate(`window.__render(${f})`);
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const data = shot.result?.data;
    if (!data) throw new Error(`no image for frame ${f}`);
    writeFileSync(`${outDir}/${String(f).padStart(4, '0')}.png`, Buffer.from(data, 'base64'));
    if (f % 50 === 0) process.stdout.write(`  ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  }
} catch (e) {
  console.error(`capture failed: ${e.message}`);
  ws.close();
  await quit(1);
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
ws.close();
await quit(0);
