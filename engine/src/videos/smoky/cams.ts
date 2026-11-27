// Camera keys and lens blur per shot for the Smoky short (9:16) (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { tcam } from "./theatre";
import { SEC } from "./sets";
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
// geography (sets.ts): FIELD the culvert runs along z under the taxiway (z -3..3); near mouth MOUTH (0, 0.11, 3.7) with
// the headwall stencils "70 FT" (-0.48, 0.24, 3.31) / "8 IN" (0.5, 0.24, 3.31), the crate with the "4 LBS" tag at
// (1.2, 0, 3.75); far mouth FAR (0, 0.11, -3.7). JUNGLE foxhole HOLE (0.4, 0, 0.6), poker crate (2.3, -0.5).
// PIPE interior (x4 scale) along z, radius 0.42; bright mouth at z -8.
// Camera rule (learned 2026-11-23): the camera moves only on a story event. Gentle push / pan / pull (0.6-1.5 s,
// ease-in-out) for transitions; a fast push (~0.28 s, ease-out) only for a reveal or a key number, then pull out or pan.
const HOOK_POS: V3 = [0.0, 1.0, 8.7], HOOK_LOOK: V3 = [0.0, 0.55, 3.6];
const HOOK = (f0: number) => STILL(HOOK_POS, HOOK_LOOK, f0, 50);
const BL = 4;
const L = (line: number, w: string, n = 0) => (n ? atN(line, w, n) : at(line, w));
const r = (id: number, t: number) => t - S(id) / FPS; // narration time -> seconds into shot id
type TK = Parameters<typeof tcam>[2][number];
const tc = (id: number, keys: TK[]) => tcam("s" + id, S(id), keys);
const sh = (id: number) => r(id, SHOTS[id - 1].b / FPS); // shot length in s
void CR; void D; void HOOK_POS; void W; void BL;

seq(1, [[S(1), tc(1, [
  { t: 0, pos: HOOK_POS, look: HOOK_LOOK, fov: 50 },
  { t: r(1, L(0, "four")) - 0.05, pos: HOOK_POS, look: HOOK_LOOK, fov: 50, ease: "lin" },
  { t: r(1, L(0, "four")) + 0.25, pos: [1.0, 0.55, 5.4], look: [1.2, 0.22, 4.0], fov: 46, ease: "out" },   // key number: fast push
  { t: sh(1) + 1, pos: [0.95, 0.56, 5.3], look: [1.2, 0.22, 4.0], fov: 46, ease: "lin" },
]), 1.5, [1.2, 0.3, 4.0]]]);
seq(2, [[S(2), tc(2, [
  { t: 0, pos: [1.9, 0.95, 6.6], look: [1.2, 0.6, 3.8], fov: 46 },
  { t: 0.28, pos: [1.5, 0.72, 5.0], look: [1.2, 0.62, 3.8], fov: 44, ease: "out" },                      // reveal: fast push
  { t: Math.max(0.6, r(2, L(0, "yorkshire")) - 0.1), pos: [1.5, 0.72, 4.98], look: [1.2, 0.62, 3.8], fov: 44, ease: "lin" },
  { t: Math.max(1.6, r(2, L(0, "yorkshire")) + 1.1), pos: [1.9, 0.85, 5.8], look: [1.25, 0.6, 3.8], fov: 44, ease: "io" }, // then pull out
]), 2, [1.2, 0.6, 3.8]]]);
seq(3, [[S(3), tc(3, [
  { t: 0, pos: [-0.9, 0.42, 3.1], look: [-1.1, 0.3, 0.9], fov: 46 },
  { t: 1.6, pos: [0.0, 0.45, 2.9], look: [0.2, 0.3, 0.9], fov: 46, ease: "io" },                          // pan with her trot
  { t: sh(3) + 1, pos: [0.05, 0.45, 2.85], look: [0.2, 0.3, 0.9], fov: 46, ease: "lin" },
]), 2, [0.2, 0.3, 0.9]]]);
seq(4, [[S(4), tc(4, [
  { t: 0, pos: [-0.8, 1.6, 4.4], look: [1.2, 0.7, 0.4], fov: 46 },
  { t: r(4, L(1, "found")) - 0.1, pos: [-0.75, 1.58, 4.3], look: [1.2, 0.7, 0.4], fov: 46, ease: "lin" },
  { t: r(4, L(1, "found")) + 1.0, pos: [0.1, 0.9, 2.5], look: [0.5, 0.3, 0.6], fov: 44, ease: "io" },        // push to the foxhole
  { t: sh(4) + 1, pos: [0.12, 0.88, 2.42], look: [0.5, 0.3, 0.6], fov: 44, ease: "lin" },
]), 2.5, [0.4, 0.25, 0.55]]]);
seq(5, [[S(5), tc(5, [
  { t: 0, pos: [0.6, 1.5, 4.4], look: [1.0, 0.85, 0.3], fov: 46 },
  { t: r(5, L(2, "two")) - 0.05, pos: [0.62, 1.48, 4.3], look: [1.0, 0.85, 0.3], fov: 46, ease: "lin" },
  { t: r(5, L(2, "two")) + 0.25, pos: [1.75, 1.05, 1.5], look: [1.95, 0.85, -0.05], fov: 42, ease: "out" }, // key number
  { t: r(5, L(2, "two")) + 1.4, pos: [1.9, 1.3, 2.6], look: [2.6, 1.1, 0.1], fov: 44, ease: "io" },      // then pan to Downey
  { t: sh(5) + 1, pos: [1.88, 1.3, 2.62], look: [2.6, 1.1, 0.1], fov: 44, ease: "lin" },
]), 2.5, [1.95, 0.85, -0.05]]]);
seq(6, [[S(6), tc(6, [                                                                                       // reaction close-up, still: the joke lands
  { t: 0, pos: [-0.35, 0.36, 2.6], look: [-0.6, 0.3, 1.3], fov: 40 },
  { t: sh(6) + 1, pos: [-0.36, 0.36, 2.55], look: [-0.6, 0.3, 1.3], fov: 40, ease: "lin" },
]), 3, [-0.7, 0.3, 1.3]]]);
const BX = (f: number) => -1.6 + 0.9 * (f / FPS - S(7) / FPS);
seq(7, [[S(7), (f: number): Shot => { const x = BX(f); return { pos: [x + 0.9, 1.35, 3.3], look: [x - 0.1, 1.1, 0.5], fov: 46, roll: 0 }; }, 2,
  (f: number) => [BX(f) - 0.2, 1.2, 0.45] as V3]]);
seq(8, [[S(8), tc(8, [
  { t: 0, pos: [7, 6, 16], look: [0, 0.8, 0], fov: 48 },
  { t: 2.0, pos: [1.6, 1.4, 8.2], look: [0, 0.6, 4.2], fov: 46, ease: "io" },                                 // crane down into the problem
  { t: sh(8) + 1, pos: [1.55, 1.38, 8.0], look: [0, 0.6, 4.2], fov: 46, ease: "lin" },
]), 1.5, [0, 0.6, 4.4]]]);
seq(9, [[S(9), tc(9, [
  { t: 0, pos: [0.0, 0.5, 5.6], look: [0, 0.2, 3.3], fov: 46 },
  { t: r(9, L(5, "70foot")) - 0.05, pos: [0.0, 0.48, 5.4], look: [0, 0.2, 3.3], fov: 46, ease: "lin" },
  { t: r(9, L(5, "70foot")) + 0.25, pos: [-0.45, 0.3, 4.2], look: [-0.48, 0.24, 3.31], fov: 42, ease: "out" },   // key number
  { t: r(9, L(5, "eight")) - 0.1, pos: [-0.43, 0.3, 4.22], look: [-0.48, 0.24, 3.31], fov: 42, ease: "lin" },
  { t: r(9, L(5, "eight")) + 0.5, pos: [0.45, 0.3, 4.2], look: [0.5, 0.24, 3.31], fov: 42, ease: "io" },       // pan to 8 IN
  { t: sh(9) + 1, pos: [0.47, 0.3, 4.15], look: [0.5, 0.24, 3.31], fov: 42, ease: "lin" },
]), 2, [0, 0.24, 3.31]]]);
seq(10, [
  [S(10), tc(10, [
  { t: 0, pos: [-1.5, 1.4, 9.0], look: [-2.85, 1.15, 5.6], fov: 46 },
  { t: r(10, L(6, "three")) - 0.05, pos: [-1.55, 1.38, 8.8], look: [-2.85, 1.15, 5.6], fov: 46, ease: "lin" },
  { t: r(10, L(6, "three")) + 0.9, pos: [-2.2, 1.3, 8.0], look: [-2.85, 1.2, 5.6], fov: 44, ease: "io" },
  { t: sh(10) + 1, pos: [-2.25, 1.3, 7.9], look: [-2.85, 1.2, 5.6], fov: 44, ease: "lin" },
]), 1.5, [-2.7, 1.2, 5.6]],
  [W(6, "out"), tcam("s10b", S(10), [                                                                                      // cut: the ranks out in the open
    { t: r(10, W(6, "out") / FPS), pos: [3.2, 3.4, 8.4], look: [0, 0.9, -0.2], fov: 48 },
    { t: r(10, L(6, "enemy")) - 0.1, pos: [3.0, 3.3, 8.0], look: [0, 0.9, -0.2], fov: 48, ease: "lin" },
    { t: r(10, L(6, "enemy")) + 1.0, pos: [1.4, 4.6, 11.5], look: [-1.0, 2.5, -25], fov: 50, ease: "io" },    // pull up: the bombs beyond
    { t: sh(10) + 1, pos: [1.38, 4.62, 11.6], look: [-1.0, 2.5, -25], fov: 50, ease: "lin" },
  ]), 1, [0, 1.0, 0]],
]);
seq(11, [[S(11), tc(11, [
  { t: 0, pos: [1.9, 0.5, 4.3], look: [0, 0.22, 3.75], fov: 44 },
  { t: r(11, L(7, "tied")) - 0.05, pos: [1.85, 0.5, 4.3], look: [0, 0.22, 3.75], fov: 44, ease: "lin" },
  { t: r(11, L(7, "tied")) + 0.9, pos: [1.1, 0.35, 4.2], look: [0.05, 0.25, 3.8], fov: 42, ease: "io" },
  { t: sh(11) + 1, pos: [1.08, 0.35, 4.2], look: [0.05, 0.25, 3.8], fov: 42, ease: "lin" },
]), 2.5, [0.05, 0.25, 4.1]]]);
seq(12, [[S(12), tc(12, [
  { t: 0, pos: [-2.6, 1.2, -8.0], look: [0.5, 0.5, -3.9], fov: 46 },
  { t: 1.2, pos: [-2.2, 1.0, -7.4], look: [0.5, 0.5, -3.9], fov: 46, ease: "io" },
  { t: sh(12) + 1, pos: [-2.18, 1.0, -7.36], look: [0.5, 0.5, -3.9], fov: 46, ease: "lin" },
]), 2, [0.6, 0.5, -4.2]]]);
const crawl = (f0: number) => tcam("crawl" + f0, S(13), [                                                // she crawls at us; the camera backs away
  { t: 0, pos: [0.05, 0.4, -1.5], look: [0, 0.32, 3.0], fov: 52 },
  { t: sh(13) + 0.5, pos: [0.0, 0.38, -4.6], look: [0, 0.32, -1.0], fov: 52, ease: "io" },
]);
const SECF = W(8, "half"), SECB = W(8, "squeeze");
seq(13, [
  [S(13), crawl(S(13)), 2, (f: number) => [0, 0.3, 3.0 - 0.9 * (f - S(13)) / FPS] as V3],
  [SECF, tc(13, [                                                                                            // blueprint insert builds with the words
    { t: r(13, SECF / FPS), pos: [SEC[0], SEC[1] + 0.04, 1.25], look: [SEC[0], SEC[1] + 0.02, 0], fov: 46 },
    { t: r(13, SECB / FPS), pos: [SEC[0] + 0.03, SEC[1] + 0.03, 1.1], look: [SEC[0], SEC[1] + 0.02, 0], fov: 46, ease: "io" },
  ]), 0, [SEC[0], SEC[1], 0]],
  [SECB, crawl(S(13)), 2, (f: number) => [0, 0.3, 3.0 - 0.9 * (f - S(13)) / FPS] as V3],
]);
seq(14, [[S(14), tc(14, [
  { t: 0, pos: [0.25, 0.45, -5.8], look: [0, 0.2, -3.8], fov: 46 },
  { t: r(14, L(9, "popped")) - 0.05, pos: [0.25, 0.44, -5.7], look: [0, 0.2, -3.8], fov: 46, ease: "lin" },
  { t: r(14, L(9, "popped")) + 0.25, pos: [0.12, 0.34, -5.1], look: [0, 0.24, -3.9], fov: 44, ease: "out" },  // reveal
  { t: r(14, L(9, "wire")) - 0.1, pos: [0.12, 0.34, -5.07], look: [0, 0.24, -3.9], fov: 44, ease: "lin" },
  { t: r(14, L(9, "wire")) + 1.0, pos: [0.6, 0.75, -6.2], look: [-0.3, 0.45, -4.0], fov: 46, ease: "io" },     // pull out: Bill
  { t: sh(14) + 1, pos: [0.62, 0.76, -6.25], look: [-0.3, 0.45, -4.0], fov: 46, ease: "lin" },
]), 2, [0, 0.25, -4.0]]]);
seq(15, [[S(15), tc(15, [
  { t: 0, pos: [0.4, 1.3, 8.6], look: [0.6, 0.8, 4.4], fov: 48 },
  { t: 1.2, pos: [0.6, 1.1, 7.4], look: [0.7, 0.75, 4.2], fov: 46, ease: "io" },
  { t: sh(15) + 1, pos: [0.61, 1.1, 7.35], look: [0.7, 0.75, 4.2], fov: 46, ease: "lin" },
]), 1.5, [0.7, 0.7, 4.2]]]);
seq(16, [[S(16), tc(16, [                                                                                    // reaction close-up: dog vs sandwich
  { t: 0, pos: [1.25, 0.66, 5.7], look: [1.22, 0.52, 3.76], fov: 38 },
  { t: sh(16) + 1, pos: [1.25, 0.66, 5.62], look: [1.22, 0.52, 3.76], fov: 38, ease: "lin" },
]), 3, [1.22, 0.52, 3.76]]]);
seq(17, [
  [S(17), tc(17, [
    { t: 0, pos: [0.3, 0.45, 5.6], look: [0, 0.25, 4.0], fov: 44 },
    { t: 1.0, pos: [0.33, 0.6, 6.4], look: [0.1, 0.3, 4.0], fov: 46, ease: "io" },
    { t: sh(17) + 1, pos: [0.34, 0.62, 6.5], look: [0.1, 0.3, 4.0], fov: 46, ease: "lin" },
  ]), 2, [0, 0.25, 4.2]],
  [W(11, "your"), HOOK(W(11, "your")), 1.5, [1.2, 0.3, 4.0]],
]);
KICKS.push([at(10, "minutes"), 0.05]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
