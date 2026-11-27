#!/usr/bin/env bash
# Scaffold a new short from the latest finished one.  usage: scripts/new-video.sh <slug> <Component> [template=cherami]
set -euo pipefail
cd /home/claude/shorts
slug=$1; comp=$2; tpl=${3:-simon}; Tpl=$(ls src/videos/$tpl/*.tsx | xargs -n1 basename | grep -v captions | head -1 | sed 's/.tsx//')
cp -r src/videos/$tpl src/videos/$slug
mv src/videos/$slug/$Tpl.tsx src/videos/$slug/$comp.tsx
U=$(echo $Tpl | tr a-z A-Z); C=$(echo $comp | tr a-z A-Z)
sed -i "s/${Tpl}Short/${comp}Short/g; s/${U}_FRAMES/${C}_FRAMES/g" src/videos/$slug/$comp.tsx
sed "s#videos/$tpl/$Tpl#videos/$slug/$comp#; s/${Tpl}Short/${comp}Short/g; s/${U}_FRAMES/${C}_FRAMES/g" src/entry-$tpl.tsx > src/entry-$slug.tsx
for f in render batch stills; do sed "s/$tpl/$slug/g; s/${Tpl}Short/${comp}Short/g; s/entry-$slug/entry-$slug/" scripts/$tpl-$f.sh > scripts/$slug-$f.sh; chmod +x scripts/$slug-$f.sh; done
mkdir -p out/$slug/final out/$slug/q /home/claude/$slug
cp -r /home/claude/history-animation/voice/tts /home/claude/history-animation/voice/audio /home/claude/$slug/
sed -i "s#/videos/[a-z0-9]*/words.json#/videos/$slug/words.json#" /home/claude/$slug/tts/assemble.py /home/claude/$slug/tts/display.py
sed "s/cherami/$slug/g" /home/claude/history-animation/voice/example_cues.ts > /home/claude/$slug/cues.ts
echo "scaffolded $slug ($comp) from $tpl"
