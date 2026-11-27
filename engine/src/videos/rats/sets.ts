// Places and cast of "The Great Hanoi Rat Hunt". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, rng, MAT, M4, beamBetween, plane, palm, crate } from "./props3d";
import { house, prop, Kit } from "./build";
import { stoneHD, grassHD, rep, planksHD, brick } from "./paint";
import { Pen, INK, SKINS, fxSmoke, fxBurst, fxStars, fxFlameAt, Outfit, Expr, FrontOpts, ratSide, RatOpts, cobraFx, fxTailPile, fxGerm } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, light2D } from "./cast";
import { NOINK } from "./ink";
import { C } from "./cues";
import { FPS, V3, smooth, clamp01, LEAD, SetId } from "./story";

// ---------------- cast ----------------
const OFF: Outfit = { jacket: "#efe9da", pants: "#e3dccb", boots: "#4a3426", hat: "pith", hatCol: "#f6f1e4", trim: "#6b5a40", buttons: "#c9b46a", skin: SKINS[0], moustache: "#6a4a30", build: "stout" };
const INSP: Outfit = { jacket: "#d6c9a4", pants: "#cbbd96", boots: "#4a3426", hat: "pith", hatCol: "#efe6cc", trim: "#5a4a30", buttons: "#a08a50", skin: SKINS[2], moustache: "#3a2a1e" };
const HUNTER = (v: number): Outfit => ({ jacket: ["#3f5a7a", "#7a5a3e", "#4a6a4a", "#6a5a7a", "#8a4a3a"][v % 5], pants: ["#2e2b36", "#5a4a38", "#3a3a44"][v % 3], boots: "#5a3b2a", hat: "nonla",
  hatCol: ["#e6cf8e", "#dcc27e", "#efd9a0"][v % 3], skin: [SKINS[1], SKINS[3], SKINS[2]][v % 3], build: v % 4 === 3 ? "stout" : "adult" });
const LADY: Outfit = { jacket: "#e6e0f0", pants: "#e6e0f0", boots: "#5a3b2a", dress: "#3f7ab8", hat: "nonla", hatCol: "#efd9a0", skin: SKINS[1] };
const FARMER: Outfit = { jacket: "#7a5a3e", pants: "#3a3a44", boots: "#5a3b2a", hat: "nonla", hatCol: "#dcc27e", skin: SKINS[3], moustache: "#2a1e18" };

type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
const ramp = (t: number, a: number, b: number) => smooth((t - a) / Math.max(0.01, b - a));
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts, scale = 1, y = 0, shadow = true) => {
  c.out.places.push(person(c.cam, { i, o, okey } as Who, x, y, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...fo }, {}, scale));
  if (shadow && fo.mode !== "fall") blob(c.out, x, y, z, scale);
};
const blinkOf = (t: number, i: number) => { const f = Math.round(t * FPS), s = Math.round(40 * hh(i, 9)); return (f + s) % Math.round(45 + 30 * hh(i, 3)) < 3; };
/** a rat at (x, z) heading along (dx, dz): mirrored so it always faces its motion on screen */
const rat = (c: Ctx, i: number, x: number, z: number, dx: number, dz: number, o: RatOpts, scale = 0.3, y = 0, shadow = true) => {
  const mirror = dx * c.cam.right.x + dz * c.cam.right.z < 0;
  const d = c.cam.pos.distanceTo(V(x, y + 0.2, z)) / scale;
  const [w, h, k] = d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
  const eye = o.eye ?? (o.mode === "dead" ? "x" : blinkOf(c.t, i) ? "blink" : "dot");
  const oo: RatOpts = { ...o, eye, phase: q(o.phase ?? 0, 12), light: light2D(c.cam, mirror) };
  c.out.places.push({ key: `rat|${JSON.stringify(oo)}`, x, y, z, scale, mirror, draw: (p) => ratSide(p, oo), size: [w, h, k] });
  if (shadow) blob(c.out, x, y, z, scale * 1.4);
};
const puff = (c: Ctx, at: number, p: V3, size: number, life = 1, col?: number[]) => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  c.out.fx.push({ key: `puff${col ? col.join() : ""}${k}`, cw: 300, ch: 300, draw: (pen) => fxSmoke(pen, k, col), x: p[0], y: p[1] + 0.3 * size * u, z: p[2], w: size * (0.6 + 0.6 * u), h: size * (0.6 + 0.6 * u), soft: true });
};
const spark = (c: Ctx, at: number, p: V3, size: number, life = 0.25, col = "#fff3b0") => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  c.out.fx.push({ key: `burst${col}${k}`, cw: 500, ch: 500, draw: (pen) => fxBurst(pen, k, col), x: p[0], y: p[1], z: p[2], w: size, h: size, glow: 1.5 });
};
/** a lantern flame glow on a wall bracket / in a hand */
const flame = (c: Ctx, p: V3, size = 0.35) => {
  const k = q((c.t * 2.3) % 1, 6);
  c.out.fx.push({ key: `flame${k}`, cw: 200, ch: 260, draw: (pen) => fxFlameAt(pen, 100, 170, 60, k * 6), x: p[0], y: p[1], z: p[2], w: size, h: size * 1.3, glow: 2.4 });
};
const germ = (c: Ctx, i: number, p: V3, size: number) => {
  const k = q((c.t * 0.6 + hh(i)) % 1, 10);
  c.out.fx.push({ key: `germ${k}`, cw: 300, ch: 300, draw: (pen) => fxGerm(pen, k * 6.28), x: p[0] + 0.2 * Math.sin(c.t * 1.3 + i), y: p[1] + 0.12 * Math.sin(c.t * 2 + i * 2), z: p[2], w: size, h: size });
};
const tails = (c: Ctx, seed: number, p: V3, w: number, n = 40) =>
  c.out.fx.push({ key: `tails${seed}_${n}`, cw: 600, ch: 400, draw: (pen) => fxTailPile(pen, seed * 977 + 13, n), x: p[0], y: p[1] + w * 0.33, z: p[2], w, h: w * 0.66 });

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const roadTex = () => stoneHD("roadHD", ["#b9ae9a", "#ada28e", "#c3b8a4", "#a59a86"], "#8a8070");
const coverTex = () => ctex("manhole", 256, 256, (g) => {
  g.fillStyle = "#4a4652"; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.strokeStyle = "#2a2630"; g.lineWidth = 8; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(128 + k * 26, 20); g.lineTo(128 + k * 26, 236); g.stroke(); g.beginPath(); g.moveTo(20, 128 + k * 26); g.lineTo(236, 128 + k * 26); g.stroke(); }
  g.lineWidth = 14; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
});
const lamp = (b: Batch, x: number, z: number) => {
  const I = lam("lampIron", () => ({ color: "#3a3d46" }));
  b.add(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8), I, M4(x, 1.8, z));
  b.add(boxGeo(V(x - 0.18, 3.6, z - 0.18), V(x + 0.18, 4.0, z + 0.18)), lam("lampGlass", () => ({ color: "#f3e7b8" })));
  b.add(new THREE.ConeGeometry(0.28, 0.25, 4), I, M4(x, 4.12, z, Math.PI / 4));
};
const desk = (b: Batch, x: number, z: number, w = 2.4, h = 0.8) => {
  const top = lam("deskTop", () => ({ color: "#7a5236" })), side = MAT.darkWood();
  b.add(boxGeo(V(x - w / 2, h - 0.07, z - 0.45), V(x + w / 2, h, z + 0.45)), top);
  b.add(boxGeo(V(x - w / 2 + 0.05, 0, z + 0.36), V(x + w / 2 - 0.05, h - 0.07, z + 0.42)), side);
  for (const s of [-1, 1]) b.add(boxGeo(V(x + s * (w / 2 - 0.05) - 0.05, 0, z - 0.42), V(x + s * (w / 2 - 0.05) + 0.05, h - 0.07, z + 0.42)), side);
  // ledger + ink pot + paper stack
  b.add(boxGeo(V(x - 0.55, h, z - 0.2), V(x - 0.05, h + 0.04, z + 0.15)), lam("ledger", () => ({ color: "#2f5f6a" })));
  b.add(boxGeo(V(x + 0.5, h, z - 0.25), V(x + 0.85, h + 0.12, z + 0.0)), lam("paper", () => ({ color: "#f3ecd8" })));
  b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), lam("inkpot", () => ({ color: "#22202a" })), M4(x + 0.2, h + 0.04, z - 0.25));
};
const vault = (s: SetBuild, z0: number, z1: number, R: number, y: number, mat: THREE.Material) => {
  const g = new THREE.CylinderGeometry(R, R, z0 - z1, 28, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).translate(0, y, (z0 + z1) / 2);
  const m = new THREE.Mesh(g, mat); (mat as THREE.Material).side = THREE.DoubleSide;
  m.castShadow = false; m.receiveShadow = true; s.root.add(m);
};
const cageTex = () => ctex("cageBars", 512, 256, (g) => {
  g.clearRect(0, 0, 512, 256); g.fillStyle = "#3a3d46";
  for (let x = 0; x < 512; x += 32) g.fillRect(x, 0, 7, 256);
  g.fillRect(0, 0, 512, 12); g.fillRect(0, 244, 512, 12); g.fillRect(0, 122, 512, 6);
});
export const CAGES: [number, number, number][] = []; // cage floor centres (x, y, z) for rat staging
const cage = (b: Batch, s: SetBuild, x: number, y: number, z: number, w = 1.5, h = 0.72, d = 0.8) => {
  const F = lam("cageFrame", () => ({ color: "#5a4632" }));
  b.add(boxGeo(V(x - w / 2, y, z - d / 2), V(x + w / 2, y + 0.05, z + d / 2)), F);
  b.add(boxGeo(V(x - w / 2, y + h - 0.04, z - d / 2), V(x + w / 2, y + h, z + d / 2)), F);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(x + sx * w / 2 - 0.03, y, z + sz * d / 2 - 0.03), V(x + sx * w / 2 + 0.03, y + h, z + sz * d / 2 + 0.03)), F);
  b.add(quad(V(x - w / 2, y, z - d / 2), V(x + w / 2, y, z - d / 2), V(x + w / 2, y + h, z - d / 2), V(x - w / 2, y + h, z - d / 2)), lam("cageBack", () => ({ color: "#3a2e24" })));
  const bars = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: cageTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  bars.position.set(x, y + h / 2, z + d / 2 + 0.01); bars.layers.set(NOINK); s.root.add(bars);
  CAGES.push([x, y + 0.05, z]);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  street: (s) => {
    const { b, kit } = s;
    b.add(plane(-120, 120, -9, 60, 3), lam("road", () => ({ map: rep(roadTex(), 1, 1) })));
    b.add(boxGeo(V(-120, 0, -9.2), V(120, 0.15, -6.6)), lam("kerb", () => ({ color: "#d9cdb5" })));
    b.add(plane(-120, 120, -40, -9, 4, 0.16), lam("pave", () => ({ color: "#d4c7ab" })));
    const SI = [1, 4, 6, 1, 0, 4, 1, 6];
    for (let k = -5; k <= 5; k++) house(b, k * 9, -13.2, 0, 8.6, 8, 7.4 + (k % 2 ? 0 : 1.6), SI[(k + 8) % SI.length], 0);
    for (let k = -5; k <= 5; k++) house(b, k * 9 + 4.5, 26, Math.PI, 8.6, 8, 7.4 + (k % 2 ? 1.6 : 0), SI[(k + 11) % SI.length], 0);
    for (let k = -5; k <= 5; k++) { prop(b, kit, "tree_oak", k * 9 + 4.5, 0.15, -7.6, 6.5 + hh(k, 3)); lamp(b, k * 9, -7.1); }
    for (let k = -4; k <= 4; k++) palm(b, k * 11 + 2, 18, 7 + 2 * hh(k, 5), 30 + k);
    // manhole: dark shaft + iron ring; the cover is dynamic
    b.add(new THREE.CircleGeometry(0.46, 32).rotateX(-Math.PI / 2), lam("shaft", () => ({ color: "#15121a" })), M4(0, 0.012, 0));
    b.add(new THREE.TorusGeometry(0.48, 0.05, 6, 32).rotateX(Math.PI / 2), MAT.iron(), M4(0, 0.01, 0));
    const cv = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 32), new THREE.MeshLambertMaterial({ map: coverTex() }));
    cv.position.set(0, 0.03, 0); cv.castShadow = true; cv.receiveShadow = true; s.root.add(cv); s.dyn.cover = cv;
    // the bounty desk on the pavement, outside the bureau (house at x = 0)
    desk(b, -2.0, -5.0, 2.2);
    for (let k = 0; k < 4; k++) crate(b, 3.2 + (k % 2) * 0.75, Math.floor(k / 2) * 0.56, -6.0, 0.7, 0.2 * k);
    // sacks by the manhole (shot 6)
    for (let k = 0; k < 9; k++) b.add(new THREE.SphereGeometry(0.32, 10, 8).scale(1, 0.75, 0.8), lam("sack", () => ({ color: "#b89a68" })), M4(1.4 + 0.55 * (k % 3), 0.22 + 0.4 * Math.floor(k / 3), -1.4 + 0.1 * (k % 2)));
  },
  sewer: (s) => {
    const { b } = s;
    const BR = MAT.brick();
    b.add(plane(-1.2, 1.2, -70, 10, 2, -0.38), lam("sewWater", () => ({ color: "#5f8a5a" })));
    for (const sx of [-1, 1]) {
      b.add(boxGeo(V(sx < 0 ? -2.5 : 1.1, -0.8, -70), V(sx < 0 ? -1.1 : 2.5, 0, 10), 2), lam("walk", () => ({ map: rep(stoneHD("walkHD", ["#9a948a", "#8e887e", "#a49e94", "#87817a"], "#6a645c"), 1, 1) })));
      b.add(boxGeo(V(sx < 0 ? -2.9 : 2.5, -0.8, -70), V(sx < 0 ? -2.5 : 2.9, 2.6, 10), 2), BR);
      for (let k = 0; k < 12; k++) { const z = 6 - k * 6; b.add(boxGeo(V(sx * 2.5 - (sx > 0 ? 0.25 : 0), -0.8, z - 0.3), V(sx * 2.5 + (sx < 0 ? 0.25 : 0), 2.6, z + 0.3)), lam("rib", () => ({ color: "#8a5a44" }))); }
      for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.3, 16).rotateZ(Math.PI / 2), lam("pipe", () => ({ color: "#2a2228" })), M4(sx * 2.45, 1.0, 3 - k * 11));
      for (let k = 0; k < 6; k++) b.add(boxGeo(V(sx * 2.45 - 0.12, 1.9, 0.8 - k * 12 - 0.06), V(sx * 2.45 + 0.12, 1.98, 0.8 - k * 12 + 0.06)), MAT.iron());
    }
    vault(s, 10, -70, 2.9, 2.6, lam("vaultBrick", () => ({ map: rep(brick(), 6, 30), color: "#b8a294" })));
    b.add(quad(V(-3, -0.8, -69), V(3, -0.8, -69), V(3, 6, -69), V(-3, 6, -69)), lam("tunnelEnd", () => ({ color: "#120e14" })));
    // scraps of food on the walkways
    const r = rng(41);
    for (let k = 0; k < 70; k++) { const sx = r() < 0.5 ? -1 : 1, x = sx * (1.3 + 1.0 * r()), z = 6 - 50 * r(); b.add(new THREE.SphereGeometry(0.05 + 0.05 * r(), 7, 5).scale(1.4, 0.6, 1), lam("scrap" + (k % 3), () => ({ color: ["#d9a25a", "#7aa04a", "#e8d9b0"][k % 3] })), M4(x, 0.03, z)); }
  },
  office: (s) => {
    const { b } = s;
    b.add(plane(-7, 7, -5, 7, 1), lam("officeFloor", () => ({ map: planksHD() })));
    const WALL = lam("offWall", () => ({ color: "#ead9b0" })), WAIN = lam("wain", () => ({ color: "#3f6a4f" }));
    b.add(quad(V(-7, 0, -4.2), V(7, 0, -4.2), V(7, 5, -4.2), V(-7, 5, -4.2)), WALL);
    b.add(boxGeo(V(-7, 0, -4.2), V(7, 1.0, -4.1)), WAIN);
    b.add(quad(V(-4.6, 0, 7), V(-4.6, 0, -4.2), V(-4.6, 5, -4.2), V(-4.6, 5, 7)), WALL);
    b.add(boxGeo(V(-4.6, 0, -4.2), V(-4.5, 1.0, 7)), WAIN);
    // tall shuttered window behind the desk
    b.add(boxGeo(V(1.0, 1.1, -4.2), V(2.8, 3.6, -4.15)), lam("winGlow", () => ({ color: "#fff4d6" })));
    for (const x of [0.55, 3.25]) b.add(boxGeo(V(x - 0.42, 1.1, -4.18), V(x + 0.42, 3.6, -4.1)), lam("shutter", () => ({ color: "#2f6a43" })));
    b.add(boxGeo(V(0.9, 1.0, -4.2), V(2.9, 1.1, -4.0)), lam("sill", () => ({ color: "#efe3c8" })));
    // map frame + shelf with ledgers on the left
    b.add(boxGeo(V(-3.2, 1.6, -4.18), V(-1.2, 3.0, -4.12)), lam("mapFrame", () => ({ color: "#5a3a26" })));
    b.add(boxGeo(V(-3.1, 1.7, -4.16), V(-1.3, 2.9, -4.1)), lam("mapPaper", () => ({ color: "#d9c79a" })));
    b.add(boxGeo(V(-4.6, 0, -3.6), V(-4.0, 2.4, -0.8)), MAT.darkWood());
    for (let k = 0; k < 12; k++) b.add(boxGeo(V(-4.05, 0.5 + 0.6 * Math.floor(k / 4), -3.4 + 0.6 * (k % 4)), V(-3.95, 0.95 + 0.6 * Math.floor(k / 4), -3.0 + 0.6 * (k % 4))), lam("led" + (k % 3), () => ({ color: ["#8c3b4a", "#2f5f6a", "#c9a24e"][k % 3] })));
    desk(b, 0, -1.6, 2.6);
    // baskets for the tails
    for (const [x, z] of [[2.2, -0.6], [2.9, -1.4], [-2.4, -0.4]]) b.add(new THREE.CylinderGeometry(0.4, 0.32, 0.45, 16, 1, true), lam("basket", () => ({ color: "#c99a52", side: THREE.DoubleSide })), M4(x, 0.225, z));
  },
  outskirts: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("paddyGrass", () => ({ map: grassHD() })));
    const pw = lam("paddyWater", () => ({ color: "#86b8a4" }));
    for (let i = 0; i < 8; i++) for (const sx of [-1, 1]) b.add(plane(sx * 1.2, sx * 14, 8 - i * 7, 2.6 - i * 7, 1, 0.02), pw);
    b.add(plane(-0.9, 0.9, -8, 30, 2, 0.015), lam("bund", () => ({ color: "#b39a6a" })));
    for (let k = 0; k < 14; k++) palm(b, (k % 2 ? 1 : -1) * (10 + 20 * hh(k, 2)), -15 - 40 * hh(k, 3), 7 + 3 * hh(k, 4), 60 + k);
    for (let k = 0; k < 10; k++) prop(b, kit, "tree_fat", -60 + 13 * k, 0, -70 - 10 * hh(k, 6), 8 + 3 * hh(k, 7));
    // bamboo shed, open toward +z: posts, back + side walls of woven mat, thatched roof
    const BM = MAT.bamboo(), MATW = lam("mat", () => ({ color: "#b8945a" })), TH = lam("thatch", () => ({ color: "#a8884e", side: THREE.DoubleSide }));
    for (const [x, z] of [[-3.4, -9], [3.4, -9], [-3.4, -3], [3.4, -3]]) b.add(new THREE.CylinderGeometry(0.09, 0.1, 3.2, 8), BM, M4(x, 1.6, z));
    b.add(quad(V(-3.4, 0, -9), V(3.4, 0, -9), V(3.4, 3.0, -9), V(-3.4, 3.0, -9)), MATW);
    for (const sx of [-1, 1]) b.add(quad(V(sx * 3.4, 0, sx < 0 ? -3 : -9), V(sx * 3.4, 0, sx < 0 ? -9 : -3), V(sx * 3.4, 2.2, sx < 0 ? -9 : -3), V(sx * 3.4, 2.2, sx < 0 ? -3 : -9)), MATW);
    b.add(quad(V(-4.0, 2.9, -2.4), V(4.0, 2.9, -2.4), V(4.0, 4.4, -6), V(-4.0, 4.4, -6)), TH);
    b.add(quad(V(4.0, 2.9, -9.6), V(-4.0, 2.9, -9.6), V(-4.0, 4.4, -6), V(4.0, 4.4, -6)), TH);
    b.add(plane(-3.4, 3.4, -9, -3, 1, 0.03), lam("shedFloor", () => ({ color: "#9a7a52" })));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) cage(b, s, -2.4 + 1.6 * k, 0.06 + 0.8 * r, -8.4);
    for (let r = 0; r < 2; r++) for (const sx of [-1, 1]) cage(b, s, sx * 2.8, 0.06 + 0.8 * r, -5.6, 1.0, 0.72, 0.8);
  },
  bazaar: (s) => {
    const { b } = s;
    b.add(plane(-40, 40, -40, 20, 2), lam("bzGround", () => ({ map: stoneHD("bzHD", ["#d9b98a", "#cfae7e", "#e2c497", "#c6a574"], "#a3845a") })));
    b.add(quad(V(-12, 0, -3), V(12, 0, -3), V(12, 7, -3), V(-12, 7, -3)), lam("bzWall", () => ({ color: "#d8a95f" })));
    for (const x of [-2.6, 2.6]) { b.add(quad(V(x - 0.8, 0, -2.98), V(x + 0.8, 0, -2.98), V(x + 0.8, 2.4, -2.98), V(x - 0.8, 2.4, -2.98)), lam("arch", () => ({ color: "#5a3a26" }))); b.add(new THREE.CircleGeometry(0.8, 24, 0, Math.PI), lam("arch", () => ({ color: "#5a3a26" })), M4(x, 2.4, -2.97)); }
    const rug = ctex("rug", 512, 340, (g) => {
      g.fillStyle = "#a8322e"; g.fillRect(0, 0, 512, 340); g.strokeStyle = "#e8c45a"; g.lineWidth = 14; g.strokeRect(20, 20, 472, 300);
      g.strokeStyle = "#1f3f6a"; g.lineWidth = 10; g.strokeRect(50, 50, 412, 240);
      g.fillStyle = "#e8c45a"; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(256, 90 + k * 40); g.lineTo(296, 110 + k * 40); g.lineTo(256, 130 + k * 40); g.lineTo(216, 110 + k * 40); g.fill(); }
    });
    b.add(plane(-1.4, 1.4, -1.6, 0.4, 1, 0.012), lam("rugM", () => ({ map: rug })));
    for (const x of [-3.2, 3.2]) { b.add(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 14), lam("pot", () => ({ color: "#b8684a" })), M4(x, 0.35, -2.2)); b.add(new THREE.SphereGeometry(0.75, 12, 10), lam("potPlant", () => ({ color: "#4f8c3c" })), M4(x, 1.2, -2.2)); }
  },
};

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  street: (s, t, id) => {
    const cv = s.dyn.cover;
    const open = id === 5 || id === 6 || id === 12;
    cv.position.set(open ? 0.95 : 0, 0.03, open ? 0.35 : 0); cv.rotation.set(0, open ? 0.6 : 0, 0);
  },
};

// ---------------- staging per shot ----------------
type StageFn = (c: Ctx) => void;
/** a stream of rats running along +z (toward the camera) through a box, wrapping */
const stream = (c: Ctx, n: number, x0: number, x1: number, zA: number, zB: number, speed: number, seed: number, o: (i: number) => RatOpts, scale = 0.28, y = 0) => {
  for (let i = 0; i < n; i++) {
    const L = zB - zA, z = zA + ((hh(i, seed) * L + speed * c.t) % L), x = x0 + (x1 - x0) * hh(i, seed + 1) + 0.25 * Math.sin(c.t * 3 + i);
    rat(c, seed * 1000 + i, x, z, hh(i, seed + 2) < 0.5 ? -0.6 : 0.6, 1, { mode: "run", phase: (c.t * 2.6 + hh(i, seed + 3)) % 1, ...o(i) }, scale * (0.9 + 0.2 * hh(i, seed + 4)), y);
  }
};
export const STAGE: Record<number, StageFn> = {
  1: (c) => {
    const t = c.t, bad = after(t, C.terribly);
    if (!bad) {
      pose(c, 1, OFF, "off", -2.0, -5.9, { mode: "stand", expr: after(t, C.paid) ? "smug" : "neutral", prop: after(t, C.paid) ? "coin" : null });
      pose(c, 2, HUNTER(0), "h0", -0.6, -4.1, { mode: "stand", expr: "grin", prop: "rat", phase: (t * 0.8) % 1 });
      pose(c, 3, HUNTER(1), "h1", 0.5, -3.4, { mode: "stand", expr: "grin", prop: "rat", phase: (t * 0.8 + 0.4) % 1 });
    } else {
      stream(c, 70, -3.5, 3.5, -12, 4, 5.0, 1, () => ({ eye: "smug" }));
      pose(c, 1, OFF, "off", -2.0, -5.9, { mode: "stand", expr: "shock" });
    }
  },
  2: (c) => {
    const t = c.t;
    for (let k = 0; k < 6; k++) pose(c, 10 + k, k === 2 ? LADY : HUNTER(k + 2), k === 2 ? "lady" : `h${k + 2}`, -14 + 6 * k + 1.2 * (t - C.l1) * (k % 2 ? 1 : -1), -5.6 + 3.5 * hh(k, 2), { mode: "stroll", phase: (t * 1.1 + hh(k)) % 1, expr: "neutral" });
    if (after(t, C.town)) rat(c, 1, 0.08, 0.05, 1, 0, { mode: "up", eye: "smug", phase: t % 1 }, 0.3, -0.12, false);
  },
  3: (c) => {
    const t = c.t, up = after(t, C.perfect);
    for (let i = 0; i < 26; i++) { const sx = hh(i, 2) < 0.5 ? -1 : 1, x = sx * (1.35 + 0.9 * hh(i, 3)), z = 4.5 - 22 * hh(i, 4); rat(c, 100 + i, x, z, hh(i, 5) - 0.5, 0, { mode: i % 3 ? "eat" : "stand", phase: (t * 1.2 + hh(i)) % 1 }, 0.28); }
    if (up) rat(c, 7, 1.55, 4.3, -1, 0, { mode: "up", eye: "happy", phase: t % 1 }, 0.32);
    for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) flame(c, [sx * 2.38, 2.15, 0.8 - k * 12], 0.3);
  },
  4: (c) => {
    const t = c.t, pl = after(t, C.plague3);
    rat(c, 8, 1.5, 3.2, -1, 0, { mode: "up", eye: pl ? "smug" : "dot", phase: t % 1, sick: false }, 0.32);
    if (pl) for (let k = 0; k < 4; k++) germ(c, k, [1.3 + 0.13 * k, 0.32 + 0.07 * (k % 2) + 0.12 * ramp(t, C.plague3, C.plague3 + 1.2), 3.4], 0.09 * ramp(t, C.plague3 - 0.1, C.plague3 + 0.3));
    flame(c, [2.38, 2.15, 0.8], 0.3);
  },
  5: (c) => {
    const t = c.t, dn = ramp(t, C.down - 0.1, C.down + 1.4);
    pose(c, 1, OFF, "off", -1.5, -0.8, { mode: "stand", expr: "stern", prop: "point" });
    pose(c, 2, HUNTER(0), "h0", 0.0, 0.0, { mode: "stand", expr: "nervous", prop: ["torch", 0.2] }, 1, -1.6 * dn, false);
    pose(c, 3, HUNTER(3), "h3", 1.1, 0.7, { mode: "stand", expr: after(t, C.down) ? "nervous" : "neutral" });
  },
  6: (c) => {
    const t = c.t, big = after(t, C.twenty);
    if (!big) {
      pose(c, 1, OFF, "off", -0.9, -1.0, { mode: "stand", expr: "smug", prop: "quill" });
      pose(c, 2, HUNTER(1), "h1", 0.4, 0.8, { mode: "stand", expr: "relief", prop: "crate" });
      for (let i = 0; i < 10; i++) rat(c, 200 + i, 1.4 + 0.55 * (i % 3) + 0.1 * hh(i), -0.8 + 0.25 * Math.floor(i / 3), 1, 0, { mode: "dead" }, 0.26, 0.6 + 0.12 * Math.floor(i / 5), false);
    } else {
      // the mountain: dead rats heaped in a cone
      for (let i = 0; i < 260; i++) {
        const a = hh(i, 1) * 6.28, r = 1.9 * Math.sqrt(hh(i, 2)), hgt = 1.7 * (1 - r / 2.0);
        rat(c, 300 + i, 0.4 + r * Math.cos(a), -2.4 + r * Math.sin(a) * 0.5, Math.cos(a + i), 0, { mode: "dead" }, 0.4, Math.max(0, hgt - 0.15 * hh(i, 3)), false);
      }
      pose(c, 1, OFF, "off", -1.9, -0.6, { mode: "stand", expr: "shock", prop: "quill" });
    }
  },
  7: (c) => {
    const t = c.t, sh = after(t, C.coming);
    pose(c, 1, HUNTER(0), "h0", 1.7, 3.2, { mode: "stand", expr: sh ? "shock" : "nervous", prop: ["torch", 0.2] });
    flame(c, [2.35, 2.25, 3.2], 0.32);
    stream(c, 110, -1.0, 1.0, -18, 6, 4.5, 3, () => ({}), 0.3, -0.36);
    stream(c, 40, -2.3, -1.3, -40, 6, 3.8, 4, () => ({}), 0.28);
    for (const sx of [-1, 1]) for (let k = 1; k < 5; k++) flame(c, [sx * 2.38, 2.15, 0.8 - k * 12], 0.3);
  },
  8: (c) => {
    const t = c.t, any = after(t, C.anyone), cent = after(t, C.cent);
    pose(c, 1, OFF, "off", -2.0, -5.9, { mode: "stand", expr: cent ? "smug" : any ? "grin" : "neutral", prop: cent ? "coin" : any ? "point" : null });
    if (any) for (let k = 0; k < 9; k++) pose(c, 20 + k, k === 4 ? LADY : HUNTER(k), k === 4 ? "lady" : `h${k}`, -0.6 + 1.0 * k, -4.6 + 0.9 * k, { mode: "stand", expr: k % 3 ? "grin" : "smile", prop: k % 2 ? "rat" : null, phase: (t * 0.8 + 0.3 * k) % 1 });
  },
  9: (c) => {
    const t = c.t, pile = after(t, C.piles), tail = after(t, C.tail8);
    pose(c, 1, OFF, "off", 0, -2.5, { mode: "stand", expr: tail ? "smug" : pile ? "shock" : "neutral", prop: tail ? "tail" : null, headTilt: pile && !tail ? -6 : 0 });
    pose(c, 2, HUNTER(2), "h2", 1.2, 0.2, { mode: "stand", expr: pile ? "grin" : "smile", prop: pile ? null : "rat" });
    if (pile) for (let i = 0; i < 16; i++) {
      const u = clamp01((t - C.piles - 0.05 * i) / 0.35), y = 0.8 + 0.12 * Math.floor(i / 6) + 1.2 * (1 - u) * (1 - u);
      if (u > 0) rat(c, 400 + i, -0.8 + 0.3 * (i % 6) + 0.05 * hh(i), -1.5 + 0.1 * hh(i, 2), hh(i, 3) - 0.5, 0, { mode: "dead" }, 0.25, y, false);
    }
  },
  10: (c) => {
    const t = c.t, g = ramp(t, C.l9, C.pouring + 0.8);
    pose(c, 1, OFF, "off", 0, -2.5, { mode: "stand", expr: "grin", prop: "coin" });
    tails(c, 1, [-0.4, 0.8, -1.4], 0.6 + 1.0 * g, 20 + Math.round(30 * g));
    tails(c, 2, [2.2, 0.4, -0.6], 0.5 + 0.4 * g, 30);
    tails(c, 3, [-2.4, 0.4, -0.4], 0.5 + 0.4 * g, 30);
    for (let k = 0; k < 6; k++) pose(c, 30 + k, HUNTER(k + 1), `h${k + 1}`, 0.9 + 0.55 * k, 0.2 + 0.6 * k, { mode: "stand", expr: "grin", prop: "tail", phase: (t * 0.9 + 0.2 * k) % 1 });
  },
  11: (c) => {
    const t = c.t, no = after(t, C.no10);
    if (!no) {
      pose(c, 1, LADY, "lady", -0.4, -1.2, { mode: "stand", expr: after(t, C.around) ? "shock" : "neutral", look: 1 });
      const u = t - C.seeing;
      if (u > 0) rat(c, 1, -2.1 + 3.4 * u, 1.0, 1, 0, { mode: "run", tail: false, phase: (t * 3) % 1 }, 0.3);
    } else rat(c, 1, 1.2, 1.0, 1, 0, { mode: "stand", tail: false, eye: "smug", phase: t % 1 }, 0.3);
  },
  12: (c) => {
    const t = c.t, cut = after(t, C.cutting), go = after(t, C.letting);
    pose(c, 1, HUNTER(0), "h0", 0, -1.0, { mode: "stand", expr: go ? "grin" : cut ? "smug" : "smile", prop: go ? null : cut ? "scissors" : "rat", wave: go ? q(Math.sin(t * 8), 20) : undefined, phase: (t * 0.8) % 1 });
    if (cut) { spark(c, C.cutting + 0.05, [0.62, 1.55, -0.8], 0.35, 0.25, "#ffffff"); }
    if (go) { const u = t - C.letting; rat(c, 2, 0.6 + 3.2 * u, -0.2 + 0.4 * u, 1, 0.1, { mode: "run", tail: false, eye: "happy", phase: (t * 3) % 1 }, 0.3); }
  },
  13: (c) => {
    const t = c.t;
    rat(c, 1, 0.15, 3.0, 1, 0, { mode: "stand", tail: false, eye: "smug", phase: t % 1 }, 0.34);
    for (let k = 0; k < 5; k++) rat(c, 10 + k, 0.45 + 0.15 * k + 0.05 * hh(k), 3.12 + 0.2 * hh(k, 2), k % 2 ? 1 : -1, 0, { mode: k % 3 ? "stand" : "run", eye: after(t, C.babies) ? "happy" : undefined, phase: (t * 2 + hh(k)) % 1 }, 0.16);
    flame(c, [2.38, 2.15, 0.8], 0.3);
  },
  14: (c) => {
    const t = c.t, f = after(t, C.found), x = Math.min(-0.2, -3.2 + 1.3 * (t - C.l13));
    pose(c, 1, INSP, "insp", x, -0.6, { mode: f ? "stand" : "march", phase: (t * 1.4) % 1, expr: f ? "nervous" : "stern", look: f ? 1 : 0 });
  },
  15: (c) => {
    const t = c.t;
    CAGES.forEach(([x, y, z], k) => { for (let i = 0; i < 4; i++) rat(c, 500 + k * 4 + i, x - 0.5 + 0.33 * i, z + 0.1 * hh(i, k), (i + k) % 2 ? 1 : -1, 0, { mode: (i + k) % 3 ? "stand" : "up", phase: (t + hh(i, k)) % 1, eye: (i + k) % 4 ? undefined : "smug" }, 0.3, y, false); });
    pose(c, 1, INSP, "insp", -0.9, -3.6, { mode: "stand", expr: "shock", headTilt: 4 });
  },
  16: (c) => {
    const t = c.t, cash = after(t, C.cash);
    CAGES.forEach(([x, y, z], k) => { for (let i = 0; i < 3; i++) rat(c, 600 + k * 3 + i, x - 0.4 + 0.4 * i, z, (i + k) % 2 ? 1 : -1, 0, { mode: "stand", phase: (t + hh(i, k)) % 1 }, 0.24, y, false); });
    pose(c, 1, FARMER, "farmer", 0.6, -3.6, { mode: "stand", expr: cash ? "grin" : "smug", prop: cash ? "coin" : "tail", phase: (t * 0.8) % 1 });
    tails(c, 4, [-0.6, 0.0, -3.4], 0.9, 50);
  },
  17: (c) => {
    const t = c.t, more = after(t, C.hanoi16);
    if (!more) {
      const st = after(t, C.cancelled);
      pose(c, 1, OFF, "off", 0, -2.5, { mode: "stand", expr: st ? "stern" : "neutral", prop: "stamp" });
      if (st) spark(c, C.cancelled, [0.65, 0.95, -1.5], 0.6, 0.3, "#ffffff");
      tails(c, 5, [-0.5, 0.8, -1.4], 0.9, 30);
    } else {
      for (let i = 0; i < 110; i++) { const x = -4.2 + 8.4 * hh(i, 4) + 0.6 * (t - C.hanoi16) * (hh(i, 6) - 0.5) * 4, z = -0.9 + 4.4 * hh(i, 5); rat(c, 700 + i, x, z, hh(i, 6) - 0.5, 0, { mode: i % 4 ? "run" : "up", tail: i % 5 !== 0, eye: i % 3 ? undefined : "smug", phase: (t * 2.4 + hh(i)) % 1 }, 0.4, 0.0); }
      pose(c, 1, OFF, "off", 0, -2.5, { mode: "stand", expr: "shock", prop: "shrug" });
    }
  },
  18: (c) => {
    const t = c.t;
    for (let k = 0; k < 10; k++) germ(c, k, [-4 + 9 * hh(k, 3), 0.6 + 2.2 * hh(k, 4), -6 + 9 * hh(k, 5)], 0.5 + 0.3 * hh(k, 6));
    for (let k = 0; k < 6; k++) puff(c, Math.floor((t + hh(k)) * 0.5) * 2 - hh(k), [-5 + 2 * k, 0.5, -5 + hh(k, 2) * 6], 3.5, 2, [120, 160, 110]);
    for (let i = 0; i < 18; i++) rat(c, 800 + i, -6 + 12 * hh(i, 1), -7.2 + 1.2 * hh(i, 2), hh(i, 3) - 0.5, 0, { mode: "stand", eye: "smug", phase: (t + hh(i)) % 1 }, 0.28, 0.15);
  },
  19: (c) => {
    const t = c.t, rise = ramp(t, C.cobra - 0.15, C.cobra + 0.5);
    const sw = q(Math.sin(t * 3.2) * (0.3 + 0.7 * rise), 30);
    c.out.places.push({ key: `cobra|${sw}|${q(rise, 20)}|${after(t, C.effect) ? "s" : "d"}`, x: 0, y: 0, z: -0.6, scale: 0.9,
      draw: (p) => cobraFx(p, sw, q(rise, 20), after(t, C.effect) ? "smug" : "dot"), size: [1800, 3000, 3.0] });
    blob(c.out, 0, 0, -0.6, 1.2);
  },
  20: (c) => {
    const t = c.t, more = after(t, C.more19);
    pose(c, 1, OFF, "off", 0, -2.5, { mode: "stand", expr: more ? "shock" : "smug", prop: more ? "shrug" : "coin" });
    if (!more) pose(c, 2, HUNTER(1), "h1", 1.3, 0.1, { mode: "stand", expr: "grin", prop: "tail" });
    else {
      rat(c, 1, -0.3, -1.45, 1, 0, { mode: "up", eye: "smug", coin: true, phase: t % 1 }, 0.34, 0.8, false);
      for (let i = 0; i < 60; i++) { const u = t - C.more19, z = 6 - 3.5 * u - 6 * hh(i, 7), x = -3.5 + 7 * hh(i, 8); if (z < 4) rat(c, 900 + i, x, Math.max(-3.6, z), hh(i, 9) - 0.5, -1, { mode: "run", phase: (t * 2.6 + hh(i)) % 1, eye: i % 3 ? undefined : "smug" }, 0.3); }
    }
  },
};
