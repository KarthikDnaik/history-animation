// 3D scenery pieces for the rocket short, all static (merged into a Batch) unless noted. Materials go through lam()
// (two-tone toon shading) so the world ink and lighting match the bridge look.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "./build";
import { ctex, rng, stoneHD, beam, planksHD, grassHD, rep, brick, roofHD } from "./paint";
import { twoTone } from "./shade";

export const M4 = (x: number, y: number, z: number, ry = 0, s = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry), V(s, s, s));
export const beamBetween = (a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 6) => {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), seg);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
};
/** flat ground quad at height y, uv tiles every `tile` metres */
export const plane = (x0: number, x1: number, z0: number, z1: number, tile: number, y = 0) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 1, 0]).flat(), 3));
  const u = (x1 - x0) / tile, v = (z1 - z0) / tile;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};

// ---------------- textures / materials ----------------
/** dusty red-ochre Deccan earth: blotches, pebbles, dry grass tufts */
export const earthHD = (key = "earthHD", base = ["#c99d68", "#b88e5a", "#d2a874", "#a9965a"], tuft = "#7f9a46") => ctex(key, 1024, 1024, (g, r) => {
  g.fillStyle = base[0]; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) { g.fillStyle = base[1 + (i % 3)]; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 20 + r() * 70, 12 + r() * 40, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "#9a6a44" : "#f0c896"; g.beginPath(); g.arc(r() * 1024, r() * 1024, 1.5 + r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = tuft; g.lineWidth = 3; g.lineCap = "round";
  for (let i = 0; i < 320; i++) { const x = r() * 1024, y = r() * 1024; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (k - 2) * 5 + r() * 4, y - 12 - r() * 12); g.stroke(); } }
});
export const MAT = {
  earth: () => lam("earth", () => ({ map: rep(earthHD(), 1, 1) })),
  grass: () => lam("grassG", () => ({ map: grassHD() })),
  fort: () => lam("fortStone", () => ({ map: stoneHD("fortHD", ["#dcae74", "#d2a26a", "#e5ba82", "#cc9a62"], "#a3764a") })),
  laterite: () => lam("laterite", () => ({ map: stoneHD("latHD", ["#bd6c46", "#b2623e", "#c77a50", "#a85a38"], "#7c4128") })),
  lime: () => lam("lime", () => ({ color: "#f1e8d6" })),
  wood: () => lam("woodB", () => ({ map: beam() })),
  deck: () => lam("deckP", () => ({ map: planksHD() })),
  darkWood: () => lam("darkWood", () => ({ color: "#6e4a30" })),
  bamboo: () => lam("bamboo", () => ({ color: "#d1ad62" })),
  canvas: () => lam("canvas", () => ({ color: "#efe4c8", side: THREE.DoubleSide })),
  iron: () => twoTone(new THREE.MeshPhongMaterial({ color: "#454a55", specular: "#8a8a8a", shininess: 50 }), 0.15),
  rust: () => lam("rust", () => ({ color: "#8a4a2a" })),
  leaf: () => lam("palmLeaf", () => ({ color: "#5aa046", side: THREE.DoubleSide })),
  leafDark: () => lam("palmLeaf2", () => ({ color: "#4a8c3c", side: THREE.DoubleSide })),
  trunk: () => lam("palmTrunk", () => ({ color: "#9a7652" })),
  brick: () => lam("brickW", () => ({ map: rep(brick(), 1, 1), color: "#d6c3b6" })),
  roofTile: () => lam("roofTile", () => ({ map: roofHD("#c9643f"), side: THREE.DoubleSide })),
  water: () => lam("waterFlat", () => ({ color: "#2f86b8" })),
  hill: () => lam("hillG", () => ({ color: "#8fb35a" })),
  hillDry: () => lam("hillD", () => ({ color: "#b99a62" })),
};

// ---------------- vegetation ----------------
/** coconut palm: curved segmented trunk, 9 drooping fronds, a coconut cluster */
export const palm = (b: Batch, x: number, z: number, h: number, seed: number, y = 0) => {
  const r = rng(seed), lean = 0.08 + 0.12 * r(), dir = r() * Math.PI * 2, n = 7;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) { const u = i / n, off = lean * h * u * u; pts.push(V(x + Math.cos(dir) * off, y + h * u, z + Math.sin(dir) * off)); }
  for (let i = 0; i < n; i++) b.add(beamBetween(pts[i], pts[i + 1], 0.2 - 0.07 * (i / n), 7), MAT.trunk());
  const top = pts[n];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + r() * 0.4, L = h * (0.32 + 0.08 * r()), droop = 0.55 + 0.3 * r(), W = 0.55;
    const g = new THREE.BufferGeometry(), pos: number[] = [], idx: number[] = [], seg = 8;
    for (let i = 0; i <= seg; i++) {
      const u = i / seg, d = L * u, yy = 0.35 * L * u - droop * L * u * u, w = W * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - 0.3 * u);
      pos.push(d, yy - 0.12 * w, -w, d, yy, 0, d, yy - 0.12 * w, w);
    }
    for (let i = 0; i < seg; i++) for (const [p0, p1] of [[0, 1], [1, 2]]) { const a0 = i * 3 + p0, a1 = i * 3 + p1, b0 = a0 + 3, b1 = a1 + 3; idx.push(a0, b0, b1, a0, b1, a1); }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, k % 2 ? MAT.leaf() : MAT.leafDark(), new THREE.Matrix4().compose(top, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a), V(1, 1, 1)));
  }
  for (let k = 0; k < 4; k++) b.add(new THREE.SphereGeometry(0.16, 8, 6), lam("coco", () => ({ color: "#6b8a3a" })), M4(top.x + 0.22 * Math.cos(k * 1.7), top.y - 0.25, top.z + 0.22 * Math.sin(k * 1.7)));
};
/** dry scrub bush: three squashed spheres */
export const scrub = (b: Batch, x: number, z: number, s: number, seed: number, col = "#8a9a4a") => {
  const r = rng(seed);
  for (let k = 0; k < 3; k++) b.add(new THREE.SphereGeometry(0.5 * s * (0.7 + 0.5 * r()), 10, 8).scale(1, 0.7, 1), lam("scrub" + col, () => ({ color: col })), M4(x + (r() - 0.5) * s, 0.25 * s, z + (r() - 0.5) * s));
};
/** distant hills: a ring of flattened domes */
export const hills = (b: Batch, cx: number, cz: number, R: number, n: number, h: number, seed: number, mat = MAT.hillDry()) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3, rr = R * (0.85 + 0.3 * r()), w = h * (2.5 + 2 * r());
    b.add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(w, h * (0.6 + 0.6 * r()), w * 0.8), mat, M4(cx + Math.cos(a) * rr, -0.5, cz + Math.sin(a) * rr, a));
  }
};

// ---------------- architecture ----------------
/** crenellated wall along a segment: body + walk ledge + merlons */
export const fortWall = (b: Batch, x0: number, z0: number, x1: number, z1: number, h: number, th = 3, mat = MAT.fort(), y = 0, merlon = 1.6) => {
  const L = Math.hypot(x1 - x0, z1 - z0), a = -Math.atan2(z1 - z0, x1 - x0), m = M4((x0 + x1) / 2, y, (z0 + z1) / 2, a);
  b.add(boxGeo(V(-L / 2, 0, -th / 2), V(L / 2, h, th / 2), 3), mat, m);
  b.add(boxGeo(V(-L / 2, h - 0.3, -th / 2 - 0.15), V(L / 2, h, th / 2 + 0.15), 3), mat, m);
  const n = Math.floor(L / merlon);
  for (let i = 0; i < n; i += 2) { const xx = -L / 2 + (i + 0.5) * (L / n); b.add(boxGeo(V(xx - L / n / 2, h, -th / 2 - 0.15), V(xx + L / n / 2, h + 0.9, -th / 2 + 0.45), 2), mat, m); }
};
export const bastion = (b: Batch, x: number, z: number, R: number, h: number, mat = MAT.fort(), y = 0) => {
  b.add(new THREE.CylinderGeometry(R, R * 1.08, h, 28, 1, true), mat, M4(x, y + h / 2, z));
  b.add(new THREE.CircleGeometry(R, 28).rotateX(-Math.PI / 2), mat, M4(x, y + h, z));
  const n = Math.round(R * 2.4);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; b.add(boxGeo(V(-0.45, 0, -0.3), V(0.45, 0.9, 0.3)), mat, M4(x + Math.cos(a) * (R - 0.3), y + h, z + Math.sin(a) * (R - 0.3), -a + Math.PI / 2)); }
};
export const minaret = (b: Batch, x: number, z: number, h: number) => {
  const W = MAT.lime(), r = h * 0.045;
  b.add(new THREE.CylinderGeometry(r, r * 1.15, h * 0.8, 12), W, M4(x, h * 0.4, z));
  for (const k of [0.38, 0.62, 0.8]) b.add(new THREE.CylinderGeometry(r * 1.6, r * 1.3, h * 0.025, 12), W, M4(x, h * k, z));
  b.add(new THREE.CylinderGeometry(r * 0.8, r * 0.9, h * 0.12, 12), W, M4(x, h * 0.86, z));
  b.add(new THREE.SphereGeometry(r * 1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.5, 1), W, M4(x, h * 0.92, z));
};
/** temple tower: stepped storeys narrowing upward with a barrel-vault crown */
export const gopuram = (b: Batch, x: number, z: number, s: number, ry = 0) => {
  const W = lam("gopuram", () => ({ color: "#ead7b0" })), m = M4(x, 0, z, ry);
  let y = 0, w = 12 * s, d = 7 * s;
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, 6 * s, d / 2)), W, m); y = 6 * s;
  for (let k = 0; k < 6; k++) { const hh = 2.4 * s; w *= 0.86; d *= 0.86; b.add(boxGeo(V(-w / 2, y, -d / 2), V(w / 2, y + hh, d / 2)), W, m); b.add(boxGeo(V(-w / 2 - 0.2 * s, y + hh - 0.3 * s, -d / 2 - 0.2 * s), V(w / 2 + 0.2 * s, y + hh, d / 2 + 0.2 * s)), W, m); y += hh; }
  b.add(new THREE.CylinderGeometry(d / 2, d / 2, w, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), lam("gopTop", () => ({ color: "#d9b878" })), new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(0, y, 0)));
};
/** flat-roofed lime-plastered building (inside the fort) */
export const block = (b: Batch, x: number, z: number, w: number, d: number, h: number, ry = 0, col = "#efe2c8") => {
  const m = M4(x, 0, z, ry), W = lam("blk" + col, () => ({ color: col }));
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), W, m);
  b.add(boxGeo(V(-w / 2 - 0.2, h, -d / 2 - 0.2), V(w / 2 + 0.2, h + 0.5, d / 2 + 0.2)), W, m);
};
/** low A-frame bamboo launch rack holding a rocket pointing along local +x, elevated by `el` */
export const rack = (b: Batch, x: number, z: number, ry: number, el = 0.35) => {
  const m = M4(x, 0, z, ry), B = MAT.bamboo();
  for (const s of [-1, 1]) {
    b.add(beamBetween(V(-0.6, 0, s * 0.35), V(0.15, 1.0, 0), 0.03), B, m);
    b.add(beamBetween(V(0.7, 0, s * 0.35), V(0.15, 1.0, 0), 0.03), B, m);
  }
  b.add(beamBetween(V(-0.55, 0.25, 0), V(0.65, 0.25 + 1.2 * Math.tan(el), 0).setY(0.25 + 1.2 * Math.tan(el)), 0.025), B, m);
};
/** two-wheeled ammunition cart with barrels; returns nothing (static) */
export const cart = (b: Batch, x: number, z: number, ry: number) => {
  const m = M4(x, 0, z, ry), Wd = MAT.wood(), D = MAT.darkWood();
  b.add(boxGeo(V(-1.3, 0.75, -0.8), V(1.3, 0.95, 0.8), 1), Wd, m);
  for (const s of [-1, 1]) b.add(boxGeo(V(-1.3, 0.95, s * 0.8 - 0.05), V(1.3, 1.35, s * 0.8 + 0.05), 1), Wd, m);
  for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(0.6, 0.07, 6, 18), D, new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(0, 0.62, s * 0.95))); for (let k = 0; k < 4; k++) b.add(beamBetween(V(0, 0.62, s * 0.95), V(0.6 * Math.cos(k * 0.785), 0.62 + 0.6 * Math.sin(k * 0.785), s * 0.95), 0.03, 4).applyMatrix4(new THREE.Matrix4()), D, m); }
  b.add(beamBetween(V(1.3, 0.85, 0), V(3.0, 0.4, 0), 0.06), D, m);
  for (const [bx, bz] of [[-0.7, -0.35], [-0.7, 0.35], [0, -0.35], [0, 0.35], [0.7, 0]]) b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 12), lam("barrel", () => ({ color: "#9a6a42" })), new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(bx, 1.3, bz)));
};
/** ridge tent (camp) */
export const tent = (b: Batch, x: number, z: number, ry: number, s = 1) => {
  const m = M4(x, 0, z, ry, s), C = MAT.canvas();
  b.add(quad(V(-1.6, 0, 1.4), V(1.6, 0, 1.4), V(1.6, 2.1, 0), V(-1.6, 2.1, 0)), C, m);
  b.add(quad(V(1.6, 0, -1.4), V(-1.6, 0, -1.4), V(-1.6, 2.1, 0), V(1.6, 2.1, 0)), C, m);
  b.add(tri(V(-1.6, 0, -1.4), V(-1.6, 0, 1.4), V(-1.6, 2.1, 0)), C, m);
  b.add(tri(V(1.6, 0, 1.4), V(1.6, 0, -1.4), V(1.6, 2.1, 0)), C, m);
};
/** sailing ship hull along local x: tapered hull, deck, masts with furled sails */
export const ship = (b: Batch, x: number, z: number, ry: number, L: number, y = -1.2, masts = 3) => {
  const m = M4(x, y, z, ry), H = lam("hull", () => ({ color: "#8a5a36" })), S = lam("hullStripe", () => ({ color: "#d9b25a" }));
  const hw = L * 0.13, hh = L * 0.12, shape = new THREE.Shape();
  shape.moveTo(-L / 2, hh); shape.lineTo(-L / 2 + L * 0.06, 0); shape.lineTo(L / 2 - L * 0.12, 0); shape.lineTo(L / 2, hh * 1.1); shape.closePath();
  const hull = new THREE.ExtrudeGeometry(shape, { depth: 2 * hw, bevelEnabled: false }).translate(0, 0, -hw);
  b.add(hull, H, m);
  b.add(boxGeo(V(-L / 2 + 0.3, hh * 0.72, -hw - 0.02), V(L / 2 - 0.3, hh * 0.82, hw + 0.02)), S, m);
  b.add(boxGeo(V(-L / 2 + 0.2, hh - 0.05, -hw + 0.05), V(L / 2 - 0.2, hh, hw - 0.05), 1), MAT.deck(), m);
  for (let k = 0; k < masts; k++) {
    const mx = -L * 0.3 + (k * L * 0.6) / Math.max(1, masts - 1), mh = L * (k === 1 ? 0.95 : 0.8);
    b.add(new THREE.CylinderGeometry(0.12, 0.18, mh, 8), MAT.darkWood(), new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(mx, hh + mh / 2, 0)));
    for (const yy of [0.45, 0.72]) {
      b.add(new THREE.CylinderGeometry(0.07, 0.07, hw * 3.2, 6).rotateX(Math.PI / 2), MAT.darkWood(), new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(mx, hh + mh * yy, 0)));
      b.add(new THREE.CylinderGeometry(0.22, 0.22, hw * 2.8, 8).rotateX(Math.PI / 2), MAT.canvas(), new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(mx, hh + mh * yy - 0.25, 0)));
    }
  }
};
/** wooden crate */
export const crate = (b: Batch, x: number, y: number, z: number, s = 0.7, ry = 0) => {
  const m = M4(x, y, z, ry);
  b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s * 0.8, s / 2)), lam("crate", () => ({ map: rep(beam(), 1, 1) })), m);
  b.add(boxGeo(V(-s / 2 - 0.02, s * 0.35, -s / 2 - 0.02), V(s / 2 + 0.02, s * 0.45, s / 2 + 0.02)), MAT.darkWood(), m);
};
/** a Mysore rocket lying / leaning as a 3D object: iron tube + bamboo pole along local +x from the origin */
export const rocket3D = (b: Batch, m: THREE.Matrix4, rusty = false, congreve = false) => {
  const tube = rusty ? MAT.rust() : MAT.iron(), pole = rusty ? lam("rustPole", () => ({ color: "#7a5a3a" })) : MAT.bamboo();
  const L = congreve ? 2.6 : 1.2, tl = congreve ? 0.42 : rusty ? 0.34 : 0.22, tr = congreve ? 0.06 : rusty ? 0.06 : 0.035;
  b.add(beamBetween(V(0, 0, 0), V(L, 0, 0), 0.016), pole, m);
  b.add(beamBetween(V(L - 0.02, 0, 0), V(L + tl, 0, 0), tr, 10), tube, m);
  if (congreve) b.add(new THREE.ConeGeometry(tr, 0.16, 10).rotateZ(-Math.PI / 2), tube, new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(L + tl + 0.08, 0, 0)));
};
export { Batch, boxGeo, V, lam, quad, tri, ctex, rng };
