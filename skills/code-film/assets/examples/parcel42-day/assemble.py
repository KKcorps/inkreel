#!/usr/bin/env python3
"""Build film.html from the skill's engine, the ledger module, the core and the scenes.
  The engine is copied and edited as text, the way every piece starts from it.
  python3 assemble.py           writes film.html next to this file"""
import pathlib, re
here = pathlib.Path(__file__).resolve().parent
eng = (here.parents[1] / "engine.html").read_text()   # the skill's own engine, two folders up
glyphs = (here / "pen_glyphs.js").read_text()
ledger = (here / "ledger.js").read_text().replace("/*PEN_GLYPHS*/", glyphs)
core = (here / "film_core.js").read_text()
scenes = "\n".join(p.read_text() for p in sorted((here / "scenes").glob("*.js")))
acts = (here / "acts.js").read_text()

def rep(s, a, b, count=1):
    assert s.count(a) >= 1, a[:80]
    return s.replace(a, b, count)

s = eng
s = rep(s, "const FPS = 18;", "const FPS = 24;")
s = re.sub(r"const ANCHOR_INKS = \[[^\]]*\];", "const ANCHOR_INKS = ['#B8864B', '#002654'];", s, count=1)
i = s.index("function freshWorld() {"); j = s.index("// ---- things the demo worlds draw")
s = s[:i] + "function freshWorld() { return { frame: -1 }; }\nfunction stepWorld(W, f) { W.frame = f; }\nfunction worldAt(f) { return { frame: f }; }\n\n" + s[j:]
i = s.index("// ---- things the demo worlds draw"); j = s.index("// ================= the acts")
s = s[:i] + "function drawRipples() {}\n\n" + ledger + "\n" + core + "\n" + scenes + "\n" + s[j:]
i = s.index("// ================= the acts"); j = s.index("// ---- timeline -------")
s = s[:i] + acts + "\n" + s[j:]
# the film's own clock for the ledger, right after the timeline is known
s = rep(s, "function frameAt(frame) {", "const filmAt = (name, b) => { const a = SCENES.find(x => x.name === name); return a.start + Math.round(b * BEAT); };\nLEDGER.init(filmAt, []);\nfor (const sh of LEDGER.shots()) { if (sh.kind === 'cut') EXTRA_CUTS.push(sh.f); else EXTRA_MOVES.push([sh.f, sh.f + sh.dur]); }\nfunction frameAt(frame) {")
# postcards: one print of each lived moment, made once at load
s = rep(s, "const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');",
"""// each lived moment printed once, small, for the album on the ledger's left page
function makeCards() {
  const list = [['placed', 3], ['packed', 3], ['shipped', 3], ['late', 4.5], ['delivered', 3]];
  return list.map(([n, b]) => { pull(filmAt(n, b), { overlays: false }); const c = document.createElement('canvas'); c.width = 356; c.height = 198; c.getContext('2d').drawImage(SHEET, 0, W * .22, W, W * .556, 0, 0, 356, 198); return c; });
}
if (Q.get('cuts') !== '1') LEDGER.setCards(makeCards());
const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');""")
s = re.sub(r"<title>[^<]*</title>", "<title>parcel 42</title>", s, count=1)
(here / "film.html").write_text(s)
print("film.html", len(s), "bytes")
