// Places and cast of "Mad Jack Churchill". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, MAT, M4, plane, earthHD, crate, scrub, palm, beamBetween, block } from "./props3d";
import { prop, Kit } from "./build";
import { grassHD, rep, planksHD, water, rng } from "./paint";
import { Pen, SKINS, fxBurst, fxPuff, fxConfetti, fxBang, fxBoom, Outfit, FrontOpts, Expr, fxWord, fxBanner, fxSmoke, fxFlameAt, cowSide, CowOpts, fxLeaflet, fxLetter, fxPlane, fxList, fxThink, fxDoc, fxMap, fxCal, fxShopSign, fxScore, fxTank, fxBomber, fxArrow, fxHole, fxCampSign, fxMuzzle, fxNote, fxScraps } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, light2D } from "./cast";
import { C } from "./cues";
import { V3, smooth, clamp01, LEAD, SetId } from "./story";

// ---------------- cast ----------------
const BD = "#7d6e4a", BD_P = "#6e6142";
/** Jack Churchill: battledress, Brodie helmet, moustache, claymore at the hip */
const JACK: Outfit = { jacket: BD, pants: BD_P, boots: "#2a1e16", hat: "brodie", hatCol: "#5e6440", buttons: "#c9b36a", belt: "#a89a6a", moustache: "#5a3a22", skin: SKINS[0], sword: true };
/** Norway: kilt, dark balmoral-style beret */
const JACK_K: Outfit = { ...JACK, pants: "#e9e2cc", kilt: "#2f5a3a", hat: "beret", hatCol: "#2a2f44", belt: null };
const TOMMY = (v: number, extra: Partial<Outfit> = {}): Outfit => ({ jacket: BD, pants: BD_P, boots: "#2a1e16", hat: "brodie", hatCol: "#5e6440", buttons: "#a89a6a", belt: "#a89a6a", skin: SKINS[[1, 2, 0, 3][v % 4]], moustache: v % 3 === 1 ? "#3a2a1e" : undefined, rifle: true, ...extra });
const GER = (v: number, extra: Partial<Outfit> = {}): Outfit => ({ jacket: "#6b7060", pants: "#5c6052", boots: "#1e1a16", hat: "stahl", hatCol: "#5f6656", buttons: "#c9ccd2", belt: "#2a2420", skin: SKINS[[0, 2, 1, 0][v % 4]], moustache: v % 4 === 2 ? "#6a4a2a" : undefined, rifle: true, ...extra });
const YANK = (v: number, extra: Partial<Outfit> = {}): Outfit => ({ jacket: "#8a7e5a", pants: "#6b6a4a", boots: "#5a3b2a", hat: "m1", hatCol: "#5c6440", buttons: "#5a5236", belt: "#a89a6a", skin: SKINS[[1, 3, 0, 2][v % 4]], rifle: true, ...extra });
const OFFICER_NS: Outfit = { jacket: BD, pants: BD_P, boots: "#2a1e16", hat: "peaked", hatCol: "#7a6c48", buttons: "#e8c45a", belt: "#a89a6a", moustache: "#2a2020", skin: SKINS[1], build: "stout" };

type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
// ---------------- life: card-level motion (calm: no jitter, one smooth lean per reaction) ----------------
type Act = { lean?: number; dy?: number };
const sway = (t: number, i: number, amp0 = 0.03, hz0 = 0.5) => { const amp = amp0 * 0.45, hz = hz0 * 0.7; return amp * Math.sin(2 * Math.PI * (hz * t + hh(i, 5))) + 0.4 * amp * Math.sin(2 * Math.PI * (1.7 * hz * t + hh(i, 6))); };
const jolt = (t: number, at: number, amp: number) => { const u = (t - at + LEAD) / 0.12; return u < 0 ? 0 : 0.7 * amp * u * Math.exp(1 - u); };
const hop = (t: number, at: number, h = 0.12, d = 0.3) => { const u = (t - at + LEAD) / d; return u < 0 || u > 1 ? 0 : h * Math.sin(Math.PI * u); };
const bounce = (t: number, i: number, h0 = 0.06, hz0 = 2.2) => { const h = h0 * 0.5, hz = hz0 * 0.6; return h * Math.abs(Math.sin(Math.PI * (hz * t + hh(i, 7)))); };
const cyc = <T,>(t: number, list: T[], hz = 2.5, i = 0): T => list[Math.floor(t * hz * 0.45 + hh(i, 8) * list.length) % list.length];
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0, shadow = true) => {
  const { lean = 0, dy = 0, ...f } = fo;
  const pl = person(c.cam, { i, o, okey } as Who, x, y + dy, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...f }, {}, scale);
  pl.roll = sway(c.t, i) + lean;
  c.out.places.push(pl);
  if (shadow && f.mode !== "fall" && y < 0.05) blob(c.out, x, y, z, scale);
};
const blinkOf = (t: number, i: number) => { const f = Math.round(t * 30), s = Math.round(40 * hh(i, 9)); return (f + s) % Math.round(55 + 30 * hh(i, 3)) < 3; };
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<Stage["fx"][number]> = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
const spark = (c: Ctx, at: number, p: V3, size: number, life = 0.25, col = "#fff3b0") => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  card(c, `burst${col}${k}`, 500, 500, (pen) => fxBurst(pen, k, col), p, size, size, { glow: 1.5 });
};
const pop = (t: number, at: number) => { const u = clamp01((t - at + LEAD) / 0.18); return u <= 0 ? 0 : 1 + 0.25 * Math.sin(Math.PI * u) * (1 - u) + (u < 1 ? -0.3 * (1 - u) : 0); };
const puff = (c: Ctx, at: number, p: V3, size = 0.5, life = 0.45) => { const u = (c.t - at) / life; if (u < 0 || u >= 1) return; const k = q(u, 16); card(c, `puff${k}`, 300, 300, (pen) => fxPuff(pen, k), p, size, size); };
const boom = (c: Ctx, at: number, p: V3, size = 3, life = 0.8) => { const u = (c.t - at) / life; if (u < 0 || u >= 1) return; const k = q(u, 20); card(c, `boom${k}`, 500, 500, (pen) => fxBoom(pen, k), p, size, size, { glow: 1.3 }); };
const word = (c: Ctx, at: number, txt: string, p: V3, w: number, life = 0.7, col = "#fff3b0") => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at) * (u > life - 0.12 ? (life - u) / 0.12 : 1); card(c, `word${txt}${col}`, 600, 300, (pen) => fxWord(pen, txt, col), p, w * k, 0.5 * w * k, { rot: 0.06 * Math.sin(at * 7) }); };
const sweat = (c: Ctx, p: V3, s = 0.07) => { for (let k = 0; k < 2; k++) { const u = (c.t * 1.2 + k / 2) % 1; card(c, "sweat", 120, 160, (pen) => { pen.poly([[60, 10], [100, 100], [60, 150], [20, 100]], "#bfe6ff", 6); }, [p[0] + (k ? 1 : -1) * (0.08 + 0.12 * u), p[1] + 0.1 * Math.sin(Math.PI * u) - 0.05 * u, p[2]], s, s * 1.3); } };
const confetti = (c: Ctx, at: number, p: V3, w: number) => { if (c.t < at - LEAD) return; const k = q(((c.t - at) * 0.35) % 1, 30); card(c, `conf${k}`, 600, 600, (pen) => fxConfetti(pen, k), p, w, w); };
const bang = (c: Ctx, at: number, p: V3, s = 0.14) => { if (!after(c.t, at)) return; const k = pop(c.t, at); card(c, "bang", 200, 400, (pen) => fxBang(pen), p, s * k, 2 * s * k); };
/** a cow at (x, z) facing along dx */
const cow = (c: Ctx, i: number, x: number, z: number, dx: number, oa: CowOpts & Act, scale = 0.62) => {
  const { lean = 0, dy = 0, ...o } = oa;
  const mirror = dx * c.cam.right.x < 0;
  const d = c.cam.pos.distanceTo(V(x, 0.6 * scale, z)) / scale;
  const [w, h, k] = d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
  const eye = o.eye ?? (blinkOf(c.t, 20 + i) ? "blink" : "dot");
  const oo: CowOpts = { ...o, eye, phase: q(o.phase ?? 0, 16), light: light2D(c.cam, mirror), spots: i };
  c.out.places.push({ key: `cow|${JSON.stringify(oo)}`, x, y: dy, z, scale, mirror, draw: (p) => cowSide(p, oo), size: [w, h, k], roll: sway(c.t, 40 + i, 0.015, 0.4) + lean });
  blob(c.out, x, 0, z, scale * 2.4);
};
/** 0..1 ramp from cue a over d seconds */
const ramp = (t: number, a: number, d: number) => smooth((t - a + LEAD) / d);
const smoke = (c: Ctx, p: V3, s: number, k0 = 0) => { const k = q(((c.t * 0.25 + k0) % 1), 20); card(c, `smk${k}`, 400, 400, (pen) => fxSmoke(pen, k), [p[0], p[1] + 1.2 * k, p[2]], s * (0.6 + k), s * (0.6 + k), { soft: true }); };

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
/** distant hills on an arc BEHIND the stage only (never in front of the cameras) */
const backHills = (b: Batch, R: number, n: number, h: number, seed: number, mat: THREE.Material) => {
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.08 + 0.84 * (i / (n - 1))), rr = R * (0.9 + 0.25 * hh(seed + i, 1)), w = h * (2.2 + 1.6 * hh(seed + i, 2));
    b.add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(w, h * (0.6 + 0.6 * hh(seed + i, 3)), w * 0.8), mat, M4(-Math.cos(a) * rr, -0.5, -Math.sin(a) * rr, a));
  }
};
const rock = (b: Batch, x: number, y: number, z: number, s: number, seed: number, col = "#9a9088") => {
  const g = new THREE.DodecahedronGeometry(s, 0).scale(1.2, 0.7 + 0.3 * hh(seed, 2), 1);
  b.add(g, lam("rock" + col, () => ({ color: col, flatShading: true })), M4(x, y + 0.3 * s, z, hh(seed, 3) * 6));
};
/** banana plant: soft green trunk, 7 broad arching leaves, a hanging bunch */
const banana = (b: Batch, x: number, z: number, h: number, seed: number, fruit = true) => {
  const r = rng(seed);
  b.add(new THREE.CylinderGeometry(0.09 * h / 2, 0.14 * h / 2, h, 10).translate(0, h / 2, 0), lam("banTrunk", () => ({ color: "#8a9a52" })), M4(x, 0, z));
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + r() * 0.5, L = h * (0.75 + 0.2 * r()), W = 0.32 * h, seg = 8;
    const g = new THREE.BufferGeometry(), pos: number[] = [], idx: number[] = [];
    for (let i = 0; i <= seg; i++) { const u = i / seg, d = L * u, yy = 0.55 * L * u - 0.75 * L * u * u, w = W * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)); pos.push(d, yy, -w, d, yy + 0.04 * L, 0, d, yy, w); }
    for (let i = 0; i < seg; i++) for (const [p0, p1] of [[0, 1], [1, 2]]) { const a0 = i * 3 + p0, a1 = i * 3 + p1, b0 = a0 + 3, b1 = a1 + 3; idx.push(a0, b0, b1, a0, b1, a1); }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, k % 2 ? lam("banLeaf", () => ({ color: "#6cb24a", side: THREE.DoubleSide })) : lam("banLeaf2", () => ({ color: "#57a03e", side: THREE.DoubleSide })), new THREE.Matrix4().compose(V(x, h * 0.95, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a), V(1, 1, 1)));
  }
  if (fruit) for (let k = 0; k < 6; k++) b.add(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8).rotateZ(0.6), lam("banFruit", () => ({ color: "#d8c84a" })), M4(x + 0.16 + 0.05 * (k % 3), h * 0.72 - 0.08 * Math.floor(k / 3), z + 0.06 * (k % 2), k));
};
/** jungle undergrowth: fern-ish clumps of flattened spheres */
const fern = (b: Batch, x: number, z: number, s: number, seed: number) => scrub(b, x, z, s, seed, ["#4f8f3a", "#5c9c40", "#447f34"][seed % 3]);
const jungleFloor = () => earthHD("jungleHD", ["#6f8a3e", "#5e7c36", "#7a9446", "#8a7a4a"], "#3f6a2e");
const sandbags = (b: Batch, x0: number, x1: number, y: number, z: number, rows = 2) => {
  const S = lam("sandbag", () => ({ color: "#b9a676" })), S2 = lam("sandbag2", () => ({ color: "#a9966a" }));
  for (let r = 0; r < rows; r++) for (let x = x0 + (r % 2) * 0.3; x < x1; x += 0.62) {
    const g = new THREE.CapsuleGeometry(0.15, 0.32, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.75, 1);
    b.add(g, (Math.round(x * 3) + r) % 2 ? S : S2, M4(x + 0.3, y + 0.12 + r * 0.22, z));
  }
};
/** army lorry, cab toward +x */
const truck = (b: Batch, x: number, z: number) => {
  const O = lam("truckOlive", () => ({ color: "#5e6540" })), Od = lam("truckOliveD", () => ({ color: "#4a5034" })), Cv = lam("truckCanvas", () => ({ color: "#8a8458", side: THREE.DoubleSide })), Tr = lam("tyre", () => ({ color: "#1e1e22" })), Gl = lam("truckGlass", () => ({ color: "#3a4256" }));
  b.add(boxGeo(V(x - 2.2, 0.55, z - 1.0), V(x + 1.0, 1.25, z + 1.0)), Od);
  b.add(new THREE.CylinderGeometry(1.0, 1.0, 3.2, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2), Cv, M4(x - 0.6, 1.25, z));
  b.add(boxGeo(V(x + 1.0, 0.55, z - 0.95), V(x + 2.3, 2.0, z + 0.95)), O);
  b.add(boxGeo(V(x + 2.3, 0.55, z - 0.85), V(x + 3.0, 1.35, z + 0.85)), O);
  b.add(boxGeo(V(x + 2.28, 1.4, z - 0.8), V(x + 2.33, 1.9, z + 0.8)), Gl);
  for (const [wx, wz] of [[-1.5, -1.0], [-1.5, 1.0], [2.2, -1.0], [2.2, 1.0]]) b.add(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16).rotateX(Math.PI / 2), Tr, M4(x + wx, 0.48, z + wz));
};
/** barbed-wire picket line along x at z: posts and sagging strands */
const wire = (b: Batch, x0: number, x1: number, z: number, h = 1.3, step = 2.2, strands = 3) => {
  const Wd = lam("wirePost", () => ({ color: "#5a4632" })), Wr = lam("wire", () => ({ color: "#3a3634" }));
  for (let x = x0; x <= x1 + 1e-6; x += step) b.add(boxGeo(V(x - 0.06, 0, z - 0.06), V(x + 0.06, h, z + 0.06)), Wd);
  for (let k = 0; k < strands; k++) { const y = h * (0.3 + 0.65 * k / Math.max(1, strands - 1)); for (let x = x0; x < x1 - 1e-6; x += step) { const m = V(x + step / 2, y - 0.08, z); b.add(beamBetween(V(x, y, z), m, 0.015, 4), Wr); b.add(beamBetween(m, V(x + step, y, z), 0.015, 4), Wr); } }
};
const crater = (b: Batch, x: number, z: number, r: number) => {
  b.add(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), lam("crater", () => ({ color: "#5a4a38" })), M4(x, 0.02, z));
  b.add(new THREE.TorusGeometry(r, 0.18 * r, 6, 24).rotateX(Math.PI / 2).scale(1, 1, 0.5), lam("craterRim", () => ({ color: "#7a6448" })), M4(x, 0.02, z));
};
const ruin = (b: Batch, x: number, z: number) => {
  const St = lam("ruinStone", () => ({ color: "#c8bca4" })), Dk = lam("ruinDark", () => ({ color: "#3a3430" }));
  b.add(boxGeo(V(x - 3, 0, z - 0.3), V(x + 3, 3.4, z + 0.3)), St);
  b.add(boxGeo(V(x - 3, 0, z - 3), V(x - 2.4, 4.2, z + 0.3)), St);
  b.add(boxGeo(V(x + 1.0, 3.4, z - 0.3), V(x + 3, 4.6, z + 0.3)), St);
  b.add(boxGeo(V(x - 1.6, 1.2, z + 0.3), V(x - 0.6, 2.4, z + 0.32)), Dk);
  b.add(boxGeo(V(x + 0.6, 1.2, z + 0.3), V(x + 1.6, 2.4, z + 0.32)), Dk);
};
const hut = (b: Batch, x: number, z: number, w = 8, d = 3.6, h = 2.4, col = "#7a6a52") => {
  b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, h, z + d / 2)), lam("hut" + col, () => ({ color: col })));
  b.add(new THREE.CylinderGeometry(d * 0.62, d * 0.62, w + 0.4, 3, 1).rotateZ(Math.PI / 2).scale(1, 0.42, 1).translate(x, h + 0.25, z), lam("hutRoof", () => ({ color: "#4a4440" })));
  for (let k = 0; k < Math.floor(w / 2); k++) b.add(boxGeo(V(x - w / 2 + 0.6 + 2 * k, 1.0, z + d / 2), V(x - w / 2 + 1.4 + 2 * k, 1.7, z + d / 2 + 0.03)), lam("hutWin", () => ({ color: "#2a2a30" })));
};
const tower = (b: Batch, x: number, z: number, h = 5) => {
  const Wd = lam("towerWood", () => ({ color: "#6a523a" }));
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) b.add(beamBetween(V(x + dx * 1.3, 0, z + dz * 1.3), V(x + dx, h, z + dz), 0.09, 6), Wd);
  b.add(boxGeo(V(x - 1.2, h, z - 1.2), V(x + 1.2, h + 0.15, z + 1.2)), Wd);
  b.add(boxGeo(V(x - 1.2, h + 0.15, z - 1.2), V(x + 1.2, h + 1.0, z + 1.2)), lam("towerWall", () => ({ color: "#8a6e4e" })));
  b.add(new THREE.ConeGeometry(1.9, 1.0, 4).rotateY(Math.PI / 4).translate(x, h + 2.1, z), lam("towerRoof", () => ({ color: "#4a4440" })));
  b.add(boxGeo(V(x - 0.15, h + 1.0, z - 1.15), V(x + 0.15, h + 1.6, z + 1.15)), Wd);
};
const snowTex = () => earthHD("snowHD2", ["#aebccb", "#a2b0c0", "#b8c4d2", "#98a8b8"], "#8e9eae");
const dustTex = () => earthHD("dustHD", ["#cdb68a", "#c2aa7e", "#d6c094", "#b8a074"], "#8e9a5a");
const campTex = () => earthHD("campHD", ["#9a8466", "#8e785c", "#a68e70", "#857055"], "#6e7a4a");
export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  field: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("fieldGrass", () => ({ map: grassHD() })));
    b.add(plane(-10, 10, -7, 4, 1, 0.01), lam("fieldDirt", () => ({ map: rep(earthHD("mudHD", ["#8a7458", "#7d6a50", "#968060", "#6e5e46"], "#6a7a46"), 2, 2) })));
    backHills(b, 90, 12, 16, 7, lam("hillFr", () => ({ color: "#6f9a4e" })));
    for (let k = -7; k <= 7; k++) prop(b, kit, "tree_fat", k * 9 + 3, 0, -30 - 6 * hh(k, 3), 7 + 2 * hh(k, 4));
    for (let k = -4; k <= 4; k++) prop(b, kit, "hedge", k * 4.2, 0, -14 - 0.6 * hh(k, 1), 1.4);
    wire(b, -14, 14, -10.5, 1.2, 2.2, 3);
    sandbags(b, 1.6, 6.2, 0, -3.6, 3); sandbags(b, -6.5, -3.4, 0, -4.2, 2);
    crater(b, -2.6, -6.5, 1.0); crater(b, 2.0, -8.0, 1.3); crater(b, 6.5, -5.6, 0.9);
    ruin(b, -9, -16);
    truck(b, -7.4, -6.6);
    for (let k = 0; k < 3; k++) crate(b, -3.1 + 0.75 * k, 0, -3.0, 0.65, 0.2 * k);
    rock(b, 3.4, 0, -6.4, 0.4, 3, "#8a8478");
  },
  norway: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, -2.4, 40, -0.06), lam("seaN", () => ({ map: rep(water(), 40, 40), color: "#7a96a8" })));
    b.add(plane(-60, 60, -2.4, 60, 1, 0.0), lam("snowGround", () => ({ map: rep(snowTex(), 10, 10) })));
    b.add(plane(-60, 60, -2.9, -2.4, 1, -0.03), lam("wetShingle", () => ({ color: "#8a8e90" })));
    b.add(plane(-120, 120, -80, -55, 1, 0.02), lam("farShore", () => ({ color: "#4e6a52" })));
    for (let k = -10; k <= 10; k++) prop(b, kit, "tree_cone", k * 6 + 2 * hh(k, 1), 0.02, -60 - 10 * hh(k, 2), 8 + 4 * hh(k, 3));
    backHills(b, 120, 12, 18, 11, lam("hillSnow", () => ({ color: "#7f95a3" })));
    for (let k = 0; k < 12; k++) { const x = (k % 2 ? 1 : -1) * (3.2 + 1.1 * k + hh(k, 1)), z = -1.0 - 3 * hh(k, 2); rock(b, x, 0, z, 0.35 + 0.4 * hh(k, 3), k, "#7a7e82"); }
    for (let k = 0; k < 5; k++) prop(b, kit, "tree_cone", -12 - 2.5 * k, 0, 2 - 3 * k, 5 + 2 * hh(k, 5));
    for (let k = 0; k < 5; k++) prop(b, kit, "tree_cone", 11 + 2.5 * k, 0, 1 - 3 * k, 5 + 2 * hh(k, 6));
    // landing craft beached bow-on, ramp down toward the camera
    const Hl = lam("lcHull", () => ({ color: "#6e7660" })), Hd = lam("lcDark", () => ({ color: "#4e5444" }));
    b.add(boxGeo(V(-1.8, -0.4, -6.6), V(-1.55, 0.85, -2.5)), Hl); b.add(boxGeo(V(1.55, -0.4, -6.6), V(1.8, 0.85, -2.5)), Hl);
    b.add(boxGeo(V(-1.8, -0.4, -6.9), V(1.8, 1.0, -6.6)), Hl);
    b.add(boxGeo(V(-1.55, -0.4, -6.6), V(1.55, 0.18, -2.5)), Hd);
    for (const sx of [-1, 1]) b.add(boxGeo(V(sx * 1.8 - 0.06, 0.8, -6.9), V(sx * 1.8 + 0.06, 0.92, -2.45)), Hd);
    const ramp = boxGeo(V(-1.5, -0.06, 0), V(1.5, 0.06, 1.6)); ramp.rotateX(0.12); ramp.translate(0, 0.08, -2.5);
    b.add(ramp, lam("lcRamp", () => ({ color: "#5e6650" })));
  },
  italy: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("itGround", () => ({ map: rep(dustTex(), 40, 40) })));
    b.add(plane(-30, 30, -7.5, -5.5, 1, 0.01), lam("itRoad", () => ({ color: "#d8c49a" })));
    backHills(b, 90, 12, 18, 13, lam("hillIt", () => ({ color: "#a8a668" })));
    block(b, -6.5, -12, 6, 4, 4.2, 0.1, "#e2cfa8");
    b.add(new THREE.ConeGeometry(4.6, 1.6, 4).rotateY(Math.PI / 4).scale(1, 1, 0.7).translate(-6.5, 5.0, -12), lam("terracotta", () => ({ color: "#b8603a" })));
    for (let k = 0; k < 9; k++) prop(b, kit, "tree_cone", -16 + 4 * k, 0, -16 - 2 * hh(k, 1), 7 + 2 * hh(k, 2));
    for (let k = 0; k < 6; k++) prop(b, kit, "tree_fat", 4 + 3.2 * k, 0, -10 - 3 * hh(k, 3), 2.6 + hh(k, 4));
    b.add(boxGeo(V(-12, 0, -8.6), V(-2, 0.7, -8.2)), lam("itWall", () => ({ color: "#cfc0a0" })));
    for (let k = 0; k < 10; k++) rock(b, -9 + 2 * k + hh(k, 1), 0, -4.6 - 1.5 * hh(k, 2), 0.2 + 0.25 * hh(k, 3), k + 20, "#b8ab94");
  },
  camp: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("campGround", () => ({ map: rep(campTex(), 40, 40) })));
    wire(b, -10, 10, -1.0, 2.4, 2.0, 5);
    for (let x = -10; x < 10; x += 2.0) b.add(beamBetween(V(x, 0.1, -1.0), V(x + 2.0, 2.3, -1.0), 0.013, 4), lam("wire", () => ({ color: "#3a3634" })));
    hut(b, -2.5, -8.5, 9, 3.6); hut(b, 8.0, -9.5, 8, 3.6); hut(b, -13, -9.5, 8, 3.6);
    tower(b, -6.2, -4.6, 4.6); tower(b, 7.6, -4.2, 4.6);
    for (let k = -8; k <= 8; k++) prop(b, kit, "tree_cone", k * 5 + 2 * hh(k, 1), 0, -24 - 5 * hh(k, 2), 8 + 3 * hh(k, 3));
    backHills(b, 90, 12, 14, 17, lam("hillCamp", () => ({ color: "#6e8a5a" })));
  },
  forest: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("forestGrass", () => ({ map: grassHD() })));
    b.add(plane(-30, 30, -3.2, -0.4, 1, 0.01), lam("forestPath", () => ({ map: rep(earthHD(), 4, 1) })));
    backHills(b, 90, 12, 22, 19, lam("hillAlp", () => ({ color: "#5f7f5a" })));
    for (let k = 0; k < 16; k++) prop(b, kit, "tree_cone", -16 + 2.1 * k + 0.8 * hh(k, 1), 0, -5.5 - 3 * hh(k, 2), 5.5 + 3 * hh(k, 3));
    for (let k = 0; k < 14; k++) prop(b, kit, "tree_cone", -20 + 3 * k, 0, -12 - 4 * hh(k, 4), 8 + 3 * hh(k, 5));
    for (const [x, z] of [[-4.4, 0.6], [4.6, 0.8], [-6.2, -1.4], [6.4, -1.2]]) prop(b, kit, "tree_cone", x, 0, z, 5 + hh(x, 1));
    for (let k = 0; k < 10; k++) scrub(b, -8 + 1.7 * k, -4.0 - 0.8 * hh(k, 6), 0.7 + 0.4 * hh(k, 7), k, "#4f7f3a");
    rock(b, -2.6, 0, -4.2, 0.4, 8, "#8a8a7a"); rock(b, 2.8, 0, -4.6, 0.35, 9, "#8a8a7a");
  },
  jungle: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("jungleFar", () => ({ map: rep(jungleFloor(), 40, 40) })));
    b.add(plane(-10, 10, -8, 5, 1, 0.01), lam("jungleNear", () => ({ map: rep(jungleFloor(), 2, 2) })));
    backHills(b, 80, 12, 16, 3, lam("hillJungle", () => ({ color: "#4f8a40" })));
    for (let k = 0; k < 14; k++) palm(b, -14 + 2.2 * k + 0.8 * hh(k, 1), -6.5 - 4 * hh(k, 2), 5.5 + 2.5 * hh(k, 3), k + 3);
    for (let k = 0; k < 8; k++) palm(b, -9 + 2.6 * k, -13 - 3 * hh(k, 4), 7 + 2 * hh(k, 5), k + 30);
    for (const [x, z, h] of [[-4.2, -3.2, 2.2], [3.9, -3.0, 2.4], [-2.6, -4.6, 2.0], [5.4, -4.4, 2.1], [1.6, -5.2, 2.3]]) banana(b, x, z, h, Math.round(x * 10), false);
    for (let k = -6; k <= 6; k++) prop(b, kit, "tree-high-round", k * 6 + 2, 0, -20 - 4 * hh(k, 3), 9 + 3 * hh(k, 4));
    for (let k = 0; k < 18; k++) fern(b, -8 + 0.95 * k, -2.6 - 2.6 * hh(k, 6), 0.9 + 0.6 * hh(k, 7), k);
    for (const [x, z] of [[-2.2, -0.6], [2.4, -0.4], [-3.6, 0.6], [3.6, 0.8]]) fern(b, x, z, 1.1, Math.round(x * 3 + 20));
    rock(b, -1.8, 0, -2.4, 0.35, 4, "#8a8a7a"); rock(b, 2.1, 0, -2.6, 0.3, 5, "#8a8a7a");
  },
};

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- tracked positions (shared with cams.ts) ----------------
/** shot 13: Jack strolls through the pines left -> right until he meets the patrol */
export const walk13X = (t: number) => Math.min(0.0, -3.0 + 1.0 * Math.max(0, t - C.he9b + 0.1));
/** shot 14: Jack marches into the Burma clearing */
export const march14X = (t: number) => Math.min(0.1, -2.8 + 1.15 * Math.max(0, t - C.l10 + 0.1));

// ---------------- staging per shot ----------------
type StageFn = (c: Ctx) => void;
const banner = (c: Ctx, at: number, txt: string, p: V3, w: number, col = "#c0353a", life = 1.6) => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at) * (u > life - 0.15 ? (life - u) / 0.15 : 1); card(c, `ban${txt}${col}`, 1000, 240, (pen) => fxBanner(pen, txt, col), p, w * k, 0.24 * w * k, { rot: 0.03 * Math.sin(at * 5) }); };
const cal = (c: Ctx, at: number, year: string, p: V3, s = 0.5, red = false, life = 99) => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at); card(c, `cal${year}${red}`, 300, 340, (pen) => fxCal(pen, year, red), p, s * k, 1.13 * s * k, { rot: 0.05 * Math.sin(at * 3) }); };
/** music notes drifting up from p */
const notes = (c: Ctx, at: number, p: V3, n = 4) => { if (!after(c.t, at)) return; for (let k = 0; k < n; k++) { const u = ((c.t - at) * 0.7 + k / n) % 1; card(c, `note${k % 2}`, 220, 240, (pen) => fxNote(pen, k % 2, "#2a2f44"), [p[0] - 0.3 + 0.25 * k + 0.12 * Math.sin(u * 6 + k), p[1] + 0.9 * u, p[2]], 0.16 * (1 - 0.4 * u), 0.18 * (1 - 0.4 * u), { rot: 0.3 * Math.sin(u * 5 + k) }); } };
/** a card flying from a to b between t0 and t1 */
const fly = (c: Ctx, key: string, draw: (p: Pen) => void, cw: number, ch: number, t0: number, t1: number, a: V3, b: V3, w: number, h: number, arc = 0) => {
  const u = (c.t - t0) / (t1 - t0); if (u < 0 || u > 1) return;
  card(c, key, cw, ch, draw, [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + arc * Math.sin(Math.PI * u), a[2] + (b[2] - a[2]) * u], w, h);
};
const tank = (c: Ctx, x: number, y: number, z: number, w: number) => card(c, `tank${q((c.t * 3) % 1, 6)}`, 760, 380, (p) => fxTank(p, (c.t * 3) % 1), [x, y, z], w, w * 0.5);
const muzzle = (c: Ctx, p: V3, s: number, i: number) => { if (Math.floor(c.t * 30 + i * 2) % 4 > 1) return; card(c, `muz${i % 2}`, 300, 200, (pen) => fxMuzzle(pen, c.t + i), p, s, s * 0.67, { glow: 2 }); };

export const STAGE: Record<number, StageFn> = {
  // 1 World War Two. Tanks.
  1: (c) => {
    const t = c.t;
    banner(c, C.world0 + 0.05, "WORLD WAR II", [0.0, 2.6, -2.2], 2.0, "#c0353a", 1.7);
    const tx = -1.2 + 2.0 * (t - C.tanks);
    tank(c, Math.min(tx, 7), 0.75, -4.2, 3.4);
    puff(c, C.tanks + 0.2, [Math.min(tx, 7) - 1.8, 0.4, -4.1], 0.8, 0.6); puff(c, C.tanks + 0.6, [Math.min(tx, 7) - 1.8, 0.4, -4.1], 0.8, 0.6);
    boom(c, 0.8, [-4.5, 1.6, -13], 3.5, 0.9);
  },
  // 2 Machine guns.
  2: (c) => {
    const t = c.t;
    pose(c, 1, TOMMY(0, { rifle: false }), "tommyDuck", 3.6, -4.6, { mode: "sit", expr: "nervous", look: -1 }, 1, -0.05);
    for (let k = 0; k < 4; k++) muzzle(c, [-0.5 + 1.6 * k, 0.9, -11.5], 1.3, k);
    for (let k = 0; k < 5; k++) puff(c, C.machine + 0.12 * k + 0.05, [0.4 + 1.3 * k, 0.25, -6 + 0.4 * k], 0.6, 0.4);
    word(c, C.machine + 0.1, "RAT-TAT!", [2.9, 2.0, -6.5], 1.4, 1.2);
    void t;
  },
  // 3 Bombers.
  3: (c) => {
    const t = c.t;
    for (let k = 0; k < 3; k++) { const px = -14 + 7.5 * (t - C.bombers + 0.5) + 4 * k; if (px < 20) card(c, `bomber${q((t * 8 + k * 0.3) % 1, 4)}`, 900, 360, (p) => fxBomber(p, (t * 8 + k * 0.3) % 1), [px, 7.5 + 1.2 * k, -10 - 2 * k], 7, 2.8); }
    boom(c, C.bombers + 0.35, [3.5, 1.8, -16], 4, 0.9); boom(c, C.bombers + 0.65, [-4.5, 1.6, -18], 4, 0.9);
  },
  // 4 And then there was Jack Churchill... who brought a bow and arrow.
  4: (c) => {
    const t = c.t, bw = after(t, C.bow1);
    pose(c, 1, JACK, "jack", 0.0, -1.7, { mode: "stand", expr: bw ? "smug" : after(t, C.jack1) ? "smile" : "neutral", look: 0, prop: bw ? "bow" : null, dy: hop(t, C.bow1, 0.05, 0.25) });
    for (let k = 0; k < 2; k++) pose(c, 2 + k, TOMMY(k + 1), `tommy${k + 1}`, k ? 1.15 : -1.15, -2.05, { mode: "stand", expr: bw ? "shock" : "stern", look: k ? -1 : 1, lean: jolt(t, C.bow1, 0.1) });
    if (after(t, C.jack1)) banner(c, C.jack1, "JACK CHURCHILL", [0.0, 2.45, -1.8], 1.5, "#2f5a7a", 2.4);
    if (bw) { bang(c, C.bow1 + 0.05, [-1.0, 2.1, -2.0], 0.11); bang(c, C.bow1 + 0.05, [1.3, 2.1, -2.0], 0.11); }
    if (after(t, C.arrow1)) spark(c, C.arrow1, [0.45, 1.3, -1.6], 0.6, 0.35, "#ffffff");
  },
  // 5 Seriously. In France, he shot a German soldier with a longbow.
  5: (c) => {
    const t = c.t, dr = after(t, C.he2), rel = after(t, C.with2), hit = after(t, C.longbow2);
    if (after(t, C.france - 0.1)) banner(c, C.france - 0.1, "FRANCE, 1940", [-0.9, 2.45, -1.8], 1.3, "#3a5aa0", 1.8);
    pose(c, 1, JACK, "jack", -1.0, -1.7, { mode: "stand", expr: hit ? "smug" : dr ? "stern" : "smug", look: 1, facing: dr ? 1 : 0, prop: dr && !rel ? "bowDraw" : "bow", lean: rel && !hit ? 0.03 : 0 });
    pose(c, 2, GER(0), "ger0", 4.2, -6.2, { mode: hit ? "fall" : "stand", expr: hit ? "dazed" : after(t, C.german2) ? "whistle" : "neutral", look: -1 }, 1, hit ? 0.0 : 0, !hit);
    fly(c, "arrow", fxArrow, 400, 80, C.with2, C.longbow2, [-0.2, 1.42, -1.75], [4.0, 1.3, -6.1], 0.42, 0.084, 0.25);
    if (hit) { card(c, "arrowIn", 400, 80, fxArrow, [3.85, 0.75, -6.0], 0.42, 0.084, { rot: 0.5 }); spark(c, C.longbow2, [4.1, 1.3, -6.1], 1.1, 0.35, "#fff3b0"); word(c, C.longbow2 + 0.05, "THWACK!", [3.6, 2.2, -6.0], 1.4, 0.9); }
  },
  // 6 It's the only known longbow kill of the entire war.
  6: (c) => {
    const t = c.t, st = ramp(t, C.only3, 0.22);
    card(c, `rec${q(st, 6)}`, 500, 360, (p) => fxDoc(p, "WW2 RECORDS", ["Longbow kills:", "Jack Churchill: 1", "Everyone else: 0"], "ONLY ONE", st, "#2f7a3a", 292), [6, 1.6, 0], 1.3, 0.94);
    pose(c, 1, JACK, "jack", 0.0, -1.7, { mode: "stand", expr: after(t, C.entire) ? "smug" : "smile", look: 0, prop: "bow", dy: hop(t, C.entire, 0.05, 0.25) });
    pose(c, 2, TOMMY(2), "tommy2", -1.15, -2.1, { mode: "stand", expr: "awe", look: 1 });
    pose(c, 3, TOMMY(3), "tommy3", 1.2, -2.15, { mode: "stand", expr: after(t, C.war3) ? "grin" : "awe", look: -1 });
  },
  // 7 In Norway, he jumped off the landing boat wearing a kilt... playing the bagpipes.
  7: (c) => {
    const t = c.t, ju = clamp01((t - C.jumped + LEAD) / 0.55), pl = after(t, C.playing);
    if (after(t, C.norway - 0.1)) banner(c, C.norway - 0.1, "NORWAY, 1941", [0.0, 2.9, -3.0], 1.6, "#3a5aa0", 1.8);
    const z = -3.4 + 1.8 * ju, y = 0.2 * (1 - ju) + 0.45 * Math.sin(Math.PI * ju);
    pose(c, 1, JACK_K, "jackK", 0.0, z, { mode: ju > 0 && ju < 1 ? "march" : "stand", phase: ju * 0.5, expr: pl ? "whistle" : ju >= 1 ? "smug" : "grin", look: 0, prop: pl ? "pipes" : null }, 1, y);
    for (let k = 0; k < 3; k++) pose(c, 2 + k, TOMMY(k, { rifle: true }), `tommyB${k}`, -0.9 + 0.9 * k, -4.6 - 0.4 * (k % 2), { mode: "stand", expr: pl ? "shock" : after(t, C.kilt) ? "awe" : "stern", look: k === 2 ? -1 : k === 0 ? 1 : 0 }, 1, 0.2, false);
    if (pl) notes(c, C.playing + 0.1, [0.3, 2.1, -1.5], 4);
    smoke(c, [-6, 1, -14], 1.4, 0.2); smoke(c, [5, 1, -16], 1.6, 0.6);
  },
  // 8 Then he went to fight.
  8: (c) => {
    const t = c.t, go = clamp01((t - C.went - 0.0) / 1.4);
    pose(c, 1, JACK_K, "jackK", 0.0 + 3.0 * go * go, -1.6, { mode: go > 0 ? "march" : "stand", phase: (t * 2.2) % 1, expr: "stern", look: 1, prop: "swordUp", tilt: go > 0 ? -5 : 0 });
    for (let k = 0; k < 2; k++) { const g2 = clamp01((t - C.went - 0.25 - 0.15 * k) / 1.4); pose(c, 2 + k, TOMMY(k + 1), `tommyR${k}`, -1.4 - 0.9 * k + 3.0 * g2 * g2, -2.4 - 0.3 * k, { mode: g2 > 0 ? "march" : "stand", phase: (t * 2.2 + 0.4 * k) % 1, expr: "stern", look: 1, tilt: g2 > 0 ? -5 : 0 }); }
    boom(c, C.l5 + 0.1, [5, 1.8, -12], 3.5, 0.9); boom(c, C.fight5, [-3, 1.6, -14], 3.5, 0.9);
    smoke(c, [-6, 1, -14], 1.4, 0.2);
  },
  // 9 His rule? "Any officer who goes into action without his sword is improperly dressed." And he meant it.
  9: (c) => {
    const t = c.t, rl = after(t, C.rule), wo = after(t, C.without), im = after(t, C.improperly), mt = after(t, C.meant);
    pose(c, 1, JACK, "jack", -0.55, -1.7, { mode: "stand", expr: mt ? "smug" : rl ? "stern" : "neutral", look: im ? 1 : 0, prop: rl ? "swordUp" : null, dy: hop(t, C.rule, 0.05, 0.25) });
    pose(c, 2, OFFICER_NS, "offNS", 0.75, -1.95, { mode: "stand", expr: im ? "shock" : wo ? "nervous" : "smile", look: wo ? -1 : 0, headTilt: wo && !im ? 10 : 0, lean: jolt(t, C.improperly, 0.12) });
    if (rl && !wo) spark(c, C.rule + 0.05, [-0.1, 2.75, -1.6], 0.7, 0.35, "#ffffff");
    if (im) { banner(c, C.improperly, "NO SWORD?!", [0.7, 2.3, -1.9], 1.1, "#c0353a", 1.6); sweat(c, [1.1, 2.05, -1.9]); }
    if (mt) spark(c, C.meant, [-0.1, 2.75, -1.6], 0.8, 0.35, "#ffffff");
  },
  // 10 In Italy, armed with his sword and helped by one corporal, he captured forty-two German soldiers.
  10: (c) => {
    const t = c.t, cp = after(t, C.corporal), ca = after(t, C.captured), ft = after(t, C.fortytwo);
    banner(c, C.in7, "ITALY, 1943", [-1.0, 2.45, -1.8], 1.3, "#2f7a3a", 1.6);
    pose(c, 1, JACK, "jack", -1.15, -1.7, { mode: "stand", expr: ca ? "smug" : "stern", look: 1, prop: "swordUp" });
    pose(c, 2, TOMMY(1), "corporal", -0.35, -2.1, { mode: "stand", expr: cp ? "grin" : "stern", look: 1, dy: hop(t, C.corporal, 0.06, 0.25) }, 0.95);
    if (after(t, C.sword7)) spark(c, C.sword7, [-0.5, 2.7, -1.6], 0.7, 0.35, "#ffffff");
    if (cp) banner(c, C.corporal, "+1 CORPORAL", [-0.35, 2.55, -2.2], 1.1, "#c0353a", 1.2);
    if (ca) for (let k = 0; k < 14; k++) {
      const row = Math.floor(k / 5), col = k % 5, up = ramp(t, C.captured + 0.06 * k, 0.25);
      pose(c, 10 + k, GER(k, { rifle: false }), `gerU${k % 4}`, 0.8 + 0.9 * col + 0.45 * row, -2.0 - 1.3 * row, { mode: "stand", expr: ["shock", "nervous", "dazed", "nervous"][k % 4] as Expr, look: -1, prop: "handsUp" }, 1, -1.8 * (1 - up), up > 0.95);
    }
    if (ft) { const k = pop(t, C.fortytwo); card(c, "score42", 400, 220, (p) => fxScore(p, "42"), [1.9, 2.7, -2.4], 1.3 * k, 0.72 * k, { rot: -0.06 }); }
  },
  // 11 The Germans eventually caught him and put him in a prison camp.
  11: (c) => {
    const t = c.t, pc = after(t, C.put);
    card(c, "campSign", 600, 220, (p) => fxCampSign(p, "PRISON CAMP"), [-0.9, 2.45, -1.05], 1.0, 0.37);
    if (!pc) {
      const x = -2.2 + 0.9 * (t - C.l8 + 0.2);
      pose(c, 1, JACK, "jackP", x, 0.0, { mode: "march", phase: (t * 1.6) % 1, expr: "stern", look: 1, prop: "handsUp" });
      pose(c, 2, GER(1), "ger1", x - 0.9, 0.2, { mode: "march", phase: (t * 1.6 + 0.5) % 1, expr: "stern", look: 1 });
      pose(c, 3, GER(2), "ger2", x + 0.9, 0.15, { mode: "march", phase: (t * 1.6 + 0.25) % 1, expr: "stern", look: -1 });
    } else {
      pose(c, 1, { ...JACK, sword: false }, "jackC", -1.0, -2.2, { mode: "stand", expr: "stern", look: 1, prop: "cross" });
      pose(c, 2, GER(1), "ger1", 1.7, -0.2, { mode: "stand", expr: "smug", look: -1 });
    }
  },
  // 12 He tunneled out. They caught him again.
  12: (c) => {
    const t = c.t, up = ramp(t, C.tunneled + 0.1, 0.45), cg = after(t, C.caught9);
    card(c, "hole", 400, 160, fxHole, [-0.6, 0.06, 0.5], 1.1, 0.44);
    const hx = cg ? -0.6 : -0.6;
    pose(c, 1, { ...JACK, sword: false }, "jackC", hx, 0.45, { mode: "stand", expr: cg ? "sad" : after(t, C.out9) ? "grin" : "stern", look: 1, prop: cg ? "handsUp" : null }, 1, -1.9 * (1 - up), false);
    if (up > 0.05 && up < 1) card(c, `scr${q(up, 8)}`, 400, 400, (p) => fxScraps(p, up), [-0.6, 0.4, 0.55], 0.9, 0.9);
    const gi = clamp01((t - C.they9 + 0.1) / 0.6);
    pose(c, 2, GER(1), "ger1", 2.6 - 1.3 * gi, 0.2, { mode: gi > 0 && gi < 1 ? "march" : "stand", phase: (t * 2.4) % 1, expr: cg ? "smug" : gi > 0 ? "shock" : "neutral", look: -1 });
    pose(c, 3, GER(3), "ger3", -2.9 + 1.2 * gi, 0.1, { mode: gi > 0 && gi < 1 ? "march" : "stand", phase: (t * 2.4 + 0.5) % 1, expr: cg ? "smug" : "shock", look: 1 });
    if (after(t, C.they9)) { bang(c, C.they9, [1.6, 2.1, 0.2], 0.12); }
  },
  // 13 He escaped again, and walked into an American patrol.
  13: (c) => {
    const t = c.t, x = walk13X(t), am = after(t, C.american);
    pose(c, 1, { ...JACK, sword: false }, "jackF", x, -1.8, { mode: x < 0 ? "stroll" : "stand", phase: (t * 1.1) % 1, expr: am ? (after(t, C.patrol) ? "relief" : "shock") : "whistle", look: 1, lean: jolt(t, C.walked + 0.4, 0.12) });
    const yi = ramp(t, C.walked + 0.1, 0.5);
    for (let k = 0; k < 3; k++) pose(c, 2 + k, YANK(k), `yank${k}`, 1.0 + 0.85 * k + 2.5 * (1 - yi), -1.95 - 0.35 * (k % 2), { mode: yi < 1 ? "march" : "stand", phase: (t * 2 + 0.3 * k) % 1, expr: am ? (after(t, C.patrol) ? "grin" : "shock") : "neutral", look: -1 });
    if (am) { bang(c, C.american, [x + 0.1, 2.15, -1.8], 0.12); banner(c, C.american + 0.05, "U.S. ARMY", [1.9, 2.55, -2.1], 1.2, "#2f5a7a", 1.6); }
  },
  // 14 Free at last, he was sent to fight in Burma. But the war ended before he got there.
  14: (c) => {
    const t = c.t, x = march14X(t), en = after(t, C.ended10);
    if (after(t, C.burma - 0.1)) banner(c, C.burma - 0.1, "BURMA", [0.4, 2.45, -2.0], 1.1, "#2f7a3a", 1.4);
    cal(c, C.l10 + 0.1, "1945", [-1.1, 2.0, -1.6], 0.42);
    pose(c, 1, JACK, "jack", x, -1.7, { mode: x < 0.1 && !en ? "march" : "stand", phase: (t * 2) % 1, expr: en ? (after(t, C.there10) ? "sad" : "shock") : "grin", look: en ? 0 : 1, prop: "swordUp", lean: jolt(t, C.ended10, 0.12) });
    if (en) { banner(c, C.ended10, "WAR IS OVER!", [0.2, 11.5, -12], 6.5, "#3a7ac0", 3.5); confetti(c, C.ended10, [0, 11, -12], 12); spark(c, C.ended10 + 0.1, [-3.5, 13, -14], 3, 0.5, "#ffd24a"); spark(c, C.ended10 + 0.4, [3.5, 12.5, -14], 3, 0.5, "#ff7a6a"); }
  },
  // 15 His reaction? "If it hadn't been for those damned Yanks, we could have kept the war going for another ten years."
  15: (c) => {
    const t = c.t, yk = after(t, C.yanks), kp = after(t, C.kept);
    pose(c, 1, JACK, "jack", -0.55, -1.7, { mode: "stand", expr: kp ? "smug" : "stern", look: 1, prop: yk && !kp ? "point" : "cross", lean: jolt(t, C.yanks, 0.08) });
    pose(c, 2, YANK(0, { rifle: false }), "yankP", 1.25, -2.6, { mode: "stand", expr: "laugh", look: -1, wave: q(Math.sin(t * 7), 10), dy: bounce(t, 2, 0.06) }, 0.95);
    confetti(c, C.l11, [1.2, 2.6, -2.8], 3);
    if (kp) { const y = 1945 + Math.floor(10 * clamp01((t - C.going + LEAD) / Math.max(0.3, C.years - C.going))); cal(c, C.going, String(y), [-1.35, 2.2, -1.5], 0.5, y === 1955); }
  },
};
