#!/usr/bin/env python3
"""Write lesson60.html: the kit, the core with the voice's cues, every scene file in order, and the modes."""
import json, os, pathlib, sys
here = pathlib.Path(__file__).resolve().parent
film = here / "film"
# code-film's assets: $CODE_FILM (build.sh exports it), else next to this skill, else the usual homes
code = next((pathlib.Path(d) / "assets" for d in [os.environ.get("CODE_FILM", ""), here.parents[2] / "code-film",
             pathlib.Path.home() / ".claude/skills/code-film", pathlib.Path.home() / ".codex/skills/code-film", pathlib.Path.home() / ".agents/skills/code-film"]
             if d and (pathlib.Path(d) / "assets").is_dir()), None)
if not code: sys.exit("code-film is not installed next to lesson-film. install it, or set CODE_FILM")
glyphs = (code / "examples/parcel42-day/pen_glyphs.js").read_text()
cues = json.loads((here / "lesson60.cues.json").read_text())
parts = [(film / "kit.js").read_text().replace("/*PEN_GLYPHS*/", glyphs),
         (film / "core.js").read_text().replace("/*CUES*/", json.dumps(cues))]
parts += [p.read_text() for p in sorted((film / "scenes").glob("*.js"))]
parts.append((film / "main.js").read_text())
html = ("<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>parcel 42, the switch</title>\n"
        "<style>html,body{margin:0;background:#001E43;overflow:hidden}canvas{display:block}</style>\n"
        "</head><body><canvas id=\"c\"></canvas>\n<script>\n"
        "addEventListener('error', e => { document.title = 'ERR ' + e.message + ' @line ' + e.lineno; });\n"
        + "\n".join(parts) + "\n</script>\n</body></html>\n")
(here / "lesson60.html").write_text(html)
print("lesson60.html", len(html), "bytes")
# a thumbnail page: the same kit, core and scenes, with thumb.js in place of the modes. Screenshot it at
# 1920x1080 and scale to 1280x720 for YouTube
tj = here / "thumb.js"
if tj.exists():
    th = html.replace((film / "main.js").read_text(), tj.read_text())
    (here / "thumb.html").write_text(th)
    print("thumb page written")
