// Camera keys and lens blur per shot for the rat short (cameras mostly on +z looking -z: +x = screen right).
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, dolly, zoom, rolled, applyKick, KICKS, Cam, glide, FPS } from "./story";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
type DKey = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const CAMS: Record<number, Key[]> = {}, DOF: Record<number, DKey[]> = {};
const def = (id: number, keys: Key[], dof: DKey[]) => { CAMS[id] = keys; DOF[id] = dof; };
const D = (pos: V3, look: V3, f0: number, fov = 42, rate = 0.0022, extra: Partial<Cam> = {}, punch = 0) => (f: number) => dolly(pos, look, pushK(f, f0, rate, punch, 30), { fov, ...extra });

const X = (f: number, s: (f: number) => Shot): Key => ({ f, cut: true, s });
// 1 bounty desk -> rats pour down the street
def(1, [{ f: S(1), s: D([-0.7, 1.55, 2.2], [-0.9, 1.25, -4.8], S(1), 42, 0.0022) }, X(F(C.terribly) - 2, D([0.3, 0.32, 5.6], [0, 0.45, -6], F(C.terribly), 50, 0.003, { roll: 0.05 }, 0.006))],
  [{ f: S(1), cInf: 6, focus: () => [-0.9, 1.4, -4.6] }, { f: F(C.terribly) - 2, cInf: 0 }]);
// 2 French quarter, crane down to the manhole
def(2, [{ f: S(2), s: D([7, 10, 17], [0, 2.5, -6], S(2), 46, 0.0012) }, { f: S(2) + 30, dur: Math.max(30, F(C.town) - S(2) - 36), s: D([0.6, 1.0, 2.0], [0.05, 0.15, 0.0], F(C.town), 40, 0.002) }],
  [{ f: S(2), cInf: 0 }, { f: F(C.town) - 6, dur: 10, cInf: 10, focus: () => [0.08, 0.2, 0.05] }]);
// 3 the sewer -> one happy rat
def(3, [{ f: S(3), s: D([0, 1.3, 7.2], [0, 0.5, -10], S(3), 46, 0.0018) }, X(F(C.perfect) - 2, D([1.15, 0.3, 5.35], [1.55, 0.2, 4.3], F(C.perfect), 40, 0.003, {}, 0.006))],
  [{ f: S(3), cInf: 0 }, { f: F(C.perfect) - 2, cInf: 12, focus: () => [1.55, 0.2, 4.3] }]);
// 4 rats carry plague
def(4, [{ f: S(4), s: D([1.2, 0.33, 4.3], [1.5, 0.24, 3.2], S(4), 40, 0.004) }], [{ f: S(4), cInf: 13, focus: () => [1.5, 0.24, 3.2] }]);
// 5 catchers go down the manhole
def(5, [{ f: S(5), s: D([0.2, 1.75, 6.2], [-0.1, 0.9, 0], S(5), 42, 0.0022) }, { f: F(C.down) - 4, dur: 30, s: D([0.3, 2.4, 3.4], [0.0, 0.2, 0.0], F(C.down), 44, 0.002) }],
  [{ f: S(5), cInf: 6, focus: () => [0, 1.2, 0] }, { f: F(C.down) - 4, dur: 30, cInf: 8 }]);
// 6 the day's catch -> the mountain
def(6, [{ f: S(6), s: D([0.6, 1.6, 6.5], [0.5, 1.0, -0.5], S(6), 42, 0.0022) }, X(F(C.twenty) - 2, D([0.1, 1.0, 4.6], [0.0, 1.0, -2.4], F(C.twenty), 48, 0.0028, {}, 0.006))],
  [{ f: S(6), cInf: 6, focus: () => [0.5, 1.2, 0] }, { f: F(C.twenty) - 2, cInf: 0 }]);
// 7 and the rats kept coming
def(7, [{ f: S(7), s: D([0.9, 1.25, 7.5], [0.5, 0.5, -6], S(7), 46, 0.0025) }, { f: F(C.coming) - 4, dur: 16, s: D([0.9, 1.25, 7.5], [0.5, 0.5, -6], F(C.coming), 46, 0.0025, { roll: -0.04 }, 0.006) }],
  [{ f: S(7), cInf: 0 }]);
// 8 one cent per rat
def(8, [{ f: S(8), s: D([-0.9, 1.55, 1.8], [-1.6, 1.4, -5.6], S(8), 42) }, X(F(C.anyone) - 2, D([-3.6, 1.8, 6.2], [1.8, 1.1, -2], F(C.anyone), 46, 0.002)),
  X(F(C.cent) - 2, D([-1.65, 1.62, -3.4], [-1.85, 1.55, -5.9], F(C.cent), 38, 0.003, {}, 0.006))],
  [{ f: S(8), cInf: 8, focus: () => [-2, 1.6, -5.9] }, { f: F(C.anyone) - 2, cInf: 0 }, { f: F(C.cent) - 2, cInf: 13, focus: () => [-1.85, 1.55, -5.9] }]);
// 9 the office: rats on the desk -> "just the tail"
def(9, [{ f: S(9), s: D([0.6, 1.6, 5.0], [0.4, 1.2, -1.5], S(9), 42) }, X(F(C.so8) - 2, D([0.2, 1.7, 0.7], [0.1, 1.55, -2.5], F(C.so8), 38, 0.003, { roll: 0.03 }, 0.005))],
  [{ f: S(9), cInf: 6, focus: () => [0, 1.4, -2.2] }, { f: F(C.so8) - 2, cInf: 12, focus: () => [0, 1.6, -2.5] }]);
KICKS.push([C.piles, 0.6]);
// 10 tails pouring in
def(10, [{ f: S(10), s: D([-1.3, 1.7, 5.4], [0.4, 1.1, -1.5], S(10), 46, 0.0025) }], [{ f: S(10), cInf: 5, focus: () => [0, 1.2, -1.8] }]);
// 11 rats with no tails
def(11, [{ f: S(11), s: D([0, 1.0, 4.5], [-0.2, 0.8, -1], S(11), 44, 0.0022) }, X(F(C.no10) - 2, D([1.05, 0.24, 2.5], [1.2, 0.14, 1.0], F(C.no10), 40, 0.003, {}, 0.006))],
  [{ f: S(11), cInf: 6, focus: () => [-0.4, 1.2, -1.2] }, { f: F(C.no10) - 2, cInf: 13, focus: () => [0.3, 0.13, 0.4] }]);
// 12 snip, let it go
def(12, [{ f: S(12), s: D([0.4, 1.45, 2.6], [0.2, 1.25, -1], S(12), 40, 0.0025) }, X(F(C.cutting) - 2, D([0.45, 1.6, 0.6], [0.45, 1.5, -1], F(C.cutting), 36, 0.003, {}, 0.006)),
  X(F(C.letting) - 2, D([0.8, 1.2, 4.0], [0.8, 0.8, -0.8], F(C.letting), 44, 0.002))],
  [{ f: S(12), cInf: 8, focus: () => [0.2, 1.4, -1] }, { f: F(C.cutting) - 2, cInf: 13 }, { f: F(C.letting) - 2, cInf: 4 }]);
// 13 the babies have tails
def(13, [{ f: S(13), s: D([0.55, 0.42, 4.9], [0.45, 0.2, 3.1], S(13), 44, 0.0025) }, X(F(C.babies) - 2, D([0.82, 0.16, 3.95], [0.75, 0.1, 3.2], F(C.babies), 40, 0.003))],
  [{ f: S(13), cInf: 12, focus: () => [0.4, 0.2, 3.1] }, { f: F(C.babies) - 2, cInf: 13, focus: () => [0.75, 0.1, 3.2] }]);
// 14 the inspector on the paddy bund
def(14, [{ f: S(14), s: D([0.6, 3.0, 9.0], [-0.4, 1.3, -4], S(14), 46, 0.0018) }], [{ f: S(14), cInf: 4, focus: () => [-1, 1.4, -0.6] }]);
// 15 RAT FARMS
def(15, [{ f: S(15), s: D([-0.4, 1.4, 0.8], [-0.2, 1.1, -8], S(15), 50, 0.0035, { roll: 0.04 }, 0.008) }], [{ f: S(15), cInf: 0 }]);
// 16 the farmer cashes in
def(16, [{ f: S(16), s: D([0.3, 1.5, 1.6], [0.2, 1.2, -5], S(16), 44, 0.0025) }], [{ f: S(16), cInf: 6, focus: () => [0.6, 1.5, -3.6] }]);
// 17 CANCELLED -> rats everywhere
def(17, [{ f: S(17), s: D([0.3, 1.5, 3.0], [0.2, 1.25, -2], S(17), 40, 0.0022) }, X(F(C.hanoi16) - 2, D([0.8, 2.4, 5.5], [0, 0.8, -2.0], F(C.hanoi16), 50, 0.0018, { roll: -0.03 }))],
  [{ f: S(17), cInf: 8, focus: () => [0, 1.4, -2.5] }, { f: F(C.hanoi16) - 2, cInf: 0 }]);
KICKS.push([C.cancelled, 0.9]);
// 18 plague night
def(18, [{ f: S(18), s: D([0, 1.6, 8], [0, 1.6, -6], S(18), 46, 0.0022) }], [{ f: S(18), cInf: 0 }]);
// 19 the cobra effect
def(19, [{ f: S(19), s: D([0, 0.9, 3.4], [0, 0.85, -0.6], S(19), 40, 0.0015) }, { f: F(C.cobra) - 4, dur: 26, s: D([0, 1.1, 2.6], [0, 1.15, -0.6], F(C.cobra), 40, 0.002) }],
  [{ f: S(19), cInf: 10, focus: () => [0, 0.9, -0.6] }]);
// 20 pay to fix a problem -> more of the problem
def(20, [{ f: S(20), s: D([0.6, 1.6, 4.6], [0.4, 1.2, -1.5], S(20), 42, 0.0022) }, X(F(C.more19) - 2, D([1.6, 2.2, 6.5], [0, 0.9, -1.5], F(C.more19), 48, 0.002, { roll: 0.03 }, 0.006))],
  [{ f: S(20), cInf: 6, focus: () => [0.4, 1.4, -2] }, { f: F(C.more19) - 2, cInf: 0 }]);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
