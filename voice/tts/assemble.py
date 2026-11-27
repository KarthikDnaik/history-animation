# Join the picked takes with their pauses -> vo.wav; retime the canonical words.json (same words/lines, new times)
# by aligning Whisper word timestamps of each picked take to the canonical word sequence.
import json, re, difflib, numpy as np, soundfile as sf, librosa
from faster_whisper import WhisperModel
from qperform import S
pick = json.load(open("seg/pick.json")); assert len(pick) == len(S), len(pick)
import os as _o; OVR = {int(k): v for k, v in json.load(open("ovr.json")).items()} if _o.path.exists("ovr.json") else {}
TRIM = {int(k): v for k, v in json.load(open("trim.json")).items()} if _o.path.exists("trim.json") else {}
TIGHT = {0.10: 0.04, 0.28: 0.13, 0.45: 0.26, 0.85: 0.45}   # reference pacing: ~170 wpm, no pause over ~0.6 s
for p in pick:
    p["take"] = OVR.get(p["i"], p["take"]); p["pause"] = TIGHT.get(round(p["pause"], 2), p["pause"])
def squeeze(a, sr, mx=0.25):
    iv = librosa.effects.split(a, top_db=40, frame_length=1024, hop_length=256)
    if len(iv) < 2: return a
    parts = [a[iv[0][0]:iv[0][1]]]
    for (s0, e0), (s1, e1) in zip(iv[:-1], iv[1:]):
        gap = a[e0:s1]
        if len(gap) > mx * sr: gap = np.concatenate([gap[:int(mx * sr / 2)], gap[-int(mx * sr / 2):]])
        parts += [gap, a[s1:e1]]
    return np.concatenate(parts)
import subprocess, tempfile, os
TEMPO = float(os.environ.get("TEMPO", "1.12"))
# narration runs at the reference's quick pace; the punchlines (deadpan, annoyed, whisper, sigh, smirk, sad) keep their own timing
KEEP = set(range(20)); FAST = set(range(len(S))) - KEEP
def tempo(a, sr, k):   # WSOLA (ffmpeg atempo): pitch-preserving, no phase-vocoder smear
    d = tempfile.mkdtemp(); i, o = os.path.join(d, "i.wav"), os.path.join(d, "o.wav"); sf.write(i, a, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", i, "-af", f"atempo={k}", o], check=True)
    return sf.read(o, dtype="float32")[0]
sr = 24000; lead = 0.15; out = [np.zeros(int(lead * sr), np.float32)]; t = lead; hyp = []
wm = WhisperModel("small.en", device="cpu", compute_type="int8")
for p in pick:
    a, r = sf.read(f"seg/{p['i']:02d}_{p['take']}.wav", dtype="float32"); assert r == sr
    if p["i"] in TRIM: a = a[: int(TRIM[p["i"]] * sr)]; f2 = int(0.06 * sr); a[-f2:] *= np.linspace(1, 0, f2)
    a = squeeze(a, sr)
    if p["i"] in FAST and TEMPO != 1: a = tempo(a, sr, TEMPO)
    fade = int(0.008 * sr); a[:fade] *= np.linspace(0, 1, fade); a[-fade:] *= np.linspace(1, 0, fade)
    segs, _ = wm.transcribe(librosa.resample(a, orig_sr=sr, target_sr=16000), language="en", word_timestamps=True)
    for s in segs:
        for w in s.words:
            ww = w.word.strip()
            if hyp and ww[:1] in (",", "-") and ww[1:2].isalnum(): hyp[-1] = (hyp[-1][0] + ww, hyp[-1][1], t + w.end); continue  # "16" ",000" -> "16,000"
            hyp.append((ww, t + w.start, t + w.end))
    out += [a, np.zeros(int(p["pause"] * sr), np.float32)]; t += len(a) / sr + p["pause"]
out.append(np.zeros(int(0.5 * sr), np.float32))
v = np.concatenate(out); v = v / np.abs(v).max() * 0.89; dur = len(v) / sr
sf.write("vo.wav", v, sr)

NUM = {"1949": "1949", "nineteenfortynine": "1949", "17yearold": "17yearold", "seventeenyearold": "17yearold", "hms": "hms", "amethyst": "amethyst", "seacat": "seacat", "seecat": "seacat", "maotsetung": "mao", "maozedong": "mao", "tsetung": "tsetung", "dickin": "dickin", "dicken": "dickin", "dickens": "dickin"}
def n(s):
    s = re.sub(r"[^a-z0-9]", "", s.lower().replace("neighbors","neighbours").replace("labor","labour").replace("vulture's","vultures"))
    return NUM.get(s, s)
CW = json.load(open("words_canon.json"))["words"]
A = [n(w["w"]) for w in CW]; B = [n(h[0]) for h in hyp]
times = [None] * len(CW)
for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
    for k in range(blk.size): times[blk.a + k] = hyp[blk.b + k][1:]
# interpolate unmatched words between their matched neighbours
miss = [i for i, x in enumerate(times) if x is None]
for i in miss:
    j0 = max([j for j in range(i) if times[j] is not None and j not in miss] or [-1])
    j1 = min([j for j in range(i + 1, len(CW)) if times[j] is not None and j not in miss] or [len(CW)])
    t0 = times[j0][1] if j0 >= 0 else lead; t1 = times[j1][0] if j1 < len(CW) else dur - 0.5
    k = (i - j0) / (j1 - j0); s = t0 + (t1 - t0) * k; times[i] = (s, min(t1, s + 0.3))
print("unmatched:", [CW[i]["w"] for i in miss])
W = [{"w": c["w"], "s": round(a, 3), "e": round(b, 3), "line": c["line"]} for c, (a, b) in zip(CW, times)]
json.dump({"words": W, "duration": round(dur, 3)}, open("/home/claude/shorts/src/videos/simon/words.json", "w"))
print("duration", dur, "frames", int(np.ceil(dur * 30)))
