#!/usr/bin/env bash
# Build a riso piece end to end. Gate, capture, motion, seams, score, encode, soundcheck, lookcheck.
#
#   assets/build.sh piece.html out.mp4 [frames_dir]
#
# Reuses frames_dir when it holds one PNG per frame and is newer than the page,
# and was captured with the same SEED, so a change to the score alone does not recapture.
# It stops if the gate blocks. The seam check and the intent check run after the encode, so
# the MP4 always exists, and the script exits 1 at the end if either failed. The look and
# sound checks only measure. A piece.intent.md next to the page is required.
# The score is the piece's own piece.score.py, else a piece.wav it made, else the skill's
# score.py. An intent card that says "sound: silent" encodes with no audio track.
# ROUGH=1 builds a draft past every BLOCK, so a rough cut can be shown early. Say it is rough.
# SEED=11 by default, override with SEED=7 assets/build.sh ...
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PAGE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT="$2"
STEM="${OUT%.mp4}"
FRAMES="${3:-${STEM}_frames}"
SEED="${SEED:-11}"
mkdir -p "$(dirname "$OUT")"

echo "== gate"
# the film's words as one paragraph, if it has any, so the gate can read them as prose
CHAIN=""; [ -f "${PAGE%.html}.chain.txt" ] && CHAIN="${PAGE%.html}.chain.txt"
if [ "${ROUGH:-0}" = 1 ]; then
  python3 "$HERE/check.py" "$PAGE" $CHAIN || echo "ROUGH=1: the gate has BLOCKs. building a draft anyway"
else
  python3 "$HERE/check.py" "$PAGE" $CHAIN
fi

echo "== frames"
NEED=$(python3 - "$PAGE" <<'PY'
import re, sys
src = "\n".join(l for l in open(sys.argv[1]).read().splitlines() if not l.lstrip().startswith("//"))
m = re.search(r"const BEAT\s*=\s*(\d+)", src)
beat = int(m.group(1)) if m else 16
print(sum(int(b) * beat if b else int(n)
          for _, b, n in re.findall(r"plate\(\s*['\"](\w+)['\"]\s*,\s*(?:beats\((\d+)\)|(\d+))", src)))
PY
)
HAVE=$(ls "$FRAMES" 2>/dev/null | grep -c '\.png$' || true)
# reuse only a complete capture that is newer than the page and used the same
# seed. a count match alone once reused the frames of an older version of the page.
if [ "$NEED" != "0" ] && [ "$HAVE" = "$NEED" ] && [ "$FRAMES/0000.png" -nt "$PAGE" ] \
   && [ "$(cat "$FRAMES/.seed" 2>/dev/null)" = "$SEED" ]; then
  echo "   reusing $HAVE frames in $FRAMES, newer than the page, seed $SEED"
else
  node "$HERE/capture.mjs" "file://$PAGE?s=$SEED" "$FRAMES" 1080
  echo "$SEED" > "$FRAMES/.seed"
fi
FAILED=""

echo "== motion"
ffmpeg -v error -y -i "$FRAMES/%04d.png" \
  -vf "scale=120:120,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$STEM.motion.txt" \
  -f null -

echo "== seams"
# the joins: pops off a cut, jerks inside a move, one frame flashes, an anchor
# off the centre. needs the page's ?cuts=1 mode, which engine.html has.
python3 "$HERE/seamcheck.py" "$PAGE" "$FRAMES" || FAILED="$FAILED seams"

CARD="${PAGE%.html}.intent.md"
SILENT=0; [ -f "$CARD" ] && grep -qiE "^[[:space:]]*sound:[[:space:]]*silent" "$CARD" && SILENT=1

echo "== score"
# the piece's own score.py, else a WAV the piece made itself, else the skill's score
if [ "$SILENT" = 1 ]; then
  echo "   the intent card says silent. no score"
elif [ -f "${PAGE%.html}.score.py" ]; then
  echo "   ${PAGE%.html}.score.py"
  python3 "${PAGE%.html}.score.py" "$PAGE" "$STEM.wav" "$STEM.motion.txt"
elif [ -f "${PAGE%.html}.wav" ]; then
  echo "   ${PAGE%.html}.wav"
  cp "${PAGE%.html}.wav" "$STEM.wav"
else
  echo "   $HERE/score.py"
  python3 "$HERE/score.py" "$PAGE" "$STEM.wav" "$STEM.motion.txt"
fi

echo "== encode"
FPS=$(grep -oE "const FPS[[:space:]]*=[[:space:]]*[0-9]+" "$PAGE" | grep -oE "[0-9]+$" || true); FPS="${FPS:-24}"
echo "   $FPS fps"
if [ "$SILENT" = 1 ]; then
  ffmpeg -v error -y -framerate "$FPS" -i "$FRAMES/%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium "$OUT"
else
  ffmpeg -v error -y -framerate "$FPS" -i "$FRAMES/%04d.png" -i "$STEM.wav" \
    -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -c:a aac -b:a 160k -shortest "$OUT"
fi
[ -s "$OUT" ] || { echo "encode produced an empty file"; exit 1; }
ls -la "$OUT"

echo "== soundcheck"
python3 "$HERE/soundcheck.py" "$OUT" || FAILED="$FAILED sound"

echo "== lookcheck"
python3 "$HERE/lookcheck.py" "$OUT" || FAILED="$FAILED look"

echo "== verify against the intent"
if [ -f "$CARD" ]; then
  python3 "$HERE/verify.py" "$OUT" "$CARD" || FAILED="$FAILED intent"
else
  echo "   no intent card at $CARD. copy assets/intent.md"
  FAILED="$FAILED intent"
fi

if [ -n "$FAILED" ]; then
  if [ "${ROUGH:-0}" = 1 ]; then
    echo "ROUGH=1: BLOCKs in$FAILED. $OUT is a draft"
  else
    echo "BLOCKs in$FAILED. $OUT is built but not finished"
    exit 1
  fi
fi

echo
echo "== now watch and listen to $OUT once, whole."
echo "   the numbers cannot hear a beat that breaks or a run that starts before the rows land."
