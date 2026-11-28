// Camera keys and lens blur per shot for the Bat Bomb short (9:16) (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { tcam } from "./theatre";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, applyKick, KICKS, Cam, glide, FPS, at, atN, casY9 } from "./story";

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
void CR; void D; void W;
// geography (sets.ts): SKY casing hangs at CAS0 (0, 80, 0) under its chute; shot 9 bomber at (0, 88, 0), the casing falls
// along casY9. OFFICE Adams at (-0.1, 0, -0.8), desk (1.3, 0.78, -1.4), scale (1.75, 0.78, -1.35). CAVE mouth (0, 2, -12),
// Adams (1.3, 0, -2), car (5.5, 0, 4). BASE crate at the origin, tower (-9, 0, -14), barracks (7, 0, -15), fuel (17, 0, -7).
// VILLAGE house at the origin, vent (0, 3.15, 1.8), easel (3.4, 0, 3.2).
const HOOK_POS: V3 = [1.2, 79.8, 7.6], HOOK_LOOK: V3 = [0, 80.9, 0];
const HOOK = (f0: number) => STILL(HOOK_POS, HOOK_LOOK, f0, 50);
const L = (line: number, w: string, n = 0) => (n ? atN(line, w, n) : at(line, w));
const r = (id: number, t: number) => t - S(id) / FPS;
type TK = Parameters<typeof tcam>[2][number];
const tc = (id: number, keys: TK[], name = "") => tcam("s" + id + name, S(id), keys);
const sh = (id: number) => r(id, SHOTS[id - 1].b / FPS);
const sub2 = (id: number, f0: number, keys: TK[], name: string) => tcam("s" + id + name, f0, keys);
const rf = (f0: number, t: number) => t - f0 / FPS;

seq(1, [[S(1), tc(1, [
  { t: 0, pos: HOOK_POS, look: HOOK_LOOK, fov: 50 },
  { t: r(1, L(0, "bats")) - 0.05, pos: HOOK_POS, look: HOOK_LOOK, fov: 50, ease: "lin" },
  { t: r(1, L(0, "bats")) + 0.28, pos: [0.9, 79.9, 6.4], look: [0, 80.6, 0], fov: 48, ease: "out" },              // the burst: fast push
  { t: sh(1) + 1, pos: [1.8, 80.2, 8.2], look: [0, 80.8, 0], fov: 50, ease: "io" },                                   // then pull out
]), 2, [0, 80.2, 1.2]]]);
seq(2, [[S(2), tc(2, [
  { t: 0, pos: [0.9, 1.3, 2.9], look: [-0.1, 1.35, -0.8], fov: 46 },
  { t: r(2, L(1, "lytle")) - 0.05, pos: [0.8, 1.3, 2.7], look: [-0.1, 1.4, -0.8], fov: 46, ease: "io" },
  { t: r(2, L(1, "lytle")) + 0.3, pos: [0.5, 1.35, 3.3], look: [-0.1, 1.5, -1.0], fov: 48, ease: "out" },           // pull back: the name
  { t: sh(2) + 1, pos: [0.45, 1.35, 3.4], look: [-0.1, 1.5, -1.0], fov: 48, ease: "lin" },
]), 2, [-0.1, 1.4, -0.8]]]);
seq(3, [[S(3), tc(3, [
  { t: 0, pos: [3.4, 0.9, 3.4], look: [0.2, 2.2, -6], fov: 50 },
  { t: r(3, L(2, "millions")) - 0.1, pos: [3.0, 0.8, 2.6], look: [0.0, 3.6, -9], fov: 50, ease: "io" },              // tilt up with the swarm
  { t: sh(3) + 1, pos: [2.9, 0.8, 2.4], look: [0.0, 4.6, -9], fov: 52, ease: "io" },
]), 1.2, [1.3, 1.5, -2]]]);
seq(4, [[S(4), tc(4, [
  { t: 0, pos: [2.6, 2.7, 10.5], look: [4.9, 1.6, 3.9], fov: 44 },
  { t: r(4, L(3, "idea")) - 0.15, pos: [2.9, 2.7, 10.0], look: [5.0, 1.7, 3.9], fov: 44, ease: "io" },
  { t: r(4, L(3, "idea")) + 0.15, pos: [3.9, 2.1, 8.2], look: [5.4, 2.0, 3.8], fov: 44, ease: "out" },               // the idea: fast push
  { t: sh(4) + 1, pos: [3.7, 2.1, 8.6], look: [5.4, 2.0, 3.8], fov: 46, ease: "io" },
]), 1.5, [5.6, 1.6, 3.7]]]);
seq(5, [[S(5), tc(5, [
  { t: 0, pos: [1.05, 1.82, -0.75], look: [1.05, 0.79, -1.32], fov: 40 },
  { t: sh(5) + 1, pos: [1.07, 1.72, -0.8], look: [1.05, 0.79, -1.3], fov: 40, ease: "io" },
]), 1.5, [1.05, 0.79, -1.3]]]);
seq(6, [[S(6), tc(6, [
  { t: 0, pos: [1.3, 1.6, -0.75], look: [1.25, 0.79, -1.3], fov: 42, roll: 0.04 },
  { t: sh(6) + 1, pos: [1.28, 1.5, -0.8], look: [1.25, 0.79, -1.3], fov: 42, roll: -0.02, ease: "io" },
]), 1.5, [1.25, 0.79, -1.3]]]);
seq(7, [[S(7), tc(7, [                                                                                                   // reaction close-up
  { t: 0, pos: [-0.1, 1.48, 1.75], look: [-0.25, 1.38, -0.7], fov: 40 },
  { t: sh(7) + 1, pos: [-0.12, 1.48, 1.6], look: [-0.25, 1.38, -0.7], fov: 40, ease: "lin" },
]), 2.5, [-0.25, 1.45, -0.6]]]);
seq(8, [[S(8), tc(8, [
  { t: 0, pos: [1.6, 1.25, 0.4], look: [1.75, 0.98, -1.35], fov: 40 },
  { t: r(8, L(6, "eighteen")) - 0.05, pos: [1.62, 1.25, 0.3], look: [1.75, 1.0, -1.35], fov: 40, ease: "io" },
  { t: r(8, L(6, "eighteen")) + 0.25, pos: [1.68, 1.25, 0.0], look: [1.76, 1.04, -1.35], fov: 40, ease: "out" },     // the number: fast push
  { t: sh(8) + 1, pos: [1.65, 1.25, 0.15], look: [1.76, 1.03, -1.35], fov: 40, ease: "io" },
]), 2.5, [1.75, 1.05, -1.35]]]);
{
  const t0 = r(9, L(7, "drop")), tp = r(9, L(7, "parachute")) + 0.1, tw = r(9, L(7, "wake")), T = (x: number) => S(9) / FPS + x, y = (x: number) => casY9(T(x));
  seq(9, [[S(9), tc(9, [
    { t: 0, pos: [4.5, 84.6, 8.5], look: [0, 86.6, 0], fov: 50 },
    { t: t0, pos: [4.3, 84.4, 8.2], look: [0, 86.4, 0], fov: 50, ease: "io" },
    { t: tp, pos: [3.6, y(tp) + 0.4, 10.0], look: [0, y(tp) + 1.3, 0], fov: 50, ease: "io" },                          // tilt down with the fall
    { t: tw - 0.1, pos: [3.2, y(tw) + 0.6, 7.8], look: [0, y(tw) + 1.2, 0], fov: 50, ease: "io" },
    { t: tw + 0.3, pos: [1.6, y(tw + 0.3) + 0.2, 5.4], look: [0.2, y(tw + 0.3) + 0.3, 0], fov: 46, ease: "out" },     // in close: the bats wake
    { t: sh(9) + 1, pos: [1.4, y(sh(9) + 1) + 0.2, 5.1], look: [0.2, y(sh(9) + 1) + 0.3, 0], fov: 46, ease: "lin" },
  ]), 1.5, (f: number) => [0, casY9(f / FPS), 0] as V3]]);
}
seq(10, [[S(10), tc(10, [
  { t: 0, pos: [-2.5, 4.6, 13.0], look: [-2.0, 4.2, 1.8], fov: 48 },
  { t: r(10, L(8, "timer")) - 0.1, pos: [1.2, 3.8, 9.6], look: [-0.3, 3.7, 1.8], fov: 46, ease: "io" },              // pan with the bats to the vent
  { t: sh(10) + 1, pos: [1.1, 3.7, 8.8], look: [-0.3, 3.8, 1.8], fov: 46, ease: "io" },
]), 1.5, [0, 3.3, 1.8]]]);
seq(11, [[S(11), tc(11, [
  { t: 0, pos: [0.9, 2.0, 6.4], look: [0.4, 1.9, -1], fov: 50 },
  { t: r(11, L(9, "escaped")) - 0.4, pos: [0.8, 1.8, 5.6], look: [0.3, 1.6, -1], fov: 50, ease: "io" },
  { t: r(11, L(9, "escaped")) + 0.2, pos: [0.4, 1.4, 4.2], look: [0.1, 1.5, 0], fov: 50, ease: "out" },              // the lid pops: fast push
  { t: sh(11) + 1, pos: [0.6, 1.7, 5.2], look: [0.1, 2.2, 0], fov: 52, ease: "io" },                                  // pull out as they fly up
]), 1.5, [0.2, 1.0, 0]]]);
{
  const fb = F(L(10, "barracks")) - 3, ff = F(L(10, "fuel")) - 3;
  seq(12, [
    [S(12), tc(12, [{ t: 0, pos: [-4.5, 2.4, 1.0], look: [-9, 7.5, -12], fov: 48 }, { t: rf(S(12), L(10, "barracks")) + 1, pos: [-4.8, 2.2, 0.0], look: [-9, 8.5, -12], fov: 48, ease: "io" }]), 1.2, [-9, 8.5, -12]],
    [fb, sub2(12, fb, [{ t: 0, pos: [10.5, 2.0, -3.5], look: [7, 2.6, -12.5], fov: 48 }, { t: rf(fb, L(10, "fuel")) + 1, pos: [10.0, 2.0, -4.6], look: [7, 2.8, -12.5], fov: 48, ease: "io" }], "b"), 1.2, [7, 2.6, -12.5]],
    [ff, sub2(12, ff, [{ t: 0, pos: [13.0, 1.3, 1.2], look: [17, 2.6, -7], fov: 48 }, { t: sh(12) + 1, pos: [13.6, 1.2, 0.0], look: [17, 2.4, -7], fov: 48, ease: "io" }], "c"), 1.2, [17, 2.4, -7]],
  ]);
}
seq(13, [[S(13), tc(13, [
  { t: 0, pos: [24, 3.5, 7.0], look: [2, 6.5, -14], fov: 58 },
  { t: sh(13) + 1, pos: [25.5, 3.8, 8.2], look: [2, 6.8, -14], fov: 60, ease: "io" },                               // slow pull out on the blaze
]), 1, [1, 4, -10]]]);
seq(14, [[S(14), tc(14, [                                                                                                // reaction close-up, beat of silence
  { t: 0, pos: [0.4, 1.75, 3.6], look: [-1.4, 1.75, 0.9], fov: 40 },
  { t: sh(14) + 1, pos: [0.35, 1.75, 3.5], look: [-1.4, 1.75, 0.9], fov: 40, ease: "lin" },
]), 2.5, [-1.4, 1.55, 0.9]]]);
seq(15, [[S(15), tc(15, [
  { t: 0, pos: [1.6, 1.9, 10.5], look: [2.7, 1.5, 3.2], fov: 46 },
  { t: r(15, L(12, "ten")) - 0.05, pos: [1.8, 1.9, 10.0], look: [2.8, 1.5, 3.2], fov: 46, ease: "io" },
  { t: r(15, L(12, "ten")) + 0.28, pos: [2.9, 1.9, 8.0], look: [3.3, 1.45, 3.3], fov: 46, ease: "out" },             // the x10: fast push
  { t: sh(15) + 1, pos: [2.7, 1.9, 8.4], look: [3.2, 1.45, 3.3], fov: 46, ease: "io" },
]), 1.8, [3.3, 1.6, 3.2]]]);
seq(16, [[S(16), tc(16, [
  { t: 0, pos: [1.25, 1.55, 1.0], look: [1.25, 1.05, -1.6], fov: 44 },
  { t: r(16, L(13, "cancelled")) - 0.05, pos: [1.25, 1.55, 0.8], look: [1.25, 1.0, -1.6], fov: 44, ease: "io" },
  { t: r(16, L(13, "cancelled")) + 0.25, pos: [1.3, 1.6, 0.1], look: [1.35, 0.85, -1.4], fov: 44, ease: "out" },     // the stamp: fast push
  { t: sh(16) + 1, pos: [1.25, 1.6, 0.6], look: [1.3, 1.0, -1.6], fov: 44, ease: "io" },
]), 2, [1.3, 0.95, -1.4]]]);
seq(17, [
  [S(17), tc(17, [
    { t: 0, pos: [0.3, 80.0, 4.6], look: [0, 79.9, 2.0], fov: 46 },
    { t: sh(17) + 1, pos: [0.1, 80.0, 4.3], look: [0, 79.9, 2.0], fov: 46, ease: "io" },
  ]), 2, [0, 79.9, 2]],
  [W(14, "bats"), HOOK(W(14, "bats")), 2, [0, 80.2, 1.2]],
]);
KICKS.push([at(0, "bats"), 0.05], [at(11, "burned"), 0.07], [at(13, "cancelled"), 0.04]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
