// Places and cast of "Lord Timothy Dexter". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, crate, scrub, palm, beamBetween, ship } from "./props3d";
import { prop, Kit, house } from "./build";
import { grassHD, rep, water, stoneHD } from "./paint";
import { Pen, SKINS, fxBurst, fxPuff, fxConfetti, fxBang, Outfit, FrontOpts, fxWord, fxBanner, fxSmoke, fxDoc, fxScore, fxIdea, fxQuestion, fxPan, fxMittens, fxMoneyPile, fxBill, fxCrown, fxCoffin, fxBook, fxMark, fxSack, fxStrike, fxNotice } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who } from "./cast";
import { C } from "./cues";
import { V3, smooth, clamp01, LEAD, SetId } from "./story";

// ---------------- cast ----------------
/** Timothy Dexter: claret coat, cream breeches, tricorne */
const DEX: Outfit = { jacket: "#8a2f3e", pants: "#ece0c2", boots: "#1e1a1a", hat: "tricorne", buttons: "#e8c45a", skin: SKINS[0], belt: null };
/** "Lord" Dexter: purple coat, gold sash, gold-trimmed tricorne */
const LORD: Outfit = { ...DEX, jacket: "#5a2f7a", sash: "#e8c45a", trim: "#e8c45a", build: "stout" };
const RIVAL = (v: number): Outfit => ({ jacket: ["#2f4a3a", "#2e3550"][v % 2], pants: "#3a3440", boots: "#1e1a1a", hat: "tophat", buttons: "#c9ccd2", moustache: "#2a1e18", skin: SKINS[[1, 0][v % 2]], build: v % 2 ? "stout" : undefined });
const TOWN = (v: number): Outfit => v % 2
  ? { jacket: "#f4e8d0", pants: "#f4e8d0", boots: "#5a3b2a", dress: ["#3f7ab8", "#c94a5a", "#3f9a6a", "#e07a3a"][(v >> 1) % 4], hat: "hair", hair: ["#5a3b2a", "#d9a24e", "#2a2020", "#8a5a3a"][(v >> 1) % 4], skin: SKINS[[0, 1, 2, 0][(v >> 1) % 4]] }
  : { jacket: ["#3a5a8a", "#6a5a3a", "#2f6a5a", "#7a4a3a"][(v >> 1) % 4], pants: "#d9ccb0", boots: "#2a1e16", hat: "tricorne", buttons: "#c9ccd2", skin: SKINS[[1, 0, 3, 2][(v >> 1) % 4]], moustache: v % 3 === 0 ? "#4a3222" : undefined };
const FARMER = (v: number): Outfit => ({ jacket: ["#efe6d2", "#e6d8b8"][v % 2], pants: "#c8b48a", boots: "#5a3b2a", hat: "slouch", hatCol: "#d9c08a", skin: SKINS[[2, 3][v % 2]] });
const MINER = (v: number): Outfit => ({ jacket: ["#4a4a52", "#5a4e44", "#3e4650"][v % 3], pants: "#34343a", boots: "#1e1a16", hat: "cap", cap: "#26262c", skin: SKINS[[0, 1, 0][v % 3]], moustache: v % 2 ? "#3a2a1e" : undefined });
const TRADER = (v: number): Outfit => ({ jacket: ["#2f6a8a", "#8a5a2a"][v % 2], pants: "#e6dcc4", boots: "#5a3b2a", hat: "slouch", hatCol: "#6a4a2a", skin: SKINS[[1, 3][v % 2]], moustache: "#2a1e18" });
const SIB: Outfit = { jacket: "#6a4a32", pants: "#4a3a2a", boots: "#2a1e16", hat: "ushanka", hatCol: "#5a4030", skin: SKINS[0], moustache: "#5a3a22", build: "stout" };

type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
// ---------------- life: card-level motion (calm: no jitter, one smooth lean per reaction) ----------------
type Act = { lean?: number; dy?: number };
const sway = (t: number, i: number, amp0 = 0.03, hz0 = 0.5) => { const amp = amp0 * 0.45, hz = hz0 * 0.7; return amp * Math.sin(2 * Math.PI * (hz * t + hh(i, 5))) + 0.4 * amp * Math.sin(2 * Math.PI * (1.7 * hz * t + hh(i, 6))); };
const jolt = (t: number, at: number, amp: number) => { const u = (t - at + LEAD) / 0.12; return u < 0 ? 0 : 0.7 * amp * u * Math.exp(1 - u); };
const hop = (t: number, at: number, h = 0.12, d = 0.3) => { const u = (t - at + LEAD) / d; return u < 0 || u > 1 ? 0 : h * Math.sin(Math.PI * u); };
const bounce = (t: number, i: number, h0 = 0.06, hz0 = 2.2) => { const h = h0 * 0.5, hz = hz0 * 0.6; return h * Math.abs(Math.sin(Math.PI * (hz * t + hh(i, 7)))); };
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0, shadow = true) => {
  const { lean = 0, dy = 0, ...f } = fo;
  const pl = person(c.cam, { i, o, okey } as Who, x, y + dy, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...f }, {}, scale);
  pl.roll = sway(c.t, i) + lean;
  c.out.places.push(pl);
  if (shadow && f.mode !== "fall" && y < 0.05) blob(c.out, x, y, z, scale);
};
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
const word = (c: Ctx, at: number, txt: string, p: V3, w: number, life = 0.7, col = "#fff3b0") => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at) * (u > life - 0.12 ? (life - u) / 0.12 : 1); card(c, `word${txt}${col}`, 600, 300, (pen) => fxWord(pen, txt, col), p, w * k, 0.5 * w * k, { rot: 0.06 * Math.sin(at * 7) }); };
const sweat = (c: Ctx, p: V3, s = 0.07) => { for (let k = 0; k < 2; k++) { const u = (c.t * 1.2 + k / 2) % 1; card(c, "sweat", 120, 160, (pen) => { pen.poly([[60, 10], [100, 100], [60, 150], [20, 100]], "#bfe6ff", 6); }, [p[0] + (k ? 1 : -1) * (0.08 + 0.12 * u), p[1] + 0.1 * Math.sin(Math.PI * u) - 0.05 * u, p[2]], s, s * 1.3); } };
const confetti = (c: Ctx, at: number, p: V3, w: number) => { if (c.t < at - LEAD) return; const k = q(((c.t - at) * 0.35) % 1, 30); card(c, `conf${k}`, 600, 600, (pen) => fxConfetti(pen, k), p, w, w); };
const bang = (c: Ctx, at: number, p: V3, s = 0.14) => { if (!after(c.t, at)) return; const k = pop(c.t, at); card(c, "bang", 200, 400, (pen) => fxBang(pen), p, s * k, 2 * s * k); };
const ramp = (t: number, a: number, d: number) => smooth((t - a + LEAD) / d);
const smoke = (c: Ctx, p: V3, s: number, k0 = 0) => { const k = q(((c.t * 0.25 + k0) % 1), 20); card(c, `smk${k}`, 400, 400, (pen) => fxSmoke(pen, k), [p[0], p[1] + 1.2 * k, p[2]], s * (0.6 + k), s * (0.6 + k), { soft: true }); };
const banner = (c: Ctx, at: number, txt: string, p: V3, w: number, col = "#c0353a", life = 1.6) => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at) * (u > life - 0.15 ? (life - u) / 0.15 : 1); card(c, `ban${txt}${col}`, 1000, 240, (pen) => fxBanner(pen, txt, col), p, w * k, 0.24 * w * k, { rot: 0.03 * Math.sin(at * 5) }); };
/** a card that pops in at `at` and stays */
const stay = (c: Ctx, at: number, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, rot = 0) => { if (!after(c.t, at)) return; const k = pop(c.t, at); card(c, key, cw, ch, draw, p, w * k, h * k, { rot }); };
/** coin shower: gold coins tumbling down around p (width w) from cue `at` */
const coinDraw = (pen: Pen, ph: number) => { const s = Math.max(0.15, Math.abs(Math.cos(ph * Math.PI))); pen.ell(100, 100, 80 * s, 80, "#f2c23a", 9); if (s > 0.5) pen.ell(100, 100, 50 * s, 50, "#f8dc70", 0); };
const coins = (c: Ctx, at: number, p: V3, w: number, n = 14, h = 2.4, life = 99) => {
  const u0 = c.t - at + LEAD; if (u0 < 0 || u0 > life) return;
  for (let k = 0; k < n; k++) {
    const per = 1.1 + 0.5 * hh(k, 1), u = ((u0 + per * hh(k, 2)) % per) / per;
    if (u0 < per * (1 - hh(k, 2)) * 0 + 0 && u > 0) continue;
    const y = p[1] + h * (1 - u) - 0.3, x = p[0] + w * (hh(k, 3) - 0.5), z = p[2] + 0.6 * (hh(k, 4) - 0.5);
    const ph = q((c.t * 2.5 + hh(k, 5)) % 1, 8);
    card(c, `coin${ph}`, 200, 200, (pen) => coinDraw(pen, ph), [x, y, z], 0.13, 0.13);
  }
};
/** a card flying from a to b between t0 and t1 */
const fly = (c: Ctx, key: string, draw: (p: Pen) => void, cw: number, ch: number, t0: number, t1: number, a: V3, b: V3, w: number, h: number, arc = 0, spin = 0) => {
  const u = (c.t - t0) / (t1 - t0); if (u < 0 || u > 1) return;
  card(c, key, cw, ch, draw, [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + arc * Math.sin(Math.PI * u), a[2] + (b[2] - a[2]) * u], w, h, { rot: spin * u });
};
const INSP: V3 = [6, 1.6, 0];

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
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
/** heap of coal lumps */
const coalHeap = (b: Batch, x: number, z: number, r: number, h: number, seed: number) => {
  b.add(new THREE.ConeGeometry(r, h, 18, 1).translate(0, h / 2, 0), lam("coalCone", () => ({ color: "#2c2c32" })), M4(x, 0, z));
  for (let k = 0; k < 26; k++) {
    const a = hh(seed + k, 1) * Math.PI * 2, rr = r * Math.sqrt(hh(seed + k, 2)) * 0.95, y = h * (1 - rr / r);
    b.add(new THREE.DodecahedronGeometry(0.12 + 0.14 * hh(seed + k, 3), 0), lam(k % 2 ? "coal" : "coal2", () => ({ color: k % 2 ? "#3a3a42" : "#24242a", flatShading: true })), M4(x + rr * Math.cos(a), y, z + rr * Math.sin(a), k));
  }
};
const lamp = (b: Batch, x: number, z: number) => {
  const D = lam("lampIron", () => ({ color: "#2a2a30" }));
  b.add(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 8).translate(0, 1.3, 0), D, M4(x, 0, z));
  b.add(boxGeo(V(-0.16, 2.6, -0.16), V(0.16, 2.95, 0.16)), lam("lampGlass", () => ({ color: "#f6e6a8" })), M4(x, 0, z));
  b.add(new THREE.ConeGeometry(0.24, 0.2, 4).rotateY(Math.PI / 4).translate(0, 3.05, 0), D, M4(x, 0, z));
};
/** sugar cane clump */
const cane = (b: Batch, x: number, z: number, seed: number) => {
  for (let k = 0; k < 7; k++) {
    const h = 2.0 + 0.8 * hh(seed + k, 1), dx = 0.5 * (hh(seed + k, 2) - 0.5), dz = 0.5 * (hh(seed + k, 3) - 0.5);
    b.add(beamBetween(V(x + dx, 0, z + dz), V(x + dx * 1.6, h, z + dz * 1.6), 0.035, 5), lam("cane", () => ({ color: "#9ab84a" })));
    b.add(new THREE.ConeGeometry(0.28, 0.9, 5).rotateZ(Math.PI).translate(0, 0, 0), lam("caneLeaf", () => ({ color: "#5c9c40", flatShading: true })), M4(x + dx * 1.6, h - 0.1, z + dz * 1.6, k));
  }
};
const cabin = (b: Batch, x: number, z: number) => {
  const L = lam("log", () => ({ color: "#7a5434" })), L2 = lam("log2", () => ({ color: "#6a4a2e" }));
  for (let k = 0; k < 8; k++) { const y = 0.16 + 0.3 * k; b.add(new THREE.CylinderGeometry(0.16, 0.16, 6, 10).rotateZ(Math.PI / 2), k % 2 ? L : L2, M4(x, y, z + 2)); b.add(new THREE.CylinderGeometry(0.16, 0.16, 4, 10).rotateX(Math.PI / 2), k % 2 ? L2 : L, M4(x - 2.9, y, z)); b.add(new THREE.CylinderGeometry(0.16, 0.16, 4, 10).rotateX(Math.PI / 2), k % 2 ? L2 : L, M4(x + 2.9, y, z)); }
  b.add(boxGeo(V(x - 2.8, 0, z - 1.9), V(x + 2.8, 2.4, z + 1.9)), L2);
  b.add(new THREE.CylinderGeometry(2.6, 2.6, 6.6, 3, 1).rotateZ(Math.PI / 2).scale(1, 0.5, 1).translate(x, 3.1, z), lam("snowRoof", () => ({ color: "#eef3f8" })));
  b.add(boxGeo(V(x - 0.5, 0, z + 2.0), V(x + 0.5, 1.8, z + 2.2)), lam("cabDoor", () => ({ color: "#4a3020" })));
};
const sandTex = () => earthHD("sandHD", ["#ead7a4", "#e2cc96", "#f0dfb0", "#d8c08a"], "#a8b85a");
const snowTex = () => earthHD("snowHD3", ["#e8eef6", "#dde6f0", "#f0f4fa", "#d4dee8"], "#c8d2dc");
const cobble = () => stoneHD("cobbleHD", ["#b8aa94", "#ab9d88", "#c4b6a0", "#a09280"], "#7e7262");
const cobbleGrey = () => stoneHD("cobbleGreyHD", ["#8e8e94", "#828288", "#9a9aa0", "#76767c"], "#5a5a60");
export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  town: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("townGrass", () => ({ map: grassHD() })));
    b.add(plane(-30, 30, -6.5, 6, 1, 0.01), lam("townCobble", () => ({ map: rep(cobble(), 8, 4) })));
    const xs = [-15.5, -10, -4.6, 0.6, 5.8, 11, 16.4];
    xs.forEach((x, i) => house(b, x, -9.5 - 0.4 * (i % 2), 0, 5.0, 4.6, 5.2 + 1.2 * hh(i, 2), [0, 7, 3, 1, 7, 2, 0][i]));
    house(b, -13, 1.0, Math.PI / 2, 6, 4.6, 5.6, 4); house(b, 13.5, 0.5, -Math.PI / 2, 6, 4.6, 5.0, 6);
    backHills(b, 90, 12, 14, 7, lam("hillTown", () => ({ color: "#7aa25a" })));
    for (let k = -7; k <= 7; k++) prop(b, kit, "tree_fat", k * 9 + 3, 0, -26 - 6 * hh(k, 3), 7 + 2 * hh(k, 4));
    lamp(b, -3.2, -5.6); lamp(b, 3.4, -5.6);
    for (let k = 0; k < 2; k++) crate(b, 4.6 + 0.75 * k, 0, -5.2, 0.65, 0.3 * k);
    b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 12).translate(0, 0.4, 0), lam("barrel", () => ({ color: "#9a6a42" })), M4(-4.6, 0, -5.4));
  },
  tropic: (s) => {
    const { b } = s;
    b.add(plane(-200, 200, -200, -8, 40, -0.06), lam("seaT", () => ({ map: rep(water(), 40, 40), color: "#7ad0d8" })));
    b.add(plane(-60, 60, -8, 60, 1, 0.0), lam("sandGround", () => ({ map: rep(sandTex(), 10, 10) })));
    b.add(plane(-120, 120, -90, -70, 1, 0.02), lam("farIsle", () => ({ color: "#5a9a4a" })));
    ship(b, 3, -22, 0.3, 12, -1.0, 3);
    for (let k = 0; k < 10; k++) palm(b, (k % 2 ? 1 : -1) * (3.5 + 1.6 * k + hh(k, 1)), -3 - 4 * hh(k, 2), 4.5 + 2 * hh(k, 3), k + 3);
    for (let k = 0; k < 4; k++) cane(b, -6 + 1.4 * k, -6.2 - 0.6 * hh(k, 5), k * 9);
    for (let k = 0; k < 4; k++) cane(b, 3.2 + 1.4 * k, -6.4 - 0.6 * hh(k, 6), k * 9 + 50);
    for (let k = 0; k < 8; k++) scrub(b, -8 + 2.2 * k, -4.6 - hh(k, 7), 0.6 + 0.3 * hh(k, 8), k, "#5c9c40");
    // molasses kettle on a little fire ring
    b.add(new THREE.CylinderGeometry(0.62, 0.48, 0.7, 20, 1, true).translate(0, 0.55, 0), lam("kettle", () => ({ color: "#2a2a30", side: THREE.DoubleSide })), M4(1.5, 0, -2.3));
    b.add(new THREE.CircleGeometry(0.6, 20).rotateX(-Math.PI / 2).translate(0, 0.82, 0), lam("molasses", () => ({ color: "#5a2e14" })), M4(1.5, 0, -2.3));
    b.add(new THREE.TorusGeometry(0.62, 0.05, 6, 24).rotateX(Math.PI / 2).translate(0, 0.9, 0), lam("kettleRim", () => ({ color: "#3a3a42" })), M4(1.5, 0, -2.3));
    for (let k = 0; k < 8; k++) rock(b, 1.5 + 0.75 * Math.cos(k * 0.785), 0, -2.3 + 0.75 * Math.sin(k * 0.785), 0.13, k, "#7a6e62");
    for (let k = 0; k < 3; k++) crate(b, -3.4 + 0.75 * k, 0, -3.4, 0.65, 0.2 * k);
  },
  newcastle: (s) => {
    const { b } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("ncGround", () => ({ map: rep(earthHD("ncDirtHD", ["#7a7266", "#6e665a", "#867c70", "#625a50"], "#5a6a46"), 40, 40) })));
    b.add(plane(-30, 30, -6.5, 6, 1, 0.01), lam("ncCobble", () => ({ map: rep(cobbleGrey(), 8, 4) })));
    [-14, -8.6, 8.6, 14].forEach((x, i) => house(b, x, -10 - 0.3 * (i % 2), 0, 5.0, 4.6, 5.0 + hh(i, 4), 7));
    coalHeap(b, -3.6, -6.4, 2.6, 2.8, 1); coalHeap(b, 3.4, -7.0, 3.0, 3.4, 40); coalHeap(b, 0.2, -11, 3.6, 4.2, 80); coalHeap(b, -7.5, -12, 2.8, 3.0, 120);
    // pithead winding tower + chimneys
    const Wd = lam("pitWood", () => ({ color: "#4a3a2e" }));
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(beamBetween(V(7.5 + dx * 1.4, 0, -15 + dz * 1.4), V(7.5 + dx * 0.4, 9, -15 + dz * 0.4), 0.14, 6), Wd);
    b.add(new THREE.TorusGeometry(1.4, 0.12, 8, 28), lam("wheel", () => ({ color: "#2a2a30" })), M4(7.5, 9.6, -15));
    for (const [x, z, h] of [[-11, -18, 12], [-5, -22, 14], [13, -20, 11]]) b.add(new THREE.CylinderGeometry(0.7, 1.0, h, 12).translate(0, h / 2, 0), lam("chimney", () => ({ color: "#8a4a36" })), M4(x, 0, z));
    backHills(b, 90, 12, 12, 9, lam("hillNc", () => ({ color: "#6a7a5a" })));
    for (let k = 0; k < 3; k++) crate(b, -1.2 + 0.75 * k, 0, -4.4, 0.65, 0.3 * k);
  },
  siberia: (s) => {
    const { b, kit } = s;
    b.add(plane(-200, 200, -200, 60, 1), lam("sibSnow", () => ({ map: rep(snowTex(), 40, 40) })));
    backHills(b, 110, 12, 20, 21, lam("hillSib", () => ({ color: "#c8d4e0" })));
    for (let k = 0; k < 18; k++) prop(b, kit, "tree_cone", -20 + 2.4 * k + hh(k, 1), 0, -9 - 6 * hh(k, 2), 6 + 3 * hh(k, 3));
    cabin(b, -4.4, -6.4);
    for (let k = 0; k < 8; k++) rock(b, -6 + 1.8 * k, 0, -3.6 - 1.2 * hh(k, 4), 0.22 + 0.2 * hh(k, 5), k + 30, "#d8e0ea");
  },
};

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- staging per shot ----------------
type StageFn = (c: Ctx) => void;
const SOLD = (c: Ctx, at: number, p: V3, w = 1.6) => { banner(c, at, "SOLD OUT!", p, w, "#2f8a4a", 1.4); spark(c, at, [p[0], p[1], p[2] + 0.05], w * 0.8, 0.3, "#fff3b0"); };
/** snowflakes drifting across a box around p */
const snow = (c: Ctx, p: V3, w: number, h: number, n = 24) => { for (let k = 0; k < n; k++) { const u = ((c.t * (0.18 + 0.1 * hh(k, 1)) + hh(k, 2)) % 1); card(c, "flake", 64, 64, (pen) => pen.ell(32, 32, 24, 24, "#ffffff", 0), [p[0] + w * (hh(k, 3) - 0.5) + 0.2 * Math.sin(c.t * 1.3 + k), p[1] + h * (1 - u), p[2] + 1.2 * (hh(k, 4) - 0.5)], 0.05, 0.05); } };

export const STAGE: Record<number, StageFn> = {
  // 1 This man was the worst businessman in America, and it made him rich.
  1: (c) => {
    const t = c.t, ws = after(t, C.worst0), rc = after(t, C.rich0);
    pose(c, 1, DEX, "dex", 0.0, -1.7, { mode: "stand", expr: rc ? "laugh" : ws ? "innocent" : "smile", look: 0, prop: rc ? "bills" : "pan", dy: hop(t, C.rich0, 0.08, 0.3) });
    for (let k = 0; k < 2; k++) pose(c, 2 + k, TOWN(k * 3), `town${k * 3}`, k ? 1.3 : -1.3, -2.3, { mode: "stand", expr: rc ? "shock" : ws ? "laugh" : "neutral", look: k ? -1 : 1, prop: ws && !rc && k === 0 ? "point" : null, lean: jolt(t, C.rich0, 0.1), dy: ws && !rc ? bounce(t, 2 + k, 0.05) : 0 });
    if (ws) banner(c, C.worst0, "WORST BUSINESSMAN", [0.0, 2.55, -1.9], 1.9, "#c0353a", 2.2);
    if (rc) { coins(c, C.rich0, [0, 1.6, -1.6], 2.6, 18); spark(c, C.rich0, [0, 1.4, -1.5], 1.4, 0.35, "#ffd24a"); }
  },
  // 2 Timothy Dexter, Massachusetts, 1780s. He buys a huge pile of money everyone says is worthless.
  2: (c) => {
    const t = c.t, by = after(t, C.buys), pl = after(t, C.pile), ev = after(t, C.everyone);
    banner(c, C.l1, "TIMOTHY DEXTER", [-0.3, 2.5, -1.8], 1.6, "#2f5a7a", 2.6);
    banner(c, C.mass, "MASSACHUSETTS, 1780s", [-0.3, 2.15, -1.8], 1.7, "#7a3a2a", 2.6);
    pose(c, 1, DEX, "dex", -0.6, -1.7, { mode: "stand", expr: ev ? "smug" : pl ? "grin" : "smile", look: pl ? 1 : 0, prop: pl ? "bills" : null, dy: hop(t, C.pile, 0.06, 0.25) });
    stay(c, C.pile, "moneyPile", 600, 360, fxMoneyPile, [0.95, 0.48, -1.75], 1.75, 1.05);
    if (pl) spark(c, C.pile, [0.95, 0.6, -1.6], 1.2, 0.3, "#ffffff");
    for (let k = 0; k < 3; k++) pose(c, 3 + k, TOWN(k * 2 + 1), `townW${k}`, 1.8 + 0.95 * k, -2.9 - 0.3 * (k % 2), { mode: "stand", expr: ev ? "laugh" : "neutral", look: -1, prop: ev && k === 1 ? "point" : null, dy: ev ? bounce(t, 3 + k, 0.06) : 0 });
    if (after(t, C.worthless)) word(c, C.worthless, "JUNK!", [2.6, 2.3, -3.0], 1.2, 1.0);
  },
  // 3 Then the government decides to honour it. Dexter is rich.
  3: (c) => {
    const t = c.t, st = ramp(t, C.honour, 0.22), dr = after(t, C.dexter2);
    card(c, `cont${q(st, 6)}`, 500, 360, (p) => fxDoc(p, "CONTINENTAL $", ["The Government", "will pay in full."], "PAID!", st, "#2f7a3a", 292), INSP, 1.3, 0.94);
    pose(c, 1, DEX, "dex", -0.6, -1.7, { mode: "stand", expr: after(t, C.rich2) ? "laugh" : "grin", look: 1, prop: "bills", dy: hop(t, C.rich2, 0.08, 0.3) });
    card(c, "moneyPile", 600, 360, fxMoneyPile, [0.95, 0.48, -1.75], 1.75, 1.05);
    for (let k = 0; k < 2; k++) pose(c, 3 + k, TOWN(k * 2 + 1), `townW${k}`, 1.8 + 0.95 * k, -2.9 - 0.3 * (k % 2), { mode: "stand", expr: dr ? "shock" : "neutral", look: -1, lean: jolt(t, C.dexter2, 0.1) });
    if (dr) { coins(c, C.dexter2, [0.2, 1.6, -1.6], 3.0, 20); confetti(c, C.rich2, [0.2, 2.2, -2.2], 3.2); }
  },
  // 4 His rivals want him broke. So, as the story goes, they give him the worst advice they can think of.
  4: (c) => {
    const t = c.t, br = after(t, C.broke), th = after(t, C.they3), wa = after(t, C.worst3);
    pose(c, 1, RIVAL(0), "rival0", -0.55, -1.7, { mode: "stand", expr: wa ? "grin" : br ? "smug" : "stern", look: 1, headTilt: th && !wa ? 8 : 0, prop: wa ? "point" : null });
    pose(c, 2, RIVAL(1), "rival1", 0.6, -1.85, { mode: "stand", expr: wa ? "laugh" : br ? "smug" : "stern", look: -1, headTilt: th && !wa ? -8 : 0, dy: wa ? bounce(t, 2, 0.05) : 0 });
    if (br) word(c, C.broke, "BROKE!", [0.05, 2.45, -2.0], 1.2, 0.9);
    if (wa) { stay(c, C.worst3, "idea", 300, 400, fxIdea, [-0.25, 2.35, -1.6], 0.42, 0.56); spark(c, C.worst3, [-0.25, 2.4, -1.55], 0.8, 0.3, "#fff3b0"); }
  },
  // 5 "Sell warming pans... in the Caribbean."
  5: (c) => {
    const t = c.t, wm = after(t, C.warming), cb = after(t, C.caribbean);
    pose(c, 1, RIVAL(0), "rival0", 0.75, -1.85, { mode: "stand", expr: cb ? "laugh" : "grin", look: -1, prop: "point" });
    pose(c, 2, DEX, "dex", -0.65, -1.7, { mode: "stand", expr: cb ? "grin" : wm ? "awe" : "neutral", look: 1, prop: wm ? "pan" : null, dy: hop(t, C.caribbean, 0.06, 0.25) });
    if (wm) banner(c, C.warming, "WARMING PANS", [0.0, 2.55, -1.9], 1.5, "#c0353a", 1.6);
    if (cb) banner(c, C.caribbean, "TO THE CARIBBEAN!", [0.0, 2.25, -1.9], 1.8, "#2f7a9a", 1.4);
  },
  // 6 Hot pans. In the tropics. He does it.
  6: (c) => {
    const t = c.t, ht = after(t, C.hot), dz = after(t, C.does4);
    pose(c, 1, DEX, "dex", -0.3, -1.7, { mode: "stand", expr: dz ? "grin" : "nervous", look: 0, prop: "pan", dy: hop(t, C.does4, 0.06, 0.25) });
    if (ht) { word(c, C.hot, "HOT!", [0.35, 2.4, -1.9], 1.0, 0.9, "#ffb04a"); sweat(c, [-0.3, 2.05, -1.6]); }
    if (dz) for (let k = 0; k < 4; k++) { const u = ramp(t, C.does4 + 0.08 * k, 0.3); if (u > 0) card(c, `panS${k}`, 600, 260, fxPan, [-2.9 + 0.6 * k, 0.75 + 0.18 * k, -3.0], 0.75 * u, 0.33 * u, { rot: -1.2 + 0.4 * k }); }
  },
  // 7 The sugar farmers use them as ladles for molasses. Sold out.
  7: (c) => {
    const t = c.t, ld = after(t, C.ladles), so = after(t, C.sold5);
    for (let k = 0; k < 2; k++) pose(c, 2 + k, FARMER(k), `farmer${k}`, k ? 2.35 : 0.65, -2.35 + 0.1 * k, { mode: "stand", expr: ld ? (so ? "laugh" : "grin") : "smile", look: k ? -1 : 1, prop: "pan", tilt: ld ? 4 * Math.sin(t * 4 + k) : 0 });
    pose(c, 1, DEX, "dex", -1.0, -1.7, { mode: "stand", expr: so ? "laugh" : "smug", look: 1, prop: so ? "bills" : null, dy: hop(t, C.sold5, 0.08, 0.3) });
    if (ld) word(c, C.ladles, "LADLES!", [1.5, 2.45, -2.4], 1.2, 0.9);
    if (so) { SOLD(c, C.sold5, [0.4, 2.55, -2.0]); coins(c, C.sold5, [-0.6, 1.6, -1.5], 2.0, 12); }
  },
  // 8 "Ship coal to Newcastle." Newcastle is a coal town.
  8: (c) => {
    const t = c.t, nc = after(t, C.newcastle6b);
    banner(c, C.newcastle6 - 0.1, "NEWCASTLE", [0.0, 2.6, -2.0], 1.4, "#3a4a6a", 1.6);
    pose(c, 1, DEX, "dex", -0.2, -1.6, { mode: "stand", expr: nc ? "awe" : "grin", look: 0, prop: nc ? null : "point", headTilt: nc ? 6 : 0 });
    for (let k = 0; k < 3; k++) card(c, `sack`, 300, 320, fxSack, [0.6 + 0.42 * k, 0.32, -1.5 - 0.15 * (k % 2)], 0.6, 0.64);
    for (let k = 0; k < 3; k++) pose(c, 3 + k, MINER(k), `miner${k}`, -2.6 + 2.6 * k + (k === 1 ? 0.9 : 0), -5.0, { mode: "stand", expr: nc ? "laugh" : "neutral", look: k === 2 ? -1 : 1, dy: nc ? bounce(t, 3 + k, 0.06) : 0 }, 1, 0.0);
    if (after(t, C.town6)) word(c, C.coal6b, "COAL TOWN!", [0.2, 4.4, -9.0], 2.6, 1.0, "#c9ccd2");
    smoke(c, [-11, 12, -18], 2.4, 0.1); smoke(c, [-5, 14, -22], 2.6, 0.5); smoke(c, [13, 11, -20], 2.2, 0.8);
  },
  // 9 He does it. The miners are on strike. Sold out.
  9: (c) => {
    const t = c.t, mn = after(t, C.miners), sk = after(t, C.strike), so = after(t, C.sold6);
    pose(c, 1, DEX, "dex", -0.9, -1.7, { mode: "stand", expr: so ? "laugh" : sk ? "awe" : "smug", look: 1, prop: so ? "bills" : null, dy: hop(t, C.sold6, 0.08, 0.3) });
    for (let k = 0; k < 3; k++) if (!so || k > 0) card(c, `sack`, 300, 320, fxSack, [-0.1 + 0.42 * k, 0.32, -1.5 - 0.15 * (k % 2)], 0.6, 0.64);
    for (let k = 0; k < 3; k++) {
      const x = 1.2 + 0.9 * k, z = -2.4 - 0.35 * (k % 2), up = ramp(t, C.miners + 0.1 * k, 0.3);
      pose(c, 3 + k, MINER(k), `miner${k}`, x, z, { mode: "stand", expr: so ? "grin" : sk ? "stern" : "neutral", look: -1, prop: so && k === 0 ? "crate" : null, dy: so ? bounce(t, 3 + k, 0.06) : 0 });
      if (mn && !so) card(c, "strike", 400, 500, fxStrike, [x + 0.1, 2.05 + 0.08 * up, z + 0.12], 0.62 * up, 0.78 * up, { rot: 0.08 * Math.sin(t * 3 + k) });
    }
    if (so) { SOLD(c, C.sold6, [0.4, 2.6, -2.0]); coins(c, C.sold6, [-0.8, 1.6, -1.5], 2.0, 12); }
  },
  // 10 "Send wool mittens to the tropics." Traders buy them all...
  10: (c) => {
    const t = c.t, ml = after(t, C.mittens), tr = after(t, C.traders), al = after(t, C.all7);
    pose(c, 1, DEX, "dex", -0.7, -1.7, { mode: "stand", expr: al ? "grin" : tr ? "awe" : "nervous", look: 1, prop: ml && !al ? "mitten" : al ? "bills" : null });
    if (ml) { banner(c, C.wool, "WOOL MITTENS", [-0.5, 2.55, -1.9], 1.5, "#c0353a", 1.6); sweat(c, [-0.7, 2.05, -1.6]); }
    const ti = ramp(t, C.traders - 0.1, 0.5);
    for (let k = 0; k < 2; k++) pose(c, 2 + k, TRADER(k), `trader${k}`, 0.75 + 0.95 * k + 2.4 * (1 - ti), -2.1 - 0.3 * k, { mode: ti < 1 ? "march" : "stand", phase: (t * 2 + 0.4 * k) % 1, expr: tr ? "grin" : "neutral", look: -1, prop: al ? "mitten" : null });
    if (al) { word(c, C.all7, "ALL!", [0.9, 2.45, -2.2], 1.2, 1.0); coins(c, C.all7, [-0.6, 1.6, -1.5], 1.8, 10); }
  },
  // 11 ...for Siberia.
  11: (c) => {
    const t = c.t;
    banner(c, C.for7, "SIBERIA", [0.0, 2.5, -1.9], 1.2, "#3a6aa0", 1.6);
    pose(c, 1, SIB, "sib", 0.0, -1.7, { mode: "stand", expr: "laugh", look: 0, prop: "mitten", dy: bounce(t, 1, 0.07) });
    for (let k = 0; k < 2; k++) pose(c, 2 + k, { ...SIB, jacket: ["#5a5a6a", "#7a5a3a"][k], build: undefined, moustache: undefined, skin: SKINS[k + 1] }, `sib${k}`, k ? 1.35 : -1.35, -2.4, { mode: "stand", expr: "grin", look: k ? -1 : 1, prop: "mitten" });
    snow(c, [0, 0.2, -1.6], 5, 3.2, 30);
  },
  // 12 Now rich, he gives himself a title: Lord Timothy Dexter.
  12: (c) => {
    const t = c.t, lo = after(t, C.lord), ti = after(t, C.title);
    pose(c, 1, LORD, "lord", 0.0, -1.7, { mode: "stand", expr: lo ? "smug" : ti ? "grin" : "smile", look: 0, prop: "bills", dy: hop(t, C.lord, 0.08, 0.3) });
    stay(c, C.lord, "crown", 300, 220, fxCrown, [0.0, 1.8, -1.68], 0.32, 0.23);
    if (lo) { spark(c, C.lord, [0.0, 1.85, -1.6], 0.9, 0.3, "#ffd24a"); banner(c, C.lord + 0.15, "LORD TIMOTHY DEXTER", [0.0, 2.75, -1.95], 2.0, "#7a3aa0", 2.0); }
    for (let k = 0; k < 4; k++) pose(c, 2 + k, TOWN(k + 4), `townL${k}`, (k % 2 ? 1 : -1) * (1.3 + 0.9 * (k >> 1)), -2.4 - 0.4 * (k >> 1), { mode: "stand", expr: lo ? "awe" : "neutral", look: k % 2 ? -1 : 1, headTilt: lo ? (k % 2 ? -10 : 10) : 0 });
    confetti(c, C.dexter8, [0, 2.6, -2.4], 3.4);
  },
  // 13 He fakes his own funeral just to see who shows up. About three thousand people do.
  13: (c) => {
    const t = c.t, sh = after(t, C.shows), th = after(t, C.three);
    card(c, "coffin", 260, 600, fxCoffin, [0.3, 0.68, -2.3], 0.6, 1.38);
    if (!after(t, C.see9)) stay(c, C.l9, "notice", 500, 360, fxNotice, INSP, 1.3, 0.94);
    // Dexter peeking from the house corner on the left
    pose(c, 1, DEX, "dex", -2.25, -2.0, { mode: "stand", expr: th ? "laugh" : "whistle", look: 1, lean: 0.06 });
    const n = th ? 14 : sh ? 6 : 0;
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / 5), col = k % 5, ar = ramp(t, (k < 6 ? C.shows : C.three) + 0.05 * (k % 6), 0.4);
      const x = -0.9 + 0.62 * col + 0.3 * row + 2.0 * (1 - ar), z = -3.0 - 0.9 * row;
      pose(c, 10 + k, TOWN(k), `townF${k % 8}`, x, z, { mode: ar < 1 ? "march" : "stand", phase: (t * 2 + 0.3 * k) % 1, expr: ["sad", "awe", "sad", "nervous"][k % 4] as FrontOpts["expr"], look: -1 });
    }
    if (th) { const k = pop(t, C.three); card(c, "score3000", 400, 220, (p) => fxScore(p, "3,000"), [0.4, 2.5, -2.6], 1.2 * k, 0.66 * k, { rot: -0.05 }); }
  },
  // 14 Then he writes a book. No punctuation. None. Readers complain.
  14: (c) => {
    const t = c.t, rd = after(t, C.readers10);
    card(c, "book0", 700, 460, (p) => fxBook(p, 0), INSP, 1.5, 0.99);
    if (after(t, C.none)) word(c, C.none, "NONE.", [6.35, 2.05, 0.1], 0.8, 0.9);
    pose(c, 1, DEX, "dex", -0.9, -1.7, { mode: "stand", expr: "smug", look: 1, prop: "book" });
    for (let k = 0; k < 3; k++) pose(c, 2 + k, TOWN(k + 2), `townR${k}`, 0.4 + 0.9 * k, -2.0 - 0.3 * (k % 2), { mode: "stand", expr: rd ? (["pained", "dazed", "shock"] as const)[k] : "neutral", look: -1, prop: "book", lean: jolt(t, C.complain, 0.1) });
    if (rd) { bang(c, C.complain, [1.3, 2.15, -2.1], 0.12); word(c, C.complain + 0.05, "HUH?!", [1.4, 2.5, -2.2], 1.0, 0.9); }
  },
  // 15 So in the next edition, he adds a whole page of commas and full stops at the back... and tells readers to put them wherever they please.
  15: (c) => {
    const t = c.t, ad = after(t, C.adds), tl = after(t, C.tells);
    if (ad) card(c, "book1", 700, 460, (p) => fxBook(p, 1), INSP, 1.5, 0.99);
    pose(c, 1, DEX, "dex", -0.9, -1.7, { mode: "stand", expr: tl ? "grin" : "smug", look: 1, prop: tl ? "shrug" : "book", dy: hop(t, C.tells, 0.05, 0.25) });
    for (let k = 0; k < 3; k++) pose(c, 2 + k, TOWN(k + 2), `townR${k}`, 0.4 + 0.9 * k, -2.0 - 0.3 * (k % 2), { mode: "stand", expr: after(t, C.please) ? "dazed" : tl ? "awe" : "neutral", look: -1, prop: "book" });
    if (tl) for (let k = 0; k < 8; k++) { const ph = ((t - C.tells) * 0.55 + k / 8) % 1, m = [".", ",", "!", "?", ";", ":", ",", "."][k];
      card(c, `mark${m}`, 200, 260, (p) => fxMark(p, m), [-0.6 + 3.2 * ph + 0.3 * Math.sin(k), 1.3 + 1.3 * Math.sin(Math.PI * ph) + 0.2 * (k % 3), -1.4], 0.42, 0.55, { rot: 4 * ph + k }); }
  },
  // 16 Genius? Fool? Either way, he died rich.
  16: (c) => {
    const t = c.t, gn = after(t, C.genius), fo = after(t, C.fool), dr = after(t, C.died);
    pose(c, 1, LORD, "lord", 0.0, -1.7, { mode: "stand", expr: dr ? "laugh" : fo ? "innocent" : "smug", look: 0, prop: dr ? "bills" : null, dy: hop(t, C.rich12, 0.08, 0.3) });
    card(c, "crown", 300, 220, fxCrown, [0.0, 1.8, -1.68], 0.32, 0.23);
    if (gn && !dr) banner(c, C.genius, "GENIUS?", [-0.5, 2.55, -1.8], 0.9, "#2f7a3a", 99);
    if (fo && !dr) banner(c, C.fool, "FOOL?", [0.5, 2.25, -1.8], 0.8, "#c0353a", 99);
    if (gn && !dr) stay(c, C.genius, "qm", 300, 400, fxQuestion, [0.0, 2.9, -1.7], 0.3, 0.4);
    if (dr) { coins(c, C.died, [0, 1.6, -1.6], 3.2, 24); confetti(c, C.rich12, [0, 2.4, -2.2], 3.6); spark(c, C.rich12, [0, 1.5, -1.5], 1.4, 0.35, "#ffd24a"); }
  },
};
void fxBill; void fxMittens; void puff; void fly; void scrub; void boxGeo;
