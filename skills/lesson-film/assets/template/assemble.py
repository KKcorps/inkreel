#!/usr/bin/env python3
"""Write <piece>.html: the kit, the core with the voice's cues, every scene file in name order, and the modes.
  python3 assemble.py [piece]      the piece name defaults to the one *.lines.json in this folder"""
import json, os, pathlib, sys
here = pathlib.Path(__file__).resolve().parent
piece = sys.argv[1] if len(sys.argv) > 1 else next(here.glob("*.lines.json")).name[: -len(".lines.json")]
film = here / "film"
# code-film's assets: $CODE_FILM (build.sh exports it), else the usual homes, since this folder may be a copy
code = next((pathlib.Path(d) / "assets" for d in [os.environ.get("CODE_FILM", ""), pathlib.Path.home() / ".claude/skills/code-film",
             pathlib.Path.home() / ".codex/skills/code-film", pathlib.Path.home() / ".agents/skills/code-film"] if d and (pathlib.Path(d) / "assets").is_dir()), None)
if not code: sys.exit("code-film is not installed next to lesson-film. install it, or set CODE_FILM")
glyphs = (code / "examples/parcel42-day/pen_glyphs.js").read_text()
cues = json.loads((here / f"{piece}.cues.json").read_text())
parts = [(film / "kit.js").read_text().replace("/*PEN_GLYPHS*/", glyphs),
         (film / "core.js").read_text().replace("/*CUES*/", json.dumps(cues))]
parts += [p.read_text() for p in sorted((film / "scenes").glob("*.js"))]
parts.append((film / "main.js").read_text())
title = json.loads((here / f"{piece}.lines.json").read_text()).get("title", piece)
html = (f"<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>{title}</title>\n"
        "<style>html,body{margin:0;background:#08173A;overflow:hidden}canvas{display:block}</style>\n"
        "</head><body><canvas id=\"c\"></canvas>\n<script>\n"
        "addEventListener('error', e => { document.title = 'ERR ' + e.message + ' @line ' + e.lineno; });\n"
        + "\n".join(parts) + "\n</script>\n</body></html>\n")
(here / f"{piece}.html").write_text(html)
print(f"{piece}.html", len(html), "bytes")
# a thumbnail page: the same kit, core and scenes, with thumb.js in place of the modes. Screenshot it at
# 1920x1080 and scale to 1280x720 for YouTube
tj = here / "thumb.js"
if tj.exists():
    th = html.replace((film / "main.js").read_text(), tj.read_text())
    (here / "thumb.html").write_text(th)
    print("thumb page written")
