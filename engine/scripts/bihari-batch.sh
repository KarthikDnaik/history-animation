#!/bin/bash
# render chunks "a-b a-b ..." sequentially, retry each once on failure
cd /home/claude/shorts
for rng in "$@"; do
  a=${rng%-*}; b=${rng#*-}; f=out/bihari/final/chunk_$(printf %04d $a).mp4
  for try in 1 2; do
    [ -s "$f" ] && break
    s=$(date +%s); scripts/bihari-render.sh "$f" 1 --frames=$a-$b > out/bihari/final/log_$a.txt 2>&1
    echo "chunk $a-$b try $try: $(( $(date +%s) - s )) s, $( [ -s "$f" ] && echo ok || echo FAILED )"
  done
done
