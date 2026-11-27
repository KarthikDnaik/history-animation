// "The Man Who Sold the Eiffel Tower" (long-form): timeline. Every cut and action is a cue on a narration word (words.json: real ElevenLabs
// timings once the voice is in, estimated until then), so retiming = replacing words.json. Camera grammar from the
// bridge short (motion.md): smootherstep glides 18-40 f, every hold creeps, cuts on big reframes, 7-frame flip kicks.
import WJ from "./words.json";

export const FPS = 30;
export const D0 = 0; // ground height (build.ts compat)
export type V3 = [number, number, number];
export type Light = "day" | "golden" | "night";
export type SetId = "hotel" | "paris" | "village" | "liner" | "station" | "office" | "capone" | "nyc" | "alcatraz" | "cell";

type W = { w: string; s: number; e: number; line: number };
const WORDS = (WJ as unknown as { words: W[]; duration?: number }).words;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** start (or end) time in seconds of the first word `w` on/after script line `line` (0-based) */
export const at = (line: number, w: string, end = false) => {
  const x = WORDS.find((o) => o.line >= line && norm(o.w) === norm(w));
  if (!x) throw new Error(`cue not found: line ${line} "${w}"`);
  return end ? x.e : x.s;
};
/** n-th (0-based) occurrence of word `w` on/after line `line` */
export const atN = (line: number, w: string, n: number) => {
  const l = WORDS.filter((o) => o.line >= line && norm(o.w) === norm(w));
  if (!l[n]) throw new Error(`cue not found: line ${line} "${w}" #${n}`);
  return l[n].s;
};
export const lineStart = (i: number) => WORDS.find((o) => o.line === i)!.s;
export const lineEnd = (i: number) => { const l = WORDS.filter((o) => o.line === i); return l[l.length - 1].e; };
export const TOTAL = Math.round(((WJ as unknown as { duration?: number }).duration ?? WORDS[WORDS.length - 1].e + 1.3) * FPS);
export const fr = (t: number) => Math.round(t * FPS);
/** visual lead: reactions land 0-3 f before their word */
export const LEAD = 2 / FPS;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const easeIn = (u: number) => clamp01(u) ** 2;
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

// ---------------- shots ----------------
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetId };
const cut = (t: number) => fr(t - 0.12);
const DEF: [Light, SetId, () => number][] = [
  ["day", "hotel", () => 0],
  ["day", "paris", () => lineStart(1)],
  ["day", "hotel", () => lineStart(2)],
  ["day", "paris", () => lineStart(3)],
  ["golden", "paris", () => lineStart(4)],
  ["day", "village", () => lineStart(5)],
  ["day", "village", () => lineStart(6)],
  ["day", "paris", () => lineStart(7)],
  ["day", "office", () => lineStart(8)],
  ["day", "liner", () => lineStart(9)],
  ["day", "liner", () => lineStart(10)],
  ["day", "office", () => lineStart(11)],
  ["day", "office", () => lineStart(13)],
  ["day", "paris", () => lineStart(14)],
  ["day", "paris", () => lineStart(15)],
  ["day", "paris", () => lineStart(16)],
  ["day", "paris", () => lineStart(17)],
  ["day", "paris", () => lineStart(18)],
  ["day", "paris", () => lineStart(19)],
  ["day", "paris", () => lineStart(20)],
  ["day", "office", () => lineStart(21)],
  ["day", "office", () => lineStart(22)],
  ["day", "paris", () => lineStart(23)],
  ["day", "hotel", () => lineStart(24)],
  ["day", "hotel", () => lineStart(25)],
  ["day", "hotel", () => lineStart(26)],
  ["day", "hotel", () => lineStart(27)],
  ["day", "hotel", () => lineStart(28)],
  ["day", "paris", () => lineStart(29)],
  ["day", "hotel", () => lineStart(30)],
  ["day", "hotel", () => lineStart(31)],
  ["day", "hotel", () => lineStart(32)],
  ["day", "office", () => lineStart(33)],
  ["day", "hotel", () => lineStart(34)],
  ["day", "hotel", () => lineStart(35)],
  ["day", "hotel", () => lineStart(36)],
  ["day", "hotel", () => lineStart(37)],
  ["day", "station", () => lineStart(38)],
  ["day", "paris", () => lineStart(39)],
  ["day", "paris", () => lineStart(40)],
  ["day", "station", () => lineStart(41)],
  ["day", "paris", () => lineStart(42)],
  ["day", "hotel", () => lineStart(44)],
  ["day", "paris", () => lineStart(45)],
  ["day", "paris", () => lineStart(46)],
  ["day", "liner", () => lineStart(47)],
  ["day", "office", () => lineStart(48)],
  ["day", "office", () => lineStart(50)],
  ["day", "office", () => lineStart(52)],
  ["day", "office", () => lineStart(53)],
  ["day", "nyc", () => lineStart(54)],
  ["day", "capone", () => lineStart(55)],
  ["day", "nyc", () => lineStart(56)],
  ["day", "capone", () => lineStart(57)],
  ["day", "office", () => lineStart(58)],
  ["day", "capone", () => lineStart(59)],
  ["day", "capone", () => lineStart(60)],
  ["day", "capone", () => lineStart(61)],
  ["day", "office", () => lineStart(63)],
  ["day", "office", () => lineStart(64)],
  ["day", "nyc", () => lineStart(65)],
  ["day", "nyc", () => lineStart(66)],
  ["day", "nyc", () => lineStart(67)],
  ["day", "nyc", () => lineStart(68)],
  ["night", "nyc", () => lineStart(70)],
  ["day", "nyc", () => lineStart(71)],
  ["day", "office", () => lineStart(72)],
  ["day", "alcatraz", () => lineStart(73)],
  ["day", "cell", () => lineStart(74)],
  ["day", "office", () => lineStart(75)],
  ["golden", "paris", () => lineStart(77)],
];
export const SHOTS: ShotDef[] = DEF.map(([light, set, t0], i) => ({ id: i + 1, a: i === 0 ? 0 : cut(t0()), b: i === DEF.length - 1 ? TOTAL : cut(DEF[i + 1][2]()), light, set }));
/** crossfades (frames) at time/place jumps; white flash after the hook */
export const XFADE: Record<number, number> = {2: 12, 3: 12, 4: 12, 6: 12, 8: 12, 9: 12, 10: 12, 12: 12, 14: 12, 21: 12, 23: 12, 24: 12, 29: 12, 30: 12, 33: 12, 34: 12, 38: 12, 39: 12, 41: 12, 42: 12, 43: 12, 44: 12, 46: 12, 47: 12, 51: 12, 52: 12, 53: 12, 54: 12, 55: 12, 56: 12, 59: 12, 61: 12, 67: 12, 68: 12, 69: 12, 70: 12, 71: 12};
export const FLASH_AT = -100; // no flash in this short
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera helpers ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<Cam> & { pos: V3; look: V3 };
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
export const runKeys = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0 (subject grows ~rate per frame), with an optional punch for the first n frames */
export const pushK = (f: number, f0: number, rate = 0.0022, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
export const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// impact kicks: image offset flips sign every frame, decays over 7 f (times in seconds, filled by cams.ts)
export const KICKS: [number, number][] = [];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const applyKick = (c: Cam, t: number): Cam => {
  const a = kickAt(t);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
