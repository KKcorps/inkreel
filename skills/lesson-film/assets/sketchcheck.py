#!/usr/bin/env python3
"""  python3 sketchcheck.py sketches/A.png sketches/B.png sketches/C.png --src sketches/sketch.js [--allow NAME]
                                                                  exits 1 while any BLOCK stands

code-film's assets/sketchcheck.py, which owns every check, run with this skill's settings: the approved frames
to compare against (the example's sketches and the judging sheet's), the example's town as the world a new lesson
must not use (reference/traps.md, Story), and the template's SKETCH_STUB."""
import os, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
WORLD = ["parcel", "house", "kid", "telescope", "snail", "stillTown", "stillPost", "postOffice", "newStreet",
         "switchBoard", "windowView", "addressBook", "pigeonholes", "stillAisle", "stillDesk"]
# code-film's assets: $CODE_FILM, else next to this skill, else the usual homes
code = next((pathlib.Path(d) / "assets" for d in [os.environ.get("CODE_FILM", ""), root.parent / "code-film",
             pathlib.Path.home() / ".claude/skills/code-film", pathlib.Path.home() / ".codex/skills/code-film", pathlib.Path.home() / ".agents/skills/code-film"]
             if d and (pathlib.Path(d) / "assets" / "sketchcheck.py").is_file()), None)
if not code: sys.exit("code-film is not installed next to lesson-film. install it, or set CODE_FILM")
sys.exit(subprocess.run([sys.executable, str(code / "sketchcheck.py"), *sys.argv[1:],
                         "--refs", str(root / "examples/parcel42-lesson/sketches"), "--refs", str(root / "reference/stills/bar"),
                         "--world", ",".join(WORLD), "--marker", "SKETCH_STUB"]).returncode)
