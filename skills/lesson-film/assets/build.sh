#!/usr/bin/env bash
# Build a lesson film end to end, from inside its folder:
#   bash ~/.claude/skills/lesson-film/assets/build.sh <piece> <out.mp4>
# page (assemble.py) -> gate -> parallel capture -> motion -> seams -> score + duck + fade -> -14 LUFS
# -> encode for YouTube -> loudness -> captions -> contact sheet -> preview under 30 MB -> every check.
# DRAFT=1 captures without the print finish, for a quick look. CHROMES=12 sets the parallel Chromes.
# SHIFTCHECK=0 skips the check that every event is timed from the voice. REUSE=1 keeps a complete frame folder
# that is newer than the page, for a change to the sound alone.
# The folder holds <piece>.lines.json, .cues.json (voice.py + heard.py --write), .voice.wav, .chain.txt,
# .intent.md, .ties.json, .score.py and assemble.py. Every build is a new file.
set -euo pipefail
# the whole body is one block, so bash reads all of it before running any of it. v6 died when this file
# was edited while it ran, because bash reads a plain script line by line as it goes
{
HERE="$(cd "$(dirname "$0")" && pwd)"; PY="$HOME/.cache/lesson-film/venv/bin/python"
# code-film sits next to this skill, so a Codex copy runs Codex's code-film. $CODE_FILM overrides it. exported so the
# piece's own assemble.py uses the same one
CF="${CODE_FILM:-}"; for d in "$HERE/../../code-film" "$HOME/.claude/skills/code-film" "$HOME/.codex/skills/code-film" "$HOME/.agents/skills/code-film"; do [ -z "$CF" ] && [ -d "$d/assets" ] && CF="$(cd "$d" && pwd)"; done
[ -n "$CF" ] || { echo "code-film is not installed next to lesson-film. install it, or set CODE_FILM"; exit 1; }
export CODE_FILM="$CF"; CF="$CF/assets"
# FRAME_W and FRAME_H set the frame. 1080 and 1920 make a vertical Short; the page's kit.js must use the same W and H
FW="${FRAME_W:-1920}"; FH="${FRAME_H:-1080}"; export FRAME_W="$FW" FRAME_H="$FH"
if [ "$FW" -gt "$FH" ]; then TW=320; TH=180; else TW=180; TH=320; fi
PIECE="$1"; OUT="$2"; STEM="${OUT%.mp4}"; FR="${STEM}_frames"
[ -e "$OUT" ] && { echo "$OUT exists. every build is a new file"; exit 1; }
for f in lines.json cues.json voice.wav chain.txt intent.md ties.json score.py; do [ -f "$PIECE.$f" ] || { echo "missing $PIECE.$f"; exit 1; }; done
grep -q heard_lag "$PIECE.cues.json" || echo "   no heard_lag in the cues yet. run heard.py $PIECE --write, or the picture runs ahead of the voice"
echo "== page"; python3 assemble.py
PAGE="$PIECE.html"; [ "${DRAFT:-0}" = 1 ] && { sed 's|const DRAFT = Q.get(.draft.) === .1.;|const DRAFT = true;|' "$PIECE.html" > "$PIECE.draft.html"; PAGE="$PIECE.draft.html"; }
echo "== script"; python3 "$HERE/scriptcheck.py" "$PIECE" || { [ "${DRAFT:-0}" = 1 ] || exit 1; }
echo "== gate"; python3 "$CF/check.py" "$PAGE" "$PIECE.chain.txt"
echo "== frames"
TOTAL=$(python3 -c "import json;print(round(json.load(open('$PIECE.cues.json'))['total']*24))")
HAVE=$(ls "$FR" 2>/dev/null | grep -c '^[0-9]\{4\}\.png$' || true)
# REUSE=1 keeps a complete frame folder newer than the page, for a change to the sound alone
# the page is rebuilt on every run, so reuse is decided by the page's content, stored beside the frames
SUM=$(shasum -a 256 "$PAGE" | cut -d" " -f1)
if [ "${REUSE:-0}" = 1 ] && [ "$HAVE" = "$TOTAL" ] && [ "$(cat "$FR/.page" 2>/dev/null)" = "$SUM" ]; then
  echo "   reusing $HAVE frames in $FR, drawn from this same page"
else
  t0=$(date +%s); bash "$CF/capture-par.sh" "$PAGE" "$FR" "${CHROMES:-10}" "$FW" "$FH"; echo "   $(( $(date +%s) - t0 )) s"
  echo "$SUM" > "$FR/.page"
fi
echo "== motion"
ffmpeg -v error -y -i "$FR/%04d.png" -vf "scale=160:90,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$STEM.motion.txt" -f null -
FAILED=""
echo "== blank frames"
# a flat black or flat single-colour frame before the fade is a defect. a reversed fade once blacked out a
# whole film, and the seam, look and intent checks all passed it
python3 - "$FR" "$PIECE.cues.json" <<'PY' || FAILED="$FAILED blank"
import json, sys, glob
from PIL import Image, ImageStat
fr, cues = sys.argv[1], json.load(open(sys.argv[2]))
total = round(cues["total"] * 24); fade0 = min(round(cues["hit"] * 24) + 96, total - 36)
bad = []
for f in range(0, fade0, 12):
    st = ImageStat.Stat(Image.open(f"{fr}/{f:04d}.png").convert("L").resize((192, 108)))
    if st.stddev[0] < 3: bad.append(f)
print(f"   {len(bad)} flat frames of {len(range(0, fade0, 12))} sampled before the fade" + (f": {bad[:8]}" if bad else ""))
sys.exit(1 if bad else 0)
PY
echo "== seams"; python3 "$CF/seamcheck.py" "$PAGE" "$FR" || FAILED="$FAILED seams"
echo "== score"; "$PY" "$PIECE.score.py" "$PIECE"
echo "== master to -14 LUFS, true peak -1.5"
M=$(ffmpeg -hide_banner -i "$PIECE.mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read I TP LRA TH OFF <<< "$(echo "$M" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["input_i"],d["input_tp"],d["input_lra"],d["input_thresh"],d["target_offset"])')"
ffmpeg -v error -y -i "$PIECE.mix.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 "$STEM.master.wav"
echo "== encode (H.264 High, 4:2:0, BT.709, closed GOP of half the frame rate, AAC 48 kHz 384k)"
ffmpeg -v error -y -framerate 24 -i "$FR/%04d.png" -i "$STEM.master.wav" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow -g 12 -keyint_min 12 -sc_threshold 0 -flags +cgop \
  -vf "scale=out_color_matrix=bt709" -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 384k -ar 48000 -movflags +faststart -shortest "$OUT"
[ -s "$OUT" ] || { echo "encode produced an empty file"; exit 1; }
ls -la "$OUT"
echo "== loudness"; ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p' | grep -E " I:| Peak:"
echo "== captions"; python3 "$HERE/captions.py" "$PIECE" > "$STEM.srt"; echo "   $(grep -c -- '-->' "$STEM.srt") cues in $STEM.srt"
echo "== contact"
# one frame every 1.5 s, or every 0.5 s under 30 s, on a grid sized to the film. a fixed 8 by 9 grid left a 10 s film as 7 tiles on a black sheet
STEP=$([ "$TOTAL" -lt 720 ] && echo 12 || echo 36); NT=$(( (TOTAL + STEP - 1) / STEP ))
COLS=$(python3 -c "import math;print(min(8, math.ceil(math.sqrt($NT))))"); ROWS=$(( (NT + COLS - 1) / COLS ))
ffmpeg -v error -y -i "$FR/%04d.png" -vf "select='not(mod(n\,$STEP))',scale=${TW}:${TH},tile=${COLS}x${ROWS}" -frames:v 1 "$STEM.contact.jpg"; echo "   $STEM.contact.jpg, one frame every $(python3 -c "print($STEP / 24)") s"
echo "== preview under 30 MB, to send in chat"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"); VB=$(python3 -c "print(max(800, int(27*8*1024/ $DUR - 170)))")
ffmpeg -v error -y -i "$OUT" -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -b:v ${VB}k -maxrate $((VB * 11 / 10))k -bufsize $((VB * 2))k -c:a aac -b:a 160k -movflags +faststart "$STEM-preview.mp4"
ls -la "$STEM-preview.mp4"
echo "== soundcheck"; python3 "$CF/soundcheck.py" "$OUT" || true
echo "== lookcheck"; python3 "$CF/lookcheck.py" "$OUT" || true
echo "== verify against the intent"; python3 "$CF/verify.py" "$OUT" "$PIECE.intent.md" || FAILED="$FAILED intent"
echo "== heard"; "$PY" "$HERE/heard.py" "$PIECE" 2>/dev/null | tail -4
echo "== drawn on the word"; python3 "$HERE/wordsync.py" "$PIECE" "$STEM.motion.txt" || FAILED="$FAILED words"
if [ "${SHIFTCHECK:-1}" = 1 ]; then echo "== timed from the voice (about 3 minutes. SHIFTCHECK=0 skips it)"; python3 "$HERE/shiftcheck.py" "$PIECE.html" 2 || FAILED="$FAILED shift"; fi
if [ -n "$FAILED" ]; then echo "BLOCKs or misses in$FAILED. $OUT is built but not finished"; [ "${DRAFT:-0}" = 1 ] || exit 1; fi
echo; echo "== now watch it once, whole, with sound, and read the script aloud once without it."
exit 0
}
