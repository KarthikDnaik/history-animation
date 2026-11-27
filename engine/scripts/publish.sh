#!/usr/bin/env bash
# Publish a finished short so Buffer can fetch it: copy into the public KarthikDnaik/history-animation repo, push,
# and print the raw URL to pass to Buffer create_post (YouTube channel "Nuke In Action").
# usage: scripts/publish.sh <final.mp4> <slug>
set -euo pipefail
src="$1"; slug="$2"; repo=/home/claude/history-animation
[ -d "$repo/.git" ] || git clone --depth 1 https://github.com/KarthikDnaik/history-animation "$repo"
git -C "$repo" pull -q --ff-only || true
mkdir -p "$repo/videos"; cp "$src" "$repo/videos/$slug.mp4"
git -C "$repo" add "videos/$slug.mp4"
git -C "$repo" -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "Add $slug short" || true
git -C "$repo" -c push.negotiate=true push -q origin main
echo "https://raw.githubusercontent.com/KarthikDnaik/history-animation/main/videos/$slug.mp4"
