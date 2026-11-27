// Camera keys and lens blur per shot for the Titanic baker short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
// geography (sets.ts): DECK house wall z -4.5 (x -20..16), hook spot (0.2, 0.4); promenade x 19..34 with the outboard
// rail at z -4.2, lifeboats at x 21.5 / 32.5. GALLEY back wall z -3.6, ovens; CABIN x -3..3, back wall z -3.2.
// STERN rail z -4.5, baker at (0.3, -3.75). SEA: water y 0, Titanic far at z -95, Carpathia at dawn (-20, -160).
const HOOK_POS: V3 = [0.2, 1.95, 7.6], HOOK_LOOK: V3 = [0.2, 1.75, 0];
const HOOK = (f0: number) => M(HOOK_POS, HOOK_LOOK, f0, { fov: 46, orbit: 0, push: 0, keep: true, drift: 0, roll: 0.09 });
const TIP = (f0: number) => { const c = CR([1.6, 2.7, 7.8], [0.7, 2.3, 5.0], [0.4, 1.6, -3.2], f0, 100, 48); return (f: number): Shot => ({ ...c(f), roll: 0.04 + 0.26 * gl((f - f0) / 70) }); };
const RL = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// 1 The Titanic is sinking. Everyone is panicking.   (opens on the frame shot 22 ends on: loop)
seq(1, [[S(1), HOOK(S(1)), 2, [0.2, 1.4, 0.4]]]);
// 2 And the chief baker? He's pouring himself a drink.
seq(2, [[S(2), RL(D([0.7, 1.85, 5.0], [0.2, 1.7, 0.4], S(2), { fov: 44, dx: -0.3 }), 0.05), 3, [0.2, 1.4, 0.4]]]);
// 3 Meet Charles Joughin.
seq(3, [[S(3), RL(D([-0.5, 1.95, 5.8], [0.2, 1.8, 0.4], S(3), { fov: 44, dx: 0.3 }), 0.05), 3, [0.2, 1.4, 0.4]]]);
// 4 April 1912. The unsinkable ship hits an iceberg.
seq(4, [[S(4), CR([0, 3, 30], [0, 5, 22], [6, 8, -80], S(4), 110, 50), 1, [0, 6, -90]]]);
// 5 Charles runs the kitchen, with 13 bakers under him.
seq(5, [[S(5), D([0, 1.6, 10.2], [0, 1.75, -0.4], S(5), { fov: 50, dx: -0.3 }), 2, [0, 1.3, 0.2]]]);
// 6 His first move? Bread.
seq(6, [[S(6), D([0.3, 1.95, 5.3], [0.05, 1.8, 0.9], S(6), { fov: 44, dx: 0.3 }), 3, [0, 1.4, 0.9]]]);
// 7 He sends every baker up to the lifeboats, with four loaves each.
seq(7, [[S(7), D([28.2, 2.3, 10.5], [28.6, 1.9, -1.6], S(7), { fov: 46, dx: 0.5 }), 2, [28, 1.3, -0.8]]]);
// 8 Then he goes back to his cabin... for a drink.
seq(8, [[S(8), D([0.5, 1.7, 4.4], [0.3, 1.5, -1.2], S(8), { fov: 46, dx: -0.2 }), 3, [0.3, 1.3, -0.7]]]);
// 9 Half a glass of liqueur, he said later. Legend says it was a lot more.
seq(9, [[S(9), D([-0.2, 1.7, 3.9], [0.0, 1.6, -0.8], S(9), { fov: 44, dx: 0.2 }), 3, [0, 1.4, -0.6]]]);
// 10 Back on deck, he starts throwing deck chairs into the ocean. About fifty of them.
seq(10, [[S(10), D([25.4, 2.4, 4.8], [26.4, 2.1, -3.6], S(10), { fov: 48, dx: 0.4 }), 2, [26.2, 1.4, -2.7]]]);
// 11 So people in the water have something to float on.
seq(11, [[S(11), CR([0, 3.4, 8], [0, 2.4, 6.5], [0, 0.3, -3], S(11), 100, 48), 1.5, [0, 0.3, -2]]]);
// 12 Then the ship tips up. He climbs to the very back and grabs the rail.
seq(12, [[S(12), TIP(S(12)), 2, [0.4, 1.3, -3.2]]]);
// 13 And as the Titanic goes down, he rides it... like an elevator.
seq(13, [[S(13), RL(D([0.7, 2.4, 4.8], [0.3, 1.8, -3.75], S(13), { fov: 48, dx: -0.3 }), 0.3), 2, [0.3, 1.3, -3.75]]]);
// 14 He said his head barely even got wet.
seq(14, [[S(14), D([0.4, 1.0, 4.4], [0.0, 0.45, 0], S(14), { fov: 44, dx: -0.3 }), 3, [0, 0.4, 0]]]);
// 15 The water was below freezing. Most people lasted only minutes.   (no people: cold water, a thermometer)
seq(15, [[S(15), D([0, 1.3, 6.2], [0, 1.5, -6], S(15), { fov: 46, dx: 0.3 }), 1.5, [0, 1.6, -3]]]);
// 16 Charles says he just paddled around... for two hours.
seq(16, [[S(16), D([-0.5, 1.1, 4.7], [0.3, 0.6, 0], S(16), { fov: 44, dx: 0.3 }), 3, [0, 0.4, 0]]]);
// 17 Historians aren't so sure.
seq(17, [[S(17), D([0.7, 1.05, 4.2], [0.4, 0.65, 0], S(17), { fov: 44, dx: -0.2 }), 3, [0.2, 0.5, 0]]]);
// 18 At dawn, a rescue ship picks him up. His only injury? Swollen feet.
seq(18, [[S(18), D([1.3, 1.9, 6.8], [-0.5, 1.1, -1.4], S(18), { fov: 48, dx: -0.4 }), 2, [-0.5, 1.0, -1.2]]]);
// 19 And he wasn't done. Years later, another of his ships caught fire. Then another one sank.
seq(19, [[S(19), D([26.1, 2.4, 7.3], [26.1, 2.2, -1.4], S(19), { fov: 46, dx: 0.3 }), 2, [26, 1.4, -1.2]]]);
// 20 He survived both.   (under the impact card)
seq(20, [[S(20), D([26.6, 2.0, 5.0], [26.0, 1.8, -1.2], S(20), { fov: 44, dx: -0.3 }), 3, [26, 1.4, -1.2]]]);
// 21 In the 1997 Titanic movie, he's the guy at the back rail, sipping from a flask.
seq(21, [[S(21), D([0.25, 2.0, 3.3], [0.1, 1.9, -3.6], S(21), { fov: 46, dx: 0.3 }), 2, [0.4, 1.4, -3.75]]]);
// 22 Send this to the friend who'd stay calm on a sinking ship.   (ends on shot 1)
seq(22, [
  [S(22), RL(D([1.0, 2.3, 9.2], [0.2, 1.8, 0], S(22), { fov: 48, dx: -0.4 }), 0.06), 2, [0.2, 1.4, 0.4]],
  [W(9, "on"), HOOK(W(9, "on")), 2, [0.2, 1.4, 0.4]],
]);
KICKS.push([at(1, "iceberg."), 0.1], [at(3, "throwing"), 0.08], [at(4, "elevator."), 0.08]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
