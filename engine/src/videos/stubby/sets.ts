// Places and cast of "Sergeant Stubby". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, MAT, M4, plane, earthHD, tent, crate } from "./props3d";
import { prop, Kit } from "./build";
import { grassHD, rep, planksHD, water } from "./paint";
import { Pen, SKINS, fxBurst, fxPuff, fxConfetti, fxBang, fxBoom, Outfit, FrontOpts, Expr, dogSide, DogOpts, fxShell, fxGas, fxChevrons, fxFootball, fxWord, fxNoDogs, fxFlag, fxFlashPop, fxQuestion } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, light2D } from "./cast";
import { C } from "./cues";
import { V3, smooth, clamp01, LEAD, SetId } from "./story";

// ---------------- cast ----------------
const KHAKI = "#6b6a42";
const DOUGH = (v: number, extra: Partial<Outfit> = {}): Outfit => ({ jacket: KHAKI, pants: "#5f5e3c", boots: "#5a3b2a", hat: "brodie", buttons: "#c9b36a", belt: "#a89a6a", skin: SKINS[v % 4], moustache: v % 4 === 1 ? "#4a3426" : undefined, ...extra });
const CONROY: Outfit = { ...DOUGH(0), skin: SKINS[0] };
const CONROY_COAT: Outfit = { ...CONROY, jacket: "#5e5d3a", belt: null, pup: true };
const OFFICER: Outfit = { jacket: "#5a5636", pants: "#5a5636", boots: "#3a2618", hat: "peaked", buttons: "#e8c45a", belt: "#8a5a36", moustache: "#4a3020", skin: SKINS[1], build: "stout" };
const SPY: Outfit = { jacket: "#a08c64", pants: "#5d6a7e", boots: "#2a2a30", hat: "fedora", hatCol: "#3a3a42", moustache: "#2a201a", skin: SKINS[2], buttons: "#3a2a20", belt: "#6a5a40" };
const SPY_DE: Outfit = { ...SPY, hat: "pickel" };
const PRES: Outfit[] = [
  { jacket: "#26262e", pants: "#26262e", boots: "#141418", hat: "hair", hair: "#bfbfc6", buttons: "#f4f1ea", skin: SKINS[0] },
  { jacket: "#2e2c38", pants: "#2e2c38", boots: "#141418", hat: "hair", hair: "#d9d9de", buttons: "#f4f1ea", skin: SKINS[2], build: "stout" },
  { jacket: "#2a3040", pants: "#2a3040", boots: "#141418", hat: "hair", hair: "#a87a4a", buttons: "#f4f1ea", skin: SKINS[1] },
];
const FANS: Outfit[] = [
  { jacket: "#1f3a6a", pants: "#3a3a44", boots: "#3a2a20", hat: "cap", cap: "#8a8f98", buttons: "#e8e4d8", skin: SKINS[2] },
  { jacket: "#e6e0f0", pants: "#e6e0f0", boots: "#5a3b2a", dress: "#1f3a6a", hat: "hair", hair: "#3a2a20", skin: SKINS[1] },
  { jacket: "#8a8f98", pants: "#4a4a52", boots: "#3a2a20", hat: "fedora", hatCol: "#4a3a2a", buttons: "#e8c45a", skin: SKINS[3] },
  { jacket: "#f0e0a0", pants: "#f0e0a0", boots: "#5a3b2a", dress: "#8a8f98", hat: "hair", hair: "#d9a24e", skin: SKINS[0] },
  { jacket: "#1f3a6a", pants: "#2e2b36", boots: "#1e1e24", hat: "fedora", hatCol: "#3a3a42", buttons: "#c9ccd2", skin: SKINS[0], build: "stout" },
  { jacket: "#c94a4a", pants: "#3a3a44", boots: "#3a2a20", hat: "cap", cap: "#1f3a6a", buttons: "#f4f1ea", skin: SKINS[2], build: "kid" },
];

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
/** Stubby at (x, y, z) heading along dx (screen right when dx > 0) */
export const PUP = 0.3, DOGS = 0.4;
const dog = (c: Ctx, x: number, z: number, dx: number, oa: DogOpts & Act, scale = DOGS, y = 0, shadow = true) => {
  const { lean = 0, dy = 0, ...o } = oa;
  const mirror = dx * c.cam.right.x < 0 || (dx === 0 && false);
  const d = c.cam.pos.distanceTo(V(x, y + 0.25, z)) / scale;
  const [w, h, k] = d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
  const eye = o.eye ?? (blinkOf(c.t, 1) ? "blink" : "dot");
  const oo: DogOpts = { ...o, eye, phase: q(o.phase ?? 0, 16), wag: q(o.wag ?? 0, 8), light: light2D(c.cam, mirror) };
  c.out.places.push({ key: `dog|${JSON.stringify(oo)}`, x, y: y + dy, z, scale, mirror, draw: (p) => dogSide(p, oo), size: [w, h, k], roll: sway(c.t, 3, 0.02, 0.6) + lean * (mirror ? 1 : -1) });
  if (shadow) blob(c.out, x, y, z, scale * 1.7);
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
const boom = (c: Ctx, at: number, p: V3, size = 3, life = 0.8) => { const u = (c.t - at) / life; if (u < 0 || u >= 1) return; const k = q(u, 20); card(c, `boom${k}`, 500, 500, (pen) => fxBoom(pen, k), p, size, size, { glow: 1.3 }); };
const word = (c: Ctx, at: number, txt: string, p: V3, w: number, life = 0.7, col = "#fff3b0") => { const u = c.t - at + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at) * (u > life - 0.12 ? (life - u) / 0.12 : 1); card(c, `word${txt}${col}`, 600, 300, (pen) => fxWord(pen, txt, col), p, w * k, 0.5 * w * k, { rot: 0.06 * Math.sin(at * 7) }); };
const sweat = (c: Ctx, p: V3, s = 0.07) => { for (let k = 0; k < 2; k++) { const u = (c.t * 1.2 + k / 2) % 1; card(c, "sweat", 120, 160, (pen) => { pen.poly([[60, 10], [100, 100], [60, 150], [20, 100]], "#bfe6ff", 6); }, [p[0] + (k ? 1 : -1) * (0.08 + 0.12 * u), p[1] + 0.1 * Math.sin(Math.PI * u) - 0.05 * u, p[2]], s, s * 1.3); } };
const confetti = (c: Ctx, at: number, p: V3, w: number) => { if (c.t < at - LEAD) return; const k = q(((c.t - at) * 0.35) % 1, 30); card(c, `conf${k}`, 600, 600, (pen) => fxConfetti(pen, k), p, w, w); };
const bang = (c: Ctx, at: number, p: V3, s = 0.14) => { if (!after(c.t, at)) return; const k = pop(c.t, at); card(c, "bang", 200, 400, (pen) => fxBang(pen), p, s * k, 2 * s * k); };
const hatFly = (c: Ctx, at: number, p: V3, dir = 1, life = 1.3) => {
  const u = c.t - at + LEAD; if (u < 0 || u >= life) return;
  card(c, "flyfedora", 300, 200, (pen) => {
    pen.poly([[86, 120], [100, 44], [150, 36], [200, 44], [214, 120]], "#3a3a42", 8); pen.band([[88, 104], [212, 104]], "#1c1c22", 18, 3);
    pen.ell(150, 128, 132, 26, "#2e2e36", 8);
  }, [p[0] + dir * 0.9 * u, p[1] + 2.4 * u - 3.2 * u * u, p[2] + 0.3 * u], 0.36, 0.24, { rot: -dir * 7 * u });
};
const gasCloud = (c: Ctx, at: number, x0: number, x1: number, y: number, z: number, n = 5) => {
  if (c.t < at - LEAD) return;
  const g = smooth((c.t - at) / 1.6);
  for (let k = 0; k < n; k++) { const x = x0 + (x1 - x0) * (k / (n - 1)), s = (2.2 + 0.8 * hh(k, 4)) * g; card(c, `gas${k % 3}`, 600, 400, (pen) => fxGas(pen, k), [x + 0.3 * Math.sin(c.t * 0.5 + k), y + 0.4 * hh(k, 2) - 0.6 * (1 - g), z + 0.3 * hh(k, 3)], s, s * 0.66, { soft: true }); }
};

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const flagpole = (b: Batch, x: number, z: number, h = 7) => {
  b.add(new THREE.CylinderGeometry(0.06, 0.08, h, 10), lam("pole", () => ({ color: "#e9e6de" })), M4(x, h / 2, z));
  b.add(new THREE.SphereGeometry(0.13, 10, 8), lam("poleBall", () => ({ color: "#e8c45a" })), M4(x, h + 0.08, z));
};
const sandbags = (b: Batch, x0: number, x1: number, y: number, z: number, rows = 2) => {
  const S = lam("sandbag", () => ({ color: "#b9a676" })), S2 = lam("sandbag2", () => ({ color: "#a9966a" }));
  for (let r = 0; r < rows; r++) for (let x = x0 + (r % 2) * 0.3; x < x1; x += 0.62) {
    const g = new THREE.CapsuleGeometry(0.15, 0.32, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.75, 1);
    b.add(g, (Math.round(x * 3) + r) % 2 ? S : S2, M4(x + 0.3, y + 0.12 + r * 0.22, z));
  }
};
const barracks = (b: Batch, x: number, z: number, w = 10) => {
  const W = lam("barrackWall", () => ({ color: "#c9b48a" })), R = lam("barrackRoof", () => ({ color: "#5a5a4a", side: THREE.DoubleSide })), D = lam("barrackWin", () => ({ color: "#3a4256" }));
  b.add(boxGeo(V(x - w / 2, 0, z - 2), V(x + w / 2, 2.8, z + 2)), W);
  b.add(quad(V(x - w / 2 - 0.3, 2.7, z + 2.3), V(x + w / 2 + 0.3, 2.7, z + 2.3), V(x + w / 2 + 0.3, 4.0, z), V(x - w / 2 - 0.3, 4.0, z)), R);
  b.add(quad(V(x + w / 2 + 0.3, 2.7, z - 2.3), V(x - w / 2 - 0.3, 2.7, z - 2.3), V(x - w / 2 - 0.3, 4.0, z), V(x + w / 2 + 0.3, 4.0, z)), R);
  for (let k = 0; k < Math.floor(w / 2); k++) b.add(boxGeo(V(x - w / 2 + 0.7 + 2 * k, 1.1, z + 2), V(x - w / 2 + 1.5 + 2 * k, 2.0, z + 2.04)), D);
};
const troopship = (b: Batch, x: number, z: number, L = 34) => {
  const H = lam("shipHull", () => ({ color: "#5d6670" })), Hd = lam("shipHullDark", () => ({ color: "#3a4048" })), Wt = lam("shipWhite", () => ({ color: "#ecebe4" })), Fn = lam("shipFunnel", () => ({ color: "#2a2c34" })), Rd = lam("shipRed", () => ({ color: "#9a2e2a" }));
  b.add(boxGeo(V(x - L / 2, -1, z - 3), V(x + L / 2, 5, z + 3)), H);
  b.add(boxGeo(V(x - L / 2, -1, z - 3.02), V(x + L / 2, 0.2, z + 3.02)), Rd);
  const port = ctex("portholes", 512, 64, (g) => { g.fillStyle = "#5d6670"; g.fillRect(0, 0, 512, 64); g.fillStyle = "#e8e4c8"; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(16 + i * 32, 32, 9, 0, 7); g.fill(); } });
  b.add(quad(V(x - L / 2, 3.2, z + 3.03), V(x + L / 2, 3.2, z + 3.03), V(x + L / 2, 4.0, z + 3.03), V(x - L / 2, 4.0, z + 3.03), 4, 1), lam("portholesM", () => ({ map: rep(port, 4, 1) })));
  b.add(boxGeo(V(x - L / 4, 5, z - 2.4), V(x + L / 4, 8, z + 2.4)), Wt);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(x - L / 4 + 0.6 + 4 * k, 6.1, z + 2.4), V(x - L / 4 + 2.2 + 4 * k, 7.0, z + 2.44)), Hd);
  for (const fx of [-4, 3]) { b.add(new THREE.CylinderGeometry(1.1, 1.2, 5, 16), Fn, M4(x + fx, 10.5, z)); b.add(new THREE.CylinderGeometry(1.22, 1.22, 0.8, 16), Rd, M4(x + fx, 11.6, z)); }
};
const yardTex = () => ctex("yardLines", 1024, 1024, (g) => {
  for (let y = 0; y < 1024; y += 128) { g.fillStyle = (y / 128) % 2 ? "#4f9a3c" : "#5aa846"; g.fillRect(0, y, 1024, 128); }
  g.fillStyle = "#f4f1ea"; for (let y = 0; y < 1024; y += 128) g.fillRect(0, y, 1024, 10);
});
const bleachers = (b: Batch, x0: number, x1: number, z: number, rows = 6) => {
  const S = lam("bleach", () => ({ color: "#9aa0aa" })), Wd = lam("bleachWood", () => ({ color: "#b8875a" }));
  for (let r = 0; r < rows; r++) { b.add(boxGeo(V(x0, 0, z - r * 0.9 - 0.9), V(x1, 0.5 + r * 0.55, z - r * 0.9)), r % 2 ? S : Wd); }
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  camp: (s) => {
    const { b, kit } = s;
    b.add(plane(-160, 160, -160, 60, 1), lam("campGrass", () => ({ map: grassHD() })));
    b.add(plane(-9, 9, -7, 4, 1, 0.01), lam("campDirt", () => ({ map: rep(earthHD(), 1, 1) })));
    for (let k = -3; k <= 3; k++) tent(b, k * 3.6, -9.5, 0, 0.9);
    for (let k = -2; k <= 2; k++) tent(b, k * 3.6 + 1.8, -13, 0, 0.9);
    barracks(b, -9, -5, 8); barracks(b, 11, -6, 10);
    flagpole(b, 2.6, -6.2, 7.2);
    sandbags(b, -6.5, -3.5, 0, -4.4, 2); sandbags(b, 4.2, 7.5, 0, -4.2, 2);
    crate(b, -2.6, 0, -3.6, 0.7, 0.3); crate(b, -1.95, 0, -3.8, 0.6, -0.2); crate(b, -2.3, 0.56, -3.7, 0.5, 0.5);
    for (let k = -7; k <= 7; k++) prop(b, kit, "tree_fat", k * 10 + 3, 0, -26 - 6 * hh(k, 3), 7 + 2 * hh(k, 4));
  },
  dock: (s) => {
    const { b } = s;
    b.add(plane(-200, 200, -200, 80, 40, -1.3), lam("sea", () => ({ map: rep(water(), 40, 40), color: "#7ab8d8" })));
    b.add(plane(-12, 12, -3.2, 6, 1, 0), lam("pier", () => ({ map: planksHD() })));
    b.add(boxGeo(V(-12, -1.3, -3.2), V(12, 0, -3.0)), MAT.darkWood());
    for (let x = -11; x <= 11; x += 2.2) b.add(new THREE.CylinderGeometry(0.16, 0.16, 2.2, 8), MAT.darkWood(), M4(x, -0.4, -3.15));
    troopship(b, 4, -8.5, 34);
    // gangplank from the pier up to the deck
    const G = lam("gang", () => ({ color: "#8a6a44" }));
    const gp = new THREE.BoxGeometry(5.8, 0.12, 1.2); gp.rotateZ(Math.atan2(4.2, 4));
    b.add(gp, G, M4(-1.6, 2.1, -4.2));
    crate(b, -5.5, 0, -1.8, 0.8, 0.2); crate(b, -4.7, 0, -2.2, 0.7, -0.3); crate(b, 5.6, 0, -1.6, 0.8, 0.1);
    for (const x of [-7.5, 7.8]) b.add(new THREE.CylinderGeometry(0.22, 0.26, 0.6, 12), lam("bollard", () => ({ color: "#2a2c34" })), M4(x, 0.3, -2.6));
  },
  ship: (s) => {
    const { b } = s;
    b.add(plane(-300, 300, -300, 300, 60, -4), lam("seaDeep", () => ({ map: rep(water(), 60, 60), color: "#5aa0c8" })));
    b.add(plane(-12, 12, -3.4, 6, 1, 0), lam("deck", () => ({ map: planksHD() })));
    const Rw = lam("rail", () => ({ color: "#f4f1ea" }));
    for (let x = -12; x <= 12; x += 1.2) b.add(boxGeo(V(x - 0.04, 0, -3.3), V(x + 0.04, 1.05, -3.22)), Rw);
    for (const y of [0.55, 1.0]) b.add(boxGeo(V(-12, y, -3.3), V(12, y + 0.06, -3.22)), Rw);
    b.add(boxGeo(V(-12, -4, -3.45), V(12, 0, -3.35)), lam("hullSide", () => ({ color: "#5d6670" })));
    // superstructure behind the camera's right, funnel, ventilators, lifeboat
    b.add(boxGeo(V(6, 0, -3.0), V(12, 3.2, 6)), lam("shipWhiteD", () => ({ color: "#ecebe4" })));
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(6 - 0.04, 1.4, -2 + 2 * k), V(6, 2.3, -1.2 + 2 * k)), lam("shipWin", () => ({ color: "#3a4256" })));
    b.add(new THREE.CylinderGeometry(1.0, 1.1, 6, 16), lam("funnelD", () => ({ color: "#2a2c34" })), M4(9, 6, 1));
    b.add(new THREE.CylinderGeometry(1.12, 1.12, 0.7, 16), lam("funnelR", () => ({ color: "#9a2e2a" })), M4(9, 8.4, 1));
    for (const [x, z] of [[-4, -1.8], [-6.5, 1.6]]) { b.add(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 12), lam("vent", () => ({ color: "#e9e6de" })), M4(x, 0.8, z)); b.add(new THREE.CylinderGeometry(0.42, 0.3, 0.5, 12, 1, true).rotateX(-0.8), lam("ventMouth", () => ({ color: "#c0353a", side: THREE.DoubleSide })), M4(x, 1.75, z + 0.15)); }
    const lb = new THREE.CapsuleGeometry(0.55, 2.6, 4, 12).rotateZ(Math.PI / 2).scale(1, 0.6, 1);
    b.add(lb, lam("lifeboat", () => ({ color: "#f4f1ea" })), M4(-8.5, 1.6, -2.4));
    crate(b, 2.6, 0, -2.4, 0.7, 0.2); crate(b, 3.3, 0, -2.6, 0.6, -0.4);
  },
  trench: (s) => {
    const { b } = s;
    b.add(plane(-160, 160, -160, 160, 1, 2.0), lam("noMansLand", () => ({ map: rep(earthHD("mudHD", ["#8a7458", "#7d6a50", "#968060", "#6e5e46"], "#6a7a46"), 30, 30) })));
    const E = lam("trenchWall", () => ({ map: rep(earthHD("mudWall", ["#7a6448", "#6e5a40", "#866e50", "#64523c"], "#5e6a40"), 6, 1) }));
    b.add(quad(V(-30, 0, -1.6), V(30, 0, -1.6), V(30, 2.0, -1.6), V(-30, 2.0, -1.6), 6, 1), E);
    b.add(quad(V(30, 0, 2.6), V(-30, 0, 2.6), V(-30, 2.0, 2.6), V(30, 2.0, 2.6), 6, 1), E);
    b.add(plane(-30, 30, -1.6, 2.6, 1, 0), lam("trenchFloor", () => ({ color: "#5e4e3a" })));
    // duckboards, revetment posts, sandbag parapet, barbed wire posts
    const Dk = lam("duck", () => ({ color: "#9a7650" }));
    for (let x = -30; x < 30; x += 0.5) b.add(boxGeo(V(x, 0.02, -0.2), V(x + 0.36, 0.08, 0.9)), Dk);
    for (let x = -30; x < 30; x += 2.4) { b.add(boxGeo(V(x - 0.07, 0, -1.6), V(x + 0.07, 2.0, -1.5)), MAT.darkWood()); b.add(boxGeo(V(x - 0.07, 0, 2.5), V(x + 0.07, 2.0, 2.6)), MAT.darkWood()); }
    sandbags(b, -30, 30, 2.0, -1.75, 2); sandbags(b, -30, 30, 2.0, 2.75, 1);
    const Wr = lam("wire", () => ({ color: "#4a4440" }));
    for (let x = -26; x < 26; x += 3) { const g = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6); b.add(g, Wr, M4(x, 2.7, -4.5)); b.add(new THREE.TorusGeometry(0.5, 0.02, 4, 16), Wr, M4(x + 1.5, 2.5, -4.6)); }
    for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.15, 0.2, 2.5 + hh(k, 2) * 2, 6), MAT.darkWood(), M4(-20 + k * 8 + 3 * hh(k, 1), 3.2, -14 - 6 * hh(k, 3)));
  },
  hall: (s) => {
    const { b } = s;
    b.add(plane(-10, 10, -6, 8, 1), lam("hallFloor", () => ({ map: planksHD(), color: "#c9a27a" })));
    b.add(plane(-1.3, 1.3, -6, 8, 1, 0.01), lam("carpet", () => ({ color: "#a8262a" })));
    const Wl = lam("hallWall", () => ({ color: "#efe6d2" }));
    b.add(quad(V(-10, 0, -4.2), V(10, 0, -4.2), V(10, 6, -4.2), V(-10, 6, -4.2)), Wl);
    for (const sx of [-1, 1]) b.add(quad(V(sx * 7, 0, sx < 0 ? 8 : -4.2), V(sx * 7, 0, sx < 0 ? -4.2 : 8), V(sx * 7, 6, sx < 0 ? -4.2 : 8), V(sx * 7, 6, sx < 0 ? 8 : -4.2)), Wl);
    for (const x of [-4.5, -2, 2, 4.5]) { b.add(new THREE.CylinderGeometry(0.3, 0.34, 5.4, 18), lam("column", () => ({ color: "#f8f4ea" })), M4(x, 2.7, -3.7)); b.add(boxGeo(V(x - 0.42, 5.4, -4.1), V(x + 0.42, 5.7, -3.3)), lam("colCap", () => ({ color: "#f8f4ea" }))); }
    for (const x of [-3.25, 3.25]) { b.add(boxGeo(V(x - 0.7, 1.6, -4.18), V(x + 0.7, 3.4, -4.12)), lam("portraitFrame", () => ({ color: "#c9a14a" }))); b.add(boxGeo(V(x - 0.56, 1.74, -4.12), V(x + 0.56, 3.26, -4.08)), lam("portrait", () => ({ color: "#5a4a3a" }))); }
    b.add(boxGeo(V(-0.9, 1.0, -4.18), V(0.9, 4.2, -4.12)), lam("hallWindow", () => ({ color: "#b8d4ea" })));
    for (const x of [-1.05, 1.05]) b.add(boxGeo(V(x - 0.22, 0.8, -4.15), V(x + 0.22, 4.5, -4.05)), lam("drape", () => ({ color: "#2f3f7a" })));
  },
  field: (s) => {
    const { b, kit } = s;
    b.add(plane(-160, 160, -160, 60, 1), lam("fieldOuter", () => ({ map: grassHD() })));
    b.add(plane(-20, 20, -8, 8, 1, 0.01), lam("yard", () => ({ map: rep(yardTex(), 3, 1) })));
    bleachers(b, -16, 16, -9, 7);
    const Gp = lam("goal", () => ({ color: "#f6c83a" }));
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), Gp, M4(-12, 1.5, -2));
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 5.6, 8).rotateZ(Math.PI / 2), Gp, M4(-12, 3, -2));
    for (const dz of [-2.8, 2.8]) b.add(new THREE.CylinderGeometry(0.06, 0.06, 4, 8), Gp, M4(-12 + dz, 5, -2));
    for (let k = -7; k <= 7; k++) prop(b, kit, "tree_fat", k * 11 + 4, 0, -30 - 6 * hh(k, 3), 8 + 2 * hh(k, 4));
  },
};

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- tracked positions (shared with cams.ts) ----------------
/** shot 1: the stray trots in from screen-left and stops by the crates */
export const pup1X = (t: number) => Math.min(-0.2, -2.6 + 0.8 * t);
/** shot 3/4 soldiers file up the gangplank */
/** shot 9: Stubby runs down the trench (toward -x) barking */
export const run9X = (t: number) => 3.2 - 1.6 * Math.max(0, t - C.run6);
/** shot 10: the stranger tiptoes across */
export const spy10X = (t: number) => -1.1 + 0.26 * (t - C.l7);
/** shot 12: the spy runs on the spot, Stubby hanging on */
export const SPY12: V3 = [0.3, 0, -1.6];
/** shot 16: Stubby pushes the ball along the grass */
export const push16X = (t: number) => -0.9 + 0.5 * Math.max(0, t - C.pushing + 0.8);

// ---------------- staging per shot ----------------
type StageFn = (c: Ctx) => void;
const drill = (c: Ctx, n: number, x0: number, z: number, i0 = 30) => {
  for (let k = 0; k < n; k++) { const x = ((x0 + 0.9 * k + 0.6 * c.t + 30) % 12) - 6; pose(c, i0 + k, DOUGH(k + 2, { rifle: true }), `dr${k}`, x, z - 0.2 * k, { mode: "march", phase: (c.t * 1.2) % 1, expr: "stern" }, 1); }
};
export const STAGE: Record<number, StageFn> = {
  // 1 1917: a stray puppy wanders onto an army camp
  1: (c) => {
    const t = c.t, x = pup1X(t), stop = x >= -0.2;
    drill(c, 4, 0, -5.2);
    dog(c, x, -1.4, 1, { mode: stop ? (after(t, C.camp0) ? "sit" : "walk") : "walk", phase: (t * 1.6) % 1, tongue: after(t, C.camp0), wag: after(t, C.camp0) ? t * 2 : 0, ears: stop ? 0.6 : 0, eye: after(t, C.camp0) ? "happy" : undefined, lean: jolt(t, C.camp0, 0.1), dy: hop(t, C.camp0, 0.05, 0.25) }, PUP);
    pose(c, 1, CONROY, "conroy", 1.5, -2.4, { mode: "stand", expr: after(t, C.camp0) ? "awe" : "neutral", look: -1, lean: jolt(t, C.camp0 + 0.1, 0.08) });
    card(c, `flag${q((t * 1.5) % 1, 6)}`, 600, 380, (p) => fxFlag(p), [3.25, 6.5, -6.2], 1.3, 0.82, { rot: 0.04 * Math.sin(t * 2.4), yaw: 0.25 });
  },
  // 2 the soldiers named him Stubby. Mostly because of the tail.
  2: (c) => {
    const t = c.t, nm = after(t, C.stubby1), tl = after(t, C.tail);
    dog(c, 0, -1.2, 1, { mode: tl ? "walk" : "sit", phase: tl ? 0.15 : 0, tongue: true, eye: nm ? "happy" : undefined, wag: t * (tl ? 3 : 1.5), ears: 0.6, dy: hop(t, C.stubby1, 0.05, 0.25) }, PUP);
    pose(c, 1, CONROY, "conroy", 0.9, -1.9, { mode: "stand", expr: nm ? cyc(t, ["grin", "laugh"] as Expr[], 2) : "smile", prop: nm && !tl ? "point" : null, lean: jolt(t, C.stubby1, -0.1) });
    pose(c, 2, DOUGH(1), "d1", -1.0, -2.1, { mode: "stand", expr: nm ? "grin" : "awe", lean: jolt(t, C.stubby1 + 0.1, 0.08) });
    pose(c, 3, DOUGH(3), "d3", -0.1, -2.9, { mode: "stand", expr: tl ? "laugh" : "smile", dy: tl ? bounce(t, 3, 0.04) : 0 });
    if (tl) { const k = pop(t, C.tail); card(c, "q", 300, 400, (p) => fxQuestion(p), [-0.35, 0.62, -1.15], 0.16 * k, 0.21 * k); }
  },
  // 3 the troops shipped out to France; dogs weren't allowed
  3: (c) => {
    const t = c.t, dg = after(t, C.dogs);
    for (let k = 0; k < 7; k++) {
      const sd = (t - C.l2) * 0.9 - k * 1.15 + 1.5;
      if (sd < 0) { const x = -3.6 + sd; if (x < -9) continue; pose(c, 10 + k, DOUGH(k + 1), `q${k % 4}`, x, -2.7, { mode: "march", phase: (t * 1.3 + 0.3 * k) % 1, expr: "grin" }); }
      else { const y = 0.72 * sd; if (y > 4.2) continue; pose(c, 10 + k, DOUGH(k + 1), `q${k % 4}`, -3.6 + 0.69 * sd, -4.2, { mode: "march", phase: (t * 1.3 + 0.3 * k) % 1, expr: "grin" }, 1, y + 0.06, false); }
    }
    dog(c, 1.6, -0.6, -1, { mode: "sit", ears: dg ? -0.8 : 0.5, eye: dg ? "shock" : undefined, lean: jolt(t, C.dogs, -0.15), dy: hop(t, C.allowed, 0.04, 0.2) }, PUP);
    if (dg) { const k = pop(t, C.dogs); card(c, "nodogs", 400, 500, (p) => fxNoDogs(p), [2.3, 0.62 * k, -0.9], 0.75 * k, 0.94 * k); }
  },
  // 4 so a private hid him under his coat. Very professional.
  4: (c) => {
    const t = c.t, hid = after(t, C.hid), vp = after(t, C.very);
    pose(c, 1, hid ? CONROY_COAT : { ...CONROY, jacket: "#5e5d3a", belt: null }, hid ? "conroyC" : "conroyC0", 0.1, -1.4, { mode: "stand", expr: vp ? cyc(t, ["whistle", "smug"] as Expr[], 1.2) : hid ? "nervous" : "smile", look: vp ? q(Math.sin(t * 1.6), 4) : 0, lean: jolt(t, C.hid, 0.1), dy: hop(t, C.hid, 0.06, 0.25) });
    if (!hid) dog(c, 0.75, -1.1, -1, { mode: "sit", tongue: true, wag: t * 2, ears: 0.6 }, PUP);
    puff(c, C.hid, [0.25, 1.05, -1.3], 0.7, 0.5);
    if (vp) sweat(c, [0.15, 2.0, -1.35], 0.06);
  },
  // 5 on the ship, the commanding officer found him
  5: (c) => {
    const t = c.t, of = after(t, C.officer3), fd = after(t, C.found);
    pose(c, 1, CONROY_COAT, "conroyC", -0.4, -1.5, { mode: "stand", expr: fd ? "shock" : of ? "nervous" : "whistle", lean: jolt(t, C.found, 0.15), dy: hop(t, C.found, 0.1, 0.28) });
    if (of) pose(c, 2, OFFICER, "officer", 0.95 + 0.6 * (1 - smooth((t - C.officer3) / 0.5)), -1.8, { mode: "stand", expr: fd ? "stern" : "neutral", look: -1, lean: jolt(t, C.officer3, -0.08) });
    if (fd) { bang(c, C.found, [0.95, 2.45, -1.75], 0.13); sweat(c, [-0.4, 2.0, -1.45], 0.06); }
  },
  // 6 Stubby looked up... and saluted
  6: (c) => {
    const t = c.t, lk = after(t, C.looked), sa = after(t, C.saluted);
    dog(c, -0.35, -1.0, 1, { mode: sa ? "salute" : "sit", eye: sa ? "proud" : lk ? "dot" : "blink", ears: 0.8, lean: jolt(t, C.saluted, -0.1), dy: hop(t, C.saluted, 0.05, 0.25) }, PUP);
    pose(c, 2, OFFICER, "officer", 0.75, -1.6, { mode: "stand", expr: sa ? "shock" : "stern", look: -1, lean: jolt(t, C.saluted + 0.08, 0.14), dy: hop(t, C.saluted + 0.08, 0.08, 0.25) });
    pose(c, 1, CONROY, "conroy", -1.5, -2.2, { mode: "stand", expr: sa ? "shock" : "nervous" }, 1);
    if (sa) spark(c, C.saluted, [-0.2, 0.62, -0.95], 0.4, 0.3, "#ffffff");
  },
  // 7 the officer let him stay
  7: (c) => {
    const t = c.t, lt = after(t, C.let);
    dog(c, -0.35, -1.0, 1, { mode: lt ? "sit" : "salute", eye: lt ? "happy" : "proud", tongue: lt, wag: lt ? t * 3 : 0, ears: 0.8, dy: hop(t, C.stay, 0.06, 0.25) }, PUP);
    pose(c, 2, OFFICER, "officer", 0.75, -1.6, { mode: "stand", expr: lt ? cyc(t, ["grin", "smile"] as Expr[], 1.2) : "awe", look: -1, prop: lt ? "salute" : null, lean: jolt(t, C.let, -0.08) });
    pose(c, 1, CONROY, "conroy", -1.5, -2.2, { mode: "stand", expr: lt ? "relief_open" : "nervous", dy: hop(t, C.stay, 0.08, 0.3) });
  },
  // 8 the trenches: Stubby hears shells before anyone else
  8: (c) => {
    const t = c.t, hr = after(t, C.hear), sh = after(t, C.shells);
    for (let k = 0; k < 3; k++) pose(c, 10 + k, DOUGH(k + 1, { rifle: k === 1 }), `t${k}`, -3.6 + 1.3 * k, -0.9 - 0.2 * (k % 2), { mode: "stand", expr: sh && t > C.shells + 1.2 ? "shock" : "smile", look: 1, lean: jolt(t, C.shells + 1.2, -0.15), dy: hop(t, C.shells + 1.2, 0.1, 0.3) });
    dog(c, 1.0, 0.9, -1, { mode: "sit", ears: hr ? 1.6 : 0.4, eye: hr ? "shock" : "dot", lean: jolt(t, C.hear, 0.15), dy: hop(t, C.hear, 0.07, 0.25) }, DOGS);
    if (sh) { const u = (t - C.shells) / 1.4; if (u < 1) card(c, "shell", 300, 300, (p) => fxShell(p), [-5 + 9 * u, 7.5 - 4 * u, -7], 1.2, 1.2); }
    boom(c, C.shells + 1.2, [3.2, 3.4, -9], 5, 0.9);
  },
  // 9 he could smell gas: runs down the trench barking until everyone put their masks on
  9: (c) => {
    const t = c.t, gs = after(t, C.gas), rn = after(t, C.run6), mk = after(t, C.masks);
    gasCloud(c, C.gas - 0.3, -8, 6, 2.6, -2.6, 6);
    for (let k = 0; k < 4; k++) {
      const x = -3.4 + 1.5 * k, on = after(t, C.everyone + 0.25 * k) || mk;
      pose(c, 10 + k, DOUGH(k + 1, { mask: on }), `m${k}${on ? 1 : 0}`, x, -0.9 - 0.2 * (k % 2), { mode: "stand", expr: rn && !on ? "shock" : "neutral", look: 1, lean: jolt(t, C.everyone + 0.25 * k, 0.1), dy: hop(t, C.everyone + 0.25 * k, 0.08, 0.25) });
    }
    const x = rn ? run9X(t) : 3.2, bk = rn && !mk;
    dog(c, x, 0.9, rn ? -1 : 1, { mode: mk ? "sit" : rn ? (Math.floor(t * 3) % 2 ? "bark" : "run") : "sit", phase: (t * 2.4) % 1, ears: gs ? 1.4 : 0.6, eye: mk ? "proud" : gs ? "stern" : "dot", mask: mk, coat: 1 }, DOGS);
    if (bk) for (const tb of [C.run6, C.run6 + 0.9, C.barking, C.barking + 0.9, C.everyone]) word(c, tb, "WOOF!", [run9X(tb + 0.1) - 0.2, 1.15, 0.9], 0.8, 0.55);
  },
  // 10 a stranger sneaking around the camp; Stubby didn't like him
  10: (c) => {
    const t = c.t, x = spy10X(t), dl = after(t, C.stubby7);
    pose(c, 1, SPY, "spy", x, -2.4, { mode: "stroll", phase: (t * 0.9) % 1, expr: cyc(t, ["whistle", "smug"] as Expr[], 0.8), look: 1, tilt: -6, lean: 0.06 }, 1);
    dog(c, 1.0, -0.6, -1, { mode: dl ? "bark" : "sit", eye: dl ? "stern" : "dot", ears: dl ? 1.2 : 0.5, coat: 1, lean: jolt(t, C.stubby7, 0.12) }, DOGS);
    if (dl) word(c, C.like, "GRRR", [0.7, 1.05, -0.5], 0.7, 1.2, "#ffd0c0");
  },
  // 11 turns out, he was a German spy
  11: (c) => {
    const t = c.t, gr = after(t, C.german);
    pose(c, 1, gr ? SPY_DE : SPY, gr ? "spyDE" : "spy", 0.2, -2.0, { mode: "stand", expr: gr ? "shock" : "smug", lean: jolt(t, C.german, 0.16), dy: hop(t, C.german, 0.12, 0.3) });
    hatFly(c, C.german, [0.2, 2.25, -1.98], 1);
    dog(c, 1.35, -1.2, -1, { mode: gr ? "bark" : "sit", eye: "stern", ears: 1.2, coat: 1 }, DOGS);
    if (gr) { word(c, C.spy, "SPY!", [-0.6, 2.4, -1.6], 1.0, 1.4); bang(c, C.german, [0.55, 2.6, -1.9], 0.12); }
  },
  // 12 Stubby grabbed him by the seat of his pants, and didn't let go until the soldiers arrived
  12: (c) => {
    const t = c.t, gb = after(t, C.grabbed), ar = after(t, C.soldiers9);
    const [sx, , sz] = SPY12, run = gb && !ar;
    pose(c, 1, SPY_DE, "spyDE", sx, sz, { mode: run ? "march" : "stand", phase: (t * 2.6) % 1, expr: ar ? "nervous" : gb ? "shock" : "shock", prop: ar ? "shrug" : null, look: -1, tilt: run ? 8 : 0, lean: jolt(t, C.grabbed, 0.2) });
    if (gb) dog(c, sx - 0.42, sz + 0.12, 1, { mode: "bite", scrap: true, eye: "stern", ears: 1, coat: 1, lean: run ? 0.06 * Math.sin(t * 6) : 0 }, DOGS, run ? 0.42 + 0.03 * Math.sin(t * 5) : 0.38, false);
    else dog(c, sx - 1.5, sz + 0.2, 1, { mode: "run", phase: (t * 2.4) % 1, eye: "stern", ears: -0.8, coat: 1 }, DOGS);
    if (run) for (let k = 0; k < 2; k++) puff(c, C.grabbed + 0.35 * k + Math.floor((t - C.grabbed) / 0.7) * 0.7, [sx + 0.2 * (k ? 1 : -1), 0.12, sz + 0.1], 0.5, 0.45);
    if (gb) spark(c, C.grabbed, [sx - 0.1, 0.9, sz + 0.2], 0.7, 0.3, "#ffffff");
    for (let k = 0; k < 3; k++) { const u = smooth((t - C.soldiers9 - 0.15 * k) / 0.8); if (u <= 0) continue; pose(c, 20 + k, DOUGH(k + 1, { rifle: true }), `ar${k}`, 1.1 + 0.65 * k + 2.5 * (1 - u), sz + 0.1 - 0.35 * k, { mode: u < 1 ? "march" : "stand", phase: (t * 2) % 1, expr: "stern", look: -1 }); }
  },
  // 13 for that, Stubby got promoted. To Sergeant.
  13: (c) => {
    const t = c.t, pr = after(t, C.promoted), sg = after(t, C.sergeant);
    dog(c, 0, -1.0, 1, { mode: "sit", coat: sg ? 2 : 1, eye: sg ? "proud" : pr ? "happy" : "dot", ears: 0.8, dy: hop(t, C.sergeant, 0.07, 0.3) }, DOGS);
    pose(c, 2, OFFICER, "officer", 1.0, -1.6, { mode: "stand", expr: pr ? "grin" : "smile", look: -1, prop: sg ? "salute" : null });
    for (let k = 0; k < 4; k++) pose(c, 10 + k, DOUGH(k + 1, { rifle: true }), `pr${k}`, -2.6 + 0.9 * k, -3.0, { mode: "stand", expr: sg ? cyc(t, ["grin", "laugh"] as Expr[], 2, k) : "smile", dy: sg ? bounce(t, k, 0.04) : 0 });
    if (sg) { const k = pop(t, C.sergeant); card(c, "chev", 300, 300, (p) => fxChevrons(p), [0.05, 1.45, -0.9], 0.5 * k, 0.5 * k, { rot: 0.05 * Math.sin(t * 2) }); spark(c, C.sergeant, [0.05, 1.45, -0.95], 1.2, 0.35, "#ffffff"); }
    else if (pr) spark(c, C.promoted, [0.05, 0.7, -0.95], 0.8, 0.3, "#ffffff");
  },
  // 14 technically he outranked the guy who smuggled him in
  14: (c) => {
    const t = c.t, ou = after(t, C.outranked), sm = after(t, C.smuggled);
    dog(c, 0.55, -1.0, -1, { mode: "sit", coat: 2, eye: ou ? "smug" : "proud", ears: 0.8 }, DOGS);
    pose(c, 1, CONROY, "conroy", -0.5, -1.6, { mode: "stand", expr: sm ? cyc(t, ["nervous", "grin"] as Expr[], 1.2) : ou ? "awe" : "smile", prop: ou ? "salute" : null, lean: jolt(t, C.outranked, -0.1), dy: hop(t, C.outranked, 0.06, 0.25) });
    if (ou) spark(c, C.outranked, [0.5, 0.9, -0.95], 0.6, 0.3);
  },
  // 15 after the war he met three American presidents
  15: (c) => {
    const t = c.t, pz = after(t, C.presidents);
    dog(c, 0, -1.0, 1, { mode: after(t, C.three) ? "beg" : "sit", coat: 3, eye: pz ? "proud" : "happy", ears: 0.8, tongue: !pz, wag: t * 2 }, DOGS);
    for (let k = 0; k < 3; k++) { pose(c, 10 + k, PRES[k], `pres${k}`, -1.0 + 1.0 * k, -1.9 - (k === 1 ? 0.45 : 0), { mode: "stand", expr: pz ? "grin" : "smile", look: k === 0 ? 1 : k === 2 ? -1 : 0, dy: hop(t, C.met + 0.35 * k, 0.05, 0.25) }); }
    if (pz) for (let k = 0; k < 3; k++) { const at = C.presidents + 0.45 * k; const u = (t - at) / 0.25; if (u >= 0 && u < 1) card(c, "flashpop", 300, 300, (p) => fxFlashPop(p), [-2.5 + 2.5 * k, 2.2, 0.6], 0.9, 0.9, { glow: 2 }); }
  },
  // 16 a college football mascot, pushing the ball around at halftime
  16: (c) => {
    const t = c.t, ps = after(t, C.pushing - 0.8), x = push16X(t);
    dog(c, x, -0.4, 1, { mode: ps ? "push" : "sit", phase: (t * 1.4) % 1, coat: 3, eye: ps ? "happy" : "proud", ears: 0.6 }, DOGS);
    card(c, "football", 300, 200, (p) => fxFootball(p), [x + 0.55, 0.11, -0.3], 0.25, 0.17, { rot: ps ? -t * 3 : 0 });
    for (let k = 0; k < 14; k++) { const r = k % 3, col = Math.floor(k / 3); pose(c, 20 + k, FANS[k % 6], `fan${k % 6}`, -6 + 2.6 * col + 1.2 * r + 0.3 * hh(k, 2), -9.4 - 0.9 * r - 0.45, { mode: "stand", expr: cyc(t, ["laugh", "grin"] as Expr[], 2.5, k), wave: k % 3 === 1 ? q(Math.sin(t * 6 + k), 10) : undefined, dy: bounce(t, k, 0.06) }, FANS[k % 6].build === "kid" ? 0.8 : 1, 0.5 + r * 0.55, false); }
    if (after(t, C.mascot)) confetti(c, C.mascot, [0, 2.6, -2.5], 4);
  },
  // 17 not bad... for a stray
  17: (c) => {
    const t = c.t, st = after(t, C.stray13);
    dog(c, 0, -0.8, 1, { mode: st ? "salute" : "sit", coat: 3, eye: st ? "proud" : "smug", ears: 0.8, tongue: !st, wag: st ? 0 : t * 2, dy: hop(t, C.stray13, 0.06, 0.3) }, DOGS);
    card(c, "football", 300, 200, (p) => fxFootball(p), [-0.6, 0.11, -0.6], 0.25, 0.17, { rot: 0.3 });
    for (let k = 0; k < 14; k++) { const r = k % 3, col = Math.floor(k / 3); pose(c, 20 + k, FANS[k % 6], `fan${k % 6}`, -6 + 2.6 * col + 1.2 * r + 0.3 * hh(k, 2), -9.4 - 0.9 * r - 0.45, { mode: "stand", expr: cyc(t, ["laugh", "grin"] as Expr[], 2.5, k), wave: k % 3 === 1 ? q(Math.sin(t * 6 + k), 10) : undefined, dy: bounce(t, k, 0.06) }, FANS[k % 6].build === "kid" ? 0.8 : 1, 0.5 + r * 0.55, false); }
    confetti(c, C.l13, [0, 2.4, -1.6], 4);
    if (st) spark(c, C.stray13, [0.1, 1.0, -0.75], 1.0, 0.35, "#ffffff");
  },
};
