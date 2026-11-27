// Camera keys and lens blur per shot for the Lawnchair Larry short (9:16) (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { tcam } from "./theatre";
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
// geography (sets.ts): SKY chair at the origin (seat y 0.45, Larry's head ~1.3, balloons 2.7..8), airliner behind at z -50,
// clouds 260 m down; COCKPIT crew at x -+0.62 z -0.15 facing +z, windscreen posts at z 1.0, the chair 42 m out; YARD chair at
// the origin, Larry stands at (-0.2, 0.4), Jeep (3.4, -1.8), house wall z -7; STREET chair hangs at (0.8, 4.4, -2.4) under
// the wires (7.2 m), police car (4.6, 2.2), cops (3.0, -0.6) and (4.3, 0.2).
const HOOK_POS: V3 = [0.9, 1.1, 5.0], HOOK_LOOK: V3 = [0.0, 1.55, 0];
const HOOK = (f0: number) => M(HOOK_POS, HOOK_LOOK, f0, { fov: 46, orbit: 0, push: 0, keep: true, drift: 0 });
const BL = 4; // strong lens blur for depth
const L = (line: number, w: string, n = 0) => (n ? atN(line, w, n) : at(line, w));

seq(1, [[S(1), HOOK(S(1)), BL, [0, 1.0, 0.1]]]);
seq(2, [
  [S(2), D([0.25, 1.25, 4.0], [0, 1.3, -0.2], S(2), { fov: 44, dx: -0.25 }), BL, [0, 1.2, -0.15]],
  [W(0, "insane."), D([0.0, 1.3, 0.45], [3.5, 2.6, 42], W(0, "insane."), { fov: 34, dx: 0.1 }), 2, [3.5, 1.7, 42]],
]);
seq(3, [
  [S(3), D([0.55, 0.95, 3.4], [0, 1.0, 0], S(3), { fov: 40, dx: -0.3 }), BL, [0, 1.0, 0.1]],
  [W(0, "in", 1), D([-0.9, 0.45, 3.3], [0, 1.15, 0], W(0, "in", 1), { fov: 48, dx: 0.3 }), BL, [0, 1.0, 0.1]],
]);
const R16 = Math.max(0.3, (F(at(0, "16000")) - S(4)) / FPS);
seq(4, [[S(4), tcam("reveal", S(4), [
  { t: 0, pos: [0.4, 1.0, 3.6], look: [0, 1.1, 0], fov: 40 },
  { t: R16 - 0.15, pos: [0.35, 1.05, 3.2], look: [0, 1.1, 0], fov: 40, ease: "antic" },
  { t: R16 + 1.4, pos: [9, 7, 26], look: [0, -1.5, 0], fov: 50, ease: "out" },
  { t: R16 + 5, pos: [9.6, 7.2, 27.5], look: [0, -1.8, 0], fov: 50, ease: "lin" },
]), 2, [0, 1, 0]],
  [F(at(0, "feet.") + 0.55), D([0.6, -2.6, 2.2], [0, 3.2, 0], F(at(0, "feet.") + 0.55), { fov: 62, dx: 0.3 }), 2, [0, 1.0, 0]],
]);
seq(5, [[S(5), D([1.2, 1.55, 5.6], [-0.2, 1.4, 0.2], S(5), { fov: 40, dx: -0.5 }), BL, [-0.2, 1.3, 0.4], -1]]);
seq(6, [[S(6), D([0.7, 1.6, 3.9], [0.15, 1.5, 0.4], S(6), { fov: 40, dx: 0.3 }), BL, [-0.1, 1.4, 0.4], 1]]);
seq(7, [[S(7), D([0.3, 1.3, 4.8], [-0.45, 1.0, 0.3], S(7), { fov: 42, dx: 0.4 }), BL, [-0.2, 0.9, 0.3], -1]]);
seq(8, [[S(8), CR([1.6, 0.5, 9.5], [1.8, 1.2, 11.5], [-0.3, 3.8, 0], S(8), 70, 52), BL, [0, 3, 0]]]);
seq(9, [[S(9), D([2.6, 1.4, 6.8], [0.6, 2.4, 0], S(9), { fov: 46, dx: -0.4 }), BL, [1.0, 1.6, 0.5], 1]]);
seq(10, [[S(10), D([0.15, 1.3, 4.6], [0, 1.4, 0.3], S(10), { fov: 44, dx: 0.15 }), BL, [0, 1.0, 0.3]]]);
seq(11, [[S(11), D([-0.6, 1.0, 3.3], [0, 1.15, 0.3], S(11), { fov: 42, dx: -0.3 }), BL, [0, 1.0, 0.3]]]);
seq(12, [[S(12), D([0.7, 1.3, 4.1], [0, 1.35, 0.3], S(12), { fov: 42, dx: 0.3 }), BL, [0, 1.2, 0.4]]]);
seq(13, [[S(13), D([2.0, 1.2, 4.9], [0.55, 0.65, -0.5], S(13), { fov: 46, dx: 0.2 }), BL, [0.8, 0.5, -0.5]]]);
seq(14, [[S(14), tcam("launch", S(14), [
  { t: 0, pos: [0.5, 1.1, 5.8], look: [0, 1.4, 0], fov: 46 },
  { t: Math.max(0.2, (F(L(5, "launched!")) - S(14)) / FPS - 0.1), pos: [0.5, 0.9, 6.0], look: [0, 1.2, 0], fov: 46, ease: "antic" },
  { t: Math.max(0.2, (F(L(5, "launched!")) - S(14)) / FPS) + 0.4, pos: [0.7, 0.7, 6.6], look: [0, 2.6, 0], fov: 52, ease: "io" },
  { t: Math.max(0.2, (F(L(5, "launched!")) - S(14)) / FPS) + 1.3, pos: [0.8, 0.4, 7.6], look: [0, 11.5, 0], fov: 56, ease: "in" },
  { t: Math.max(0.2, (F(L(5, "launched!")) - S(14)) / FPS) + 3, pos: [0.8, 0.4, 7.6], look: [0, 30, 0], fov: 56, ease: "lin" },
]), BL, (f: number) => [0, Math.min(14, 1 + 6 * Math.max(0, (f - F(L(5, "launched!"))) / FPS) ** 1.3), 0] as V3]]);
seq(15, [[S(15), D([-5, 4.5, 17], [0, 2.2, 0], S(15), { fov: 40, dx: 0.6, still: false }), 2, [0, 1.5, 0]]]);
seq(16, [[S(16), D([4.2, 2.4, 10.5], [-0.9, 2.2, -4], S(16), { fov: 46, dx: -0.6 }), 2, [0, 1.5, 0]]]);
seq(17, [
  [S(17), D([-0.3, 1.35, 3.2], [-0.62, 1.2, -0.15], S(17), { fov: 42, dx: 0.15 }), BL, [-0.62, 1.15, -0.15]],
  [W(6, "delta"), D([0.4, 1.35, 3.2], [0.62, 1.2, -0.15], W(6, "delta"), { fov: 42, dx: -0.15 }), BL, [0.62, 1.15, -0.15]],
  [W(6, "both"), D([0.1, 1.4, 4.0], [0, 1.2, -0.15], W(6, "both"), { fov: 46, dx: 0.2 }), BL, [0, 1.2, -0.15]],
]);
seq(18, [
  [S(18), D([0.9, 0.7, 4.2], [0, 1.3, 0], S(18), { fov: 54, dx: -0.4 }), BL, [0, 1.2, 0.2]],
  [W(7, "one"), D([-0.8, 1.2, 3.0], [0, 1.2, 0], W(7, "one"), { fov: 48, dx: 0.3 }), BL, [0, 1.2, 0.2]],
]);
seq(19, [[S(19), tcam("drop", S(19), [
  { t: 0, pos: [0.7, 1.0, 3.4], look: [0.1, 1.2, 0], fov: 44 },
  { t: Math.max(0.15, (F(L(7, "dropped")) - S(19)) / FPS), pos: [0.7, 1.05, 3.4], look: [0.2, 1.15, 0], fov: 44, ease: "io" },
  { t: Math.max(0.15, (F(L(7, "dropped")) - S(19)) / FPS) + 0.9, pos: [1.2, 0.3, 4.6], look: [0.4, 0.2, 0.3], fov: 54, ease: "out" },
  { t: Math.max(0.15, (F(L(7, "dropped")) - S(19)) / FPS) + 3, pos: [1.25, 0.25, 4.7], look: [0.4, 0.1, 0.3], fov: 54, ease: "lin" },
]), 2, [0.2, 1.0, 0.2]]]);
seq(20, [[S(20), tcam("descend", S(20), [
  { t: 0, pos: [5.6, 6.5, 10], look: [3.5, 12.5, -2.4], fov: 46 },
  { t: Math.max(0.3, (F(L(8, "power")) - S(20)) / FPS), pos: [5.9, 3.4, 10.5], look: [3.5, 5.8, -2.4], fov: 46, ease: "io" },
  { t: Math.max(0.3, (F(L(8, "power")) - S(20)) / FPS) + 0.5, pos: [5.7, 3.6, 10.2], look: [3.5, 6.0, -2.4], fov: 46, ease: "back" },
  { t: Math.max(0.3, (F(L(8, "power")) - S(20)) / FPS) + 4, pos: [5.5, 3.7, 9.8], look: [3.5, 6.0, -2.4], fov: 46, ease: "lin" },
]), BL, [3.5, 5.5, -2.4]]]);
seq(21, [[S(21), D([4.0, 2.4, 9.2], [3.5, 3.0, -1.5], S(21), { fov: 52, dx: -0.5 }), BL, [3.5, 2.5, -0.5]]]);
seq(22, [[S(22), D([1.3, 1.1, 4.4], [0, 1.45, 0], S(22), { fov: 42, dx: -0.4 }), BL, [0, 1.0, 0.1]]]);
seq(23, [
  [S(23), D([-1.2, 1.1, 5.2], [0, 1.4, 0], S(23), { fov: 44, dx: 0.4 }), BL, [0, 1.0, 0.1]],
  [W(11, "all"), HOOK(W(11, "all")), BL, [0, 1.0, 0.1]],
]);
KICKS.push([at(5, "launched!"), 0.1], [at(8, "power"), 0.1], [at(7, "dropped"), 0.06]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
