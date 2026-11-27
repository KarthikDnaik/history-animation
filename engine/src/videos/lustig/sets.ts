// Places and cast of "The Man Who Sold the Eiffel Tower" (16:9 long-form). Cameras sit on +z looking toward -z (+x = screen right).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, beamBetween, cart } from "./props3d";
import { prop, Kit, house, quad } from "./build";
import { grassHD, rep, water, stoneHD, planksHD, facadeHD, ctex } from "./paint";
import { RoomStyle, room2, table2, chair, chandelier2, pottedPalm, bookcase, morris, bench, streetLamp, awning, haussmann, fireEscape, waterTower, lifeRing, lifeboat, slabHD, asphaltHD, signHD, cellStoneHD, concreteHD, wbox } from "./decor";
import { Pen, SKINS, fxBurst, fxPuff, fxConfetti, fxBang, Outfit, FrontOpts, fxWord, fxBanner, fxSmoke, fxDoc, fxScore, fxIdea, fxQuestion, fxMoneyPile, fxCal, fxZ,
  fxNews, fxLetterhead, fxCardID, fxEnvelope, fxRules, fxSay, fxX, fxMiniTower, fxMoneyBox, fxCert, fxRope, fxCar, fxPlacard, fxPhone, fxGavel, fxDeposit } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart } from "./story";

// ---------------- cast (1920s) ----------------
/** Victor Lustig: navy suit, dark fedora with a claret band, thin moustache, the scar */
export const LUSTIG: Outfit = { jacket: "#2a2f48", pants: "#2a2f48", boots: "#1e1a1a", hat: "fedora", hatCol: "#26262e", trim: "#8a2a3a", buttons: "#c9ccd2", moustache: "#2a1e18", skin: SKINS[0], scar: true };
const COUNT: Outfit = { ...LUSTIG, jacket: "#1e1a24", pants: "#1e1a24", hat: "tophat", sash: "#c0353a", buttons: "#e8c45a" };
const PRISON_L: Outfit = { ...LUSTIG, jacket: "#6a7480", pants: "#6a7480", hat: "hair", hair: "#2a1e18", buttons: "#4a5460" };
const SUITS = ["#5a4a3a", "#3a4a5a", "#4a4a4e", "#5a3a3a", "#3a5244"], HATS = ["#3a2e24", "#2a3040", "#3a3a40", "#4a2e2a", "#2e3a30"];
const DEALER = (v: number): Outfit => ({ jacket: SUITS[v % 5], pants: SUITS[v % 5], boots: "#1e1a16", hat: v % 2 ? "fedora" : "tophat", hatCol: HATS[v % 5], buttons: "#c9ccd2", moustache: v % 3 !== 1 ? ["#4a3222", "#2a2020", "#8a6a4a"][v % 3] : undefined, skin: SKINS[[1, 0, 2, 0, 3][v % 5]], build: v % 2 ? "stout" : undefined });
const POISSON: Outfit = { jacket: "#6a5232", pants: "#6a5232", boots: "#1e1a16", hat: "fedora", hatCol: "#4a3a26", buttons: "#e8c45a", moustache: "#3a2a1a", skin: SKINS[1], build: "stout" };
const WIFE: Outfit = { jacket: "#f4e8d0", pants: "#f4e8d0", boots: "#3a2a1e", dress: "#7a3a5a", hat: "hair", hair: "#3a2a20", skin: SKINS[1] };
const VILLAGER = (v: number): Outfit => ({ jacket: ["#8a6a44", "#6a7a4a", "#7a5a5a"][v % 3], pants: "#5a4a3a", boots: "#3a2a1e", hat: v % 2 ? "cap" : "hair", cap: "#4a3a2a", hair: "#5a3b2a", skin: SKINS[[0, 1, 2][v % 3]], moustache: v === 2 ? "#6a4a2a" : undefined });
const MAYOR: Outfit = { jacket: "#2a2a34", pants: "#2a2a34", boots: "#1e1a16", hat: "tophat", sash: "#e8c45a", buttons: "#e8c45a", moustache: "#6a6a6a", skin: SKINS[0], build: "stout" };
const PASSENGER = (v: number): Outfit => v % 2 ? { jacket: "#f4e8d0", pants: "#f4e8d0", boots: "#3a2a1e", dress: ["#c0a0d8", "#3f7ab8"][(v >> 1) % 2], hat: "hair", hair: "#d9a24e", skin: SKINS[0] } : { jacket: "#1e1a24", pants: "#1e1a24", boots: "#1e1a16", hat: "tophat", buttons: "#f4f1ea", moustache: "#6a6a6a", skin: SKINS[[1, 0][(v >> 1) % 2]], build: "stout" };
const PARISIAN = (v: number): Outfit => v % 2 ? { jacket: "#f4e8d0", pants: "#f4e8d0", boots: "#3a2a1e", dress: ["#c94a5a", "#3f9a6a", "#e07a3a"][(v >> 1) % 3], hat: "hair", hair: ["#5a3b2a", "#2a2020", "#8a5a3a"][(v >> 1) % 3], skin: SKINS[[0, 1, 2][(v >> 1) % 3]] } : { jacket: ["#4a5a7a", "#6a5a3a", "#3a5a4a"][(v >> 1) % 3], pants: "#3a3a40", boots: "#1e1a16", hat: "fedora", hatCol: HATS[(v >> 1) % 5], moustache: "#4a3222", skin: SKINS[[1, 0, 3][(v >> 1) % 3]] };
const MARK: Outfit = { jacket: "#7a6a4a", pants: "#7a6a4a", boots: "#3a2a1e", hat: "fedora", hatCol: "#8a7a5a", buttons: "#c9ccd2", skin: SKINS[1], build: "stout" };
const MARK_V = (v: number): Outfit => ({ ...MARK, jacket: ["#7a6a4a", "#4a5a6a"][v % 2], pants: ["#7a6a4a", "#4a5a6a"][v % 2], skin: SKINS[[1, 2][v % 2]], moustache: v % 2 ? "#3a2a1a" : undefined });
const WORKER: Outfit = { jacket: "#3a5a8a", pants: "#3a4a6a", boots: "#2a1e16", hat: "cap", cap: "#2a3a5a", skin: SKINS[2], moustache: "#3a2a1e" };
const GENDARME: Outfit = { jacket: "#2a3050", pants: "#2a3050", boots: "#1e1a16", hat: "peaked", hatCol: "#2a3050", buttons: "#e8c45a", moustache: "#3a2a1a", skin: SKINS[0] };
const CAPONE: Outfit = { jacket: "#3a3a4a", pants: "#3a3a4a", boots: "#1e1a16", hat: "fedora", hatCol: "#e8e2d4", trim: "#2a2a30", buttons: "#c9ccd2", skin: SKINS[1], build: "stout", scar: true };
const GOON = (v: number): Outfit => ({ jacket: "#26262c", pants: "#26262c", boots: "#1e1a16", hat: "fedora", hatCol: "#1e1e24", skin: SKINS[[0, 2, 1][v % 3]], build: "stout" });
const CHEMIST: Outfit = { jacket: "#eef0f2", pants: "#4a4a52", boots: "#2a1e16", hat: "hair", hair: "#8a8a8a", skin: SKINS[0], moustache: "#8a8a8a" };
const TELLER: Outfit = { jacket: "#f4f1ea", pants: "#3a3a40", boots: "#1e1a16", hat: "cap", cap: "#2f5a3a", skin: SKINS[1] };
const AGENT = (v: number): Outfit => ({ jacket: ["#5a5e66", "#4a4e56", "#62605a"][v % 3], pants: ["#5a5e66", "#4a4e56", "#62605a"][v % 3], boots: "#1e1a16", hat: "fedora", hatCol: "#3a3e46", skin: SKINS[[0, 1, 0][v % 3]], moustache: v === 1 ? "#3a2a1a" : undefined });
const GIRL: Outfit = { jacket: "#f4e8d0", pants: "#f4e8d0", boots: "#3a2a1e", dress: "#c0353a", hat: "hair", hair: "#1e1a1c", skin: SKINS[0] };
const JUDGE: Outfit = { jacket: "#1e1a1c", pants: "#1e1a1c", boots: "#1e1a16", hat: "hair", hair: "#e8e8e8", skin: SKINS[0], build: "stout" };
const GUARD: Outfit = { jacket: "#3a4a5a", pants: "#3a4a5a", boots: "#1e1a16", hat: "peaked", hatCol: "#3a4a5a", buttons: "#e8c45a", skin: SKINS[1] };


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
/** the Eiffel Tower: four tapering lattice legs, base arches, three platforms, antenna. Base centre (x, z), height H */
const eiffel = (b: Batch, x: number, z: number, H: number, col = "#8a6a4a") => {
  const Mt = lam("eiffel" + col, () => ({ color: col })), Md = lam("eiffelD" + col, () => ({ color: "#6a4e36" }));
  const lv = [[0, 0.25], [0.2, 0.13], [0.4, 0.068], [0.62, 0.04], [0.92, 0.012]]; // [height frac, half-width frac]
  const P = (k: number, sx: number, sz: number) => V(x + sx * lv[k][1] * H, lv[k][0] * H, z + sz * lv[k][1] * H);
  const cs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let k = 0; k < lv.length - 1; k++) {
    const r = 0.012 * H * (1 - 0.7 * k / lv.length);
    for (const [sx, sz] of cs) b.add(beamBetween(P(k, sx, sz), P(k + 1, sx, sz), r, 6), Mt);
    for (let f = 0; f < 4; f++) { // X bracing on each face
      const [ax, az] = cs[f], [bx, bz] = cs[(f + 1) % 4], rr = r * 0.35;
      b.add(beamBetween(P(k, ax, az), P(k + 1, bx, bz), rr, 4), Md); b.add(beamBetween(P(k, bx, bz), P(k + 1, ax, az), rr, 4), Md);
    }
  }
  for (const k of [1, 2, 4]) { const y = lv[k][0] * H, w = lv[k][1] * H * 1.25; b.add(boxGeo(V(x - w, y - 0.012 * H, z - w), V(x + w, y + 0.012 * H, z + w)), Mt); }
  for (let f = 0; f < 4; f++) { // base arches
    const [ax, az] = cs[f], [bx, bz] = cs[(f + 1) % 4], mx = (ax + bx) / 2, mz = (az + bz) / 2, hw = lv[0][1] * H * 0.82;
    const g = new THREE.TorusGeometry(hw, 0.008 * H, 6, 24, Math.PI).scale(1, 0.75, 1);
    b.add(g, Mt, new THREE.Matrix4().compose(V(x + mx * lv[0][1] * H * 0.92, 0.04 * H, z + mz * lv[0][1] * H * 0.92), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), mx !== 0 ? Math.PI / 2 : 0), V(1, 1, 1)));
  }
  b.add(new THREE.CylinderGeometry(0.004 * H, 0.008 * H, 0.1 * H, 6).translate(x, 0.97 * H, z), Md);
};
/** a block building with a window facade on the front (+z) */
const bldg = (b: Batch, x: number, z: number, w: number, h: number, d: number, st: { wall: string; shutter: string; brick?: boolean }, key: string, roof = "#5a5a66") => {
  const W = lam("bw" + st.wall, () => ({ color: st.brick ? "#a8583a" : st.wall }));
  b.add(boxGeo(V(x - w / 2, 0, z - d), V(x + w / 2, h, z)), W);
  const F = lam("bf" + key, () => ({ map: facadeHD("bf" + key, w, h, { ...st, door: true }) }));
  b.add(quad(V(x - w / 2, 0, z + 0.02), V(x + w / 2, 0, z + 0.02), V(x + w / 2, h, z + 0.02), V(x - w / 2, h, z + 0.02)), F);
  b.add(boxGeo(V(x - w / 2 - 0.2, h, z - d - 0.2), V(x + w / 2 + 0.2, h + 0.4, z + 0.25)), lam("roofB" + roof, () => ({ color: roof })));
};
const lamp = (b: Batch, x: number, z: number) => {
  const D = lam("lampIron", () => ({ color: "#2a2a30" }));
  b.add(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 8).translate(0, 1.4, 0), D, M4(x, 0, z));
  b.add(new THREE.SphereGeometry(0.2, 12, 8).translate(0, 2.95, 0), lam("lampGlobe", () => ({ color: "#f6e6a8", emissive: "#f6d27a", emissiveIntensity: 0.6 })), M4(x, 0, z));
};
const table = (b: Batch, x: number, z: number, w: number, d: number, h = 0.78, col = "#6a4024", cloth?: string) => {
  const T = lam("tbl" + col, () => ({ color: col }));
  b.add(boxGeo(V(x - w / 2, h - 0.06, z - d / 2), V(x + w / 2, h, z + d / 2)), cloth ? lam("cloth" + cloth, () => ({ color: cloth })) : T);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(boxGeo(V(x + sx * (w / 2 - 0.1) - 0.04, 0, z + sz * (d / 2 - 0.1) - 0.04), V(x + sx * (w / 2 - 0.1) + 0.04, h - 0.06, z + sz * (d / 2 - 0.1) + 0.04)), T);
};
const cafeTable = (b: Batch, x: number, z: number) => {
  b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20).translate(0, 0.74, 0), lam("cafeTop", () => ({ color: "#e9e2cc" })), M4(x, 0, z));
  b.add(new THREE.CylinderGeometry(0.04, 0.06, 0.74, 8).translate(0, 0.37, 0), lam("lampIron", () => ({ color: "#2a2a30" })), M4(x, 0, z));
};
/** interior room: floor, back wall at z0 with window openings [xc, w], side walls, skirting, pilasters */
const room = (b: Batch, z0: number, half: number, H: number, wall: string, floor: THREE.Material, wins: [number, number][], winY = [0.9, 3.2]) => {
  const W = lam("wall" + wall, () => ({ color: wall })), Tr = lam("trim" + wall, () => ({ color: "#f2ead8" }));
  b.add(plane(-half, half, z0, 8, 1, 0.0), floor);
  const xs = [-half, ...wins.flatMap(([c, w]) => [c - w / 2, c + w / 2]), half];
  for (let i = 0; i < xs.length; i += 2) b.add(boxGeo(V(xs[i], 0, z0 - 0.3), V(xs[i + 1], H, z0)), W);
  for (const [c, w] of wins) { b.add(boxGeo(V(c - w / 2, 0, z0 - 0.3), V(c + w / 2, winY[0], z0)), W); b.add(boxGeo(V(c - w / 2, winY[1], z0 - 0.3), V(c + w / 2, H, z0)), W);
    for (const dx of [-w / 2, 0, w / 2]) b.add(boxGeo(V(c + dx - 0.05, winY[0], z0 - 0.2), V(c + dx + 0.05, winY[1], z0 - 0.1)), Tr);
    for (const yy of [winY[0], (winY[0] + winY[1]) / 2, winY[1]]) b.add(boxGeo(V(c - w / 2, yy - 0.05, z0 - 0.2), V(c + w / 2, yy + 0.05, z0 - 0.1)), Tr); }
  for (const s of [-1, 1]) b.add(boxGeo(V(s * half - (s > 0 ? 0 : 0.3), 0, z0 - 0.3), V(s * half + (s > 0 ? 0.3 : 0), H, 8)), W);
  b.add(boxGeo(V(-half, 0, z0 - 0.02), V(half, 0.16, z0 + 0.04)), Tr);
};
const chandelier = (b: Batch, x: number, y: number, z: number) => {
  const G = lam("gold", () => ({ color: "#d8b84a" }));
  b.add(new THREE.TorusGeometry(0.55, 0.04, 8, 24).rotateX(Math.PI / 2), G, M4(x, y, z));
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6).translate(0, 0.7, 0), G, M4(x, y, z));
  for (let k = 0; k < 8; k++) b.add(new THREE.SphereGeometry(0.07, 8, 6), lam("bulbC", () => ({ color: "#fff2c0", emissive: "#ffe08a", emissiveIntensity: 0.8 })), M4(x + 0.55 * Math.cos(k * 0.785), y + 0.08, z + 0.55 * Math.sin(k * 0.785)));
};
const shelf = (b: Batch, x: number, z: number, w = 1.6, h = 2.4) => {
  const Wd = lam("shelfWood", () => ({ color: "#5a3a24" }));
  b.add(boxGeo(V(x - w / 2, 0, z - 0.4), V(x + w / 2, h, z)), Wd);
  const cols = ["#8a2f3a", "#2f4a6a", "#3a6a3a", "#c9a84a", "#5a3a6a"];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) b.add(boxGeo(V(x - w / 2 + 0.1 + k * 0.155, 0.2 + r * 0.56, z + 0.01), V(x - w / 2 + 0.23 + k * 0.155, 0.6 + r * 0.56 - 0.06 * (k % 3), z + 0.04)), lam("book" + cols[(k + r) % 5], () => ({ color: cols[(k + r) % 5] })));
};
const railing = (b: Batch, x0: number, x1: number, z: number, h = 1.05) => {
  const Wh = lam("rail", () => ({ color: "#f2ead8" }));
  b.add(boxGeo(V(x0, h - 0.06, z - 0.06), V(x1, h, z + 0.06)), lam("railTop", () => ({ color: "#8a5a34" })));
  for (let x = x0; x <= x1; x += 0.6) b.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, h, z + 0.03)), Wh);
  b.add(boxGeo(V(x0, h * 0.5 - 0.02, z - 0.02), V(x1, h * 0.5 + 0.02, z + 0.02)), Wh);
};
const train = (b: Batch, x: number, z: number) => {
  const Bk = lam("loco", () => ({ color: "#2a2a30" })), Rd = lam("locoRed", () => ({ color: "#9a2a2a" })), Gr = lam("coach", () => ({ color: "#2f5a3a" }));
  b.add(new THREE.CylinderGeometry(0.85, 0.85, 4.2, 16).rotateZ(Math.PI / 2).translate(x + 2.2, 1.7, z), Bk);
  b.add(boxGeo(V(x - 0.6, 0.6, z - 1.1), V(x + 0.6, 3.2, z + 1.1)), Bk);
  b.add(new THREE.CylinderGeometry(0.28, 0.36, 1.0, 12).translate(x + 3.6, 3.0, z), Bk);
  b.add(boxGeo(V(x - 0.6, 0.4, z - 1.2), V(x + 4.6, 0.7, z + 1.2)), Rd);
  for (let k = 0; k < 3; k++) { const cx = x - 2.0 - 7.2 * k; b.add(boxGeo(V(cx - 6.8, 0.6, z - 1.3), V(cx, 3.4, z + 1.3)), Gr);
    b.add(boxGeo(V(cx - 6.6, 1.8, z + 1.31), V(cx - 0.2, 2.7, z + 1.33)), lam("coachWin", () => ({ color: "#e8d8a0", emissive: "#e8c870", emissiveIntensity: 0.2 }))); }
  for (let k = 0; k < 12; k++) b.add(new THREE.CylinderGeometry(0.45, 0.45, 0.2, 14).rotateX(Math.PI / 2), lam("wheelT", () => ({ color: "#1e1e22" })), M4(x + 4 - 2.0 * k, 0.45, z + 1.25));
};
const parquet = () => lam("parquet", () => ({ map: rep(planksHD(), 3, 3), color: "#c89a6a" }));
const cobble = () => stoneHD("cobbleP", ["#b8aa94", "#ab9d88", "#c4b6a0", "#a09280"], "#7e7262");
const ST = { cream: { wall: "#ecdab2", shutter: "#3f6fb5" }, grey: { wall: "#d8d0c4", shutter: "#2f5f6a" }, brick: { wall: "#e3d2b8", shutter: "#2f6a43", brick: true }, sand: { wall: "#e2c49a", shutter: "#8c3b4a" } };
const HOTEL: RoomStyle = { key: "hotel", paper: ["#ead7aa", "#d6bb82", "#dcc58e"], wood: "#6a3e22", trim: "#f2e6c8", floor: ["#a8703e", "#b87e48", "#9a6436", "#c08a52"],
  rug: ["#7a1e2a", "#1e2a4a", "#d8a84a", "#ead8b0"], rugW: 8.4, rugD: 4.6, rugZ: -2.3, drape: "#7a1e2a" };
const OFFICE: RoomStyle = { key: "office", paper: ["#41604c", "#35523f", "#3a5944"], wood: "#5a3420", trim: "#e8dcc0", floor: ["#7a4a28", "#8a5630", "#6a3e20", "#946038"],
  rug: ["#2a3a5a", "#7a2a2a", "#c9a24a", "#e2d4b0"], rugW: 5.4, rugD: 3.4, rugZ: -2.2, drape: "#5a2a2a", art: [0.2, 4.55] };
const CAPONE_R: RoomStyle = { key: "capone", paper: ["#6e2024", "#561519", "#601a1e"], wood: "#3a2014", trim: "#c9a24a", floor: ["#4a2a18", "#56301c", "#3e2414", "#5e3820"],
  rug: ["#1e3a2e", "#5a1a1a", "#c9a24a", "#e2d0a0"], rugW: 6.4, rugD: 3.8, rugZ: -2.3, drape: "#1e3a2e", art: [0.4, -5.2, 5.2] };
const parisStreet = (b: Batch, kit: Kit) => {
  b.add(plane(-300, 300, -300, 60, 1), lam("parisGrass", () => ({ map: grassHD() })));
  b.add(plane(-40, 40, -14, 8, 1, 0.01), lam("parisCobble", () => ({ map: rep(cobble(), 10, 6) })));
  b.add(plane(-40, 40, -14, -10.5, 2, 0.03), lam("slab", () => ({ map: slabHD() })));
  eiffel(b, 0, -62, 60);
  const AW: [string, string, string][] = [["CAFÉ", "#b8303a", "#f4ead2"], ["TABAC", "#2f5a3a", "#f4ead2"], ["BOULANGERIE", "#c9a24a", "#3a2a1a"], ["FLEURS", "#3a5a8a", "#f4ead2"], ["BISTRO", "#7a1e2a", "#f4ead2"], ["LIBRAIRIE", "#2f4a3a", "#e8c45a"]];
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    const x = sx * (19 + 11 * k), z = -12 - 6 * k, h = 13 + 2 * k;
    bldg(b, x, z, 10, h, 8, k % 2 ? ST.grey : ST.cream, `pp${sx}${k}`, "#6a7080");
    haussmann(b, x, z, 10, h, 8);
    const [n, c1, c2] = AW[(k * 2 + (sx > 0 ? 1 : 0)) % AW.length];
    awning(b, x, z, 7, 3.2, n, c1, c2);
  }
  // distant Paris skyline either side of the tower (hazed by fog)
  for (let k = 0; k < 10; k++) for (const sx of [-1, 1]) {
    const x = sx * (16 + k * 9 + 3 * hh(k, sx + 3)), z = -44 - 10 * hh(k, sx + 5), h = 12 + 5 * hh(k, sx + 7);
    bldg(b, x, z, 8.5, h, 8, hh(k, sx) > 0.5 ? ST.cream : ST.grey, `sky${sx}${k % 4}`, "#6a7080");
    haussmann(b, x, z, 8.5, h, 8);
  }
  for (let k = -6; k <= 6; k++) if (Math.abs(k) > 1) prop(b, kit, "tree_fat", k * 4.2, 0, -14 - 0.8 * hh(k, 2), 4 + hh(k, 3));
  for (const x of [-5, 5, -13, 13]) streetLamp(b, x, -3.8);
  morris(b, -9.5, -7.5);
  bench(b, 9.5, -7.2); bench(b, -15, -7.2);
  cafeTable(b, -3.4, -2.6); cafeTable(b, 3.6, -2.8);
  for (const [x, z] of [[-4.3, -2.2], [-2.6, -3.1], [2.8, -2.2], [4.5, -3.2]]) chair(b, x, z, Math.atan2(-3.4 - x, -2.6 - z), "#2a2a30", "#2a2a30");
  backHills(b, 120, 12, 12, 7, lam("hillParis", () => ({ color: "#7aa25a" })));
};
export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  hotel: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, -5, 1, -0.02), lam("parisGround", () => ({ map: grassHD() })));
    room2(b, HOTEL, -4.6, 7, 4.6, [[-3.4, 1.6], [0, 1.6], [3.4, 1.6]]);
    for (const x of [-1.7, 1.7]) { b.add(boxGeo(V(x - 0.22, 0, -4.6), V(x + 0.22, 4.6, -4.36)), lam("pilaster", () => ({ color: "#f2ead8" }))); b.add(boxGeo(V(x - 0.3, 4.0, -4.6), V(x + 0.3, 4.3, -4.3)), lam("pilaster", () => ({ color: "#f2ead8" }))); }
    table2(b, 0, -2.5, 5.4, 1.1, 0.8, "#4a2a18", "#2f5a3a");
    for (const sx of [-1, 1]) chair(b, sx * 3.05, -2.5, -sx * Math.PI / 2);
    chandelier2(b, 0, 3.4, -1.9);
    for (const x of [-6.2, 6.2]) pottedPalm(b, x, -3.7, 1.9);
    eiffel(b, 2.0, -70, 75);
    for (let k = -4; k <= 4; k++) if (k !== 0) { const z = -30 - 4 * hh(k, 1), h = 5 + 2 * hh(k, 2) + 6; bldg(b, k * 14, z, 12, h, 8, ST.cream, `hp${k}`, "#6a7080"); haussmann(b, k * 14, z, 12, h, 8); }
  },
  paris: (s) => parisStreet(s.b, s.kit),
  village: (s) => {
    const { b, kit } = s;
    b.add(plane(-300, 300, -300, 60, 1), lam("vGrass", () => ({ map: grassHD() })));
    b.add(plane(-20, 20, -7, 6, 1, 0.01), lam("vPath", () => ({ map: rep(earthHD(), 4, 3) })));
    [-12, -6.5, 6, 11.5].forEach((x, i) => house(b, x, -9 - 0.6 * (i % 2), 0, 4.6, 4.2, 3.6 + 0.6 * hh(i, 2), [3, 0, 4, 3][i]));
    b.add(boxGeo(V(-1.4, 0, -16), V(1.4, 9, -13.4)), lam("church", () => ({ map: rep(stoneHD("churchSt"), 1, 3) })));
    b.add(new THREE.SphereGeometry(1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.4, 1).translate(0, 9, -14.7), lam("onion", () => ({ color: "#3a6a4a" })));
    b.add(new THREE.ConeGeometry(0.3, 1.6, 8).translate(0, 11.6, -14.7), lam("onion", () => ({ color: "#3a6a4a" })));
    b.add(new THREE.TorusGeometry(0.5, 0.05, 6, 16).translate(0, 7, -13.38), lam("gold", () => ({ color: "#d8b84a" })));
    // nave behind the tower: walls, pitched roof, arched windows, door
    b.add(boxGeo(V(-3.6, 0, -26), V(3.6, 5.2, -16)), lam("church", () => ({ map: rep(stoneHD("churchSt"), 1, 3) })));
    b.add(new THREE.CylinderGeometry(3.9, 3.9, 10.4, 3, 1).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 0.55, 1).translate(0, 5.2 + 1.95 * 0.55, -21), lam("roofCh", () => ({ color: "#7a3d2c" })));
    const dark = lam("chWin", () => ({ color: "#2a3040" }));
    for (const yy of [3.2, 6.2]) { b.add(boxGeo(V(-0.32, yy, -13.42), V(0.32, yy + 1.1, -13.38)), dark); b.add(new THREE.CircleGeometry(0.32, 12, 0, Math.PI).translate(0, yy + 1.1, -13.37), dark); }
    b.add(boxGeo(V(-0.6, 0, -13.42), V(0.6, 2.0, -13.37)), lam("chDoor", () => ({ color: "#5a3420" })));
    b.add(new THREE.CircleGeometry(0.6, 12, 0, Math.PI).translate(0, 2.0, -13.36), lam("chDoor", () => ({ color: "#5a3420" })));
    for (const sx of [-1, 1]) for (const zz of [-18, -21, -24]) b.add(boxGeo(V(sx * 3.62 - 0.02, 2.0, zz - 0.4), V(sx * 3.62 + 0.02, 3.8, zz + 0.4)), dark);
    for (let k = -8; k <= 8; k++) prop(b, kit, "tree_fat", k * 6 + 2, 0, -24 - 4 * hh(k, 3), 6 + 2 * hh(k, 4));
    backHills(b, 90, 12, 16, 5, lam("hillV", () => ({ color: "#6f9a4e" })));
    for (let x = -9; x <= 9; x += 1.1) if (Math.abs(x) > 2.5) b.add(boxGeo(V(x - 0.05, 0, -5.5), V(x + 0.05, 0.9, -5.4)), lam("fence", () => ({ color: "#8a6a44" })));
    b.add(boxGeo(V(-9, 0.55, -5.48), V(-2.5, 0.62, -5.42)), lam("fence", () => ({ color: "#8a6a44" }))); b.add(boxGeo(V(2.5, 0.55, -5.48), V(9, 0.62, -5.42)), lam("fence", () => ({ color: "#8a6a44" })));
    // well, haystacks, cart
    b.add(new THREE.CylinderGeometry(0.7, 0.75, 0.8, 16, 1, true).translate(-4.2, 0.4, -6.6), lam("well", () => ({ map: rep(stoneHD("wellSt"), 2, 1), side: THREE.DoubleSide })));
    for (const sx of [-1, 1]) b.add(boxGeo(V(-4.2 + sx * 0.75 - 0.06, 0.8, -6.66), V(-4.2 + sx * 0.75 + 0.06, 2.0, -6.54)), lam("fence", () => ({ color: "#8a6a44" })));
    b.add(new THREE.ConeGeometry(1.1, 0.7, 4).rotateY(Math.PI / 4).translate(-4.2, 2.3, -6.6), lam("wellRoof", () => ({ color: "#8a4a2a" })));
    for (const [x, z, s2] of [[8.5, -7.2, 1.0], [10, -6.4, 0.8], [-10.5, -7, 0.9]]) b.add(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(s2, 1.3 * s2, s2).translate(x, 0, z), lam("hay", () => ({ color: "#e0b85a" })));
    cart(b, 5.8, -6.4, 0.4);
  },
  liner: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, 300, 40, -2.0), lam("ocean", () => ({ map: rep(water(), 60, 60), color: "#5a8ab0" })));
    b.add(plane(-14, 14, -4.2, 6, 1, 0.0), lam("deck", () => ({ map: rep(planksHD(), 4, 2), color: "#d8b88a" })));
    railing(b, -14, 14, -4.2);
    for (const x of [-11, -6.5, 6.5, 11]) lifeRing(b, x, 0.62, -4.08);
    for (const [x, c] of [[-7, "#e8e0d0"], [7, "#e8e0d0"]] as [number, string][]) {
      b.add(boxGeo(V(x - 3, 0, 1.5), V(x + 3, 3.2, 6)), lam("cabin", () => ({ color: c })));
      for (let k = 0; k < 5; k++) b.add(new THREE.TorusGeometry(0.2, 0.05, 6, 14), lam("brass", () => ({ color: "#c9a24a" })), M4(x - 2.4 + k * 1.2, 2.0, 1.48));
      lifeboat(b, x, 3.9, 3.0, 4.8);
    }
    for (const x of [-9, -3, 3, 9]) { b.add(new THREE.CylinderGeometry(1.1, 1.2, 6, 16).translate(x, 6, 4), lam("funnel", () => ({ color: "#d86a2a" }))); b.add(new THREE.CylinderGeometry(1.12, 1.12, 1.4, 16).translate(x, 8.4, 4), lam("funnelTop", () => ({ color: "#1e1a1c" }))); }
    table2(b, 0, -1.9, 1.4, 0.9, 0.76, "#5a3420", "#2f5a3a");
    for (const sx of [-1, 1]) chair(b, sx * 1.0, -1.9, -sx * Math.PI / 2, "#5a3420", "#2f5a3a");
    for (const x of [-4.6, 4.8, -9.5, 9.5]) { b.add(boxGeo(V(x - 0.35, 0.3, -3.3), V(x + 0.35, 0.36, -2.0)), lam("deckChair", () => ({ color: "#a8784a" }))); b.add(boxGeo(V(x - 0.35, 0.36, -3.4), V(x + 0.35, 1.0, -3.2)), lam("deckChair", () => ({ color: "#a8784a" }))); b.add(boxGeo(V(x - 0.3, 0.37, -3.15), V(x + 0.3, 0.4, -2.1)), lam("cushion", () => ({ color: "#3a5a8a" }))); }
    for (const x of [-12.5, 12.5]) pottedPalm(b, x, -3.4, 1.6);
  },
  station: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, 60, 1), lam("stGround", () => ({ color: "#6a6a62" })));
    b.add(boxGeo(V(-30, 0, -3.6), V(30, 0.5, 6)), lam("platform", () => ({ map: rep(cobble(), 10, 4), color: "#c8c0b0" })));
    b.add(boxGeo(V(-30, 0.5, -3.6), V(30, 0.52, -3.3)), lam("platEdge", () => ({ color: "#e8d24a" })));
    for (const zz of [-5.4, -7.0]) b.add(boxGeo(V(-60, 0.0, zz - 0.06), V(60, 0.14, zz + 0.06)), lam("track", () => ({ color: "#5a5a60" })));
    for (let x = -40; x <= 40; x += 0.8) b.add(boxGeo(V(x - 0.12, 0, -7.6), V(x + 0.12, 0.06, -4.8)), lam("sleeper", () => ({ color: "#4a3a2a" })));
    train(b, 4, -6.2);
    const Ir = lam("truss", () => ({ color: "#3a4048" }));
    for (let x = -24; x <= 24; x += 6) {
      b.add(new THREE.CylinderGeometry(0.12, 0.14, 6, 8).translate(x, 3.0 + 0.5, -3.0), Ir);
      b.add(new THREE.TorusGeometry(7, 0.1, 6, 32, Math.PI).translate(0, 0, 0).rotateY(Math.PI / 2).translate(x, 6.3, -3), Ir);
    }
    b.add(boxGeo(V(-30, 12.9, -10.5), V(30, 13.1, 4)), lam("stGlass", () => ({ color: "#a8b8c8", transparent: true, opacity: 0.35 })));
    for (const z of [-9, -5, -1, 3]) b.add(boxGeo(V(-30, 12.6 - Math.abs(z + 3) * 0.6, z - 0.06), V(30, 12.7 - Math.abs(z + 3) * 0.6, z + 0.06)), Ir);
    bldg(b, -6, -14, 20, 10, 6, ST.sand, "station", "#5a5a66");
    // hanging clock + departures board
    b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24).rotateX(Math.PI / 2).translate(-0.5, 4.6, -2.9), lam("clockF", () => ({ map: clockFace() })));
    b.add(new THREE.TorusGeometry(0.52, 0.05, 6, 24).translate(-0.5, 4.6, -2.82), lam("gold", () => ({ color: "#d8b84a" })));
    b.add(boxGeo(V(-0.52, 5.1, -2.95), V(-0.48, 6.3, -2.85)), Ir);
    b.add(quad(V(4.2, 3.6, -2.9), V(7.8, 3.6, -2.9), V(7.8, 4.5, -2.9), V(4.2, 4.5, -2.9)), lam("depart", () => ({ map: signHD("PARIS — VIENNE", "#1e2a3a", "#e8c45a") })));
    for (const x of [-7.5, 8.5]) bench(b, x, 1.0, Math.PI);
    for (const [x, z, s2] of [[-10, -1.6, 0.7], [-9.3, -1.5, 0.5], [-9.7, -1.0, 0.45]]) b.add(boxGeo(V(x - s2 / 2, 0.5, z - 0.25), V(x + s2 / 2, 0.5 + s2 * 0.7, z + 0.25)), lam("trunk", () => ({ color: "#7a4a2a" })));
    for (const x of [-12, 12]) streetLamp(b, x, 2.2, 3.4);
  },
  office: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, -5, 1, -0.02), lam("offOut", () => ({ color: "#8a9a7a" })));
    room2(b, OFFICE, -4.2, 6.5, 3.8, [[2.4, 1.6]]);
    table2(b, 0.2, -2.7, 2.6, 1.0, 0.8, "#4a2814", undefined, false);
    chair(b, 0.2, -3.5, 0, "#3a2014", "#2a3a2a");
    bookcase(b, -2.6, -3.85); bookcase(b, -4.4, -3.85);
    // desk dressing: green banker's lamp, blotter, papers, ink
    b.add(boxGeo(V(0.9, 0.8, -2.85), V(1.2, 0.84, -2.65)), lam("lampBase", () => ({ color: "#c9a24a" })));
    b.add(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6).translate(1.05, 0.98, -2.75), lam("gold", () => ({ color: "#d8b84a" })));
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).translate(1.05, 1.15, -2.72), lam("lampShade", () => ({ color: "#2f6a43", side: THREE.DoubleSide })));
    b.add(boxGeo(V(-0.5, 0.8, -2.9), V(0.6, 0.81, -2.45)), lam("blotter", () => ({ color: "#2f4a3a" })));
    b.add(boxGeo(V(-0.3, 0.81, -2.8), V(0.1, 0.815, -2.55)), lam("paperW", () => ({ color: "#f4efe2" })));
    // filing cabinet, globe, flag
    b.add(boxGeo(V(4.0, 0, -4.15), V(4.7, 1.35, -3.5)), lam("cabinet", () => ({ color: "#5a5e52" })));
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(4.25, 0.3 + k * 0.42, -3.49), V(4.45, 0.34 + k * 0.42, -3.46)), lam("brass", () => ({ color: "#c9a24a" })));
    b.add(new THREE.SphereGeometry(0.28, 16, 12).translate(-1.2, 1.25, -3.7), lam("globe", () => ({ color: "#5a8aa8" })));
    b.add(new THREE.CylinderGeometry(0.03, 0.12, 0.9, 8).translate(-1.2, 0.45, -3.7), lam("chairW#3a2014", () => ({ color: "#3a2014" })));
    b.add(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6).translate(5.6, 1.3, -3.6), lam("gold", () => ({ color: "#d8b84a" })));
    b.add(quad(V(5.62, 1.7, -3.6), V(6.4, 1.7, -3.6), V(6.4, 2.5, -3.6), V(5.62, 2.5, -3.6)), lam("flagFR", () => ({ map: tricolor(), side: THREE.DoubleSide })));
    pottedPalm(b, -5.8, -3.6, 1.6);
    for (let k = 0; k < 3; k++) { bldg(b, -10 + 10 * k, -22, 9, 18 + 4 * k, 6, k % 2 ? ST.brick : ST.grey, `ow${k}`, "#4a4e56"); if (k % 2 === 0) haussmann(b, -10 + 10 * k, -22, 9, 18 + 4 * k, 6); }
  },
  capone: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, -5, 1, -0.02), lam("offOut", () => ({ color: "#8a9a7a" })));
    room2(b, CAPONE_R, -4.2, 6.5, 3.8, [[-2.6, 1.4], [2.6, 1.4]]);
    table2(b, 0.4, -2.6, 3.0, 1.1, 0.8, "#2a1610", undefined, false);
    // leather wing chair behind the desk
    const Lc = lam("leather", () => ({ color: "#4a1e16" }));
    b.add(boxGeo(V(-0.4, 0.4, -3.75), V(1.2, 0.6, -3.15)), Lc); b.add(boxGeo(V(-0.4, 0.6, -3.8), V(1.2, 1.9, -3.6)), Lc);
    for (const x of [-0.4, 1.05]) b.add(boxGeo(V(x, 0.6, -3.75), V(x + 0.15, 1.0, -3.15)), Lc);
    // desk dressing: cigar box, ashtray, telephone base, whisky decanter
    b.add(boxGeo(V(-0.6, 0.8, -2.8), V(-0.2, 0.9, -2.55)), lam("cigarBox", () => ({ color: "#7a3a1a" })));
    b.add(new THREE.CylinderGeometry(0.12, 0.1, 0.04, 14).translate(0.2, 0.82, -2.4), lam("glass", () => ({ color: "#cfe3ea" })));
    b.add(new THREE.CylinderGeometry(0.07, 0.09, 0.26, 12).translate(1.5, 0.93, -2.75), lam("decanter", () => ({ color: "#b8742a" })));
    for (const dx of [0, 0.16]) b.add(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 10).translate(1.25 + dx, 0.845, -2.45), lam("glass", () => ({ color: "#cfe3ea" })));
    // bar cabinet with bottles
    b.add(boxGeo(V(-6.3, 0, -4.15), V(-4.4, 1.1, -3.55)), lam("case#3a2014", () => ({ color: "#3a2014" })));
    const BC = ["#2a5a2a", "#b8742a", "#6a1e1e", "#d8c890"];
    for (let k = 0; k < 7; k++) b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.32, 10).translate(-6.1 + k * 0.26, 1.26, -3.85), lam("bottle" + BC[k % 4], () => ({ color: BC[k % 4] })));
    pottedPalm(b, 5.6, -3.6, 1.8);
    for (const sx of [-1, 1]) chair(b, 0.4 + sx * 1.0, -1.5, Math.PI, "#3a2014", "#4a1e16");
    for (let k = 0; k < 2; k++) bldg(b, -9 + 18 * k, -20, 9, 22, 6, ST.brick, `cw${k}`, "#3a3a44");
  },
  nyc: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, 60, 4), lam("asphalt", () => ({ map: asphaltHD() })));
    for (let x = -40; x < 40; x += 4) b.add(boxGeo(V(x, 0, 0.0), V(x + 2, 0.012, 0.15)), lam("laneW", () => ({ color: "#e8e2c8" })));
    b.add(boxGeo(V(-40, 0, -6.5), V(40, 0.16, -3.2), 2), lam("sidewalk", () => ({ map: slabHD() })));
    b.add(boxGeo(V(-40, 0, 3.2), V(40, 0.16, 7), 2), lam("sidewalk", () => ({ map: slabHD() })));
    const SH: [string, string, string][] = [["DELI", "#2f5a3a", "#f4ead2"], ["BARBER", "#b8303a", "#f4ead2"], ["HOTEL", "#2a2a40", "#e8c45a"], ["DINER", "#c94a2a", "#f4ead2"], ["SHOES", "#3a4a6a", "#f4ead2"], ["BANK", "#1e3a2e", "#e8c45a"]];
    for (let k = -4; k <= 4; k++) {
      const h = 14 + 10 * hh(k, 3), brickB = k % 2 !== 0;
      bldg(b, k * 9, -6.5, 8.6, h, 8, brickB ? ST.brick : ST.grey, `ny${k}`, "#3a3a44");
      if (brickB) fireEscape(b, k * 9 + 1.2, -6.5, 3.4, h);
      const [n, c1, c2] = SH[(k + 4) % SH.length]; awning(b, k * 9 - 1.5, -6.5, 4.5, 3.4, n, c1, c2);
      if (hh(k, 9) > 0.45) waterTower(b, k * 9 - 2, h + 0.4, -10);
    }
    for (let k = -3; k <= 3; k++) { const h = 40 + 30 * hh(k, 5); bldg(b, k * 16 + 4, -40, 14, h, 10, ST.grey, `nyb${k}`, "#3a3a44"); b.add(boxGeo(V(k * 16 + 4 - 4, h, -48), V(k * 16 + 4 + 4, h + 10, -42)), lam("bw#d8d0c4", () => ({ color: "#d8d0c4" }))); b.add(new THREE.ConeGeometry(2.4, 9, 4).rotateY(Math.PI / 4).translate(k * 16 + 4, h + 14.5, -45), lam("spire", () => ({ color: "#c8c4bc" }))); }
    for (const x of [-12, -6, 0, 6, 12]) streetLamp(b, x, -3.7, 4.0);
    for (const x of [-8.4, 7.6]) { b.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10).translate(x, 0.46, -3.6), lam("hydrant", () => ({ color: "#c0353a" }))); b.add(new THREE.SphereGeometry(0.13, 10, 6).translate(x, 0.76, -3.6), lam("hydrant", () => ({ color: "#c0353a" }))); }
  },
  alcatraz: (s) => {
    const { b } = s;
    b.add(plane(-400, 400, -400, 400, 40, -0.4), lam("bay", () => ({ map: rep(water(), 80, 80), color: "#4a7aa0" })));
    b.add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(60, 14, 30), lam("isle", () => ({ map: rep(stoneHD("isleSt"), 6, 3), flatShading: true })), M4(0, -2, -110));
    b.add(boxGeo(V(-28, 10, -118), V(22, 22, -104)), lam("cellhouse", () => ({ color: "#e8e2d6" })));
    for (let k = 0; k < 12; k++) b.add(boxGeo(V(-26 + 4 * k, 14, -103.9), V(-24.6 + 4 * k, 19, -103.8)), lam("cellWin", () => ({ color: "#3a3a44" })));
    b.add(new THREE.CylinderGeometry(1.2, 1.6, 18, 10).translate(30, 18, -108), lam("lighthouse", () => ({ color: "#f4f1ea" })));
    b.add(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 10).translate(30, 28, -108), lam("lightRoom", () => ({ color: "#fff2c0", emissive: "#ffe08a", emissiveIntensity: 0.6 })));
    b.add(new THREE.ConeGeometry(1.6, 1.6, 10).translate(30, 30, -108), lam("lightCap", () => ({ color: "#2a2a30" })));
    b.add(boxGeo(V(-8, -0.4, -3.6), V(8, 0.3, 4)), lam("dock", () => ({ map: rep(planksHD(), 3, 2), color: "#a8885a" })));
    for (let x = -7.5; x <= 7.5; x += 2.5) b.add(new THREE.CylinderGeometry(0.16, 0.18, 1.2, 8).translate(x, 0.3, -3.5), lam("piling", () => ({ color: "#5a4a3a" })));
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 15.2, 6).rotateZ(Math.PI / 2).translate(0, 0.75, -3.5), lam("rope", () => ({ color: "#c8b48a" })));
    backHills(b, 260, 10, 30, 3, lam("hillBay", () => ({ color: "#7a8a6a" })));
  },
  cell: (s) => {
    const { b } = s;
    const St = lam("cellStone", () => ({ map: cellStoneHD() }));
    b.add(plane(-4, 4, -3.6, 8, 2), lam("cellFloor", () => ({ map: concreteHD("cell", "#7a7872") })));
    const z0 = -3.6, H = 3.4;
    wbox(b, St, -4, 0, z0 - 0.3, 0.4, H, z0, 2, 2); wbox(b, St, 1.2, 0, z0 - 0.3, 4, H, z0, 2, 2);
    wbox(b, St, 0.4, 0, z0 - 0.3, 1.2, 2.0, z0, 2, 2); wbox(b, St, 0.4, 2.8, z0 - 0.3, 1.2, H, z0, 2, 2);
    for (let x = 0.5; x < 1.2; x += 0.16) b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6).translate(x, 2.4, z0 - 0.15), lam("bars", () => ({ color: "#3a3a40" })));
    for (const sd of [-1, 1]) wbox(b, St, sd < 0 ? -4.3 : 4, 0, z0, sd < 0 ? -4 : 4.3, H, 8, 2, 2);
    // bunk with a striped blanket, pillow, bucket, tin cup, scratched tally marks
    const Ir = lam("bunkIron", () => ({ color: "#4a5460" }));
    b.add(boxGeo(V(-2.7, 0.42, -3.55), V(-0.5, 0.48, -2.6)), Ir);
    for (const x of [-2.65, -0.55]) for (const z of [-3.5, -2.65]) b.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.48, z + 0.03)), Ir);
    b.add(boxGeo(V(-2.65, 0.48, -3.5), V(-0.55, 0.6, -2.65)), lam("blanket", () => ({ map: blanketTex() })));
    b.add(boxGeo(V(-2.6, 0.6, -3.45), V(-2.1, 0.72, -2.7)), lam("pillow", () => ({ color: "#e8e2d4" })));
    b.add(new THREE.CylinderGeometry(0.18, 0.15, 0.36, 12, 1, true).translate(2.6, 0.18, -3.2), lam("bucket", () => ({ color: "#6a6e70", side: THREE.DoubleSide })));
    b.add(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 10).translate(-0.3, 0.05, -3.3), lam("cup", () => ({ color: "#8a8e90" })));
    b.add(quad(V(2.0, 1.3, z0 + 0.01), V(3.2, 1.3, z0 + 0.01), V(3.2, 2.0, z0 + 0.01), V(2.0, 2.0, z0 + 0.01)), lam("tally", () => ({ map: tallyTex(), transparent: true })));
    for (let x = -4; x <= 4; x += 0.32) b.add(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6).translate(x, 1.7, 1.2), lam("bars", () => ({ color: "#3a3a40" })));
    b.add(boxGeo(V(-4, 3.2, 1.15), V(4, 3.4, 1.25)), lam("bars", () => ({ color: "#3a3a40" })));
    b.add(boxGeo(V(-4, 1.1, 1.17), V(4, 1.16, 1.23)), lam("bars", () => ({ color: "#3a3a40" })));
  },
};
const clockFace = () => ctex("clockFace", 256, 256, (g) => {
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#1e1e24"; g.lineWidth = 6;
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(128 + 100 * Math.cos(a), 128 + 100 * Math.sin(a)); g.lineTo(128 + 116 * Math.cos(a), 128 + 116 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 150); g.stroke();
});
const tricolor = () => ctex("tricolor", 300, 200, (g) => { g.fillStyle = "#2f4a9a"; g.fillRect(0, 0, 100, 200); g.fillStyle = "#f4f1ea"; g.fillRect(100, 0, 100, 200); g.fillStyle = "#c0353a"; g.fillRect(200, 0, 100, 200); });
const blanketTex = () => ctex("blanket", 256, 256, (g) => { g.fillStyle = "#6a6a5a"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#4a4a3e"; for (let y = 20; y < 256; y += 64) g.fillRect(0, y, 256, 14); });
const tallyTex = () => ctex("tally", 512, 300, (g) => {
  g.strokeStyle = "rgba(40,38,34,0.75)"; g.lineWidth = 5; g.lineCap = "round";
  for (let grp = 0; grp < 8; grp++) { const x0 = 20 + (grp % 4) * 120, y0 = 30 + Math.floor(grp / 4) * 140;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x0 + k * 20, y0); g.lineTo(x0 + k * 20 + 3, y0 + 90); g.stroke(); }
    g.beginPath(); g.moveTo(x0 - 8, y0 + 70); g.lineTo(x0 + 72, y0 + 20); g.stroke(); }
});

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- staging helpers ----------------
type StageFn = (c: Ctx) => void;
const A = (l: number, w: string, n = 0) => (n ? atN(l, w, n) : at(l, w));
const LS = lineStart;
/** stand a row of people at z, x positions, with an expression rule */
const crowd = (c: Ctx, i0: number, mk: (k: number) => Outfit, key: string, xs: number[], z: number, fo: (k: number) => FrontOpts & Act, dz = 0.25) =>
  xs.forEach((x, k) => pose(c, i0 + k, mk(k), `${key}${k}`, x, z - dz * (k % 2), fo(k)));
const insert = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, w = 1.3) => card(c, key, cw, ch, draw, INSP, w, (w * ch) / cw);
const dealers = (c: Ctx, expr: (k: number) => FrontOpts["expr"], extra: (k: number) => Partial<FrontOpts & Act> = () => ({})) =>
  crowd(c, 10, (k) => DEALER(k), "dealer", [-1.9, -0.95, 0, 0.95, 1.9], -3.05, (k) => ({ mode: "stand", expr: expr(k), look: k < 2 ? -1 : k > 2 ? -1 : -1, ...extra(k) }), 0.0);
const sayB = (c: Ctx, at0: number, s: string, p: V3, w = 1.0, life = 1.6) => { const u = c.t - at0 + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at0) * (u > life - 0.12 ? (life - u) / 0.12 : 1); card(c, `say${s}`, 600, 360, (pen) => fxSay(pen, s), p, w * k, 0.6 * w * k); };
const cal = (c: Ctx, at0: number, year: string, p: V3, s = 0.5, life = 99) => { const u = c.t - at0 + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at0); card(c, `cal${year}`, 300, 340, (pen) => fxCal(pen, year), p, s * k, 1.13 * s * k, { rot: 0.05 * Math.sin(at0 * 3) }); };
const xmark = (c: Ctx, at0: number, p: V3, s = 0.5) => stay(c, at0, "xmark", 300, 300, fxX, p, s, s);
const poof = (c: Ctx, at0: number, p: V3, s = 1.2) => puff(c, at0, p, s, 0.6);
const LUST = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, o: Outfit = LUSTIG) => pose(c, 1, o, o === LUSTIG ? "lustig" : `lustig${o.jacket}${o.hat}`, x, z, fo);
/** the car driving along x */
const car = (c: Ctx, x: number, y: number, z: number, w: number, col = "#2a3a5a") => card(c, `car${col}${q((c.t * 2) % 1, 8)}`, 900, 420, (p) => fxCar(p, (c.t * 2) % 1, col), [x, y, z], w, w * 0.467);

export const STAGE: Record<number, StageFn> = {
  // 1 In 1925, a man walked into one of the fanciest hotels in Paris, sat down with five of the richest scrap metal dealers... offered to sell them the Eiffel Tower.
  1: (c) => {
    const t = c.t, wk = ramp(t, A(0, "walked"), 1.4), of = after(t, A(0, "offered"));
    cal(c, A(0, "1925,"), "1925", [-3.6, 2.3, -3.0], 0.55, 3.0);
    LUST(c, -5.2 + 2.0 * wk, -1.9, { mode: wk > 0 && wk < 1 ? "stroll" : "stand", phase: (t * 1.2) % 1, expr: of ? "smug" : "smile", look: 1, prop: of ? "point" : null });
    dealers(c, (k) => (of ? (["shock", "awe", "shock", "nervous", "awe"] as const)[k] : "neutral"), (k) => ({ lean: jolt(t, A(0, "offered") + 0.3, 0.08 + 0.02 * k) }));
    if (after(t, A(0, "eiffel"))) banner(c, A(0, "eiffel"), "THE EIFFEL TOWER?!", [0.2, 2.9, -3.2], 2.2, "#c0353a", 2.0);
  },
  // 2 Not a model. Not a souvenir. The actual tower. Seven thousand tonnes of iron...
  2: (c) => {
    const t = c.t, md = after(t, A(1, "model.")), sv = after(t, A(1, "souvenir.")), ac = after(t, A(1, "actual"));
    if (md && !sv) { card(c, "mini", 300, 500, fxMiniTower, [-1.0, 1.5, -2.0], 0.5, 0.83); xmark(c, A(1, "model.") + 0.3, [-1.0, 1.5, -1.95], 0.6); }
    if (sv && !ac) { card(c, "mini2", 300, 500, fxMiniTower, [1.0, 1.5, -2.0], 0.3, 0.5); xmark(c, A(1, "souvenir.") + 0.3, [1.0, 1.5, -1.95], 0.45); }
    if (after(t, A(1, "seven"))) banner(c, A(1, "seven"), "7,000 TONNES OF IRON", [0, 28, -55], 22, "#3a4a6a", 4.0);
  },
  // 3 And here's the crazy part. One of them said yes.
  3: (c) => {
    const t = c.t, ys = after(t, A(2, "yes."));
    LUST(c, -3.3, -1.9, { mode: "stand", expr: ys ? "grin" : "smug", look: 1 });
    dealers(c, (k) => (k === 2 ? (ys ? "grin" : "nervous") : ys ? "shock" : "neutral"), (k) => (k === 2 ? { prop: ys ? "salute" : null, dy: hop(t, A(2, "yes."), 0.08, 0.3) } : {}));
    if (ys) { sayB(c, A(2, "yes."), "YES!", [0.3, 2.65, -3.0], 0.9); spark(c, A(2, "yes."), [0, 2.0, -2.9], 1.0, 0.3); }
  },
  // 4 The man was Victor Lustig. He didn't own the tower. He didn't work for the government. He had never sold anything legally...
  4: (c) => {
    const t = c.t;
    LUST(c, 0, -1.8, { mode: "stand", expr: after(t, A(3, "never")) ? "innocent" : "smug", look: 0, prop: after(t, A(3, "own")) && !after(t, A(3, "and")) ? "shrug" : null });
    banner(c, A(3, "victor"), "VICTOR LUSTIG", [0, 2.75, -1.9], 1.8, "#2f3a6a", 2.4);
    const L = ["Owns the tower", "Works for government", "Legal sales: ever"], ts = [A(3, "own"), A(3, "work"), A(3, "never")];
    ts.forEach((tk, k) => { if (after(t, tk) && !after(t, A(3, "and"))) { stay(c, tk, `nope${k}`, 600, 360, (p) => fxSay(p, L[k]), [-2.4 + 0 * k, 2.2 - 0.55 * k, -2.0], 1.1, 0.66); xmark(c, tk + 0.3, [-1.55, 2.25 - 0.55 * k, -1.95], 0.25); } });
    // preview montage
    const pv: [string, (p: Pen) => void, number, number][] = [["eiffel", (p) => fxMiniTower(p), 300, 500], ["machine", (p) => fxMoneyBox(p, (t * 0.5) % 1, 0), 700, 460], ["capone", (p) => fxSay(p, "AL CAPONE"), 600, 360], ["bedsheets", fxRope, 140, 700]];
    pv.forEach(([w, d, cw, ch], k) => { const tk = A(3, w); if (after(t, tk)) stay(c, tk, `pv${k}`, cw, ch, d, [-2.7 + 1.8 * k, 1.0 + (k === 3 ? 0.2 : 0), -3.2], k === 3 ? 0.22 : 0.9, (k === 3 ? 0.22 : 0.9) * ch / cw); });
  },
  // 5 This is the story of the greatest con man who ever lived.
  5: (c) => {
    const t = c.t;
    LUST(c, 0, -1.7, { mode: "stand", expr: "smug", look: 0, prop: after(t, A(4, "greatest")) ? "salute" : null, dy: hop(t, A(4, "greatest"), 0.06, 0.3) });
    banner(c, A(4, "greatest"), "THE GREATEST CON MAN EVER", [0, 2.75, -1.9], 2.4, "#c0353a", 3.0);
    confetti(c, A(4, "greatest"), [0, 2.4, -2.4], 4);
  },
  // 6 born 1890, small town, Czech Republic. Said.
  6: (c) => {
    const t = c.t, sd = after(t, A(5, "said.", 1));
    cal(c, A(5, "1890,"), "1890", [-2.2, 2.2, -2.0], 0.55);
    banner(c, A(5, "czech"), "AUSTRIA-HUNGARY (TODAY: CZECH REP.)", [0.6, 2.75, -2.2], 2.6, "#3a6a4a", 2.6);
    LUST(c, 0.3, -1.8, { mode: "stand", expr: sd ? "innocent" : "smile", look: 0, headTilt: sd ? 8 : 0 });
    crowd(c, 4, (k) => VILLAGER(k), "vill", [-3.4, 2.6, 3.6], -3.2, (k) => ({ mode: "stand", expr: sd ? "nervous" : "smile", look: k ? -1 : 1 }));
    if (sd) { word(c, A(5, "said.", 1), "SAID.", [1.6, 2.4, -2.0], 1.1, 1.2); for (let k = 0; k < 3; k++) stay(c, A(5, "nothing") + 0.15 * k, `q${k}`, 300, 400, fxQuestion, [-0.6 + 0.6 * k, 2.55 + 0.1 * (k % 2), -1.9], 0.22, 0.29); }
  },
  // 7 father was the town mayor... prison records: "poorest peasant people." That gap...
  7: (c) => {
    const t = c.t, pr = after(t, A(6, "prison")), gp = after(t, A(6, "gap,"));
    LUST(c, -1.4, -1.8, { mode: "stand", expr: pr ? "nervous" : "grin", look: 1, prop: pr ? null : "point" });
    if (!pr) { pose(c, 2, MAYOR, "mayor", 1.4, -2.4, { mode: "stand", expr: "smug", look: -1, prop: "salute" }); banner(c, A(6, "mayor."), "\"MY FATHER, THE MAYOR\"", [1.4, 2.7, -2.4], 1.9, "#7a3aa0", 2.0); }
    else { const st = ramp(t, A(6, "poorest"), 0.22); card(c, `prec${q(st, 6)}`, 500, 360, (p) => fxDoc(p, "PRISON RECORD", ["Parents:", "\"poorest peasant", "people\""], "TRUE", st, "#2f7a3a", 300), [1.4, 1.6, -2.2], 1.7, 1.22); }
    if (gp) word(c, A(6, "gap,"), "THE GAP", [0, 2.8, -2.0], 1.3, 1.4);
  },
  // 8 five languages, dressed like a duke, scar, "Count" Lustig
  8: (c) => {
    const t = c.t, dk = after(t, A(7, "duke.")), sc = after(t, A(7, "scar")), ct = after(t, A(7, "count\""));
    LUST(c, 0, -1.8, { mode: "stand", expr: ct ? "smug" : dk ? "smile" : "grin", look: 0, prop: dk && !sc ? "salute" : null }, dk ? COUNT : LUSTIG);
    const hi = ["BONJOUR!", "HELLO!", "GUTEN TAG!", "CIAO!", "AHOJ!"];
    if (!dk) hi.forEach((h, k) => { const tk = A(7, "languages.") - 0.4 + 0.18 * k; if (after(t, tk)) stay(c, tk, `hi${k}`, 600, 360, (p) => fxSay(p, h), [-3.0 + 1.5 * k, 2.5 + 0.35 * (k % 2), -2.6], 1.0, 0.6); });
    if (sc && !ct) { spark(c, A(7, "scar"), [0.17, 1.55, -1.75], 0.4, 0.4, "#ffffff"); word(c, A(7, "scar"), "MYSTERIOUS", [1.6, 2.4, -2.0], 1.3, 1.6); }
    if (ct) banner(c, A(7, "count\""), "\"COUNT\" LUSTIG", [0, 2.75, -1.9], 1.8, "#7a3aa0", 2.6);
    if (ct) word(c, A(7, "free"), "FREE TITLE!", [1.8, 2.2, -2.0], 1.2, 1.2);
  },
  // 9 police counted forty-seven names
  9: (c) => {
    const t = c.t, n = Math.min(12, Math.floor((t - LS(8)) * 4));
    const names = ["Robert Duval", "George Simon", "Count Lustig", "Victor Miller", "Albert Phillips", "Charles Gruber", "Robert Miller", "George Shobo", "Dr. Ellis", "Count Victor", "Jean Paquin", "...and 36 more"];
    insert(c, `names${n}`, 600, 760, (p) => fxRules(p, "POLICE FILE: ALIASES", names, n), 1.15);
    if (after(t, A(8, "forty-seven", 1))) { const k = pop(t, A(8, "forty-seven", 1)); card(c, "s47", 400, 220, (p) => fxScore(p, "47"), [6.7, 2.05, 0.15], 0.7 * k, 0.385 * k, { rot: -0.08 }); }
  },
  // 10 ocean liners: bored rich passengers, money at cards
  10: (c) => {
    const t = c.t, cd = after(t, A(9, "cards.")), bd = after(t, A(9, "bored,"));
    banner(c, A(9, "liners"), "ATLANTIC OCEAN LINER", [0, 2.8, -2.4], 2.0, "#2f5a7a", 2.0);
    LUST(c, -1.0, -2.3, { mode: "stand", expr: cd ? "smug" : "smile", look: 1, prop: cd ? "bills" : "coin" });
    crowd(c, 3, (k) => PASSENGER(k), "pass", [1.0, 2.0], -2.5, (k) => ({ mode: "stand", expr: cd ? "shock" : bd ? (k ? "dazed" : "sad") : "smile", look: -1, prop: cd && k === 0 ? "shrug" : null }));
    if (bd && !cd) stay(c, A(9, "bored,"), "zz", 200, 200, (p) => fxZ(p), [2.2, 2.5, -2.6], 0.3, 0.3);
    if (cd) { spark(c, A(9, "cards."), [-1.0, 1.6, -2.2], 0.9, 0.3); coins(c, A(9, "cards."), [-0.6, 1.6, -2.0], 1.6, 10); }
  },
  // 11 his real trick wasn't cards. It was people.
  11: (c) => {
    const t = c.t, pp = after(t, A(10, "people."));
    LUST(c, 0, -1.8, { mode: "stand", expr: pp ? "smug" : "smile", look: 0, prop: pp ? "point" : null });
    if (after(t, A(10, "cards.")) && !pp) xmark(c, A(10, "cards.") + 0.2, [-1.4, 2.2, -2.0], 0.45);
    if (pp) { crowd(c, 3, (k) => PASSENGER(k + 1), "passP", [2.0, 3.0, -2.2], -2.6, () => ({ mode: "stand", expr: "awe", look: -1 })); banner(c, A(10, "people."), "PEOPLE", [1.6, 2.8, -2.4], 1.3, "#2f7a3a", 2.0); }
  },
  // 12 the Ten Commandments of the con man (lines 11-12)
  12: (c) => {
    const t = c.t;
    const R = ["1. Be a patient listener", "2. Never look bored", "3. Never boast", "4. Never be untidy", "5. Never get drunk", "...and five more"];
    const ts = [A(12, "patient"), A(12, "look"), A(12, "boast,"), A(12, "untidy."), A(12, "drunk."), 1e9];
    const n = after(t, LS(12) - 0.2) ? ts.filter((x) => after(t, x)).length : 0;
    insert(c, `rules${n}`, 600, 760, (p) => fxRules(p, "THE TEN COMMANDMENTS OF THE CON", R, n), 1.15);
    if (after(t, A(11, "coach."))) stay(c, A(11, "coach."), "coach", 600, 360, (p) => fxSay(p, "LIFE COACH?"), [6.8, 2.1, 0.15], 0.6, 0.36);
  },
  // 13 Notice what's missing? ... He listened, nodded, agreed... and let them talk themselves into it.
  13: (c) => {
    const t = c.t, ls = after(t, A(13, "listened,"));
    if (!ls) { [["TALK FAST", A(13, "talk")], ["BE PUSHY", A(13, "be")]].forEach(([s, tk], k) => { if (after(t, tk as number)) { stay(c, tk as number, `m${k}`, 600, 360, (p) => fxSay(p, s as string), [-1.2 + 2.4 * k, 2.3, -2.0], 1.1, 0.66); xmark(c, (tk as number) + 0.3, [-1.2 + 2.4 * k, 2.3, -1.95], 0.5); } }); }
    LUST(c, -1.3, -1.8, { mode: "stand", expr: ls ? "smile" : "neutral", look: 1, headTilt: ls ? 6 * Math.sin(t * 5) : 0 });
    pose(c, 2, MARK, "mark", 1.3, -2.0, { mode: "stand", expr: ls ? (after(t, A(13, "talk", 2)) ? "laugh" : "grin") : "neutral", look: -1, prop: ls ? "point" : null, dy: ls ? bounce(t, 2, 0.04) : 0 });
    if (ls) for (let k = 0; k < 3; k++) { const tk = A(13, "listened,") + 0.5 * k; if (after(t, tk)) stay(c, tk, `bla${k}`, 600, 360, (p) => fxSay(p, "BLA BLA"), [1.8 + 0.3 * k, 2.3 + 0.35 * k, -2.2], 0.7, 0.42); }
  },
  // 14 And in 1925, he went to Paris, and he read the newspaper.
  14: (c) => {
    const t = c.t;
    cal(c, A(14, "1925,"), "1925", [-3.6, 2.4, -2.6], 0.5);
    LUST(c, -3.0, -2.1, { mode: "stand", expr: "smile", look: 1, prop: after(t, A(14, "read")) ? "magazine" : null });
  },
  // 15 The Eiffel Tower was never meant to be permanent.
  15: (c) => {
    const t = c.t;
    if (after(t, A(15, "permanent."))) banner(c, A(15, "permanent."), "NOT PERMANENT?!", [0, 34, -55], 22, "#c0353a", 2.4);
    crowd(c, 2, (k) => PARISIAN(k), "par", [-2.6, 2.4], -2.4, (k) => ({ mode: "stand", expr: after(t, A(15, "never")) ? "shock" : "smile", look: k ? -1 : 1 }));
  },
  // 16 built for the 1889 World's Fair... come down after twenty years. Parisians hated it... "loathsome construction."
  16: (c) => {
    const t = c.t, ht = after(t, A(16, "hated"));
    banner(c, A(16, "1889"), "1889 WORLD'S FAIR", [0, 36, -55], 24, "#2f5a7a", 3.0);
    if (after(t, A(16, "twenty"))) { const y = 1889 + Math.min(20, Math.floor(20 * clamp01((t - A(16, "twenty") + LEAD) / 1.0))); cal(c, A(16, "twenty"), String(y), [-2.6, 2.3, -2.2], 0.5); }
    crowd(c, 2, (k) => PARISIAN(k), "par", [-1.2, 1.2, 2.6], -2.4, (k) => ({ mode: "stand", expr: ht ? "pained" : "neutral", look: k === 0 ? 1 : -1, prop: ht && k === 1 ? "point" : null }));
    if (after(t, A(16, "ugly."))) word(c, A(16, "ugly."), "UGLY!", [1.3, 2.6, -2.4], 1.0, 1.0);
    if (after(t, A(16, "loathsome"))) banner(c, A(16, "loathsome"), "\"LOATHSOME CONSTRUCTION\"", [0, 2.9, -2.6], 2.6, "#5a3a2a", 2.2);
  },
  // 17 By 1925 it was getting old. Painting, repairs, money.
  17: (c) => {
    const t = c.t;
    cal(c, A(17, "1925"), "1925", [-3.2, 2.4, -2.4], 0.5);
    const L: [string, number][] = [["PAINT", A(17, "painting.")], ["REPAIRS", A(17, "repairs.")], ["$$$", A(17, "money.")]];
    L.forEach(([s, tk], k) => { if (after(t, tk)) stay(c, tk, `rp${k}`, 600, 360, (p) => fxSay(p, s), [-1.6 + 1.6 * k, 2.3 + 0.2 * (k % 2), -2.2], 1.0, 0.6); });
    pose(c, 2, WORKER, "worker", 1.6, -2.4, { mode: "stand", expr: after(t, A(17, "money.")) ? "nervous" : "neutral", look: -1, prop: ["hammer", 0.5] });
  },
  // 18 newspaper: would it be cheaper to just... take it down?
  18: (c) => {
    insert(c, "news1", 600, 760, (p) => fxNews(p, "LE PETIT PARISIEN", "TEAR DOWN THE", "EIFFEL TOWER?", 1), 1.0);
  },
  // 19 Millions of people read that article and turned the page.
  19: (c) => {
    const t = c.t, tp = after(t, A(19, "turned"));
    crowd(c, 2, (k) => PARISIAN(k + 2), "rd", [-2.6, -0.9, 0.9, 2.6], -2.3, (k) => ({ mode: "stand", expr: tp ? "dazed" : "neutral", look: k < 2 ? 1 : -1, prop: "magazine" }));
    if (tp) word(c, A(19, "turned"), "YAWN", [0, 2.5, -2.4], 1.0, 1.2, "#e6eef8");
  },
  // 20 Victor Lustig read that article and thought: I could sell that.
  20: (c) => {
    const t = c.t, th = after(t, A(20, "thought:"));
    LUST(c, -0.6, -1.9, { mode: "stand", expr: th ? "smug" : "neutral", look: 1, prop: "magazine" });
    if (th) { stay(c, A(20, "thought:"), "idea", 300, 400, fxIdea, [-0.9, 2.55, -1.8], 0.4, 0.53); sayB(c, A(20, "could"), "I COULD SELL THAT.", [1.4, 2.4, -2.0], 1.7, 2.0); }
  },
  // 21 stationery with the French government's seal, stamps, the works
  21: (c) => {
    const t = c.t, st = ramp(t, A(21, "stamps."), 0.22);
    insert(c, `lh${q(st, 6)}`, 500, 640, (p) => fxLetterhead(p, st), 1.0);
    if (after(t, A(21, "works."))) spark(c, A(21, "works."), [6, 1.6, 0.1], 1.2, 0.35);
  },
  // 22 Deputy Director-General of the Ministry of Posts and Telegraphs. A title so long and so boring...
  22: (c) => {
    const t = c.t;
    insert(c, "card", 700, 400, (p) => fxCardID(p, "Victor Lustig", "Deputy Director-General", "Ministry of Posts", "and Telegraphs"), 1.5);
    if (after(t, A(22, "boring"))) word(c, A(22, "boring"), "ZZZ...", [6.6, 2.15, 0.1], 0.7, 1.5, "#e6eef8");
  },
  // 23 He wrote to five dealers... Hôtel de Crillon
  23: (c) => {
    const t = c.t;
    for (let k = 0; k < 5; k++) fly(c, `env${k}`, (p) => fxEnvelope(p), 400, 260, LS(23) + 0.25 * k, LS(23) + 0.25 * k + 1.4, [-2, 1.4, -1.5], [-3 + 1.5 * k, 2.5, -5], 0.5, 0.33, 0.8);
    banner(c, A(23, "hôtel"), "HÔTEL DE CRILLON", [0, 3.0, -2.8], 2.0, "#7a3a2a", 4.0);
    LUST(c, -2.4, -1.8, { mode: "stand", expr: "smug", look: 1 });
  },
  // 24 The dealers arrived. Lustig welcomed them, shook every hand, lowered his voice.
  24: (c) => {
    const t = c.t, ar = ramp(t, LS(24), 1.2), lw = after(t, A(24, "lowered"));
    LUST(c, -3.3, -1.9, { mode: "stand", expr: lw ? "smug" : "grin", look: 1, prop: after(t, A(24, "shook")) && !lw ? "point" : null });
    dealers(c, (k) => (lw ? "nervous" : "smile"), (k) => ({ dy: 0 * k, lean: lw ? -0.05 : 0 }));
    if (ar < 1) puff(c, LS(24), [3, 0.4, -3], 0.8, 0.6);
    if (lw) for (let k = 0; k < 2; k++) stay(c, A(24, "voice.") + 0.2 * k, `sh${k}`, 600, 360, (p) => fxSay(p, "psst..."), [-2.6 + 0.5 * k, 2.45 + 0.3 * k, -2.0], 0.7, 0.42);
  },
  // 25 The government has decided... torn down... 7,000 tonnes... highest bidder.
  25: (c) => {
    const t = c.t, td = after(t, A(25, "torn")), hb = after(t, A(25, "highest"));
    LUST(c, -3.3, -1.9, { mode: "stand", expr: td ? "stern" : "smug", look: 1, prop: hb ? "coin" : td ? "point" : null });
    dealers(c, (k) => (hb ? (["grin", "awe", "grin", "smug", "awe"] as const)[k] : td ? "shock" : "neutral"), () => ({}));
    if (td) word(c, A(25, "torn"), "TORN DOWN!", [0, 2.8, -3.0], 1.5, 1.6);
    if (hb) banner(c, A(25, "highest"), "TO THE HIGHEST BIDDER", [0, 2.9, -3.2], 2.4, "#2f7a3a", 2.4);
  },
  // 26 Then came the genius part.
  26: (c) => {
    const t = c.t;
    LUST(c, 0, -1.8, { mode: "stand", expr: "smug", look: 0, prop: "salute" });
    spark(c, A(26, "genius"), [0, 2.3, -1.7], 1.2, 0.4, "#fff3b0");
  },
  // 27 This must stay secret... not a word. To anyone.
  27: (c) => {
    const t = c.t, sc = after(t, A(27, "secret,")), nw = after(t, A(27, "not"));
    LUST(c, -3.3, -1.9, { mode: "stand", expr: sc ? "stern" : "smug", look: 1, prop: "point" });
    dealers(c, (k) => (nw ? "nervous" : "awe"), (k) => ({ lean: -0.06 * (k - 2) / 2 }));
    if (sc) banner(c, A(27, "secret,"), "TOP SECRET", [0, 2.9, -3.1], 1.6, "#c0353a", 2.4);
    if (nw) sayB(c, A(27, "not"), "SHHH!", [-2.6, 2.6, -2.0], 0.9, 2.2);
  },
  // 28 Secrecy makes it feel important. Chosen. Stops them from checking.
  28: (c) => {
    const t = c.t, ch = after(t, A(28, "chosen.")), wt = after(t, A(28, "wait,"));
    dealers(c, (k) => (ch ? "grin" : "smile"), (k) => ({ dy: ch ? hop(t, A(28, "chosen.") + 0.05 * k, 0.05, 0.3) : 0 }));
    if (after(t, A(28, "important."))) word(c, A(28, "important."), "IMPORTANT!", [-1.0, 2.8, -3.0], 1.4, 1.2);
    if (ch) { word(c, A(28, "chosen."), "CHOSEN!", [1.2, 2.8, -3.0], 1.3, 1.2); confetti(c, A(28, "chosen."), [0, 2.6, -3.2], 4); }
    if (wt) { stay(c, A(28, "wait,"), "notreal", 600, 360, (p) => fxSay(p, "WAIT... NOT REAL?"), [2.6, 2.5, -2.6], 1.4, 0.84); xmark(c, A(28, "real.") + 0.1, [2.6, 2.5, -2.55], 0.6); }
  },
  // 29 a tour of the tower in a rented car, pointing at the beams
  29: (c) => {
    const t = c.t, x = -6 + 3.2 * Math.min(1.6, t - LS(29));
    car(c, x, 0.82, -2.6, 3.4);
    LUST(c, x + 0.2, -2.3, { mode: "stand", expr: "smug", look: 0, prop: after(t, A(29, "pointing")) ? "point" : null }, LUSTIG);
    if (after(t, A(29, "pointing"))) word(c, A(29, "beams"), "FINE IRON!", [x + 1.6, 2.6, -2.4], 1.3, 1.6);
  },
  // 30 Then he asked for sealed bids.
  30: (c) => {
    const t = c.t;
    LUST(c, -3.3, -1.9, { mode: "stand", expr: "smug", look: 1, prop: "salute" });
    dealers(c, () => "stern", () => ({}));
    for (let k = 0; k < 5; k++) { const tk = A(30, "sealed") + 0.12 * k; if (after(t, tk)) stay(c, tk, `bid${k}`, 400, 260, (p) => fxEnvelope(p), [-1.9 + 0.95 * k, 0.95, -2.3], 0.45, 0.29, 0.1 * (k - 2)); }
  },
  // 31 A dealer named André Poisson.
  31: (c) => {
    const t = c.t;
    pose(c, 2, POISSON, "poisson", 0.4, -1.8, { mode: "stand", expr: "smile", look: 0 });
    banner(c, A(31, "andré"), "ANDRÉ POISSON", [0.4, 2.75, -1.9], 1.7, "#2f5a7a", 2.4);
    LUST(c, -2.6, -2.2, { mode: "stand", expr: "smug", look: 1, prop: "point" });
  },
  // 32 new to the big leagues. Respect. Insider. A legend.
  32: (c) => {
    const t = c.t, lg = after(t, A(32, "legend."));
    pose(c, 2, POISSON, "poisson", 0, -1.8, { mode: "stand", expr: lg ? "laugh" : after(t, A(32, "wanted")) ? "smile" : "nervous", look: 0, prop: lg ? "salute" : null });
    const L: [string, number][] = [["RESPECT", A(32, "respect.")], ["INSIDER", A(32, "insider.")]];
    L.forEach(([s, tk], k) => { if (after(t, tk) && !lg) stay(c, tk, `pw${k}`, 600, 360, (p) => fxSay(p, s), [-1.6 + 3.2 * k, 2.4, -2.0], 1.0, 0.6); });
    if (after(t, A(32, "buying"))) stay(c, A(32, "buying"), "dream", 300, 500, fxMiniTower, [0, 2.75, -1.9], 0.4, 0.66);
    if (lg) { banner(c, A(32, "legend."), "A LEGEND!", [0, 3.0, -2.0], 1.4, "#c9a020", 2.2); confetti(c, A(32, "legend."), [0, 2.6, -2.4], 3.5); }
  },
  // 33 Poisson's wife wasn't so sure. Why the secrecy? Why the rush? Why a hotel?
  33: (c) => {
    const t = c.t;
    pose(c, 3, WIFE, "wife", 1.0, -1.9, { mode: "stand", expr: "stern", look: -1, prop: after(t, A(33, "hotel")) ? "point" : null });
    pose(c, 2, POISSON, "poisson", -1.1, -1.9, { mode: "stand", expr: after(t, A(33, "rush?")) ? "nervous" : "smile", look: 1 });
    const L: [string, number][] = [["SECRECY?", A(33, "secrecy?")], ["RUSH?", A(33, "rush?")], ["A HOTEL?", A(33, "hotel")]];
    L.forEach(([s, tk], k) => { if (after(t, tk)) stay(c, tk, `wq${k}`, 600, 360, (p) => fxSay(p, s), [1.6 - 0.2 * k, 2.3 + 0.45 * k, -2.0 - 0.1 * k], 0.95, 0.57); });
  },
  // 34 Those are excellent questions. Lustig had an excellent answer.
  34: (c) => {
    const t = c.t;
    LUST(c, 0, -1.8, { mode: "stand", expr: after(t, A(34, "lustig")) ? "smug" : "smile", look: 0, prop: after(t, A(34, "answer.")) ? "salute" : null });
    spark(c, A(34, "answer."), [0, 2.2, -1.7], 1.0, 0.35);
  },
  // 35 He met Poisson privately... officials not paid well... expenses... a little extra helps.
  35: (c) => {
    const t = c.t, ex = after(t, A(35, "expenses.")), lx = after(t, A(35, "little"));
    LUST(c, -0.9, -1.9, { mode: "stand", expr: ex ? "innocent" : "sad", look: 1, prop: lx ? "coin" : null, headTilt: 6 });
    pose(c, 2, POISSON, "poisson", 0.9, -2.0, { mode: "stand", expr: ex ? "awe" : "nervous", look: -1 });
    if (after(t, A(35, "sighed,"))) stay(c, A(35, "sighed,"), "sigh", 600, 360, (p) => fxSay(p, "*sigh*"), [-1.5, 2.45, -1.9], 0.8, 0.48);
    if (ex) word(c, A(35, "expenses."), "EXPENSES...", [0, 2.8, -2.0], 1.3, 1.6);
    if (lx) stay(c, A(35, "little"), "extra", 600, 360, (p) => fxSay(p, "A LITTLE EXTRA"), [-1.6, 2.7, -1.9], 1.3, 0.78);
  },
  // 36 And Poisson relaxed... He wanted a bribe! That's what real officials do!
  36: (c) => {
    const t = c.t, br = after(t, A(36, "bribe!"));
    pose(c, 2, POISSON, "poisson", 0, -1.8, { mode: "stand", expr: br ? "laugh" : after(t, A(36, "relaxed.")) ? "relief" : "nervous", look: 0, dy: br ? bounce(t, 2, 0.05) : 0, prop: br ? "point" : null });
    if (br) { banner(c, A(36, "bribe!"), "A BRIBE! IT'S REAL!", [0, 2.8, -1.9], 2.0, "#2f7a3a", 3.0); confetti(c, A(36, "bribe!"), [0, 2.6, -2.2], 3.5); }
  },
  // 37 So Poisson paid. For the tower. Then a bribe on top.
  37: (c) => {
    const t = c.t, tp = after(t, A(37, "top,"));
    pose(c, 2, POISSON, "poisson", 1.0, -1.9, { mode: "stand", expr: "grin", look: -1, prop: "bills" });
    LUST(c, -1.0, -1.9, { mode: "stand", expr: "grin", look: 1, prop: "bills" });
    card(c, "cash1", 600, 360, fxMoneyPile, [-1.0, 0.42, -1.5], 1.2, 0.72);
    if (tp) { stay(c, A(37, "top,"), "cash2", 600, 360, fxMoneyPile, [-1.0, 0.95, -1.45], 0.9, 0.54); word(c, A(37, "top,"), "+ BRIBE", [-1.6, 2.6, -1.8], 1.1, 1.3); }
    if (after(t, A(37, "wasn't"))) word(c, A(37, "wasn't"), "NOT FOR SALE!", [0.6, 2.8, -2.0], 1.5, 1.6);
  },
  // 38 within an hour, out of Paris, on a train, with a suitcase full of cash.
  38: (c) => {
    const t = c.t, tr = after(t, A(38, "train,"));
    cal(c, A(38, "hour,"), "1 HOUR", [-3.4, 2.4, -2.0], 0.5);
    LUST(c, tr ? -0.5 : -2.2, -1.9, { mode: "stand", expr: "grin", look: 1, prop: tr ? "salute" : "crate" });
    if (after(t, A(38, "suitcase"))) { card(c, "case", 300, 220, (p) => { p.poly([[30, 60], [270, 60], [270, 200], [30, 200]], "#7a4a2a", 9); p.band([[110, 60], [110, 30], [190, 30], [190, 60]], "#3a2a1a", 10, 4, "round"); }, [0.2, 0.35, -1.7], 0.55, 0.4); coins(c, A(38, "cash."), [0.2, 1.4, -1.7], 1.2, 8, 1.6); }
    smoke(c, [8.0, 3.8, -6.2], 1.6, 0.2); smoke(c, [8.0, 3.8, -6.2], 1.4, 0.6);
  },
  // 39 Poisson's choice: police (tell all Paris) or say nothing
  39: (c) => {
    const t = c.t, ch = after(t, A(39, "choice."));
    pose(c, 2, POISSON, "poisson", 0, -1.8, { mode: "stand", expr: ch ? "nervous" : "shock", look: 0, headTilt: ch ? 10 * Math.sin(t * 2) : 0 });
    if (ch) { stay(c, A(39, "police"), "opt1", 600, 360, (p) => fxSay(p, "POLICE?"), [-1.8, 2.4, -2.0], 1.0, 0.6); stay(c, A(39, "nothing."), "opt2", 600, 360, (p) => fxSay(p, "SAY NOTHING?"), [1.8, 2.4, -2.0], 1.2, 0.72); }
    if (after(t, A(39, "fortune"))) crowd(c, 4, (k) => PARISIAN(k), "lol", [-3.4, 3.4], -2.8, (k) => ({ mode: "stand", expr: "laugh", look: k ? -1 : 1 }));
    sweat(c, [0, 2.0, -1.7]);
  },
  // 40 He said nothing.
  40: (c) => {
    pose(c, 2, POISSON, "poisson", 0, -1.8, { mode: "stand", expr: "pained", look: 0 });
    stay(c, LS(40), "zip", 600, 360, (p) => fxSay(p, ". . ."), [0.9, 2.4, -1.9], 0.8, 0.48);
  },
  // 41 Lustig waited. Watched the newspapers. No headlines. No police. Nothing.
  41: (c) => {
    const t = c.t;
    LUST(c, -1.0, -1.9, { mode: "stand", expr: after(t, A(41, "nothing.")) ? "smug" : "neutral", look: 1, prop: "magazine" });
    const L: [string, number][] = [["NO HEADLINES", A(41, "headlines.")], ["NO POLICE", A(41, "police.")], ["NOTHING", A(41, "nothing.")]];
    L.forEach(([s, tk], k) => { if (after(t, tk)) stay(c, tk, `nn${k}`, 600, 360, (p) => fxSay(p, s), [0.8 + 0.6 * k, 2.2 + 0.45 * k, -2.2], 1.1, 0.66); });
  },
  // 42 around six months later... back to Paris to sell the Eiffel Tower again
  42: (c) => {
    const t = c.t, ag = after(t, A(43, "again."));
    cal(c, A(42, "six"), "+6 MO.", [-3.2, 2.4, -2.2], 0.6);
    LUST(c, 0, -1.8, { mode: "stand", expr: ag ? "laugh" : "smug", look: 0, prop: ag ? "salute" : null });
    if (ag) banner(c, A(43, "again."), "AGAIN?!", [0, 30, -55], 20, "#c0353a", 2.4);
  },
  // 43 Same story. Same fake stationery. Five new scrap dealers.
  43: (c) => {
    const t = c.t;
    LUST(c, -3.3, -1.9, { mode: "stand", expr: "smug", look: 1, prop: after(t, A(44, "stationery.")) ? "leaflet" : null });
    if (after(t, A(44, "five"))) dealers(c, () => "smile", () => ({}));
    if (after(t, A(44, "same"))) word(c, A(44, "same"), "SAME STORY", [0, 2.9, -3.0], 1.4, 1.2);
  },
  // 44 one of them went to the police... collapsed... papers... he disappeared.
  44: (c) => {
    const t = c.t, pl = after(t, A(45, "police.")), dp = after(t, A(45, "disappeared."));
    pose(c, 3, DEALER(1), "dealer1", -1.0, -1.9, { mode: "stand", expr: pl ? "stern" : "nervous", look: 1, prop: pl ? "point" : null });
    if (pl) pose(c, 4, GENDARME, "gend", 1.0, -1.9, { mode: "stand", expr: "stern", look: -1 });
    if (after(t, A(45, "papers,"))) stay(c, A(45, "papers,"), "news2", 600, 760, (p) => fxNews(p, "LE MATIN", "EIFFEL TOWER", "SCAM!", 2), [-3.0, 1.5, -2.4], 0.9, 1.14);
    if (!dp) LUST(c, 3.2, -2.4, { mode: "stand", expr: after(t, A(45, "collapsed,")) ? "nervous" : "smug", look: -1 });
    else poof(c, A(45, "disappeared."), [3.2, 1.2, -2.4], 1.6);
  },
  // 45 did he sell it twice? Sold once, tried once.
  45: (c) => {
    const t = c.t, sd = after(t, A(46, "once.")), tr = after(t, A(46, "tried."));
    insert(c, `tally${sd ? 1 : 0}${tr ? 1 : 0}`, 600, 760, (p) => fxRules(p, "THE EIFFEL TOWER", ["Sold:  1", "Tried: 1", "", "Everyone else: 0"], (sd ? 1 : 0) + (tr ? 1 : 0) + (after(t, A(46, "anyone")) ? 2 : 0), true), 1.15);
  },
  // 46 With France getting too hot, Lustig crossed the ocean. To America.
  46: (c) => {
    const t = c.t, am = after(t, A(47, "america."));
    LUST(c, 0, -2.2, { mode: "stand", expr: am ? "grin" : "smug", look: 0, prop: "crate" });
    if (am) banner(c, A(47, "america."), "AMERICA", [0, 2.8, -2.4], 1.4, "#2f3a7a", 2.4);
  },
  // 47 a wooden box (line 48-49)
  47: (c) => {
    const t = c.t, bx = after(t, A(48, "box.")), cp = after(t, A(49, "copy"));
    if (bx) stay(c, A(48, "box."), "mbox", 700, 460, (p) => fxMoneyBox(p, (t * 0.2) % 1, 0), [0.4, 1.12, -2.6], 1.4, 0.92);
    LUST(c, -1.6, -1.9, { mode: "stand", expr: cp ? "smug" : "grin", look: 1, prop: bx ? "point" : null });
    if (after(t, A(49, "dials"))) for (const [s, tk, x, y] of [["DIALS", A(49, "dials"), -0.3, 2.4], ["ROLLERS", A(49, "rollers"), 0.9, 2.6], ["SLOTS", A(49, "slots."), 1.9, 2.3]] as [string, number, number, number][]) if (after(t, tk) && !cp) stay(c, tk, `lab${s}`, 600, 360, (p) => fxSay(p, s), [x, y, -2.6], 0.8, 0.48);
    if (cp) banner(c, A(49, "copy"), "MONEY COPIER!", [0.4, 2.8, -2.6], 1.7, "#2f7a3a", 2.2);
  },
  // 48 the demonstration: $100 in, wait hours, crank, two bills out (line 50) + they were real (51)
  48: (c) => {
    const t = c.t, inn = after(t, A(50, "put")), wt = after(t, A(50, "wait")), cr = after(t, A(50, "crank…")), out = clamp01((t - A(50, "two") + LEAD) / 0.6);
    card(c, `mbox${q(cr ? (t * 1.2) % 1 : 0, 12)}${q(out, 6)}`, 700, 460, (p) => fxMoneyBox(p, cr ? (t * 1.2) % 1 : 0, out), [0.4, 1.12, -2.6], 1.4, 0.92);
    LUST(c, -1.6, -1.9, { mode: "stand", expr: cr ? "smug" : "smile", look: 1, prop: inn && !wt ? "bills" : null });
    pose(c, 2, MARK, "mark", 2.4, -2.2, { mode: "stand", expr: out > 0 ? "shock" : wt ? "dazed" : "neutral", look: -1, dy: out > 0.9 ? hop(t, A(50, "two") + 0.6, 0.1, 0.3) : 0 });
    if (wt && !cr) { const h = 1 + Math.floor(clamp01((t - A(50, "wait")) / 2.5) * 5); stay(c, A(50, "wait"), `hrs${h}`, 300, 340, (p) => fxCal(p, `${h} HR`), [-0.6, 2.5, -2.4], 0.45, 0.51); }
    if (out > 0.5) word(c, A(50, "two") + 0.3, "x2!", [1.2, 2.6, -2.4], 1.0, 1.6);
    if (after(t, A(51, "real!"))) { banner(c, A(51, "real!"), "REAL BILLS!", [0.4, 2.85, -2.6], 1.5, "#2f7a3a", 1.6); }
    if (after(t, A(51, "because"))) { stay(c, A(51, "because"), "hidden", 600, 360, (p) => fxSay(p, "(hidden inside)"), [-0.2, 2.35, -2.4], 1.2, 0.72); }
  },
  // 49 People were amazed... didn't want to sell... $30,000. In the 1920s.
  49: (c) => {
    const t = c.t, of = after(t, A(52, "until")), th = after(t, A(52, "thirty"));
    card(c, "mboxS", 700, 460, (p) => fxMoneyBox(p, 0, 0), [0.4, 1.12, -2.6], 1.4, 0.92);
    LUST(c, -1.6, -1.9, { mode: "stand", expr: of ? "smug" : "stern", look: 1, prop: of ? "bills" : "cross" });
    crowd(c, 2, (k) => MARK_V(k), "buyer", [2.2, 3.2], -2.3, (k) => ({ mode: "stand", expr: of ? "grin" : "awe", look: -1, prop: of && k === 0 ? "bills" : null }));
    if (after(t, A(52, "didn't")) && !of) sayB(c, A(52, "didn't"), "NOT FOR SALE.", [-1.4, 2.5, -1.9], 1.4, 2.0);
    if (th) { const k = pop(t, A(52, "thirty")); card(c, "s30k", 400, 220, (p) => fxScore(p, "$30,000"), [0.4, 2.7, -2.6], 1.4 * k, 0.77 * k, { rot: -0.05 }); }
  },
  // 50 print a few bills... then blank paper... Lustig long gone.
  50: (c) => {
    const t = c.t, bl = after(t, A(53, "blank")), gn = after(t, A(53, "gone."));
    card(c, `mboxB${bl ? 1 : 0}`, 700, 460, (p) => fxMoneyBox(p, 0.3, 0), [0.4, 1.12, -2.6], 1.4, 0.92);
    if (bl) stay(c, A(53, "blank"), "blank", 300, 160, (p) => p.poly([[14, 14], [286, 14], [286, 146], [14, 146]], "#f6f4ee", 8), [1.0, 0.75, -2.4], 0.5, 0.27);
    pose(c, 2, MARK_V(0), "buyer0", 2.2, -2.3, { mode: "stand", expr: bl ? "shock" : "grin", look: -1, prop: "bills" });
    if (!after(t, A(53, "by"))) LUST(c, -1.6, -1.9, { mode: "stand", expr: "smug", look: 1 });
    else if (!gn) poof(c, A(53, "by"), [-1.6, 1.2, -1.9], 1.4);
    if (gn) word(c, A(53, "gone."), "GONE!", [-1.6, 2.2, -1.9], 1.2, 1.5);
  },
  // 51 one person in America you absolutely do not want to cheat.
  51: (c) => {
    const t = c.t;
    LUST(c, 0, -1.9, { mode: "stand", expr: after(t, A(54, "cheat.")) ? "nervous" : "smile", look: 0 });
    if (after(t, A(54, "cheat."))) word(c, A(54, "cheat."), "DON'T!", [1.4, 2.5, -2.1], 1.1, 1.6);
  },
  // 52 Al Capone. The most feared gangster in Chicago.
  52: (c) => {
    const t = c.t;
    pose(c, 2, CAPONE, "capone", 0.4, -2.2, { mode: "stand", expr: "stern", look: 0, prop: "cross" });
    crowd(c, 3, (k) => GOON(k), "goon", [-1.6, 2.4], -2.7, (k) => ({ mode: "stand", expr: "stern", look: k ? -1 : 1, prop: "cross" }));
    banner(c, A(55, "al"), "AL CAPONE", [0.4, 2.9, -2.3], 1.6, "#1e1a1c", 3.0);
    if (after(t, A(55, "chicago."))) word(c, A(55, "feared"), "MOST FEARED", [0.4, 2.45, -2.1], 1.4, 1.6);
  },
  // 53 So, naturally, Victor Lustig went to see Al Capone.
  53: (c) => {
    const t = c.t, x = -4 + 2.4 * clamp01((t - LS(56)) / 2.6);
    LUST(c, x, -2.0, { mode: x < -1.7 ? "stroll" : "stand", phase: (t * 1.2) % 1, expr: "whistle", look: 1 });
    banner(c, A(56, "naturally,"), "NATURALLY.", [-1, 2.8, -2.4], 1.4, "#c0353a", 1.6);
  },
  // 54 investment deal, double his money in sixty days. Capone handed over $50,000.
  54: (c) => {
    const t = c.t, hd = after(t, A(57, "handed"));
    LUST(c, -1.2, -1.9, { mode: "stand", expr: hd ? "grin" : "smug", look: 1, prop: hd ? "bills" : "point" });
    pose(c, 2, CAPONE, "capone", 1.2, -2.3, { mode: "stand", expr: hd ? "smug" : "stern", look: -1, prop: hd ? null : "cross" });
    if (after(t, A(57, "double"))) stay(c, A(57, "double"), "x2", 600, 360, (p) => fxSay(p, "x2 IN 60 DAYS"), [-1.6, 2.5, -1.9], 1.3, 0.78);
    if (hd) { const k = pop(t, A(57, "fifty")); card(c, "s50k", 400, 220, (p) => fxScore(p, "$50,000"), [0.0, 2.8, -2.4], 1.4 * k, 0.77 * k, { rot: -0.05 }); }
  },
  // 55 safe deposit box. Left it there. For two months.
  55: (c) => {
    const t = c.t, mo = after(t, A(58, "two"));
    insert(c, `dep${after(t, A(58, "box."), ) ? 1 : 0}`, 400, 300, (p) => fxDeposit(p, after(t, A(58, "box.")) ? 1 : 0), 1.3);
    if (after(t, A(58, "left"))) { const d = mo ? Math.min(60, Math.floor(60 * clamp01((t - A(58, "two") + LEAD) / 1.2))) : 0; cal(c, A(58, "left"), `DAY ${d}`, [6.8, 2.2, 0.1], 0.5); }
  },
  // 56 back to Capone, miserable. "I'm so sorry... the deal fell through." Handed back all $50,000.
  56: (c) => {
    const t = c.t, bk = after(t, A(59, "handed"));
    LUST(c, -1.2, -1.9, { mode: "stand", expr: bk ? "sad" : "pained", look: 1, prop: bk ? "bills" : null, headTilt: 8 });
    pose(c, 2, CAPONE, "capone", 1.2, -2.3, { mode: "stand", expr: after(t, A(59, "through.")) ? "stern" : "neutral", look: -1, prop: "cross" });
    if (after(t, A(59, "sorry,"))) stay(c, A(59, "sorry,"), "sorry", 600, 360, (p) => fxSay(p, "SO SORRY..."), [-1.7, 2.5, -1.9], 1.1, 0.66);
    if (bk) { card(c, "cashB", 600, 360, fxMoneyPile, [0.0, 0.85, -2.1], 0.9, 0.54); word(c, A(59, "all"), "ALL OF IT", [0.0, 2.8, -2.3], 1.3, 1.6); }
  },
  // 57 Capone stunned... An honest man! Reward. A few thousand dollars.
  57: (c) => {
    const t = c.t, hn = after(t, A(60, "honest")), rw = after(t, A(60, "reward."));
    pose(c, 2, CAPONE, "capone", 1.0, -2.2, { mode: "stand", expr: rw ? "grin" : hn ? "awe" : "shock", look: -1, prop: rw ? "bills" : null, lean: jolt(t, LS(60), 0.12) });
    LUST(c, -1.2, -1.9, { mode: "stand", expr: rw ? "innocent" : "sad", look: 1 });
    crowd(c, 3, (k) => GOON(k), "goon", [2.8, -3.0], -2.8, () => ({ mode: "stand", expr: hn ? "shock" : "stern", look: 0 }));
    if (hn) banner(c, A(60, "honest"), "AN HONEST MAN!", [1.0, 2.9, -2.3], 1.8, "#2f7a3a", 2.4);
    if (rw) { stay(c, A(60, "few"), "tip", 400, 220, (p) => fxScore(p, "$5,000"), [-0.2, 2.6, -2.1], 1.0, 0.55); coins(c, A(60, "reward."), [-1.0, 1.6, -1.8], 1.6, 10); }
  },
  // 58 Which, of course, was the plan all along. Never invested. Trust... tip. Conned by being honest.
  58: (c) => {
    const t = c.t, pl = after(t, A(61, "plan"));
    LUST(c, 0, -1.8, { mode: "stand", expr: pl ? "smug" : "smile", look: 0, prop: after(t, A(62, "tip.")) ? "bills" : pl ? "salute" : null });
    if (pl) banner(c, A(61, "plan"), "THE PLAN ALL ALONG", [0, 2.8, -1.9], 2.0, "#7a3aa0", 2.0);
    if (after(t, A(62, "honest."))) word(c, A(62, "honest."), "BY BEING HONEST", [0, 2.5, -2.0], 1.8, 2.2);
    if (after(t, A(62, "dishonest"))) confetti(c, A(62, "dishonest"), [0, 2.5, -2.2], 3.6);
  },
  // 59 By 1930... why pretend to print money when you could actually print money?
  59: (c) => {
    const t = c.t, ac = after(t, A(63, "actually"));
    cal(c, A(63, "1930,"), "1930", [-3.2, 2.4, -2.4], 0.5);
    LUST(c, -0.8, -1.9, { mode: "stand", expr: ac ? "smug" : "neutral", look: 1, prop: ac ? "bills" : null });
    if (after(t, A(63, "idea."))) stay(c, A(63, "idea."), "idea", 300, 400, fxIdea, [-1.1, 2.5, -1.8], 0.4, 0.53);
  },
  // 60 chemist, fake $100 bills, bank tellers fooled, $100,000 a month
  60: (c) => {
    const t = c.t, tl = after(t, A(64, "bank")), mo = after(t, A(64, "hundred", 1));
    LUST(c, -1.6, -1.9, { mode: "stand", expr: "grin", look: 1, prop: "bills" });
    pose(c, 2, CHEMIST, "chemist", -0.2, -2.2, { mode: "stand", expr: "smile", look: 1, prop: "dropper" });
    if (tl) pose(c, 3, TELLER, "teller", 1.8, -2.1, { mode: "stand", expr: "grin", look: -1, prop: "bills" });
    if (tl) word(c, A(64, "fooled."), "LOOKS REAL!", [1.8, 2.6, -2.1], 1.3, 1.6);
    if (mo) { const k = pop(t, A(64, "hundred", 1)); card(c, "s100k", 400, 220, (p) => fxScore(p, "$100K/MO"), [0, 2.8, -2.4], 1.5 * k, 0.82 * k, { rot: -0.05 }); coins(c, A(64, "hundred", 1), [0, 1.6, -2.2], 3.0, 14); }
  },
  // 61 The Secret Service went after him.
  61: (c) => {
    const t = c.t;
    crowd(c, 2, (k) => AGENT(k), "agent", [-1.2, 0, 1.2], -2.2, (k) => ({ mode: "stand", expr: "stern", look: k === 0 ? 1 : k === 2 ? -1 : 0 }));
    banner(c, A(65, "secret"), "U.S. SECRET SERVICE", [0, 2.8, -2.3], 2.0, "#2f3a7a", 3.0);
    if (after(t, A(65, "after"))) word(c, A(65, "after"), "FIND HIM!", [1.5, 2.4, -2.2], 1.1, 1.6);
  },
  // 62 caught by his girlfriend... anonymous phone call
  62: (c) => {
    const t = c.t, gf = after(t, A(66, "girlfriend.")), ph = after(t, A(66, "anonymous"));
    if (!gf) { xmark(c, A(66, "detective.") + 0.1, [0, 2.0, -2.0], 0.6); pose(c, 2, AGENT(1), "agent1", 0, -2.1, { mode: "stand", expr: "stern", look: 0 }); }
    else {
      pose(c, 2, GIRL, "girl", 0, -1.9, { mode: "stand", expr: ph ? "smug" : after(t, A(66, "cheating")) ? "stern" : "smile", look: 0, prop: ph ? "point" : null });
      if (after(t, A(66, "cheating"))) sayB(c, A(66, "cheating"), "CHEATING?!", [1.3, 2.5, -1.9], 1.1, 2.0);
      if (ph) { stay(c, A(66, "anonymous"), "phone", 260, 460, fxPhone, [-1.0, 1.25, -1.6], 0.45, 0.8); word(c, A(66, "call."), "RING!", [-1.3, 2.3, -1.6], 0.9, 1.4); }
    }
  },
  // 63 In May 1935, agents arrested him on a street in New York. "the smoothest con man that ever lived."
  63: (c) => {
    const t = c.t, ar = after(t, A(67, "arrested"));
    cal(c, A(67, "may"), "1935", [-3.4, 2.4, -2.4], 0.5);
    LUST(c, 0, -1.9, { mode: "stand", expr: ar ? "shock" : "whistle", look: 0, prop: ar ? "handsUp" : null });
    if (ar) crowd(c, 2, (k) => AGENT(k), "agent", [-1.3, 1.3], -2.2, (k) => ({ mode: "stand", expr: "stern", look: k ? -1 : 1, prop: k ? "point" : null }));
    if (after(t, A(67, "smoothest"))) sayB(c, A(67, "smoothest"), "SMOOTHEST CON MAN EVER", [1.8, 2.6, -2.2], 1.9, 3.0);
  },
  // 64 You'd think that was the end. It wasn't.
  64: (c) => {
    const t = c.t, wn = after(t, LS(69));
    banner(c, A(68, "end."), "THE END?", [0, 2.6, -2.2], 1.4, "#1e1a1c", 99);
    if (wn) { xmark(c, LS(69), [0, 2.6, -2.15], 0.7); word(c, LS(69) + 0.1, "NOPE!", [1.2, 2.2, -2.0], 1.2, 1.4); }
  },
  // 65 Sept 1, 1935: bedsheet rope out of the window... escaped.
  65: (c) => {
    const t = c.t, rp = after(t, A(70, "bedsheets")), cl = clamp01((t - A(70, "climbed") + LEAD) / 2.5), es = after(t, A(70, "escaped."));
    cal(c, A(70, "september"), "SEPT 1935", [-3.6, 2.4, -2.6], 0.55);
    if (rp) card(c, "rope", 140, 700, fxRope, [0.6, 3.3, -6.35], 0.45, 2.25);
    if (rp) pose(c, 2, PRISON_L, "lustigP", 0.6 + 0.0 * cl, -6.2, { mode: "stand", expr: es ? "grin" : "nervous", look: 0, prop: es ? null : "handsUp" }, 1, es ? 0 : 3.8 * (1 - cl), es || cl > 0.98);
    banner(c, A(70, "federal"), "FEDERAL DETENTION CENTER", [0.6, 5.4, -6.3], 2.8, "#2f3a5a", 3.0);
    if (es) { word(c, A(70, "escaped."), "ESCAPED!", [1.8, 2.4, -6.0], 1.6, 1.6); }
  },
  // 66 free for almost a month... caught again in Pittsburgh
  66: (c) => {
    const t = c.t, cg = after(t, A(71, "caught"));
    cal(c, A(71, "month,"), "27 DAYS", [-3.2, 2.4, -2.4], 0.55);
    LUST(c, 0, -1.9, { mode: "stand", expr: cg ? "sad" : "whistle", look: 0, prop: cg ? "handsUp" : null });
    if (cg) { crowd(c, 2, (k) => AGENT(k), "agent", [-1.3, 1.3], -2.2, (k) => ({ mode: "stand", expr: "smug", look: k ? -1 : 1 })); banner(c, A(71, "pittsburgh."), "PITTSBURGH", [0, 2.8, -2.4], 1.5, "#2f3a5a", 2.2); }
  },
  // 67 The judge gave him twenty years. The one prison you can't talk your way out of.
  67: (c) => {
    const t = c.t, tw = after(t, A(72, "twenty"));
    pose(c, 2, JUDGE, "judge", 0.3, -3.0, { mode: "stand", expr: "stern", look: -1 });
    if (tw) { const a = 0.6 * Math.exp(-6 * Math.max(0, t - A(72, "twenty"))) * Math.cos(20 * (t - A(72, "twenty"))); card(c, `gavel${q(a, 10)}`, 400, 300, (p) => fxGavel(p, a), [0.9, 1.15, -2.5], 0.6, 0.45); }
    if (tw) { const k = pop(t, A(72, "twenty")); card(c, "s20", 400, 220, (p) => fxScore(p, "20 YRS"), [-0.6, 2.3, -2.8], 1.1 * k, 0.6 * k, { rot: -0.05 }); }
    LUST(c, -1.6, -1.8, { mode: "stand", expr: tw ? "sad" : "nervous", look: 1 }, PRISON_L);
  },
  // 68 Alcatraz. Prisoner number three hundred.
  68: (c) => {
    const t = c.t, pn = after(t, A(73, "prisoner"));
    banner(c, A(73, "alcatraz."), "ALCATRAZ", [0, 32, -100], 26, "#1e1a1c", 3.6);
    if (pn) { LUST(c, 0, -1.6, { mode: "stand", expr: "sad", look: 0 }, PRISON_L); stay(c, A(73, "three"), "plac300", 500, 260, (p) => fxPlacard(p, "#300"), [0, 1.15, -1.45], 0.55, 0.29); crowd(c, 3, () => GUARD, "guard", [-1.4, 1.4], -2.0, (k) => ({ mode: "stand", expr: "stern", look: k ? -1 : 1 })); }
  },
  // 69 never got out. 1947 pneumonia, prison hospital in Missouri.
  69: (c) => {
    const t = c.t;
    cal(c, A(74, "1947"), "1947", [-2.2, 2.3, -2.2], 0.5);
    LUST(c, -0.6, -2.4, { mode: "stand", expr: "sad", look: 0 }, PRISON_L);
  },
  // 70 death certificate: occupation... Apprentice salesman.
  70: (c) => {
    const t = c.t, rv = clamp01((t - A(76, "apprentice") + LEAD) / 0.8);
    insert(c, `cert${q(rv, 8)}`, 600, 760, (p) => fxCert(p, rv), 1.15);
    if (after(t, A(75, "occupation,\""))) spark(c, A(75, "occupation,\""), [5.7, 1.2, 0.1], 0.6, 0.35);
  },
  // 71 The man who sold the Eiffel Tower. A money machine. Conned Capone. Officially, an apprentice. (77-78)
  71: (c) => {
    const t = c.t, ap = after(t, A(77, "apprentice.")), ms = after(t, A(78, "master."));
    LUST(c, 0, -1.8, { mode: "stand", expr: ms ? "smug" : ap ? "innocent" : "smile", look: 0, prop: ms ? "salute" : null });
    const pv: [string, (p: Pen) => void, number, number][] = [["eiffel", fxMiniTower, 300, 500], ["machine.", (p) => fxMoneyBox(p, 0.2, 0), 700, 460], ["capone.", (p) => fxSay(p, "AL CAPONE"), 600, 360]];
    pv.forEach(([w, d, cw, ch], k) => { const tk = A(77, w); if (after(t, tk) && !ap) stay(c, tk, `fin${k}`, cw, ch, d, [-2.4 + 2.4 * k, 2.35, -2.4], k === 0 ? 0.42 : 1.0, (k === 0 ? 0.42 : 1.0) * ch / cw); });
    if (ap) banner(c, A(77, "apprentice."), "AN APPRENTICE?", [0, 2.8, -2.0], 1.8, "#7a3aa0", 99);
    if (after(t, A(78, "master."))) confetti(c, A(78, "master."), [0, 2.6, -2.4], 4);
  },
};
void bang; void fxDoc;
