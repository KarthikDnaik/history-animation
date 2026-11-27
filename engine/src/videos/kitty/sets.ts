// Places and cast of "Acoustic Kitty". Cameras mostly sit on the +z side looking toward -z, so +x = screen right.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, ctex, rng, MAT, M4, plane, block } from "./props3d";
import { prop, Kit } from "./build";
import { grassHD, rep, planksHD } from "./paint";
import { Pen, INK, SKINS, fxBurst, fxSmoke, Outfit, FrontOpts, catSide, CatOpts, fxBulb, fxQuestion, fxZ, fxHeartFx, fxWaves, fxSpeed, fxBowl, fxMug, fxMemo, fxCash, Expr } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, light2D } from "./cast";
import { NOINK } from "./ink";
import { C } from "./cues";
import { FPS, V3, smooth, clamp01, LEAD, SetId } from "./story";

// ---------------- cast ----------------
const AGENT: Outfit = { jacket: "#33384a", pants: "#2a2e3c", boots: "#1e1e24", hat: "fedora", hatCol: "#4a4a54", trim: "#1c1c22", buttons: "#c9ccd2", skin: SKINS[0] };
const AGENT2: Outfit = { jacket: "#4a4038", pants: "#36302a", boots: "#1e1e24", hat: "fedora", hatCol: "#6a5a44", trim: "#2a2018", buttons: "#c9ccd2", skin: SKINS[2] };
const BOSS: Outfit = { jacket: "#4a4c58", pants: "#3a3c46", boots: "#1e1e24", hat: "hair", hair: "#c9c9d2", moustache: "#c9c9d2", buttons: "#e8c45a", skin: SKINS[1], build: "stout" };
const VET: Outfit = { jacket: "#f4f4f0", pants: "#cfd8dc", boots: "#5a5a62", hat: "hair", hair: "#6a4a30", buttons: "#9aa0aa", skin: SKINS[1] };
const SOV: Outfit = { jacket: "#6a6458", pants: "#3a3a40", boots: "#2a2420", hat: "ushanka", hatCol: "#4a3a2e", buttons: "#2a2a2a", skin: SKINS[0], moustache: "#3a2a1e", build: "stout" };
const SOV2: Outfit = { jacket: "#4f5560", pants: "#2e3036", boots: "#2a2420", hat: "ushanka", hatCol: "#3a3a40", buttons: "#2a2a2a", skin: SKINS[2] };
const TOWN1: Outfit = { jacket: "#8a4a3a", pants: "#3a3a44", boots: "#3a2a20", hat: "hair", hair: "#3a2a20", buttons: "#e8c45a", skin: SKINS[3] };
const TOWN2: Outfit = { jacket: "#3f6a8a", pants: "#4a4a52", boots: "#3a2a20", hat: "cap", cap: "#c9a24e", buttons: "#e8e4d8", skin: SKINS[1] };
const OLD: Outfit = { jacket: "#8a5a3e", pants: "#4a4a52", boots: "#3a2a20", hat: "hair", hair: "#e6e6ea", moustache: "#e6e6ea", buttons: "#e8c45a", skin: SKINS[0], build: "stout" };

type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
const ramp = (t: number, a: number, b: number) => smooth((t - a) / Math.max(0.01, b - a));
// ---------------- life: card-level motion (no redraw): idle sway, reaction jolts, hops ----------------
type Act = { lean?: number; dy?: number };
const sway = (t: number, i: number, amp = 0.03, hz = 0.5) => amp * Math.sin(2 * Math.PI * (hz * t + hh(i, 5))) + 0.4 * amp * Math.sin(2 * Math.PI * (1.7 * hz * t + hh(i, 6)));
const jolt = (t: number, at: number, amp: number) => { const u = t - at + LEAD; return u < 0 ? 0 : amp * Math.exp(-u * 6) * Math.cos(u * 20); };
const hop = (t: number, at: number, h = 0.12, d = 0.3) => { const u = (t - at + LEAD) / d; return u < 0 || u > 1 ? 0 : h * Math.sin(Math.PI * u); };
const bounce = (t: number, i: number, h = 0.06, hz = 2.2) => h * Math.abs(Math.sin(Math.PI * (hz * t + hh(i, 7))));
const cyc = <T,>(t: number, list: T[], hz = 2.5, i = 0): T => list[Math.floor(t * hz + hh(i, 8) * list.length) % list.length];
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0, shadow = true) => {
  const { lean = 0, dy = 0, ...f } = fo;
  const pl = person(c.cam, { i, o, okey } as Who, x, y + dy, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...f }, {}, scale);
  pl.roll = sway(c.t, i) + lean;
  c.out.places.push(pl);
  if (shadow && f.mode !== "fall" && y < 0.05) blob(c.out, x, y, z, scale);
};
const blinkOf = (t: number, i: number) => { const f = Math.round(t * FPS), s = Math.round(40 * hh(i, 9)); return (f + s) % Math.round(55 + 30 * hh(i, 3)) < 3; };
/** the cat at (x, y, z) heading along (dx, dz) in the world: mirrored so it faces that way on screen */
const cat = (c: Ctx, i: number, x: number, z: number, dx: number, dz: number, oa: CatOpts & Act, scale = 0.38, y = 0, shadow = true) => {
  const { lean = 0, dy = 0, ...o } = oa;
  const mirror = dx * c.cam.right.x + dz * c.cam.right.z < 0;
  const d = c.cam.pos.distanceTo(V(x, y + 0.25, z)) / scale;
  const [w, h, k] = d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
  const eye = o.eye === undefined || o.eye === "dot" ? (blinkOf(c.t, i) ? "blink" : "dot") : o.eye;
  const oo: CatOpts = { ...o, eye, phase: q(o.phase ?? 0, 16), light: light2D(c.cam, mirror) };
  c.out.places.push({ key: `cat|${JSON.stringify(oo)}`, x, y: y + dy, z, scale, mirror, draw: (p) => catSide(p, oo), size: [w, h, k], roll: sway(c.t, i + 3, 0.02, 0.6) + lean * (mirror ? 1 : -1) });
  if (shadow) blob(c.out, x, y, z, scale * 1.6);
};
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<Stage["fx"][number]> = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
const spark = (c: Ctx, at: number, p: V3, size: number, life = 0.25, col = "#fff3b0") => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  card(c, `burst${col}${k}`, 500, 500, (pen) => fxBurst(pen, k, col), p, size, size, { glow: 1.5 });
};
const puff = (c: Ctx, at: number, p: V3, size: number, life = 1, col?: number[]) => {
  const u = (c.t - at) / life;
  if (u < 0 || u >= 1) return;
  const k = q(u, 20);
  card(c, `puff${col ? col.join() : ""}${k}`, 300, 300, (pen) => fxSmoke(pen, k, col), [p[0], p[1] + 0.3 * size * u, p[2]], size * (0.6 + 0.6 * u), size * (0.6 + 0.6 * u), { soft: true });
};
/** pop-in scale for a card that appears at `at` */
const pop = (t: number, at: number) => { const u = clamp01((t - at + LEAD) / 0.18); return u <= 0 ? 0 : 1 + 0.25 * Math.sin(Math.PI * u) * (1 - u) + (u < 1 ? -0.3 * (1 - u) : 0); };
const bulb = (c: Ctx, at: number, p: V3, s = 0.45) => { const k = pop(c.t, at); if (k > 0) card(c, `bulb${q((c.t * 3) % 1, 6)}`, 300, 400, (pen) => fxBulb(pen, q((c.t * 3) % 1, 6)), p, s * k, s * 1.33 * k, { glow: 1.6 }); };
const quest = (c: Ctx, at: number, p: V3, s = 0.35) => { const k = pop(c.t, at); if (k > 0) card(c, "quest", 300, 400, (pen) => fxQuestion(pen), [p[0], p[1] + 0.03 * Math.sin(c.t * 4), p[2]], s * k, s * 1.33 * k); };
const zzz = (c: Ctx, p: V3, s = 0.16) => { for (let k = 0; k < 3; k++) { const u = (c.t * 0.5 + k / 3) % 1; card(c, "zz", 200, 200, (pen) => fxZ(pen), [p[0] + 0.25 * u + 0.05 * Math.sin(u * 9), p[1] + 0.5 * u, p[2]], s * (0.6 + 0.8 * u), s * (0.6 + 0.8 * u), { soft: true }); } };
const hearts = (c: Ctx, at: number, p: V3, s = 0.14) => { if (c.t < at - LEAD) return; for (let k = 0; k < 3; k++) { const u = ((c.t - at) * 0.6 + k / 3) % 1; card(c, "heart", 300, 300, (pen) => fxHeartFx(pen), [p[0] + 0.2 * (k - 1) + 0.04 * Math.sin(u * 8 + k), p[1] + 0.45 * u, p[2]], s * Math.sin(Math.PI * u), s * Math.sin(Math.PI * u)); } };
/** a fedora knocked flying: arcs up and spins */
const hatFly = (c: Ctx, at: number, p: V3, col = "#4a4a54", dir = 1, life = 1.3) => {
  const u = c.t - at + LEAD; if (u < 0 || u >= life) return;
  card(c, `flyhat${col}`, 300, 200, (pen) => {
    pen.poly([[78, 120], [92, 40], [150, 30], [208, 40], [222, 120]], col, 8); pen.band([[80, 104], [220, 104]], "#1c1c22", 18, 3);
    pen.ell(150, 128, 132, 26, col, 8);
  }, [p[0] + dir * 0.9 * u, p[1] + 2.4 * u - 3.2 * u * u, p[2] + 0.3 * u], 0.36, 0.24, { rot: -dir * 9 * u });
};
const sweat = (c: Ctx, p: V3, s = 0.07) => { for (let k = 0; k < 2; k++) { const u = (c.t * 1.8 + k / 2) % 1; card(c, "sweat", 120, 160, (pen) => { pen.poly([[60, 10], [100, 100], [60, 150], [20, 100]], "#bfe6ff", 6); }, [p[0] + (k ? 1 : -1) * (0.08 + 0.12 * u), p[1] + 0.1 * Math.sin(Math.PI * u) - 0.05 * u, p[2]], s, s * 1.3); } };
const waves = (c: Ctx, p: V3, s = 0.35) => { const k = q((c.t * 1.4) % 1, 12); card(c, `waves${k}`, 300, 300, (pen) => fxWaves(pen, k), p, s, s, { glow: 1.6 }); };

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const tiles = (key: string, a: string, b: string, n = 8) => ctex(key, 512, 512, (g) => { const s = 512 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); } });
const grid = (key: string, base: string, line: string, n = 8) => ctex(key, 512, 512, (g) => { g.fillStyle = base; g.fillRect(0, 0, 512, 512); g.strokeStyle = line; g.lineWidth = 4; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * 512 / n, 0); g.lineTo(i * 512 / n, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 512 / n); g.lineTo(512, i * 512 / n); g.stroke(); } });
const blinds = () => ctex("blinds", 256, 512, (g) => { g.fillStyle = "#fff4d6"; g.fillRect(0, 0, 256, 512); g.fillStyle = "#cdbf9a"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 256, 12); });
const desk = (b: Batch, x: number, z: number, w = 2.4, h = 0.8, col = "#6e4a30") => {
  const top = lam("deskTop" + col, () => ({ color: col })), side = lam("deskSide" + col, () => ({ color: new THREE.Color(col).multiplyScalar(0.8).getStyle() }));
  b.add(boxGeo(V(x - w / 2, h - 0.07, z - 0.45), V(x + w / 2, h, z + 0.45)), top);
  b.add(boxGeo(V(x - w / 2 + 0.05, 0, z + 0.36), V(x + w / 2 - 0.05, h - 0.07, z + 0.42)), side);
  for (const s of [-1, 1]) b.add(boxGeo(V(x + s * (w / 2 - 0.05) - 0.05, 0, z - 0.42), V(x + s * (w / 2 - 0.05) + 0.05, h - 0.07, z + 0.42)), side);
};
const lamp = (b: Batch, x: number, z: number) => {
  const I = lam("lampIron", () => ({ color: "#2e3238" }));
  b.add(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8), I, M4(x, 1.8, z));
  b.add(new THREE.SphereGeometry(0.22, 12, 10), lam("lampGlobe", () => ({ color: "#f6efd0" })), M4(x, 3.75, z));
};
const starTex = () => ctex("redStar", 256, 256, (g) => {
  g.fillStyle = "#b8b2a6"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#c0262c"; g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, r = k % 2 ? 46 : 112; g.lineTo(128 + r * Math.cos(a), 132 + r * Math.sin(a)); } g.closePath(); g.fill();
});
const car = (root: THREE.Object3D, col: string, L: number, W: number, H: number, taxi = false) => {
  const g = new THREE.Group();
  const body = new THREE.MeshLambertMaterial({ color: col }), dark = new THREE.MeshLambertMaterial({ color: "#1b1d24" }), glass = new THREE.MeshLambertMaterial({ color: "#9cc6dc" });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(L, H * 0.45, W), body, 0, 0.25 + H * 0.225, 0);
  if (taxi) { add(new THREE.BoxGeometry(L * 0.55, H * 0.35, W * 0.92), body, -0.05 * L, 0.25 + H * 0.62, 0); add(new THREE.BoxGeometry(L * 0.5, H * 0.26, W * 0.94), glass, -0.05 * L, 0.25 + H * 0.62, 0); add(new THREE.BoxGeometry(0.4, 0.16, 0.25), new THREE.MeshLambertMaterial({ color: "#f6f1e0" }), -0.05 * L, 0.25 + H * 0.84, 0);
    for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(0.16, 0.08, 0.02), dark, -L * 0.2 + k * 0.32 * (k % 2 ? 1 : 1), 0.25 + H * 0.3, W / 2 + 0.005); }
  else { add(new THREE.BoxGeometry(L * 0.98, H * 0.5, W * 0.98), body, -0.01 * L, 0.25 + H * 0.7, 0); add(new THREE.BoxGeometry(L * 0.2, H * 0.3, W * 1.0), glass, L * 0.36, 0.25 + H * 0.72, 0); add(new THREE.BoxGeometry(L * 0.5, H * 0.22, W * 1.002), glass, -0.1 * L, 0.25 + H * 0.76, 0); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16).rotateX(Math.PI / 2), dark, sx * L * 0.32, 0.34, sz * W * 0.48);
  add(new THREE.BoxGeometry(0.05, 0.14, 0.3), new THREE.MeshLambertMaterial({ color: "#fff6c8", emissive: "#fff2b0", emissiveIntensity: 1.2 }), L / 2, 0.25 + H * 0.3, W * 0.32);
  add(new THREE.BoxGeometry(0.05, 0.14, 0.3), new THREE.MeshLambertMaterial({ color: "#fff6c8", emissive: "#fff2b0", emissiveIntensity: 1.2 }), L / 2, 0.25 + H * 0.3, -W * 0.32);
  root.add(g); return g;
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  hq: (s) => {
    const { b } = s;
    b.add(plane(-7, 7, -5, 7, 1), lam("hqFloor", () => ({ map: rep(tiles("hqTile", "#a9ab9c", "#9a9c8c"), 6, 6) })));
    const WALL = lam("hqWall", () => ({ color: "#cdd3bb" })), WAIN = lam("hqWain", () => ({ color: "#6f7a64" }));
    b.add(quad(V(-7, 0, -4.2), V(7, 0, -4.2), V(7, 5, -4.2), V(-7, 5, -4.2)), WALL);
    b.add(boxGeo(V(-7, 0, -4.2), V(7, 1.0, -4.1)), WAIN);
    b.add(quad(V(-4.6, 0, 7), V(-4.6, 0, -4.2), V(-4.6, 5, -4.2), V(-4.6, 5, 7)), WALL);
    b.add(boxGeo(V(-4.6, 0, -4.2), V(-4.5, 1.0, 7)), WAIN);
    // window with venetian blinds
    b.add(quad(V(1.0, 1.2, -4.14), V(2.9, 1.2, -4.14), V(2.9, 3.4, -4.14), V(1.0, 3.4, -4.14)), lam("blindsM", () => ({ map: blinds() })));
    b.add(boxGeo(V(0.9, 1.1, -4.2), V(3.0, 1.2, -4.0)), lam("hqSill", () => ({ color: "#e9e4d2" })));
    // pin board with a map and strings
    b.add(boxGeo(V(-3.4, 1.5, -4.18), V(-1.0, 3.1, -4.12)), lam("cork", () => ({ color: "#b8875a" })));
    b.add(boxGeo(V(-3.2, 1.65, -4.12), V(-1.9, 2.95, -4.1)), lam("mapPaper", () => ({ color: "#d9d2b4" })));
    for (let k = 0; k < 5; k++) b.add(boxGeo(V(-1.8, 2.7 - 0.25 * k, -4.12), V(-1.15, 2.85 - 0.25 * k, -4.1)), lam("note" + (k % 2), () => ({ color: k % 2 ? "#f3ecd8" : "#f2e58a" })));
    // filing cabinets
    for (const x of [-4.0, 3.7, 4.4]) { b.add(boxGeo(V(x - 0.32, 0, -4.1), V(x + 0.32, 1.45, -3.5)), lam("cab", () => ({ color: "#8a929a" }))); for (let k = 0; k < 4; k++) b.add(boxGeo(V(x - 0.1, 0.25 + 0.34 * k, -3.5), V(x + 0.1, 0.29 + 0.34 * k, -3.47)), MAT.iron()); }
    desk(b, 0, -1.6, 2.6, 0.8, "#5f4632");
    // desk things: rotary phone, lamp, in-tray
    b.add(boxGeo(V(-1.05, 0.8, -1.85), V(-0.65, 0.92, -1.55)), lam("phone", () => ({ color: "#1e1e24" })));
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.36, 10).rotateZ(Math.PI / 2), lam("phone", () => ({ color: "#1e1e24" })), M4(-0.85, 0.97, -1.7));
    b.add(new THREE.CylinderGeometry(0.03, 0.1, 0.5, 8), MAT.iron(), M4(1.0, 1.05, -1.9));
    b.add(new THREE.ConeGeometry(0.2, 0.2, 12, 1, true), lam("lampShade", () => ({ color: "#2f6a4a", side: THREE.DoubleSide })), M4(1.0, 1.32, -1.9));
    b.add(boxGeo(V(0.45, 0.8, -1.95), V(0.8, 0.86, -1.6)), lam("tray", () => ({ color: "#c9b48a" })));
    // money heap (shot 17): strapped bundles stacked in a stepped pile, toggled in POSE
    const money = new THREE.Group(), cash = new THREE.MeshLambertMaterial({ color: "#7aab66" }), strap = new THREE.MeshLambertMaterial({ color: "#f4f1ea" });
    const r = rng(7);
    for (let lv = 0; lv < 6; lv++) {
      const R = 1.5 - lv * 0.25, n = Math.round(30 - lv * 4);
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2, rr = R * Math.sqrt(r());
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.16), cash); m.position.set(rr * Math.cos(a), 0.06 + lv * 0.12, 0.6 + rr * Math.sin(a) * 0.7); m.rotation.y = r() * 3; m.castShadow = m.receiveShadow = true; money.add(m);
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.125, 0.165), strap); st.position.copy(m.position); st.rotation.copy(m.rotation); money.add(st);
      }
    }
    money.visible = false; s.root.add(money); s.dyn.money = money;
  },
  lab: (s) => {
    const { b } = s;
    b.add(plane(-7, 7, -5, 7, 1), lam("labFloor", () => ({ map: rep(tiles("labTile", "#e8ece6", "#c9d3cf"), 7, 7) })));
    const W = lam("labWall", () => ({ map: rep(grid("labWallT", "#dff0ea", "#b9d2c9", 8), 4, 2) }));
    b.add(quad(V(-7, 0, -4.2), V(7, 0, -4.2), V(7, 5, -4.2), V(-7, 5, -4.2)), W);
    b.add(quad(V(-4.6, 0, 7), V(-4.6, 0, -4.2), V(-4.6, 5, -4.2), V(-4.6, 5, 7)), W);
    // operating table: steel top on a pedestal
    const ST = MAT.iron();
    b.add(boxGeo(V(-0.9, 0.84, -1.8), V(0.9, 0.9, -1.0)), lam("steel", () => ({ color: "#b9c2c9" })));
    b.add(new THREE.CylinderGeometry(0.12, 0.18, 0.84, 12), ST, M4(0, 0.42, -1.4));
    b.add(new THREE.CylinderGeometry(0.45, 0.5, 0.06, 16), ST, M4(0, 0.03, -1.4));
    b.add(boxGeo(V(-0.6, 0.9, -1.6), V(0.6, 0.93, -1.2)), lam("towel", () => ({ color: "#7ab8c9" })));
    // surgical lamp overhead
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), ST, M4(0, 3.6, -1.6));
    b.add(new THREE.CylinderGeometry(0.55, 0.42, 0.18, 24), lam("labLamp", () => ({ color: "#e9eef0" })), M4(0, 2.75, -1.6));
    b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.02, 24), lam("labLampGlow", () => ({ color: "#ffffff", emissive: "#fff8e0", emissiveIntensity: 1.4 })), M4(0, 2.65, -1.6));
    // glass cabinet with bottles, tool tray, monitor box with dials
    b.add(boxGeo(V(-3.6, 0, -4.1), V(-2.2, 2.2, -3.6)), lam("cabW", () => ({ color: "#f4f6f4" })));
    for (let k = 0; k < 9; k++) b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 10), lam("bot" + (k % 3), () => ({ color: ["#7ab8c9", "#c97a5a", "#9ac97a"][k % 3] })), M4(-3.4 + 0.16 * (k % 3) + 0.4 * Math.floor(k / 3), 1.0 + 0.5 * (k % 2), -3.55));
    b.add(boxGeo(V(1.5, 0, -2.0), V(2.3, 0.95, -1.4)), lam("trolley", () => ({ color: "#c9d0d6" })));
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(1.6 + 0.16 * k, 0.95, -1.8), V(1.66 + 0.16 * k, 0.97, -1.55)), ST);
    b.add(boxGeo(V(2.4, 0, -4.1), V(3.6, 1.6, -3.5)), lam("console", () => ({ color: "#7a8a94" })));
    for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12).rotateX(Math.PI / 2), lam("dial" + (k % 2), () => ({ color: k % 2 ? "#e8c45a" : "#2a2a30" })), M4(2.6 + 0.2 * k, 1.25 - 0.3 * (k % 2), -3.48));
  },
  park: (s) => {
    const { b, kit } = s;
    b.add(plane(-150, 150, -150, 60, 1), lam("parkGrass", () => ({ map: grassHD() })));
    // road along x (z -3.5 .. 0.5) with a dashed centre line, kerbs, pavements
    b.add(plane(-150, 150, -3.5, 0.5, 2, 0.012), lam("asphalt", () => ({ color: "#55565e" })));
    for (let k = -40; k <= 40; k++) b.add(plane(k * 3, k * 3 + 1.5, -1.58, -1.42, 1, 0.016), lam("roadLine", () => ({ color: "#efe6b8" })));
    for (const [z0, z1] of [[0.5, 3.4], [-6.8, -3.5]]) b.add(plane(-150, 150, z0, z1, 3, 0.03), lam("pavement", () => ({ color: "#c9c3b4" })));
    for (const z of [0.5, -3.5]) b.add(boxGeo(V(-150, 0, z - 0.08), V(150, 0.1, z + 0.08)), lam("kerb", () => ({ color: "#dcd6c8" })));
    // stone bench (front block hides the sitters' legs), back rest
    const STN = lam("benchStone", () => ({ color: "#8f8a80" })), WD = lam("benchWood", () => ({ color: "#7a5236" }));
    b.add(boxGeo(V(-1.0, 0, -6.1), V(1.6, 0.4, -5.8)), STN);
    b.add(boxGeo(V(-1.15, 0.4, -6.3), V(1.75, 0.47, -5.7)), WD);
    b.add(boxGeo(V(-1.1, 0.45, -6.45), V(1.7, 0.95, -6.35)), WD);
    for (const x of [-1.0, 1.6]) b.add(boxGeo(V(x - 0.05, 0, -6.45), V(x + 0.05, 0.95, -6.35)), MAT.iron());
    // the Soviet building across the lawn: grey block, columns, red star
    block(b, 0.5, -19, 18, 6, 10, 0, "#b8b2a6");
    for (let k = 0; k < 8; k++) b.add(new THREE.CylinderGeometry(0.35, 0.4, 6.5, 12), lam("col", () => ({ color: "#d6d0c4" })), M4(-5.5 + k * 1.7, 3.25, -15.6));
    b.add(boxGeo(V(-6.5, 6.5, -16.2), V(7.5, 7.3, -15.2)), lam("lintel", () => ({ color: "#cdc7ba" })));
    b.add(quad(V(-1.0, 7.6, -15.95), V(2.0, 7.6, -15.95), V(2.0, 10.6, -15.95), V(-1.0, 10.6, -15.95)), lam("starM", () => ({ map: starTex() })));
    for (let k = 0; k < 7; k++) b.add(boxGeo(V(-6 + k * 2.2, 2, -15.98), V(-5.2 + k * 2.2, 3.4, -15.9)), lam("winDark", () => ({ color: "#3a4048" })));
    // iron fence in front of it
    for (let k = -40; k <= 40; k++) b.add(boxGeo(V(k * 0.35 - 0.02, 0, -10.02), V(k * 0.35 + 0.02, 1.3, -9.98)), MAT.iron());
    b.add(boxGeo(V(-14, 1.15, -10.03), V(14, 1.22, -9.97)), MAT.iron());
    for (let k = -6; k <= 6; k++) { prop(b, kit, "tree_oak", k * 7 + 2, 0, -8.2 - 2 * hh(k, 4), 6 + 1.5 * hh(k, 3)); if (k % 2) lamp(b, k * 7 - 1.5, 3.2); }
    for (let k = -6; k <= 6; k++) prop(b, kit, "tree_fat", k * 9 + 4, 0, 24 + 4 * hh(k, 7), 7 + 2 * hh(k, 8));
    // the surveillance van, parked on our side
    const van = car(s.root, "#e3ddcc", 4.4, 1.9, 2.0);
    van.position.set(-6.2, 0.03, 2.2);
    // dynamic: the taxi
    const taxi = car(s.root, "#f2c230", 4.2, 1.8, 1.4, true);
    taxi.visible = false; s.dyn.taxi = taxi;
    // the food bowl spot: a hot-dog cart for colour
    b.add(boxGeo(V(5.2, 0.4, 1.4), V(6.6, 1.2, 2.1)), lam("cartBox", () => ({ color: "#e9e3d2" })));
    b.add(boxGeo(V(5.1, 1.9, 1.2), V(6.7, 1.96, 2.3)), lam("cartRoof", () => ({ color: "#c0353a" })));
    for (const x of [5.25, 6.55]) b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), MAT.iron(), M4(x, 1.55, 1.3));
    for (const x of [5.4, 6.4]) b.add(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14).rotateX(Math.PI / 2), lam("tyre", () => ({ color: "#1b1d24" })), M4(x, 0.28, 2.15));
  },
  home: (s) => {
    const { b } = s;
    b.add(plane(-7, 7, -5, 7, 1), lam("homeFloor", () => ({ map: planksHD() })));
    const paper = ctex("wallpaper", 256, 256, (g) => { g.fillStyle = "#e8c9a0"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#dcb98a"; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 22, 256); });
    const W = lam("homeWall", () => ({ map: rep(paper, 6, 2) }));
    b.add(quad(V(-7, 0, -3.2), V(7, 0, -3.2), V(7, 5, -3.2), V(-7, 5, -3.2)), W);
    b.add(quad(V(-4.0, 0, 7), V(-4.0, 0, -3.2), V(-4.0, 5, -3.2), V(-4.0, 5, 7)), W);
    b.add(boxGeo(V(-7, 0, -3.2), V(7, 0.18, -3.12)), lam("skirting", () => ({ color: "#7a5236" })));
    // window with warm light, curtains
    b.add(boxGeo(V(0.6, 1.1, -3.2), V(2.6, 3.0, -3.16)), lam("homeWin", () => ({ color: "#ffe9b8", emissive: "#ffcf80", emissiveIntensity: 0.5 })));
    for (const x of [0.35, 2.85]) b.add(boxGeo(V(x - 0.3, 0.9, -3.15), V(x + 0.3, 3.3, -3.05)), lam("curtain", () => ({ color: "#b8443a" })));
    // armchair
    const CH = lam("chair", () => ({ color: "#4f7a5a" }));
    b.add(boxGeo(V(-2.9, 0, -2.6), V(-1.5, 0.5, -1.4)), CH); b.add(boxGeo(V(-2.9, 0.5, -2.6), V(-1.5, 1.5, -2.25)), CH);
    for (const x of [-2.9, -1.7]) b.add(boxGeo(V(x, 0.5, -2.6), V(x + 0.2, 0.85, -1.4)), CH);
    // rug, cushion, side table + lamp, picture frame
    const rug = ctex("homeRug", 512, 340, (g) => { g.fillStyle = "#a8322e"; g.fillRect(0, 0, 512, 340); g.strokeStyle = "#e8c45a"; g.lineWidth = 14; g.strokeRect(20, 20, 472, 300); g.strokeStyle = "#1f3f6a"; g.lineWidth = 10; g.strokeRect(50, 50, 412, 240); });
    b.add(plane(-1.6, 1.6, -1.8, 0.4, 1, 0.012), lam("rugM", () => ({ map: rug })));
    b.add(new THREE.SphereGeometry(0.5, 20, 12).scale(1.0, 0.18, 0.8), lam("cushion", () => ({ color: "#c94a6a" })), M4(-1.2, 0.05, -0.85));
    b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16), MAT.darkWood(), M4(-1.0, 0.65, -2.4)); b.add(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8), MAT.darkWood(), M4(-1.0, 0.33, -2.4));
    b.add(new THREE.ConeGeometry(0.22, 0.28, 14, 1, true), lam("homeShade", () => ({ color: "#f3e3b0", side: THREE.DoubleSide, emissive: "#ffcf80", emissiveIntensity: 0.4 })), M4(-1.0, 1.05, -2.4));
    b.add(boxGeo(V(-3.2, 1.7, -3.18), V(-2.0, 2.6, -3.12)), lam("frameH", () => ({ color: "#6e4a30" })));
    b.add(boxGeo(V(-3.1, 1.8, -3.12), V(-2.1, 2.5, -3.1)), lam("frameP", () => ({ color: "#9ac0d6" })));
  },
};

// ---------------- dynamic ----------------
export const TAXI_X = (t: number) => -30 + 18 * (t - (C.taxi - 1.6));
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  hq: (s, t, id) => { s.dyn.money.visible = id === 17; },
  park: (s, t, id) => {
    const tx = s.dyn.taxi;
    tx.visible = id === 14 && Math.abs(TAXI_X(t)) < 60;
    tx.position.set(TAXI_X(t), 0.03, -0.75);
  },
};

// ---------------- staging per shot ----------------
type StageFn = (c: Ctx) => void;
const DESK = 0.8; // desk-top height (hq)
const TABLE = 0.93; // operating table height (lab)
export const STAGE: Record<number, StageFn> = {
  // 1 the CIA has a brilliant idea
  1: (c) => {
    const t = c.t, idea = after(t, C.brilliant);
    pose(c, 1, AGENT, "agent", 0, -2.5, { mode: "stand", expr: after(t, C.soviets) ? cyc(t, ["smug", "grin"] as Expr[], 2.2) : idea ? "grin" : "neutral", prop: idea ? "point" : null, lean: jolt(t, C.brilliant, -0.14) + jolt(t, C.soviets, 0.08), dy: hop(t, C.brilliant, 0.1, 0.28) });
    pose(c, 2, AGENT2, "agent2", -2.0, -2.9, { mode: "stand", expr: idea ? "awe" : "neutral", lean: jolt(t, C.brilliant + 0.1, 0.12), dy: hop(t, C.brilliant + 0.1, 0.06) }, 0.97);
    bulb(c, C.brilliant, [0.02, 2.32, -2.45], 0.42);
    spark(c, C.brilliant, [0.02, 2.32, -2.4], 0.9, 0.3);
  },
  // 2 "Cats."
  2: (c) => {
    const t = c.t;
    cat(c, 1, 0.1, -1.5, 1, 0, { mode: "sit", eye: after(t, C.cats1 + 0.35) ? "smug" : "stare", phase: t * 0.5, lean: jolt(t, C.cats1 + 0.35, 0.15), dy: hop(t, C.cats1 + 0.35, 0.05, 0.25) }, 0.38, DESK, false);
    pose(c, 1, AGENT, "agent", 0.9, -2.6, { mode: "stand", expr: cyc(t, ["grin", "smug"] as Expr[], 2) });
  },
  // 3 nobody suspects a cat, it sits around listening
  3: (c) => {
    const t = c.t, lis = after(t, C.listening);
    pose(c, 1, TOWN1, "tf1", -0.55, -6.0, { mode: "sit", expr: after(t, C.anywhere) ? cyc(t, ["laugh", "grin"] as Expr[], 3) : "grin", phase: t * 0.3, dy: after(t, C.anywhere) ? bounce(t, 1, 0.03, 3) : 0, lean: after(t, C.anywhere) ? 0.06 * Math.sin(t * 9) : 0 }, 1, 0.38, false);
    pose(c, 2, TOWN2, "tf2", 0.3, -6.0, { mode: "sit", expr: "smile", look: -1 }, 1, 0.38, false);
    cat(c, 1, 1.25, -6.0, -1, 0, { mode: "sit", eye: lis ? "stare" : undefined, ears: lis ? 1 : 0, phase: t * 0.5, lean: lis ? 0.1 + jolt(t, C.listening, 0.12) : 0 }, 0.36, 0.45, false);
  },
  // 4 to the vet, turn it into a spy
  4: (c) => {
    const t = c.t, spy = after(t, C.spy3);
    cat(c, 1, 0, -1.4, 1, 0, { mode: "sit", eye: spy ? "shock" : undefined, phase: t * 0.5, lean: jolt(t, C.spy3, -0.25), dy: hop(t, C.spy3, 0.12, 0.28) }, 0.38, TABLE, false);
    pose(c, 1, VET, "vet", -1.0, -2.3, { mode: "stand", expr: after(t, C.vet) ? cyc(t, ["smile", "grin"] as Expr[], 2) : "smile", prop: after(t, C.vet) ? "scissors" : null, lean: jolt(t, C.vet, -0.1) });
    pose(c, 2, AGENT, "agent", 1.2, -2.2, { mode: "stand", expr: spy ? cyc(t, ["grin", "smug"] as Expr[], 2.5) : "smug", prop: spy ? "point" : null, lean: jolt(t, C.spy3, 0.12) });
  },
  // 5 mic, transmitter, wire
  5: (c) => {
    const t = c.t, m = after(t, C.microphone), tx = after(t, C.transmitter), w = after(t, C.wire);
    cat(c, 1, 0, -1.4, 1, 0, { mode: "sit", mic: m, tx, wire: w, led: tx && Math.floor(t * 3) % 2 === 0, eye: w ? "smug" : m ? "shock" : undefined, phase: t * 0.5, lean: jolt(t, C.microphone, -0.2) + jolt(t, C.transmitter, 0.18) + jolt(t, C.wire, -0.15), dy: hop(t, C.microphone, 0.08, 0.25) + hop(t, C.transmitter, 0.06, 0.25) }, 0.38, TABLE, false);
    spark(c, C.microphone, [0.08, 1.48, -1.35], 0.35, 0.3, "#ffffff");
    spark(c, C.transmitter, [-0.12, 1.33, -1.35], 0.35, 0.3, "#ffffff");
    spark(c, C.wire, [-0.15, 1.1, -1.35], 0.5, 0.3, "#ffffff");
  },
  // 6 Agent Kitty is ready
  6: (c) => {
    const t = c.t, rd = after(t, C.ready);
    cat(c, 1, 0, -1.4, 1, 0, { mode: "sit", mic: true, tx: true, wire: true, shades: after(t, C.agent5 - 0.1), led: Math.floor(t * 3) % 2 === 0, phase: t * 0.5, dy: hop(t, C.agent5 - 0.1, 0.1, 0.3), lean: jolt(t, C.ready, 0.12) }, 0.38, TABLE, false);
    if (rd) waves(c, [0.28, 1.45, -1.3], 0.4);
    pose(c, 1, VET, "vet", -1.0, -2.3, { mode: "stand", expr: rd ? "relief" : "smile", dy: rd ? bounce(t, 1, 0.03) : 0 });
    pose(c, 2, AGENT, "agent", 1.2, -2.2, { mode: "stand", expr: rd ? cyc(t, ["grin", "laugh"] as Expr[], 2.5) : "smug", prop: rd ? "point" : null, lean: jolt(t, C.ready, -0.12), dy: hop(t, C.ready, 0.1) });
    spark(c, C.agent5 - 0.1, [0.15, 1.4, -1.3], 0.6, 0.3, "#ffffff");
  },
  // 7 one problem: it's a cat
  7: (c) => {
    const t = c.t, lick = after(t, C.its6);
    cat(c, 1, 0, -1.4, 1, 0, { mode: lick ? "lick" : "sit", eye: lick ? "blink" : undefined, mic: true, tx: true, wire: true, phase: t * 0.5 }, 0.38, TABLE, false);
    pose(c, 1, VET, "vet", -1.0, -2.3, { mode: "stand", expr: lick ? "nervous" : "smile", lean: jolt(t, C.problem, 0.12) });
    pose(c, 2, AGENT, "agent", 1.2, -2.2, { mode: "stand", expr: after(t, C.problem) ? "nervous" : "grin", lean: jolt(t, C.problem, -0.12), dy: hop(t, C.problem, 0.06) });
    if (after(t, C.problem)) sweat(c, [1.2, 2.0, -2.15], 0.07);
  },
  // 8 training: it wanders off, to find food
  8: (c) => {
    const t = c.t, wan = after(t, C.wandering), food = after(t, C.food);
    pose(c, 1, AGENT, "agent", -1.2, 1.6, { mode: "stand", expr: wan ? "shock" : "stern", prop: "point", lean: jolt(t, C.wandering, 0.18), dy: hop(t, C.wandering, 0.12) });
    pose(c, 2, AGENT2, "agent2", -2.3, 2.3, { mode: "stand", expr: wan ? "nervous" : "neutral", lean: jolt(t, C.wandering + 0.08, -0.12) });
    if (wan) sweat(c, [-1.2, 2.0, 1.65], 0.07);
    if (!food) {
      const u = Math.max(0, t - C.wandering);
      cat(c, 1, -0.3 + 1.2 * u, 1.8 + 0.12 * u, 1, 0, { mode: wan ? "walk" : "sit", mic: true, tx: true, wire: true, phase: (t * 1.6) % 1, eye: wan ? "smug" : undefined, lean: wan ? 0.07 * Math.sin(2 * Math.PI * t * 1.6) : 0 }, 0.38);
    } else {
      cat(c, 1, 4.6, 1.95, 1, 0, { mode: "eat", mic: true, tx: true, wire: true, phase: (t * 1.2) % 1, eye: "happy" }, 0.38);
      card(c, "bowl", 400, 260, (p) => fxBowl(p, 0), [5.05, 0.07, 1.98], 0.3, 0.2, { yaw: 0 });
    }
  },
  // 9 a second operation, to make it less hungry
  9: (c) => {
    const t = c.t, sec = after(t, C.second), hun = after(t, C.hungry);
    cat(c, 1, 0, -1.4, 1, 0, { mode: hun ? "lie" : "sit", eye: hun ? "smug" : sec ? "shock" : undefined, bandage: hun, mic: true, tx: true, wire: true, phase: t * 0.5, lean: jolt(t, C.second, -0.25), dy: hop(t, C.second, 0.14, 0.3) }, 0.38, TABLE, false);
    pose(c, 1, VET, "vet", -1.0, -2.3, { mode: "stand", expr: sec ? "smug" : "smile", prop: sec ? "scissors" : null });
    pose(c, 2, AGENT, "agent", 1.2, -2.2, { mode: "stand", expr: hun ? "relief" : "nervous" });
  },
  // 10 the first real mission
  10: (c) => {
    const t = c.t;
    pose(c, 1, AGENT, "agent", -1.4, 3.0, { mode: "stand", expr: "stern" });
    pose(c, 2, AGENT2, "agent2", -2.2, 3.3, { mode: "stand", expr: "stern" });
    cat(c, 1, -0.8, 2.7, 1, 0, { mode: "sit", shades: true, mic: true, tx: true, wire: true, led: Math.floor(t * 3) % 2 === 0, phase: t * 0.5 }, 0.38);
    pose(c, 3, SOV, "sov", -0.2, -6.0, { mode: "sit", expr: "stern" }, 1, 0.38, false);
    pose(c, 4, SOV2, "sov2", 0.8, -6.0, { mode: "sit", expr: "neutral" }, 1, 0.38, false);
  },
  // 11 two men on a bench outside a Soviet building
  11: (c) => {
    const t = c.t, talk = after(t, C.talking);
    pose(c, 3, SOV, "sov", -0.2, -6.0, { mode: "sit", expr: talk && Math.floor(t * 4) % 2 ? "grin" : "stern", look: 1 }, 1, 0.38, false);
    pose(c, 4, SOV2, "sov2", 0.8, -6.0, { mode: "sit", expr: talk && Math.floor(t * 4 + 1) % 2 ? "laugh" : "neutral", look: -1, lean: talk ? 0.05 * Math.sin(t * 8) : 0, dy: talk ? bounce(t, 4, 0.02, 3) : 0 }, 1, 0.38, false);
  },
  // 12 release the cat, point it at the bench (side view: camera on +x looking -x, screen right = -z)
  12: (c) => {
    const t = c.t, rel = after(t, C.release), pt = after(t, C.point);
    pose(c, 1, AGENT, "agent", -1.4, 2.6, { mode: "stand", expr: pt ? cyc(t, ["grin", "smug"] as Expr[], 2) : "stern", prop: pt ? "point" : null, lean: jolt(t, C.point, -0.15) });
    const u = Math.max(0, t - C.point - 0.3);
    cat(c, 1, -0.9, rel ? 1.9 - 0.7 * u : 2.2, 0, -1, { mode: pt && u > 0 ? "walk" : "sit", shades: true, mic: true, tx: true, wire: true, phase: (t * 1.6) % 1, led: Math.floor(t * 3) % 2 === 0 }, 0.38);
  },
  // 13 what happened next depends on who you ask
  13: (c) => {
    const t = c.t;
    cat(c, 1, -0.9, 0.75, 0, -1, { mode: "sit", shades: true, mic: true, tx: true, wire: true, phase: t * 0.5, led: Math.floor(t * 3) % 2 === 0 }, 0.38);
    quest(c, C.next, [-0.9, 0.98, 0.95], 0.26);
    quest(c, C.ask - 0.05, [-0.9, 1.05, 0.45], 0.3);
    pose(c, 1, AGENT, "agent", -1.4, 2.6, { mode: "stand", expr: after(t, C.ask) ? "nervous" : "neutral", prop: after(t, C.ask) ? "shrug" : null, lean: jolt(t, C.ask, 0.12), dy: hop(t, C.ask, 0.06) });
  },
  // 14 one says: into the road, hit by a taxi (we cut away to the agent as it passes)
  14: (c) => {
    const t = c.t, tx = after(t, C.taxi);
    if (!tx) {
      const u = Math.max(0, t - C.walked);
      const z14 = 0.75 - Math.min(1.3, 0.7 * u);
      cat(c, 1, -0.9, z14, 0, -1, { mode: u > 0 ? "walk" : "sit", mic: true, tx: true, wire: true, phase: (t * 1.6) % 1, eye: after(t, C.road) ? "shock" : undefined }, 0.38, z14 > 0.3 ? 0.11 : 0.0);
    } else {
      pose(c, 1, { ...AGENT, hat: "hair", hair: "#3a2a20" }, "agentB", -1.4, 2.6, { mode: "stand", expr: "shock", lean: jolt(t, C.taxi, 0.25), dy: hop(t, C.taxi, 0.2, 0.32) });
      hatFly(c, C.taxi, [-1.4, 2.05, 2.62], "#4a4a54", 1);
      const u = t - C.taxi;
      if (u < 0.5) card(c, "speed", 800, 300, (p) => fxSpeed(p), [-1.4 + 6 * u, 0.9, -0.2], 4, 1.5);
      puff(c, C.taxi + 0.05, [-1.0, 0.3, -0.6], 2.2, 1.2, [200, 196, 186]);
    }
  },
  // 15 another says: gear out, a long happy life
  15: (c) => {
    const t = c.t;
    pose(c, 1, OLD, "old", -2.2, -1.9, { mode: "sit", expr: after(t, C.lived) ? cyc(t, ["relief", "smile"] as Expr[], 1.5) : "smile", lean: 0.04 * Math.sin(t * 2.2) }, 1, 0.42, false);
    cat(c, 1, -1.2, -0.68, -1, 0, { mode: "lie", eye: after(t, C.happy) ? "happy" : "blink", phase: t * 0.4, lean: after(t, C.happy) ? 0.04 * Math.sin(t * 6) : 0 }, 0.44, 0.16, false);
    hearts(c, C.happy, [-1.2, 0.5, -0.6], 0.12);
  },
  // 16 either way it never spied on anyone
  16: (c) => {
    const t = c.t;
    cat(c, 1, -1.2, -0.68, -1, 0, { mode: "lie", eye: "blink", phase: t * 0.4 }, 0.36, 0.15, false);
    zzz(c, [-1.4, 0.4, -0.6], 0.11);
  },
  // 17 twenty million dollars
  17: (c) => {
    const t = c.t, tw = after(t, C.twenty);
    cat(c, 1, 0.0, 0.6, 1, 0, { mode: "sit", eye: tw ? "smug" : undefined, shades: tw, phase: t * 0.5 }, 0.38, 0.72, false);
    pose(c, 1, AGENT, "agent", 2.2, 0.4, { mode: "stand", expr: tw ? "shock" : "nervous", lean: jolt(t, C.twenty, 0.22), dy: hop(t, C.twenty, 0.18, 0.3) });
    if (tw) sweat(c, [2.2, 2.0, 0.45], 0.08);
    if (tw) for (let k = 0; k < 8; k++) { const u = ((t - C.twenty) * 0.5 + k / 8) % 1; card(c, "cashfx", 300, 200, (p) => fxCash(p), [-2 + 4.2 * hh(k, 2), 3.2 - 3.4 * u, 0.4 + hh(k, 3)], 0.4, 0.27, { rot: Math.sin(u * 7 + k) * 0.6 }); }
  },
  // 18 1967: shut it down, wrote a memo
  18: (c) => {
    const t = c.t, sh = after(t, C.shut);
    pose(c, 1, BOSS, "boss", 0, -2.5, { mode: "stand", expr: sh ? "stern" : "neutral", prop: "stamp", lean: jolt(t, C.shut, -0.18), dy: hop(t, C.shut - 0.15, 0.08, 0.2) });
    if (sh) spark(c, C.shut, [0.62, 0.92, -1.55], 0.6, 0.3, "#ffffff");
    card(c, `memo0`, 600, 800, (p) => fxMemo(p, 0, false), [0.2, 0.81, -1.4], 0.42, 0.56, { flat: true, rot: 0.08 });
  },
  // 19 the memo's conclusion: "would not be practical"
  19: (c) => {
    const t = c.t, st = clamp01((t - C.practical + LEAD) / 0.12);
    card(c, `memo${q(st, 6)}`, 600, 800, (p) => fxMemo(p, st), [0, 1.3, -1.45], 0.6, 0.8, { yaw: 0 });
  },
  // 20 every cat owner already knows (the mug goes over the edge)
  20: (c) => {
    const t = c.t, k = after(t, C.knows), u = Math.max(0, t - C.knows);
    pose(c, 1, AGENT, "agent", -0.2, -2.5, { mode: "stand", expr: k ? "shock" : "dazed", lean: jolt(t, C.knows + 0.35, 0.22), dy: hop(t, C.knows + 0.35, 0.16, 0.3) });
    cat(c, 1, 0.25, -1.4, 1, 0, { mode: k && u < 0.5 ? "lick" : "sit", eye: k ? "smug" : undefined, phase: t * 0.5, lean: jolt(t, C.knows, 0.15) }, 0.36, DESK, false);
    const mx = 0.6 + Math.min(0.75, 1.6 * u), my = DESK + 0.08 - (u > 0.3 ? 4.9 * (u - 0.3) ** 2 : 0);
    if (my > 0.05) card(c, "mug", 200, 200, (p) => fxMug(p), [mx, my, -1.35], 0.16, 0.16, { rot: u > 0.3 ? -(u - 0.3) * 6 : 0 });
    if (my <= 0.05) spark(c, C.knows + 0.3 + Math.sqrt(0.75 / 4.9), [1.35, 0.1, -1.3], 0.5, 0.3, "#ffffff");
  },
  // 21 you can't tell a cat what to do
  21: (c) => {
    const t = c.t, tl = after(t, C.tell), turn = after(t, C.what20);
    pose(c, 1, AGENT, "agent", -0.2, -2.5, { mode: "stand", expr: turn ? "nervous" : "stern", prop: tl ? "point" : null, lean: jolt(t, C.tell, -0.14) + jolt(t, C.what20, 0.14), dy: hop(t, C.what20, 0.06) });
    if (turn) sweat(c, [-0.2, 2.0, -2.45], 0.07);
    cat(c, 1, 0.6, -1.4, turn ? 1 : -1, 0, { mode: turn ? "back" : "sit", eye: tl ? "smug" : undefined, phase: t * 0.6, lean: jolt(t, C.what20, 0.15), dy: hop(t, C.what20, 0.06, 0.25) }, 0.38, DESK, false);
    card(c, "memo0b", 600, 800, (p) => fxMemo(p, 1, false), [0.6, 0.81, -1.45], 0.42, 0.56, { flat: true, rot: -0.1 });
  },
};
export { INK, NOINK };
