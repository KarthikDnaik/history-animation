# Qwen3-TTS (1.7B CustomVoice, speaker Aiden) performance: every phrase carries its own natural-language emotion
# direction, generated natively by the model (no pitch shifting). 2 takes per phrase; the best take is chosen by
# Whisper word match + non-intrusive quality (SQUIM PESQ). Pauses between phrases are silence.
import json, re, sys, time, difflib, numpy as np, soundfile as sf, torch, librosa
torch.set_num_threads(2)
from qwen_tts import Qwen3TTSModel
PAUSE = {"": 0.10, "beat": 0.28, "pause": 0.45, "long pause": 0.85}
# (line, direction, text, pause after)
S = [
 (0, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, quietly amused, a curious hook', 'In 1949, the Royal Navy gave a medal to a cat.', 'pause'),
 (1, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, fond and warm', 'His name was Simon.', 'beat'),
 (1, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps', 'A skinny stray, smuggled onto H.M.S. Amethyst by a seventeen-year-old sailor.', 'pause'),
 (2, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, a little more serious', 'Then, on the Yangtze River, the ship came under fire.', 'beat'),
 (3, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, serious and calm', 'A shell tore through the captain\'s cabin, where Simon was asleep.', 'pause'),
 (4, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, gentle and sad', 'He was badly burned. His whiskers were gone.', 'pause'),
 (5, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, matter-of-fact', 'The ship was trapped on the river for over three months.', 'beat'),
 (6, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, with a touch of dry humour', 'And then the rats came. Big ones. Rats that attacked the sailors.', 'pause'),
 (7, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, quiet and serious', 'Food was running out.', 'pause'),
 (8, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, a small proud smile', 'So Simon went to work. Every day, another rat.', 'beat'),
 (9, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, amused, savouring the punchline', 'Even the giant one the crew had nicknamed Mao Tse-tung.', 'pause'),
 (10, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, warmly amused', 'The Navy promoted him to Able Seacat.', 'beat'),
 (11, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, light and amused', 'He got so much fan mail, they appointed an officer just to answer it.', 'pause'),
 (12, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, proud and gentle', 'And he is still the only cat ever awarded the Dickin Medal.', 'pause'),
 (13, 'Smooth, warm, relaxed storyteller voice, clear and steady, gentle natural pace, soft and subtle delivery, no breathiness, no gasps, friendly and playful', 'Send this to the cat person in your life.', ''),
]
NUM = {"nineteen forty-nine": "1949", "seventeen-year-old": "17yearold", "17-year-old": "17yearold", "h.m.s.": "hms"}
def toks(s):
    s = s.lower().replace("trofea","troffea").replace("trophea","troffea")
    for k, v in NUM.items(): s = s.replace(k, v)
    s = s.replace("$", "").replace(",000", "000").replace("cutler", "cutlar").replace("u.s.", "us")
    return re.sub(r"[^a-z0-9 ]", " ", s).split()
def match(a, b): return difflib.SequenceMatcher(None, toks(a), toks(b)).ratio()

if __name__ == "__main__":
    takes = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    m = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice", device_map="cpu", dtype=torch.bfloat16)
    import torchaudio; from faster_whisper import WhisperModel
    sq = torchaudio.pipelines.SQUIM_OBJECTIVE.get_model(); wm = WhisperModel("small.en", device="cpu", compute_type="int8")
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    out = json.load(open("seg/pick.json"))[:start] if start else []
    for i, (li, ins, txt, pz) in enumerate(S):
        if i < start: continue
        best = None
        for k in range(takes):
            t0 = time.time(); torch.manual_seed(1000 * i + k)
            w, sr = m.generate_custom_voice(text=txt, speaker="Aiden", language="English", instruct=ins)
            a = w[0].astype(np.float32); a, _ = librosa.effects.trim(a, top_db=38)
            y16 = librosa.resample(a, orig_sr=sr, target_sr=16000)
            hyp = " ".join(s.text for s in wm.transcribe(y16, language="en")[0])
            with torch.no_grad(): _, pesq, _ = sq(torch.tensor(y16)[None])
            sc = match(txt, hyp) * 3 + float(pesq) / 4.5
            print(f"{i:2d}.{k} {len(a)/sr:5.2f}s match {match(txt, hyp):.2f} pesq {float(pesq):.2f} ({time.time()-t0:.0f}s) | {hyp.strip()}", flush=True)
            sf.write(f"seg/{i:02d}_{k}.wav", a, sr)
            if best is None or sc > best[0]: best = (sc, k)
        out.append({"i": i, "take": best[1], "line": li, "pause": PAUSE[pz]})
        json.dump(out, open("seg/pick.json", "w"))
