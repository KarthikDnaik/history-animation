// Camera keys and lens blur per shot for the Lal Bihari short (9:16) (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, applyKick, KICKS, Cam, glide, FPS, at, atN } from "./story";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
/** cut frame for a narration word: 2 f before its onset */
const W = (line: number, word: string, n = 0) => F(n ? atN(line, word, n) : at(line, word)) - 2;
type DKey = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const CAMS: Record<number, Key[]> = {}, DOF: Record<number, DKey[]> = {};
type P = V3 | ((f: number) => V3);
const val = (p: P, f: number) => (typeof p === "function" ? p(f) : p);
type MO = { dmin?: number; fov?: number; push?: number; orbit?: number; rise?: number; roll?: number; punch?: number; T?: number; drift?: number };
const ease = (x: number, T: number) => T * (1 - Math.exp(-x / T));
/** moving camera: fast push-in toward `look` (subject grows ~1.4x in 1.5 s, easing out) + orbit about the vertical through
 *  `look` (rad/frame, + = camera swings toward screen right... i.e. counter-clockwise from above) + optional crane + a faint
 *  handheld roll drift. pos / look may be functions of the frame (tracking). */
/** v3 (after feedback "every frame is an eye or a head"): no punch-zoom, only a barely-there drift in, and a minimum
 *  distance so people are framed waist-up or wider (look lowered from face to chest) and Mike always has room around him.
 *  o.keep skips the clamp (text / object inserts). */
const M = (pos: P, look: P, f0: number, o: MO & { keep?: boolean } = {}) => (f: number): Shot => {
  let L = val(look, f), P0 = val(pos, f);
  if (!o.keep) {
    const person = L[1] >= 1.35, dmin = o.dmin ?? (person ? 2.8 : 1.9);
    if (person) { L = [L[0], L[1] - 0.3, L[2]]; P0 = [P0[0], P0[1] - 0.3, P0[2]]; }
    const d: V3 = [P0[0] - L[0], P0[1] - L[1], P0[2] - L[2]], n = Math.hypot(...d);
    if (n < dmin) P0 = [L[0] + (d[0] * dmin) / n, L[1] + (d[1] * dmin) / n, L[2] + (d[2] * dmin) / n];
  }
  const x = Math.max(0, f - f0), T = o.T ?? 60;
  const k = Math.exp(-Math.min(o.push ?? 0.007, 0.0015) * ease(x, T));
  const a = (o.orbit ?? 0.005) * 0.6 * ease(x, T * 1.6);
  const dx = P0[0] - L[0], dz = P0[2] - L[2], ca = Math.cos(a), sa = Math.sin(a);
  return {
    pos: [L[0] + (dx * ca - dz * sa) * k, L[1] + (P0[1] - L[1]) * k + (o.rise ?? 0) * ease(x, T) / T, L[2] + (dx * sa + dz * ca) * k],
    look: L, fov: o.fov ?? 42, roll: (o.roll ?? 0) * 0.5 + (o.drift ?? 0.006) * 0.5 * Math.sin(f * 0.06 + f0),
  };
};
/** one setup: from frame f, camera fn, lens blur (cInf) and focus point */
type Setup = [number, (f: number) => Shot, number, P?, number?];
/** foreground framing element per setup: 0 none, +-1 = screen side (world.ts places a set-appropriate object there) */
const FG: Record<number, { f: number; side: number }[]> = {};
const seq = (id: number, list: Setup[]) => {
  list = list.map((x) => [x[0], x[1], x[2], x[3], 0] as Setup); // no foreground props: they covered the subject in 9:16
  CAMS[id] = list.map(([f, s], i) => (i ? { f, cut: true, s } : { f, s }));
  DOF[id] = list.map(([f, , cInf, fp]) => ({ f, cInf, focus: fp ? (g: number) => val(fp, g) : undefined }));
  FG[id] = list.map(([f, , , , fg]) => ({ f, side: fg ?? 0 }));
};
export const fgAt = (id: number, f: number) => { const L = FG[id] ?? []; let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++; return L[i]?.side ?? 0; };
const gl = (u: number) => { const x = Math.max(0, Math.min(1, u)); return x * x * x * (x * (6 * x - 15) + 10); };
export const CUTS: number[] = [];
const K = { keep: true, drift: 0.003 };
/** static-ish setup: lateral drift d (m over 200 f) along x, optional rise */
const D = (pos: V3, look: V3, f0: number, o: { fov?: number; dx?: number; dy?: number; dz?: number; still?: boolean } = {}) =>
  M((f: number) => { const u = gl((f - f0) / 200); return [pos[0] + (o.dx ?? 0.25) * u, pos[1] + (o.dy ?? 0) * u, pos[2] + (o.dz ?? 0) * u]; }, look, f0, { fov: o.fov ?? 44, orbit: 0, push: 0, ...K, ...(o.still ? { drift: 0 } : {}) });
/** crane: from a to b over n frames (glide), looking at L */
const CR = (a: V3, b: V3, L: V3 | ((f: number) => V3), f0: number, n = 90, fov = 44) =>
  M((f: number) => { const u = gl((f - f0) / n); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }, L, f0, { fov, orbit: 0, push: 0, ...K });
const DESK_POS: V3 = [0.22, 2.3, -0.92], DESK_LOOK: V3 = [0.17, 0.8, -1.82];
const deskTop = (f0: number) => M(DESK_POS, DESK_LOOK, f0, { fov: 40, orbit: 0, push: 0, keep: true, drift: 0 });

// 1 In 1976, the Indian government declared a man dead.   (opens on the same desk view shot 18 ends on: loop)
seq(1, [
  [S(1), deskTop(S(1)), 3, DESK_LOOK],
  [W(0, "1976,") + 10, CR([1.1, 0.75, 0.7], [0.6, 0.8, 0.5], [0, 1.65, -2.8], W(0, "1976,") + 10, 120, 50), 4, [0, 1.4, -2.75]],
  [W(0, "a"), deskTop(W(0, "a")), 3, DESK_LOOK],
]);
// 2 He spent the next 18 years trying to prove he was alive.
seq(2, [
  [S(2), CR([1.2, 3.6, 3.4], [0.5, 1.6, 2.6], [0, 1.4, -2.2], S(2), 100, 46), 4, [-0.2, 1.1, -2.0]],
  [W(0, "trying"), D([-1.6, 0.75, 1.0], [-0.1, 1.7, -2.2], W(0, "trying"), { fov: 48, dx: 0.5 }), 4, [-0.25, 1.1, -1.9]],
]);
// 3 Lal Bihari was 20, standing in a bank in Azamgarh, asking for a small loan.
seq(3, [
  [S(3), CR([0.4, 3.6, 3.2], [0.1, 1.55, 2.0], [0, 1.5, -2.2], S(3), 110, 50), 4, [-0.4, 1.1, -1.2]],
  [W(1, "asking"), D([-1.5, 1.3, 1.5], [-0.1, 1.3, -1.7], W(1, "asking"), { fov: 44, dx: 0.4 }), 5, [-0.45, 1.1, -1.15]],
]);
// 4 The clerk checked the records and said, "Sorry... you're dead."
seq(4, [
  [S(4), D([0.0, 1.4, 2.4], [0.0, 1.3, -1.8], S(4), { fov: 46, dx: -0.3 }), 5, [0.2, 1.1, -1.8]],
  [W(2, "sorry,"), D([1.7, 0.95, 0.4], [0.45, 1.55, -2.35], W(2, "sorry,"), { fov: 44, dx: -0.3 }), 4, [0.5, 1.2, -2.35], -1],
  [W(2, "you're"), D([-0.6, 1.3, 1.9], [-0.45, 1.3, -1.15], W(2, "you're"), { fov: 46, dx: 0.2, still: true }), 5, [-0.45, 1.1, -1.15]],
]);
// 5 His uncle had bribed an official 300 rupees to kill him -- on paper --
seq(5, [
  [S(5), D([-2.0, 1.4, 1.8], [-0.1, 1.3, -2.0], S(5), { fov: 44, dx: 0.5 }), 4, [-0.2, 1.1, -1.8], -1],
  [W(3, "300"), M([-0.45, 2.15, -0.55], [0.0, 0.95, -1.9], W(3, "300"), { fov: 42, orbit: 0.0015, push: 0, ...K }), 3, [0.0, 0.95, -1.9]],
  [W(3, "kill"), D([0.6, 1.25, 2.3], [0.0, 1.4, -2.0], W(3, "kill"), { fov: 46, dx: -0.35 }), 5, [0.0, 1.2, -1.8], 1],
]);
// 6 just to grab his land. Less than one acre.
seq(6, [
  [S(6), D([4.2, 1.2, 2.2], [3.3, 1.3, -2.2], S(6), { fov: 44, dx: -0.4 }), 4, [3.4, 1.1, -1.9]],
  [W(3, "less"), CR([3.5, 2.0, 2.4], [3.4, 7.5, 4.6], [3.4, 0.2, -2.2], W(3, "less"), 40, 46), 2, [3.4, 0.3, -2.0]],
]);
// 7 Heh, so Lal Bihari got creative.
seq(7, [
  [S(7), D([0.9, 0.6, 1.4], [0.0, 1.75, -2.0], S(7), { fov: 48, dx: -0.4, dy: 0.15 }), 4, [0, 1.2, -1.9]],
]);
// 8 He changed his name to Lal Bihari Mritak. Lal Bihari, the Dead.
seq(8, [
  [S(8), CR([2.6, 1.5, -1.6], [1.9, 1.5, -2.2], [0.75, 1.8, -7.9], S(8), 120, 46), 4, [1.0, 1.5, -7.3]],
  [W(5, "lal", 1), D([-0.4, 0.75, -3.4], [0.75, 2.0, -7.9], W(5, "lal", 1), { fov: 46, dx: 0.4 }), 3, [1.0, 1.8, -7.5]],
]);
// 9 He signed his letters "the late Lal Bihari."
seq(9, [
  [S(9), D([-0.4, 1.55, -1.5], [-1.6, 1.0, -4.4], S(9), { fov: 44, dx: -0.3 }), 4, [-1.7, 0.9, -4.3]],
  [W(6, "the"), D([-0.95, 1.55, -3.55], [-1.15, 0.5, -4.25], W(6, "the"), { fov: 40, dx: -0.08, still: true }), 3, [-1.15, 0.5, -4.25]],
]);
// 10 He held his own funeral.
seq(10, [[S(10), CR([-0.6, 4.4, -0.8], [-1.0, 3.6, -1.4], [-1.9, 0.5, -4.7], S(10), 60, 46), 3, [-1.8, 0.7, -4.5]]]);
// 11 His wife applied for a widow's pension... while he stood right next to her.
seq(11, [
  [S(11), D([-0.3, 1.45, 2.6], [-0.2, 1.3, -1.9], S(11), { fov: 46, dx: 0.3 }), 5, [-0.4, 1.1, -1.4], 1],
  [W(8, "while"), D([-2.4, 1.05, 0.9], [-0.5, 1.45, -1.6], W(8, "while"), { fov: 44, dx: 0.4 }), 4, [-0.7, 1.1, -1.3]],
  [W(8, "her."), D([0.6, 1.6, 0.9], [0.35, 1.6, -1.9], W(8, "her."), { fov: 44, dx: -0.2 }), 4, [0.3, 1.6, -1.6]],
]);
// 12 He insulted policemen, hoping to get arrested -- because an arrest is proof you exist.
seq(12, [
  [S(12), CR([2.4, 3.4, 4.0], [1.4, 1.6, 2.6], [0.2, 1.6, -3.4], S(12), 110, 46), 4, [0, 1.1, -3.0]],
  [W(9, "because"), D([-1.8, 0.65, -0.2], [0.3, 1.75, -3.4], W(9, "because"), { fov: 48, dx: 0.6 }), 4, [0.1, 1.1, -3.0]],
]);
// 13 Nothing worked.
seq(13, [[S(13), D([-2.5, 1.4, -1.5], [-1.0, 1.0, -4.9], S(13), { fov: 46, dx: 0.3 }), 4, [-1.1, 0.7, -4.9]]]);
// 14 So he ran for Parliament -- against Prime Minister Rajiv Gandhi. A dead man.
seq(14, [
  [S(14), CR([0.9, 0.9, 3.2], [0.6, 1.3, 2.8], [0, 2.1, -2.2], S(14), 100, 52), 4, [0, 1.7, -2.0]],
  [W(11, "against"), D([3.0, 3.2, 1.5], [-60, 3.2, -0.5], W(11, "against"), { fov: 28, dx: 0, dz: -0.5 }), 1.5, [-50, 2, -0.5]],
  [W(11, "a", 0), D([-1.4, 1.5, 2.2], [0, 1.9, -2.0], W(11, "a", 0), { fov: 46, dx: 0.4 }), 4, [0, 1.6, -1.6]],
]);
// 15 In 1994, the government finally admitted it. He's alive.
seq(15, [
  [S(15), D([-0.1, 1.45, 2.2], [-0.5, 1.4, -2.2], S(15), { fov: 46, dx: -0.4 }), 4, [-0.3, 1.2, -2.0], -1],
  [W(12, "finally"), deskTop(W(12, "finally")), 3, DESK_LOOK],
  [F(at(12, "alive.")) + 12, CR([-0.6, 0.65, 1.7], [-0.9, 0.75, 1.5], [-0.6, 1.8, -1.6], F(at(12, "alive.")) + 12, 60, 50), 4, [-0.9, 1.2, -1.35]],
]);
// 16 And the land he fought 18 years for? He let his uncle keep farming it.
seq(16, [
  [S(16), M((f: number) => { const u = gl((f - S(16)) / 140); return [-0.6 + 2.0 * u, 1.35, 2.6]; }, (f: number) => { const u = gl((f - S(16)) / 140); return [0.6 + 1.6 * u, 1.2, -1.6]; }, S(16), { fov: 44, orbit: 0, push: 0, ...K }), 5, [1.6, 1.0, -1.6]],
  [W(13, "let"), D([4.3, 0.85, 1.3], [3.2, 1.3, -2.0], W(13, "let"), { fov: 46, dx: -0.4 }), 4, [2.4, 1.0, -1.6]],
]);
// 17 Send this to the friend who says paperwork doesn't matter...
seq(17, [
  [S(17), D([0.4, 1.0, 2.0], [-0.2, 1.65, -1.6], S(17), { fov: 46, dx: -0.4 }), 5, [-0.2, 1.2, -1.2], 1],
  [W(14, "paperwork"), D([-1.8, 1.5, 1.6], [-0.1, 1.5, -1.6], W(14, "paperwork"), { fov: 44, dx: 0.4 }), 5, [-0.2, 1.2, -1.2]],
]);
// 18 ...because one piece of paper can kill a man.   (ends on shot 1's opening desk view)
seq(18, [
  [S(18), D([0.25, 1.35, 1.1], [0.15, 1.05, -2.1], S(18), { fov: 44, dx: -0.2 }), 4, [0.15, 0.9, -1.9]],
  [W(15, "can"), deskTop(W(15, "can")), 3, DESK_LOOK],
]);
KICKS.push([at(0, "dead."), 0.14], [at(2, "dead."), 0.12], [at(3, "kill"), 0.1], [at(8, "her."), 0.1], [at(12, "alive."), 0.14], [at(11, "dead"), 0.08]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
