// Places and cast of "The 38-Minute War" (Zanzibar, 27 Aug 1896; 9:16 short). Cameras sit on +z looking toward -z.
// Direction sheet: Stone Town seafront. Palette: coral-white stone, Indian-Ocean turquoise, Zanzibar red, Royal Navy
// black/buff, brass. One key moment per shot on a narration word; anticipation -> release -> settle; the casualty line is
// played straight (no gag, cold grade). Shore runs along z at x = 0: land at x < 0 (palace fronts face +x), sea at x > 0.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, beamBetween, cart, tent } from "./props3d";
import { Kit, quad } from "./build";
import { rep, ctex, stoneHD, roofHD, grassHD, planksHD, beamHD } from "./paint";
import { signHD, wbox, panelHD, drapes, chandelier2, painting, rug, bookcase, chair, table2, pottedPalm } from "./decor";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, henSide, rrect, txt, tw, curve, ellPts, DEF_LIGHT, thickAngle } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS } from "./story";
import { palm, MAT } from "./props3d";

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
// ---------------- effect drawings ----------------
const paper = (p: Pen, col = "#f8f1dc") => p.poly(rrect(20, 20, 500, 620, 10), col, 9);
// ---------------- textures ----------------
const usFlag = () => ctex("usFlag", 512, 288, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#c0353a"; g.fillRect(0, i * 288 / 13, 512, 288 / 13 + 1); }
  g.fillStyle = "#24356e"; g.fillRect(0, 0, 220, 155); g.fillStyle = "#f4f1ea";
  for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) { const x = 16 + k * 26.5, y = 22 + r * 37; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4 : 9; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.fill(); }
});
const union = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = "#1e3570"; g.fillRect(0, 0, w, h);
  const L = (x0: number, y0: number, x1: number, y1: number, lw: number, c: string) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  L(0, 0, w, h, h * 0.2, "#f4f1ea"); L(w, 0, 0, h, h * 0.2, "#f4f1ea"); L(0, 0, w, h, h * 0.07, "#c8323a"); L(w, 0, 0, h, h * 0.07, "#c8323a");
  L(w / 2, 0, w / 2, h, h * 0.33, "#f4f1ea"); L(0, h / 2, w, h / 2, h * 0.33, "#f4f1ea"); L(w / 2, 0, w / 2, h, h * 0.2, "#c8323a"); L(0, h / 2, w, h / 2, h * 0.2, "#c8323a");
};
const ukFlag = () => ctex("ukFlag", 512, 256, (g) => union(g, 512, 256));
const ensign = (hbc = false) => ctex("ensign" + hbc, 512, 256, (g) => {
  g.fillStyle = "#c0353a"; g.fillRect(0, 0, 512, 256); g.save(); union(g, 256, 128); g.restore();
  if (hbc) { g.fillStyle = "#f4f1ea"; g.font = "900 70px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H B C", 380, 190); }
});
const deFlag = () => ctex("deFlag", 256, 512, (g) => {
  ["#1e1e22", "#f4f1ea", "#c0353a"].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 150 + 40, 256, 150); });
  g.fillStyle = "#d8b84a"; g.fillRect(0, 0, 256, 40); for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 490); g.lineTo(x + 16, 512); g.lineTo(x + 32, 490); g.fill(); }
  g.fillRect(0, 490, 256, 6);
});
const seaTex = () => ctex("sea", 512, 512, (g, r) => {
  g.fillStyle = "#2f74a8"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "120,190,230" : "20,70,120"},${0.15 + 0.2 * r()})`; const x = 512 * r(), y = 512 * r(); g.fillRect(x, y, 20 + 60 * r(), 2 + 3 * r()); }
  for (let k = 0; k < 70; k++) { g.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * r()})`; const x = 512 * r(), y = 512 * r(); g.fillRect(x, y, 8 + 22 * r(), 2); }
});
const sandTex = () => ctex("sand", 512, 512, (g, r) => {
  g.fillStyle = "#d8c49a"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 5000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "250,240,210" : "120,100,70"},${0.1 + 0.15 * r()})`; g.fillRect(512 * r(), 512 * r(), 2 + 4 * r(), 2 + 3 * r()); }
  for (let k = 0; k < 30; k++) { g.fillStyle = "rgba(90,80,60,0.5)"; g.beginPath(); g.ellipse(512 * r(), 512 * r(), 4 + 8 * r(), 3 + 5 * r(), r() * 3, 0, Math.PI * 2); g.fill(); }
});
const soilTex = () => ctex("soil", 512, 512, (g, r) => {
  g.fillStyle = "#6a4a30"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 6000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "150,110,70" : "40,26,16"},${0.2 + 0.3 * r()})`; const s = 2 + 7 * r(); g.beginPath(); g.ellipse(512 * r(), 512 * r(), s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const plankWall = (key: string, base: string) => ctex("pw" + key, 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 32) { g.fillStyle = base; g.fillRect(x, 0, 32, 512); g.fillStyle = `rgba(${r() < 0.5 ? "255,230,200" : "40,20,10"},${0.08 + 0.1 * r()})`; g.fillRect(x, 0, 32, 512); g.fillStyle = "rgba(30,15,8,0.6)"; g.fillRect(x + 30, 0, 2, 512); for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(40,20,10,0.3)"; g.fillRect(x + 4 + 20 * r(), 512 * r(), 2, 30 + 60 * r()); } }
});
const marble = () => ctex("marble", 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#ece6da" : "#6a5a5a"; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = "rgba(120,110,100,0.25)"; g.lineWidth = 2; for (let k = 0; k < 40; k++) { let x = 512 * r(), y = 512 * r(); g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 6; i++) { x += 30 * (r() - 0.3); y += 30 * (r() - 0.5); g.lineTo(x, y); } g.stroke(); }
});
const seaView = () => ctex("seaView", 256, 384, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "#7ab4e8"); gr.addColorStop(0.55, "#d8ecf8"); gr.addColorStop(0.56, "#3a80b8"); gr.addColorStop(1, "#2a6a9a");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 384); g.fillStyle = "rgba(255,255,255,0.6)"; for (let k = 0; k < 40; k++) g.fillRect(256 * r(), 220 + 160 * r(), 10 + 20 * r(), 2);
  g.fillStyle = "#4a6a5a"; g.beginPath(); g.moveTo(0, 212); g.quadraticCurveTo(80, 190, 150, 210); g.lineTo(150, 214); g.lineTo(0, 214); g.fill();
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
    for (let i = 0; i < pos.count; i++) { const x = base[3 * i], y = base[3 * i + 1]; pos.setZ(i, (x / w) * 0.13 * w * Math.sin(x * 3.2 / w * 2 - t * 7 + y * 0.8)); pos.setY(i, y - 0.04 * w * (x / w) ** 2); }
    pos.needsUpdate = true; m.geometry.computeVertexNormals();
  }
};
const flagpole = (s: SetBuild, x: number, z: number, H: number, key: string, tex: () => THREE.Texture, w: number) => {
  s.b.add(new THREE.CylinderGeometry(0.05, 0.08, H, 8).translate(x, H / 2, z), C("#e8e4dc"));
  s.b.add(new THREE.SphereGeometry(0.1, 10, 8).translate(x, H + 0.05, z), C("#d8b84a"));
  flag(s, key, x + 0.05, H - 0.1, z, w, w * 0.56, tex);
};
const SEA = () => lam("seaM", () => ({ map: seaTex() }));
const sea = (b: Batch, y = 0) => b.add(plane(-2000, 2000, -2000, 2000, 24, y), SEA());
const rock = (b: Batch, x: number, y: number, z: number, s: number, seed: number) => b.add(new THREE.DodecahedronGeometry(s, 0).scale(1.3, 0.7, 1).rotateY(seed).translate(x, y, z), lam("rock" + (seed % 2), () => ({ color: ["#8a8a88", "#7a7c80"][seed % 2] })));
/** muzzle-loading cannon on a wooden carriage, barrel along local -z */
const cannon = (b: Batch, x: number, z: number, ry: number, s = 1, y = 0) => {
  const m = M4(x, y, z, ry, s), Wd = C("#6a4426"), Ir = C("#2a2a30");
  b.add(boxGeo(V(-0.24, 0.28, -0.5), V(0.24, 0.52, 0.5)), Wd, m);
  b.add(beamBetween(V(0, 0.4, 0.4), V(0, 0.06, 1.5), 0.08, 5), Wd, m);
  for (const sx of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16).rotateZ(Math.PI / 2).translate(sx * 0.33, 0.42, 0), Wd, m);
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8).rotateZ(Math.PI / 2).translate(sx * 0.36, 0.42, 0), Ir, m);
  }
  b.add(new THREE.CylinderGeometry(0.11, 0.17, 1.7, 14).rotateX(Math.PI / 2).translate(0, 0.66, -0.4), Ir, m);
  b.add(new THREE.TorusGeometry(0.12, 0.035, 6, 14).translate(0, 0.66, -1.25), Ir, m);
  b.add(new THREE.SphereGeometry(0.17, 10, 8).translate(0, 0.66, 0.45), Ir, m);
};
const balls = (b: Batch, x: number, z: number) => { let n = 0; for (let l = 0; l < 3; l++) for (let i = 0; i < 3 - l; i++) for (let j = 0; j < 3 - l; j++) { b.add(new THREE.SphereGeometry(0.1, 10, 8).translate(x + 0.2 * i + 0.1 * l, 0.1 + 0.16 * l, z + 0.2 * j + 0.1 * l), C("#26262c")); n++; } };
const barrel = (b: Batch, x: number, z: number, h = 0.8, y = 0) => { b.add(new THREE.CylinderGeometry(0.3, 0.3, h, 14).translate(x, y + h / 2, z), C("#8a5a34")); for (const yy of [0.15, h - 0.15]) b.add(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 14).translate(x, y + yy, z), C("#3a3a3e")); };
const crate = (b: Batch, x: number, z: number, s = 0.6, ry = 0, y = 0) => { b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s, s / 2)), lam("crateW", () => ({ map: plankWall("cr", "#a8784a") })), M4(x, y, z, ry)); };

const cabinSet = (s: SetBuild) => {
  const { b } = s, H = 2.7;
  const Wl = lam("cabW", () => ({ map: panelHD("cab", "#6a4426") }));
  b.add(plane(-4, 4, -4.2, 6, 2.4), lam("cabF", () => ({ map: planksHD() })));
  wbox(b, Wl, -4, 0, -4.4, 4, H, -4.2, 2.5, 2.5);
  for (const sd of [-1, 1]) wbox(b, Wl, sd > 0 ? 4 : -4.2, 0, -4.4, sd > 0 ? 4.2 : -4, H, 6, 2.5, 2.5);
  b.add(boxGeo(V(-4.2, H, -4.4), V(4.2, H + 0.1, 6)), C("#d8c8a8"));
  for (let z = -3.8; z < 6; z += 1.1) b.add(boxGeo(V(-4.2, H - 0.18, z - 0.1), V(4.2, H, z + 0.1)), lam("cabBeam", () => ({ map: beamHD() })));
  // stern windows (sea outside)
  for (let k = 0; k < 5; k++) {
    const x = -3.0 + 1.5 * k;
    b.add(boxGeo(V(x - 0.6, 0.85, -4.2), V(x + 0.6, 2.2, -4.15)), C("#3a2414"));
    b.add(quad(V(x - 0.52, 0.93, -4.14), V(x + 0.52, 0.93, -4.14), V(x + 0.52, 2.12, -4.14), V(x - 0.52, 2.12, -4.14)), lam("seaV", () => ({ map: seaView(), emissive: "#ffffff", emissiveMap: seaView(), emissiveIntensity: 0.9 })));
    b.add(boxGeo(V(x - 0.02, 0.93, -4.13), V(x + 0.02, 2.12, -4.1)), C("#d8b45a")); b.add(boxGeo(V(x - 0.52, 1.5, -4.13), V(x + 0.52, 1.54, -4.1)), C("#d8b45a"));
  }
  b.add(boxGeo(V(-4, 0, -4.2), V(4, 0.75, -3.7)), C("#5a3820")); // window seat
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-3.6 + 1.3 * k, 0.75, -4.1), V(-3.0 + 1.3 * k, 0.9, -3.75)), C(["#7a2632", "#2f4a6a"][k % 2]));
  // chart table
  table2(b, 0, -1.7, 2.2, 1.2, 0.8, "#5a3420", undefined, false);
  b.add(quad(V(-0.8, 0.81, -1.2), V(0.8, 0.81, -1.2), V(0.8, 0.81, -2.2), V(-0.8, 0.81, -2.2)), lam("chartZ", () => ({ color: "#e8dcb8" })));
  b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 10).translate(0.85, 0.92, -1.45), C("#d8b84a")); // telescope stand / candle
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8).rotateZ(Math.PI / 2).rotateY(0.4).translate(-0.6, 0.84, -1.4), C("#c9a24a")); // telescope
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12).translate(0.6, 0.92, -2.05), lam("decanter", () => ({ color: "#8a2a3a", emissive: "#5a1a2a", emissiveIntensity: 0.3 })));
  chair(b, 0, -3.35, Math.PI, "#3a2414", "#7a2632");
  // hanging lantern
  b.add(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4).translate(-1.2, H - 0.25, -2.9), C("#2a2a2a"));
  b.add(boxGeo(V(-1.32, H - 0.85, -3.02), V(-1.08, H - 0.5, -2.78)), lam("lantern", () => ({ color: "#ffe6a0", emissive: "#ffcc66", emissiveIntensity: 1.4 })));
  bookcase(b, -3.2, -3.0, 1.4, 2.3, "#3a2414");
  // a cannon at a side gunport, a globe, a sea-chest, rug, painting
  cannon(b, 3.2, -0.8, -Math.PI / 2, 0.8);
  b.add(boxGeo(V(4.0, 0.7, -1.3), V(4.05, 1.4, -0.4)), C("#0e0e12"));
  b.add(new THREE.SphereGeometry(0.3, 16, 12).translate(-2.6, 1.15, -0.6), lam("globe", () => ({ color: "#d8c890" }))); b.add(new THREE.CylinderGeometry(0.05, 0.12, 0.85, 8).translate(-2.6, 0.42, -0.6), C("#5a3420"));
  b.add(boxGeo(V(1.6, 0, -3.6), V(2.6, 0.55, -3.0)), lam("chest", () => ({ map: plankWall("chest", "#6a3a22") })));
  rug(b, "cab", ["#7a2632", "#2a3a5a", "#d8b84a", "#e8dcc0"], 0, -1.4, 3.6, 2.6);
  painting(b, 2.8, 2.15, -4.15, 0.9, 0.6, 4);
};

// ---------------- cast (Zanzibar, 1896) ----------------
const KHALID: Outfit = { jacket: "#3a2a44", pants: "#f1ece0", boots: "#3a2a1e", hat: "turban", hatCol: "#f4f0e6", dress: "#f4f0e6", sash: "#d8b84a", sword: true, moustache: "#1e1a1a", skin: SKINS[3], trim: "#d8b84a" };
const SERVANT = (v: number): Outfit => ({ jacket: "#e8e2d4", pants: "#e8e2d4", boots: "#5a3a26", hat: "turban", hatCol: ["#c8323a", "#f4f0e6", "#2f6a8a"][v % 3], dress: "#ece6d8", skin: SKINS[3], moustache: v % 2 ? "#2a2020" : undefined });
const ASKARI = (v: number): Outfit => ({ jacket: "#ece6d6", pants: "#ece6d6", boots: "#3a2a1e", hat: "cap", cap: "#b8283a", belt: "#5a3a26", rifle: true, skin: SKINS[3], moustache: v % 2 ? "#1e1a1a" : undefined });
const RAWSON: Outfit = { jacket: "#1e2a4a", pants: "#1e2a4a", boots: INK, hat: "peaked", hatCol: "#1e1e24", trim: "#e8c45a", buttons: "#e8c45a", moustache: "#cfc8bc", skin: SKINS[0], build: "stout" };
const CAVE: Outfit = { jacket: "#f1ece0", pants: "#f1ece0", boots: "#5a3a26", hat: "pith", hatCol: "#f4f0e6", buttons: "#d8b84a", moustache: "#6a4a2a", skin: SKINS[1] };
const SAILOR = (v: number): Outfit => ({ jacket: "#1e2a4a", pants: "#1e2a4a", boots: INK, hat: "cap", cap: "#f4f1ea", belt: "#1e1e24", rifle: v % 2 === 0, skin: SKINS[v % 3], moustache: v % 3 === 1 ? "#5a3a22" : undefined });
const GCONSUL: Outfit = { jacket: "#2a2a30", pants: "#3a3a40", boots: INK, hat: "tophat", hatCol: "#1e1e24", buttons: "#d8b84a", moustache: "#d8c8a0", skin: SKINS[0], build: "stout" };
const GSAILOR = (v: number): Outfit => ({ jacket: "#1e2440", pants: "#f1efe6", boots: INK, hat: "cap", cap: "#1e1e24", skin: SKINS[(v + 1) % 3] });

// ---------------- effect drawings ----------------
const SERIF = "Georgia, serif";
/** clock face, h:m */
const fxClock = (h: number, m: number) => (p: Pen) => {
  p.ell(200, 200, 186, 186, "#3a2a1e", 0); p.ell(200, 200, 170, 170, "#f6efdc", 10);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.stroke([[200 + 140 * Math.sin(a), 200 - 140 * Math.cos(a)], [200 + 158 * Math.sin(a), 200 - 158 * Math.cos(a)]], i % 3 ? 5 : 10, INK); }
  const am = (m / 60) * Math.PI * 2, ah = ((h % 12) / 12 + m / 720) * Math.PI * 2;
  p.stroke([[200, 200], [200 + 90 * Math.sin(ah), 200 - 90 * Math.cos(ah)]], 16, INK);
  p.stroke([[200, 200], [200 + 140 * Math.sin(am), 200 - 140 * Math.cos(am)]], 10, "#b8283a");
  p.ell(200, 200, 14, 14, "#d8b84a", 5);
};
/** stopwatch reading s (text) */
const fxStop = (s: string, col = "#b8283a") => (p: Pen) => {
  p.poly(rrect(170, 6, 60, 40, 8), "#c9a24a", 7); p.ell(200, 220, 180, 180, "#d8b84a", 10); p.ell(200, 220, 150, 150, "#fbf6e8", 7);
  txt(p, s, 200, 236, s.length > 4 ? 84 : 110, col, "900", "center");
};
const fxPortrait = (p: Pen) => {
  p.poly(rrect(10, 10, 380, 480, 14), "#b8902e", 10); p.poly(rrect(40, 40, 320, 420, 8), "#5a7a8a", 6);
  p.ell(200, 220, 92, 100, "#c99067", 8); p.poly([[96, 170], [110, 96], [200, 70], [290, 96], [304, 170], [200, 150]], "#f4f0e6", 8);
  p.ell(165, 225, 9, 11, INK, 0); p.ell(235, 225, 9, 11, INK, 0); p.poly([[140, 268], [200, 300], [260, 268], [250, 330], [200, 350], [150, 330]], "#ece8e0", 7);
  p.poly([[60, 460], [120, 330], [280, 330], [340, 460]], "#3a2a44", 8);
  p.band([[30, 120], [370, 40]], "#16141a", 34, 0, "butt"); p.band([[30, 400], [370, 480]], "#16141a", 34, 0, "butt");
};
const fxCrown = (p: Pen) => {
  p.poly([[30, 230], [30, 90], [100, 160], [160, 40], [220, 160], [290, 90], [290, 230]], "#e8be3a", 10);
  for (const [x, c] of [[90, "#c8323a"], [160, "#2f6ab5"], [230, "#2f8a4a"]] as [number, string][]) p.ell(x, 196, 16, 18, c, 5);
  for (const x of [30, 160, 290]) p.ell(x, x === 160 ? 40 : 90, 14, 14, "#fff2b0", 5);
};
const fxRule = (p: Pen) => {
  paper(p, "#f6efd8");
  txt(p, "BRITISH RULE", 260, 96, 54, "#1e2a4a", "900", "center", SERIF);
  txt(p, "No new Sultan", 260, 250, 52, "#2a2010", "700", "center", SERIF);
  txt(p, "without our", 260, 316, 52, "#2a2010", "700", "center", SERIF);
  txt(p, "PERMISSION", 260, 400, 64, "#b8283a", "900", "center", SERIF);
  p.ell(400, 560, 50, 50, "#b8283a", 8); txt(p, "VR", 400, 562, 40, "#f0c0b0", "900", "center", SERIF);
};
const fxUltimatum = (p: Pen) => {
  paper(p, "#f4ecd4");
  txt(p, "ULTIMATUM", 260, 100, 66, "#1e2a4a", "900", "center", SERIF);
  txt(p, "Leave the palace", 260, 230, 44, "#2a2010", "700", "center", SERIF);
  txt(p, "by", 260, 290, 44, "#2a2010", "700", "center", SERIF);
  txt(p, "9:00 A.M.", 260, 380, 92, "#b8283a", "900", "center");
  g2(p, "- Rear-Admiral Rawson", 260, 520);
};
const g2 = (p: Pen, s: string, x: number, y: number) => { const g = p.g; g.font = "italic 30px Georgia, serif"; g.fillStyle = "#3a3020"; g.textAlign = "center"; g.fillText(s, x, y); };
const fxInvoice = (p: Pen) => {
  paper(p, "#fbf6e6");
  txt(p, "INVOICE", 260, 100, 72, "#1e2a4a", "900", "center", SERIF);
  const g = p.g; g.font = "32px Georgia, serif"; g.fillStyle = "#2a2010"; g.textAlign = "left";
  g.fillText("Shells fired at you ....", 50, 220); g.fillText("Bombardment (38 min)", 50, 270); g.fillText("Damages .................", 50, 320);
  for (let j = 0; j < 2; j++) p.stroke([[50, 360 + 40 * j], [470, 360 + 40 * j]], 4, "#a8a088");
  txt(p, "PAY UP", 260, 500, 78, "#b8283a", "900", "center");
  p.ell(430, 580, 44, 44, "#b8283a", 7);
};
/** one flame tongue cluster, k = flicker phase 0..1 */
const fxFire = (k: number) => (p: Pen) => {
  const w = (a: number) => 18 * Math.sin(2 * Math.PI * (k + a));
  p.poly([[40, 300], [60, 170 + w(0)], [110, 210], [150, 40 + w(0.3)], [190, 190], [240, 110 + w(0.6)], [260, 300]], "#e8582a", 8);
  p.poly([[80, 300], [100, 210 + w(0.2)], [140, 240], [160, 120 + w(0.5)], [190, 240], [220, 190 + w(0.8)], [230, 300]], "#f6b23a", 0);
  p.poly([[120, 300], [140, 250], [160, 200 + w(0.1)], [180, 250], [190, 300]], "#fff0a0", 0);
};
const fxSmoke = (k: number) => (p: Pen) => {
  for (let i = 0; i < 7; i++) { const a = i * 1.7 + k * 2, r = 70 + 20 * Math.sin(i * 2.3); p.ell(200 + 110 * Math.cos(a) * (0.6 + 0.4 * k), 230 - 120 * Math.sin(i * 0.9) * (0.5 + 0.5 * k), r, r * 0.85, i % 2 ? "#6a6670" : "#7e7a84", 0); }
};

// ---------------- textures ----------------
const zanFlag = () => ctex("zanFlag", 512, 288, (g) => { g.fillStyle = "#c62a2e"; g.fillRect(0, 0, 512, 288); g.fillStyle = "rgba(0,0,0,0.08)"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 24, 288); });
const whiteEnsign = () => ctex("whiteEns", 512, 256, (g) => {
  g.fillStyle = "#f6f4ee"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#c8323a"; g.fillRect(232, 0, 48, 256); g.fillRect(0, 104, 512, 48);
  g.save(); g.beginPath(); g.rect(0, 0, 256, 128); g.clip(); union(g, 256, 128); g.restore();
});
const kaiserFlag = () => ctex("kaiserFlag", 512, 288, (g) => { ["#1e1e22", "#f4f1ea", "#c0353a"].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 96, 512, 96); }); });
const coralStone = () => ctex("coral", 512, 512, (g, r) => {
  g.fillStyle = "#ece2cc"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,250,236" : "150,128,96"},${0.06 + 0.1 * r()})`; g.fillRect(512 * r(), 512 * r(), 2 + 6 * r(), 2 + 4 * r()); }
  for (let k = 0; k < 14; k++) { g.fillStyle = "rgba(140,120,90,0.08)"; g.beginPath(); g.ellipse(512 * r(), 512 * r(), 30 + 60 * r(), 14 + 30 * r(), r() * 3, 0, Math.PI * 2); g.fill(); }
});
const STONE = () => lam("coralM", () => ({ map: coralStone() }));
const carvedDoor = () => ctex("zdoor", 256, 512, (g, r) => {
  g.fillStyle = "#6a4024"; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "#3a2010"; g.lineWidth = 6; g.strokeRect(14, 14, 228, 484); g.beginPath(); g.moveTo(128, 14); g.lineTo(128, 498); g.stroke();
  g.fillStyle = "#c9a24a"; for (let y = 60; y < 480; y += 60) for (const x of [50, 100, 156, 206]) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "#8a5a32"; g.lineWidth = 4; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(128, 40, 30 + 14 * k, Math.PI, 0); g.stroke(); }
});
const DOOR = () => lam("zdoorM", () => ({ map: carvedDoor() }));

// ---------------- builders ----------------
/** the seafront palace block, front facing +x at x = xf, centred on z = zc. Verandas on two floors, crenellations. */
const PAL = { xf: -6.0, zc: -6.0, W: 16, D: 9, H: 11 };
const palaceBlock = (s: SetBuild) => {
  const { b } = s, { xf, zc, W, D, H } = PAL, x0 = xf - D, z0 = zc - W / 2, z1 = zc + W / 2;
  wbox(b, STONE(), x0, 0, z0, xf, H, z1, 4, 4);
  const Wd = C("#5a3a22"), Rail = C("#f4efe2"), Dark = C("#2a2422");
  for (const fl of [1, 2]) { // verandas with columns + carved rail, deep shade behind
    const y0 = fl === 1 ? 3.6 : 7.2;
    b.add(boxGeo(V(xf, y0 - 0.25, z0), V(xf + 2.2, y0, z1)), STONE());
    for (let z = z0 + 0.4; z <= z1 - 0.3; z += 1.6) b.add(new THREE.CylinderGeometry(0.17, 0.2, 3.3, 10).translate(xf + 2.0, y0 + 1.65, z), Rail);
    b.add(boxGeo(V(xf + 1.9, y0, z0), V(xf + 2.1, y0 + 0.9, z1)), lam("railZ", () => ({ map: rep(stoneHD("railZ", ["#f4efe2", "#e8e0cc", "#f8f4ea", "#ddd4bc"]), 8, 1) })));
    for (let z = z0 + 1.2; z < z1 - 0.6; z += 1.6) b.add(boxGeo(V(xf + 0.02, y0 + 0.2, z - 0.45), V(xf + 0.06, y0 + 2.5, z + 0.45)), Dark);
    b.add(boxGeo(V(xf, y0 + 3.3, z0), V(xf + 2.3, y0 + 3.5, z1)), Wd);
  }
  // crenellated parapet
  for (let z = z0; z < z1; z += 0.9) b.add(boxGeo(V(x0, H, z), V(xf + 0.1, H + 0.6, z + 0.5)), STONE());
  // ground floor: arched dark openings + the great carved gate (dyn doors)
  for (const z of [z0 + 2, z0 + 4.4, z1 - 4.4, z1 - 2]) b.add(boxGeo(V(xf + 0.01, 0.4, z - 0.6), V(xf + 0.05, 2.6, z + 0.6)), Dark);
  b.add(boxGeo(V(xf + 0.02, 0, zc - 1.6), V(xf + 0.12, 3.4, zc + 1.6)), C("#3a2a1e"));
  b.add(boxGeo(V(xf, 3.4, zc - 1.9), V(xf + 0.3, 3.8, zc + 1.9)), C("#d8c8a6"));
  for (const sd of [-1, 1]) {
    const g = new THREE.Group(), bb = new Batch();
    bb.add(boxGeo(V(0, 0, 0), V(0.12, 3.3, 1.55)), DOOR());
    bb.build(g); g.position.set(xf + 0.14, 0, zc + sd * 1.6); g.scale.z = -sd; s.root.add(g); s.dyn["door" + (sd > 0 ? "R" : "L")] = g;
  }
  // roof flagpole (dyn so it can fall)
  const fp = new THREE.Group(), fb = new Batch();
  fb.add(new THREE.CylinderGeometry(0.06, 0.09, 6, 8).translate(0, 3, 0), C("#e8e4dc"));
  fb.add(new THREE.SphereGeometry(0.12, 10, 8).translate(0, 6.05, 0), C("#d8b84a"));
  fb.build(fp); fp.position.set(xf - 2.5, H + 0.6, zc); s.root.add(fp); s.dyn.pole = fp;
  const geo = new THREE.PlaneGeometry(2.6, 1.5, 14, 6).translate(1.3, -0.75, 0);
  const fm = new THREE.Mesh(geo, lam("flagzan", () => ({ map: zanFlag(), side: THREE.DoubleSide })));
  fm.position.set(0.05, 5.9, 0); fm.rotation.y = -Math.PI / 2; fm.userData.base = Float32Array.from(geo.attributes.position.array as Float32Array); fm.userData.w = 2.6;
  fp.add(fm); s.dyn.flagzan = fm;
};
/** the clock tower (House of Wonders style), clock face toward +x, dyn hands */
const TOWER = { x: -9, z: -19 };
const clockTower = (s: SetBuild) => {
  const { b } = s, { x, z } = TOWER, h = 22, w = 3.4;
  wbox(b, STONE(), x - w / 2, 0, z - w / 2, x + w / 2, h, z + w / 2, 2, 6);
  for (let y = 4; y < h - 5; y += 4) b.add(boxGeo(V(x + w / 2, y, z - 0.5), V(x + w / 2 + 0.04, y + 2, z + 0.5)), C("#2a2422"));
  b.add(boxGeo(V(x - w / 2 - 0.3, h, z - w / 2 - 0.3), V(x + w / 2 + 0.3, h + 0.5, z + w / 2 + 0.3)), C("#d8c8a6"));
  b.add(new THREE.ConeGeometry(2.6, 2.4, 4).rotateY(Math.PI / 4).translate(x, h + 1.7, z), C("#7a5a3a"));
  b.add(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 32).rotateZ(Math.PI / 2).translate(x + w / 2 + 0.06, h - 2.6, z), C("#f6efdc"));
  b.add(new THREE.TorusGeometry(1.25, 0.12, 8, 32).rotateY(Math.PI / 2).translate(x + w / 2 + 0.13, h - 2.6, z), C("#3a2a1e"));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; b.add(boxGeo(V(-0.03, 0.9, -0.05), V(0.03, 1.1, 0.05)), C(INK), new THREE.Matrix4().makeTranslation(x + w / 2 + 0.14, h - 2.6, z).multiply(new THREE.Matrix4().makeRotationX(-a))); }
  for (const [key, L, wd, col] of [["hourH", 0.7, 0.12, INK], ["minH", 1.05, 0.08, "#b8283a"]] as [string, number, number, string][]) {
    const g = new THREE.Group(), bb = new Batch(); bb.add(boxGeo(V(-0.02, -0.1, -wd / 2), V(0.02, L, wd / 2)), C(col)); bb.build(g);
    g.position.set(x + w / 2 + (key === "minH" ? 0.2 : 0.17), h - 2.6, z); s.root.add(g); s.dyn[key] = g;
  }
};
/** a Royal Navy protected cruiser of the 1890s: black hull, white upperworks, two buff funnels, two masts. Faces +x? no: bow toward -z */
const cruiser = (b: Batch, L: number) => {
  const hw = L * 0.065, hh2 = L * 0.06, H = C("#1e1e24"), Wt = C("#f2efe6"), Buff = C("#d8a85a");
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2, hh2 * 1.1); shape.lineTo(-L / 2 + L * 0.04, -hh2); shape.lineTo(L / 2 - L * 0.12, -hh2); shape.lineTo(L / 2, hh2 * 1.4); shape.closePath();
  b.add(new THREE.ExtrudeGeometry(shape, { depth: 2 * hw, bevelEnabled: false }).translate(0, 0, -hw).rotateY(Math.PI / 2), H);
  b.add(boxGeo(V(-hw + 0.05, hh2 * 1.1, -L * 0.3), V(hw - 0.05, hh2 * 1.12, L * 0.38)), lam("deckP", () => ({ map: planksHD() })));
  b.add(boxGeo(V(-hw * 0.7, hh2 * 1.1, -L * 0.12), V(hw * 0.7, hh2 * 2.1, L * 0.16)), Wt);
  b.add(boxGeo(V(-hw * 0.5, hh2 * 2.1, -L * 0.18), V(hw * 0.5, hh2 * 2.8, -L * 0.1)), Wt);
  for (const zf of [-L * 0.04, L * 0.08]) b.add(new THREE.CylinderGeometry(hw * 0.32, hw * 0.34, hh2 * 3.2, 14).translate(0, hh2 * 2.1 + hh2 * 1.6, zf), Buff);
  for (const zf of [-L * 0.04, L * 0.08]) b.add(new THREE.CylinderGeometry(hw * 0.34, hw * 0.34, hh2 * 0.3, 14).translate(0, hh2 * 3.6, zf), H);
  for (const zm of [-L * 0.24, L * 0.28]) { b.add(new THREE.CylinderGeometry(0.06 * L / 20, 0.1 * L / 20, L * 0.42, 8).translate(0, hh2 + L * 0.21, zm), C("#5a3a22")); b.add(new THREE.CylinderGeometry(hw * 0.28, hw * 0.2, hh2 * 0.6, 10).translate(0, hh2 + L * 0.3, zm), Wt); }
  for (const zg of [-L * 0.34, L * 0.32]) { b.add(new THREE.CylinderGeometry(hw * 0.5, hw * 0.55, hh2 * 0.8, 12).translate(0, hh2 * 1.5, zg), C("#4a4a52")); b.add(new THREE.CylinderGeometry(0.06 * L / 20, 0.06 * L / 20, L * 0.12, 8).rotateX(Math.PI / 2).translate(0, hh2 * 1.6, zg + Math.sign(zg) * -L * 0.06), C("#2a2a30")); }
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.05 * L / 20, 0.05 * L / 20, hw * 0.6, 6).rotateZ(Math.PI / 2).translate(sx * (hw + 0.1 * L / 20), hh2 * 0.7, -L * 0.2 + k * L * 0.12), C("#2a2a30"));
  b.add(quad(V(0, hh2 * 1.4 + L * 0.02, L * 0.5), V(0, hh2 * 1.4 + L * 0.02, L * 0.5 + L * 0.1), V(0, hh2 * 1.4 + L * 0.075, L * 0.5 + L * 0.1), V(0, hh2 * 1.4 + L * 0.075, L * 0.5)), lam("wensM", () => ({ map: whiteEnsign(), side: THREE.DoubleSide })));
};
/** HHS Glasgow: small white royal yacht, gold band, one funnel, two masts, red flag; bow toward -z */
const yacht = (b: Batch, L: number) => {
  const hw = L * 0.08, hh2 = L * 0.07;
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2, hh2 * 1.2); shape.lineTo(-L / 2 + L * 0.06, -hh2); shape.lineTo(L / 2 - L * 0.15, -hh2); shape.lineTo(L / 2, hh2 * 1.5); shape.closePath();
  b.add(new THREE.ExtrudeGeometry(shape, { depth: 2 * hw, bevelEnabled: false }).translate(0, 0, -hw).rotateY(Math.PI / 2), C("#f4f1ea"));
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * hw - 0.03, hh2 * 0.6, -L * 0.4), V(sx * hw + 0.03, hh2 * 0.85, L * 0.42)), C("#d8b84a"));
  b.add(boxGeo(V(-hw * 0.7, hh2 * 1.2, -L * 0.15), V(hw * 0.7, hh2 * 2.2, L * 0.2)), C("#a8784a"));
  b.add(new THREE.CylinderGeometry(hw * 0.3, hw * 0.3, hh2 * 2.4, 12).translate(0, hh2 * 3, 0), C("#e8b84a"));
  for (const zm of [-L * 0.3, L * 0.3]) b.add(new THREE.CylinderGeometry(0.04, 0.06, L * 0.6, 8).translate(0, hh2 + L * 0.3, zm), C("#5a3a22"));
  b.add(quad(V(0, hh2 + L * 0.5, L * 0.3), V(0, hh2 + L * 0.5, L * 0.3 + L * 0.16), V(0, hh2 + L * 0.58, L * 0.3 + L * 0.16), V(0, hh2 + L * 0.58, L * 0.3)), lam("zanFlagM", () => ({ map: zanFlag(), side: THREE.DoubleSide })));
};
/** British squadron positions in the harbour: [x, z, yaw, L] */
const FLEET: [number, number, number, number][] = [[30, -14, 0.25, 26], [44, -34, 0.1, 30], [26, -46, 0.3, 24], [52, -62, 0.0, 28], [36, -78, 0.2, 24]];
const YACHT: V3 = [9, 0, -10];
const harbor = (s: SetBuild) => {
  const { b } = s;
  sea(b, 0);
  b.add(plane(-300, 1.2, -260, 60, 4, 0.06), lam("sandB", () => ({ map: sandTex() })));
  b.add(plane(-300, -4.6, -260, 60, 6, 0.4), lam("pave", () => ({ map: rep(stoneHD("paveZ", ["#d8ccb0", "#cbbd9e", "#e2d6bc", "#c2b494"]), 1, 1) })));
  b.add(boxGeo(V(-4.6, 0, -260), V(-4.2, 0.4, 60)), STONE()); // sea wall lip
  for (let k = 0; k < 14; k++) rock(b, 0.6 + 1.6 * hh(k, 1), 0.05, 6 - 6 * k + 3 * hh(k, 2), 0.2 + 0.35 * hh(k, 3), k);
  palaceBlock(s);
  clockTower(s);
  // Stone Town behind: white and ochre blocks with dark windows, flat roofs
  for (let k = 0; k < 26; k++) {
    const x = -22 - 10 * hh(k, 1) - (k % 3) * 7, z = 30 - 9 * k + 3 * hh(k, 2), h = 6 + 8 * hh(k, 3), w = 5 + 3 * hh(k, 4);
    b.add(boxGeo(V(x - w / 2, 0, z - 3.5), V(x + w / 2, h, z + 3.5)), lam("town" + (k % 3), () => ({ map: rep(coralStone(), 1, 1), color: ["#ffffff", "#f6e6c8", "#efd8c0"][k % 3] })));
    for (let j = 0; j < Math.floor(h / 2.6); j++) b.add(boxGeo(V(x + w / 2, 1.2 + 2.6 * j, z - 1.2), V(x + w / 2 + 0.05, 2.4 + 2.6 * j, z + 1.2)), C("#3a2a22"));
  }
  // harem wing + lighthouse (south of the palace), a mosque dome, palms along the front
  wbox(b, STONE(), -14, 0, 3, -6.5, 8, 12, 3, 3);
  for (let z = 4; z < 12; z += 1.5) b.add(boxGeo(V(-6.5, 2, z - 0.4), V(-6.45, 4.4, z + 0.4)), C("#2a2422"));
  b.add(new THREE.CylinderGeometry(0.9, 1.2, 15, 12).translate(-3.5, 7.5, 14), C("#f4f0e6")); b.add(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 12).translate(-3.5, 15.6, 14), lam("lamp", () => ({ color: "#ffe6a0", emissive: "#ffcc66", emissiveIntensity: 0.6 }))); b.add(new THREE.ConeGeometry(1.4, 1.4, 12).translate(-3.5, 16.9, 14), C("#b8283a"));
  b.add(new THREE.SphereGeometry(3.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(-30, 9, -30), C("#f4f0e6")); b.add(boxGeo(V(-33, 0, -33), V(-27, 9, -27)), STONE());
  for (let k = 0; k < 12; k++) palm(b, -4.0 + 0.6 * hh(k, 1), 18 - 7 * k + 2 * hh(k, 2), 6.5 + 2.5 * hh(k, 3), k + 3, 0.4);
  for (let k = 0; k < 4; k++) cannon(b, -4.9, -14 - 2.2 * k, -Math.PI / 2, 0.9, 0.4);
  barrel(b, -2.6, 3.4, 0.8, 0.06); crate(b, -2.0, 4.2, 0.6, 0.3, 0.06); crate(b, -1.6, 3.6, 0.5, 0.6, 0.06);
  for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(70 + 40 * hh(k, 8), 12, 8).scale(1, 0.12, 1).translate(220 + 60 * k, -6, -300 + 120 * k), lam("isle", () => ({ color: "#4f8a5a" })));
  FLEET.forEach(([x, z, ry, L], i) => { const g = sub(s, "ship" + i, (sb) => cruiser(sb, L)); g.position.set(x, 0, z); g.rotation.y = ry; });
  const yg = sub(s, "yacht", (sb) => yacht(sb, 12)); yg.position.set(...YACHT); yg.rotation.y = -0.4;
};
/** throne hall: coral-white arches, carved doors, red carpets, brass lamps, the plain red flag */
const throne = (s: SetBuild) => {
  const { b } = s, H = 6;
  b.add(plane(-8, 8, -6.2, 8, 2.5), lam("marbleF", () => ({ map: marble() })));
  wbox(b, STONE(), -8, 0, -6.4, 8, H, -6.2, 3, 3);
  for (const sd of [-1, 1]) wbox(b, STONE(), sd > 0 ? 8 : -8.2, 0, -6.4, sd > 0 ? 8.2 : -8, H, 8, 3, 3);
  b.add(boxGeo(V(-8.2, H, -6.4), V(8.2, H + 0.2, 8)), lam("ceilZ", () => ({ map: panelHD("ceilZ", "#7a4a2a") })));
  for (const x of [-5, 5]) { // arched windows onto the sea
    b.add(quad(V(x - 1.0, 1.0, -6.18), V(x + 1.0, 1.0, -6.18), V(x + 1.0, 4.2, -6.18), V(x - 1.0, 4.2, -6.18)), lam("seaV", () => ({ map: seaView(), emissive: "#ffffff", emissiveMap: seaView(), emissiveIntensity: 0.9 })));
    b.add(new THREE.TorusGeometry(1.0, 0.12, 8, 20, Math.PI).translate(x, 4.2, -6.15), C("#d8c8a6"));
    for (let k = 1; k < 3; k++) b.add(boxGeo(V(x - 1.0, 1.0 + 1.07 * k, -6.17), V(x + 1.0, 1.06 + 1.07 * k, -6.14)), C("#5a3a22"));
  }
  b.add(boxGeo(V(-1.3, 0, -6.18), V(1.3, 4.0, -6.12)), DOOR()); b.add(new THREE.TorusGeometry(1.3, 0.16, 8, 20, Math.PI).translate(0, 4.0, -6.12), C("#c9a24a"));
  for (const x of [-6.8, -2.6, 2.6, 6.8]) for (const z of [-5.0, -0.6]) {
    b.add(new THREE.CylinderGeometry(0.3, 0.34, H - 0.6, 14).translate(x, H / 2, z), lam("colZ", () => ({ color: "#f4efe4" })));
    b.add(boxGeo(V(x - 0.45, 0, z - 0.45), V(x + 0.45, 0.3, z + 0.45)), C("#e0d8c8")); b.add(boxGeo(V(x - 0.45, H - 0.3, z - 0.45), V(x + 0.45, H, z + 0.45)), lam("gold", () => ({ color: "#d8b84a" })));
  }
  b.add(plane(-1.3, 1.3, -6.2, 8, 2.4, 0.01), C("#9a1e2a")); for (const sx of [-1, 1]) b.add(plane(sx * 1.3 - 0.06, sx * 1.3 + 0.06, -6.2, 8, 2.4, 0.012), lam("gold", () => ({ color: "#d8b84a" })));
  // dais + throne
  b.add(boxGeo(V(-2.2, 0, -5.2), V(2.2, 0.35, -3.2)), C("#7a1e2a"));
  b.add(boxGeo(V(-0.6, 0.35, -4.6), V(0.6, 0.95, -3.9)), C("#b8283a")); b.add(boxGeo(V(-0.7, 0.35, -4.75), V(0.7, 3.0, -4.6)), lam("gold", () => ({ color: "#d8b84a" }))); b.add(boxGeo(V(-0.55, 1.0, -4.6), V(0.55, 2.8, -4.56)), C("#b8283a"));
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * 0.6 - 0.1, 0.35, -4.6), V(sx * 0.6 + 0.1, 1.35, -3.9)), lam("gold", () => ({ color: "#d8b84a" })));
  for (const x of [-3.4, 3.4]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), lam("zanB", () => ({ map: zanFlag(), side: THREE.DoubleSide }))); m.position.set(x, 3.6, -6.1); s.root.add(m); }
  for (const x of [-4.4, 4.4]) { b.add(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4).translate(x, H - 0.6, -2), C("#2a2a2a")); b.add(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 8).translate(x, H - 1.45, -2), lam("brassL", () => ({ color: "#e8c46a", emissive: "#ffcc66", emissiveIntensity: 0.8 }))); }
  chandelier2(b, 0, 4.6, 1.5, 1.0);
  rug(b, "zan", ["#7a1e2a", "#d8b84a", "#1e4a5a", "#f1e8d6"], 0, -1.6, 4.6, 3.0);
  for (const [x, z, c] of [[-2.6, -2.4, "#2f6a8a"], [2.6, -2.4, "#d8b84a"], [-3.2, 0.6, "#c8323a"], [3.2, 0.6, "#2f8a5a"]] as [number, number, string][]) b.add(new THREE.SphereGeometry(0.42, 12, 8).scale(1.4, 0.45, 1).translate(x, 0.2, z), C(c));
  pottedPalm(b, -5.8, -4.8, 2.0); pottedPalm(b, 5.8, -4.8, 2.0);
  // the late Sultan's portrait (frame on the wall)
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), lam("portraitM", () => ({ map: ctex("portraitT", 400, 500, (g) => fxPortrait(new Pen(g as unknown as CanvasRenderingContext2D))) })));
  pm.position.set(-4.7, 3.0, -6.08); s.root.add(pm); s.dyn.portrait = pm;
};
/** German consulate: white villa with balcony, imperial flag; garden wall whose gate opens straight onto the water */
const consulate = (s: SetBuild) => {
  const { b } = s;
  sea(b, 0);
  b.add(plane(-60, 60, -60, -1.2, 4, 0.25), lam("lawn", () => ({ map: grassHD() })));
  b.add(plane(-1.0, 1.0, -6, -1.2, 1, 0.26), lam("pave", () => ({ map: rep(stoneHD("paveZ", ["#d8ccb0", "#cbbd9e", "#e2d6bc", "#c2b494"]), 1, 1) })));
  // garden wall along z = -1 with the water gate at x = 0
  for (const [a0, a1] of [[-14, -1.1], [1.1, 14]]) wbox(b, STONE(), a0, 0, -1.4, a1, 1.2, -0.9, 3, 1);
  for (let x = -14; x < 14; x += 0.8) if (Math.abs(x) > 1.2) b.add(boxGeo(V(x, 1.2, -1.45), V(x + 0.45, 1.5, -0.85)), STONE());
  b.add(boxGeo(V(-1.3, 0, -1.45), V(-1.05, 3.2, -0.85)), STONE()); b.add(boxGeo(V(1.05, 0, -1.45), V(1.3, 3.2, -0.85)), STONE());
  b.add(new THREE.TorusGeometry(1.18, 0.14, 8, 20, Math.PI).translate(0, 3.2, -1.15), STONE());
  for (let k = 0; k < 3; k++) b.add(boxGeo(V(-1.0, 0.25 - 0.12 * k, -0.85 + 0.32 * k), V(1.0, 0.31 - 0.12 * k, -0.53 + 0.32 * k)), STONE()); // steps into the water
  // villa
  wbox(b, STONE(), -6, 0, -14, 6, 7, -8, 4, 3);
  b.add(boxGeo(V(-6.3, 7, -14.3), V(6.3, 7.4, -7.7)), C("#d8c8a6"));
  b.add(boxGeo(V(-6, 3.4, -8), V(6, 3.6, -6.8)), STONE());
  for (let x = -5.5; x <= 5.5; x += 1.1) b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6).translate(x, 4.05, -6.9), C("#f4efe2"));
  b.add(boxGeo(V(-6, 4.45, -6.95), V(6, 4.55, -6.85)), C("#f4efe2"));
  for (const x of [-4, -1.4, 1.4, 4]) { b.add(boxGeo(V(x - 0.55, 0.9, -7.98), V(x + 0.55, 2.6, -7.94)), C("#2a3a4a")); b.add(boxGeo(V(x - 0.55, 4.3, -7.98), V(x + 0.55, 6.2, -7.94)), C("#2a3a4a")); for (const s2 of [-1, 1]) b.add(boxGeo(V(x + s2 * 0.55 - 0.2, 4.3, -7.96), V(x + s2 * 0.55 + 0.2, 6.2, -7.9)), C("#3f6a4a")); }
  b.add(boxGeo(V(-0.7, 0, -7.98), V(0.7, 2.8, -7.92)), DOOR());
  flagpole(s, 3.6, -5.0, 9, "de", kaiserFlag, 2.2);
  for (let k = 0; k < 7; k++) palm(b, -12 + 3.8 * k + (k > 2 ? 1.6 : 0), -3.2 - 1.5 * hh(k, 2) - (k % 2) * 6, 5.5 + 2.5 * hh(k, 3), k + 11, 0.25);
  // the boat (dyn): German navy cutter with two rowers
  const bg = sub(s, "boat", (bb) => {
    const shape = new THREE.Shape(); shape.moveTo(-2.2, 0.5); shape.lineTo(-1.8, -0.15); shape.lineTo(1.6, -0.15); shape.lineTo(2.3, 0.6); shape.closePath();
    bb.add(new THREE.ExtrudeGeometry(shape, { depth: 1.1, bevelEnabled: false }).translate(0, 0, -0.55), C("#f4f1ea"));
    bb.add(boxGeo(V(-2.1, 0.42, -0.57), V(2.2, 0.52, 0.57)), C("#1e2440"));
    for (const x of [-0.6, 0.6]) bb.add(boxGeo(V(x - 0.15, 0.2, -0.5), V(x + 0.15, 0.3, 0.5)), C("#a8784a"));
    bb.add(quad(V(-2.2, 0.6, 0), V(-2.9, 0.6, 0), V(-2.9, 1.4, 0), V(-2.2, 1.4, 0)), lam("deSm", () => ({ map: kaiserFlag(), side: THREE.DoubleSide })));
  });
  bg.position.set(-20, 0.02, 0.6);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { harbor, throne, cabin: cabinSet, consulate };

// ---------------- dynamic ----------------
const shotT0 = (id: number) => SHOTS[id - 1].a / FPS;
const setClock = (s: SetBuild, h: number, m: number) => {
  const am = (m / 60) * Math.PI * 2, ah = ((h % 12) / 12 + m / 720) * Math.PI * 2;
  s.dyn.minH.rotation.x = -am; s.dyn.hourH.rotation.x = -ah;
};
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  harbor: (s, t, id) => {
    waveFlags(s, t);
    // ships: shot 8 they steam in; from shot 8 on they are in the harbour
    FLEET.forEach(([x, z, ry], i) => {
      const g = s.dyn["ship" + i], arrive = id === 8 ? 1 - smooth((t - shotT0(8) - 0.25 * i) / 1.8) : id < 8 && id !== 1 && id !== 2 ? 1 : 0;
      g.visible = arrive < 0.999; g.position.set(x + 60 * arrive, 0.1 * Math.sin(t * 1.2 + i), z); g.rotation.z = 0.012 * Math.sin(t * 1.0 + i * 2);
    });
    // royal yacht: sinks in shot 14 after "sank"; gone afterwards
    const y = s.dyn.yacht, sk = id === 14 ? smooth((t - A(6, "yacht") + LEAD) / 0.75) : id > 14 && id < 21 ? 1 : 0;
    y.visible = sk < 0.98; y.position.set(YACHT[0], -2.2 * sk + 0.08 * Math.sin(t * 1.4), YACHT[2]); y.rotation.x = 0.5 * sk; y.rotation.z = 0.02 * Math.sin(t);
    // the gate: open, closes on "locked" (shot 10) and stays shut
    const lk = id === 10 ? smooth((t - A(4, "locked") + LEAD) / 0.5) : id > 10 && id < 21 ? 1 : 0, open = (1 - lk) * 1.25;
    s.dyn.doorL.rotation.y = open; s.dyn.doorR.rotation.y = -open;
    // clock: 8:58 by default; shot 12 ticks 9:00 -> 9:02; shot 17 shows 9:40
    let hh2 = 8, mm = 58;
    if (id === 12) { const tk = t < A(5, "902") - LEAD ? 0 : 2; hh2 = 9; mm = tk; }
    if (id >= 13 && id < 17) { hh2 = 9; mm = 2 + Math.min(30, (t - shotT0(13)) * 2); }
    if (id === 17) { hh2 = 9; mm = 40; }
    setClock(s, hh2, mm);
    // the palace flag falls in shot 17
    const fall = id === 17 ? smooth((t - A(7, "flag") + LEAD) / 0.7) : id > 17 && id < 21 ? 1 : 0;
    s.dyn.pole.rotation.x = 0; s.dyn.pole.rotation.z = -fall * 1.45; s.dyn.pole.visible = true;
  },
  consulate: (s, t, id) => {
    waveFlags(s, t);
    const bt = s.dyn.boat;
    if (id === 19) { const u = smooth((t - A(8, "boat") + LEAD + 0.3) / 2.0); bt.position.set(-20 + 20 * u, 0.04 + 0.05 * Math.sin(t * 2), 0.9); bt.visible = true; }
    else { bt.visible = false; }
  },
};

// ---------------- staging ----------------
type StageFn = (c: Ctx) => void;
const KHA = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 1, KHALID, "kha", x, z, fo, scale, y);
const RAW = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 2, RAWSON, "raw", x, z, fo);
const CAV = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 3, CAVE, "cave", x, z, fo);
const GCON = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 4, GCONSUL, "gcon", x, z, fo);
const serv = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act) => pose(c, 10 + (k % 3), SERVANT(k), `sv${k % 3}`, x, z, fo);
const ask = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 20 + (k % 3), ASKARI(k % 3), `as${k % 3}`, x, z, fo, scale, y);
const sail = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 30 + (k % 3), SAILOR(k % 3), `sa${k % 3}`, x, z, fo, scale, y);
const gsail = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 40 + (k % 2), GSAILOR(k % 2), `gs${k % 2}`, x, z, fo, scale, y);
const clockCard = (c: Ctx, at0: number, h: number, m: number, p: V3, s = 0.8) => { if (!after(c.t, at0)) return; const k = pop(c.t, at0); card(c, `clk${h}_${m}`, 400, 400, fxClock(h, m), p, s * k, s * k); };
const stopCard = (c: Ctx, at0: number, txt0: string, p: V3, s = 0.8, col?: string) => { if (!after(c.t, at0)) return; const k = pop(c.t, at0); card(c, `stp${txt0}${col}`, 400, 420, fxStop(txt0, col), p, s * k, 1.05 * s * k); };
const fire = (c: Ctx, p: V3, w: number, seed: number) => { const k = q(((c.t * 1.6 + hh(seed, 2)) % 1), 6); card(c, `fire${k}`, 300, 300, fxFire(k), p, w, w); };
const smoke = (c: Ctx, p: V3, w: number, seed: number, rise = 0) => { const k = q(((c.t * 0.25 + hh(seed, 3)) % 1), 8); card(c, `smk${k}`, 400, 400, fxSmoke(k), [p[0], p[1] + rise * k, p[2]], w, w); };
/** the palace burning (from "boom" on) */
const burning = (c: Ctx, strength = 1) => {
  const { xf, zc } = PAL;
  [[xf + 0.5, 5.2, zc - 4], [xf + 0.5, 8.6, zc + 2.5], [xf + 0.4, 9.2, zc - 1.0], [xf - 2, 11.6, zc + 4]].forEach(([x, y, z], i) => fire(c, [x, y, z] as V3, 2.4 * strength, i));
  [[xf - 1, 14, zc - 2], [xf - 3, 17, zc + 2], [xf - 2, 20, zc]].forEach(([x, y, z], i) => smoke(c, [x, y, z] as V3, 7 * strength, i + 10, 2));
};
const fleetFire = (c: Ctx, at0: number, n = 5) => {
  FLEET.slice(0, n).forEach(([x, z, ry, L], i) => { const t0 = at0 + 0.12 * i; puff(c, t0, [x - 1.5, L * 0.08 + 1.2, z + 2], 6, 0.9); puff(c, t0 + 0.6, [x - 1.5, L * 0.08 + 1.2, z - 3], 5, 0.9); });
};
const askariRows = (c: Ctx, expr: FrontOpts["expr"], n = 14, x0 = -4.8) => {
  for (let k = 0; k < n; k++) { const r = Math.floor(k / 7), j = k % 7; ask(c, k, x0 - 1.4 * r, PAL.zc - 4.2 + 1.4 * j + 0.7 * (r % 2), { mode: "stand", expr, look: 1, prop: k % 2 ? "rifleH" : null }, 1, 0.4); }
};

export const STAGE: Record<number, StageFn> = {
  // 1 The shortest war in history lasted thirty-eight minutes.
  1: (c) => {
    const t = c.t;
    banner(c, A(0, "shortest") , "SHORTEST WAR IN HISTORY", [-3, 13.5, -8], 9, "#b8283a", 2.6);
    stopCard(c, A(0, "38"), "38:00", [-1.0, 9.5, -4], 4.2);
    if (after(t, A(0, "38"))) word(c, A(0, "38"), "38 MINUTES", [-1.0, 5.6, -4], 6.5, 1.2, "#fff3b0");
  },
  // 2 That's shorter than your lunch break.
  2: (c) => {
    const t = c.t, lu = A(0, "lunch");
    sail(c, 0, -1.0, 2.6, { mode: "sit", expr: after(t, lu) ? "shock" : "smile", look: 0.6, prop: "banana" }, 1, 0.3);
    stopCard(c, A(0, "that's"), "38:00", [-2.0, 2.7, 1.8], 0.75);
    if (after(t, lu)) { stopCard(c, lu, "60:00", [-0.3, 2.7, 1.8], 0.7, "#2f6ab5"); word(c, lu, "LUNCH > WAR", [-1.0, 2.0, 2.2], 1.4, 1.4, "#fff3b0"); }
  },
  // 3 It's 1896, on the island of Zanzibar.
  3: (c) => {
    const t = c.t;
    if (after(t, A(1, "1896"))) stay(c, A(1, "1896"), "cal1896", 300, 340, (p) => fxCal(p, "1896", true), [-2, 12.5, -2], 3.0, 3.4, 0.05);
    banner(c, A(1, "zanzibar."), "ZANZIBAR", [-4, 15.5, -6], 9, "#1e6a8a", 2.4);
  },
  // 4 The Sultan dies suddenly...
  4: (c) => {
    const t = c.t;
    serv(c, 0, -3.6, -3.4, { mode: "stand", expr: "sad", look: -0.6 });
    serv(c, 1, -5.8, -3.6, { mode: "stand", expr: "sad", look: 0.6 });
    if (after(t, A(1, "sultan"))) banner(c, A(1, "sultan"), "SULTAN HAMAD", [-4.7, 4.2, -5.9], 1.7, "#3a3a44", 2.0);
  },
  // 5 and within hours, his cousin Khalid moves into the palace and crowns himself.
  5: (c) => {
    const t = c.t, kh = A(1, "khalid"), cr = A(1, "crowns");
    const walk = 1 - smooth((t - kh + 0.3) / 1.4), x = 3.2 * walk, z = -3.4 + 1.2 * walk;
    KHA(c, x, z, { mode: walk > 0.05 ? "march" : "stand", phase: (t * 1.6) % 1, expr: after(t, cr) ? "smug" : "grin", look: walk > 0.05 ? -0.8 : 0.2, prop: after(t, cr) && !after(t, cr + 0.7) ? "handsUp" : null, dy: hop(t, cr, 0.06, 0.25) }, 1, 0.35 * (1 - walk));
    if (after(t, kh)) banner(c, kh, "KHALID BIN BARGHASH", [0, 3.4, -3.2], 1.7, "#b8283a", 2.0);
    if (after(t, cr)) { const k = pop(t, cr); card(c, "crown", 320, 260, fxCrown, [x, 2.35 + 0.35 * (1 - smooth((t - cr + LEAD) / 0.35)), z + 0.05], 0.42 * k, 0.34 * k); }
    serv(c, 2, -2.6, -2.2, { mode: "stand", expr: after(t, cr) ? "shock" : "nervous", look: 0.6 });
  },
  // 6 The problem? Britain had a rule: no new sultan without their permission.
  6: (c) => {
    const t = c.t, ru = A(2, "rule:");
    CAV(c, 0.0, -2.85, { mode: "stand", expr: after(t, ru) ? "smug" : "stern", look: 0.2, prop: after(t, ru) ? "point" : null });
    if (after(t, A(2, "britain"))) banner(c, A(2, "britain"), "BRITISH CONSUL", [0, 2.35, -1.9], 1.3, "#1e2a4a", 1.4);
    if (after(t, ru)) stay(c, ru, "rule", 520, 640, fxRule, [0.75, 1.75, -1.9], 0.6, 0.74, -0.05);
  },
  // 7 Khalid didn't ask.
  7: (c) => {
    const t = c.t, da = A(2, "didn't");
    KHA(c, 0, -3.6, { mode: "stand", expr: after(t, da) ? "smug" : "grin", look: 0.1, prop: after(t, da) ? "shrug" : null, lean: jolt(t, da, 0.05) }, 1, 0.35);
    card(c, "crown", 320, 260, fxCrown, [0, 2.35, -3.55], 0.42, 0.34);
    if (after(t, da)) word(c, da, "DIDN'T ASK", [0, 2.95, -3.2], 1.0, 1.2, "#ffd0c0");
  },
  // 8 So Britain parked five warships in the harbour...
  8: (c) => {
    const t = c.t;
    if (after(t, A(3, "five"))) banner(c, A(3, "five"), "+ 5 WARSHIPS", [34, 11, -31], 10, "#1e2a4a", 2.0);
    if (after(t, A(3, "parked"))) word(c, A(3, "parked"), "PARKED.", [25, 7.5, -22], 6, 1.0, "#fff3b0");
  },
  // 9 and sent a message: leave the palace by nine a.m. tomorrow.
  9: (c) => {
    const t = c.t;
    RAW(c, 0.0, -2.85, { mode: "stand", expr: "stern", look: 0.2, prop: after(t, A(3, "message:")) ? "leaflet" : null });
    if (after(t, A(3, "sent"))) banner(c, A(3, "sent"), "REAR-ADMIRAL RAWSON", [0, 2.35, -1.9], 1.4, "#1e2a4a", 1.6);
    if (after(t, A(3, "leave"))) stay(c, A(3, "leave"), "ultimatum", 520, 640, fxUltimatum, [-0.36, 1.92, -1.7], 0.4, 0.74, -0.04);
  },
  // 10 Khalid's answer? He locked the gates, gathered nearly three thousand men...
  10: (c) => {
    const t = c.t, lk = A(4, "locked"), th = A(4, "3,000");
    KHA(c, PAL.xf + 1.0, PAL.zc - 2.7, { mode: "stand", expr: after(t, lk) ? "smug" : "stern", look: 0.8, prop: after(t, lk) ? "point" : null }, 1, 0.4);
    askariRows(c, "stern", after(t, th) ? 21 : 7);
    if (after(t, th)) banner(c, th, "~3,000 MEN", [PAL.xf + 1, 4.6, PAL.zc], 3.6, "#b8283a", 1.8);
    if (after(t, lk)) word(c, lk, "LOCKED!", [PAL.xf + 1.0, 3.6, PAL.zc + 2.2], 1.6, 1.0, "#fff3b0");
  },
  // 11 and pointed his one royal yacht at five British warships.
  11: (c) => {
    const t = c.t;
    if (after(t, A(4, "yacht"))) banner(c, A(4, "yacht"), "THE ROYAL YACHT", [YACHT[0], 4.6, YACHT[2]], 3.6, "#b8283a", 1.4);
    if (after(t, A(4, "five"))) banner(c, A(4, "five"), "VS 5 WARSHIPS", [11, 4.6, -5], 4.4, "#1e2a4a", 1.6);
    if (after(t, A(4, "british"))) sayB(c, A(4, "british"), "...UH OH", [YACHT[0] - 1, 4.4, YACHT[2] + 2], 3.0, 1.6);
  },
  // 12 Nine a.m. Nothing. Nine-oh-two.
  12: (c) => {
    const t = c.t;
    if (after(t, A(5, "nothing."))) card(c, `crk${q((t * 2) % 1, 2)}`, 600, 300, (p) => fxWord(p, "...", "#e8f0ff"), [TOWER.x + 3, 13.5, TOWER.z + 3], 4, 2);
    if (after(t, A(5, "902"))) word(c, A(5, "902"), "9:02", [TOWER.x + 3, 14, TOWER.z + 4], 5, 1.4, "#ffb0a0");
  },
  // 13 Boom.
  13: (c) => {
    const t = c.t, bm = A(5, "boom.");
    fleetFire(c, bm - 0.15);
    word(c, bm, "BOOM!", [31, 9, -24], 11, 1.2, "#ffd28a");
  },
  // 14 The palace caught fire. The royal yacht sank.
  14: (c) => {
    const t = c.t;
    burning(c, after(t, A(6, "fire.")) ? 1 : 0.5);
    if (after(t, A(6, "sank."))) puff(c, A(6, "sank."), [YACHT[0], 1.2, YACHT[2]], 5, 0.9);
    if (after(t, A(6, "sank."))) word(c, A(6, "sank."), "SANK.", [YACHT[0], 5, YACHT[2]], 4, 1.1, "#d8ecff");
  },
  // 15 About five hundred people on Khalid's side were killed or wounded.   (played straight)
  15: (c) => {
    const t = c.t;
    burning(c, 1.1);
    if (after(t, A(6, "500"))) banner(c, A(6, "500"), "~500 KILLED OR WOUNDED", [0, 14, -4], 9, "#2a2a30", 3.0);
  },
  // 16 On the British side, one sailor got hurt. He recovered.
  16: (c) => {
    const t = c.t, rc = A(6, "recovered.");
    sail(c, 1, -0.4, -2.6, { mode: "stand", expr: after(t, rc) ? "grin" : "pained", look: 0.3, prop: after(t, rc) ? "salute" : null, dy: hop(t, rc, 0.08, 0.25) }, 1, 0.06);
    [0, 2].forEach((k, i) => sail(c, k, 1.0 + 0.9 * i, -3.6 - 0.3 * i, { mode: "stand", expr: "neutral", look: -0.6 }, 1, 0.06));
    if (after(t, A(6, "one"))) banner(c, A(6, "one"), "BRITISH LOSSES: 1 HURT", [0.2, 2.85, -2.5], 1.5, "#1e2a4a", 1.8);
    if (after(t, rc)) word(c, rc, "RECOVERED!", [0.2, 2.6, -2.4], 1.2, 1.2, "#c8f0c0");
  },
  // 17 At nine-forty, a shell knocked down the palace flag... and that was it. War over. Thirty-eight minutes.
  17: (c) => {
    const t = c.t;
    burning(c, 0.7);
    clockCard(c, A(7, "940"), 9, 40, [PAL.xf + 3, 15, PAL.zc + 6], 4.2);
    if (after(t, A(7, "over."))) banner(c, A(7, "over."), "WAR OVER", [PAL.xf + 6, 11.8, PAL.zc + 6], 7, "#3a3a44", 1.6);
  },
  // 18 And Khalid? He ran to the German consulate, and Germany refused to hand him over.
  18: (c) => {
    const t = c.t, rn = A(8, "ran"), rf = A(8, "refused");
    const u = smooth((t - rn + 0.2) / 1.6), x = -5 + 5 * u;
    KHA(c, x, -3.0 - 1.4 * u, { mode: u < 0.98 ? "march" : "stand", phase: (t * 2.6) % 1, expr: after(t, rf) ? "relief_open" : "nervous", look: u < 0.98 ? 1 : 0.4, lift: 80 }, 1, 0.26);
    GCON(c, 1.6, -5.4, { mode: "stand", expr: after(t, rf) ? "smug" : "stern", look: -0.5, prop: after(t, rf) ? "cross" : null }, );
    if (after(t, A(8, "german"))) banner(c, A(8, "german"), "GERMAN CONSULATE", [-1.4, 5.4, -5.2], 3.4, "#1e1e22", 1.8);
    if (after(t, rf)) sayB(c, rf, "NEIN.", [1.6, 2.7, -5.2], 0.9, 1.6);
  },
  // 19 Weeks later, a German boat rowed right up to the consulate's garden gate, and he stepped aboard without ever touching Zanzibar's soil.
  19: (c) => {
    const t = c.t, bt = A(8, "boat"), st = A(8, "stepped"), so = A(8, "soil.");
    const bx = -20 + 20 * smooth((t - bt + LEAD + 0.3) / 2.0);
    [-0.6, 0.6].forEach((dx, k) => gsail(c, k, bx + dx, 0.9, { mode: "sit", expr: "stern", look: k ? -0.5 : 0.5 }, 0.8, 0.25));
    const onB = after(t, st + 0.5), u = smooth((t - st + 0.1) / 0.6);
    KHA(c, onB ? bx + 1.4 : 0, onB ? 0.9 : -1.6 + 1.9 * u, { mode: onB ? "sit" : after(t, st) ? "march" : "stand", phase: (t * 1.8) % 1, expr: after(t, so) ? "smug" : "nervous", look: 0.5, dy: hop(t, st + 0.3, 0.1, 0.3) }, onB ? 0.8 : 1, onB ? 0.25 : 0.26);
    if (after(t, A(8, "weeks"))) stay(c, A(8, "weeks"), "weeks", 600, 300, (p) => fxWord(p, "WEEKS LATER", "#fff3b0"), [-1.4, 3.3, 1.6], 2.2, 1.3, 0.04);
    if (after(t, so)) word(c, so, "NEVER TOUCHED THE GROUND!", [1.15, 2.45, 0.9], 1.9, 1.6, "#c8f0c0");
  },
  // 20 Oh, and the best part? Britain made Khalid's supporters pay for the shells they'd been shot with.
  20: (c) => {
    const t = c.t, pay = A(9, "pay");
    CAV(c, 1.4, -2.9, { mode: "stand", expr: after(t, pay) ? "smug" : "grin", look: -0.6, prop: after(t, pay) ? "point" : null });
    [0, 1, 2].forEach((k) => serv(c, k, -1.2 - 0.9 * k, -3.2 - 0.3 * (k % 2), { mode: "stand", expr: after(t, pay) ? "shock" : "nervous", look: 0.7, dy: hop(t, pay + 0.05 * k, 0.08, 0.25) }));
    if (after(t, A(9, "best"))) word(c, A(9, "best"), "THE BEST PART", [0, 3.1, -2.6], 1.5, 1.2, "#fff3b0");
    if (after(t, pay)) stay(c, pay, "invoice", 520, 640, fxInvoice, [0.6, 1.75, -2.0], 0.62, 0.76, 0.05);
  },
  // 21 Send this to the friend who takes longer to order food than this war lasted.   (ends on shot 1's opening frame)
  21: (c) => {
    const t = c.t;
    banner(c, A(10, "send"), "SEND THIS TO THAT FRIEND", [-3, 13.5, -8], 9, "#e07a1a", 2.0);
    if (after(t, A(10, "order"))) stopCard(c, A(10, "order"), "38:00", [-1.0, 9.5, -4], 4.2);
  },
};
