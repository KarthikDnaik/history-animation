#!/bin/bash
cd /home/claude/shorts
s=$(date +%s)
scripts/emu-render.sh out/emu/final/chunk_$(printf %04d $1).mp4 1.3333333333333333 --frames=$1-$2 > out/emu/final/log_$1.txt 2>&1
echo "chunk $1-$2 done in $(( $(date +%s) - s )) s"; tail -2 out/emu/final/log_$1.txt
