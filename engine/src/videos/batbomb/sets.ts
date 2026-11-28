// Places and cast of "The Bat Bomb" (Project X-Ray, 1942-44; 9:16 short), in a blocky brick-game style:
// 3D block avatars (rbx.ts), blocky bats with incendiaries, studded baseplates and plastic colours.
// Direction sheet: dawn sky with the bomber and the parachute casing / Adams' dental office / the New Mexico cave at
// dusk / Carlsbad Army Airfield, May 1943 / the mock village at the test range.
// Palette: olive drab + bat brown, desert tan, dawn orange sky, white coat, fire orange. One clear subject per frame.
// Numbers and words land on objects (casing stencil, scale display, sign boards, building signs, chart board, stamp).
// Avoid: gore, people hurt (nobody was), crowd voices, music, loud effects over the voice, any game logos.
import * as THREE from "three";
import { VfxRig, fire, batStream } from "./vfx";
import { Avatar, Bat, RLook, RPose, BatPose } from "./rbx";
import { Batch, boxGeo, V, lam, M4, plane, beamBetween } from "./props3d";
import { Kit } from "./build";
import { rep, ctex } from "./paint";
import { Pen, rrect, txt, fxSay, fxBulb, fxFlameAt } from "./toon";
import { Stage, CamInfo, hh, q } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS, TOTAL, casY9 } from "./story";
type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<Stage["fx"][number]> = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
const pop = (t: number, at0: number) => { const u = clamp01((t - at0 + LEAD) / 0.18); return u <= 0 ? 0 : 1 + 0.25 * Math.sin(Math.PI * u) * (1 - u) + (u < 1 ? -0.3 * (1 - u) : 0); };
const A = (l: number, w: string, n = 0) => (n ? atN(l, w, n) : at(l, w));
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const C = (col: string) => lam("c" + col, () => ({ color: col }));
const sub = (s: SetBuild, key: string, fill: (b: Batch) => void) => { const g = new THREE.Group(), b = new Batch(); fill(b); b.build(g); s.root.add(g); s.dyn[key] = g; return g; };

// ---------------- textures ----------------
/** brick-game baseplate: flat colour with a grid of raised-stud circles */
const studs = (key: string, base: string, hi: string, lo: string, n = 8) => ctex("stud" + key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512); const s = 512 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const cx = (x + 0.5) * s, cy = (y + 0.5) * s; g.fillStyle = lo; g.beginPath(); g.arc(cx + 2, cy + 3, s * 0.3, 0, 6.3); g.fill(); g.fillStyle = hi; g.beginPath(); g.arc(cx, cy, s * 0.3, 0, 6.3); g.fill(); g.fillStyle = base; g.beginPath(); g.arc(cx, cy, s * 0.22, 0, 6.3); g.fill(); }
});
const plankTex = () => ctex("planks", 512, 512, (g, r) => { for (let y = 0; y < 512; y += 32) { g.fillStyle = r() < 0.5 ? "#c89a62" : "#b8885a"; g.fillRect(0, y, 512, 30); g.fillStyle = "#8a6038"; g.fillRect(0, y + 30, 512, 2); for (let x = (y / 32) % 2 ? 0 : 128; x < 512; x += 256) g.fillRect(x, y, 2, 30); } });
const stencil = (key: string, w: number, h: number, lines: string[], bg: string | null, fg: string, size: number, font = '"Courier New", monospace') => ctex("st" + key, w, h, (g) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.textAlign = "center"; g.font = `900 ${size}px ${font}`;
  lines.forEach((s, i) => g.fillText(s, w / 2, h / 2 + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.1));
});
const label = (b: Batch, key: string, x: number, y: number, z: number, w: number, h: number, lines: string[], bg: string | null, fg: string, size: number, ry = 0) =>
  b.add(new THREE.PlaneGeometry(w, h), lam("lb" + key, () => ({ map: stencil(key, Math.round(256 * w / h), 256, lines, bg, fg, size), transparent: !bg })), M4(x, y, z, ry, 1));
const stripes = () => ctex("chute", 512, 256, (g) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? "#f4f0e6" : "#e8762a"; g.fillRect(k * 64, 0, 64, 256); } });
const starTex = () => ctex("star", 256, 256, (g) => { g.fillStyle = "#1c2a5a"; g.beginPath(); g.arc(128, 128, 120, 0, 6.3); g.fill(); g.fillStyle = "#f4f4f0"; g.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 42 : 104; g.lineTo(128 + r * Math.cos(a), 128 + r * Math.sin(a)); } g.closePath(); g.fill(); });

// ---------------- props ----------------
const OD = "#7a7c3c"; // olive drab
const blockTree = (b: Batch, x: number, z: number, h: number, k: number) => {
  b.add(boxGeo(V(x - 0.3, 0, z - 0.3), V(x + 0.3, h * 0.45, z + 0.3)), C("#8a5a3a"));
  b.add(boxGeo(V(x - h * 0.3, h * 0.4, z - h * 0.3), V(x + h * 0.3, h, z + h * 0.3)), C(["#4aa84a", "#3a9a44", "#5ab450"][k % 3]));
};
const cactus = (b: Batch, x: number, z: number, h: number) => {
  const G = C("#4a8a3e");
  b.add(boxGeo(V(x - 0.22, 0, z - 0.22), V(x + 0.22, h, z + 0.22)), G);
  b.add(boxGeo(V(x - 0.7, h * 0.45, z - 0.16), V(x - 0.2, h * 0.58, z + 0.16)), G); b.add(boxGeo(V(x - 0.7, h * 0.45, z - 0.16), V(x - 0.48, h * 0.8, z + 0.16)), G);
  b.add(boxGeo(V(x + 0.2, h * 0.55, z - 0.16), V(x + 0.62, h * 0.66, z + 0.16)), G); b.add(boxGeo(V(x + 0.4, h * 0.55, z - 0.16), V(x + 0.62, h * 0.9, z + 0.16)), G);
};
/** a blocky twin-engine bomber, nose to +x (generic, olive drab, twin tail, star roundels) */
const bomber = (b: Batch, bay = true) => {
  const G = C(OD), D = C("#3a3c28"), Gl = lam("glassB", () => ({ color: "#a8d0e8", transparent: true, opacity: 0.6 }));
  b.add(boxGeo(V(-6, -0.7, -0.75), V(5, 0.7, 0.75)), G);
  b.add(boxGeo(V(5, -0.55, -0.6), V(6.2, 0.55, 0.6)), Gl); b.add(boxGeo(V(-7.5, -0.3, -0.4), V(-6, 0.5, 0.4)), G);
  b.add(boxGeo(V(-0.6, 0.1, -9), V(1.6, 0.35, 9)), G);                                                                       // wing
  for (const z of [-3.2, 3.2]) {
    b.add(boxGeo(V(-1.2, -0.45, z - 0.55), V(2.6, 0.55, z + 0.55)), G);
    b.add(boxGeo(V(2.6, -0.4, z - 0.5), V(2.9, 0.5, z + 0.5)), D);
  }
  b.add(boxGeo(V(-7.3, 0.1, -3.2), V(-6.3, 0.3, 3.2)), G);                                                                    // tailplane
  for (const z of [-3.1, 3.1]) b.add(boxGeo(V(-7.4, 0.1, z - 0.12), V(-6.2, 2.0, z + 0.12)), G);                              // twin fins
  b.add(boxGeo(V(1, 0.7, -0.5), V(3.2, 1.05, 0.5)), Gl);                                                                      // cockpit
  for (const z of [-6.5, 6.5]) b.add(new THREE.CircleGeometry(0.9, 24).rotateX(-Math.PI / 2).translate(0.5, 0.36, z), lam("starB", () => ({ map: starTex(), transparent: true })));
  b.add(new THREE.CircleGeometry(0.6, 24).translate(-3, 0, 0.76), lam("starB", () => ({ map: starTex(), transparent: true })));
  if (bay) b.add(boxGeo(V(-1.2, -0.72, -0.5), V(1.2, -0.7, 0.5)), C("#1a1a14"));
};
/** a blocky 1941 convertible, nose to -x */
const car = (b: Batch, x: number, z: number) => {
  const m = M4(x, 0, z, 0, 1), R = C("#a8323a"), D = C("#1c1c1e"), Ch = C("#d8dadc");
  b.add(boxGeo(V(-2.1, 0.35, -0.85), V(2.1, 0.95, 0.85)), R, m);
  b.add(boxGeo(V(-2.1, 0.95, -0.8), V(-0.7, 1.1, 0.8)), R, m);                                                                // hood
  b.add(boxGeo(V(-0.7, 0.95, -0.82), V(-0.6, 1.55, 0.82)), lam("glassC", () => ({ color: "#bcd8e8", transparent: true, opacity: 0.5 })), m);
  b.add(boxGeo(V(0.4, 0.95, -0.8), V(1.1, 1.25, 0.8)), C("#5a3a2a"), m);                                                       // seat back
  b.add(boxGeo(V(-2.2, 0.3, -0.9), V(-2.1, 0.55, 0.9)), Ch, m); b.add(boxGeo(V(2.1, 0.3, -0.9), V(2.2, 0.55, 0.9)), Ch, m);
  for (const sx of [-1.4, 1.4]) for (const sz of [-0.86, 0.86]) b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16).rotateX(Math.PI / 2).translate(sx, 0.38, sz), D, m);
  for (const sz of [-0.5, 0.5]) b.add(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12).rotateZ(Math.PI / 2).translate(-2.13, 0.75, sz), lam("hl", () => ({ color: "#fff6d8", emissive: "#fff2c0", emissiveIntensity: 0.6 })), m);
  b.add(boxGeo(V(-0.62, 0.95, -0.15), V(-0.5, 1.15, 0.25)), C("#3a2a1a"), m);                                                  // dashboard radio
  b.add(new THREE.TorusGeometry(0.17, 0.025, 6, 18).rotateY(Math.PI / 2).rotateZ(0.5).translate(-0.4, 1.15, -0.35), C("#1c1c1e"), m);    // steering wheel
};
const house = (b: Batch, x: number, z: number, w: number, d: number, h: number, ry: number, wall: string, roofc: string) => {
  const m = M4(x, 0, z, ry, 1), W = C(wall), R = C(roofc), rh = 1.5;
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), W, m);
  const sh = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.35, 0), new THREE.Vector2(w / 2 + 0.35, 0), new THREE.Vector2(0, rh)]);
  for (const s of [-1, 1]) b.add(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).translate(0, h, s > 0 ? d / 2 - 0.02 : -d / 2 - 0.1), W, m);
  for (const s of [-1, 1]) { const L = Math.hypot(w / 2 + 0.45, rh), a = Math.atan2(rh, w / 2 + 0.45);
    b.add(new THREE.BoxGeometry(L + 0.12, 0.16, d + 0.6).rotateZ(-s * a).translate((s * (w / 2 + 0.45)) / 2, h + rh / 2 + 0.08, 0), R, m); }
  b.add(boxGeo(V(-0.4, h + 0.3, d / 2 + 0.1), V(0.4, h + 0.8, d / 2 + 0.15)), C("#1a1410"), m);                          // attic vent
  b.add(boxGeo(V(-0.45, 0, d / 2), V(0.45, 1.6, d / 2 + 0.04)), C("#5a3a22"), m);                                            // door
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * w * 0.3 - 0.35, 1.0, d / 2), V(sx * w * 0.3 + 0.35, 1.6, d / 2 + 0.04)), C("#9ac0d8"), m);
};

// ---------------- builders ----------------
// SKY (dawn): patchwork baseplate far below (y 0); the action at ~80 m. Clouds are a dyn group so shots can drift them.
export const CAS0: V3 = [0, 80, 0], BAYP: V3 = [0, 87.3, 0];
const sky = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-2500, 2500, -2500, 2500, 1, 0), lam("fields", () => ({ map: rep(ctex("fields", 1024, 1024, (g, r) => {
    const cols = ["#7aa84a", "#9ab45a", "#c8b070", "#6a9a44", "#b8a060", "#88b058"];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x * 128, y * 128, 128, 128); g.strokeStyle = "rgba(60,50,30,0.35)"; g.lineWidth = 4; g.strokeRect(x * 128, y * 128, 128, 128); }
  }), 30, 30) })));
  for (let k = 0; k < 40; k++) b.add(boxGeo(V(-300 + 600 * hh(k, 1), 0, -300 + 600 * hh(k, 2)), V(-292 + 600 * hh(k, 1), 4 + 6 * hh(k, 3), -292 + 600 * hh(k, 2))), C(["#d8d0c0", "#c85a4a", "#e8e0d0"][k % 3]));
  sub(s, "clouds", (cb) => {
    for (let k = 0; k < 26; k++) {
      const cx = -90 + 180 * hh(k, 4), cy = 62 + 34 * hh(k, 5), cz = -90 + 110 * hh(k, 6), n = 4 + (k % 3);
      if (Math.abs(cx) < 9 && Math.abs(cz) < 9) continue;
      for (let j = 0; j < n; j++) { const w = 3 + 4 * hh(k * 7 + j, 7), h = 1.6 + 2 * hh(k * 7 + j, 8); const x = cx + (j - n / 2) * 2.6, z = cz + 2 * hh(k * 7 + j, 9); cb.add(boxGeo(V(x - w / 2, cy - h / 2 + 0.6 * hh(j, 3), z - w / 2), V(x + w / 2, cy + h / 2, z + w / 2)), lam("cloudB", () => ({ color: "#fbf4ec" }))); }
    }
  });
  sub(s, "bomber", (bb) => bomber(bb));
  sub(s, "bomberFar", (bb) => bomber(bb, false));
  // the casing: nose cone down, fins up, two shell halves (front half carries the stencil), trays inside
  const cas = new THREE.Group(); s.root.add(cas); s.dyn.cas = cas;
  const O = C(OD);
  const core = sub(s, "casCore", (cb) => {
    for (let k = 0; k < 8; k++) cb.add(new THREE.CylinderGeometry(0.33, 0.33, 0.025, 20).translate(0, -0.62 + 0.18 * k, 0), C("#8a8a6a"));
    cb.add(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), C("#5a5a4a"));
    cb.add(new THREE.ConeGeometry(0.36, 0.42, 20).rotateX(Math.PI).translate(0, -0.96, 0), O);
    for (let k = 0; k < 4; k++) cb.add(new THREE.BoxGeometry(0.03, 0.5, 0.5).translate(0, 0.95, 0.28).rotateY((k * Math.PI) / 2), O);
    cb.add(new THREE.CylinderGeometry(0.37, 0.37, 0.1, 20).translate(0, 0.78, 0), C("#4a4c2a"));
  });
  s.root.remove(core); cas.add(core);
  for (const fr0 of [0, 1]) {
    const h = new THREE.Group(); cas.add(h); s.dyn["half" + fr0] = h;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.46, 24, 1, true, fr0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), lam("shell", () => ({ color: OD, side: THREE.DoubleSide })));
    m.castShadow = true; h.add(m);
    if (!fr0) { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), lam("casSt", () => ({ map: stencil("casSt", 420, 256, ["1,040", "BATS"], null, "#f2eee0", 96), transparent: true }))); st.position.set(0, 0.05, 0.365); h.add(st); }
  }
  // the parachute: striped dome, lines to the casing top
  const ch = new THREE.Group(); s.root.add(ch); s.dyn.chute = ch;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), lam("chute", () => ({ map: stripes(), side: THREE.DoubleSide })));
  dome.position.y = 3.2; dome.scale.y = 0.7; dome.castShadow = true; ch.add(dome);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, r = 2.0 * Math.sin(Math.PI / 2.3); const l = new THREE.Mesh(beamBetween(V(r * Math.cos(a), 3.2 + 0.7 * 2.0 * Math.cos(Math.PI / 2.3), r * Math.sin(a)), V(0, 0.85, 0), 0.012, 4), C("#d8d4c8")); ch.add(l); }
};
// OFFICE (Adams' dental office, Irwin PA): box room x -3..3, z -2.5..2.5, wall h 2.8. The dental chair at CH, the desk
// DESK (top y 0.78) facing the room with Adams' chair behind it, the name wall (z -2.45) for the text-behind-subject.
export const DESK: V3 = [1.3, 0.78, -1.4], ADM: V3 = [-0.1, 0, -0.8], SCALE: V3 = [1.75, 0.78, -1.35], LETP: V3 = [1.05, 0.786, -1.3];
const office = (s: SetBuild) => {
  const { b } = s, Wl = C("#bfe0d8"), Wd = C("#8a5a3a");
  b.add(boxGeo(V(-3, -0.05, -2.5), V(3, 0, 2.5)), lam("ofFloor", () => ({ map: rep(ctex("checker", 256, 256, (g) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? "#e8e4da" : "#3a4a5a"; g.fillRect(x * 64, y * 64, 64, 64); } }), 6, 5) })));
  b.add(boxGeo(V(-3, 0, -2.6), V(3, 2.8, -2.5)), Wl); b.add(boxGeo(V(-3.1, 0, -2.6), V(-3, 2.8, 2.5)), Wl); b.add(boxGeo(V(3, 0, -2.6), V(3.1, 2.8, 2.5)), Wl);
  b.add(boxGeo(V(-3, 0, -2.5), V(3, 0.9, -2.46)), lam("wains", () => ({ map: plankTex(), color: "#d8b888" })));
  b.add(boxGeo(V(-3, 2.8, -2.6), V(3, 2.9, 2.5)), C("#f4f0e6"));
  // window (left wall) with daylight
  b.add(boxGeo(V(-2.99, 1.0, -1.9), V(-2.97, 2.3, -0.5)), lam("win", () => ({ color: "#dff2ff", emissive: "#cfe8ff", emissiveIntensity: 0.9 })));
  for (const zz of [-1.9, -1.2, -0.5]) b.add(boxGeo(V(-2.99, 1.0, zz - 0.04), V(-2.95, 2.3, zz + 0.04)), C("#f4f4f0"));
  // dental chair
  const ch = M4(-1.9, 0, -1.2, 0.5, 1), Cc = C("#3a8a8a"), Ch = C("#c8ccd0");
  b.add(new THREE.CylinderGeometry(0.35, 0.45, 0.12, 18).translate(0, 0.06, 0), Ch, ch); b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.45, 10).translate(0, 0.35, 0), Ch, ch);
  b.add(boxGeo(V(-0.35, 0.55, -0.3), V(0.35, 0.72, 0.45)), Cc, ch); b.add(boxGeo(V(-0.3, 0.45, 0.45), V(0.3, 0.6, 1.0)), Cc, ch);
  b.add(new THREE.BoxGeometry(0.7, 0.9, 0.16).translate(0, 0.45, 0).rotateX(-0.35).translate(0, 0.72, -0.35), Cc, ch);
  b.add(boxGeo(V(-0.18, 1.45, -0.82), V(0.18, 1.62, -0.6)), Cc, ch);
  b.add(beamBetween(V(0.5, 0, -0.5), V(0.5, 2.1, -0.5), 0.04), Ch, ch); b.add(beamBetween(V(0.5, 2.1, -0.5), V(0, 2.0, 0.3), 0.035), Ch, ch);
  b.add(new THREE.CylinderGeometry(0.18, 0.12, 0.12, 16).translate(0, 1.95, 0.3), lam("dlamp", () => ({ color: "#fff6d8", emissive: "#fff0c0", emissiveIntensity: 0.5 })), ch);
  // shelf with the big tooth model and jars
  b.add(boxGeo(V(-2.2, 1.7, -2.5), V(-0.9, 1.75, -2.2)), Wd);
  b.add(boxGeo(V(-1.9, 1.75, -2.45), V(-1.5, 2.1, -2.25)), C("#f8f6ee")); for (const xx of [-1.85, -1.55]) b.add(boxGeo(V(xx - 0.06, 1.62, -2.42), V(xx + 0.06, 1.75, -2.28)), C("#f8f6ee"));
  for (let k = 0; k < 3; k++) b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12).translate(-1.25 + 0.15 * k, 1.85, -2.35), lam("jar" + k, () => ({ color: ["#9ad0c0", "#e8c07a", "#c0a0e0"][k], transparent: true, opacity: 0.8 })));
  // diploma
  b.add(boxGeo(V(1.7, 1.55, -2.5), V(2.5, 2.15, -2.47)), C("#5a3a20"));
  label(b, "dds", 2.1, 1.85, -2.465, 0.7, 0.5, ["DOCTOR OF", "DENTAL SURGERY"], "#f6efd8", "#2a2418", 34);
  // door with the name on the glass (right wall, facing -x)
  b.add(boxGeo(V(2.96, 0, 0.6), V(3.0, 2.2, 1.6)), Wd);
  label(b, "door", 2.955, 1.6, 1.1, 0.8, 0.5, ["DR. L. S. ADAMS", "DENTIST"], "#e8f2f4", "#1a2a3a", 40, -Math.PI / 2);
  // desk, chair, lamp, typewriter
  const D = M4(DESK[0], 0, DESK[2], 0, 1);
  b.add(boxGeo(V(-0.85, 0.72, -0.42), V(0.85, 0.78, 0.42)), C("#6a4026"), D);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * 0.8 - 0.05, 0, -0.4), V(sx * 0.8 + 0.05, 0.72, 0.4)), C("#5a3420"), D);
  b.add(boxGeo(V(-0.75, 0.3, -0.42), V(-0.25, 0.72, 0.38)), C("#5a3420"), D);
  b.add(boxGeo(V(-0.25, 0, -1.0), V(0.25, 0.45, -0.6)), C("#3a2a20"), D); b.add(boxGeo(V(-0.25, 0.45, -1.02), V(0.25, 1.05, -0.94)), C("#3a2a20"), D);
  b.add(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 14).translate(-0.6, 0.8, -0.2), C("#2a5a3a"), D); b.add(beamBetween(V(-0.6, 0.8, -0.2), V(-0.5, 1.15, -0.05), 0.015), C("#c8a048"), D);
  b.add(new THREE.ConeGeometry(0.12, 0.12, 14, 1, true).translate(-0.45, 1.13, 0.0), lam("dkl", () => ({ color: "#2a5a3a", side: THREE.DoubleSide })), D);
  const lamp = new THREE.PointLight("#ffd8a0", 3, 5, 1.6); lamp.position.set(DESK[0] - 0.45, 1.05, DESK[2]); s.root.add(lamp);
  // the kitchen scale (shot 8): platform + body
  b.add(boxGeo(V(SCALE[0] - 0.16, SCALE[1], SCALE[2] - 0.14), V(SCALE[0] + 0.16, SCALE[1] + 0.12, SCALE[2] + 0.14)), C("#d84a3a"));
  b.add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20).translate(SCALE[0], SCALE[1] + 0.13, SCALE[2]), C("#c8ccd0"));
  const l1 = new THREE.PointLight("#fff2d8", 4, 8, 1.5); l1.position.set(0, 2.5, 0.8); s.root.add(l1);
};
// CAVE (New Mexico, dusk): a blocky rock wall along z -12 with the cave mouth at x -3..3; desert, cacti, a road at z 3..5.
export const MOUTH: V3 = [0, 2.0, -12], ADC: V3 = [1.3, 0, -2.0], CAR: V3 = [5.5, 0, 4], SIGN: V3 = [-2.4, 0, -4.2];
const cave = (s: SetBuild) => {
  const { b } = s;
  b.add(boxGeo(V(-300, -0.2, -300), V(300, 0, 300)), lam("sandC", () => ({ map: rep(studs("sand", "#d8a870", "#e6b880", "#b88a58", 8), 300, 300) })));
  for (let k = 0; k < 40; k++) { const x0 = -40 + 2 * k; if (x0 > -4 && x0 < 3.5) { b.add(boxGeo(V(x0, 4.6, -14), V(x0 + 2, 9 + 2 * hh(k, 2), -11.2 + 0.5 * hh(k, 3))), C(["#b8784a", "#a86a42", "#c4865a"][k % 3])); continue; }
    b.add(boxGeo(V(x0, 0, -16 - 3 * hh(k, 1)), V(x0 + 2, 6 + 6 * hh(k, 2) + Math.abs(x0) * 0.08, -11 + 1.2 * hh(k, 3))), C(["#b8784a", "#a86a42", "#c4865a"][k % 3])); }
  b.add(boxGeo(V(-3.5, 0, -18), V(3.5, 4.6, -13.5)), C("#140c0a"));                                                             // the dark mouth
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-3.6 + 1.3 * k, 0, -12.2 + 0.4 * hh(k, 5)), V(-2.9 + 1.3 * k, 0.6 + 0.6 * hh(k, 6), -11.4)), C("#9a6038"));
  for (let k = 0; k < 8; k++) b.add(boxGeo(V(-120 + 30 * k, 0, -80 - 20 * hh(k, 1)), V(-96 + 30 * k, 14 + 16 * hh(k, 2), -60 - 20 * hh(k, 1))), C(["#a8684a", "#b8785a", "#986048"][k % 3]));
  for (let k = 0; k < 18; k++) { const x = -26 + 52 * hh(k, 7), z = -9 + 8 * hh(k, 8); if (Math.abs(x) < 6 && z > -6) continue; cactus(b, x, z, 1.6 + 1.6 * hh(k, 9)); }
  b.add(boxGeo(V(-300, 0, 2.6), V(300, 0.04, 5.4)), C("#4a4a4e"));
  for (let k = 0; k < 60; k++) b.add(boxGeo(V(-60 + 2.2 * k, 0.04, 3.95), V(-59.1 + 2.2 * k, 0.05, 4.05)), C("#e8c040"));
  car(b, CAR[0], CAR[2]);
  b.add(boxGeo(V(SIGN[0] - 0.08, 0, SIGN[2] - 0.08), V(SIGN[0] + 0.08, 1.4, SIGN[2] + 0.08)), C("#6a4428")); b.add(boxGeo(V(SIGN[0] + 1.32, 0, SIGN[2] - 0.08), V(SIGN[0] + 1.48, 1.4, SIGN[2] + 0.08)), C("#6a4428"));
  b.add(boxGeo(V(SIGN[0] - 0.2, 1.3, SIGN[2] - 0.06), V(SIGN[0] + 1.6, 2.4, SIGN[2] + 0.02)), C("#7a5030"));
};
// BASE (Carlsbad Army Airfield auxiliary base, May 1943): the bat crate at the origin; the control tower TOWER, the
// barracks row BARR, the raised fuel tank FUEL; the runway along x at z -5..-2; desert and mesas.
export const TOWER: V3 = [-9, 0, -14], BARR: V3 = [7, 0, -15], FUEL: V3 = [17, 0, -7], CRATE: V3 = [0, 0, 0];
const base = (s: SetBuild) => {
  const { b } = s;
  b.add(boxGeo(V(-400, -0.2, -400), V(400, 0, 400)), lam("sandB", () => ({ map: rep(studs("sandb", "#d4b07a", "#e2c08a", "#b8945e", 8), 400, 400) })));
  b.add(boxGeo(V(-200, 0, -6), V(200, 0.03, -2)), C("#5a5a5e"));
  for (let k = 0; k < 60; k++) b.add(boxGeo(V(-100 + 3.5 * k, 0.03, -4.08), V(-98.5 + 3.5 * k, 0.04, -3.92)), C("#f0f0ea"));
  // control tower
  const T = M4(TOWER[0], 0, TOWER[2], 0, 1);
  b.add(boxGeo(V(-1.6, 0, -1.6), V(1.6, 8, 1.6)), C("#e8e0cc"), T); b.add(boxGeo(V(-2.2, 8, -2.2), V(2.2, 8.3, 2.2)), C("#7a7a72"), T);
  b.add(boxGeo(V(-2, 8.3, -2), V(2, 10, 2)), lam("towG", () => ({ color: "#8ac0d8", emissive: "#4a7a90", emissiveIntensity: 0.25 })), T); b.add(boxGeo(V(-2.3, 10, -2.3), V(2.3, 10.4, 2.3)), C("#c84a3a"), T);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(-1.7, 1.5 + 1.8 * k, 1.6), V(-0.9, 2.5 + 1.8 * k, 1.64)), C("#4a6a7a"), T);
  label(b, "tower", TOWER[0], 6.9, TOWER[2] + 1.62, 3.0, 1.1, ["CONTROL", "TOWER"], "#f4f0e0", "#1a2030", 100);
  // barracks
  for (let k = 0; k < 3; k++) { house(b, BARR[0] + 9 * k, BARR[2] - 2 * k, 7.5, 4, 2.6, 0, "#e6dcc4", "#3a5a3a"); }
  label(b, "barr", BARR[0] + 1.6, 2.15, BARR[2] + 2.08, 3.0, 0.62, ["BARRACKS"], "#2a3a2a", "#f4f0e0", 130);
  // raised fuel tank on legs
  const F = M4(FUEL[0], 0, FUEL[2], 0, 1);
  b.add(new THREE.CylinderGeometry(1.6, 1.6, 5, 20).rotateZ(Math.PI / 2).translate(0, 3.6, 0), C("#c8c4b8"), F);
  for (const sx of [-1, 1]) b.add(new THREE.SphereGeometry(1.6, 18, 10).scale(0.35, 1, 1).translate(sx * 2.5, 3.6, 0), C("#c8c4b8"), F);
  for (const sx of [-1.8, 1.8]) for (const sz of [-1, 1]) b.add(boxGeo(V(sx - 0.12, 0, sz - 0.12), V(sx + 0.12, 2.3, sz + 0.12)), C("#5a5a56"), F);
  label(b, "fuel", FUEL[0], 3.6, FUEL[2] + 1.62, 2.4, 0.8, ["FUEL"], null, "#c0262c", 200);
  // hangar + parked bomber + mesas
  b.add(boxGeo(V(-34, 0, -22), V(-20, 7, -10)), C("#a8a8a0")); b.add(new THREE.CylinderGeometry(7, 7, 12, 20, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2).scale(1, 0.45, 1).translate(-27, 7, -16), C("#98988e"));
  const pb = new THREE.Group(), bb = new Batch(); bomber(bb, false); bb.build(pb); pb.position.set(-8, 1.5, -9); pb.rotation.y = 0.5; pb.scale.setScalar(0.8); s.root.add(pb);
  for (let k = 0; k < 8; k++) b.add(boxGeo(V(-160 + 45 * k, 0, -160 - 30 * hh(k, 1)), V(-130 + 45 * k, 18 + 20 * hh(k, 2), -120 - 30 * hh(k, 1))), C(["#c08a5a", "#b07a4e", "#ca9a6a"][k % 3]));
  // the sign board (behind the crate) and the bat crate
  b.add(boxGeo(V(-0.9, 0, -2.7), V(-0.75, 2.2, -2.55)), C("#5a4028")); b.add(boxGeo(V(1.95, 0, -2.7), V(2.1, 2.2, -2.55)), C("#5a4028"));
  b.add(boxGeo(V(-1.0, 2.0, -2.66), V(2.2, 3.3, -2.58)), C("#f2ead6"));
  label(b, "abs", 0.6, 2.65, -2.57, 3.1, 1.2, ["CARLSBAD", "ARMY AIRFIELD"], null, "#1a2030", 76);
  b.add(boxGeo(V(CRATE[0] - 0.6, 0, CRATE[2] - 0.4), V(CRATE[0] + 0.6, 0.7, CRATE[2] + 0.4)), lam("crateP", () => ({ map: plankTex(), color: "#c89a5a" })));
  label(b, "crate", CRATE[0], 0.38, CRATE[2] + 0.41, 1.0, 0.36, ["LIVE BATS"], "#f2ead6", "#a0202a", 150);
  b.add(boxGeo(V(-1.6, 0, -0.6), V(-1.0, 0.75, 0.0)), C("#7a7a6a")); b.add(boxGeo(V(-1.7, 0.75, -0.7), V(-0.9, 0.8, 0.1)), C("#5a5a4a"));
  const lid = sub(s, "lid", (lb) => lb.add(boxGeo(V(-0.62, 0, -0.84), V(0.62, 0.06, 0)), lam("crateP", () => ({ map: plankTex(), color: "#c89a5a" }))));
  lid.position.set(CRATE[0], 0.7, CRATE[2] + 0.42);
};
// VILLAGE (the mock village on the test range): rows of wooden houses with attic vents under the gables; the chart easel.
export const HOUSE: V3 = [0, 0, 0], VENT: V3 = [0, 3.15, 1.92], EASEL: V3 = [3.4, 0, 3.2];
const village = (s: SetBuild) => {
  const { b } = s;
  b.add(boxGeo(V(-300, -0.2, -300), V(300, 0, 300)), lam("sandV", () => ({ map: rep(studs("sandv", "#c8a874", "#d6b684", "#aa8a5a", 8), 300, 300) })));
  house(b, HOUSE[0], HOUSE[2], 4.2, 3.5, 2.6, 0, "#c89a62", "#4a4a52");
  for (let k = 0; k < 14; k++) { const x = -18 + 9 * (k % 5) + (k > 9 ? 4 : 0), z = -9 - 8 * Math.floor(k / 5); house(b, x, z, 4, 3.4, 2.4 + 0.4 * hh(k, 2), 0.1 * (hh(k, 3) - 0.5), ["#c89a62", "#b8885a", "#d2a46e"][k % 3], ["#4a4a52", "#5a3a2a", "#3a4a5a"][k % 3]); }
  house(b, -8, 1, 4, 3.4, 2.5, 0.15, "#b8885a", "#5a3a2a"); house(b, 9, -1, 4, 3.4, 2.5, -0.1, "#d2a46e", "#3a4a5a");
  for (let k = 0; k < 8; k++) b.add(boxGeo(V(-140 + 40 * k, 0, -150 - 30 * hh(k, 1)), V(-112 + 40 * k, 16 + 18 * hh(k, 2), -120 - 30 * hh(k, 1))), C(["#a8b0b8", "#98a0aa", "#b8c0c8"][k % 3]));
  const E = M4(EASEL[0], 0, EASEL[2], -0.35, 1);
  for (const sx of [-0.7, 0.7]) b.add(beamBetween(V(sx, 0, 0.2), V(sx * 0.9, 2.6, -0.1), 0.05), C("#6a4428"), E);
  b.add(beamBetween(V(0, 0, -0.7), V(0, 2.5, -0.15), 0.05), C("#6a4428"), E);
  b.add(boxGeo(V(-0.95, 0.85, 0.0), V(0.95, 2.45, 0.06)), C("#2a3a32"), E);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { sky, cave, office, base, village };

// ---------------- the 3D cast ----------------
const ADAMS: RLook = { shirt: "#f4f4f0", pants: "#4a4a52", kind: "coat", hair: "#5a3a22", glasses: true };
const ADAMS_SUIT: RLook = { shirt: "#5a4a3a", pants: "#4a3e32", kind: "officer", hair: "#5a3a22", glasses: true };
const ARMY = (v: number): RLook => ({ shirt: "#6a6a40", pants: "#7a6a4a", kind: "army", hat: "army", skin: ["#f2c879", "#e8b070", "#c8945a"][v % 3] });
const SOOTY: RLook = { ...ARMY(0), soot: true };
type Cast3 = { av: Map<string, Avatar>; bats: Bat[]; hero: Bat };
const CAST = new WeakMap<SetBuild, Cast3>();
const shadowAll = (o: THREE.Object3D) => o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
const NB = 44;
const cast3 = (s: SetBuild): Cast3 => {
  let c = CAST.get(s);
  if (!c) {
    const bats: Bat[] = []; for (let k = 0; k < NB; k++) { const r = new Bat(1); shadowAll(r.g); s.root.add(r.g); bats.push(r); }
    const hero = new Bat(1); shadowAll(hero.g); s.root.add(hero.g);
    c = { av: new Map(), bats, hero }; CAST.set(s, c);
  }
  return c;
};
type Act3 = { s: SetBuild; t: number; c: Cast3 };
const av = (a: Act3, key: string, look: RLook, x: number, y: number, z: number, ry: number, p: RPose) => {
  let m = a.c.av.get(key); if (!m) { m = new Avatar(look); shadowAll(m.g); a.s.root.add(m.g); a.c.av.set(key, m); }
  m.g.visible = true; m.g.position.set(x, y, z); m.g.rotation.y = ry; m.pose(p);
};
/** animation on twos for characters */
const tw2 = (t: number) => Math.floor(t * FPS / 2) * 2 / FPS;
const bat = (a: Act3, i: number, p: V3, yaw: number, s: number, bp: BatPose, pitch = 0, roll = 0) => {
  const r = i < 0 ? a.c.hero : a.c.bats[i]; r.g.visible = true; r.g.position.set(...p); r.g.rotation.set(pitch, yaw, roll, "YXZ"); r.g.scale.setScalar(s); r.pose(bp);
};
/** a bat flying a path: pos(t) sampled to face along its velocity, flapping */
const flyer = (a: Act3, i: number, path: (t: number) => V3, s: number, bp: BatPose = {}, hz = 5) => {
  const t = tw2(a.t), p = path(t), p2 = path(t + 0.05), yaw = Math.atan2(p2[0] - p[0], p2[2] - p[2]);
  const hz2 = Math.hypot(p2[0] - p[0], p2[2] - p[2]), pitch = -Math.atan2(p2[1] - p[1], hz2 || 1e-4) * 0.6;
  bat(a, i, p, yaw, s, { flap: t * hz + i * 0.37, ...bp }, pitch, 0.25 * Math.sin(t * 2 + i));
};
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
const T1s = (id: number) => SHOTS[id - 1].b / FPS;
const WAL = (t: number, hz = 1.6) => t * hz;

// sky helpers: the casing at p with open u (0 shut .. 1 halves gone) and the chute at k (0 packed .. 1 open)
const casing = (a: Act3, p: V3, u: number, k: number, sway = 0) => {
  const d = a.s.dyn, cas = d.cas, ch = d.chute;
  cas.visible = true; cas.position.set(...p); cas.rotation.set(0.06 * sway, 0, 0.08 * sway);
  const h0 = d.half0, h1 = d.half1, e = smooth(u);
  h0.position.set(0, -1.2 * e * e, 1.6 * e); h0.rotation.x = 1.1 * e; h0.visible = e < 0.98;
  h1.position.set(0, -1.2 * e * e, -1.6 * e); h1.rotation.x = -1.1 * e; h1.visible = e < 0.98;
  ch.visible = k > 0.01; ch.position.set(...p); ch.rotation.copy(cas.rotation);
  const kk = clamp01(k), sp = kk < 1 ? 0.15 + 0.85 * kk + 0.12 * Math.sin(Math.PI * kk) : 1;
  ch.scale.set(sp, 0.4 + 0.6 * kk, sp);
};
/** the inner tray bats (asleep / waking) visible once the shell opens */
const trayBats = (a: Act3, p: V3, wake: number, n = 10) => {
  for (let i = 0; i < n; i++) { const lv = i % 5, ang = (i < 5 ? 0.35 : -0.35) + 0.2 * (lv % 2); const y = p[1] - 0.52 + 0.24 * lv, x = p[0] + 0.2 * Math.sin(ang), z = p[2] + 0.2 * Math.cos(ang);
    const w = clamp01((wake - 0.04 * i) * 3); bat(a, NB - 1 - i, [x, y, z], ang, 0.46, { fold: 1 - w, face: w > 0.5 ? "wide" : "sleep", bomb: true, flap: a.t * 4 * w + i }); }
};
const drift = (a: Act3, t: number) => { const c = a.s.dyn.clouds; if (c) c.position.set(-4.5 * t, 0, 0); };
/** the hook: a parachuted casing bursts on "bats" and the bats pour out at the lens */
const hook3 = (a: Act3) => {
  const t = a.t, open = A(0, "bats") - 0.12, y = CAS0[1];
  drift(a, t);
  const bf = a.s.dyn.bomberFar; bf.visible = true; bf.position.set(-34 + 9 * t, 93 - 0.2 * t, -46); bf.rotation.set(0, 0.25, 0.05);
  const u = clamp01((t - open) / 0.45), sw = Math.sin(t * 1.3);
  casing(a, [CAS0[0], y, CAS0[2]], u, 1, sw);
  if (t > open - 0.1 && t < open + 0.6) trayBats(a, [CAS0[0], y, CAS0[2]], clamp01((t - open + 0.1) * 4), 10);
  for (let i = 0; i < 34; i++) {
    const ti = open + 0.08 + 0.025 * i; if (t < ti) continue;
    const th = (i * 2.399) % (Math.PI * 2), el = -0.3 + 0.9 * hh(i, 2), sp = 2.6 + 1.6 * hh(i, 3);
    const vx = Math.sin(th) * sp * 1.1, vz = 1.4 + Math.cos(th) * sp * 0.7 + 1.2 * hh(i, 5), vy = el * 1.2;
    flyer(a, i, (tt) => { const d = Math.max(0, tt - ti), e2 = d < 0.5 ? d * (1.5 - d) : d; return [CAS0[0] + vx * e2, y - 0.3 + vy * e2 - 0.15 * Math.sin(d * 3 + i), CAS0[2] + vz * e2]; }, 0.85, { bomb: true, face: i % 4 === 0 ? "grin" : "wide" }, 5.5);
  }
};

/** per-shot 3D action */
const ACT3: Record<number, (a: Act3) => void> = {
  // 1 In World War Two, America built a bomb, and its warheads were bats.
  1: (a) => hook3(a),
  // 2 It was dreamed up by a dentist named Lytle Adams.   (Adams by his dental chair, drill raised; LYTLE ADAMS behind him)
  2: (a) => { const t = tw2(a.t), d = after(t, A(1, "dentist")); av(a, "adams", ADAMS, ADM[0], 0, ADM[2], 0.15, { face: d ? "grin" : "smile", armR: d ? -0.7 : -0.2, armRz: d ? 0.35 : 0, armL: -0.15, head: 0.1 * Math.sin(t * 1.5) }); },
  // 3 In 1941, he visited a cave in New Mexico, full of millions of bats.   (the evening flight pours out; Adams looks up)
  3: (a) => {
    const t = tw2(a.t), w = after(t, A(2, "millions"));
    av(a, "adams", ADAMS_SUIT, ADC[0], 0, ADC[2], Math.PI - 0.55, { face: w ? "shock" : "smile", nod: w ? 0.45 : 0.15, armL: w ? -0.5 : 0, armR: 0 });
    for (let i = 0; i < 30; i++) { const ph = i * 0.21, r0 = 2 + 5 * hh(i, 1), t0 = T0s(3) - 2 + 3 * hh(i, 2);
      flyer(a, i, (tt) => { const d = (tt - t0) % 6, ang = ph * 6 + d * 0.9; return [MOUTH[0] + r0 * Math.cos(ang) * (0.4 + 0.15 * d), MOUTH[1] + 0.2 + 1.6 * d, MOUTH[2] + 2 + 2 * Math.sin(ang) + 0.9 * d]; }, 0.55, { face: "wide" }, 6); }
  },
  // 4 Driving home, he heard about Pearl Harbor, and had a wild idea.   (in the car; the radio; the bulb)
  4: (a) => { const t = tw2(a.t), id = after(t, A(3, "idea") - 0.2), hr = after(t, A(3, "pearl"));
    av(a, "adams", ADAMS_SUIT, CAR[0] + 0.15, 0.55, CAR[2] - 0.35, -Math.PI / 2 + (id ? 0.9 : 0), { sit: true, face: id ? "grin" : hr ? "shock" : "smile", armL: -1.2, armR: -1.2, head: id ? 0.3 : 0 });
    for (let i = 0; i < 8; i++) flyer(a, i, (tt) => [CAR[0] - 6 + 3 * Math.sin(tt * 0.5 + i), 4 + i * 0.6 + Math.sin(tt + i), -6 - 2 * i], 0.5, {}, 6); },
  // 5 He wrote to the White House...   (top-down on the letter: handwriting)
  5: () => {},
  // 6 President Roosevelt passed it on with a note.
  6: () => {},
  // 7 This man is not a nut.   (reaction close-up: Adams holds up the note, grinning)
  7: (a) => { const t = tw2(a.t), n = after(t, A(5, "nut")); av(a, "adams", ADAMS, ADM[0], 0, ADM[2], 0.1, { face: n ? "laugh" : "grin", armL: -1.35, armLz: -0.05, armR: n ? -2.6 : -0.3, armRz: n ? -0.4 : 0, tilt: n ? 0.12 : 0, lift: n ? 0.03 * Math.abs(Math.sin(t * 9)) : 0 }); },
  // 8 A bat weighs fourteen grams, but it can carry eighteen.   (a bat on the kitchen scale; the bomb lands in its arms)
  8: (a) => { const t = tw2(a.t), e = after(t, A(6, "eighteen") - 0.15);
    bat(a, -1, [SCALE[0], SCALE[1] + 0.2 + (e ? 0.02 * Math.abs(Math.sin(t * 8)) : 0), SCALE[2]], 0.15, 0.62, { fold: e ? 0.2 : 0.55, face: e ? "grin" : "happy", bomb: e, flap: e ? t * 4 : 0 }); },
  // 9 Pack a thousand sleeping bats into a bomb casing. Drop it. A parachute opens, the bats wake up,
  9: (a) => {
    const t = a.t, dr = A(7, "drop") - 0.05, pc = A(7, "parachute") + 0.1, wk = A(7, "wake") - 0.1;
    drift(a, t - T0s(9));
    const bm = a.s.dyn.bomber; bm.visible = true; bm.position.set(BAYP[0], BAYP[1] + 0.7, BAYP[2]); bm.rotation.set(0, 0, 0.02 * Math.sin(t));
    const y = casY9(t);
    casing(a, [BAYP[0], y, BAYP[2]], clamp01((t - wk) / 0.7) * 0.8, clamp01((t - pc) / 0.35), t > pc ? Math.sin((t - pc) * 2.5) * Math.exp(-(t - pc)) : 0);
    if (t > wk - 0.1) trayBats(a, [BAYP[0], y, BAYP[2]], clamp01((t - wk) * 1.2), 10);
  },
  // 10 and fly into attics, where a timer sets each one off.
  10: (a) => { const t = a.t, s0 = T0s(10);
    for (let i = 0; i < 9; i++) { const ti = s0 - 0.3 + 0.28 * i; flyer(a, i, (tt) => { const u = clamp01((tt - ti) / 1.6), e2 = u * u * (3 - 2 * u); return [VENT[0] - 7 + (7 + 0.6 * Math.sin(i)) * e2 + 0.4 * Math.sin(i * 2), VENT[1] + 4 - 4 * e2 + 0.6 * Math.sin(tt * 3 + i) * (1 - e2), VENT[2] + 5 - 5.1 * e2]; }, 0.9, { bomb: true, face: "grin" }, 6);
      if (t > ti + 1.6) a.c.bats[i].g.visible = false; } },
  // 11 Then, in May 1943, during a test in New Mexico, some armed bats escaped.   (the crate lid pops; officers recoil)
  11: (a) => { const t = tw2(a.t), es = A(9, "escaped") - 0.35, up = clamp01((t - es) / 0.25);
    a.s.dyn.lid.rotation.x = -1.9 * smooth(up) + 0.1 * Math.sin(Math.PI * clamp01(up * 1.2));
    for (let i = 0; i < 16; i++) { const ti = es + 0.05 * i; if (t < ti) continue;
      flyer(a, i, (tt) => { const d = Math.max(0, tt - ti); return [CRATE[0] + (hh(i, 1) - 0.5) * 2.4 * d, 0.5 + 1.8 * d + 0.3 * Math.sin(d * 5 + i), CRATE[2] + (hh(i, 2) - 0.6) * 2.0 * d]; }, 0.45, { bomb: true, face: "grin" }, 6); }
    const s = after(t, es + 0.2);
    av(a, "o1", ARMY(0), -1.4, 0, 0.9, 0.7, s ? { face: "shock", armL: -2.4, armR: -2.4, armLz: 0.3, armRz: 0.3, lean: -0.15 } : { face: "smile", armR: -0.4 });
    av(a, "o2", ARMY(1), 1.5, 0, 0.8, -0.7, s ? { face: "shock", armL: -2.6, armR: -1.0, lean: -0.2 } : { face: "determined", armL: -0.6 }); },
  // 12 They roosted in the control tower, the barracks, under a fuel tank.   (three setups, bats streaming into each)
  12: (a) => { const t = a.t, tgt: [number, V3][] = [[A(10, "control") - 0.6, [TOWER[0], 9.2, TOWER[2] + 2.1]], [A(10, "barracks") - 0.6, [BARR[0], 3.6, BARR[2] + 2.1]], [A(10, "fuel") - 0.6, [FUEL[0], 1.8, FUEL[2]]]];
    tgt.forEach(([t0, p], g) => { for (let k = 0; k < 7; k++) { const i = g * 7 + k, ti = t0 + 0.14 * k;
      flyer(a, i, (tt) => { const u = clamp01((tt - ti) / 1.5), e2 = u * u * (3 - 2 * u); return [p[0] - 5 + 5 * e2 + 1.2 * Math.sin(k * 1.7) * (1 - e2), p[1] + 3 - 3 * e2 + 0.5 * Math.sin(tt * 4 + k) * (1 - e2), p[2] + 7 - 7 * e2]; }, 0.6, { bomb: true, face: "grin" }, 6);
      if (t > ti + 1.5) a.c.bats[i].g.visible = false; } }); },
  // 13 And burned the base to the ground.
  13: (a) => { const t = tw2(a.t); if (t > -1) return; av(a, "o1", ARMY(0), 0.6, 0, 7.6, Math.PI + 0.2, { face: "shock", armL: -0.3, armR: -0.3, nod: -0.25 }); av(a, "o2", ARMY(1), 3.4, 0, 7.9, Math.PI - 0.25, { face: "shock", armL: -2.2 - 0.2 * Math.sin(t * 6), armR: -0.4, nod: -0.25 }); },
  // 14 (beat) the officer's reaction, sooty
  14: (a) => { const t = tw2(a.t); av(a, "o1s", SOOTY, -1.4, 0, 0.9, 0.61, { face: "flat", armL: -0.1, armR: -0.1, tilt: t > T0s(14) + 0.6 ? 0.08 : 0 }); },
  // 15 Later tests showed bats started ten times more fires than normal bombs.   (the chart easel; the village burns behind)
  15: (a) => { av(a, "sci", ADAMS, EASEL[0] - 1.4, 0, EASEL[2] + 0.4, 0.35, { face: after(a.t, A(12, "ten")) ? "grin" : "smile", armR: -1.4, armRz: -0.3 }); },
  // 16 But by 1944, it was cancelled. Another secret weapon was faster: the atomic bomb.   (Adams at his desk; the stamp)
  16: (a) => { const t = tw2(a.t), c = after(t, A(13, "cancelled"));
    av(a, "adams", ADAMS, DESK[0], 0, DESK[2] - 0.75, 0, { sit: true, face: c ? "sad" : "smile", armL: -1.3, armR: -1.3, nod: c ? -0.2 : 0 });
    bat(a, -1, [DESK[0] - 0.45, 1.2, DESK[2] + 0.12], 0.4, 0.45, { fold: 1, hang: true, face: c ? "sad" : "sleep" }); },
  // 17 Send this to someone who's scared of bats.   (a grinning bat flaps at the lens, then the hook frame: loop)
  17: (a) => { if (a.t >= (Math.round(A(14, "bats") * FPS) - 2.5) / FPS) { hook3({ ...a, t: a.t - (TOTAL - 1) / FPS }); return; }
    const t = tw2(a.t); drift(a, a.t - T0s(17)); casing(a, [CAS0[0] - 2, CAS0[1] - 6, CAS0[2] - 6], 1, 1);
    bat(a, -1, [CAS0[0] + 0.15 * Math.sin(t * 2), CAS0[1] - 0.2 + 0.08 * Math.sin(t * 11), CAS0[2] + 2.0], 0.15 * Math.sin(t * 1.3), 1.0, { flap: t * 5.5, face: "grin", bomb: true }, -0.1);
    for (let i = 0; i < 12; i++) flyer(a, i, (tt) => [CAS0[0] - 4 + 8 * hh(i, 1) + Math.sin(tt * 0.8 + i), CAS0[1] - 3 + 4 * hh(i, 2) + 0.4 * Math.sin(tt * 2 + i), CAS0[2] - 6 + 5 * hh(i, 3)], 0.6, { bomb: true }, 5.5); },
};

// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => ConstructorParameters<typeof VfxRig>[1]) => { let r = RIGS.get(s); if (!r) { r = new VfxRig(s.root, mk()); RIGS.set(s, r); } return r; };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {};
for (const sid of ["sky", "cave", "office", "base", "village"] as SetId[]) POSE[sid] = (s, t, id) => {
  const c = cast3(s); c.bats.forEach((r) => (r.g.visible = false)); c.hero.g.visible = false; c.av.forEach((m) => (m.g.visible = false));
  for (const k of ["cas", "chute", "bomber", "bomberFar"]) if (s.dyn[k]) s.dyn[k].visible = false;
  ACT3[id]?.({ s, t, c });
  if (id === 3) rig(s, () => batStream(T0s(3), [MOUTH[0], 1.2, MOUTH[2] + 1.0], 320)).step(t);
  if (id === 4) rig(s, () => batStream(T0s(4), [MOUTH[0], 1.2, MOUTH[2] + 1.0], 320)).step(t);
  if (id === 10) { const t0 = A(8, "off") - 0.05; rig(s, () => [...fire(t0, [VENT[0], VENT[1] + 0.2, VENT[2] + 0.1], 0.5, 0.8), ...fire(t0 + 0.3, [-8, 3.4, 2.6], 0.6, 0.7)]).step(t); }
  if (id === 13 || id === 14) { const t0 = A(11, "burned") - 0.3; rig(s, () => [
    ...fire(t0, [TOWER[0], 10, TOWER[2]], 2.4, 1.5), ...fire(t0 + 0.15, [BARR[0], 4, BARR[2]], 2.6, 1.5), ...fire(t0 + 0.3, [BARR[0] + 9, 4, BARR[2] - 2], 2.6, 1.5),
    ...fire(t0 + 0.1, [FUEL[0], 5, FUEL[2]], 3.0, 1.5), ...fire(t0 + 0.4, [BARR[0] + 18, 4, BARR[2] - 4], 2.4, 1.2), ...fire(t0 + 0.2, [-27, 7.5, -16], 3.0, 1.2)]).step(t); }
  if (id === 15) { const t0 = T0s(15) - 4; rig(s, () => [...fire(t0, [-9, 3, -9], 1.1), ...fire(t0, [9, 3, -17], 1.1), ...fire(t0, [0, 3, -25], 1.1), ...fire(t0, [-18, 3, -17], 1.0), ...fire(t0, [18, 3, -9], 1.0)]).step(t); }
};

// ---------------- effect drawings (cards: numbers and words on objects) ----------------
const fxBig = (p: Pen, s: string, col: string) => { txt(p, s, 600, 290, s.length > 6 ? 175 : 300, col, "900", "center", "'Inter Display','Inter',sans-serif"); };
/** sign board in the desert: NEW MEXICO 1941 + a rolling bat counter, 900 x 560 */
const fxCaveSign = (p: Pen, n: string) => { p.poly(rrect(10, 10, 890, 550, 14), "#e8d6b0", 8);
  txt(p, "NEW MEXICO", 450, 120, 88, "#5a2a1a", "900", "center", "Georgia, serif"); txt(p, "1941", 450, 220, 70, "#5a2a1a", "700", "center", "Georgia, serif");
  p.poly(rrect(80, 280, 820, 520, 16), "#2a2a2a", 6); txt(p, "BATS", 450, 345, 46, "#f4f0e0", "900", "center", '"Courier New", monospace'); txt(p, n, 450, 470, n.length > 9 ? 92 : 112, "#ffd23a", "900", "center", '"Courier New", monospace'); };
/** the handwritten letter, 1000 x 720 (n chars revealed) */
const LETTER = ["Dear Mr. President,", "Strap tiny fire", "bombs to bats.", "Drop them", "over Japan.", "  — Lytle S. Adams"];
const LET_N = LETTER.reduce((a, s) => a + s.length, 0);
const fxLetter = (p: Pen, n: number) => { const g = p.g; p.poly([[14, 18], [750, 8], [744, 990], [8, 984]], "#fbf6e8", 6);
  for (let k = 0; k < 7; k++) p.stroke([[40, 160 + 130 * k], [720, 160 + 130 * k]], 2, "rgba(120,140,190,0.45)");
  let left = n; g.font = "italic 600 64px 'Latin Modern Roman Slanted', Georgia, serif"; g.fillStyle = "#1f2f7a"; g.textAlign = "left";
  LETTER.forEach((s, li) => { if (left <= 0) return; let x = 50; const y = 140 + 130 * li; for (let k = 0; k < s.length && left > 0; k++, left--) { g.save(); g.translate(x, y + 2 * Math.sin(k * 1.7 + li)); g.rotate(0.03 * Math.sin(k * 2.3)); g.fillText(s[k], 0, 0); g.restore(); x += g.measureText(s[k]).width + 0.5; } }); };
/** where the pen tip is after n chars (canvas px) */
const penAt = (n: number): [number, number] => { let left = n; for (let li = 0; li < LETTER.length; li++) { const s = LETTER[li]; if (left <= s.length) return [50 + 31 * left, 140 + 130 * li]; left -= s.length; } return [600, 140 + 130 * 5]; };
/** the White House note, 900 x 1100 (k = 0 letterhead only .. 1 with the quote) */
const fxNote = (p: Pen, k: number) => { p.poly(rrect(10, 10, 890, 1090, 8), "#fbf8ee", 6);
  txt(p, "THE WHITE HOUSE", 450, 120, 66, "#1a2240", "900", "center", "Georgia, serif"); txt(p, "WASHINGTON", 450, 185, 40, "#1a2240", "700", "center", "Georgia, serif");
  p.stroke([[120, 230], [780, 230]], 4, "#1a2240"); txt(p, "MEMORANDUM", 450, 310, 44, "#3a3a3a", "900", "center", '"Courier New", monospace');
  if (k > 0) { txt(p, "This man is", 450, 520, 92, "#14121a", "900", "center", '"Courier New", monospace'); txt(p, "NOT A NUT.", 450, 650, 112, "#c0262c", "900", "center", '"Courier New", monospace'); }
  for (let i = 0; i < 3; i++) p.stroke([[160, 800 + 50 * i], [740 - 80 * i, 800 + 50 * i]], 8, "#cfc8b4");
  const g = p.g; g.font = "italic 700 86px Georgia, serif"; g.fillStyle = "#1f2f7a"; g.textAlign = "center"; g.fillText("F.D.R.", 640, 1010); };
/** scale display / tags, 600 x 300 */
const fxTag = (p: Pen, a: string, b: string, bg = "#fff6d8", fg = "#14121a", acc = "#c0262c") => { p.poly(rrect(10, 10, 590, 290, 24), bg, 8); txt(p, a, 300, 115, 64, fg, "900", "center"); txt(p, b, 300, 240, 110, acc, "900", "center"); };
const fxDisplay = (p: Pen, s: string) => { p.poly(rrect(10, 10, 590, 290, 20), "#1c2a20", 8); txt(p, s, 300, 205, 170, "#8af07a", "900", "center", '"Courier New", monospace'); };
/** callout label with a leader line pointing down-left, 800 x 260 */
const fxCallout = (p: Pen, s: string, n: number) => { p.poly(rrect(160, 10, 790, 150, 18), "#ffd23a", 8); txt(p, s.slice(0, n), 475, 108, 78, "#14121a", "900", "center"); p.stroke([[170, 140], [40, 250]], 12, "#ffd23a"); p.dot(40, 250, 20, "#ffd23a"); };
/** the timer tag: a clock face + mm:ss, 500 x 300 */
const fxTimer = (p: Pen, sec: number) => { p.poly(rrect(10, 10, 490, 290, 22), "#2a2a2a", 8); p.ell(110, 150, 80, 80, "#f4f0e0", 8); const a = -Math.PI / 2 + (sec / 60) * Math.PI * 2; p.stroke([[110, 150], [110 + 60 * Math.cos(a), 150 + 60 * Math.sin(a)]], 10, "#c0262c");
  txt(p, "TIMER", 340, 110, 52, "#f4f0e0", "900", "center", '"Courier New", monospace'); txt(p, `0:${String(Math.max(0, Math.round(sec))).padStart(2, "0")}`, 340, 230, 96, sec <= 0 ? "#ff5a3a" : "#ffd23a", "900", "center", '"Courier New", monospace'); };
/** the chart on the easel: fires per bomb load, bars grow with u, 1000 x 840 */
const fxChart = (p: Pen, u: number) => { p.poly(rrect(6, 6, 994, 834, 8), "#2a3a32", 0);
  txt(p, "FIRES STARTED", 500, 100, 70, "#f4f0e0", "900", "center"); p.stroke([[120, 720], [900, 720]], 8, "#f4f0e0");
  const h1 = 50 * clamp01(u * 3), h2 = 520 * smooth(clamp01((u - 0.3) / 0.7));
  p.poly(rrect(190, 720 - h1, 400, 720, 6), "#9aa6b0", 6); p.poly(rrect(560, 720 - h2, 770, 720, 6), "#ff8a2a", 6);
  txt(p, "NORMAL", 295, 790, 50, "#f4f0e0", "900", "center"); txt(p, "BATS", 665, 790, 56, "#ffd23a", "900", "center");
  if (u > 0.85) txt(p, "×10", 665, 720 - h2 - 30, 120, "#ffd23a", "900", "center"); };
/** the project file with the CANCELLED stamp, 900 x 640 */
const fxFile = (p: Pen, stamp: number) => { p.poly(rrect(10, 60, 890, 630, 14), "#d8b870", 8); p.poly(rrect(40, 10, 360, 90, 12), "#d8b870", 8);
  txt(p, "PROJECT X-RAY", 450, 230, 92, "#3a2410", "900", "center", '"Courier New", monospace'); txt(p, "TOP SECRET", 450, 330, 56, "#7a1a1a", "900", "center", '"Courier New", monospace');
  if (stamp > 0) { const g = p.g; g.save(); g.translate(450, 470); g.rotate(-0.16); const s = 1 + 0.7 * (1 - stamp); g.scale(s, s); g.globalAlpha = 0.9; g.strokeStyle = "#c0262c"; g.lineWidth = 12; g.strokeRect(-330, -70, 660, 140);
    g.fillStyle = "#c0262c"; g.font = "900 104px 'Courier New', monospace"; g.textAlign = "center"; g.fillText("CANCELLED", 0, 36); g.restore(); } };
const fxRadio = (p: Pen) => fxSay(p, "PEARL HARBOR!");

/** toon flame cards on every burning building (on twos, flickering) */
const FLAMES: [V3, number][] = [[[TOWER[0] + 0.6, 5.2, TOWER[2] + 1.9], 2.8], [[TOWER[0], 11.6, TOWER[2] + 1], 4.2], [[TOWER[0] - 1.2, 9.8, TOWER[2] + 2.3], 2.6], [[BARR[0] - 1.5, 4.8, BARR[2] + 1], 3.6], [[BARR[0] + 2, 4.9, BARR[2] + 1.2], 3.2],
  [[BARR[0] + 9, 4.8, BARR[2] - 1], 3.6], [[BARR[0] + 18, 4.6, BARR[2] - 3], 3.4], [[FUEL[0], 6.6, FUEL[2] + 1.2], 4.6], [[-27, 9.5, -12], 5], [[-22, 8, -10], 3]];
const baseFlames = (c: Ctx) => { const t0 = A(11, "burned") - 0.2, u = c.t - t0 + LEAD; if (u < 0) return;
  FLAMES.forEach(([p, s], i) => { const g = Math.min(1, u * 3 - i * 0.12); if (g <= 0) return; const kk = q((c.t * 2.2 + i * 0.37) % 1, 6);
    card(c, `bfl${kk}`, 300, 400, (pp) => { fxFlameAt(pp, 150, 260, 95, kk * 6); fxFlameAt(pp, 85, 300, 55, kk * 6 + 2); fxFlameAt(pp, 215, 300, 60, kk * 6 + 4); }, [p[0], p[1] - 0.5 * s * (1 - g), p[2]], 0.75 * s * g, s * g); }); };

// ---------------- staging (2D cards) ----------------
type StageFn = (c: Ctx) => void;
export const STAGE: Record<number, StageFn> = {
  1: () => {},
  2: (c) => { const t = c.t, k = pop(t, A(1, "lytle")); if (after(t, A(1, "lytle"))) card(c, "bigADAMS", 1200, 380, (p) => fxBig(p, "LYTLE ADAMS", "#ffd23a"), [ADM[0], 1.78, -2.42], 2.5 * k, 0.79 * k, { yaw: 0 }); },
  3: (c) => { const t = c.t, u = clamp01((t - A(2, "millions") + 0.4) / 0.9), n = u >= 1 ? "MILLIONS" : String(Math.round(10 ** (2 + 4 * u))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    card(c, "csign" + n, 900, 560, (p) => fxCaveSign(p, n), [SIGN[0] + 0.7, 1.85, SIGN[2] + 0.04], 1.7, 1.06, { yaw: 0 }); },
  4: (c) => { const t = c.t, u = t - A(3, "pearl") + LEAD; if (u > 0 && u < 1.6) { const k = pop(t, A(3, "pearl")); card(c, "radio", 600, 360, fxRadio, [CAR[0] - 1.3, 2.3, CAR[2] + 0.1], 1.1 * k, 0.66 * k); }
    if (after(t, A(3, "idea") - 0.1)) { const k = pop(t, A(3, "idea") - 0.1), kk = q(Math.sin(t * 6) * 0.5 + 0.5, 4); card(c, "bulb" + kk, 300, 340, (p) => fxBulb(p, kk), [CAR[0] + 0.15, 2.55, CAR[2] - 0.35], 0.6 * k, 0.68 * k); } },
  5: (c) => { const t = c.t, n = Math.round(LET_N * clamp01((t - A(4, "white") + 0.1) / Math.max(1.5, A(4, "japan", ) - A(4, "white") + 0.4)));
    card(c, "letter" + n, 760, 1000, (p) => fxLetter(p, n), [LETP[0], LETP[1], LETP[2]], 0.418, 0.55, { flat: true, rot: 0.03 });
    const [px, py] = penAt(n); const x = LETP[0] + (px / 760 - 0.5) * 0.418, z = LETP[2] + (py / 1000 - 0.5) * 0.55;
    card(c, "pen", 400, 60, (p) => { p.poly(rrect(10, 14, 300, 46, 10), "#1a1a1a", 4); p.poly([[300, 14], [390, 30], [300, 46]], "#c8a048", 4); }, [x + 0.07, LETP[1] + 0.02 + 0.006 * Math.sin(t * 25), z + 0.02], 0.16, 0.024, { flat: true, rot: 2.6 }); },
  6: (c) => { const t = c.t, k = pop(t, T0s(6) + 0.2); card(c, "note0", 900, 1100, (p) => fxNote(p, 0), [DESK[0] - 0.05, 0.79, DESK[2] + 0.08], 0.36 * k, 0.44 * k, { flat: true, rot: -0.08 }); },
  7: (c) => { card(c, "note1", 900, 1100, (p) => fxNote(p, 1), [ADM[0] - 0.36, 1.36, ADM[2] + 0.5], 0.4, 0.49, { yaw: 0.25, rot: 0.06 }); },
  8: (c) => { const t = c.t; card(c, "disp14", 600, 300, (p) => fxDisplay(p, "14 g"), [SCALE[0], SCALE[1] + 0.065, SCALE[2] + 0.142], 0.2, 0.1, { yaw: 0 });
    if (after(t, A(6, "fourteen"))) { const k = pop(t, A(6, "fourteen")); card(c, "tagW", 600, 300, (p) => fxTag(p, "BAT", "14 g", "#fff6d8", "#14121a", "#14121a"), [SCALE[0] - 0.16, SCALE[1] + 0.56, SCALE[2] + 0.05], 0.26 * k, 0.13 * k, { rot: 0.06 }); }
    if (after(t, A(6, "eighteen"))) { const k = pop(t, A(6, "eighteen")); card(c, "tagC", 600, 300, (p) => fxTag(p, "CARRIES", "18 g"), [SCALE[0] + 0.16, SCALE[1] + 0.56, SCALE[2] + 0.05], 0.28 * k, 0.14 * k, { rot: -0.06 }); } },
  9: (c) => { const t = c.t, lab = (w: string, s: string, p: V3, line = 7) => { if (!after(t, A(line, w))) return; const n = Math.min(s.length, Math.round((t - A(line, w) + LEAD) * 30)); card(c, `co${s}${n}`, 800, 260, (pp) => fxCallout(pp, s, n), p, s.length > 9 ? 1.6 : 2.0, s.length > 9 ? 0.52 : 0.65); };
    const dr = A(7, "drop") - 0.05, pc = A(7, "parachute") + 0.1, y = casY9(t);
    if (t < dr + 0.3) lab("pack", "1,040 BATS", [BAYP[0] + 1.1, BAYP[1] - 0.5, BAYP[2] + 0.4]);
    else if (t < pc) lab("drop", "DROP", [BAYP[0] + 1.0, y + 0.3, BAYP[2] + 0.4]);
    else if (t < A(7, "wake") - 0.15) lab("parachute", "PARACHUTE", [BAYP[0] + 1.6, y + 3.0, BAYP[2] + 0.5]);
    else lab("wake", "BATS WAKE UP", [BAYP[0] + 0.75, y + 0.55, BAYP[2] + 0.5]); },
  10: (c) => { const t = c.t, ta = A(8, "timer"); if (after(t, ta)) { const k = pop(t, ta), sec = Math.max(0, 9 - 9 * clamp01((t - ta) / Math.max(0.4, A(8, "off") - ta)));
    card(c, "timer" + Math.round(sec), 500, 300, (p) => fxTimer(p, sec), [VENT[0] - 1.25, VENT[1] + 1.25, VENT[2] + 0.4], 1.0 * k, 0.6 * k, { rot: -0.05 }); }
    if (after(t, A(8, "off"))) for (let k2 = 0; k2 < 2; k2++) { const kk = q((t * 3 + k2 * 0.5) % 1, 6); card(c, `fl${kk}`, 300, 400, (p) => fxFlameAt(p, 150, 260, 70 + 20 * kk, t), [VENT[0] - 0.2 + 0.4 * k2, VENT[1] + 0.5, VENT[2] + 0.15], 0.6, 0.8); } },
  11: (c) => { const t = c.t; if (after(t, A(9, "may"))) { const k = pop(t, A(9, "may")); card(c, "may43", 600, 300, (p) => fxTag(p, "TEST", "MAY 1943", "#fff6d8", "#14121a", "#c0262c"), [0.6, 3.85, -2.5], 1.3 * k, 0.65 * k, { rot: -0.04, yaw: 0 }); } },
  12: () => {},
  13: (c) => baseFlames(c), 14: (c) => baseFlames(c),
  15: (c) => { const t = c.t, u = clamp01((t - A(12, "ten") + 0.6) / 1.2); card(c, "chart" + q(u, 30), 1000, 840, (p) => fxChart(p, u), [EASEL[0] + 0.02, 1.65, EASEL[2] + 0.2], 1.86, 1.56, { yaw: -0.35 }); },
  16: (c) => { const t = c.t, st = clamp01((t - A(13, "cancelled") + LEAD) / 0.15); card(c, "file" + q(st, 8), 900, 640, (p) => fxFile(p, st), [DESK[0] + 0.1, 0.79, DESK[2] + 0.12], 0.6, 0.427, { flat: true, rot: 0.04 }); },
  17: () => {},
};
void T1s; void WAL; void LS0; void lineStart; void ADAMS_SUIT;
function LS0() { return 0; }
