// Camera keys and lens blur per shot for the 38-Minute War short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
  // repo camera rule: every hold creeps in continuously (0.15 %/f), capped at -22 % distance so it never ends on a face
  const k = o.drift === 0 ? 1 : Math.max(0.78, Math.exp(-0.0015 * x)); // locked loop setups (STILL) stay put
  const a = (o.orbit ?? 0.005) * 0.6 * ease(x, T * 1.6);
  const dx = P0[0] - L[0], dz = P0[2] - L[2], ca = Math.cos(a), sa = Math.sin(a);
  return {
    pos: [L[0] + (dx * ca - dz * sa) * k, L[1] + (P0[1] - L[1]) * k + (o.rise ?? 0) * ease(x, T) / T, L[2] + (dx * sa + dz * ca) * k],
    look: L, fov: o.fov ?? 42, roll: (o.roll ?? 0) * 0.5, // repo: no hand-held float
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
/** locked-off setup (no drift, no roll): used for the loop frame */
const STILL = (pos: V3, look: V3, f0: number, fov = 46) => M(pos, look, f0, { fov, orbit: 0, push: 0, keep: true, drift: 0 });
// harbour geography (sets.ts): palace front x = -6 (verandas to x = -3.8), z -14..2, roof 11; clock tower (-9, -19), face at
// y 19.4 toward +x; beach x -4.2..1.2; yacht (9, -10); fleet x 26..52, z -14..-78.
const HOOK_POS: V3 = [9, 3.8, 9], HOOK_LOOK: V3 = [-6, 8.2, -9];
const CABIN: V3 = [0.0, 1.55, -2.6];

// 1 The shortest war in history lasted thirty-eight minutes.   (opens on the frame shot 21 ends on: loop)
seq(1, [[S(1), STILL(HOOK_POS, HOOK_LOOK, S(1), 54), 1.2, [-6, 6, -6]]]);
// 2 That's shorter than your lunch break.
seq(2, [[S(2), D([0.2, 1.7, 7.2], [-1.0, 1.5, 2.4], S(2), { fov: 48, dx: 0.3 }), 3, [-1.0, 1.2, 2.6]]]);
// 3 It's 1896, on the island of Zanzibar.
seq(3, [[S(3), CR([30, 24, 30], [22, 14, 22], [-6, 6, -10], S(3), 120, 50), 1, [-6, 6, -8]]]);
// 4 The Sultan dies suddenly...
seq(4, [[S(4), D([-4.0, 2.2, 1.6], [-4.7, 2.7, -6.0], S(4), { fov: 48, dx: 0.25 }), 3.5, [-4.7, 3.0, -6.0]]]);
// 5 and within hours, his cousin Khalid moves into the palace and crowns himself.
seq(5, [
  [S(5), D([1.6, 1.7, 3.4], [0.6, 1.5, -3.6], S(5), { fov: 50, dx: -0.3 }), 4, [1.0, 1.2, -3.2]],
  [W(1, "crowns"), D([0.4, 1.8, 0.4], [0.0, 1.9, -3.4], W(1, "crowns"), { fov: 46, dx: 0.2 }), 4, [0, 1.6, -3.4]],
]);
// 6 The problem? Britain had a rule: no new sultan without their permission.
seq(6, [[S(6), D([0.9, 1.6, 1.9], CABIN, S(6), { fov: 46, dx: -0.35 }), 4, [0.1, 1.3, -2.5]]]);
// 7 Khalid didn't ask.
seq(7, [[S(7), D([-0.8, 1.5, 0.4], [0.0, 1.9, -3.6], S(7), { fov: 46, dx: 0.25 }), 4, [0, 1.6, -3.6]]]);
// 8 So Britain parked five warships in the harbour...
seq(8, [[S(8), D([12, 2.4, -4], [36, 5, -36], S(8), { fov: 46, dx: 0.6 }), 1.2, [34, 5, -36]]]);
// 9 and sent a message: leave the palace by nine a.m. tomorrow.
seq(9, [[S(9), D([-0.9, 1.0, 0.7], [0.1, 1.75, -2.6], S(9), { fov: 48, dx: 0.2 }), 4, [0.1, 1.3, -2.6]]]);
// 10 Khalid's answer? He locked the gates, gathered nearly three thousand men...
seq(10, [
  [S(10), D([4.5, 2.2, -1.6], [-5.6, 2.0, -8.0], S(10), { fov: 50, dx: 0.3 }), 3, [-5.0, 1.6, -8.4]],
  [W(4, "3,000"), D([1.2, 2.6, 1.6], [-6.4, 1.4, -6.0], W(4, "3,000"), { fov: 52, dx: 0.3 }), 2.5, [-6, 1.4, -6]],
]);
// 11 and pointed his one royal yacht at five British warships.
seq(11, [
  [S(11), D([23, 6.5, 6], [9, 0.8, -10], S(11), { fov: 40, dx: 0 }), 3, [9, 1.5, -10]],
  [W(4, "five"), D([4, 3.4, 4], [34, 6, -36], W(4, "five"), { fov: 50, dx: 0.5 }), 1.5, [30, 5, -30]],
]);
// 12 Nine a.m. Nothing. Nine-oh-two.
seq(12, [[S(12), STILL([2.5, 17.5, -14], [-7.3, 19.4, -19], S(12), 42), 2, [-7.3, 19.4, -19]]]);
// 13 Boom.
seq(13, [[S(13), D([12, 2.6, 2], [36, 5, -30], S(13), { fov: 52, dx: 0.4 }), 1.2, [32, 4, -24]]]);
// 14 The palace caught fire. The royal yacht sank.
seq(14, [
  [S(14), D([12, 5, 10], [-6, 8, -8], S(14), { fov: 52, dx: 0.4 }), 1.5, [-6, 7, -6]],
  [W(6, "the", 1), D([23, 6.5, 6], [9, 0.6, -10], W(6, "the", 1), { fov: 40, dx: 0 }), 3, [9, 1, -10]],
]);
// 15 About five hundred people on Khalid's side were killed or wounded.   (slow, still, no gag)
seq(15, [[S(15), CR([20, 6, 12], [17, 6.5, 9], [-6, 9, -6], S(15), 200, 50), 1.2, [-6, 8, -6]]]);
// 16 On the British side, one sailor got hurt. He recovered.
seq(16, [[S(16), D([0.8, 1.7, 2.4], [0.2, 1.5, -3.0], S(16), { fov: 50, dx: -0.3 }), 4, [0, 1.2, -3]]]);
// 17 At nine-forty, a shell knocked down the palace flag... and that was it. War over. Thirty-eight minutes.
seq(17, [
  [S(17), D([6, 8, 10], [-8, 13, -6], S(17), { fov: 50, dx: 0.3 }), 1.5, [-8, 13, -6]],
  [W(7, "and"), D([14, 5, 14], [-6, 8.5, -8], W(7, "and"), { fov: 52, dx: 0.3 }), 1.2, [-6, 7, -6]],
]);
// 18 And Khalid? He ran to the German consulate, and Germany refused to hand him over.
seq(18, [
  [S(18), D([2.6, 4.4, 6.5], [-1.5, 1.2, -4.5], S(18), { fov: 52, dx: 0.3 }), 3, [-1, 1.2, -4]],
  [W(8, "refused"), D([0.4, 1.7, -2.2], [1.6, 1.7, -5.4], W(8, "refused"), { fov: 46, dx: 0.2 }), 4, [1.6, 1.4, -5.4]],
]);
// 19 Weeks later, a German boat rowed right up to the consulate's garden gate, and he stepped aboard...
seq(19, [
  [S(19), D([4.5, 2.0, 7.5], [-2.0, 1.4, -0.6], S(19), { fov: 52, dx: 0.3 }), 3, [-1, 1, 0]],
  [W(8, "stepped"), D([2.4, 1.6, 4.6], [1.0, 1.25, 0.0], W(8, "stepped"), { fov: 50, dx: -0.2 }), 4, [0.4, 1, 0.3]],
]);
// 20 Oh, and the best part? Britain made Khalid's supporters pay for the shells they'd been shot with.
seq(20, [[S(20), D([0.2, 1.6, 2.6], [0.0, 1.55, -2.9], S(20), { fov: 50, dx: 0.3 }), 4, [0, 1.3, -2.9]]]);
// 21 Send this to the friend who takes longer to order food than this war lasted.   (ends on shot 1's opening frame)
seq(21, [
  [S(21), D([10, 4.2, 12], [-6, 8.0, -10], S(21), { fov: 52, dx: 0.4 }), 1.2, [-6, 6, -6]],
  [W(10, "war"), STILL(HOOK_POS, HOOK_LOOK, W(10, "war"), 54), 1.2, [-6, 6, -6]],
]);
KICKS.push([at(5, "boom."), 0.2], [at(4, "locked"), 0.08], [at(7, "flag"), 0.1], [at(8, "refused"), 0.08], [at(9, "pay"), 0.1]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
