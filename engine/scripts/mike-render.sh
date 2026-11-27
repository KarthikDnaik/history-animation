#!/bin/bash
# usage: scripts/tipu-render.sh <out.mp4> <scale> [extra remotion args]
cd /home/claude/shorts
export TEMP=/home/claude/remotion-tmp TMP=/home/claude/remotion-tmp
npx remotion render src/entry-mike.tsx MikeShort "$1" --codec h264 --crf 16 --scale "$2" --gl=angle-egl --browser-executable=/usr/bin/google-chrome --concurrency=2 --timeout=300000 "${@:3}" 2>&1 | grep -E "Rendered [0-9]+0/|Encoded|error|Error" | tail -40
