#!/usr/bin/env bash
# One-time setup for lesson films. code-film's doctor first, then the voice and hearing venv.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
# code-film sits next to this skill. $CODE_FILM overrides it
CF="${CODE_FILM:-}"; for d in "$HERE/../../code-film" "$HOME/.claude/skills/code-film" "$HOME/.codex/skills/code-film" "$HOME/.agents/skills/code-film"; do [ -z "$CF" ] && [ -d "$d/assets" ] && CF="$(cd "$d" && pwd)"; done
[ -n "$CF" ] || { echo "code-film is not installed next to lesson-film. install it first, or set CODE_FILM"; exit 1; }
bash "$CF/assets/doctor.sh" || { echo "fix code-film's setup first"; exit 1; }
ffmpeg -hide_banner -filters 2>/dev/null | grep loudnorm >/dev/null || { echo "ffmpeg has no loudnorm filter. install a full ffmpeg"; exit 1; }
command -v uv >/dev/null || { echo "install uv: https://docs.astral.sh/uv/"; exit 1; }
V="$HOME/.cache/lesson-film/venv"
[ -x "$V/bin/python" ] || uv venv --python 3.12 "$V"
uv pip install --python "$V/bin/python" kokoro soundfile faster-whisper numpy \
  "en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"
"$V/bin/python" -c "import kokoro, faster_whisper, soundfile, spacy; spacy.load('en_core_web_sm'); print('voice and hearing ready at $V')"
