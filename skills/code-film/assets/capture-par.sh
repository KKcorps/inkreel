#!/usr/bin/env bash
# Capture every frame of a page in N headless Chromes at once, each on its own run of neighbouring
# frames, so each one builds only the backgrounds its scenes use. Frames are named %04d.png.
#   bash capture-par.sh page.html frames_dir [N=8] [W=1920] [H=1080]
# 1541 frames at 1080p took 135 s with 10 Chromes. Each Chrome needs about 1 GB.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PAGE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; OUT="$2"; N="${3:-8}"; WW="${4:-1920}"; HH="${5:-1080}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome || command -v chromium || echo google-chrome)"
TOTAL=$("$CHROME" --headless=new --disable-gpu --window-size=$WW,$HH --dump-dom "file://$PAGE?capture=1&w=300" 2>/dev/null | grep -o "capture ready [0-9]*" | grep -o "[0-9]*$" || true)
[ -n "$TOTAL" ] || { echo "the page never said 'capture ready N'. open file://$PAGE?capture=1 and read the title"; exit 1; }
mkdir -p "$OUT"; rm -f "$OUT"/[0-9][0-9][0-9][0-9].png
per=$(( (TOTAL + N - 1) / N )); pids=()
for ((k=0; k<N; k++)); do
  a=$((k * per)); b=$(( (k + 1) * per )); [ $a -ge $TOTAL ] && break
  node "$HERE/capture-range.mjs" "file://$PAGE" "$OUT" $WW $HH $a $b > "$OUT/.log$k" 2>&1 & pids+=($!)
done
fail=0; for p in "${pids[@]}"; do wait $p || fail=1; done
got=$(ls "$OUT" | grep -c '^[0-9]\{4\}\.png$' || true)
echo "captured $got of $TOTAL frames with ${#pids[@]} chromes"
[ $fail = 0 ] && [ "$got" = "$TOTAL" ] || { tail -3 "$OUT"/.log*; exit 1; }
