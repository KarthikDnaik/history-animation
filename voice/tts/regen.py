# regenerate extra takes (k = 2..) for chosen phrases; optional direction override
import sys, json, time, numpy as np, soundfile as sf, torch, librosa
torch.set_num_threads(2)
from qwen_tts import Qwen3TTSModel
from qperform import S, match
import torchaudio; from faster_whisper import WhisperModel
IDX = [int(x) for x in sys.argv[1].split(",")]; K = int(sys.argv[2]) if len(sys.argv) > 2 else 4
from qperform import S as _S
FASTDIR = ", at a brisk, fast storytelling pace with no long pauses, like a punchy YouTube Shorts narrator"
OVR_DIR = {}
TXT = {7: "Sher Ah-mee took off. The Germans opened fire.", 9: "Then... she got back up."}
m = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice", device_map="cpu", dtype=torch.bfloat16)
sq = torchaudio.pipelines.SQUIM_OBJECTIVE.get_model(); wm = WhisperModel("small.en", device="cpu", compute_type="int8")
for i in IDX:
    li, ins, txt, pz = S[i]; ins = OVR_DIR.get(i, ins); txt2 = TXT.get(i, txt)
    for k in range(2, 2 + K):
        torch.manual_seed(7000 * i + k)
        w, sr = m.generate_custom_voice(text=txt2, speaker="Ryan", language="English", instruct=ins)
        a = w[0].astype(np.float32); a, _ = librosa.effects.trim(a, top_db=38)
        y16 = librosa.resample(a, orig_sr=sr, target_sr=16000)
        hyp = " ".join(s.text for s in wm.transcribe(y16, language="en")[0])
        with torch.no_grad(): _, pesq, _ = sq(torch.tensor(y16)[None])
        print(f"{i:2d}.{k} {len(a)/sr:5.2f}s match {match(txt, hyp):.2f} pesq {float(pesq):.2f} | {hyp.strip()}", flush=True)
        sf.write(f"seg/{i:02d}_{k}.wav", a, sr)
