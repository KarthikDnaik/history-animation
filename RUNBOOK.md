# Nuke In Action — daily pipeline runbook

This repo lets a fresh, unattended session make and post the channel's videos with no help from Karthik.
Read all of this before starting. Karthik does not supply anything manual and does not want to be asked for permission.

- **Daily 7 pm (IST) Short** — one new ~45–65 s animated true-history Short, posted to YouTube via Buffer at **19:00 IST**.
- **Weekly long-form (Sunday 11 am IST)** — a 5–6 minute 16:9 compilation of that week's Shorts, posted at **11:00 IST**.

Buffer: organisation `6b056e5720c50a222653dd91` ("My organization"), YouTube channel **Nuke In Action**
`6b056f098541f09ecb880bf8`. Videos reach Buffer as raw GitHub URLs from this repo (`videos/`).

---

## 0. Setup (every run, ~15–30 min the first time)

```bash
git clone --depth 1 https://github.com/KarthikDnaik/history-animation /home/claude/history-animation   # if not present
bash /home/claude/history-animation/setup.sh
```
`/home/claude/shorts` becomes a symlink to `engine/`, `/home/claude/qwenenv` is the TTS/whisper venv. The first TTS run
downloads `Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice` and whisper `small.en` from Hugging Face.

## 1. Daily Short (start of the run → posted at 19:00 IST)

### 1.1 Topic
- Niche: **"History that sounds fake"**, true stories with humour + curiosity. Animal-history stories perform best
  (army dog, headless chicken, soldier bear, pigeon, ship's cat). Specific titles beat vague ones.
- **Never repeat a topic** in `topics-done.md`. Pick one, fact-check it with web search (2+ reliable sources), then add it
  to `topics-done.md` in the same commit as the video.
- Title: take it from the **most-viewed existing videos/articles on the topic** (search YouTube/web), never invent.

### 1.2 Script + voice
- 12–15 short lines, 45–65 s, English. Line 0 is the hook (curiosity gap + emotion in the first second); last line is the
  CTA "Send this to …" which loops back to the hook frame. One "makes you feel smart" fact people forward.
- Voice: Qwen3-TTS, speaker **Aiden**, **smooth, warm, relaxed, subtle** — every instruct starts with
  `Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps`
  plus a short tone word. No "breathless/urgent/hushed/voice cracking" directions, no "..." in the text (they make the
  voice sound out of breath — Karthik said the old voice "was like a man talking with asthma"). `TEMPO=1.0`, KEEP = all.
```bash
bash /home/claude/shorts/scripts/new-video.sh <slug> <Component> simon     # scaffolds code + /home/claude/<slug>/{tts,audio}
cd /home/claude/<slug>/tts   # edit S = [...] in qperform.py (line, instruct, text, pause); NUM maps in qperform/assemble
/home/claude/qwenenv/bin/python qperform.py 2 > gen.log 2>&1              # 2 takes per phrase, logs match + pesq
# write words_canon.json (the script's words with line numbers, see simon), pick takes in ovr.json {"phrase": take}
TEMPO=1.0 /home/claude/qwenenv/bin/python assemble.py                       # -> vo.wav + engine words.json
ffmpeg -y -i vo.wav -ar 48000 -ac 1 ../audio/voice48.wav
```

### 1.3 Look (all learned rules — see `rules/direction-rules.md`)
- **Blocky brick-game style** (since 27 Nov 2026): characters are 3D block avatars from `engine/src/videos/simon/rbx.ts`
  (`Avatar`, `Cat`, `Rat`; add new animals the same way), studded baseplate textures, plastic colours. No game logos.
- Detailed, large-production sets with depth; one key still per shot; camera moves only on story events; numbers and
  words on objects in the scene; text-behind-subject for the name; a diagram that builds with the words; a clone/grid
  shot; handwriting when the line mentions writing; two-size captions; whip/spin/glitch transitions; impact card;
  persistent header line; CTA pill; perfect loop (last frame = first frame). No background music, no background voices.

Files per video in `engine/src/videos/<slug>/`: `story.ts` (DEF shot list), `sets.ts` (BUILD sets, ACT3 3D action per
shot, STAGE 2D cards), `cams.ts` (keys per shot), `edit.ts` (WHIP/SPIN/GLITCH, IMPACT, MOOD), `captions.tsx` (RED/YEL),
`<Component>.tsx` (header + pill), `world.ts` (INDOOR sets).

### 1.4 Sound — **quiet effects**
`/home/claude/<slug>/audio/<slug>_sound.py` (copy `voice/audio/example_sound.py` structure; simon's is the model).
The mix keeps effects at **voice − 17 LU** with −7 dB ducking under speech (Karthik: "don't cover the video with high
volume sfx and background sound"). Expect `sfx ≈ −36 LUFS` in the printout. No music, no crowd voices.
```bash
cd /home/claude/shorts && npx tsx /home/claude/<slug>/cues.ts
cd /home/claude/<slug>/audio && python3 <slug>_sound.py voice48.wav          # -> mix.wav at -14 LUFS
```

### 1.5 QA, render, assemble
```bash
cd /home/claude/shorts
scripts/<slug>-stills.sh out/<slug>/q/a "0,120,..." 0.5 && python3 /home/claude/sheet.py out/<slug>/q/a "0,120,..." out/<slug>/q/sheet.jpg
# look at every sheet; fix framing/occlusion; iterate until right
SCALE=1.3333333333333333 timeout 7150 scripts/<slug>-batch.sh 0-770 771-1540 ...   # ≤ ~1300 frames per call, ~4.5 s/frame
```
Run renders in the background and poll; the last valid frame is TOTAL-1; clear `/home/claude/remotion-tmp/*` between
batches. Assemble: trim each chunk to `seg/sNN.mp4` (crf 12, yuvj420p), concat demuxer + `mix.wav`,
`-vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 20 -r 30 -c:a aac -b:a 256k -movflags +faststart -shortest`.
Check: frame count = TOTAL, seams, loop (frame 0 vs last), anti-slideshow (no still stretch > ~1 s except the joke beat).

### 1.6 Publish + post
```bash
url=$(bash /home/claude/shorts/scripts/publish.sh out/<slug>/<slug>_final.mp4 <slug>)
```
Add `{slug, file, title, date}` to `videos/manifest.json`, add the topic to `topics-done.md`, commit + push.
Then Buffer `create_post` on channel `6b056f098541f09ecb880bf8`, `schedulingType: "automatic"`, `mode: "customScheduled"`,
`dueAt: <today>T19:00:00+05:30` (if already past 19:00, use `addToQueue`), `assets: [{video: {url}}]`,
`metadata.youtube: {title, categoryId: "27", privacy: "public", madeForKids: false, notifySubscribers: true}`,
`text` = description + hashtags (#history #shorts …). Title ≤ 100 chars.

## 2. Weekly long-form (Sunday, posted 11:00 IST)
```bash
python3 /home/claude/shorts/scripts/compile-weekly.py /tmp/week.mp4 <last Monday YYYY-MM-DD> <today>
```
Keeps the newest Shorts that fit ~5–6 minutes, adds an intro card and "STORY n · title" cards, 1920×1080, −14 LUFS.
Publish with `publish.sh /tmp/week.mp4 week-<YYYY-MM-DD>`, then Buffer `create_post` with `dueAt: <today>T11:00:00+05:30`,
title modelled on the most-viewed compilation titles for that week's topics (e.g. "5 Animal War Heroes Nobody Talks About").

## 3. If something blocks
Usage limit: resume automatically when it resets. A missing dependency: install it. Never post a broken or unchecked
video — if QA fails and can't be fixed in time, post it the next day and say so in the run summary.
