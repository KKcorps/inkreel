#!/usr/bin/env python3
"""Write sketches/sketch.html from the film's own kit and sketches/sketch.js, then render each story's still.
  python3 sketch.py      renders every story in sketch.js's STORIES as sketches/<story>.png at 1920x1080
Then run this skill's assets/sketchcheck.py on the stills and the source (reference/sketches.md)."""
import os, pathlib, re, shutil, subprocess, sys, tempfile
here = pathlib.Path(__file__).resolve().parent
sk = here / "sketches"
# code-film's assets: $CODE_FILM (build.sh exports it), else the usual homes, since this folder may be a copy
code = next((pathlib.Path(d) / "assets" for d in [os.environ.get("CODE_FILM", ""), pathlib.Path.home() / ".claude/skills/code-film",
             pathlib.Path.home() / ".codex/skills/code-film", pathlib.Path.home() / ".agents/skills/code-film"] if d and (pathlib.Path(d) / "assets").is_dir()), None)
if not code: sys.exit("code-film is not installed next to lesson-film. install it, or set CODE_FILM")
glyphs = (code / "examples/parcel42-day/pen_glyphs.js").read_text()
src = (sk / "sketch.js").read_text()
stories = re.findall(r"'([^']+)'", re.search(r"const STORIES = \[(.*?)\]", src).group(1))
kit = (here / "film" / "kit.js").read_text().replace("/*PEN_GLYPHS*/", glyphs)
html = ("<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>sketch</title>\n"
        "<style>html,body{margin:0;background:#08173A;overflow:hidden}canvas{display:block}</style>\n"
        "</head><body><canvas id=\"c\"></canvas>\n<script>\n"
        "addEventListener('error', e => { document.title = 'ERR ' + e.message + ' @line ' + e.lineno; });\n"
        + kit + "\n" + src + "\n</script>\n</body></html>\n")
(sk / "sketch.html").write_text(html)
# code-film's CDP capture, because Chrome's own --screenshot can wait forever on a page this heavy
with tempfile.TemporaryDirectory() as out:
    r = subprocess.run(["node", str(code / "capture-range.mjs"), f"file://{sk}/sketch.html", out, "1920", "1080"],
                       capture_output=True, text=True, timeout=300)
    if r.returncode:
        sys.exit(r.stderr.strip() or "capture failed. open sketches/sketch.html?s=A and read the title for ERR")
    for i, s in enumerate(stories):
        shutil.move(f"{out}/{i:04d}.png", sk / f"{s}.png")
        print(f"sketches/{s}.png")
