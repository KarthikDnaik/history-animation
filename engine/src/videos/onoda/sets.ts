// Places and cast of "Wojtek the Soldier Bear". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, MAT, M4, plane, earthHD, crate, scrub, palm, beamBetween } from "./props3d";
import { prop, Kit } from "./build";
import { grassHD, rep, planksHD, water, rng } from "./paint";
import { Pen, SKINS, fxBurst, fxPuff, fxConfetti, fxBang, fxBoom, Outfit, FrontOpts, Expr, fxWord, fxBanner, fxSmoke, fxFlameAt, cowSide, CowOpts, fxLeaflet, fxLetter, fxPlane, fxList, fxThink, fxDoc, fxMap, fxCal, fxShopSign, fxScore } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, light2D } from "./cast";
import { C } from "./cues";
import { V3, smooth, clamp01, LEAD, SetId } from "./story";

// ---------------- cast ----------------
const IJA = "#8a7d4e", IJA_P = "#7a6e44";
/** Imperial Japanese Army private: khaki tunic, field cap with neck flaps, puttees */
const JP = (v: number, extra: Partial<Outfit> = {}): Outfit => ({ jacket: IJA, pants: IJA_P, boots: "#4a3a2a", hat: "jcap", hatCol: "#857848", buttons: "#c9b36a", belt: "#6a4a2a", skin: SKINS[[1, 2, 1, 3][v % 4]], moustache: v % 4 === 2 ? "#2a2020" : undefined, ...extra });
/** Onoda: young (1944, clean) / jungle (patched, faded) */
const ONODA_Y: Outfit = JP(0, { rifle: true });
const ONODA: Outfit = JP(0, { jacket: "#837a54", pants: "#746a48", patches: true, rifle: true });
const MEN = [JP(1, { patches: true }), JP(2, { patches: true }), JP(3, { patches: true })];
/** Major Taniguchi: 1944 officer / 1974 bookseller (same moustache, now grey) */
const TANI_Y: Outfit = { jacket: "#7d7046", pants: "#6e6440", boots: "#2a1a10", hat: "peaked", hatCol: "#7d7046", buttons: "#e8c45a", belt: "#5a3a22", moustache: "#2a2020", skin: SKINS[1], build: "stout", sword: true };
const TANI: Outfit = { jacket: "#5d5f6a", pants: "#4a4c56", boots: "#1e1a16", hat: "fedora", hatCol: "#4a4a52", buttons: "#2a2a30", moustache: "#a8a8ac", skin: SKINS[1], build: "stout" };
/** Norio Suzuki: 1974 backpacker */
const SUZUKI: Outfit = { jacket: "#d8743a", pants: "#3b5b9a", boots: "#6a4a2a", hat: "hair", hair: "#1e1a1c", skin: SKINS[1], buttons: "#f1e0c0", pack: "#4a7a5a" };
const FRIENDS: Outfit[] = [
  { jacket: "#e6c84a", pants: "#4a4a6a", boots: "#3a2a1e", hat: "hair", hair: "#2a2226", skin: SKINS[2], buttons: "#8a6a2a" },
  { jacket: "#6a9ac8", pants: "#7a5a3a", boots: "#3a2a1e", hat: "hair", hair: "#1e1a1c", skin: SKINS[1], buttons: "#2a3a5a", moustache: "#1e1a1c" },
];
const FARMER = (v: number): Outfit => ({ jacket: v % 2 ? "#ece2c8" : "#d8c8a8", pants: v % 2 ? "#3a3a44" : "#5a4a3a", boots: "#5a3b2a", hat: "nonla", hatCol: "#e2c98a", skin: SKINS[3], buttons: "#c8b898" });
const RANCHER: Outfit = { jacket: "#a8423a", pants: "#3b5b9a", boots: "#5a3b2a", hat: "slouch", hatCol: "#9a7650", trim: "#4a3220", skin: SKINS[1], buttons: "#e8dcc0" };

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
/** bahay kubo: hut on stilts, bamboo walls, steep thatched roof */
const hut = (b: Batch, x: number, z: number, s = 1, ry = 0) => {
  const m = M4(x, 0, z, ry, s), Bm = lam("bamboo", () => ({ color: "#d4b46a" })), Dk = lam("hutDark", () => ({ color: "#6a4a2c" })), Th = lam("thatch", () => ({ color: "#b8944e" }));
  for (const [dx, dz] of [[-1.3, -1.0], [1.3, -1.0], [-1.3, 1.0], [1.3, 1.0]]) b.add(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 8).translate(dx, 0.4, dz), Dk, m);
  b.add(boxGeo(V(-1.5, 0.8, -1.2), V(1.5, 0.92, 1.2)), Dk, m);
  b.add(boxGeo(V(-1.4, 0.92, -1.1), V(1.4, 2.3, 1.1)), Bm, m);
  b.add(boxGeo(V(-0.35, 0.95, 1.1), V(0.35, 2.0, 1.13)), Dk, m);
  b.add(boxGeo(V(0.7, 1.45, 1.1), V(1.15, 1.9, 1.13)), Dk, m);
  b.add(new THREE.ConeGeometry(2.4, 1.9, 4).rotateY(Math.PI / 4).scale(1.1, 1, 0.9).translate(0, 3.2, 0), Th, m);
  b.add(beamBetween(V(-0.35, 0, 1.9), V(-0.35, 0.85, 1.15), 0.05).applyMatrix4(m), Dk);
  b.add(beamBetween(V(0.35, 0, 1.9), V(0.35, 0.85, 1.15), 0.05).applyMatrix4(m), Dk);
};
const winTex = (key: string, wall: string, win: string) => ctex("win" + key, 256, 256, (g) => {
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = "#2a2a34"; g.fillRect(28 + 128 * i, 30 + 128 * j, 72, 70); g.fillStyle = win; g.fillRect(32 + 128 * i, 34 + 128 * j, 64, 62); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(32 + 128 * i, 34 + 128 * j, 64, 14); }
});
/** a city block with windows on its front (+z) face */
const bldg = (b: Batch, x: number, z: number, w: number, d: number, h: number, wall: string, win = "#9cc0d8") => {
  b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, h, z + d / 2)), lam("bw" + wall, () => ({ color: wall })));
  b.add(quad(V(x - w / 2, 1.2, z + d / 2 + 0.02), V(x + w / 2, 1.2, z + d / 2 + 0.02), V(x + w / 2, h - 0.3, z + d / 2 + 0.02), V(x - w / 2, h - 0.3, z + d / 2 + 0.02), w / 2.4, (h - 1.5) / 2.4), lam("bwin" + wall, () => ({ map: rep(winTex(wall, wall, win), 1, 1) })));
  b.add(boxGeo(V(x - w / 2 - 0.08, h, z - d / 2 - 0.08), V(x + w / 2 + 0.08, h + 0.25, z + d / 2 + 0.08)), lam("bcap", () => ({ color: "#d8d2c4" })));
};
/** small shop: front window, door, striped awning */
const shop = (b: Batch, x: number, z: number, w: number, h: number, wall: string, awning: string) => {
  b.add(boxGeo(V(x - w / 2, 0, z - 3), V(x + w / 2, h, z)), lam("shopW" + wall, () => ({ color: wall })));
  b.add(boxGeo(V(x - w / 2 + 0.3, 0.5, z), V(x + 0.2, 2.2, z + 0.03)), lam("shopGlass", () => ({ color: "#5a6a7a" })));
  b.add(boxGeo(V(x + 0.6, 0, z), V(x + 1.5, 2.3, z + 0.03)), MAT.darkWood());
  const aw = ctex("awn" + awning, 128, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? awning : "#f4efe2"; g.fillRect(i * 16, 0, 16, 64); } });
  b.add(quad(V(x - w / 2, 2.55, z), V(x + w / 2, 2.55, z), V(x + w / 2, 2.25, z + 1.0), V(x - w / 2, 2.25, z + 1.0), 1, 1).applyMatrix4(new THREE.Matrix4()), lam("awnM" + awning, () => ({ map: aw, side: THREE.DoubleSide })));
  // book stacks in the window
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(x - w / 2 + 0.45 + 0.4 * k, 0.5, z + 0.05), V(x - w / 2 + 0.75 + 0.4 * k, 0.6 + 0.25 * hh(k, 3), z + 0.25)), lam("bk" + (k % 4), () => ({ color: ["#c0353a", "#3f6a9a", "#e8c45a", "#4a8a5a"][k % 4] })));
};
const pole = (b: Batch, x: number, z: number, h = 7) => {
  b.add(new THREE.CylinderGeometry(0.1, 0.12, h, 8).translate(0, h / 2, 0), lam("telPole", () => ({ color: "#7a5a3e" })), M4(x, 0, z));
  b.add(boxGeo(V(x - 0.8, h - 0.5, z - 0.05), V(x + 0.8, h - 0.4, z + 0.05)), lam("telPole", () => ({ color: "#7a5a3e" })));
};
const railFence = (b: Batch, x0: number, x1: number, z: number) => {
  const Wd = lam("fenceWood", () => ({ color: "#9a7650" }));
  for (let x = x0; x <= x1; x += 2.0) b.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 1.25, z + 0.07)), Wd);
  for (const y of [0.55, 1.05]) b.add(boxGeo(V(x0, y, z - 0.04), V(x1, y + 0.12, z + 0.04)), Wd);
};
const barn = (b: Batch, x: number, z: number) => {
  b.add(boxGeo(V(x - 3, 0, z - 2.5), V(x + 3, 3.4, z + 2.5)), lam("barnRed", () => ({ color: "#b04a3a" })));
  b.add(new THREE.CylinderGeometry(3.4, 3.4, 5.2, 4, 1, false, Math.PI / 4).rotateX(Math.PI / 2).scale(0.9, 0.55, 1).translate(x, 3.4, z), lam("barnRoof", () => ({ color: "#5a4a44" })));
  b.add(boxGeo(V(x - 1, 0, z + 2.5), V(x + 1, 2.4, z + 2.53)), lam("barnDoor", () => ({ color: "#f1e8d6" })));
};
const jungleFloor = () => earthHD("jungleHD", ["#6f8a3e", "#5e7c36", "#7a9446", "#8a7a4a"], "#3f6a2e");
const sandTex = () => earthHD("beachHD", ["#ecdcae", "#e4d2a2", "#f2e4bc", "#dcc898"], "#c8b888");
export const BUILD: Record<SetId, (s: SetBuild) => void> = {
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
  beach: (s) => {
    const { b } = s;
    b.add(plane(-200, 200, -200, 60, 40, -0.06), lam("sea2", () => ({ map: rep(water(), 40, 40), color: "#7ac8e0" })));
    b.add(plane(-60, 60, -5.5, 60, 1, 0.0), lam("beachSand", () => ({ map: rep(sandTex(), 12, 12) })));
    b.add(plane(-60, 60, -7.0, -5.5, 1, -0.03), lam("wetSand", () => ({ color: "#cdbb8a" })));
    for (let k = 0; k < 6; k++) { palm(b, -9 + 1.4 * k + hh(k, 1), 1 - 2.4 * k * 0.3, 5 + 2 * hh(k, 2), k + 50); palm(b, 8.5 + 1.3 * k, 1.5 - 0.9 * k, 5 + 2 * hh(k, 3), k + 60); }
    // landing boat pulled up on the shore
    const Hl = lam("boatHull", () => ({ color: "#6e7660" }));
    b.add(boxGeo(V(-6.5, -0.2, -6.2), V(-2.5, 0.9, -4.6)), Hl);
    b.add(boxGeo(V(-6.6, 0.8, -6.3), V(-2.4, 0.95, -4.5)), lam("boatRim", () => ({ color: "#4e5444" })));
    for (let k = 0; k < 3; k++) crate(b, 2.6 + 0.8 * k, 0, -3.2 - 0.3 * k, 0.7, 0.2 * k);
    // islands on the horizon
    for (let k = 0; k < 4; k++) b.add(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(18 + 10 * hh(k, 1), 5 + 3 * hh(k, 2), 10), lam("isle", () => ({ color: "#5f9a50" })), M4(-60 + 45 * k, -0.5, -150 - 30 * hh(k, 3)));
  },
  farm: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("farmGrass", () => ({ map: grassHD() })));
    b.add(plane(-12, 12, -8, 4, 1, 0.01), lam("farmDirt", () => ({ map: rep(earthHD(), 2, 2) })));
    b.add(plane(-30, 30, -30, -9, 1, 0.02), lam("paddy", () => ({ color: "#86b8a4" })));
    for (let i = 0; i < 26; i++) for (let j = 0; j < 9; j++) b.add(new THREE.ConeGeometry(0.12, 0.45, 5).translate(0, 0.22, 0), lam("rice", () => ({ color: "#7ab84a" })), M4(-26 + 2 * i + 0.5 * (j % 2), 0.02, -10 - 2.2 * j));
    hut(b, -4.2, -5.2, 1, 0.3);
    for (const [x, z, h] of [[2.2, -3.4, 2.4], [3.6, -4.6, 2.6], [5.1, -3.6, 2.3], [4.4, -6.0, 2.5], [-1.4, -6.6, 2.3], [6.5, -5.4, 2.4]]) banana(b, x, z, h, Math.round(x * 10 + z));
    for (let k = 0; k < 10; k++) palm(b, -18 + 4 * k, -36 - 6 * hh(k, 2), 7 + 2 * hh(k, 3), k + 70);
    backHills(b, 90, 12, 18, 9, lam("hillFarm", () => ({ color: "#5f9a4a" })));
    for (let k = -6; k <= 6; k++) prop(b, kit, "tree_fat", k * 9 + 3, 0, -28 - 5 * hh(k, 3), 7 + 2 * hh(k, 4));
    b.add(boxGeo(V(-2.6, 0, -3.2), V(-1.9, 0.5, -2.7)), lam("sack", () => ({ color: "#e2d3a8" })));
  },
  city: (s) => {
    const { b } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("asphalt", () => ({ color: "#6a6c72" })));
    b.add(plane(-30, 30, -4.5, -1.2, 1, 0.08), lam("sidewalk", () => ({ color: "#bdb6aa" })));
    b.add(boxGeo(V(-30, 0, -1.25), V(30, 0.08, -1.15)), lam("curb", () => ({ color: "#d8d2c4" })));
    for (let x = -28; x < 28; x += 4) b.add(boxGeo(V(x, 0.005, 1.4), V(x + 2, 0.015, 1.55)), lam("laneLine", () => ({ color: "#f1e8d6" })));
    const cols = ["#d8c4a4", "#c4b49a", "#e2d6c0", "#b8c0c8", "#d0b8a8", "#c8ccb8"];
    let x = -24;
    for (let k = 0; k < 14; k++) { const w = 3.6 + 2 * hh(k, 1), h = 6 + 8 * hh(k, 2); if (x + w > -2.6 && x < 3.4) { x = 3.4; continue; } bldg(b, x + w / 2, -7.5, w, 6, h, cols[k % cols.length]); x += w + 0.3; }
    shop(b, 0.4, -4.6, 6.0, 4.2, "#e6dcc4", "#2f7a5a");
    bldg(b, 0.4, -9.2, 6.0, 3.2, 9.5, "#cfc4b0");
    for (const px of [-7, 9, 15]) pole(b, px, -1.6, 7.5);
    for (let k = 0; k < 30; k++) bldg(b, -60 + 4.2 * k, -30 - 6 * hh(k, 5), 4, 4, 10 + 14 * hh(k, 6), cols[k % cols.length], "#a8c4d8");
  },
  ranch: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("ranchGrass", () => ({ map: grassHD() })));
    railFence(b, -14, 14, -4.6);
    barn(b, -7.5, -10);
    backHills(b, 70, 12, 14, 12, lam("hillRanch", () => ({ color: "#8ab05a" })));
    for (let k = -6; k <= 6; k++) prop(b, kit, "tree_fat", k * 8 + 3, 0, -22 - 6 * hh(k, 3), 6 + 2 * hh(k, 4));
    for (let k = 0; k < 6; k++) palm(b, 8 + 3 * k, -12 - 4 * hh(k, 1), 6 + 2 * hh(k, 2), k + 90);
  },
};

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- tracked positions (shared with cams.ts) ----------------
/** shot 6: Onoda tiptoes left -> right past the banana plants */
export const sneak6X = (t: number) => Math.min(1.6, -2.6 + 0.62 * Math.max(0, t - C.l5 + 0.2));
/** shot 9: Suzuki strolls in from screen left */
export const walk9X = (t: number) => Math.min(0.0, -3.4 + 1.1 * Math.max(0, t - C.l7 + 0.1));
/** shot 11: Suzuki pushes into the clearing */
export const walk11X = (t: number) => Math.min(-0.6, -2.6 + 1.0 * Math.max(0, t - C.l9 + 0.1));

// ---------------- staging per shot ----------------
type StageFn = (c: Ctx) => void;
const banner = (c: Ctx, at: number, txt: string, p: V3, w: number, col = "#c0353a", life = 1.6) => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at) * (u > life - 0.15 ? (life - u) / 0.15 : 1); card(c, `ban${txt}${col}`, 1000, 240, (pen) => fxBanner(pen, txt, col), p, w * k, 0.24 * w * k, { rot: 0.03 * Math.sin(at * 5) }); };
const cal = (c: Ctx, at: number, year: string, p: V3, s = 0.5, red = false, life = 99) => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at); card(c, `cal${year}${red}`, 300, 340, (pen) => fxCal(pen, year, red), p, s * k, 1.13 * s * k, { rot: 0.05 * Math.sin(at * 3) }); };
const think = (c: Ctx, at: number, kind: number, p: V3, s = 0.7, until = 99) => { if (!after(c.t, at) || c.t > until) return; const k = pop(c.t, at); card(c, `think${kind}`, 400, 420, (pen) => fxThink(pen, kind), p, s * k, 1.05 * s * k); };
/** a paper card falling from y0 with a leaf-like flutter; lands at y1 */
const flutter = (c: Ctx, key: string, draw: (p: Pen) => void, cw: number, ch: number, at: number, x: number, z: number, y0: number, y1: number, w: number, h: number, speed = 1.1, seed = 0) => {
  const u = c.t - at; if (u < 0) return;
  const y = Math.max(y1, y0 - speed * u), lan = y <= y1;
  card(c, key, cw, ch, draw, [x + (lan ? 0.25 * Math.sin(seed * 3) : 0.25 * Math.sin(u * 2.2 + seed * 3)), y, z], w, h, { rot: lan ? 0.3 * Math.sin(seed * 5) : 0.45 * Math.sin(u * 2.6 + seed) });
};
const candle = (c: Ctx, x: number, z: number, i: number) => {
  card(c, `cdl`, 80, 200, (p) => { p.poly([[20, 60], [60, 60], [60, 195], [20, 195]], "#f4ead2", 6); }, [x, 0.1, z], 0.06, 0.15);
  const k = q((c.t * 3 + i * 0.37) % 1, 8);
  card(c, `flm${k}`, 120, 160, (p) => fxFlameAt(p, 60, 100, 30, k), [x, 0.22, z], 0.07, 0.09, { glow: 2.2 });
};
export const STAGE: Record<number, StageFn> = {
  // 1 This man kept fighting World War Two... for twenty-nine years after it ended.
  1: (c) => {
    const t = c.t, tw = after(t, C.twentynine);
    pose(c, 1, ONODA, "onoda", 0.15, -1.7, { mode: "stand", expr: tw ? "stern" : "neutral", look: -1, lean: jolt(t, C.fighting0, 0.05) });
    if (tw) { const y = Math.min(1974, 1945 + Math.floor(29 * clamp01((t - C.twentynine + LEAD) / Math.max(0.3, C.ended0 - C.twentynine)))); cal(c, C.twentynine, String(y), [-0.75, 1.55, -1.2], 0.55, y === 1974); }
  },
  // 2 In 1944, Japan sent Lieutenant Hiroo Onoda to a tiny Philippine island called Lubang, with one order: never surrender.
  2: (c) => {
    const t = c.t, wo = after(t, C.with1), nv = after(t, C.never1);
    cal(c, C.l1 + 0.1, "1944", [-0.95, 2.3, -1.9], 0.5, false, C.sent - C.l1);
    pose(c, 1, ONODA_Y, "onodaY", 0.55, -1.7, { mode: "stand", expr: nv ? "stern" : "neutral", look: -1, prop: nv ? "salute" : null, dy: hop(t, C.onoda1, 0.06, 0.25) });
    pose(c, 2, TANI_Y, "taniY", -0.6, -1.9, { mode: "stand", expr: wo ? "stern" : "neutral", look: 1, prop: wo && !nv ? "point" : null, lean: jolt(t, C.never1, 0.08) });
    const r = ramp(t, C.island, 0.3);
    card(c, `map${q(r, 8)}`, 600, 760, (p) => fxMap(p, r), [6, 1.6, 0], 1.12, 1.42);
    if (nv) banner(c, C.never1, "NEVER SURRENDER", [-0.05, 2.5, -1.6], 1.9, "#c0353a", 2.2);
  },
  // 3 A year later, the war ended. Nobody told Onoda properly.
  3: (c) => {
    const t = c.t, en = after(t, C.ended2), nb = after(t, C.nobody);
    cal(c, C.l2, "1945", [-1.6, 1.75, -1.6], 0.45);
    for (let k = 0; k < 3; k++) pose(c, 2 + k, MEN[k], `man${k}`, -0.95 + 0.85 * k + (k === 2 ? 0.55 : 0), -2.1 - 0.15 * (k % 2), { mode: "sit", expr: nb ? cyc(t, ["whistle", "smile"] as Expr[], 1.2, k) : "neutral", look: k === 2 ? -1 : 1 });
    pose(c, 1, ONODA, "onoda", 0.4, -1.7, { mode: "sit", expr: nb ? "whistle" : "neutral", look: -1 });
    smoke(c, [-0.2, 0.3, -1.95], 0.4, 0); smoke(c, [-0.15, 0.3, -1.95], 0.4, 0.5);
    card(c, "fire", 200, 220, (p) => fxFlameAt(p, 100, 140, 52, q(t * 2 % 1, 8)), [-0.2, 0.18, -1.95], 0.3, 0.33, { glow: 1.6 });
    if (en) { banner(c, C.ended2, "WAR IS OVER!", [0.2, 11.5, -12], 6.5, "#3a7ac0", 3.5); confetti(c, C.ended2, [0, 11, -12], 12); spark(c, C.ended2 + 0.1, [-3.5, 13, -14], 3, 0.5, "#ffd24a"); spark(c, C.ended2 + 0.4, [3.5, 12.5, -14], 3, 0.5, "#ff7a6a"); }
  },
  // 4 Leaflets fell from the sky saying "the war is over." Onoda said: nice try, enemy propaganda.
  4: (c) => {
    const t = c.t, hold = after(t, C.saying) && !after(t, C.nice), sm = after(t, C.onoda3);
    const px = -14 + 9 * (t - C.l3 + 0.4);
    if (px < 16) card(c, `plane${q((t * 6) % 1, 4)}`, 600, 240, (p) => fxPlane(p, (t * 6) % 1), [px, 9, -10], 4, 1.6);
    for (let k = 0; k < 9; k++) flutter(c, "leaf", fxLeaflet, 300, 400, C.l3 - 0.3 + 0.25 * k, -2.6 + 0.65 * k, -2.4 - 0.6 * (k % 3), 4.5 + 0.7 * (k % 3), 0.02, 0.28, 0.37, 1.3, k);
    pose(c, 1, ONODA, "onoda", 0.1, -1.6, { mode: "stand", expr: !after(t, C.over3) ? "neutral" : sm ? "smug" : "awe", look: hold ? 0 : -1, prop: hold ? "leaflet" : null, headTilt: hold ? 4 : 0 });
    pose(c, 2, MEN[0], "man0", -1.0, -2.2, { mode: "stand", expr: sm ? "smug" : "awe", look: 1 });
    pose(c, 3, MEN[1], "man1", 1.15, -2.3, { mode: "stand", expr: after(t, C.propaganda) ? "smug" : "nervous", look: -1 });
    // the read leaflet gets flicked away over his shoulder
    const u = (t - C.nice + LEAD) / 0.7;
    if (u >= 0 && u < 1) card(c, "leafT", 300, 400, fxLeaflet, [0.35 + 1.6 * u, 1.2 + 1.2 * Math.sin(Math.PI * u), -1.5 - 0.5 * u], 0.24, 0.32, { rot: 7 * u });
  },
  // 5 Then they dropped letters and photos from his own family. Onoda said: wow, very clever fakes.
  5: (c) => {
    const t = c.t, ph = after(t, C.photos), wow = after(t, C.wow), fk = after(t, C.clever);
    flutter(c, "letter", fxLetter, 400, 360, C.dropped - 0.6, 0.9, -1.4, 3.6, 0.02, 0.36, 0.32, 1.4, 2);
    card(c, "letterBig", 400, 360, fxLetter, [6, 1.6, 0], 1.3, 1.17);
    pose(c, 1, ONODA, "onoda", 0.0, -1.6, { mode: "stand", expr: fk ? "smug" : wow ? "shock" : ph ? "awe" : "neutral", look: 0, prop: ph ? "photo" : null, lean: jolt(t, C.wow, 0.1), headTilt: fk ? 6 * Math.sin((t - C.clever) * 7) * Math.exp(-(t - C.clever)) : 0 });
    for (let k = 0; k < 2; k++) pose(c, 2 + k, MEN[k], `man${k}`, k ? 1.05 : -1.05, -2.15, { mode: "stand", expr: fk ? "smug" : wow ? "awe" : "neutral", look: k ? -1 : 1 });
  },
  // 6 So he stayed in the jungle, stealing rice and bananas from farmers, and fighting anyone he thought was the enemy.
  6: (c) => {
    const t = c.t, x = sneak6X(t), fa = after(t, C.farmers), fi = after(t, C.fighting5);
    if (!fi) {
      pose(c, 1, ONODA, "onoda", x, -1.7, { mode: x < 1.6 ? "stroll" : "stand", phase: (t * 0.9) % 1, expr: fa ? "nervous" : "smug", look: 1, tilt: -6, prop: after(t, C.bananas) ? "banana" : null });
      pose(c, 2, MEN[0], "man0", x - 0.9, -1.95, { mode: x < 1.6 ? "stroll" : "stand", phase: (t * 0.9 + 0.5) % 1, expr: fa ? "nervous" : "whistle", look: 1, tilt: -6, prop: after(t, C.rice) ? "rice" : null });
      pose(c, 5, FARMER(0), "farmer0", -3.3, -3.7, { mode: "stand", expr: fa ? "shock" : "neutral", look: 1, prop: fa ? "shrug" : null, lean: jolt(t, C.farmers, 0.12) });
    } else {
      pose(c, 1, ONODA, "onodaF", 0.55, -1.8, { mode: "stand", expr: "stern", look: -1 });
      pose(c, 2, MEN[1], "man1F", 1.3, -2.1, { mode: "stand", expr: "stern", look: -1 });
      for (let k = 0; k < 2; k++) { const run = smooth((t - C.fighting5 - 0.5) / 3.0); pose(c, 5 + k, FARMER(k), `farmerR${k}`, -0.5 - 2.2 * run - 0.7 * k, -2.4 - 0.4 * k, { mode: run > 0 ? "march" : "stand", phase: (t * 2.4 + 0.5 * k) % 1, expr: "shock", look: 1, lean: jolt(t, C.fighting5, 0.1) }); }
    }
  },
  // 7 For the islanders, it was no joke. People died.
  7: (c) => {
    const t = c.t;
    pose(c, 1, FARMER(0), "farmerN0", -0.55, -2.0, { mode: "stand", expr: "sad", look: 1, headTilt: 8 });
    pose(c, 2, FARMER(1), "farmerN1", 0.45, -2.15, { mode: "stand", expr: "sad", look: -1, headTilt: -6 });
    pose(c, 3, { ...FARMER(1), build: "kid", jacket: "#e6d8b8" }, "kidN", 0.0, -1.95, { mode: "stand", expr: "sad", look: 0 }, 0.8);
    for (let k = 0; k < 5; k++) candle(c, -0.8 + 0.4 * k, -1.3 - 0.08 * (k % 2), k);
    void t;
  },
  // 8 One by one, his men surrendered or were killed. By 1972, Onoda was a one-man army.
  8: (c) => {
    const t = c.t, y72 = after(t, C.y1972), om = after(t, C.oneman);
    pose(c, 1, ONODA, "onoda", 0.0, -1.7, { mode: "stand", expr: om ? "stern" : y72 ? "neutral" : "nervous", look: om ? 0 : -1, prop: om ? "salute" : null, dy: hop(t, C.oneman, 0.06, 0.25) });
    // man 0 walks off (surrendered), men 1 and 2 are gone in a puff of jungle mist
    const w0 = smooth((t - C.one6a - 0.1) / 1.6);
    if (w0 < 1) pose(c, 2, MEN[0], "man0", 0.9 + 3.2 * w0, -2.1, { mode: w0 > 0 ? "march" : "stand", phase: (t * 2) % 1, expr: "nervous", look: 1, prop: w0 > 0 ? "leaflet" : null });
    if (!after(t, C.surrendered)) pose(c, 3, MEN[1], "man1", -0.9, -2.15, { mode: "stand", expr: "neutral", look: 1 });
    if (!after(t, C.killed)) pose(c, 4, MEN[2], "man2", -1.7, -2.4, { mode: "stand", expr: "neutral", look: 1 });
    puff(c, C.surrendered - 0.05, [-0.9, 1.0, -2.1], 1.3, 0.55); puff(c, C.killed - 0.05, [-1.7, 1.0, -2.35], 1.3, 0.55);
    cal(c, C.y1972, "1972", [-0.8, 1.95, -1.4], 0.45);
    if (om) banner(c, C.oneman, "ARMY OF ONE", [0.0, 2.35, -1.5], 1.5, "#c0353a", 1.8);
  },
  // 9 Then in 1974, a Japanese college dropout named Norio Suzuki went on a backpacking trip.
  9: (c) => {
    const t = c.t, x = walk9X(t), bp = after(t, C.backpacking);
    cal(c, C.y1974, "1974", [-1.0, 2.3, -2.2], 0.55, true);
    pose(c, 1, SUZUKI, "suzuki", x, -2.0, { mode: x < 0 ? "stroll" : "stand", phase: (t * 1.1) % 1, expr: bp ? "laugh" : after(t, C.dropout) ? "grin" : "smile", look: x < 0 ? 1 : 0, wave: bp ? q(Math.sin(t * 7), 10) : undefined, dy: hop(t, C.suzuki7, 0.06, 0.25) });
    if (after(t, C.suzuki7)) banner(c, C.suzuki7, "NORIO SUZUKI", [0.0, 2.45, -1.9], 1.3, "#2f7a5a", 1.6);
  },
  // 10 He told his friends he was looking for three things: Lieutenant Onoda, a panda, and the Abominable Snowman. In that order.
  10: (c) => {
    const t = c.t, io = after(t, C.in8);
    pose(c, 1, SUZUKI, "suzuki", 0.0, -1.7, { mode: "stand", expr: io ? "grin" : "smile", look: 0, prop: after(t, C.three) ? "point" : null });
    for (let k = 0; k < 2; k++) pose(c, 2 + k, FRIENDS[k], `fr${k}`, k ? 1.15 : -1.15, -2.0, { mode: "stand", expr: io ? "laugh" : after(t, C.panda8) ? "awe" : "smile", look: k ? -1 : 1, dy: io ? bounce(t, k, 0.05) : 0 });
    const n = after(t, C.abominable) ? 3 : after(t, C.panda8 - 0.1) ? 2 : after(t, C.lieutenant8) ? 1 : 0;
    if (after(t, C.three)) card(c, `list${n}`, 500, 640, (p) => fxList(p, [0, 0, 0], n), [6, 1.6, 0], 1.12, 1.43);
    think(c, C.panda8, 0, [-0.85, 2.5, -1.7], 0.75);
    think(c, C.snowman - 0.1, 1, [0.85, 2.5, -1.7], 0.75);
  },
  // 11 And somehow... he actually found Onoda.
  11: (c) => {
    const t = c.t, x = walk11X(t), fd = after(t, C.found9);
    pose(c, 1, SUZUKI, "suzukiJ", x, -1.8, { mode: x < -0.6 ? "stroll" : "stand", phase: (t * 1.1) % 1, expr: fd ? "shock" : "smile", look: 1, lean: jolt(t, C.found9, 0.14), dy: hop(t, C.found9, 0.1, 0.3) });
    const up = ramp(t, C.found9 - 0.05, 0.3);
    if (up > 0) pose(c, 2, ONODA, "onoda", 0.75, -2.0, { mode: "stand", expr: "shock", look: -1 }, 1, -1.7 * (1 - up), false);
    if (fd) { bang(c, C.found9 + 0.05, [-0.35, 2.2, -1.75], 0.12); bang(c, C.found9 + 0.05, [1.05, 2.35, -2.0], 0.12); }
    if (after(t, C.onoda9)) { const k = pop(t, C.onoda9); card(c, "listT", 500, 640, (p) => fxList(p, [1, 0, 0], 3), [-1.55, 1.9, -1.4], 0.55 * k, 0.7 * k, { rot: -0.08 }); }
  },
  // 12 But Onoda still refused to surrender. Only his commanding officer could order that.
  12: (c) => {
    const t = c.t, rf = after(t, C.refused), on = after(t, C.only);
    pose(c, 1, ONODA, "onoda", 0.55, -1.8, { mode: "stand", expr: rf ? "stern" : "neutral", look: -1, prop: on ? "point" : null, headTilt: rf && !on ? 8 * Math.sin((t - C.refused) * 9) * Math.exp(-2 * (t - C.refused)) : 0 });
    pose(c, 2, SUZUKI, "suzukiJ", -0.65, -1.9, { mode: "stand", expr: rf ? "nervous" : "smile", look: 1 });
    think(c, C.commanding, 2, [0.95, 2.55, -1.85], 0.7);
  },
  // 13 So Japan tracked down his old commander... who was now selling books.
  13: (c) => {
    const t = c.t, sb = after(t, C.selling);
    card(c, "books", 600, 200, (p) => fxShopSign(p, "BOOKS"), [0.4, 3.15, -4.5], 2.4, 0.8, { yaw: 0 });
    pose(c, 1, TANI, "tani", -0.6, -3.3, { mode: "stand", expr: sb ? "grin" : after(t, C.commander) ? "awe" : "smile", look: 1, prop: "book", dy: hop(t, C.books, 0.05, 0.25) });
    if (sb) spark(c, C.books, [-0.3, 1.5, -3.2], 0.6, 0.3, "#ffffff");
  },
  // 14 The bookseller flew to the jungle, read out the order, and Onoda finally handed over his rifle. Still in uniform. Rifle still working.
  14: (c) => {
    const t = c.t, rd = after(t, C.read), ho = after(t, C.handed), su = after(t, C.still12), rw = after(t, C.rifle12b);
    const px = -12 + 10 * (t - C.l12 + 0.3);
    if (px < 14 && !rd) card(c, `plane${q((t * 6) % 1, 4)}`, 600, 240, (p) => fxPlane(p, (t * 6) % 1), [px, 7.5 - 0.5 * (t - C.l12), -9], 3.6, 1.44);
    pose(c, 2, TANI, "taniJ", -0.75, -1.85, { mode: "stand", expr: ho ? "smile" : rd ? "stern" : "neutral", look: 1, prop: rd && !ho ? "leaflet" : null });
    pose(c, 1, { ...ONODA, rifle: !ho }, "onoda", 0.55, -1.7, { mode: "stand", expr: ho ? "relief" : after(t, C.order12) ? "stern" : "neutral", look: -1, prop: ho ? "rifleH" : after(t, C.order12) ? "salute" : null, lean: ho ? 0.04 : 0 });
    pose(c, 3, SUZUKI, "suzukiJ", 1.7, -2.6, { mode: "stand", expr: ho ? "grin" : "smile", look: -1 }, 0.95);
    const rr = ramp(t, C.read, 0.25);
    if (rd) card(c, `order${q(rr, 6)}`, 500, 360, (p) => fxDoc(p, "ORDER", ["14th Area Army:", "cease all combat.", "— Maj. Taniguchi"], "OFFICIAL", rr), [6, 1.6, 0], 1.3, 0.94);
    if (su && !rw) spark(c, C.still12, [0.55, 1.15, -1.6], 0.7, 0.35, "#ffffff");
    if (rw) { spark(c, C.rifle12b, [0.35, 1.0, -1.55], 0.6, 0.35, "#ffffff"); if (after(t, C.working)) word(c, C.working, "CLICK!", [0.95, 1.6, -1.5], 0.55, 0.9, "#fff3b0"); }
  },
  // 15 The Philippine president pardoned him,
  15: (c) => {
    const t = c.t, st = ramp(t, C.pardoned, 0.22);
    pose(c, 1, { ...ONODA, patches: false, rifle: false }, "onodaP", 0.8, -1.9, { mode: "stand", expr: after(t, C.pardoned) ? "relief" : "nervous", look: -1 });
    card(c, `pardon${q(st, 6)}`, 500, 360, (p) => fxDoc(p, "PARDON", ["Name: Hiroo Onoda", "All charges:", "dropped."], "PARDONED", st, "#2f7a3a"), [-0.25, 1.35, -1.3], 1.0, 0.72);
    if (st > 0.9) spark(c, C.pardoned + 0.1, [0.05, 1.3, -1.25], 0.7, 0.3, "#ffffff");
  },
  // 16 ...and Onoda moved to Brazil... to raise cattle.
  16: (c) => {
    const t = c.t, ct = after(t, C.cattle);
    pose(c, 1, RANCHER, "rancher", -0.2, -2.0, { mode: "stand", expr: ct ? "laugh" : "smile", look: 1, dy: hop(t, C.cattle, 0.05, 0.25) });
    cow(c, 0, 1.15, -2.3, -1, { mode: "stand", moo: ct, eye: ct ? "happy" : undefined });
    cow(c, 1, -1.7, -3.2, 1, { mode: "graze" });
    cow(c, 2, 3.4, -4.0, -1, { mode: "graze" }, 0.6);
    if (ct) word(c, C.cattle + 0.1, "MOO!", [1.0, 1.4, -2.0], 0.6, 1.2, "#fff3b0");
  },
  // 17 And Suzuki? He never found the panda. One out of three. Not bad for a gap year.
  17: (c) => {
    const t = c.t, pn = after(t, C.panda14), on = after(t, C.one14), nb = after(t, C.not14);
    pose(c, 1, SUZUKI, "suzukiE", -0.35, -1.8, { mode: "stand", expr: nb ? "laugh" : pn ? "smile_closed" : "smile", look: 1, prop: pn && !nb ? "shrug" : null, dy: nb ? bounce(t, 1, 0.05) : 0 });
    const marks = [1, pn ? 2 : 0, on ? 2 : 0];
    card(c, `listE${marks.join("")}`, 500, 640, (p) => fxList(p, marks, 3), [0.75, 1.3, -1.5], 0.68, 0.87, { rot: 0.05 });
    if (on) { const k = pop(t, C.one14); card(c, "score", 400, 220, (p) => fxScore(p, "1 / 3"), [0.75, 2.15, -1.45], 0.6 * k, 0.33 * k, { rot: -0.06 }); }
    if (nb) confetti(c, C.not14, [0.2, 2.6, -1.6], 3.5);
  },
};
