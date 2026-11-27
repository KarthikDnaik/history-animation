# Sound for "Cher Ami" (1918): NO MUSIC. Voice + synthesized sound design only: wind in dead trees, the distant barrage,
# shell whistles + bursts, wing beats, pigeon coos (synth, not voices), pencil, machine guns, whizzes, the hit, the gale
# aloft, boots, whittling, a museum hum, DNA beeps, the stamp. No background voices.
# usage: python3 simon_sound.py <voice48.wav>
import json, os, sys
import numpy as np
from scipy import ndimage, signal
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, st, place, fades, dbg, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, phase, reson
import instruments as I
import sfx_gen as X

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, "cues.json")))
FPS = D["FPS"]; DUR = D["TOTAL"] / FPS; N = ns(DUR)
SHOT = {s["id"]: (s["a"] / FPS, s["b"] / FPS) for s in D["SHOTS"]}
WORDS = D["words"]
F = I.m2f
R = rng(1912)
TAU = 2 * np.pi
norm = lambda s: "".join(ch for ch in s.lower() if ch.isalnum())
def A(line, w, n=0, end=False):
    l = [x for x in WORDS if x["line"] >= line and norm(x["w"]) == norm(w)]
    return l[n]["e" if end else "s"]
T = lambda k: SHOT[k][0]
E = lambda k: SHOT[k][1]
# ======================================================================== SFX
S = np.zeros((2, N))
def sfx(x, t, g_db=0.0, p=0.0):
    x = np.asarray(x)
    if x.ndim > 1 and x.shape[0] != 2: x = x.mean(0)
    place(S, pan(x, p) if x.ndim == 1 else x, t, dbg(g_db))
def mono(x):
    x = np.asarray(x, float); return x.mean(0) if x.ndim > 1 else x
def thud(f=90, d=0.35):
    t = tt(d)
    return fades(lp(R.standard_normal(len(t)), 300) * np.exp(-t / 0.05) * 2 + np.sin(TAU * f * t) * np.exp(-t / 0.07), 0.0005, 0.05)
def pop(t, g=-16, p=0.0):
    tt_ = tt(0.12); sfx(fades(np.sin(phase(500 + 900 * tt_ / 0.12)) * np.exp(-tt_ / 0.04) * 0.6, 0.001, 0.02), t, g, p)
def ding(t, g=-12, f=2100, p=0.0, d=1.4):
    tt_ = tt(d); sfx(fades((np.sin(TAU * f * tt_) + 0.4 * np.sin(TAU * 2.76 * f * tt_)) * np.exp(-tt_ / 0.45) * 0.5, 0.001, 0.1), t, g, p)
def bell(t, g=-14, f=330, d=3.5):
    tt_ = tt(d); x = sum(a * np.sin(TAU * f * k * tt_) * np.exp(-tt_ / (1.4 / k ** 0.5)) for k, a in [(1, 1), (2.0, 0.5), (2.4, 0.35), (3.0, 0.25), (4.2, 0.15)])
    sfx(fades(x * 0.3, 0.002, 0.3), t, g)
def rustle(t, dur=0.5, g=-18, p=0.0):
    n = ns(dur); tt_ = np.arange(n) / SR
    x = bp(R.standard_normal(n), 1500, 7000, 2) * (0.5 + 0.5 * np.abs(np.sin(TAU * 9 * tt_ + R.uniform(0, 6)))) * np.sin(np.pi * tt_ / dur)
    sfx(x * 0.5, t, g, p)
def stamp(t, g=-6): sfx(thud(130, 0.4), t, g); sfx(fades(bp(R.standard_normal(ns(0.05)), 1500, 6000, 2) * 0.5, 0.0005, 0.02), t, g - 6)
def scratch(t, g=-12):
    tl = tt(0.45); f = 900 + 700 * np.sin(TAU * 4.5 * tl)
    x = bp(R.standard_normal(len(tl)), 600, 5000, 2) * (0.5 + 0.5 * np.sin(phase(f))) * np.exp(-tl / 0.2)
    sfx(fades(x, 0.002, 0.05), t, g)
def feet(t0, t1, every=0.3, g=-20, p=0.0, n_=1):
    """dancing feet on cobbles: a stomp on every beat, a light scuff between"""
    t = t0; k = 0
    while t < t1 - 0.05:
        for j in range(n_): sfx(X.stroll_step(R, 0.3 + 0.4 * (k % 2)), t + 0.02 * j, g - (0 if k % 2 == 0 else 4) - 2 * j, p + R.uniform(-0.3, 0.3) * (n_ > 1))
        t += every; k += 1
def crowd_stomp(t0, t1, every=0.34, g=-17):
    t = t0; k = 0
    while t < t1 - 0.05:
        sfx(mono(X.column_stomp(R, 0.7, k % 2, 30)[0]), t, g, R.uniform(-0.3, 0.3)); t += every; k += 1

# ---------------------------------------------------------------- sound design (no music)
def horn(t, d=2.2, g=-14, f=98):
    tl = tt(d); x = sum(a * signal.sawtooth(TAU * f * k * tl + 0.3 * k) for k, a in [(1, 1.0), (1.5, 0.6), (2, 0.35)])
    env = np.minimum(1, tl / 0.12) * np.minimum(1, (d - tl) / 0.4)
    sfx(fades(lp(x, 900) * env * 0.35, 0.01, 0.2), t, g)
def rumble(t, d, g=-16, f=60):
    tl = tt(d); x = lp(R.standard_normal(len(tl)), f * 2) * (0.6 + 0.4 * np.sin(TAU * 0.7 * tl)) + 0.3 * np.sin(TAU * f * 0.6 * tl)
    sfx(fades(x, 0.3, 0.5), t, g)
def pour(t, d=0.9, g=-15):
    sfx(mono(X.bubbles(d, R, 70, 500, 2600)), t, g); tl = tt(d)
    sfx(fades(bp(R.standard_normal(len(tl)), 700, 3500, 2) * 0.25, 0.05, 0.15), t, g - 4)
def sip(t, g=-14):
    tl = tt(0.35); x = bp(R.standard_normal(len(tl)), 1200, 6000, 2) * np.sin(np.pi * tl / 0.35) ** 2
    sfx(x * 0.6, t, g); sfx(mono(X.bubbles(0.25, R, 40, 300, 1200)), t + 0.25, g - 2)
def splash(t, g=-14, p=0.0): sfx(mono(X.splash_big(R)), t, g, p)
def oven(t0, d, g=-22):
    tl = tt(d); x = lp(R.standard_normal(len(tl)), 400) * (0.8 + 0.2 * np.sin(TAU * 3 * tl)) + 0.15 * (R.random(len(tl)) < 0.002) * R.standard_normal(len(tl)) * 6
    sfx(fades(x, 0.2, 0.3), t0, g)
def tick(t0, t1, every=0.5, g=-22):
    t = t0
    while t < t1: sfx(mono(X.clink(R, 3800, 0.03)), t, g); t += every
def crackle(t0, d, g=-16):
    tl = tt(d); x = (R.random(len(tl)) < 0.004) * R.standard_normal(len(tl)) * 3 + 0.3 * lp(R.standard_normal(len(tl)), 600)
    sfx(fades(bp(x, 200, 7000, 2), 0.1, 0.3), t0, g)
def slide_whistle(t, g=-17, up=False):
    tl = tt(0.5); f = 1400 - 900 * tl / 0.5 if not up else 500 + 900 * tl / 0.5
    sfx(fades(np.sin(phase(f)) * 0.4, 0.01, 0.06), t, g)
def paddle(t0, t1, every=0.55, g=-19):
    t = t0; k = 0
    while t < t1 - 0.1:
        sfx(mono(X.bubbles(0.22, R, 60, 400, 2200)), t, g, 0.3 * (1 if k % 2 else -1)); t += every; k += 1

# ---- beds (no music), kept soft
def bedmask(ids):
    m = np.zeros(N)
    for i in ids: m[ns(T(i)):ns(E(i))] = 1
    return ndimage.uniform_filter1d(m, ns(0.08))
DECK_ = [1, 2, 4, 12, 14, 15]; DOCK = [3]; CABIN = [5, 6, 7]; HOLD = [8, 9, 10, 11, 13]
wind = mono(X.breeze(DUR + 0.5, R, 0.8, gust=0.2, bright=1200))[:N]; sfx(wind * bedmask(DECK_ + DOCK), 0, -30)
lap = lp(R.standard_normal(N), 500) * (0.6 + 0.4 * np.sin(TAU * 0.5 * np.arange(N) / SR)); sfx(lap * bedmask(DECK_ + DOCK), 0, -32)   # water lapping
hum = lp(R.standard_normal(N), 120) * 0.6 + 0.05 * np.sin(TAU * 55 * np.arange(N) / SR); sfx(hum * bedmask(CABIN + HOLD), 0, -32)   # ship's engine hum
def glitch(t, g=-18):
    tl = tt(0.22); x = signal.square(TAU * 110 * tl) * (R.random(len(tl)) < 0.6) + bp(R.standard_normal(len(tl)), 2000, 8000, 2)
    sfx(fades(x * 0.3, 0.002, 0.03), t, g)
def meow(t, g=-20, f0=560, d=0.45):                    # a soft synth mew (pitched glide, not a voice sample)
    tl = tt(d); f = f0 + 180 * np.sin(np.pi * tl / d) - 120 * tl / d; x = np.sin(phase(f)) + 0.35 * np.sin(phase(2 * f)) + 0.15 * np.sin(phase(3 * f))
    sfx(fades(lp(x, 2600) * np.sin(np.pi * tl / d) ** 0.7 * 0.35, 0.02, 0.06), t, g)
def squeak(t, g=-22):
    tl = tt(0.09); f = 2600 + 900 * np.sin(np.pi * tl / 0.09); sfx(fades(np.sin(phase(f)) * 0.25, 0.005, 0.02), t, g)
def patter(t0, t1, rate=8.0, g=-26):
    t = t0
    while t < t1:
        tl = tt(0.03); sfx(fades(bp(R.standard_normal(len(tl)), 1500, 6000, 2) * np.exp(-tl / 0.008), 0.0005, 0.008), t, g); t += 1 / rate
def boom(t, g=-16, p=0.0):
    sfx(thud(50, 1.0), t, g, p); tl = tt(1.2); sfx(fades(lp(R.standard_normal(len(tl)), 500) * np.exp(-tl / 0.3), 0.003, 0.3), t, g - 3, p)
def scratch(t0, t1, g=-24):
    tl = tt(t1 - t0); sfx(bp(R.standard_normal(len(tl)), 2500, 8000, 2) * (0.3 + 0.7 * np.abs(np.sin(TAU * 4 * tl))) * 0.3, t0, g)
def paper(t, g=-24):
    tl = tt(0.25); sfx(fades(bp(R.standard_normal(len(tl)), 1200, 7000, 2) * np.sin(np.pi * tl / 0.25) * 0.4, 0.01, 0.05), t, g)
# 1 hook: a soft mew as the medal goes on; the salute
meow(A(0, "medal") + 0.2, -22, 600); sfx(mono(X.clink(R, 2200, 0.05)), A(0, "medal") - 0.05, -24)
# 2 SIMON pop
pop(A(1, "simon"), -22)
# 3 up the gangway: boots on planks
feet(T(3) + 0.2, E(3), 0.34, -26)
# 4 under fire: guns from the bank, splashes
for k in range(5): boom(A(2, "fire") - 0.2 + 0.55 * k, -18 if k == 0 else -22, -0.4 + 0.2 * k)
# 5 asleep, then the shell
boom(A(3, "tore") + 0.1, -13); rustle(A(3, "tore") + 0.15, 0.5, -24)
# 6 the reaction: a small sad mew
meow(A(4, "gone") + 0.3, -21, 480, 0.6)
# 7 the chart: soft ticks with the DAY counter
tick(A(5, "trapped"), A(5, "months") + 0.4, 0.1, -30)
# 8 rats: scurry + squeaks
patter(T(8), E(8), 16, -26)
for k in range(5): squeak(T(8) + 0.4 + 0.45 * k, -24)
pop(A(6, "attacked"), -20)
# 9 the near-empty crate
rustle(T(9) + 0.3, 0.3, -26)
# 10 the prowl and pounce
patter(T(10), A(8, "another") - 0.25, 5, -27); sfx(mono(X.whoosh(0.3, R, peak=0.1, f_lo=600, f_hi=2600, width=0.6, tail=0.05, air=0.3)), A(8, "another") - 0.25, -24); squeak(A(8, "another") + 0.1, -22)
scratch(A(8, "every") - 0.1, A(8, "every") + 0.9, -27)
# 11 the giant rat
sfx(thud(70, 0.4), A(9, "giant"), -18); meow(A(9, "mao") + 0.4, -20, 380, 0.5)
# 12 promotion: a pop on ABLE SEACAT
pop(A(10, "able"), -20)
# 13 mail: paper rustles
for k in range(5): paper(T(13) + 0.3 + 0.6 * k, -25)
# 14 medal: a soft cheer-less pop (no crowd voices)
pop(A(12, "dickin"), -20)
# 15 CTA
pop(A(13, "send"), -24)

# ---- editing layer (edit.ts): a whoosh on every cut transition, a low boom + air drop on the black impact card
EDT = D.get("edit", {})
for tr_ in EDT.get("TRANS", []):
    tc = tr_["f"] / FPS
    if tr_["kind"] == "glitch":
        glitch(tc - 0.1, -22); continue
    if tr_["kind"] == "whip":
        sfx(mono(X.whoosh(0.34, R, peak=0.13, f_lo=500, f_hi=2600, width=0.7, tail=0.09, air=0.25)), tc - 0.13, -19, 0.35 * tr_["dir"])
    else:
        sfx(mono(X.whoosh(0.62, R, peak=0.2, f_lo=260, f_hi=3200, width=0.9, tail=0.16, air=0.3)), tc - 0.2, -16, 0.0)
for hc in EDT.get("HARD", []):
    if hc["place"]: sfx(mono(X.whoosh(0.22, R, peak=0.08, f_lo=900, f_hi=3200, width=0.6, tail=0.06, air=0.35)), hc["f"] / FPS - 0.08, -24, 0.0)
if "IMPACT" in EDT:
    ti = EDT["IMPACT"]["a"] / FPS
    sfx(thud(46, 1.2), ti, -12); sfx(thud(90, 0.5), ti, -17)


def speech_env(depth_db=-4.0, pre=0.08, post=0.15):
    ctrl = 1000; nc = int(DUR * ctrl) + 2; va = np.zeros(nc)
    for w in WORDS: va[max(0, int((w["s"] - pre) * ctrl)): int((w["e"] + post) * ctrl)] = 1
    va = ndimage.uniform_filter1d(ndimage.maximum_filter1d(va, 300), 120)
    return np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth_db * va)
def limiter(x, ceil_db=-1.2, look=0.003):
    c = dbg(ceil_db)
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * x.shape[1] - len(up))))[: 4 * x.shape[1]].reshape(x.shape[1], 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g = ndimage.minimum_filter1d(gr, 2 * La + 1)
    g = np.minimum(ndimage.uniform_filter1d(ndimage.minimum_filter1d(g, ns(0.05)), ns(0.02)), g * 0 + 1)
    g = np.minimum(g, ndimage.minimum_filter1d(gr, 2 * La + 1))
    return x * g[None, :]

def main():
    x, sr = read_wav(sys.argv[1]); assert sr == SR, f"voice must be {SR} Hz"
    v = st((x[0] if x.shape[0] == 1 else x.mean(0))[:N]); v = np.pad(v, ((0, 0), (0, N - v.shape[1])))
    vref = integrated(v)
    duck = speech_env(-7.0)
    # effects sit well under the voice (Nov 27 note: 'don't cover the video with high-volume sfx and background sound')
    s = S * dbg(vref - 17.0 - integrated(S) + 0.8 * duck)[None, :]
    mix = v + s
    G = -14.0 - integrated(mix)
    for _ in range(4):
        y = limiter(mix * dbg(G)); G += -14.0 - integrated(y)
    write_wav(os.path.join(HERE, os.environ.get("OUT", "mix.wav")), y)
    print(f"mix: {integrated(y):.2f} LUFS, TP {true_peak(y):.2f} dBTP, {y.shape[1] / SR:.3f} s (picture {DUR:.3f} s), sfx {integrated(s * dbg(G)):.1f} LUFS")

if __name__ == "__main__":
    main()
