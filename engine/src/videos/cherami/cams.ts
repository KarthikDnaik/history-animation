// Camera keys and lens blur per shot for the Cher Ami short (9:16) (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { tcam } from "./theatre";
import { climbAt, fallAt } from "./sets";
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
// geography (sets.ts): FOREST funk holes HOLES around the origin (men sunk to y -0.62), the basket BASK (0.45, 0, 3.1) lid
// at y 0.42, the major WH (-0.35, 0, 3.6), the note insert NOTEP (-0.4, 0.4, 3.16), the bird's climb climbAt(), the ridge
// guns GUNS at z ~-14.5, the crash spot GR (1.6, 0, 4.6). SKY: the bird holds at FLY (0, 60, 0) flying at +z, land streams
// under her. LOFT: the wall map MAPB (-2.6, 1.6, 1.43), the medics' table TBL (1.6, 0.86, 2.2). MUSEUM: the case CASE
// (0, 1.05, 0), the record card REC (-0.62, 1.15, 0.1), the DNA monitor (1.22, 1.4, -0.6).
// Camera rule (learned 2026-11-23): the camera moves only on a story event. Gentle push / pan / pull (0.6-1.5 s,
// ease-in-out) for transitions; a fast push (~0.28 s, ease-out) only for a reveal or a key number, then pull out or pan.
const HOOK_POS: V3 = [0.75, 1.3, 6.6], HOOK_LOOK: V3 = [0.15, 0.62, 1.8];
const HOOK = (f0: number) => STILL(HOOK_POS, HOOK_LOOK, f0, 50);
const L = (line: number, w: string, n = 0) => (n ? atN(line, w, n) : at(line, w));
const r = (id: number, t: number) => t - S(id) / FPS; // narration time -> seconds into shot id
type TK = Parameters<typeof tcam>[2][number];
const tc = (id: number, keys: TK[], name = "") => tcam("s" + id + name, S(id), keys);
const sh = (id: number) => r(id, SHOTS[id - 1].b / FPS); // shot length in s
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
/** follow cam: fixed position (or path), look eased toward a moving target */
const follow = (pos: (t: number) => V3, look: (t: number) => V3, fov: number) => (f: number): Shot => ({ pos: pos(f / FPS), look: look(f / FPS), fov, roll: 0 });
void CR; void D; void W;

seq(1, [[S(1), tc(1, [
  { t: 0, pos: HOOK_POS, look: HOOK_LOOK, fov: 50 },
  { t: r(1, L(0, "194")) - 0.05, pos: HOOK_POS, look: HOOK_LOOK, fov: 50, ease: "lin" },
  { t: r(1, L(0, "194")) + 0.28, pos: [0.3, 1.35, 5.6], look: [-0.2, 0.75, 1.2], fov: 46, ease: "out" },          // key number: fast push
  { t: r(1, L(0, "forest")) + 0.8, pos: [1.1, 1.6, 6.4], look: [-0.1, 0.8, 0.6], fov: 48, ease: "io" },              // then pan/pull: the forest
  { t: sh(1) + 1, pos: [1.12, 1.6, 6.42], look: [-0.1, 0.8, 0.6], fov: 48, ease: "lin" },
]), 1.5, [0, 0.8, 1.2]]]);
seq(2, [[S(2), tc(2, [
  { t: 0, pos: [2.6, 0.9, 5.4], look: [-0.8, 1.0, -2.2], fov: 50 },
  { t: sh(2) + 1, pos: [2.2, 0.85, 4.8], look: [-0.8, 1.0, -2.2], fov: 50, ease: "io" },
]), 1.5, [-0.4, 0.9, 0]]]);
seq(3, [[S(3), tc(3, [
  { t: 0, pos: [-1.4, 1.4, 6.8], look: [0.0, 0.8, 1.6], fov: 48 },
  { t: 0.3, pos: [-1.38, 1.4, 6.78], look: [0.0, 0.8, 1.6], fov: 48, ease: "lin" },
  { t: Math.max(1.2, sh(3)), pos: [0.0, 0.95, 5.2], look: [0.4, 0.5, 3.1], fov: 44, ease: "io" },                     // drift toward the basket
]), 2, [0.45, 0.5, 3.1]]]);
seq(4, [[S(4), tc(4, [                                                                                               // reaction close-up
  { t: 0, pos: [0.72, 0.78, 4.25], look: [0.45, 0.66, 3.1], fov: 38 },
  { t: sh(4) + 1, pos: [0.71, 0.78, 4.2], look: [0.45, 0.66, 3.1], fov: 38, ease: "lin" },
]), 3, [0.45, 0.66, 3.1]]]);
seq(5, [[S(5), tc(5, [
  { t: 0, pos: [0.9, 0.7, 6.0], look: [0.0, 2.2, 0.6], fov: 54 },
  { t: r(5, L(2, "sent")) + 1.2, pos: [0.9, 0.7, 6.0], look: [0.5, 4.6, -0.2], fov: 54, ease: "io" },                // tilt up with the birds
  { t: r(5, L(2, "shot")) + 1.0, pos: [0.9, 0.75, 6.0], look: [0.6, 2.4, -0.2], fov: 54, ease: "io" },               // and down as they drop
  { t: sh(5) + 1, pos: [0.9, 0.75, 6.0], look: [0.6, 2.3, -0.2], fov: 54, ease: "lin" },
]), 1.5, [0.3, 3, 0]]]);
seq(6, [[S(6), tc(6, [
  { t: 0, pos: [0.05, 1.45, 7.1], look: [0.0, 1.4, 3.4], fov: 46 },
  { t: r(6, L(3, "cher")) - 0.05, pos: [0.05, 1.45, 7.0], look: [0.0, 1.4, 3.4], fov: 46, ease: "lin" },
  { t: r(6, L(3, "cher")) + 1.0, pos: [0.0, 1.42, 6.5], look: [0.0, 1.42, 3.4], fov: 46, ease: "io" },
  { t: sh(6) + 1, pos: [0.0, 1.42, 6.45], look: [0.0, 1.42, 3.4], fov: 46, ease: "lin" },
]), 2.5, [0.07, 1.4, 3.7]]]);
seq(7, [[S(7), tc(7, [
  { t: 0, pos: [1.0, 1.05, 5.6], look: [-0.35, 0.75, 3.6], fov: 44 },
  { t: sh(7) + 1, pos: [0.8, 0.95, 5.1], look: [-0.35, 0.72, 3.6], fov: 44, ease: "io" },
]), 2.5, [-0.35, 0.75, 3.6]]]);
seq(8, [[S(8), (f: number): Shot => {                                                                                 // the note: the camera reads down the lines
  const a = L(4, "our") - 1.2, b = L(4, "it.") + 0.1, u = Math.max(0, Math.min(1, (f / FPS - a) / (b - a))), y = 0.55 - 0.25 * u;
  return { pos: [-0.4, y + 0.02, 3.16 + 1.15], look: [-0.4, y, 3.16], fov: 42, roll: 0 };
}, 0, [-0.4, 0.4, 3.16]]]);
const TO = () => L(5, "took");
const climb = (t: number): V3 => climbAt(t, TO());
const lagLook = (t: number): V3 => { const p = climb(t - 0.12); return [p[0], p[1] + 0.2, p[2]]; };
const chase = (p: V3, k = 1): V3 => [p[0] + 1.3 * k, p[1] - 0.5 * k, p[2] + 2.6 * k];
seq(9, [[S(9), follow((t) => (t < TO() + 0.4 ? [1.7, 1.05, 6.6] : lerp3([1.7, 1.05, 6.6], chase(climb(t - 0.15)), Math.min(1, (t - TO() - 0.4) / 0.8))), (t) => (t < TO() ? [-0.1, 1.35, 3.5] : lagLook(t)), 48), 2, (f: number) => climb(f / FPS)]]);
const HITT = () => L(6, "bullet") + 0.35;
const fallP = (t: number): V3 => { const p = fallAt(t, HITT(), climb(HITT())); return [p[0], Math.max(0.2, p[1]), p[2]]; };
seq(10, [[S(10), follow((t) => { const p = climb(t - 0.15); return [p[0] - 1.6, p[1] - 1.4, p[2] + 2.4]; }, (t) => lagLook(t), 52), 1, (f: number) => climb(f / FPS)]]);
seq(11, [[S(11), follow((t) => { const p = t < HITT() ? climb(t - 0.15) : fallP(t - 0.2); return [p[0] + 1.4, Math.max(0.8, p[1] + 0.3), p[2] + 2.8]; }, (t) => (t < HITT() ? lagLook(t) : fallP(t - 0.06)), 50), 1, (f: number) => (f / FPS < HITT() ? climb(f / FPS) : fallP(f / FPS))]]);
seq(12, [[S(12), tc(12, [
  { t: 0, pos: [2.35, 0.28, 5.7], look: [1.6, 0.16, 4.6], fov: 40 },
  { t: r(12, L(7, "up")) - 0.1, pos: [2.3, 0.27, 5.62], look: [1.6, 0.16, 4.6], fov: 40, ease: "lin" },
  { t: r(12, L(7, "up")) + 1.1, pos: [2.6, 0.5, 6.4], look: [2.1, 2.6, 4.0], fov: 46, ease: "io" },                   // tilt up as she lifts off
  { t: sh(12) + 1, pos: [2.6, 0.5, 6.42], look: [2.1, 2.7, 4.0], fov: 46, ease: "lin" },
]), 2.5, [1.6, 0.2, 4.6]]]);
seq(13, [[S(13), tc(13, [                                                                                              // head-on, the land streaming under
  { t: 0, pos: [0.4, 25.2, 3.6], look: [0, 23.4, 0], fov: 50 },
  { t: r(13, L(8, "tendon")) + 0.6, pos: [-0.6, 25.0, 2.9], look: [0, 23.4, 0], fov: 50, ease: "io" },
  { t: sh(13) + 1, pos: [-0.7, 25.0, 2.85], look: [0, 23.4, 0], fov: 50, ease: "lin" },
]), 1, [0, 24, 0]]]);
seq(14, [[S(14), tc(14, [                                                                                              // the wall map
  { t: 0, pos: [-2.6, 1.6, 4.0], look: [-2.6, 1.6, 1.43], fov: 44 },
  { t: sh(14) + 1, pos: [-2.6, 1.6, 3.8], look: [-2.6, 1.6, 1.43], fov: 44, ease: "io" },
]), 0, [-2.6, 1.6, 1.43]]]);
seq(15, [[S(15), tc(15, [
  { t: 0, pos: [0.3, 1.7, 5.8], look: [0.0, 1.0, -3.0], fov: 50 },
  { t: r(15, L(9, "walked")) - 0.2, pos: [0.3, 1.7, 5.8], look: [0.0, 1.0, -3.0], fov: 50, ease: "lin" },
  { t: sh(15) + 1, pos: [0.4, 1.8, 7.4], look: [0.0, 1.0, -2.2], fov: 50, ease: "io" },                                // pull back ahead of them
]), 1.5, [0, 1, -4]]]);
seq(16, [[S(16), tc(16, [
  { t: 0, pos: [2.2, 1.35, 4.1], look: [1.6, 1.05, 2.2], fov: 44 },
  { t: r(16, L(10, "wooden")) - 0.05, pos: [2.15, 1.32, 4.0], look: [1.6, 1.05, 2.2], fov: 44, ease: "lin" },
  { t: r(16, L(10, "wooden")) + 0.25, pos: [1.85, 1.1, 3.4], look: [1.6, 1.02, 2.2], fov: 40, ease: "out" },          // reveal: fast push to the leg
  { t: r(16, L(10, "wooden")) + 1.4, pos: [1.9, 1.15, 3.2], look: [1.6, 1.0, 2.2], fov: 42, ease: "io" },              // then ease back
  { t: sh(16) + 1, pos: [1.92, 1.16, 3.25], look: [1.6, 1.0, 2.2], fov: 42, ease: "lin" },
]), 2.5, [1.6, 1.0, 2.2]]]);
seq(17, [[S(17), tc(17, [
  { t: 0, pos: [0.3, 1.45, 2.8], look: [-0.2, 1.2, 0.0], fov: 44 },
  { t: r(17, L(11, "girl")) - 0.2, pos: [0.25, 1.42, 2.6], look: [-0.25, 1.2, 0.0], fov: 44, ease: "lin" },
  { t: r(17, L(11, "girl")) + 0.25, pos: [-0.5, 1.2, 1.0], look: [-0.62, 1.15, 0.1], fov: 42, ease: "out" },           // key word: push to HEN
  { t: sh(17) + 1, pos: [-0.5, 1.2, 0.98], look: [-0.62, 1.15, 0.1], fov: 42, ease: "lin" },
]), 2, [-0.62, 1.15, 0.1]]]);
seq(18, [[S(18), tc(18, [
  { t: 0, pos: [0.55, 1.45, 2.4], look: [0.4, 1.3, -0.3], fov: 46 },
  { t: sh(18) + 1, pos: [0.5, 1.4, 2.1], look: [0.4, 1.28, -0.3], fov: 46, ease: "io" },
]), 2, [0.3, 1.2, -0.2]]]);
seq(19, [
  [S(19), tc(19, [
    { t: 0, pos: [0.85, 0.82, 4.7], look: [0.45, 0.6, 3.1], fov: 42 },
    { t: 1.0, pos: [1.0, 1.0, 5.4], look: [0.4, 0.62, 3.0], fov: 44, ease: "io" },
    { t: sh(19) + 1, pos: [1.02, 1.0, 5.45], look: [0.4, 0.62, 3.0], fov: 44, ease: "lin" },
  ]), 2, [0.45, 0.6, 3.1]],
  [W(12, "quits"), HOOK(W(12, "quits")), 1.5, [0, 0.8, 1.2]],
]);
KICKS.push([at(0, "shelling"), 0.06], [at(6, "bullet") + 0.35, 0.05], [at(11, "boy"), 0.05]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
