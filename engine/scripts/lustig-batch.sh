#!/bin/bash
# render chunks "a-b a-b ..." sequentially, retry each once on failure
cd /home/claude/shorts
for rng in "$@"; do
  a=${rng%-*}; b=${rng#*-}; f=out/lustig/final/chunk_$(printf %04d $a).mp4
  for try in 1 2; do
    [ -s "$f" ] && break
    s=$(date +%s); rm -f "${f%.mp4}.tmp.mp4"; scripts/lustig-render.sh "${f%.mp4}.tmp.mp4" 1 --frames=$a-$b > out/lustig/final/log_$a.txt 2>&1 && [ -s "${f%.mp4}.tmp.mp4" ] && mv "${f%.mp4}.tmp.mp4" "$f"
    echo "chunk $a-$b try $try: $(( $(date +%s) - s )) s, $( [ -s "$f" ] && echo ok || echo FAILED )"
  done
done
