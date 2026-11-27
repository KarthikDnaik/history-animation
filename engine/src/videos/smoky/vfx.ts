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
const UP: [number, number, number] = [-Math.PI / 2, 0, 0];
type P3 = [number, number, number];
/** camp: grey wood smoke curling from the squad tents' stovepipes, drifting with the wind */
export const stoveSmoke = (t0: number, pipes: P3[]): Spec[] => pipes.map((p) => ({
  start: t0 - 8, at: p, rot: UP, shape: new ConeEmitter({ radius: 0.08, angle: 0.15 }), rate: 7, puff: true,
  life: [3.5, 5], speed: [0.5, 0.8], size: [0.35, 0.6], color: [C4(0.62, 0.62, 0.62, 0.55), C4(0.78, 0.78, 0.8, 0.7)] as [Vector4, Vector4], spin: 0.4,
  behaviors: [wind(1, 0.15, 0.2, 0.35), new SizeOverLife(curve(0.5, 1.6, 2.6, 3.2)), fade(0.8, 0.1)], order: 1,
}));
/** front: a shell burst = white-hot flash + flying earth + a rolling smoke column; plus slow battlefield haze */
export const battle = (booms: [number, P3][], t0: number): Spec[] => [
  ...booms.flatMap(([t, p]): Spec[] => [
    { start: t, at: [p[0], p[1] + 0.3, p[2]], shape: new SphereEmitter({ radius: 0.3 }), burst: 10, additive: true,
      life: [0.12, 0.25], speed: [0.1, 0.4], size: [2.2, 3.6], color: [C4(1, 0.75, 0.35, 1), C4(1, 0.95, 0.7, 1)],
      behaviors: [new SizeOverLife(curve(0.6, 1.2, 1.0, 0.3)), fade(1, 0.01)], order: 3 },
    { start: t, at: [p[0], p[1] + 0.1, p[2]], rot: UP, shape: new ConeEmitter({ radius: 0.4, angle: 0.55 }), burst: 60,
      life: [0.8, 1.5], speed: [5, 11], size: [0.08, 0.22], color: [C4(0.3, 0.22, 0.14, 1), C4(0.45, 0.34, 0.22, 1)], spin: 4,
      behaviors: [gravity(14), fade(1, 0.02)], order: 3 },
    { start: t, at: [p[0], p[1] + 0.4, p[2]], rot: UP, shape: new ConeEmitter({ radius: 0.6, angle: 0.35 }), burst: 22, puff: true,
      life: [2.5, 4], speed: [1.5, 3.5], size: [1.2, 2.2], color: [C4(0.22, 0.2, 0.19, 0.8), C4(0.36, 0.33, 0.3, 0.9)], spin: 0.4,
      behaviors: [wind(1, 0.2, 0, 0.4), new SizeOverLife(curve(0.5, 1.5, 2.3, 2.8)), fade(0.85, 0.05)], order: 2 },
  ]),
  { start: t0 - 10, at: [0, 6, -12], shape: new SphereEmitter({ radius: 14 }), rate: 5, puff: true,
    life: [6, 9], speed: [0.05, 0.2], size: [5, 8], color: [C4(0.45, 0.38, 0.34, 0.16), C4(0.6, 0.5, 0.42, 0.22)], spin: 0.1,
    behaviors: [wind(1, 0, 0, 0.25), fade(0.7, 0.25)], order: 1 },
];
/** airfield: low wind-blown sand skimming the strip, plus slow heat haze far off */
export const sandDrift = (t0: number): Spec[] => [
  { start: t0 - 6, at: [-6, 0.15, 4], shape: new SphereEmitter({ radius: 4 }), rate: 40, additive: false,
    life: [1.5, 3], speed: [0.1, 0.3], size: [0.02, 0.05], color: [C4(0.85, 0.75, 0.55, 0.8), C4(0.95, 0.88, 0.7, 0.9)], spin: 2,
    behaviors: [wind(1, 0.05, -0.1, 2.2), fade(0.9, 0.1)], order: 2 },
  { start: t0 - 10, at: [0, 1.5, -20], shape: new SphereEmitter({ radius: 18 }), rate: 3, puff: true,
    life: [6, 9], speed: [0.05, 0.15], size: [6, 9], color: [C4(0.95, 0.88, 0.72, 0.1), C4(1, 0.95, 0.85, 0.16)], spin: 0.05,
    behaviors: [wind(1, 0, 0, 0.3), fade(0.6, 0.25)], order: 1 },
];
/** jungle: hanging ground mist and drifting motes/gnats catching light */
export const jungleAir = (t0: number): Spec[] => [
  { start: t0 - 10, at: [0, 0.4, -3], shape: new SphereEmitter({ radius: 8 }), rate: 4, puff: true,
    life: [7, 10], speed: [0.03, 0.1], size: [2.5, 4.5], color: [C4(0.85, 0.92, 0.85, 0.14), C4(0.95, 1, 0.95, 0.22)], spin: 0.05,
    behaviors: [wind(1, 0, 0.2, 0.08), fade(0.7, 0.3)], order: 1 },
  { start: t0 - 5, at: [0.5, 1.2, 0], shape: new SphereEmitter({ radius: 3 }), rate: 14, additive: true,
    life: [2, 4], speed: [0.05, 0.25], size: [0.015, 0.035], color: [C4(1, 0.95, 0.7, 0.8), C4(1, 1, 0.85, 1)],
    behaviors: [new Noise(new ConstantValue(0.6), new ConstantValue(0.4)), fade(1, 0.15)], order: 3 },
];
/** inside the culvert: dust motes hanging in the shaft of light from the far mouth */
export const pipeDust = (t0: number, r: number): Spec[] => [
  { start: t0 - 5, at: [0, r, -2], shape: new SphereEmitter({ radius: r * 0.9 }), rate: 30, additive: true,
    life: [2.5, 4], speed: [0.01, 0.06], size: [0.006, 0.016], color: [C4(1, 0.92, 0.75, 0.7), C4(1, 1, 0.9, 0.95)],
    behaviors: [new Noise(new ConstantValue(0.2), new ConstantValue(0.15)), wind(0, 0, -1, 0.05), fade(1, 0.2)], order: 3 },
];
