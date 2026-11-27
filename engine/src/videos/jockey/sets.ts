// Places and cast of "The Dead Jockey" (Frank Hayes, Belmont Park, 4 June 1923; 9:16 short). Cameras on +z looking -z.
// Direction sheet: a sunny June race day. Palette: turf green, white rails, Sweet Kiss's gold-and-navy silks as the accent,
// warm stable browns. One key moment per shot on a narration word; horses gallop on twos (4-frame cycle); the burial line is
// played straight. Avoid: faces filling frame, push-ins ending on eyes, cut-off labels, gore of any kind.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, beamBetween, tent, hills } from "./props3d";
import { Kit, quad, tri, house } from "./build";
import { rep, ctex, stoneHD, roofHD, grassHD, planksHD, cobbleHD } from "./paint";
import { wbox, panelHD, chandelier2, painting, rug, bookcase, chair, table2 } from "./decor";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, fxScore, rrect, txt } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS } from "./story";
import { FINISH, kissX, RT } from "./race";

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

// ================================================================ THE DEAD JOCKEY (Belmont Park, 4 June 1923)
// Geography: the steeplechase course runs along x (horses gallop toward +x = screen right) between white rails at z = +4.6
// (near, camera side) and z = -4.6 (far). Brush fences cross the course at FENCES[]; the finish post stands at x = FINISH.
// The grandstand is behind the far rail (front z = -11). Cameras sit on +z looking -z.
const FENCES = [-60, -36, -12, 12];
const RAILW = () => lam("railW", () => ({ color: "#f4f1ea" }));
const TURF = () => lam("turfM", () => ({ map: rep(grassHD(), 1, 1), color: "#cfe8b0" }));
const stripes = () => ctex("awning", 256, 64, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#2a6a3a"; g.fillRect(i * 16, 0, 16, 64); } });
const rail = (b: Batch, z: number, x0: number, x1: number) => {
  for (let x = x0; x <= x1; x += 2.5) b.add(boxGeo(V(x - 0.06, 0, z - 0.06), V(x + 0.06, 1.05, z + 0.06)), RAILW());
  b.add(boxGeo(V(x0, 0.95, z - 0.08), V(x1, 1.1, z + 0.08)), RAILW());
  b.add(boxGeo(V(x0, 0.5, z - 0.05), V(x1, 0.58, z + 0.05)), RAILW());
};
/** a steeplechase brush fence across the course: a green brush hedge on a white-boarded base */
const brushFence = (b: Batch, x: number) => {
  b.add(boxGeo(V(x - 0.45, 0, -4.4), V(x + 0.45, 0.45, 4.4)), RAILW());
  for (let k = 0; k < 18; k++) { const z = -4.2 + k * 0.5; b.add(new THREE.ConeGeometry(0.4, 1.4, 5).translate(x + 0.15 * Math.sin(k * 2.3), 1.05, z), C(["#3a6a2e", "#4a7a34", "#2f5a28"][k % 3])); }
  b.add(boxGeo(V(x - 0.5, 0.42, -4.45), V(x + 0.5, 0.55, 4.45)), C("#d8d0c0"));
};
/** the 1923 grandstand: tiered seating, steel posts, a long roof with a striped awning; crowd = cards in STAGE */
const GS = { x0: -40, x1: 44, z: -11, rows: 6 };
const grandstand = (b: Batch) => {
  const { x0, x1, z, rows } = GS, Wd = lam("gsWood", () => ({ map: planksHD() }));
  for (let r = 0; r < rows; r++) b.add(boxGeo(V(x0, 0, z - r * 0.9 - 0.9), V(x1, 0.5 + r * 0.55, z - r * 0.9)), Wd);
  b.add(boxGeo(V(x0, 0, z - rows * 0.9 - 0.5), V(x1, 7.2, z - rows * 0.9)), lam("gsBack", () => ({ map: rep(clapboard("gs", "#e8e0d0"), 6, 1) })));
  for (let x = x0; x <= x1; x += 6) b.add(boxGeo(V(x - 0.1, 0, z - 0.1), V(x + 0.1, 6.4, z + 0.1)), C("#3a4a3a"));
  b.add(quad(V(x0 - 0.5, 6.4, z + 1.2), V(x1 + 0.5, 6.4, z + 1.2), V(x1 + 0.5, 7.6, z - rows * 0.9), V(x0 - 0.5, 7.6, z - rows * 0.9)), ROOF("#4a5a4a"));
  b.add(quad(V(x0 - 0.5, 5.7, z + 1.25), V(x1 + 0.5, 5.7, z + 1.25), V(x1 + 0.5, 6.42, z + 1.22), V(x0 - 0.5, 6.42, z + 1.22)), lam("awn", () => ({ map: rep(stripes(), 20, 1), side: THREE.DoubleSide })));
  for (let x = x0 + 8; x < x1; x += 20) { b.add(boxGeo(V(x - 0.03, 7.6, z - 2.6), V(x + 0.03, 9.6, z - 2.54)), C("#3a3a3a")); }
};
const finishPost = (b: Batch) => {
  b.add(new THREE.CylinderGeometry(0.1, 0.1, 3.6, 10).translate(FINISH, 1.8, -4.9), RAILW());
  b.add(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 20).rotateX(Math.PI / 2).translate(FINISH, 3.7, -4.9), C("#c62a2e"));
  b.add(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 20).rotateX(Math.PI / 2).translate(FINISH, 3.7, -4.88), RAILW());
  b.add(boxGeo(V(FINISH - 0.04, 0.01, -4.4), V(FINISH + 0.04, 0.02, 4.4)), RAILW());
  b.add(boxGeo(V(FINISH - 0.8, 0, -7.5), V(FINISH + 0.8, 4.5, -6.0)), lam("judge", () => ({ map: clapboard("jb", "#f1ece0") })));
  b.add(boxGeo(V(FINISH - 1.0, 4.5, -7.7), V(FINISH + 1.0, 4.8, -5.8)), C("#2a6a3a"));
};
const track = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-200, 200, -260, 80, 6, 0), GRASS());
  b.add(plane(-90, 70, -4.6, 4.6, 3, 0.01), TURF());
  rail(b, 4.6, -90, 70); rail(b, -4.6, -90, 70);
  for (const x of FENCES) brushFence(b, x);
  grandstand(b); finishPost(b);
  for (let k = 0; k < 10; k++) tree(b, -80 + 16 * k + 4 * hh(k, 1), -34 - 8 * hh(k, 2), 8 + 4 * hh(k, 3), k);
  for (let k = 0; k < 6; k++) tree(b, -70 + 26 * k, 14 + 6 * hh(k, 4), 7 + 3 * hh(k, 5), k + 20);
  hills(b, 0, -40, 230, 12, 26, 3, HILLG());
  // flags on the grandstand roof
  for (let k = 0; k < 5; k++) flag(s, `gs${k}`, GS.x0 + 8 + 20 * k, 9.6, GS.z - 2.57, 1.2, 0.7, () => ctex("pennant" + (k % 3), 128, 80, (g) => { g.fillStyle = ["#c62a2e", "#2a6a3a", "#e8b84a"][k % 3]; g.fillRect(0, 0, 128, 80); }));
};
/** the stable: plank walls, a row of stalls with half-doors (horse heads are cards), hay, buckets, a window of sun */
const stable = (s: SetBuild) => {
  const { b } = s, H = 3.6, Pl = lam("stW", () => ({ map: rep(plankWall("stable", "#8a6a48"), 2, 1) }));
  b.add(plane(-6, 6, -5, 6, 2, 0), lam("stFl", () => ({ map: earthHD("stableHD") })));
  wbox(b, Pl, -6, 0, -5.2, 6, H, -5, 2, 2);
  for (const sd of [-1, 1]) wbox(b, Pl, sd > 0 ? 6 : -6.2, 0, -5.2, sd > 0 ? 6.2 : -6, H, 6, 2, 2);
  for (let z = -5; z < 6; z += 1.4) b.add(boxGeo(V(-6.2, H - 0.25, z - 0.12), V(6.2, H, z + 0.12)), C("#5a3e26"));
  b.add(boxGeo(V(-6.2, H, -5.2), V(6.2, H + 0.1, 6)), C("#6a4a2e"));
  // stalls along the back wall: dividers + half doors
  for (let k = 0; k < 4; k++) {
    const x0 = -5.6 + k * 2.8;
    b.add(boxGeo(V(x0 - 0.06, 0, -5), V(x0 + 0.06, 2.2, -3.0)), C("#5a3e26"));
    b.add(boxGeo(V(x0 + 0.1, 0, -3.06), V(x0 + 2.7, 1.25, -2.96)), lam("halfDoor", () => ({ map: plankWall("hd", "#7a5232") })));
    b.add(beamBetween(V(x0 + 0.1, 0.05, -2.94), V(x0 + 2.7, 1.2, -2.94), 0.05), C("#5a3e26"));
    b.add(boxGeo(V(x0 + 0.1, 1.25, -3.1), V(x0 + 2.7, 1.32, -2.92)), C("#4a2e1e"));
    b.add(boxGeo(V(x0 + 1.0, 2.5, -3.04), V(x0 + 1.8, 2.75, -3.0)), C("#e8dcc0"));
  }
  b.add(boxGeo(V(5.62, 0, -5), V(5.74, 2.2, -3.0)), C("#5a3e26"));
  for (const [x, z, r] of [[-4.6, 2.6, 0.2], [-3.4, 2.9, -0.1], [-4.0, 2.7, 0], [4.4, 1.6, 0.3]] as [number, number, number][]) b.add(boxGeo(V(-0.55, 0, -0.35), V(0.55, 0.6, 0.35)), lam("hay", () => ({ color: "#e0c070" })), M4(x, x === -4.0 ? 0.6 : 0, z, r));
  for (const x of [2.4, 3.0]) { b.add(new THREE.CylinderGeometry(0.2, 0.17, 0.4, 12).translate(x, 0.2, 1.6), C("#7a7a80")); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), lam("stWin", () => ({ color: "#fff6d8", emissive: "#fff0c0", emissiveIntensity: 1.2 }))); win.position.set(-6.15, 2.4, 0.5); win.rotation.y = Math.PI / 2; s.root.add(win);
  b.add(beamBetween(V(-6.1, 0.0, 3.5), V(-6.1, 2.6, 3.0), 0.04), C("#8a6a4a"));
  barrel(b, 5.2, 2.6); barrel(b, 5.3, 3.4);
  for (let k = 0; k < 3; k++) b.add(new THREE.TorusGeometry(0.22, 0.03, 6, 14).translate(-1 + 0.7 * k, 2.6, -4.95), C("#7a7a80"));
};
/** a quiet cemetery on a green hill: one headstone in front, others behind, flowers, trees */
const grave = (s: SetBuild) => {
  const { b } = s, G = lam("graveStone", () => ({ map: stoneHD("graveHD", ["#b8b4ac", "#aca89e", "#c4c0b6"], "#8a867e") }));
  b.add(plane(-200, 200, -260, 80, 6, 0), GRASS());
  const stone = (x: number, z: number, w: number, h: number, ry = 0) => {
    b.add(boxGeo(V(-w / 2, 0, -0.12), V(w / 2, h - w / 2, 0.12)), G, M4(x, 0, z, ry));
    b.add(new THREE.CylinderGeometry(w / 2, w / 2, 0.24, 18, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, h - w / 2, 0), G, M4(x, 0, z, ry));
  };
  stone(0, -2.2, 1.0, 1.4);
  b.add(boxGeo(V(-0.7, 0, -2.1), V(0.7, 0.12, 0.1)), lam("graveSoil", () => ({ color: "#6a8a4a" })));
  for (let k = 0; k < 14; k++) stone(-9 + 18 * hh(k, 1), -6 - 14 * hh(k, 2), 0.7 + 0.4 * hh(k, 3), 0.9 + 0.6 * hh(k, 4), 0.3 * (hh(k, 5) - 0.5));
  for (let k = 0; k < 7; k++) tree(b, -16 + 5.5 * k, -20 - 6 * hh(k, 6), 7 + 3 * hh(k, 7), k + 40);
  hills(b, 0, -30, 200, 10, 20, 9, HILLG());
  for (let x = -12; x <= 12; x += 0.4) b.add(boxGeo(V(x - 0.02, 0, 4), V(x + 0.02, 1.0, 4.04)), C("#2a2a2e"));
  b.add(boxGeo(V(-12, 0.9, 3.98), V(12, 0.96, 4.06)), C("#2a2a2e"));
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { track, stable, grave };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = { track: (s, t) => waveFlags(s, t) };

// ---------------- cast (New York, 1923) ----------------
const SILK = "#e8b84a", SILK2 = "#2a3a8a";      // Sweet Kiss's colours: gold with a navy sash
const FRANK: Outfit = { jacket: SILK, pants: "#f4f0e6", boots: "#2a2220", hat: "jcap", hatCol: SILK2, skin: SKINS[0] };
const FRANK_WORK: Outfit = { jacket: "#6a5a42", pants: "#4a4a40", boots: "#3a2a1e", hat: "cap", cap: "#5a4a3a", skin: SKINS[0] };
const OWNER: Outfit = { jacket: "#8a4a6a", pants: "#8a4a6a", dress: "#8a4a6a", boots: INK, hat: "bonnet", hatCol: "#2a2a30", skin: SKINS[0], trim: "#f4f0e6" };
const FAN = (v: number): Outfit => (v % 3 === 2
  ? { jacket: ["#5a7a9a", "#a8604a", "#6a8a5a"][v % 3], pants: "#5a5a6a", dress: ["#c88a9a", "#7a9ac8", "#e8c87a"][(v >> 2) % 3], boots: INK, hat: "bonnet", hatCol: ["#2a2a30", "#8a3a3a"][v % 2], skin: SKINS[v % 3] }
  : { jacket: ["#3a3a44", "#6a5a42", "#2a3a5a", "#8a7a62"][v % 4], pants: "#3a3a40", boots: INK, hat: v % 2 ? "fedora" : "brodie", hatCol: ["#e0c070", "#3a3a3a", "#5a4a3a"][v % 3], moustache: v % 4 === 1 ? "#4a3020" : undefined, skin: SKINS[(v + 1) % 3] });

// ---------------- effect drawings ----------------
const SERIF = "Georgia, serif";
/** side view of a galloping horse (facing right) in 4 gallop frames, with a jockey up, slumped, or no rider */
const LEG: [number, number, number, number][][] = [   // per frame: [knee dx, knee dy, hoof dx, hoof dy] for FL, FR, HL, HR; frame 4 = standing
  [[30, 60, 70, 100], [20, 65, 40, 120], [-25, 60, -70, 95], [-20, 62, -45, 118]],
  [[10, 70, 30, 130], [35, 50, 80, 75], [-10, 68, -20, 128], [-35, 52, -80, 80]],
  [[-15, 68, -40, 120], [5, 70, 15, 132], [20, 62, 50, 110], [5, 70, 10, 132]],
  [[35, 45, 75, 60], [25, 55, 65, 85], [-30, 55, -60, 108], [15, 66, 40, 124]],
  [[4, 62, 6, 128], [-6, 62, -4, 128], [6, 62, 4, 128], [-4, 62, -8, 128]],
];
const fxHorse = (frame: number, rider: "up" | "slump" | "none", coat = "#8a5a32", silk = SILK, cap = SILK2, num = "7") => (p: Pen) => {
  const L = LEG[frame % 5], dark = "#4a2e1a", bob = [0, -6, 0, 6, 0][frame % 5];
  const hip = (side: number): [number, number] => [side, 0];
  void hip;
  // far legs first (darker)
  const leg = (hx: number, hy: number, l: [number, number, number, number], col: string) => { p.stroke([[hx, hy], [hx + l[0], hy + l[1]], [hx + l[2], hy + l[3]]], 22, col); p.ell(hx + l[2], hy + l[3] + 4, 14, 8, "#2a1e16", 4); };
  leg(415, 270 + bob, L[1], dark); leg(205, 270 + bob, L[3], dark);
  p.stroke([[150, 215 + bob], [100, 240 + bob], [92, 300 + bob]], 26, "#3a2416");                         // tail
  p.ell(300, 235 + bob, 150, 62, coat, 9);                                                                  // body
  p.poly([[395, 215 + bob], [445, 120 + bob], [478, 98 + bob], [505, 120 + bob], [460, 250 + bob]], coat, 9); // neck
  p.poly([[468, 92 + bob], [548, 112 + bob], [578, 148 + bob], [560, 166 + bob], [500, 160 + bob], [470, 128 + bob]], coat, 9); // head
  p.poly([[476, 84 + bob], [486, 58 + bob], [498, 90 + bob]], coat, 7);                                     // ear
  p.ell(516, 120 + bob, 7, 7, INK, 0); p.ell(566, 152 + bob, 5, 4, "#2a1e16", 0);
  p.stroke([[452, 112 + bob], [425, 160 + bob], [405, 205 + bob]], 18, "#3a2416");                         // mane
  p.poly([[455, 140 + bob], [470, 120 + bob], [500, 138 + bob]], "#f4f0e6", 0);                            // blaze
  leg(390, 270 + bob, L[0], coat); leg(225, 270 + bob, L[2], coat);
  p.poly([[255, 180 + bob], [345, 180 + bob], [352, 250 + bob], [250, 250 + bob]], silk, 7);              // saddle cloth
  txt(p, num, 302, 236 + bob, 40, SILK2, "900", "center");
  p.stroke([[480, 150 + bob], [430, 175 + bob], [380, 170 + bob]], 5, "#2a1e16");                           // reins
  if (rider === "up") {
    p.stroke([[300, 190 + bob], [330, 230 + bob], [355, 200 + bob]], 20, "#f4f0e6");                       // leg (breeches) + boot
    p.stroke([[355, 200 + bob], [368, 232 + bob]], 18, "#2a2220");
    p.poly([[280, 175 + bob], [370, 110 + bob], [395, 135 + bob], [312, 198 + bob]], silk, 7);            // crouched torso
    p.band([[300, 180 + bob], [380, 120 + bob]], SILK2, 12, 0, "butt");
    p.stroke([[370, 130 + bob], [420, 165 + bob], [440, 170 + bob]], 14, silk);                            // arm to reins
    p.ell(398, 100 + bob, 30, 28, "#f2c8a0", 7); p.ell(406, 96 + bob, 4, 4, INK, 0);                       // head
    p.poly([[368, 92 + bob], [402, 68 + bob], [430, 84 + bob], [436, 92 + bob], [372, 100 + bob]], cap, 6);
  } else if (rider === "slump") {
    p.stroke([[300, 195 + bob], [325, 232 + bob], [345, 205 + bob]], 20, "#f4f0e6"); p.stroke([[345, 205 + bob], [360, 236 + bob]], 18, "#2a2220");
    p.poly([[270, 185 + bob], [420, 165 + bob], [430, 195 + bob], [280, 210 + bob]], silk, 7);            // torso flat along the neck
    p.band([[290, 195 + bob], [420, 178 + bob]], SILK2, 12, 0, "butt");
    p.stroke([[400, 190 + bob], [410, 250 + bob], [404, 290 + bob]], 14, silk);                            // arm dangling
    p.ell(450, 190 + bob, 28, 26, "#e8c0a0", 7); p.stroke([[440, 186 + bob], [452, 190 + bob]], 4, INK); p.stroke([[452, 186 + bob], [462, 192 + bob]], 4, INK); // eyes shut
    p.poly([[430, 168 + bob], [470, 160 + bob], [480, 176 + bob], [432, 182 + bob]], cap, 6);
  }
};
const HORSE_SIL = [["#e8b84a", "#2a3a8a", "7"], ["#c62a2e", "#f4f0e6", "3"], ["#2a6a3a", "#e8b84a", "5"], ["#f4f0e6", "#c62a2e", "1"], ["#5a3a8a", "#f4f0e6", "4"], ["#2a5aa8", "#c62a2e", "2"]];
const COATS = ["#8a5a32", "#4a3020", "#a8703a", "#2a2220", "#7a4a2a", "#b88a5a"];
const fxOdds = (p: Pen) => {
  p.poly(rrect(20, 20, 360, 300, 16), "#1e2a22", 9);
  txt(p, "SWEET KISS", 200, 90, 40, "#f4f0e6", "900", "center"); p.stroke([[50, 110], [350, 110]], 4, "#e8b84a");
  txt(p, "20-1", 200, 240, 130, "#e8b84a", "900", "center");
};
const fxECG = (k: number) => (p: Pen) => {
  p.poly(rrect(10, 10, 580, 280, 20), "#10181a", 8);
  const pts: [number, number][] = []; for (let x = 30; x <= 570; x += 6) { const u = (x - 30) / 540; let y = 150; if (u < 0.55) { const ph = ((u * 3.2 + k) % 1); y = 150 - (ph > 0.45 && ph < 0.5 ? 100 : ph > 0.5 && ph < 0.55 ? -60 : 0); } pts.push([x, y]); }
  p.stroke(pts, 7, "#3aff7a");
  p.ell(520, 60, 30, 26, "#d02a2e", 5);
};
const fxScale = (p: Pen) => {
  p.poly(rrect(60, 60, 280, 260, 30), "#e8e4dc", 9); p.ell(200, 160, 90, 90, "#fffaf0", 7);
  p.stroke([[200, 160], [150, 110]], 8, "#d02a2e"); for (let k = 0; k < 9; k++) { const a = Math.PI * (0.75 + 0.15 * k); p.stroke([[200 + 70 * Math.cos(a), 160 + 70 * Math.sin(a)], [200 + 82 * Math.cos(a), 160 + 82 * Math.sin(a)]], 4, INK); }
  txt(p, "-12 lb", 200, 290, 46, "#d02a2e", "900", "center");
};
const fxDream = (p: Pen) => {
  p.ell(300, 200, 280, 180, "#ffffff", 8); p.ell(70, 390, 30, 22, "#ffffff", 6); p.ell(30, 440, 16, 12, "#ffffff", 5);
  const g = p.g; g.save(); g.translate(130, 70); g.scale(0.55, 0.55); fxHorse(1, "up")(p); g.restore();
};
const fxHeart = (p: Pen) => { p.poly([[150, 260], [40, 140], [60, 70], [120, 50], [150, 90], [180, 50], [240, 70], [260, 140]], "#e8506a", 8); p.ell(105, 95, 18, 12, "#ffb0c0", 0); };
const fxDeathKiss = (p: Pen) => {
  p.poly([[150, 270], [40, 150], [60, 80], [120, 60], [150, 100], [180, 60], [240, 80], [260, 150]], "#2a2226", 8);
  p.ell(110, 140, 22, 26, "#e8e4dc", 0); p.ell(190, 140, 22, 26, "#e8e4dc", 0); p.poly([[150, 170], [140, 195], [160, 195]], "#e8e4dc", 0);
};
const fxRibbon = (p: Pen) => {
  for (const [x, r] of [[150, -0.3], [250, 0.3]] as [number, number][]) p.poly([[200, 220], [x - 40 + 60 * r, 420], [x + 60 * r, 380], [x + 40 + 60 * r, 420]], "#2a5aa8", 7);
  p.ell(200, 170, 120, 120, "#2a5aa8", 9); p.ell(200, 170, 90, 90, "#e8b84a", 6); txt(p, "1ST", 200, 200, 80, "#2a5aa8", "900", "center");
};
const fxHeadstone = (p: Pen) => {
  txt(p, "FRANK HAYES", 200, 120, 46, "#4a4640", "900", "center", SERIF);
  txt(p, "1901 – 1923", 200, 180, 36, "#5a564e", "700", "center", SERIF);
  txt(p, "Jockey", 200, 240, 34, "#5a564e", "italic 700", "center", SERIF);
};

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;  // animate on twos
const gf = (t: number, rate = 7) => Math.floor((TQ(t) * rate) % 4);   // gallop frame
/** one horse card on the course; x = position along the course, lane z; returns its x. Jumps when crossing a fence. */
const horse = (c: Ctx, k: number, x: number, z: number, rider: "up" | "slump" | "none", w = 2.6) => {
  let y = 0; for (const fx of FENCES.concat([])) { const d = (x - fx) / 3.0; if (Math.abs(d) < 1) y = Math.max(y, 1.1 * (1 - d * d)); }
  const fr = gf(c.t + 0.13 * k), [silk, cap, num] = HORSE_SIL[k];
  card(c, `horse${k}_${fr}_${rider}`, 600, 480, fxHorse(fr, rider, COATS[k], silk, cap, num), [x, 1.05 + y + w * 0.0, z], w, w * 0.8);
  if (y < 0.05) blob(c.out, x, 0, z, w * 0.55);
  return x;
};
/** race clock: Sweet Kiss (k=0) position along the course at race time rt; she wins at FINISH; rivals fade back */
const rivalX = (k: number, rt: number) => -64 + (12.5 - (0.35 + 0.25 * k) * clamp01((rt - 1.5) / 3)) * rt + (k % 2 ? 1.2 : -0.8);
const field = (c: Ctx, rt: number, slump: boolean, n = 6, w = 2.6) => {
  horse(c, 0, kissX(rt), 0.4, slump ? "slump" : "up", w);
  for (let k = 1; k < n; k++) horse(c, k, rivalX(k, rt), [-2.6, 2.4, -1.2, 3.2, -3.4][k - 1], "up", w);
};
const crowd = (c: Ctx, cheer: boolean, x0 = -20, x1 = 44, seed = 0) => {
  for (let r = 0; r < 4; r++) for (let x = x0; x < x1; x += 1.3) {
    const k = Math.round((x - x0) / 1.3) + r * 60 + seed;
    if (hh(k, 9) < 0.18) continue;
    pose(c, 200 + (k % 40), FAN(k), `fan${k % 12}`, x + 0.4 * hh(k, 1), GS.z - r * 0.9 - 0.45, { mode: "stand", expr: cheer ? (k % 3 ? "laugh" : "shock") : "neutral", look: hh(k, 2) - 0.5, prop: cheer && k % 2 ? "handsUp" : null, dy: cheer ? 0.06 * Math.abs(Math.sin(TQ(c.t) * 7 + k)) : 0 }, 0.85, 0.5 + r * 0.55);
  }
};
const FRANKp = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, work = true) => pose(c, 1, work ? FRANK_WORK : FRANK, work ? "frankW" : "frank", x, z, fo);
const kissHead = (c: Ctx, x: number, z: number, w = 1.5) => card(c, "kissStand", 600, 480, fxHorse(4, "none"), [x, w * 0.4, z], w, w * 0.8);

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1923, a man won a horse race... while dead.   (hook; the outro ends on this frame)
  1: (c) => {
    const t = c.t;
    field(c, RT[1](t), true, 6, 3.0);
    if (after(t, A(0, "1923,"))) stay(c, A(0, "1923,"), "cal1923", 300, 340, (p) => fxCal(p, "1923", true), [FINISH - 5.6, 5.0, -3], 1.6, 1.8, 0.05);
    if (after(t, A(0, "dead."))) banner(c, A(0, "dead."), "WON THE RACE. WHILE DEAD.", [FINISH - 2.6, 6.2, -3], 5.0, "#2a2226", 2.4);
  },
  // 2 And he wasn't even a jockey.
  2: (c) => {
    const t = c.t;
    FRANKp(c, 0, 5.6, { mode: "stand", expr: "smile", look: 0.3, prop: "crate" });
    if (after(t, A(0, "jockey."))) word(c, A(0, "jockey."), "NOT EVEN A JOCKEY", [0, 3.0, 5.4], 2.0, 1.3, "#fff3b0");
  },
  // 3 Meet Frank Hayes. 22 years old. He cleans the stables at a racetrack in New York.
  3: (c) => {
    const t = c.t;
    FRANKp(c, 0.2, -0.6, { mode: "stand", expr: "smile", look: 0.3, prop: "crate", lean: 0.05 * Math.sin(TQ(t) * 3) });
    kissHead(c, -2.6, -3.3, 1.6);
    if (after(t, A(1, "hayes."))) banner(c, A(1, "hayes."), "FRANK HAYES, 22", [0.2, 2.75, -0.8], 2.0, "#6a5a42", 1.8);
    if (after(t, A(1, "stables"))) word(c, A(1, "stables"), "STABLE HAND", [-0.7, 2.5, -1.6], 1.2, 1.1, "#fff3b0");
  },
  // 4 His dream? To ride in a real race.
  4: (c) => {
    const t = c.t;
    FRANKp(c, 0.4, -0.6, { mode: "stand", expr: "awe", look: -0.3, prop: "crate" });
    if (after(t, A(1, "dream?"))) stay(c, A(1, "dream?"), "dream", 620, 480, fxDream, [-0.4, 2.55, -0.9], 1.3, 1.0, 0.04);
  },
  // 5 June 4th. Belmont Park. Somebody finally gives him a horse.
  5: (c) => {
    const t = c.t;
    crowd(c, false, -6, 26, 7);
    if (after(t, A(2, "june"))) stay(c, A(2, "june"), "calJune", 300, 340, (p) => fxCal(p, "JUNE 4", true), [8.0, 6.2, -6], 1.8, 2.1, 0.05);
    if (after(t, A(2, "park."))) banner(c, A(2, "park."), "BELMONT PARK, NEW YORK", [11.5, 8.4, -8], 5.6, "#2a6a3a", 2.0);
  },
  // 6 Her name? Sweet Kiss.
  6: (c) => {
    const t = c.t;
    kissHead(c, 0.2, -2.0, 2.0);
    FRANKp(c, 1.6, -0.4, { mode: "stand", expr: "grin", look: -0.6 });
    if (after(t, A(2, "kiss."))) { banner(c, A(2, "kiss."), "SWEET KISS", [0.2, 2.75, -2.2], 2.0, "#e8506a", 2.0); stay(c, A(2, "kiss."), "heart", 300, 300, fxHeart, [1.1, 2.2, -1.6], 0.45, 0.45, 0.1); }
  },
  // 7 A 20-to-1 outsider. Nobody expects anything.
  7: (c) => {
    const t = c.t, od = A(2, "20-to-1");
    if (after(t, od)) stay(c, od, "odds", 400, 340, fxOdds, [0.2, 3.0, 5.4], 1.5, 1.28, -0.04);
    for (let k = 0; k < 5; k++) pose(c, 60 + k, FAN(k * 3), `fan${(k * 3) % 12}`, -2.6 + 1.3 * k, 6.4 + 0.2 * (k % 2), { mode: "stand", expr: after(t, A(2, "nobody")) ? "smug" : "neutral", look: 0.3 - 0.15 * k });
  },
  // 8 To make the weight, Frank reportedly starves himself and runs for hours.
  8: (c) => {
    const t = c.t, ru = A(3, "runs");
    FRANKp(c, 0.2, -0.6, after(t, ru) ? { mode: "march", phase: (TQ(t) * 2.2) % 1, expr: "pained", look: 0.2 } : { mode: "stand", expr: "nervous", look: 0.3, prop: "mitten" }, false);
    if (after(t, A(3, "weight,"))) stay(c, A(3, "weight,"), "scale", 400, 340, fxScale, [-0.65, 2.25, -1.2], 0.8, 0.68, -0.05);
    if (after(t, ru)) word(c, ru, "FOR HOURS", [1.0, 2.6, -1.0], 1.2, 1.1, "#ffd0c0");
  },
  // 9 Not a great plan.
  9: (c) => {
    const t = c.t;
    FRANKp(c, 0.2, -0.6, { mode: "stand", expr: "pained", look: 0, lean: 0.08 }, false);
    if (after(t, A(3, "plan."))) word(c, A(3, "plan."), "NOT A GREAT PLAN", [0.2, 2.75, -0.8], 1.8, 1.4, "#fff3b0");
  },
  // 10 The race starts. Frank and Sweet Kiss fly over fence after fence...
  10: (c) => {
    const t = c.t, rt = RT[10](t);
    field(c, rt, false);
    if (after(t, A(4, "starts."))) banner(c, A(4, "starts."), "AND THEY'RE OFF!", [kissX(rt) + 1, 4.4, -3], 4.0, "#c62a2e", 1.8);
  },
  // 11 and somewhere in the middle... Frank's heart stops.
  11: (c) => {
    const t = c.t, st = A(4, "stops."), rt = RT[11](t);
    horse(c, 0, kissX(rt), 0.4, after(t, st) ? "slump" : "up", 2.8);
    const k = after(t, st) ? 0 : q(((t * 1.3) % 1), 6);
    stay(c, shotT0(11) + 0.2, "ecg" + (after(t, st) ? "flat" : k), 600, 300, fxECG(after(t, st) ? -9 : k), [kissX(rt) + 0.2, 3.9, 0], 1.6, 0.8, 0);
  },
  // 12 But he doesn't fall. He stays slumped in the saddle.
  12: (c) => {
    const t = c.t, rt = RT[12](t);
    horse(c, 0, kissX(rt), 0.4, "slump", 2.8);
    if (after(t, A(5, "slumped"))) word(c, A(5, "slumped"), "STILL IN THE SADDLE", [kissX(rt) + 0.2, 3.6, 0.2], 2.2, 1.3, "#fff3b0");
  },
  // 13 And Sweet Kiss... just keeps running.
  13: (c) => {
    const t = c.t, rt = RT[13](t);
    field(c, rt, true);
  },
  // 14 Fence. Fence. Final stretch. Sweet Kiss crosses the line first!
  14: (c) => {
    const t = c.t, rt = RT[14](t);
    field(c, rt, true);
    if (after(t, A(6, "first!"))) stay(c, A(6, "first!"), "ribbon", 400, 460, fxRibbon, [FINISH + 1.6, 3.4, -2], 1.2, 1.38, 0.06);
  },
  // 15 The crowd goes wild.
  15: (c) => {
    const t = c.t;
    crowd(c, true, 14, 46, 3);
    if (after(t, A(6, "wild."))) word(c, A(6, "wild."), "THE CROWD GOES WILD", [30, 7.6, -8], 6.0, 1.3, "#fff3b0");
  },
  // 16 The owner rushes over to congratulate her new jockey...
  16: (c) => {
    const t = c.t, ru = A(7, "rushes"), w = smooth((t - ru) / 1.4);
    card(c, "kiss_stand", 600, 480, fxHorse(2, "slump"), [FINISH + 4, 1.05, 0.4], 2.8, 2.24);
    pose(c, 5, OWNER, "owner", FINISH + 9 - 3.0 * w, 1.6, { mode: w > 0.02 && w < 0.98 ? "stroll" : "stand", phase: (TQ(t) * 2) % 1, expr: "laugh", look: -0.8, prop: after(t, A(7, "congratulate")) ? "handsUp" : null });
    if (after(t, A(7, "owner"))) banner(c, A(7, "owner"), "THE OWNER", [FINISH + 7.6, 3.0, 1.4], 1.8, "#8a4a6a", 1.6);
  },
  // 17 and Frank slides off the horse.
  17: (c) => {
    const t = c.t, sl = A(7, "slides"), off = smooth((t - sl) / 0.7);
    card(c, "kiss_empty", 600, 480, fxHorse(2, "none"), [FINISH + 4, 1.05, 0.4], 2.8, 2.24);
    if (off < 0.99) card(c, "kiss_slump_only", 600, 480, (p) => { const g = p.g; g.save(); g.beginPath(); g.rect(260, 0, 340, 300); g.clip(); fxHorse(2, "slump")(p); g.restore(); }, [FINISH + 4 + 0.6 * off, 1.05 - 0.9 * off, 0.45], 2.8, 2.24, { rot: -0.5 * off });
    if (off >= 0.99) pose(c, 1, FRANK, "frank", FINISH + 5.2, 1.0, { mode: "stand", expr: "dazed", look: 0, blink: true, lean: 1.48 }, 1, 0.05);
    pose(c, 5, OWNER, "owner", FINISH + 6.0, 1.6, { mode: "stand", expr: after(t, sl + 0.3) ? "shock" : "laugh", look: -0.8, prop: after(t, sl + 0.3) ? "handsUp" : null });
  },
  // 18 Nobody had noticed.   (mostly under the impact card)
  18: (c) => {
    crowd(c, false, 14, 46, 3);
  },
  // 19 Three days later, Frank was buried in his racing silks.   (gentle, played straight)
  19: (c) => {
    const t = c.t;
    card(c, "stoneText", 400, 300, fxHeadstone, [0, 0.92, -1.98], 0.86, 0.65);
    for (let k = 0; k < 3; k++) card(c, "flower" + k, 200, 200, (p) => { p.stroke([[100, 190], [100, 90]], 8, "#3a7a3a"); p.ell(100, 80, 34, 34, ["#e8506a", "#f4f0e6", "#e8b84a"][k], 6); p.ell(100, 80, 12, 12, "#f6d870", 0); }, [-0.4 + 0.4 * k, 0.2, -1.6], 0.35, 0.35);
    if (after(t, A(8, "silks."))) card(c, "silksFolded", 300, 200, (p) => { p.poly(rrect(30, 60, 240, 100, 12), SILK, 7); p.band([[40, 150], [260, 70]], SILK2, 22, 0, "butt"); p.ell(150, 50, 60, 30, SILK2, 6); }, [0.1, 0.25, -1.3], 0.6, 0.4);
  },
  // 20 His first win. His only win.
  20: (c) => {
    const t = c.t;
    card(c, "stoneText", 400, 300, fxHeadstone, [0, 0.92, -1.98], 0.86, 0.65);
    card(c, "silksFolded", 300, 200, (p) => { p.poly(rrect(30, 60, 240, 100, 12), SILK, 7); p.band([[40, 150], [260, 70]], SILK2, 22, 0, "butt"); p.ell(150, 50, 60, 30, SILK2, 6); }, [0.1, 0.25, -1.3], 0.6, 0.4);
    if (after(t, A(8, "only"))) stay(c, A(8, "only"), "ribbon", 400, 460, fxRibbon, [0.9, 1.9, -1.8], 0.5, 0.58, 0.06);
  },
  // 21 And Sweet Kiss? Legend says she never raced again, and got a new nickname.
  21: (c) => {
    const t = c.t;
    kissHead(c, 0.2, -2.0, 2.0);
    if (after(t, A(9, "legend"))) word(c, A(9, "legend"), "LEGEND SAYS...", [0.2, 2.75, -2.2], 1.6, 1.2, "#e0c8ff");
  },
  // 22 Sweet Kiss of Death.   (night)
  22: (c) => {
    const t = c.t, dt = A(9, "death.");
    kissHead(c, 0.2, -2.0, 2.0);
    if (after(t, dt)) { banner(c, dt, "SWEET KISS OF DEATH", [0.2, 2.75, -2.2], 2.2, "#2a2226", 2.4); stay(c, dt, "deathKiss", 300, 300, fxDeathKiss, [1.2, 2.2, -1.6], 0.45, 0.45, 0.1); }
  },
  // 23 Send this to the friend who says they'll finish, even if it kills them.   (ends on shot 1)
  23: (c) => {
    const t = c.t;
    field(c, RT[23](t), true, 6, 3.0);
    if (after(t, A(10, "send"))) banner(c, A(10, "send"), "SEND THIS TO THAT FRIEND", [FINISH - 2.6, 6.2, -3], 5.0, "#e07a1a", 2.0);
  },
};
const shotT0 = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxSay; void fxScore; void cobbleHD; void tri; void house; void tent; void chair; void sub; void lantern; void farmhouse; void barn; void railFence; void kettle; void woodpile; void window4; void KETTLE; void shingle; void marble; void chalk; void DIRT; void sayB; void puff; void jolt; void hop; void pop; void table2; void bookcase; void painting; void rug; void chandelier2; void panelHD; void FENCES;
