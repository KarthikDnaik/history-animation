// Real particle VFX (three.quarks) for the Mincemeat sea / HQ / beach shots.
// Deterministic for Remotion: every system is simulated at a fixed 1/30 s step from its own start time, with Math.random
// swapped for a seeded PRNG while it steps, and the whole rig re-simulates from scratch whenever a frame is asked for
// out of order. So frame f always shows exactly the same particles, whichever render tab draws it.
import * as THREE from "three";
import {
  BatchedRenderer, ParticleSystem, ConeEmitter, SphereEmitter, CircleEmitter, IntervalValue, ConstantValue, ColorRange,
  Vector4, Vector3 as QV3, Gradient, ColorOverLife, SizeOverLife, ApplyForce, PiecewiseBezier, Bezier, RenderMode,
  RotationOverLife, Noise, Behavior, EmitterShape,
} from "three.quarks";
import { NOINK } from "./ink";

const DT = 1 / 30;
const mulberry = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- sprite textures (drawn once) ----------
const texCache: Record<string, THREE.Texture> = {};
const canvasTex = (key: string, draw: (g: CanvasRenderingContext2D, n: number) => void, n = 128) => {
  if (texCache[key]) return texCache[key];
  const cv = document.createElement("canvas"); cv.width = cv.height = n;
  draw(cv.getContext("2d")!, n);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return (texCache[key] = t);
};
const softDot = () => canvasTex("dot", (g, n) => {
  const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.85)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, n, n);
}, 64);
/** a lumpy cloud puff: a dozen overlapping soft blobs, so smoke reads as billows, not discs */
const puffTex = () => canvasTex("puff", (g, n) => {
  const rnd = mulberry(77);
  for (let k = 0; k < 14; k++) {
    const a = rnd() * Math.PI * 2, d = rnd() * n * 0.2, x = n / 2 + Math.cos(a) * d, y = n / 2 + Math.sin(a) * d, rr = n * (0.16 + 0.14 * rnd());
    const r = g.createRadialGradient(x, y, 0, x, y, rr);
    r.addColorStop(0, "rgba(255,255,255,0.55)"); r.addColorStop(0.6, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, n, n);
  }
  // a soft shaded underside so billows have volume in the toon world
  const sh = g.createLinearGradient(0, 0, 0, n); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.28)");
  g.globalCompositeOperation = "source-atop"; g.fillStyle = sh; g.fillRect(0, 0, n, n);
}, 128);
const mat = (map: THREE.Texture, additive = false) => new THREE.MeshBasicMaterial({
  map, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, fog: true,
});

// ---------- small builders ----------
const C4 = (r: number, g: number, b: number, a = 1) => new Vector4(r, g, b, a);
const iv = (a: number, b: number) => new IntervalValue(a, b);
const curve = (p0: number, p1: number, p2: number, p3: number) => new PiecewiseBezier([[new Bezier(p0, p1, p2, p3), 0]]);
const fade = (peak = 1, inAt = 0.12) => new ColorOverLife(new Gradient([[new QV3(1, 1, 1), 0], [new QV3(1, 1, 1), 1]], [[0, 0], [peak, inAt], [peak * 0.75, 0.55], [0, 1]]));
const gravity = (g: number) => new ApplyForce(new QV3(0, -1, 0), new ConstantValue(g));
const wind = (x: number, y: number, z: number, m: number) => new ApplyForce(new QV3(x, y, z), new ConstantValue(m));
const layers = () => { const l = new THREE.Layers(); l.set(NOINK); return l; };

type Spec = {
  start: number; // absolute seconds the system starts emitting
  at: [number, number, number] | ((t: number) => [number, number, number]);
  rot?: [number, number, number]; // emitter Euler (cone/circle emit along local +Z)
  shape: EmitterShape; life: [number, number]; speed: [number, number]; size: [number, number];
  color: [Vector4, Vector4]; rate?: number; burst?: number; additive?: boolean; puff?: boolean; behaviors: Behavior[];
  spin?: number; order?: number; rateAt?: (t: number) => number;
};
type Live = { ps: ParticleSystem; spec: Spec; rng: () => number; seed: number };

export class VfxRig {
  readonly br = new BatchedRenderer();
  private stage = new THREE.Scene(); // emitters live here (quarks only steps systems whose top parent is a Scene)
  private live: Live[] = [];
  private simT = -Infinity;
  private t0: number;
  constructor(parent: THREE.Object3D, specs: Spec[]) {
    parent.add(this.br);
    this.t0 = Math.min(...specs.map((s) => s.start));
    specs.forEach((spec, i) => {
      const ps = new ParticleSystem({
        looping: true, duration: 1, worldSpace: true, prewarm: false, autoDestroy: false,
        shape: spec.shape, startLife: iv(...spec.life), startSpeed: iv(...spec.speed), startSize: iv(...spec.size),
        startColor: new ColorRange(spec.color[0], spec.color[1]), startRotation: iv(0, Math.PI * 2),
        emissionOverTime: new ConstantValue(spec.rate ?? 0),
        emissionBursts: spec.burst ? [{ time: 0, count: new ConstantValue(spec.burst), cycle: 1, interval: 0.01, probability: 1 }] : [],
        behaviors: spec.spin ? [...spec.behaviors, new RotationOverLife(iv(-spec.spin, spec.spin))] : spec.behaviors,
        material: mat(spec.puff ? puffTex() : softDot(), spec.additive), renderMode: RenderMode.BillBoard,
        layers: layers(), renderOrder: spec.order ?? 2,
      });
      if (spec.burst) ps.looping = false;
      this.stage.add(ps.emitter);
      this.br.addSystem(ps);
      this.live.push({ ps, spec, rng: mulberry(1000 + 97 * i), seed: 1000 + 97 * i });
    });
    this.br.traverse((o) => o.layers.set(NOINK));
  }
  private place(l: Live, t: number) {
    const p = typeof l.spec.at === "function" ? l.spec.at(t) : l.spec.at;
    l.ps.emitter.position.set(...p);
    if (l.spec.rot) l.ps.emitter.rotation.set(...l.spec.rot);
    l.ps.emitter.updateMatrixWorld(true);
  }
  private reset() {
    for (const l of this.live) { l.ps.restart(); l.rng = mulberry(l.seed); this.place(l, l.spec.start); }
    this.simT = this.t0;
  }
  /** advance (or re-simulate) to absolute time t */
  step(t: number) {
    const target = Math.round(t / DT) * DT;
    if (target < this.simT - 1e-6 || this.simT === -Infinity) this.reset();
    const R = Math.random;
    try {
      while (this.simT < target - 1e-6) {
        const tn = this.simT + DT;
        for (const l of this.live) {
          if (tn < l.spec.start + DT * 0.5) continue;
          this.place(l, tn);
          if (l.spec.rateAt) (l.ps as unknown as { emissionOverTime: ConstantValue }).emissionOverTime = new ConstantValue(l.spec.rateAt(tn));
          Math.random = l.rng;
          (l.ps as unknown as { update: (d: number) => void }).update(DT);
          Math.random = R;
        }
        this.simT = tn;
      }
    } finally { Math.random = R; }
    for (const b of this.br.batches) b.update();
    this.br.traverse((o) => o.layers.set(NOINK));
  }
}

// ---------- the shots ----------
const UP: [number, number, number] = [-Math.PI / 2, 0, 0]; // cone/circle local +Z -> world up
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

/** night sea, shot 12: the Major goes over the side. Splash crown + mist + a widening foam ring, moonlit blue-white */
export const seaNight = (sl: number, x: number, z: number, t0: number): Spec[] => [
  { start: sl, at: [x, 0.05, z], rot: UP, shape: new ConeEmitter({ radius: 0.25, angle: 0.42, thickness: 1 }), burst: 140,
    life: [0.7, 1.3], speed: [2.6, 5.4], size: [0.04, 0.11], color: [C4(0.78, 0.86, 1.0, 0.95), C4(0.95, 0.98, 1.0, 1)],
    behaviors: [gravity(9.8), fade(1, 0.02)] },
  { start: sl + 0.05, at: [x, 0.2, z], rot: UP, shape: new ConeEmitter({ radius: 0.35, angle: 0.8, thickness: 1 }), burst: 18, puff: true,
    life: [1.0, 1.8], speed: [0.4, 1.0], size: [0.3, 0.6], color: [C4(0.42, 0.52, 0.72, 0.4), C4(0.55, 0.64, 0.85, 0.5)], spin: 0.8,
    behaviors: [gravity(0.6), new SizeOverLife(curve(0.5, 1.2, 1.6, 1.9)), fade(0.8, 0.08)] },
  { start: sl + 0.1, at: [x, 0.04, z], rot: FLAT, shape: new CircleEmitter({ radius: 0.35, thickness: 0.2 }), burst: 70, puff: true,
    life: [2.2, 3.2], speed: [0.5, 1.1], size: [0.18, 0.38], color: [C4(0.7, 0.8, 0.95, 0.6), C4(0.9, 0.95, 1.0, 0.75)], spin: 0.4,
    behaviors: [new SizeOverLife(curve(0.6, 1.0, 1.3, 1.5)), fade(0.85, 0.05)] },
  // low sea mist drifting across the whole night shot (depth layers between lens and submarine)
  { start: t0 - 6, at: [0.5, 0.35, -1.5], shape: new SphereEmitter({ radius: 7 }), rate: 6, puff: true,
    life: [5, 7], speed: [0.05, 0.2], size: [2.2, 3.6], color: [C4(0.45, 0.55, 0.75, 0.16), C4(0.55, 0.65, 0.85, 0.22)], spin: 0.15,
    behaviors: [wind(1, 0, 0, 0.12), fade(0.7, 0.25)] },
];

/** dawn at Huelva, shot 13: lapping spray at the fishing boat's hull + foam bobbing round the floating Major */
export const seaDawn = (t0: number, boat: [number, number], body: [number, number]): Spec[] => [
  { start: t0 - 3, at: [boat[0], 0.06, boat[1]], rot: FLAT, shape: new CircleEmitter({ radius: 1.15, thickness: 0.1 }), rate: 34,
    life: [0.45, 0.8], speed: [0.6, 1.4], size: [0.03, 0.07], color: [C4(1.0, 0.94, 0.82, 0.9), C4(1.0, 0.98, 0.92, 1)],
    behaviors: [wind(0, 1, 0, 9), gravity(16), fade(1, 0.05)] },
  { start: t0 - 5, at: [boat[0], 0.04, boat[1]], rot: FLAT, shape: new CircleEmitter({ radius: 1.25, thickness: 0.15 }), rate: 10, puff: true,
    life: [2.5, 3.5], speed: [0.1, 0.35], size: [0.25, 0.5], color: [C4(1.0, 0.95, 0.85, 0.55), C4(1.0, 0.98, 0.94, 0.75)], spin: 0.3,
    behaviors: [new SizeOverLife(curve(0.6, 1.0, 1.2, 1.3)), fade(0.8, 0.15)] },
  { start: t0 - 5, at: [body[0], 0.03, body[1]], rot: FLAT, shape: new CircleEmitter({ radius: 0.55, thickness: 0.4 }), rate: 7, puff: true,
    life: [2.5, 3.5], speed: [0.05, 0.25], size: [0.2, 0.4], color: [C4(1.0, 0.95, 0.86, 0.5), C4(1.0, 0.98, 0.94, 0.7)], spin: 0.3,
    behaviors: [new SizeOverLife(curve(0.6, 1.0, 1.2, 1.3)), fade(0.8, 0.15)] },
];

/** German map room, shots 14-15: dust motes turning in the two lamp cones; on 15, dust + exhaust trail the tank card */
export const hqDust = (t0: number, tank?: { start: number; at: (t: number) => [number, number, number]; rate: (t: number) => number }): Spec[] => {
  const s: Spec[] = [-1.2, 1.2].map((x) => ({
    start: t0 - 8, at: [x, 1.55, -0.6] as [number, number, number], shape: new SphereEmitter({ radius: 0.85 }), rate: 9, additive: true,
    life: [5, 8], speed: [0.01, 0.05], size: [0.012, 0.026], color: [C4(1.0, 0.85, 0.6, 0.5), C4(1.0, 0.92, 0.75, 0.85)] as [Vector4, Vector4],
    behaviors: [new Noise(new ConstantValue(0.35), new ConstantValue(0.04)), fade(1, 0.2)],
  }));
  if (tank) s.push(
    { start: tank.start, at: tank.at, rateAt: tank.rate, shape: new SphereEmitter({ radius: 0.06 }), rate: 22, puff: true,
      life: [0.6, 1.0], speed: [0.05, 0.2], size: [0.05, 0.09], color: [C4(0.74, 0.64, 0.5, 0.55), C4(0.86, 0.78, 0.62, 0.7)], spin: 1.0,
      behaviors: [wind(-1, 0.35, 0, 0.3), new SizeOverLife(curve(0.6, 1.3, 1.8, 2.1)), fade(0.85, 0.08)], order: 3 },
    { start: tank.start, at: (t) => { const p = tank.at(t); return [p[0] + 0.02, p[1] + 0.12, p[2]]; }, rateAt: (t) => tank.rate(t) * 0.5, shape: new SphereEmitter({ radius: 0.02 }), rate: 18, puff: true,
      life: [0.7, 1.1], speed: [0.1, 0.3], size: [0.05, 0.09], color: [C4(0.3, 0.3, 0.32, 0.7), C4(0.42, 0.42, 0.44, 0.85)], spin: 1.2,
      behaviors: [wind(-1, 0.8, 0, 0.6), new SizeOverLife(curve(0.6, 1.5, 2.2, 2.6)), fade(0.8, 0.06)], order: 3 },
  );
  return s;
};

/** Sicily, shot 17: two smoke columns from the warships offshore (one with a fire at its base), dust kicked up by boots,
 *  and big soft haze drifting through the foreground for depth */
export const beachSmoke = (t0: number): Spec[] => {
  const col = (x: number, z: number, sc: number): Spec[] => [
    { start: t0 - 12, at: [x, 0.5, z], rot: UP, shape: new ConeEmitter({ radius: 0.6 * sc, angle: 0.12 }), rate: 7, puff: true,
      life: [7, 9], speed: [1.6 * sc, 2.4 * sc], size: [2.2 * sc, 3.0 * sc], color: [C4(0.32, 0.31, 0.3, 0.75), C4(0.46, 0.44, 0.42, 0.85)], spin: 0.2,
      behaviors: [wind(1, 0.12, 0.1, 0.55 * sc), new SizeOverLife(curve(0.4, 1.4, 2.6, 3.4)), fade(0.85, 0.06)], order: 1 },
  ];
  return [
    ...col(-9, -42, 1.0), ...col(7, -58, 1.3),
    { start: t0 - 4, at: [-9, 0.4, -42], rot: UP, shape: new ConeEmitter({ radius: 0.7, angle: 0.25 }), rate: 30, additive: true,
      life: [0.5, 0.9], speed: [1.2, 2.4], size: [0.8, 1.5], color: [C4(1.0, 0.55, 0.15, 0.9), C4(1.0, 0.78, 0.3, 1)],
      behaviors: [new SizeOverLife(curve(1, 0.8, 0.5, 0.1)), fade(1, 0.1)], order: 1 },
    { start: t0 - 2, at: [0.2, 0.08, -1.5], shape: new SphereEmitter({ radius: 3.2 }), rate: 14, puff: true,
      life: [1.4, 2.2], speed: [0.1, 0.4], size: [0.25, 0.5], color: [C4(0.86, 0.78, 0.6, 0.45), C4(0.94, 0.86, 0.68, 0.6)], spin: 0.5,
      behaviors: [gravity(0.15), wind(1, 0.2, 0, 0.25), new SizeOverLife(curve(0.6, 1.3, 1.8, 2.1)), fade(0.8, 0.1)] },
    { start: t0 - 8, at: [0, 1.0, 3.5], shape: new SphereEmitter({ radius: 4.5 }), rate: 3, puff: true,
      life: [5, 7], speed: [0.05, 0.15], size: [2.0, 3.2], color: [C4(0.95, 0.9, 0.8, 0.1), C4(1.0, 0.95, 0.86, 0.15)], spin: 0.1,
      behaviors: [wind(1, 0, 0, 0.18), fade(0.7, 0.3)] },
  ];
};
