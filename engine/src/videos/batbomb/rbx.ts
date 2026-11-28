// Blocky "brick-game" avatars (classic six-part build: rounded cylinder head with a painted face decal, 2x2x1 torso,
// 1x2x1 arms and legs on shoulder/hip pivots) plus a blocky tuxedo cat and blocky rats. Real 3D meshes, posed per frame.
// Original designs: generic block-avatar style, no game logos or branded items.
import * as THREE from "three";
import { lam } from "./build";
import { ctex } from "./paint";

export const U = 0.33; // one stud: the avatar stands 5.2 studs = 1.72 m
const C = (col: string) => lam("rb" + col, () => ({ color: col }));
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
/** classic head: a cylinder with rounded top/bottom edges (lathe profile) */
const HEAD = (() => {
  const r = 0.62 * U, h = 1.18 * U, e = 0.18 * U, pts: THREE.Vector2[] = [new THREE.Vector2(0, -h / 2)];
  for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + (k / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(r - e + e * Math.cos(a), -h / 2 + e + e * Math.sin(a))); }
  for (let k = 0; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(r - e + e * Math.cos(a), h / 2 - e + e * Math.sin(a))); }
  pts.push(new THREE.Vector2(0, h / 2));
  return new THREE.LatheGeometry(pts, 28);
})();

export type RFace = "smile" | "grin" | "shock" | "sad" | "worry" | "determined" | "sleep" | "laugh" | "flat";
const faceTex = (f: RFace) => ctex("rface" + f, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.fillStyle = "#141414"; g.strokeStyle = "#141414"; g.lineCap = "round";
  const eye = (x: number, y: number, rx: number, ry: number) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.3); g.fill(); };
  if (f === "sleep") { g.lineWidth = 9; for (const x of [88, 168]) { g.beginPath(); g.arc(x, 104, 18, 0.2, Math.PI - 0.2); g.stroke(); } }
  else if (f === "laugh") { g.lineWidth = 9; for (const x of [88, 168]) { g.beginPath(); g.arc(x, 112, 18, Math.PI + 0.3, -0.3); g.stroke(); } }
  else if (f === "flat") { g.lineWidth = 9; for (const x of [88, 168]) { g.beginPath(); g.moveTo(x - 18, 104); g.lineTo(x + 18, 104); g.stroke(); } }
  else { const big = f === "shock"; eye(88, 100, big ? 16 : 12, big ? 22 : 18); eye(168, 100, big ? 16 : 12, big ? 22 : 18); }
  g.lineWidth = 8;
  if (f === "determined") { g.beginPath(); g.moveTo(66, 70); g.lineTo(108, 82); g.moveTo(190, 70); g.lineTo(148, 82); g.stroke(); }
  if (f === "worry" || f === "sad") { g.beginPath(); g.moveTo(66, 80); g.lineTo(106, 68); g.moveTo(190, 80); g.lineTo(150, 68); g.stroke(); }
  g.lineWidth = 9;
  if (f === "smile" || f === "determined") { g.beginPath(); g.arc(128, 132, 44, 0.35, Math.PI - 0.35); g.stroke(); }
  else if (f === "grin" || f === "laugh") { g.beginPath(); g.moveTo(80, 150); g.quadraticCurveTo(128, 222, 176, 150); g.closePath(); g.fill(); g.fillStyle = "#ffffff"; g.fillRect(96, 152, 64, 12); }
  else if (f === "shock") { g.beginPath(); g.ellipse(128, 176, 18, 24, 0, 0, 6.3); g.fill(); }
  else if (f === "sad") { g.beginPath(); g.arc(128, 196, 40, Math.PI + 0.5, -0.5); g.stroke(); }
  else if (f === "worry") { g.beginPath(); g.moveTo(92, 180); g.quadraticCurveTo(110, 166, 128, 180); g.quadraticCurveTo(146, 194, 164, 180); g.stroke(); }
  else if (f === "sleep" || f === "flat") { g.beginPath(); g.moveTo(104, 176); g.lineTo(152, 176); g.stroke(); }
});
const faceMat = new Map<RFace, THREE.Material>();
const FM = (f: RFace) => { let m = faceMat.get(f); if (!m) { m = new THREE.MeshBasicMaterial({ map: faceTex(f), transparent: true, depthWrite: false }); faceMat.set(f, m); } return m; };

export type RShirt = "sailor" | "officer" | "admiral" | "plain" | "coat" | "army";
const shirtTex = (kind: RShirt, col: string) => ctex("rshirt" + kind + col, 256, 256, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  if (kind === "sailor") {
    g.fillStyle = "#f4f4f0"; g.beginPath(); g.moveTo(60, 0); g.lineTo(128, 110); g.lineTo(196, 0); g.closePath(); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(84, 0); g.lineTo(128, 78); g.lineTo(172, 0); g.closePath(); g.fill();
    g.fillStyle = "#151515"; g.beginPath(); g.moveTo(104, 96); g.lineTo(152, 96); g.lineTo(128, 150); g.closePath(); g.fill();
  } else if (kind === "officer" || kind === "admiral") {
    g.fillStyle = "#f4f4f0"; g.beginPath(); g.moveTo(96, 0); g.lineTo(128, 70); g.lineTo(160, 0); g.closePath(); g.fill();
    g.fillStyle = "#151515"; g.fillRect(122, 10, 12, 60);
    g.fillStyle = "#e8c04a"; for (const y of [110, 160, 210]) for (const x of [100, 156]) { g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.fill(); }
    if (kind === "admiral") { g.fillStyle = "#c0353a"; g.fillRect(40, 96, 40, 10); g.fillStyle = "#2a6aaa"; g.fillRect(40, 108, 40, 10); g.fillStyle = "#e8c04a"; g.fillRect(40, 120, 40, 10); }
  }
  if (kind === "coat") { // dentist's white coat over a shirt and tie
    g.fillStyle = "#7aa8d8"; g.beginPath(); g.moveTo(92, 0); g.lineTo(128, 90); g.lineTo(164, 0); g.closePath(); g.fill();
    g.fillStyle = "#8a2a3a"; g.beginPath(); g.moveTo(120, 10); g.lineTo(136, 10); g.lineTo(140, 110); g.lineTo(128, 130); g.lineTo(116, 110); g.closePath(); g.fill();
    g.strokeStyle = "#c8ccd0"; g.lineWidth = 6; g.beginPath(); g.moveTo(92, 0); g.lineTo(128, 150); g.lineTo(128, 256); g.moveTo(164, 0); g.lineTo(128, 150); g.stroke();
    g.fillStyle = "#c8ccd0"; g.fillRect(40, 150, 50, 6); g.fillStyle = "#3a6ac8"; g.fillRect(56, 132, 6, 22); g.fillStyle = "#c0353a"; g.fillRect(66, 136, 6, 18);
  }
  if (kind === "army") { // olive service coat: open collar, tie, brass buttons, pockets
    g.fillStyle = "#d8c8a0"; g.beginPath(); g.moveTo(96, 0); g.lineTo(128, 70); g.lineTo(160, 0); g.closePath(); g.fill();
    g.fillStyle = "#4a4028"; g.fillRect(122, 8, 12, 60);
    g.fillStyle = "#e8c04a"; for (const y of [110, 160, 210]) { g.beginPath(); g.arc(128, y, 8, 0, 6.3); g.fill(); }
    g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 5; g.strokeRect(40, 100, 52, 44); g.strokeRect(164, 100, 52, 44);
  }
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 226, 256, 30);
});

export type RLook = { shirt: string; pants: string; skin?: string; kind?: RShirt; hat?: "sailor" | "officer" | "army" | "none"; hair?: string; glasses?: boolean; tie?: boolean; soot?: boolean };
export type RPose = { walk?: number; stride?: number; armL?: number; armR?: number; armLz?: number; armRz?: number; legL?: number; legR?: number;
  face?: RFace; head?: number; tilt?: number; nod?: number; sit?: boolean; lift?: number; lean?: number };

/** one avatar = a group you place in the world; pose() sets limb angles and the face each frame */
export class Avatar {
  g = new THREE.Group(); hips = new THREE.Group(); head = new THREE.Group(); face: THREE.Mesh;
  arms: THREE.Group[] = []; legs: THREE.Group[] = [];
  constructor(look: RLook) {
    const skin = look.skin ?? "#f2c879", kind = look.kind ?? "plain";
    this.g.add(this.hips); this.hips.position.y = 2 * U;
    const torso = new THREE.Mesh(box(2 * U, 2 * U, 1 * U), [C(look.shirt), C(look.shirt), C(look.shirt), C(look.shirt), lam("rbs" + kind + look.shirt, () => ({ map: shirtTex(kind, look.shirt) })), C(look.shirt)]);
    torso.position.y = 1 * U; this.hips.add(torso);
    this.head.position.y = 2.62 * U; this.hips.add(this.head);
    this.head.add(new THREE.Mesh(HEAD, C(skin)));
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(1.0 * U, 1.0 * U), FM("smile")); this.face.position.set(0, -0.02 * U, 0.625 * U); this.face.renderOrder = 2; this.head.add(this.face);
    if (look.hair) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.64 * U, 0.64 * U, 0.35 * U, 28, 1, false, Math.PI * 0.75, Math.PI * 1.5), C(look.hair)); h.position.y = 0.45 * U; this.head.add(h); }
    if (look.glasses) {
      const G = C("#1a1a1a");
      for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.17 * U, 0.03 * U, 6, 18), G); r.position.set(0.24 * U * sx, 0.06 * U, 0.64 * U); this.head.add(r); }
      const br = new THREE.Mesh(box(0.14 * U, 0.04 * U, 0.04 * U), G); br.position.set(0, 0.08 * U, 0.64 * U); this.head.add(br);
    }
    if (look.soot) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.1 * U, 0.5 * U), lam("soot", () => ({ map: ctex("soot", 128, 64, (g, r) => { g.clearRect(0, 0, 128, 64); for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(30,26,24,0.55)"; g.beginPath(); g.arc(128 * r(), 64 * r(), 4 + 8 * r(), 0, 6.3); g.fill(); } }), transparent: true, depthWrite: false }))); sm.position.set(0, -0.3 * U, 0.63 * U); sm.renderOrder = 3; this.head.add(sm); }
    if (look.hat === "army") {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.76 * U, 0.66 * U, 0.3 * U, 28), C("#5a5a36")); top.position.y = 0.7 * U; this.head.add(top);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.66 * U, 0.66 * U, 0.2 * U, 28), C("#3a3620")); band.position.y = 0.5 * U; this.head.add(band);
      const peak = new THREE.Mesh(box(0.9 * U, 0.06 * U, 0.4 * U), C("#1a1612")); peak.position.set(0, 0.42 * U, 0.68 * U); peak.rotation.x = 0.25; this.head.add(peak);
      const badge = new THREE.Mesh(box(0.22 * U, 0.2 * U, 0.04 * U), C("#e8c04a")); badge.position.set(0, 0.55 * U, 0.67 * U); this.head.add(badge);
    }
    if (look.hat === "sailor") {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * U, 0.6 * U, 0.3 * U, 28), C("#f4f4f0")); cap.position.y = 0.66 * U; this.head.add(cap);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.64 * U, 0.64 * U, 0.12 * U, 28), C("#1c2440")); band.position.y = 0.52 * U; this.head.add(band);
    } else if (look.hat === "officer") {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.78 * U, 0.66 * U, 0.3 * U, 28), C("#f4f4f0")); top.position.y = 0.7 * U; this.head.add(top);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.66 * U, 0.66 * U, 0.2 * U, 28), C("#151a2a")); band.position.y = 0.5 * U; this.head.add(band);
      const peak = new THREE.Mesh(box(0.9 * U, 0.06 * U, 0.4 * U), C("#151515")); peak.position.set(0, 0.42 * U, 0.68 * U); peak.rotation.x = 0.25; this.head.add(peak);
      const badge = new THREE.Mesh(box(0.22 * U, 0.18 * U, 0.04 * U), C("#e8c04a")); badge.position.set(0, 0.52 * U, 0.67 * U); this.head.add(badge);
    }
    for (const sx of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(1.5 * U * sx, 1.75 * U, 0); this.hips.add(a); this.arms.push(a);
      const m = new THREE.Mesh(box(1 * U, 2 * U, 1 * U), C(look.shirt)); m.position.y = -0.75 * U; a.add(m);
      const hand = new THREE.Mesh(box(0.98 * U, 0.4 * U, 0.98 * U), C(skin)); hand.position.y = -1.6 * U; a.add(hand);
      const l = new THREE.Group(); l.position.set(0.5 * U * sx, 0, 0); this.hips.add(l); this.legs.push(l);
      const lm = new THREE.Mesh(box(0.98 * U, 2 * U, 1 * U), C(look.pants)); lm.position.y = -1 * U; l.add(lm);
      const shoe = new THREE.Mesh(box(1.0 * U, 0.3 * U, 1.04 * U), C("#1a1a1a")); shoe.position.y = -1.85 * U; l.add(shoe);
    }
  }
  pose(p: RPose) {
    const w = p.walk, s = p.stride ?? 0.6, sw = w === undefined ? 0 : Math.sin(w * Math.PI * 2) * s;
    this.legs[0].rotation.x = p.legL ?? (p.sit ? -1.5 : sw); this.legs[1].rotation.x = p.legR ?? (p.sit ? -1.5 : -sw);
    this.arms[0].rotation.x = p.armL ?? -sw * 0.9; this.arms[1].rotation.x = p.armR ?? sw * 0.9;
    this.arms[0].rotation.z = -(p.armLz ?? 0); this.arms[1].rotation.z = p.armRz ?? 0;
    this.hips.position.y = 2 * U - (p.sit ? 1.05 * U : 0) + (p.lift ?? 0) + (w === undefined ? 0 : 0.04 * Math.abs(Math.cos(w * Math.PI * 2)));
    this.hips.rotation.x = p.lean ?? 0; this.head.rotation.y = p.head ?? 0; this.head.rotation.z = p.tilt ?? 0; this.head.rotation.x = -(p.nod ?? 0);
    this.face.material = FM(p.face ?? "smile");
  }
}
/** canned poses */
export const SALUTE: RPose = { armR: -2.5, armRz: -0.5, face: "determined" };
export const CHEER = (t: number): RPose => ({ armL: Math.PI, armR: Math.PI, armLz: 0.35 + 0.15 * Math.sin(t * 12), armRz: 0.35 + 0.15 * Math.sin(t * 12 + 1), face: "laugh", lift: 0.05 * Math.abs(Math.sin(t * 6)) });

// ---------------- the cat ----------------
export type CatPose = { walk?: number; crouch?: number; pounce?: number; sit?: boolean; sleep?: boolean; face?: "happy" | "calm" | "wide" | "sad" | "fierce" | "sleep" | "flat";
  bandage?: boolean; whiskers?: boolean; medal?: boolean; cap?: boolean; tail?: number };
const catFaceTex = (f: string, wh: boolean, band: boolean) => ctex(`cface${f}${wh ? 1 : 0}${band ? 1 : 0}`, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = "#f4f4f0"; g.beginPath(); g.ellipse(128, 176, 62, 50, 0, 0, 6.3); g.fill();                 // white muzzle
  const eye = (x: number) => {
    if (f === "sleep") { g.strokeStyle = "#111"; g.lineWidth = 8; g.beginPath(); g.arc(x, 96, 18, 0.2, Math.PI - 0.2); g.stroke(); return; }
    if (f === "happy") { g.strokeStyle = "#b8e05a"; g.lineWidth = 10; g.beginPath(); g.arc(x, 104, 18, Math.PI + 0.3, -0.3); g.stroke(); return; }
    if (f === "flat") { g.fillStyle = "#7ac04a"; g.fillRect(x - 22, 92, 44, 16); g.fillStyle = "#111"; g.fillRect(x - 4, 92, 8, 16); return; }
    g.fillStyle = "#7ac04a"; g.beginPath(); g.ellipse(x, 98, 22, f === "wide" ? 26 : 20, 0, 0, 6.3); g.fill();
    g.fillStyle = "#111"; g.beginPath(); g.ellipse(x, 98, f === "wide" ? 12 : 5, f === "wide" ? 18 : 16, 0, 0, 6.3); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 7, 90, 5, 0, 6.3); g.fill();
    if (f === "fierce") { g.strokeStyle = "#111"; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 26, x < 128 ? 66 : 80); g.lineTo(x + 26, x < 128 ? 80 : 66); g.stroke(); }
    if (f === "sad") { g.strokeStyle = "#111"; g.lineWidth = 7; g.beginPath(); g.moveTo(x - 24, x < 128 ? 78 : 68); g.lineTo(x + 24, x < 128 ? 68 : 78); g.stroke(); }
  };
  eye(82); eye(174);
  g.fillStyle = "#e88a9a"; g.beginPath(); g.moveTo(114, 150); g.lineTo(142, 150); g.lineTo(128, 166); g.closePath(); g.fill();
  g.strokeStyle = "#111"; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 166); g.lineTo(128, 182); g.moveTo(128, 182); g.quadraticCurveTo(112, 196, 100, 184); g.moveTo(128, 182); g.quadraticCurveTo(144, 196, 156, 184); g.stroke();
  if (wh) { g.strokeStyle = "#ffffff"; g.lineWidth = 4; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(128 + s * 50, 170 + 8 * k); g.lineTo(128 + s * 126, 150 + 22 * k); g.stroke(); } }
  if (band) { g.fillStyle = "rgba(246,242,230,0.96)"; g.save(); g.translate(128, 40); g.rotate(-0.25); g.fillRect(-120, -16, 240, 34); g.restore(); g.fillStyle = "#c0353a"; g.fillRect(186, 26, 16, 16); }
});
export class Cat {
  g = new THREE.Group(); body = new THREE.Group(); head = new THREE.Group(); face: THREE.Mesh; legs: THREE.Group[] = []; tail: THREE.Group[] = [];
  medal: THREE.Group; cap: THREE.Group; whisk: boolean = true; band = false; private fkey = "";
  constructor(public s = 1) {
    const K = C("#1c1c22"), W = C("#f4f4f0");
    this.g.add(this.body); this.g.scale.setScalar(s);
    const torso = new THREE.Mesh(box(0.3, 0.26, 0.56), K); torso.position.y = 0.3; this.body.add(torso);
    const chest = new THREE.Mesh(box(0.22, 0.2, 0.05), W); chest.position.set(0, 0.27, 0.28); this.body.add(chest);
    const belly = new THREE.Mesh(box(0.2, 0.04, 0.4), W); belly.position.set(0, 0.17, 0.02); this.body.add(belly);
    this.head.position.set(0, 0.5, 0.3); this.body.add(this.head);
    this.head.add(new THREE.Mesh(box(0.34, 0.28, 0.28), K));
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.14, 4).rotateY(Math.PI / 4), K); e.position.set(0.1 * sx, 0.19, -0.02); this.head.add(e);
      const ei = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4).rotateY(Math.PI / 4), C("#e88a9a")); ei.position.set(0.1 * sx, 0.18, 0.02); this.head.add(ei); }
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); this.face.position.set(0, -0.01, 0.142); this.face.renderOrder = 2; this.head.add(this.face);
    for (const [x, z] of [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]] as [number, number][]) {
      const l = new THREE.Group(); l.position.set(x, 0.2, z); this.body.add(l); this.legs.push(l);
      const m = new THREE.Mesh(box(0.08, 0.2, 0.08), K); m.position.y = -0.1; l.add(m);
      const p = new THREE.Mesh(box(0.085, 0.05, 0.1), W); p.position.set(0, -0.19, 0.01); l.add(p);
    }
    let parent: THREE.Object3D = this.body;
    for (let k = 0; k < 4; k++) { const t = new THREE.Group(); t.position.set(0, k === 0 ? 0.38 : 0, k === 0 ? -0.28 : -0.1); parent.add(t); this.tail.push(t);
      const m = new THREE.Mesh(box(0.06, 0.06, 0.11), k === 3 ? W : K); m.position.z = -0.05; t.add(m); parent = t; }
    this.medal = new THREE.Group(); this.medal.position.set(0, 0.34, 0.31); this.body.add(this.medal);
    const rib = new THREE.Mesh(box(0.08, 0.1, 0.01), lam("rbRib", () => ({ map: ctex("dickinRib", 32, 64, (g) => { const c = ["#2a7a3a", "#5a4a8a", "#3a6aaa", "#5a4a8a", "#2a7a3a"]; c.forEach((s, i) => { g.fillStyle = s; g.fillRect(i * 6.4, 0, 6.4, 64); }); }) })));
    this.medal.add(rib); const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 20).rotateX(Math.PI / 2), C("#b8864a")); disc.position.set(0, -0.09, 0.005); this.medal.add(disc);
    this.cap = new THREE.Group(); this.cap.position.set(0, 0.17, 0); this.head.add(this.cap);
    const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.07, 20), C("#f4f4f0")); this.cap.add(cp);
    const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 20), C("#1c2440")); cb.position.y = -0.04; this.cap.add(cb);
  }
  pose(p: CatPose, t: number) {
    const w = p.walk, sw = w === undefined ? 0 : Math.sin(w * Math.PI * 2) * 0.7, cr = p.crouch ?? 0, po = p.pounce ?? 0;
    this.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? sw : -sw) + (p.sit && i >= 2 ? -1.2 : 0) + (p.sleep ? (i < 2 ? -1.4 : 1.4) : 0) + po * (i < 2 ? -0.9 : 0.9); });
    this.body.position.y = -0.09 * cr - (p.sleep ? 0.16 : 0) + 0.25 * Math.sin(Math.PI * Math.min(1, po)) * (po > 0 && po < 1 ? 1 : 0);
    this.body.rotation.x = p.sit ? -0.45 : 0.25 * po * (po < 1 ? 1 : 0) - 0.1 * cr;
    this.head.rotation.x = p.sit ? 0.4 : 0.1 * cr; this.head.rotation.z = p.sleep ? 0.5 : 0;
    const tw = p.tail ?? 0.4 * Math.sin(t * 3);
    this.tail.forEach((s, i) => { s.rotation.x = p.sleep ? 0.1 : -0.5 + 0.12 * i; s.rotation.y = tw * (0.4 + 0.2 * i); });
    const key = `${p.face ?? "calm"}${p.whiskers !== false}${!!p.bandage}`;
    if (key !== this.fkey) { (this.face.material as THREE.MeshBasicMaterial).map = catFaceTex(p.face ?? "calm", p.whiskers !== false, !!p.bandage); (this.face.material as THREE.MeshBasicMaterial).needsUpdate = true; this.fkey = key; }
    this.medal.visible = !!p.medal; this.cap.visible = !!p.cap;
  }
}
/** a blocky rat: grey box body, round ears, pink tail; s = scale (the giant one is ~2.4) */
export class Rat {
  g = new THREE.Group(); legs: THREE.Group[] = []; tail: THREE.Mesh;
  constructor(s = 1, col = "#7a7470") {
    const K = C(col); this.g.scale.setScalar(s);
    const b = new THREE.Mesh(box(0.14, 0.11, 0.26), K); b.position.y = 0.09; this.g.add(b);
    const h = new THREE.Mesh(box(0.11, 0.09, 0.1), K); h.position.set(0, 0.11, 0.16); this.g.add(h);
    const n = new THREE.Mesh(box(0.05, 0.05, 0.05), C("#e88a9a")); n.position.set(0, 0.1, 0.23); this.g.add(n);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 12).rotateX(Math.PI / 2), C("#c87a8a")); e.position.set(0.045 * sx, 0.17, 0.13); this.g.add(e);
      const ey = new THREE.Mesh(box(0.02, 0.02, 0.01), C("#c0202a")); ey.position.set(0.032 * sx, 0.125, 0.212); this.g.add(ey); }
    for (const [x, z] of [[-0.05, 0.08], [0.05, 0.08], [-0.05, -0.08], [0.05, -0.08]] as [number, number][]) { const l = new THREE.Group(); l.position.set(x, 0.05, z); this.g.add(l); this.legs.push(l); const m = new THREE.Mesh(box(0.03, 0.05, 0.03), C("#c87a8a")); m.position.y = -0.025; l.add(m); }
    this.tail = new THREE.Mesh(box(0.02, 0.02, 0.28), C("#d88a9a")); this.tail.position.set(0, 0.08, -0.26); this.g.add(this.tail);
  }
  pose(run: number) { this.legs.forEach((l, i) => (l.rotation.x = Math.sin(run * Math.PI * 2 + (i % 2) * Math.PI) * 0.8)); this.tail.rotation.y = 0.3 * Math.sin(run * 6); }
}

// ---------------- the bat (Mexican free-tailed bat, blocky) ----------------
export type BatFace = "sleep" | "wide" | "happy" | "grin" | "sad";
export type BatPose = { flap?: number; fold?: number; face?: BatFace; bomb?: boolean; hang?: boolean; timer?: boolean };
const batFaceTex = (f: BatFace) => ctex("bface" + f, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = "#8a6a5a"; g.beginPath(); g.ellipse(128, 168, 64, 48, 0, 0, 6.3); g.fill();                    // muzzle
  const eye = (x: number) => {
    if (f === "sleep") { g.strokeStyle = "#111"; g.lineWidth = 9; g.beginPath(); g.arc(x, 96, 20, 0.2, Math.PI - 0.2); g.stroke(); return; }
    if (f === "happy" || f === "grin") { g.strokeStyle = "#111"; g.lineWidth = 10; g.beginPath(); g.arc(x, 104, 20, Math.PI + 0.3, -0.3); g.stroke(); return; }
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, 98, 30, f === "wide" ? 36 : 30, 0, 0, 6.3); g.fill();
    g.fillStyle = "#111"; g.beginPath(); g.ellipse(x + 3, 102, f === "wide" ? 13 : 17, f === "wide" ? 15 : 20, 0, 0, 6.3); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 9, 92, 6, 0, 6.3); g.fill();
    if (f === "sad") { g.strokeStyle = "#111"; g.lineWidth = 7; g.beginPath(); g.moveTo(x - 26, x < 128 ? 66 : 58); g.lineTo(x + 26, x < 128 ? 58 : 66); g.stroke(); }
  };
  eye(78); eye(178);
  g.fillStyle = "#e88a9a"; g.beginPath(); g.ellipse(128, 150, 14, 9, 0, 0, 6.3); g.fill();
  g.strokeStyle = "#111"; g.lineWidth = 7;
  if (f === "grin" || f === "happy") { g.fillStyle = "#3a1a1a"; g.beginPath(); g.moveTo(92, 172); g.quadraticCurveTo(128, 226, 164, 172); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(102, 176); g.lineTo(110, 194); g.lineTo(118, 177); g.fill(); g.beginPath(); g.moveTo(138, 177); g.lineTo(146, 194); g.lineTo(154, 176); g.fill(); }
  else if (f === "wide") { g.fillStyle = "#3a1a1a"; g.beginPath(); g.ellipse(128, 186, 16, 20, 0, 0, 6.3); g.fill(); }
  else if (f === "sad") { g.beginPath(); g.arc(128, 204, 26, Math.PI + 0.5, -0.5); g.stroke(); }
  else { g.beginPath(); g.moveTo(110, 180); g.lineTo(146, 180); g.stroke(); }
});
const bfm = new Map<BatFace, THREE.Material>();
const BFM = (f: BatFace) => { let m = bfm.get(f); if (!m) { m = new THREE.MeshBasicMaterial({ map: batFaceTex(f), transparent: true, depthWrite: false }); bfm.set(f, m); } return m; };
/** blocky bat, nose to +z, wings along x; 1 unit wingspan ~0.95 m at s = 1. The incendiary rides under the belly. */
export class Bat {
  g = new THREE.Group(); body = new THREE.Group(); head = new THREE.Group(); face: THREE.Mesh; wings: THREE.Group[] = []; tips: THREE.Group[] = []; bomb: THREE.Group; timer: THREE.Mesh;
  constructor(public s = 1, col = "#5a4038") {
    const K = C(col), M = C("#3c2a28"), Bn = C("#7a5a4a");
    this.g.add(this.body); this.g.scale.setScalar(s);
    const torso = new THREE.Mesh(box(0.16, 0.14, 0.22), K); this.body.add(torso);
    const belly = new THREE.Mesh(box(0.12, 0.02, 0.16), C("#8a6a58")); belly.position.y = -0.07; this.body.add(belly);
    this.head.position.set(0, 0.05, 0.15); this.body.add(this.head);
    this.head.add(new THREE.Mesh(box(0.2, 0.17, 0.15), K));
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4).rotateY(Math.PI / 4), K); e.position.set(0.065 * sx, 0.15, -0.01); e.rotation.z = -0.25 * sx; this.head.add(e);
      const ei = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4).rotateY(Math.PI / 4), C("#c87a7a")); ei.position.set(0.065 * sx, 0.14, 0.025); ei.rotation.z = -0.25 * sx; this.head.add(ei);
      const w = new THREE.Group(); w.position.set(0.08 * sx, 0.03, 0); this.body.add(w); this.wings.push(w);
      const p1 = new THREE.Mesh(box(0.24, 0.012, 0.2), M); p1.position.set(0.12 * sx, 0, -0.02); w.add(p1);
      const b1 = new THREE.Mesh(box(0.24, 0.03, 0.03), Bn); b1.position.set(0.12 * sx, 0.01, 0.07); w.add(b1);
      const tp = new THREE.Group(); tp.position.set(0.24 * sx, 0, 0); w.add(tp); this.tips.push(tp);
      const p2 = new THREE.Mesh(box(0.22, 0.012, 0.15), M); p2.position.set(0.11 * sx, 0, 0.0); tp.add(p2);
      for (let k = 0; k < 2; k++) { const f = new THREE.Mesh(box(0.22, 0.026, 0.02), Bn); f.position.set(0.11 * sx, 0.008, 0.07 - 0.07 * k); f.rotation.y = 0.25 * sx * (k + 1); tp.add(f); }
      const claw = new THREE.Mesh(box(0.03, 0.03, 0.04), Bn); claw.position.set(0.0, 0.02, 0.09); tp.add(claw);
      const ft = new THREE.Mesh(box(0.035, 0.03, 0.06), Bn); ft.position.set(0.045 * sx, -0.04, -0.13); this.body.add(ft);
    }
    const tail = new THREE.Mesh(box(0.03, 0.03, 0.14), K); tail.position.set(0, 0, -0.17); this.body.add(tail);
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), BFM("wide")); this.face.position.set(0, -0.005, 0.0755); this.face.renderOrder = 2; this.head.add(this.face);
    this.bomb = new THREE.Group(); this.bomb.position.set(0, -0.1, 0.0); this.body.add(this.bomb);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.17, 12).rotateX(Math.PI / 2), C("#9a8a5a")); this.bomb.add(cyl);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.03, 12).rotateX(Math.PI / 2), C("#c0353a")); cap.position.z = 0.07; this.bomb.add(cap);
    const strap = new THREE.Mesh(box(0.1, 0.03, 0.025), C("#3a3a3a")); strap.position.set(0, 0.03, -0.02); this.bomb.add(strap);
    this.timer = new THREE.Mesh(box(0.05, 0.03, 0.04), C("#d8d0b8")); this.timer.position.set(0, -0.04, -0.05); this.bomb.add(this.timer);
  }
  /** flap = phase (cycles); fold 0 open .. 1 wrapped; hang = asleep upside down */
  pose(p: BatPose) {
    const ph = (p.flap ?? 0) * Math.PI * 2, fo = p.fold ?? 0, a = (1 - fo) * 0.75 * Math.sin(ph);
    this.wings.forEach((w, i) => { const sx = i ? 1 : -1; w.rotation.z = sx * (a + fo * -1.25); w.rotation.y = sx * fo * 0.5; });
    this.tips.forEach((t, i) => { const sx = i ? 1 : -1; t.rotation.z = sx * ((1 - fo) * 0.45 * Math.sin(ph - 0.9) - fo * 1.9); });
    this.body.position.y = (1 - fo) * 0.03 * Math.sin(ph + Math.PI);
    this.body.rotation.z = p.hang ? Math.PI : 0;
    this.face.material = BFM(p.face ?? (fo > 0.5 ? "sleep" : "wide"));
    this.bomb.visible = !!p.bomb; this.timer.visible = !!p.timer || !!p.bomb;
  }
}
