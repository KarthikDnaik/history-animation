// Camera keys and lens blur per shot for the Bonnie & Clyde short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
// geography (sets.ts): town road along x (z -3..3), storefronts face +z at z = -4.6 (bank x 2..9.4), gas station x 12..17,
// Joplin hideout x 30..38 (front z -5); the hero Ford at (-8, 0.8). Farm: cotton rows z 3..-14, Clyde (0.4, 1.6).
// Road: dirt road along x through pines. Casino: the car on a platform at (0, -3.5).
const HOOK_POS: V3 = [-7.9, 2.0, 8.4], HOOK_LOOK: V3 = [-7.9, 1.95, 0];

// 1 GTA 6 stars a criminal couple... the real-life original was way weirder.   (opens on the frame shot 22 ends on: loop)
seq(1, [[S(1), STILL(HOOK_POS, HOOK_LOOK, S(1), 46), 2, [-7.9, 1.4, 2]]]);
// 2 Meet Bonnie and Clyde.
seq(2, [[S(2), D([-7.6, 1.9, 8.0], [-7.9, 1.85, 1.0], S(2), { fov: 46, dx: -0.3 }), 3, [-7.9, 1.4, 2]]]);
// 3 Texas, 1932. Prison farm.
seq(3, [[S(3), CR([-1, 6, 16], [0.4, 2.4, 9.4], [0.3, 2.2, 0], S(3), 110, 48), 1.5, [0.4, 1.3, 1.6]]]);
// 4 he chops off two of his own toes
seq(4, [[S(4), D([0.9, 2.0, 8.4], [0.6, 2.0, 2.0], S(4), { fov: 46, dx: -0.3 }), 3, [0.4, 1.3, 1.6]]]);
// 5 Six days later, he's released anyway.
seq(5, [[S(5), D([1.6, 1.8, 7.6], [1.4, 1.9, 2.0], S(5), { fov: 46, dx: 0.6 }), 3, [1.6, 1.3, 1.6]]]);
// 6 Bonnie Parker. 4'11". Writes poetry.
seq(6, [[S(6), D([0.2, 1.8, 6.8], [0, 1.85, -1.4], S(6), { fov: 46, dx: -0.3 }), 3, [0, 1.3, -1.3]]]);
// 7 already married
seq(7, [[S(7), D([0.9, 1.7, 5.6], [0.3, 1.7, -1.3], S(7), { fov: 46, dx: 0.3 }), 3, [0.3, 1.3, -1.3]]]);
// 8 Not giant bank vaults.
seq(8, [[S(8), D([5.7, 2.0, 8.0], [5.7, 2.9, -4.6], S(8), { fov: 48, dx: -0.4 }), 1.5, [5.7, 2.5, -4.6]]]);
// 9 shops and gas stations, for a few dollars
seq(9, [[S(9), D([15.2, 2.0, 7.4], [15.3, 2.0, -2.0], S(9), { fov: 48, dx: 0.4 }), 2, [15.2, 1.4, -2]]]);
// 10 the Ford V8
seq(10, [[S(10), D([-6.0, 1.9, 8.2], [-7.2, 1.7, -0.2], S(10), { fov: 46, dx: -0.4 }), 2, [-7.6, 1.0, 1]]]);
// 11 the letter
seq(11, [[S(11), D([-7.7, 2.9, 6.5], [-7.9, 2.95, 1.6], S(11), { fov: 44, dx: 0.2 }), 3, [-8, 2.4, 1.6]]]);
// 12 real or fake?
seq(12, [[S(12), D([-8.1, 2.9, 6.4], [-7.9, 2.95, 1.6], S(12), { fov: 44, dx: -0.2 }), 3, [-8, 2.4, 1.6]]]);
// 13 Joplin 1933: raid, escape, a roll of film
seq(13, [[S(13), CR([34, 4.2, 17], [33, 2.6, 11], [33, 3.2, -3], S(13), 110, 50), 1.5, [32.5, 1.6, -1]]]);
// 14 the photos
seq(14, [[S(14), D([34, 3.0, 5.2], [34, 3.0, -1], S(14), { fov: 44, dx: 0.2 }), 3, [34, 2.7, -1]]]);
// 15 she didn't even smoke cigars
seq(15, [[S(15), D([34.4, 1.8, 5.0], [33.9, 1.9, -1.5], S(15), { fov: 46, dx: -0.3 }), 3, [33.6, 1.4, -1.6]]]);
// 16 But this was no game. 13 murders, 9 police officers.   (night, slow, still)
seq(16, [[S(16), D([0, 2.1, 8.8], [0, 1.9, -2.2], S(16), { fov: 48, dx: 0.2 }), 2, [0, 1.4, -2.2]]]);
// 17 May 1934, Louisiana, ambush
seq(17, [[S(17), CR([-6, 1.6, 10], [-1, 2.4, 8.5], [0, 2.4, -4], S(17), 120, 50), 1.5, [0, 1.4, -4.2]]]);
// 18 more than 130 rounds (the empty road)
seq(18, [[S(18), D([0, 1.8, 8], [0, 2.6, -2], S(18), { fov: 50, dx: -0.3 }), 1.5, [0, 1.5, -2]]]);
// 19 Bonnie was 23. Clyde, 25.
seq(19, [[S(19), D([1.4, 1.7, 7.2], [0, 2.4, -2], S(19), { fov: 50, dx: 0.3 }), 1.5, [0, 1.5, -2]]]);
// 20 on display in a casino near Las Vegas
seq(20, [[S(20), CR([0, 3.2, 7.6], [0, 2.3, 7.0], [0, 1.9, -3], S(20), 100, 50), 2, [0, 1.2, -3.5]]]);
// 21 Yes. Really.   (under the impact card)
seq(21, [[S(21), D([2.4, 1.5, 3.6], [0, 1.2, -3.5], S(21), { fov: 46, dx: -0.3 }), 3, [0, 1.1, -3.5]]]);
// 22 Send this to the friend...   (ends on shot 1)
seq(22, [
  [S(22), D([-6.6, 2.4, 10.5], [-7.9, 1.9, 0], S(22), { fov: 48, dx: -0.4 }), 2, [-7.9, 1.4, 2]],
  [W(9, "calls"), STILL(HOOK_POS, HOOK_LOOK, W(9, "calls"), 46), 2, [-7.9, 1.4, 2]],
]);
KICKS.push([at(1, "chops"), 0.1], [at(4, "again."), 0.08], [at(8, "casino"), 0.1]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
