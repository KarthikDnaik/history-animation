#!/usr/bin/env python3
"""Weekly long-form (5-6 min): join the week's Shorts into one 16:9 episode.
usage: compile-weekly.py <out.mp4> <since YYYY-MM-DD> [until YYYY-MM-DD]
Reads /home/claude/history-animation/videos/manifest.json ([{slug, file, title, date}]); each vertical short is placed
centred on 1920x1080 over a blurred, darkened copy of itself, preceded by a 2.5 s title card "STORY n · <title>".
An intro card opens the episode. Audio is loudness-normalised to -14 LUFS."""
import json, subprocess, sys, os, tempfile
R = "/home/claude/history-animation"
out, since = sys.argv[1], sys.argv[2]; until = sys.argv[3] if len(sys.argv) > 3 else "9999-12-31"
items = [m for m in json.load(open(f"{R}/videos/manifest.json")) if since <= m["date"] <= until]
items.sort(key=lambda m: m["date"]); assert items, "no shorts in range"
# keep the episode at 5-6 minutes: newest-first until ~345 s of stories (+ cards), then back in date order
def dur(f): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
keep, tot = [], 0.0
for m in reversed(items):
    d = dur(f"{R}/videos/{m['file']}") + 2.5
    if keep and tot + d > 345: continue
    keep.append(m); tot += d
items = sorted(keep, key=lambda m: m["date"])
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
tmp = tempfile.mkdtemp(); parts = []
def esc(s): return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,")
def card(path, big, small, dur):
    vf = (f"drawtext=fontfile={FONT}:text='{esc(big)}':fontcolor=0xffd23a:fontsize=92:x=(w-tw)/2:y=(h-th)/2-50,"
          f"drawtext=fontfile={FONT}:text='{esc(small)}':fontcolor=white:fontsize=50:x=(w-tw)/2:y=(h-th)/2+70")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x101418:s=1920x1080:d={dur}:r=30",
                    "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-t", str(dur), "-vf", vf,
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", path], check=True)
card(f"{tmp}/00_intro.mp4", "HISTORY THAT SOUNDS FAKE", f"{len(items)} true stories · Nuke In Action", 3.5); parts.append(f"{tmp}/00_intro.mp4")
for i, m in enumerate(items, 1):
    c = f"{tmp}/{i:02d}_card.mp4"; card(c, f"STORY {i}", m["title"], 2.5); parts.append(c)
    v = f"{tmp}/{i:02d}_v.mp4"
    fc = ("[0:v]scale=192:108:force_original_aspect_ratio=increase,crop=192:108,boxblur=6:2,eq=brightness=-0.25,scale=1920:1080[bg];"
          "[0:v]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0,fps=30,format=yuv420p[v];[0:a]aresample=48000,aformat=channel_layouts=stereo[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{R}/videos/{m['file']}", "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-c:a", "aac", "-b:a", "192k", v], check=True); parts.append(v)
lst = f"{tmp}/list.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
print(out, "stories:", [m["title"] for m in items])
