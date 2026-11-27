#!/bin/bash
# render frames $1-$2 of the final at 1440x2560 into out/tipu/final/chunk_$1.mp4
cd /home/claude/shorts
s=$(date +%s)
scripts/tipu-render.sh out/tipu/final/chunk_$(printf %04d $1).mp4 1.3333333333333333 --frames=$1-$2 > out/tipu/final/log_$1.txt 2>&1
echo "chunk $1-$2 done in $(( $(date +%s) - s )) s"; tail -2 out/tipu/final/log_$1.txt
