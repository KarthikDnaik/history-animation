// Places and cast of "Cher Ami" (Argonne, Oct 1918; 9:16 short).
// Direction sheet: the Charlevaux ravine (leaf litter, funk holes, shell-stripped trees, wire, mist, friendly shells), the
// sky over French farmland, Mobile Loft No. 11 at Rampont, a dark Smithsonian gallery (2021). Palette: olive drab / slate
// pigeon with green-purple neck / rust-ochre autumn / signal red. Numbers and words land on objects (the note, the wall
// map, the loft's stencil, the record card, the DNA monitor); CHER AMI stands behind the bird. Avoid: gore (a feather
// burst, not blood), background voices, music.
import * as THREE from "three";
import { VfxRig, battle, forestAir, featherBurst } from "./vfx";
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
const mudTex = () => dirt("mudA", "#6e5a40", "rgba(40,30,18,0.32)");
/** leaf litter over mud: October in the Argonne — rust, ochre and brown leaves */
const litterTex = () => ctex("litter", 1024, 1024, (g, r) => {
  g.fillStyle = "#5c4a34"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 2600; k++) { g.fillStyle = ["rgba(130,80,36,0.45)", "rgba(150,112,58,0.4)", "rgba(80,58,34,0.5)", "rgba(104,92,62,0.4)"][k % 4]; g.save(); g.translate(1024 * r(), 1024 * r()); g.rotate(r() * 6.3); g.beginPath(); g.ellipse(0, 0, 6 + 8 * r(), 3 + 3 * r(), 0, 0, 6.3); g.fill(); g.restore(); }
  for (let k = 0; k < 40; k++) { g.strokeStyle = "rgba(60,44,26,0.6)"; g.lineWidth = 3 + 3 * r(); g.beginPath(); const x = 1024 * r(), y = 1024 * r(); g.moveTo(x, y); g.lineTo(x + 60 * (r() - 0.5), y + 60 * (r() - 0.5)); g.stroke(); }
});
const barkTex = () => ctex("bark", 256, 512, (g, r) => {
  g.fillStyle = "#6e5640"; g.fillRect(0, 0, 256, 512);
  for (let k = 0; k < 60; k++) { g.strokeStyle = r() < 0.5 ? "rgba(30,22,16,0.5)" : "rgba(140,120,96,0.3)"; g.lineWidth = 2 + 4 * r(); g.beginPath(); const x = 256 * r(); g.moveTo(x, 0); g.bezierCurveTo(x + 10 * (r() - 0.5), 170, x + 12 * (r() - 0.5), 340, x + 8 * (r() - 0.5), 512); g.stroke(); }
});
const wickerTex = () => ctex("wicker", 256, 256, (g) => {
  g.fillStyle = "#a07a42"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? "#c49a5a" : "#8a6434"; g.fillRect(x + 1, y + 1, 14, 14); }
});
/** patchwork French farmland seen from the air: fields, woods, roads, a scar of trenches */
const farmTex = () => ctex("farm", 2048, 2048, (g, r) => {
  const F = ["#8aa456", "#a8b468", "#c8b872", "#7a9448", "#b4a060", "#94a85a"];
  for (let k = 0; k < 260; k++) { g.fillStyle = F[k % 6]; g.save(); g.translate(2048 * r(), 2048 * r()); g.rotate(r() * 0.6 - 0.3); g.fillRect(-90, -60, 120 + 140 * r(), 80 + 120 * r()); g.restore(); }
  for (let k = 0; k < 40; k++) { const x = 2048 * r(), y = 2048 * r(); for (let j = 0; j < 30; j++) { g.fillStyle = j % 2 ? "#3e6a32" : "#4a7a3a"; g.beginPath(); g.arc(x + 80 * (r() - 0.5), y + 80 * (r() - 0.5), 14 + 10 * r(), 0, 6.3); g.fill(); } }
  g.strokeStyle = "#d8c8a0"; g.lineWidth = 8; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(0, 2048 * r()); g.bezierCurveTo(700, 2048 * r(), 1400, 2048 * r(), 2048, 2048 * r()); g.stroke(); }
  for (let k = 0; k < 18; k++) { g.fillStyle = "#c86a4a"; g.fillRect(2048 * r(), 2048 * r(), 18, 14); }
});
const floorTex = () => ctex("museumF", 512, 512, (g) => { for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) { g.fillStyle = ((x + y) / 64) % 2 ? "#3a3632" : "#2e2a28"; g.fillRect(x, y, 64, 64); } });
const stencil = (key: string, w: number, h: number, lines: string[], bg: string | null, fg: string, size: number, font = '"Courier New", monospace') => ctex("st" + key, w, h, (g) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.textAlign = "center"; g.font = `900 ${size}px ${font}`;
  lines.forEach((s, i) => g.fillText(s, w / 2, h / 2 + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.1));
});

// ---------------- props ----------------
/** a dead, shell-stripped Argonne tree: tall trunk, a few broken limbs, maybe a last clump of autumn leaves */
const deadTree = (b: Batch, x: number, z: number, h: number, seed: number, leaves = 0) => {
  const r = rng(seed), lean = (r() - 0.5) * 0.12, B = lam("barkT", () => ({ map: barkTex() }));
  const top = V(x + lean * h, h, z + (r() - 0.5) * 0.1 * h);
  b.add(beamBetween(V(x, 0, z), top, 0.12 + 0.12 * r(), 8), B);
  for (let k = 0; k < 4; k++) { const u = 0.45 + 0.45 * r(), p = V(x + lean * h * u, h * u, z), a = r() * 6.3, L = 0.8 + 1.6 * r(); b.add(beamBetween(p, V(p.x + L * Math.cos(a), p.y + 0.5 * L * r(), p.z + L * Math.sin(a)), 0.04 + 0.03 * r(), 6), B); }
  for (let k = 0; k < leaves; k++) b.add(new THREE.IcosahedronGeometry(0.5 + 0.5 * r(), 1).translate(top.x + (r() - 0.5) * 1.6, h * (0.75 + 0.2 * r()), top.z + (r() - 0.5) * 1.2), lam("aut" + (k % 3), () => ({ color: ["#b8742c", "#8a5a24", "#c89a3a"][k % 3] })));
};
const log = (b: Batch, x: number, z: number, L: number, ry: number) => b.add(new THREE.CylinderGeometry(0.18, 0.2, L, 8).rotateZ(Math.PI / 2).rotateY(ry).translate(x, 0.15, z), lam("barkT", () => ({ map: barkTex() })));
const wire = (b: Batch, x0: number, z0: number, x1: number, z1: number) => { // concertina coil on pickets
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3), D = C("#3a3634"), a = Math.atan2(z1 - z0, x1 - x0);
  for (let i = 0; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u; b.add(new THREE.TorusGeometry(0.4, 0.012, 4, 16).rotateY(Math.PI / 2 - a).translate(x, 0.4, z), D); }
  for (let i = 0; i <= n; i += 4) { const u = i / n; b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5).translate(x0 + (x1 - x0) * u, 0.55, z0 + (z1 - z0) * u), C("#4a3a2a")); }
};
const funk = (b: Batch, x: number, z: number, r = 0.55) => { // a scraped "funk hole": dark pit, thrown-up rim
  b.add(new THREE.CircleGeometry(r, 18).rotateX(-Math.PI / 2).translate(x, 0.02, z), C("#2a2014"));
  b.add(new THREE.TorusGeometry(r + 0.06, 0.13, 6, 20).rotateX(-Math.PI / 2).scale(1, 0.8, 1).translate(x, 0.03, z), C("#7a6446"));
};
const crater = (b: Batch, x: number, z: number, r: number) => {
  b.add(new THREE.CircleGeometry(r, 20).rotateX(-Math.PI / 2).translate(x, 0.015, z), C("#4a3a28"));
  b.add(new THREE.TorusGeometry(r, 0.18 * r, 6, 22).rotateX(-Math.PI / 2).scale(1, 0.6, 1).translate(x, 0.02, z), C("#6a5638"));
};
/** the Signal Corps pigeon basket: wicker, two compartments, a leather strap */
const basket = (b: Batch, x: number, z: number, ry = 0) => {
  const m = M4(x, 0, z, ry, 1);
  b.add(boxGeo(V(-0.3, 0, -0.2), V(0.3, 0.38, 0.2)), lam("wick", () => ({ map: rep(wickerTex(), 2, 1) })), m);
  b.add(boxGeo(V(-0.31, 0.38, -0.21), V(0.31, 0.42, 0.21)), C("#7a5a30"), m);
  b.add(boxGeo(V(-0.33, 0.18, -0.22), V(0.33, 0.24, 0.22)), C("#5a3a22"), m);
};
/** Mobile Loft No. 11 at Rampont: a coop on a trailer, louvred sides, landing board, the number painted on */
const loftTrailer = (b: Batch, x: number, z: number) => {
  const m = M4(x, 0, z, 0, 1), W = C("#5a6a44"), T = C("#3a4a2e");
  b.add(boxGeo(V(-2.4, 0.7, -1.2), V(2.4, 3.0, 1.2)), W, m);
  b.add(new THREE.CylinderGeometry(1.75, 1.75, 4.9, 3, 1, false).rotateZ(Math.PI / 2).rotateX(Math.PI / 6).scale(1, 0.45, 0.72).translate(0, 3.0, 0), T, m);
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-2.2 + 0.75 * k, 1.5, 1.2), V(-1.7 + 0.75 * k, 2.6, 1.22)), C("#2a2e24"), m);
  for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) b.add(boxGeo(V(-2.2 + 0.75 * k, 1.55 + 0.27 * j, 1.22), V(-1.7 + 0.75 * k, 1.6 + 0.27 * j, 1.26)), C("#6a7a52"), m);
  b.add(boxGeo(V(-2.4, 2.95, 1.2), V(2.4, 3.0, 1.75)), C("#8a7a5a"), m); // landing board
  for (const sx of [-1.6, 1.6]) for (const sz of [-1.25, 1.25]) b.add(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 16).rotateX(Math.PI / 2).translate(sx, 0.45, sz), C("#22242a"), m);
  b.add(new THREE.PlaneGeometry(3.6, 0.5).translate(0, 1.05, 1.235), lam("loftSt", () => ({ map: stencil("loft", 1024, 140, ["MOBILE LOFT No. 11"], null, "#f0ead6", 96), transparent: true })), m);
};
const cot = (b: Batch, x: number, z: number) => { b.add(boxGeo(V(x - 0.9, 0.5, z - 0.35), V(x + 0.9, 0.56, z + 0.35)), C("#7a7a5a")); for (const sx of [-0.85, 0.85]) b.add(boxGeo(V(x + sx - 0.03, 0, z - 0.33), V(x + sx + 0.03, 0.5, z + 0.33)), C("#4a3a2a")); };
const table = (b: Batch, x: number, z: number, w = 1.4, d = 0.8, h = 0.85, col = "#7a5a3a") => {
  b.add(boxGeo(V(x - w / 2, h - 0.05, z - d / 2), V(x + w / 2, h, z + d / 2)), C(col));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(x + sx * (w / 2 - 0.06) - 0.03, 0, z + sz * (d / 2 - 0.06) - 0.03), V(x + sx * (w / 2 - 0.06) + 0.03, h - 0.05, z + sz * (d / 2 - 0.06) + 0.03)), C("#5a4028"));
};

// ---------------- Cher Ami (2D toon card in the 3D world) ----------------
/** a black-check homing pigeon, 600 x 400 canvas, facing right.
 *  frame 0..3 = wing-beat (up, mid, down, mid) in level flight, 4 = standing, 5 = falling/tumbling, 6 = flying straight at
 *  camera (wings spread), 7 = standing on the carved wooden leg. eye: calm | wide | happy | flat | shut; blind = the
 *  left eye bandaged shut; can = the message canister on the leg; dangle = the shot leg hanging; flip */
type PO = { eye?: "calm" | "wide" | "happy" | "flat" | "shut"; blind?: boolean; can?: boolean; dangle?: boolean; flip?: boolean; wood?: boolean };
const SLATE = "#4c5262", SLATE2 = "#3a3f4c", NECK = "#3d6e60", NECK2 = "#6a4a7a", BAR = "#22252e";
const pEye = (p: Pen, x: number, y: number, eye: PO["eye"], s = 1) => {
  if (eye === "shut") { p.stroke([[x - 12 * s, y], [x, y + 5 * s], [x + 12 * s, y]], 5 * s, INK); return; }
  if (eye === "happy") { p.stroke([[x - 12 * s, y + 4 * s], [x, y - 6 * s], [x + 12 * s, y + 4 * s]], 5 * s, INK); return; }
  p.ell(x, y, 15 * s, 15 * s, "#e8892a", 4 * s);
  if (eye === "flat") { p.ell(x, y + 3 * s, 7 * s, 7 * s, INK, 0); p.poly([[x - 16 * s, y - 16 * s], [x + 16 * s, y - 16 * s], [x + 16 * s, y - 1 * s], [x - 16 * s, y - 1 * s]], SLATE, 0); p.stroke([[x - 15 * s, y - 1 * s], [x + 15 * s, y - 1 * s]], 4 * s, INK); return; }
  p.ell(x + 1 * s, y, (eye === "wide" ? 6 : 8) * s, (eye === "wide" ? 6 : 8) * s, INK, 0); p.ell(x + 4 * s, y - 4 * s, 3 * s, 3 * s, "#ffffff", 0);
};
const WING: [number, number][] = [[230, 10], [150, 110], [190, 340], [150, 200]];
const fxPigeon = (frame: number, o: PO = {}) => (p: Pen) => {
  const g = p.g; g.save(); if (o.flip) { g.translate(600, 0); g.scale(-1, 1); }
  const eye = o.eye ?? "calm";
  if (frame === 6) { // head-on, wings spread, coming straight at us
    const up = 0;
    for (const sx of [-1, 1]) { const tip: [number, number] = [300 + 285 * sx, 120 + up]; p.poly([[300 + 40 * sx, 200], [300 + 150 * sx, 150], tip, [300 + 250 * sx, 190], [300 + 200 * sx, 230], [300 + 120 * sx, 250], [300 + 40 * sx, 240]], SLATE, 8); for (let k = 0; k < 4; k++) p.stroke([[300 + (230 - 30 * k) * sx, 200 + 8 * k], [300 + (270 - 30 * k) * sx, 160 + 14 * k]], 5, SLATE2); p.stroke([[300 + 110 * sx, 200], [300 + 150 * sx, 215]], 10, BAR); }
    p.ell(300, 250, 70, 90, SLATE, 8); p.ell(300, 210, 62, 50, NECK, 6); p.ell(300, 225, 40, 20, NECK2, 0);
    p.ell(300, 160, 52, 48, SLATE, 7);
    p.poly([[288, 172], [312, 172], [300, 200]], "#2a2a30", 4); p.ell(300, 166, 10, 6, "#e8e4dc", 0);
    pEye(p, 278, 150, o.blind ? "shut" : eye, 0.8); pEye(p, 322, 150, eye, 0.8);
    if (o.blind) { p.band([[262, 138], [296, 162]], "#f2ece0", 10, 3, "round"); }
    if (o.dangle) { p.stroke([[285, 330], [292, 372]], 9, "#d46a6a"); p.stroke([[315, 330], [300, 392]], 7, "#c85a5a"); if (o.can) p.poly(rrect(286, 380, 314, 398, 4), "#c8ccd2", 4); }
    g.restore(); return;
  }
  const fly = frame <= 3 || frame === 5, tilt = frame === 5 ? 2.4 : fly ? 0 : -0.32;
  g.save(); g.translate(300, 220); g.rotate(tilt); g.translate(-300, -220);
  const far = fly ? WING[(frame + 2) % 4] : null;
  if (far && frame !== 5) p.poly([[330, 190], [far[0] + 40, far[1] + (far[1] < 200 ? 10 : -10)], [260, 220]], SLATE2, 6);
  p.poly([[150, 220], [40, 190], [36, 262], [150, 252]], SLATE2, 7); p.stroke([[60, 196], [58, 256]], 12, BAR);         // tail + dark bar
  if (!fly || frame === 5) {                                                                                         // legs
    if (o.dangle) { p.stroke([[300, 280], [306, 340]], 8, "#d46a6a"); p.stroke([[330, 285], [320, 360], [330, 372]], 7, "#c85a5a"); if (o.can) p.poly(rrect(306, 350, 336, 372, 4), "#c8ccd2", 4); }
    else {
      p.stroke([[300, 285], [298, 350]], 9, "#d46a6a"); p.stroke([[298, 350], [320, 356]], 7, "#d46a6a"); p.stroke([[298, 350], [282, 358]], 7, "#d46a6a");
      if (o.wood) { p.poly([[324, 286], [340, 286], [336, 352], [328, 352]], "#a8783e", 5); p.stroke([[328, 300], [336, 300]], 3, "#7a5228"); p.ell(332, 354, 12, 5, "#7a5228", 3); }
      else { p.stroke([[332, 285], [334, 350]], 9, "#d46a6a"); p.stroke([[334, 350], [356, 356]], 7, "#d46a6a"); if (o.can) p.poly(rrect(320, 310, 348, 334, 4), "#c8ccd2", 4); }
    }
  } else if (o.dangle) { p.stroke([[300, 270], [280, 320], [268, 350]], 7, "#c85a5a"); if (o.can) p.poly(rrect(254, 340, 284, 362, 4), "#c8ccd2", 4); }
  else p.stroke([[280, 275], [220, 290]], 9, "#d46a6a");
  p.ell(290, 230, 150, 78, SLATE, 9);                                                                                // body
  for (let k = 0; k < 9; k++) p.poly([[200 + 22 * k, 228 + 8 * (k % 2)], [210 + 22 * k, 218 + 8 * (k % 2)], [220 + 22 * k, 228 + 8 * (k % 2)], [210 + 22 * k, 238 + 8 * (k % 2)]], SLATE2, 0);
  const wt = fly && frame !== 5 ? WING[frame] : null;
  if (wt) { p.poly([[350, 190], [wt[0] + 60, wt[1]], [wt[0], wt[1] + (wt[1] < 200 ? 30 : -30)], [210, 228], [280, 240]], SLATE, 8); for (let k = 0; k < 4; k++) { const u = 0.4 + 0.15 * k; p.stroke([[350 + (wt[0] - 350) * u, 190 + (wt[1] - 190) * u], [350 + (wt[0] - 350) * u - 30, 190 + (wt[1] - 190) * u + 20]], 4, SLATE2); } p.stroke([[300, 205], [250, 215]], 12, BAR); }
  else { p.ell(260, 215, 110, 50, SLATE, 7); p.stroke([[220, 200], [300, 196]], 12, BAR); p.stroke([[210, 222], [292, 218]], 12, BAR); }
  p.ell(395, 175, 64, 60, NECK, 8); p.ell(380, 195, 40, 22, NECK2, 0);                                                // iridescent neck
  p.ell(440, 128, 54, 48, SLATE, 8);                                                                                 // head
  p.poly([[486, 124], [530, 136], [486, 144]], "#2a2a30", 4); p.ell(488, 122, 10, 6, "#e8e4dc", 0);
  pEye(p, 452, 118, eye);
  if (o.blind) { p.band([[420, 100], [480, 132]], "#f2ece0", 11, 3, "round"); p.band([[412, 140], [470, 96]], "#f2ece0", 9, 3, "round"); }
  g.restore(); g.restore();
};
/** place the pigeon: feet on (x, y, z) when standing; body at (x, y, z) when flying. w = card width */
const bird = (c: Ctx, x: number, y: number, z: number, frame: number, o: PO = {}, w = 0.45, extra: Partial<Stage["fx"][number]> = {}) => {
  const h = w * 2 / 3, stand = frame === 4 || frame === 7;
  card(c, `pg${frame}${o.eye ?? "c"}${o.blind ? "b" : ""}${o.can ? "k" : ""}${o.dangle ? "d" : ""}${o.flip ? "f" : ""}${o.wood ? "w" : ""}`, 600, 400, fxPigeon(frame, o), [x, stand ? y + h * 0.42 : y, z], w, h, extra);
  if (stand && y < 0.6) blob(c.out, x, y, z, w * 0.4);
};
const flapF = (t: number, hz = 7) => Math.floor((TQ(t) * hz * 4) % 4);

// ---------------- builders ----------------
// FOREST (the Charlevaux ravine, Argonne, 4 Oct 1918): leaf-littered mud on the slope's foot, funk holes scraped in a rough
// arc, shell-stripped trees, wire, craters, the ridge (where the German guns are) at z -14; the pigeon basket at BASK.
export const BASK: V3 = [0.45, 0, 3.1], WH: V3 = [-0.35, 0, 3.6];
const HOLES: [number, number][] = [[-1.3, 1.6], [1.2, 1.0], [-2.7, -0.4], [2.6, -0.8], [-0.2, -1.4], [-3.6, 1.8], [3.8, 1.6], [0.9, -3.0], [-1.9, -3.2], [4.6, -2.6], [-4.8, -1.8]];
const forest = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-80, 80, -80, 60, 1, 0), lam("litterF", () => ({ map: rep(litterTex(), 14, 14) })));
  for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(12 + 6 * hh(k, 1), 4 + 3 * hh(k, 2), 6).translate(-40 + 13 * k, 0, -16 - 3 * hh(k, 3)), lam("ridge", () => ({ map: rep(litterTex(), 4, 2) })));
  for (const [x, z] of HOLES) funk(b, x, z);
  for (let k = 0; k < 9; k++) crater(b, -9 + 18 * hh(k, 4), -9 + 8 * hh(k, 5), 0.6 + 0.8 * hh(k, 6));
  for (let k = 0; k < 46; k++) { const x = -16 + 32 * hh(k, 7), z = -14 + 20 * hh(k, 8); if (Math.abs(x) < 3.6 && z > -7) continue; deadTree(b, x, z, 6 + 7 * hh(k, 9), k + 10, k % 3 === 0 ? 3 : 0); }
  for (let k = 0; k < 14; k++) deadTree(b, -30 + 4.4 * k, -15 - 3 * hh(k, 1), 9 + 5 * hh(k, 2), k + 80, 2);   // the tree line on the ridge
  deadTree(b, -2.9, 5.2, 9, 3, 2); deadTree(b, 3.2, 4.4, 10, 4, 0);                                            // framing trees
  for (let k = 0; k < 8; k++) log(b, -8 + 16 * hh(k, 3), -6 + 8 * hh(k, 4), 1.5 + 2 * hh(k, 5), hh(k, 6) * 3);
  log(b, -1.6, 4.4, 2.2, 0.4);
  wire(b, -9, -5.2, 9, -5.6);
  basket(b, BASK[0], BASK[2], -0.25);
  b.add(boxGeo(V(-0.62, 0, 3.0), V(-0.18, 0.06, 3.32)), C("#6a5a3a"));                                          // the major's map case
  // tracer rounds: thin glowing rods, flown by POSE along gun -> bird lines (hidden otherwise)
  const tr = new THREE.Group(), TM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.3, 0.35), fog: false });
  for (let k = 0; k < 28; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.4, 5).rotateX(Math.PI / 2), TM); m.visible = false; tr.add(m); }
  s.root.add(tr); s.dyn.tracers = tr;
};
/** fly the tracer rods: rounds leave the guns every ~0.11 s from t0 to t1 at 34 m/s, aimed at (and around) aim(t) */
const flyTracers = (s: SetBuild, t: number, t0: number, t1: number, aim: (t: number) => V3) => {
  const ms = s.dyn.tracers.children as THREE.Mesh[]; ms.forEach((m) => (m.visible = false));
  let j = 0;
  for (let n = 0; n < 400 && j < ms.length; n++) {
    const tl = t0 + 0.065 * n; if (tl > t1 || tl > t) break;
    const age = t - tl, g = GUNS[n % GUNS.length], tg = aim(tl + 0.5), off = [1.6 * (hh(n, 1) - 0.5), 1.2 * (hh(n, 2) - 0.3), 1.2 * (hh(n, 3) - 0.5)];
    const d = new THREE.Vector3(tg[0] + off[0] - g[0], tg[1] + off[1] - g[1], tg[2] + off[2] - g[2]), L = d.length(); d.normalize();
    const dist = 34 * age; if (dist > L + 12) continue;
    const m = ms[j++]; m.visible = true; m.position.set(g[0] + d.x * dist, g[1] + d.y * dist, g[2] + d.z * dist); m.lookAt(m.position.x + d.x, m.position.y + d.y, m.position.z + d.z);
  }
};
// SKY (between the Argonne and Rampont): a vast patchwork of fields far below; the bird holds still at FLY while the land
// slides under her (POSE scrolls the ground), clouds drift by.
export const FLY: V3 = [0, 24, 0];
const sky = (s: SetBuild) => {
  sub(s, "land", (bb) => {
    bb.add(plane(-900, 900, -900, 900, 1, 0), lam("farmL", () => ({ map: rep(farmTex(), 9, 9) })));
    for (let k = 0; k < 520; k++) { const x = -160 + 320 * hh(k, 1), z = -420 + 520 * hh(k, 2), r = 1.6 + 2.2 * hh(k, 3); if (hh(k, 4) < 0.9) for (let j = 0; j < 4; j++) bb.add(new THREE.IcosahedronGeometry(r, 0).translate(x + 3 * j, r * 0.8, z + 1.5 * hh(k, j)), lam("ftree" + (k % 3), () => ({ color: ["#3e6a32", "#4a7a3a", "#5a7a30"][k % 3] }))); else { bb.add(boxGeo(V(x - 3, 0, z - 2), V(x + 3, 3, z + 2)), C("#d8cfb8")); bb.add(new THREE.ConeGeometry(4, 2.2, 4).rotateY(Math.PI / 4).scale(1, 1, 0.7).translate(x, 4.1, z), C("#b85a3a")); } }
  });
  sub(s, "clouds", (bb) => { for (let k = 0; k < 26; k++) { const x = -160 + 320 * hh(k, 1), y = 45 + 30 * hh(k, 2), z = -150 + 170 * hh(k, 3); for (let j = 0; j < 5; j++) bb.add(new THREE.SphereGeometry(3 + 4 * hh(k * 5 + j, 4), 12, 8).translate(x + 6 * (j - 2), y + 2 * hh(j, k), z + 3 * hh(j, k + 1)), C("#f4f6f8")); } });
};
// LOFT (Rampont, division HQ, ~25 miles behind the line): grass, Mobile Loft No. 11, a hospital tent, the medics' table,
// the big wall map on an easel (MAPB) for the flight diagram.
export const MAPB: V3 = [-2.6, 1.6, 1.4], TBL: V3 = [1.6, 0, 2.2];
const loft = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-80, 80, -80, 60, 1, 0), lam("grassL", () => ({ map: rep(dirt("grassL", "#7a8a4a", "rgba(60,80,30,0.35)"), 16, 16) })));
  loftTrailer(b, 0, -2.2);
  tent(b, 6.5, -3, 0.9, -0.3); tent(b, -7, -5, 0.8, 0.4);
  table(b, TBL[0], TBL[2], 1.4, 0.8, 0.85, "#8a6a4a"); b.add(boxGeo(V(TBL[0] - 0.5, 0.85, TBL[2] - 0.3), V(TBL[0] + 0.5, 0.86, TBL[2] + 0.3)), C("#f2efe6"));
  b.add(boxGeo(V(MAPB[0] - 0.75, 0.7, MAPB[2] - 0.04), V(MAPB[0] + 0.75, 2.5, MAPB[2])), C("#5a4028"));
  for (const dx of [-0.6, 0.6]) b.add(beamBetween(V(MAPB[0] + dx, 0, MAPB[2] + 0.25), V(MAPB[0] + dx, 2.5, MAPB[2] - 0.02), 0.03), C("#4a3420"));
  for (let k = 0; k < 6; k++) tree(b, -20 + 8 * k, -18 - 4 * hh(k, 1), 8 + 3 * hh(k, 2), ["#5a7a34", "#6a8a3a", "#8a7a34"][k % 3], k + 30);
  for (let k = 0; k < 3; k++) crate(b, 3.4 + 0.95 * k, 0, 0.3, 0.1 * k);
  cot(b, 5.6, 1.2);
};
// MUSEUM (Smithsonian, 2021): dark gallery, one spotlit case on a plinth (CASE), a records card on a stand, a DNA monitor.
export const CASE: V3 = [0, 1.05, 0];
const museum = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-20, 20, -20, 20, 1, 0), lam("musF", () => ({ map: rep(floorTex(), 8, 8) })));
  b.add(boxGeo(V(-12, 0, -4), V(12, 6, -3.8)), C("#2a2e3a"));
  b.add(boxGeo(V(-0.45, 0, -0.45), V(0.45, 1.0, 0.45)), C("#e8e2d4"));
  b.add(boxGeo(V(-0.42, 1.0, -0.42), V(0.42, 1.75, 0.42)), lam("glass", () => ({ color: "#e8f4fa", transparent: true, opacity: 0.07, depthWrite: false })));
  b.add(boxGeo(V(-0.43, 1.75, -0.43), V(0.43, 1.79, 0.43)), C("#b8a070"));
  b.add(boxGeo(V(-0.18, 1.0, -0.12), V(0.18, 1.06, 0.12)), C("#7a5232"));                                         // the wooden mount
  b.add(new THREE.PlaneGeometry(0.6, 0.18).translate(0, 0.78, 0.452), lam("plq", () => ({ map: stencil("plq", 512, 150, ["CHER AMI", "1918"], "#c8a860", "#2a1e10", 52, "Georgia, serif") })));
  for (const x of [-4, 4]) b.add(boxGeo(V(x - 0.7, 0, -1.5), V(x + 0.7, 1.0, -0.9)), C("#d8d2c4"));
  b.add(boxGeo(V(-0.66, 0, 0.06), V(-0.58, 0.95, 0.14)), C("#2a2a2a"));
  b.add(boxGeo(V(0.78, 0, -0.62), V(0.84, 1.2, -0.56)), C("#2a2a2a")); b.add(boxGeo(V(0.52, 1.18, -0.72), V(1.1, 1.6, -0.64)), C("#1a1c22"));
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { forest, sky, loft, museum };

// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => ConstructorParameters<typeof VfxRig>[1]) => { let r = RIGS.get(s); if (!r) { r = new VfxRig(s.root, mk()); RIGS.set(s, r); } return r; };
/** friendly-fire shells: near bursts around the funk holes while the barrage is on */
const SHELLS = (t0: number, t1: number, seed: number, near = 1) => { const r = rng(seed), o: [number, V3][] = []; for (let t = t0 + 0.2; t < t1; t += 0.55 + 0.6 * r()) { const a = r() * 6.3, d = (near ? 5 : 9) + 7 * r(); o.push([t, [d * Math.cos(a), 0, -3 + d * Math.sin(a) * 0.6 - 3]]); } return o; };
export const GUNS: V3[] = [[-6, 3.2, -14], [-1.5, 3.6, -15], [4, 3.3, -14.5]];
export const climbAt = (t: number, t0: number): V3 => { const u = Math.min(3.2, Math.max(0, t - t0)), e = u - 0.12 * u * u; return [WH[0] + 0.5 + 0.35 * e, 1.3 + 3.2 * e, WH[2] - 0.5 - 2.0 * e]; };
/** shot, she falls from the hit point h and lands on GR (lying there after) */
export const fallAt = (t: number, t0: number, h: V3): V3 => { const T = Math.sqrt(h[1] / 4), v = clamp01((t - t0) / T), y = Math.max(0, h[1] * (1 - v * v)); return [h[0] + (GR[0] - h[0]) * v, y, h[2] + (GR[2] - h[2]) * v]; };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  forest: (s, t, id) => {
    if (id === 2) rig(s, () => [...battle(SHELLS(T0s(2) - 1.5, SHOTS[3].b / FPS, 11), T0s(2)), ...forestAir(T0s(2))]).step(t);
    else if (id === 11) { const hit = A(6, "bullet") + 0.35, p = hitAt(); rig(s, () => [...featherBurst(hit, p), ...forestAir(T0s(11))]).step(t); }
    else rig(s, () => forestAir(T0s(id))).step(t);
    const ms = s.dyn.tracers.children; ms.forEach((m) => (m.visible = false));
    if (id === 10 || id === 11) flyTracers(s, t, A(5, "germans") - 0.1, A(6, "bullet") + 0.45, (u) => climbAt(u, A(5, "took")));
  },
  sky: (s, t, id) => { const u = t - T0s(id); s.dyn.land.position.set(3 * u, 0, 34 * u); s.dyn.clouds.position.set(2 * u, 0, 22 * u); },
};
const hitAt = (): V3 => climbAt(A(6, "bullet") + 0.35, A(5, "took"));

// ---------------- cast ----------------
const DB = (v: number, extra: Partial<Outfit> = {}): Outfit => ({ jacket: ["#6b6a42", "#646340", "#706e46"][v % 3], pants: "#5f5e3c", boots: "#5a3b2a", hat: "brodie", hatCol: "#5e6438", belt: "#8a7a4a", skin: SKINS[v % 3], pack: "#5a5a3a", patches: v % 2 === 0, moustache: v === 2 ? "#4a3020" : undefined, ...extra } as Outfit);
const MAJOR: Outfit = DB(0, { jacket: "#76704a", belt: "#6a4a2a", moustache: undefined, patches: false, pack: undefined });
const MEDIC: Outfit = { jacket: "#7a7a5a", pants: "#5f5e3c", boots: "#5a3b2a", hat: "cap", cap: "#6a6a4a", belt: "#f2f2f2", skin: SKINS[1] } as Outfit;

// ---------------- effect drawings ----------------
/** the major's note, 700 x 520: pencil "handwriting" (slanted serif, jittered, revealed letter by letter, n = chars shown) */
const NOTE = ["We are along the road", "parallel to 276.4.", "Our own artillery is", "dropping a barrage", "directly on us.", "For heaven's sake,", "stop it.", "— Whittlesey"];
const NOTE_N = NOTE.reduce((a, s) => a + s.length, 0);
const fxNote = (p: Pen, n: number) => { // 520 x 760
  const g = p.g;
  p.poly([[14, 18], [510, 8], [504, 752], [8, 746]], "#f2ead4", 6);
  for (let y = 150; y < 740; y += 70) { g.strokeStyle = "rgba(90,120,170,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(22, y); g.lineTo(500, y - 5); g.stroke(); }
  g.fillStyle = "rgba(160,40,40,0.5)"; g.fillRect(52, 14, 3, 734);
  txt(p, "MESSAGE — 77th DIV.", 270, 70, 30, "#7a6a50", "700", "center", '"Courier New", monospace');
  let left = n; g.font = "italic 600 38px 'Latin Modern Roman Slanted', 'LM Roman Slanted 10', Georgia, serif"; g.fillStyle = "#3a3a42"; g.textAlign = "left";
  NOTE.forEach((s, li) => {
    if (left <= 0) return; let x = 66 + (li === 7 ? 150 : 0); const y = 140 + 70 * li - li * 0.5;
    for (let k = 0; k < s.length && left > 0; k++, left--) { const ch = s[k]; g.save(); g.translate(x, y + 2 * Math.sin(k * 1.7 + li)); g.rotate(0.03 * Math.sin(k * 2.3 + li)); g.fillText(ch, 0, 0); g.restore(); x += g.measureText(ch).width + 0.6; }
  });
  if (n >= NOTE_N - 14) { g.strokeStyle = "#3a3a42"; g.lineWidth = 4; g.beginPath(); g.moveTo(66, 572); g.lineTo(230, 568); g.stroke(); }
};
/** the flight diagram on Rampont's wall map, 800 x 1000: the dotted route draws (u 0..1), labels pop, a stopwatch runs */
const fxRoute = (p: Pen, u: number, k: number) => {
  const g = p.g;
  p.poly(rrect(8, 8, 792, 992, 10), "#e8dcb8", 8);
  for (let i = 0; i < 26; i++) { g.strokeStyle = "rgba(120,100,60,0.18)"; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 40 * i); g.lineTo(792, 40 * i + 30); g.stroke(); }
  for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(90,120,60,0.25)"; g.beginPath(); g.ellipse(80 + 53 * i % 700, 120 + 211 * i % 800, 60, 30, i, 0, 6.3); g.fill(); }
  txt(p, "ARGONNE — MEUSE  1918", 400, 74, 40, "#4a3a22", "900", "center", "Georgia, serif");
  const A0: [number, number] = [170, 300], B0: [number, number] = [600, 640];
  const pt = (s: number): [number, number] => [A0[0] + (B0[0] - A0[0]) * s + 120 * Math.sin(Math.PI * s), A0[1] + (B0[1] - A0[1]) * s - 40 * Math.sin(2 * Math.PI * s)];
  g.strokeStyle = "#c0353a"; g.lineWidth = 9; g.setLineDash([22, 16]); g.beginPath(); const N = 60; for (let i = 0; i <= N * u; i++) { const q0 = pt(i / N); if (i === 0) g.moveTo(q0[0], q0[1]); else g.lineTo(q0[0], q0[1]); } g.stroke(); g.setLineDash([]);
  p.ell(A0[0], A0[1], 22, 22, "#c0353a", 5); txt(p, "LOST BATTALION", A0[0] + 10, A0[1] - 40, 34, "#2a1e10", "900", "center", '"Courier New", monospace');
  if (u > 0.98) { p.ell(B0[0], B0[1], 22, 22, "#2a6a3a", 5); txt(p, "RAMPONT LOFT", B0[0] - 40, B0[1] + 60, 34, "#2a1e10", "900", "center", '"Courier New", monospace'); }
  if (u > 0.05) { const h = pt(Math.min(1, u)); g.save(); g.translate(h[0], h[1]); g.fillStyle = "#3a3f4c"; g.beginPath(); g.ellipse(0, 0, 18, 11, 0.6, 0, 6.3); g.fill(); g.restore(); }
  if (k > 0) { p.poly(rrect(420, 330, 760, 450, 14), "#f8f2e0", 6); txt(p, "25 MILES", 590, 412, 66, "#c0353a", "900", "center"); }
  if (k > 1) { p.poly(rrect(60, 470, 400, 590, 14), "#f8f2e0", 6); txt(p, "~25 MIN", 230, 552, 66, "#2a4a8a", "900", "center"); }
};
/** Army record card, 600 x 380: SEX: HEN — then struck out and stamped COCK (MALE) */
const fxRecord = (p: Pen, stamped: boolean) => {
  p.poly(rrect(10, 10, 590, 370, 8), "#efe6cc", 6);
  txt(p, "U.S. ARMY SIGNAL CORPS", 300, 64, 34, "#3a2e1e", "900", "center", '"Courier New", monospace');
  txt(p, "PIGEON: CHER AMI", 300, 140, 40, "#2a2a2a", "700", "center", '"Courier New", monospace');
  txt(p, "SEX:  HEN", 300, 230, 64, "#2a2a2a", "900", "center", '"Courier New", monospace');
  if (stamped) { p.stroke([[150, 210], [470, 206]], 10, "#c0353a"); p.g.save(); p.g.translate(300, 300); p.g.rotate(-0.12); p.poly(rrect(-190, -50, 190, 50, 10), null, 8); p.g.strokeStyle = "#c0353a"; p.g.lineWidth = 8; p.g.strokeRect(-190, -50, 380, 100); txt(p, "MALE (DNA, 2021)", 0, 18, 46, "#c0353a", "900", "center"); p.g.restore(); }
};
const fxDNA = (p: Pen, u: number, done: boolean) => { // monitor, 560 x 400
  p.poly(rrect(6, 6, 554, 394, 12), "#0e1a22", 6);
  for (let i = 0; i < 26; i++) { const x = 40 + 18 * i, ph = i * 0.5 + u * 8; if (i / 26 > u) break; p.ell(x, 140 + 50 * Math.sin(ph), 7, 7, "#5ad0e0", 0); p.ell(x, 140 - 50 * Math.sin(ph), 7, 7, "#e05a9a", 0); p.stroke([[x, 140 + 50 * Math.sin(ph)], [x, 140 - 50 * Math.sin(ph)]], 2, "rgba(200,230,240,0.5)"); }
  txt(p, done ? "RESULT: MALE" : "ANALYSING…", 280, 320, 54, done ? "#7af07a" : "#9ad8e8", "900", "center", '"Courier New", monospace');
};
const fxBig = (p: Pen, s: string, col: string) => { txt(p, s, 600, 290, s.length > 6 ? 205 : 300, col, "900", "center", "'Inter Display','Inter',sans-serif"); };

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;
const db = (c: Ctx, i: number, v: number, x: number, z: number, fo: FrontOpts & Act = {}, y = 0) => pose(c, i, DB(v), "db" + v, x, z, { mode: "stand", expr: "neutral", look: 0, ...fo }, 1, y);
const holed = (c: Ctx, i: number, k: number, fo: FrontOpts & Act = {}) => { const [x, z] = HOLES[k]; db(c, i, k, x, z, { look: 0.4 * Math.sin(k * 2.1), ...fo }, -0.62); };
const major = (c: Ctx, x: number, z: number, fo: FrontOpts & Act = {}, y = 0) => pose(c, 1, MAJOR, "major", x, z, { mode: "stand", expr: "nervous", look: 0.3, ...fo }, 1.04, y);
/** the hook: men crouched in funk holes on the ravine floor, the pigeon basket in front with one bird peeking out */
const hook = (c: Ctx) => {
  const t = c.t, d = smooth((t - A(0, "trapped")) / 0.4) - smooth((t - A(0, "forest")) / 0.5);
  for (let k = 0; k < 7; k++) holed(c, 3 + k, k, { expr: k % 3 === 0 ? "nervous" : "sad", look: 0.5 * Math.sin(k * 2.1) + 0.3 * d * (k % 2 ? 1 : -1) });
  bird(c, BASK[0] + 0.02, 0.42, BASK[2] - 0.02, 4, { eye: "calm" }, 0.36);
};

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1918, 194 American soldiers were trapped in a forest...   (hook + loop frame)
  1: (c) => hook(c),
  // 2 ...and their own army was shelling them.   (shells burst among the holes; heads duck on each blast)
  2: (c) => {
    const t = c.t;
    for (let k = 0; k < 8; k++) holed(c, 3 + k, k, { expr: "shock", dy: -0.18 * Math.abs(Math.sin(t * 5 + k)), look: 0.3 * Math.sin(k) });
    major(c, WH[0], WH[2] - 0.5, { expr: "shock", look: -0.4 });
  },
  // 3 Their last hope...   (every head turns toward the basket)
  3: (c) => { for (let k = 0; k < 7; k++) holed(c, 3 + k, k, { expr: "sad", look: (HOLES[k][0] < BASK[0] ? 0.6 : -0.6) }); bird(c, BASK[0], 0.42, BASK[2], 4, { eye: "calm" }, 0.36); },
  // 4 ...was a pigeon.   (reaction close-up: the bird on the basket lid, a slow blink, head tilt)
  4: (c) => { const t = c.t; bird(c, BASK[0], 0.42, BASK[2], 4, { eye: t > A(1, "pigeon") + 0.6 && t < A(1, "pigeon") + 0.8 ? "shut" : "wide" }, 0.42, { rot: 0.12 * smooth((t - A(1, "pigeon") - 0.3) / 0.3) }); },
  // 5 They had already sent two birds. Both were shot down.
  5: (c) => {
    const t = c.t, a = A(2, "sent"), sh = A(2, "shot");
    for (let k = 0; k < 2; k++) {
      const u = Math.max(0, t - a - 0.25 * k), x = -0.6 + 0.9 * k + 0.6 * u, yb = 1.6 + 2.8 * u + 0.4 * u * u, z = 1.0 - 1.2 * u, hit = sh + 0.2 * k;
      if (t < hit) bird(c, x, yb, z, flapF(t + k * 0.13), { eye: "wide" }, 0.6);
      else { const v = t - hit; if (v < 1.4) bird(c, x + 0.3 * v, yb - 4 * v * v, z, 5, { eye: "shut" }, 0.6, { rot: 3 * v }); }
      if (t >= hit - LEAD && t < hit + 0.3) puffAt(c, hit, [x, yb, z]);
    }
    for (let k = 0; k < 3; k++) holed(c, 3 + k, k, { expr: t > sh ? "sad" : "awe", look: -0.2 });
  },
  // 6 The last one was named Cher Ami.   (text-behind-subject: CHER AMI stands huge behind the bird on the major's hand)
  6: (c) => {
    const t = c.t, k = pop(t, A(3, "cher"));
    major(c, WH[0] - 0.55, WH[2], { expr: "smile", look: 0.6 });
    bird(c, WH[0] + 0.0, 1.3, WH[2] + 0.12, 4, { eye: "calm" }, 0.5);
    if (after(t, A(3, "cher"))) card(c, "bigCHER", 1200, 380, (p) => fxBig(p, "CHER AMI", "#ffd23a"), [0.02, 1.5, WH[2] - 0.5], 1.5 * k, 0.475 * k);
  },
  // 7 The major scribbled a note.
  7: (c) => {
    const t = c.t;
    major(c, WH[0], WH[2], { mode: "sit", expr: "nervous", look: 0.4, lean: 0.06 * Math.sin(t * 14) } as FrontOpts & Act);
    card(c, "pad", 520, 760, (p) => fxNote(p, Math.round(30 * clamp01((t - T0s(7)) / 2))), [WH[0] + 0.05, 0.62, WH[2] + 0.25], 0.2, 0.29, { rot: 0.5 });
    bird(c, BASK[0], 0.42, BASK[2], 4, { eye: "calm" }, 0.36);
  },
  // 8 "Our own artillery is dropping a barrage directly on us. For heaven's sake, stop it."   (the note writes itself)
  8: (c) => {
    const t = c.t, a = A(4, "our") - 1.2, b = A(4, "it.") + 0.1, n = Math.round(NOTE_N * clamp01((t - a) / (b - a)));
    card(c, "note" + n, 520, 760, (p) => fxNote(p, n), NOTEP, 0.46, 0.67, { rot: -0.03 });
  },
  // 9 Cher Ami took off.   (out of the major's hands, up through the dead trees)
  9: (c) => {
    const t = c.t, to = A(5, "took"), p = climbAt(t, to);
    major(c, WH[0], WH[2], { expr: t > to ? "nervous" : "smile", look: 0.5, prop: t > to ? ("handsUp" as FrontOpts["prop"]) : null });
    if (t < to) bird(c, WH[0] + 0.4, 1.3, WH[2] + 0.12, 4, { eye: "calm", can: true }, 0.45);
    else bird(c, p[0], p[1], p[2], flapF(t, 9), { eye: "wide", can: true }, 0.45);
  },
  // 10 The Germans opened fire.   (tracers from the ridge climb at her)
  10: (c) => { const t = c.t, p = climbAt(t, A(5, "took")); bird(c, p[0], p[1], p[2], flapF(t, 10), { eye: "wide", can: true }, 0.55); },
  // 11 A bullet tore through her chest. She fell.   (feather burst, tumble down into the trees)
  11: (c) => {
    const t = c.t, hit = A(6, "bullet") + 0.35, h = hitAt();
    if (t < hit) { const p = climbAt(t, A(5, "took")); bird(c, p[0], p[1], p[2], flapF(t, 10), { eye: "wide", can: true }, 0.55); }
    else { const p = fallAt(t, hit, h), v = t - hit; bird(c, p[0], Math.max(0.2, p[1]), p[2], 5, { eye: "shut", can: true, dangle: true }, 0.55, { rot: p[1] > 0.05 ? 4 * v : 0.6 }); }
  },
  // 12 Then... she got back up.   (ground level in the leaves: still... eye opens... wings beat... up)
  12: (c) => {
    const t = c.t, wake = A(7, "she") - 0.2, up = A(7, "up") - 0.1, x = GR[0], z = GR[2];
    if (t < wake) bird(c, x, 0.2, z, 5, { eye: "shut", can: true, dangle: true }, 0.5, { rot: 0.6 });
    else if (t < up) bird(c, x, 0.0, z, 4, { eye: t > wake + 0.25 ? "wide" : "shut", blind: true, can: true, dangle: true }, 0.5, { rot: 0.15 * Math.sin((t - wake) * 30) * clamp01((t - wake) / 0.3) });
    else { const u = t - up; bird(c, x + 0.6 * u, 0.25 + 2.2 * u + 1.6 * u * u, z - 0.8 * u, flapF(t, 11), { eye: "wide", blind: true, can: true, dangle: true }, 0.5); }
  },
  // 13 Blind in one eye, her leg hanging by a tendon, she flew...   (in the sky, head-on, land streaming below)
  13: (c) => { const t = c.t; bird(c, FLY[0], FLY[1] + 0.15 * Math.sin(t * 9), FLY[2], 6, { eye: "wide", blind: true, can: true, dangle: true }, 1.0, { rot: 0.06 * Math.sin(t * 4.5) }); },
  // 14 ...twenty-five miles... in about twenty-five minutes.   (the wall map at Rampont: the route draws, labels land)
  14: (c) => {
    const t = c.t, a = T0s(14), u = q(clamp01((t - a - 0.15) / Math.max(0.6, A(8, "miles") - a)), 24), k = (t >= A(8, "miles") - LEAD ? 1 : 0) + (t >= A(8, "minutes") - LEAD ? 1 : 0);
    card(c, `route${u}_${k}`, 800, 1000, (p) => fxRoute(p, u, k), [MAPB[0], MAPB[1], MAPB[2] + 0.03], 1.1, 1.375);
  },
  // 15 The shelling stopped. 194 men walked out alive.   (smoke thinning; the ranks walk out of the ravine at us)
  15: (c) => {
    const t = c.t, w = A(9, "walked") - 0.4;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
      const u = Math.max(0, t - w - 0.05 * (k + r)), x = -3.2 + 1.25 * k + 0.6 * (r % 2), z = -3.4 - 1.5 * r + 0.75 * u;
      db(c, 20 + r * 6 + k, (r + k) % 3, x, z, { mode: u > 0 ? "march" : "stand", phase: 1.6 * u + 0.3 * k, expr: u > 0.3 ? "smile" : "sad", look: 0 } as FrontOpts & Act);
    }
  },
  // 16 The soldiers carved her a tiny wooden leg.   (Rampont, the medics' table: she stands on it, proud)
  16: (c) => {
    const t = c.t, s = A(10, "wooden");
    bird(c, TBL[0], 0.86, TBL[2], 7, { eye: t > s ? "happy" : "calm", blind: true, wood: t > s - 0.6 }, 0.45);
    pose(c, 2, MEDIC, "medic", TBL[0] + 0.85, TBL[2] - 0.55, { mode: "stand", expr: "smile", look: -0.5, prop: "point" as FrontOpts["prop"] });
    db(c, 3, 1, TBL[0] - 1.0, TBL[2] - 0.6, { expr: "laugh", look: 0.5 });
  },
  // 17 And for a hundred years, the Army called Cher Ami a girl.   (the museum case; the records card says HEN)
  17: (c) => {
    bird(c, CASE[0], CASE[1] + 0.06, CASE[2], 7, { eye: "calm", blind: true }, 0.42);
    card(c, "rec0", 600, 380, (p) => fxRecord(p, false), REC, 0.6, 0.38, { rot: -0.04 });
  },
  // 18 Then, in 2021, DNA proved... he was a boy.   (the monitor runs; the card gets stamped; the bird's deadpan)
  18: (c) => {
    const t = c.t, a = A(11, "dna"), u = q(clamp01((t - a + 0.6) / 1.2), 20), done = t >= A(11, "he") - LEAD;
    card(c, `dna${u}${done ? "d" : ""}`, 560, 400, (p) => fxDNA(p, u, done), [0.81, 1.39, -0.62], 0.54, 0.38);
    card(c, `rec${done ? 1 : 0}`, 600, 380, (p) => fxRecord(p, done), REC, 0.6, 0.38, { rot: -0.04 });
    bird(c, CASE[0], CASE[1] + 0.06, CASE[2], 7, { eye: done ? "flat" : "calm", blind: true }, 0.42);
  },
  // 19 Send this to someone who never quits.   (Cher Ami on the basket lid back in the ravine, wooden leg; ends on shot 1's frame)
  19: (c) => {
    const t = c.t, c0 = { ...c, t: c.t - (TOTAL - 1) / FPS };
    if (t >= (Math.round(A(12, "quits") * FPS) - 2.5) / FPS) { STAGE[1](c0); return; }
    bird(c, BASK[0], 0.42, BASK[2], 7, { eye: "happy", blind: true, wood: true }, 0.42);
    for (let k = 0; k < 3; k++) holed(c, 3 + k, k, { expr: "smile", look: 0.4 });
  },
};
export const GR: V3 = [1.6, 0, 4.6], NOTEP: V3 = [-0.4, 0.4, 3.16], REC: V3 = [-0.62, 1.15, 0.1];
const puffAt = (c: Ctx, at0: number, p: V3) => puff(c, at0, p, 0.9, 0.5);
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void beast; void lineStart; void atN; void fxScore; void jolt; void hop; void quad; void tri; void fxWord; void sway; void lidAt; void tier; void person; void at; void M4; void hills; void fxSay; void fxThink; void fxPlane; void fxX; void sayB; void snowGround; void hillTex; void paddyTex; void usFlag; void usmcFlag; void fence; void tanksUnused; void rifle; void flagpole; void fxCal; void fxDoc; void banner; void word; void jeep; void sandbags; void mudTex; void palm; void stay;
