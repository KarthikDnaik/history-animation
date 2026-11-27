#!/usr/bin/env bash
# One-time setup for a fresh session (scheduled daily run). Idempotent. ~15-30 min on first run.
# Layout after setup:  /home/claude/shorts -> engine (Remotion + three.js short engine)
#                      /home/claude/qwenenv (Python venv: Qwen3-TTS, faster-whisper, torchaudio, librosa)
set -euo pipefail
R=/home/claude/history-animation
[ -e /home/claude/shorts ] || ln -s $R/engine /home/claude/shorts
cp -n $R/engine/scripts/sheet.py /home/claude/sheet.py || true
mkdir -p /home/claude/remotion-tmp
cd $R/engine && [ -d node_modules ] || npm ci --no-audit --no-fund
if [ ! -x /home/claude/qwenenv/bin/python ]; then
  python3 -m venv /home/claude/qwenenv
  /home/claude/qwenenv/bin/pip install -q --upgrade pip
  /home/claude/qwenenv/bin/pip install -q torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
  /home/claude/qwenenv/bin/pip install -q qwen-tts==0.1.1 transformers==4.57.3 accelerate==1.12.0 faster-whisper==1.2.1 librosa soundfile scipy numpy
fi
python3 -c "import scipy, numpy" 2>/dev/null || pip install -q --break-system-packages scipy numpy
which ffmpeg >/dev/null && test -x /usr/bin/google-chrome && echo "setup ok"
