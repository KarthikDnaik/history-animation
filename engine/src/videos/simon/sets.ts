// Places and cast of "Simon the ship's cat" (HMS Amethyst, Yangtze 1949; 9:16 short), in a blocky brick-game style:
// 3D block avatars (rbx.ts), a blocky tuxedo cat and rats, studded baseplates and plastic colours.
// Direction sheet: quarterdeck ceremony / Hong Kong quay / the captain's cabin / the stores in the hold / the post room.
// Palette: navy + white sailors, grey ship, bright river blue, baseplate green, tuxedo black-white cat with green eyes.
// Numbers and words land on objects (chart DAY counter, chalk tally, ration crate, certificate, letter, plaque).
// Avoid: gore (a bandage, not burns), loud effects over the voice, background voices, music, any game logos.
import * as THREE from "three";
import { VfxRig, battle, forestAir, featherBurst } from "./vfx";
import { Avatar, Cat, Rat, RLook, RPose, CatPose, SALUTE, CHEER } from "./rbx";
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




// ---------------- textures ----------------
/** brick-game baseplate: flat colour with a grid of raised-stud circles */
const studs = (key: string, base: string, hi: string, lo: string, n = 8) => ctex("stud" + key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512); const s = 512 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const cx = (x + 0.5) * s, cy = (y + 0.5) * s; g.fillStyle = lo; g.beginPath(); g.arc(cx + 2, cy + 3, s * 0.3, 0, 6.3); g.fill(); g.fillStyle = hi; g.beginPath(); g.arc(cx, cy, s * 0.3, 0, 6.3); g.fill(); g.fillStyle = base; g.beginPath(); g.arc(cx, cy, s * 0.22, 0, 6.3); g.fill(); }
});
const waterTex = () => ctex("water", 1024, 1024, (g, r) => {
  g.fillStyle = "#3a8ac8"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 260; k++) { g.strokeStyle = r() < 0.5 ? "rgba(255,255,255,0.35)" : "rgba(20,60,120,0.25)"; g.lineWidth = 3 + 3 * r(); const x = 1024 * r(), y = 1024 * r(), L = 30 + 50 * r(); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L / 2, y - 8, x + L, y); g.stroke(); }
});
const plankTex = () => ctex("planks", 512, 512, (g, r) => { for (let y = 0; y < 512; y += 32) { g.fillStyle = r() < 0.5 ? "#c89a62" : "#b8885a"; g.fillRect(0, y, 512, 30); g.fillStyle = "#8a6038"; g.fillRect(0, y + 30, 512, 2); for (let x = (y / 32) % 2 ? 0 : 128; x < 512; x += 256) g.fillRect(x, y, 2, 30); } });
const greyPlate = () => studs("deckG", "#9aa0a6", "#b4bac0", "#7a8086", 10);
const stencil = (key: string, w: number, h: number, lines: string[], bg: string | null, fg: string, size: number, font = '"Courier New", monospace') => ctex("st" + key, w, h, (g) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.textAlign = "center"; g.font = `900 ${size}px ${font}`;
  lines.forEach((s, i) => g.fillText(s, w / 2, h / 2 + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.1));
});

// ---------------- props ----------------
/** a blocky sloop-of-war, bow to +x: grey hull, deck at y = DECK, bridge, funnel, mast, turrets, pennant number on the bow */
export const DECK = 1.6;
const ship = (b: Batch, x0: number, z0: number) => {
  const m = M4(x0, 0, z0, 0, 1), G = C("#8a9096"), Gd = C("#6a7076"), Dk = lam("deckP", () => ({ map: rep(greyPlate(), 12, 3) }));
  b.add(boxGeo(V(-12, -0.6, -2.6), V(10, DECK, 2.6)), G, m);
  b.add(new THREE.CylinderGeometry(2.6, 2.6, 2.2, 3, 1).rotateY(Math.PI / 6).scale(1.4, 1, 1).translate(11.2, 0.5, 0), G, m);
  b.add(boxGeo(V(-12, -0.62, -2.62), V(10, 0.0, 2.62)), C("#b0303a"), m);                                        // red boot-topping
  b.add(boxGeo(V(-12, DECK - 0.01, -2.55), V(10, DECK, 2.55)), Dk, m);
  b.add(boxGeo(V(1.5, DECK, -1.8), V(6.5, DECK + 2.0, 1.8)), C("#d8dcde"), m);                                     // superstructure
  b.add(boxGeo(V(3.6, DECK + 2.0, -1.4), V(6.2, DECK + 3.2, 1.4)), C("#e4e8ea"), m);                               // bridge
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(5.4, DECK + 2.5, -1.2 + 0.65 * k), V(6.22, DECK + 2.9, -0.8 + 0.65 * k)), C("#2a3a4a"), m);
  b.add(new THREE.CylinderGeometry(0.75, 0.8, 2.6, 18).translate(0.2, DECK + 1.3 + 1.2, 0), Gd, m);                // funnel
  b.add(new THREE.CylinderGeometry(0.76, 0.76, 0.35, 18).translate(0.2, DECK + 3.55, 0), C("#1a1a1a"), m);
  b.add(new THREE.CylinderGeometry(0.08, 0.1, 7, 8).translate(4.2, DECK + 5.5, 0), C("#5a5e62"), m);               // mast
  b.add(boxGeo(V(3.0, DECK + 6.2, -0.05), V(5.4, DECK + 6.3, 0.05)), C("#5a5e62"), m);
  for (const gx of [8.0, -9.5]) { b.add(new THREE.CylinderGeometry(0.9, 1.0, 0.7, 16).translate(gx, DECK + 0.35, 0), Gd, m); b.add(boxGeo(V(gx, DECK + 0.4, -0.12), V(gx + Math.sign(gx) * 2.4, DECK + 0.6, 0.12)), C("#4a4e52"), m); }
  for (let k = 0; k < 22; k++) for (const sz of [-1, 1]) b.add(boxGeo(V(-11.6 + k, DECK, sz * 2.5 - 0.03), V(-11.55 + k, DECK + 0.6, sz * 2.5 + 0.03)), C("#d8dcde"), m);
  for (const sz of [-1, 1]) b.add(boxGeo(V(-11.6, DECK + 0.58, sz * 2.5 - 0.03), V(10, DECK + 0.62, sz * 2.5 + 0.03)), C("#d8dcde"), m);
  b.add(new THREE.PlaneGeometry(1.6, 0.9).translate(9.2, 0.9, 2.62), lam("pen", () => ({ map: stencil("pen", 256, 140, ["F116"], null, "#f4f4f0", 110), transparent: true })), m);
};
const blockTree = (b: Batch, x: number, z: number, h: number, k: number) => {
  b.add(boxGeo(V(x - 0.3, 0, z - 0.3), V(x + 0.3, h * 0.45, z + 0.3)), C("#8a5a3a"));
  b.add(boxGeo(V(x - h * 0.3, h * 0.4, z - h * 0.3), V(x + h * 0.3, h, z + h * 0.3)), C(["#4aa84a", "#3a9a44", "#5ab450"][k % 3]));
};
const sack = (b: Batch, x: number, y: number, z: number, s = 1, col = "#d8c08a") => { b.add(new THREE.BoxGeometry(0.5 * s, 0.4 * s, 0.35 * s).translate(x, y + 0.2 * s, z), C(col)); b.add(new THREE.BoxGeometry(0.2 * s, 0.12 * s, 0.2 * s).translate(x, y + 0.44 * s, z), C(col)); };
const crateB = (b: Batch, x: number, y: number, z: number, s = 0.6, col = "#b8864a") => { b.add(boxGeo(V(x - s / 2, y, z - s / 2), V(x + s / 2, y + s, z + s / 2)), lam("crateP" + col, () => ({ map: plankTex(), color: col }))); };

// ---------------- builders ----------------
// DECK (HMS Amethyst on the Yangtze, 1949): the ship along x (bow +x) on a wide brown-blue river, blocky green banks with
// trees and gun pits on the north bank (z -40); the ceremony spot on the quarterdeck at CER (-6, DECK, 0).
export const CER: V3 = [-6.5, DECK, 0];
const deck = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-400, 400, -300, 300, 1, 0), lam("riverW", () => ({ map: rep(waterTex(), 30, 30) })));
  for (const sz of [-1, 1]) {
    b.add(boxGeo(V(-400, -0.5, sz > 0 ? 45 : -300), V(400, 1.2, sz > 0 ? 300 : -45)), lam("bankS", () => ({ map: rep(studs("grass", "#5ab44e", "#6ac45e", "#4a9a40", 8), 400, 120) })));
    for (let k = 0; k < 60; k++) blockTree(b, -200 + 400 * hh(k, sz + 3), sz * (48 + 40 * hh(k, sz + 5)), 4 + 4 * hh(k, sz + 7), k);
  }
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-140 + 50 * k, 0, -120 - 30 * hh(k, 1)), V(-110 + 50 * k, 18 + 14 * hh(k, 2), -80 - 30 * hh(k, 1))), C(["#5a9a50", "#4a8a46", "#6aa45a"][k % 3]));
  ship(b, 0, 0);
  crateB(b, CER[0], DECK, CER[2], 0.6, "#f2efe6");                                                                 // the ceremony crate (cat stands on it)
};
// DOCK (Hong Kong, March 1948): a quay of studded stone, the ship's side and gangway, cranes, blocky harbour hills.
export const GANG0: V3 = [-3, 0.9, 6], GANG1: V3 = [-3, DECK + 0.5, 2.7];
const dock = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-300, 300, -300, 300, 1, 0), lam("harbW", () => ({ map: rep(waterTex(), 25, 25) })));
  b.add(boxGeo(V(-60, 0, 3.6), V(60, 0.9, 30)), lam("quay", () => ({ map: rep(studs("quay", "#a8a49c", "#bcb8b0", "#8a867e", 8), 60, 14) })));
  ship(b, 0, 0);
  b.add(beamBetween(V(...GANG0), V(...GANG1), 0.4, 4), C("#8a6038"));
  for (let k = 0; k < 8; k++) crateB(b, 4 + 1.1 * (k % 4), 0.9, 7 + 1.1 * Math.floor(k / 4), 1.0, ["#b8864a", "#5a8acb", "#c85a4a"][k % 3]);
  for (let k = 0; k < 14; k++) b.add(boxGeo(V(-90 + 14 * k, 0, -160), V(-80 + 14 * k, 20 + 40 * hh(k, 3), -150)), C(["#c8c0b0", "#d8d0c0", "#b8b0a0"][k % 3]));
  for (let k = 0; k < 5; k++) b.add(boxGeo(V(-200 + 90 * k, 0, -260), V(-140 + 90 * k, 40 + 30 * hh(k, 4), -200)), C("#4a8a46"));
  b.add(boxGeo(V(10, 0.9, 12), V(10.6, 9, 12.6)), C("#e0a030")); b.add(boxGeo(V(10, 8.4, 6), V(10.6, 9, 13)), C("#e0a030"));
};
// CABIN (the captain's cabin): panelled box room, bunk with a blue blanket (Simon sleeps on the pillow), desk, porthole,
// the chart on the bulkhead (CHART) for the "trapped three months" diagram; the shell comes through the -x wall.
export const BUNK: V3 = [0.6, 0.62, -0.8], CHART: V3 = [-1.0, 1.55, -1.49];
const cabin = (s: SetBuild) => {
  const { b } = s, P = lam("panel", () => ({ map: plankTex(), color: "#d8b888" }));
  b.add(boxGeo(V(-2.5, -0.05, -1.6), V(2.5, 0, 1.6)), lam("cabFloor", () => ({ map: rep(studs("cf", "#7a4a30", "#8a5a3a", "#6a3a24", 6), 4, 3) })));
  b.add(boxGeo(V(-2.5, 0, -1.6), V(2.5, 2.6, -1.5)), P); b.add(boxGeo(V(2.4, 0, -1.6), V(2.5, 2.6, 1.6)), P); b.add(boxGeo(V(-2.5, 0, -1.6), V(-2.4, 2.6, 1.6)), P);
  b.add(boxGeo(V(-2.5, 2.6, -1.6), V(2.5, 2.7, 1.6)), C("#e8e0d0"));
  b.add(boxGeo(V(-0.4, 0, -1.5), V(1.8, 0.45, -0.3)), C("#8a5a3a")); b.add(boxGeo(V(-0.38, 0.45, -1.48), V(1.78, 0.55, -0.32)), C("#2a4a8a"));
  b.add(boxGeo(V(1.2, 0.55, -1.45), V(1.75, 0.68, -0.75)), C("#f4f4f0"));
  b.add(boxGeo(V(-2.35, 0, 0.3), V(-1.2, 0.8, 1.3)), C("#7a4a2a")); b.add(boxGeo(V(-2.35, 0.8, 0.25), V(-1.15, 0.85, 1.35)), C("#5a3a20"));
  b.add(new THREE.TorusGeometry(0.28, 0.06, 8, 20).translate(1.4, 1.7, -1.49), C("#c8a048")); b.add(new THREE.CircleGeometry(0.27, 20).translate(1.4, 1.7, -1.48), C("#9ad0f0"));
  b.add(boxGeo(V(CHART[0] - 0.62, CHART[1] - 0.48, -1.5), V(CHART[0] + 0.62, CHART[1] + 0.48, -1.49)), C("#5a3a20"));
  const lamp = new THREE.PointLight("#ffd8a0", 6, 6, 1.6); lamp.position.set(0, 2.3, 0.2); s.root.add(lamp);
};
// HOLD (the stores, deep in the ship): steel-grey studded bulkheads, shelves of crates and sacks, the ration crate RAT,
// the tally on the bulkhead TALLY; at x +14 the post room: desk MAILD, Lt. Hett's chair, a mountain of mail sacks.
export const RATC: V3 = [1.2, 0, 0.9], TALLY: V3 = [-1.6, 1.5, -1.98], MAILD: V3 = [14, 0, 0];
const hold = (s: SetBuild) => {
  const { b } = s, W = lam("bulk", () => ({ map: rep(studs("bulk", "#7a8088", "#8a9098", "#62686e", 6), 6, 2) }));
  b.add(boxGeo(V(-4, -0.05, -2), V(20, 0, 2.5)), lam("holdF", () => ({ map: rep(studs("hf", "#5a5e62", "#6a6e72", "#4a4e52", 6), 24, 5) })));
  b.add(boxGeo(V(-4, 0, -2.1), V(20, 3, -2.0)), W); b.add(boxGeo(V(-4.1, 0, -2.1), V(-4, 3, 2.5)), W);
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-3.6 + 1.3 * k, 1.2, -1.95), V(-2.5 + 1.3 * k, 1.26, -1.4)), C("#5a4a3a"));
  for (let k = 0; k < 14; k++) { const x = -3.4 + 0.55 * k; if (Math.abs(x - TALLY[0]) < 0.8) continue; if (k % 3 === 0) sack(b, x, 1.26, -1.7, 0.8); else crateB(b, x, 0, -1.7, 0.5, ["#b8864a", "#a87a40"][k % 2]); }
  for (let k = 0; k < 5; k++) sack(b, -3.2 + 0.6 * k, 0, 1.6, 1, "#c8b07a");
  crateB(b, RATC[0], 0, RATC[2] - 0.2, 0.7, "#c89a5a");
  for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 14).translate(2.6 + 0.6 * k, 0.4, -1.5), C("#6a4a30"));
  b.add(boxGeo(V(MAILD[0] - 0.8, 0.72, MAILD[2] - 0.45), V(MAILD[0] + 0.8, 0.78, MAILD[2] + 0.45)), C("#7a5a3a"));
  for (const [dx, dz] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) b.add(boxGeo(V(MAILD[0] + dx - 0.04, 0, MAILD[2] + dz - 0.04), V(MAILD[0] + dx + 0.04, 0.72, MAILD[2] + dz + 0.04)), C("#5a3a20"));
  for (let k = 0; k < 40; k++) { const a = hh(k, 1) * 3.0, r = 0.8 + 1.4 * hh(k, 2); sack(b, MAILD[0] + 1.3 + r * Math.cos(a) * 0.8, Math.max(0, 1.4 - r) * 0.8 + 0.3 * hh(k, 3), MAILD[2] - 1.1 + r * Math.sin(a) * 0.4, 0.9, ["#a89060", "#8a7a5a", "#b8a070"][k % 3]); }
  for (let k = 0; k < 3; k++) { const l = new THREE.PointLight("#ffe0b0", 5, 7, 1.5); l.position.set(-2 + 6 * k, 2.6, 0.3); s.root.add(l); }
  const l2 = new THREE.PointLight("#ffe0b0", 6, 7, 1.5); l2.position.set(MAILD[0], 2.6, 0.5); s.root.add(l2);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { deck, dock, cabin, hold };

// ---------------- the 3D cast: block avatars, Simon, rats (posed per frame in POSE) ----------------
const SAILOR = (v: number): RLook => ({ shirt: "#1c2440", pants: "#1c2440", kind: "sailor", hat: "sailor", skin: ["#f2c879", "#e8b070", "#c8945a"][v % 3] });
const OFFICER: RLook = { shirt: "#1a2236", pants: "#1a2236", kind: "officer", hat: "officer" };
const ADMIRAL: RLook = { shirt: "#141a2a", pants: "#141a2a", kind: "admiral", hat: "officer", skin: "#f0c080" };
const MEDIC: RLook = { shirt: "#f4f4f0", pants: "#1c2440", kind: "plain", hat: "sailor" };
const YOUNG: RLook = { shirt: "#1c2440", pants: "#1c2440", kind: "sailor", hat: "sailor", skin: "#f6d090" };
type Cast3 = { av: Map<string, Avatar>; cat: Cat; rats: Rat[]; giant: Rat; debris: THREE.Mesh[] };
const CAST = new WeakMap<SetBuild, Cast3>();
const shadowAll = (o: THREE.Object3D) => o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
const cast3 = (s: SetBuild): Cast3 => {
  let c = CAST.get(s);
  if (!c) {
    const cat = new Cat(1); shadowAll(cat.g); s.root.add(cat.g);
    const rats: Rat[] = []; for (let k = 0; k < 18; k++) { const r = new Rat(1.1); shadowAll(r.g); s.root.add(r.g); rats.push(r); }
    const giant = new Rat(3.0, "#5a5450"); shadowAll(giant.g); s.root.add(giant.g);
    const debris: THREE.Mesh[] = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12 + 0.2 * hh(k, 1), 0.08 + 0.15 * hh(k, 2), 0.1), C(k % 3 ? "#c89a62" : "#3a3a3a")); s.root.add(m); debris.push(m); }
    c = { av: new Map(), cat, rats, giant, debris }; CAST.set(s, c);
  }
  return c;
};
type Act3 = { s: SetBuild; t: number; c: Cast3 };
const av = (a: Act3, key: string, look: RLook, x: number, y: number, z: number, ry: number, p: RPose) => {
  let m = a.c.av.get(key); if (!m) { m = new Avatar(look); shadowAll(m.g); a.s.root.add(m.g); a.c.av.set(key, m); }
  m.g.visible = true; m.g.position.set(x, y, z); m.g.rotation.y = ry; m.pose(p);
};
const cat = (a: Act3, x: number, y: number, z: number, ry: number, p: CatPose, s = 1.25) => { const k = a.c.cat; k.g.visible = true; k.g.position.set(x, y, z); k.g.rotation.y = ry; k.g.scale.setScalar(s); k.pose(p, a.t); };
const rat = (a: Act3, i: number, x: number, z: number, ry: number, run: number, y = 0) => { const r = a.c.rats[i]; r.g.visible = true; r.g.position.set(x, y, z); r.g.rotation.y = ry; r.pose(run); };
/** a row of saluting/cheering sailors (the "clone grid" of the crew) */
const crew = (a: Act3, x0: number, z0: number, nx: number, nz: number, dx: number, dz: number, ry: number, p: (i: number) => RPose) => {
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) av(a, `crew${i}_${j}`, SAILOR(i + j), x0 + i * dx, DECK, z0 + j * dz, ry, p(i + j * nx));
};
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
const WAL = (t: number, hz = 1.6) => t * hz;

/** per-shot 3D action (avatars, the cat, rats, debris) */
const ACT3: Record<number, (a: Act3) => void> = {
  // 1 In 1949, the Royal Navy gave a medal to a cat.   (quarterdeck ceremony: the admiral pins it on; the crew salutes)
  1: (a) => hook3(a),
  // 2 His name was Simon.   (close on the cat on the crate; SIMON stands behind him)
  2: (a) => { cat(a, CER[0], DECK + 0.6, CER[2], Math.PI - 0.25, { sit: true, face: "calm" }); av(a, "adm", ADMIRAL, CER[0] + 1.1, DECK, CER[2] - 0.6, -0.9, { face: "smile" }); },
  // 3 A skinny stray, smuggled onto HMS Amethyst by a seventeen-year-old sailor.   (up the gangway, cat peeking from his jumper)
  3: (a) => {
    const t = a.t, u = clamp01((t - T0s(3) - 0.2) / 3.4), x = GANG0[0] + (GANG1[0] - GANG0[0]) * u, y = GANG0[1] + (GANG1[1] - GANG0[1]) * u, z = GANG0[2] + (GANG1[2] - GANG0[2]) * u;
    const look = t > A(1, "smuggled") && t < A(1, "smuggled") + 1.2 ? 0.9 * Math.sin((t - A(1, "smuggled")) * 5) : 0;
    av(a, "young", YOUNG, x, y, z, Math.PI, { walk: WAL(t), stride: 0.5, armL: -1.2, armR: -1.2, face: "grin", head: look });
    cat(a, x, y + 0.62, z - 0.24, Math.PI, { sit: true, face: "wide" }, 0.55);
  },
  // 4 Then, on the Yangtze River, the ship came under fire.
  4: (a) => { crew(a, 2, 2.0, 3, 1, 2.4, 0, 0.4, (i) => ({ face: a.t > A(2, "fire") ? "shock" : "worry", walk: a.t > A(2, "fire") ? WAL(a.t, 2.4) + i * 0.3 : undefined })); },
  // 5 A shell tore through the captain's cabin, where Simon was asleep.   (asleep on the pillow; then the wall bursts)
  5: (a) => {
    const t = a.t, hit = A(3, "tore") + 0.1;
    cat(a, 0.7, 0.56, -0.85, 0.7, { sleep: t < hit, face: t < hit ? "sleep" : "wide", tail: 0.1 * Math.sin(t * 2) });
    a.c.debris.forEach((m, k) => { const v = t - hit; if (v < 0) { m.visible = false; return; } m.visible = true; const vx = 2.5 + 2 * hh(k, 3), vy = 1.5 + 2 * hh(k, 4), vz = (hh(k, 5) - 0.5) * 3;
      m.position.set(-2.4 + vx * v, Math.max(0.05, 1.3 + vy * v - 4.9 * v * v), -0.2 + vz * v); m.rotation.set(5 * v * hh(k, 6), 4 * v, 3 * v * hh(k, 7)); });
  },
  // 6 He was badly burned. His whiskers were gone.   (bandaged, whiskers gone; the medic's gentle hand)
  6: (a) => { const t = a.t; cat(a, 0.9, 0.56, -0.75, -0.35, { sit: true, face: "sad", bandage: true, whiskers: t < A(4, "whiskers") - 0.1 }); av(a, "medic", MEDIC, 1.75, 0, -0.05, -1.0, { face: "worry", armR: -1.3 }); },
  // 7 The ship was trapped on the river for over three months.   (the chart on the bulkhead: DAY counter, the stuck marker)
  7: () => {},
  // 8 And then the rats came. Big ones. Rats that attacked the sailors.
  8: (a) => {
    const t = a.t, s0 = T0s(8);
    for (let i = 0; i < 16; i++) { const d = Math.max(0, t - s0 - 0.08 * i); const x = -3.5 + 1.6 * d + 0.25 * (i % 4), z = -1.2 + 0.55 * Math.floor(i / 4) + 0.2 * Math.sin(d * 3 + i); rat(a, i, x, z, Math.PI / 2 + 0.3 * Math.sin(i), d * 3 + i * 0.2); }
    const jump = t > A(6, "attacked") - 0.2;
    av(a, "s1", SAILOR(1), 2.2, jump ? 0.6 : 0, 0.6, -1.0, jump ? { face: "shock", armL: Math.PI, armR: Math.PI, armLz: 0.3, armRz: 0.3, lift: 0.08 * Math.abs(Math.sin(t * 10)) } : { face: "worry" });
  },
  // 9 Food was running out.   (the ration crate, nearly empty; a sailor peers in)
  9: (a) => { av(a, "s2", SAILOR(2), RATC[0] + 0.8, 0, RATC[2] + 0.2, -1.3, { face: "sad", lean: 0.25, armR: -0.7 }); },
  // 10 So Simon went to work. Every day, another rat.   (the prowl, the pounce; the tally grows on the bulkhead)
  10: (a) => {
    const t = a.t, s0 = T0s(10), u = t - s0, p = A(8, "another") - 0.25;
    if (t < p) cat(a, -3 + 1.2 * u, 0, 0.4, Math.PI / 2, { walk: u * 1.8, crouch: 0.6, face: "fierce" });
    else { const v = clamp01((t - p) / 0.45); cat(a, -3 + 1.2 * (p - s0) + 0.9 * v, 0, 0.4, Math.PI / 2, { pounce: v, face: v < 1 ? "fierce" : "happy" }); }
    if (t < p + 0.35) rat(a, 0, -3 + 1.2 * (p - s0) + 1.2, 0.4, Math.PI / 2 + 0.3, u * 2.5);
  },
  // 11 Even the giant one the crew had nicknamed Mao Tse-tung.   (the giant rat; the stand-off)
  11: (a) => {
    const t = a.t, g = a.c.giant; g.g.visible = true; g.g.position.set(1.0, 0, -0.75); g.g.rotation.y = -Math.PI / 2; g.pose(t > A(9, "giant") ? 0.15 * Math.sin(t * 8) : 0);
    cat(a, -0.9, 0, -0.75, Math.PI / 2, { crouch: 1, face: "fierce", tail: 0.8 * Math.sin(t * 9) });
  },
  // 12 The Navy promoted him to Able Seacat.   (on deck: a cap for the cat; the crew salutes)
  12: (a) => {
    const t = a.t, cp = t > A(10, "able") - 0.2;
    cat(a, CER[0], DECK + 0.6, CER[2], Math.PI - 0.25, { sit: true, face: cp ? "happy" : "calm", cap: cp, bandage: false });
    av(a, "capt", OFFICER, CER[0] + 1.35, DECK, CER[2] + 0.35, -1.75, { face: "smile", armR: -1.2 });
    crew(a, CER[0] - 1.5, CER[2] + 1.6, 4, 1, 1.0, 0, Math.PI - 0.2, () => ({ ...SALUTE, face: "smile" }));
  },
  // 13 He got so much fan mail, they appointed an officer just to answer it.   (Lt. Hett, buried in sacks)
  13: (a) => { const t = a.t; av(a, "hett", OFFICER, MAILD[0] - 0.2, 0, MAILD[2] - 0.75, 0, { sit: true, face: t > A(11, "officer") ? "worry" : "shock", armL: -1.3 + 0.2 * Math.sin(t * 10), armR: -1.3 + 0.2 * Math.sin(t * 10 + 2) }); },
  // 14 And he is still the only cat ever awarded the Dickin Medal.   (the medal; the crew cheers)
  14: (a) => { cat(a, CER[0], DECK + 0.6, CER[2], Math.PI - 0.25, { sit: true, face: "happy", medal: true, cap: true }); crew(a, CER[0] - 1.5, CER[2] + 1.6, 4, 1, 1.0, 0, Math.PI - 0.2, (i) => CHEER(a.t + i * 0.3)); },
  // 15 Send this to the cat person in your life.   (the cat on the crate, then back to the hook frame)
  15: (a) => { if (a.t >= (Math.round(A(13, "your") * FPS) - 2.5) / FPS) { hook3({ ...a, t: a.t - (TOTAL - 1) / FPS }); return; } cat(a, CER[0], DECK + 0.6, CER[2], Math.PI - 0.25, { sit: true, face: "happy", medal: true, cap: true }); },
};
/** the hook: the admiral leans in to the cat on the crate, the crew in two ranks salutes */
const hook3 = (a: Act3) => {
  const t = a.t, pin = smooth((t - A(0, "medal") + 0.4) / 0.5);
  cat(a, CER[0], DECK + 0.6, CER[2], Math.PI - 0.25, { sit: true, face: pin > 0.5 ? "wide" : "calm", medal: pin > 0.9 });
  av(a, "adm", ADMIRAL, CER[0] + 1.0, DECK, CER[2] - 0.5, -0.9, { face: "smile", armR: -1.4 * pin, lean: 0.15 * pin });
  crew(a, CER[0] - 1.6, CER[2] + 1.6, 4, 2, 1.05, 1.1, Math.PI - 0.15, () => SALUTE);
};

// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => ConstructorParameters<typeof VfxRig>[1]) => { let r = RIGS.get(s); if (!r) { r = new VfxRig(s.root, mk()); RIGS.set(s, r); } return r; };
const BANK_GUNS = (t0: number, t1: number) => { const o: [number, V3][] = []; let k = 0; for (let t = t0; t < t1; t += 0.5 + 0.4 * hh(k, 1), k++) o.push([t, [-30 + 60 * hh(k, 2), 1.2, -46]]); return o; };
const SPLASH = (t0: number, t1: number) => { const o: [number, V3][] = []; let k = 0; for (let t = t0 + 0.3; t < t1; t += 0.6 + 0.5 * hh(k, 3), k++) o.push([t, [-14 + 28 * hh(k, 4), 0, (hh(k, 5) < 0.5 ? -1 : 1) * (5 + 6 * hh(k, 6))]]); return o; };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};
for (const sid of ["deck", "dock", "cabin", "hold"] as SetId[]) POSE[sid] = (s, t, id) => {
  const c = cast3(s); c.cat.g.visible = false; c.rats.forEach((r) => (r.g.visible = false)); c.giant.g.visible = false; c.debris.forEach((m) => (m.visible = false)); c.av.forEach((m) => (m.g.visible = false));
  ACT3[id]?.({ s, t, c });
  if (id === 4) rig(s, () => [...battle(BANK_GUNS(A(2, "fire") - 0.3, SHOTS[4].b / FPS), T0s(4)), ...battle(SPLASH(A(2, "fire") - 0.2, SHOTS[4].b / FPS), T0s(4))]).step(t);
  if (id === 5) rig(s, () => battle([[A(3, "tore") + 0.1, [-2.3, 1.3, -0.2]]], T0s(5))).step(t);
};

// ---------------- effect drawings (cards: numbers and words on objects) ----------------
const fxBig = (p: Pen, s: string, col: string) => { txt(p, s, 600, 290, s.length > 6 ? 205 : 300, col, "900", "center", "'Inter Display','Inter',sans-serif"); };
/** the chart: the Yangtze from the sea to Nanking; the ship marker stuck at Rose Island; DAY counter, 1240 x 1000 */
const fxChart = (p: Pen, day: number, u: number) => {
  const g = p.g; p.poly(rrect(8, 8, 1232, 992, 10), "#ece2c4", 8);
  txt(p, "YANGTZE  1949", 620, 90, 64, "#3a2a1a", "900", "center", "Georgia, serif");
  g.strokeStyle = "#4a8ac8"; g.lineWidth = 44; g.lineCap = "round"; g.beginPath(); g.moveTo(60, 760); g.bezierCurveTo(360, 700, 420, 420, 700, 460); g.bezierCurveTo(900, 490, 1000, 300, 1180, 240); g.stroke();
  txt(p, "SEA", 110, 850, 40, "#2a4a6a", "900", "center", '"Courier New", monospace'); txt(p, "NANKING", 1100, 180, 40, "#2a4a6a", "900", "center", '"Courier New", monospace');
  const sx = 60 + 640 * Math.min(1, u * 1.2), sy = 760 - 300 * Math.min(1, u * 1.2) + 40 * Math.sin(Math.min(1, u * 1.2) * 3);
  p.ell(sx, sy, 30, 18, "#5a5e62", 5); if (u > 0.8) { p.stroke([[sx - 50, sy - 50], [sx + 50, sy + 50]], 12, "#c0353a"); p.stroke([[sx + 50, sy - 50], [sx - 50, sy + 50]], 12, "#c0353a"); txt(p, "STUCK", sx, sy + 110, 54, "#c0353a", "900", "center"); }
  p.poly(rrect(800, 700, 1200, 940, 16), "#2a2a2a", 6); txt(p, "DAY", 1000, 770, 50, "#f4f0e0", "900", "center", '"Courier New", monospace'); txt(p, String(day), 1000, 900, 130, "#ffd23a", "900", "center", '"Courier New", monospace');
};
/** chalk tally on the bulkhead, n marks in fives, 900 x 500 */
const fxTally = (p: Pen, n: number) => { const g = p.g; g.fillStyle = "rgba(255,255,255,0.0)"; g.fillRect(0, 0, 900, 500); txt(p, "RATS", 450, 90, 70, "#f4f4ea", "900", "center", '"Courier New", monospace');
  for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5, x0 = 80 + (grp % 6) * 135, y0 = 160 + Math.floor(grp / 6) * 160; if (k < 4) p.stroke([[x0 + 22 * k, y0], [x0 + 22 * k + 4, y0 + 110]], 9, "#f4f4ea"); else p.stroke([[x0 - 14, y0 + 90], [x0 + 86, y0 + 20]], 9, "#f4f4ea"); } };
/** ABLE SEACAT certificate, 900 x 640 */
const fxCert = (p: Pen) => { p.poly(rrect(10, 10, 890, 630, 12), "#f6efd8", 8); p.poly(rrect(36, 36, 864, 604, 8), null, 6);
  txt(p, "ROYAL NAVY", 450, 120, 52, "#1c2440", "900", "center", "Georgia, serif"); txt(p, "promotes", 450, 200, 44, "#5a4a30", "700", "center", "Georgia, serif");
  txt(p, "SIMON", 450, 300, 96, "#1c2440", "900", "center", "Georgia, serif"); txt(p, "ABLE SEACAT", 450, 430, 88, "#c0353a", "900", "center"); txt(p, "H.M.S. AMETHYST  ·  1949", 450, 540, 36, "#5a4a30", "700", "center", "Georgia, serif"); };
/** a fan letter in handwriting, 700 x 520 (n chars revealed) */
const LETTER = ["Dear Simon,", "You are the bravest", "cat in the world.", "Love, Margaret (age 9)"];
const LET_N = LETTER.reduce((a, s) => a + s.length, 0);
const fxLetter = (p: Pen, n: number) => { const g = p.g; p.poly([[14, 18], [690, 8], [684, 510], [8, 504]], "#fbf6e8", 6);
  let left = n; g.font = "italic 600 46px 'Latin Modern Roman Slanted', Georgia, serif"; g.fillStyle = "#2a3a8a"; g.textAlign = "left";
  LETTER.forEach((s, li) => { if (left <= 0) return; let x = 60 + (li === 3 ? 90 : 0); const y = 120 + 104 * li; for (let k = 0; k < s.length && left > 0; k++, left--) { g.save(); g.translate(x, y + 2 * Math.sin(k * 1.7 + li)); g.rotate(0.03 * Math.sin(k * 2.3)); g.fillText(s[k], 0, 0); g.restore(); x += g.measureText(s[k]).width + 0.5; } });
  p.poly([[560, 410], [600, 380], [640, 410], [600, 470]], "#e05a6a", 0); };
/** the Dickin Medal plaque, 900 x 560 */
const fxPlaque = (p: Pen) => { p.poly(rrect(10, 10, 890, 550, 18), "#2a2a2e", 8); p.ell(160, 280, 100, 100, "#b8864a", 8); txt(p, "★", 160, 318, 110, "#7a5222", "900", "center");
  txt(p, "DICKIN MEDAL", 560, 200, 78, "#ffd23a", "900", "center"); txt(p, "THE ONLY CAT", 560, 330, 74, "#f4f4ea", "900", "center"); txt(p, "EVER AWARDED IT", 560, 440, 56, "#f4f4ea", "700", "center"); };
const fxRation = (p: Pen) => { p.poly(rrect(10, 10, 590, 250, 10), "#c89a5a", 6); txt(p, "RATIONS", 300, 120, 96, "#3a2410", "900", "center", '"Courier New", monospace'); txt(p, "1 WEEK LEFT", 300, 210, 54, "#a0202a", "900", "center", '"Courier New", monospace'); };

// ---------------- staging (2D cards) ----------------
type StageFn = (c: Ctx) => void;
export const STAGE: Record<number, StageFn> = {
  1: () => {},
  2: (c) => { const t = c.t, k = pop(t, A(1, "simon")); if (after(t, A(1, "simon"))) card(c, "bigSIMON", 1200, 380, (p) => fxBig(p, "SIMON", "#ffd23a"), [CER[0] - 0.05, DECK + 1.0, CER[2] + 0.95], 1.5 * k, 0.475 * k); },
  3: () => {}, 4: () => {}, 5: () => {}, 6: () => {},
  7: (c) => { const t = c.t, u = clamp01((t - T0s(7) - 0.2) / Math.max(0.8, A(5, "months") - T0s(7))), day = Math.max(1, Math.round(101 * clamp01((t - A(5, "trapped")) / Math.max(0.6, A(5, "months") - A(5, "trapped") + 0.4)))), uq = q(u, 20);
    card(c, `chart${day}_${uq}`, 1240, 1000, (p) => fxChart(p, day, uq), [CHART[0], CHART[1], CHART[2] + 0.02], 1.2, 0.968); },
  8: () => {},
  9: (c) => card(c, "ration", 600, 260, fxRation, [RATC[0], 0.52, RATC[2] + 0.17], 0.66, 0.286, { rot: 0 }),
  10: (c) => { const t = c.t, n = Math.min(37, Math.max(0, Math.round(37 * clamp01((t - A(8, "every") + 0.2) / 1.0)))); card(c, "tally" + n, 900, 500, (p) => fxTally(p, n), [TALLY[0], TALLY[1] + 0.1, TALLY[2] + 0.05], 1.7, 0.94); },
  11: () => {},
  12: (c) => { const t = c.t, k = pop(t, A(10, "able")); if (after(t, A(10, "promoted"))) card(c, "cert", 900, 640, fxCert, [CER[0] + 0.75, DECK + 1.25, CER[2] - 0.35], 0.62 * Math.max(1, k), 0.44 * Math.max(1, k), { rot: -0.08 }); },
  13: (c) => { const t = c.t, n = Math.round(LET_N * clamp01((t - T0s(13) - 0.3) / 2.4)); card(c, "letter" + n, 700, 520, (p) => fxLetter(p, n), [MAILD[0] + 0.25, 0.86, MAILD[2] - 0.05], 0.5, 0.37, { rot: -0.1 }); },
  14: (c) => { const t = c.t, k = pop(t, A(12, "dickin")); if (after(t, A(12, "dickin"))) card(c, "plaque", 900, 560, fxPlaque, [CER[0], DECK + 2.55, CER[2] + 1.2], 1.2 * k, 0.75 * k); },
  15: () => {},
};
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void beast; void lineStart; void atN; void fxScore; void jolt; void hop; void quad; void tri; void fxWord; void sway; void lidAt; void tier; void person; void at; void hills; void fxSay; void fxThink; void fxPlane; void fxX; void sayB; void snowGround; void hillTex; void paddyTex; void usFlag; void usmcFlag; void fence; void tanksUnused; void rifle; void flagpole; void fxCal; void fxDoc; void banner; void word; void jeep; void sandbags; void palm; void stay; void blob; void pose; void puff; void tent; void crate; void tree; void SKINS; void INK; void fxPuff; void forestAir; void featherBurst; void MEDIC;
