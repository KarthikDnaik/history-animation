// Camera keys and lens blur per shot (set-local coordinates; see sets.ts for where things stand).
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, dolly, zoom, rolled, applyKick, KICKS, Cam, glide, FPS } from "./story";
import { moonRocket, SHOT4_ROCKET, CAMP_ROCKET, TUBE_ROCKET, bucketY } from "./sets";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
type DKey = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const CAMS: Record<number, Key[]> = {}, DOF: Record<number, DKey[]> = {};
const def = (id: number, keys: Key[], dof: DKey[]) => { CAMS[id] = keys; DOF[id] = dof; };

// 1 hook (night rampart): over the rocket man's shoulder, the moon above; tilt after the rocket on "firing"
{
  const f0 = S(1), fl = F(C.fire);
  const A = (f: number) => dolly([-1.4, 1.15, -2.3], [0.2, 2.9, 7], pushK(f, f0, 0.0022), { fov: 44, roll: -0.03 });
  const B = (f: number): Shot => { const s = Math.max(0, (f - fl) / FPS), p = moonRocket(Math.min(s, 3)); return { pos: [-1.9, 1.0, -1.7], look: [p[0] * 0.6 + 0.2, Math.max(2.9, p[1] * 0.75), Math.max(7, p[2] * 0.75)], fov: 44 - 4 * Math.min(1, s / 2), roll: 0.03 }; };
  def(1, [{ f: f0, s: A }, { f: fl + 4, dur: 30, s: B }], [{ f: f0, cInf: 8 }, { f: fl + 4, dur: 30, cInf: 0 }]);
}
// 2 fort: aerial zoom push -> front row of the parade on "rocket men" -> crane up/back on "thousand"
{
  const A = (f: number) => zoom([80, 52, -105], [0, 4, -8], 44, pushK(f, S(2), 0.0016));
  const B = (f: number) => dolly([1.1, 1.62, -21.8], [0.2, 1.5, -28], pushK(f, F(C.rocketMen), 0.0025), { fov: 40 });
  const Cc = (f: number) => dolly([7.5, 11, -10], [0, 0.5, -40], pushK(f, F(C.thousand), 0.0015), { fov: 46, roll: -0.03 });
  def(2, [{ f: S(2), s: A }, { f: F(C.rocketMen) - 2, cut: true, s: B }, { f: F(C.thousand) - 6, dur: 40, s: Cc }],
    [{ f: S(2), cInf: 0 }, { f: F(C.rocketMen) - 2, cInf: 12, focus: () => [0, 1.6, -27] }, { f: F(C.thousand) - 6, dur: 40, cInf: 0 }]);
}
// 3 rocket close-up: MS -> tube insert on "iron" -> tilt down the pole on "bamboo"
{
  const A = (f: number) => dolly([8.35, 1.38, -9.1], [8.08, 1.3, -6], pushK(f, S(3), 0.0025), { fov: 38 });
  const B = (f: number) => dolly([7.55, 1.8, -7.15], [7.78, 1.64, -6], pushK(f, F(C.iron), 0.002, 0.005, 30), { fov: 30, roll: 0.04 });
  const Cc = (f: number) => dolly([7.55, 1.1, -7.45], [7.78, 0.95, -6], pushK(f, F(C.bamboo), 0.002), { fov: 34, roll: -0.03 });
  def(3, [{ f: S(3), s: A }, { f: F(C.iron) - 2, cut: true, s: B }, { f: F(C.bamboo) - 10, dur: 28, s: Cc }],
    [{ f: S(3), cInf: 12 }, { f: F(C.iron) - 2, cInf: 15 }, { f: F(C.bamboo) - 10, dur: 28, cInf: 14 }]);
}
// 4 launch: 3/4 behind the rack -> down-range low as it screams off -> high aerial along the trail on "kilometre"
{
  const A = (f: number) => dolly([-2.9, 1.35, -3.3], [0.2, 0.85, 0.35], pushK(f, S(4), 0.0025, 0.005, 30), { fov: 40 });
  const B = (f: number): Shot => { const s = Math.max(0, f / FPS - C.screams + 0.08), p = SHOT4_ROCKET(Math.min(s, 4)), k = Math.min(1, s / 0.5); return { pos: [p[0] - 2.5 - 3 * k, p[1] + 0.5 + 0.6 * k, p[2] - 4.5 - 2 * k], look: [p[0] + 1.5, p[1], p[2]], fov: 40, roll: 0.035 }; };
  const Cc = (f: number) => { const s = Math.max(0, f / FPS - C.screams), p = SHOT4_ROCKET(Math.min(s, 4)); return { pos: [p[0] * 0.55 - 30, 14, -34] as V3, look: [p[0] * 0.75 + 6, 2, 4] as V3, fov: 46 }; };
  def(4, [{ f: S(4), s: A }, { f: F(C.screams) - 2, cut: true, s: B }],
    [{ f: S(4), cInf: 10, focus: () => [0, 0.7, 0.2] }, { f: F(C.screams) - 2, cInf: 0 }]);
}
// 5 Europe: the officer and his paper rocket -> low by the nose-dived rocket on "fall short"
{
  const A = (f: number) => dolly([0.1, 1.5, 4.6], [-0.15, 1.1, 0.4], pushK(f, S(5), 0.0025), { fov: 42 });
  const A2 = (f: number): Shot => { const T = Math.max(0.5, C.fall - C.paper + 0.07), u = Math.min(1, Math.max(0, (f / FPS - C.paper) / T)), x = 0.15 + 6.8 * u; return { pos: [x * 0.8 + 0.4, 1.5, 5.4], look: [x * 0.9 + 0.1, 1.2, 0.2], fov: 44 }; };
  const B = (f: number) => dolly([8.6, 0.42, 2.4], [6.95, 0.32, 0], pushK(f, F(C.fall), 0.002, 0.005, 25), { fov: 36, roll: 0.04 });
  def(5, [{ f: S(5), s: A }, { f: F(C.paper) - 4, dur: 18, s: A2 }, { f: F(C.fall) - 1, cut: true, s: B }], [{ f: S(5), cInf: 0 }, { f: F(C.fall) - 1, cInf: 14, focus: () => [6.95, 0.3, 0] }]);
}
// 6 Pollilur: wide camp -> track the rocket in the sky on "stray" -> MS of cart + redcoats on "finds", kick on "goes"
{
  const A = (f: number) => dolly([-7.5, 2.4, -11.5], [0, 1.2, 0], pushK(f, S(6), 0.0022), { fov: 42 });
  const B = (f: number): Shot => { const s = f / FPS - (C.stray - 0.25), p = CAMP_ROCKET(Math.max(0, s)); return { pos: [p[0] + 9, p[1] - 3, p[2] - 14], look: p, fov: 36, roll: -0.04 }; };
  const Cc = (f: number) => dolly([1.0, 1.6, -9.6], [0.1, 1.3, -0.5], pushK(f, F(C.finds), 0.0025, 0.006, 30), { fov: 42 });
  def(6, [{ f: S(6), s: A }, { f: F(C.stray) - 1, cut: true, s: B }, { f: F(C.finds) - 1, cut: true, s: Cc }],
    [{ f: S(6), cInf: 0 }, { f: F(C.finds) - 1, cInf: 8, focus: () => [0, 1.2, -2] }]);
  KICKS.push([C.goes - 2 / FPS, 2.2], [C.goes + 4 / FPS, 1.0]);
}
// 7 "Luckily": wide side view of the wild flights; 8 "Unluckily": crane over the ranks -> the redcoats downrange
def(7, [{ f: S(7), s: (f) => dolly([2.5, 2.4, 20], [2.5, 4.2, 0], pushK(f, S(7), 0.0018), { fov: 48 }) }], [{ f: S(7), cInf: 0 }]);
{
  const A = (f: number) => dolly([-30, 9, -26], [0, 3, 12], pushK(f, S(8), 0.0016), { fov: 46 });
  const B = (f: number) => dolly([-24, 22, -40], [0, 8, 30], 1, { fov: 50 });
  const Cc = (f: number) => dolly([0.5, 1.5, 97], [0, 1.6, 88], pushK(f, F(C.men7), 0.0025), { fov: 44, roll: 0.03 });
  def(8, [{ f: S(8), s: A }, { f: F(C.five) - 12, dur: 36, s: B }, { f: F(C.men7) - 1, cut: true, s: Cc }], [{ f: S(8), cInf: 0 }]);
}
// 9 hose: MS of the kid -> pull back wide as the jet grows
{
  const A = (f: number) => dolly([0.35, 0.9, 3.0], [0.35, 0.6, 0], pushK(f, S(9), 0.0025), { fov: 40 });
  const B = (f: number) => dolly([2.8, 1.6, 14], [2.8, 0.6, 0], pushK(f, F(C.tighter), 0.0015), { fov: 46 });
  def(9, [{ f: S(9), s: A }, { f: F(C.tighter) - 8, dur: 34, s: B }], [{ f: S(9), cInf: 9 }, { f: F(C.tighter) - 8, dur: 34, cInf: 6 }]);
}
// 10 paper vs iron: both racks -> paper on "paper" -> iron on "iron" -> low behind as it flies
{
  const A = (f: number) => dolly([0, 1.4, 6.6], [0, 0.8, 12], pushK(f, S(10), 0.0025), { fov: 44 });
  const P = (f: number) => dolly([0.75, 1.0, 9.9], [0.75, 0.75, 12], pushK(f, F(C.paperT), 0.002), { fov: 36 });
  const I = (f: number) => dolly([-0.75, 1.0, 9.9], [-0.75, 0.8, 12], pushK(f, F(C.ironT), 0.002), { fov: 36 });
  const Fl = (f: number): Shot => { const s = Math.max(0, f / FPS - C.flies + 0.1), p = TUBE_ROCKET(Math.min(3, s)); return { pos: [-0.3, 1.0, 7.5], look: [-0.95 + 0.85 * (p[0] + 0.95), 0.8 + 0.85 * (p[1] - 0.8), 12], fov: 46 }; };
  def(10, [{ f: S(10), s: A }, { f: F(C.paperT) - 8, dur: 24, s: P }, { f: F(C.ironT) - 8, dur: 24, s: I }, { f: F(C.flies) - 4, cut: true, s: Fl }],
    [{ f: S(10), cInf: 6 }, { f: F(C.paperT) - 8, dur: 24, cInf: 12 }, { f: F(C.flies) - 4, cInf: 0 }]);
}
// 11 dock (golden): wide quay -> the officer admiring a captured rocket on "shipped"
{
  const A = (f: number) => dolly([-16, 4.2, -9.5], [1, 1.6, 3], pushK(f, S(11), 0.0018), { fov: 42 });
  const B = (f: number) => dolly([-3.3, 1.55, -5.6], [-4.1, 1.45, -3.2], pushK(f, F(C.shipped), 0.0025), { fov: 38, roll: 0.03 });
  def(11, [{ f: S(11), s: A }, { f: F(C.packed) + 6, cut: true, s: B }], [{ f: S(11), cInf: 0 }, { f: F(C.packed) + 6, cInf: 12, focus: () => [-4.2, 1.5, -3.2] }]);
}
// 12 workshop: Congreve MS -> insert of the Mysore rocket on his bench on "copied"
{
  const A = (f: number) => dolly([0.55, 1.5, -2.2], [0, 1.4, 1.4], pushK(f, S(12), 0.0025, 0.006, 30), { fov: 40 });
  const B = (f: number) => dolly([-1.25, 1.38, 2.45], [-1.45, 0.98, 3.48], pushK(f, F(C.copied), 0.003), { fov: 36, roll: -0.04 });
  def(12, [{ f: S(12), s: A }, { f: F(C.insisted) - 8, dur: 20, s: rolled(A, 0.04) }, { f: F(C.copied) - 2, cut: true, s: B }],
    [{ f: S(12), cInf: 11, focus: () => [0, 1.5, 1.4] }, { f: F(C.copied) - 2, cInf: 14, focus: () => [-1.4, 1.0, 3.45] }]);
}
// 13 1814 (night): rockets over the fort -> the poet on "poet" -> flag and glare on "glare"
{
  const A = (f: number) => zoom([-4, 6, 4], [0, 20, 150], 30, pushK(f, S(13), 0.0018));
  const B = (f: number) => dolly([0.35, 1.6, 4.9], [0, 1.45, 2.0], pushK(f, F(C.poet), 0.0025), { fov: 38 });
  const Cc = (f: number) => zoom([-2, 2, 4], [3, 34, 150], 16, pushK(f, F(C.glare), 0.002), { roll: 0.04 });
  def(13, [{ f: S(13), s: A }, { f: F(C.poet) - 1, cut: true, s: B }, { f: F(C.glare) - 4, cut: true, s: Cc }], [{ f: S(13), cInf: 0 }, { f: F(C.poet) - 1, cInf: 10, focus: () => [0, 1.6, 2] }, { f: F(C.glare) - 4, cInf: 0 }]);
}
// 14 stadium: low on the field, push in on the singing stand
def(14, [{ f: S(14), s: (f) => dolly([1.5, 1.7, -6.0], [0.5, 2.6, 6], pushK(f, S(14), 0.0025, 0.005, 30), { fov: 44, roll: -0.03 }) }], [{ f: S(14), cInf: 6, focus: () => [0, 1.5, 4] }]);
// 15 well: wide -> bucket CU on "Thousands" -> crane up on "village" -> back to the bucket for the spark
{
  const A = (f: number) => dolly([-3.0, 1.7, -6.2], [0.2, 1.0, 0], pushK(f, S(15), 0.0022), { fov: 42 });
  const B = (f: number) => dolly([0.55, 1.5, -3.6], [0.6, bucketY(f / FPS) + 0.05, -0.8], pushK(f, F(C.thousands), 0.0025, 0.005, 30), { fov: 40 });
  const Cc = (f: number) => dolly([-6, 8.5, -13], [0, 0.6, 3], pushK(f, F(C.village), 0.0015), { fov: 46 });
  const D = (f: number) => dolly([0.28, 1.42, -1.55], [0.02, bucketY(f / FPS) + 0.12, 0], pushK(f, F(C.waiting), 0.003), { fov: 32, roll: 0.03 });
  def(15, [{ f: S(15), s: A }, { f: F(C.thousands) - 2, cut: true, s: B }, { f: F(C.village) - 8, dur: 40, s: Cc }, { f: F(C.waiting) - 2, cut: true, s: D }],
    [{ f: S(15), cInf: 0 }, { f: F(C.thousands) - 2, cInf: 14 }, { f: F(C.village) - 8, dur: 40, cInf: 0 }, { f: F(C.waiting) - 2, cInf: 15 }]);
  KICKS.push([C.launch, 0.6]);
}

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
