#!/bin/bash
cd /home/claude/shorts && BRIDGE_ENTRY=src/entry-pig.tsx COMP=PigShort GL=angle-egl REMOTION_TMP=/home/claude/remotion-tmp node scripts/bridge-stills.mjs "$1" "$2" "${3:-0.5}" 2>&1 | grep -v "memory\|Memory\|docker\|Clock\|PCFSoft"
