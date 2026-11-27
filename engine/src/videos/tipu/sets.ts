// The places of the rocket short (one per shot group) and who/what is in them at time t. Each canvas builds only the
// set of its own shot (world.ts), so every set lives around the origin with the ground at y = 0.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, rng, MAT, M4, beamBetween, plane, palm, scrub, hills, fortWall, bastion, minaret, gopuram, block,
  rack, cart, tent, ship, crate, rocket3D } from "./props3d";
import { house, prop, Kit } from "./build";
import { cobbleHD, stoneHD, grassHD, rep, brick as brickTex } from "./paint";
import { Pen, INK, SKINS, fxRocket, fxExhaust, fxSmoke, fxBoom, fxScraps, fxMoon, fxWater, fxGlare, fxStarfield, fxBurst, fxSplash, fxPuff, fxStars, Outfit, Expr, FrontOpts, Prop } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, FxPlace } from "./cast";
import { C } from "./cues";
import { FPS, V3, smooth, clamp01, easeOut, LEAD, SetId } from "./story";

// ---------------- cast outfits ----------------
const DESI = ["#b97c50", "#a86e46", "#c98d5e", "#9a6440"];
export const rocketMan = (v: number): Outfit => ({
  jacket: "#e3a23c", stripes: "#2b1d15", pants: "#f1ead8", boots: "#6b4a2e", hat: "turban", hatCol: v % 3 === 1 ? "#c0353a" : "#f4eedf",
  trim: v % 3 === 1 ? "#e8c45a" : "#c0353a", sash: "#2f7a4b", skin: DESI[v % 4], moustache: v % 3 !== 2 ? "#1d1410" : undefined,
});
export const redcoat = (v: number, officer = false): Outfit => ({
  jacket: "#c4312e", pants: "#ece6d6", boots: INK, hat: "tricorne", belt: officer ? null : "#f1efe6", buttons: "#e8c45a", rifle: !officer,
  skin: SKINS[v % 3], moustache: v % 4 === 1 || officer ? "#4a3426" : undefined, trim: officer ? "#e8c45a" : undefined,
  sash: officer ? "#e8c45a" : undefined, sword: officer, build: officer ? "stout" : "adult",
});
const CONGREVE: Outfit = { jacket: "#2f3f66", pants: "#d8cdb2", boots: INK, hat: "hair", hair: "#8a6a4a", buttons: "#e8c45a", skin: SKINS[0], build: "stout", moustache: "#6a4a30" };
const POET: Outfit = { jacket: "#4b3a5e", pants: "#3b3f52", boots: INK, hat: "tophat", skin: SKINS[1], buttons: "#d9dde0" };
const KIDG: Outfit = { jacket: "#2fa8a0", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#1d1410", skin: DESI[0], build: "kid" };
const fan = (v: number): Outfit => ({ jacket: ["#2f5fb5", "#c4312e", "#f1efe6", "#2f5fb5", "#7b5ac9"][v % 5], pants: "#3b3f52", boots: "#f4f1ea", hat: v % 3 === 2 ? "hair" : "cap",
  cap: ["#c4312e", "#2f5fb5", "#f1efe6"][v % 3], hair: ["#3a2a1e", "#d9a441", "#1d1410"][v % 3], skin: SKINS[v % 4] });
const villager = (v: number): Outfit => v === 1
  ? { jacket: "#e25a4a", dress: "#e8a33a", pants: "#3b3f52", boots: "#6b4a2e", hat: "hair", hair: "#1d1410", skin: DESI[1] }
  : { jacket: "#f4efe2", pants: "#f4efe2", boots: "#6b4a2e", hat: v === 3 ? "turban" : "hair", hatCol: "#f4eedf", trim: "#f4eedf", hair: "#1d1410", skin: DESI[(v + 2) % 4],
    moustache: v === 3 ? "#e8e4dc" : v === 0 ? "#1d1410" : undefined };

// ---------------- staging helpers ----------------
type Ctx = { cam: CamInfo; t: number; out: Stage };
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts, scale = 1, y = 0, shadow = true) => {
  const who: Who = { i, o, okey };
  c.out.places.push(person(c.cam, who, x, y, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...fo }, {}, scale));
  if (shadow && fo.mode !== "fall") blob(c.out, x, y, z, scale);
};
const after = (t: number, cue: number) => t >= cue - LEAD;
/** screen-space angle of a world direction (for cards that point along their motion) */
const scr = (cam: CamInfo, v: V3) => {
  const up = cam.up ?? V(0, 1, 0), x = v[0] * cam.right.x + v[1] * cam.right.y + v[2] * cam.right.z, y = v[0] * up.x + v[1] * up.y + v[2] * up.z;
  return Math.atan2(y, x);
};
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm3 = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/** a rocket flight: path(s) = position s seconds after launch (s may be < 0: waiting on its rack) */
type Flight = { ts?: number; t0: number; dur: number; path: (s: number) => V3; kind?: number; scale?: number; idle?: boolean; trail?: [number, number]; glare?: boolean; land?: boolean };
const flight = (c: Ctx, F: Flight, key = 0) => {
  const s = c.t - F.t0, sc = F.scale ?? 1, kind = F.kind ?? 0;
  if (s < 0 && !F.idle) return;
  const sc0 = Math.max(0, Math.min(s, F.dur));
  const p = F.path(sc0), atEnd = s >= F.dur, pa = atEnd ? F.path(sc0 - 0.03) : p, p2 = atEnd ? p : F.path(sc0 + 0.02), v = norm3([p2[0] - pa[0], p2[1] - pa[1], p2[2] - pa[2]]);
  const ang = scr(c.cam, v);
  // trail: puffs dropped every dt along the flown path, ageing out
  const [dt, life] = F.trail ?? [0.05, 1.1];
  if (s > 0) for (let tau = dt * 0.5; tau <= Math.min(s, F.dur); tau += dt) {
    const age = (s - tau) / life;
    if (age >= 1 || age < 0.02) continue;
    const pp = F.path(tau), sz = (0.35 + 1.4 * age) * sc * (F.ts ?? 1) ** Math.min(1, tau);
    c.out.fx.push({ key: `smk${q(age, 16)}`, cw: 300, ch: 300, draw: (pen) => fxSmoke(pen, q(age, 16)), x: pp[0], y: pp[1], z: pp[2], w: sz, h: sz, soft: true, rot: tau * 3 + key });
  }
  if (s > F.dur && !F.land) return;
  if (F.glare) {
    c.out.fx.push({ key: `glare${q(c.t % 1, 8)}`, cw: 600, ch: 200, draw: (pen) => fxGlare(pen, q(c.t % 1, 8)), x: p[0], y: p[1], z: p[2], w: 6 * sc, h: 2 * sc, rot: ang, glow: 3.2 });
    return;
  }
  c.out.fx.push({ key: `rk${kind}`, cw: 480, ch: 120, draw: (pen) => fxRocket(pen, kind), x: p[0], y: p[1], z: p[2], w: 1.5 * sc, h: 0.375 * sc, rot: ang });
  if (s > 0 && s < F.dur) {
    const back = add(p, v, 0.208 * 1.5 * sc - 0.45 * sc);
    const fk = q((c.t * 7 + key * 0.37) % 1, 8);
    c.out.fx.push({ key: `ex${fk}`, cw: 300, ch: 160, draw: (pen) => fxExhaust(pen, fk * 10), x: back[0], y: back[1], z: back[2], w: 0.9 * sc, h: 0.48 * sc, rot: ang, glow: 2.4 });
  }
};
const puff = (c: Ctx, at: number, p: V3, size: number, life = 1, col?: number[]) => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  c.out.fx.push({ key: `puff${col ? col.join() : ""}${k}`, cw: 300, ch: 300, draw: (pen) => fxSmoke(pen, k, col), x: p[0], y: p[1] + 0.3 * size * u, z: p[2], w: size * (0.6 + 0.6 * u), h: size * (0.6 + 0.6 * u), soft: true });
};
const boom = (c: Ctx, at: number, p: V3, size: number) => {
  const u = (c.t - at) / 1.3;
  if (u < 0 || u >= 1) return;
  const k = q(u, 30);
  c.out.fx.push({ key: `boom${k}`, cw: 800, ch: 800, draw: (pen) => fxBoom(pen, k), x: p[0], y: p[1], z: p[2], w: size, h: size, glow: u < 0.35 ? 1.8 : 1.0 });
};
const spark = (c: Ctx, at: number, p: V3, size: number, life = 0.25, col = "#fff3b0") => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  c.out.fx.push({ key: `burst${col}${k}`, cw: 500, ch: 500, draw: (pen) => fxBurst(pen, k, col), x: p[0], y: p[1], z: p[2], w: size, h: size, glow: 1.6 });
};
/** 0..1 blend of a value between two cue times */
const ramp = (t: number, a: number, b: number) => smooth((t - a) / Math.max(0.01, b - a));

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const parapetFloor = (s: SetBuild) => s.b.add(plane(-40, 40, -14, 6, 2), lam("rampart", () => ({ map: stoneHD("rampHD", ["#c9a274", "#bf9868", "#d1ab7e", "#b98f60"], "#94704a") })));

export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  moon: (s) => {
    const { b } = s;
    parapetFloor(s);
    fortWall(b, -40, 5.6, 40, 5.6, 1.1, 0.8, MAT.fort(), 0, 1.4);
    b.add(plane(-400, 400, 5, 600, 8, -9), MAT.earth());
    bastion(b, -26, 42, 7, 12, MAT.fort(), -9); bastion(b, 34, 60, 8, 12, MAT.fort(), -9);
    fortWall(b, -26, 42, 34, 60, 10, 3, MAT.fort(), -9);
    minaret(b, 8, 95, 34); minaret(b, 18, 98, 34);
    for (let k = 0; k < 9; k++) palm(b, -40 + k * 10 + 4 * hh(k), 18 + 14 * hh(k, 2), 13 + 3 * hh(k, 3), 40 + k, -9);
    rack(b, 0.9, 2.6, -Math.PI / 2, 0.4);
  },
  fort: (s) => {
    const { b } = s;
    b.add(plane(-120, 120, -120, 120, 1), MAT.earth());
    b.add(plane(-900, 900, -900, 900, 40, -0.4), MAT.water());
    b.add(plane(-60, 60, -60, 60, 1, 0.01), lam("parade", () => ({ map: rep(cobbleHD(), 1, 1) })));
    for (const [x0, z0, x1, z1] of [[-50, -50, 50, -50], [50, -50, 50, 50], [50, 50, -50, 50], [-50, 50, -50, -50]]) fortWall(b, x0, z0, x1, z1, 9, 4);
    for (const [x, z] of [[-50, -50], [50, -50], [50, 50], [-50, 50], [0, -50], [50, 0], [0, 50], [-50, 0]]) bastion(b, x, z, 6, 11);
    minaret(b, -14, 12, 30); minaret(b, -14, 28, 30); block(b, -14, 20, 9, 12, 9, 0, "#f3ead8");
    gopuram(b, 22, 24, 1.1);
    for (const [x, z, w, d, h] of [[10, -8, 10, 7, 6], [-30, 20, 8, 12, 5], [30, -2, 9, 8, 6], [-28, -10, 12, 7, 5], [-2, 34, 10, 6, 5], [34, 34, 7, 9, 5]]) block(b, x, z, w, d, h, 0, hh(x, z) < 0.5 ? "#efe2c8" : "#e8cfa4");
    for (let k = 0; k < 36; k++) { const a = hh(k) * 6.28, r = k < 14 ? 15 + 25 * hh(k, 2) : 60 + 50 * hh(k, 3); palm(b, Math.cos(a) * r, Math.sin(a) * r, 11 + 5 * hh(k, 4), k); }
    hills(b, 0, 0, 420, 16, 40, 7);
  },
  field: (s) => {
    const { b } = s;
    b.add(plane(-500, 1200, -500, 500, 1), MAT.earth());
    hills(b, 300, 0, 650, 22, 45, 3);
    for (let k = 0; k < 40; k++) palm(b, -60 + 260 * hh(k), (hh(k, 2) < 0.5 ? -1 : 1) * (25 + 120 * hh(k, 3)), 11 + 5 * hh(k, 4), k + 100);
    for (let k = 0; k < 60; k++) scrub(b, -40 + 300 * hh(k, 5), -60 + 120 * hh(k, 6), 0.8 + hh(k, 7), k);
    // rocket-shot racks (shots 4 and 10) and the far rack line
    rack(b, 0, 0, 0, 0.2);
    rack(b, 0.9, 12, Math.PI, 0.3); rack(b, -0.9, 12, Math.PI, 0.3);
    for (let k = 0; k < 8; k++) rack(b, -14 + 4 * k, 22, 0, 0.25);
  },
  range: (s) => {
    const { b, kit } = s;
    b.add(plane(-300, 300, -300, 300, 1), MAT.grass());
    rack(b, 0, 0, 0, 0.25);
    house(b, -10, -34, 0, 8, 7, 6, 0, 0); house(b, 1, -38, 0, 9, 7, 7, 3, 0); house(b, 13, -35, 0, 8, 8, 6.5, 6, 0); house(b, 25, -40, 0, 10, 7, 7, 1, 0);
    for (let k = 0; k < 14; k++) prop(b, kit, k % 3 ? "tree_oak" : "tree_fat", -36 + 7 * k + 3 * hh(k), 0, -26 - 6 * hh(k, 2), 7 + 3 * hh(k, 3));
    for (let k = 0; k < 6; k++) prop(b, kit, "hedge", -14 + 6.5 * k, 0, -18, 1.2);
    hills(b, 0, 0, 420, 14, 35, 11, MAT.hill());
  },
  camp: (s) => {
    const { b } = s;
    b.add(plane(-400, 400, -400, 400, 1), lam("campEarth", () => ({ map: rep(ctx2(), 1, 1) })));
    cart(b, 9, 4, -0.2); cart(b, -9, 5, 0.5);
    tent(b, 3, 9, 0.2); tent(b, -4, 10, -0.1); tent(b, 10, 7, 0.5); tent(b, -11, 8, 0.3);
    for (let k = 0; k < 20; k++) palm(b, -80 + 160 * hh(k), 20 + 80 * hh(k, 2), 12 + 4 * hh(k, 3), k + 300);
    hills(b, 0, 0, 380, 16, 38, 5);
    // the cart that gets hit: its own group so it can vanish in the blast
    const g = new THREE.Group(), cb = new Batch(); cart(cb, 0, 0, 0.3); cb.build(g); s.root.add(g); s.dyn.target = g;
  },
  garden: (s) => {
    const { b, kit } = s;
    b.add(plane(-60, 60, -60, 60, 1), MAT.grass());
    house(b, 0, -9, 0, 12, 7, 6, 4, 0); house(b, -13, -11, 0, 9, 7, 6, 1, 0); house(b, 13, -11, 0, 9, 7, 6, 6, 0);
    for (let k = 0; k < 10; k++) b.add(new THREE.SphereGeometry(0.22, 8, 6), lam("flower" + (k % 3), () => ({ color: ["#e2453c", "#f3d35a", "#e86ea8"][k % 3] })), M4(-3 + 0.7 * k, 0.25, -4.2));
    for (let k = 0; k < 5; k++) prop(b, kit, "plant_bushLarge", -6 + 3 * k, 0, -4.6, 1.1);
    // the flower pot the jet ends in
    b.add(new THREE.CylinderGeometry(0.35, 0.26, 0.55, 14), lam("pot", () => ({ color: "#c9643f" })), M4(5.6, 0.27, -0.2));
    b.add(new THREE.SphereGeometry(0.42, 10, 8), MAT.leaf(), M4(5.6, 0.8, -0.2));
    palm(b, -8, -6, 9, 1); palm(b, 9, -7, 10, 2);
  },
  dock: (s) => {
    const { b } = s;
    b.add(plane(-60, 60, -40, 0, 1), lam("quay", () => ({ map: rep(cobbleHD(), 1, 1) })));
    b.add(quad(V(60, -2, 0), V(-60, -2, 0), V(-60, 0, 0), V(60, 0, 0)), lam("quayWall", () => ({ map: stoneHD("qwHD") })));
    b.add(plane(-600, 600, 0, 600, 40, -1.5), MAT.water());
    ship(b, 2, 8, 0, 28, -1.5); ship(b, -40, 30, 0.3, 22, -1.5, 2); ship(b, 45, 40, -0.2, 24, -1.5);
    const gp = MAT.wood(); b.add(boxGeo(V(-0.6, -0.08, 0), V(0.6, 0.0, 4.6)), gp, new THREE.Matrix4().makeRotationX(-0.33).setPosition(4, 0.05, 0.2));
    for (const [x, z, n] of [[-8, -3, 3], [-6.8, -3.2, 2], [-7.4, -4.4, 2], [7, -3, 2], [8.2, -2.8, 1]]) for (let k = 0; k < n; k++) crate(b, x, k * 0.56, z, 0.7, 0.2 * k);
    house(b, -22, -16, 0, 10, 8, 8, 2, 0); house(b, -10, -18, 0, 11, 8, 9, 7, 0); house(b, 4, -17, 0, 10, 8, 8, 5, 0); house(b, 17, -18, 0, 9, 8, 9, 2, 0);
    for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.18, 0.2, 1.1, 8), MAT.darkWood(), M4(-20 + 8 * k, 0.55, -0.4));
  },
  workshop: (s) => {
    const { b } = s;
    b.add(plane(-6, 6, -8, 4.6, 1), MAT.deck());
    b.add(quad(V(-6, 0, 4.6), V(6, 0, 4.6), V(6, 4.2, 4.6), V(-6, 4.2, 4.6), 4, 1.4).scale(1, 1, 1), MAT.brick(), new THREE.Matrix4().makeRotationY(Math.PI).setPosition(0, 0, 9.2));
    b.add(quad(V(-5, 0, -8), V(-5, 0, 4.6), V(-5, 4.2, 4.6), V(-5, 4.2, -8), 4, 1.4), MAT.brick());
    b.add(quad(V(5, 0, 4.6), V(5, 0, -8), V(5, 4.2, -8), V(5, 4.2, 4.6), 4, 1.4), MAT.brick());
    // window light (emissive) with a dark frame
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.85, 1.6) }));
    win.position.set(2.4, 2.25, 4.58); win.rotation.y = Math.PI; s.root.add(win);
    for (const [x0, y0, x1, y1] of [[1.6, 1.35, 3.2, 1.45], [1.6, 3.05, 3.2, 3.15], [1.6, 1.35, 1.7, 3.15], [3.1, 1.35, 3.2, 3.15], [2.35, 1.35, 2.45, 3.15], [1.6, 2.2, 3.2, 2.3]]) b.add(boxGeo(V(x0, y0, 4.5), V(x1, y1, 4.58)), MAT.darkWood());
    // bench along the back wall + legs
    b.add(boxGeo(V(-4.2, 0.86, 3.3), V(0.8, 0.96, 4.3), 1), MAT.wood());
    for (const x of [-4, 0.6]) for (const z of [3.4, 4.2]) b.add(boxGeo(V(x - 0.06, 0, z - 0.06), V(x + 0.06, 0.86, z + 0.06)), MAT.darkWood());
    // the Mysore rocket on the bench, papers, Congreve rockets leaning on the side wall
    rocket3D(b, new THREE.Matrix4().compose(V(-2.6, 1.0, 3.75), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), 0.25), V(1, 1, 1)));
    b.add(plane(-1.9, -1.2, 3.5, 4.1, 1, 0.965), lam("plan", () => ({ map: ctex("blueprint", 256, 256, (g) => { g.fillStyle = "#f2ead4"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#3a4f8a"; g.lineWidth = 5; g.strokeRect(40, 100, 170, 40); g.beginPath(); g.moveTo(210, 100); g.lineTo(240, 120); g.lineTo(210, 140); g.stroke(); g.beginPath(); g.moveTo(10, 120); g.lineTo(40, 120); g.stroke(); }) })));
    for (let k = 0; k < 4; k++) rocket3D(b, new THREE.Matrix4().compose(V(-4.75, 0.02, -1.5 + 0.55 * k), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 1.38)), V(1, 1, 1)), false, true);
    for (const [x, z] of [[3.8, 3.6], [4.2, 2.8]]) b.add(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12), lam("barrel", () => ({ color: "#9a6a42" })), M4(x, 0.45, z));
  },
  mchenry: (s) => {
    const { b } = s;
    b.add(plane(-4.5, 4.5, -12, 6, 1), MAT.deck());
    b.add(plane(-1500, 1500, -1500, 1500, 60, -2.5), lam("nightWater", () => ({ color: "#1c3264" })));
    for (const x of [-4.4, 4.4]) b.add(boxGeo(V(x - 0.1, 0, -12), V(x + 0.1, 1.0, 6)), MAT.darkWood());
    b.add(boxGeo(V(-4.5, 0.95, 5.9), V(4.5, 1.08, 6.1)), MAT.darkWood());
    for (let k = 0; k < 7; k++) b.add(boxGeo(V(-4.2 + 1.4 * k - 0.05, 0, 5.95), V(-4.2 + 1.4 * k + 0.05, 1.0, 6.05)), MAT.darkWood());
    b.add(new THREE.CylinderGeometry(0.22, 0.3, 26, 10), MAT.darkWood(), M4(0, 13, -5));
    for (const y of [9, 16]) b.add(new THREE.CylinderGeometry(0.1, 0.1, 9, 6).rotateZ(Math.PI / 2), MAT.darkWood(), M4(0, y, -5));
    // the fort on its point: a star-shaped earthwork, flag pole
    b.add(new THREE.CylinderGeometry(95, 105, 2, 40), lam("nightGrass", () => ({ color: "#3c6a46" })), M4(0, -2, 150));
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 34 : 55; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) star.lineTo(x, y); else star.moveTo(x, y); }
    star.closePath();
    b.add(new THREE.ExtrudeGeometry(star, { depth: 9, bevelEnabled: false }).rotateX(-Math.PI / 2), lam("fortNight", () => ({ map: rep(brickTex(), 1, 1), color: "#b8a090" })), M4(0, -1, 150));
    b.add(new THREE.CylinderGeometry(0.35, 0.5, 40, 8), MAT.darkWood(), M4(0, 27, 150));
    ship(b, -55, 60, 0.4, 26, -2.5); ship(b, 50, 75, -0.5, 24, -2.5); ship(b, -20, -70, 0.1, 30, -2.5);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(18, 11, 16, 1), new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide, color: new THREE.Color(0.62, 0.66, 0.85) }));
    flag.position.set(0, 41, 150); flag.frustumCulled = false; s.root.add(flag); s.dyn.flag = flag;
  },
  stadium: (s) => {
    const { b } = s;
    b.add(plane(-100, 100, -80, 3.6, 1), lam("pitch", () => ({ map: grassHD() })));
    for (let k = 0; k < 9; k++) {
      const y = (k + 1) * 0.45, z0 = 3.6 + k * 0.9;
      b.add(boxGeo(V(-24, 0, z0), V(24, y, z0 + 0.9), 1), lam("tier", () => ({ color: "#8f97a8" })));
      b.add(boxGeo(V(-24, y, z0 + 0.55), V(24, y + 0.35, z0 + 0.85)), lam("seat" + (k % 2), () => ({ color: k % 2 ? "#2f5fb5" : "#c4312e" })));
    }
    b.add(boxGeo(V(-24, 0, 11.7), V(24, 9, 12.5)), lam("backwall", () => ({ color: "#5d6a86" })));
    for (const x of [-20, 20]) { b.add(new THREE.CylinderGeometry(0.3, 0.4, 22, 8), MAT.iron(), M4(x, 11, 13)); }
    for (const x of [-20, 20]) { const l = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 2.0) })); l.position.set(x, 22.5, 12.7); s.root.add(l); }
    b.add(new THREE.CylinderGeometry(0.08, 0.1, 12, 8), MAT.iron(), M4(12, 6, 2.5));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.8, 14, 1), new THREE.MeshLambertMaterial({ map: flagTex(true), side: THREE.DoubleSide }));
    flag.position.set(12, 10.6, 2.5); flag.frustumCulled = false; s.root.add(flag); s.dyn.flag = flag;
  },
  well: (s) => {
    const { b } = s;
    b.add(plane(-200, 200, -200, 200, 1), MAT.earth());
    b.add(new THREE.CylinderGeometry(1.5, 1.55, 0.9, 32, 1, true), MAT.laterite(), M4(0, 0.45, 0));
    b.add(new THREE.CylinderGeometry(1.18, 1.18, 6.5, 32, 1, true), lam("wellIn", () => ({ color: "#4a3a32", side: THREE.BackSide })), M4(0, -2.35, 0));
    b.add(new THREE.RingGeometry(1.15, 1.6, 32).rotateX(-Math.PI / 2), MAT.laterite(), M4(0, 0.92, 0));
    b.add(new THREE.CircleGeometry(1.18, 32).rotateX(-Math.PI / 2), lam("wellWater", () => ({ color: "#1d2c3a" })), M4(0, -4.5, 0));
    for (const x of [-1.4, 1.4]) b.add(boxGeo(V(x - 0.1, 0.9, -0.1), V(x + 0.1, 2.7, 0.1)), MAT.darkWood());
    b.add(beamBetween(V(-1.55, 2.55, 0), V(1.55, 2.55, 0), 0.07), MAT.darkWood());
    b.add(new THREE.TorusGeometry(0.22, 0.05, 8, 18), MAT.darkWood(), M4(0, 2.33, 0));
    house(b, -9, 10, Math.PI, 8, 6, 3.6, 4, 0); house(b, 4, 13, Math.PI, 9, 6, 3.8, 1, 0); house(b, 16, 9, Math.PI + 0.3, 8, 6, 3.6, 6, 0);
    for (let k = 0; k < 14; k++) palm(b, -30 + 60 * hh(k, 11), 6 + 30 * hh(k, 12), 10 + 5 * hh(k, 13), k + 500);
    for (let k = 0; k < 10; k++) scrub(b, -12 + 24 * hh(k, 14), -8 + 6 * hh(k, 15), 0.9, k + 50, "#6f9a44");
    hills(b, 0, 0, 380, 14, 40, 13, MAT.hill());
    // bucket (dynamic): brass pail with rusty rockets sticking out
    const g = new THREE.Group(), bb = new Batch();
    bb.add(new THREE.CylinderGeometry(0.3, 0.24, 0.42, 16, 1, true), lam("pail", () => ({ color: "#e6b752", side: THREE.DoubleSide })), M4(0, -0.21, 0));
    bb.add(new THREE.CircleGeometry(0.24, 16).rotateX(Math.PI / 2), lam("pail", () => ({ color: "#e6b752", side: THREE.DoubleSide })), M4(0, -0.42, 0));
    for (let k = 0; k < 4; k++) rocket3D(bb, new THREE.Matrix4().compose(V(-0.12 + 0.08 * k, -0.35, -0.05 + 0.04 * (k % 2)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.15 * (k - 1.5), 0.6 * k, 1.25 + 0.08 * k)), V(0.55, 0.55, 0.55)), true);
    bb.build(g); s.root.add(g); s.dyn.bucket = g;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6).translate(0, -0.5, 0), lam("rope", () => ({ color: "#c9a35a" })));
    rope.position.set(0, 2.3, 0); s.root.add(rope); s.dyn.rope = rope;
  },
};
const ctx2 = () => ctex("campEarth", 1024, 1024, (g, r) => {
  g.fillStyle = "#c99a62"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 240; i++) { g.fillStyle = ["#bf8f58", "#d4a874", "#a8a24e"][i % 3]; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 30 + r() * 60, 15 + r() * 30, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
});
/** 1814 Star-Spangled Banner (15 stripes, 15 stars) or a modern 50-star flag, painted */
const flagTex = (modern = false) => ctex(modern ? "flagUSm" : "flagUS1814", 512, 320, (g) => {
  const n = modern ? 13 : 15;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#c4312e"; g.fillRect(0, (320 * i) / n, 512, 320 / n + 1); }
  const cw = 220, ch = (320 * (modern ? 7 : 8)) / n;
  g.fillStyle = "#2a3d7a"; g.fillRect(0, 0, cw, ch);
  g.fillStyle = "#f4f1ea";
  const rows = modern ? 9 : 5, cols = modern ? 6 : 3;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols + (modern && r % 2 ? -1 : 0); c++) {
    const x = (cw * (c + 0.5 + (modern && r % 2 ? 0.5 : 0))) / cols, y = (ch * (r + 0.5)) / rows, R = modern ? 6 : 12;
    g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? R * 0.42 : R; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.closePath(); g.fill();
  }
});

// ---------------- dynamic posing per frame ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number) => void>> = {
  camp: (s, t) => { s.dyn.target.visible = t < C.goes - LEAD; },
  mchenry: (s, t) => waveFlag(s.dyn.flag as THREE.Mesh, t, 18, 11),
  stadium: (s, t) => waveFlag(s.dyn.flag as THREE.Mesh, t, 4.5, 2.8),
  well: (s, t) => {
    const y = bucketY(t);
    s.dyn.bucket.position.set(0, y, 0); s.dyn.bucket.rotation.y = 0.3 * Math.sin(t * 1.3);
    s.dyn.rope.scale.set(1, Math.max(0.05, 2.3 - y), 1);
  },
};
export const bucketY = (t: number) => -4.0 + 5.25 * easeOut((t - C.l14 + 0.3) / (C.thousands - C.l14 + 0.4));
const waveFlag = (fl: THREE.Mesh, t: number, w: number, h: number) => {
  const p = fl.geometry.attributes.position as THREE.BufferAttribute, nx = 17;
  for (let i = 0; i < p.count; i++) {
    const u = (i % nx) / (nx - 1), y = i < nx ? h / 2 : -h / 2;
    p.setXYZ(i, u * w, y + 0.08 * h * u * Math.sin(t * 3 - u * 4), 0.12 * w * u * Math.sin(t * 4.2 - u * 6));
  }
  p.needsUpdate = true; fl.geometry.computeVertexNormals();
};

// ---------------- who and what is on screen ----------------
const MOON_DIR = norm3([0, Math.sin(0.4), Math.cos(0.4)]);
const RACK1: V3 = [0.9, 0.62, 2.62];
export const moonRocket = (s: number): V3 => add(RACK1, norm3([0, 0.55, 1]), 6 * s + 30 * s * s);
const launchPath = (p0: V3, dir: V3, v0: number, a: number, g = 0) => (s: number): V3 => { const d = norm3(dir), k = v0 * s + 0.5 * a * s * s; return [p0[0] + d[0] * k, p0[1] + d[1] * k - 0.5 * g * s * s, p0[2] + d[2] * k]; };
export const SHOT4_ROCKET = launchPath([0.15, 0.6, 0], [1, 0.16, 0.02], 25, 160, 2);
export const CAMP_ROCKET = (s: number): V3 => { const T = C.goes - C.stray + 0.25, u = clamp01(s / T); return [-60 * (1 - u) + 0 * u, 1.4 + 30 * (1 - u) ** 1.6, 12 * (1 - u)]; };
export const TUBE_ROCKET = launchPath([-0.95, 0.62, 12], [-1, 0.32, 0.12], 10, 110, 1);

type StageFn = (c: Ctx, id: number) => void;
const RM = (i: number) => rocketMan(i % 6);
export const STAGE: Record<number, StageFn> = {
  1: (c) => {
    const t = c.t, reach = ramp(t, C.fire - 0.75, C.fire - 0.35) * (1 - ramp(t, C.fire + 0.1, C.fire + 0.5));
    pose(c, 1, RM(0), "rm0", -0.15, 2.25, { mode: "stand", expr: after(t, C.fire) ? "grin" : "stern", prop: ["torch", q(reach, 20)] });
    pose(c, 2, RM(1), "rm1", -1.5, 3.3, { mode: "stand", expr: after(t, C.fire + 0.3) ? "awe" : "neutral", prop: ["rocket", 0] });
    flight(c, { t0: C.fire, dur: 4, path: moonRocket, idle: true, trail: [0.04, 1.4] });
    spark(c, C.fire - 0.4, [0.92, 0.6, 2.1], 0.45, 0.4);
    const mp = add(RACK1, MOON_DIR, 700);
    c.out.fx.push({ key: "moon", cw: 512, ch: 512, draw: fxMoon, x: mp[0], y: mp[1], z: mp[2], w: 120, h: 120, glow: 1.25 });
    for (let k = 0; k < 4; k++) { const d = norm3([-0.9 + 0.6 * k, 0.45 + 0.1 * (k % 2), 1]), p = add(RACK1, d, 900); c.out.fx.push({ key: "stars", cw: 1024, ch: 512, draw: fxStarfield, x: p[0], y: p[1], z: p[2], w: 700, h: 350, soft: true, glow: 1.1 }); }
  },
  2: (c) => {
    const t = c.t;
    for (let r = 0; r < 14; r++) for (let k = 0; k < 14; k++) {
      const i = r * 14 + k, x = -9.75 + k * 1.5 + (hh(i) - 0.5) * 0.15, z = -27 - r * 1.4 + (hh(i, 2) - 0.5) * 0.1;
      const ex: Expr = (["stern", "neutral", "smug", "neutral"] as Expr[])[i % 4];
      pose(c, i, RM(i), `rm${i % 6}`, x, z, { mode: "stand", expr: after(t, C.thousand) && i % 3 === 0 ? "grin" : ex, prop: ["rocket", 0] });
    }
  },
  3: (c) => {
    const t = c.t;
    pose(c, 1, RM(0), "rm0", 8, -6, { mode: "stand", expr: after(t, C.iron) ? "smug" : "stern", prop: ["rocket", 0] });
    for (let k = 0; k < 6; k++) pose(c, 10 + k, RM(k + 1), `rm${(k + 1) % 6}`, -1 + 3.6 * k, 8 + 2 * hh(k), { mode: "stand", expr: "neutral", prop: ["rocket", 0] });
  },
  4: (c) => {
    const t = c.t, reach = ramp(t, C.light - 0.1, C.light + 0.3) * (1 - ramp(t, C.screams + 0.05, C.screams + 0.4));
    pose(c, 1, RM(2), "rm2", -0.2, 0.9, { mode: "stand", expr: after(t, C.screams) ? "laugh" : "stern", prop: ["torch", q(reach, 20)] });
    flight(c, { t0: C.screams - 0.08, dur: 4.2, path: SHOT4_ROCKET, idle: true, trail: [0.03, 2.4], ts: 3 });
    spark(c, C.screams - 0.5, [0.0, 0.55, 0.05], 0.4, 0.42);
    puff(c, C.screams - 0.05, [0.0, 0.5, 0], 1.6, 1.4);
    for (let k = 0; k < 5; k++) pose(c, 10 + k, RM(k + 3), `rm${(k + 3) % 6}`, -10 + 4 * k, 22.8, { mode: "stand", expr: after(t, C.screams + 0.2) ? "grin" : "neutral", prop: ["rocket", 0] });
  },
  5: (c) => {
    const t = c.t, t0 = C.paper + 0.05, T = Math.max(0.5, C.fall - t0 + 0.12);
    const path = (s: number): V3 => { const u = clamp01(s / T); return [0.15 + 6.8 * u, 0.6 * (1 - u) + 0.5 * u + 2.0 * Math.sin(Math.PI * u) * (1 - 0.3 * u) + 0.22 * Math.sin(s * 19) * (1 - u), 0.4 * Math.sin(s * 13) * (1 - u)]; };
    const reach = ramp(t, C.l4 + 0.4, C.paper - 0.3) * (1 - ramp(t, C.paper + 0.2, C.paper + 0.6));
    pose(c, 1, redcoat(0, true), "off", -0.7, 0.8, { mode: "stand", expr: after(t, C.short) ? "neutral" : after(t, C.fall) ? "stern" : "smug", prop: ["torch", q(reach, 20)] });
    const landed = t > t0 + T;
    flight(c, { t0, dur: T, path, kind: 3, idle: true, trail: [0.06, 0.9], land: true });
    if (landed) puff(c, t0 + T, [6.95, 0.1, 0], 1.0, 0.9, [200, 190, 170]);
    if (landed) spark(c, t0 + T, [6.95, 0.25, 0], 0.5, 0.2, "#f4f1ea");
  },
  6: (c) => {
    const t = c.t, hit = C.goes - LEAD;
    const spots: [number, number][] = [[-0.9, -2.2], [0.9, -2.7], [2.1, -1.1], [-2.0, -0.9], [0.1, -3.7]];
    spots.forEach(([x, z], i) => {
      const off = i === 4, o = redcoat(i, off);
      const fall = t >= hit + 0.05 && t < hit + 0.35, sit = t >= hit + 0.35;
      const expr: Expr = t < C.stray - LEAD ? (i % 2 ? "neutral" : "smug") : t < hit ? "nervous" : t < hit + 0.35 ? "shock" : i % 2 ? "dazed" : "shock";
      const k = fall ? smooth((t - hit - 0.05) / 0.3) : 0, dx = x * 0.35 * k;
      pose(c, i, o, `rc${i}`, x + dx, z - 0.6 * k, { mode: sit ? "sit" : fall ? "fall" : "stand", expr, look: t >= C.stray && t < hit ? -1 : 0, tilt: fall ? (i % 2 ? 30 : -30) * k : 0 }, 1, 0, !fall);
      if (sit && i % 2) { const u = ((t * 0.9 + hh(i)) % 1); c.out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x: x + dx, y: 1.3, z: z - 0.6, w: 0.75, h: 0.375 }); }
    });
    flight(c, { t0: C.stray - 0.25, dur: C.goes - C.stray + 0.25, path: CAMP_ROCKET, trail: [0.05, 1.5], scale: 1.2 });
    boom(c, hit, [0, 2.0, 0.3], 6);
    puff(c, hit + 0.4, [0.3, 3.5, 0.5], 7, 2.5, [120, 116, 128]);
    puff(c, hit + 0.7, [-1.2, 4.6, 0.8], 6, 2.5, [140, 136, 148]);
  },
  7: (c) => {
    const t = c.t;
    const paths: ((s: number) => V3)[] = [
      (s) => [-2 + 6 * s, 1.5 + 4 * s - 0.6 * s * s + 1.6 * Math.sin(8 * s), 1.5 * Math.sin(6 * s)],
      (s) => { const a = -Math.PI / 2 + 2.8 * s; return [2 + 2.5 * s + 3.5 * Math.cos(a), 6 + 3.5 * Math.sin(a), 0.5]; },
      (s) => [0 + 3 * s + 2 * Math.cos(9 * s), 1.5 + 7 * s - 3.2 * s * s, 2 * Math.sin(9 * s)],
      (s) => [1 + 14 * s - 9 * s * s, 1.5 + 5 * s - 1.8 * s * s, 1 + 1.5 * s],
    ];
    const t0 = C.l6 - 0.2;
    paths.forEach((path, k) => flight(c, { t0: t0 + 0.28 * k, dur: 2.6, path, trail: [0.05, 1.3], scale: 1.1 }, k));
    for (let k = 0; k < 5; k++) {
      const duck = k === 2 && t > t0 + 1.5 && t < t0 + 2.4;
      pose(c, k, RM(k), `rm${k}`, -3 + 1.7 * k, 1.6 + 0.4 * hh(k), { mode: "stand", expr: duck ? "shock" : after(t, C.accurate) ? (k % 2 ? "nervous" : "neutral") : "grin", look: k % 2 ? 1 : 0, headTilt: duck ? 8 : 0 });
    }
  },
  8: (c, id) => {
    const t = c.t;
    for (let r = 0; r < 12; r++) for (let k = 0; k < 34; k++) {
      const i = r * 34 + k, x = -25 + k * 1.5 + (hh(i) - 0.5) * 0.2, z = r * 1.6 + (hh(i, 2) - 0.5) * 0.2;
      pose(c, i, RM(i), `rm${i % 6}`, x, z, { mode: "stand", expr: (["stern", "grin", "neutral"] as Expr[])[i % 3], prop: ["rocket", 0] }, 1, 0, r < 4);
    }
    for (let k = 0; k < 70; k++) {
      const x = -25 + 51 * hh(k, 21), z = 19 * hh(k, 22), t0 = C.five - 0.25 + 0.6 * hh(k, 23);
      flight(c, { t0, dur: 3, path: launchPath([x, 1.6, z], [0.15 * (hh(k, 24) - 0.5), 0.7 + 0.2 * hh(k, 25), 1], 14, 30, 0), trail: [0.12, 0.8], scale: 1.4 }, k);
    }
    // the redcoats waiting downrange
    for (let k = 0; k < 3; k++) pose(c, 600 + k, redcoat(k), `rc${k}`, -1.2 + 1.2 * k, 92, { mode: "stand", expr: after(t, C.men7) ? "shock" : "nervous", look: 0 });
  },
  9: (c) => {
    const t = c.t, len = 0.2 + 0.78 * ramp(t, C.tighter - 0.05, C.shoots + 0.2);
    pose(c, 1, KIDG, "kid", 0, 0, { mode: "stand", expr: after(t, C.shoots) ? "laugh" : after(t, C.tighter) ? "grin" : "smile", prop: "hose" }, 0.75);
    const nz: V3 = [0.24, 0.43, 0.02], L = 60 + 900 * len, W = 6;
    c.out.fx.push({ key: `water${q(len, 30)}${q(t % 1, 6)}`, cw: 1000, ch: 300, draw: (p) => fxWater(p, q(len, 30), q(t % 1, 6)), x: nz[0] + W / 2, y: nz[1] - 0.0, z: nz[2] - 0.05, w: W, h: 1.8, yaw: 0, rot: 0 });
    if (len > 0.85) { const u = q((t * 1.7) % 1, 20); c.out.fx.push({ key: `splash${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u), x: nz[0] + (L / 1000) * W * 0.98, y: 0.55, z: 0.2, w: 1.2, h: 1.2 }); }
  },
  10: (c) => {
    const t = c.t, burst = C.splits - LEAD;
    if (t < burst) flight(c, { t0: 1e9, dur: 1, path: (s) => [0.85 - 0.95 * s, 0.62 + 0.3 * s, 12], kind: 3, idle: true }, 1);
    else { const u = (t - burst) / 0.8; if (u < 1) c.out.fx.push({ key: `scraps${q(u, 24)}`, cw: 400, ch: 400, draw: (p) => fxScraps(p, q(u, 24)), x: 0.85, y: 0.75, z: 11.95, w: 1.6, h: 1.6 }); spark(c, burst, [0.85, 0.7, 11.9], 1.1, 0.3); puff(c, burst + 0.05, [0.85, 0.8, 12], 1.5, 1.3); }
    flight(c, { t0: C.flies - 0.1, dur: 3.5, path: TUBE_ROCKET, idle: true, trail: [0.04, 1.8] }, 2);
    if (t > C.flies - 0.1) puff(c, C.flies - 0.1, [-0.95, 0.6, 12], 1.5, 1.3);
    const ex: Expr = t < burst ? "neutral" : t < C.ironT - LEAD ? "shock" : t < C.flies ? "smug" : "laugh";
    pose(c, 1, RM(4), "rm4", 0, 14.6, { mode: "stand", expr: ex, look: t < C.ironT ? -1 : 1 });
  },
  11: (c) => {
    const t = c.t;
    for (let k = 0; k < 4; k++) {
      const x = -13 + ((t - C.l10) * 1.1 + 4.2 * k) % 17, ph = q(((t * 1.6 + 0.3 * k) % 1), 30);
      pose(c, k, redcoat(k), `rc${k}`, x, -1.3 - 0.35 * (k % 2), { mode: "stroll", phase: ph, expr: (["neutral", "smug", "stern", "neutral"] as Expr[])[k], prop: "crate" });
    }
    pose(c, 9, redcoat(1, true), "off", -4.2, -3.2, { mode: "stand", expr: after(t, C.shipped) ? "smug" : "awe", prop: ["rocket", 0] });
  },
  12: (c) => {
    const t = c.t;
    pose(c, 1, CONGREVE, "cong", 0, 1.4, { mode: "stand", expr: after(t, C.insisted) ? "innocent" : "smug", prop: ["rocket", 1], headTilt: after(t, C.insisted) ? 6 : 0 });
  },
  13: (c) => {
    const t = c.t;
    pose(c, 1, POET, "poet", 0, 2.0, { mode: "stand", expr: after(t, C.glare) ? "awe" : "neutral", prop: "quill", look: 1 });
    for (let k = 0; k < 14; k++) {
      const t0 = C.l12 - 1.6 + 0.55 * k + 0.3 * hh(k), sx = -70 + 30 * hh(k, 2), sz = 55 + 30 * hh(k, 3);
      const path = (s: number): V3 => { const u = s / 3.2; return [sx + (16 * hh(k, 4) - 8 - sx) * u, -1 + 95 * u - 62 * u * u, sz + (150 - sz) * u]; };
      flight(c, { t0, dur: 3.2, path, glare: true, trail: [0.08, 1.4], scale: 3.2 }, k);
      spark(c, t0 + 3.2, path(3.2), 22, 0.5, "#ffd34a");
    }
  },
  14: (c) => {
    const t = c.t;
    for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) {
      const i = r * 9 + k, x = -10 + 2.5 * k + (r % 2) * 0.9 + 0.4 * (hh(i) - 0.5), y = (r + 1) * 0.45, z = 3.6 + r * 0.9 + 0.3;
      const syl = Math.floor((t + 0.17 * hh(i)) * 3.2) % 3, singing = after(t, C.sing - 0.4);
      pose(c, i, fan(i), `fan${i % 5}`, x, z, { mode: "stand", expr: singing ? (syl === 1 ? "smile_closed" : "sing") : "smile", prop: i % 3 !== 1 ? "heart" : null }, 1, y, false);
    }
  },
  15: (c) => {
    const t = c.t, up = after(t, C.thousands);
    pose(c, 1, villager(0), "v0", -1.95, 0.35, { mode: "stand", expr: up ? "shock" : "stern", prop: "rope" });
    pose(c, 2, villager(1), "v1", 1.75, -0.55, { mode: "stand", expr: up ? (after(t, C.waiting) ? "smile" : "awe") : "neutral" });
    pose(c, 3, villager(3), "v3", 2.15, 0.75, { mode: "stand", expr: up ? (after(t, C.karnataka) ? "smug" : "shock") : "neutral" });
    const kidEx: Expr = !up ? "smile" : after(t, C.launch + 0.15) ? "laugh" : after(t, C.launch - 0.1) ? "shock" : "awe";
    pose(c, 4, { ...KIDG, jacket: "#e8a33a" }, "kidw", 0.95, -1.45, { mode: "stand", expr: kidEx }, 0.72);
    const by = bucketY(t);
    spark(c, C.launch - 0.05, [0.12, by + 0.32, -0.12], 0.35, 0.35, "#ffb14a");
    puff(c, C.launch, [0.12, by + 0.4, -0.1], 0.5, 1.2);
  },
};
export type { FxPlace };
