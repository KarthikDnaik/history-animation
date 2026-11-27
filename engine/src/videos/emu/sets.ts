// Places and cast of "The Great Emu War". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, rng, MAT, M4, beamBetween, plane, palm, scrub, hills, crate, earthHD } from "./props3d";
import { house, prop, Kit } from "./build";
import { stoneHD, grassHD, rep, planksHD } from "./paint";
import { Pen, INK, SKINS, fxSmoke, fxBurst, fxStars, fxPuff, Outfit, Expr, FrontOpts, emuSide, EmuOpts, fxPigeon, fxMuzzle, fxArms } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, light2D } from "./cast";
import { NOINK } from "./ink";
import { C } from "./cues";
import { FPS, V3, smooth, clamp01, easeOut, LEAD, SetId } from "./story";

// ---------------- cast ----------------
const soldier = (v: number, major = false): Outfit => ({
  jacket: "#8f8456", pants: "#857a50", boots: "#4a3426", hat: "slouch", hatCol: "#8a7650", trim: "#4a3a26", belt: "#5a4a30", buttons: "#c9b46a",
  skin: SKINS[v % 4], moustache: major || v % 3 === 1 ? "#4a3426" : undefined, build: major ? "stout" : "adult",
});
const FARMER: Outfit = { jacket: "#5f7fa8", pants: "#6b5a40", boots: "#4a3426", hat: "slouch", hatCol: "#a07a48", trim: "#6b4a2e", skin: SKINS[1], moustache: "#6a4a30" };
const POL = (v: number): Outfit => ({ jacket: ["#2e2b36", "#3a3346", "#2f3a4a"][v % 3], pants: "#2e2b36", boots: INK, hat: "hair", hair: ["#9a9a9a", "#3a2a1e", "#d0d0d0"][v % 3], skin: SKINS[v % 4], moustache: v % 2 ? "#6a6a6a" : undefined, buttons: "#d9dde0", build: v % 2 ? "stout" : "adult" });
const KIDP: Outfit = { jacket: "#e2453c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#2f5fb5", skin: SKINS[0], build: "kid" };

type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
const ramp = (t: number, a: number, b: number) => smooth((t - a) / Math.max(0.01, b - a));
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts, scale = 1, y = 0, shadow = true) => {
  c.out.places.push(person(c.cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...fo }, {}, scale));
  if (shadow && fo.mode !== "fall") blob(c.out, x, y, z, scale);
};
/** an emu at (x, z) heading along (dx, dz): mirrored so it always faces its motion on screen */
const emu = (c: Ctx, i: number, x: number, z: number, dx: number, o: EmuOpts, scale = 1, y = 0) => {
  const mirror = dx * c.cam.right.x < 0 ? true : false;
  const d = c.cam.pos.distanceTo(V(x, y + 1, z)) / scale;
  const [w, h, k] = d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
  const eye = o.eye ?? (blinkOf(c.t, i) ? "blink" : "dot");
  const oo: EmuOpts = { ...o, eye, phase: q(o.phase ?? 0, 16), light: light2D(c.cam, mirror) };
  c.out.places.push({ key: `emu|${JSON.stringify(oo)}`, x, y, z, scale, mirror, draw: (p) => emuSide(p, oo), size: [w, h, k] });
  blob(c.out, x, y, z, scale * 1.1);
};
const blinkOf = (t: number, i: number) => { const f = Math.round(t * FPS), s = Math.round(40 * hh(i, 9)); return (f + s) % Math.round(45 + 30 * hh(i, 3)) < 3; };
const puff = (c: Ctx, at: number, p: V3, size: number, life = 1, col?: number[]) => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  c.out.fx.push({ key: `puff${col ? col.join() : ""}${k}`, cw: 300, ch: 300, draw: (pen) => fxSmoke(pen, k, col), x: p[0], y: p[1] + 0.3 * size * u, z: p[2], w: size * (0.6 + 0.6 * u), h: size * (0.6 + 0.6 * u), soft: true });
};
const dust = (c: Ctx, at: number, p: V3, size: number) => puff(c, at, p, size, 0.7, [214, 190, 150]);
const spark = (c: Ctx, at: number, p: V3, size: number, life = 0.25, col = "#fff3b0") => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  c.out.fx.push({ key: `burst${col}${k}`, cw: 500, ch: 500, draw: (pen) => fxBurst(pen, k, col), x: p[0], y: p[1], z: p[2], w: size, h: size, glow: 1.5 });
};
/** a Lewis gun firing toward screen direction `ang` (radians on screen): flash on every 3rd frame */
const muzzle = (c: Ctx, p: V3, t0: number, t1: number, ang: number, size = 0.7) => {
  if (c.t < t0 || c.t > t1) return;
  const f = Math.round(c.t * FPS);
  if (f % 3 === 2) return;
  const k = q((c.t * 3) % 1, 4);
  c.out.fx.push({ key: `muz${k}`, cw: 300, ch: 200, draw: (pen) => fxMuzzle(pen, k * 10), x: p[0], y: p[1], z: p[2], w: size, h: size * 0.66, rot: ang, glow: 2.2 });
};

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const wheatTex = () => ctex("wheatHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9b25a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { const x = r() * 1024, y = r() * 1024; g.strokeStyle = ["#e8c46a", "#c9a04a", "#f0d27e"][i % 3]; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 18 - r() * 14); g.stroke(); }
});
/** golden wheat tufts (no ink: they would outline as noise) */
const wheat = (s: SetBuild, x0: number, x1: number, z0: number, z1: number, n: number, seed: number) => {
  const r = rng(seed), g = new THREE.SphereGeometry(0.24, 7, 5).scale(1, 2.0, 1).translate(0, 0.3, 0);
  const m = new THREE.InstancedMesh(g, lam("wheatTuft", () => ({ color: "#e0b95c" })), n), M = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const sc = 0.7 + 0.6 * r(); M.compose(V(x0 + (x1 - x0) * r(), 0, z0 + (z1 - z0) * r()), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), r() * 6), V(sc, sc * (0.8 + 0.4 * r()), sc)); m.setMatrixAt(i, M); }
  m.layers.set(NOINK); m.receiveShadow = true; s.root.add(m);
};
/** 1930s army truck along local +x (cab at +x) */
export const truck = (b: Batch, m: THREE.Matrix4, guns = false) => {
  const G = lam("truckG", () => ({ color: "#556347" })), K = lam("tyre", () => ({ color: "#2a2a30" })), W = MAT.wood();
  const at = (x: number, y: number, z: number, ry = 0) => new THREE.Matrix4().multiplyMatrices(m, M4(x, y, z, ry));
  b.add(boxGeo(V(1.2, 0.7, -0.75), V(2.4, 1.35, 0.75)), G, m);            // bonnet
  b.add(boxGeo(V(0.3, 0.7, -0.95), V(1.3, 2.2, 0.95)), G, m);             // cab
  b.add(boxGeo(V(0.25, 2.2, -1.0), V(1.4, 2.3, 1.0)), lam("cabRoof", () => ({ color: "#3f4a35" })), m);
  b.add(boxGeo(V(-2.8, 0.75, -1.05), V(0.3, 0.95, 1.05), 1), W, m);       // tray
  for (const z of [-1.05, 1.05]) b.add(boxGeo(V(-2.8, 0.95, z - 0.04), V(0.3, 1.45, z + 0.04), 1), W, m);
  b.add(boxGeo(V(-2.85, 0.95, -1.05), V(-2.77, 1.45, 1.05), 1), W, m);
  for (const x of [1.7, -1.9]) for (const z of [-0.95, 0.95]) b.add(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16).rotateX(Math.PI / 2), K, at(x, 0.45, z));
  for (const z of [-0.6, 0.6]) b.add(new THREE.SphereGeometry(0.12, 8, 6), lam("lamp", () => ({ color: "#f1e8c0" })), at(2.42, 1.15, z));
  if (guns) lewis(b, at(-1.2, 1.45, 0, 0));
};
/** Lewis gun on a bipod, barrel along local +x, ~1.3 m long */
export const lewis = (b: Batch, m: THREE.Matrix4) => {
  const I = MAT.iron(), at = (x: number, y: number, z: number) => new THREE.Matrix4().multiplyMatrices(m, M4(x, y, z));
  b.add(beamBetween(V(-0.3, 0.45, 0), V(0.75, 0.45, 0), 0.07, 12), I, m);
  b.add(beamBetween(V(0.75, 0.45, 0), V(1.0, 0.45, 0), 0.02, 6), I, m);
  b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18), I, at(0.05, 0.56, 0));
  b.add(beamBetween(V(-0.3, 0.45, 0), V(-0.65, 0.36, 0), 0.04, 6), MAT.wood(), m);
  for (const s of [-1, 1]) b.add(beamBetween(V(0.55, 0.42, 0), V(0.7, 0, 0.25 * s), 0.015, 5), I, m);
};
const plainGround = (b: Batch) => {
  b.add(plane(-500, 500, -500, 500, 1), lam("plainEarth", () => ({ map: rep(earthHD("emuEarth", ["#c69a62", "#b98c58", "#cfa874", "#a8925a"], "#8a9a4a"), 1, 1) })));
};
const windmill = (b: Batch, x: number, z: number) => {
  const I = lam("millIron", () => ({ color: "#8a8d94" }));
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.add(beamBetween(V(x + dx * 1.2, 0, z + dz * 1.2), V(x + dx * 0.25, 9, z + dz * 0.25), 0.05), I);
  for (const y of [3, 6]) b.add(boxGeo(V(x - 0.9 + y * 0.09, y, z - 0.9 + y * 0.09), V(x + 0.9 - y * 0.09, y + 0.08, z + 0.9 - y * 0.09)), I);
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; b.add(beamBetween(V(x, 9.5, z + 0.4), V(x + 1.8 * Math.cos(a), 9.5 + 1.8 * Math.sin(a), z + 0.4), 0.09), I); }
  b.add(boxGeo(V(x - 0.1, 9.3, z - 1.9), V(x + 0.1, 9.7, z + 0.2)), I);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  farm: (s) => {
    const { b, kit } = s;
    b.add(plane(-500, 500, -500, 500, 1), lam("farmEarth", () => ({ map: rep(earthHD("farmEarth", ["#c9a066", "#bd955c", "#d2ad78", "#ab9a5c"], "#9aa24e"), 1, 1) })));
    b.add(plane(-60, 60, -90, -3, 4, 0.01), lam("wheatG", () => ({ map: rep(wheatTex(), 1, 1) })));
    wheat(s, -40, 40, -70, -4, 2600, 3);
    house(b, -16, -34, 0, 10, 7, 3.6, 4, 0); windmill(b, 12, -42);
    for (let k = 0; k < 26; k++) b.add(boxGeo(V(-40 + k * 3.2 - 0.06, 0, -2.6), V(-40 + k * 3.2 + 0.06, 1.1, -2.48)), MAT.darkWood());
    for (const y of [0.55, 0.95]) b.add(boxGeo(V(-40, y, -2.58), V(42, y + 0.05, -2.52)), MAT.darkWood());
    for (let k = 0; k < 12; k++) prop(b, kit, "tree_fat", -90 + 16 * k, 0, -110 - 20 * hh(k), 9 + 4 * hh(k, 2));
    hills(b, 0, 0, 450, 14, 30, 21);
    lewis(b, M4(0, 0, 0, Math.PI / 2)); lewis(b, M4(1.6, 0, 0.3, Math.PI / 2 + 0.1));
    truck(b, M4(-6, 0, 7, 0.4));
    for (let k = 0; k < 10; k++) crate(b, -2.2 + (k % 5) * 0.75, Math.floor(k / 5) * 0.56, 4.2, 0.7, 0.1 * k);
  },
  plain: (s) => {
    const { b, kit } = s;
    plainGround(b);
    for (let k = 0; k < 70; k++) scrub(b, -150 + 300 * hh(k, 5), -160 + 150 * hh(k, 6), 0.8 + hh(k, 7), k, "#8a9a4a");
    for (let k = 0; k < 18; k++) prop(b, kit, k % 2 ? "tree_fat" : "tree_oak", -140 + 280 * hh(k, 8), 0, -60 - 120 * hh(k, 9), 7 + 4 * hh(k, 10));
    hills(b, 0, 0, 480, 16, 34, 9);
    lewis(b, M4(0, 0, 0, Math.PI / 2));
    for (let k = 0; k < 8; k++) crate(b, 3 + (k % 4) * 0.75, Math.floor(k / 4) * 0.56, 2.5, 0.7, 0.2 * k);
    // spent brass cases around the crates (shot 8)
    const shell = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6).rotateZ(Math.PI / 2), lam("brass", () => ({ color: "#e0b04a" })), 900), M = new THREE.Matrix4(), r = rng(77);
    for (let i = 0; i < 900; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 1.6; M.compose(V(4.2 + d * Math.cos(a), 0.012 + 0.01 * r(), 3.6 + d * Math.sin(a)), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), r() * 6), V(1, 1, 1)); shell.setMatrixAt(i, M); }
    shell.layers.set(NOINK); s.root.add(shell);
    const g = new THREE.Group(), tb = new Batch(); truck(tb, new THREE.Matrix4(), true); tb.build(g); s.root.add(g); s.dyn.truck = g;
  },
  dam: (s) => {
    const { b, kit } = s;
    plainGround(b);
    b.add(new THREE.CircleGeometry(9, 40).rotateX(-Math.PI / 2), lam("damWater", () => ({ color: "#5d8a7a" })), M4(0, 0.03, -10));
    b.add(new THREE.TorusGeometry(9.6, 1.0, 8, 40).rotateX(Math.PI / 2).scale(1, 0.5, 1), lam("damBank", () => ({ color: "#a8845a" })), M4(0, 0, -10));
    for (let k = 0; k < 10; k++) prop(b, kit, "tree_oak", -16 + 32 * hh(k, 3), 0, -24 - 8 * hh(k, 4), 6 + 3 * hh(k, 5));
    for (let k = 0; k < 14; k++) scrub(b, -8 + 16 * hh(k, 6), 0.8 + 1.5 * hh(k, 7), 0.6, k + 9, "#7d9a4a");
    lewis(b, M4(0.2, 0, 1.0, Math.PI / 2));
    hills(b, 0, 0, 420, 14, 30, 4);
  },
  park: (s) => {
    const { b, kit } = s;
    b.add(plane(-80, 80, -80, 80, 1), lam("parkGrass", () => ({ map: grassHD() })));
    b.add(plane(-1.6, 1.6, -60, 20, 2, 0.01), lam("path", () => ({ color: "#d8c49a" })));
    for (const x of [-3.4, 3.4]) { b.add(boxGeo(V(x - 0.9, 0.42, -6.2), V(x + 0.9, 0.5, -5.7)), MAT.wood()); b.add(boxGeo(V(x - 0.9, 0.5, -6.25), V(x + 0.9, 0.95, -6.15)), MAT.wood()); for (const dx of [-0.8, 0.8]) b.add(boxGeo(V(x + dx - 0.04, 0, -6.2), V(x + dx + 0.04, 0.42, -5.7)), MAT.iron()); }
    for (let k = 0; k < 14; k++) prop(b, kit, k % 3 ? "tree_oak" : "tree_detailed", (k % 2 ? 1 : -1) * (7 + 10 * hh(k)), 0, -8 - 40 * hh(k, 2), 6 + 3 * hh(k, 3));
    house(b, -12, -50, 0, 10, 8, 9, 2, 0); house(b, 2, -54, 0, 12, 8, 10, 6, 0); house(b, 16, -50, 0, 10, 8, 9, 0, 0);
  },
  parliament: (s) => {
    const { b } = s;
    b.add(plane(-8, 8, -14, 6, 1), lam("chamberFloor", () => ({ map: planksHD() })));
    const GB = lam("bench", () => ({ color: "#3f7a4f" })), WD = lam("panel", () => ({ color: "#7a5236" }));
    for (const side of [-1, 1]) for (let r = 0; r < 4; r++) {
      const x = side * (2.0 + r * 0.9), y = r * 0.35;
      b.add(boxGeo(V(Math.min(x, x + side * 0.9), 0, -12), V(Math.max(x, x + side * 0.9), y + 0.01, 4)), WD);
      b.add(boxGeo(V(x - 0.35, y, -12), V(x + 0.35, y + 0.45, 4)), GB);
      b.add(boxGeo(V(x + side * 0.3 - 0.05, y, -12), V(x + side * 0.3 + 0.05, y + 1.0, 4)), GB);
    }
    b.add(quad(V(-8, 0, -12), V(8, 0, -12), V(8, 7, -12), V(-8, 7, -12), 4, 2), lam("backPanel", () => ({ map: rep(planksHD(), 1, 1), color: "#a8805a" })));
    b.add(boxGeo(V(-1.0, 0, -11.6), V(1.0, 3.2, -10.8)), WD); b.add(boxGeo(V(-1.2, 3.2, -11.7), V(1.2, 3.6, -10.7)), lam("canopy", () => ({ color: "#5a3a26" })));
    b.add(boxGeo(V(-0.9, 0, -5), V(0.9, 0.9, -3.2)), lam("table", () => ({ color: "#6e4a30" })));
  },
  arms: (s) => {
    const { b } = s;
    b.add(plane(-60, 60, -60, 40, 2), lam("forecourt", () => ({ map: stoneHD("fcHD", ["#d9d3c4", "#cfc8b8", "#e2dccd", "#c6bfae"], "#a49c8a") })));
    b.add(quad(V(-14, 0, -4), V(14, 0, -4), V(14, 12, -4), V(-14, 12, -4), 4, 3), lam("facade", () => ({ map: stoneHD("facHD", ["#e8e0cc", "#ded5c0", "#efe8d6", "#d6ccb6"], "#b0a690") })));
    for (const x of [-9, -5, 5, 9]) b.add(new THREE.CylinderGeometry(0.45, 0.5, 9, 16), lam("column", () => ({ color: "#eee6d4" })), M4(x, 4.5, -3.2));
    b.add(boxGeo(V(-14, 9, -4.2), V(14, 10, -2.6)), lam("entab", () => ({ color: "#e4dcc8" })));
    const em = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.9), new THREE.MeshLambertMaterial({ map: ctex("arms", 800, 700, (g) => fxArms(new Pen(g))), transparent: true, alphaTest: 0.5 }));
    em.position.set(0, 5.3, -3.95); s.root.add(em);
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(-6, 0, -2.6 + k * 0.4), V(6, 0.2 * (4 - k), -2.2 + k * 0.4)), lam("steps", () => ({ color: "#d4ccba" })));
  },
};

// ---------------- dynamic ----------------
export const TRUCK_X = (t: number, id: number) => id === 7 ? -8 + 9 * (t - C.l6) : id === 16 ? 0 : 0;
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  plain: (s, t, id) => {
    const tr = s.dyn.truck;
    tr.visible = id === 7 || id === 16;
    if (id === 7) { tr.position.set(TRUCK_X(t, 7), 0.04 * Math.sin(t * 17), -12.0); tr.rotation.set(0.01 * Math.sin(t * 13), 0, 0); }
    if (id === 16) { const u = Math.max(0, t - C.l15 - 0.3); tr.position.set(1.5, 0, -6 - 7 * u * u * 0.5 - 2 * u); tr.rotation.set(0, Math.PI / 2, 0); }
  },
};

// ---------------- staging per shot ----------------
const herd = (c: Ctx, n: number, cx: number, cz: number, rx: number, rz: number, o: (i: number) => EmuOpts, dir: (i: number) => [number, number] = () => [1, 0], seed = 0, scale = 1) => {
  for (let i = 0; i < n; i++) {
    const [dx, dz] = dir(i), x = cx + (hh(i, seed + 1) - 0.5) * 2 * rx, z = cz + (hh(i, seed + 2) - 0.5) * 2 * rz;
    emu(c, i + seed * 1000, x + dx, z + dz, dx || hh(i, 7) - 0.5, o(i), scale);
  }
};
type StageFn = (c: Ctx) => void;
export const STAGE: Record<number, StageFn> = {
  1: (c) => {
    const t = c.t;
    pose(c, 1, soldier(0), "s0", 0.05, 0.85, { mode: "stand", expr: after(t, C.won) ? "shock" : "stern" });
    pose(c, 2, soldier(1, true), "maj", 1.05, 1.35, { mode: "stand", expr: after(t, C.won) ? "nervous" : "smug", prop: "point" });
    for (const [x, z] of [[0, 0], [1.6, 0.3]] as const) muzzle(c, [x, 0.45, z - 1.05], C.birds0 - 0.2, C.won - 0.3, Math.PI / 2, 0.6);
    herd(c, 26, 0, -14, 9, 5, (i) => ({ mode: after(t, C.won) ? "stand" : "run", phase: (t * 1.6 + hh(i)) % 1, eye: after(t, C.won) ? "smug" : undefined }), (i) => [after(t, C.won) ? 0 : ((t * 2 + hh(i, 4) * 20) % 14) - 7, 0], 1);
    if (after(t, C.won)) emu(c, 900, 0.3, 0.6, -1, { mode: "stand", eye: "smug", phase: t % 1 }, 1, 0); // the winner, by the gun
  },
  2: (c) => {
    const t = c.t;
    pose(c, 1, FARMER, "farmer", 2.4, -1.0, { mode: "stand", expr: after(t, C.wheat) ? "grin" : "smile", wave: after(t, C.wheat) ? q(Math.sin(t * 8), 20) : undefined });
  },
  3: (c) => {
    const t = c.t, eat = after(t, C.eating);
    pose(c, 1, FARMER, "farmer", -1.2, -1.6, { mode: "stand", expr: eat ? "shock" : "nervous" });
    herd(c, 60, 0, -30, 26, 14, (i) => ({ mode: eat && i % 3 ? "eat" : "run", phase: (t * 1.4 + hh(i)) % 1 }), (i) => [0, eat ? 0 : (t - C.l2) * 6 - 6], 2);
    if (eat) for (let k = 0; k < 3; k++) emu(c, 950 + k, 1.2 + 1.4 * k, -4.4 - 0.8 * k, k % 2 ? -1 : 1, { mode: "eat", phase: (t * 1.3 + 0.3 * k) % 1 });
  },
  4: (c) => {
    const t = c.t;
    pose(c, 1, soldier(1, true), "maj", -0.6, 2.4, { mode: "stand", expr: after(t, C.guns3) ? "smug" : "stern" });
    pose(c, 2, soldier(2), "s2", -3.4, 3.4, { mode: "stand", expr: "neutral" });
    pose(c, 3, FARMER, "farmer", 1.4, 2.0, { mode: "stand", expr: after(t, C.ten) ? "grin" : "relief" });
  },
  5: (c) => {
    const t = c.t, split = after(t, C.split);
    pose(c, 1, soldier(0), "s0", -0.7, 0.7, { mode: "stand", expr: split ? "nervous" : "stern" });
    pose(c, 2, soldier(2), "s2", 0.9, 1.0, { mode: "stand", expr: split ? "shock" : "smug" });
    muzzle(c, [0, 0.45, -1.05], C.fire - 0.1, C.split + 1.2, Math.PI / 2, 0.6);
    const ts = Math.max(0, t - C.split + LEAD);
    herd(c, 50, 0, -22, 4, 3, (i) => ({ mode: split ? "run" : "stand", phase: (t * 2 + hh(i)) % 1 }), (i) => { const a = hh(i, 11) * 6.28; return [Math.cos(a) * 9 * ts, Math.sin(a) * 9 * ts]; }, 3);
    if (split) for (let k = 0; k < 6; k++) dust(c, C.split + 0.1 * k, [-3 + 1.2 * k, 0.4, -22 + (k % 2)], 1.6);
  },
  6: (c) => {
    const t = c.t, jam = after(t, C.jams);
    pose(c, 1, soldier(0), "s0", -0.25, 1.5, { mode: "stand", expr: jam ? "shock" : "smug" });
    pose(c, 2, soldier(1), "s1", 0.85, 1.75, { mode: "stand", expr: jam ? "dazed" : "stern", headTilt: jam ? 6 : 0 });
    muzzle(c, [0.2, 0.45, -0.05], C.jams - 0.7, C.jams - LEAD, Math.PI / 2, 0.6);
    if (jam) { puff(c, C.jams, [0.2, 0.6, 0.6], 0.9, 0.9, [120, 116, 128]); spark(c, C.jams, [0.2, 0.6, 0.7], 0.6, 0.3, "#ffffff"); const u = ((t * 0.9) % 1); c.out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x: 1.4, y: 2.25, z: 2.1, w: 0.75, h: 0.375 }); }
    herd(c, 16, 0, -14, 7, 2.5, (i) => ({ mode: jam ? "stand" : i % 2 ? "eat" : "stand", phase: (t + hh(i)) % 1, eye: jam ? "smug" : undefined }), () => [0, 0], 4);
  },
  7: (c) => {
    const t = c.t, X = TRUCK_X(t, 7), out = after(t, C.outrun);
    pose(c, 1, soldier(0), "s0", X - 1.2, -12.0, { mode: "stand", expr: out ? "shock" : "stern" }, 1, 1.0, false);
    pose(c, 2, soldier(2), "s2", X - 2.2, -11.8, { mode: "stand", expr: out ? "nervous" : "smug" }, 1, 1.0, false);
    muzzle(c, [X - 0.2, 1.9, -12.0], C.truck, C.outrun + 0.5, 0, 0.6);
    for (let k = 0; k < 7; k++) {
      const lead = (out ? 2 + 7 * (t - C.outrun) : 0) + k * 1.4 - 3;
      emu(c, 300 + k, X + 4 + lead + 0.4 * hh(k), -9.6 + 1.6 * hh(k, 2), 1, { mode: "run", phase: (t * 2.6 + hh(k, 3)) % 1, eye: out ? "smug" : undefined });
      dust(c, Math.floor(t * 6) / 6, [X + 3 + lead, 0.25, -9.6 + 1.6 * hh(k, 2)], 0.8);
    }
    dust(c, Math.floor(t * 5) / 5, [X - 3.2, 0.3, -12.0], 1.6);
  },
  8: (c) => {
    const t = c.t;
    pose(c, 1, soldier(0), "s0", 3.0, 3.6, { mode: "sit", expr: "dazed" }, 1, 0.55);
    pose(c, 2, soldier(1, true), "maj", 4.9, 3.4, { mode: "stand", expr: after(t, C.hit) ? "nervous" : "stern" });
    herd(c, 8, 4, -9, 6, 2, (i) => ({ mode: i % 2 ? "eat" : "stand", phase: (t + hh(i)) % 1 }), () => [0, 0], 5);
  },
  9: (c) => {
    const t = c.t;
    for (let k = 0; k < 3; k++) pose(c, k, soldier(k), `s${k}`, -0.75 + 0.75 * k, 1.0 - 0.25 * (k % 2), { mode: "stand", expr: (["relief", "grin", "relief_open"] as Expr[])[k], prop: k === 1 ? "shrug" : null });
  },
  10: (c) => {
    const t = c.t;
    for (let k = 0; k < 5; k++) emu(c, 400 + k, -2.4 + 1.2 * k, -0.2 - 0.3 * (k % 2), k % 2 ? -1 : 1, { mode: "stand", eye: "smug", phase: (t * 0.8 + 0.2 * k) % 1 });
  },
  11: (c) => {
    const t = c.t;
    pose(c, 1, soldier(1, true), "maj", 0, 0.8, { mode: "stand", expr: after(t, C.win) ? "nervous" : "stern", prop: "shrug" });
  },
  12: (c) => {
    const t = c.t, go = after(t, C.explodes);
    const lunge = ramp(t, C.flock - 0.4, C.explodes);
    pose(c, 1, KIDP, "kid", -1.6 + 0.8 * lunge, 0.6, { mode: "stand", expr: after(t, C.nobody) ? "nervous" : go ? "shock" : "grin", prop: go ? "shrug" : "point" }, 0.72);
    for (let i = 0; i < 22; i++) {
      const a = hh(i, 3) * 6.28, r0 = 0.5 + 1.4 * hh(i, 4), x0 = 0.4 + Math.cos(a) * r0, z0 = -1.6 + Math.sin(a) * r0 * 0.7;
      const u = go ? Math.max(0, t - C.explodes + LEAD) : 0, fly = u > 0;
      const x = x0 + Math.cos(a) * 2.4 * u, z = z0 + Math.sin(a) * 2 * u, y = fly ? 1.3 * u + 0.5 * u * u : 0;
      const flap = fly ? q(0.5 + 0.5 * Math.sin(t * 40 + i), 6) : 0, peck = fly ? 0 : q(Math.max(0, Math.sin(t * 5 + i * 1.7)), 4);
      const mir = Math.cos(a) * c.cam.right.x < 0;
      c.out.fx.push({ key: `pig${flap}|${peck}|${mir}`, cw: 300, ch: 300, draw: (p) => { if (mir) { p.g.translate(300, 0); p.g.scale(-1, 1); } fxPigeon(p, flap, peck); }, x, y: y + 0.17, z, w: 0.36, h: 0.36 });
    }
  },
  13: (c) => {
    const t = c.t, sc = after(t, C.scatter), ts = Math.max(0, t - C.scatter + LEAD);
    herd(c, 30, -4 + 12 * (t - C.l12), -10, 5, 3, (i) => ({ mode: "run", phase: (t * 3 + hh(i)) % 1 }), (i) => { const a = hh(i, 12) * 6.28; return sc ? [Math.cos(a) * 10 * ts, Math.sin(a) * 8 * ts] : [0, 0]; }, 6);
    for (let k = 0; k < 8; k++) dust(c, Math.floor(t * 6) / 6 + k * 0.01, [-6 + 12 * (t - C.l12) + 1.5 * (k - 4), 0.3, -10 + (k % 3) - 1], 1.4);
  },
  14: (c) => {
    const t = c.t;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) emu(c, 500 + r * 5 + k, -2.4 + 1.2 * k + 0.6 * (r % 2), -1.5 - 1.6 * r, 1, { mode: "march", phase: (t * 1.5) % 1, helmet: true, eye: "smug" });
    pose(c, 1, soldier(1, true), "maj", 2.0, 1.6, { mode: "stand", expr: after(t, C.tanks) ? "shock" : "nervous" });
  },
  15: (c) => {
    const t = c.t, med = after(t, C.medals);
    pose(c, 1, POL(0), "pol0", 0.9, -2.2, { mode: "stand", expr: med ? "laugh" : "smug", prop: "point" });
    const seats: [number, number, number][] = [[-2.0, 0, -1], [-2.0, 0, -3], [-2.9, 0.35, -2], [2.0, 0, -6], [2.9, 0.35, -5], [-2.0, 0, -6], [3.8, 0.7, -3]];
    seats.forEach(([x, y, z], i) => pose(c, 2 + i, POL(i + 1), `pol${(i + 1) % 3}`, x, z, { mode: "sit", expr: med ? (i % 2 ? "laugh" : "grin") : "neutral" }, 1, y + 0.45, false));
    if (med) emu(c, 700, -2.0, -4.4, 1, { mode: "stand", eye: "smug", medal: true, phase: t % 1 }, 1, 0.45);
  },
  16: (c) => {
    const t = c.t;
    for (let k = 0; k < 4; k++) emu(c, 800 + k, -1.6 + 1.1 * k, 1.2 - 0.4 * (k % 2), k % 2 ? -1 : 1, { mode: "stand", eye: after(t, C.stayed) ? "smug" : undefined, phase: (t + 0.3 * k) % 1 });
    pose(c, 1, soldier(0), "s0", 1.5, -6 - Math.max(0, t - C.l15 - 0.3) * (2 + 3.5 * Math.max(0, t - C.l15 - 0.3)) + 0.4, { mode: "stand", expr: "dazed" }, 1, 1.0, false);
  },
  17: (c) => {
    const t = c.t;
    emu(c, 990, 0.9, -1.0, -1, { mode: "stand", eye: after(t, C.coat) ? "smug" : undefined, medal: true, phase: t % 1 });
  },
};
