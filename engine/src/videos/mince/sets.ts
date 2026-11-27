// Places and cast of "Operation Mincemeat" (1943; 9:16 short).
// Direction sheet: warm wood-panelled British office vs a cold grey German map room; night-blue sea, sun-bleached
// Huelva and Sicily; palette amber / navy / khaki + red accent. DEPTH: every interior has a near-lens foreground
// (desk + lamp + files, chair backs), exteriors have rope / wire / flowers near camera, long lenses + strong focus blur,
// camera trucks so near and far layers slide. Key moments: pockets filled, Pam, the overdraft, the briefcase, the
// submarine drop, tokens sliding to Greece, "swallowed whole", the grave. Avoid: a corpse shown grimly, Nazi symbols,
// background voices, music, faces filling frame.
import * as THREE from "three";
import { VfxRig, seaNight, seaDawn, hqDust, beachSmoke } from "./vfx";
import { geoMercator, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import land50 from "world-atlas/land-50m.json";
import { Batch, boxGeo, V, lam, M4, plane, hills } from "./props3d";
import { Kit, quad, tri } from "./build";
import { rep, ctex, planksHD, grassHD, water } from "./paint";
import { wbox, panelHD, chandelier2, painting, rug, bookcase, chair, table2, lifeboat, lifeRing } from "./decor";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, fxScore, rrect, txt, fxCardID, fxDoc, fxEnvelope, fxMemo, fxTank } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS, TOTAL } from "./story";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = feature(land50 as any, (land50 as any).objects.land) as any;
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
/** the Mediterranean from Natural Earth via d3-geo: Sardinia, Sicily, Greece labelled; ring = Sicily highlight */
const medMap = (key: string, ring: boolean) => ctex("med" + key, 1024, 700, (g) => {
  g.fillStyle = "#9cc8d8"; g.fillRect(0, 0, 1024, 700);
  const proj = geoMercator().center([16, 39]).scale(2300).translate([512, 350]);
  const path = geoPath(proj, g as unknown as CanvasRenderingContext2D);
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1.5; g.beginPath(); path(geoGraticule10()); g.stroke();
  g.fillStyle = "#e9dfc2"; g.strokeStyle = "#3a3020"; g.lineWidth = 2.2; g.beginPath(); path(LAND); g.fill(); g.stroke();
  g.font = "bold 30px Georgia, serif"; g.fillStyle = "#2a2010"; g.textAlign = "center";
  for (const [nm, lon, lat] of [["SARDINIA", 9.0, 40.1], ["SICILY", 14.1, 37.6], ["GREECE", 22.0, 39.3], ["ITALY", 14.2, 41.6], ["AFRICA", 9.5, 34.6]] as [string, number, number][]) {
    const [x, y] = proj([lon, lat])!; g.fillText(nm, x, y + (nm === "SICILY" ? 54 : 0));
  }
  if (ring) { const [x, y] = proj([14.1, 37.5])!; g.strokeStyle = "#d02a2e"; g.lineWidth = 9; g.beginPath(); g.ellipse(x, y, 92, 58, -0.1, 0, 6.3); g.stroke(); }
  g.strokeStyle = "#5a4a30"; g.lineWidth = 18; g.strokeRect(0, 0, 1024, 700);
});
const headstone = () => ctex("stone", 512, 640, (g, r) => {
  g.fillStyle = "#e8e4da"; g.fillRect(0, 0, 512, 640);
  for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "120,115,105" : "255,255,255"},0.08)`; g.fillRect(512 * r(), 640 * r(), 3, 3); }
  g.fillStyle = "#3a3630"; g.textAlign = "center";
  g.font = "bold 40px Georgia, serif"; g.fillText("WILLIAM MARTIN", 256, 150);
  g.font = "28px Georgia, serif"; g.fillText("Died 24 April 1943", 256, 205);
  g.font = "italic 30px Georgia, serif"; g.fillText("Dulce et decorum est", 256, 270); g.fillText("pro patria mori", 256, 308);
  g.fillRect(140, 345, 232, 3);
  g.font = "bold 36px Georgia, serif"; g.fillText("GLYNDWR MICHAEL", 256, 410);
  g.font = "28px Georgia, serif"; g.fillText("served as", 256, 455); g.fillText("Major William Martin, RM", 256, 495);
});
const tileFloor = () => ctex("checkF", 512, 512, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#4a4440" : "#c8c0b0"; g.fillRect(x * 64, y * 64, 64, 64); } });
const OCEAN = (key: string, col: string) => lam("ocean" + key, () => ({ map: rep(water(), 70, 70), color: col }));

// ---------------- props ----------------
const lampG = (b: Batch, x: number, y: number, z: number) => { // green banker's lamp
  b.add(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12).translate(x, y + 0.02, z), C("#c9a24a"));
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 6).translate(x, y + 0.18, z), C("#c9a24a"));
  b.add(new THREE.CylinderGeometry(0.06, 0.22, 0.14, 14, 1, true).translate(x, y + 0.38, z), lam("lampShade", () => ({ color: "#2f6a3a", side: THREE.DoubleSide })));
  b.add(new THREE.SphereGeometry(0.06, 8, 6).translate(x, y + 0.33, z), lam("bulbW", () => ({ color: "#fff2c8", emissive: "#ffd890", emissiveIntensity: 2.4 })));
};
const files = (b: Batch, x: number, y: number, z: number, n: number, seed: number) => {
  for (let k = 0; k < n; k++) b.add(boxGeo(V(x - 0.24, y + 0.05 * k, z - 0.17), V(x + 0.24, y + 0.05 * k + 0.045, z + 0.17)).rotateY(0.1 * (hh(seed + k, 2) - 0.5)), C(["#c8a870", "#d8c49a", "#b89060"][k % 3]));
};
const typewriter = (b: Batch, x: number, y: number, z: number) => {
  b.add(boxGeo(V(x - 0.28, y, z - 0.2), V(x + 0.28, y + 0.12, z + 0.2)), C("#1e1e22"));
  b.add(boxGeo(V(x - 0.3, y + 0.12, z - 0.22), V(x + 0.3, y + 0.2, z - 0.1)), C("#2a2a30"));
  b.add(boxGeo(V(x - 0.2, y + 0.18, z - 0.24), V(x + 0.2, y + 0.42, z - 0.22)), C("#f6f2e6"));
};
const desk = (b: Batch, x: number, z: number, w = 2.0, d = 0.95, ry = 0) => {
  const m = M4(x, 0, z, ry, 1), Wd = C("#6a4428");
  b.add(boxGeo(V(-w / 2, 0.74, -d / 2), V(w / 2, 0.8, d / 2)), Wd, m);
  b.add(boxGeo(V(-w / 2 + 0.05, 0, -d / 2 + 0.05), V(-w / 2 + 0.5, 0.74, d / 2 - 0.05)), C("#5a3a22"), m);
  b.add(boxGeo(V(w / 2 - 0.5, 0, -d / 2 + 0.05), V(w / 2 - 0.05, 0.74, d / 2 - 0.05)), C("#5a3a22"), m);
};
const cabinet = (b: Batch, x: number, z: number) => {
  b.add(boxGeo(V(x - 0.35, 0, z - 0.3), V(x + 0.35, 1.4, z + 0.3)), C("#5a6a5a"));
  for (let k = 0; k < 4; k++) { b.add(boxGeo(V(x - 0.3, 0.1 + 0.33 * k, z + 0.3), V(x + 0.3, 0.38 + 0.33 * k, z + 0.31)), C("#6a7a6a")); b.add(boxGeo(V(x - 0.08, 0.26 + 0.33 * k, z + 0.31), V(x + 0.08, 0.29 + 0.33 * k, z + 0.34)), C("#c9a24a")); }
};
const stars = (s: SetBuild, n = 900) => {
  const pos: number[] = [];
  for (let i = 0; i < n; i++) { const a = hh(i, 11) * Math.PI * 2, e = 0.08 + 1.3 * hh(i, 12) ** 1.6, R = 1200; pos.push(R * Math.cos(e) * Math.cos(a), R * Math.sin(e), R * Math.cos(e) * Math.sin(a)); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
  pts.frustumCulled = false; s.root.add(pts); s.dyn.stars = pts;
};
const sea = (s: SetBuild, key: string, col: string, y: number, R = 900) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R).rotateX(-Math.PI / 2), OCEAN(key, col));
  m.position.y = y; m.receiveShadow = true; s.root.add(m); s.dyn.sea = m; return m;
};
const submarine = (b: Batch, x: number, z: number) => {
  const K = lam("subK", () => ({ color: "#2a2e34" })), K2 = C("#3a3e46");
  b.add(new THREE.CylinderGeometry(1.4, 1.4, 34, 20).rotateZ(Math.PI / 2).scale(1, 0.75, 1).translate(x, -0.4, z), K);
  b.add(new THREE.ConeGeometry(1.4, 6, 20).rotateZ(-Math.PI / 2).scale(1, 0.75, 1).translate(x + 20, -0.4, z), K);
  b.add(boxGeo(V(x - 16, 0.45, z - 0.8), V(x + 16, 0.6, z + 0.8)), K2); // casing deck
  b.add(boxGeo(V(x - 2.2, 0.5, z - 0.9), V(x + 1.4, 3.6, z + 0.9)), K); // conning tower
  b.add(boxGeo(V(x - 2.3, 3.6, z - 1.0), V(x + 1.5, 3.8, z + 1.0)), K2);
  for (const dx of [-1.2, -0.4]) b.add(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8).translate(x + dx, 4.9, z), K2);
  b.add(boxGeo(V(x + 4, 0.6, z - 0.25), V(x + 5.6, 1.2, z + 0.25)), K2); // deck gun mount
  b.add(new THREE.CylinderGeometry(0.1, 0.1, 2.0, 8).rotateZ(Math.PI / 2).translate(x + 6.4, 1.05, z), K2);
};
const fishingBoat = (b: Batch) => {
  const s = new THREE.Shape(); s.moveTo(-3, 0.9); s.quadraticCurveTo(-2.6, -0.2, 0, -0.35); s.quadraticCurveTo(2.6, -0.2, 3.2, 1.0); s.lineTo(-3, 0.9);
  b.add(new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: false }).translate(0, 0, -0.95), lam("fboat", () => ({ color: "#2f6a8a" })));
  b.add(boxGeo(V(-2.9, 0.8, -0.98), V(3.1, 1.02, 0.98)), C("#e8e0cc"));
  b.add(boxGeo(V(-2.5, 0.3, -0.85), V(2.6, 0.38, 0.85)), C("#8a6a48"));
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8).translate(0.4, 2.4, 0), C("#8a6a48"));
  b.add(new THREE.PlaneGeometry(2.0, 2.6).translate(1.4, 2.9, 0.02), lam("sailF", () => ({ color: "#e8d8b0", side: THREE.DoubleSide })));
};
const whiteHouse = (b: Batch, x: number, z: number, w: number, h: number, ry: number) => {
  const m = M4(x, 0, z, ry, 1);
  b.add(boxGeo(V(-w / 2, 0, -1.6), V(w / 2, h, 1.6)), C("#f4f0e6"), m);
  b.add(boxGeo(V(-w / 2 - 0.1, h, -1.7), V(w / 2 + 0.1, h + 0.25, 1.7)), C("#c8643a"), m);
  for (let k = 0; k < Math.floor(w / 1.4); k++) b.add(boxGeo(V(-w / 2 + 0.7 + 1.4 * k - 0.25, h * 0.5, 1.6), V(-w / 2 + 0.7 + 1.4 * k + 0.25, h * 0.5 + 0.7, 1.64)), C("#2a5a8a"), m);
};
const cypress = (b: Batch, x: number, z: number, h: number) => {
  b.add(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 6).translate(x, 0.4, z), C("#5a3a22"));
  b.add(new THREE.ConeGeometry(0.55, h, 10).scale(1, 1, 1).translate(x, 0.6 + h / 2, z), lam("cypress", () => ({ color: "#2f4a2a" })));
};
const flowers = (b: Batch, x: number, z: number, n: number, seed: number) => {
  for (let k = 0; k < n; k++) {
    const fx = x + 0.6 * (hh(seed + k, 1) - 0.5), fz = z + 0.4 * (hh(seed + k, 2) - 0.5), h = 0.25 + 0.2 * hh(seed + k, 3);
    b.add(new THREE.CylinderGeometry(0.01, 0.01, h, 4).translate(fx, h / 2, fz), C("#3a6a2a"));
    b.add(new THREE.SphereGeometry(0.05, 6, 5).translate(fx, h, fz), C(["#d84a5a", "#f2c84a", "#f4f0e6", "#c84a8a"][k % 4]));
  }
};
const landingCraft = (b: Batch, x: number, z: number, ry: number) => {
  const m = M4(x, 0, z, ry, 1), G = lam("lcG", () => ({ color: "#5a6048" }));
  b.add(boxGeo(V(-1.6, -0.3, -4), V(1.6, 1.3, 3.2)), G, m);
  b.add(boxGeo(V(-1.4, 0.2, -3.8), V(1.4, 1.35, 3.0)), C("#4a5038"), m);
  b.add(new THREE.BoxGeometry(3.0, 0.12, 2.2).rotateX(-1.0).translate(0, 0.35, 4.0), G, m); // ramp down
};

// ---------------- builders ----------------
// OFFICE (MI5/Naval Intelligence room, warm): back wall z -4 with the Mediterranean map board (x -1.5) and a window
// (x 4.6); filing cabinets left; Montagu's desk right (x 3.2, z -1.6); a FOREGROUND desk near the lens (x -2.6, z 4.4)
// with lamp + files + typewriter, so most office shots look past blurred near objects (depth).
const office = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-7, 7, -4, 10, 1, 0), lam("offFloor", () => ({ map: rep(planksHD(), 4, 4), color: "#a87a52" })));
  const Pw = lam("offWall", () => ({ map: panelHD("off", "#6a5038") }));
  wbox(b, Pw, -7, 0, -4.3, 7, 3.4, -4, 1.2, 1.2);
  for (const sx of [-1, 1]) wbox(b, Pw, sx > 0 ? 7 : -7.3, 0, -4.3, sx > 0 ? 7.3 : -7, 3.4, 10, 1.2, 1.2);
  b.add(plane(-7.3, 7.3, -4.3, 10, 1, 3.4), lam("offCeil", () => ({ color: "#e8e0d0", side: THREE.DoubleSide })));
  // the map board
  b.add(boxGeo(V(-3.8, 0.85, -3.99), V(0.8, 3.05, -3.93)), C("#5a3a22"));
  b.add(new THREE.PlaneGeometry(4.4, 2.0).translate(-1.5, 1.95, -3.9), lam("medMapR", () => ({ map: medMap("r", true) })));
  // window with blinds
  b.add(boxGeo(V(3.6, 1.0, -3.99), V(5.6, 2.9, -3.95)), C("#e8e0d0"));
  b.add(boxGeo(V(3.7, 1.1, -3.95), V(5.5, 2.8, -3.94)), lam("winDay", () => ({ color: "#cfe4f2", emissive: "#a8c8e8", emissiveIntensity: 1.2 })));
  for (let k = 0; k < 12; k++) b.add(boxGeo(V(3.7, 1.15 + 0.14 * k, -3.93), V(5.5, 1.2 + 0.14 * k, -3.9)), C("#d8ccb0"));
  for (const x of [-6.1, -5.3]) cabinet(b, x, -3.6);
  desk(b, 3.4, -1.9, 2.2, 1.0, -0.2); lampG(b, 2.7, 0.8, -2.0); typewriter(b, 3.6, 0.8, -1.8); files(b, 4.2, 0.8, -2.0, 5, 3);
  // foreground desk corner (depth): POSE puts it ~3 m in front of each shot's camera, off to one side
  sub(s, "fg", (bb) => { desk(bb, 0, 0, 1.6, 0.9, 0); lampG(bb, 0.45, 0.8, -0.1); files(bb, -0.35, 0.8, 0.0, 8, 9); typewriter(bb, 0.05, 0.8, 0.2); });
  // coat rack + hanging lamps
  b.add(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 6).translate(6.2, 0.95, -2.8), C("#3a2414"));
  for (const x of [-2.5, 2.5]) { b.add(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4).translate(x, 3.0, 0), C("#222")); b.add(new THREE.ConeGeometry(0.35, 0.25, 14, 1, true).translate(x, 2.55, 0), lam("shadeM", () => ({ color: "#2a3a2a", side: THREE.DoubleSide }))); b.add(new THREE.SphereGeometry(0.1, 8, 6).translate(x, 2.48, 0), lam("bulbW2", () => ({ color: "#fff2c8", emissive: "#ffd890", emissiveIntensity: 2.4 }))); }
  b.add(boxGeo(V(-6.9, 0, 1.5), V(-6.3, 2.2, 3.2)), C("#4a3020")); // bookcase side
  for (let k = 0; k < 4; k++) for (let j = 0; j < 9; j++) b.add(boxGeo(V(-6.85, 0.25 + 0.5 * k, 1.6 + 0.17 * j), V(-6.55, 0.62 + 0.5 * k, 1.74 + 0.17 * j)), C(["#7a2a2a", "#2a4a6a", "#4a6a3a", "#8a6a3a"][(k + j) % 4]));
};
// HQ (a cold German map room): plaster walls, a big map table (x 0, z -0.6) whose map tokens POSE slides from Sicily to Greece
const hq = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-7, 7, -4, 10, 1, 0), lam("hqFloor", () => ({ map: rep(tileFloor(), 6, 6) })));
  const Wl = lam("hqWall", () => ({ color: "#a8a898" }));
  b.add(boxGeo(V(-7, 0, -4.3), V(7, 3.6, -4)), Wl);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx > 0 ? 7 : -7.3, 0, -4.3), V(sx > 0 ? 7.3 : -7, 3.6, 10)), Wl);
  b.add(plane(-7.3, 7.3, -4.3, 10, 1, 3.6), lam("hqCeil", () => ({ color: "#8a8a7e", side: THREE.DoubleSide })));
  b.add(boxGeo(V(-7, 0, -3.99), V(7, 1.0, -3.95)), C("#6a6a5e"));
  b.add(new THREE.PlaneGeometry(3.6, 2.46).translate(2.9, 2.2, -3.9), lam("medMapW", () => ({ map: medMap("w", false) })));
  // the map table
  b.add(boxGeo(V(-1.9, 0.82, -1.85), V(1.9, 0.9, 0.65)), C("#4a3020"));
  for (const sx of [-1.7, 1.7]) for (const sz of [-1.65, 0.45]) b.add(boxGeo(V(sx - 0.08, 0, sz - 0.08), V(sx + 0.08, 0.82, sz + 0.08)), C("#3a2414"));
  b.add(new THREE.PlaneGeometry(3.6, 2.4).rotateX(-Math.PI / 2).translate(0, 0.91, -0.6), lam("medMapT", () => ({ map: medMap("t", false) })));
  for (let k = 0; k < 6; k++) sub(s, "tok" + k, (bb) => { bb.add(boxGeo(V(-0.09, 0, -0.06), V(0.09, 0.08, 0.06)), C(k < 3 ? "#5a6448" : "#3a4a5a")); bb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6).translate(0, 0.14, 0), C("#2a2a2a")); bb.add(boxGeo(V(0, 0.16, -0.001), V(0.1, 0.22, 0.001)), C("#c0353a")); });
  for (const x of [-1.2, 1.2]) { b.add(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 4).translate(x, 3.1, -0.6), C("#222")); b.add(new THREE.ConeGeometry(0.4, 0.28, 14, 1, true).translate(x, 2.5, -0.6), lam("shadeH", () => ({ color: "#3a3a3a", side: THREE.DoubleSide }))); b.add(new THREE.SphereGeometry(0.1, 8, 6).translate(x, 2.42, -0.6), lam("bulbW3", () => ({ color: "#fff2c8", emissive: "#ffe0a0", emissiveIntensity: 2.4 }))); }
  for (const x of [-5.5, -4.7]) cabinet(b, x, -3.6);
  // foreground chair backs (depth)
  for (const x of [-0.7, 0.85]) { b.add(boxGeo(V(x - 0.3, 0, 3.5), V(x + 0.3, 0.5, 3.6)), C("#3a2414")); b.add(boxGeo(V(x - 0.28, 0.5, 3.75), V(x + 0.28, 1.2, 3.82)), C("#3a2414")); }
  b.add(boxGeo(V(5.0, 0, -3.0), V(6.4, 0.8, -2.2)), C("#4a3020")); b.add(new THREE.CylinderGeometry(0.15, 0.18, 0.3, 10).translate(5.6, 0.95, -2.6), C("#2a2a30")); // radio desk
};
// SEA (off Huelva): water y 0; night = HMS Seraph surfaced (x 4, z -6); dawn = a fishing boat + the white town on the shore
const seaSet = (s: SetBuild) => {
  const { b } = s;
  sea(s, "sea", "#3a5a86", 0);
  stars(s);
  sub(s, "sub", (bb) => submarine(bb, 6, -7));
  sub(s, "boat", (bb) => fishingBoat(bb));
  sub(s, "shore", (bb) => {
    bb.add(plane(-120, 120, -70, -46, 1, 0.15), lam("sandS", () => ({ color: "#e6d2a0" })));
    for (let k = 0; k < 16; k++) whiteHouse(bb, -48 + 6.5 * k + 2 * hh(k, 1), -56 - 4 * hh(k, 2), 4 + 2 * hh(k, 3), 2.6 + 2.6 * hh(k, 4), 0.05 * (hh(k, 5) - 0.5));
    bb.add(boxGeo(V(6, 0, -62), V(9, 12, -59)), C("#f4f0e6")); bb.add(new THREE.ConeGeometry(2.2, 3.4, 4).rotateY(Math.PI / 4).translate(7.5, 13.7, -60.5), C("#c8643a")); // church tower
    hills(bb, 0, -120, 120, 10, 14, 4);
  });
  // foreground rope + bollard on the sub's casing (night depth)
  sub(s, "fg", (bb) => { bb.add(new THREE.TorusGeometry(0.42, 0.08, 8, 20).rotateX(Math.PI / 2).translate(0, 0.62, 0), C("#a8946a")); bb.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10).translate(0.9, 0.85, 0.1), C("#2a2e34")); bb.add(boxGeo(V(-2.5, 0.45, -0.8), V(2.5, 0.6, 0.8)), C("#3a3e46")); });
};
// BEACH (Sicily, 10 July 1943, day): sand to the sea at z < -6, landing craft at the waterline, an empty sentry post,
// soldiers walking up the beach; barbed wire posts in the near foreground (depth)
const beach = (s: SetBuild) => {
  const { b } = s;
  sea(s, "beach", "#3a7aa0", -0.05);
  b.add(plane(-60, 60, -7, 30, 1, 0.02), lam("sandB", () => ({ color: "#ecd6a0" })));
  for (const [x, z, ry] of [[-6, -9, 0.1], [2, -10, -0.05], [10, -9.5, 0.08], [-14, -10, 0.0]] as [number, number, number][]) landingCraft(b, x, z, ry);
  b.add(boxGeo(V(5.8, 0, 2.6), V(7.4, 2.4, 4.2)), C("#9a8a6a")); b.add(boxGeo(V(5.6, 2.4, 2.4), V(7.6, 2.6, 4.4)), C("#7a6a4a")); // empty sentry post
  for (let k = 0; k < 10; k++) b.add(new THREE.CylinderGeometry(0.22, 0.24, 0.22, 8).scale(1.5, 1, 1).translate(-9.5 + 0.75 * k, 0.11, -2.4), C("#b8a478")); // sandbags
  for (const x of [-3.2, -1.2, 0.8, 2.8]) { b.add(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6).translate(x, 0.55, 6.6), C("#5a3a22")); }
  for (const y of [0.4, 0.75, 1.0]) b.add(boxGeo(V(-3.2, y - 0.01, 6.59), V(2.8, y + 0.01, 6.61)), C("#5a5a5a"));
};
// GRAVE (Huelva cemetery, sunny): a whitewashed wall of niches behind, cypresses, rows of graves; his stone at (0, -1)
const grave = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-30, 30, -8, 20, 1, 0), lam("graveG", () => ({ map: rep(grassHD(), 12, 8), color: "#c8b888" })));
  b.add(boxGeo(V(-14, 0, -7), V(14, 3.2, -6.4)), C("#f4f0e6"));
  for (let r = 0; r < 3; r++) for (let k = 0; k < 18; k++) b.add(boxGeo(V(-12.6 + 1.45 * k, 0.4 + 0.9 * r, -6.42), V(-11.6 + 1.45 * k, 1.1 + 0.9 * r, -6.38)), C("#d8d2c4"));
  for (const x of [-7, -4.6, 4.4, 7.2, 10]) cypress(b, x, -5.2, 5 + 1.5 * hh(x, 1));
  for (let k = -3; k <= 3; k++) if (k !== 0) { b.add(boxGeo(V(2.2 * k - 0.45, 0, -1.4), V(2.2 * k + 0.45, 1.0, -1.25)), C("#d8d4ca")); b.add(boxGeo(V(2.2 * k - 0.55, 0, -1.25), V(2.2 * k + 0.55, 0.15, 0.6)), C("#c8c4ba")); }
  b.add(boxGeo(V(-0.62, 0, -1.45), V(0.62, 1.45, -1.25)), C("#e8e4da"));
  b.add(new THREE.PlaneGeometry(1.14, 1.4).translate(0, 0.74, -1.24), lam("stoneT", () => ({ map: headstone() })));
  b.add(boxGeo(V(-0.7, 0, -1.25), V(0.7, 0.18, 0.9)), C("#d8d4ca"));
  flowers(b, -0.3, 0.2, 14, 3); flowers(b, 0.35, 0.4, 10, 9);
  flowers(b, -0.9, 3.6, 30, 21); flowers(b, 1.1, 3.8, 26, 33); // foreground flowers (depth)
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { office, hq, sea: seaSet, beach, grave };
const TOK_SICILY: P2[] = [[0.15, -0.35], [0.32, -0.25], [0.05, -0.18], [0.45, -0.4], [0.25, -0.12], [0.38, -0.05]];
const TOK_GREECE: P2[] = [[1.25, -0.95], [1.4, -0.8], [1.15, -0.75], [1.5, -1.05], [1.3, -0.62], [1.05, -0.9]];
// camera [x, z] -> look [x, z], and which side the foreground desk sits on (-1 left, +1 right)
const OFFICE_CAM: Record<number, [number, number, number, number, number]> = {
  1: [0.5, 7.0, 0.1, 0], 2: [0.5, 4.4, -0.9, -3.9, 1], 3: [1.0, 6.2, -0.6, -2.4, 1], 4: [0.7, 5.0, 0.25, 0.2, -1], 5: [-0.7, 7.4, 0.1, 0, -1],
  6: [0.3, 4.4, -0.15, -0.9, 1], 7: [1.0, 5.4, 0.2, 0.3, -1], 8: [0.6, 5.0, 0.05, 0.2, 1], 9: [-0.3, 4.8, 0.1, 0.2, -1], 10: [0.9, 5.2, 0.1, 0.2, 1],
  11: [-0.8, 4.8, 0.2, 0.2, -1], 16: [0.4, 5.6, 0.05, 0, 1], 19: [1.0, 9.2, 0.1, 0, 1],
} as unknown as Record<number, [number, number, number, number, number]>;
OFFICE_CAM[1] = [0.45, 6.2, 0.1, 0, -1];
// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => Parameters<typeof makeRig>[1]) => { let r = RIGS.get(s); if (!r) { r = makeRig(s.root, mk()); RIGS.set(s, r); } return r; };
const makeRig = (root: THREE.Object3D, specs: ConstructorParameters<typeof VfxRig>[1]) => new VfxRig(root, specs);
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  office: (s, t, id) => {
    const k = id === 19 && t >= A(10, "with") - 0.01 ? 1 : id;
    const [px, pz, lx, lz, side] = OFFICE_CAM[k] ?? OFFICE_CAM[1];
    const dx = lx - px, dz = lz - pz, L = Math.hypot(dx, dz), fx = dx / L, fz = dz / L, d = 2.9;
    s.dyn.fg.position.set(px + fx * d - fz * side * 0.62, 0, pz + fz * d + fx * side * 0.62);
    s.dyn.fg.rotation.y = Math.atan2(-fx, -fz) + 0.3 * side;
  },
  sea: (s, t, id) => {
    const night = SHOTS[id - 1].light === "night";
    s.dyn.stars.visible = night; s.dyn.sub.visible = night; s.dyn.fg.visible = night; s.dyn.boat.visible = !night; s.dyn.shore.visible = !night;
    s.dyn.fg.position.set(-1.9, 0, 5.4);
    s.dyn.boat.position.set(1.6, 0.05 * Math.sin(t * 1.3), -1.8); s.dyn.boat.rotation.set(0.03 * Math.sin(t * 1.1), -0.35, 0.04 * Math.sin(t * 1.4));
    if (id === 12) rig(s, () => seaNight(A(5, "slipped"), 3.6, -4.2, T0s(12))).step(t);
    if (id === 13) rig(s, () => seaDawn(T0s(13), [1.6, -1.8], [-0.2, -0.4])).step(t);
  },
  hq: (s, t, id) => {
    const u = id === 15 ? smooth((t - A(6, "moved")) / 2.2) : id > 15 ? 1 : 0;
    TOK_SICILY.forEach((p0, k) => { const p1 = TOK_GREECE[k], w = clamp01(u * 1.3 - 0.06 * k); s.dyn["tok" + k].position.set(-0.4 + p0[0] + (p1[0] - p0[0]) * w, 0.91, -0.6 + p0[1] + (p1[1] - p0[1]) * w + 0.12 * Math.sin(Math.PI * w)); });
    if (id === 14) rig(s, () => hqDust(T0s(14))).step(t);
    if (id === 15) { const tk = A(6, "tanks,"), mv = (tt: number) => -0.55 + 1.1 * smooth((tt - tk) / 1.4); rig(s, () => hqDust(T0s(15), { start: tk, at: (tt) => [mv(tt) - 0.3, 1.66, -0.48], rate: (tt) => (tt < tk + 1.5 ? 22 : 0) })).step(t); }
  },
  beach: (s, t, id) => {
    if (id === 17) rig(s, () => beachSmoke(T0s(17))).step(t);
  },
};

// ---------------- cast ----------------
const MARTIN: Outfit = { jacket: "#6e6a4a", pants: "#6e6a4a", boots: INK, hat: "peaked", cap: "#5e5a3e", belt: "#5a4630", buttons: "#c9a24a", skin: "#e8d8c8" } as Outfit;
const MARTIN_WET: Outfit = { ...MARTIN, hat: null, hair: "#3a2a1e" } as Outfit;
const SPOOK = (v: number): Outfit => ({ jacket: ["#2a3048", "#4a3a2a", "#3a3a3e"][v % 3], pants: ["#2a3048", "#4a3a2a", "#3a3a3e"][v % 3], boots: INK, hat: v === 2 ? "fedora" : "hair", hair: ["#3a2a1e", "#8a6a3a", "#1e1e1e"][v % 3], hatCol: "#2a2a30", moustache: v === 1 ? "#5a3a22" : undefined, skin: SKINS[v % 3], buttons: "#c8c0b0" } as Outfit);
const PM: Outfit = { jacket: "#1e1e24", pants: "#2a2a30", boots: INK, hat: "tophat", hatCol: "#16161a", skin: "#f0c8b0", buttons: "#c9a24a", build: "stout" } as Outfit;
const GERMAN = (v: number): Outfit => ({ jacket: "#5e6652", pants: "#5e6652", boots: INK, hat: "peaked", cap: "#5e6652", buttons: "#b8b8a8", moustache: v % 2 ? "#4a3a2a" : undefined, skin: SKINS[v % 3] } as Outfit);
const SPY: Outfit = { jacket: "#b8a47a", pants: "#3a3a3e", boots: INK, hat: "fedora", hatCol: "#4a4038", skin: SKINS[1], belt: "#8a7450" } as Outfit;
const FISHER: Outfit = { jacket: "#f4f0e6", pants: "#2a3a5a", boots: INK, hat: "beret", cap: "#1e2a44", hatCol: "#1e2a44", stripes: "#2a4a8a", moustache: "#2a1e14", skin: SKINS[2] } as Outfit;
const SOLDIER = (v: number): Outfit => ({ jacket: "#7a7450", pants: "#7a7450", boots: INK, hat: "brodie", hatCol: "#5a5a3a", pack: "#6a6440", skin: SKINS[v % 3], rifle: v % 2 === 0 } as Outfit);
const SAILOR: Outfit = { jacket: "#1e2a44", pants: "#1e2a44", boots: INK, hat: "cap", cap: "#f4f0e6", skin: SKINS[0] } as Outfit;

// ---------------- effect drawings ----------------
const fxPam = (p: Pen) => {
  p.poly(rrect(20, 20, 380, 460, 8), "#fbf8ee", 9);
  p.poly(rrect(44, 44, 356, 380, 4), "#c8c0b0", 0);
  p.ell(200, 330, 120, 90, "#3a4a6a", 0); p.ell(200, 190, 70, 84, "#f2d0b4", 6);
  p.poly([[124, 170], [150, 100], [250, 96], [280, 170], [270, 250], [250, 170], [150, 170], [130, 250]], "#6a3a1e", 0);
  p.ell(175, 200, 7, 7, INK, 0); p.ell(225, 200, 7, 7, INK, 0); p.stroke([[180, 240], [200, 248], [220, 240]], 5, "#b0404a");
  txt(p, "Pam", 200, 438, 46, "#2a2010", "italic 700", "center", "Georgia, serif");
};
const fxTicket = (p: Pen) => {
  p.poly([[20, 40], [460, 20], [470, 200], [30, 220]], "#f2c84a", 8);
  p.stroke([[350, 26], [356, 208]], 4, "#8a6a2a");
  txt(p, "THEATRE", 190, 110, 52, "#5a2a14", "900", "center", "Georgia, serif"); txt(p, "STALLS · ROW F", 190, 170, 30, "#5a2a14", "700", "center");
  txt(p, "No. 22", 410, 125, 32, "#5a2a14", "900", "center");
};
const fxRing = (p: Pen) => {
  p.poly(rrect(20, 20, 480, 340, 6), "#fbf8ee", 8);
  txt(p, "RECEIPT", 250, 80, 46, "#2a2010", "900", "center", "Georgia, serif");
  txt(p, "1 diamond engagement ring", 250, 140, 30, "#2a2010", "italic 700", "center", "Georgia, serif");
  txt(p, "£53 10s 6d", 250, 200, 46, "#2a2010", "900", "center"); txt(p, "PAID", 250, 290, 70, "#c0353a", "900", "center");
};
const fxSub = (p: Pen) => {
  p.poly(rrect(20, 20, 580, 230, 16), "#16243a", 8);
  txt(p, "HMS SERAPH", 300, 120, 70, "#f2f2f2", "900", "center"); txt(p, "30 APRIL 1943 · 4:30 AM", 300, 190, 34, "#ffd23a", "700", "center");
};
const fxTelegram = (p: Pen) => {
  p.poly(rrect(20, 20, 680, 420, 6), "#f2e6c4", 9);
  txt(p, "TELEGRAM", 350, 90, 54, "#2a2010", "900", "center", "Georgia, serif"); p.stroke([[60, 120], [640, 120]], 4, "#8a6a3a");
  txt(p, "MINCEMEAT", 350, 210, 82, "#1e1a16", "900", "center", "'Courier New', monospace");
  txt(p, "SWALLOWED WHOLE", 350, 310, 64, "#1e1a16", "900", "center", "'Courier New', monospace");
  txt(p, "STOP", 350, 385, 40, "#c0353a", "900", "center", "'Courier New', monospace");
};
const fxCase = (p: Pen) => {
  p.poly(rrect(40, 120, 560, 420, 20), "#6a4428", 10); p.stroke([[220, 120], [230, 60], [370, 60], [380, 120]], 16, "#3a2414");
  p.poly(rrect(270, 240, 330, 280, 6), "#c9a24a", 5);
  for (let k = 0; k < 7; k++) p.ell(410 + 26 * k, 90 - 16 * k, 14, 9, null, 7);
  txt(p, "TOP SECRET", 300, 360, 54, "#ffd23a", "900", "center");
};
const fxGrave = (p: Pen) => {
  p.poly(rrect(20, 20, 620, 220, 10), "#fbf8ee", 8);
  txt(p, "GLYNDWR MICHAEL", 320, 110, 60, "#2a2010", "900", "center", "Georgia, serif");
  txt(p, "1909 – 1943", 320, 180, 40, "#5a4a30", "700", "center", "Georgia, serif");
};

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;
const MT = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, y = 0, shadow = true) => pose(c, 1, MARTIN, "martin", x, z, { expr: "smile_closed", ...fo }, 1, y, shadow);
const wet = (c: Ctx, x: number, z: number, bob = 0) => pose(c, 1, MARTIN_WET, "martinW", x, z, { mode: "stand", expr: "smile_closed", look: 0.2 }, 1, -1.2 + 0.05 * Math.sin(c.t * 1.6) + bob, false);
const orbit = (c: Ctx, t: number) => { // the pocket litter circling the Major in the hook
  const items: [string, number, number, (p: Pen) => void][] = [["pamO", 400, 500, fxPam], ["tickO", 490, 240, fxTicket], ["ringO", 500, 360, fxRing], ["envO", 400, 260, (p) => fxEnvelope(p)]];
  items.forEach(([k, w, h, fn], i) => { const a = TQ(t) * 0.9 + i * 1.57; card(c, k, w, h, fn, [0.15 + 1.25 * Math.cos(a), 1.6 + 0.45 * Math.sin(a * 1.3), 0.1 + 0.6 * Math.sin(a)], 0.55, 0.55 * h / w, { rot: 0.15 * Math.sin(a * 2) }); });
};
const hook = (c: Ctx) => {
  pose(c, 2, SPOOK(0), "spook0", -1.45, -0.3, { mode: "stand", expr: "smug", look: 0.6, prop: "bills" });
  pose(c, 3, SPOOK(1), "spook1", 1.55, -0.4, { mode: "stand", expr: "grin", look: -0.6, prop: "photo" as FrontOpts["prop"] });
  MT(c, 0.1, 0.3, { mode: "stand", look: 0.1 });
  orbit(c, c.t);
};

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1943, Britain fooled Hitler... using a dead man's pockets.   (hook; the outro returns here)
  1: (c) => {
    const t = c.t; hook(c);
    if (after(t, A(0, "1943,"))) stay(c, A(0, "1943,"), "cal43", 300, 340, (p) => fxCal(p, "1943", true), [-0.72, 2.75, 0.2], 0.5, 0.56, -0.05);
    if (after(t, A(0, "pockets."))) word(c, A(0, "pockets."), "DEAD MAN'S POCKETS", [0.1, 2.95, 0.4], 2.2, 1.4, "#ffd23a");
  },
  // 2 The Allies wanted to invade Sicily. Problem? Everyone knew it was Sicily.
  2: (c) => {
    const t = c.t;
    pose(c, 2, SPOOK(0), "spook0", 0.15, -3.0, { mode: "stand", expr: "stern", look: -0.8, prop: "point" as FrontOpts["prop"] });
    if (after(t, A(1, "sicily."))) word(c, A(1, "sicily."), "TARGET: SICILY", [-1.5, 3.25, -3.6], 2.0, 1.6, "#ffd23a");
  },
  3: (c) => {
    const t = c.t;
    [[-2.6, -2.2, 0], [0.6, -3.0, 0], [-0.4, -1.4, 2], [1.6, -1.8, 1]].forEach(([x, z, v], k) => pose(c, 2 + k, SPOOK(v), `spook${v}${k}`, x, z, { mode: "stand", expr: k % 2 ? "grin" : "smug", look: -0.8, prop: "point" as FrontOpts["prop"] }));
    if (after(t, A(1, "everyone"))) banner(c, A(1, "everyone"), "EVERYONE KNEW", [-1.0, 3.2, -2.6], 2.0, "#c0353a", 1.8);
  },
  // 4 Churchill reportedly said, anyone but a bloody fool would know it's Sicily.
  4: (c) => {
    const t = c.t;
    pose(c, 6, PM, "pm", 0.2, 0.2, { mode: "stand", expr: after(t, A(1, "fool")) ? "smug" : "stern", look: 0.3, lean: -0.03 });
    if (after(t, A(1, "churchill"))) banner(c, A(1, "churchill"), "CHURCHILL", [0.2, 2.75, 0.3], 1.4, "#2a3a6a", 1.6);
    if (after(t, A(1, "anyone"))) stay(c, A(1, "anyone"), "pmSay", 600, 360, (p) => fxSay(p, "It's obviously Sicily!"), [0.3, 2.55, 0.6], 1.1, 0.66, 0.04);
  },
  // 5 So British intelligence came up with a plan. Take a dead body... and turn him into a fake officer.
  5: (c) => {
    const t = c.t;
    pose(c, 2, SPOOK(0), "spook0", -1.3, -0.4, { mode: "stand", expr: "grin", look: 0.6, prop: after(t, A(2, "body...")) ? "point" as FrontOpts["prop"] : null });
    pose(c, 3, SPOOK(1), "spook1", 1.4, -0.5, { mode: "stand", expr: "smug", look: -0.6 });
    if (after(t, A(2, "body..."))) MT(c, 0.1, 0.1, { mode: "stand", look: 0.1 });
    if (after(t, A(2, "plan."))) banner(c, A(2, "plan."), "THE PLAN", [0.1, 2.85, 0.2], 1.6, "#2a3a6a", 1.6);
    if (after(t, A(2, "fake"))) word(c, A(2, "fake"), "FAKE OFFICER", [0.1, 2.35, 0.6], 1.6, 1.4, "#ffd23a");
  },
  // 6 The idea traces back to a memo linked to Ian Fleming. Yes, the James Bond guy.
  6: (c) => {
    const t = c.t;
    pose(c, 2, SPOOK(2), "spook2", 0.4, -1.2, { mode: "stand", expr: after(t, A(2, "bond")) ? "smug" : "smile", look: -0.3 });
    if (after(t, A(2, "memo"))) stay(c, A(2, "memo"), "memoT", 500, 360, (p) => fxDoc(p, "THE TROUT MEMO", ["Idea No. 28:", "a dead airman with", "fake secret papers"], "", 0), [-0.65, 1.9, -0.6], 0.95, 0.68, -0.05);
    if (after(t, A(2, "fleming."))) banner(c, A(2, "fleming."), "IAN FLEMING", [-0.1, 2.85, -1.0], 1.4, "#c0353a", 1.6);
    if (after(t, A(2, "bond"))) word(c, A(2, "bond"), "007", [1.1, 2.2, -0.9], 0.9, 1.6, "#ffd23a");
  },
  // 7 They named him Major William Martin. Then they built him an entire fake life.
  7: (c) => {
    const t = c.t;
    MT(c, 0.2, 0.2, { mode: "stand", look: 0.2, prop: after(t, A(3, "martin.")) ? "bills" : null });
    if (after(t, A(3, "major"))) stay(c, A(3, "major"), "idcard", 720, 420, (p) => fxCardID(p, "MAJOR WILLIAM MARTIN", "Royal Marines", "Card No. 148228", "Acting Major"), [0.2, 2.35, 0.5], 1.5, 0.875, -0.04);
    if (after(t, A(3, "fake"))) word(c, A(3, "fake"), "A WHOLE FAKE LIFE", [0.2, 3.0, 0.4], 2.0, 1.6, "#ffd23a");
  },
  // 8 Love letters from a fake fiancée called Pam. Her photo? A clerk from MI5.
  8: (c) => {
    const t = c.t;
    MT(c, -0.6, 0.0, { mode: "stand", look: 0.5 });
    if (after(t, A(3, "love"))) for (let k = 0; k < 2; k++) stay(c, A(3, "love") + 0.15 * k, "env" + k, 400, 260, (p) => fxEnvelope(p, "#c0353a"), [-1.2 + 0.5 * k, 2.6 + 0.2 * k, 0.4], 0.6, 0.39, 0.1 * (k ? 1 : -1));
    if (after(t, A(3, "pam."))) stay(c, A(3, "pam."), "pam", 400, 500, fxPam, [0.75, 1.9, 0.5], 0.8, 1.0, 0.05);
    if (after(t, A(3, "clerk"))) word(c, A(3, "clerk"), "REALLY AN MI5 CLERK", [0.25, 2.65, 0.6], 1.5, 1.6, "#ffd0c0");
  },
  // 9 Theatre ticket stubs. A receipt for an engagement ring.
  9: (c) => {
    const t = c.t;
    MT(c, -0.6, 0.0, { mode: "stand", look: 0.3 });
    if (after(t, A(3, "theatre"))) stay(c, A(3, "theatre"), "ticket", 490, 240, fxTicket, [0.6, 2.4, 0.5], 1.0, 0.49, -0.08);
    if (after(t, A(3, "receipt"))) stay(c, A(3, "receipt"), "ring", 500, 360, fxRing, [0.55, 1.55, 0.6], 1.0, 0.72, 0.05);
  },
  // 10 And an angry letter from his bank about his overdraft.
  10: (c) => {
    const t = c.t;
    MT(c, -0.6, 0.0, { mode: "stand", look: 0.3 });
    if (after(t, A(3, "letter"))) stay(c, A(3, "letter"), "bank" + Math.round(4 * clamp01((t - A(3, "overdraft.")) * 4)), 500, 360, (p) => fxDoc(p, "THE BANK", ["Dear Sir,", "Your account is", "overdrawn by £79."], "OVERDRAFT!", Math.round(4 * clamp01((t - A(3, "overdraft.")) * 4)) / 4), [0.6, 2.0, 0.5], 1.2, 0.86, 0.04);
    if (after(t, A(3, "overdraft."))) word(c, A(3, "overdraft."), "EVEN HIS BANK WAS MAD", [0.0, 2.95, 0.6], 2.0, 1.6, "#ffd23a");
  },
  // 11 Chained to him: a briefcase, with fake top secret letters saying the real target was Greece.
  11: (c) => {
    const t = c.t;
    MT(c, 0.0, 0.2, { mode: "stand", look: 0.2, prop: "case" });
    if (after(t, A(4, "secret"))) stay(c, A(4, "secret"), "docG" + Math.round(4 * clamp01((t - A(4, "greece.")) * 4)), 500, 360, (p) => fxDoc(p, "MOST SECRET", ["Our next target:", "GREECE", "(Sicily = a bluff)"], "FAKE", Math.round(4 * clamp01((t - A(4, "greece.")) * 4)) / 4), [0.55, 2.25, 0.4], 1.0, 0.72, 0.05);
    if (after(t, A(4, "chained")) && t < A(4, "secret")) banner(c, A(4, "chained"), "CHAINED TO HIS WRIST", [-0.05, 2.62, 0.4], 1.5, "#2a3a6a", 1.6);
  },
  // 12 Then a submarine slipped him into the sea off Spain.   (night)
  12: (c) => {
    const t = c.t, sl = A(5, "slipped"), w = smooth((t - sl) / 1.2);
    pose(c, 2, SAILOR, "sailor", 4.4, -6.2, { mode: "stand", expr: "stern", look: -0.6 }, 1, 0.6, false);
    pose(c, 3, SAILOR, "sailor2", 7.6, -6.4, { mode: "stand", expr: "neutral", look: -0.6 }, 1, 0.6, false);
    if (w > 0) wet(c, 3.6 - 1.6 * w, -4.2 + 1.8 * w);
    if (after(t, A(5, "submarine"))) stay(c, A(5, "submarine"), "subC", 600, 250, fxSub, [1.6, 3.4, -2], 2.0, 0.83, -0.03);
  },
  // 13 A fisherman found him, and ... (dawn, Huelva)
  13: (c) => {
    const t = c.t, f0 = A(5, "found"), w = smooth((t - f0) / 1.0);
    pose(c, 2, FISHER, "fisher", 1.6, -1.8, { mode: "stand", expr: w > 0.5 ? "shock" : "neutral", look: -0.6, prop: w > 0 ? "handsUp" : null }, 1, 0.45, false);
    wet(c, -0.4 + 0.4 * w, -0.4);
    if (after(t, A(5, "fisherman"))) banner(c, A(5, "fisherman"), "HUELVA, SPAIN", [0.4, 2.45, -2.0], 1.6, "#c0353a", 1.6);
  },
  // 14 ... the papers reached German spies.
  14: (c) => {
    const t = c.t, sp = A(5, "spies.");
    pose(c, 2, SPY, "spy", -0.9, -0.2, { mode: "stand", expr: "smug", look: 0.5, prop: "photo" as FrontOpts["prop"] });
    pose(c, 3, GERMAN(1), "ger1", 1.0, -0.5, { mode: "stand", expr: "awe", look: -0.4, prop: "bills" });
    if (after(t, A(5, "papers"))) stay(c, A(5, "papers"), "docG2", 500, 360, (p) => fxDoc(p, "MOST SECRET", ["Our next target:", "GREECE"], "", 0), [0.0, 2.35, 0.2], 1.0, 0.72, 0.03);
    if (after(t, sp)) word(c, sp, "GERMAN SPIES", [0.0, 2.75, 0.2], 1.6, 1.4, "#ffd0c0");
    if (after(t, sp)) for (let k = 0; k < 3; k++) if (t > sp + 0.35 * k && t < sp + 0.35 * k + 0.12) puff(c, sp + 0.35 * k, [-0.7, 1.8, 0.2], 0.6);
  },
  // 15 And Hitler bought it. He moved troops, ships, even tanks, away from Sicily.   (map table)
  15: (c) => {
    const t = c.t;
    pose(c, 2, GERMAN(0), "ger0", -1.9, -1.0, { mode: "stand", expr: "smug", look: 0.7, prop: "point" as FrontOpts["prop"] });
    pose(c, 3, GERMAN(1), "ger1", 2.1, -1.2, { mode: "stand", expr: "grin", look: -0.7 });
    if (after(t, A(6, "bought"))) banner(c, A(6, "bought"), "HITLER BOUGHT IT", [0, 2.2, 0.0], 1.3, "#c0353a", 1.8);
    if (after(t, A(6, "tanks,"))) stay(c, A(6, "tanks,"), "tankC" + (Math.floor(TQ(t) * 15) % 6), 760, 380, (p) => fxTank(p, (Math.floor(TQ(t) * 15) % 6) / 6), [-0.55 + 1.1 * smooth((t - A(6, "tanks,")) / 1.4), 1.75, -0.5], 0.7, 0.35, 0);
    if (after(t, A(6, "sicily."))) word(c, A(6, "sicily."), "→ GREECE", [0.35, 1.3, -0.3], 0.85, 1.4, "#ffd23a");
  },
  // 16 London got a message: Mincemeat swallowed whole.   (impact card)
  16: (c) => {
    const t = c.t;
    pose(c, 2, SPOOK(0), "spook0", -1.2, -0.4, { mode: "stand", expr: "laugh", look: 0.5, prop: "handsUp" });
    pose(c, 3, SPOOK(1), "spook1", 1.3, -0.5, { mode: "stand", expr: "laugh", look: -0.5, prop: "handsUp" });
    if (after(t, A(7, "message:"))) stay(c, A(7, "message:"), "tele", 720, 460, fxTelegram, [0.05, 2.0, 0.3], 1.4, 0.89, -0.03);
  },
  // 17 In July, the Allies hit Sicily, and it was far less defended.
  17: (c) => {
    const t = c.t;
    for (let k = 0; k < 6; k++) { const ph = (TQ(t) * 1.4 + 0.2 * k) % 1, z = -4.5 + 6 * clamp01((t - T0s(17) + 0.4 * k) / 6); pose(c, 2 + k, SOLDIER(k), `sol${k % 3}`, -3.2 + 1.3 * k + 0.4 * Math.sin(k), z, { mode: "stroll", phase: ph, expr: k % 2 ? "smile" : "neutral", look: 0.1 }); }
    if (after(t, A(8, "july,"))) stay(c, A(8, "july,"), "calJ", 300, 340, (p) => fxCal(p, "JULY 1943", true), [-1.0, 3.0, 0], 0.7, 0.8, -0.05);
    if (after(t, A(8, "less"))) word(c, A(8, "less"), "FAR LESS DEFENDED", [0.8, 2.9, 0], 2.0, 1.8, "#ffd23a");
  },
  // 18 The real man was Glyndwr Michael, a homeless Welshman. Today, his grave in Spain finally carries his real name.   (quiet)
  18: (c) => {
    const t = c.t;
    if (after(t, A(9, "michael,"))) stay(c, A(9, "michael,"), "gname", 640, 240, fxGrave, [0.0, 2.05, -0.8], 1.25, 0.47, 0);
  },
  // 19 Send this to the friend who believes anything that comes with a receipt.   (ends on shot 1's frame: loop)
  19: (c) => {
    const t = c.t, c0 = { ...c, t: c.t - (TOTAL - 1) / FPS };
    hook(c0);
    if (after(t, A(10, "send")) && t < A(10, "with") - 0.15) banner(c, A(10, "send"), "SEND THIS TO THEM", [0.1, 2.95, 0.6], 1.9, "#e07a1a", 2.0);
  },
};
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxScore; void sayB; void jolt; void hop; void pop; void chair; void rug; void painting; void bookcase; void chandelier2; void flag; void waveFlags; void quad; void tri; void fxCase; void fxWord; void sway; void blob; void lidAt; void q; void tier; void person; void LEAD; void lifeboat; void lifeRing; void table2; void at;

