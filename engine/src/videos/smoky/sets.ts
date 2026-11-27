// Places and cast of "Smoky" (1944-45; 9:16 short).
// Direction sheet: a New Guinea jungle clearing (mud, ferns, a foxhole, a poker crate), the Lingayen airstrip on Luzon
// (sand, steel matting, P-38s, the 8-inch culvert under the taxiway) and the inside of that pipe. Palette: olive drab /
// steel-blue + tan Yorkie / sand / jungle green. Numbers land on objects in the scene (stencils, a tag, a chalkboard, a
// banknote, a stopwatch). Avoid: gore, background voices, music.
import * as THREE from "three";
import { VfxRig, battle, sandDrift, jungleAir, pipeDust } from "./vfx";
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


// ---------------- more textures ----------------
const sandTex = () => dirt("sand", "#d8c08a", "rgba(150,120,70,0.22)");
const mudTex = () => dirt("mud", "#8f7a4a", "rgba(70,56,28,0.3)");
/** Marston (PSP) steel matting: grey planks with rows of punched holes */
const pspTex = () => ctex("psp", 512, 512, (g, r) => {
  g.fillStyle = "#7a7e78"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, y, 512, 3); for (let x = 12 + (y % 128 ? 16 : 0); x < 512; x += 32) { g.fillStyle = "#3e3a30"; g.beginPath(); g.ellipse(x, y + 32, 9, 15, 0, 0, 6.3); g.fill(); } }
  for (let k = 0; k < 600; k++) { g.fillStyle = r() < 0.5 ? "rgba(150,110,60,0.18)" : "rgba(255,255,255,0.06)"; g.fillRect(512 * r(), 512 * r(), 6, 3); }
});
/** corrugated galvanised culvert: banded ribs with rust */
const pipeTex = () => ctex("pipeT", 512, 256, (g, r) => {
  for (let x = 0; x < 512; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, "#8a8e8a"); gr.addColorStop(0.5, "#c0c4be"); gr.addColorStop(1, "#7a7e7a"); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); }
  for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${120 + 40 * r()},${70 + 20 * r()},30,${0.25 + 0.3 * r()})`; g.beginPath(); g.ellipse(512 * r(), 256 * r(), 6 + 20 * r(), 4 + 10 * r(), 0, 0, 6.3); g.fill(); }
});
/** stencil lettering painted on things in the scene (huashu rule: numbers land on objects, not floating cards) */
const stencil = (key: string, w: number, h: number, lines: string[], bg: string | null, fg: string, size: number) => ctex("st" + key, w, h, (g) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.textAlign = "center"; g.font = `900 ${size}px "Courier New", monospace`;
  lines.forEach((s, i) => g.fillText(s, w / 2, h / 2 + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.05));
});
const fernTex = () => ctex("fern", 256, 256, (g) => {
  g.strokeStyle = "#2e6a2a"; g.lineWidth = 6;
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.32; g.beginPath(); g.moveTo(128, 250); g.quadraticCurveTo(128 + 80 * Math.cos(a), 250 + 140 * Math.sin(a), 128 + 120 * Math.cos(a) * 1.1, 250 + 230 * Math.sin(a)); g.stroke();
    for (let j = 1; j < 9; j++) { const u = j / 9, px = 128 + 120 * Math.cos(a) * 1.1 * u, py = 250 + 230 * Math.sin(a) * u; g.fillStyle = j % 2 ? "#3a8a34" : "#4a9a3e"; g.beginPath(); g.ellipse(px, py, 16 * (1 - u * 0.6), 5, a + 1.2, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(px, py, 16 * (1 - u * 0.6), 5, a - 1.2, 0, 6.3); g.fill(); } }
});

// ---------------- props ----------------
/** P-38 Lightning: twin booms, central nacelle, nose to +x, bare-metal / olive; ~11.5 m long, 15.8 m span */
const p38 = (b: Batch, x: number, y: number, z: number, ry = 0, s = 1, olive = false) => {
  const m = M4(x, y, z, ry, s), Mt = lam(olive ? "p38o" : "p38m", () => ({ color: olive ? "#5a6238" : "#b8bcc0" })), Dk = C("#2a2e34");
  b.add(new THREE.BoxGeometry(1.8, 0.22, 15.8).translate(0, 1.9, 0), Mt, m);                                  // wing
  for (const zz of [-2.4, 2.4]) {
    b.add(new THREE.CylinderGeometry(0.45, 0.3, 11, 14).rotateZ(Math.PI / 2).translate(-1.2, 1.9, zz), Mt, m); // boom
    b.add(new THREE.SphereGeometry(0.46, 14, 10).scale(1.6, 1, 1).translate(4.3, 1.9, zz), Mt, m);            // engine
    b.add(new THREE.CylinderGeometry(1.3, 1.3, 0.04, 20).rotateZ(Math.PI / 2).translate(5.1, 1.9, zz), lam("prop", () => ({ color: "#2a2e34", transparent: true, opacity: 0.35 })), m);
    b.add(new THREE.BoxGeometry(1.0, 1.6, 0.12).translate(-6.4, 2.5, zz), Mt, m);                              // fin
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 1.9, 8).translate(3.2, 0.95, zz), Dk, m);                     // gear leg
    b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 14).rotateX(Math.PI / 2).translate(3.2, 0.4, zz), Dk, m);
  }
  b.add(new THREE.BoxGeometry(0.9, 0.12, 5.2).translate(-6.4, 2.1, 0), Mt, m);                                 // tailplane
  b.add(new THREE.CylinderGeometry(0.55, 0.4, 5.4, 14).rotateZ(Math.PI / 2).translate(1.2, 2.05, 0), Mt, m);   // nacelle
  b.add(new THREE.SphereGeometry(0.42, 12, 8).scale(1.4, 0.9, 0.9).translate(1.0, 2.6, 0), lam("canopy", () => ({ color: "#8ab0c8", emissive: "#3a5a70", emissiveIntensity: 0.25 })), m);
  b.add(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8).translate(3.6, 1.0, 0), Dk, m);
  b.add(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 14).rotateX(Math.PI / 2).translate(3.6, 0.35, 0), Dk, m);
  b.add(new THREE.BoxGeometry(0.6, 0.02, 0.6).translate(1.4, 1.65, 7.0), C("#f4f4f0"), m);                     // star on wing
};
const spool = (b: Batch, x: number, z: number) => { // a telephone-wire drum
  for (const dz of [-0.22, 0.22]) b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 18).rotateX(Math.PI / 2).translate(x, 0.38, z + dz), C("#8a6a48"));
  b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 16).rotateX(Math.PI / 2).translate(x, 0.38, z), C("#2a2a2e"));
};
const shovel = (b: Batch, x: number, z: number, lean = 0.3, ry = 0) => {
  const m = M4(x, 0, z, ry, 1);
  b.add(beamBetween(V(0, 0.15, 0), V(lean, 1.2, 0), 0.025), C("#8a6a48"), m);
  b.add(new THREE.BoxGeometry(0.22, 0.28, 0.02).translate(0, 0.12, 0), C("#5a5e62"), m);
};
const fern = (s: SetBuild, x: number, z: number, sc = 1, ry = 0) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 * sc, 1.6 * sc).translate(0, 0.8 * sc, 0), new THREE.MeshLambertMaterial({ map: fernTex(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
  m.position.set(x, 0, z); m.rotation.y = ry; s.root.add(m);
  const m2 = m.clone(); m2.rotation.y = ry + Math.PI / 2; s.root.add(m2);
};

// ---------------- Smoky (2D toon card in the 3D world) ----------------
/** a 4-lb Yorkshire terrier, 600 x 400 canvas, facing right. frame 0..3 trot, 4 stand, 5 sit, 6 crawl (belly low),
 *  7 = face-on crawl (for inside the pipe). eye: calm | wide | happy | flat (deadpan); helmet; string = the line tied to
 *  her collar trailing back off the card; flip */
type SO = { eye?: "calm" | "wide" | "happy" | "flat"; helmet?: boolean; string?: boolean; flip?: boolean; tongue?: boolean };
const DLEG: [number, number][][] = [
  [[18, 70], [-6, 70], [14, 70], [-10, 70]], [[4, 72], [16, 66], [-4, 72], [-16, 66]], [[-14, 70], [8, 72], [12, 70], [-2, 72]], [[22, 62], [0, 72], [-18, 66], [8, 72]], [[4, 72], [-4, 72], [4, 72], [-4, 72]],
];
const BLUE = "#3a4a5e", TAN = "#c8945a", TAN2 = "#a8743e";
const fxDog = (frame: number, o: SO = {}) => (p: Pen) => {
  const g = p.g; g.save(); if (o.flip) { g.translate(600, 0); g.scale(-1, 1); }
  const eye = o.eye ?? "calm";
  if (frame === 7) { // face-on, belly to the ground, squeezing forward
    p.ell(300, 300, 150, 70, BLUE, 9);                                       // body seen head-on behind
    for (const sx of [-1, 1]) { p.ell(300 + 120 * sx, 340, 40, 22, TAN, 7); }  // front paws
    p.ell(300, 250, 105, 92, TAN, 9);                                         // head
    for (const sx of [-1, 1]) p.poly([[300 + 50 * sx, 185], [300 + 92 * sx, 90], [300 + 100 * sx, 196]], TAN2, 8); // ears up
    for (let k = 0; k < 9; k++) p.stroke([[300 + (k - 4) * 24, 300], [300 + (k - 4) * 26, 352]], 10, TAN2); // beard fringe
    for (const sx of [-1, 1]) { if (eye === "happy") p.stroke([[300 + 38 * sx - 14, 236], [300 + 38 * sx, 224], [300 + 38 * sx + 14, 236]], 6, INK); else { p.ell(300 + 38 * sx, 232, 15, 16, INK, 0); p.ell(300 + 38 * sx + 5, 226, 5, 5, "#ffffff", 0); } }
    p.ell(300, 272, 20, 14, "#1a1416", 0);
    if (o.string) { p.ell(300, 318, 70, 10, "#c0353a", 0); p.stroke([[300, 322], [300, 400]], 5, "#f4f0e6"); }
    g.restore(); return;
  }
  const crouch = frame === 6, sit = frame === 5, L = DLEG[Math.min(4, frame)], bob = frame < 4 ? [0, -4, 0, 4][frame] : 0, by = crouch ? 300 : 240 + bob;
  if (o.string) { p.stroke([[0, 250], [120, 236], [330, by - 30]], 5, "#f4f0e6"); }
  // tail
  p.stroke([[160, by - 30], [140, by - 70], [150, by - 92]], 16, BLUE);
  // far legs
  if (!sit && !crouch) { p.stroke([[220, by + 20], [220 + L[1][0], by + L[1][1]]], 16, TAN2); p.stroke([[350, by + 20], [350 + L[3][0], by + L[3][1]]], 16, TAN2); }
  // body: steel-blue saddle with a long silky skirt
  if (sit) { p.ell(270, by + 10, 100, 70, BLUE, 9); p.ell(250, by + 60, 70, 28, TAN, 6); }
  else p.ell(285, by, 130, crouch ? 40 : 52, BLUE, 9);
  for (let k = 0; k < 11; k++) { const x = 180 + 22 * k; p.stroke([[x, by + (crouch ? 20 : 30)], [x + 4, by + (crouch ? 40 : 58) + 6 * Math.sin(k * 1.7)]], 10, k % 2 ? BLUE : "#4a5a70"); }
  p.ell(400, by - 4, 46, 50, TAN, 7); // chest
  // near legs
  if (sit) { p.stroke([[330, by + 30], [338, by + 92]], 18, TAN); p.stroke([[300, by + 40], [304, by + 92]], 18, TAN); }
  else if (!crouch) { p.stroke([[240, by + 22], [240 + L[0][0], by + L[0][1]]], 18, TAN); p.stroke([[370, by + 22], [370 + L[2][0], by + L[2][1]]], 18, TAN); }
  else { p.stroke([[380, by + 20], [450, by + 34]], 16, TAN); p.stroke([[230, by + 22], [180, by + 34]], 16, TAN); }
  // head (big, cute) + ears + topknot + beard
  const hx = sit ? 380 : 460, hy = crouch ? by - 20 : by - 74;
  p.ell(hx, hy, 72, 62, TAN, 8);
  p.poly([[hx - 40, hy - 40], [hx - 28, hy - 116], [hx - 2, hy - 52]], TAN2, 7); p.poly([[hx + 6, hy - 50], [hx + 30, hy - 120], [hx + 40, hy - 40]], TAN2, 7);
  for (let k = 0; k < 6; k++) p.stroke([[hx + 10 + 10 * k, hy + 26], [hx + 14 + 11 * k, hy + 64]], 9, TAN2);
  p.ell(hx + 62, hy + 8, 13, 10, "#1a1416", 0);                                                    // nose
  if (o.tongue) p.ell(hx + 46, hy + 34, 10, 14, "#e06a7a", 3);
  const ex = hx + 26, ey = hy - 8;
  if (eye === "happy") p.stroke([[ex - 12, ey + 3], [ex, ey - 8], [ex + 12, ey + 3]], 6, INK);
  else if (eye === "wide") { p.ell(ex, ey, 17, 18, "#ffffff", 5); p.ell(ex + 3, ey, 8, 9, INK, 0); }
  else if (eye === "flat") { p.ell(ex, ey + 2, 13, 13, INK, 0); p.poly([[ex - 16, ey - 14], [ex + 16, ey - 14], [ex + 16, ey + 1], [ex - 16, ey + 1]], TAN, 0); p.stroke([[ex - 15, ey + 1], [ex + 15, ey + 1]], 5, INK); }
  else { p.ell(ex, ey, 13, 14, INK, 0); p.ell(ex + 5, ey - 5, 5, 5, "#ffffff", 0); }
  p.ell(hx - 10, hy + 46, 34, 9, "#c0353a", 0);                                                    // red collar
  if (o.helmet) { p.poly([[hx - 64, hy - 50], [hx - 50, hy - 100], [hx, hy - 118], [hx + 50, hy - 100], [hx + 64, hy - 50]], "#5a6238", 8); p.band([[hx - 72, hy - 48], [hx + 72, hy - 48]], "#4a5230", 12, 4, "round"); }
  g.restore();
};
/** place Smoky with her feet on the ground at (x, y, z); w = card width (0.5 m = a 4-lb, 7-inch dog) */
const dog = (c: Ctx, x: number, y: number, z: number, frame: number, o: SO = {}, w = 0.5) => {
  const h = w * 2 / 3;
  card(c, `dg${frame}${o.eye ?? "c"}${o.helmet ? "h" : ""}${o.string ? "s" : ""}${o.flip ? "f" : ""}${o.tongue ? "t" : ""}`, 600, 400, fxDog(frame, o), [x, y + h * (frame === 7 ? 0.37 : 0.31), z], w, h);
  blob(c.out, x, y, z, w * 0.5);
};
const trotF = (t: number, rate = 8) => Math.floor((TQ(t) * rate) % 4);

// ---------------- builders ----------------
// FIELD (Lingayen Gulf airstrip, Luzon, Jan 1945): sand, a raised PSP-matted taxiway along x (z -3..3, 0.45 m high);
// the 8-inch culvert runs UNDER it along z, its mouths at (0, 0.1, 3.6) [near] and (0, 0.1, -3.6) [far]; P-38s parked
// on the strip, tents, palms, the sea beyond. "70 FT" / "8 IN" stencilled on the pipe's collar; a chalkboard by the spool.
export const MOUTH: V3 = [0, 0.15, 3.5], FAR: V3 = [0, 0.15, -3.5];
const field = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-80, 80, -80, 60, 1, 0), lam("sandF", () => ({ map: rep(sandTex(), 18, 18) })));
  b.add(boxGeo(V(-60, 0, -3.2), V(60, 0.45, 3.2)), lam("embank", () => ({ map: rep(sandTex(), 20, 2) })));
  b.add(boxGeo(V(-60, 0.45, -3.0), V(60, 0.47, 3.0)), lam("psp", () => ({ map: rep(pspTex(), 30, 3) })));
  // the culvert: visible collar rings at both mouths + a short exposed run each side
  const P = lam("pipeT", () => ({ map: pipeTex(), side: THREE.DoubleSide }));
  for (const zz of [3.2, -3.2]) {
    const sgn = Math.sign(zz);
    b.add(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 24, 1, true).rotateX(Math.PI / 2).translate(0, 0.15, zz + sgn * 0.05), P);
    b.add(new THREE.TorusGeometry(0.15, 0.022, 8, 24).translate(0, 0.15, zz + sgn * 0.3), C("#9a9e98"));
    b.add(new THREE.CircleGeometry(0.15, 24).rotateY(sgn > 0 ? 0 : Math.PI).translate(0, 0.15, zz - sgn * 0.15), C("#0a0a0c")); // darkness inside
    b.add(new THREE.CircleGeometry(0.15, 24).rotateY(sgn > 0 ? 0 : Math.PI).translate(0, 0.15, zz + sgn * 0.12), C("#0a0a0c"));
    if (sgn < 0) b.add(boxGeo(V(-0.9, 0, -3.3), V(0.9, 0.42, -3.15)), C("#b8b2a4"));
  }
  // stencil on the near collar's concrete headwall
  b.add(boxGeo(V(-0.9, 0, 3.15), V(0.9, 0.42, 3.3)), C("#b8b2a4"));
  b.add(new THREE.PlaneGeometry(0.55, 0.3).translate(-0.48, 0.24, 3.31), lam("st70", () => ({ map: stencil("70", 256, 140, ["70 FT"], null, "#2a2a2a", 70), transparent: true })));
  b.add(new THREE.PlaneGeometry(0.42, 0.3).translate(0.5, 0.24, 3.31), lam("st8", () => ({ map: stencil("8in", 256, 180, ["8 IN"], null, "#8a1a1a", 80), transparent: true })));
  p38(b, -12, 0.47, -0.2, 0.25); p38(b, 13, 0.47, 0.4, -0.3, 1, true); p38(b, 30, 0.47, -0.5, 0.15);
  for (const [x, z] of [[-9, -14], [-2, -16], [6, -15], [14, -13]]) tent(b, x, z, 0.9, 0.2 * hh(x, 1));
  for (let k = 0; k < 9; k++) palm(b, -30 + 8 * k + 2 * hh(k, 1), -24 - 6 * hh(k, 2), 10 + 3 * hh(k, 3), k + 3);
  b.add(plane(-200, 200, -160, -40, 1, 0.02), lam("seaF", () => ({ color: "#4a8ab0" })));
  sandbags(b, -4.5, 6.5, -1.6, 7.2); sandbags(b, 2.4, 7.0, 5.2, 6.4);
  spool(b, 3.3, 5.3); shovel(b, -1.6, 4.8, 0.25, 0.4); shovel(b, -1.9, 5.1, -0.3, -0.2);
  for (let k = 0; k < 3; k++) crate(b, 2.8 + 0.95 * k, 0, 5.4 + 0.1 * k, 0.1);
  // the chalkboard: "250 MEN / 3 DAYS" (filled by staging via card), the ration crate with "4 LBS" scale
  b.add(new THREE.BoxGeometry(1.4, 0.9, 0.05).rotateY(0.35).translate(-2.9, 1.25, 5.6), C("#2a3a2e"));
  for (const dx of [-0.6, 0.6]) b.add(beamBetween(V(-2.9 + dx * Math.cos(0.35), 0, 5.6 - dx * Math.sin(0.35)), V(-2.9 + dx * Math.cos(0.35), 1.7, 5.6 - dx * Math.sin(0.35)), 0.03), C("#6a4a30"));
  crate(b, 1.2, 0, 3.75, -0.08, 0.7, 0.4, 0.5);
  sub(s, "sandwich", (bb) => { bb.add(new THREE.BoxGeometry(0.22, 0.03, 0.14).translate(0, 0.015, 0), C("#e8c88a")); bb.add(new THREE.BoxGeometry(0.23, 0.02, 0.15).translate(0, 0.04, 0), C("#7ac05a")); bb.add(new THREE.BoxGeometry(0.22, 0.02, 0.14).translate(0, 0.06, 0), C("#c0503a")); bb.add(new THREE.BoxGeometry(0.22, 0.03, 0.14).translate(0, 0.085, 0), C("#e8c88a")); });
};
// JUNGLE (New Guinea, 1944): mud clearing ringed by giant trees, palms and ferns; the abandoned foxhole at (0.4, 0.6);
// a jeep bogged at (-3.5, -2.2); the poker crate at (2.2, -0.6) under a tent fly; mist.
export const HOLE: V3 = [0.4, 0, 0.6];
const jungle = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-60, 60, -60, 40, 1, 0), lam("mudJ", () => ({ map: rep(mudTex(), 12, 12) })));
  b.add(new THREE.TorusGeometry(0.5, 0.14, 8, 24).rotateX(-Math.PI / 2).scale(1, 0.7, 1).translate(HOLE[0], 0.02, HOLE[2]), C("#9a8250"));
  b.add(new THREE.CircleGeometry(0.42, 24).rotateX(-Math.PI / 2).translate(HOLE[0], 0.03, HOLE[2]), C("#5a4426"));
  const mj = M4(-3.5, -0.25, -2.2, 0.6, 1); void mj; jeep(b, -3.5, -2.2, 0.6);
  // poker: tent fly on poles + crate table
  for (const [x, z] of [[1.2, -1.6], [3.4, -1.6], [1.2, 0.6], [3.4, 0.6]]) b.add(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6).translate(x, 1.1, z), C("#6a4a30"));
  b.add(new THREE.BoxGeometry(2.6, 0.04, 2.6).rotateX(0.1).translate(2.3, 2.25, -0.5), lam("tentK", () => ({ map: tentTex() })));
  crate(b, 2.3, 0, -0.5, 0, 1.0, 0.6, 0.7); b.add(boxGeo(V(1.78, 0.6, -0.86), V(2.82, 0.62, -0.14)), C("#2a6a3a"));
  crate(b, 1.4, 0, -0.4, 0.3, 0.5, 0.35, 0.4); crate(b, 3.2, 0, -0.6, -0.2, 0.5, 0.35, 0.4);
  for (let k = 0; k < 34; k++) { const a = (k / 34) * Math.PI * 2 + hh(k, 3), d = 5 + 9 * hh(k, 1), x = d * Math.cos(a), z = -1 + d * Math.sin(a); if (z > 2.5 && Math.abs(x) < 4) continue; tree(b, x, z, (d < 9 ? 4 : 7) + 4 * hh(k, 2), ["#2e6a2a", "#3a7a30", "#245a24", "#4a8a34"][k % 4], k + 20); }
  for (let k = 0; k < 14; k++) palm(b, -16 + 2.4 * k, -6 - 6 * hh(k, 4), 8 + 4 * hh(k, 5), k + 40);
  for (let k = 0; k < 10; k++) tree(b, -30 + 6.5 * k, -18 - 4 * hh(k, 6), 14 + 6 * hh(k, 7), "#1e4a20", k + 70);
  for (let k = 0; k < 30; k++) { const x = -7 + 14 * hh(k, 6), z = -6 + 10 * hh(k, 7); if (Math.abs(x - 0.4) < 2 && Math.abs(z - 0.6) < 2) continue; fern(s, x, z, 0.9 + 0.9 * hh(k, 8), hh(k, 9) * 3); }
  tent(b, -6, -6, 0.9, 0.4);
  sub(s, "chips", (bb) => { for (let k = 0; k < 10; k++) bb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.01 * (1 + (k % 4)), 12).translate(2.0 + 0.07 * (k % 5) + 0.3 * Math.floor(k / 5), 0.62 + 0.005 * (1 + (k % 4)), -0.6 + 0.12 * Math.floor(k / 5)), C(["#c0353a", "#2a4a8a", "#f4f4f0", "#2a7a4a"][k % 4])); });
};
// PIPE (inside the culvert, scaled x4 so the camera fits: radius 0.42, running along z from z +7 [far, dark] to the
// bright mouth at z -7 behind the camera's back... ) Smoky crawls toward the camera at the bright end; sand drifts on
// the floor shrink the gap; a torch-lit haze of dust.
const PIPE_R = 0.42;
const pipe = (s: SetBuild) => {
  const { b } = s;
  b.add(new THREE.CylinderGeometry(PIPE_R, PIPE_R, 16, 32, 1, true).rotateX(Math.PI / 2).translate(0, PIPE_R, 0), lam("pipeIn", () => ({ map: rep(pipeTex(), 1, 10), side: THREE.BackSide })));
  for (let z = -8; z <= 8; z += 0.5) b.add(new THREE.TorusGeometry(PIPE_R - 0.005, 0.012, 6, 32).translate(0, PIPE_R, z), C("#7a7e78"));
  for (let k = 0; k < 9; k++) { const z = -6 + 1.6 * k, hgt = 0.06 + 0.16 * hh(k, 1); b.add(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.33, hgt, 0.7 + 0.4 * hh(k, 2)).translate(0.04 * (hh(k, 3) - 0.5), 0.02, z), lam("sandP", () => ({ map: rep(sandTex(), 1, 1) }))); }
  const L = new THREE.Mesh(new THREE.CircleGeometry(PIPE_R * 0.98, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.7, 1.4) }));
  L.position.set(0, PIPE_R, -8); s.root.add(L); L.layers.set(3);
  const D = new THREE.Mesh(new THREE.CircleGeometry(PIPE_R, 32), new THREE.MeshBasicMaterial({ color: "#050506" })); D.position.set(0, PIPE_R, 8); D.rotation.y = Math.PI; s.root.add(D);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { field, jungle, pipe };

// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => ConstructorParameters<typeof VfxRig>[1]) => { let r = RIGS.get(s); if (!r) { r = new VfxRig(s.root, mk()); RIGS.set(s, r); } return r; };
const FAR_BOOMS = (t0: number, t1: number, seed: number) => { const r = rng(seed), o: [number, V3][] = []; for (let t = t0 + 0.3; t < t1; t += 0.8 + 0.8 * r()) { const x = -40 + 80 * r(), z = -30 - 30 * r(); o.push([t, [x, 0, z]]); } return o; };

export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  field: (s, t, id) => {
    s.dyn.sandwich.visible = false; s.dyn.sandwich.position.set(1.4, 0.4, 3.78);
    if (id === 10) rig(s, () => battle(FAR_BOOMS(T0s(10) - 1, SHOTS[9].b / FPS + 0.5, 77), T0s(10))).step(t);
    else rig(s, () => sandDrift(T0s(id))).step(t);
  },
  jungle: (s, t, id) => { rig(s, () => jungleAir(T0s(id))).step(t); s.dyn.chips.visible = true; },
  pipe: (s, t, id) => { rig(s, () => pipeDust(T0s(id), PIPE_R)).step(t); },
};

// ---------------- cast ----------------
const GI = (v: number): Outfit => ({ jacket: ["#6a6a4a", "#64664a", "#70704e"][v % 3], pants: "#5e5e44", boots: "#3a2a1e", hat: "m1", cap: "#4e5434", hatCol: "#4e5434", belt: "#7a6a3a", skin: SKINS[v % 3], moustache: v === 2 ? "#4a3020" : undefined } as Outfit);
const BILL: Outfit = { jacket: "#7a7a52", pants: "#5e5e44", boots: "#3a2a1e", hat: "cap", cap: "#6a6a4a", belt: "#7a6a3a", skin: SKINS[0], hair: "#3a2a1a" } as Outfit;
const DOWNEY: Outfit = { jacket: "#64664a", pants: "#5e5e44", boots: "#3a2a1e", hat: "hair", hair: "#7a4a24", belt: "#7a6a3a", skin: SKINS[0] } as Outfit;

// ---------------- effect drawings ----------------
const fxChalk = (p: Pen, n: number) => { // the engineers' chalkboard, 560 x 360: "DIG IT UP? 3 DAYS / 250 MEN"
  p.poly(rrect(10, 10, 550, 350, 10), "#2a3a2e", 10);
  if (n > 0) txt(p, "DIG IT UP?", 280, 90, 58, "#f4f4ea", "700", "center", "Georgia, serif");
  if (n > 1) txt(p, "3 DAYS", 280, 180, 70, "#ffd23a", "900", "center");
  if (n > 2) txt(p, "250 MEN", 280, 270, 70, "#ff8a7a", "900", "center");
  if (n > 3) p.stroke([[60, 300], [500, 60]], 12, "#f4f4ea");
};
const fxPound = (p: Pen) => { // an Australian two-pound note pinned under the chips, 520 x 260
  p.poly(rrect(10, 10, 510, 250, 8), "#c8a878", 8); p.poly(rrect(30, 30, 490, 230, 6), "#b89060", 4);
  txt(p, "2 POUNDS", 260, 120, 70, "#3a2a1a", "900", "center", "Georgia, serif"); txt(p, "AUSTRALIA", 260, 190, 34, "#5a3a1a", "700", "center", "Georgia, serif");
};
const fxTag = (p: Pen) => { // a dog-tag-shaped label on the ration-scale crate: "4 LBS"
  p.poly(rrect(20, 30, 380, 210, 60), "#c8ccd2", 9); p.ell(70, 120, 16, 16, "#8a8e94", 4); txt(p, "4 LBS", 220, 150, 90, "#1e1a16", "900", "center", '"Courier New", monospace');
};
const fxClock = (p: Pen, u: number) => { // stopwatch, 300 x 340
  p.poly(rrect(130, 10, 170, 50, 6), "#8a8e94", 6); p.ell(150, 190, 130, 130, "#f4f4ea", 10);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; p.stroke([[150 + 110 * Math.sin(a), 190 - 110 * Math.cos(a)], [150 + 122 * Math.sin(a), 190 - 122 * Math.cos(a)]], 6, INK); }
  const a = u * Math.PI * 2; p.stroke([[150, 190], [150 + 100 * Math.sin(a), 190 - 100 * Math.cos(a)]], 9, "#c0353a"); p.ell(150, 190, 10, 10, INK, 0);
};

/** blueprint insert (2026-11-23 reel: a diagram that builds with the words), 600 x 1000: the pipe's cross-section,
 *  8 IN across; sand fills half of it (u 0..1); then the 4-inch gap gets its arrow and a squeezed little dog */
const fxSection = (p: Pen, u: number, gap: boolean) => {
  const g = p.g, B = "#1d4f8a", L = "rgba(220,236,255,0.9)";
  p.poly(rrect(6, 6, 594, 994, 14), B, 8);
  g.strokeStyle = "rgba(200,225,255,0.18)"; g.lineWidth = 2; for (let x = 30; x < 600; x += 40) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 990); g.stroke(); } for (let y = 30; y < 1000; y += 40) { g.beginPath(); g.moveTo(10, y); g.lineTo(590, y); g.stroke(); }
  txt(p, "CULVERT  SECTION", 300, 250, 46, "#f4f8ff", "900", "center", '"Courier New", monospace');
  const cx = 300, cy = 560, R = 190;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
  const top = cy + R - 2 * R * 0.5 * u; g.fillStyle = "#d8b878"; g.fillRect(0, top, 600, 1000);
  for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(120,90,40,0.5)"; g.fillRect(90 + (k * 97) % 420, top + 10 + (k * 53) % 200, 6, 6); }
  g.restore();
  g.strokeStyle = L; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  p.stroke([[cx - R, cy - R - 60], [cx + R, cy - R - 60]], 6, L); p.stroke([[cx - R, cy - R - 80], [cx - R, cy - R - 40]], 6, L); p.stroke([[cx + R, cy - R - 80], [cx + R, cy - R - 40]], 6, L);
  txt(p, "8 IN", cx, cy - R - 76, 52, "#ffd23a", "900", "center", '"Courier New", monospace');
  if (u > 0.98) txt(p, "SAND", cx, cy + R * 0.55, 50, "#6a4a1a", "900", "center", '"Courier New", monospace');
  if (gap) {
    p.stroke([[cx + 150, cy - R + 2], [cx + 150, cy - 2]], 7, "#ff5a5a"); p.poly([[cx + 136, cy - R + 26], [cx + 164, cy - R + 26], [cx + 150, cy - R + 4]], "#ff5a5a", 0); p.poly([[cx + 136, cy - 26], [cx + 164, cy - 26], [cx + 150, cy - 4]], "#ff5a5a", 0);
    txt(p, "4 IN", cx + 130, cy + R + 100, 80, "#ff5a5a", "900", "center", '"Courier New", monospace');
    p.stroke([[cx + 150, cy + R + 30], [cx + 150, cy + 10]], 5, "#ff5a5a");
    p.ell(cx - 20, cy - 52, 90, 38, "#3a4a5e", 6); p.ell(cx + 70, cy - 66, 40, 34, "#c8945a", 6); p.ell(cx + 82, cy - 74, 6, 6, INK, 0);
  }
};
const fxSandwich = (p: Pen) => { // a fat GI sandwich, 400 x 260, same toon line as the cast
  p.ell(200, 200, 180, 44, "#e2b56a", 8);
  p.poly([[30, 160], [80, 140], [130, 166], [180, 138], [230, 166], [280, 140], [330, 166], [372, 150], [370, 184], [30, 184]], "#6ac04a", 6);
  p.poly(rrect(36, 128, 364, 160, 8), "#d0463a", 6); p.poly(rrect(40, 112, 360, 132, 6), "#f2d04a", 5);
  p.ell(200, 86, 178, 58, "#e8bd72", 8); p.ell(200, 70, 150, 26, "#f2d08e", 0);
  for (let k = 0; k < 7; k++) p.ell(90 + 36 * k, 60 + 8 * (k % 2), 4, 6, "#fff4d6", 0);
};
/** a giant punch word that stands IN the scene (text-behind-subject), 1200 x 380 */
const fxBig = (p: Pen, s: string, col: string) => { txt(p, s, 600, 300, 330, col, "900", "center", "'Inter Display','Inter',sans-serif"); };
// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;
const gi = (c: Ctx, i: number, v: number, x: number, z: number, fo: FrontOpts & Act = {}, y = 0) => pose(c, i, GI(v), "gi" + v, x, z, { mode: "stand", expr: "neutral", look: 0, ...fo }, 1, y);
const bill = (c: Ctx, x: number, z: number, fo: FrontOpts & Act = {}, y = 0) => pose(c, 1, BILL, "bill", x, z, { mode: "stand", expr: "smile", look: 0, ...fo }, 1, y);
/** the hook: the culvert mouth at ground level, three engineers crouched peering in, the wire spool, the "70 FT" stencil */
const hook = (c: Ctx) => {
  // secondary action on the words (anti-slideshow): the sitting GI leans in to peer down the pipe on "most important",
  // the standing one points on "engineer" and turns back on "weighed"; both ease back to frame 0's pose by the loop
  const t = c.t, u1 = smooth((t - A(0, "most")) / 0.5) - smooth((t - A(0, "weighed")) / 0.6), u2 = smooth((t - A(0, "engineer")) / 0.35);
  gi(c, 2, 0, -0.6, 4.3, { mode: "sit", expr: u1 > 0.5 ? "awe" : "nervous", look: 0.6, lean: -0.22 * u1 } as FrontOpts & Act);
  gi(c, 4, 2, 0.65, 4.6, { expr: u2 > 0.5 ? "shock" : "awe", look: -0.6 + 0.4 * u2, prop: u2 > 0.5 ? ("point" as FrontOpts["prop"]) : null, lean: 0.08 * u2 } as FrontOpts & Act);
};

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1944, the most important engineer on a U.S. airfield weighed four pounds.   (hook + loop frame)
  1: (c) => { hook(c); if (after(c.t, A(0, "four"))) stay(c, A(0, "four"), "tag4", 400, 240, fxTag, TAG4, 0.42, 0.25, -0.04); },
  // 2 She was a Yorkshire terrier.   (reveal: Smoky in a helmet on the crate, fast push-in)
  2: (c) => { card(c, "tag4", 400, 240, fxTag, TAG4, 0.42, 0.25, { rot: -0.04 }); dog(c, 1.2, 0.4, 3.75, 5, { helmet: true, eye: "happy", tongue: true }, 0.5); gi(c, 2, 0, -0.55, 4.3, { mode: "sit", expr: "laugh", look: 0.6 } as FrontOpts & Act); },
  // 3 Her name was Smoky.   (the jungle; she trots out of the mist)
  // text-behind-subject (2026-11-23 rule): her name stands huge in the clearing BEHIND her, so she covers part of it
  3: (c) => {
    const t = c.t, u = clamp01((t - T0s(3)) / 1.6), k = pop(t, A(1, "smoky."));
    dog(c, -1.2 + 1.4 * smooth(u), 0, 0.9, u < 1 ? trotF(t) : 4, { eye: "happy", tongue: true });
    if (after(t, A(1, "smoky."))) card(c, "bigSMOKY", 1200, 380, (p) => fxBig(p, "SMOKY", "#ffd23a"), [0.2, 0.3, 0.2], 1.3 * k, 0.41 * k);
  },
  // 4 A soldier found her in an abandoned foxhole in the New Guinea jungle.
  4: (c) => {
    const t = c.t, f = A(1, "found"), pk = clamp01((t - f) / 0.5);
    dog(c, HOLE[0], -0.28 + 0.24 * smooth(pk), HOLE[2] - 0.05, 4, { eye: t > f + 0.4 ? "wide" : "calm" });
    pose(c, 2, DOWNEY, "downey", HOLE[0] + 1.1, HOLE[2] - 0.2, { mode: "stand", expr: t > f ? "awe" : "neutral", look: -0.5, lean: 0.12 });
  },
  // 5 He sold her for two Australian pounds...
  5: (c) => {
    const t = c.t;
    pose(c, 2, DOWNEY, "downey", 2.9, 0.3, { mode: "stand", expr: "smug", look: 0.4, prop: "point" as FrontOpts["prop"] });
    bill(c, 0.0, 0.7, { expr: "grin", look: 0.4 });
    dog(c, 0.8, 0, 1.0, 5, { eye: "calm" });
    if (after(t, A(2, "two"))) stay(c, A(2, "two"), "pound", 520, 260, fxPound, [1.95, 0.88, -0.05], 0.5, 0.25, -0.08);
  },
  // 6 ...so he could get back to his poker game.   (joke lands on Smoky's deadpan close-up, then a beat of silence)
  6: (c) => {
    const t = c.t, pk = A(2, "poker");
    pose(c, 2, DOWNEY, "downey", 2.1, -0.1, { mode: "sit", expr: "grin", look: 0.3 } as FrontOpts & Act);
    gi(c, 3, 1, 3.0, -1.0, { mode: "sit", expr: "smug", look: -0.4 } as FrontOpts & Act);
    dog(c, -0.7, 0, 1.3, 5, { eye: t > pk ? "flat" : "calm" });
  },
  // 7 Corporal Bill Wynne bought her, and carried her everywhere. In his backpack.
  7: (c) => {
    const t = c.t, a = T0s(7), x = -1.6 + 0.9 * (t - a);
    bill(c, x, 0.5, { mode: "stroll", phase: t * 1.7, expr: "grin", look: 0.4 });
    dog(c, x - 0.24, 1.3, 0.56, 4, { eye: "happy", tongue: true, flip: true }, 0.45);
    if (after(t, A(3, "corporal"))) stay(c, A(3, "corporal"), "nameB", 520, 150, (p) => fxNamePlate(p, "CPL. BILL WYNNE"), [x + 0.3, 1.3, 0.75], 0.5, 0.15, 0);
  },
  // 8 Then, in the Philippines, the engineers had a problem.
  8: (c) => {
    gi(c, 2, 0, -0.8, 4.4, { expr: "nervous", look: 0.4 }); gi(c, 3, 1, 0.8, 4.6, { expr: "sad", look: -0.4, prop: "shrug" as FrontOpts["prop"] });
  },
  // 9 They needed a telegraph wire under the airfield, through a 70-foot pipe just eight inches wide.
  9: (c) => { gi(c, 2, 2, 1.5, 3.9, { expr: "nervous", look: -0.5, prop: "point" as FrontOpts["prop"] }); },
  // 10 Digging it up would take three days, with 250 men out in the open, under enemy bombs.
  10: (c) => {
    const t = c.t, n = (t >= A(6, "digging") ? 1 : 0) + (t >= A(6, "three") ? 1 : 0) + (t >= A(6, "250") ? 1 : 0) + (t >= A(6, "enemy") ? 0 : 0);
    gi(c, 2, 0, -1.3, 5.3, { expr: "nervous", look: -0.4 }); gi(c, 3, 2, -0.4, 5.6, { expr: t > A(6, "bombs.") - 0.3 ? "shock" : "sad", look: -0.3 });
    card(c, "chalk" + n, 560, 360, (p) => fxChalk(p, n), [-2.9 + 0.03 * Math.sin(0.35), 1.25, 5.6 + 0.03 * Math.cos(0.35)], 1.34, 0.86, { yaw: 0.35 });
    // "250 men out in the open": the grid of men (2026-11-23 clone-grid rule) — ranks of identical GIs on the bare strip
    if (t >= A(6, "out") - 0.15) {
      const sh = t > A(6, "enemy") - 0.1;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) {
        const x = -3.6 + 1.2 * k + 0.6 * (r % 2), z = 1.8 - 1.3 * r, d = Math.max(0, t - A(6, "out") + 0.15 - 0.04 * (k + r));
        gi(c, 10 + r * 7 + k, (r + k) % 3, x, z, { expr: sh ? "shock" : "nervous", look: sh ? -0.2 : 0.2 * Math.sin(k + r), lean: sh ? 0.1 * Math.sin(t * 14 + k) : 0, dy: -0.25 * Math.exp(-d * 9) } as FrontOpts & Act, 0.47);
      }
    }
  },
  // 11 So they tied a string to Smoky's collar.
  11: (c) => {
    const t = c.t;
    dog(c, 0.0, 0, MOUTH[2] + 0.4, 4, { eye: "calm", string: t > A(7, "tied") });
    void BILL;
  },
  // 12 Bill called her from the other end.   (the far mouth: Bill flat on his belly, calling into the dark)
  12: (c) => {
    const t = c.t;
    bill(c, 0.65, FAR[2] - 0.7, { mode: "sit", expr: t > A(7, "called") ? "laugh" : "smile", look: 0.3, prop: "point" as FrontOpts["prop"] } as FrontOpts & Act);
    gi(c, 3, 1, 1.5, FAR[2] - 1.3, { expr: "nervous", look: -0.4 });
  },
  // 13 The pipe was half full of sand. In places, she had four inches to squeeze through.   (inside, x4 scale)
  13: (c) => {
    const t = c.t, a = T0s(13), z = 3.0 - 0.9 * (t - a), sq = A(8, "squeeze");
    { const h = A(8, "half"), u = q(clamp01((t - h) / 0.7), 10), gap = t >= A(8, "four") - LEAD; card(c, `sec${u}${gap ? "g" : ""}`, 600, 1000, (p) => fxSection(p, u, gap), [SEC[0], SEC[1], SEC[2]], 0.6, 1.0); }
    dog(c, 0, t > sq - 0.2 && t < sq + 0.8 ? -0.06 : 0.015 * Math.sin(t * 9), z, 7, { eye: "calm", string: true }, 1.2);
  },
  // 14 Then... a little face popped out the other end. Wire attached.
  14: (c) => {
    const t = c.t, pp = A(9, "popped"), u = clamp01((t - pp + 0.15) / 0.35);
    dog(c, 0.0, 0.0, FAR[2] - 0.05 - 0.45 * (1 - (1 - u) ** 3), u < 1 ? 7 : 4, { eye: u > 0.5 ? "happy" : "wide", string: true, flip: true, tongue: u > 0.8 });
    bill(c, -0.75, FAR[2] - 0.8, { mode: "sit", expr: t > pp ? "laugh" : "nervous", look: -0.3, prop: t > pp + 0.3 ? ("handsUp" as FrontOpts["prop"]) : null } as FrontOpts & Act);
  },
  // 15 Three days of digging. Done in minutes.   (impact on "minutes")
  15: (c) => {
    const t = c.t;
    gi(c, 2, 0, -0.9, 5.0, { expr: "laugh", look: 0.3, prop: "handsUp" as FrontOpts["prop"] }); gi(c, 3, 1, 2.2, 5.0, { expr: "laugh", look: -0.3, prop: "handsUp" as FrontOpts["prop"] });
    dog(c, 1.2, 0.4, 3.75, 5, { eye: "happy", tongue: true });
    if (after(t, A(10, "three"))) stay(c, A(10, "three"), "clk" + Math.round(12 * clamp01((t - A(10, "done")) * 1.6)), 300, 340, (p) => fxClock(p, 0.03 + 0.07 * clamp01((t - A(10, "done")) * 1.6)), [0.3, 0.75, 4.3], 0.42, 0.48, -0.06);
  },
  // 16 By a dog the size of a sandwich.   (side by side on the crate: dog, sandwich; the GIs crack up)
  16: (c) => {
    dog(c, 1.0, 0.4, 3.75, 5, { eye: "flat" }, 0.5);
    card(c, "sandw", 400, 260, fxSandwich, [1.42, 0.49, 3.8], 0.3, 0.195);
    gi(c, 2, 2, 2.4, 4.5, { expr: "laugh", look: -0.5 });
  },
  // 17 Send this to the smallest person in your friend group.   (ends on shot 1's frame: loop)
  17: (c) => {
    const t = c.t, c0 = { ...c, t: c.t - (TOTAL - 1) / FPS };
    if (t >= (Math.round(A(11, "your") * FPS) - 2.5) / FPS) { STAGE[1](c0); return; }
    dog(c, 0.0, 0, MOUTH[2] + 0.5, 4, { eye: "happy", tongue: true, string: true, flip: true });
  },
};
const fxNamePlate = (p: Pen, s: string) => { p.poly(rrect(10, 10, 510, 140, 12), "#2a3a2e", 8); txt(p, s, 260, 95, 54, "#f4f0e6", "900", "center", '"Courier New", monospace'); };
export const SEC: V3 = [4, 0.5, 0];
const TAG4: V3 = [1.2, 0.2, 4.03];
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxScore; void jolt; void hop; void pop; void quad; void tri; void fxWord; void sway; void lidAt; void q; void tier; void person; void at; void rep; void ctex; void M4; void plane; void hills; void fxSay; void fxThink; void fxPlane; void fxX; void sayB; void puff; void snowGround; void hillTex; void paddyTex; void usFlag; void usmcFlag; void fence; void tanksUnused; void rifle; void flagpole; void fxCal; void fxDoc; void banner; void word; void TAN2;
