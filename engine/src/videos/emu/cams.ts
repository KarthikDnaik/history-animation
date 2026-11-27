// Camera keys and lens blur per shot for the emu short (cameras mostly on +z looking -z: +x = screen right).
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, dolly, zoom, rolled, applyKick, KICKS, Cam, glide, FPS } from "./story";
import { TRUCK_X } from "./sets";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
type DKey = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const CAMS: Record<number, Key[]> = {}, DOF: Record<number, DKey[]> = {};
const def = (id: number, keys: Key[], dof: DKey[]) => { CAMS[id] = keys; DOF[id] = dof; };
const D = (pos: V3, look: V3, f0: number, fov = 42, rate = 0.0022, extra: Partial<Cam> = {}, punch = 0) => (f: number) => dolly(pos, look, pushK(f, f0, rate, punch, 30), { fov, ...extra });

def(1, [{ f: S(1), s: D([0.6, 2.3, 7.4], [0.6, 0.6, -10], S(1), 46) }, { f: F(C.won) - 2, cut: true, s: D([1.0, 1.45, 3.4], [0.3, 1.35, 0.6], F(C.won), 38, 0.003, { roll: 0.04 }, 0.006) }],
  [{ f: S(1), cInf: 6, focus: () => [0.6, 1.4, 0.7] }, { f: F(C.won) - 2, cInf: 13 }]);
def(2, [{ f: S(2), s: D([3, 2.2, 7], [-1, 2.5, -30], S(2), 46, 0.0018) }, { f: F(C.wheat) - 6, dur: 24, s: D([3.0, 1.75, 3.2], [2.4, 1.15, -1.0], F(C.wheat), 40, 0.002, { roll: -0.03 }) }],
  [{ f: S(2), cInf: 0 }, { f: F(C.wheat) - 6, dur: 24, cInf: 10 }]);
def(3, [{ f: S(3), s: D([6, 6, 6], [0, 0, -25], S(3), 48, 0.0016) }, { f: F(C.eating) - 2, cut: true, s: D([0.8, 1.15, 2.6], [1.7, 0.8, -4.6], F(C.eating), 44, 0.0025) }],
  [{ f: S(3), cInf: 0 }, { f: F(C.eating) - 2, cInf: 10, focus: () => [1.6, 0.6, -4.6] }]);
def(4, [{ f: S(4), s: D([-1.5, 1.7, 12], [-1.5, 1.2, 3], S(4), 46) }, { f: F(C.major) - 2, cut: true, s: D([-0.4, 1.6, 5.4], [-0.6, 1.4, 2.4], F(C.major), 38) },
  { f: F(C.guns3) - 2, cut: true, s: D([1.0, 0.85, 2.7], [0.8, 0.45, 0], F(C.guns3), 42) }, { f: F(C.ten) - 2, cut: true, s: D([-0.8, 1.15, 7.2], [-0.7, 0.6, 4.2], F(C.ten), 42, 0.003, {}, 0.006) }],
  [{ f: S(4), cInf: 0 }, { f: F(C.major) - 2, cInf: 12, focus: () => [-0.6, 1.6, 2.4] }, { f: F(C.guns3) - 2, cInf: 12 }, { f: F(C.ten) - 2, cInf: 10 }]);
def(5, [{ f: S(5), s: D([0.6, 1.6, 5.5], [0, 1.0, -16], S(5), 44) }, { f: F(C.split) - 2, cut: true, s: D([0, 9, -8], [0, 0, -24], F(C.split), 52, 0.0015) }],
  [{ f: S(5), cInf: 6, focus: () => [0, 1.5, 0.9] }, { f: F(C.split) - 2, cInf: 0 }]);
def(6, [{ f: S(6), s: D([0.3, 1.6, 6.5], [0.3, 1.0, -10], S(6), 46) }, { f: F(C.jams) - 2, cut: true, s: D([0.7, 1.35, 5.0], [0.5, 1.0, 1.4], F(C.jams), 40, 0.003, { roll: 0.04 }, 0.006) }],
  [{ f: S(6), cInf: 0 }, { f: F(C.jams) - 2, cInf: 12 }]);
KICKS.push([C.jams, 0.8]);
def(7, [{ f: S(7), s: (f: number): Shot => { const X = TRUCK_X(f / FPS, 7); return { pos: [X + 1.6, 1.7, -2.6], look: [X + 3.0, 1.1, -11], fov: 52 }; } }], [{ f: S(7), cInf: 0 }]);
def(8, [{ f: S(8), s: D([4.2, 1.5, 8.5], [4.0, 0.8, 2.8], S(8), 44, 0.0025) }], [{ f: S(8), cInf: 6, focus: () => [4, 1, 3.4] }]);
def(9, [{ f: S(9), s: D([0, 1.5, 5.6], [0, 1.4, 1], S(9), 44, 0.0025) }], [{ f: S(9), cInf: 10, focus: () => [0, 1.5, 1] }]);
def(10, [{ f: S(10), s: D([0, 1.4, 4.3], [0, 1.3, -0.3], S(10), 46, 0.0025, { roll: 0.03 }) }], [{ f: S(10), cInf: 10, focus: () => [0, 1.4, -0.3] }]);
def(11, [{ f: S(11), s: D([0.3, 1.6, 3.6], [0, 1.5, 0.8], S(11), 38, 0.003) }], [{ f: S(11), cInf: 12, focus: () => [0, 1.6, 0.8] }]);
def(12, [{ f: S(12), s: D([-0.5, 1.2, 4.4], [-0.4, 0.6, -1.0], S(12), 48) }, { f: F(C.explodes) - 4, dur: 20, s: D([-0.4, 1.4, 5.0], [-0.2, 1.2, -1.6], F(C.explodes), 50, 0.002, { roll: 0.04 }) }],
  [{ f: S(12), cInf: 6, focus: () => [-1.5, 0.8, 0.6] }, { f: F(C.explodes) - 4, cInf: 0 }]);
{
  const cx = (f: number) => -4 + 12 * (f / FPS - C.l12);
  def(13, [{ f: S(13), s: (f: number): Shot => ({ pos: [cx(f) - 1, 1.6, 2.5], look: [cx(f) + 2, 0.9, -10], fov: 46 }) },
    { f: F(C.scatter) - 2, cut: true, s: (f: number): Shot => ({ pos: [cx(f), 13, 0], look: [cx(f), 0, -12], fov: 52 }) }], [{ f: S(13), cInf: 0 }]);
}
def(14, [{ f: S(14), s: D([1.2, 1.3, 5.5], [0.8, 1.0, -2], S(14), 46, 0.0025) }, { f: F(C.tanks) - 6, dur: 20, s: D([1.0, 1.0, 4.4], [0.6, 1.1, -2], F(C.tanks), 44, 0.002, { roll: -0.04 }) }],
  [{ f: S(14), cInf: 6, focus: () => [0, 1.2, -1.5] }]);
def(15, [{ f: S(15), s: D([0.3, 1.6, 3.6], [0.5, 1.4, -3], S(15), 46) }, { f: F(C.medals) - 2, cut: true, s: D([-1.1, 1.75, -1.6], [-2.0, 1.75, -4.4], F(C.medals), 38, 0.003, {}, 0.006) }],
  [{ f: S(15), cInf: 8, focus: () => [0.9, 1.6, -2.2] }, { f: F(C.medals) - 2, cInf: 13 }]);
def(16, [{ f: S(16), s: D([0.2, 1.3, 5.2], [0.6, 1.1, -6], S(16), 44, 0.0018) }], [{ f: S(16), cInf: 0 }]);
def(17, [{ f: S(17), s: D([0.6, 1.6, 4.5], [0.8, 1.4, -1], S(17), 42) }, { f: F(C.coat) - 8, dur: 30, s: D([0, 5, 4.2], [0, 5.2, -4], F(C.coat), 44, 0.0015) }],
  [{ f: S(17), cInf: 9, focus: () => [0.9, 1.5, -1] }, { f: F(C.coat) - 8, dur: 30, cInf: 0 }]);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
