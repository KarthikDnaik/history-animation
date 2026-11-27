// Camera keys and lens blur per shot for the Acoustic Kitty short (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-4 setups per line, hard cuts on words (whip-smeared in Kitty.tsx), every setup pushes in fast
// AND orbits the subject (parallax), low / dutch angles, big subjects.
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, dolly, applyKick, KICKS, Cam, glide, FPS, at } from "./story";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
const Wd = (line: number, word: string) => F(at(line, word)) - 2;
type DKey = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const CAMS: Record<number, Key[]> = {}, DOF: Record<number, DKey[]> = {};
const def = (id: number, keys: Key[], dof: DKey[]) => { CAMS[id] = keys; DOF[id] = dof; };
const D = (pos: V3, look: V3, f0: number, fov = 42, rate = 0.0022, extra: Partial<Cam> = {}, punch = 0) => (f: number) => dolly(pos, look, pushK(f, f0, rate, punch, 30), { fov, ...extra });
const foc = (p: V3) => () => p;
type P = V3 | ((f: number) => V3);
const val = (p: P, f: number) => (typeof p === "function" ? p(f) : p);
type MO = { fov?: number; push?: number; orbit?: number; rise?: number; roll?: number; punch?: number; T?: number; drift?: number };
const ease = (x: number, T: number) => T * (1 - Math.exp(-x / T));
const M = (pos: P, look: P, f0: number, o: MO = {}) => (f: number): Shot => {
  const L = val(look, f), P0 = val(pos, f);
  const x = Math.max(0, f - f0), T = o.T ?? 60;
  const k = Math.exp(-(o.push ?? 0.007) * ease(x, T)) * pushK(f, f0, 0, o.punch ?? 0, 30);
  const a = (o.orbit ?? 0.005) * ease(x, T * 1.6);
  const dx = P0[0] - L[0], dz = P0[2] - L[2], ca = Math.cos(a), sa = Math.sin(a);
  return {
    pos: [L[0] + (dx * ca - dz * sa) * k, L[1] + (P0[1] - L[1]) * k + (o.rise ?? 0) * ease(x, T) / T, L[2] + (dx * sa + dz * ca) * k],
    look: L, fov: o.fov ?? 42, roll: (o.roll ?? 0) + (o.drift ?? 0.006) * Math.sin(f * 0.06 + f0),
  };
};
type Setup = [number, (f: number) => Shot, number, P?];
const seq = (id: number, list: Setup[]) => {
  CAMS[id] = list.map(([f, s], i) => (i ? { f, cut: true, s } : { f, s }));
  DOF[id] = list.map(([f, , cInf, fp]) => ({ f, cInf, focus: fp ? (g: number) => val(fp, g) : undefined }));
};
export const CUTS: number[] = [];
const CATT: V3 = [0.05, 1.15, -1.4]; // the cat on the operating table

const X = (f: number, s: (f: number) => Shot): Key => ({ f, cut: true, s });
// 1 HQ: the brilliant idea
seq(1, [
  [S(1), M([0.45, 1.3, 1.0], [-0.1, 1.45, -2.5], S(1), { fov: 44, orbit: 0.005 }), 6, [0, 1.5, -2.5]],
  [Wd(0, "brilliant"), M([0.3, 1.85, -0.8], [0, 1.95, -2.5], Wd(0, "brilliant"), { fov: 40, punch: 0.012, orbit: -0.004 }), 12, [0, 1.95, -2.5]],
  [Wd(0, "soviets"), M([0.35, 1.6, -0.95], [0, 1.65, -2.5], Wd(0, "soviets"), { fov: 40, roll: 0.05, orbit: 0.005 }), 12, [0, 1.65, -2.5]],
]);
// 2 "Cats."
seq(2, [[S(2), M([0.3, 1.12, 0.05], [0.1, 1.05, -1.5], S(2), { fov: 40, punch: 0.012, orbit: -0.004 }), 13, [0.1, 1.05, -1.5]]]);
// 3 park bench: nobody suspects a cat -> cats go anywhere -> it listens
seq(3, [
  [S(3), M([0.4, 1.9, 0.6], [0.35, 0.8, -6], S(3), { fov: 42, orbit: 0.004, push: 0.005 }), 6, [0.3, 0.9, -6]],
  [Wd(2, "cats"), M([1.75, 0.7, -4.4], [1.25, 0.72, -6], Wd(2, "cats"), { fov: 40, orbit: -0.006 }), 12, [1.25, 0.72, -6]],
  [Wd(2, "listening"), M([1.05, 0.8, -4.7], [1.2, 0.72, -6.0], Wd(2, "listening"), { fov: 38, punch: 0.01, orbit: 0.004 }), 13, [1.2, 0.72, -6]],
]);
// 4 the vet -> turns it into a spy
seq(4, [
  [S(4), M([0.25, 1.5, 2.3], [0.05, 1.35, -1.8], S(4), { fov: 42, orbit: 0.005 }), 6, [0, 1.2, -1.6]],
  [Wd(3, "vet"), M([-0.7, 1.55, -0.85], [-1.0, 1.62, -2.3], Wd(3, "vet"), { fov: 40, orbit: -0.005 }), 12, [-1.0, 1.6, -2.3]],
  [Wd(3, "spy"), M([0.2, 1.2, -0.2], CATT, Wd(3, "spy"), { fov: 38, punch: 0.014, roll: -0.04 }), 13, CATT],
]);
// 5 the gear goes in
seq(5, [
  [S(5), M([0.18, 1.22, 0.0], [0, 1.15, -1.4], S(5), { fov: 38, orbit: 0.005, push: 0.005 }), 13, [0, 1.15, -1.4]],
  [Wd(4, "radio"), M([-0.35, 1.3, -0.45], [0, 1.22, -1.4], Wd(4, "radio"), { fov: 38, orbit: -0.006, punch: 0.008 }), 13, [0, 1.22, -1.4]],
  [Wd(4, "wire"), M([0.4, 1.0, -0.4], [0, 1.08, -1.4], Wd(4, "wire"), { fov: 38, orbit: 0.006, roll: 0.04 }), 13, [0, 1.08, -1.4]],
]);
// 6 Agent Kitty is ready (low hero angle)
seq(6, [[S(6), M([0.45, 0.95, 0.2], [0, 1.28, -1.4], S(6), { fov: 42, punch: 0.012, orbit: -0.006 }), 10, [0, 1.2, -1.4]]]);
// 7 one problem -> it's a cat
seq(7, [
  [S(7), M([0.2, 1.5, 2.2], [0.05, 1.35, -1.8], S(7), { fov: 42, orbit: 0.005 }), 6, [0, 1.2, -1.6]],
  [Wd(6, "problem"), M([0.95, 1.65, -0.85], [1.2, 1.65, -2.2], Wd(6, "problem"), { fov: 40, roll: -0.04, orbit: 0.004 }), 12, [1.2, 1.65, -2.2]],
  [Wd(6, "its"), M([0.15, 1.2, -0.15], [0, 1.15, -1.4], Wd(6, "its"), { fov: 36, punch: 0.01, orbit: -0.004 }), 13, [0, 1.15, -1.4]],
]);
// 8 training: wanders off -> food
const catW = (f: number): V3 => { const u = Math.max(0, f / FPS - C.wandering); return [-0.25 + 1.2 * u, 0.3, 1.8 + 0.12 * u]; };
seq(8, [
  [S(8), M([-0.3, 1.35, 6.0], [-0.5, 0.85, 1.8], S(8), { fov: 44, orbit: 0.004 }), 4, [0, 0.8, 1.8]],
  [Wd(7, "wandering"), M((f) => { const c = catW(f); return [c[0] - 0.5, 0.45, c[2] + 1.4]; }, catW, Wd(7, "wandering"), { fov: 40, orbit: 0.004, push: 0.003 }), 10, catW],
  [Wd(7, "food"), M([4.85, 0.62, 3.5], [4.75, 0.35, 1.95], Wd(7, "food"), { fov: 40, punch: 0.01, orbit: -0.005 }), 12, [4.75, 0.35, 1.95]],
]);
// 9 the second operation -> less hungry
seq(9, [
  [S(9), M([0.2, 1.5, 2.2], [0.05, 1.35, -1.8], S(9), { fov: 42, orbit: -0.005 }), 6, [0, 1.2, -1.6]],
  [Wd(8, "second"), M([0.18, 1.22, 0.0], [0, 1.12, -1.4], Wd(8, "second"), { fov: 38, punch: 0.012, orbit: 0.005 }), 13, [0, 1.1, -1.4]],
  [Wd(8, "hungry"), M([0.35, 1.08, -0.45], [0.08, 1.0, -1.4], Wd(8, "hungry"), { fov: 38, orbit: -0.005, roll: 0.04 }), 13, [0.08, 1.0, -1.4]],
]);
// 10 the first real mission: crane down onto the team
def(10, [{ f: S(10), s: D([4, 7, 15], [0, 2.6, -10], S(10), 46, 0.001) }, { f: S(10) + 6, dur: Math.max(24, F(C.mission) - S(10) + 6), s: D([0.2, 1.3, 7.6], [-1.0, 1.0, 2.4], F(C.mission), 44, 0.002) }],
  [{ f: S(10), cInf: 0 }, { f: F(C.mission), dur: 12, cInf: 5, focus: foc([-1.2, 1.0, 2.8]) }]);
// 11 two men on a bench -> the Soviet building behind
def(11, [{ f: S(11), s: M([0.5, 1.35, -2.6], [0.3, 1.05, -6], S(11), { fov: 40, orbit: 0.005 }) }, X(Wd(10, "talking"), M([1.05, 1.5, -4.75], [0.8, 1.45, -6], Wd(10, "talking"), { fov: 38, punch: 0.01, orbit: -0.005 })), { f: F(C.outside) - 4, dur: 36, s: D([0.4, 1.3, 0.6], [0.3, 3.6, -14], F(C.outside), 48, 0.0015) }],
  [{ f: S(11), cInf: 8, focus: foc([0.3, 1.0, -6]) }, { f: Wd(10, "talking"), cInf: 12, focus: foc([0.8, 1.45, -6]) }, { f: F(C.outside) - 4, dur: 30, cInf: 0 }]);
// 12 release the cat (side view from +x: screen right = -z) -> point it at the bench
seq(12, [
  [S(12), M([2.8, 0.95, 1.9], [-1.0, 0.75, 1.95], S(12), { fov: 46, orbit: 0.004 }), 5, [-1.0, 0.6, 2.0]],
  [Wd(11, "point"), M([0.4, 1.6, 3.0], [-1.4, 1.6, 2.6], Wd(11, "point"), { fov: 40, punch: 0.01, orbit: -0.005 }), 12, [-1.4, 1.6, 2.6]],
]);
// 13 depends on who you ask
seq(13, [
  [S(13), M([1.5, 0.85, 0.75], [-0.9, 0.75, 0.75], S(13), { fov: 44, orbit: 0.005 }), 6, [-0.9, 0.5, 0.8]],
  [Wd(12, "ask"), M([0.4, 1.6, 3.0], [-1.4, 1.55, 2.6], Wd(12, "ask"), { fov: 40, roll: 0.04, orbit: -0.005 }), 12, [-1.4, 1.55, 2.6]],
]);
// 14 the taxi version: the cat steps out, the taxi comes up the road -> cut to the agent as it passes
const cat14 = (f: number): V3 => { const u = Math.max(0, f / FPS - C.walked); return [-0.9, 0.3, 0.75 - Math.min(1.3, 0.7 * u)]; };
seq(14, [
  [S(14), M((f) => { const c = cat14(f); return [1.4, 0.7, c[2] + 0.15]; }, (f) => { const c = cat14(f); return [c[0], 0.45, c[2]]; }, S(14), { fov: 42, orbit: 0.002, push: 0.003 }), 5, cat14],
  [Wd(13, "road"), M((f) => { const c = cat14(f); return [0.45, 0.4, c[2] - 0.05]; }, (f) => { const c = cat14(f); return [c[0], 0.38, c[2]]; }, Wd(13, "road"), { fov: 40, punch: 0.01, orbit: -0.003 }), 10, cat14],
  [Wd(13, "taxi"), M([-1.25, 1.55, 6.6], [-1.4, 1.35, 2.6], Wd(13, "taxi"), { fov: 42, roll: 0.03, punch: 0.006, orbit: 0.004 }), 6, [-1.4, 1.4, 2.6]],
]);
KICKS.push([C.taxi + 0.03, 1.0]);
// 15 the happy-life version
seq(15, [
  [S(15), M([-1.25, 0.95, 1.6], [-1.6, 0.6, -1.2], S(15), { fov: 46, orbit: 0.004 }), 5, [-1.3, 0.6, -1.2]],
  [Wd(14, "lived"), M([-1.75, 1.45, -0.35], [-2.2, 1.3, -1.9], Wd(14, "lived"), { fov: 40, orbit: -0.004 }), 10, [-2.2, 1.3, -1.9]],
  [Wd(14, "happy"), M([-0.7, 0.75, 0.55], [-1.2, 0.3, -0.68], Wd(14, "happy"), { fov: 38, punch: 0.008, orbit: 0.005 }), 13, [-1.2, 0.3, -0.68]],
]);
// 16 it never spied on anyone (the one slow shot)
seq(16, [[S(16), M([-0.95, 0.72, 0.5], [-1.2, 0.3, -0.68], S(16), { fov: 40, push: 0.003, orbit: 0.0015, T: 200, drift: 0 }), 13, [-1.2, 0.3, -0.68]]]);
// 17 twenty million dollars
seq(17, [
  [S(17), M([0.6, 1.4, 4.8], [0.3, 0.9, 0.4], S(17), { fov: 46, orbit: 0.004 }), 4, [0.2, 0.9, 0.6]],
  [Wd(16, "guessed"), M([1.95, 1.62, 1.85], [2.2, 1.62, 0.4], Wd(16, "guessed"), { fov: 40, orbit: -0.004 }), 12, [2.2, 1.6, 0.4]],
  [Wd(16, "twenty"), M([0.25, 1.2, 2.3], [0.05, 1.0, 0.6], Wd(16, "twenty"), { fov: 42, punch: 0.012, orbit: 0.005 }), 10, [0.05, 1.0, 0.6]],
]);
// 18 shut it down, an official memo
seq(18, [
  [S(18), M([0.4, 1.55, 2.4], [0.1, 1.25, -2.0], S(18), { fov: 42, orbit: 0.005 }), 6, [0.1, 1.3, -2.2]],
  [Wd(17, "shut"), M([0.6, 1.5, -0.35], [0.3, 1.2, -1.9], Wd(17, "shut"), { fov: 40, punch: 0.012, roll: -0.05 }), 12, [0.5, 0.95, -1.5]],
  [Wd(17, "memo"), M([0.25, 1.75, -0.95], [0.2, 0.81, -1.4], Wd(17, "memo"), { fov: 40, orbit: 0.006 }), 12, [0.2, 0.81, -1.4]],
]);
KICKS.push([C.shut, 0.7]);
// 19 the memo
seq(19, [
  [S(19), M([0.03, 1.3, -0.15], [0, 1.3, -1.45], S(19), { fov: 40, orbit: 0.004, push: 0.005, roll: -0.03 }), 8, [0, 1.3, -1.45]],
  [Wd(18, "practical"), M([0.15, 1.12, -0.6], [0.12, 1.12, -1.45], Wd(18, "practical"), { fov: 38, punch: 0.012, roll: 0.05 }), 10, [0.12, 1.12, -1.45]],
]);
KICKS.push([C.practical, 0.8]);
// 20 every cat owner knows (the mug goes over the edge)
seq(20, [
  [S(20), M([0.3, 1.4, 1.9], [0.25, 1.15, -1.8], S(20), { fov: 42, orbit: 0.005 }), 6, [0.5, 1.1, -1.6]],
  [Wd(19, "every"), M([0.5, 1.05, -0.6], [0.3, 1.0, -1.4], Wd(19, "every"), { fov: 38, orbit: -0.005, roll: 0.03 }), 13, [0.3, 1.0, -1.4]],
  [Wd(19, "knows"), M([0.75, 1.25, 1.3], [0.6, 0.8, -1.4], Wd(19, "knows"), { fov: 42, orbit: 0.004, push: 0.004 }), 6, [0.8, 0.8, -1.4]],
]);
KICKS.push([C.knows + 0.3 + Math.sqrt(0.75 / 4.9), 0.5]);
// 21 you can't tell a cat what to do
seq(21, [
  [S(21), M([0.3, 1.4, 1.9], [0.2, 1.2, -1.8], S(21), { fov: 42, orbit: -0.005 }), 6, [0.4, 1.1, -1.6]],
  [Wd(20, "cat"), M([0.85, 1.15, -0.5], [0.62, 1.05, -1.4], Wd(20, "cat"), { fov: 38, punch: 0.01, orbit: 0.005 }), 13, [0.62, 1.05, -1.4]],
]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);
export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
