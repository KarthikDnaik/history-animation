// Places and cast of "The Baker Who Survived the Titanic" (Charles Joughin, April 1912; 9:16 short).
// Direction sheet: night-blue North Atlantic + warm lamp-lit interiors; the baker's white jacket and toque are the
// accent that always reads against the dark. Key moments: the calm drink in the panic, the deck-chair throws, the stern
// "elevator" ride (water rising to him), swollen feet, the movie cameo. Avoid: faces filling frame, bodies/deaths shown,
// background voices, film likenesses (no actors / no movie characters: only a generic clapperboard).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane } from "./props3d";
import { Kit, quad, tri } from "./build";
import { rep, ctex, planksHD, water } from "./paint";
import { wbox, panelHD, chandelier2, painting, rug, bookcase, chair, table2, lifeboat, lifeRing } from "./decor";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, fxScore, rrect, txt } from "./toon";
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
const tileHD = (key: string, base: string, grout: string) => ctex("tile" + key, 512, 512, (g, r) => {
  g.fillStyle = grout; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) {
    g.fillStyle = base; g.fillRect(x + 3, y + 3, 58, 58);
    g.fillStyle = `rgba(255,255,255,${0.08 + 0.1 * r()})`; g.fillRect(x + 6, y + 6, 22, 8);
    g.fillStyle = `rgba(60,60,70,${0.04 + 0.06 * r()})`; g.fillRect(x + 3, y + 46, 58, 15);
  }
});
const steelHD = (key: string, base: string) => ctex("steel" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, y, 512, 4); for (let x = 16; x < 512; x += 32) { g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.arc(x, y + 12, 3, 0, 6.3); g.fill(); } }
  for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,0,0"},0.05)`; g.fillRect(512 * r(), 512 * r(), 40 + 80 * r(), 6 + 20 * r()); }
});
const ice = () => lam("ice", () => ({ color: "#e8f4ff" }));
const iceS = () => lam("iceS", () => ({ color: "#b8d8f0" }));
const OCEAN = (key: string, col: string) => lam("ocean" + key, () => ({ map: rep(water(), 70, 70), color: col }));

// ---------------- props ----------------
/** wooden steamer deck chair (reclined back), facing ry */
const deckChair = (b: Batch, x: number, z: number, ry: number, y = 0, s = 1) => {
  const m = M4(x, y, z, ry, s), W = lam("dchW", () => ({ color: "#a8784a" })), Cu = lam("dchC", () => ({ color: "#3a5a8a" }));
  b.add(boxGeo(V(-0.32, 0.28, -0.6), V(0.32, 0.34, 0.5)), W, m);
  b.add(new THREE.BoxGeometry(0.64, 0.06, 0.8).rotateX(-1.0).translate(0, 0.62, -0.78), W, m);
  b.add(boxGeo(V(-0.28, 0.35, -0.5), V(0.28, 0.38, 0.45)), Cu, m);
  for (const sx of [-1, 1]) for (const zz of [-0.5, 0.42]) b.add(boxGeo(V(sx * 0.3 - 0.03, 0, zz - 0.03), V(sx * 0.3 + 0.03, 0.3, zz + 0.03)), W, m);
};
const railing = (b: Batch, x0: number, x1: number, z: number, h = 1.1, y = 0) => {
  const W = lam("railW", () => ({ color: "#d8c09a" })), Ir = lam("railI", () => ({ color: "#f2efe8" }));
  b.add(boxGeo(V(x0, y + h - 0.06, z - 0.07), V(x1, y + h + 0.04, z + 0.07)), W);
  for (const yy of [0.35, 0.7]) b.add(boxGeo(V(x0, y + yy - 0.02, z - 0.02), V(x1, y + yy + 0.02, z + 0.02)), Ir);
  for (let x = x0; x <= x1 + 1e-6; x += 1.2) b.add(boxGeo(V(x - 0.035, y, z - 0.035), V(x + 0.035, y + h, z + 0.035)), Ir);
};
const lamp = (b: Batch, x: number, y: number, z: number) => {
  b.add(new THREE.SphereGeometry(0.13, 10, 8).translate(x, y, z), lam("lampG", () => ({ color: "#fff2c8", emissive: "#ffcf70", emissiveIntensity: 2.2 })));
  b.add(boxGeo(V(x - 0.04, y + 0.1, z - 0.04), V(x + 0.04, y + 0.3, z + 0.04)), C("#c8a050"));
};
/** a four-funnel liner (or one-funnel Carpathia) seen from the side, bow toward +x; lit windows at night */
const liner = (b: Batch, x: number, z: number, L: number, funnels: number, fcol: string, y = 0, lit = true) => {
  const Hh = L * 0.11, Hk = lam("hullK", () => ({ color: "#14141a" })), Hw = lam("hullW", () => ({ color: "#f2efe6" })), Rd = lam("hullR", () => ({ color: "#8a2a24" }));
  const hullShape = (x0: number, x1: number, y0: number, y1: number, zz: number, mat: THREE.Material) => {
    const s = new THREE.Shape(); s.moveTo(x0 + L * 0.03, y0); s.lineTo(x1 - L * 0.05, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.lineTo(x0 + L * 0.03, y0);
    b.add(new THREE.ExtrudeGeometry(s, { depth: zz, bevelEnabled: false }).translate(0, 0, -zz / 2).translate(x, y, z), mat);
  };
  hullShape(-L / 2, L / 2, -Hh * 0.3, 0.05, L * 0.1, Rd);
  hullShape(-L / 2, L / 2, 0, Hh, L * 0.105, Hk);
  b.add(boxGeo(V(x - L * 0.42, y + Hh, z - L * 0.045), V(x + L * 0.38, y + Hh * 1.45, z + L * 0.045)), Hw);
  b.add(boxGeo(V(x - L * 0.3, y + Hh * 1.45, z - L * 0.035), V(x + L * 0.3, y + Hh * 1.75, z + L * 0.035)), Hw);
  const Fm = lam("funnel" + fcol, () => ({ color: fcol })), Ft = lam("funnelT", () => ({ color: "#141418" }));
  for (let k = 0; k < funnels; k++) {
    const fx = x + (funnels === 1 ? 0 : -L * 0.24 + (k * L * 0.48) / (funnels - 1));
    b.add(new THREE.CylinderGeometry(L * 0.022, L * 0.025, Hh * 1.3, 14).rotateZ(0.1).translate(fx, y + Hh * 2.35, z), Fm);
    b.add(new THREE.CylinderGeometry(L * 0.0225, L * 0.0225, Hh * 0.3, 14).rotateZ(0.1).translate(fx - Hh * 0.06, y + Hh * 2.95, z), Ft);
  }
  for (const mx of [-L * 0.4, L * 0.36]) b.add(new THREE.CylinderGeometry(L * 0.004, L * 0.005, Hh * 2.6, 6).translate(x + mx, y + Hh * 2.3, z), Ft);
  if (lit) {
    const Wn = lam("winLit", () => ({ color: "#ffe2a0", emissive: "#ffc860", emissiveIntensity: 2.4 }));
    for (let row = 0; row < 3; row++) for (let k = 0; k < 46; k++) {
      if (hh(k * 7 + row, 3) < 0.25) continue;
      const wx = x - L * 0.42 + (k / 46) * L * 0.82, wy = y + Hh * (0.55 + row * 0.33);
      b.add(boxGeo(V(wx - L * 0.004, wy - L * 0.003, z + L * 0.0525), V(wx + L * 0.004, wy + L * 0.003, z + L * 0.054)), Wn);
    }
  }
};
const iceberg = (b: Batch, x: number, z: number, s: number) => {
  for (let k = 0; k < 7; k++) {
    const r = s * (0.5 + 0.5 * hh(k, 2)), g = new THREE.IcosahedronGeometry(r, 0).scale(1.2, 1.4 + hh(k, 4), 1).translate(x + s * 1.4 * (hh(k, 5) - 0.5), r * 0.5, z + s * (hh(k, 6) - 0.5));
    b.add(g, k % 2 ? ice() : iceS());
  }
};
const stars = (s: SetBuild, n = 900) => {
  const pos: number[] = [];
  for (let i = 0; i < n; i++) { const a = hh(i, 11) * Math.PI * 2, e = 0.08 + 1.3 * hh(i, 12) ** 1.6, R = 1200; pos.push(R * Math.cos(e) * Math.cos(a), R * Math.sin(e), R * Math.cos(e) * Math.sin(a)); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
  pts.frustumCulled = false; s.root.add(pts); s.dyn.stars = pts;
};
/** the ocean surface as its own mesh so POSE can move it (stern sinks = water rises) */
const sea = (s: SetBuild, key: string, col: string, y: number, R = 600) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R).rotateX(-Math.PI / 2), OCEAN(key, col));
  (m.geometry.attributes.uv as THREE.BufferAttribute).array.forEach((_, i, a) => { (a as Float32Array)[i] *= 1; });
  m.position.y = y; m.receiveShadow = true; s.root.add(m); s.dyn.sea = m; return m;
};

// ---------------- builders ----------------
// DECK (boat deck, night): deckhouse wall along z = -4.5 (front +z, lit windows) for x -18..16, four funnels behind it;
// open promenade x 19..34 with the outboard rail at z = -4.2 and the sea 20 m below; lifeboats on davits over that rail.
const deck = (s: SetBuild) => {
  const { b } = s;
  sea(s, "deck", "#3a5a80", -20);
  stars(s);
  b.add(plane(-20, 36, -4.4, 9, 1, 0), lam("deckP", () => ({ map: rep(planksHD(), 9, 3), color: "#d8c0a0" })));
  const Wh = lam("houseW", () => ({ color: "#f0ece2" })), Tr = lam("houseT", () => ({ color: "#c8b088" }));
  b.add(boxGeo(V(-20, 0, -7.5), V(16, 3.3, -4.5)), Wh);
  b.add(boxGeo(V(-20.2, 3.3, -7.7), V(16.2, 3.45, -4.3)), Tr);
  const Wn = lam("winLit", () => ({ color: "#ffe2a0", emissive: "#ffc860", emissiveIntensity: 2.4 })), Fr = C("#7a5a3a");
  for (let x = -18; x <= 14; x += 2.6) {
    if (Math.abs(x - 0.2) < 1.2) { // a door behind the hook spot
      b.add(boxGeo(V(x - 0.55, 0, -4.52), V(x + 0.55, 2.3, -4.44)), C("#6a4428")); b.add(boxGeo(V(x - 0.4, 1.4, -4.43), V(x + 0.4, 2.05, -4.41)), Wn); continue;
    }
    b.add(boxGeo(V(x - 0.62, 1.05, -4.52), V(x + 0.62, 2.35, -4.42)), Fr); b.add(boxGeo(V(x - 0.52, 1.13, -4.44), V(x + 0.52, 2.27, -4.4)), Wn);
    lamp(b, x + 1.3, 2.75, -4.35);
  }
  const Fn = lam("funnelB", () => ({ color: "#c8913a" })), Fk = lam("funnelK", () => ({ color: "#18181c" }));
  for (const x of [-15, -6, 3, 12]) {
    b.add(new THREE.CylinderGeometry(1.7, 1.8, 11, 20).scale(1.25, 1, 1).rotateZ(0.08).translate(x, 3.3 + 5.5, -12), Fn);
    b.add(new THREE.CylinderGeometry(1.72, 1.72, 2.2, 20).scale(1.25, 1, 1).rotateZ(0.08).translate(x - 0.65, 3.3 + 10.2, -12), Fk);
  }
  for (const x of [-11, -3]) b.add(new THREE.CylinderGeometry(0.3, 0.42, 2.4, 10).translate(x, 3.45 + 1.2, -6.5), C("#f0ece2")); // vents
  for (const x of [-11, -3]) b.add(new THREE.TorusGeometry(0.42, 0.14, 8, 14, Math.PI).translate(x, 3.45 + 2.4, -6.4), C("#f0ece2"));
  // benches + deck chairs along the house
  for (const x of [-15, -8.5, 7.5, 13]) deckChair(b, x, -3.2, 0.15 * (x > 0 ? 1 : -1));
  for (const x of [-12, 10]) { b.add(boxGeo(V(x - 0.9, 0.42, -4.1), V(x + 0.9, 0.5, -3.6)), C("#8a5a34")); for (const sx of [-0.8, 0.8]) b.add(boxGeo(V(x + sx - 0.05, 0, -4.05), V(x + sx + 0.05, 0.42, -3.65)), C("#3a3a3e")); }
  // promenade: rail, lifeboats on davits, stacked chairs, life rings
  railing(b, 18, 36, -4.2);
  for (const x of [21.5, 32.5]) {
    lifeboat(b, x, 2.4, -5.1, 6);
    for (const sx of [-1, 1]) { b.add(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8).translate(x + sx * 2.4, 1.6, -3.9), C("#f2efe8")); b.add(new THREE.TorusGeometry(0.6, 0.06, 6, 12, Math.PI / 2).rotateY(Math.PI / 2).translate(x + sx * 2.4, 2.6, -4.5), C("#f2efe8")); }
  }
  for (const x of [26, 28.5]) lifeRing(b, x, 0.7, -4.05);
  for (let k = 0; k < 4; k++) deckChair(b, 23.2, -1.6 + 0.0 * k, 0, 0.32 * k, 1); // a stack of folded chairs
  b.add(boxGeo(V(18, 0, -7.5), V(18.6, 3.3, 9)), Wh); // end of the house
};
// GALLEY (bakery, warm interior): white tiles, iron ovens with glowing doors, racks of bread, a long dough table
const galley = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-7, 7, -3.6, 9, 1, 0), lam("galFloor", () => ({ map: rep(tileHD("gf", "#c8a888", "#8a6a50"), 8, 6) })));
  const Tw = lam("galWall", () => ({ map: rep(tileHD("gw", "#f4f2ea", "#c8c4b8"), 1, 1) }));
  wbox(b, Tw, -7, 0, -3.9, 7, 3.6, -3.6, 1.5, 1.5);
  for (const sx of [-1, 1]) wbox(b, Tw, sx > 0 ? 7 : -7.3, 0, -3.9, sx > 0 ? 7.3 : -7, 3.6, 9, 1.5, 1.5);
  b.add(plane(-7.3, 7.3, -3.9, 12, 1, 3.6), lam("galCeil", () => ({ color: "#e8e4da", side: THREE.DoubleSide })));
  for (const z of [-1.5, 1.5, 4.5]) b.add(boxGeo(V(-7, 3.4, z - 0.12), V(7, 3.6, z + 0.12)), C("#d8d2c4"));
  const Ir = lam("ovenI", () => ({ map: steelHD("ov", "#3a3a40") })), Gl = lam("ovenGlow", () => ({ color: "#ffb860", emissive: "#ff8a30", emissiveIntensity: 2.6 }));
  for (const x of [-4.6, -1.6, 1.6, 4.6]) {
    b.add(boxGeo(V(x - 1.25, 0, -3.6), V(x + 1.25, 2.2, -2.6)), Ir);
    b.add(boxGeo(V(x - 0.85, 0.75, -2.6), V(x + 0.85, 1.55, -2.55)), C("#1e1e22"));
    b.add(boxGeo(V(x - 0.7, 0.85, -2.56), V(x + 0.7, 1.45, -2.53)), Gl);
    b.add(boxGeo(V(x - 0.6, 1.62, -2.58), V(x + 0.6, 1.68, -2.48)), C("#c9a24a"));
    b.add(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 10).translate(x, 2.9, -3.2), C("#3a3a40"));
  }
  // bread racks on both side walls
  const Rk = C("#8a5a34"), Lf = lam("loaf", () => ({ color: "#d08a3e" }));
  for (const sx of [-1, 1]) {
    const x = sx * 6.2;
    for (const zz of [-1.6, 1.2]) for (const sy of [0.5, 1.1, 1.7, 2.3]) {
      b.add(boxGeo(V(x - 0.5, sy, zz - 1.1), V(x + 0.5, sy + 0.05, zz + 1.1)), Rk);
      for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.2, 10, 6).scale(1.4, 0.7, 0.8).translate(x + 0.15 * (k % 2 ? 1 : -1), sy + 0.15, zz - 0.85 + k * 0.42), Lf);
    }
    for (const zz of [-2.7, -0.5, 2.3]) b.add(boxGeo(V(x - 0.52, 0, zz - 0.04), V(x + 0.52, 2.6, zz + 0.04)), Rk);
  }
  // long table with dough and loaves
  table2(b, 0, -1.2, 5.2, 0.9, 0.9, "#a8784a", undefined, false);
  for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(0.2, 10, 6).scale(1.4, 0.7, 0.8).translate(-2.1 + k * 0.7, 1.02, -1.2 + 0.18 * (k % 2)), Lf);
  // flour sacks
  for (const [x, z] of [[-3.4, 0.4], [-3.0, 0.9], [3.6, 0.6]] as P2[]) b.add(new THREE.CylinderGeometry(0.32, 0.38, 0.75, 10).translate(x, 0.37, z), C("#e8dcc0"));
  for (const x of [-3.5, 0, 3.5]) b.add(new THREE.SphereGeometry(0.22, 10, 8).translate(x, 3.35, 0), lam("bulb", () => ({ color: "#fff2c8", emissive: "#ffd890", emissiveIntensity: 2.0 })));
};
// CABIN (crew cabin, warm and small): bunk on the left, porthole on the back wall, a little table with a bottle
const cabin = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-3, 3, -3.2, 7, 1, 0), lam("cabFloor", () => ({ map: rep(planksHD(), 2, 2), color: "#b8946a" })));
  const Pw = lam("cabWall", () => ({ map: panelHD("cab", "#8a5a34") }));
  wbox(b, Pw, -3, 0, -3.5, 3, 2.9, -3.2, 1.2, 1.2);
  for (const sx of [-1, 1]) wbox(b, Pw, sx > 0 ? 3 : -3.3, 0, -3.5, sx > 0 ? 3.3 : -3, 2.9, 7, 1.2, 1.2);
  b.add(plane(-3.4, 3.4, -3.5, 9, 1, 2.9), lam("cabCeil", () => ({ color: "#e8e0d0", side: THREE.DoubleSide })));
  for (const z of [-2, 0, 2]) b.add(boxGeo(V(-3, 2.72, z - 0.1), V(3, 2.9, z + 0.1)), C("#6a4428"));
  // porthole: brass ring + night-blue glass with a moon glint
  b.add(new THREE.TorusGeometry(0.42, 0.08, 10, 24).translate(1.1, 1.75, -3.18), C("#c9a24a"));
  b.add(new THREE.CircleGeometry(0.42, 24).translate(1.1, 1.75, -3.19), lam("portGlass", () => ({ color: "#1a2a5a", emissive: "#24386e", emissiveIntensity: 0.8 })));
  // bunk
  b.add(boxGeo(V(-2.95, 0, -3.2), V(-1.2, 0.55, -1.2)), C("#6a4428"));
  b.add(boxGeo(V(-2.9, 0.55, -3.15), V(-1.25, 0.72, -1.25)), C("#e8e4dc"));
  b.add(boxGeo(V(-2.9, 0.72, -3.1), V(-1.25, 0.8, -2.0)), C("#3a5a8a"));
  b.add(boxGeo(V(-2.95, 1.7, -3.2), V(-1.2, 1.85, -1.2)), C("#6a4428"));
  b.add(boxGeo(V(-2.9, 1.85, -3.15), V(-1.25, 2.0, -1.25)), C("#e8e4dc"));
  // table + bottle + lamp
  table2(b, 1.6, -2.2, 1.0, 0.7, 0.8, "#6a4428", undefined, false);
  b.add(new THREE.CylinderGeometry(0.08, 0.09, 0.32, 10).translate(1.4, 0.98, -2.2), lam("bottleG", () => ({ color: "#3a6a3a", transparent: true, opacity: 0.85 })));
  b.add(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8).translate(1.4, 1.2, -2.2), C("#3a6a3a"));
  b.add(new THREE.CylinderGeometry(0.1, 0.13, 0.22, 10).translate(1.85, 0.93, -2.3), lam("lampC", () => ({ color: "#fff2c8", emissive: "#ffc860", emissiveIntensity: 2.2 })));
  b.add(boxGeo(V(-0.6, 0, -3.2), V(0.4, 1.9, -2.8)), C("#7a4e2e")); // locker
  b.add(boxGeo(V(-0.5, 1.95, -3.2), V(0.3, 2.05, -2.9)), C("#c9a24a"));
};
// STERN (poop deck, night): deck at y 0 on a black hull that drops to y -40; the stern rail at z = -4.5 with the sea
// beyond and far below (dyn sea: POSE raises it in shot 13 = the ship goes down "like an elevator")
export const STERN_SEA = (id: number, t: number) => {
  if (id !== 13) return id === 21 ? -24 : -24;
  const a = SHOTS[12].a / FPS, b2 = SHOTS[12].b / FPS;
  const u = smooth((t - a - 0.1) / Math.max(0.5, (b2 - a) * 0.6)), v = clamp01((t - a - (b2 - a) * 0.6) / ((b2 - a) * 0.4));
  return -24 + 24.4 * u + 0.8 * v;
};
const stern = (s: SetBuild) => {
  const { b } = s;
  sea(s, "stern", "#34527a", -24);
  stars(s);
  b.add(plane(-9, 9, -4.6, 8, 1, 0), lam("deckP", () => ({ map: rep(planksHD(), 3, 2), color: "#d8c0a0" })));
  b.add(boxGeo(V(-9.2, -40, -5.2), V(9.2, -0.02, 8)), lam("hullK", () => ({ color: "#14141a" })));
  b.add(boxGeo(V(-9.3, -0.9, -5.3), V(9.3, -0.4, 8.1)), C("#f2efe6")); // white sheer band
  railing(b, -9, 9, -4.5, 1.15);
  for (const sx of [-1, 1]) railing(b, sx * 9 - 0.01, sx * 9 + 0.01, 0, 0.0);
  b.add(new THREE.CylinderGeometry(0.06, 0.09, 7, 8).translate(0, 3.5, -4.85), C("#e8e0d0")); // ensign staff
  for (const [x, z] of [[-5.5, -3.2], [5.6, -3.0], [-7.4, 0.5], [7.4, 0.8]] as P2[]) { b.add(new THREE.CylinderGeometry(0.22, 0.26, 0.6, 12).translate(x, 0.3, z), C("#2a2a30")); b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12).translate(x, 0.62, z), C("#2a2a30")); }
  b.add(new THREE.CylinderGeometry(0.5, 0.6, 0.9, 14).translate(-2.8, 0.45, 1.2), C("#3a3a40")); b.add(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 14).translate(-2.8, 0.95, 1.2), C("#3a3a40")); // capstan
  // docking bridge across the deck behind the camera side + a crane post
  b.add(boxGeo(V(-9, 2.6, 5.4), V(9, 2.8, 6.4)), C("#f2efe6"));
  for (const x of [-8.6, 8.6]) b.add(boxGeo(V(x - 0.1, 0, 5.8), V(x + 0.1, 2.6, 6.0)), C("#f2efe6"));
  b.add(new THREE.CylinderGeometry(0.14, 0.18, 4.2, 8).translate(6.2, 2.1, -2.0), C("#e8e0d0"));
  b.add(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6).rotateZ(1.0).translate(5.0, 3.6, -2.0), C("#e8e0d0"));
  for (const x of [-4, 3]) { b.add(boxGeo(V(x - 0.9, 0.42, 2.6), V(x + 0.9, 0.5, 3.1)), C("#8a5a34")); for (const sx of [-0.8, 0.8]) b.add(boxGeo(V(x + sx - 0.05, 0, 2.65), V(x + sx + 0.05, 0.42, 3.05)), C("#3a3a3e")); }
  for (const x of [-7, -2.2, 2.6, 7]) lamp(b, x, 2.5, 5.3);
};
// SEA (open North Atlantic): water at y 0; the liner + iceberg far off (shot 4); floating deck chairs near the lens;
// small ice chunks; Carpathia on the horizon at dawn (shot 18); two little steamers by day (shot 19).
const seaSet = (s: SetBuild) => {
  const { b } = s;
  sea(s, "sea", "#3a5a86", 0, 900);
  stars(s);
  sub(s, "tit", (bb) => { liner(bb, -2, -95, 70, 4, "#c8913a", 0, true); iceberg(bb, 30, -80, 7); });
  for (let k = 0; k < 18; k++) { const x = -14 + 28 * hh(k, 21), z = -12 + 12 * hh(k, 22); b.add(new THREE.IcosahedronGeometry(0.2 + 0.3 * hh(k, 23), 0).scale(1.4, 0.6, 1).translate(x, 0.02, z), k % 2 ? ice() : iceS()); }
  for (let k = 0; k < 8; k++) sub(s, "chair" + k, (bb) => deckChair(bb, 0, 0, hh(k, 31) * 6, -0.28, 1));
  sub(s, "carp", (bb) => liner(bb, -20, -160, 60, 1, "#c84a2a", 0, false)); // Carpathia: dawn only
  sub(s, "rescue", (bb) => lifeboat(bb, 0, 0.35, 0, 5.2));
};
const CHAIRS: [number, number][] = [[-2.6, -1.2], [1.9, -0.4], [-0.8, -3.6], [3.4, -2.8], [-3.8, -4.4], [0.6, -6], [4.6, -6.5], [-2.2, -7.5]];

export const BUILD: Record<SetId, (s: SetBuild) => void> = { deck, galley, cabin, stern, sea: seaSet };
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  stern: (s, t, id) => { s.dyn.sea.position.y = STERN_SEA(id, t); },
  deck: (s, t, id) => { s.dyn.stars.visible = SHOTS[id - 1].light === "night"; },
  sea: (s, t, id) => {
    const on = id === 11 || id === 14 || id === 16;
    CHAIRS.forEach(([x, z], k) => {
      const g = s.dyn["chair" + k]; g.visible = on;
      g.position.set(x, 0.06 * Math.sin(t * 1.6 + k), z); g.rotation.set(0.06 * Math.sin(t * 1.3 + k * 2), hh(k, 31) * 6 + 0.1 * Math.sin(t * 0.4 + k), 0.06 * Math.cos(t * 1.1 + k));
    });
    const r = s.dyn.rescue; r.visible = id === 18; r.position.set(-1.6, 0.04 * Math.sin(t * 1.4), -1.6); r.rotation.set(0.03 * Math.sin(t * 1.2), 0.5, 0.02 * Math.sin(t));
    s.dyn.carp.visible = id === 18; s.dyn.tit.visible = id === 4 || id === 11; s.dyn.tit.rotation.z = id === 11 ? -0.07 : 0; s.dyn.tit.position.y = id === 11 ? -4 : 0; s.dyn.stars.visible = SHOTS[id - 1].light === "night";
  },
};

// ---------------- cast ----------------
const BAKER: Outfit = { jacket: "#f4f2ec", pants: "#d8d4ca", boots: INK, hat: "toque", moustache: "#4a2e1a", skin: SKINS[0], buttons: "#c8c0b0" } as Outfit;
const BAKER_WET: Outfit = { ...BAKER, hat: "toque" } as Outfit;
const HELPER = (v: number): Outfit => ({ jacket: "#f4f2ec", pants: ["#d8d4ca", "#c8c4ba", "#e0dcd2"][v % 3], boots: INK, hat: v % 3 === 1 ? "cap" : "toque", cap: "#f4f2ec", moustache: v % 2 ? "#5a3a22" : undefined, skin: SKINS[v % 3] } as Outfit);
const PASS = (v: number): Outfit => (v % 2
  ? { jacket: ["#7a2a3a", "#2a4a6a", "#5a3a6a"][v % 3], pants: ["#7a2a3a", "#2a4a6a", "#5a3a6a"][v % 3], dress: ["#7a2a3a", "#2a4a6a", "#5a3a6a"][v % 3], boots: INK, hat: "hair", hair: ["#3a2a1e", "#8a5a2a", "#1e1e1e"][v % 3], skin: SKINS[v % 3], trim: "#f4f0e6" }
  : { jacket: ["#2a2a34", "#3a3a2e", "#4a3a2a"][v % 3], pants: "#2a2a30", boots: INK, hat: v % 4 === 0 ? "tophat" : "fedora", hatCol: "#2a2a30", moustache: v % 3 === 0 ? "#3a2a1e" : undefined, skin: SKINS[(v + 1) % 3] }) as Outfit;
const OFFICER: Outfit = { jacket: "#1e2a44", pants: "#1e2a44", boots: INK, hat: "peaked", cap: "#1e2a44", buttons: "#e8c45a", moustache: "#3a2a1e", skin: SKINS[1] } as Outfit;

// ---------------- effect drawings ----------------
const SERIF = "Georgia, serif";
const fxLoaf = (p: Pen) => {
  p.ell(200, 170, 170, 95, "#c87a32", 9); p.ell(200, 150, 150, 70, "#e09a4a", 0);
  for (const x of [110, 175, 240, 300]) p.stroke([[x - 22, 110], [x + 22, 200]], 12, "#f6d7a0");
};
const fxGlass = (p: Pen) => {
  p.poly([[90, 60], [310, 60], [290, 420], [110, 420]], "#e6f2f6", 9);
  p.poly([[100, 240], [300, 240], [291, 412], [109, 412]], "#d8962e", 0);
  p.stroke([[130, 90], [140, 390]], 12, "#ffffff");
  txt(p, "1/2", 200, 350, 70, "#ffffff", "900", "center");
};
const fxChairIcon = (p: Pen) => {
  p.poly([[40, 230], [300, 170], [312, 196], [52, 258]], "#b07a48", 8);
  p.poly([[262, 182], [330, 40], [356, 52], [292, 194]], "#a06a3e", 8);
  p.poly([[60, 226], [290, 176], [292, 190], [62, 240]], "#3a5a8a", 0);
  p.stroke([[80, 250], [70, 300]], 12, "#7d5234"); p.stroke([[270, 196], [280, 270]], 12, "#7d5234");
};
const fxThermo = (p: Pen) => {
  p.poly(rrect(40, 20, 340, 500, 30), "#f6f8fc", 8);
  p.poly(rrect(160, 60, 220, 380, 30), "#ffffff", 6); p.ell(190, 420, 56, 56, "#3a8ad8", 6); p.poly(rrect(170, 300, 210, 420, 18), "#3a8ad8", 0);
  for (let k = 0; k < 7; k++) p.stroke([[226, 90 + 44 * k], [k % 2 ? 250 : 262, 90 + 44 * k]], 5, "#5a6a80");
  txt(p, "-2°C", 120, 210, 52, "#1e4a9a", "900", "center"); txt(p, "28°F", 300, 270, 40, "#1e4a9a", "900", "center");
};
const fxClock = (p: Pen) => {
  p.ell(200, 200, 170, 170, "#fbf8f0", 10); p.ell(200, 200, 150, 150, null, 0);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; p.stroke([[200 + 130 * Math.sin(a), 200 - 130 * Math.cos(a)], [200 + 148 * Math.sin(a), 200 - 148 * Math.cos(a)]], k % 3 ? 5 : 10, "#2a2a30"); }
  p.stroke([[200, 200], [200, 90]], 12, "#2a2a30"); p.stroke([[200, 200], [270, 240]], 12, "#2a2a30");
  p.ell(200, 200, 14, 14, "#d02a2e", 0);
  txt(p, "2 HRS?", 200, 450, 62, "#d02a2e", "900", "center");
};
const fxFeet = (p: Pen) => {
  p.poly(rrect(20, 20, 420, 300, 30), "#fffaf0", 8);
  for (const [x, s] of [[140, 1], [300, -1]] as P2[]) {
    p.ell(x, 200, 90, 70, "#f2b8a0", 8);
    for (let k = 0; k < 5; k++) p.ell(x + s * (-50 + k * 22), 120 + 4 * Math.abs(k - 2), 16 - k, 18 - k, "#f2b8a0", 6);
  }
  for (const x of [70, 210, 230, 370]) p.stroke([[x, 260], [x + 12, 280]], 6, "#d86a5a");
  txt(p, "SWOLLEN", 220, 300, 46, "#d02a2e", "900", "center");
};
const fxShip = (fire: boolean) => (p: Pen) => {
  p.poly(rrect(10, 10, 490, 330, 24), fire ? "#ffe9cc" : "#d6e6f6", 8);
  const tilt = fire ? 0 : -0.35, cx = 250, cy = 220, R = (x: number, y: number): P2 => [cx + (x - cx) * Math.cos(tilt) - (y - cy) * Math.sin(tilt), cy + (x - cx) * Math.sin(tilt) + (y - cy) * Math.cos(tilt)];
  p.poly([R(70, 200), R(430, 200), R(400, 260), R(100, 260)], "#2a2a30", 7);
  p.poly([R(140, 160), R(360, 160), R(360, 200), R(140, 200)], "#f2efe6", 6);
  p.poly([R(230, 100), R(270, 100), R(270, 160), R(230, 160)], "#c84a2a", 6);
  if (fire) for (const [x, y, r] of [[180, 140, 40], [230, 110, 54], [290, 130, 44], [330, 150, 30]]) { p.ell(x, y, r * 0.8, r, "#ff8a2a", 5); p.ell(x, y + r * 0.25, r * 0.45, r * 0.6, "#ffd84a", 0); }
  else p.poly([[10, 250], [490, 250], [490, 330], [10, 330]], "#3a7ab8", 0);
  txt(p, fire ? "FIRE" : "SANK", 250, 60, 54, fire ? "#d02a2e" : "#1e4a9a", "900", "center");
};
const fxClap = (p: Pen) => {
  p.poly(rrect(30, 120, 470, 420, 14), "#1e1e22", 9);
  p.poly([[30, 120], [470, 120], [470, 60], [30, 60]], "#f2f2f2", 8);
  for (let k = 0; k < 6; k++) p.poly([[50 + 76 * k, 60], [90 + 76 * k, 60], [60 + 76 * k, 120], [20 + 76 * k, 120]], "#1e1e22", 0);
  txt(p, "THE 1997 MOVIE", 250, 220, 44, "#ffffff", "900", "center");
  txt(p, "BAKER: ON SCREEN", 250, 300, 36, "#ffd23a", "900", "center");
  txt(p, "SCENE 1912", 250, 380, 30, "#9aa0aa", "700", "center");
};
const fxDry = (p: Pen) => {
  p.poly(rrect(20, 20, 380, 240, 24), "#fffaf0", 8);
  txt(p, "HEAD:", 200, 110, 54, "#2a2a30", "900", "center");
  txt(p, "BARELY WET", 200, 190, 52, "#1e6ad8", "900", "center");
};
const fxDoubt = (p: Pen) => {
  p.poly(rrect(20, 20, 380, 300, 24), "#f8f1dc", 8);
  txt(p, "HISTORIANS:", 200, 100, 44, "#5a3a22", "900", "center", SERIF);
  txt(p, "DOUBTFUL", 200, 190, 58, "#d02a2e", "900", "center");
  txt(p, "probably < 30 min", 200, 260, 30, "#5a4a30", "italic 700", "center", SERIF);
};

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;  // animate on twos
const BK = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, y = 0, shadow = true) => pose(c, 1, BAKER, "baker", x, z, fo, 1, y, shadow);
const wet = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, bob = 0) => pose(c, 1, BAKER_WET, "bakerW", x, z, fo, 1, -1.25 + 0.05 * Math.sin(c.t * 1.7) + bob, false);
const panic = (c: Ctx, base: number, spots: [number, number, number][]) => spots.forEach(([x, z, v], k) => {
  const ph = TQ(c.t) * 1.6 + hh(k, 3), dx = 0.35 * Math.sin(ph * 2.2 + k);
  pose(c, base + k, PASS(v), `pass${v % 6}`, x + dx, z, { mode: "stroll", phase: ph % 1, expr: k % 2 ? "shock" : "nervous", look: Math.cos(ph * 2.2 + k) > 0 ? 0.7 : -0.7, prop: k % 3 === 0 ? "handsUp" : null, lean: 0.06 * Math.sin(ph * 3) });
});
const HOOK_PANIC: [number, number, number][] = [[-2.1, 2.2, 1], [2.3, 1.9, 2], [-1.4, -2.4, 4], [1.7, -2.7, 3], [-3.4, -1.4, 5], [3.6, -1.0, 0]];

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 The Titanic is sinking. Everyone is panicking.   (hook; the outro returns here)
  1: (c) => {
    const t = c.t;
    panic(c, 10, HOOK_PANIC);
    BK(c, 0.2, 0.4, { mode: "stand", expr: "smile_closed", look: 0.2, prop: "glass" });
    if (after(t, A(0, "sinking."))) word(c, A(0, "sinking."), "SINKING", [0.2, 3.05, 0.2], 1.5, 1.1, "#ffd0c0");
  },
  // 2 And the chief baker? He's pouring himself a drink.
  2: (c) => {
    const t = c.t;
    panic(c, 10, HOOK_PANIC);
    BK(c, 0.2, 0.4, { mode: "stand", expr: after(t, A(0, "drink.")) ? "smug" : "smile_closed", look: 0.3, prop: "glass" });
    if (after(t, A(0, "baker?"))) banner(c, A(0, "baker?"), "CHIEF BAKER", [0.2, 2.75, 0.6], 1.6, "#2a3a6a", 2.0);
  },
  // 3 Meet Charles Joughin.
  3: (c) => {
    const t = c.t;
    panic(c, 10, HOOK_PANIC);
    BK(c, 0.2, 0.4, { mode: "stand", expr: "grin", look: -0.2, prop: "glass", lean: -0.03 });
    if (after(t, A(0, "joughin."))) banner(c, A(0, "joughin."), "CHARLES JOUGHIN", [0.2, 2.8, 0.6], 1.8, "#c0353a", 2.4);
  },
  // 4 April 1912. The unsinkable ship hits an iceberg.
  4: (c) => {
    const t = c.t;
    if (after(t, A(1, "april,"))) stay(c, A(1, "april,"), "cal1912", 300, 340, (p) => fxCal(p, "APRIL 1912", true), [-3, 15, -40], 7, 7.9, 0.05);
    if (after(t, A(1, "unsinkable"))) word(c, A(1, "unsinkable"), "UNSINKABLE", [3, 5, -40], 12, 1.4, "#ffffff");
    if (after(t, A(1, "iceberg."))) word(c, A(1, "iceberg."), "ICEBERG!", [16, 10, -40], 10, 1.2, "#bfe8ff");
  },
  // 5 Charles runs the kitchen, with 13 bakers under him.
  5: (c) => {
    const t = c.t;
    [[-2.1, 0.1, 0], [-1.05, -0.7, 1], [1.05, -0.7, 2], [2.1, 0.1, 3]].forEach(([x, z, v]) => pose(c, 20 + v, HELPER(v), `help${v}`, x, z, { mode: "stand", expr: v % 2 ? "smile" : "grin", look: x > 0 ? -0.4 : 0.4, prop: v === 1 ? "loaf" : v === 2 ? "pan" : null }));
    BK(c, 0, 0.9, { mode: "stand", expr: "smug", look: 0, prop: "point" as FrontOpts["prop"] });
    if (after(t, A(1, "13"))) banner(c, A(1, "13"), "13 BAKERS", [0, 2.9, 0.4], 1.8, "#c0353a", 2.0);
  },
  // 6 His first move? Bread.
  6: (c) => {
    const t = c.t;
    BK(c, 0, 0.9, { mode: "stand", expr: after(t, A(1, "bread.")) ? "grin" : "stern", look: 0.1, prop: after(t, A(1, "bread.")) ? "loaf" : null });
    if (after(t, A(1, "bread."))) stay(c, A(1, "bread."), "loafC", 400, 300, fxLoaf, [0.15, 2.85, 0.9], 1.0, 0.75, -0.05);
    if (after(t, A(1, "bread."))) word(c, A(1, "bread."), "BREAD.", [0.1, 3.4, 0.9], 1.0, 1.2, "#ffd23a");
  },
  // 7 He sends every baker up to the lifeboats, with four loaves each.
  7: (c) => {
    const t = c.t, s0 = A(1, "sends");
    for (let k = 0; k < 4; k++) {
      const w = clamp01((t - s0 + 0.3 * k) / 3.2);
      pose(c, 20 + k, HELPER(k), `help${k}`, 26.4 + 3.4 * w - 0.9 * k, -0.6 + 0.5 * (k % 2) - 0.6 * w, { mode: "stroll", phase: (TQ(t) * 1.5 + 0.25 * k) % 1, expr: "smile", look: 0.7, prop: "loaves" });
    }
    if (after(t, A(1, "four"))) word(c, A(1, "four"), "4 LOAVES EACH", [28.8, 3.3, -1.6], 2.6, 1.6, "#ffd23a");
    if (after(t, A(1, "lifeboats,"))) banner(c, A(1, "lifeboats,"), "LIFEBOATS", [32.5, 4.0, -4.6], 2.4, "#2a3a6a", 1.6);
  },
  // 8 Then he goes back to his cabin... for a drink.
  8: (c) => {
    const t = c.t;
    BK(c, 0.3, -0.7, { mode: "stand", expr: after(t, A(2, "drink.")) ? "smug" : "neutral", look: 0.5, prop: after(t, A(2, "drink.")) ? "glass" : null });
    if (after(t, A(2, "cabin..."))) banner(c, A(2, "cabin..."), "HIS CABIN", [0.3, 2.45, -0.6], 1.4, "#6a4428", 1.6);
  },
  // 9 Half a glass of liqueur, he said later. Legend says it was a lot more.
  9: (c) => {
    const t = c.t;
    BK(c, 0.3, -0.7, { mode: "stand", expr: after(t, A(2, "legend")) ? "innocent" as FrontOpts["expr"] : "smile_closed", look: 0.2, prop: "glass" });
    if (after(t, A(2, "half"))) stay(c, A(2, "half"), "glassC", 400, 460, fxGlass, [-0.45, 1.95, -0.4], 0.55, 0.63, 0.06);
    if (after(t, A(2, "legend"))) word(c, A(2, "legend"), "A LOT MORE?", [0.05, 2.55, -0.6], 1.15, 1.6, "#ffd0c0");
  },
  // 10 Back on deck, he starts throwing deck chairs into the ocean. About fifty of them.
  10: (c) => {
    const t = c.t, th = A(3, "throwing");
    BK(c, 26.2, -2.7, { mode: "stand", expr: "grin", look: 0.4, prop: after(t, th) ? "chairUp" : null, lean: after(t, th) ? -0.06 + 0.12 * Math.sin(TQ(t) * 5) : 0 });
    if (after(t, th)) for (let k = 0; k < 4; k++) { // chairs sailing over the rail, one every 0.55 s
      const u = ((t - th) - 0.55 * k) / 1.1; if (u < 0 || u > 1) continue;
      card(c, "chairIco", 400, 320, fxChairIcon, [26.6 + 1.2 * u, 3.0 + 1.4 * u - 6.5 * u * u, -4.9 - 2 * u], 1.25, 1.0, { rot: 3 * u + k });
    }
    if (after(t, A(3, "fifty"))) { const n = Math.min(50, Math.round(10 + (t - A(3, "fifty")) * 90)); word(c, A(3, "fifty"), `x${n}`, [27.2, 2.9, -2.4], 1.0, 2.0, "#ffd23a"); }
  },
  // 11 So people in the water have something to float on.
  11: (c) => {
    const t = c.t;
    if (after(t, A(3, "float"))) word(c, A(3, "float"), "FLOTATION", [0, 1.6, -2], 1.8, 1.4, "#c8f0c0");
  },
  // 12 Then the ship tips up. He climbs to the very back and grabs the rail.
  12: (c) => {
    const t = c.t, cl = A(4, "climbs"), w = smooth((t - cl) / 1.4);
    BK(c, 2.4 - 2.1 * w, 1.6 - 5.35 * w, { mode: w > 0.02 && w < 0.98 ? "stroll" : "stand", phase: (TQ(t) * 1.6) % 1, expr: w < 0.98 ? "nervous" : "stern", look: 0.3, prop: after(t, A(4, "rail.")) ? "handsUp" : null });
    if (after(t, A(4, "back"))) banner(c, A(4, "back"), "THE STERN", [0.3, 2.9, -3.6], 1.8, "#2a3a6a", 1.8);
  },
  // 13 And as the Titanic goes down, he rides it... like an elevator.
  13: (c) => {
    const t = c.t;
    BK(c, 0.3, -3.75, { mode: "stand", expr: after(t, A(4, "elevator.")) ? "smile_closed" : "dazed", look: 0.1, prop: "handsUp" });
    if (after(t, A(4, "elevator."))) word(c, A(4, "elevator."), "LIKE AN ELEVATOR", [0.3, 3.0, -3.4], 2.3, 1.6, "#ffd23a");
    if (after(t, A(4, "down,"))) { const k = Math.min(9, Math.floor((t - A(4, "down,")) * 5)); word(c, A(4, "down,"), `GOING DOWN${".".repeat(k % 4)}`, [0.3, 3.1, -3.3], 1.5, Math.max(0.3, A(4, "elevator.") - A(4, "down,") - 0.15), "#ffffff"); }
  },
  // 14 He said his head barely even got wet.
  14: (c) => {
    const t = c.t;
    wet(c, 0, 0, { mode: "stand", expr: "smug", look: 0.2 });
    if (after(t, A(4, "head"))) stay(c, A(4, "head"), "dry", 400, 260, fxDry, [0.0, 1.5, 0.1], 0.9, 0.59, 0.04);
  },
  // 15 The water was below freezing. Most people lasted only minutes.   (played straight, cold)
  15: (c) => {
    const t = c.t;
    if (after(t, A(5, "freezing."))) stay(c, A(5, "freezing."), "thermo", 380, 520, fxThermo, [0.6, 2.2, -3], 1.1, 1.5, 0.04);
    if (after(t, A(5, "minutes."))) word(c, A(5, "minutes."), "MINUTES", [-0.8, 1.7, -2.6], 1.4, 1.4, "#e8e8e8");
  },
  // 16 Charles says he just paddled around... for two hours.
  16: (c) => {
    const t = c.t, pd = A(5, "paddled");
    wet(c, 0, 0, { mode: "stand", expr: "smile_closed", look: 0.3, prop: after(t, pd) ? "shrug" : null, lean: after(t, pd) ? 0.08 * Math.sin(TQ(t) * 4) : 0 });
    if (after(t, A(5, "hours."))) stay(c, A(5, "hours."), "clock2", 400, 480, fxClock, [1.0, 1.7, -0.2], 0.8, 0.96, 0.05);
  },
  // 17 Historians aren't so sure.
  17: (c) => {
    const t = c.t;
    wet(c, 0, 0, { mode: "stand", expr: "innocent" as FrontOpts["expr"], look: 0.4 });
    if (after(t, A(5, "historians"))) stay(c, A(5, "historians"), "doubt", 400, 320, fxDoubt, [0.55, 1.65, -0.3], 0.95, 0.76, -0.04);
  },
  // 18 At dawn, a rescue ship picks him up. His only injury? Swollen feet.
  18: (c) => {
    const t = c.t, pk = A(6, "picks"), w = smooth((t - pk) / 1.0);
    pose(c, 30, OFFICER, "officer", -1.5, -1.5, { mode: "stand", expr: "smile", look: 0.6, prop: "handsUp" }, 1, 0.42, false);
    if (w < 0.99) wet(c, 0.4 - 0.9 * w, -0.6, { mode: "stand", expr: "relief", look: -0.6 }, 0.6 * w);
    else BK(c, -0.7, -1.0, { mode: "stand", expr: after(t, A(6, "feet.")) ? "pained" : "relief", look: 0.3 }, 0.42, false);
    if (after(t, A(6, "dawn,"))) banner(c, A(6, "dawn,"), "RESCUE SHIP CARPATHIA", [0, 3.3, -2], 2.6, "#c84a2a", 1.8);
    if (after(t, A(6, "feet."))) stay(c, A(6, "feet."), "feet", 440, 320, fxFeet, [0.9, 2.2, -0.8], 1.1, 0.8, 0.04);
  },
  // 19 And he wasn't done. Years later, another of his ships caught fire. Then another one sank.
  19: (c) => {
    const t = c.t;
    BK(c, 26.0, -1.2, { mode: "stand", expr: after(t, A(7, "sank.")) ? "dazed" : "smile", look: 0.2 });
    if (after(t, A(7, "fire."))) stay(c, A(7, "fire."), "shipFire", 500, 340, fxShip(true), [25.6, 3.0, -1.6], 1.05, 0.71, -0.05);
    if (after(t, A(7, "fire."))) stay(c, A(7, "fire."), "cal1916", 300, 340, (p) => fxCal(p, "1916", true), [25.45, 2.3, -1.4], 0.55, 0.62, 0.05);
    if (after(t, A(7, "sank."))) stay(c, A(7, "sank."), "shipSink", 500, 340, fxShip(false), [26.95, 3.0, -1.6], 1.05, 0.71, 0.05);
    if (after(t, A(7, "sank."))) stay(c, A(7, "sank."), "cal1941", 300, 340, (p) => fxCal(p, "1941", true), [27.0, 2.3, -1.4], 0.55, 0.62, -0.05);
  },
  // 20 He survived both.   (under the impact card)
  20: (c) => {
    BK(c, 26.0, -1.2, { mode: "stand", expr: "smug", look: 0.2 });
  },
  // 21 In the 1997 Titanic movie, he's the guy at the back rail, sipping from a flask.
  21: (c) => {
    const t = c.t;
    BK(c, 0.6, -3.75, { mode: "stand", expr: "smile_closed", look: -0.2, prop: after(t, A(8, "flask.")) ? "flask" : null });
    if (after(t, A(8, "1997"))) stay(c, A(8, "1997"), "clap", 500, 440, fxClap, [-0.3, 2.4, -3.2], 0.95, 0.84, -0.05);
    if (after(t, A(8, "flask."))) word(c, A(8, "flask."), "SIP.", [1.25, 2.45, -3.3], 0.7, 1.2, "#ffd23a");
  },
  // 22 Send this to the friend who'd stay calm on a sinking ship.   (ends on shot 1's frame: loop)
  22: (c) => {
    const t = c.t, c0 = { ...c, t: c.t - (TOTAL - 1) / FPS };
    panic(c0, 10, HOOK_PANIC);
    BK(c0, 0.2, 0.4, { mode: "stand", expr: "smile_closed", look: 0.2, prop: "glass" });
    if (after(t, A(9, "send")) && t < A(9, "on") - 0.15) banner(c, A(9, "send"), "SEND THIS TO THEM", [0.2, 2.9, 0.6], 1.9, "#e07a1a", 2.0);
  },
};
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxSay; void fxScore; void sayB; void puff; void jolt; void hop; void pop; void chair; void rug; void painting; void bookcase; void chandelier2; void flag; void waveFlags; void quad; void tri;
