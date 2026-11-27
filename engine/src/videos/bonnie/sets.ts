// Places and cast of "The Real Bonnie & Clyde" (Texas/Missouri/Louisiana 1932-34, a casino near Las Vegas today; 9:16 short).
// Direction sheet: dusty 1930s sepia-warm daylight, Bonnie's red dress as the accent, the Ford V8 as the hero prop.
// No game art of any kind. Violence is never shown: the ambush is an empty road and numbers. Avoid faces filling frame.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, beamBetween, tent, hills } from "./props3d";
import { Kit, quad, tri, house } from "./build";
import { rep, ctex, stoneHD, roofHD, grassHD, planksHD, cobbleHD } from "./paint";
import { wbox, panelHD, chandelier2, painting, rug, bookcase, chair, table2 } from "./decor";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, fxScore, rrect, txt } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS } from "./story";

type P2 = [number, number];
type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
type Act = { lean?: number; dy?: number };
const sway = (t: number, i: number, amp0 = 0.03, hz0 = 0.5) => { const amp = amp0 * 0.45, hz = hz0 * 0.7; return amp * Math.sin(2 * Math.PI * (hz * t + hh(i, 5))) + 0.4 * amp * Math.sin(2 * Math.PI * (1.7 * hz * t + hh(i, 6))); };
const jolt = (t: number, at0: number, amp: number) => { const u = (t - at0 + LEAD) / 0.12; return u < 0 ? 0 : 0.7 * amp * u * Math.exp(1 - u); };
const hop = (t: number, at0: number, h = 0.12, d = 0.3) => {
  const u = (t - at0 + LEAD) / d;
  if (u < -0.35 || u > 1.6) return 0;
  if (u < 0) return -0.25 * h * Math.sin(Math.PI * (u + 0.35) / 0.35);
  if (u <= 1) return h * Math.sin(Math.PI * u);
  return -0.12 * h * Math.sin(Math.PI * (u - 1) / 0.6);
};
const pose = (c: Ctx, i: number, o: Outfit, okey: string, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0, shadow = true) => {
  const { lean = 0, dy = 0, ...f } = fo;
  const pl = person(c.cam, { i, o, okey } as Who, x, y + dy, z, { side: false, mirror: false }, { blink: lidAt(c.t, i), ...f }, {}, scale);
  pl.roll = sway(c.t, i) + lean;
  c.out.places.push(pl);
  if (shadow && f.mode !== "fall" && y < 0.05) blob(c.out, x, y, z, scale);
};
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<Stage["fx"][number]> = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
const beast = (c: Ctx, key: string, draw: (p: Pen) => void, x: number, z: number, scale = 1, mirror = false, y = 0, shadow = true) => {
  const d = c.cam.pos.distanceTo(new THREE.Vector3(x, 1, z)) / scale;
  c.out.places.push({ key: `${key}|${tier(d)[0]}`, draw, x, y, z, scale, mirror, size: tier(d) });
  if (shadow) blob(c.out, x, 0, z, scale * 1.2);
};
const pop = (t: number, at0: number) => { const u = clamp01((t - at0 + LEAD) / 0.18); return u <= 0 ? 0 : 1 + 0.25 * Math.sin(Math.PI * u) * (1 - u) + (u < 1 ? -0.3 * (1 - u) : 0); };
const puff = (c: Ctx, at0: number, p: V3, size = 0.5, life = 0.45) => { const u = (c.t - at0) / life; if (u < 0 || u >= 1) return; const k = q(u, 16); card(c, `puff${k}`, 300, 300, (pen) => fxPuff(pen, k), p, size, size); };
const word = (c: Ctx, at0: number, s: string, p: V3, w: number, life = 0.9, col = "#fff3b0") => { const u = c.t - at0 + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at0) * (u > life - 0.12 ? (life - u) / 0.12 : 1); card(c, `word${s}${col}`, 600, 300, (pen) => fxWord(pen, s, col), p, w * k, 0.5 * w * k, { rot: 0.06 * Math.sin(at0 * 7) }); };
const confetti = (c: Ctx, at0: number, p: V3, w: number) => { if (c.t < at0 - LEAD) return; const k = q(((c.t - at0) * 0.35) % 1, 30); card(c, `conf${k}`, 600, 600, (pen) => fxConfetti(pen, k), p, w, w); };
const banner = (c: Ctx, at0: number, s: string, p: V3, w: number, col = "#c0353a", life = 1.8) => { const u = c.t - at0 + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at0) * (u > life - 0.15 ? (life - u) / 0.15 : 1); card(c, `ban${s}${col}`, 1000, 240, (pen) => fxBanner(pen, s, col), p, w * k, 0.24 * w * k, { rot: 0.03 * Math.sin(at0 * 5) }); };
const stay = (c: Ctx, at0: number, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, rot = 0) => { if (!after(c.t, at0)) return; const k = pop(c.t, at0); card(c, key, cw, ch, draw, p, w * k, h * k, { rot }); };
const sayB = (c: Ctx, at0: number, s: string, p: V3, w = 1.0, life = 1.6) => { const u = c.t - at0 + LEAD; if (u < 0 || u > life) return; const k = pop(c.t, at0) * (u > life - 0.12 ? (life - u) / 0.12 : 1); card(c, `say${s}`, 600, 360, (pen) => fxSay(pen, s), p, w * k, 0.6 * w * k); };
const ramp = (t: number, a: number, d: number) => smooth((t - a + LEAD) / d);
const A = (l: number, w: string, n = 0) => (n ? atN(l, w, n) : at(l, w));
const LS = lineStart;
const plankWall = (key: string, base: string) => ctex("pw" + key, 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 32) { g.fillStyle = base; g.fillRect(x, 0, 32, 512); g.fillStyle = `rgba(${r() < 0.5 ? "255,230,200" : "40,20,10"},${0.08 + 0.1 * r()})`; g.fillRect(x, 0, 32, 512); g.fillStyle = "rgba(30,15,8,0.6)"; g.fillRect(x + 30, 0, 2, 512); for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(40,20,10,0.3)"; g.fillRect(x + 4 + 20 * r(), 512 * r(), 2, 30 + 60 * r()); } }
});

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const C = (col: string) => lam("c" + col, () => ({ color: col }));
const sub = (s: SetBuild, key: string, fill: (b: Batch) => void) => { const g = new THREE.Group(), b = new Batch(); fill(b); b.build(g); s.root.add(g); s.dyn[key] = g; return g; };
const flag = (s: SetBuild, key: string, x: number, y: number, z: number, w: number, h: number, tex: () => THREE.Texture, ry = 0) => {
  const geo = new THREE.PlaneGeometry(w, h, 14, 6).translate(w / 2, -h / 2, 0);
  const m = new THREE.Mesh(geo, lam("flag" + key, () => ({ map: tex(), side: THREE.DoubleSide })));
  m.position.set(x, y, z); m.rotation.y = ry; m.userData.base = Float32Array.from(geo.attributes.position.array as Float32Array); m.userData.w = w;
  s.root.add(m); s.dyn["flag" + key] = m;
};
const waveFlags = (s: SetBuild, t: number) => {
  for (const k in s.dyn) if (k.startsWith("flag")) {
    const m = s.dyn[k] as THREE.Mesh, base = m.userData.base as Float32Array, w = m.userData.w as number, pos = m.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { const x = base[3 * i], y = base[3 * i + 1]; pos.setZ(i, (x / w) * 0.13 * w * Math.sin(x * 3.2 / w * 2 - t * 5 + y * 0.8)); pos.setY(i, y - 0.04 * w * (x / w) ** 2); }
    pos.needsUpdate = true; m.geometry.computeVertexNormals();
  }
};
/** gable roof over x0..x1 / z0..z1 from height y, ridge height h, ridge along z (alongZ) or x */
const gable = (b: Batch, mat: THREE.Material, wall: THREE.Material, x0: number, x1: number, z0: number, z1: number, y: number, h: number, alongZ = true, o = 0.4) => {
  if (alongZ) {
    const xm = (x0 + x1) / 2;
    b.add(quad(V(x0 - o, y - 0.2, z1 + o), V(x0 - o, y - 0.2, z0 - o), V(xm, y + h, z0 - o), V(xm, y + h, z1 + o), 3, 3), mat);
    b.add(quad(V(x1 + o, y - 0.2, z0 - o), V(x1 + o, y - 0.2, z1 + o), V(xm, y + h, z1 + o), V(xm, y + h, z0 - o), 3, 3), mat);
    b.add(tri(V(x0, y, z1), V(x1, y, z1), V(xm, y + h, z1)), wall); b.add(tri(V(x1, y, z0), V(x0, y, z0), V(xm, y + h, z0)), wall);
  } else {
    const zm = (z0 + z1) / 2;
    b.add(quad(V(x0 - o, y - 0.2, z1 + o), V(x1 + o, y - 0.2, z1 + o), V(x1 + o, y + h, zm), V(x0 - o, y + h, zm), 3, 3), mat);
    b.add(quad(V(x1 + o, y - 0.2, z0 - o), V(x0 - o, y - 0.2, z0 - o), V(x0 - o, y + h, zm), V(x1 + o, y + h, zm), 3, 3), mat);
    b.add(tri(V(x0, y, z0), V(x0, y, z1), V(x0, y + h, zm)), wall); b.add(tri(V(x1, y, z1), V(x1, y, z0), V(x1, y + h, zm)), wall);
  }
};
const ROOF = (col: string) => lam("droof" + col, () => ({ map: roofHD(col), side: THREE.DoubleSide }));
const lantern = (b: Batch, x: number, y: number, z: number) => {
  b.add(boxGeo(V(x - 0.14, y - 0.22, z - 0.14), V(x + 0.14, y + 0.22, z + 0.14)), lam("lantern", () => ({ color: "#ffe6a0", emissive: "#ffb44a", emissiveIntensity: 1.6 })));
  b.add(boxGeo(V(x - 0.18, y + 0.22, z - 0.18), V(x + 0.18, y + 0.3, z + 0.18)), C("#2a2a2a"));
};
const barrel = (b: Batch, x: number, z: number, h = 0.8, y = 0) => { b.add(new THREE.CylinderGeometry(0.3, 0.3, h, 14).translate(x, y + h / 2, z), C("#8a5a34")); for (const yy of [0.15, h - 0.15]) b.add(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 14).translate(x, y + yy, z), C("#3a3a3e")); };
const crate = (b: Batch, x: number, z: number, s = 0.6, ry = 0, y = 0) => { b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s, s / 2)), lam("crateW", () => ({ map: plankWall("cr", "#a8784a") })), M4(x, y, z, ry)); };
const tree = (b: Batch, x: number, z: number, h: number, seed: number) => {
  b.add(new THREE.CylinderGeometry(0.18 * h / 6, 0.3 * h / 6, h * 0.55, 8).translate(x, h * 0.27, z), C("#6a4a2e"));
  for (let k = 0; k < 4; k++) { const r = h * (0.22 + 0.06 * hh(seed + k, 1)); b.add(new THREE.IcosahedronGeometry(r, 1).translate(x + h * 0.18 * Math.cos(k * 2 + seed), h * (0.6 + 0.12 * (k % 2)), z + h * 0.18 * Math.sin(k * 2 + seed)), C(["#5a8a3a", "#6a9a42", "#4f7a34"][(k + seed) % 3])); }
};

// ---------------- textures ----------------
const clapboard = (key: string, base: string) => ctex("clap" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { g.fillStyle = "rgba(60,50,40,0.28)"; g.fillRect(0, y + 28, 512, 4); g.fillStyle = `rgba(255,255,255,${0.05 + 0.08 * r()})`; g.fillRect(0, y, 512, 6); }
});
const shingle = () => roofHD("#6a6a70");
const GRASS = () => lam("grassM", () => ({ map: rep(grassHD(), 1, 1) }));
const DIRT = () => lam("dirtM", () => ({ map: earthHD("yardHD") }));
const HILLG = () => lam("hillG", () => ({ color: "#7aa25a" }));
const marble = () => ctex("marbleFl", 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#e8e2d6" : "#cfc6b6"; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = "rgba(120,110,100,0.25)"; g.lineWidth = 2; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(512 * r(), 512 * r()); g.bezierCurveTo(512 * r(), 512 * r(), 512 * r(), 512 * r(), 512 * r(), 512 * r()); g.stroke(); }
});
const chalk = () => ctex("chalkB", 512, 320, (g) => {
  g.fillStyle = "#2a3a32"; g.fillRect(0, 0, 512, 320); g.strokeStyle = "#e8e8e0"; g.fillStyle = "#e8e8e0"; g.lineWidth = 4;
  g.font = "bold 40px Georgia"; g.fillText("MEAT ?", 40, 70); g.font = "30px Georgia"; g.fillText("frog spawn?", 60, 140); g.fillText("algae?", 60, 190); g.fillText("lungs??", 60, 240);
  g.beginPath(); g.arc(380, 160, 70, 0, 6.28); g.stroke(); g.beginPath(); g.moveTo(330, 130); g.quadraticCurveTo(380, 200, 430, 140); g.stroke();
  g.font = "bold 90px Georgia"; g.fillText("?", 420, 290);
});

// ---------------- builders ----------------
const window4 = (b: Batch, x0: number, y0: number, z: number, w: number, h: number, nx = 1, rotY = 0, cx = 0, cz = 0) => {
  const m = M4(cx, 0, cz, rotY);
  b.add(boxGeo(V(x0 - 0.08, y0 - 0.08, z), V(x0 + w + 0.08, y0 + h + 0.08, z + 0.06)), C("#f4f1ea"), m);
  b.add(boxGeo(V(x0, y0, z + 0.04), V(x0 + w, y0 + h, z + 0.07)), lam("pane", () => ({ color: "#2e4a62", emissive: "#1a2a3a", emissiveIntensity: 0.3 })), m);
  b.add(boxGeo(V(x0 + w / 2 - 0.03, y0, z + 0.07), V(x0 + w / 2 + 0.03, y0 + h, z + 0.1)), C("#f4f1ea"), m);
  b.add(boxGeo(V(x0, y0 + h / 2 - 0.03, z + 0.07), V(x0 + w, y0 + h / 2 + 0.03, z + 0.1)), C("#f4f1ea"), m);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx < 0 ? x0 - 0.45 : x0 + w + 0.05, y0, z + 0.02), V(sx < 0 ? x0 - 0.05 : x0 + w + 0.45, y0 + h, z + 0.06)), C("#2f4f3a"), m);
  void nx;
};
/** 1870s Kentucky farmhouse: white clapboard, two storeys, porch, chimney. Front faces +z at z = zf. */
const farmhouse = (b: Batch, x0: number, x1: number, zf: number, d: number) => {
  const W = lam("clapW", () => ({ map: rep(clapboard("w", "#f1ece0"), 2, 2) })), H = 5.2;
  wbox(b, W, x0, 0, zf - d, x1, H, zf, 2, 2);
  gable(b, ROOF("#5a5a62"), W, x0, x1, zf - d, zf, H, 2.6, false, 0.5);
  b.add(boxGeo(V(x1 - 1.6, H, zf - d * 0.5 - 0.5), V(x1 - 0.8, H + 3.2, zf - d * 0.5 + 0.5)), lam("brick", () => ({ map: stoneHD("brickHD", ["#9a4a3a", "#a85a44", "#8a4234"], "#5a3a30") })));
  const xm = (x0 + x1) / 2;
  b.add(boxGeo(V(xm - 0.55, 0, zf + 0.01), V(xm + 0.55, 2.3, zf + 0.06)), C("#6a3a2a"));
  for (const x of [x0 + 1.0, xm + 1.4]) window4(b, x, 1.0, zf + 0.01, 1.1, 1.4);
  for (const x of [x0 + 1.0, xm - 0.55, xm + 1.4]) window4(b, x, 3.2, zf + 0.01, 1.1, 1.3);
  // porch
  b.add(boxGeo(V(x0 + 0.4, 0, zf), V(x1 - 0.4, 0.35, zf + 2.2)), lam("porchFl", () => ({ map: planksHD() })));
  for (let x = x0 + 0.6; x <= x1 - 0.5; x += (x1 - x0 - 1.1) / 4) b.add(boxGeo(V(x - 0.08, 0.35, zf + 2.0), V(x + 0.08, 2.7, zf + 2.16)), C("#f4f1ea"));
  b.add(quad(V(x0 + 0.2, 2.7, zf + 2.4), V(x1 - 0.2, 2.7, zf + 2.4), V(x1 - 0.2, 3.3, zf), V(x0 + 0.2, 3.3, zf)), ROOF("#5a5a62"));
  for (let x = x0 + 0.6; x < x1 - 0.5; x += 0.35) b.add(boxGeo(V(x - 0.03, 0.35, zf + 2.05), V(x + 0.03, 1.15, zf + 2.11)), C("#f4f1ea"));
  b.add(boxGeo(V(x0 + 0.6, 1.1, zf + 2.04), V(x1 - 0.5, 1.2, zf + 2.12)), C("#f4f1ea"));
};
/** red barn, front faces +z */
const barn = (b: Batch, x0: number, x1: number, zf: number, d: number) => {
  const R = lam("barnR", () => ({ map: rep(plankWall("barn", "#a8382e"), 2, 1) })), H = 5;
  wbox(b, R, x0, 0, zf - d, x1, H, zf, 2, 2);
  gable(b, ROOF("#4a4a50"), R, x0, x1, zf - d, zf, H, 3.4, true, 0.4);
  const xm = (x0 + x1) / 2;
  b.add(boxGeo(V(xm - 1.6, 0, zf + 0.01), V(xm + 1.6, 3.6, zf + 0.08)), lam("barnD", () => ({ map: plankWall("bd", "#8a2a24") })));
  for (const [a, c] of [[V(xm - 1.6, 0, zf + 0.1), V(xm + 1.6, 3.6, zf + 0.1)], [V(xm + 1.6, 0, zf + 0.1), V(xm - 1.6, 3.6, zf + 0.1)]]) b.add(beamBetween(a, c, 0.07), C("#f4f1ea"));
  b.add(boxGeo(V(xm - 1.7, 3.6, zf + 0.06), V(xm + 1.7, 3.75, zf + 0.12)), C("#f4f1ea"));
  b.add(boxGeo(V(xm - 0.6, 5.6, zf + 0.01), V(xm + 0.6, 6.6, zf + 0.06)), C("#3a2a22"));
};
/** split-rail (worm) fence from (x0, z0) to (x1, z1) */
const railFence = (b: Batch, x0: number, z0: number, x1: number, z1: number) => {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 2.4)), Wd = C("#8a6a4a");
  for (let k = 0; k < n; k++) {
    const a = k / n, c = (k + 1) / n, z = (k % 2 ? 0.35 : -0.35);
    const nx = -(z1 - z0) / L, nz = (x1 - x0) / L;
    for (const y of [0.35, 0.75, 1.1]) b.add(beamBetween(V(x0 + (x1 - x0) * a + nx * z, y, z0 + (z1 - z0) * a + nz * z), V(x0 + (x1 - x0) * c - nx * z, y + 0.12, z0 + (z1 - z0) * c - nz * z), 0.07, 5), Wd);
  }
};
/** the soap kettle: black iron pot on a tripod over a small fire (fire = fx card in STAGE) */
const KETTLE = { x: 1.6, z: -1.2 };
const kettle = (b: Batch) => {
  const { x, z } = KETTLE, Ir = lam("iron", () => ({ color: "#2a2a2e" }));
  b.add(new THREE.SphereGeometry(0.55, 18, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65).translate(x, 0.95, z), Ir);
  b.add(new THREE.TorusGeometry(0.47, 0.05, 8, 20).rotateX(Math.PI / 2).translate(x, 1.4, z), Ir);
  b.add(new THREE.CircleGeometry(0.46, 20).rotateX(-Math.PI / 2).translate(x, 1.36, z), lam("soap", () => ({ color: "#e8dcb0" })));
  for (let k = 0; k < 3; k++) { const a = k * 2.094; b.add(beamBetween(V(x + 1.0 * Math.cos(a), 0, z + 1.0 * Math.sin(a)), V(x, 2.4, z), 0.05, 5), C("#5a3a22")); }
  b.add(beamBetween(V(x, 2.4, z), V(x, 1.4, z), 0.015, 4), Ir);
  for (let k = 0; k < 6; k++) { const a = k * 1.05; b.add(beamBetween(V(x + 0.4 * Math.cos(a), 0.06, z + 0.4 * Math.sin(a)), V(x - 0.3 * Math.cos(a), 0.12, z - 0.3 * Math.sin(a)), 0.06, 5), C("#4a3020")); }
};
const woodpile = (b: Batch, x: number, z: number) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4 - i; j++) b.add(new THREE.CylinderGeometry(0.13, 0.13, 1.2, 8).rotateX(Math.PI / 2).translate(x + (j - (3 - i) / 2) * 0.27, 0.14 + i * 0.24, z), C(["#8a6a4a", "#7a5a3a", "#9a7a54"][(i + j) % 3])); };


// ================================================================ BONNIE & CLYDE (Texas / Missouri / Louisiana 1932-34; Nevada today)
// No game art of any kind: original 1930s sets and cast only. The violence stays off-screen: no shooting is shown, the
// ambush is a still road, the car's holes are seen only in the museum-like casino display. The deaths lines are played straight.
const DIRTR = () => lam("dirtRoad", () => ({ map: earthHD("roadHD") }));
const brick = (key: string, base: string) => stoneHD("brick" + key, [base, base, "#9a5a44"], "#6a4a3a");
const signTex = (text: string, bg: string, fg: string) => ctex("sign" + text, 512, 128, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 512, 128); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(10, 10, 492, 108); g.fillStyle = fg; g.font = "900 64px Georgia"; g.textAlign = "center"; g.fillText(text, 256, 88); });
const sign = (b: Batch, text: string, x: number, y: number, z: number, w: number, bg = "#f1ead6", fg = "#7a1e1e", ry = 0) => b.add(new THREE.PlaneGeometry(w, w / 4), lam("sg" + text, () => ({ map: signTex(text, bg, fg), side: THREE.DoubleSide })), M4(x, y, z, ry));

/** 1934 Ford V8 sedan (faces +x). holes: the bullet-riddled display car. */
const fordV8 = (b: Batch, x: number, z: number, ry = 0, col = "#3a4a5a", holes = false, y = 0) => {
  const m = M4(x, y, z, ry), Bd = lam("car" + col, () => ({ color: col })), Ch = lam("chrome", () => ({ color: "#d8dce0" })), Gl = lam("glass", () => ({ color: "#2a3a48" })), Tr = C("#1a1a1e");
  b.add(boxGeo(V(-2.0, 0.5, -0.78), V(1.2, 1.02, 0.78)), Bd, m);                                   // body
  b.add(boxGeo(V(1.2, 0.55, -0.55), V(2.3, 0.98, 0.55)), Bd, m);                                     // hood
  b.add(boxGeo(V(2.28, 0.54, -0.45), V(2.36, 0.96, 0.45)), Ch, m);                                  // grille
  for (let k = 0; k < 7; k++) b.add(boxGeo(V(2.36, 0.58, -0.4 + k * 0.13), V(2.38, 0.92, -0.38 + k * 0.13)), Tr, m);
  b.add(boxGeo(V(-1.75, 1.02, -0.72), V(0.9, 1.6, 0.72)), Bd, m);                                   // cabin
  b.add(boxGeo(V(-1.8, 1.59, -0.74), V(0.95, 1.65, 0.74)), Bd, m);
  for (const sz of [-1, 1]) {
    b.add(boxGeo(V(-1.5, 1.1, sz * 0.721), V(-0.35, 1.52, sz * 0.73)), Gl, m);
    b.add(boxGeo(V(-0.2, 1.1, sz * 0.721), V(0.75, 1.52, sz * 0.73)), Gl, m);
    b.add(boxGeo(V(-2.1, 0.45, sz * 0.78), V(1.8, 0.52, sz * 0.98)), Tr, m);                         // running board
    for (const wx of [-1.35, 1.55]) {
      b.add(new THREE.CylinderGeometry(0.62, 0.62, 0.32, 18, 1, false, 0, Math.PI).rotateX(Math.PI / 2).translate(wx, 0.62, sz * 0.86), Bd, m);   // fender
      b.add(new THREE.TorusGeometry(0.36, 0.13, 8, 18).translate(wx, 0.42, sz * 0.9), Tr, m);
      b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14).rotateX(Math.PI / 2).translate(wx, 0.42, sz * 0.95), Ch, m);
    }
    if (holes) for (let k = 0; k < 26; k++) b.add(new THREE.CircleGeometry(0.035 + 0.02 * hh(k, sz + 3), 8).translate(-1.9 + 3.0 * hh(k, sz + 1), 0.6 + 0.9 * hh(k, sz + 2), 0).rotateY(sz < 0 ? Math.PI : 0).translate(0, 0, sz * 0.735), Tr, m);
  }
  b.add(boxGeo(V(0.85, 1.05, -0.68), V(0.92, 1.56, 0.68)), Gl, m);                                     // windscreen
  for (const sz of [-0.42, 0.42]) b.add(new THREE.SphereGeometry(0.13, 10, 8).translate(2.15, 0.98, sz), lam("headlamp", () => ({ color: "#fff6d0", emissive: "#fff0b0", emissiveIntensity: 0.4 })), m);
  b.add(boxGeo(V(2.3, 0.4, -0.85), V(2.42, 0.5, 0.85)), Ch, m); b.add(boxGeo(V(-2.15, 0.4, -0.85), V(-2.05, 0.5, 0.85)), Ch, m);
  b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 16).rotateZ(Math.PI / 2).translate(-2.15, 0.85, 0), Tr, m);   // spare wheel
};
/** Eastham prison farm, Texas 1932: cotton rows, a guard tower, a barracks, wire fence */
const farm = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-200, 200, -260, 80, 6, 0), lam("dryGrass", () => ({ map: rep(grassHD(), 1, 1), color: "#d8d0a0" })));
  for (let r = 0; r < 14; r++) {
    const z = 3 - r * 1.3;
    b.add(boxGeo(V(-30, 0, z - 0.25), V(30, 0.25, z + 0.25)), lam("row", () => ({ map: earthHD("rowHD") })));
    for (let k = 0; k < 60; k++) { const x = -30 + k + 0.5 * hh(k + r * 60, 1); b.add(new THREE.IcosahedronGeometry(0.17 + 0.06 * hh(k, r), 1).translate(x, 0.3, z), C(k % 3 ? "#5a7a3a" : "#4a6a30")); if (hh(k + r * 60, 2) > 0.45) b.add(new THREE.SphereGeometry(0.06, 6, 4).translate(x + 0.06, 0.45, z + 0.06), C("#f6f4ee")); }
  }
  const Wd = C("#6a5038");
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) b.add(beamBetween(V(-3 + x * 1.0, 0, -16 + z * 1.0), V(-3 + x * 0.8, 6.5, -16 + z * 0.8), 0.1), Wd);
  b.add(boxGeo(V(-4.1, 6.4, -17.1), V(-1.9, 8.2, -14.9)), lam("towerHut", () => ({ map: plankWall("tower", "#8a6a48") })));
  b.add(new THREE.ConeGeometry(1.8, 1.2, 4).rotateY(Math.PI / 4).translate(-3, 8.8, -16), ROOF("#5a5a62"));
  barn(b, 6, 20, -24, 8);
  for (let x = -40; x <= 40; x += 3) b.add(beamBetween(V(x, 0, -18), V(x, 1.8, -18), 0.06), Wd);
  for (const y of [0.6, 1.1, 1.6]) b.add(beamBetween(V(-40, y, -18), V(40, y, -18), 0.012, 3), C("#4a4a4a"));
  for (let k = 0; k < 8; k++) tree(b, -40 + 11 * k, -40 - 6 * hh(k, 2), 7 + 3 * hh(k, 3), k + 3);
  hills(b, 0, -40, 230, 12, 18, 3, HILLG());
};
/** a 1930s Texas small town: brick storefronts with awnings and signs, a gas station with glass-globe pumps;
 *  the Joplin hideout (a stone garage apartment) stands at the east end (x ~ 34). Road along x at z in [-3, 3]. */
const STORES: [string, string, string][] = [["GROCERY", "#b8603a", "#2a5a3a"], ["DRUGS", "#c8a070", "#7a1e1e"], ["CAFE", "#a85a44", "#2a3a6a"], ["HARDWARE", "#d8b888", "#5a3a22"], ["BANK", "#c8c0b0", "#2a2a30"]];
const town = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-200, 200, -260, 80, 6, 0), lam("dryGrass", () => ({ map: rep(grassHD(), 1, 1), color: "#d8d0a0" })));
  b.add(plane(-60, 60, -3, 3, 3, 0.01), DIRTR());
  b.add(plane(-40, 30, -4.6, -3, 1.5, 0.12), lam("walk", () => ({ color: "#c8bca8" })));
  STORES.forEach(([name, wall, trim], k) => {
    const x0 = -30 + k * 8, x1 = x0 + 7.4, Wl = lam("st" + name, () => ({ map: rep(brick(name, wall), 2, 2) }));
    wbox(b, Wl, x0, 0, -12, x1, 5 + (k % 2), -4.6, 2, 2);
    b.add(boxGeo(V(x0 - 0.1, 5 + (k % 2), -4.8), V(x1 + 0.1, 5.6 + (k % 2), -4.5)), C(trim));
    b.add(boxGeo(V(x0 + 0.6, 0.2, -4.59), V(x0 + 3.2, 2.6, -4.55)), lam("shopGlass", () => ({ color: "#2e4a62", emissive: "#3a4a5a", emissiveIntensity: 0.25 })));
    b.add(boxGeo(V(x0 + 4.0, 0, -4.59), V(x0 + 5.2, 2.4, -4.55)), C("#4a2e1e"));
    b.add(quad(V(x0, 3.0, -4.6), V(x1, 3.0, -4.6), V(x1, 2.6, -3.4), V(x0, 2.6, -3.4)), lam("awn" + k, () => ({ map: ctex("awnS" + k, 128, 32, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : trim; g.fillRect(i * 16, 0, 16, 32); } }), side: THREE.DoubleSide })));
    sign(b, name, (x0 + x1) / 2, 3.9, -4.5, 4.2, "#f1ead6", trim);
  });
  // gas station
  const gx = 12;
  b.add(boxGeo(V(gx, 0, -10), V(gx + 5, 3.4, -6)), lam("gasW", () => ({ map: clapboard("gas", "#f1ece0") })));
  b.add(boxGeo(V(gx - 1, 3.4, -10.4), V(gx + 6, 3.7, -2.4)), C("#c62a2e"));
  for (const x of [gx, gx + 5]) b.add(boxGeo(V(x - 0.1, 0, -2.6), V(x + 0.1, 3.4, -2.4)), C("#f1ece0"));
  for (const x of [gx + 1.5, gx + 3.5]) {
    b.add(new THREE.CylinderGeometry(0.28, 0.32, 2.2, 12).translate(x, 1.1, -4.2), C("#c62a2e"));
    b.add(new THREE.SphereGeometry(0.3, 12, 10).translate(x, 2.55, -4.2), lam("globe", () => ({ color: "#fff6e0", emissive: "#fff0c0", emissiveIntensity: 0.5 })));
    b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 12).translate(x, 1.9, -4.2), lam("gasGlass", () => ({ color: "#f6c84a" })));
  }
  sign(b, "GAS 18¢", gx + 2.5, 4.3, -2.4, 3.2, "#f6f1e0", "#c62a2e");
  // Joplin hideout: two-storey stone garage apartment
  const hx = 34;
  wbox(b, lam("joplinStone", () => ({ map: rep(stoneHD("joplinHD", ["#c8b898", "#b8a888", "#d8c8a8"], "#8a7a62"), 2, 2) })), hx - 4, 0, -12, hx + 4, 6.4, -5, 2, 2);
  gable(b, ROOF("#4a4a50"), C("#c8b898"), hx - 4, hx + 4, -12, -5, 6.4, 1.6, false, 0.3);
  for (const x of [hx - 3.4, hx + 0.4]) b.add(boxGeo(V(x, 0, -4.99), V(x + 3.0, 2.8, -4.95)), lam("garageD", () => ({ map: plankWall("gd", "#e8e0d0") })));
  for (const x of [hx - 3.0, hx - 0.6, hx + 1.8]) window4(b, x, 3.8, -4.99, 1.0, 1.3);
  b.add(beamBetween(V(hx + 4.2, 0, -6), V(hx + 4.2, 3.6, -9), 0.08), C("#6a5038"));
  // poles, trees, hills
  const POLES = [-14, -3.6, 10.6, 24, 42];
  for (const x of POLES) { b.add(new THREE.CylinderGeometry(0.1, 0.12, 7, 8).translate(x, 3.5, -3.9), C("#6a5038")); b.add(boxGeo(V(x - 0.9, 6.5, -3.95), V(x + 0.9, 6.6, -3.85)), C("#6a5038")); }
  b.add(beamBetween(V(-14, 6.6, -3.9), V(42, 6.6, -3.9), 0.01, 3), C("#2a2a2a"));
  for (let k = 0; k < 8; k++) tree(b, -44 + 13 * k, -22 - 6 * hh(k, 4), 7 + 3 * hh(k, 5), k + 11);
  hills(b, 0, -40, 230, 12, 16, 5, HILLG());
  fordV8(b, -8, -1.3, -0.5, "#3a4a5a");
  fordV8(b, hx + 5, -2.6, 0.4, "#2a3a2a");
};
/** the Louisiana back road, May 1934: a dirt road along x through tall pines, roadside brush */
const road = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-200, 200, -260, 80, 6, 0), GRASS());
  b.add(plane(-120, 120, -2.6, 2.6, 3, 0.02), DIRTR());
  for (let k = 0; k < 90; k++) {
    const x = -90 + 2 * k + 1.5 * hh(k, 1), z = (k % 2 ? -1 : 1) * (5 + 18 * hh(k, 2)), h = 10 + 8 * hh(k, 3);
    if (z > 0 && (z < 14 || Math.abs(x) < 12)) continue;   // keep the camera side clear
    b.add(new THREE.CylinderGeometry(0.16, 0.24, h * 0.6, 7).translate(x, h * 0.3, z), C("#6a4a30"));
    for (let j = 0; j < 3; j++) b.add(new THREE.ConeGeometry(1.6 - 0.35 * j, 2.6, 7).translate(x, h * 0.55 + 1.6 * j, z), C(["#3a5a2e", "#2f4f28", "#456a34"][(k + j) % 3]));
  }
  for (let k = 0; k < 40; k++) { const x = -40 + 2 * k, z = -(5.6 + 2.0 * hh(k, 5)); b.add(new THREE.IcosahedronGeometry(0.5 + 0.3 * hh(k, 6), 1).translate(x, 0.4, z), C(["#4a6a30", "#5a7a3a"][k % 2])); }
  hills(b, 0, -40, 230, 12, 14, 7, HILLG());
};
/** a casino near Las Vegas today: patterned carpet, rows of slot machines, the 1934 car under lights behind a velvet rope */
const carpet = () => ctex("carpet", 256, 256, (g) => { g.fillStyle = "#5a1a2a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#c8a040" : "#2a3a6a"; g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 7, 0, 6.28); g.fill(); } });
const slotScreen = (k: number) => ctex("slot" + k, 128, 160, (g) => { g.fillStyle = "#1a1030"; g.fillRect(0, 0, 128, 160); const cols = ["#ff4a6a", "#4affc8", "#ffd84a", "#6a8aff"]; for (let i = 0; i < 3; i++) { g.fillStyle = cols[(i + k) % 4]; g.font = "bold 40px sans-serif"; g.fillText(["7", "★", "$"][(i + k) % 3], 12 + i * 38, 70); } g.fillStyle = cols[k % 4]; g.fillRect(10, 110, 108, 24); });
const casino = (s: SetBuild) => {
  const { b } = s, H = 4.2;
  b.add(plane(-12, 12, -10, 8, 1, 0), lam("carpetM", () => ({ map: rep(carpet(), 8, 6) })));
  const Wc = lam("casWall", () => ({ color: "#3a1a2a" }));
  wbox(b, Wc, -12, 0, -10.2, 12, H, -10, 2, 2);
  for (const sd of [-1, 1]) wbox(b, Wc, sd > 0 ? 12 : -12.2, 0, -10.2, sd > 0 ? 12.2 : -12, H, 8, 2, 2);
  b.add(new THREE.PlaneGeometry(24.4, 18.4).rotateX(Math.PI / 2).translate(0, H, -1.1), lam("casCeil", () => ({ color: "#2a1a24", side: THREE.DoubleSide })));
  for (let x = -10; x <= 10; x += 2.5) for (const z of [-6, -1, 4]) b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 14).translate(x, H - 0.05, z), lam("ceilLight", () => ({ color: "#fff0c0", emissive: "#ffe0a0", emissiveIntensity: 1.4 })));
  // slot rows along the walls
  for (let k = 0; k < 9; k++) for (const [z, ry] of [[-9.2, 0]] as [number, number][]) {
    const x = -10 + 2.5 * k;
    b.add(boxGeo(V(-0.5, 0, -0.4), V(0.5, 1.9, 0.4)), C(["#c8a040", "#a83a4a", "#3a5aa8"][k % 3]), M4(x, 0, z, ry));
    b.add(new THREE.PlaneGeometry(0.7, 0.85), lam("slotM" + (k % 4), () => ({ map: slotScreen(k % 4), emissive: "#ffffff", emissiveMap: slotScreen(k % 4), emissiveIntensity: 0.9 })), M4(x, 1.3, z + 0.41, ry));
    b.add(new THREE.SphereGeometry(0.12, 8, 6).translate(0.55, 1.6, 0), C("#d02a2e"), M4(x, 0, z, ry));
  }
  for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const z = -7 + 3 * k, x = sd * 11.2; b.add(boxGeo(V(-0.4, 0, -0.5), V(0.4, 1.9, 0.5)), C(["#c8a040", "#a83a4a"][k % 2]), M4(x, 0, z, 0)); b.add(new THREE.PlaneGeometry(0.85, 0.7), lam("slotM" + (k % 4), () => ({ map: slotScreen(k % 4), emissive: "#ffffff", emissiveMap: slotScreen(k % 4), emissiveIntensity: 0.9 })), M4(x - sd * 0.41, 1.3, z, -sd * Math.PI / 2)); }
  // the display platform + the car + rope
  b.add(new THREE.CylinderGeometry(3.6, 3.7, 0.3, 32).translate(0, 0.15, -3.5), C("#2a2a30"));
  fordV8(b, 0, -3.5, -0.35, "#4a4a42", true, 0.3);
  for (let k = 0; k < 8; k++) { const a = Math.PI * (0.15 + 0.7 * k / 7), x = 4.1 * Math.cos(a), z = -3.5 + 4.1 * Math.sin(a); b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8).translate(x, 0.47, z), C("#c8a050")); b.add(new THREE.SphereGeometry(0.08, 8, 6).translate(x, 0.98, z), C("#c8a050")); }
  const pts: THREE.Vector3[] = []; for (let k = 0; k <= 40; k++) { const a = Math.PI * (0.15 + 0.7 * k / 40); pts.push(V(4.1 * Math.cos(a), 0.88 - 0.12 * Math.abs(Math.sin(k * Math.PI * 7 / 40)), -3.5 + 4.1 * Math.sin(a))); }
  b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.03, 6), C("#a8202a"));
  for (const x of [-2.6, 2.6]) b.add(new THREE.ConeGeometry(0.6, 1.2, 16, 1, true).rotateX(Math.PI).translate(x, H - 0.6, -3.5), lam("spot", () => ({ color: "#2a2a2a" })));
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { farm, town, road, casino };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- cast ----------------
const CLYDE: Outfit = { jacket: "#2a2a34", pants: "#2a2a34", boots: INK, hat: "fedora", hatCol: "#3a3a40", skin: SKINS[0], tie: undefined } as Outfit;
const CLYDE_PRIS: Outfit = { jacket: "#e8e4dc", pants: "#e8e4dc", boots: "#3a2a1e", hat: "hair", hair: "#3a2a1e", skin: SKINS[0] };
const BONNIE: Outfit = { jacket: "#b83a3a", pants: "#b83a3a", dress: "#b83a3a", boots: INK, hat: "beret", hatCol: "#2a2a34", skin: SKINS[0], trim: "#f4f0e6" };
const GUARD: Outfit = { jacket: "#8a7a5a", pants: "#6a5a42", boots: "#3a2a1e", hat: "fedora", hatCol: "#c8b080", moustache: "#5a3a22", skin: SKINS[1] };
const PRISONER = (v: number): Outfit => ({ jacket: "#e8e4dc", pants: "#e8e4dc", boots: "#3a2a1e", hat: v % 2 ? "cap" : "hair", cap: "#d8d4cc", hair: ["#3a2a1e", "#6a4a2a", "#1e1e1e"][v % 3], skin: SKINS[v % 3] });
const LAWMAN = (v: number): Outfit => ({ jacket: ["#4a4a42", "#5a4a3a", "#3a3a44"][v % 3], pants: "#3a3a3a", boots: INK, hat: "fedora", hatCol: ["#c8b080", "#5a4a3a", "#3a3a3a"][v % 3], moustache: v % 2 ? "#5a3a22" : undefined, skin: SKINS[v % 3] });
const CLERK: Outfit = { jacket: "#f4f0e6", pants: "#4a4a40", boots: INK, hat: "hair", hair: "#5a3a22", moustache: "#5a3a22", skin: SKINS[1] };
const TOURIST = (v: number): Outfit => (v % 2 ? { jacket: "#3a8aa8", pants: "#2a2a30", boots: INK, hat: "cap", cap: "#d02a2e", skin: SKINS[v % 3] } : { jacket: "#e87a3a", pants: "#2a3a5a", boots: INK, hat: "hair", hair: "#c8a060", skin: SKINS[(v + 1) % 3] });

// ---------------- effect drawings ----------------
const SERIF = "Georgia, serif";
const fxToes = (p: Pen) => {
  p.poly(rrect(20, 20, 360, 260, 30), "#fffaf0", 8);
  p.poly([[60, 220], [80, 120], [140, 90], [300, 100], [330, 150], [320, 230]], "#f2c8a0", 8);
  for (const [x, y, r, gone] of [[300, 110, 26, true], [262, 96, 20, true], [228, 92, 17, false], [196, 92, 15, false], [168, 96, 13, false]] as [number, number, number, boolean][]) {
    if (gone) p.stroke([[x - r, y], [x + r, y]], 8, "#d02a2e"); else p.ell(x, y - 6, r, r * 1.1, "#f2c8a0", 6);
  }
  txt(p, "-2", 300, 70, 48, "#d02a2e", "900", "center");
};
const fxPoem = (p: Pen) => {
  p.poly(rrect(20, 20, 360, 460, 10), "#f8f1dc", 8);
  for (let k = 0; k < 9; k++) p.stroke([[60, 90 + 40 * k], [k % 3 === 2 ? 240 : 330, 90 + 40 * k]], 5, "#8a7a62");
  txt(p, "~ poems ~", 200, 70, 34, "#5a3a22", "italic 700", "center", SERIF);
  p.stroke([[300, 430], [360, 340]], 10, "#3a2a1e"); p.poly([[296, 436], [304, 420], [292, 426]], "#1e1e1e", 0);
};
const fxRing = (p: Pen) => { const g = p.g; g.strokeStyle = "#e8be3a"; g.lineWidth = 34; g.beginPath(); g.arc(150, 170, 90, 0, 6.28); g.stroke(); g.strokeStyle = "#a8782a"; g.lineWidth = 8; g.beginPath(); g.arc(150, 170, 108, 0, 6.28); g.stroke(); p.poly([[120, 80], [150, 30], [180, 80], [150, 100]], "#bfe8ff", 6); };
const fxCash = (p: Pen) => { p.poly(rrect(20, 60, 320, 160, 14), "#a8d08a", 8); p.ell(180, 140, 50, 50, "#c8e8b0", 6); txt(p, "$5", 180, 158, 52, "#2a5a2a", "900", "center"); txt(p, "PER JOB", 180, 270, 40, "#2a2010", "900", "center"); };
const fxLetter = (p: Pen) => {
  p.poly(rrect(20, 20, 420, 540, 8), "#fbf6e8", 8);
  txt(p, "Mr. Henry Ford", 70, 100, 30, "#2a2a4a", "italic 700", "left", SERIF);
  for (let k = 0; k < 7; k++) p.stroke([[70, 160 + 42 * k], [k % 3 === 2 ? 270 : 390, 160 + 42 * k]], 5, "#7a7a9a");
  txt(p, "...what a dandy car", 70, 470, 28, "#2a2a4a", "italic 700", "left", SERIF);
  txt(p, "Clyde Barrow", 230, 530, 36, "#2a2a4a", "italic 700", "left", SERIF);
  p.ell(380, 90, 34, 34, null, 0); txt(p, "?", 390, 104, 46, "#d02a2e", "900", "center");
};
const fxFilm = (p: Pen) => { p.poly(rrect(30, 60, 260, 160, 20), "#2a2a2e", 8); p.ell(160, 140, 60, 60, "#4a4a50", 6); p.ell(160, 140, 18, 18, "#1a1a1e", 0); p.poly([[290, 110], [380, 100], [390, 180], [290, 170]], "#6a4a2a", 6); };
const fxPhoto = (p: Pen) => {
  p.poly(rrect(20, 20, 400, 480, 6), "#f1ead6", 8); p.poly(rrect(50, 50, 340, 360, 2), "#c8b090", 0);
  p.poly([[60, 410], [60, 320], [380, 320], [380, 410]], "#a89070", 0);
  p.stroke([[220, 400], [220, 300]], 30, "#5a4030"); p.ell(220, 250, 70, 60, "#8a3a3a", 6); p.ell(220, 175, 40, 42, "#e8d0b0", 6);
  p.ell(200, 140, 50, 18, "#3a2a22", 5); p.stroke([[240, 190], [290, 184]], 9, "#6a4a2a"); p.ell(296, 182, 6, 6, "#ff8a4a", 0);
  p.stroke([[160, 240], [120, 300]], 14, "#8a3a3a");
  txt(p, "JOPLIN, 1933", 220, 470, 34, "#5a4a30", "700", "center", SERIF);
};
const fxNoCigar = (p: Pen) => { p.stroke([[60, 150], [240, 150]], 34, "#6a4a2a"); p.ell(246, 150, 12, 16, "#ff8a4a", 0); const g = p.g; g.strokeStyle = "#d02a2e"; g.lineWidth = 26; g.beginPath(); g.arc(150, 150, 120, 0, 6.28); g.stroke(); p.band([[65, 235], [235, 65]], "#d02a2e", 26, 0, "butt"); };
const fxPlaque = (p: Pen) => { p.poly(rrect(20, 20, 560, 200, 16), "#c8a050", 9); p.poly(rrect(40, 40, 520, 160, 10), "#2a2226", 0); txt(p, "THE 1934 DEATH CAR", 300, 110, 46, "#e8d090", "900", "center", SERIF); txt(p, "Bonnie & Clyde", 300, 170, 36, "#e8d090", "italic 700", "center", SERIF); };
const fxGamepad = (p: Pen) => {   // a generic controller (no brand)
  p.poly([[60, 140], [120, 90], [280, 90], [340, 140], [360, 250], [310, 280], [260, 220], [140, 220], [90, 280], [40, 250]], "#2a2a34", 9);
  p.stroke([[110, 150], [170, 150]], 16, "#e8e4dc"); p.stroke([[140, 120], [140, 180]], 16, "#e8e4dc");
  for (const [x, y, c] of [[270, 125, "#4ad87a"], [300, 150, "#d84a4a"], [240, 150, "#4a8ad8"], [270, 175, "#e8c84a"]] as [number, number, string][]) p.ell(x, y, 13, 13, c, 4);
};

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;  // animate on twos
const CLY = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, pris = false) => pose(c, 1, pris ? CLYDE_PRIS : CLYDE, pris ? "clyP" : "cly", x, z, fo);
const BON = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 2, BONNIE, "bon", x, z, fo);

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 GTA 6 stars a criminal couple on the run. But the real-life original was way weirder.   (hook; the outro returns here)
  1: (c) => {
    const t = c.t;
    BON(c, -8.65, 1.8, { mode: "stand", expr: "smug", look: 0.4, lean: 0.04 });
    CLY(c, -7.15, 1.7, { mode: "stand", expr: "smug", look: -0.3, prop: "bills" });
    if (after(t, A(0, "gta"))) stay(c, A(0, "gta"), "pad", 400, 340, fxGamepad, [-8.8, 3.0, 1.4], 0.7, 0.6, -0.08);
    if (after(t, A(0, "weirder."))) banner(c, A(0, "weirder."), "THE REAL ONES", [-7.9, 3.75, 1.2], 2.0, "#c62a2e", 2.0);
  },
  // 2 Meet Bonnie and Clyde.
  2: (c) => {
    const t = c.t;
    BON(c, -8.65, 1.8, { mode: "stand", expr: "grin", look: 0.3 });
    CLY(c, -7.15, 1.7, { mode: "stand", expr: "smug", look: -0.3 });
    if (after(t, A(0, "bonnie"))) word(c, A(0, "bonnie"), "BONNIE", [-8.45, 2.8, 2.0], 0.9, 1.2, "#ffd0c0");
    if (after(t, A(0, "clyde."))) word(c, A(0, "clyde."), "CLYDE", [-7.35, 3.25, 1.9], 0.9, 1.2, "#fff3b0");
  },
  // 3 Texas, 1932. Clyde Barrow is stuck on a brutal prison farm.
  3: (c) => {
    const t = c.t;
    for (let k = 0; k < 5; k++) pose(c, 10 + k, PRISONER(k), `pr${k % 3}`, [-2.2, -1.0, 1.5, 2.6, -3.4][k], [1.05, -0.25, -0.25, 1.05, -0.25][k], { mode: "stand", expr: "sad", look: 0, lean: 0.25 + 0.05 * Math.sin(TQ(t) * 2 + k), prop: k % 2 ? "rice" : null });
    CLY(c, 0.4, 2.35, { mode: "stand", expr: "pained", look: 0.2, lean: 0.18 }, true);
    pose(c, 20, GUARD, "guard", 1.9, 3.6, { mode: "stand", expr: "stern", look: -0.6, prop: "rifleH" });
    if (after(t, A(1, "texas,"))) stay(c, A(1, "texas,"), "cal1932", 300, 340, (p) => fxCal(p, "1932", true), [-1.4, 4.0, -2], 1.3, 1.47, 0.05);
    if (after(t, A(1, "farm."))) banner(c, A(1, "farm."), "PRISON FARM", [0.6, 3.4, 1.4], 2.2, "#5a4a3a", 1.8);
  },
  // 4 So, to get out of the hard labour, he chops off two of his own toes with an axe.
  4: (c) => {
    const t = c.t, ch = A(1, "chops");
    CLY(c, 0.4, 2.35, { mode: "stand", expr: after(t, ch) ? "pained" : "nervous", look: 0.2, prop: after(t, ch - 0.4) ? "axeUp" : "axe" }, true);
    if (after(t, A(1, "toes"))) stay(c, A(1, "toes"), "toes", 400, 300, fxToes, [1.1, 2.75, 2.2], 0.75, 0.56, 0.05);
  },
  // 5 Six days later, he's released anyway.
  5: (c) => {
    const t = c.t, rl = A(1, "released"), w = smooth((t - rl) / 1.2);
    CLY(c, 0.4 + 2.2 * w, 2.35, { mode: w > 0.02 && w < 0.98 ? "stroll" : "stand", phase: (TQ(t) * 1.4) % 1, expr: "grin", look: 0.6, lean: -0.05 }, true);
    if (after(t, A(1, "days"))) stay(c, A(1, "days"), "cal6", 300, 340, (p) => fxCal(p, "+6 DAYS", true), [0.3, 3.1, 1.4], 0.9, 1.02, 0.05);
    if (after(t, A(1, "anyway."))) word(c, A(1, "anyway."), "PAROLED.", [2.2, 3.2, 1.8], 1.3, 1.2, "#c8f0c0");
  },
  // 6 Then he teams up with Bonnie Parker. Four foot eleven. Writes poetry.
  6: (c) => {
    const t = c.t;
    BON(c, -0.65, -1.2, { mode: "stand", expr: "smile", look: 0.4, prop: after(t, A(2, "poetry.")) ? "quill" : null });
    CLY(c, 0.75, -1.4, { mode: "stand", expr: "smug", look: -0.4 });
    if (after(t, A(2, "parker."))) banner(c, A(2, "parker."), "BONNIE PARKER", [0, 3.0, -1.0], 2.0, "#b83a3a", 1.8);
    if (after(t, A(2, "eleven."))) word(c, A(2, "eleven."), "4' 11\"", [-0.65, 2.45, -0.9], 0.75, 1.0, "#fff3b0");
    if (after(t, A(2, "poetry."))) stay(c, A(2, "poetry."), "poem", 400, 500, fxPoem, [0.05, 2.2, -0.6], 0.5, 0.63, -0.05);
  },
  // 7 Fun fact: she was already married, to another guy. She never divorced him.
  7: (c) => {
    const t = c.t;
    BON(c, -0.5, -1.2, { mode: "stand", expr: "innocent" as FrontOpts["expr"], look: 0.2 });
    CLY(c, 1.2, -1.4, { mode: "stand", expr: after(t, A(2, "divorced")) ? "shock" : "neutral", look: -0.6 });
    if (after(t, A(2, "married,"))) stay(c, A(2, "married,"), "ring", 300, 300, fxRing, [-1.2, 2.5, -0.8], 0.55, 0.55, 0.06);
    if (after(t, A(2, "divorced"))) word(c, A(2, "divorced"), "NEVER DIVORCED", [0.4, 3.1, -1.0], 1.8, 1.3, "#ffd0c0");
  },
  // 8 Their big crime spree? Not giant bank vaults.
  8: (c) => {
    const t = c.t;
    if (after(t, A(3, "vaults."))) word(c, A(3, "vaults."), "NOT BANKS", [5.7, 1.7, -2.6], 2.6, 1.4, "#ffd0c0");
  },
  // 9 Mostly small-town shops and gas stations, for a few dollars.
  9: (c) => {
    const t = c.t;
    BON(c, 14.4, -1.4, { mode: "stand", expr: "smug", look: 0.3 });
    CLY(c, 15.4, -1.6, { mode: "stand", expr: "grin", look: -0.3, prop: after(t, A(3, "dollars.")) ? "bills" : null });
    pose(c, 30, CLERK, "clerk", 16.3, -2.7, { mode: "stand", expr: "nervous", look: -0.5, prop: "handsUp" });
    if (after(t, A(3, "dollars."))) stay(c, A(3, "dollars."), "cash", 400, 300, fxCash, [14.9, 2.9, -1.2], 0.95, 0.71, -0.05);
  },
  // 10 Clyde loved one car: the Ford V8. He stole them again and again.
  10: (c) => {
    const t = c.t;
    CLY(c, -6.5, 1.6, { mode: "stand", expr: "awe", look: -0.6, lean: -0.05 });
    if (after(t, A(4, "v8."))) banner(c, A(4, "v8."), "FORD V8", [-7.9, 2.45, 0.2], 2.0, "#2a3a6a", 2.0);
    if (after(t, A(4, "again."))) { const n = Math.min(5, 1 + Math.floor((t - A(4, "again.")) * 4)); word(c, A(4, "again."), `STOLEN x${n}`, [-7.9, 3.2, 0.2], 1.4, 1.0, "#fff3b0"); }
  },
  // 11 There's even a letter, signed Clyde Barrow, thanking Henry Ford for such a great getaway car.
  11: (c) => {
    const t = c.t;
    if (after(t, A(4, "letter,"))) stay(c, A(4, "letter,"), "letter", 460, 580, fxLetter, [-7.9, 3.0, 1.6], 1.1, 1.39, -0.04);
    if (after(t, A(4, "getaway"))) word(c, A(4, "getaway"), "GETAWAY CAR", [-7.9, 3.95, 1.7], 1.4, 1.1, "#fff3b0");
  },
  // 12 Nobody knows if he really wrote it.
  12: (c) => {
    const t = c.t;
    stay(c, -9, "letter", 460, 580, fxLetter, [-7.9, 3.0, 1.6], 1.1, 1.39, -0.04);
    if (after(t, A(4, "wrote"))) word(c, A(4, "wrote"), "REAL? FAKE?", [-7.9, 3.95, 1.7], 1.4, 1.1, "#e0c8ff");
  },
  // 13 In 1933, police raid their hideout in Joplin, Missouri. The gang escapes, but leaves behind a roll of film.
  13: (c) => {
    const t = c.t, es = A(5, "escapes,");
    for (let k = 0; k < 3; k++) pose(c, 40 + k, LAWMAN(k), `law${k}`, 31.6 + 1.0 * k, 1.0 + 0.5 * (k % 2), { mode: "stand", expr: "stern", look: 0.6 });
    if (after(t, A(5, "joplin,"))) banner(c, A(5, "joplin,"), "JOPLIN, MISSOURI", [34, 7.6, -5], 4.2, "#5a4a3a", 1.8);
    if (after(t, A(5, "1933,"))) stay(c, A(5, "1933,"), "cal1933", 300, 340, (p) => fxCal(p, "1933", true), [31.0, 5.2, -4], 1.3, 1.47, 0.05);
    if (after(t, A(5, "film."))) stay(c, A(5, "film."), "film", 420, 300, fxFilm, [32.4, 2.0, -1.4], 1.0, 0.71, 0.05);
    if (after(t, es)) word(c, es, "ESCAPED!", [34.8, 3.6, -2], 1.6, 1.2, "#fff3b0");
  },
  // 14 The photos make them famous overnight. In one, Bonnie poses with a cigar.
  14: (c) => {
    const t = c.t;
    if (after(t, A(5, "photos"))) stay(c, A(5, "photos"), "photo", 440, 520, fxPhoto, [34, 2.6, -1.0], 1.4, 1.65, -0.04);
    if (after(t, A(5, "famous"))) banner(c, A(5, "famous"), "FRONT-PAGE FAMOUS", [34, 4.0, -1.2], 2.6, "#c62a2e", 1.6);
  },
  // 15 She didn't even smoke cigars. And she hated that photo.
  15: (c) => {
    const t = c.t;
    BON(c, 33.4, -1.6, { mode: "stand", expr: after(t, A(5, "hated")) ? "pained" : "stern", look: 0.3 });
    if (after(t, A(5, "cigars."))) stay(c, A(5, "cigars."), "nocigar", 300, 300, fxNoCigar, [34.6, 2.6, -1.4], 0.6, 0.6, 0.05);
    if (after(t, A(5, "hated"))) word(c, A(5, "hated"), "SHE HATED IT", [33.6, 3.2, -1.6], 1.5, 1.1, "#ffd0c0");
  },
  // 16 But this was no game. The gang was linked to 13 murders, including 9 police officers.   (played straight, cold)
  16: (c) => {
    const t = c.t;
    for (let k = 0; k < 9; k++) pose(c, 50 + k, LAWMAN(k), `law${k % 3}`, k < 5 ? -2 + k : -1.5 + (k - 5), k < 5 ? -1.6 : -2.7, { mode: "stand", expr: "sad", look: 0, blink: true });
    if (after(t, A(6, "murders,"))) banner(c, A(6, "murders,"), "13 MURDERS", [0, 3.4, -1.6], 2.6, "#2a2226", 2.4);
    if (after(t, A(6, "officers."))) word(c, A(6, "officers."), "9 POLICE OFFICERS", [0, 2.75, -1.4], 2.2, 1.0, "#e8e8e8");
  },
  // 17 May 1934. A quiet road in Louisiana. Officers wait in ambush.
  17: (c) => {
    const t = c.t;
    for (let k = 0; k < 4; k++) pose(c, 60 + k, LAWMAN(k), `law${k % 3}`, -2 + 1.3 * k, -4.0 - 0.3 * (k % 2), { mode: "stand", expr: "stern", look: 0.5 }, 0.95);
    if (after(t, A(7, "1934."))) stay(c, A(7, "1934."), "cal1934", 300, 340, (p) => fxCal(p, "MAY 1934", true), [-1.8, 4.3, -3], 1.3, 1.47, 0.05);
    if (after(t, A(7, "louisiana."))) banner(c, A(7, "louisiana."), "LOUISIANA", [0.6, 5.0, -4], 3.0, "#3a5a2e", 1.8);
  },
  // 18 They fire more than 130 bullets.   (no shooting shown: the empty road, a number)
  18: (c) => {
    const t = c.t;
    if (after(t, A(7, "130"))) banner(c, A(7, "130"), "130+ ROUNDS", [0, 3.2, -1.0], 2.4, "#2a2226", 2.4);
  },
  // 19 Bonnie was 23. Clyde, 25.
  19: (c) => {
    const t = c.t;
    if (after(t, A(7, "23."))) word(c, A(7, "23."), "BONNIE, 23", [-0.3, 3.5, -1.0], 1.4, 1.0, "#e8e8e8");
    if (after(t, A(7, "25."))) word(c, A(7, "25."), "CLYDE, 25", [0.4, 2.7, -1.0], 1.4, 1.0, "#e8e8e8");
  },
  // 20 And the bullet-riddled car? Today, it's on display in a casino near Las Vegas.
  20: (c) => {
    const t = c.t;
    [[-3.6, 1.6, 0], [3.4, 1.2, 1], [-2.0, 3.2, 2], [2.4, 3.4, 3]].forEach(([x, z, v]) => pose(c, 70 + v, TOURIST(v), `tour${v % 2}`, x, z, { mode: "stand", expr: v % 2 ? "awe" : "shock", look: x > 0 ? -0.6 : 0.6, prop: v === 3 ? "photo" : null }));
    if (after(t, A(8, "display"))) stay(c, A(8, "display"), "plaque", 600, 240, fxPlaque, [0, 2.9, -0.6], 2.2, 0.88, 0);
    if (after(t, A(8, "vegas."))) banner(c, A(8, "vegas."), "NEAR LAS VEGAS", [0, 3.7, -0.8], 2.6, "#c8a040", 1.8);
  },
  // 21 Yes. Really.
  21: (c) => {
    const t = c.t;
    if (after(t, A(8, "really."))) word(c, A(8, "really."), "YES. REALLY.", [0, 2.7, -0.6], 1.4, 1.3, "#fff3b0");
  },
  // 22 Send this to the friend who pre-ordered GTA 6 and calls himself a getaway driver.   (ends on shot 1)
  22: (c) => {
    const t = c.t;
    BON(c, -8.65, 1.8, { mode: "stand", expr: "smug", look: 0.4, lean: 0.04 });
    CLY(c, -7.15, 1.7, { mode: "stand", expr: "smug", look: -0.3, prop: "bills" });
    if (after(t, A(9, "send")) && t < A(9, "calls") - 0.15) banner(c, A(9, "send"), "SEND THIS TO HIM", [-7.9, 3.8, 1.2], 2.6, "#e07a1a", 2.0);
  },
};
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxSay; void fxScore; void cobbleHD; void tri; void house; void tent; void chair; void sub; void lantern; void farmhouse; void railFence; void kettle; void woodpile; void KETTLE; void shingle; void marble; void chalk; void sayB; void puff; void jolt; void hop; void pop; void table2; void bookcase; void painting; void rug; void chandelier2; void panelHD; void clamp01; void barrel; void crate; void flag; void waveFlags; void SHOTS; void FPS;
