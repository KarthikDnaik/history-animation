// Places and cast of "The Dancing Plague" (Strasbourg, July-September 1518; 9:16 short). Cameras sit on +z looking -z.
// Direction sheet: a hot Alsatian summer. Palette: half-timber cream/ochre + dark oak, terracotta roofs, the pink sandstone
// cathedral, summer-sky blue, and ONE accent: red (the shoes, the council's robes, the drum ban). One key moment per shot on
// a narration word; dancers move on twos (anticipation -> bounce -> settle); the deaths line is played straight (cold grade).
// Avoid: faces filling the frame, push-ins ending on eyes, jitter, labels cut by the frame or hidden behind props.
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

// ---------------- textures ----------------
const pinkStone = () => stoneHD("pinkHD", ["#d89a8a", "#cf8e80", "#e0a898", "#c4857a"], "#9a6a62");
const PINK = () => lam("pinkM", () => ({ map: rep(pinkStone(), 1, 1) }));
const greyStone = () => stoneHD("greyHD", ["#d8d0c0", "#ccc4b4", "#e0d8c8", "#c2b8a6"], "#9a9284");
const GREY = () => lam("greyM", () => ({ map: rep(greyStone(), 1, 1) }));
const HILLG = () => lam("hillG", () => ({ color: "#86a862" }));
const COBBLE = () => lam("cobM", () => ({ map: rep(cobbleHD(), 3, 3) }));
const strasFlag = () => ctex("strasFlag", 512, 320, (g) => {
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#c62a2e"; g.lineWidth = 90; g.beginPath(); g.moveTo(-20, -20); g.lineTo(532, 340); g.stroke();
});
const townView = () => ctex("townView", 256, 384, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "#7ab4e8"); gr.addColorStop(1, "#d8ecf8"); g.fillStyle = gr; g.fillRect(0, 0, 256, 384);
  for (let k = 0; k < 7; k++) { const x = -20 + 45 * k, h = 120 + 80 * r(); g.fillStyle = ["#e8c49a", "#f1d9a8", "#d89a6a"][k % 3]; g.fillRect(x, 384 - h, 44, h); g.fillStyle = "#a84a3a"; g.beginPath(); g.moveTo(x - 4, 384 - h); g.lineTo(x + 22, 384 - h - 40); g.lineTo(x + 48, 384 - h); g.fill(); }
  g.fillStyle = "#d89a8a"; g.fillRect(170, 60, 26, 324); g.beginPath(); g.moveTo(168, 60); g.lineTo(183, 0); g.lineTo(198, 60); g.fill();
});
const leaded = () => ctex("leaded", 256, 384, (g) => {
  g.drawImage(townView().image as CanvasImageSource, 0, 0);
  g.fillStyle = "rgba(255,240,200,0.18)"; g.fillRect(0, 0, 256, 384);
  g.strokeStyle = "#3a3026"; g.lineWidth = 4;
  for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 384, 384); g.stroke(); g.beginPath(); g.moveTo(i * 32 + 384, 0); g.lineTo(i * 32, 384); g.stroke(); }
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
/** Strasbourg cathedral: pink sandstone west front with a rose window, three portals, ONE north tower with an openwork
 *  octagon and spire; long nave behind. Front faces +z at (x, z). s = scale. */
const cathedral = (b: Batch, x: number, z: number, s = 1) => {
  const P = PINK(), m = M4(x, 0, z, 0, s), dark = C("#4a2a2a");
  b.add(boxGeo(V(-9, 0, -4), V(9, 30, 0), 3), P, m);                                  // west front
  b.add(boxGeo(V(-6, 0, -48), V(6, 22, -4), 3), P, m);                                // nave
  gable(b, ROOF("#7a8a96"), P, -6 + x, 6 + x, -48 * s + z, -4 * s + z, 22 * s, 9 * s);  // (roof in world units, s ~ 1)
  for (const px of [-5.5, 0, 5.5]) { b.add(boxGeo(V(px - 1.6, 0, 0.02), V(px + 1.6, 6.5, 0.12)), dark, m); b.add(new THREE.ConeGeometry(2.1, 3.4, 4).rotateY(Math.PI / 4).translate(px, 8, 0.2), P, m); }
  b.add(new THREE.CircleGeometry(4.2, 32).translate(0, 17, 0.05), lam("rose", () => ({ color: "#5a2a4a", emissive: "#6a3a8a", emissiveIntensity: 0.35 })), m);
  b.add(new THREE.TorusGeometry(4.2, 0.35, 8, 32).translate(0, 17, 0.1), P, m);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.add(boxGeo(V(-0.08, 0, -0.05), V(0.08, 4.1, 0.05)).rotateZ(a).translate(0, 17, 0.12), P, m); }
  for (let k = 0; k < 9; k++) b.add(boxGeo(V(-8.6 + 2.1 * k - 0.3, 22, 0), V(-8.6 + 2.1 * k + 0.3, 29, 0.25)), P, m);  // tracery screen
  b.add(boxGeo(V(-9, 30, -4), V(-1.5, 42, 0), 2), P, m);                               // north tower
  b.add(new THREE.CylinderGeometry(2.8, 3.2, 12, 8).translate(-5.2, 48, -2), P, m);   // octagon
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add(boxGeo(V(-0.25, 0, -0.25), V(0.25, 11, 0.25)).translate(-5.2 + 3.1 * Math.cos(a), 42.5, -2 + 3.1 * Math.sin(a)), P, m); }
  b.add(new THREE.ConeGeometry(2.8, 18, 8).translate(-5.2, 63, -2), P, m);            // spire
  b.add(new THREE.ConeGeometry(0.25, 2, 6).translate(-5.2, 73, -2), P, m);
  for (const [cx, cy] of [[-8.6, 30], [-1.9, 30], [8.6, 30], [1.9, 30]]) b.add(new THREE.ConeGeometry(0.5, 3, 4).translate(cx, cy + 1.5, -0.3), P, m);
};
/** wall lantern (warm, emissive) */
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
const fountain = (b: Batch, x: number, z: number) => {
  b.add(new THREE.CylinderGeometry(1.6, 1.7, 0.7, 20).translate(x, 0.35, z), GREY());
  b.add(new THREE.CylinderGeometry(1.4, 1.4, 0.05, 20).translate(x, 0.62, z), lam("fwater", () => ({ color: "#5a9ac8", emissive: "#2a5a7a", emissiveIntensity: 0.2 })));
  b.add(new THREE.CylinderGeometry(0.2, 0.25, 2.2, 10).translate(x, 1.1, z), GREY());
  b.add(new THREE.SphereGeometry(0.35, 12, 8).translate(x, 2.3, z), GREY());
};

/** a cobbled lane of half-timbered houses running along -z, the cathedral spire closing the view */
const TIMBER = [8, 9, 10, 11, 12, 3];
const street = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-3.2, 3.2, -70, 14, 2.5, 0), COBBLE());
  b.add(plane(-60, 60, -200, 60, 8, -0.02), lam("ground", () => ({ map: earthHD() })));
  for (const sd of [-1, 1]) {
    let z = 12, k = 0;
    while (z > -64) {
      const w = 5.4 + 1.6 * hh(k + (sd > 0 ? 40 : 0), 1), d = 8, h = 6.4 + 2.6 * hh(k + (sd > 0 ? 40 : 0), 2);
      house(b, sd * (3.2 + d / 2), z - w / 2, sd < 0 ? Math.PI / 2 : -Math.PI / 2, w, d, h, TIMBER[(k + (sd > 0 ? 3 : 0)) % TIMBER.length]);
      if (k % 2 === 0) lantern(b, sd * 3.15, 2.9, z - w / 2 + 1.4);
      z -= w + 0.05; k++;
    }
  }
  b.add(boxGeo(V(-3.2, 0, -2.2), V(-3.0, 0.4, -1.6)), C("#5a4a3a")); // Troffea's door step
  barrel(b, 2.6, 1.6); crate(b, 2.5, 0.6, 0.6, 0.3); crate(b, -2.7, -9, 0.6, 0.6); barrel(b, -2.7, -10);
  cathedral(b, 0, -82, 1);
  hills(b, 0, -30, 300, 14, 34, 3, HILLG());
};
/** the horse market square: timber houses on three sides, cathedral over the roofs, stalls, a fountain, the dyn stage */
const STG = { x: 0, z: -10, w: 7, d: 4.4, h: 1.1 };
const market = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-18, 18, -28, 16, 3, 0), COBBLE());
  b.add(plane(-80, 80, -220, 80, 8, -0.02), lam("ground", () => ({ map: earthHD() })));
  for (let k = 0; k < 6; k++) { const w = 6 + 0.8 * hh(k, 4); house(b, -15 + 6.1 * k, -32, 0, w, 8, 7 + 2.5 * hh(k, 5), TIMBER[k % TIMBER.length]); }
  for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const w = 6.2; house(b, sd * 22, -24 + 6.4 * k, sd < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8, 6.6 + 2.6 * hh(k + (sd > 0 ? 9 : 0), 6), TIMBER[(k + (sd > 0 ? 2 : 4)) % TIMBER.length]); }
  cathedral(b, 6, -58, 1);
  hills(b, 0, -20, 300, 14, 36, 5, HILLG());
  tent(b, -12, -6, 0.3, 0.9); tent(b, 12.5, -4, -0.4, 0.9); tent(b, -11, 6, 0.6, 0.8);
  for (const [x, z] of [[-13.5, -8.4], [-10.6, -8.6], [13.6, -6.6]] as [number, number][]) { barrel(b, x, z); crate(b, x + 0.8, z + 0.3, 0.5, 0.4); }
  fountain(b, 10, 6);
  for (let k = 0; k < 4; k++) lantern(b, -17.9, 3.0, -20 + 8 * k);
  // the stage (dyn): planked platform, trestle legs, steps, two poles with Strasbourg banners + bunting
  sub(s, "stage", (sb) => {
    const { w, d, h } = STG, Wd = C("#7a5232");
    sb.add(boxGeo(V(-w / 2, h - 0.15, -d / 2), V(w / 2, h, d / 2)), lam("stagePl", () => ({ map: planksHD() })));
    for (const x of [-w / 2 + 0.3, 0, w / 2 - 0.3]) for (const z of [-d / 2 + 0.3, d / 2 - 0.3]) sb.add(boxGeo(V(x - 0.12, 0, z - 0.12), V(x + 0.12, h - 0.15, z + 0.12)), Wd);
    sb.add(boxGeo(V(-w / 2, 0.2, d / 2 - 0.05), V(w / 2, h - 0.15, d / 2)), lam("stageSk", () => ({ map: plankWall("skirt", "#8a5a34") })));
    for (let k = 0; k < 3; k++) sb.add(boxGeo(V(w / 2 - 1.4, 0, d / 2 + 0.35 * (3 - k) - 0.35), V(w / 2 - 0.4, (k + 1) * h / 4, d / 2 + 0.35 * (3 - k))), Wd);
    for (const sx of [-1, 1]) {
      sb.add(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8).translate(sx * (w / 2 - 0.1), h + 2.1, -d / 2 + 0.2), Wd);
      sb.add(quad(V(sx * (w / 2 - 0.1) - 0.6, h + 2.2, -d / 2 + 0.25), V(sx * (w / 2 - 0.1) + 0.6, h + 2.2, -d / 2 + 0.25), V(sx * (w / 2 - 0.1) + 0.6, h + 4.0, -d / 2 + 0.25), V(sx * (w / 2 - 0.1) - 0.6, h + 4.0, -d / 2 + 0.25)), lam("strasB", () => ({ map: strasFlag(), side: THREE.DoubleSide })));
    }
    for (let k = 0; k < 12; k++) { const x = -w / 2 + 0.1 + (k + 0.5) * (w - 0.2) / 12, y = h + 3.9 - 0.5 * Math.sin(Math.PI * (k + 0.5) / 12); sb.add(tri(V(x - 0.25, y, -d / 2 + 0.2), V(x + 0.25, y, -d / 2 + 0.2), V(x, y - 0.45, -d / 2 + 0.2)), C(["#c62a2e", "#f4f1ea", "#e8b84a"][k % 3])); }
  }).position.set(STG.x, 0, STG.z);
};
/** the council chamber: oak panelling, leaded windows onto the town, long table, the city banner */
const council = (s: SetBuild) => {
  const { b } = s, H = 3.4;
  const Wl = lam("cWall", () => ({ map: panelHD("council", "#6a4426") }));
  b.add(plane(-5, 5, -4.6, 6, 2.4), lam("cFloor", () => ({ map: planksHD() })));
  wbox(b, Wl, -5, 0, -4.8, 5, H, -4.6, 2.5, 2.5);
  for (const sd of [-1, 1]) wbox(b, Wl, sd > 0 ? 5 : -5.2, 0, -4.8, sd > 0 ? 5.2 : -5, H, 6, 2.5, 2.5);
  b.add(boxGeo(V(-5.2, H, -4.8), V(5.2, H + 0.1, 6)), C("#d8c8a8"));
  for (let z = -4.2; z < 6; z += 1.2) b.add(boxGeo(V(-5.2, H - 0.2, z - 0.1), V(5.2, H, z + 0.1)), C("#4a2c18"));
  for (const x of [-3.4, 3.4]) {
    b.add(boxGeo(V(x - 0.85, 1.0, -4.6), V(x + 0.85, 2.9, -4.55)), C("#3a2414"));
    b.add(quad(V(x - 0.75, 1.1, -4.54), V(x + 0.75, 1.1, -4.54), V(x + 0.75, 2.8, -4.54), V(x - 0.75, 2.8, -4.54)), lam("leadedM", () => ({ map: leaded(), emissive: "#ffffff", emissiveMap: leaded(), emissiveIntensity: 0.85 })));
  }
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), lam("strasW", () => ({ map: strasFlag(), side: THREE.DoubleSide }))); bm.position.set(0, 2.2, -4.55); s.root.add(bm);
  table2(b, 0, -1.9, 4.6, 1.3, 0.8, "#4a2a18", "#2f5a3a", false);
  for (let k = 0; k < 5; k++) chair(b, -1.8 + 0.9 * k, -3.0, Math.PI, "#3a2414", "#7a2632");
  for (const [x, z] of [[-1.6, -1.7], [1.2, -2.0]] as [number, number][]) { b.add(boxGeo(V(x - 0.25, 0.82, z - 0.18), V(x + 0.25, 0.9, z + 0.18)), C("#e8dcb8")); b.add(boxGeo(V(x - 0.24, 0.9, z - 0.17), V(x + 0.24, 0.93, z + 0.17)), C("#8a2a2a")); }
  for (const x of [-0.5, 0.5]) { b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8).translate(x, 0.93, -1.6), C("#e8dcc0")); b.add(new THREE.SphereGeometry(0.05, 8, 6).translate(x, 1.1, -1.6), lam("flame", () => ({ color: "#ffd27a", emissive: "#ffb44a", emissiveIntensity: 2 }))); }
  chandelier2(b, 0, 2.6, -1.0, 0.8);
  bookcase(b, -4.2, -3.6, 1.4, 2.4, "#3a2414"); bookcase(b, 4.2, -3.6, 1.4, 2.4, "#3a2414");
  rug(b, "council", ["#7a2632", "#2a3a5a", "#d8b84a", "#e8dcc0"], 0, -0.4, 4.4, 3.0);
  painting(b, -2.0, 2.2, -4.55, 0.9, 0.7, 2); painting(b, 2.0, 2.2, -4.55, 0.9, 0.7, 5);
};
/** the countryside shrine of St Vitus: a small chapel, meadow, trees, a dirt road, the wagon */
const shrine = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-120, 120, -200, 60, 6, 0), lam("grassM", () => ({ map: rep(grassHD(), 1, 1) })));
  b.add(plane(1.6, 4.6, -200, 60, 3, 0.02), lam("road", () => ({ map: earthHD("roadHD") })));
  const G = GREY(), wall = G;
  wbox(b, G, -6, 0, -18, 0, 5, -9, 2, 2);
  gable(b, ROOF("#a84a3a"), wall, -6, 0, -18, -9, 5, 3.4);
  b.add(boxGeo(V(-3.9, 0, -8.98), V(-2.1, 2.8, -8.9)), C("#4a2e1e"));
  b.add(new THREE.TorusGeometry(0.9, 0.12, 8, 18, Math.PI).translate(-3, 2.8, -8.92), G);
  b.add(new THREE.CircleGeometry(0.6, 20).translate(-3, 4.4, -8.92), lam("rose2", () => ({ color: "#5a3a6a", emissive: "#6a4a8a", emissiveIntensity: 0.3 })));
  b.add(boxGeo(V(-3.6, 8.2, -10.2), V(-2.4, 10.2, -9.0)), G);
  b.add(new THREE.ConeGeometry(0.95, 2.4, 4).rotateY(Math.PI / 4).translate(-3, 11.4, -9.6), C("#7a8a96"));
  b.add(boxGeo(V(-3.05, 12.4, -9.65), V(-2.95, 13.2, -9.55)), C("#d8b84a")); b.add(boxGeo(V(-3.3, 12.9, -9.65), V(-2.7, 13.0, -9.55)), C("#d8b84a"));
  for (let k = 0; k < 9; k++) tree(b, -16 + 4 * k + 2 * hh(k, 1), -22 - 6 * hh(k, 2) - (k % 2) * 8, 6 + 3 * hh(k, 3), k);
  for (let k = 0; k < 5; k++) tree(b, 8 + 3 * k, -4 - 5 * k, 5 + 2 * hh(k, 7), k + 20);
  hills(b, 0, -20, 240, 12, 30, 7, HILLG());
  // farm wagon (static): bed, side boards, four spoked wheels, shaft
  const m = M4(3.1, 0, -4.2, 0.25), Wd = C("#8a5a34"), Dk = C("#4a2e1e");
  b.add(boxGeo(V(-0.9, 0.75, -1.6), V(0.9, 0.9, 1.6)), lam("wagonB", () => ({ map: planksHD() })), m);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * 0.9 - 0.05, 0.9, -1.6), V(sx * 0.9 + 0.05, 1.35, 1.6)), Wd, m);
  b.add(boxGeo(V(-0.9, 0.9, 1.55), V(0.9, 1.35, 1.6)), Wd, m);
  for (const sx of [-1, 1]) for (const z of [-1.1, 1.1]) {
    b.add(new THREE.TorusGeometry(0.5, 0.06, 6, 18).rotateY(Math.PI / 2).translate(sx * 1.02, 0.52, z), Dk, m);
    for (let k = 0; k < 4; k++) b.add(beamBetween(V(sx * 1.02, 0.52 - 0.5 * Math.cos(k * 0.785), z - 0.5 * Math.sin(k * 0.785)), V(sx * 1.02, 0.52 + 0.5 * Math.cos(k * 0.785), z + 0.5 * Math.sin(k * 0.785)), 0.025, 4), Dk, m);
  }
  b.add(beamBetween(V(0, 0.8, -1.6), V(0, 0.4, -3.4), 0.05), Dk, m);
  b.add(new THREE.SphereGeometry(0.45, 10, 8).scale(1, 0.5, 1).translate(0.3, 1.0, 0.8), lam("hay", () => ({ color: "#e8c46a" })), m);
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { street, market, council, shrine };

// ---------------- dynamic ----------------
const shotT0 = (id: number) => SHOTS[id - 1].a / FPS;
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  market: (s, t, id) => {
    waveFlags(s, t);
    const g = s.dyn.stage;
    // shot 14 the stage goes up on "build"; 15-18 + the hook / outro it stands; shot 20 it collapses on "torn"
    const up = id === 14 ? smooth((t - A(5, "build") + LEAD) / 0.6) : [1, 3, 15, 16, 17, 18, 27].includes(id) ? 1 : id === 20 ? 1 : 0;
    const torn = id === 20 ? smooth((t - A(7, "torn") + LEAD) / 0.5) : 0;
    g.visible = up > 0.01;
    g.scale.set(1, Math.max(0.01, up * (1 - 0.85 * torn)), 1);
    g.rotation.z = 0.12 * torn; g.position.y = -0.3 * torn;
  },
};

// ---------------- cast (Strasbourg, 1518) ----------------
const TROFFEA: Outfit = { jacket: "#2f6a8a", pants: "#2f6a8a", boots: "#5a3a26", dress: "#2f6a8a", hat: "bonnet", hatCol: "#f4f0e6", skin: SKINS[1], trim: "#f4f0e6" };
const HUSBAND: Outfit = { jacket: "#7a5a3a", pants: "#5a4a3a", boots: "#3a2a1e", hat: "beret", hatCol: "#4a3424", moustache: "#5a3a22", skin: SKINS[1], belt: "#3a2a1e" };
const TOWN = (v: number): Outfit => {
  const k = v % 8, dresses = ["#8a3a3a", "#c88a3a", "#5a7a3a", "#7a5a8a", "#a8603a"], tun = ["#6a4a2e", "#3a5a6a", "#8a6a3a", "#5a3a3a"];
  return k % 2 === 0
    ? { jacket: dresses[(k / 2) % 5], pants: dresses[(k / 2) % 5], boots: "#4a3020", dress: dresses[(k / 2) % 5], hat: k % 4 === 0 ? "bonnet" : "hair", hatCol: "#f1ece0", hair: ["#5a3a22", "#c8a060", "#2a2020"][k % 3], skin: SKINS[(k + 1) % 3] }
    : { jacket: tun[((k - 1) / 2) % 4], pants: ["#4a4a3a", "#5a3a2a", "#3a3a4a"][k % 3], boots: "#3a2a1e", hat: k % 3 === 0 ? "beret" : "cap", hatCol: "#3a2a22", cap: ["#8a3a3a", "#5a6a3a", "#3a4a6a"][k % 3], belt: "#3a2a1e", moustache: k % 3 === 1 ? "#4a3020" : undefined, skin: SKINS[k % 3] };
};
const COUNCILLOR = (v: number): Outfit => ({ jacket: "#1e1e24", pants: "#1e1e24", boots: INK, dress: "#1e1e24", hat: "beret", hatCol: v % 2 ? "#8a1e2a" : "#1e1e24", trim: "#d8b84a", moustache: ["#cfc8bc", "#6a4a2a", "#9a8a7a"][v % 3], skin: SKINS[v % 3], build: v % 2 ? "stout" : "adult" });
const DOCTOR: Outfit = { jacket: "#8a1e2a", pants: "#8a1e2a", boots: INK, dress: "#8a1e2a", hat: "beret", hatCol: "#5a1018", trim: "#e8dcc0", moustache: "#d8d0c4", skin: SKINS[0], build: "stout" };
const PIPER = (v: number): Outfit => ({ jacket: ["#c8323a", "#e8b84a"][v % 2], pants: ["#e8b84a", "#c8323a"][v % 2], boots: "#3a2a1e", hat: "beret", hatCol: ["#2a5a3a", "#c8323a"][v % 2], moustache: "#5a3a22", skin: SKINS[(v + 1) % 3] });
const BRIDE: Outfit = { jacket: "#f4f0e6", pants: "#f4f0e6", boots: "#c8a060", dress: "#f4f0e6", hat: "hair", hair: "#c8a060", skin: SKINS[1] };
const GROOM: Outfit = { jacket: "#2a3a5a", pants: "#3a3a4a", boots: INK, hat: "beret", hatCol: "#1e1e24", belt: "#d8b84a", skin: SKINS[2] };
const PRIEST: Outfit = { jacket: "#2a2a30", pants: "#2a2a30", boots: INK, dress: "#2a2a30", hat: "hair", hair: "#9a8a7a", trim: "#f4f0e6", skin: SKINS[0] };

// ---------------- effect drawings ----------------
const SERIF = "Georgia, serif";
const paper = (p: Pen, col = "#f8f1dc") => p.poly(rrect(20, 20, 500, 620, 10), col, 9);
const note = (p: Pen, x: number, y: number, col: string, dbl = false) => {
  p.ell(x, y, 30, 22, col, 7); p.stroke([[x + 26, y - 4], [x + 26, y - 110]], 9, INK);
  if (dbl) { p.ell(x + 90, y - 20, 30, 22, col, 7); p.stroke([[x + 116, y - 24], [x + 116, y - 130]], 9, INK); p.band([[x + 26, y - 110], [x + 116, y - 130]], INK, 18, 0, "butt"); }
  else p.stroke([[x + 26, y - 110], [x + 62, y - 80], [x + 56, y - 50]], 9, INK);
};
const fxNotes = (k: number) => (p: Pen) => { const y = 8 * Math.sin(k * 6.28); note(p, 70, 230 + y, "#fff3b0"); note(p, 170, 170 - y, "#ffd0c0", true); };
const fxShoes = (p: Pen) => {
  for (const [x, rot] of [[150, -0.15], [330, 0.12]] as [number, number][]) {
    const pts: [number, number][] = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push([x + 90 * Math.cos(a) * Math.cos(rot) - 44 * Math.sin(a) * Math.sin(rot), 200 + 90 * Math.cos(a) * Math.sin(rot) + 44 * Math.sin(a) * Math.cos(rot)]); }
    p.poly(pts, "#d02a2e", 9); p.ell(x - 10, 196, 46, 22, "#5a1018", 0); p.ell(x + 40, 180, 16, 10, "#ffb0a0", 0);
  }
};
const fxBread = (p: Pen) => {
  p.ell(240, 200, 200, 110, "#c88a3a", 10); p.ell(240, 170, 170, 70, "#e0a85a", 0);
  for (const x of [130, 210, 290, 370]) p.stroke([[x - 20, 120], [x + 20, 210]], 9, "#8a5a24");
  for (const [x, y, r] of [[150, 160, 22], [300, 230, 26], [360, 150, 18], [220, 240, 16]] as [number, number, number][]) p.ell(x, y, r, r * 0.8, "#6a9a3a", 5);
};
const fxUturn = (p: Pen) => {
  p.poly(rrect(20, 20, 380, 380, 30), "#2f5aa8", 10);
  p.band([[120, 330], [120, 170], [200, 100], [280, 170], [280, 260]], "#ffffff", 46, 0, "butt");
  p.poly([[220, 250], [340, 250], [280, 340]], "#ffffff", 0);
};
const fxBan = (p: Pen) => {
  p.ell(200, 210, 110, 60, "#c88a3a", 8); p.poly([[90, 210], [90, 330], [310, 330], [310, 210]], "#c88a3a", 8); p.ell(200, 330, 110, 40, "#a8683a", 8); p.ell(200, 210, 110, 60, "#f1e6c8", 8);
  for (const x of [120, 170, 230, 280]) p.stroke([[x, 260], [x + 20, 320]], 6, "#7a4a24");
  p.stroke([[300, 80], [230, 190]], 14, "#e8dcc0"); p.stroke([[100, 80], [170, 190]], 14, "#e8dcc0");
  p.ell(200, 200, 180, 180, null, 30); p.ell(200, 200, 180, 180, null, 0); p.band([[72, 328], [328, 72]], "#d02a2e", 34, 0, "butt");
  const g = p.g; g.strokeStyle = "#d02a2e"; g.lineWidth = 34; g.beginPath(); g.arc(200, 200, 170, 0, Math.PI * 2); g.stroke();
};
const fxOrder = (p: Pen) => {
  paper(p, "#f6efd8");
  txt(p, "BY ORDER OF", 260, 90, 44, "#2a2010", "700", "center", SERIF);
  txt(p, "THE COUNCIL", 260, 150, 56, "#8a1e2a", "900", "center", SERIF);
  txt(p, "NO MUSIC", 260, 290, 64, "#2a2010", "900", "center", SERIF);
  txt(p, "NO DANCING", 260, 380, 64, "#2a2010", "900", "center", SERIF);
  txt(p, "NO DRUMS", 260, 470, 64, "#d02a2e", "900", "center", SERIF);
  p.ell(400, 570, 50, 50, "#8a1e2a", 8);
};
const fxRx = (p: Pen) => {
  paper(p, "#fbf6e6");
  txt(p, "DOCTOR'S ORDERS", 260, 100, 46, "#2a2010", "900", "center", SERIF);
  txt(p, "Diagnosis:", 260, 210, 40, "#5a4a30", "700", "center", SERIF);
  txt(p, "HOT BLOOD", 260, 280, 66, "#d02a2e", "900", "center", SERIF);
  txt(p, "Treatment:", 260, 390, 40, "#5a4a30", "700", "center", SERIF);
  txt(p, "MORE DANCING", 260, 470, 60, "#2f5aa8", "900", "center", SERIF);
};
const fxCoin = (p: Pen) => { p.ell(150, 150, 120, 120, "#e8be3a", 10); p.ell(150, 150, 88, 88, "#f6d870", 6); txt(p, "$", 150, 172, 120, "#a8782a", "900", "center", SERIF); };
const fxDrop = (k: number) => (p: Pen) => {
  p.poly([[200, 40], [290, 220], [290, 290], [200, 360], [110, 290], [110, 220]], "#d02a2e", 10); p.ell(160, 250, 20, 34, "#ff8a7a", 0);
  for (const [x, a] of [[110, 0], [290, 0.4]] as [number, number][]) { const w = 14 * Math.sin(6.28 * (k + a)); p.poly([[x - 50, 140], [x - 30, 60 + w], [x - 10, 110], [x + 10, 30 - w], [x + 30, 120], [x + 50, 140]], "#f6b23a", 6); }
};

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;  // animate on twos
const dancePh = (t: number, i: number, rate = 1.5) => q(((TQ(t) * rate + hh(i, 9)) % 1 + 1) % 1, 12);
const TRO = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 1, TROFFEA, "tro", x, z, fo, scale, y);
const HUS = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 2, HUSBAND, "hus", x, z, fo);
const DOC = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 3, DOCTOR, "doc", x, z, fo);
const cnc = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act) => pose(c, 10 + k, COUNCILLOR(k), `cn${k}`, x, z, fo);
const pip = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, y = 0) => pose(c, 20 + k, PIPER(k), `pp${k % 2}`, x, z, fo, 1, y);
const towner = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 100 + k, TOWN(k), `tw${k % 8}`, x, z, fo, scale, y);
const EXPR: FrontOpts["expr"][] = ["dazed", "laugh", "pained", "sing", "grin", "nervous", "dazed", "shock"];
/** a crowd of dancers on a jittered grid centred on (cx, cz) */
const crowd = (c: Ctx, n: number, cx: number, cz: number, wx: number, wz: number, seed = 0, exprs = EXPR, rate = 1.5) => {
  const cols = Math.max(1, Math.round(Math.sqrt(n * wx / Math.max(0.1, wz))));
  for (let k = 0; k < n; k++) {
    const i = (k % cols) + 0.5, j = Math.floor(k / cols) + 0.5, rows = Math.ceil(n / cols);
    const x = cx - wx / 2 + (i / cols) * wx + 0.5 * (hh(k + seed, 1) - 0.5) * wx / cols, z = cz - wz / 2 + (j / rows) * wz + 0.5 * (hh(k + seed, 2) - 0.5) * wz / rows;
    const id = k + seed;
    towner(c, id, x, z, { mode: "dance", phase: dancePh(c.t, id, rate * (0.85 + 0.3 * hh(id, 4))), expr: exprs[id % exprs.length], look: hh(id, 3) * 2 - 1, lift: 50 + 30 * hh(id, 5) });
  }
};
const fallen = (c: Ctx, n: number, cx: number, cz: number, wx: number, seed = 0) => {
  for (let k = 0; k < n; k++) towner(c, k + seed, cx - wx / 2 + (k + 0.5) * wx / n, cz + 0.8 * (hh(k + seed, 6) - 0.5), { mode: "stand", expr: "dazed", look: 0, blink: true, lean: (k % 2 ? 1 : -1) * 1.48 }, 1, 0.05);
};
const notes = (c: Ctx, p: V3, w: number, seed: number) => { const k = q(((c.t * 0.8 + hh(seed, 2)) % 1), 8); card(c, `note${k}`, 400, 300, fxNotes(k), [p[0], p[1] + 0.3 * k, p[2]], w, 0.75 * w); };
const band = (c: Ctx, playing = true) => {
  const { x, z, h } = STG;
  [-1.6, 0, 1.6].forEach((dx, k) => pip(c, k, x + dx, z - 0.6 - 0.3 * (k % 2), { mode: "stand", expr: playing ? "whistle" : "nervous", look: 0, prop: playing ? "pipes" : null, dy: playing ? 0.04 * Math.abs(Math.sin(TQ(c.t) * 6 + k)) : 0 }, h));
  if (playing) { notes(c, [x - 1.8, h + 2.6, z - 0.2], 1.1, 1); notes(c, [x + 1.4, h + 2.9, z - 0.4], 1.0, 2); }
};

// ---------------- staging ----------------
const MID: V3 = [0, 0, 0];
export const STAGE: Record<number, StageFn> = {
  // 1 In 1518, an entire city caught a disease... that made people dance.   (hook; the outro returns to this exact frame)
  1: (c) => {
    const t = c.t;
    crowd(c, 28, 0, -1.5, 14, 8, 0);
    band(c, true);
    if (after(t, A(0, "1518"))) stay(c, A(0, "1518"), "cal1518", 300, 340, (p) => fxCal(p, "1518", true), [-4.6, 8.4, -8], 2.6, 2.9, 0.05);
    if (after(t, A(0, "dance."))) banner(c, A(0, "dance."), "THE DANCING PLAGUE", [1.0, 9.6, -8], 8, "#c62a2e", 2.0);
  },
  // 2 And the doctors' cure?
  2: (c) => {
    const t = c.t;
    DOC(c, 0.4, -0.6, { mode: "stand", expr: "smug", look: 0.3, prop: "book" });
    cnc(c, 0, -1.4, -3.2, { mode: "stand", expr: "nervous", look: 0.6 });
    if (after(t, A(0, "cure?"))) sayB(c, A(0, "cure?"), "HMM...", [0.35, 2.75, -0.4], 0.75, 1.2);
  },
  // 3 More dancing.
  3: (c) => {
    const t = c.t;
    crowd(c, 22, 0, -2.0, 11, 7, 30, ["laugh", "dazed", "sing", "grin"], 2.0);
    band(c, true);
    if (after(t, A(0, "more"))) word(c, A(0, "more"), "MORE DANCING!", [0, 5.4, -6], 5.5, 1.4, "#fff3b0");
  },
  // 4 It's July, in the city of Strasbourg.
  4: (c) => {
    const t = c.t;
    for (let k = 0; k < 4; k++) towner(c, 60 + k, (k % 2 ? 1.6 : -1.4), -8 - 4 * k, { mode: "stroll", phase: (TQ(t) * 0.9 + 0.3 * k) % 1, expr: "neutral", look: k % 2 ? -0.6 : 0.6 });
    if (after(t, A(1, "july,"))) stay(c, A(1, "july,"), "calJuly", 300, 340, (p) => fxCal(p, "JULY", true), [-1.6, 6.6, -10], 2.2, 2.5, 0.05);
    if (after(t, A(1, "strasbourg."))) banner(c, A(1, "strasbourg."), "STRASBOURG", [1.2, 9.4, -14], 6.5, "#2f5aa8", 2.0);
  },
  // 5 A woman named Frau Troffea steps into the street... and starts dancing.
  5: (c) => {
    const t = c.t, st = A(1, "steps"), da = A(1, "dancing.");
    const walk = smooth((t - st + 0.1) / 0.8), x = -2.7 + 1.4 * walk;
    const dancing = after(t, da);
    TRO(c, x, -2.4, dancing ? { mode: "dance", phase: dancePh(t, 1, 1.4), expr: "dazed", look: 0.2 } : { mode: walk > 0.02 && walk < 0.98 ? "stroll" : "stand", phase: (TQ(t) * 1.4) % 1, expr: "neutral", look: 0.5 });
    if (after(t, A(1, "troffea"))) banner(c, A(1, "troffea"), "FRAU TROFFEA", [-1.3, 3.3, -3.0], 2.0, "#2f6a8a", 1.8);
    towner(c, 70, 1.8, -5.0, { mode: "stand", expr: dancing ? "shock" : "neutral", look: -0.7 });
  },
  // 6 No music. No reason. She just... doesn't stop.
  6: (c) => {
    const t = c.t;
    TRO(c, -1.2, -2.4, { mode: "dance", phase: dancePh(t, 1, 1.6), expr: "dazed", look: 0.1 });
    if (after(t, A(1, "music."))) word(c, A(1, "music."), "NO MUSIC", [-1.9, 3.0, -2.6], 1.2, 1.0, "#ffd0c0");
    if (after(t, A(1, "reason."))) word(c, A(1, "reason."), "NO REASON", [-0.6, 3.35, -2.6], 1.2, 1.0, "#ffd0c0");
    if (after(t, A(1, "stop."))) word(c, A(1, "stop."), "...DOESN'T STOP", [-1.1, 3.0, -2.4], 1.7, 1.2, "#fff3b0");
  },
  // 7 Her husband begs her to stop. She dances all night.   (night)
  7: (c) => {
    const t = c.t, ni = A(2, "night.");
    TRO(c, -1.2, -2.6, { mode: "dance", phase: dancePh(t, 1, 1.3), expr: "dazed", look: 0 });
    HUS(c, 0.6, -2.0, { mode: "stand", expr: after(t, A(2, "she")) ? "shock" : "pained", look: -0.8, prop: after(t, A(2, "begs")) ? "handsUp" : null, lean: -0.08 });
    if (after(t, A(2, "begs"))) sayB(c, A(2, "begs"), "PLEASE STOP!", [0.55, 2.8, -1.8], 0.9, 1.5);
    if (after(t, ni)) stay(c, ni, "moon", 600, 300, (p) => fxWord(p, "ALL NIGHT", "#d8e4ff"), [-0.6, 3.4, -3.4], 1.6, 0.8, 0.04);
  },
  // 8 Collapses. Wakes up. And dances again. For days.
  8: (c) => {
    const t = c.t, co = A(2, "collapses."), wk = A(2, "wakes"), ag = A(2, "dances", 1), dy = A(2, "days.");
    const down = after(t, co) && !after(t, wk);
    const up = after(t, wk) && !after(t, ag);
    TRO(c, -0.6, -2.4, down ? { mode: "fall", expr: "dazed", look: 0 } : up ? { mode: "stand", expr: "dazed", look: 0.2, dy: hop(t, wk, 0.06, 0.25) } : { mode: "dance", phase: dancePh(t, 1, 1.5), expr: after(t, ag) ? "dazed" : "pained", look: 0 });
    if (down) puff(c, co, [-0.6, 0.4, -2.2], 1.0, 0.45);
    if (after(t, ag)) { const n = Math.min(4, 1 + Math.floor((t - ag) * 2.2)); card(c, `day${n}`, 400, 220, (p) => fxScore(p, `DAY ${n}`), [-1.0, 2.9, -2.6], 1.0, 0.55); }
    if (after(t, dy)) word(c, dy, "FOR DAYS", [0.0, 3.4, -2.8], 1.4, 1.1, "#fff3b0");
  },
  // 9 Within a week, more than thirty people have joined her.
  9: (c) => {
    const t = c.t, jn = A(3, "joined");
    TRO(c, -0.4, -2.6, { mode: "dance", phase: dancePh(t, 1, 1.5), expr: "dazed", look: 0 });
    crowd(c, after(t, A(3, "30")) ? 18 : 6, 0, -9, 5.6, 11, 40);
    if (after(t, A(3, "30"))) banner(c, A(3, "30"), "30+ DANCERS", [0, 4.3, -6], 3.6, "#c62a2e", 2.0);
    if (after(t, jn)) word(c, jn, "JOINED!", [1.6, 3.0, -3.4], 1.3, 0.9, "#fff3b0");
  },
  // 10 By the end of the month? Around four hundred.
  10: (c) => {
    const t = c.t, fh = A(3, "400.");
    crowd(c, after(t, fh) ? 64 : 34, 0, -1, 16, after(t, fh) ? 13 : 8, 50);
    if (after(t, fh)) banner(c, fh, "~400 DANCING", [0, 6.2, -8], 7, "#c62a2e", 2.2);
    if (after(t, A(3, "month?"))) stay(c, A(3, "month?"), "calAug", 300, 340, (p) => fxCal(p, "AUG", true), [-4.5, 5.0, -8], 1.8, 2.0, 0.05);
  },
  // 11 The city council calls in the doctors. Their diagnosis?
  11: (c) => {
    const t = c.t, dr = A(4, "doctors.");
    [-1.8, -0.6, 0.6, 1.8].forEach((x, k) => cnc(c, k, x, -3.2, { mode: "stand", expr: k % 2 ? "nervous" : "stern", look: x > 0 ? -0.4 : 0.4 }));
    if (after(t, dr)) DOC(c, 1.9 - 1.0 * smooth((t - dr + 0.1) / 0.6), -1.0, { mode: "stand", expr: "smug", look: -0.6, prop: "book" });
    if (after(t, A(4, "council"))) banner(c, A(4, "council"), "CITY COUNCIL", [-1.0, 2.35, -4.4], 1.6, "#8a1e2a", 1.6);
    if (after(t, A(4, "diagnosis?"))) sayB(c, A(4, "diagnosis?"), "WELL?", [-0.85, 2.45, -2.6], 0.7, 1.2);
  },
  // 12 Hot blood.
  12: (c) => {
    const t = c.t, hb = A(4, "hot");
    DOC(c, 0, -0.6, { mode: "stand", expr: "smug", look: 0.2, prop: "point", lean: jolt(t, hb, 0.05) });
    if (after(t, hb)) { const k = q((t * 1.6) % 1, 6); const s = pop(t, hb); card(c, `drop${k}`, 400, 400, fxDrop(k), [-0.9, 2.3, -0.4], 0.8 * s, 0.8 * s); }
    if (after(t, hb)) word(c, hb, "HOT BLOOD", [0.3, 3.0, -0.6], 1.5, 1.2, "#ffd0c0");
  },
  // 13 The treatment? Dance it out.
  13: (c) => {
    const t = c.t, di = A(4, "dance");
    DOC(c, 0.3, -0.6, after(t, di) ? { mode: "dance", phase: dancePh(t, 3, 1.2), expr: "grin", look: 0 } : { mode: "stand", expr: "smug", look: 0.3, prop: "book" });
    [-1.6, -0.5].forEach((x, k) => cnc(c, k, x, -3.3, { mode: "stand", expr: after(t, di) ? "shock" : "neutral", look: 0.6 }));
    if (after(t, di)) stay(c, di, "rx", 520, 640, fxRx, [-0.85, 1.95, -0.3], 0.6, 0.74, -0.05);
  },
  // 14 So the city does the logical thing. They clear the markets, build a stage...
  14: (c) => {
    const t = c.t, bd = A(5, "build");
    for (let k = 0; k < 5; k++) towner(c, 80 + k, -3.6 + 1.8 * k, -7.2 + 0.3 * (k % 2), { mode: "stand", expr: after(t, bd) ? "grin" : "neutral", look: 0, prop: k % 2 ? "crate" : ["hammer", (TQ(t) * 3 + 0.3 * k) % 1] });
    if (after(t, A(5, "logical"))) word(c, A(5, "logical"), "LOGICAL?", [-1.3, 4.0, -6], 2.4, 1.2, "#fff3b0");
    if (after(t, bd)) puff(c, bd + 0.4, [0, 1.0, -8], 3.5, 0.5);
  },
  // 15 and hire a band.
  15: (c) => {
    const t = c.t, hb = A(5, "band.");
    band(c, after(t, hb));
    if (after(t, hb)) banner(c, hb, "HIRED BAND", [0, 4.55, -10.6], 3.0, "#e07a1a", 1.6);
  },
  // 16 They even pay healthy dancers to keep everyone going.
  16: (c) => {
    const t = c.t, py = A(5, "pay");
    band(c, true);
    [-2.2, 2.2].forEach((dx, k) => towner(c, 90 + k, dx, -7.4, { mode: "dance", phase: dancePh(t, 90 + k, 2.0), expr: "grin", look: 0 }, 1, STG.h));
    crowd(c, 16, 0, -2.5, 10, 5, 110, ["dazed", "pained", "dazed", "laugh"], 1.3);
    if (after(t, py)) { stay(c, py, "coinA", 300, 300, fxCoin, [-2.2, 4.1, -7.2], 0.6, 0.6, 0.1); stay(c, py + 0.15, "coinB", 300, 300, fxCoin, [2.2, 4.1, -7.2], 0.6, 0.6, -0.1); }
    if (after(t, A(5, "healthy"))) banner(c, A(5, "healthy"), "PAID DANCERS", [0, 5.6, -9], 3.6, "#2f8a4a", 1.8);
  },
  // 17 It did not go well.
  17: (c) => {
    const t = c.t;
    band(c, true);
    crowd(c, 40, 0, -1.5, 18, 10, 130, ["pained", "dazed", "shock", "nervous"], 1.8);
    if (after(t, A(6, "well."))) word(c, A(6, "well."), "IT DID NOT GO WELL", [0, 7.0, -6], 6.5, 1.3, "#ffd0c0");
  },
  // 18 More people joined. Some danced until they collapsed... and some reports say people died.   (played straight)
  18: (c) => {
    const t = c.t;
    crowd(c, 14, 0, -7.5, 12, 4, 160, ["pained", "dazed"], 1.0);
    fallen(c, after(t, A(6, "collapsed...")) ? 5 : 0, 0, -3.6, 8, 170);
    if (after(t, A(6, "died."))) banner(c, A(6, "died."), "SOME REPORTS: DEATHS", [-0.9, 4.6, -6], 4.2, "#2a2a30", 2.6);
  },
  // 19 So the council panics and does a full U-turn.
  19: (c) => {
    const t = c.t, pn = A(7, "panics"), ut = A(7, "u-turn.");
    [-1.8, -0.6, 0.6, 1.8].forEach((x, k) => cnc(c, k, x, -3.2, { mode: "stand", expr: after(t, pn) ? "shock" : "stern", look: x > 0 ? -0.5 : 0.5, prop: after(t, pn) && k % 2 ? "handsUp" : null, dy: hop(t, pn + 0.05 * k, 0.08, 0.25) }));
    if (after(t, ut)) stay(c, ut, "uturn", 400, 400, fxUturn, [0, 2.8, -2.4], 0.7, 0.7, 0.06);
  },
  // 20 The stage is torn down. Music is banned.
  20: (c) => {
    const t = c.t, tr = A(7, "torn"), bn = A(7, "banned.");
    if (!after(t, tr)) band(c, false);
    for (let k = 0; k < 3; k++) pip(c, k, -1.8 + 0.9 * k, -4.6, { mode: after(t, tr + 0.3) ? "march" : "stand", phase: (TQ(t) * 1.6 + 0.3 * k) % 1, expr: "sad", look: -1 });
    if (after(t, tr)) puff(c, tr + 0.2, [0, 0.8, -9], 4, 0.6);
    if (after(t, bn)) stay(c, bn, "order", 520, 640, fxOrder, [2.6, 2.4, -5], 2.0, 2.45, -0.04);
  },
  // 21 No drums. Not even at weddings.
  21: (c) => {
    const t = c.t, wd = A(7, "weddings.");
    pose(c, 30, BRIDE, "bride", -1.2, -2.8, { mode: "stand", expr: after(t, wd) ? "sad" : "smile", look: 0.4 });
    pose(c, 31, GROOM, "groom", -0.2, -2.9, { mode: "stand", expr: after(t, wd) ? "sad" : "smile", look: -0.3 });
    pose(c, 32, PRIEST, "priest", 1.0, -3.6, { mode: "stand", expr: "stern", look: -0.5, prop: "book" });
    if (after(t, A(7, "drums."))) stay(c, A(7, "drums."), "ban", 400, 400, fxBan, [0.35, 2.75, -2.4], 0.7, 0.7, 0.05);
    if (after(t, wd)) word(c, wd, "NOT EVEN AT WEDDINGS", [-0.6, 3.25, -3.0], 2.0, 1.4, "#fff3b0");
  },
  // 22 The worst dancers are loaded onto wagons, taken to a shrine of Saint Vitus, and given little red shoes.
  22: (c) => {
    const t = c.t, vi = A(8, "vitus,"), sh = A(8, "shoes.");
    [0, 1, 2].forEach((k) => towner(c, 190 + k, 2.6 + 0.7 * k, -3.2 - 0.4 * k, { mode: "dance", phase: dancePh(t, 190 + k, 0.8), expr: "dazed", look: -0.5, lift: 30 }));
    pose(c, 33, PRIEST, "priest", -2.0, -7.4, { mode: "stand", expr: "smile", look: 0.6, prop: after(t, sh) ? "handsUp" : "book" });
    if (after(t, vi)) banner(c, vi, "SHRINE OF ST. VITUS", [-3, 7.2, -8.3], 4.2, "#5a3a6a", 2.2);
    if (after(t, sh)) stay(c, sh, "shoes", 480, 380, fxShoes, [3.2, 2.75, -3.2], 0.9, 0.72, 0.05);
  },
  // 23 And slowly, finally, the dancing stopped.
  23: (c) => {
    const t = c.t, sp = A(8, "stopped.");
    [0, 1, 2].forEach((k) => towner(c, 190 + k, 2.6 + 0.7 * k, -3.2 - 0.4 * k, after(t, sp) ? { mode: "stand", expr: "relief", look: -0.3 } : { mode: "dance", phase: dancePh(t, 190 + k, 0.5), expr: "dazed", look: -0.5, lift: 20 }));
    if (after(t, sp)) word(c, sp, "STOPPED.", [3.2, 3.2, -3.6], 1.6, 1.4, "#c8f0c0");
  },
  // 24 To this day, nobody knows exactly why it happened.   (golden: the empty lane)
  24: (c) => {
    const t = c.t;
    if (after(t, A(9, "why"))) stay(c, A(9, "why"), "q", 600, 300, (p) => fxWord(p, "WHY?", "#fff3b0"), [0, 4.2, -8], 2.6, 1.3, 0.04);
  },
  // 25 Mass panic? Poisoned bread? A curse?
  25: (c) => {
    const t = c.t;
    if (after(t, A(9, "mass"))) banner(c, A(9, "mass"), "MASS PANIC?", [-0.5, 4.6, -6], 2.8, "#2f5aa8", 3.2);
    if (after(t, A(9, "poisoned"))) stay(c, A(9, "poisoned"), "bread", 480, 320, fxBread, [0.75, 3.0, -5], 1.4, 0.94, -0.05);
    if (after(t, A(9, "curse?"))) word(c, A(9, "curse?"), "A CURSE?", [-0.7, 2.55, -4], 1.5, 1.4, "#e0c8ff");
  },
  // 26 We still don't know.
  26: (c) => {
    const t = c.t;
  },
  // 27 Send this to the friend who never leaves the dance floor. Historically, that's a warning sign.   (ends on shot 1)
  27: (c) => {
    const t = c.t;
    crowd(c, 28, 0, -1.5, 14, 8, 0);
    band(c, true);
    if (after(t, A(10, "send"))) banner(c, A(10, "send"), "SEND THIS TO THAT FRIEND", [1.0, 9.6, -8], 8, "#e07a1a", 2.0);
    if (after(t, A(10, "warning"))) word(c, A(10, "warning"), "WARNING SIGN", [-3.6, 7.6, -6], 4.0, 1.6, "#ffd0c0");
  },
};
void MID; void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void clamp01; void lineStart; void atN; void card;
