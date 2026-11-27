#!/bin/bash
cd /home/claude/shorts
for rng in "$@"; do
  a=${rng%-*}; b=${rng#*-}; f=out/pig2d/final/chunk_$(printf %04d $a).mp4
  for try in 1 2; do
    [ -s "$f" ] && break
    s=$(date +%s); scripts/pig2d-render.sh "$f" 1 --frames=$a-$b > out/pig2d/final/log_$a.txt 2>&1
    echo "chunk $a-$b try $try: $(( $(date +%s) - s )) s, $( [ -s "$f" ] && echo ok || echo FAILED )"
  done
done
