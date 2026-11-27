// Places and cast of "The Kentucky Meat Shower" (Bath County, Kentucky, 3 March 1876; 9:16 short). Cameras on +z looking -z.
// Direction sheet: a bright, cloudless Kentucky spring. Palette: grass green, sky blue, white clapboard, barn red, and the
// meat pink-red as the single accent. One key moment per shot on a narration word; falling meat tumbles on twos; the
// "human baby" line is kept to words (no image). Avoid: faces filling frame, push-ins ending on eyes, cut-off labels.
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
const farm = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-200, 200, -260, 80, 6, 0), GRASS());
  b.add(plane(-11, 11, -9, 7, 2, 0.02), DIRT());
  b.add(plane(-2, 2, 7, 80, 2, 0.02), DIRT());
  farmhouse(b, -11, -2, -8, 7);
  barn(b, 6, 14, -14, 10);
  kettle(b); woodpile(b, 4.6, -4.6); barrel(b, -1.2, -6.6); barrel(b, -0.5, -6.9); crate(b, 3.6, -3.2, 0.6, 0.3);
  railFence(b, -13, 8, -13, -18); railFence(b, 18, 8, 18, -24); railFence(b, -13, -18, 4, -26);
  for (let k = 0; k < 9; k++) tree(b, -30 + 7.5 * k + 3 * hh(k, 1), -34 - 10 * hh(k, 2) - (k % 2) * 6, 7 + 4 * hh(k, 3), k);
  for (let k = 0; k < 4; k++) tree(b, -20 - 4 * k, 2 - 7 * k, 6 + 3 * hh(k, 8), k + 30);
  tree(b, 22, -2, 8, 41); tree(b, 26, -12, 9, 42);
  hills(b, 0, -40, 230, 12, 30, 3, HILLG());
  // a washing line, a pump
  b.add(beamBetween(V(-12, 0, -2), V(-12, 2.3, -2), 0.05), C("#6a4a2e")); b.add(beamBetween(V(-5, 0, -1), V(-5, 2.3, -1), 0.05), C("#6a4a2e"));
  b.add(beamBetween(V(-12, 2.2, -2), V(-5, 2.1, -1), 0.012, 3), C("#e8e0d0"));
  for (const [x, col] of [[-10.6, "#e8e0d0"], [-9.4, "#7a9ac8"], [-8.1, "#c84a3a"], [-6.8, "#e8e0d0"]] as [number, string][]) { const z = -2 + (x + 12) / 7; b.add(boxGeo(V(x - 0.4, 1.3, z - 0.02), V(x + 0.4, 2.15, z + 0.02)), C(col)); }
  b.add(boxGeo(V(-1.4, 0, -3.4), V(-1.1, 1.2, -3.1)), C("#3a4a3a")); b.add(beamBetween(V(-1.25, 1.1, -3.25), V(-0.6, 1.4, -3.25), 0.04), C("#3a4a3a"));
};
/** a 1876 professor's laboratory: panelling, bookcases, a bench with microscopes and specimen jars, a chalkboard */
const JAR_MAT = () => lam("jarGlass", () => ({ color: "#d8f0f0", transparent: true, opacity: 0.35, depthWrite: false }));
const MEAT_MAT = () => lam("meatM", () => ({ color: "#b8505a", emissive: "#3a0a10", emissiveIntensity: 0.2 }));
const jar = (b: Batch, x: number, y: number, z: number, s = 1) => {
  b.add(new THREE.SphereGeometry(0.12 * s, 10, 8).scale(1.2, 0.8, 1).translate(x, y + 0.12 * s, z), MEAT_MAT());
  b.add(new THREE.CylinderGeometry(0.16 * s, 0.16 * s, 0.38 * s, 18, 1, true).translate(x, y + 0.19 * s, z), JAR_MAT());
  b.add(new THREE.CylinderGeometry(0.17 * s, 0.17 * s, 0.06 * s, 18).translate(x, y + 0.41 * s, z), C("#c8a050"));
  b.add(new THREE.PlaneGeometry(0.2 * s, 0.12 * s).translate(x, y + 0.2 * s, z + 0.165 * s), C("#f4ecd0"));
};
const microscope = (b: Batch, x: number, y: number, z: number) => {
  const Br = lam("brass", () => ({ color: "#c8a050" })), Bk = C("#2a2a2e");
  b.add(boxGeo(V(x - 0.14, y, z - 0.12), V(x + 0.14, y + 0.04, z + 0.12)), Bk);
  b.add(beamBetween(V(x, y + 0.04, z - 0.08), V(x, y + 0.3, z - 0.08), 0.025), Bk);
  b.add(beamBetween(V(x, y + 0.22, z - 0.06), V(x, y + 0.46, z + 0.02), 0.035, 10), Br);
  b.add(boxGeo(V(x - 0.08, y + 0.14, z - 0.06), V(x + 0.08, y + 0.16, z + 0.08)), Bk);
};
const lab = (s: SetBuild) => {
  const { b } = s, H = 3.4;
  const Wl = lam("lWall", () => ({ map: panelHD("lab", "#5a3e26") }));
  b.add(plane(-5, 5, -4.6, 6, 2.4), lam("lFloor", () => ({ map: planksHD() })));
  wbox(b, Wl, -5, 0, -4.8, 5, H, -4.6, 2.5, 2.5);
  for (const sd of [-1, 1]) wbox(b, Wl, sd > 0 ? 5 : -5.2, 0, -4.8, sd > 0 ? 5.2 : -5, H, 6, 2.5, 2.5);
  b.add(boxGeo(V(-5.2, H, -4.8), V(5.2, H + 0.1, 6)), C("#d8c8a8"));
  const cb = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), lam("chalkM", () => ({ map: chalk() }))); cb.position.set(0, 2.0, -4.55); s.root.add(cb);
  b.add(boxGeo(V(-1.3, 1.2, -4.6), V(1.3, 1.25, -4.5)), C("#5a3a22"));
  table2(b, 0, -1.9, 4.4, 1.1, 0.9, "#4a2a18", null, false);
  microscope(b, -1.2, 0.9, -1.9); microscope(b, 1.3, 0.9, -1.8);
  for (let k = 0; k < 5; k++) jar(b, -0.6 + 0.3 * k, 0.9, -2.2 + 0.08 * (k % 2), 0.8);
  bookcase(b, -4.2, -3.6, 1.4, 2.6, "#3a2414"); bookcase(b, 4.2, -3.6, 1.4, 2.6, "#3a2414");
  for (let k = 0; k < 6; k++) jar(b, -4.6 + 0.3 * k, 1.9, -4.35, 0.7);
  painting(b, -2.9, 2.2, -4.55, 0.8, 0.7, 3); painting(b, 2.9, 2.2, -4.55, 0.8, 0.7, 6);
  rug(b, "lab", ["#5a2a2a", "#2a3a4a", "#c8a050", "#e8dcc0"], 0, 0.4, 3.6, 2.4);
};
/** a university museum hall: marble floor, columns, a pedestal with THE jar under a glass case, rope barriers */
const museum = (s: SetBuild) => {
  const { b } = s, H = 5;
  b.add(plane(-7, 7, -8, 6, 1, 0), lam("marbleM", () => ({ map: rep(marble(), 3, 3) })));
  const Wm = lam("mWall", () => ({ color: "#e8dcc4" }));
  wbox(b, Wm, -7, 0, -8.2, 7, H, -8, 2, 2);
  for (const sd of [-1, 1]) wbox(b, Wm, sd > 0 ? 7 : -7.2, 0, -8.2, sd > 0 ? 7.2 : -7, H, 6, 2, 2);
  b.add(boxGeo(V(-7.2, 0, -8.0), V(7.2, 0.3, -7.85)), C("#8a7a64"));
  b.add(boxGeo(V(-7.2, H - 0.3, -8.0), V(7.2, H, -7.8)), C("#c8b898"));
  for (const x of [-5, -2.4, 2.4, 5]) { b.add(new THREE.CylinderGeometry(0.32, 0.36, H - 0.4, 16).translate(x, (H - 0.4) / 2, -7.4), C("#f1ece0")); b.add(boxGeo(V(x - 0.45, 0, -7.85), V(x + 0.45, 0.3, -6.95)), C("#d8d0c0")); b.add(boxGeo(V(x - 0.45, H - 0.6, -7.85), V(x + 0.45, H - 0.4, -6.95)), C("#d8d0c0")); }
  painting(b, -3.7, 2.6, -7.95, 1.2, 0.9, 1); painting(b, 3.7, 2.6, -7.95, 1.2, 0.9, 4);
  // the pedestal + glass case + jar
  b.add(boxGeo(V(-0.45, 0, -2.45), V(0.45, 1.05, -1.55)), lam("ped", () => ({ map: stoneHD("pedHD", ["#2a2a30", "#34343a"], "#1a1a1e") })));
  b.add(boxGeo(V(-0.5, 1.05, -2.5), V(0.5, 1.12, -1.5)), C("#c8a050"));
  b.add(boxGeo(V(-0.2, 0.6, -1.54), V(0.2, 0.75, -1.53)), C("#c8a050"));
  for (const [x, z] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, -3.4], [1.4, -3.4]] as [number, number][]) { b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8).translate(x, 0.47, z), C("#c8a050")); b.add(new THREE.SphereGeometry(0.08, 8, 6).translate(x, 0.98, z), C("#c8a050")); }
  for (const [a, c] of [[[-1.4, -0.6], [1.4, -0.6]], [[-1.4, -0.6], [-1.4, -3.4]], [[1.4, -0.6], [1.4, -3.4]]] as [number, number][][]) {
    const pts: THREE.Vector3[] = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(V(a[0] + (c[0] - a[0]) * u, 0.9 - 0.18 * Math.sin(Math.PI * u), a[1] + (c[1] - a[1]) * u)); }
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.03, 6), C("#a8202a"));
  }
  for (const x of [-4.6, 4.6]) { b.add(boxGeo(V(x - 0.6, 0, -4.2), V(x + 0.6, 0.9, -3.4)), C("#5a3a22")); b.add(boxGeo(V(x - 0.58, 0.9, -4.18), V(x + 0.58, 1.5, -3.42)), JAR_MAT()); jar(b, x - 0.25, 0.9, -3.8, 0.8); jar(b, x + 0.25, 0.9, -3.8, 0.8); }
  rug(b, "mus", ["#7a2632", "#2a3a5a", "#d8b84a", "#e8dcc0"], 0, 1.5, 2.6, 4.6);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { farm, lab, museum };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};

// ---------------- cast (Bath County, Kentucky, 1876) ----------------
const MRS: Outfit = { jacket: "#6a7a9a", pants: "#6a7a9a", boots: "#3a2a1e", dress: "#6a7a9a", hat: "bonnet", hatCol: "#e8d8b8", skin: SKINS[0], trim: "#f4f0e6" };
const NB1: Outfit = { jacket: "#8a6a3a", pants: "#4a5a7a", boots: "#3a2a1e", hat: "slouch", hatCol: "#5a4a32", moustache: "#5a3a22", skin: SKINS[1] };
const NB2: Outfit = { jacket: "#c8a060", pants: "#5a4a3a", boots: "#3a2a1e", hat: "fedora", hatCol: "#e0c070", moustache: "#8a5a2a", skin: SKINS[0] };
const PROF = (v: number): Outfit => ({ jacket: ["#2a2a30", "#3a2a22", "#2a3a4a"][v % 3], pants: "#2a2a30", boots: INK, hat: v % 2 ? "tophat" : "hair", hatCol: "#1e1e24", hair: "#9a8a7a", moustache: ["#cfc8bc", "#6a4a2a", "#9a8a7a"][v % 3], skin: SKINS[v % 3], build: v === 1 ? "stout" : "adult" });
const NEWSBOY: Outfit = { jacket: "#7a5a3a", pants: "#4a4a3a", boots: "#3a2a1e", hat: "cap", cap: "#5a5a4a", skin: SKINS[1], build: "kid" };
const VISITOR = (v: number): Outfit => (v % 2 ? { jacket: "#3a6a8a", pants: "#2a2a30", boots: INK, hat: "hair", hair: "#3a2a1e", skin: SKINS[v % 3] } : { jacket: "#c84a5a", pants: "#c84a5a", dress: "#c84a5a", boots: INK, hat: "hair", hair: "#c8a060", skin: SKINS[(v + 1) % 3] });

// ---------------- effect drawings ----------------
const SERIF = "Georgia, serif";
const fxMeat = (v: number) => (p: Pen) => {
  const pts: [number, number][] = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 80 + 34 * hh(v * 31 + i, 3); pts.push([150 + r * Math.cos(a), 150 + r * 0.78 * Math.sin(a)]); }
  p.poly(pts, ["#c8505a", "#b8404a", "#d0606a"][v % 3], 9);
  p.stroke([[100, 130], [140, 150], [170, 120], [210, 160]], 9, "#f4d8d0"); p.stroke([[110, 180], [160, 190]], 7, "#f4d8d0");
  p.ell(120, 115, 16, 10, "#ff9aa0", 0);
};
const MEATS = [0, 1, 2].map((v) => fxMeat(v));
const fxNo = (what: "hail" | "frog") => (p: Pen) => {
  if (what === "hail") for (const [x, y, r] of [[140, 170, 40], [220, 230, 34], [260, 150, 46], [170, 260, 30]] as [number, number, number][]) { p.ell(x, y, r, r, "#e8f4ff", 7); p.ell(x - r * 0.3, y - r * 0.3, r * 0.25, r * 0.2, "#ffffff", 0); }
  else { p.ell(200, 230, 110, 70, "#5aa04a", 9); p.ell(150, 160, 34, 34, "#5aa04a", 8); p.ell(250, 160, 34, 34, "#5aa04a", 8); p.ell(150, 158, 18, 18, "#ffffff", 5); p.ell(250, 158, 18, 18, "#ffffff", 5); p.ell(152, 160, 8, 8, INK, 0); p.ell(252, 160, 8, 8, INK, 0); p.stroke([[160, 250], [200, 265], [240, 250]], 7, INK); }
  const g = p.g; g.strokeStyle = "#d02a2e"; g.lineWidth = 30; g.beginPath(); g.arc(200, 200, 170, 0, Math.PI * 2); g.stroke(); p.band([[80, 320], [320, 80]], "#d02a2e", 30, 0, "butt");
};
const fxSheep = (p: Pen) => {
  for (const [x, y] of [[150, 170], [210, 150], [270, 170], [180, 220], [250, 225], [300, 205], [130, 215]] as [number, number][]) p.ell(x, y, 55, 50, "#f6f2ea", 7);
  p.ell(95, 175, 38, 46, "#2a2a2e", 7); p.ell(85, 168, 7, 7, "#ffffff", 0); for (const x of [160, 200, 250, 290]) p.stroke([[x, 260], [x, 320]], 14, "#2a2a2e");
};
const fxDeer = (p: Pen) => {
  p.ell(220, 210, 120, 62, "#a8703a", 8); p.stroke([[110, 190], [80, 110]], 30, "#a8703a"); p.ell(78, 100, 40, 32, "#a8703a", 7); p.ell(66, 92, 7, 7, INK, 0);
  for (const sx of [-1, 1]) p.stroke([[85 + sx * 10, 75], [70 + sx * 30, 20], [50 + sx * 40, 10]], 9, "#6a4a2a");
  for (const x of [140, 180, 270, 310]) p.stroke([[x, 250], [x, 330]], 14, "#8a5a2e"); p.ell(330, 195, 16, 12, "#f4ece0", 4);
};
const fxPaper = (head: string, sub: string) => (p: Pen) => {
  p.poly(rrect(20, 20, 520, 640, 6), "#f2ead6", 8);
  txt(p, "THE DAILY GAZETTE", 280, 92, 40, "#2a2010", "900", "center", SERIF);
  p.stroke([[50, 116], [510, 116]], 5, "#2a2010"); txt(p, "MARCH 1876", 280, 150, 26, "#5a4a30", "700", "center", SERIF); p.stroke([[50, 168], [510, 168]], 3, "#2a2010");
  const words = head.split(" "); let line = "", y = 240; const lines: string[] = [];
  for (const w of words) { if ((line + " " + w).trim().length > 11) { lines.push(line.trim()); line = w; } else line += " " + w; } lines.push(line.trim());
  for (const l of lines) { txt(p, l, 280, y, 62, "#1a1208", "900", "center", SERIF); y += 70; }
  txt(p, sub, 280, y + 10, 26, "#5a4a30", "700", "center", SERIF);
  for (let k = 0; k < 6; k++) p.stroke([[60, y + 60 + 26 * k], [k % 3 === 2 ? 380 : 500, y + 60 + 26 * k]], 6, "#b8ae98");
};
const fxVulture = (k: number) => (p: Pen) => {
  const up = Math.sin(k * Math.PI * 2);
  p.poly([[200, 210], [80 - 10 * up, 150 - 90 * up], [40, 170 - 70 * up], [150, 230]], "#2a2226", 7);
  p.ell(220, 230, 90, 40, "#2a2226", 8);
  p.poly([[300, 230], [360, 215], [360, 245]], "#2a2226", 6);
  p.poly([[230, 220], [350 + 10 * up, 150 - 80 * up], [390, 170 - 60 * up], [270, 245]], "#3a3036", 7);
  p.stroke([[140, 220], [100, 205]], 12, "#c8b8b0");
  p.stroke([[150, 220], [118, 200], [92, 196]], 18, "#d88a8a"); p.ell(88, 192, 26, 22, "#d8706a", 7); p.ell(80, 185, 5, 5, INK, 0);
  p.poly([[64, 190], [44, 200], [62, 206]], "#e8dcc0", 5);
};
const VULT = [0, 0.25, 0.5, 0.75].map((k) => fxVulture(k));
const fxFire = (k: number) => (p: Pen) => {
  const w = 14 * Math.sin(k * 6.28);
  p.poly([[60, 300], [90, 180 + w], [130, 240], [160, 100 - w], [190, 230], [220, 160 + w], [250, 300]], "#f6a23a", 6);
  p.poly([[100, 300], [130, 230], [160, 170 - w], [190, 240], [210, 300]], "#ffe07a", 0);
};
const fxSize = (label: string, big: boolean) => (p: Pen) => {
  p.poly(rrect(10, 10, 380, 380, 30), "#fffaf0", 8);
  if (big) { p.ell(200, 210, 130, 95, "#c8505a", 8); p.stroke([[120, 190], [200, 230], [270, 180]], 10, "#f4d8d0"); }
  else for (const [x, y] of [[150, 170], [230, 210], [180, 250], [260, 150]] as [number, number][]) p.ell(x, y, 16, 12, "#c8505a", 5);
  txt(p, label, 200, 360, 40, "#2a2010", "900", "center");
};
const fxJar = (p: Pen) => {
  p.poly(rrect(70, 60, 260, 40, 10), "#c8a050", 8);
  p.poly([[60, 110], [340, 110], [350, 140], [350, 440], [330, 470], [70, 470], [50, 440], [50, 140]], "rgba(210,240,240,0.55)", 9);
  const pts: [number, number][] = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 80 + 20 * Math.sin(i * 2.3); pts.push([200 + r * Math.cos(a), 360 + r * 0.6 * Math.sin(a)]); }
  p.poly(pts, "#b8505a", 7); p.stroke([[150, 350], [200, 370], [250, 340]], 7, "#f0d0c8");
  p.poly(rrect(110, 200, 180, 80, 6), "#f4ecd0", 5); txt(p, "MEAT", 200, 238, 34, "#2a2010", "900", "center", SERIF); txt(p, "KY, 1876", 200, 268, 22, "#5a4a30", "700", "center", SERIF);
  p.stroke([[80, 150], [80, 420]], 10, "rgba(255,255,255,0.8)");
};
const fxArrowDown = (p: Pen) => { p.band([[200, 30], [200, 260]], "#ffffff", 60, 0, "butt"); p.poly([[110, 240], [290, 240], [200, 360]], "#ffffff", 8); };

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;  // animate on twos
const MRS_ = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 1, MRS, "mrs", x, z, fo);
const NBA = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 2, NB1, "nb1", x, z, fo);
const NBB = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 3, NB2, "nb2", x, z, fo);
const prof = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act) => pose(c, 10 + k, PROF(k), `pf${k}`, x, z, fo);
/** meat falling from a clear sky: n pieces spawn between t0 and t1 over a box, tumble down (on twos) and lie where they land */
const meatRain = (c: Ctx, t0: number, t1: number, n: number, cx: number, cz: number, wx: number, wz: number, seed = 0, sz = 1) => {
  const t = TQ(c.t);
  for (let k = 0; k < n; k++) {
    const ts = t0 + (t1 - t0) * hh(k + seed, 1); if (t < ts) continue;
    const dt = t - ts, y0 = 9 + 4 * hh(k + seed, 2), y = Math.max(0.06, y0 - 0.5 * 9.8 * dt * dt);
    const x = cx + wx * (hh(k + seed, 3) - 0.5), z = cz + wz * (hh(k + seed, 4) - 0.5), w = sz * (0.12 + 0.3 * hh(k + seed, 5) ** 2);
    card(c, `meat${(k + seed) % 3}`, 300, 300, MEATS[(k + seed) % 3], [x, y > 0.07 ? y + w * 0.3 : 0.03, z], w, w * 0.78, y > 0.07 ? { rot: dt * 5 * (hh(k, 6) - 0.5) } : { flat: true, rot: 6.28 * hh(k, 7) });
  }
};
const vultures = (c: Ctx, n: number, cx: number, cy: number, cz: number, r: number, seed = 0, w = 1.2, speed = 0.35) => {
  for (let k = 0; k < n; k++) {
    const a = TQ(c.t) * speed + k / n * Math.PI * 2 + seed, fl = q(((c.t * 2.2 + hh(k, 2)) % 1 + 1) % 1, 4);
    card(c, `vult${fl}`, 420, 320, VULT[Math.round(fl * 4) % 4], [cx + r * Math.cos(a), cy + 0.6 * Math.sin(a * 2 + k), cz + 0.5 * r * Math.sin(a)], w, w * 0.76, { rot: 0.1 * Math.sin(a) });
  }
};
const fire = (c: Ctx) => { const k = q((c.t * 2) % 1, 6); card(c, `fire${k}`, 300, 320, fxFire(k), [KETTLE.x, 0.25, KETTLE.z + 0.1], 0.7, 0.75); };
const steam = (c: Ctx) => { const k = q((c.t * 0.7) % 1, 6); puff(c, c.t - k * 1.4, [KETTLE.x, 1.6 + k * 0.8, KETTLE.z], 0.6, 0.45); };

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1876, it rained meat in Kentucky.   (hook; the outro ends on this frame)
  1: (c) => {
    const t = c.t;
    meatRain(c, -1.5, 3.0, 60, 0, -2, 14, 10, 0, 1.6);
    MRS_(c, 0.6, -1.4, { mode: "stand", expr: "shock", look: 0.2, prop: "handsUp" }); fire(c);
    if (after(t, A(0, "1876,"))) stay(c, A(0, "1876,"), "cal1876", 300, 340, (p) => fxCal(p, "1876", true), [-2.3, 5.2, -5], 1.6, 1.8, 0.05);
    if (after(t, A(0, "kentucky."))) banner(c, A(0, "kentucky."), "IT RAINED MEAT", [0.4, 6.0, -5], 4.6, "#c62a2e", 2.0);
  },
  // 2 Not hail. Not frogs. Meat.
  2: (c) => {
    const t = c.t, mt = A(0, "meat.", 1);
    if (after(t, A(0, "hail."))) stay(c, A(0, "hail."), "nohail", 400, 400, fxNo("hail"), [-0.5, 2.6, -1.5], 0.7, 0.7, -0.05);
    if (after(t, A(0, "frogs."))) stay(c, A(0, "frogs."), "nofrog", 400, 400, fxNo("frog"), [0.5, 2.6, -1.5], 0.7, 0.7, 0.05);
    meatRain(c, mt - 0.6, mt + 1.2, 26, 0, -1.5, 5, 4, 70, 1.0);
    if (after(t, mt)) word(c, mt, "MEAT.", [0, 1.75, -1.2], 1.6, 1.4, "#ffb0b0");
  },
  // 3 March third. A clear, sunny sky. Mrs. Crouch is in her yard, making soap...
  3: (c) => {
    const t = c.t;
    MRS_(c, 0.7, -1.3, { mode: "stand", expr: after(t, A(1, "soap...")) ? "whistle" : "smile", look: 0.6, lean: 0.06 * Math.sin(TQ(t) * 3) }); fire(c); steam(c);
    if (after(t, A(1, "march"))) stay(c, A(1, "march"), "calMar", 300, 340, (p) => fxCal(p, "MAR 3", true), [-1.6, 3.9, -6], 1.5, 1.7, 0.05);
    if (after(t, A(1, "crouch"))) banner(c, A(1, "crouch"), "MRS. CROUCH", [0.2, 2.75, -1.6], 2.0, "#4a6a9a", 1.8);
  },
  // 4 when chunks of raw meat start falling all around her.
  4: (c) => {
    const t = c.t, fa = A(1, "falling");
    MRS_(c, 0.7, -1.3, { mode: "stand", expr: after(t, fa) ? "shock" : "neutral", look: 0.1, prop: after(t, fa) ? "handsUp" : null, dy: hop(t, fa, 0.1, 0.25) }); fire(c);
    meatRain(c, A(1, "chunks") - 0.6, A(1, "her.") + 1.0, 40, 0.6, -1.6, 7, 5, 100, 1.0);
  },
  // 5 Some as small as snowflakes. Some as big as your hand.
  5: (c) => {
    const t = c.t;
    meatRain(c, -0.5, 6, 40, 0, -1.5, 6, 4, 140, 0.9);
    if (after(t, A(1, "snowflakes."))) stay(c, A(1, "snowflakes."), "small", 400, 400, fxSize("SNOWFLAKE", false), [-0.5, 2.35, -1.5], 0.72, 0.72, -0.05);
    if (after(t, A(1, "hand."))) stay(c, A(1, "hand."), "big", 400, 400, fxSize("YOUR HAND", true), [0.5, 2.35, -1.5], 0.72, 0.72, 0.05);
  },
  // 6 It covers a strip of land the length of a football field.
  6: (c) => {
    const t = c.t;
    meatRain(c, -3, -0.5, 90, 0, -2, 6, 24, 200, 1.6);
    MRS_(c, 0.6, -1.4, { mode: "stand", expr: "shock", look: 0 });
    if (after(t, A(2, "field."))) banner(c, A(2, "field."), "~ 1 FOOTBALL FIELD", [0, 6, -6], 7, "#2f8a4a", 2.0);
  },
  // 7 She looks up. Not a single cloud.
  7: (c) => {
    const t = c.t, cl = A(2, "cloud.");
    MRS_(c, 0, -1.2, { mode: "stand", expr: after(t, cl) ? "nervous" : "neutral", look: 0, lean: -0.05 });
    if (after(t, cl)) word(c, cl, "NOT ONE CLOUD", [0, 4.6, -6], 3.6, 1.5, "#e0f0ff");
  },
  // 8 Word spreads fast. And two brave neighbours do what any reasonable person would do...
  8: (c) => {
    const t = c.t, w = smooth((t - A(3, "two") + 0.2) / 1.2);
    NBA(c, 3.4 - 2.2 * w, 1.0, { mode: w > 0.02 && w < 0.98 ? "stroll" : "stand", phase: (TQ(t) * 1.4) % 1, expr: "awe", look: -0.6 });
    NBB(c, 4.4 - 2.2 * w, 1.6, { mode: w > 0.02 && w < 0.98 ? "stroll" : "stand", phase: (TQ(t) * 1.4 + 0.5) % 1, expr: "grin", look: -0.6 });
    meatRain(c, -3, -1, 30, 0.8, 0.4, 5, 3, 300, 1.0);
    if (after(t, A(3, "brave"))) banner(c, A(3, "brave"), "2 BRAVE NEIGHBOURS", [1.3, 3.0, 0.6], 2.1, "#e07a1a", 1.8);
  },
  // 9 They eat it.
  9: (c) => {
    const t = c.t, ea = A(3, "eat");
    NBA(c, 0.9, 1.0, { mode: "stand", expr: after(t, ea) ? "lick" : "awe", look: 0.4, prop: "point" });
    NBB(c, 2.0, 1.4, { mode: "stand", expr: after(t, ea) ? "lick" : "grin", look: -0.4 });
    meatRain(c, -3, -1, 30, 0.8, 0.4, 5, 3, 300, 1.0);
    if (after(t, ea)) word(c, ea, "THEY ATE IT.", [1.45, 3.0, 0.9], 1.7, 1.4, "#ffb0b0");
  },
  // 10 The verdict? Either mutton... or venison.
  10: (c) => {
    const t = c.t;
    NBA(c, 1.0, 1.0, { mode: "stand", expr: "smug", look: 0.3, lean: 0.06 });
    NBB(c, 2.0, 1.4, { mode: "stand", expr: "lick", look: -0.3 });
    if (after(t, A(3, "mutton..."))) stay(c, A(3, "mutton..."), "sheep", 400, 360, fxSheep, [1.12, 2.8, 0.6], 0.58, 0.52, -0.05);
    if (after(t, A(3, "venison."))) stay(c, A(3, "venison."), "deer", 400, 360, fxDeer, [1.95, 2.8, 0.6], 0.58, 0.52, 0.05);
  },
  // 11 The newspapers go wild. Carnal rain! A shower of quivering flesh!
  11: (c) => {
    const t = c.t;
    pose(c, 20, NEWSBOY, "newsboy", 0.3, 1.4, { mode: "stand", expr: "laugh", look: 0.2, prop: "magazine", dy: hop(t, A(4, "wild."), 0.08, 0.25) });
    if (after(t, A(4, "carnal"))) stay(c, A(4, "carnal"), "paper1", 560, 680, fxPaper("CARNAL RAIN!", "Meat falls from clear sky"), [-0.35, 2.7, -1.0], 0.95, 1.16, -0.08);
    if (after(t, A(4, "quivering"))) stay(c, A(4, "quivering"), "paper2", 560, 680, fxPaper("A SHOWER OF QUIVERING FLESH!", "Kentucky astonished"), [0.9, 2.5, -0.6], 1.0, 1.22, 0.07);
  },
  // 12 Then the scientists arrive with theories.
  12: (c) => {
    const t = c.t;
    [-1.8, -0.6, 0.6, 1.8].forEach((x, k) => prof(c, k, x, -3.0, { mode: "stand", expr: ["smug", "stern", "awe", "smug"][k] as FrontOpts["expr"], look: x > 0 ? -0.4 : 0.4, prop: k === 2 ? "book" : k === 0 ? "point" : null }));
    if (after(t, A(5, "scientists"))) banner(c, A(5, "scientists"), "THE SCIENTISTS", [0, 2.95, -3.4], 2.2, "#2f5aa8", 1.6);
  },
  // 13 One says it's frog spawn. Another says it's a kind of algae.
  13: (c) => {
    const t = c.t;
    prof(c, 0, -0.9, -3.0, { mode: "stand", expr: "smug", look: 0.3, prop: "point" });
    prof(c, 1, 0.9, -3.0, { mode: "stand", expr: after(t, A(5, "algae.")) ? "smug" : "stern", look: -0.3, prop: after(t, A(5, "algae.")) ? "point" : null });
    if (after(t, A(5, "spawn."))) word(c, A(5, "spawn."), "FROG SPAWN?", [-0.5, 2.5, -2.6], 1.1, 1.1, "#c8f0c0");
    if (after(t, A(5, "algae."))) word(c, A(5, "algae."), "ALGAE?", [0.55, 2.5, -2.6], 1.0, 1.1, "#c8f0c0");
  },
  // 14 Two doctors say it's lung tissue, from a horse... or a human baby.
  14: (c) => {
    const t = c.t;
    prof(c, 2, -0.7, -2.9, { mode: "stand", expr: "stern", look: 0.3, prop: "book" });
    prof(c, 3, 0.7, -2.9, { mode: "stand", expr: after(t, A(5, "baby.")) ? "nervous" : "stern", look: -0.3 });
    if (after(t, A(5, "lung"))) banner(c, A(5, "lung"), "LUNG TISSUE?", [0, 2.75, -2.9], 1.8, "#8a1e2a", 1.6);
    if (after(t, A(5, "horse..."))) word(c, A(5, "horse..."), "HORSE...", [-0.5, 2.2, -2.2], 0.9, 1.0, "#fff3b0");
    if (after(t, A(5, "baby."))) word(c, A(5, "baby."), "...OR HUMAN?!", [0.55, 2.0, -2.2], 1.0, 1.2, "#ffd0c0");
  },
  // 15 Which made the two tasters feel great.
  15: (c) => {
    const t = c.t, gr = A(5, "great.");
    NBA(c, 1.0, 1.0, { mode: "stand", expr: after(t, gr) ? "pained" : "nervous", look: 0.3, lean: after(t, gr) ? 0.12 : 0 });
    NBB(c, 2.0, 1.4, { mode: "stand", expr: after(t, gr) ? "shock" : "nervous", look: -0.3 });
    if (after(t, gr)) word(c, gr, "FEELING GREAT", [1.5, 2.6, 0.9], 1.5, 1.3, "#c8f0c0");
  },
  // 16 And then the best theory arrives.
  16: (c) => {
    const t = c.t;
    MRS_(c, 0.6, -1.4, { mode: "stand", expr: "nervous", look: 0, lean: -0.05 });
    if (after(t, A(6, "theory"))) vultures(c, 3, -6 + 3 * (TQ(t) - A(6, "theory")), 8, -8, 2.0, 0, 1.0, 0.6);
  },
  // 17 Vultures.
  17: (c) => {
    const t = c.t, vu = A(6, "vultures.");
    vultures(c, 6, 0, 7.2, -7, 3.6, 0, 1.4, 0.5);
    if (after(t, vu)) banner(c, vu, "VULTURES.", [0, 6.4, -6], 3.4, "#2a2226", 2.4);
  },
  // 18 When a vulture is scared, it throws up its last meal so it can fly away faster.
  18: (c) => {
    const t = c.t, sc = A(6, "scared,"), th = A(6, "throws"), fa = A(6, "faster.");
    const k = q(((c.t * 2.2) % 1 + 1) % 1, 4), lift = after(t, fa) ? 1.6 * smooth((t - fa) / 0.7) : 0;
    card(c, `vult${k}`, 420, 320, VULT[Math.round(k * 4) % 4], [0.2 + lift * 0.6, 2.2 + lift, -2.2], 1.4, 1.07, { rot: 0.05 * Math.sin(TQ(t) * 3) });
    if (after(t, sc)) word(c, sc, "!", [-0.6, 3.2, -2.2], 0.6, 1.2, "#fff3b0");
    if (after(t, th)) { meatRain(c, th - 0.25, th + 0.3, 8, 0.0, -2.0, 0.8, 0.4, 400, 0.9); stay(c, th, "arrow", 400, 400, fxArrowDown, [-1.15, 1.6, -2.2], 0.5, 0.5, 0); }
    if (after(t, fa)) word(c, fa, "LIGHTER = FASTER", [0, 3.9, -2.6], 2.2, 1.2, "#c8f0c0");
  },
  // 19 Picture a flock of startled vultures, flying over the farm, with very full stomachs.
  19: (c) => {
    const t = c.t;
    vultures(c, 9, -4 + 1.2 * (TQ(t) - shotT0(19)), 9, -6, 5, 1.3, 1.6, 0.25);
    MRS_(c, 0.6, -1.4, { mode: "stand", expr: "neutral", look: 0 }); fire(c);
    if (after(t, A(6, "stomachs."))) word(c, A(6, "stomachs."), "VERY FULL", [-1.5, 6.6, -6], 3.0, 1.3, "#fff3b0");
  },
  // 20 So yes. It probably rained vulture vomit.
  20: (c) => {
    const t = c.t, vv = A(6, "vomit.");
    vultures(c, 6, 0, 9.5, -8, 5, 2, 1.4, 0.3);
    meatRain(c, A(6, "rained") - 0.8, vv + 0.6, 50, 0, -2, 14, 10, 500, 1.2);
    MRS_(c, 0.6, -1.4, { mode: "stand", expr: after(t, vv) ? "pained" : "nervous", look: 0, prop: after(t, vv) ? "handsUp" : null });
    if (after(t, vv)) banner(c, vv, "VULTURE VOMIT", [0, 5.6, -5], 5.5, "#5a8a2a", 2.2);
  },
  // 21 And those two neighbours... had already tasted it.
  21: (c) => {
    const t = c.t, ta = A(7, "tasted");
    NBA(c, 1.0, 1.0, { mode: "stand", expr: after(t, ta) ? "pained" : "nervous", look: 0.3, lean: after(t, ta) ? 0.18 : 0 });
    NBB(c, 2.0, 1.4, { mode: "stand", expr: after(t, ta) ? "shock" : "nervous", look: -0.3, dy: hop(t, ta, 0.08, 0.25) });
    if (after(t, ta)) puff(c, ta + 0.2, [1.5, 1.4, 1.0], 0.9, 0.6);
  },
  // 22 You can still see a piece of it today, in a jar, at a museum at Transylvania University.
  22: (c) => {
    const t = c.t;
    card(c, "jarCard", 400, 500, fxJar, [0, 1.12 + 0.42, -2.0], 0.62, 0.78);
    [[-3.0, 0.6, 0], [3.0, 0.2, 1], [-2.2, 2.4, 2]].forEach(([x, z, v]) => pose(c, 40 + v, VISITOR(v), `vis${v}`, x, z, { mode: "stand", expr: v === 1 ? "awe" : "smile", look: x > 0 ? -0.6 : 0.6 }));
    if (after(t, A(8, "jar,"))) stay(c, A(8, "jar,"), "jarArrow", 400, 400, fxArrowDown, [0, 2.3, -2.0], 0.35, 0.35, 0);
    if (after(t, A(8, "transylvania"))) banner(c, A(8, "transylvania"), "TRANSYLVANIA UNIVERSITY", [-0.3, 3.6, -3.4], 3.0, "#5a3a6a", 2.0);
  },
  // 23 Yes. Really.
  23: (c) => {
    const t = c.t;
    card(c, "jarCard", 400, 500, fxJar, [0, 1.12 + 0.42, -2.0], 0.62, 0.78);
    if (after(t, A(8, "really."))) word(c, A(8, "really."), "YES. REALLY.", [0, 2.35, -1.9], 1.0, 1.3, "#fff3b0");
  },
  // 24 Send this to the friend who'll eat anything. Even if it falls from the sky.   (ends on shot 1)
  24: (c) => {
    const t = c.t;
    meatRain({ ...c, t: c.t - SHOTS[23].b / FPS }, -1.5, 3.0, 60, 0, -2, 14, 10, 0, 1.6);
    MRS_(c, 0.6, -1.4, { mode: "stand", expr: "shock", look: 0.2, prop: "handsUp" }); fire(c);
    if (after(t, A(9, "send"))) banner(c, A(9, "send"), "SEND THIS TO THAT FRIEND", [0.4, 6.0, -5], 4.6, "#e07a1a", 2.0);
  },
};
const shotT0 = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void clamp01; void lineStart; void atN; void fxSay; void fxScore; void cobbleHD; void tri; void house; void tent; void chair; void flag; void waveFlags; void sub;
