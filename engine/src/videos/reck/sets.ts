// Places and cast of "Sergeant Reckless" (1952-59; 9:16 short).
// Direction sheet: a Korean racetrack in autumn, a snowy Marine camp of squad tents, the dusk battle on Outpost Vegas
// (flooded paddies, a scarred hill, shell bursts), and a sunny Camp Pendleton parade. Palette: Marine olive / chestnut
// mare / Marine scarlet + gold / dusk orange. DEPTH: paddy dikes and wire at the lens, tent ropes, the ranks of Marines.
// Key moments: $250, FLAME -> RECKLESS, eggs/Coke/beer, the poker chips, 51 trips up the hill alone, the bandage, the
// promotion. Avoid: gore, background voices, music, faces filling the frame.
import * as THREE from "three";
import { VfxRig, stoveSmoke, battle } from "./vfx";
import { Batch, boxGeo, V, lam, M4, plane, hills, beamBetween, palm } from "./props3d";
import { Kit, quad, tri } from "./build";
import { rep, ctex, rng } from "./paint";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, fxScore, rrect, txt, fxDoc, fxThink, fxPlane, fxX } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS, TOTAL } from "./story";
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



// ---------------- textures ----------------
const dirt = (key: string, base: string, spot: string) => ctex("dirt" + key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 7000; k++) { g.fillStyle = r() < 0.5 ? spot : "rgba(255,255,255,0.06)"; const s = 2 + 6 * r(); g.fillRect(1024 * r(), 1024 * r(), s, s); }
});
const snowGround = () => ctex("snowG", 1024, 1024, (g, r) => {
  g.fillStyle = "#86745a"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 2500; k++) { g.fillStyle = r() < 0.5 ? "rgba(60,48,32,0.18)" : "rgba(160,140,110,0.18)"; g.fillRect(1024 * r(), 1024 * r(), 6 + 10 * r(), 4 + 6 * r()); }
  for (let k = 0; k < 26; k++) { const x = 1024 * r(), y = 1024 * r(), rx = 60 + 160 * r(), ry = 30 + 70 * r(); const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, "rgba(242,244,248,0.95)"); gr.addColorStop(0.7, "rgba(236,238,242,0.8)"); gr.addColorStop(1, "rgba(236,238,242,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, 6.3); g.fill(); }
});
const hillTex = () => ctex("hillK", 1024, 1024, (g, r) => { // scarred Korean hillside: brown earth, dead scrub, shell craters
  g.fillStyle = "#7a6446"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 2500; k++) { g.fillStyle = r() < 0.5 ? "rgba(96,84,52,0.5)" : "rgba(150,124,86,0.35)"; g.fillRect(1024 * r(), 1024 * r(), 4 + 10 * r(), 3 + 6 * r()); }
  for (let k = 0; k < 40; k++) { const x = 1024 * r(), y = 1024 * r(), s = 14 + 30 * r(); g.fillStyle = "rgba(50,38,26,0.6)"; g.beginPath(); g.ellipse(x, y, s, s * 0.6, 0, 0, 6.3); g.fill(); g.strokeStyle = "rgba(170,140,100,0.5)"; g.lineWidth = 3; g.stroke(); }
});
const paddyTex = () => ctex("paddy", 512, 512, (g, r) => { // flooded paddy: sky-grey water with stubble rows
  g.fillStyle = "#8ea2a8"; g.fillRect(0, 0, 512, 512);
  for (let y = 10; y < 512; y += 22) for (let x = 6; x < 512; x += 16) { g.fillStyle = "rgba(90,84,52,0.65)"; g.fillRect(x + 4 * r(), y + 4 * r(), 3, 7); }
  for (let k = 0; k < 30; k++) { g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(512 * r(), 512 * r(), 40 + 60 * r(), 2); }
});
const tentTex = () => ctex("tentK", 512, 512, (g, r) => {
  g.fillStyle = "#6a6a44"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 2000; k++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"; g.fillRect(512 * r(), 512 * r(), 3, 3); }
  for (let x = 0; x < 512; x += 128) { g.fillStyle = "rgba(40,40,20,0.25)"; g.fillRect(x, 0, 4, 512); }
});
const sandbagTex = () => ctex("sbag", 512, 256, (g, r) => {
  g.fillStyle = "#6a5a3a"; g.fillRect(0, 0, 512, 256);
  for (let row = 0; row < 4; row++) for (let k = -1; k < 6; k++) { const x = k * 96 + (row % 2) * 48, y = row * 64; g.fillStyle = r() < 0.5 ? "#a8946a" : "#b8a478"; g.beginPath(); g.ellipse(x + 48, y + 32, 46, 28, 0, 0, 6.3); g.fill(); g.strokeStyle = "rgba(60,48,30,0.6)"; g.lineWidth = 3; g.stroke(); }
});
const usFlag = () => ctex("usflag", 380, 200, (g) => {
  for (let k = 0; k < 13; k++) { g.fillStyle = k % 2 ? "#f4f4f2" : "#b22234"; g.fillRect(0, k * 200 / 13, 380, 200 / 13 + 1); }
  g.fillStyle = "#3c3b6e"; g.fillRect(0, 0, 152, 108);
  g.fillStyle = "#fff"; for (let y = 0; y < 9; y++) for (let x = 0; x < (y % 2 ? 5 : 6); x++) { g.beginPath(); g.arc(13 + x * 25 + (y % 2) * 12, 9 + y * 11, 3, 0, 6.3); g.fill(); }
});
const usmcFlag = () => ctex("usmcflag", 380, 200, (g) => {
  g.fillStyle = "#b8202a"; g.fillRect(0, 0, 380, 200);
  g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(190, 95, 52, 0, 6.3); g.fill(); g.fillStyle = "#b8202a"; g.beginPath(); g.arc(190, 95, 40, 0, 6.3); g.fill();
  g.fillStyle = "#e8c45a"; g.fillRect(150, 92, 80, 8); g.fillRect(186, 50, 8, 90);
  g.font = "bold 22px Georgia"; g.textAlign = "center"; g.fillText("UNITED STATES MARINE CORPS", 190, 185);
});

// ---------------- props ----------------
const jeep = (b: Batch, x: number, z: number, ry: number, col = "#5a6238") => { // an open Willys jeep, nose to +x, white star
  const m = M4(x, 0, z, ry, 1), Y = C(col), D = C("#22242a");
  b.add(new THREE.CircleGeometry(0.28, 5).rotateZ(Math.PI / 2).translate(0.15, 0.78, 0.81), C("#f4f0e6"), m);
  b.add(boxGeo(V(-1.7, 0.45, -0.8), V(1.7, 1.05, 0.8)), Y, m);
  b.add(boxGeo(V(0.6, 1.05, -0.8), V(1.7, 1.15, 0.8)), Y, m); // hood
  b.add(boxGeo(V(1.68, 0.5, -0.6), V(1.75, 1.05, 0.6)), C("#3a3a3e"), m); // grille
  for (const zz of [-0.45, 0.45]) b.add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 12).rotateZ(Math.PI / 2).translate(1.76, 0.85, zz), lam("hl", () => ({ color: "#fff6d8", emissive: "#fff2c0", emissiveIntensity: 0.6 })), m);
  b.add(boxGeo(V(0.55, 1.05, -0.78), V(0.6, 1.6, 0.78)), C("#2a2e34"), m); // windscreen frame
  b.add(boxGeo(V(0.56, 1.1, -0.72), V(0.58, 1.55, 0.72)), lam("glassJ", () => ({ color: "#bcd8e8", transparent: true, opacity: 0.45 })), m);
  for (const zz of [-0.7, 0.7]) b.add(beamBetween(V(-0.9, 1.05, zz), V(-0.9, 1.9, zz), 0.04), D, m), b.add(beamBetween(V(-0.9, 1.9, zz), V(-0.2, 1.9, zz), 0.04), D, m);
  b.add(beamBetween(V(-0.9, 1.9, -0.7), V(-0.9, 1.9, 0.7), 0.04), D, m);
  for (const [xx, zz] of [[-0.6, -0.35], [-0.6, 0.35]]) b.add(boxGeo(V(xx - 0.3, 1.05, zz - 0.25), V(xx + 0.3, 1.25, zz + 0.25)), C("#5a3a2a"), m);
  for (const sx of [-1.1, 1.1]) for (const sz of [-0.82, 0.82]) b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 18).rotateX(Math.PI / 2).translate(sx, 0.42, sz), D, m);
  b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 18).rotateZ(Math.PI / 2).translate(-1.86, 0.95, 0), D, m); // spare
  b.add(boxGeo(V(1.7, 0.42, -0.85), V(1.85, 0.55, 0.85)), C("#8a8e94"), m); // bumper
};
const tanksUnused = (b: Batch, x: number, z: number) => {
  for (let k = 0; k < 4; k++) { const xx = x + 0.32 * k, zz = z + 0.1 * (k % 2); b.add(new THREE.CylinderGeometry(0.13, 0.13, 1.4, 14).translate(xx, 0.7, zz), C(k % 2 ? "#4a7a5a" : "#5a8a6a")); b.add(new THREE.SphereGeometry(0.13, 12, 8).translate(xx, 1.4, zz), C("#5a8a6a")); b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8).translate(xx, 1.56, zz), C("#c8ccd2")); }
};
const fence = (b: Batch, x0: number, z0: number, x1: number, z1: number, h = 1.8) => {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 0.16), W = C("#a8784a"), W2 = C("#966a40");
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u; b.add(new THREE.BoxGeometry(0.14, h + 0.05 * hh(i, 7), 0.03).translate(0, (h + 0.05 * hh(i, 7)) / 2, 0).rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate(x, 0, z), i % 2 ? W : W2); }
};

const tent = (b: Batch, x: number, z: number, s = 1, ry = 0) => { // a pyramidal squad tent with a stovepipe
  const T = lam("tentK", () => ({ map: tentTex() })), m = M4(x, 0, z, ry, s);
  b.add(new THREE.BoxGeometry(5, 1.5, 5).translate(0, 0.75, 0), T, m);
  b.add(new THREE.ConeGeometry(3.6, 2.6, 4, 1).rotateY(Math.PI / 4).translate(0, 2.8, 0), T, m);
  b.add(boxGeo(V(-0.7, 0, 2.49), V(0.7, 1.5, 2.52)), C("#2a2a1a"), m); // door flap open
  b.add(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8).translate(1.2, 3.1, 0.8), C("#3a3a3e"), m);
};
const sandbags = (b: Batch, x0: number, z0: number, x1: number, z1: number, h = 0.9, y = 0) => {
  const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
  b.add(new THREE.BoxGeometry(L, h, 0.6).translate(0, h / 2, 0).rotateY(-a).translate((x0 + x1) / 2, y, (z0 + z1) / 2), lam("sbag", () => ({ map: rep(sandbagTex(), Math.max(1, L / 2), 1) })));
};
const crate = (b: Batch, x: number, y: number, z: number, ry = 0, w = 0.9, h = 0.45, d = 0.5) => {
  const m = M4(x, y, z, ry, 1);
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), C("#7a6a3a"), m);
  b.add(boxGeo(V(-w / 2 - 0.01, h * 0.4, -d / 2 - 0.01), V(w / 2 + 0.01, h * 0.55, d / 2 + 0.01)), C("#5a4a2a"), m);
};
/** M20 75 mm recoilless rifle on its tripod ("the Reckless rifle"); muzzle toward +x */
const rifle = (b: Batch, x: number, y: number, z: number, ry = 0) => {
  const m = M4(x, y, z, ry, 1), G = C("#4a5034");
  b.add(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 12).rotateZ(Math.PI / 2).translate(0.2, 1.0, 0), G, m);
  b.add(new THREE.CylinderGeometry(0.14, 0.1, 0.5, 12).rotateZ(Math.PI / 2).translate(-0.85, 1.0, 0), G, m); // venturi breech
  b.add(boxGeo(V(-0.1, 1.05, -0.1), V(0.15, 1.2, 0.1)), C("#2a2e24"), m);
  for (const [dx, dz] of [[0.6, 0], [-0.4, 0.45], [-0.4, -0.45]]) b.add(beamBetween(V(0, 0.95, 0), V(dx, 0, dz), 0.025), C("#3a3e2a"), m);
};
const tree = (b: Batch, x: number, z: number, h: number, col: string, seed: number) => {
  const r = rng(seed);
  b.add(new THREE.CylinderGeometry(0.1, 0.18, h * 0.55, 7).translate(x, h * 0.27, z), C("#5a4030"));
  for (let k = 0; k < 4; k++) b.add(new THREE.IcosahedronGeometry(h * (0.22 + 0.08 * r()), 1).translate(x + (r() - 0.5) * h * 0.35, h * (0.6 + 0.2 * r()), z + (r() - 0.5) * h * 0.3), lam("leaf" + col, () => ({ color: col })));
};
const flagpole = (s: SetBuild, x: number, z: number, h = 11) => {
  s.b.add(new THREE.CylinderGeometry(0.06, 0.09, h, 10).translate(x, h / 2, z), C("#e8e8e4"));
  s.b.add(new THREE.SphereGeometry(0.14, 10, 8).translate(x, h + 0.1, z), C("#e8c45a"));
  flag(s, "us", x, h - 0.2, z, 2.4, 1.3, usFlag);
};

// ---------------- the horse (2D toon card in the 3D world) ----------------
/** Reckless: a small chestnut Mongolian mare with a white blaze and three white stockings, facing right, 600 x 480.
 *  frame 0..3 = walk/trot cycle, 4 = standing. pack = loaded with recoilless rounds; rank 1 = sergeant blanket,
 *  2 = staff-sergeant blanket; eye: calm | wide | happy | chew (a mouthful); bandage over the left eye */
type RO = { pack?: boolean; rank?: number; eye?: "calm" | "wide" | "happy" | "chew"; bandage?: boolean; food?: string; flip?: boolean };
const LEG: [number, number, number, number][][] = [
  [[22, 62, 40, 124], [10, 66, 18, 128], [-16, 62, -34, 122], [-10, 66, -14, 128]],
  [[8, 66, 14, 128], [24, 58, 46, 118], [-6, 66, -10, 128], [-22, 58, -40, 120]],
  [[-12, 66, -16, 128], [6, 66, 12, 128], [16, 60, 36, 122], [4, 66, 8, 128]],
  [[26, 52, 52, 108], [12, 64, 24, 126], [-20, 60, -36, 122], [10, 66, 20, 126]],
  [[4, 62, 6, 128], [-6, 62, -4, 128], [6, 62, 4, 128], [-4, 62, -8, 128]],
];
const COAT = "#b8662e", COAT2 = "#9a5224", MANE = "#6a3418";
const fxReck = (frame: number, o: RO = {}) => (p: Pen) => {
  const g = p.g; g.save(); if (o.flip) { g.translate(600, 0); g.scale(-1, 1); }
  const L = LEG[frame % 5], bob = [0, -5, 0, 5, 0][frame % 5];
  const leg = (hx: number, hy: number, l: [number, number, number, number], col: string, sock: boolean) => {
    const k: P2 = [hx + l[0], hy + l[1]], f: P2 = [hx + l[2], hy + l[3]];
    p.stroke([[hx, hy], k, f], 24, col);
    if (sock) p.stroke([[k[0] + (f[0] - k[0]) * 0.45, k[1] + (f[1] - k[1]) * 0.45], f], 22, "#f4f0e6");
    p.ell(f[0], f[1] + 5, 15, 9, "#2a1e16", 4);
  };
  leg(405, 270 + bob, L[1], COAT2, false); leg(210, 270 + bob, L[3], COAT2, true);
  p.stroke([[160, 205 + bob], [118, 236 + bob], [108, 300 + bob], [118, 320 + bob]], 30, MANE);               // tail
  p.ell(300, 232 + bob, 148, 64, COAT, 9);                                                                     // body
  p.ell(300, 262 + bob, 110, 26, "rgba(255,230,200,0.25)", 0);                                                 // belly light
  p.poly([[392, 210 + bob], [440, 118 + bob], [476, 96 + bob], [505, 118 + bob], [458, 250 + bob]], COAT, 9);   // neck
  p.poly([[462, 88 + bob], [548, 104 + bob], [584, 142 + bob], [574, 170 + bob], [506, 166 + bob], [466, 130 + bob]], COAT, 9); // head
  p.ell(562, 152 + bob, 24, 18, "#d8a070", 5);                                                                 // muzzle
  p.ell(570, 146 + bob, 5, 4, "#3a1e10", 0);                                                                   // nostril
  p.poly([[470, 82 + bob], [482, 50 + bob], [496, 86 + bob]], COAT, 7); p.poly([[486, 84 + bob], [504, 56 + bob], [512, 92 + bob]], COAT2, 6); // ears
  p.poly([[500, 100 + bob], [512, 96 + bob], [556, 138 + bob], [546, 146 + bob]], "#f4f0e6", 0);              // blaze
  p.stroke([[450, 100 + bob], [424, 150 + bob], [402, 200 + bob]], 20, MANE); p.stroke([[488, 88 + bob], [500, 104 + bob]], 12, MANE); // mane + forelock
  // eye
  const ex = 516, ey = 116 + bob, eye = o.eye ?? "calm";
  if (eye === "happy") p.stroke([[ex - 11, ey + 2], [ex, ey - 7], [ex + 11, ey + 2]], 5, INK);
  else if (eye === "wide") { p.ell(ex, ey, 15, 15, "#ffffff", 4); p.ell(ex + 3, ey, 6, 6, INK, 0); }
  else { p.ell(ex, ey, 11, 12, INK, 0); p.ell(ex + 4, ey - 4, 4, 4, "#ffffff", 0); p.stroke([[ex - 13, ey - 13], [ex + 9, ey - 15]], 4, MANE); }
  if (o.bandage) { p.poly([[492, 96 + bob], [540, 92 + bob], [544, 112 + bob], [494, 118 + bob]], "#f6f4ee", 5); p.ell(518, 104 + bob, 5, 4, "#c84a4a", 0); }
  if (eye === "chew") { p.ell(578, 170 + bob, 14, 9, "#5a1e14", 0); if (o.food) p.ell(588, 168 + bob, 16, 12, o.food, 4); }
  else p.stroke([[548, 168 + bob], [574, 166 + bob]], 4, "#5a2e18");
  leg(385, 270 + bob, L[0], COAT, true); leg(230, 270 + bob, L[2], COAT, true);
  // halter
  p.stroke([[488, 104 + bob], [520, 150 + bob], [560, 132 + bob]], 6, "#8a2a24"); p.stroke([[520, 150 + bob], [500, 160 + bob]], 6, "#8a2a24");
  if (o.rank) { // the red-and-gold Marine blanket with chevrons (rank 2: + rocker)
    p.poly([[236, 176 + bob], [372, 176 + bob], [380, 266 + bob], [228, 266 + bob]], "#b8202a", 8);
    p.band([[232, 258 + bob], [376, 258 + bob]], "#e8c45a", 10, 0, "butt");
    for (let k = 0; k < 3; k++) p.stroke([[276, 214 + bob + 14 * k], [304, 196 + bob + 14 * k], [332, 214 + bob + 14 * k]], 9, "#e8c45a");
    if (o.rank > 1) p.stroke([[276, 246 + bob], [304, 254 + bob], [332, 246 + bob]], 9, "#e8c45a");
  }
  if (o.pack) { // wooden pack saddle + three 75 mm rounds slung along the near side
    p.poly([[250, 166 + bob], [360, 166 + bob], [366, 186 + bob], [244, 186 + bob]], "#7a5a34", 7);
    p.stroke([[262, 160 + bob], [276, 146 + bob]], 9, "#7a5a34"); p.stroke([[350, 160 + bob], [336, 146 + bob]], 9, "#7a5a34");
    for (let k = 0; k < 3; k++) { const y = 196 + 22 * k + bob; p.poly(rrect(236, y, 356, y + 18, 9), "#5a6238", 5); p.poly(rrect(352, y + 1, 382, y + 17, 8), "#d8a840", 4); }
    p.stroke([[300, 186 + bob], [300, 268 + bob]], 6, "#4a3a22");
  }
  g.restore();
};
/** place Reckless on the ground at (x, gy, z); w = card width (2.2 m reads as a 14-hand mare next to a 1.7 m Marine) */
const reck = (c: Ctx, x: number, gy: number, z: number, frame: number, o: RO = {}, w = 2.2, roll = 0) => {
  const h = w * 0.8;
  card(c, `rk${frame}${o.pack ? "p" : ""}${o.rank ?? 0}${o.eye ?? "c"}${o.bandage ? "b" : ""}${o.food ?? ""}${o.flip ? "f" : ""}`, 600, 480, fxReck(frame, o), [x, gy + 0.354 * h, z], w, h, { rot: roll });
  blob(c.out, x, gy, z, w * 0.55);
};
const walkF = (t: number, rate = 5) => Math.floor((TQ(t) * rate) % 4);

// ---------------- builders ----------------
// PARADE (Camp Pendleton, 1959): a green parade field, the flagpole left-back, white stucco barracks with red roofs at
// z -22, palms and dry hills; two ranks of Marines in dress blues at z -3.5 / -5; Reckless stands centre; General Pate
// at (1.3, 0.6). Depth: the near rank's shoulders and a guidon pole at the lens.
const parade = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-60, 60, -60, 40, 1, 0), lam("grassP", () => ({ map: rep(dirt("gp", "#6e9a42", "rgba(40,80,30,0.35)"), 16, 16) })));
  b.add(plane(-60, 60, -1.5, 2.5, 1, 0.01), lam("asphP", () => ({ map: rep(dirt("ap", "#7a7a76", "rgba(0,0,0,0.12)"), 20, 1) })));
  for (let k = 0; k < 5; k++) {
    const x = -24 + 12 * k;
    b.add(boxGeo(V(x - 5, 0, -26), V(x + 5, 4.2, -20)), lam("stucP", () => ({ color: "#f2ead8" })));
    b.add(new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4).scale(8, 1.6, 4.6).translate(x, 5.0, -23), lam("roofP", () => ({ color: "#b8503a" })));
    for (let w = 0; w < 4; w++) b.add(boxGeo(V(x - 4 + 2.2 * w, 1.4, -19.99), V(x - 3 + 2.2 * w, 2.8, -19.95)), C("#5a7a9a"));
  }
  for (const [x, z, h, sd] of [[-16, -16, 13, 1], [-6, -18, 15, 2], [9, -17, 14, 3], [19, -15, 12, 4]] as [number, number, number, number][]) palm(b, x, z, h, sd);
  hills(b, 0, -60, 160, 16, 22, 3);
  flagpole(s, -5.5, -9);
  flag(s, "usmc", 5.5, 2.6, -6.2, 0.9, 0.6, usmcFlag); b.add(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 8).translate(5.5, 1.4, -6.2), C("#c8a86a"));
};
// TRACK (Seoul racetrack, Oct 1952): dirt oval along x with white rails at z -2.5 and z 6, a wooden grandstand at z -16,
// stable sheds left, autumn trees, bare hills. The stable boy holds Flame at (-0.6, 0.4); Lt. Pedersen at (1.4, 0.8).
const track = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-80, 80, -60, 40, 1, 0), lam("grassT", () => ({ map: rep(dirt("gt", "#9a9a5a", "rgba(120,90,50,0.35)"), 16, 16) })));
  b.add(plane(-80, 80, -9, 4.5, 1, 0.01), lam("dirtT", () => ({ map: rep(dirt("dt", "#a8805a", "rgba(80,56,30,0.35)"), 24, 3) })));
  for (const z of [-9.2, 10.5]) { for (let x = -60; x <= 60; x += 2.4) b.add(new THREE.BoxGeometry(0.08, 1.0, 0.08).translate(x, 0.5, z), C("#f4f4f0")); b.add(boxGeo(V(-60, 0.95, z - 0.05), V(60, 1.05, z + 0.05)), C("#f4f4f0")); }
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-14, 0.5 * k, -18 - 1.0 * k), V(14, 0.5 * k + 0.5, -17 - 1.0 * k)), C(k % 2 ? "#8a6a48" : "#7a5c3c"));
  b.add(boxGeo(V(-14.5, 5.6, -25), V(14.5, 5.8, -16.5)), C("#5a4a3a")); for (const x of [-14, -7, 0, 7, 14]) b.add(new THREE.BoxGeometry(0.2, 5.6, 0.2).translate(x, 2.8, -16.8), C("#5a4a3a"));
  for (let k = 0; k < 3; k++) { const x = -26 + 6 * k; b.add(boxGeo(V(x - 2.6, 0, -6), V(x + 2.6, 2.6, -2)), C("#8a6a48")); b.add(new THREE.BoxGeometry(5.8, 0.2, 4.8).rotateX(-0.2).translate(x, 2.9, -4), C("#4a4a50")); b.add(boxGeo(V(x - 0.6, 0, -1.99), V(x + 0.6, 1.8, -1.95)), C("#3a2a1e")); }
  for (let k = 0; k < 12; k++) tree(b, -40 + 7.5 * k + 2 * hh(k, 1), -30 - 6 * hh(k, 2), 6 + 3 * hh(k, 3), ["#d8902a", "#c8642a", "#e8b84a", "#a8a03a"][k % 4], k);
  hills(b, 0, -70, 200, 14, 26, 9);
  sub(s, "jeep", (bb) => jeep(bb, 4.8, 1.8, -0.25));
};
// CAMP (Marine reserve camp behind the line, winter 1952-53): snow-patched earth, squad tents with smoking stovepipes,
// sandbag walls, a jeep, ammo crates; the mess table at (-1.6, -0.6); the poker table (an ammo crate under a blanket) at
// (1.6, 0.4); a recoilless rifle on its tripod right-back. Hills with snow behind.
const camp = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-60, 60, -60, 40, 1, 0), lam("earthC", () => ({ map: rep(dirt("ec", "#8a7a5e", "rgba(60,48,32,0.25)"), 14, 14) })));
  for (let k = 0; k < 40; k++) { const x = -24 + 48 * hh(k, 1), z = -26 + 34 * hh(k, 2); if (Math.abs(x) < 3.5 && z > -2) continue; b.add(new THREE.CircleGeometry(1, 20).scale(1.2 + 2.4 * hh(k, 3), 0.7 + 1.4 * hh(k, 4), 1).rotateX(-Math.PI / 2).rotateY(hh(k, 5) * 3).translate(x, 0.015, z), lam("snowP", () => ({ color: "#eef0f4" }))); }
  tent(b, -6.5, -7.5, 1, 0.1); tent(b, 1.5, -10, 1.1, -0.05); tent(b, 9, -7, 1, 0.2); tent(b, -14, -12, 1, 0.3);
  sandbags(b, -10, -3.5, -4, -4.2); sandbags(b, 5, -3.8, 12, -3.2);
  jeep(b, -8.5, 1.5, 0.5);
  for (let k = 0; k < 5; k++) crate(b, 4.8 + 0.95 * (k % 3), 0.45 * Math.floor(k / 3), -2.2, 0.05);
  rifle(b, 7.2, 0, 0.2, 2.6);
  // mess table: trestle + plates, mugs
  b.add(boxGeo(V(-2.8, 0.74, -1.0), V(-0.4, 0.8, -0.2)), C("#8a6a48"));
  for (const x of [-2.6, -0.6]) b.add(boxGeo(V(x - 0.05, 0, -0.95), V(x + 0.05, 0.74, -0.25)), C("#6a4a30"));
  for (let k = 0; k < 4; k++) { b.add(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 14).translate(-2.4 + 0.55 * k, 0.81, -0.6), C("#c8ccd2")); b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10).translate(-2.2 + 0.55 * k, 0.89, -0.85), C("#4a5a3a")); }
  // poker table: crate + grey blanket, two crates as seats
  crate(b, 1.6, 0, 0.4, 0, 1.2, 0.7, 0.8); b.add(boxGeo(V(0.95, 0.7, -0.05), V(2.25, 0.73, 0.85)), C("#6a6a72"));
  crate(b, 0.6, 0, 0.5, 0.2, 0.6, 0.4, 0.5); crate(b, 2.7, 0, 0.3, -0.2, 0.6, 0.4, 0.5);
  hills(b, 0, -60, 160, 16, 24, 5, lam("hillSnow", () => ({ color: "#d8d4cc" })) as never);
  sub(s, "chips", (bb) => { for (let k = 0; k < 14; k++) bb.add(new THREE.CylinderGeometry(0.035, 0.035, 0.012 * (1 + (k % 4)), 12).translate(1.2 + 0.07 * (k % 7) + 0.3 * Math.floor(k / 7), 0.74 + 0.006 * (1 + (k % 4)), 0.3 + 0.12 * Math.floor(k / 7)), C(["#c0353a", "#2a4a8a", "#f4f4f0", "#2a7a4a"][k % 4])); });
};
// FRONT (Outpost Vegas, March 1953, dusk): flooded rice paddies with dikes in front (z 0..20), a steep scarred hill rising
// from z -2 to the gun pit at (-1, ~15, -24); Reckless's zig-zag supply path climbs it. Shells burst along the slope.
export const HILL = (x: number, z: number) => { const u = clamp01((-2 - z) / 22); return 15.5 * (u * u * (3 - 2 * u)) + 1.2 * Math.sin(x * 0.35 + z * 0.2) * u + 0.5 * Math.sin(x * 0.9) * u; };
/** the supply path: u 0..1 from the ammo dump at the foot (2, 0, 3) up the zig-zags to the gun pit */
const PATH: [number, number][] = [[2.5, 4], [1.0, 0], [-2.5, -4], [2.5, -8], [-2.0, -12], [2.0, -16], [-1.5, -20], [-1.0, -23]];
export const pathAt = (u: number): V3 => {
  const n = PATH.length - 1, f = clamp01(u) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i;
  const x = PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, z = PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k;
  return [x, HILL(x, z), z];
};
const front = (s: SetBuild) => {
  const { b } = s;
  const geo = new THREE.PlaneGeometry(90, 50, 90, 50).rotateX(-Math.PI / 2).translate(0, 0, -25), P = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) P.setY(i, HILL(P.getX(i), P.getZ(i)) + (P.getZ(i) < -2 ? 0.25 * Math.sin(P.getX(i) * 1.7) * Math.cos(P.getZ(i) * 1.3) : 0));
  geo.computeVertexNormals(); b.add(geo, lam("hillK", () => ({ map: rep(hillTex(), 8, 5) })));
  // paddies + dikes
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x0 = -16 + 8 * i, z0 = -1 + 7 * j; b.add(plane(x0 + 0.3, x0 + 7.7, z0 + 0.3, z0 + 6.7, 1, 0.03), lam("paddy", () => ({ map: rep(paddyTex(), 2, 2) }))); }
  for (let i = 0; i <= 4; i++) b.add(boxGeo(V(-16 + 8 * i - 0.3, 0, -1), V(-16 + 8 * i + 0.3, 0.22, 20)), C("#6a5a3a"));
  for (let j = 0; j <= 3; j++) b.add(boxGeo(V(-16, 0, -1 + 7 * j - 0.3), V(16, 0.22, -1 + 7 * j + 0.3)), C("#6a5a3a"));
  // the path (packed lighter earth) as short flat strips
  for (let k = 0; k < 140; k++) { const a = pathAt(k / 140), c2 = pathAt((k + 1) / 140); const L = Math.hypot(c2[0] - a[0], c2[2] - a[2]); b.add(new THREE.BoxGeometry(0.9, 0.06, L + 0.05).rotateX(-Math.atan2(c2[1] - a[1], L)).rotateY(Math.atan2(c2[0] - a[0], c2[2] - a[2])).translate((a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2 + 0.03, (a[2] + c2[2]) / 2), C("#a88a62")); }
  // gun pit at the top
  const top = pathAt(1); sandbags(b, top[0] - 2.5, top[2] + 1.6, top[0] + 2.5, top[2] + 1.6, 0.6, top[1] - 0.3); sandbags(b, top[0] - 2.5, top[2] + 1.6, top[0] - 2.5, top[2] - 1.5, 0.9, top[1] - 0.3);
  rifle(b, top[0] + 0.6, top[1], top[2] - 0.3, -0.4);
  for (let k = 0; k < 3; k++) crate(b, top[0] - 1.6 + 0.95 * k, top[1], top[2] + 0.6, 0.1);
  // the ammo dump at the foot + dead trees, wire
  for (let k = 0; k < 6; k++) crate(b, 4.2 + 0.95 * (k % 3), 0.45 * Math.floor(k / 3), 5.5, 0.1);
  for (let k = 0; k < 9; k++) { const x = -12 + 3 * k, z = -6 - 9 * hh(k, 1); const y = HILL(x, z); b.add(new THREE.CylinderGeometry(0.06, 0.12, 3, 6).translate(x, y + 1.5, z).applyMatrix4(new THREE.Matrix4().makeRotationZ(0.1 * (hh(k, 2) - 0.5))), C("#2e2620")); }
  hills(b, 0, -80, 200, 12, 30, 11);
};
// sandbag heights use world y; shift the gun-pit bags up to the hilltop
const lift = (s: SetBuild) => void s;

export const BUILD: Record<SetId, (s: SetBuild) => void> = { parade, track, camp, front: (s) => { front(s); lift(s); } };

// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => ConstructorParameters<typeof VfxRig>[1]) => { let r = RIGS.get(s); if (!r) { r = new VfxRig(s.root, mk()); RIGS.set(s, r); } return r; };
/** shell bursts on the slope for a front shot: deterministic times/places from the shot start */
const BOOMS = (t0: number, t1: number, seed: number, near = false) => {
  const r = rng(seed), out: [number, V3][] = [];
  for (let t = t0 + 0.2 + 0.4 * r(); t < t1; t += 0.55 + 0.6 * r()) { const x = -8 + 16 * r(), z = near ? -2 - 10 * r() : -6 - 20 * r(); out.push([t, [x, HILL(x, z), z]]); }
  return out;
};

export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  parade: (s, t) => waveFlags(s, t),
  camp: (s, t, id) => { rig(s, () => stoveSmoke(T0s(id), [[-5.3, 3.8, -6.7], [2.8, 4.1, -9.1], [10.2, 3.8, -6.2]])).step(t); s.dyn.chips.visible = !(id === 9 && t > A(3, "poker") + 0.2) && id !== 18; },
  front: (s, t, id) => { const a = T0s(id), bE = SHOTS[id - 1].b / FPS; rig(s, () => battle(BOOMS(a - 1.5, bE + 0.5, id * 7, id === 11 || id === 15), a)).step(t); },
  track: (s, t) => { void s; void t; },
};

// ---------------- cast ----------------
const MARINE = (v: number): Outfit => ({ jacket: ["#5a6a3a", "#56663a", "#606e40"][v % 3], pants: "#4e5a34", boots: "#3a2a1e", hat: "m1", cap: "#4a5434", hatCol: "#4a5434", belt: "#7a6a3a", skin: SKINS[v % 3], moustache: v % 4 === 1 ? "#4a3020" : undefined } as Outfit);
const BLUES = (v: number): Outfit => ({ jacket: "#1e2440", pants: "#2a3a6a", boots: INK, hat: "peaked", cap: "#f4f4f0", hatCol: "#f4f4f0", buttons: "#e8c45a", belt: "#f4f4f0", skin: SKINS[v % 3] } as Outfit);
const GENERAL: Outfit = { jacket: "#1e2440", pants: "#2a3a6a", boots: INK, hat: "peaked", cap: "#f4f4f0", hatCol: "#f4f4f0", buttons: "#e8c45a", stripes: "#e8c45a", belt: "#e8c45a", skin: SKINS[0], hair: "#c8c8c0" } as Outfit;
const BOY: Outfit = { jacket: "#e8e0cc", pants: "#5a5a5a", boots: "#3a2a1e", hat: "hair", hair: "#141010", skin: SKINS[1] } as Outfit;
const LT: Outfit = { jacket: "#5a6a3a", pants: "#4e5a34", boots: "#3a2a1e", hat: "cap", cap: "#5a6a3a", skin: SKINS[0], buttons: "#e8c45a" } as Outfit;

// ---------------- effect drawings ----------------
const fxPrice = (p: Pen) => { p.poly([[40, 40], [400, 40], [470, 150], [400, 260], [40, 260]], "#fbf8ee", 9); p.ell(420, 150, 18, 18, "#d8d0c0", 5); txt(p, "$250", 210, 190, 120, "#2a7a3a", "900", "center", "Georgia, serif"); };
const fxLeg = (p: Pen) => { // the sister's new leg: a heart with a simple prosthetic leg drawing (400 x 400)
  p.poly([[200, 360], [50, 200], [70, 90], [150, 60], [200, 110], [250, 60], [330, 90], [350, 200]], "#f4a8b8", 8);
  p.poly(rrect(170, 120, 230, 250, 20), "#d8b890", 6); p.poly(rrect(182, 250, 218, 320, 10), "#a8a8b0", 5); p.poly([[160, 320], [240, 320], [250, 345], [160, 345]], "#5a3a22", 5);
};
const fxShell = (p: Pen) => { p.poly(rrect(40, 60, 480, 160, 50), "#5a6238", 9); p.poly(rrect(440, 70, 560, 150, 40), "#d8a840", 7); txt(p, "75 MM", 230, 130, 46, "#e8e4c8", "900", "center"); };
const fxFood = (p: Pen, k: number) => { // 300 x 300: eggs / Coca-Cola / beer
  if (k === 0) { p.ell(150, 170, 120, 90, "#c8ccd2", 8); p.ell(120, 160, 50, 32, "#fff6c8", 4); p.ell(180, 180, 54, 30, "#ffe27a", 4); p.ell(150, 150, 30, 20, "#ffd23a", 4); }
  else if (k === 1) { p.poly([[120, 40], [180, 40], [184, 90], [210, 140], [205, 270], [95, 270], [90, 140], [116, 90]], "#7a2a1e", 9); p.poly(rrect(92, 150, 208, 210, 4), "#e8262f", 4); txt(p, "Cola", 150, 192, 34, "#ffffff", "italic 900", "center", "Georgia, serif"); }
  else { p.poly(rrect(95, 60, 205, 270, 18), "#d8a040", 9); p.poly(rrect(95, 60, 205, 90, 10), "#c8ccd2", 6); p.poly(rrect(105, 140, 195, 210, 6), "#fbf8ee", 4); txt(p, "BEER", 150, 186, 30, "#8a3a1e"); }
};
const fxChips = (p: Pen) => { // a pile of poker chips + "$30"
  for (let k = 0; k < 9; k++) { const x = 90 + 60 * (k % 4) + 20 * Math.floor(k / 4), y = 200 - 20 * Math.floor(k / 4); p.ell(x, y, 40, 16, ["#c0353a", "#2a4a8a", "#f4f4f0", "#2a7a4a"][k % 4], 6); }
  txt(p, "$30", 200, 110, 90, "#2a7a3a", "900", "center", "Georgia, serif");
};
const fxCounter = (p: Pen, v: string, label: string) => { p.poly(rrect(20, 20, 480, 260, 30), "#fff3b0", 10); txt(p, v, 250, 150, 110, "#c0353a", "900", "center"); txt(p, label, 250, 225, 46, "#1e1a16", "900", "center"); };
const fxEmpty = (p: Pen) => { p.poly(rrect(30, 60, 470, 260, 10), "#7a6a3a", 9); p.band([[30, 150], [470, 150]], "#5a4a2a", 30, 0, "butt"); txt(p, "EMPTY", 250, 125, 80, "#f4f0e6", "900", "center"); };
const fxMedal = (p: Pen, k: number) => { // 300 x 400: Purple Heart / Good Conduct
  if (k === 0) { p.poly(rrect(100, 20, 200, 130, 4), "#5a2a7a", 6); p.band([[150, 20], [150, 130]], "#f4f4f0", 12, 0, "butt"); p.poly([[150, 380], [50, 250], [70, 170], [150, 190], [230, 170], [250, 250]], "#7a3a9a", 9); p.ell(150, 250, 36, 40, "#e8c45a", 5); }
  else { p.poly(rrect(100, 20, 200, 130, 4), "#c0353a", 6); for (const x of [115, 185]) p.band([[x, 20], [x, 130]], "#f4f4f0", 8, 0, "butt"); p.ell(150, 260, 100, 100, "#d8a840", 9); txt(p, "USMC", 150, 275, 40, "#5a3a10", "900", "center"); }
};
const fxPate = (p: Pen) => fxDoc(p, "UNITED STATES MARINE CORPS", ["Reckless, (horse)", "promoted to", "Staff Sergeant"], "1959", 1);

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;
const marine = (c: Ctx, i: number, v: number, x: number, z: number, fo: FrontOpts & Act = {}, y = 0) => pose(c, i, MARINE(v), "mar" + v, x, z, { mode: "stand", expr: "neutral", look: 0, ...fo }, 1, y);
const blues = (c: Ctx, i: number, v: number, x: number, z: number, fo: FrontOpts & Act = {}) => pose(c, i, BLUES(v), "blu" + v, x, z, { mode: "stand", expr: "stern", look: 0, ...fo });
/** the hook tableau: Reckless in her staff-sergeant blanket, the ranks saluting, the flag behind */
const hookParade = (c: Ctx, rank = 2) => {
  reck(c, 0, 0, 0.2, 4, { rank, eye: "calm" }, 2.3);
  for (let k = 0; k < 4; k++) blues(c, 2 + k, k, -2.4 + 1.6 * k, -3.6, { prop: "salute" as FrontOpts["prop"], expr: "stern" });
};

/** where Reckless is on the supply path during each climbing shot: u = u0 + rate * (t - shot start) */
const CLIMB: Record<number, [number, number]> = { 12: [0.06, 0.05], 13: [0.3, 0.035], 14: [0.52, 0.03], 15: [0.74, 0.025] };
export const climbU = (id: number, t: number) => clamp01(CLIMB[id][0] + (t - T0s(id)) * CLIMB[id][1]);

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1952, the U.S. Marines paid $250 for a racehorse.   (hook: Marines saluting a horse; the loop ends here)
  1: (c) => { hookParade(c); if (after(c.t, A(0, "1952,"))) stay(c, A(0, "1952,"), "cal52", 300, 340, (p) => fxCal(p, "1952", true), [-1.0, 2.2, 1.2], 0.5, 0.56, -0.06); },
  // 2 ...paid $250 (the racetrack: the price tag)
  2: (c) => {
    const t = c.t;
    reck(c, -0.4, 0, 0.3, 4, { eye: "calm" });
    pose(c, 2, BOY, "boy", -1.5, 0.9, { mode: "stand", expr: "sad", look: 0.4 });
    pose(c, 3, LT, "lt", 1.3, 0.9, { mode: "stand", expr: "smile", look: -0.5, prop: "bills" as FrontOpts["prop"] });
    if (after(t, A(0, "250"))) stay(c, A(0, "250"), "price", 500, 300, fxPrice, [0.6, 2.05, 1.2], 0.9, 0.54, -0.06);
  },
  // 3 She retired a Staff Sergeant.
  3: (c) => {
    const t = c.t;
    hookParade(c);
    if (after(t, A(0, "staff"))) banner(c, A(0, "staff"), "STAFF SERGEANT", [-0.2, 1.4, 1.7], 0.62, "#b8202a", 2.0);
  },
  // 4 Her name was Flame.
  4: (c) => {
    const t = c.t;
    reck(c, 0.3, 0, 0.2, 4, { eye: "calm" });
    pose(c, 2, BOY, "boy", -0.9, 0.8, { mode: "stand", expr: "smile", look: 0.4 });
    if (after(t, A(1, "flame."))) banner(c, A(1, "flame."), "“FLAME”", [0.3, 2.05, 0.8], 1.2, "#e07a1a", 2.2);
  },
  // 5 A Korean stable boy sold her to buy his sister an artificial leg.
  5: (c) => {
    const t = c.t, s = A(1, "sold");
    reck(c, 0.8, 0, 0.0, 4, { eye: "calm" });
    pose(c, 2, BOY, "boy", -0.4, 0.8, { mode: "stand", expr: t > s ? "sad" : "smile", look: 0.4 });
    pose(c, 3, LT, "lt", 2.1, 1.0, { mode: "stand", expr: "smile", look: -0.5 });
    if (after(t, A(1, "sister"))) stay(c, A(1, "sister"), "legH", 400, 400, fxLeg, [0.45, 2.0, 1.6], 0.6, 0.6, 0.04);
  },
  // 6 The Marines renamed her Reckless, after the recoilless rifle whose shells she'd carry.
  6: (c) => {
    const t = c.t;
    reck(c, -0.6, 0, 0.6, 4, { eye: "happy" });
    marine(c, 2, 0, 1.0, 0.9, { expr: "grin", look: -0.4, prop: "point" as FrontOpts["prop"] });
    if (after(t, A(2, "reckless,"))) banner(c, A(2, "reckless,"), "RECKLESS", [0.1, 2.0, 1.4], 1.0, "#2a4a8a", 2.0);
    if (after(t, A(2, "shells"))) stay(c, A(2, "shells"), "shell", 600, 220, fxShell, [0.25, 1.75, 1.6], 0.7, 0.26, -0.1);
  },
  // 7 Then she discovered Marine food.
  7: (c) => {
    const t = c.t;
    reck(c, -0.3, 0, 0.1, walkF(t), { eye: "wide", flip: false }, 2.2);
    marine(c, 2, 1, -2.0, -1.6, { expr: "shock", look: 0.5 });
  },
  // 8 Scrambled eggs. Coca-Cola. Beer.
  8: (c) => {
    const t = c.t, ws: [string, number][] = [["scrambled", 0], ["cocacola.", 1], ["beer.", 2]];
    const k = ws.filter(([w]) => t >= A(3, w) - LEAD).length;
    reck(c, -1.5, 0, 0.3, 4, { eye: "chew", food: ["#ffe27a", "#ffe27a", "#7a2a1e", "#d8a040"][k] });
    marine(c, 2, 2, 0.6, -0.1, { expr: "laugh", look: -0.5 });
    ws.forEach(([w, i]) => { if (after(t, A(3, w))) stay(c, A(3, w), "food" + i, 300, 300, (p) => fxFood(p, i), [-1.1 + 0.55 * i, 2.0 - 0.2 * (i % 2), 0.9], 0.45, 0.45, 0.06 * (i - 1)); });
  },
  // 9 Once, she ate about $30 worth of poker chips.
  9: (c) => {
    const t = c.t, pk = A(3, "poker");
    reck(c, 0.6, 0, -0.6, 4, { eye: t > pk ? "chew" : "calm", food: "#c0353a" });
    marine(c, 2, 0, 0.6, 1.0, { expr: t > pk ? "shock" : "smug", look: 0.3, prop: t > pk ? "handsUp" : null }, 0);
    marine(c, 3, 1, 2.7, 0.8, { expr: t > pk ? "shock" : "grin", look: -0.4 });
    if (after(t, A(3, "30"))) stay(c, A(3, "30"), "chips", 400, 300, fxChips, [1.6, 1.9, 1.2], 0.75, 0.56, 0.05);
  },
  // 10 March 1953. The Battle for Outpost Vegas.
  10: (c) => {
    const t = c.t;
    if (after(t, A(4, "march,"))) stay(c, A(4, "march,"), "cal53", 300, 340, (p) => fxCal(p, "MAR 1953", true), [3.0, 2.0, 10.6], 0.45, 0.5, 0.05);
    if (after(t, A(4, "outpost"))) banner(c, A(4, "outpost"), "OUTPOST VEGAS", [2.5, 2.85, 9.6], 1.5, "#b8202a", 2.2);
  },
  // 11 The guns on the hill were running out of shells, and the path up was under fire.
  11: (c) => {
    const t = c.t, top = pathAt(1);
    marine(c, 2, 0, top[0] - 0.6, top[2] + 0.4, { expr: "nervous", look: 0.3 }, top[1]);
    marine(c, 3, 1, top[0] + 0.9, top[2] + 0.2, { expr: "shock", look: -0.3, prop: "point" as FrontOpts["prop"] }, top[1]);
    if (after(t, A(5, "out"))) stay(c, A(5, "out"), "empty", 500, 300, fxEmpty, [top[0] + 0.1, top[1] + 1.95, top[2] + 1.4], 0.9, 0.54, 0.05);
  },
  // 12 Reckless made 51 trips in one day.
  12: (c) => {
    const t = c.t, u = climbU(12, t), pp = pathAt(u), n = Math.min(51, Math.max(1, Math.round(51 * clamp01((t - A(6, "51") + 0.1) / 1.0))));
    reck(c, pp[0], pp[1], pp[2], walkF(t, 6), { pack: true, eye: "calm", flip: (pathAt(u + 0.01)[0] - pp[0]) < 0 });
    if (after(t, A(6, "51"))) stay(c, A(6, "51"), "trips" + n, 500, 280, (p) => fxCounter(p, String(n), "TRIPS"), [pp[0] + 0.3, pp[1] + 1.85, pp[2] + 1.4], 0.8, 0.45, 0.04);
  },
  // 13 Mostly alone. Nobody leading her.
  13: (c) => {
    const t = c.t, u = climbU(13, t), pp = pathAt(u);
    reck(c, pp[0], pp[1], pp[2], walkF(t, 6), { pack: true, eye: "calm", flip: (pathAt(u + 0.01)[0] - pp[0]) < 0 });
    if (after(t, A(6, "nobody"))) word(c, A(6, "nobody"), "NO HANDLER", [pp[0], pp[1] + 2.2, pp[2] + 0.8], 1.1, 1.4, "#fff3b0");
  },
  // 14 Over 9,000 pounds of ammunition. 35 miles.
  14: (c) => {
    const t = c.t, u = climbU(14, t), pp = pathAt(u);
    reck(c, pp[0], pp[1], pp[2], walkF(t, 6), { pack: true, eye: "calm", flip: (pathAt(u + 0.01)[0] - pp[0]) < 0 });
    if (after(t, A(7, "9000"))) stay(c, A(7, "9000"), "lbs", 500, 280, (p) => fxCounter(p, "9,000+", "POUNDS"), [pp[0] - 0.4, pp[1] + 1.95, pp[2] + 1.2], 0.85, 0.48, -0.04);
    if (after(t, A(7, "35"))) stay(c, A(7, "35"), "miles", 500, 280, (p) => fxCounter(p, "35", "MILES"), [pp[0] - 0.75, pp[1] + 1.55, pp[2] + 1.6], 0.6, 0.34, 0.05);
  },
  // 15 Wounded twice... and she kept going.   (quiet: a bandage over her eye, she keeps climbing)
  15: (c) => {
    const t = c.t, u = climbU(15, t), pp = pathAt(u), w2 = A(7, "twice...");
    reck(c, pp[0], pp[1], pp[2], walkF(t, 4), { pack: true, eye: "calm", bandage: t > w2 - 0.6, flip: (pathAt(u + 0.01)[0] - pp[0]) < 0 });
  },
  // 16 She made Sergeant. Then, in 1959, the Commandant of the Marine Corps himself promoted her to Staff Sergeant.
  16: (c) => {
    const t = c.t, pr = A(8, "promoted");
    reck(c, 0, 0, 0.2, 4, { rank: t > pr ? 2 : 1, eye: t > pr ? "happy" : "calm" }, 2.3);
    pose(c, 2, GENERAL, "gen", 1.4, 0.7, { mode: "stand", expr: "smile", look: -0.5, prop: t > pr ? ("point" as FrontOpts["prop"]) : null });
    for (let k = 0; k < 3; k++) blues(c, 3 + k, k, -2.2 + 1.5 * k, -3.6, { prop: t > pr ? ("salute" as FrontOpts["prop"]) : null });
    if (after(t, A(8, "1959,"))) stay(c, A(8, "1959,"), "cal59", 300, 340, (p) => fxCal(p, "1959", true), [-0.1, 2.05, 2.0], 0.4, 0.45, -0.06);
    if (after(t, A(8, "commandant"))) stay(c, A(8, "commandant"), "pate", 500, 360, fxPate, [0.75, 2.0, 1.8], 0.62, 0.45, 0.05);
  },
  // 17 Two Purple Hearts. A Good Conduct Medal.
  17: (c) => {
    const t = c.t;
    reck(c, 0, 0, 0.2, 4, { rank: 2, eye: "happy" }, 2.3);
    if (after(t, A(9, "two"))) { stay(c, A(9, "two"), "ph0", 300, 400, (p) => fxMedal(p, 0), [-0.5, 1.8, 1.5], 0.36, 0.48, -0.08); stay(c, A(9, "two") + 0.25, "ph1", 300, 400, (p) => fxMedal(p, 0), [-0.12, 1.85, 1.5], 0.36, 0.48, 0.04); }
    if (after(t, A(9, "good"))) stay(c, A(9, "good"), "gc", 300, 400, (p) => fxMedal(p, 1), [0.32, 1.8, 1.5], 0.36, 0.48, 0.06);
  },
  // 18 From the horse who ate the poker chips.   (callback: she munches chips, the Marines crack up)
  18: (c) => {
    const t = c.t;
    reck(c, 0.7, 0, -0.5, 4, { rank: 2, eye: "chew", food: "#c0353a" });
    marine(c, 2, 0, 0.5, 1.0, { expr: "laugh", look: 0.3 }); marine(c, 3, 2, 2.6, 0.7, { expr: "laugh", look: -0.4 });
    if (after(t, A(9, "poker"))) word(c, A(9, "poker"), "CHOMP", [1.5, 1.9, 0.6], 0.8, 0.9, "#ffd0c0");
  },
  // 19 Send this to the friend who eats everything at the party.   (ends on shot 1's frame: loop)
  19: (c) => {
    const t = c.t, c0 = { ...c, t: c.t - (TOTAL - 1) / FPS };
    if (t >= A(10, "at") - 0.1) { STAGE[1](c0); return; }
    reck(c, 0, 0, 0.2, 4, { rank: 2, eye: "happy" }, 2.3);
    for (let k = 0; k < 4; k++) blues(c, 2 + k, k, -2.4 + 1.6 * k, -3.6, { expr: "laugh" });
    if (after(t, A(10, "send"))) banner(c, A(10, "send"), "SEND THIS TO THEM", [0.0, 2.35, 0.8], 1.5, "#e07a1a", 2.0);
  },
};
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void snowGround; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxScore; void jolt; void hop; void pop; void quad; void tri; void fxWord; void sway; void lidAt; void q; void tier; void person; void at; void rep; void ctex; void M4; void plane; void hills; void fxSay; void fxThink; void fxPlane; void fxX; void sayB; void puff;
