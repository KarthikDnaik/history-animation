// Places and cast of "Lawnchair Larry" (1982; 9:16 short).
// Direction sheet: sunny Californian back yard (stucco, palms, lawn, a yellow Jeep) vs the blue-white void at 16,000 ft
// with cloud banks and the hazed LA basin far below; a grey airliner flight deck; a Long Beach street of bungalows and
// power lines. Palette: sky blue / cream balloons / lawn green / red cap + yellow accent. DEPTH: near-lens agave + grill in
// the yard, windscreen posts in the cockpit, a street sign on the kerb, cloud layers below the chair. Key moments: 42
// balloons inflating, the rope snapping, the launch, the airliner passing, POP POP, the gun falling, ZZZAP + blackout,
// the quote at sunset. Avoid: background voices, music, faces filling frame, dark tone, his later life.
import * as THREE from "three";
import { VfxRig, popBursts, launchDust, sparks } from "./vfx";
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
/** the Los Angeles basin from 16,000 ft, pre-hazed (drawn fog-free on a plane far below): Pacific left, the harbour and
 *  breakwater, the street grid, Long Beach airport runways, green parks, the hills inland */
const basin = () => ctex("basin", 2048, 2048, (g, r) => {
  g.fillStyle = "#c9c7b4"; g.fillRect(0, 0, 2048, 2048);
  // street grid
  for (let k = 0; k < 2048; k += 9 + Math.floor(14 * r())) { g.fillStyle = `rgba(160,155,140,${0.08 + 0.12 * r()})`; g.fillRect(k, 0, 1, 2048); g.fillRect(0, k, 2048, 1); }
  for (let k = 0; k < 900; k++) { g.fillStyle = r() < 0.5 ? "rgba(214,206,186,0.7)" : "rgba(184,176,160,0.6)"; g.fillRect(2048 * r(), 2048 * r(), 14 + 30 * r(), 14 + 30 * r()); }
  for (let k = 0; k < 60; k++) { g.fillStyle = "rgba(140,170,120,0.75)"; g.beginPath(); g.ellipse(2048 * r(), 2048 * r(), 20 + 60 * r(), 14 + 40 * r(), r() * 3, 0, 6.3); g.fill(); }
  // freeways
  g.strokeStyle = "rgba(235,232,220,0.9)"; g.lineWidth = 7;
  for (const [a, b, c, d] of [[300, 2048, 1300, 0], [900, 2048, 2048, 700], [0, 900, 2048, 1200]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 120, (b + d) / 2, c, d); g.stroke(); }
  // the ocean on the left and bottom, with the harbour
  g.fillStyle = "#8fb0c4"; g.beginPath(); g.moveTo(0, 0); g.lineTo(520, 0); g.bezierCurveTo(470, 500, 640, 900, 560, 1250); g.bezierCurveTo(760, 1420, 1200, 1500, 1400, 1640);
  g.bezierCurveTo(1700, 1720, 1900, 1700, 2048, 1760); g.lineTo(2048, 2048); g.lineTo(0, 2048); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 5; g.beginPath(); g.moveTo(560, 1250); g.bezierCurveTo(760, 1420, 1200, 1500, 1400, 1640); g.stroke();
  g.strokeStyle = "#b8b4a4"; g.lineWidth = 10; g.beginPath(); g.moveTo(760, 1600); g.lineTo(1500, 1780); g.stroke(); // breakwater
  for (let k = 0; k < 14; k++) { g.fillStyle = "#a8a494"; g.fillRect(860 + 36 * k, 1430 + 8 * k, 26, 70); } // piers
  // Long Beach airport runways
  g.save(); g.translate(1450, 820); g.rotate(-0.5); g.fillStyle = "#e2ded2"; g.fillRect(-220, -60, 440, 220);
  g.fillStyle = "#6a6862"; g.fillRect(-200, 0, 400, 22); g.rotate(1.1); g.fillRect(-150, -10, 300, 18); g.restore();
  // a soft vignette of haze
  const v = g.createRadialGradient(1024, 1024, 300, 1024, 1024, 1300); v.addColorStop(0, "rgba(206,218,236,0.25)"); v.addColorStop(1, "rgba(206,218,236,0.85)");
  g.fillStyle = v; g.fillRect(0, 0, 2048, 2048);
});
const cloudPuff = (seed: number, warm = false) => ctex("cpuff" + seed + warm, 512, 256, (g, r0) => {
  const r = rng(seed);
  for (let k = 0; k < 26; k++) {
    const x = 70 + 372 * r(), y = 120 + 70 * (r() - 0.3) - 40 * Math.sin(Math.PI * (x - 70) / 372), rr = 40 + 50 * r();
    const gr = g.createRadialGradient(x, y - rr * 0.3, 0, x, y, rr);
    gr.addColorStop(0, warm ? "rgba(255,236,214,1)" : "rgba(255,255,255,1)"); gr.addColorStop(0.65, warm ? "rgba(246,214,200,0.9)" : "rgba(232,238,248,0.9)"); gr.addColorStop(1, "rgba(220,228,244,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 6.3); g.fill();
  }
  void r0;
});
/** the cockpit instrument panel: dark grey with round gauges, two screens, labels */
const panelTex = () => ctex("ckpanel", 1024, 320, (g, r) => {
  g.fillStyle = "#33373e"; g.fillRect(0, 0, 1024, 320);
  for (let k = 0; k < 18; k++) {
    const x = 70 + 52 * k + (k > 8 ? 60 : 0), y = 90 + (k % 2) * 110;
    g.fillStyle = "#15171b"; g.beginPath(); g.arc(x, y, 38, 0, 6.3); g.fill();
    g.strokeStyle = "#c8ccd2"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 34, 0, 6.3); g.stroke();
    g.strokeStyle = k % 3 ? "#f2f2e8" : "#ffb84a"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); const a = 6.3 * r(); g.lineTo(x + 26 * Math.cos(a), y + 26 * Math.sin(a)); g.stroke();
  }
  for (let k = 0; k < 40; k++) { g.fillStyle = r() < 0.3 ? "#e8b84a" : r() < 0.5 ? "#7ad08a" : "#c8ccd2"; g.fillRect(40 + 940 * r(), 280 + 20 * r(), 10, 6); }
});
const ckWall = () => ctex("ckwall", 512, 512, (g, r) => { // circuit-breaker panels: dark grey with rows of small black knobs
  g.fillStyle = "#3e434b"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128) { g.fillStyle = "#353a41"; g.fillRect(8, y + 8, 496, 112); g.strokeStyle = "#565c66"; g.lineWidth = 3; g.strokeRect(8, y + 8, 496, 112); }
  for (let y = 24; y < 512; y += 32) for (let x = 24; x < 500; x += 28) { if ((y % 128) > 110) continue; g.fillStyle = "#16181c"; g.beginPath(); g.arc(x, y, 6, 0, 6.3); g.fill(); if (r() < 0.06) { g.fillStyle = "#ffb84a"; g.fillRect(x - 3, y + 9, 6, 3); } }
});
const stucco = (key: string, base: string) => ctex("stucco" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 2200; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.08)" : "rgba(80,60,40,0.06)"; g.fillRect(512 * r(), 512 * r(), 3, 3); }
});
const webbing = () => ctex("webbing", 256, 256, (g) => {
  const cols = ["#2f8a5a", "#f4f0e2", "#f2c84a", "#f4f0e2"];
  for (let k = 0; k < 8; k++) { g.fillStyle = cols[k % 4]; g.fillRect(0, k * 32, 256, 30); }
  for (let k = 0; k < 8; k++) { g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(k * 32, 0, 2, 256); }
});
const lawn = () => ctex("lawnL", 1024, 1024, (g, r) => {
  g.fillStyle = "#7eae4a"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 9000; k++) { const x = 1024 * r(), y = 1024 * r(); g.strokeStyle = r() < 0.5 ? "rgba(60,110,40,0.45)" : "rgba(170,210,110,0.45)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 * (r() - 0.5), y - 9); g.stroke(); }
});
const asphalt = () => ctex("asph", 512, 512, (g, r) => {
  g.fillStyle = "#5a5c60"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 4000; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"; g.fillRect(512 * r(), 512 * r(), 2, 2); }
});

// ---------------- the flying lawn chair ----------------
/** 42 weather balloons, golden-angle packed into a bunch above the chair (cluster local coords: chair seat at y 0.45) */
const NB = 42;
const BAL: { p: THREE.Vector3; r: number; col: string }[] = Array.from({ length: NB }, (_, i) => {
  const u = (i + 0.5) / NB, y = 3.3 + 4.4 * u, R = 1.85 * Math.pow(Math.sin(Math.PI * (0.12 + 0.86 * u)), 0.7), rr = R * Math.sqrt(((i * 0.6180339) % 1) * 0.85 + 0.15), a = i * 2.39996;
  return { p: V(rr * Math.cos(a), y + 0.25 * (hh(i, 3) - 0.5), rr * Math.sin(a)), r: 0.6 + 0.08 * hh(i, 4), col: ["#f4ecda", "#efe2c6", "#f7f2e6", "#e9dcc0", "#f2e8d4"][i % 5] };
});
/** which balloons Larry shoots, and when (seconds from the first shot), in order */
const POPS = [5, 33, 12, 27, 40, 19];
const craft = (s: SetBuild, key: string) => {
  const g = new THREE.Group(), b = new Batch();
  const AL = C("#c8ccd2"), ALd = C("#9aa0a8"), WEB = lam("web", () => ({ map: webbing(), side: THREE.DoubleSide }));
  // aluminium frame: legs, arm rests, seat and back frames
  for (const sx of [-1, 1]) {
    b.add(beamBetween(V(0.3 * sx, 0, 0.32), V(0.3 * sx, 0.45, -0.2), 0.018), AL);
    b.add(beamBetween(V(0.3 * sx, 0, -0.3), V(0.3 * sx, 0.45, 0.3), 0.018), AL);
    b.add(beamBetween(V(0.3 * sx, 0.62, 0.3), V(0.3 * sx, 0.62, -0.25), 0.02), ALd); // arm rest
    b.add(beamBetween(V(0.3 * sx, 0.45, 0.3), V(0.3 * sx, 0.62, 0.3), 0.016), AL);
    b.add(beamBetween(V(0.3 * sx, 0.45, -0.25), V(0.3 * sx, 1.25, -0.48), 0.018), AL); // back post
  }
  b.add(new THREE.PlaneGeometry(0.6, 0.55).rotateX(-Math.PI / 2).translate(0, 0.45, 0.02), WEB);
  b.add(new THREE.PlaneGeometry(0.6, 0.82).rotateX(-0.28).translate(0, 0.86, -0.37), WEB);
  // tethers from the four corners to the hub, ballast jugs hanging off the side
  const hub = V(0, 2.9, -0.1), tb = new Batch();
  for (const [x, y, z] of [[-0.3, 0.62, 0.3], [0.3, 0.62, 0.3], [-0.3, 1.25, -0.48], [0.3, 1.25, -0.48]] as V3[]) tb.add(beamBetween(V(x, y, z), hub, 0.008, 4), C("#e8e2d0"));
  const teth = new THREE.Group(); teth.name = "teth"; tb.build(teth); g.add(teth);
  for (const sx of [-1, 1]) { b.add(beamBetween(V(0.3 * sx, 0.62, 0.0), V(0.42 * sx, 0.1, 0.0), 0.006, 3), C("#d8d2c0")); b.add(new THREE.CylinderGeometry(0.09, 0.1, 0.26, 10).translate(0.42 * sx, -0.03, 0), lam("jug", () => ({ color: "#d8e8f0", transparent: true, opacity: 0.85 }))); }
  b.build(g);
  // balloons (separate meshes so they can pop) + their strings
  const bg = new THREE.Group(); bg.name = "bal";
  const geo = new THREE.SphereGeometry(1, 20, 14).scale(1, 1.1, 1), neck = new THREE.ConeGeometry(0.12, 0.3, 8).rotateX(Math.PI).translate(0, -1.12, 0);
  BAL.forEach((o, i) => {
    const m = new THREE.Mesh(geo, lam("bal" + o.col, () => ({ color: o.col, emissive: "#fff6e8", emissiveIntensity: 0.32 })));
    m.position.copy(o.p); m.scale.setScalar(o.r); m.castShadow = true; m.name = "b" + i;
    const n = new THREE.Mesh(neck, C("#d8ccb0")); m.add(n);
    bg.add(m);
  });
  g.add(bg);
  const lp: number[] = []; BAL.forEach((o) => lp.push(hub.x, hub.y, hub.z, o.p.x, o.p.y - o.r * 1.15, o.p.z));
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: "#e8e2d0", transparent: true, opacity: 0.8 })); lines.name = "str"; g.add(lines);
  s.root.add(g); s.dyn[key] = g; return g;
};
/** pop state: balloons in POPS[0..n) hidden (with their strings), the rest bob a little */
const balloons = (g: THREE.Object3D, t: number, popped: number, inflate = 1, squash = 1) => {
  const bg = g.getObjectByName("bal")!, str = g.getObjectByName("str") as THREE.LineSegments, P = str.geometry.attributes.position as THREE.BufferAttribute;
  BAL.forEach((o, i) => {
    const m = bg.children[i], k = POPS.indexOf(i), gone = k >= 0 && k < popped;
    const grow = clamp01(inflate * NB - i); // inflate: 0..1 -> balloons appear one by one
    m.visible = !gone && grow > 0;
    const s = o.r * (0.3 + 0.7 * smooth(grow)) * (1 + 0.04 * Math.sin(t * 1.3 + i));
    m.scale.set(s, s * squash, s);
    m.position.set(o.p.x + 0.05 * Math.sin(t * 0.9 + i), 2.9 + (o.p.y - 2.9) * squash + 0.04 * Math.sin(t * 1.1 + i * 1.7), o.p.z);
    if (!m.visible) { P.setXYZ(2 * i + 1, 0, 2.9, -0.1); } else P.setXYZ(2 * i + 1, m.position.x, m.position.y - s * 1.15, m.position.z);
  });
  P.needsUpdate = true;
};

// ---------------- props ----------------
const jet = (s: SetBuild, key: string) => sub(s, key, (b) => { // a 1980s twin-engine airliner, nose to +x, 36 m
  const W = lam("jetW", () => ({ color: "#f4f4f2" })), Bl = C("#2a4a8a"), R = C("#c0353a"), G = C("#a8acb4");
  b.add(new THREE.CylinderGeometry(2, 2, 30, 20).rotateZ(Math.PI / 2), W);
  b.add(new THREE.SphereGeometry(2, 20, 14).scale(2.2, 1, 1).translate(15, 0, 0), W);
  b.add(new THREE.ConeGeometry(2, 7, 20).rotateZ(Math.PI / 2).translate(-18.5, 0.4, 0), W);
  b.add(boxGeo(V(-17, -0.35, -2.02), V(16, 0.05, 2.02)), Bl); // cheat line
  b.add(boxGeo(V(-17, 0.05, -2.03), V(16, 0.15, 2.03)), R);
  for (let k = 0; k < 26; k++) b.add(boxGeo(V(-12 + k, 0.55, -2.05), V(-11.65 + k, 0.85, 2.05)), C("#3a4a5a")); // windows
  b.add(boxGeo(V(18.6, 0.6, -1.1), V(19.8, 1.1, 1.1)), C("#2a3440")); // cockpit glass
  b.add(new THREE.BoxGeometry(6, 0.35, 34).translate(0, -1.0, 0).applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0, 0, 0.35, 0)), G); // wings, swept
  b.add(new THREE.BoxGeometry(3.4, 0.25, 11).translate(-19, 0.8, 0), G);
  b.add(new THREE.BoxGeometry(4.5, 7, 0.35).translate(-19, 4.2, 0).applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.45, 0, 0, 0)), Bl);
  for (const sz of [-6.5, 6.5]) { b.add(new THREE.CylinderGeometry(1.05, 0.9, 4.6, 14).rotateZ(Math.PI / 2).translate(2.5, -1.9, sz), G); b.add(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 14).rotateZ(Math.PI / 2).translate(4.85, -1.9, sz), C("#2a2e34")); }
});
const jeep = (b: Batch, x: number, z: number, ry: number) => { // an open CJ Jeep, nose to +x
  const m = M4(x, 0, z, ry, 1), Y = C("#e0b040"), D = C("#22242a");
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
const tanks = (b: Batch, x: number, z: number) => { // helium cylinders
  for (let k = 0; k < 4; k++) { const xx = x + 0.32 * k, zz = z + 0.1 * (k % 2); b.add(new THREE.CylinderGeometry(0.13, 0.13, 1.4, 14).translate(xx, 0.7, zz), C(k % 2 ? "#4a7a5a" : "#5a8a6a")); b.add(new THREE.SphereGeometry(0.13, 12, 8).translate(xx, 1.4, zz), C("#5a8a6a")); b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8).translate(xx, 1.56, zz), C("#c8ccd2")); }
};
const fence = (b: Batch, x0: number, z0: number, x1: number, z1: number, h = 1.8) => {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 0.16), W = C("#a8784a"), W2 = C("#966a40");
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u; b.add(new THREE.BoxGeometry(0.14, h + 0.05 * hh(i, 7), 0.03).translate(0, (h + 0.05 * hh(i, 7)) / 2, 0).rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate(x, 0, z), i % 2 ? W : W2); }
};
const bungalow = (b: Batch, x: number, z: number, w: number, wall: string, roofC: string, key: string, lit: THREE.Material) => {
  const d = 7, h = 3.0, m = lam("stuc" + key, () => ({ map: rep(stucco(key, wall), 2, 1) }));
  b.add(boxGeo(V(x - w / 2, 0, z - d), V(x + w / 2, h, z)), m);
  const R = lam("roofB" + roofC, () => ({ color: roofC }));
  b.add(new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4).scale(w * 0.78, 1.5, d * 0.78).translate(x, h + 0.75, z - d / 2), R);
  b.add(boxGeo(V(x - w / 2 - 0.3, h - 0.1, z - d - 0.3), V(x + w / 2 + 0.3, h + 0.05, z + 0.4)), R); // eaves
  for (const sx of [-1, 1]) { b.add(boxGeo(V(x + sx * w * 0.27 - 0.6, 1.0, z), V(x + sx * w * 0.27 + 0.6, 2.2, z + 0.03)), lit); b.add(boxGeo(V(x + sx * w * 0.27 - 0.68, 0.92, z), V(x + sx * w * 0.27 + 0.68, 1.0, z + 0.1)), C("#f4f0e6")); }
  b.add(boxGeo(V(x - 0.45, 0, z), V(x + 0.45, 2.2, z + 0.04)), C(["#2f6a8a", "#8a3a2a", "#3a6a4a"][Math.floor(hh(x, 2) * 3)]));
  b.add(boxGeo(V(x - 1.0, 0, z), V(x + 1.0, 0.15, z + 1.2)), C("#c8c4ba"));
};
const pole = (b: Batch, x: number, z: number, h = 7.6) => {
  b.add(new THREE.CylinderGeometry(0.12, 0.16, h, 10).translate(x, h / 2, z), C("#6a4a30"));
  b.add(boxGeo(V(x - 1.0, h - 0.6, z - 0.06), V(x + 1.0, h - 0.48, z + 0.06)), C("#5a3a22"));
  for (const dx of [-0.85, 0, 0.85]) b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8).translate(x + dx, h - 0.4, z), C("#2a5a7a")); // insulators
  b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 14).translate(x + 0.32, h - 1.4, z), C("#8a8e94")); // transformer
};
const wireSag = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, sag = 0.45) => {
  const n = 14; let p = a.clone();
  for (let i = 1; i <= n; i++) { const u = i / n, q2 = V(a.x + (c.x - a.x) * u, a.y + (c.y - a.y) * u - sag * 4 * u * (1 - u), a.z + (c.z - a.z) * u); b.add(beamBetween(p, q2, 0.014, 4), C("#1e1e22")); p = q2; }
};
const policeCar = (s: SetBuild, key: string) => sub(s, key, (b) => { // 1980s black-and-white, nose to +x
  const K = C("#16181c"), Wt = C("#f4f4f2");
  b.add(boxGeo(V(-2.5, 0.42, -0.95), V(2.5, 1.05, 0.95)), K);
  b.add(boxGeo(V(-0.9, 0.42, -0.96), V(1.0, 1.05, 0.96)), Wt); // white doors
  b.add(boxGeo(V(-1.3, 1.05, -0.85), V(1.0, 1.6, 0.85)), Wt);
  b.add(boxGeo(V(-1.25, 1.12, -0.86), V(0.95, 1.52, 0.86)), lam("glassP", () => ({ color: "#8aa8c0" })));
  b.add(boxGeo(V(-0.6, 1.6, -0.5), V(0.3, 1.75, 0.5)), C("#2a2a2e"));
  b.add(boxGeo(V(-0.58, 1.62, -0.48), V(-0.15, 1.78, 0.0)), lam("redL", () => ({ color: "#ff3a3a", emissive: "#ff2020", emissiveIntensity: 1.8 })));
  b.add(boxGeo(V(-0.15, 1.62, 0.0), V(0.28, 1.78, 0.48)), lam("bluL", () => ({ color: "#3a6aff", emissive: "#2050ff", emissiveIntensity: 1.8 })));
  for (const sx of [-1.6, 1.6]) for (const sz of [-0.9, 0.9]) b.add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16).rotateX(Math.PI / 2).translate(sx, 0.36, sz), C("#1a1a1e"));
  b.add(boxGeo(V(-0.6, 0.62, 0.961), V(0.6, 0.86, 0.97)), lam("polT", () => ({ map: ctex("polT", 256, 64, (g) => { g.fillStyle = "#f4f4f2"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#16181c"; g.font = "bold 40px Georgia"; g.textAlign = "center"; g.fillText("POLICE", 128, 48); }) })));
});
const fgPot = (b: Batch, x: number, z: number) => { // terracotta pot with a big agave (yard foreground)
  b.add(new THREE.CylinderGeometry(0.34, 0.24, 0.5, 14).translate(x, 0.25, z), C("#b8643a"));
  for (let k = 0; k < 9; k++) { const a = k * 0.7, L = 0.7 + 0.3 * hh(k, 1); b.add(new THREE.ConeGeometry(0.07, L, 5).translate(0, L / 2, 0).rotateZ(0.5 + 0.3 * hh(k, 2)).rotateY(a).translate(x, 0.45, z), lam("agave", () => ({ color: "#5a8a6a" }))); }
};
const bbq = (b: Batch, x: number, z: number) => {
  b.add(new THREE.SphereGeometry(0.32, 14, 10, 0, 6.3, 0, Math.PI / 2).rotateX(Math.PI).translate(x, 0.85, z), C("#1e1e22"));
  b.add(new THREE.SphereGeometry(0.32, 14, 10, 0, 6.3, 0, Math.PI / 2).translate(x, 0.86, z), C("#2a2a2e"));
  for (let k = 0; k < 3; k++) b.add(beamBetween(V(x + 0.3 * Math.cos(k * 2.1), 0, z + 0.3 * Math.sin(k * 2.1)), V(x, 0.6, z), 0.02), C("#3a3a3e"));
};

// ---------------- builders ----------------
// SKY (16,000 ft): the chair at the origin; cloud banks below and around, the hazed LA basin 1.4 km down, an airliner
const skySet = (s: SetBuild) => {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: basin(), fog: false, color: new THREE.Color(1.05, 1.05, 1.08) }));
  g.position.set(400, -1400, -1500); g.layers.set(3); s.root.add(g);
  const add = (x: number, y: number, z: number, w: number, seed: number) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudPuff(seed % 6), fog: false, depthWrite: false, color: new THREE.Color(1.04, 1.04, 1.06) }));
    m.position.set(x, y, z); m.scale.set(w, w / 2, 1); m.layers.set(3); s.root.add(m);
  };
  for (let i = 0; i < 70; i++) { const a = hh(i, 1) * Math.PI * 2, d = 120 + 900 * hh(i, 2); add(d * Math.cos(a), -260 - 180 * hh(i, 3), d * Math.sin(a) - 300, 140 + 220 * hh(i, 4), i); }
  for (let i = 0; i < 26; i++) { const a = -0.6 - 1.9 * hh(i, 5), d = 60 + 380 * hh(i, 6); add(d * Math.cos(a), -18 + 40 * hh(i, 7), d * Math.sin(a), 30 + 60 * hh(i, 8), i + 3); }
  craft(s, "craft"); jet(s, "jet");
};
// COCKPIT (an airliner flight deck): the crew face +z toward the windscreen at z 1.0; panel at z 0.7; the camera usually
// sits outside the glass so the window posts frame them (depth); POV looks out at the chair 40 m ahead
const cockpit = (s: SetBuild) => {
  const { b } = s;
  const Wl = lam("ckW", () => ({ map: rep(ckWall(), 2, 1) })), Dk = C("#2a2d33");
  b.add(plane(-1.6, 1.6, -2.4, 1.1, 1, 0), lam("ckFloor", () => ({ color: "#3a3d44" })));
  b.add(boxGeo(V(-1.6, 0, -2.4), V(1.6, 2.3, -2.3)), Wl);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx > 0 ? 1.5 : -1.6, 0, -2.4), V(sx > 0 ? 1.6 : -1.5, 2.3, 1.0)), Wl);
  b.add(new THREE.PlaneGeometry(3.2, 3.4).rotateX(Math.PI / 2 + 0.25).translate(0, 2.2, -0.7), lam("ckCeil", () => ({ map: rep(ckWall(), 2, 2), side: THREE.DoubleSide })));
  // instrument panel + glareshield + centre pedestal
  b.add(boxGeo(V(-1.5, 0, 0.62), V(1.5, 0.7, 1.0)), Dk);
  b.add(new THREE.PlaneGeometry(2.9, 0.66).translate(0, 0.36, 0.619).rotateY(Math.PI), lam("ckPanel", () => ({ map: panelTex(), side: THREE.DoubleSide })));
  b.add(boxGeo(V(-1.5, 0.7, 0.55), V(1.5, 0.78, 1.0)), C("#1e2024"));
  b.add(boxGeo(V(-0.22, 0, -0.3), V(0.22, 0.75, 0.62)), C("#30343a"));
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(-0.15 + 0.08 * k, 0.75, 0.0), V(-0.11 + 0.08 * k, 0.95, 0.06)), C(k % 2 ? "#c8ccd2" : "#2a2e34")); // throttles
  // seats (backs toward -z)
  for (const sx of [-0.62, 0.62]) { b.add(boxGeo(V(sx - 0.3, 0.35, -0.45), V(sx + 0.3, 0.5, 0.1)), C("#4a3a2e")); b.add(boxGeo(V(sx - 0.3, 0.5, -0.6), V(sx + 0.3, 1.45, -0.42)), C("#5a463a")); b.add(boxGeo(V(sx - 0.18, 1.45, -0.6), V(sx + 0.18, 1.7, -0.45)), C("#5a463a")); }
  // the nose seen from outside (the camera usually sits in front of the windscreen): white skin, a cheat line
  b.add(boxGeo(V(-1.7, -2.5, 1.0), V(1.7, 0.78, 1.35)), lam("noseW", () => ({ color: "#eef0f2" })));
  b.add(boxGeo(V(-1.71, 0.25, 1.0), V(1.71, 0.45, 1.36)), C("#2a4a8a"));
  b.add(boxGeo(V(-1.71, 0.12, 1.0), V(1.71, 0.22, 1.36)), C("#c0353a"));
  b.add(boxGeo(V(-1.7, 0.78, 1.08), V(1.7, 0.86, 1.3)), C("#24272c"));
  // windscreen frame (posts) and glass
  for (const x of [-1.5, 0, 1.5]) b.add(boxGeo(V(x - 0.05, 0.78, 1.0), V(x + 0.05, 2.05, 1.08)), C("#24272c"));
  b.add(boxGeo(V(-1.5, 1.98, 1.0), V(1.5, 2.3, 1.08)), C("#24272c"));
  b.add(new THREE.PlaneGeometry(3.0, 1.0).translate(0, 1.5, 1.04), lam("ckGlass", () => ({ color: "#cfe4f4", transparent: true, opacity: 0.08, depthWrite: false })));
  // the sky outside: cloud sprites and the chair ahead
  for (let i = 0; i < 30; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudPuff(i % 6), fog: false, depthWrite: false })); const a = -1.2 + 2.4 * hh(i, 1), d = 120 + 500 * hh(i, 2); m.position.set(d * Math.sin(a), -40 - 120 * hh(i, 3), d * Math.cos(a)); const w = 60 + 140 * hh(i, 4); m.scale.set(w, w / 2, 1); m.layers.set(3); s.root.add(m); }
  craft(s, "craft");
};
// YARD (a San Pedro back yard, July 1982): the house's back wall at z -7, wooden fences left/right, palms beyond, the Jeep
// at (3.4, -1.8), helium tanks left; the chair launches from the origin. Near-lens depth: a potted agave and a barbecue.
const yard = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-30, 30, -30, 30, 1, 0), lam("lawnY", () => ({ map: rep(lawn(), 10, 10) })));
  b.add(boxGeo(V(-9, 0, -10), V(9, 3.4, -7)), lam("stucY", () => ({ map: rep(stucco("y", "#ecd9b4"), 3, 1) })));
  b.add(new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4).scale(13.5, 1.8, 4.6).translate(0, 4.3, -8.5), lam("roofY", () => ({ color: "#b8603a" })));
  b.add(boxGeo(V(-9.5, 3.3, -10.3), V(9.5, 3.45, -6.4)), C("#a8583a"));
  b.add(boxGeo(V(-2.2, 0, -6.99), V(0.6, 2.3, -6.95)), lam("slider", () => ({ color: "#8ab0c8", emissive: "#3a5a70", emissiveIntensity: 0.2 })));
  b.add(boxGeo(V(-2.3, 0, -6.97), V(0.7, 2.4, -6.93)), C("#f4f0e6"));
  b.add(boxGeo(V(-2.2, 0, -6.92), V(0.6, 2.3, -6.9)), lam("slider", () => ({ color: "#8ab0c8", emissive: "#3a5a70", emissiveIntensity: 0.2 })));
  for (const x of [2.6, 5.6, -5.4]) { b.add(boxGeo(V(x - 0.8, 1.0, -6.99), V(x + 0.8, 2.3, -6.95)), lam("winY", () => ({ color: "#9ec0d8" }))); b.add(boxGeo(V(x - 0.9, 0.92, -6.98), V(x + 0.9, 1.0, -6.85)), C("#f4f0e6")); }
  b.add(boxGeo(V(-3.6, 0, -7), V(3.6, 0.12, -5.2)), C("#c8c0b0")); // patio
  fence(b, -9, -7, -9, 12); fence(b, 9, -7, 9, 12);
  for (const [x, z, h, sd] of [[-11.5, -9, 13, 1], [-12.5, 3, 11, 2], [11.5, -10, 14, 3], [12.6, 1, 10, 4], [-14, -14, 15, 5], [6, -15, 16, 6]] as [number, number, number, number][]) palm(b, x, z, h, sd);
  hills(b, 0, -40, 140, 14, 16, 7);
  jeep(b, 3.4, -1.8, 0.35); tanks(b, -3.2, -2.6);
  for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.22, 0.24, 0.5, 12).translate(-4.6 + 0.5 * k, 0.25, -4.4 - 0.3 * (k % 2)), C(["#e8e0cc", "#d8ccb0"][k % 2])); // balloon boxes
  sub(s, "fg", (bb) => { fgPot(bb, 0, 0); bbq(bb, 1.1, -0.3); });
  craft(s, "craft");
  // the rope from the chair to the Jeep's bumper
  sub(s, "rope", (bb) => bb.add(beamBetween(V(0.3, 0.3, 0.2), V(3.4 - 1.95 * Math.cos(0.35), 0.62, -1.8 + 1.95 * Math.sin(0.35)), 0.025, 5), C("#c8a870")));
};
// STREET (Long Beach, afternoon): road along x (z -2..4), bungalows behind lawns at z -9, palms, power poles at z -2.4 with
// three wires at ~7.1 m; the chair ends up hanging in the wires at x 0.8; a police car waits at (4.5, 2.0)
const LIT = () => lam("litWin", () => ({ color: "#ffe6a0", emissive: "#ffcf70", emissiveIntensity: 0.9 }));
const street = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-60, 60, -2, 4, 1, 0.01), lam("asph", () => ({ map: rep(asphalt(), 20, 2) })));
  for (let x = -60; x < 60; x += 3) b.add(boxGeo(V(x, 0.012, 0.96), V(x + 1.4, 0.016, 1.04)), C("#f2d24a"));
  for (const [z0, z1] of [[-2.8, -2], [4, 4.8]]) b.add(boxGeo(V(-60, 0, z0), V(60, 0.12, z1)), C("#cdc8bc"));
  b.add(plane(-60, 60, -20, -2.8, 1, 0.02), lam("lawnS", () => ({ map: rep(lawn(), 20, 4) })));
  b.add(plane(-60, 60, 4.8, 30, 1, 0.02), lam("lawnS", () => ({ map: rep(lawn(), 20, 4) })));
  const lit = LIT(); s.dyn.litMat = new THREE.Object3D(); (s.dyn.litMat as THREE.Object3D).userData.m = lit;
  const pal: [string, string][] = [["#e8d6b0", "#8a4a32"], ["#d8e4e0", "#5a5a5e"], ["#f2e2c8", "#b8603a"], ["#e0cfe0", "#6a4a3a"], ["#f4ecd8", "#8a4a32"]];
  for (let k = 0; k < 6; k++) bungalow(b, -20 + 8 * k, -9, 6.4, pal[k % 5][0], pal[k % 5][1], "s" + k, lit);
  for (let k = 0; k < 6; k++) bungalow(b, -16 + 8 * k, 15.5, 6.4, pal[(k + 2) % 5][0], pal[(k + 2) % 5][1], "n" + k, lit);
  for (const x of [-15, -4, 7, 18]) palm(b, x, -3.4, 12 + 2 * hh(x, 1), Math.round(x + 20));
  const P = [-12, 0, 12].map((x) => { pole(b, x, -2.4); return x; });
  for (const dx of [-0.85, 0, 0.85]) for (let i = 0; i < P.length - 1; i++) wireSag(b, V(P[i] + dx, 7.2, -2.4), V(P[i + 1] + dx, 7.2, -2.4), 0.35);
  for (const dx of [-0.85, 0, 0.85]) { wireSag(b, V(-40 + dx, 7.2, -2.4), V(-12 + dx, 7.2, -2.4), 0.6); wireSag(b, V(12 + dx, 7.2, -2.4), V(40 + dx, 7.2, -2.4), 0.6); }
  craft(s, "craft"); policeCar(s, "cop");
  sub(s, "fg", (bb) => { bb.add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8).translate(0, 1.2, 0), C("#4a4e54")); bb.add(boxGeo(V(-0.4, 2.1, -0.02), V(0.4, 2.5, 0.02)), lam("stopS", () => ({ map: ctex("stopS", 256, 128, (g) => { g.fillStyle = "#f4f4f2"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#2a5a3a"; g.fillRect(8, 8, 240, 112); g.fillStyle = "#fff"; g.font = "bold 46px Georgia"; g.textAlign = "center"; g.fillText("44th Way", 128, 80); }) }))); });
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { sky: skySet, cockpit, yard, street };

// three.quarks particle rigs, one per shot world (vfx.ts)
const RIGS = new WeakMap<SetBuild, VfxRig>();
const rig = (s: SetBuild, mk: () => ConstructorParameters<typeof VfxRig>[1]) => { let r = RIGS.get(s); if (!r) { r = new VfxRig(s.root, mk()); RIGS.set(s, r); } return r; };

// ---------------- motion (pure functions of t) ----------------
/** yard: the chair's height after the rope snaps (accelerating climb, ~9 m in the first second) */
export const LAUNCH = () => A(5, "launched!") - 0.08;
const climb = (t: number) => { const h = 0.3 * smooth((t - LS(5)) / 0.8), u = t - LAUNCH(); return u <= 0 ? h : h + 3.5 * u * u + 4.0 * u; };
/** shooting: number of balloons popped by time t (one per "pop" moment) */
const POP_T = () => { const o = A(7, "one"); return [A(7, "shooting") + 0.1, A(7, "balloons."), o, o + 0.45, A(7, "by"), atN(7, "one", 1)]; };
export const poppedAt = (t: number) => POP_T().filter((x) => t >= x).length;
/** street: the craft settles into the wires */
const HANG = 4.0;
const settle = (t: number) => { const a = LS(8) - 0.2, d = A(8, "power") - a + 0.3; const u = clamp01((t - a) / d); return 14 - (14 - HANG) * (1 - (1 - u) ** 3); };
/** the chair seen from the flight deck, 42 m ahead */
const ckCraft = (t: number): V3 => [3.5 + 0.4 * Math.sin(t * 0.3), 1.5 + 0.4 * Math.sin(t * 0.8), 42];
export const BLACKOUT = () => A(8, "blacked") - 0.05;

export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  sky: (s, t0, id) => {
    const t = id === 23 && t0 >= A(11, "all") - 0.1 ? t0 - (TOTAL - 1) / FPS : t0; // the loop: the end replays frame 0
    const g = s.dyn.craft, popped = id === 18 ? poppedAt(t) : id === 19 ? 6 : 0;
    g.position.set(0, 0.25 * Math.sin(t * 0.8), 0); g.rotation.set(0.02 * Math.sin(t * 0.7), 0.25 * Math.sin(t * 0.15) + (id === 19 ? 0.1 : 0), 0.03 * Math.sin(t * 0.9 + 1));
    balloons(g, t, popped);
    // the airliner: crosses behind the chair in the hook (and the loop end), banks past on shots 4 and 16
    const j = s.dyn.jet;
    const T0 = SHOTS[id - 1].a / FPS, lt = id === 23 && t0 >= A(11, "all") - 0.1 ? t : t - T0;
    if (id === 1 || id === 23) { j.position.set(-16 + 6 * lt, 9, -55); j.rotation.set(0.05, 0.12, 0.04); }
    else if (id === 4) { j.position.set(-110 + 14 * lt, -70, -220); j.rotation.set(0.1, 0.3, 0.05); }
    else if (id === 16) { j.position.set(-120 + 18 * lt, -45, -170); j.rotation.set(-0.12, 0.2, 0.08); }
    else j.position.set(0, -5000, 0);
    if (id === 18) rig(s, () => popBursts(POP_T(), (k) => { const o = BAL[POPS[k]].p; return [o.x, o.y + 0.25 * Math.sin(1), o.z]; })).step(t);
  },
  cockpit: (s, t, id) => {
    const g = s.dyn.craft; g.position.set(...ckCraft(t)); g.rotation.set(0, 0.3, 0);
    balloons(g, t, 0); void id;
  },
  yard: (s, t, id) => {
    const g = s.dyn.craft, golden = SHOTS[id - 1].light === "golden";
    const infl = id < 8 ? 0 : id === 8 ? clamp01((t - A(2, "42") + 0.1) / 1.2) : 1;
    g.visible = id >= 7;
    const up = id === 14 ? climb(t) : 0;
    g.position.set(0, up, 0); g.rotation.set(0, 0, up > 0 ? 0.04 * Math.sin(t * 6) * Math.exp(-0.5 * (t - LAUNCH())) : 0);
    balloons(g, t, 0, golden ? 0 : infl);
    if (golden) for (const n of ["bal", "str", "teth"]) g.getObjectByName(n)!.visible = false;
    s.dyn.rope.visible = id >= 12 && id <= 14 && !(id >= 13 && t >= A(4, "snapped") - 0.03) && !golden;
    s.dyn.fg.position.set(-4.2, 0, -3.6);
    if (id === 14 || id === 13) rig(s, () => launchDust(LAUNCH(), A(4, "snapped"))).step(t);
  },
  street: (s, t, id) => {
    const g = s.dyn.craft, y = id === 20 ? settle(t) : HANG;
    g.position.set(3.5, y, -2.4); g.rotation.set(0.06, 0.4, id === 20 ? 0.12 * Math.sin(t * 3) * Math.exp(-(t - A(8, "power"))) : 0.08);
    balloons(g, t, 6, 1, 0.82);
    const off = t >= BLACKOUT(), m = (s.dyn.litMat as THREE.Object3D).userData.m as THREE.MeshLambertMaterial;
    m.emissiveIntensity = off ? 0 : 0.9; m.color.set(off ? "#3a4048" : "#ffe6a0");
    s.dyn.cop.position.set(7.2, 0, 2.2); s.dyn.cop.rotation.y = Math.PI + 0.15; s.dyn.cop.visible = id === 21;
    s.dyn.fg.position.set(-1.6, 0, 5.2);
    if (id === 20) rig(s, () => sparks(A(8, "power"), BLACKOUT(), [3.5, 6.95, -2.4], [0.32, 6.2, -2.4])).step(t);
  },
};

// ---------------- cast ----------------
const LARRY: Outfit = { jacket: "#7aa6d6", pants: "#3a4a6a", boots: "#5a3a22", hat: "cap", cap: "#c0353a", skin: SKINS[0], hair: "#4a3020", buttons: "#f4f0e6", moustache: "#4a3020" } as Outfit;
const FRIEND = (v: number): Outfit => ({ jacket: ["#e8a04a", "#7ac08a", "#e86a7a"][v % 3], pants: ["#4a4a6a", "#5a4a3a", "#3a4a6a"][v % 3], boots: INK, hat: "hair", hair: ["#8a5a2a", "#2a1e14", "#c89a4a"][v % 3], skin: SKINS[(v + 1) % 3] } as Outfit);
const PILOT = (v: number): Outfit => ({ jacket: "#1e2a44", pants: "#1e2a44", boots: INK, hat: "peaked", cap: "#1e2a44", hatCol: "#1e2a44", buttons: "#e8c45a", stripes: "#e8c45a", moustache: v ? "#5a3a22" : undefined, skin: SKINS[v % 3] } as Outfit);
const COP = (v: number): Outfit => ({ jacket: "#2a3a5a", pants: "#2a3a5a", boots: INK, hat: "peaked", cap: "#1e2a44", hatCol: "#1e2a44", buttons: "#e8c45a", belt: "#1e1e22", skin: SKINS[(v + 2) % 3] } as Outfit);

// ---------------- effect drawings ----------------
const fxAlt = (p: Pen, v: number) => { // altimeter, 400 x 400
  p.ell(200, 200, 180, 180, "#2a2e34", 10); p.ell(200, 200, 150, 150, "#15171b", 6);
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2; txt(p, String(k), 200 + 118 * Math.cos(a), 212 + 118 * Math.sin(a), 34, "#f4f4ea"); }
  const a = -Math.PI / 2 + (v / 1000 % 10) / 10 * Math.PI * 2; p.stroke([[200, 200], [200 + 100 * Math.cos(a), 200 + 100 * Math.sin(a)]], 14, "#f4f4ea");
  const b2 = -Math.PI / 2 + (v / 10000) / 10 * Math.PI * 2; p.stroke([[200, 200], [200 + 60 * Math.cos(b2), 200 + 60 * Math.sin(b2)]], 20, "#ffb84a");
  p.ell(200, 200, 14, 14, "#c8ccd2", 4);
  p.poly(rrect(110, 268, 290, 318, 8), "#f4f4ea", 4); txt(p, `${Math.round(v).toLocaleString("en-US")} FT`, 200, 304, 32, "#15171b");
};
const fxTag = (p: Pen) => { // Sears price tag, 500 x 300
  p.poly([[40, 40], [400, 40], [470, 150], [400, 260], [40, 260]], "#fbf8ee", 9); p.ell(420, 150, 18, 18, "#d8d0c0", 5);
  txt(p, "SEARS", 210, 120, 82, "#1e4a8a", "900", "center", "Georgia, serif"); txt(p, "LAWN CHAIR", 210, 175, 40, "#2a2010"); txt(p, "$ 25.99", 210, 232, 46, "#c0353a");
};
const fxEye = (p: Pen) => { // eye chart with a red stamp, 400 x 520
  p.poly(rrect(20, 20, 380, 500, 10), "#fbf8ee", 9);
  const rows = ["E", "F P", "T O Z", "L P E D", "P E C F D"]; rows.forEach((r, i) => txt(p, r, 200, 110 + 82 * i, 86 - 14 * i, "#1e1a16", "900", "center", "Georgia, serif"));
};
const fxItem = (p: Pen, k: number) => { // 300 x 300 packing-list items
  if (k === 0) { p.poly([[40, 170], [150, 80], [260, 170]], "#e8c88a", 9); p.poly([[40, 170], [260, 170], [258, 200], [42, 200]], "#7ac05a", 6); p.poly([[42, 200], [258, 200], [150, 120]], "#c0353a", 0); p.poly([[40, 210], [260, 210], [150, 130]], "#e8c88a", 9); }
  else if (k === 1) { p.poly([[120, 40], [180, 40], [184, 90], [210, 140], [205, 270], [95, 270], [90, 140], [116, 90]], "#7a2a1e", 9); p.poly(rrect(92, 150, 208, 210, 4), "#e8262f", 4); txt(p, "Cola", 150, 192, 34, "#ffffff", "italic 900", "center", "Georgia, serif"); p.poly(rrect(118, 26, 182, 44, 4), "#c8262a", 5); }
  else if (k === 2) { p.poly(rrect(95, 60, 205, 270, 18), "#d8a040", 9); p.poly(rrect(95, 60, 205, 90, 10), "#c8ccd2", 6); p.poly(rrect(105, 140, 195, 210, 6), "#fbf8ee", 4); txt(p, "BEER", 150, 186, 30, "#8a3a1e"); }
  else { p.poly([[30, 150], [60, 70], [150, 40], [240, 70], [270, 150]], "#e8423a", 9); for (const x of [90, 150, 210]) p.stroke([[x, 150], [x + (150 - x) * 0.1, 60]], 5, INK); for (const x of [30, 90, 150, 210, 270]) p.stroke([[x, 150], [150, 260]], 4, INK); p.ell(150, 262, 18, 14, "#3a4a6a", 5); }
};
const fxPlan = (p: Pen, u: number) => { // the plan: San Pedro to the Mojave, 600 x 640
  p.poly(rrect(14, 14, 586, 626, 14), "#efe2c0", 10);
  p.poly([[14, 360], [140, 380], [220, 450], [300, 520], [360, 626], [14, 626]], "#8fc0d8", 5);
  txt(p, "PACIFIC", 110, 540, 30, "#2a5a7a");
  for (let k = 0; k < 6; k++) { const x = 330 + 50 * (k % 3), y = 150 + 50 * Math.floor(k / 3); p.stroke([[x, y + 40], [x, y]], 9, "#4a8a4a"); p.stroke([[x - 14, y + 16], [x - 14, y + 4]], 6, "#4a8a4a"); p.stroke([[x + 14, y + 22], [x + 14, y + 8]], 6, "#4a8a4a"); }
  txt(p, "MOJAVE DESERT", 390, 100, 42, "#7a4a1e", "900", "center", "Georgia, serif");
  p.dot(250, 470, 14, "#c0353a"); txt(p, "SAN PEDRO", 250, 520, 30, "#2a2010");
  const pts: P2[] = []; for (let i = 0; i <= 24; i++) { const v = i / 24; if (v > u) break; pts.push([250 + 140 * v - 60 * Math.sin(Math.PI * v), 470 - 260 * v]); }
  for (let i = 0; i + 1 < pts.length; i += 2) p.stroke([pts[i], pts[i + 1]], 9, "#2a2010");
  txt(p, "THE PLAN", 300, 600, 48, "#1e1a16", "900", "center", "Georgia, serif");
};
const fxQuote = (p: Pen) => { // 700 x 420
  p.poly(rrect(14, 14, 686, 406, 16), "#fbf6e6", 10);
  txt(p, "“A man can't just", 350, 150, 62, "#1e1a16", "italic 700", "center", "Georgia, serif");
  txt(p, "sit around.”", 350, 236, 62, "#1e1a16", "italic 700", "center", "Georgia, serif");
  txt(p, "— Larry Walters, 1982", 350, 340, 36, "#8a3a1e", "700", "center", "Georgia, serif");
};
const fxFine = (p: Pen, st: number) => fxDoc(p, "FEDERAL AVIATION ADMIN.", ["Re: Mr. L. Walters", "Aircraft: one lawn chair", "Penalty:"], "$1,500 FINE", st);
const fxCount = (p: Pen, n: number) => { p.poly(rrect(20, 20, 380, 220, 30), "#fff3b0", 10); txt(p, `${n}`, 200, 150, 140, "#e8423a"); };

// ---------------- casting helpers ----------------
type StageFn = (c: Ctx) => void;
const TQ = (t: number) => Math.floor(t * 15) / 15;
/** Larry in the chair: the chair seat is at craft-local y 0.45 */
const LS_Y = 0.38;
const larrySeat = (c: Ctx, cx: number, cy: number, cz: number, fo: FrontOpts & Act = {}) => pose(c, 1, LARRY, "larry", cx, cz + 0.05, { mode: "sit", expr: "grin", look: 0.1, ...fo }, 1, cy + LS_Y, false);
const larry = (c: Ctx, x: number, z: number, fo: FrontOpts & Act = {}) => pose(c, 1, LARRY, "larry", x, z, { mode: "stand", expr: "grin", look: 0.1, ...fo });
const skyHook = (c: Ctx) => {
  const g = c.t; void g;
  larrySeat(c, 0, 0.25 * Math.sin(c.t * 0.8), 0, { expr: "whistle", look: -0.3, prop: "glass" });
};

// ---------------- staging ----------------
export const STAGE: Record<number, StageFn> = {
  // 1 In 1982, airline pilots near L.A. reported something insane.   (hook: the chair at altitude, an airliner behind)
  1: (c) => { skyHook(c); if (after(c.t, A(0, "1982"))) stay(c, A(0, "1982"), "cal82", 300, 340, (p) => fxCal(p, "1982", true), [-0.6, 2.2, 0.8], 0.5, 0.56, -0.06); },
  // 2 cockpit: the crew stare out of the windscreen
  2: (c) => {
    const t = c.t, r = A(0, "insane.");
    if (t >= r - 0.1) { const k = ckCraft(t); larrySeat(c, k[0], k[1], k[2], { expr: "grin", look: 0, prop: "glass" }); return; } // POV: crew behind the lens
    pose(c, 2, PILOT(0), "pilot0", -0.62, -0.15, { mode: "sit", expr: t > r - 0.3 ? "shock" : "neutral", look: 0.3 }, 1, 0.42, false);
    pose(c, 3, PILOT(1), "pilot1", 0.62, -0.15, { mode: "sit", expr: t > r - 0.1 ? "awe" : "neutral", look: -0.3, prop: t > r ? "handsUp" : null }, 1, 0.42, false);
    if (after(t, r)) sayB(c, r, "Is that a... chair?!", [0.0, 1.95, 0.4], 1.1, 1.4);
    const k = ckCraft(t); larrySeat(c, k[0], k[1], k[2], { expr: "grin", look: 0, prop: "glass" });
  },
  // 3 A man... in a lawn chair...
  3: (c) => { larrySeat(c, 0, 0.25 * Math.sin(c.t * 0.8), 0, { expr: "smile", look: 0.4, prop: "glass" }); },
  // 4 ...at 16,000 feet (pull back: ground far below)
  4: (c) => {
    const t = c.t;
    larrySeat(c, 0, 0.25 * Math.sin(t * 0.8), 0, { expr: "grin", look: -0.2 });
      },
  // 5 His name was Larry Walters, a truck driver who dreamed of flying for 20 years.
  5: (c) => {
    const t = c.t;
    larry(c, -0.2, 0.4, { expr: "grin", look: 0.3, lean: 0 });
    pose(c, 2, FRIEND(0), "fr0", -2.9, -1.4, { mode: "stand", expr: "smile", look: 0.4 });
    if (after(t, A(1, "larry"))) banner(c, A(1, "larry"), "LARRY WALTERS", [-0.2, 2.45, 0.6], 1.5, "#2a4a8a", 2.2);
    if (after(t, A(1, "truck"))) word(c, A(1, "truck"), "TRUCK DRIVER", [0.35, 1.95, 1.0], 1.0, 1.2, "#fff3b0");
    if (after(t, A(1, "dreamed"))) stay(c, A(1, "dreamed"), "thinkP", 400, 420, (p) => { fxThink(p, 9); fxPlane(scalePen(p, 0.55, 80, 120)); }, [0.45, 2.2, 0.7], 0.8, 0.84, 0.04);
  },
  // 6 But his eyesight was too bad to become a pilot.
  6: (c) => {
    const t = c.t, e = A(1, "eyesight"), pl = A(1, "pilot.");
    larry(c, -0.2, 0.4, { expr: t > pl ? "sad" : "nervous", look: 0.4, lean: -0.05 });
    if (after(t, e)) stay(c, e, "eyeC", 400, 520, fxEye, [0.5, 1.75, 0.6], 0.62, 0.8, 0.05);
    if (after(t, pl)) stay(c, pl, "eyeX", 300, 300, fxX, [0.5, 1.75, 0.7], 0.6, 0.6, 0);
  },
  // 7 So Larry bought a lawn chair from Sears...
  7: (c) => {
    const t = c.t;
    larry(c, -0.8, 0.7, { expr: "grin", look: 0.6, prop: "point" as FrontOpts["prop"] });
    if (after(t, A(2, "sears..."))) stay(c, A(2, "sears..."), "tag", 500, 300, fxTag, [0.85, 1.35, 0.5], 0.8, 0.48, -0.08);
  },
  // 8 ...and 42 weather balloons.
  8: (c) => {
    const t = c.t, a0 = A(2, "42");
    larry(c, -1.6, 0.9, { expr: "laugh", look: 0.5, prop: "handsUp" });
    pose(c, 2, FRIEND(1), "fr1", 2.0, 0.3, { mode: "stand", expr: "awe", look: -0.5 });
    if (after(t, a0)) stay(c, a0, "cnt" + Math.min(42, Math.round(42 * clamp01((t - a0 + 0.1) / 1.2))), 400, 240, (p) => fxCount(p, Math.min(42, Math.round(42 * clamp01((t - a0 + 0.1) / 1.2)))), [0.3, 1.9, 3.0], 1.0, 0.6, 0.04);
  },
  // 9 Eight feet each. Filled with helium.
  9: (c) => {
    const t = c.t;
    larry(c, 1.25, 0.6, { expr: "grin", look: -0.5, prop: "point" as FrontOpts["prop"] });
    if (after(t, A(2, "eight"))) word(c, A(2, "eight"), "8 FT EACH", [0.7, 2.9, 1.6], 1.3, 1.1, "#fff3b0");
    if (after(t, A(2, "helium."))) word(c, A(2, "helium."), "HELIUM", [0.5, 2.2, 1.8], 1.1, 1.0, "#c8f0ff");
  },
  // 10 He packed sandwiches, Coca-Cola, beer, a parachute...
  10: (c) => {
    const t = c.t;
    larrySeat(c, 0, 0, 0, { expr: "grin", look: 0.3 });
    const ks: [string, number][] = [["sandwiches,", 0], ["cocacola,", 1], ["beer,", 2], ["parachute...", 3]];
    ks.forEach(([w, k], i) => { if (after(t, A(3, w))) stay(c, A(3, w), "item" + k, 300, 300, (p) => fxItem(p, k), [[-0.48, 1.3, 0.9], [-0.42, 1.92, 0.9], [0.42, 1.92, 0.9], [0.48, 1.3, 0.9]][i] as V3, 0.36, 0.36, 0.08 * (i % 2 ? 1 : -1)); });
  },
  // 11 ...and a pellet gun, to pop balloons when he wanted to come down.
  11: (c) => {
    const t = c.t;
    larrySeat(c, 0, 0, 0, { expr: "smug", look: 0.2, prop: "rifleH" });
    if (after(t, A(3, "pellet"))) word(c, A(3, "pellet"), "PELLET GUN", [0.0, 2.2, 0.8], 0.9, 1.0, "#fff3b0");
    if (after(t, A(3, "pop"))) word(c, A(3, "pop"), "FOR POPPING BALLOONS", [0.0, 2.2, 0.9], 1.05, 1.4, "#ffd0c0");
  },
  // 12 The plan? Float gently over the Mojave Desert.
  12: (c) => {
    const t = c.t, p0 = A(4, "plan?");
    larrySeat(c, 0, 0, 0, { expr: "relief", look: -0.2, prop: "glass" });
    if (after(t, p0)) stay(c, p0, "plan" + Math.round(20 * clamp01((t - p0) / 2.2)), 600, 640, (p) => fxPlan(p, clamp01((t - p0) / 2.2)), [-0.05, 1.93, 0.9], 0.58, 0.62, -0.04);
  },
  // 13 But the rope tying him to his Jeep snapped early.
  13: (c) => {
    const t = c.t, sn = A(4, "snapped");
    larrySeat(c, 0, 0, 0, { expr: t > sn ? "shock" : "neutral", look: 0.4 });
    if (after(t, sn)) word(c, sn, "SNAP!", [1.0, 1.0, -0.4], 0.8, 0.8, "#ffd0c0");
  },
  // 14 Larry didn't float. He launched!
  14: (c) => {
    const t = c.t, y = climb(t);
    larrySeat(c, 0, y, 0, { expr: y > 0.5 ? "shock" : "nervous", look: 0.2, prop: y > 1 ? "handsUp" : null });
    pose(c, 2, FRIEND(0), "fr0", -2.6, 1.2, { mode: "stand", expr: "shock", look: 0.5, prop: "handsUp" });
    pose(c, 3, FRIEND(1), "fr1", 2.4, 0.8, { mode: "stand", expr: "awe", look: -0.5 });
  },
  // 15 16,000 feet. In a lawn chair.   (deadpan)
  15: (c) => {
    const t = c.t, a0 = A(5, "16000");
    larrySeat(c, 0, 0.25 * Math.sin(t * 0.8), 0, { expr: "dazed", look: 0.0 });
    void a0;
  },
  // 16 He drifted into the airspace near Long Beach Airport...
  16: (c) => {
    const t = c.t;
    larrySeat(c, 0, 0.25 * Math.sin(t * 0.8), 0, { expr: "nervous", look: -0.5 });
    if (after(t, A(6, "long"))) banner(c, A(6, "long"), "LONG BEACH AIRPORT", [2.2, 3.15, 5.2], 1.05, "#c0353a", 2.0);
  },
  // 17 ...where a TWA pilot and a Delta pilot both reported him.
  17: (c) => {
    const t = c.t;
    pose(c, 2, PILOT(0), "pilot0", -0.62, -0.15, { mode: "sit", expr: "shock", look: 0.3, prop: "point" as FrontOpts["prop"] }, 1, 0.42, false);
    pose(c, 3, PILOT(1), "pilot1", 0.62, -0.15, { mode: "sit", expr: "awe", look: -0.3 }, 1, 0.42, false);
    if (after(t, A(6, "twa"))) banner(c, A(6, "twa"), "TWA", [-0.55, 1.62, 1.25], 0.5, "#c0353a", 1.6);
    if (after(t, A(6, "delta"))) banner(c, A(6, "delta"), "DELTA", [0.55, 1.62, 1.25], 0.55, "#2a4a8a", 1.6);
    if (after(t, A(6, "reported"))) sayB(c, A(6, "reported"), "Tower... a man in a lawn chair!", [0.0, 1.75, 1.3], 1.0, 1.4);
    const k = ckCraft(t); larrySeat(c, k[0], k[1], k[2], { expr: "nervous", look: 0 });
  },
  // 18 Up there, Larry finally started shooting his balloons. One... by one.
  18: (c) => {
    const t = c.t, P = POP_T();
    larrySeat(c, 0, 0.25 * Math.sin(t * 0.8), 0, { expr: t > P[0] ? "stern" : "nervous", look: 0.0, prop: "rifleH" });
    P.forEach((x, k) => { if (after(t, x) && t < x + 0.6) { const o = BAL[POPS[k]].p; word(c, x, "POP!", [o.x * 0.6, Math.min(o.y, 4.8), o.z + 1.0], 0.7, 0.5, "#fff3b0"); } });
  },
  // 19 Then he dropped the gun overboard.
  19: (c) => {
    const t = c.t, d0 = A(7, "dropped");
    larrySeat(c, 0, 0.25 * Math.sin(t * 0.8), 0, { expr: t > d0 + 0.2 ? "shock" : "stern", look: 0.3, prop: t < d0 ? "rifleH" : "handsUp" });
    if (t > d0 - LEAD) { const u = Math.max(0, t - d0); stay(c, d0, "gunF", 600, 200, fxGun, [0.45 + 0.25 * u, 0.75 - 2.6 * u * u - 0.6 * u, 0.5], 0.7, 0.23, 0.6 + 3 * u); }
    if (after(t, A(7, "overboard."))) word(c, A(7, "overboard."), "OOPS.", [-0.35, 1.05, 0.8], 0.8, 1.0, "#ffd0c0");
  },
  // 20 He came down anyway, right into power lines, and blacked out a Long Beach neighborhood for 20 minutes.
  20: (c) => {
    const t = c.t, y = settle(t);
    larrySeat(c, 3.5, y, -2.4, { expr: t > A(8, "power") ? "shock" : "nervous", look: 0.2, prop: t > A(8, "power") ? "handsUp" : null });
    if (after(t, A(8, "power"))) word(c, A(8, "power"), "ZZZAP!", [4.4, 5.9, 3.0], 1.0, 0.9, "#c8f0ff");
  },
  // 21 Police were waiting. The FAA fined him $1,500.
  21: (c) => {
    const t = c.t;
    larrySeat(c, 3.5, HANG, -2.4, { expr: "innocent", look: 0.0 });
    pose(c, 2, COP(0), "cop0", 2.3, 0.4, { mode: "stand", expr: "stern", look: -0.5, prop: "point" as FrontOpts["prop"] });
    pose(c, 3, COP(1), "cop1", 4.7, 0.9, { mode: "stand", expr: "smug", look: -0.6 });
    if (after(t, A(9, "faa"))) stay(c, A(9, "faa"), "fine" + Math.round(4 * clamp01((t - A(9, "1500")) * 4)), 500, 360, (p) => fxFine(p, Math.round(4 * clamp01((t - A(9, "1500")) * 4)) / 4), [3.6, 2.9, 0.6], 1.3, 0.94, -0.04);
  },
  // 22 Asked why he did it, Larry said: a man can't just sit around.   (golden, quiet)
  22: (c) => {
    const t = c.t;
    larrySeat(c, 0, 0, 0, { expr: t > A(10, "sit") ? "smile_closed" : "smile", look: 0.3 });
    if (after(t, A(10, "man"))) stay(c, A(10, "man"), "quote", 700, 420, fxQuote, [0.0, 1.98, 0.9], 1.1, 0.66, 0);
  },
  // 23 Send this to the friend who just sits around all weekend.   (ends on shot 1's frame: loop)
  23: (c) => {
    const t = c.t, c0 = { ...c, t: c.t - (TOTAL - 1) / FPS };
    if (t >= A(11, "all") - 0.1) { STAGE[1](c0); return; }
    larrySeat(c, 0, 0.25 * Math.sin(t * 0.8), 0, { expr: "laugh", look: -0.3, prop: "glass" });
    if (after(t, A(11, "send"))) banner(c, A(11, "send"), "SEND THIS TO THEM", [0.0, 2.3, 0.6], 1.5, "#e07a1a", 2.0);
  },
};
const fxGun = (p: Pen) => { p.band([[40, 110], [420, 90]], "#5a3a22", 30, 8, "round"); p.band([[380, 92], [580, 84]], "#2a2e34", 16, 6, "round"); p.poly([[120, 110], [170, 110], [150, 170], [110, 170]], "#4a2e1a", 7); };
/** draw into a sub-rectangle: returns a Pen whose drawing is scaled by k and offset (ox, oy) */
const scalePen = (p: Pen, k: number, ox: number, oy: number) => { p.g.translate(ox, oy); p.g.scale(k, k); return p; };
const T0s = (id: number) => SHOTS[id - 1].a / FPS;
void fxConfetti; void fxBanner; void confetti; void LS; void ramp; void fxPuff; void beast; void lineStart; void atN; void fxScore; void jolt; void hop; void pop; void flag; void waveFlags; void quad; void tri; void fxWord; void sway; void blob; void lidAt; void q; void tier; void person; void LEAD; void at; void TQ; void T0s; void rep; void ctex; void M4; void plane; void hills;
