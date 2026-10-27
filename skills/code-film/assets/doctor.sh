#!/usr/bin/env bash
# Is this laptop ready to build a film? Run it once on a new machine.
#   bash assets/doctor.sh
# Checks Chrome (or $CHROME), Node 22 or later (capture.mjs needs its built-in
# WebSocket), ffmpeg and ffprobe, and Python 3 with numpy and Pillow. Exits 1 if
# anything is missing, and says how to fix it.
bad=0
ok() { printf "  ok    %s\n" "$1"; }
no() { printf "  MISS  %s\n        %s\n" "$1" "$2"; bad=1; }

chrome="${CHROME:-}"
if [ -z "$chrome" ]; then
  for p in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    [ -x "$p" ] && chrome="$p" && break
  done
  [ -z "$chrome" ] && chrome="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)"
fi
if [ -n "$chrome" ] && "$chrome" --version >/dev/null 2>&1; then ok "chrome: $("$chrome" --version)"; else no "chrome" "install Google Chrome, or set CHROME=/path/to/chrome"; fi

if command -v node >/dev/null; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -ge 22 ]; then ok "node $(node --version)"; else no "node $(node --version)" "capture.mjs needs Node 22 or later for its built-in WebSocket"; fi
else no "node" "install Node 22 or later"; fi

for t in ffmpeg ffprobe; do
  if command -v "$t" >/dev/null; then ok "$t"; else no "$t" "install ffmpeg (brew install ffmpeg, or apt install ffmpeg)"; fi
done

if command -v python3 >/dev/null; then
  ok "python3 $(python3 --version 2>&1 | cut -d' ' -f2)"
  for m in numpy PIL; do
    if python3 -c "import $m" 2>/dev/null; then ok "python module $m"; else no "python module $m" "pip install numpy pillow"; fi
  done
else no "python3" "install Python 3"; fi

[ "$bad" = 0 ] && echo "ready" || echo "fix the MISS lines, then run this again"
exit $bad
