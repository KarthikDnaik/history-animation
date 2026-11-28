// Production set dressing for the Lustig long-form: hand-painted interior textures (damask wallpaper, raised wood
// panelling, herringbone parquet, Persian rugs, baize, framed paintings, stone cell blocks) and the furniture /
// street furniture built from them. Every texture is a cached canvas (paint.ts ctex); UVs are world-anchored so
// patterns run continuously across wall pieces.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "./build";
import { ctex, rep, jit } from "./paint";
import { plane, M4 } from "./props3d";

const TAU = Math.PI * 2;
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
const grain = (g: CanvasRenderingContext2D, r: () => number, W: number, H: number, n: number, a = 0.05) => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,250,235,${a})` : `rgba(40,25,15,${a})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
};
const soft = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgb: string, a: number) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
};

// ---------------- textures ----------------
/** damask wallpaper tile (0.9 m): stripes + mirrored ornament, offset half-drop */
export const wallpaperHD = (key: string, base: string, motif: string, stripe: string) => ctex("wp" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 128) {
    g.fillStyle = stripe; g.fillRect(x + 60, 0, 8, 512);
    g.fillRect(x + 52, 0, 2, 512); g.fillRect(x + 74, 0, 2, 512);
  }
  const orn = (cx: number, cy: number, s: number) => {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = motif;
    for (const sd of [1, -1]) {
      g.save(); g.scale(sd, 1);
      g.beginPath(); g.moveTo(0, -78);
      g.bezierCurveTo(18, -60, 30, -40, 12, -18); g.bezierCurveTo(40, -30, 62, -8, 44, 14);
      g.bezierCurveTo(30, 30, 16, 10, 22, 0); g.bezierCurveTo(10, 8, 8, 30, 26, 46);
      g.bezierCurveTo(36, 58, 20, 76, 0, 84); g.lineTo(0, -78); g.fill();
      g.beginPath(); g.arc(52, -36, 6, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(34, 64, 12, 5, -0.6, 0, TAU); g.fill();
      g.restore();
    }
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.ellipse(0, 18, 7, 16, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, -36, 5, 12, 0, 0, TAU); g.fill(); g.globalCompositeOperation = "source-over";
    g.restore();
  };
  for (const [cx, cy] of [[0, 0], [256, 0], [512, 0], [0, 512], [256, 512], [512, 512], [128, 256], [384, 256]]) orn(cx, cy, 1.05);
  for (const [cx, cy] of [[128, 0], [384, 0], [128, 512], [384, 512], [0, 256], [256, 256], [512, 256]]) { g.fillStyle = motif; g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx + 8, cy); g.lineTo(cx, cy + 12); g.lineTo(cx - 8, cy); g.fill(); }
  grain(g, r, 512, 512, 2600, 0.035);
});
/** raised wood panelling, one panel per tile (1.2 m wide x 1.15 m tall) */
export const panelHD = (key: string, wood: string) => ctex("pan" + key, 512, 512, (g, r) => {
  g.fillStyle = wood; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { const y = r() * 512; g.strokeStyle = `rgba(40,20,10,${U(r, 0.04, 0.12)})`; g.lineWidth = U(r, 1, 3); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + 4 * Math.sin(x / 60 + i)); g.stroke(); }
  const P = 60, x0 = P, y0 = P + 10, w = 512 - 2 * P, h = 512 - 2 * P - 20;
  g.fillStyle = "rgba(255,235,200,0.16)"; g.fillRect(x0 - 10, y0 - 10, w + 20, 10); g.fillRect(x0 - 10, y0 - 10, 10, h + 20);
  g.fillStyle = "rgba(30,15,5,0.32)"; g.fillRect(x0 - 10, y0 + h, w + 20, 10); g.fillRect(x0 + w, y0 - 10, 10, h + 20);
  g.fillStyle = "rgba(30,15,5,0.12)"; g.fillRect(x0, y0, w, h);
  g.fillStyle = "rgba(255,235,200,0.10)"; g.fillRect(x0 + 18, y0 + 18, w - 36, h - 36);
  g.strokeStyle = "rgba(30,15,5,0.35)"; g.lineWidth = 3; g.strokeRect(x0 + 18, y0 + 18, w - 36, h - 36);
  g.fillStyle = "rgba(30,15,5,0.4)"; g.fillRect(0, 0, 4, 512); g.fillRect(508, 0, 4, 512);
  grain(g, r, 512, 512, 1500, 0.04);
});
/** herringbone parquet, 1024 px = 2 m */
export const herringHD = (key: string, cols: string[]) => {
  const t = ctex("hb" + key, 1024, 1024, (g, r) => {
    g.fillStyle = "#3a2414"; g.fillRect(0, 0, 1024, 1024);
    const L = 180, Wd = 45;
    g.save(); g.translate(512, 512); g.rotate(Math.PI / 4); g.translate(-1024, -1024);
    for (let row = 0; row < 2048 / Wd + 2; row++) for (let col = 0; col < 2048 / L + 2; col++) {
      for (const flip of [0, 1]) {
        const x = col * L + (row % 2) * (L / 2), y = row * Wd;
        g.save(); g.translate(x + (flip ? L / 2 : 0), y); if (flip) g.rotate(Math.PI / 2);
        const c = jit(r, cols[Math.floor(r() * cols.length)], 0.1, 4, 0.12);
        g.fillStyle = c; g.fillRect(1.5, 1.5, flip ? Wd - 3 : L - 3, flip ? L - 3 : Wd - 3);
        g.strokeStyle = "rgba(60,30,10,0.18)"; g.lineWidth = 1;
        for (let k = 0; k < 3; k++) { const yy = U(r, 6, (flip ? L : Wd) - 6); g.beginPath(); if (flip) { g.moveTo(4, yy); g.lineTo(Wd - 4, yy + U(r, -3, 3)); } else { g.moveTo(4, yy * Wd / L + 6); g.lineTo(L - 4, yy * Wd / L + 6 + U(r, -3, 3)); } g.stroke(); }
        g.fillStyle = "rgba(255,240,210,0.10)"; g.fillRect(2, 2, flip ? Wd - 4 : L - 4, 3);
        g.restore();
      }
    }
    g.restore();
    for (let i = 0; i < 10; i++) soft(g, r() * 1024, r() * 1024, U(r, 120, 260), "255,240,210", 0.06); // wax sheen
    grain(g, r, 1024, 1024, 5000, 0.04);
  });
  return t;
};
/** Persian rug, one image per rug (aspect 1.6) */
export const rugHD = (key: string, field: string, border: string, accent: string, light: string) => ctex("rug" + key, 1024, 640, (g, r) => {
  const W = 1024, H = 640;
  g.fillStyle = border; g.fillRect(0, 0, W, H);
  const band = (i: number, col: string, w: number) => { g.strokeStyle = col; g.lineWidth = w; g.strokeRect(i, i, W - 2 * i, H - 2 * i); };
  band(14, light, 6); band(26, accent, 4);
  for (let x = 40; x < W - 40; x += 34) for (const y of [52, H - 52]) { g.fillStyle = light; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 10, y); g.lineTo(x, y + 10); g.lineTo(x - 10, y); g.fill(); }
  for (let y = 70; y < H - 70; y += 34) for (const x of [52, W - 52]) { g.fillStyle = light; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 10, y); g.lineTo(x, y + 10); g.lineTo(x - 10, y); g.fill(); }
  band(76, accent, 5);
  g.fillStyle = field; g.fillRect(82, 82, W - 164, H - 164);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? accent : light; g.globalAlpha = 0.35; const x = U(r, 100, W - 100), y = U(r, 100, H - 100); g.beginPath(); g.ellipse(x, y, 6, 3, r() * 3, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const cx = W / 2, cy = H / 2;
  const med = (rx: number, ry: number, col: string) => { g.fillStyle = col; g.beginPath(); for (let k = 0; k <= 32; k++) { const a = (k / 32) * TAU, s = k % 2 ? 0.82 : 1; g.lineTo(cx + Math.cos(a) * rx * s, cy + Math.sin(a) * ry * s); } g.fill(); };
  med(250, 170, accent); med(200, 132, border); med(150, 98, light); med(96, 62, accent); med(46, 30, field);
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { g.fillStyle = accent; g.beginPath(); g.moveTo(cx + sx * (W / 2 - 82), cy + sy * (H / 2 - 82)); g.lineTo(cx + sx * (W / 2 - 230), cy + sy * (H / 2 - 82)); g.quadraticCurveTo(cx + sx * (W / 2 - 150), cy + sy * (H / 2 - 150), cx + sx * (W / 2 - 82), cy + sy * (H / 2 - 200)); g.fill(); }
  g.fillStyle = light; for (let x = 4; x < W; x += 9) { g.fillRect(x, 0, 3, 8); g.fillRect(x, H - 8, 3, 8); }
  grain(g, r, W, H, 9000, 0.06);
});
/** baize (card-table felt) */
export const feltHD = (col: string) => ctex("felt" + col, 256, 256, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12; i++) soft(g, r() * 256, r() * 256, U(r, 40, 90), r() < 0.5 ? "255,255,255" : "0,0,0", 0.05);
  grain(g, r, 256, 256, 4000, 0.06);
});
/** framed painting: kind 0 landscape, 1 portrait, 2 seascape */
export const paintingHD = (kind: number) => ctex("paint" + kind, 320, 256, (g, r) => {
  const W = 320, H = 256;
  g.fillStyle = "#b8862c"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e8c45a"; g.fillRect(6, 6, W - 12, 6); g.fillRect(6, 6, 6, H - 12);
  g.fillStyle = "#7a5418"; g.fillRect(6, H - 12, W - 12, 6); g.fillRect(W - 12, 6, 6, H - 12);
  const x0 = 26, y0 = 26, w = W - 52, h = H - 52;
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  if (kind === 1) {
    g.fillStyle = "#3a2a24"; g.fillRect(x0, y0, w, h); soft(g, x0 + w / 2, y0 + h / 2, 140, "160,110,60", 0.5);
    g.fillStyle = "#1e1a1e"; g.beginPath(); g.ellipse(x0 + w / 2, y0 + h + 10, 90, 70, 0, 0, TAU); g.fill();
    g.fillStyle = "#e8c09a"; g.beginPath(); g.ellipse(x0 + w / 2, y0 + h / 2 - 6, 34, 42, 0, 0, TAU); g.fill();
    g.fillStyle = "#4a3020"; g.beginPath(); g.ellipse(x0 + w / 2, y0 + h / 2 - 40, 38, 18, 0, 0, TAU); g.fill();
    g.fillStyle = "#f4f1ea"; g.beginPath(); g.moveTo(x0 + w / 2 - 20, y0 + h - 30); g.lineTo(x0 + w / 2 + 20, y0 + h - 30); g.lineTo(x0 + w / 2, y0 + h - 4); g.fill();
  } else {
    const sky = g.createLinearGradient(0, y0, 0, y0 + h); sky.addColorStop(0, kind ? "#7aa6c8" : "#9ec0d8"); sky.addColorStop(1, kind ? "#e8d0a8" : "#f2e2bc");
    g.fillStyle = sky; g.fillRect(x0, y0, w, h);
    for (let i = 0; i < 5; i++) soft(g, U(r, x0, x0 + w), U(r, y0, y0 + h * 0.4), U(r, 20, 40), "255,255,255", 0.6);
    if (kind === 2) {
      g.fillStyle = "#3a6a8a"; g.fillRect(x0, y0 + h * 0.6, w, h * 0.4);
      g.fillStyle = "#f4f1ea"; g.beginPath(); g.moveTo(x0 + 120, y0 + h * 0.6); g.lineTo(x0 + 150, y0 + h * 0.6 - 70); g.lineTo(x0 + 150, y0 + h * 0.6); g.fill();
      g.fillStyle = "#4a2a1a"; g.fillRect(x0 + 104, y0 + h * 0.6 - 4, 70, 10);
    } else {
      g.fillStyle = "#7a9a5a"; g.beginPath(); g.moveTo(x0, y0 + h * 0.62); g.quadraticCurveTo(x0 + w * 0.3, y0 + h * 0.4, x0 + w * 0.6, y0 + h * 0.58); g.quadraticCurveTo(x0 + w * 0.8, y0 + h * 0.66, x0 + w, y0 + h * 0.5); g.lineTo(x0 + w, y0 + h); g.lineTo(x0, y0 + h); g.fill();
      g.fillStyle = "#5a7a3a"; g.fillRect(x0, y0 + h * 0.78, w, h * 0.22);
      g.fillStyle = "#3a5a2a"; g.beginPath(); g.ellipse(x0 + w * 0.75, y0 + h * 0.5, 26, 34, 0, 0, TAU); g.fill();
      g.fillStyle = "#4a3020"; g.fillRect(x0 + w * 0.75 - 3, y0 + h * 0.55, 6, 34);
    }
  }
  grain(g, r, W, H, 1800, 0.07);
  g.restore();
});
/** rough prison stone blocks */
export const cellStoneHD = () => ctex("cellStone", 512, 512, (g, r) => {
  g.fillStyle = "#6c6a66"; g.fillRect(0, 0, 512, 512);
  const RH = 64;
  for (let row = 0; row < 8; row++) {
    let x = row % 2 ? -60 : 0;
    while (x < 512) {
      const w = U(r, 90, 150), c = jit(r, "#9a968e", 0.12, 4, 0.2);
      g.fillStyle = c; g.fillRect(x + 3, row * RH + 3, w - 6, RH - 6);
      g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x + 3, row * RH + 3, w - 6, 4);
      g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x + 3, row * RH + RH - 8, w - 6, 5);
      if (x + w > 512) { g.fillStyle = c; g.fillRect(x + 3 - 512, row * RH + 3, w - 6, RH - 6); }
      x += w;
    }
  }
  for (let i = 0; i < 20; i++) soft(g, r() * 512, r() * 512, U(r, 40, 110), "40,38,30", 0.12);
  for (let i = 0; i < 8; i++) { const x = r() * 512, gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(50,45,35,0.2)"); gr.addColorStop(1, "rgba(50,45,35,0)"); g.fillStyle = gr; g.fillRect(x, 0, U(r, 6, 18), 512); }
  grain(g, r, 512, 512, 5000, 0.08);
});
export const concreteHD = (key: string, base: string) => ctex("conc" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30; i++) soft(g, r() * 512, r() * 512, U(r, 30, 120), r() < 0.6 ? "30,28,24" : "255,255,255", 0.07);
  g.strokeStyle = "rgba(30,28,24,0.35)"; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
  grain(g, r, 512, 512, 7000, 0.07);
});
/** striped awning with a shop name on the valance */
export const awningHD = (name: string, a: string, b: string) => ctex("awn" + name + a, 512, 256, (g) => {
  for (let x = 0; x < 512; x += 64) { g.fillStyle = a; g.fillRect(x, 0, 32, 256); g.fillStyle = b; g.fillRect(x + 32, 0, 32, 256); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 0, 512, 40);
  g.fillStyle = a; g.fillRect(0, 186, 512, 70);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = a; g.beginPath(); g.arc(x + 16, 256, 16, Math.PI, 0); g.fill(); }
  g.fillStyle = b; g.font = "bold 46px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, 256, 220, 480);
});
/** Morris column posters */
export const posterHD = () => ctex("morris", 1024, 512, (g, r) => {
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 1024, 512);
  const P = [["#c0353a", "THÉÂTRE"], ["#2f4a7a", "CIRQUE"], ["#e8c45a", "OPÉRA"], ["#3a6a4a", "CAFÉ"], ["#7a3a6a", "BAL"], ["#d8763a", "CINÉMA"]];
  let x = 6;
  for (let i = 0; i < 6; i++) {
    const w = 160, [c, t] = P[i];
    g.fillStyle = c; g.fillRect(x, 20 + (i % 2) * 18, w, 470 - (i % 2) * 30);
    g.fillStyle = "#f4ead2"; g.font = "bold 34px Georgia, serif"; g.textAlign = "center"; g.fillText(t, x + w / 2, 110, w - 16);
    g.fillStyle = "rgba(244,234,210,0.8)"; g.beginPath(); g.arc(x + w / 2, 250, 46, 0, TAU); g.fill();
    for (let k = 0; k < 5; k++) g.fillRect(x + 20, 340 + k * 22, w - 40 - (k % 2) * 30, 8);
    x += w + 10;
  }
  grain(g, r, 1024, 512, 4000, 0.06);
});
/** shop / station sign */
export const signHD = (txt: string, bg: string, fg: string) => ctex("sign" + txt + bg, 512, 128, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, 492, 108);
  g.fillStyle = fg; g.font = "bold 64px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 256, 68, 470);
});
export const asphaltHD = () => ctex("asphaltHD", 512, 512, (g, r) => {
  g.fillStyle = "#4a4a50"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) soft(g, r() * 512, r() * 512, U(r, 30, 100), r() < 0.5 ? "20,20,24" : "120,120,128", 0.1);
  grain(g, r, 512, 512, 12000, 0.09);
});
export const slabHD = () => ctex("slabHD", 512, 512, (g, r) => {
  g.fillStyle = "#9a9284"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = jit(r, "#cfc6b4", 0.07, 3, 0.1); g.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x * 128 + 2, y * 128 + 2, 124, 3); }
  for (let i = 0; i < 14; i++) soft(g, r() * 512, r() * 512, U(r, 30, 90), "80,70,55", 0.1);
  grain(g, r, 512, 512, 5000, 0.06);
});

// ---------------- geometry ----------------
/** box with world-anchored UVs on its front (+z) / side (+-x) faces: patterns stay continuous across pieces */
export const wbox = (b: Batch, mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tw: number, th: number, vOff = 0) => {
  const u = (a: number) => a / tw, v = (a: number) => (a - vOff) / th;
  b.add(quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), u(x1), v(y1), u(x0), v(y0)), mat);
  b.add(quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), u(x1), v(y1), u(x0), v(y0)), mat);
  b.add(quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), u(z1), v(y1), u(z0), v(y0)), mat);
  b.add(quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), u(z1), v(y1), u(z0), v(y0)), mat);
  b.add(quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), 1, 1), mat);
};
export type RoomStyle = { paper: [string, string, string]; wood: string; trim: string; floor: string[]; rug?: [string, string, string, string]; rugW?: number; rugD?: number; rugZ?: number; drape?: string; key: string; art?: number[] };
const paperMat = (s: RoomStyle) => lam("paper" + s.key, () => ({ map: wallpaperHD(s.key, ...s.paper) }));
const panelMat = (s: RoomStyle) => lam("panel" + s.key, () => ({ map: panelHD(s.key, s.wood) }));
/** a dressed wall run from xa to xb at depth z (front face toward +z), with window holes */
const dressedWall = (b: Batch, s: RoomStyle, xa: number, xb: number, z: number, H: number, wins: [number, number][], winY: number[]) => {
  const Pm = paperMat(s), Wm = panelMat(s), Tr = lam("trim" + s.trim, () => ({ color: s.trim })), WN = 1.15;
  const xs = [xa, ...wins.flatMap(([c, w]) => [c - w / 2, c + w / 2]), xb];
  for (let i = 0; i < xs.length; i += 2) {
    wbox(b, Wm, xs[i], 0, z - 0.3, xs[i + 1], WN, z, 1.2, WN);
    wbox(b, Pm, xs[i], WN, z - 0.3, xs[i + 1], H, z, 0.9, 0.9, WN);
  }
  for (const [c, w] of wins) {
    wbox(b, Wm, c - w / 2, 0, z - 0.3, c + w / 2, Math.min(WN, winY[0]), z, 1.2, WN);
    if (winY[0] > WN) wbox(b, Pm, c - w / 2, WN, z - 0.3, c + w / 2, winY[0], z, 0.9, 0.9, WN);
    wbox(b, Pm, c - w / 2, winY[1], z - 0.3, c + w / 2, H, z, 0.9, 0.9, WN);
    // frame, mullions, sill
    b.add(boxGeo(V(c - w / 2 - 0.12, winY[0] - 0.08, z - 0.05), V(c + w / 2 + 0.12, winY[0], z + 0.12)), Tr);
    b.add(boxGeo(V(c - w / 2 - 0.12, winY[1], z - 0.05), V(c + w / 2 + 0.12, winY[1] + 0.14, z + 0.06)), Tr);
    for (const sx of [-1, 1]) b.add(boxGeo(V(c + sx * w / 2 - 0.08, winY[0], z - 0.05), V(c + sx * w / 2 + 0.08, winY[1], z + 0.06)), Tr);
    b.add(boxGeo(V(c - 0.035, winY[0], z - 0.2), V(c + 0.035, winY[1], z - 0.12)), Tr);
    for (const yy of [winY[0] + (winY[1] - winY[0]) / 3, winY[0] + (2 * (winY[1] - winY[0])) / 3]) b.add(boxGeo(V(c - w / 2, yy - 0.03, z - 0.2), V(c + w / 2, yy + 0.03, z - 0.12)), Tr);
    if (s.drape) drapes(b, c, w, z + 0.08, winY[1] + 0.35, s.drape);
  }
  b.add(boxGeo(V(xa, 0, z - 0.02), V(xb, 0.14, z + 0.05)), Tr);                  // skirting
  for (let i = 0; i < xs.length; i += 2) b.add(boxGeo(V(xs[i], WN - 0.02, z - 0.02), V(xs[i + 1], WN + 0.06, z + 0.05)), Tr); // chair rail (piers only)
  b.add(boxGeo(V(xa, H - 0.3, z - 0.02), V(xb, H, z + 0.12)), Tr);              // cornice
  b.add(boxGeo(V(xa, H - 0.38, z - 0.02), V(xb, H - 0.3, z + 0.06)), Tr);
};
/** velvet drapes with folds either side of a window, plus a pelmet */
export const drapes = (b: Batch, c: number, w: number, z: number, top: number, col: string) => {
  const D = lam("drape" + col, () => ({ color: col })), G = lam("gold", () => ({ color: "#d8b84a" }));
  for (const sd of [-1, 1]) {
    const g = new THREE.CylinderGeometry(0.09, 0.12, top, 8, 1, false);
    for (let k = 0; k < 4; k++) b.add(g, D, M4(c + sd * (w / 2 + 0.02 + k * 0.13), top / 2, z + 0.04 * (k % 2)));
    b.add(boxGeo(V(c + sd * (w / 2 + 0.2) - 0.3, 1.16, z - 0.1), V(c + sd * (w / 2 + 0.2) + 0.3, 1.24, z + 0.16)), G); // gold tie-back band
  }
  b.add(boxGeo(V(c - w / 2 - 0.65, top - 0.4, z - 0.05), V(c + w / 2 + 0.65, top, z + 0.16)), D);
  b.add(boxGeo(V(c - w / 2 - 0.68, top - 0.05, z - 0.05), V(c + w / 2 + 0.68, top + 0.04, z + 0.2)), G);
};
/** dressed interior: back wall at z0 (with windows), side walls, herringbone floor, rug, paintings + sconces on piers */
export const room2 = (b: Batch, s: RoomStyle, z0: number, half: number, H: number, wins: [number, number][], winY = [0.9, 3.2], zFront = 8) => {
  b.add(plane(-half, half, z0, zFront, 2), lam("floor" + s.key, () => ({ map: herringHD(s.key, s.floor) })));
  dressedWall(b, s, -half, half, z0, H, wins, winY);
  // side walls: same dressing turned 90 deg (rendered as boxes along z with world UVs on their x faces)
  const Pm = paperMat(s), Wm = panelMat(s), Tr = lam("trim" + s.trim, () => ({ color: s.trim }));
  for (const sd of [-1, 1]) {
    const xi = sd * half, xo = sd * (half + 0.3);
    wbox(b, Wm, Math.min(xi, xo), 0, z0 - 0.3, Math.max(xi, xo), 1.15, zFront, 1.2, 1.15);
    wbox(b, Pm, Math.min(xi, xo), 1.15, z0 - 0.3, Math.max(xi, xo), H, zFront, 0.9, 0.9, 1.15);
    b.add(boxGeo(V(Math.min(xi, xi - sd * 0.05), 1.13, z0), V(Math.max(xi, xi - sd * 0.05), 1.21, zFront)), Tr);
    b.add(boxGeo(V(Math.min(xi, xi - sd * 0.12), H - 0.3, z0), V(Math.max(xi, xi - sd * 0.12), H, zFront)), Tr);
  }
  if (s.rug) {
    const rw = s.rugW ?? 7, rd = s.rugD ?? 4.4, rz = s.rugZ ?? z0 + 2.6;
    rug(b, s.key, s.rug, 0, rz, rw, rd);
  }
  // paintings and sconces on the wall piers
  const piers: number[] = [];
  const edges = [-half, ...wins.flatMap(([c, w]) => [c - w / 2 - 0.5, c + w / 2 + 0.5]), half];
  for (let i = 0; i < edges.length; i += 2) { const a = edges[i], bb = edges[i + 1]; if (bb - a > 1.3) piers.push((a + bb) / 2); else piers.push(NaN); }
  const spots = s.art ? s.art.map((x) => [x, 1.4] as [number, number]) : piers.map((x, i) => [x, Math.min(1.6, (edges[2 * i + 1] - edges[2 * i]) * 0.55)] as [number, number]);
  spots.filter(([x]) => !Number.isNaN(x)).forEach(([x, big], i) => {
    painting(b, x, 2.35, z0 + 0.02, big, big * 0.8, i % 3);
    if (H > 3.2) for (const sd of [-1, 1]) sconce(b, x + sd * (big / 2 + 0.3), 2.3, z0);
  });
};
export const rug = (b: Batch, key: string, pal: [string, string, string, string], x: number, z: number, w: number, d: number) => {
  const y = 0.008;
  b.add(quad(V(x - w / 2, y, z + d / 2), V(x + w / 2, y, z + d / 2), V(x + w / 2, y, z - d / 2), V(x - w / 2, y, z - d / 2)), lam("rugM" + key, () => ({ map: rugHD(key, ...pal) })));
};
export const painting = (b: Batch, x: number, y: number, z: number, w: number, h: number, kind: number) => {
  b.add(boxGeo(V(x - w / 2, y - h / 2, z), V(x + w / 2, y + h / 2, z + 0.05)), lam("frameBack", () => ({ color: "#7a5418" })));
  b.add(quad(V(x - w / 2, y - h / 2, z + 0.052), V(x + w / 2, y - h / 2, z + 0.052), V(x + w / 2, y + h / 2, z + 0.052), V(x - w / 2, y + h / 2, z + 0.052)), lam("painting" + kind, () => ({ map: paintingHD(kind) })));
};
export const sconce = (b: Batch, x: number, y: number, z: number) => {
  const G = lam("gold", () => ({ color: "#d8b84a" }));
  b.add(boxGeo(V(x - 0.06, y - 0.15, z), V(x + 0.06, y + 0.1, z + 0.04)), G);
  b.add(boxGeo(V(x - 0.02, y - 0.02, z), V(x + 0.02, y + 0.02, z + 0.2)), G);
  b.add(new THREE.CylinderGeometry(0.1, 0.06, 0.16, 10).translate(x, y + 0.1, z + 0.22), lam("shade", () => ({ color: "#fff0c8", emissive: "#ffd890", emissiveIntensity: 1.1 })));
};
/** dining / meeting chair facing `ry` (0 = sitter faces +z) */
export const chair = (b: Batch, x: number, z: number, ry: number, wood = "#4a2a18", seat = "#7a2632") => {
  const Wd = lam("chairW" + wood, () => ({ color: wood })), St = lam("chairS" + seat, () => ({ color: seat })), m = M4(x, 0, z, ry);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(new THREE.CylinderGeometry(0.025, 0.02, 0.46, 6).translate(sx * 0.2, 0.23, sz * 0.2), Wd, m);
  b.add(boxGeo(V(-0.24, 0.44, -0.24), V(0.24, 0.52, 0.24)), St, m);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * 0.2 - 0.025, 0.5, -0.25), V(sx * 0.2 + 0.025, 1.05, -0.2)), Wd, m);
  b.add(boxGeo(V(-0.2, 0.62, -0.25), V(0.2, 1.0, -0.21)), St, m);
  b.add(boxGeo(V(-0.24, 1.0, -0.26), V(0.24, 1.06, -0.19)), Wd, m);
};
/** long table with turned legs and a cloth (felt/linen) and dressing on top */
export const table2 = (b: Batch, x: number, z: number, w: number, d: number, h: number, wood: string, cloth?: string, dress = true) => {
  const T = lam("tblW" + wood, () => ({ color: wood }));
  b.add(boxGeo(V(x - w / 2, h - 0.07, z - d / 2), V(x + w / 2, h, z + d / 2)), cloth ? lam("felt" + cloth, () => ({ map: rep(feltHD(cloth), Math.ceil(w), Math.ceil(d)) })) : T);
  if (cloth) b.add(boxGeo(V(x - w / 2 - 0.01, h - 0.1, z - d / 2 - 0.01), V(x + w / 2 + 0.01, h - 0.07, z + d / 2 + 0.01)), lam("gold", () => ({ color: "#d8b84a" })));
  b.add(boxGeo(V(x - w / 2 + 0.05, h - 0.22, z - d / 2 + 0.05), V(x + w / 2 - 0.05, h - 0.1, z + d / 2 - 0.05)), T);
  const legs = w > 3 ? [-0.5, -0.17, 0.17, 0.5] : [-0.5, 0.5];
  for (const fx of legs) for (const sz of [-1, 1]) {
    const lx = x + fx * (w - 0.24), lz = z + sz * (d / 2 - 0.12);
    b.add(new THREE.CylinderGeometry(0.045, 0.035, h - 0.22, 8).translate(lx, (h - 0.22) / 2, lz), T);
    b.add(new THREE.SphereGeometry(0.07, 8, 6).translate(lx, (h - 0.22) * 0.55, lz), T);
  }
  if (!dress) return;
  const P = lam("paperW", () => ({ color: "#f4efe2" })), Ink = lam("inkPot", () => ({ color: "#1e2238" })), Gl = lam("glass", () => ({ color: "#cfe3ea" })), G = lam("gold", () => ({ color: "#d8b84a" }));
  const n = Math.max(2, Math.round(w / 0.9));
  for (let k = 0; k < n; k++) {
    const px = x - w / 2 + (k + 0.5) * (w / n);
    b.add(boxGeo(V(-0.15, 0, -0.11), V(0.15, 0.008, 0.11)), P, new THREE.Matrix4().makeRotationY(0.15 * Math.sin(k * 2.3)).setPosition(px + 0.1, h, z + 0.12 * Math.cos(k)));
    b.add(new THREE.CylinderGeometry(0.035, 0.03, 0.14, 10).translate(px - 0.22, h + 0.07, z - 0.12), Gl);
    if (k % 2 === 0) b.add(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 10).translate(px + 0.32, h + 0.03, z - 0.18), Ink);
  }
  if (w > 2) for (const sx of [-0.25, 0.25]) { // candelabra
    const cx = x + sx * w;
    b.add(new THREE.CylinderGeometry(0.03, 0.09, 0.32, 10).translate(cx, h + 0.16, z), G);
    for (const dx of [-0.12, 0, 0.12]) {
      b.add(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 6).translate(cx + dx, h + 0.41, z), lam("candle", () => ({ color: "#f4efe2" })));
      b.add(new THREE.SphereGeometry(0.022, 6, 5).scale(1, 1.6, 1).translate(cx + dx, h + 0.53, z), lam("flame", () => ({ color: "#ffd890", emissive: "#ffb040", emissiveIntensity: 2.2 })));
    }
    b.add(boxGeo(V(cx - 0.14, h + 0.3, z - 0.015), V(cx + 0.14, h + 0.33, z + 0.015)), G);
  }
};
export const pottedPalm = (b: Batch, x: number, z: number, h = 1.7) => {
  b.add(new THREE.CylinderGeometry(0.24, 0.17, 0.42, 14).translate(x, 0.21, z), lam("pot", () => ({ color: "#b8603a" })));
  b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 14).translate(x, 0.42, z), lam("potRim", () => ({ color: "#d07848" })));
  const L = lam("palmLeaf", () => ({ color: "#4f8a3c", side: THREE.DoubleSide }));
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU, len = h * (0.5 + 0.12 * (k % 3)), tilt = 0.5 + 0.25 * (k % 2);
    const g = new THREE.ConeGeometry(0.11, len, 4, 1).translate(0, len / 2, 0).rotateX(tilt).rotateY(a);
    b.add(g, L, M4(x, 0.42, z));
  }
};
export const bookcase = (b: Batch, x: number, z: number, w = 1.6, h = 2.5, wood = "#4a2c18") => {
  const Wd = lam("case" + wood, () => ({ color: wood }));
  b.add(boxGeo(V(x - w / 2, 0, z - 0.42), V(x + w / 2, h, z - 0.38)), Wd);
  for (const sx of [-1, 1]) b.add(boxGeo(V(x + sx * w / 2 - 0.05, 0, z - 0.42), V(x + sx * w / 2 + 0.05, h, z)), Wd);
  b.add(boxGeo(V(x - w / 2 - 0.08, h - 0.1, z - 0.44), V(x + w / 2 + 0.08, h + 0.04, z + 0.05)), Wd);
  const cols = ["#8a2f3a", "#2f4a6a", "#3a6a3a", "#c9a84a", "#5a3a6a", "#6a4a2a", "#2a2a30"];
  let seed = Math.abs(Math.round(x * 13 + z * 7));
  const rr = () => { seed = (seed * 16807) % 2147483647 || 7; return seed / 2147483647; };
  for (let row = 0; row < 5; row++) {
    const y = 0.12 + row * (h - 0.25) / 5;
    b.add(boxGeo(V(x - w / 2, y - 0.03, z - 0.4), V(x + w / 2, y, z)), Wd);
    let bx = x - w / 2 + 0.07;
    while (bx < x + w / 2 - 0.12) {
      const bw = 0.04 + 0.05 * rr(), bh = 0.25 + 0.17 * rr(), c = cols[Math.floor(rr() * cols.length)];
      if (rr() < 0.08) { bx += 0.1; continue; }
      b.add(boxGeo(V(bx, y, z - 0.33), V(bx + bw, y + bh, z - 0.05)), lam("book" + c, () => ({ color: c })));
      bx += bw + 0.006;
    }
  }
};
export const chandelier2 = (b: Batch, x: number, y: number, z: number, s = 1) => {
  const G = lam("gold", () => ({ color: "#d8b84a" })), Bl = lam("bulbC", () => ({ color: "#fff2c0", emissive: "#ffe08a", emissiveIntensity: 1.6 })), Cr = lam("crystal", () => ({ color: "#e8f2f8" }));
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6).translate(0, 0.7 + 0.3, 0), G, M4(x, y, z, 0, s));
  for (const [rad, yy, n] of [[0.62, 0, 10], [0.36, 0.32, 6]] as [number, number, number][]) {
    b.add(new THREE.TorusGeometry(rad, 0.035, 8, 32).rotateX(Math.PI / 2).translate(0, yy, 0), G, M4(x, y, z, 0, s));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      b.add(new THREE.SphereGeometry(0.065, 8, 6).translate(rad * Math.cos(a), yy + 0.12, rad * Math.sin(a)), Bl, M4(x, y, z, 0, s));
      b.add(new THREE.OctahedronGeometry(0.04).scale(1, 2, 1).translate(rad * Math.cos(a + 0.3), yy - 0.15, rad * Math.sin(a + 0.3)), Cr, M4(x, y, z, 0, s));
    }
  }
  b.add(new THREE.SphereGeometry(0.16, 10, 8).scale(1, 1.4, 1), G, M4(x, y - 0.1, z, 0, s));
};
// ---------------- streets ----------------
export const morris = (b: Batch, x: number, z: number) => {
  const Gn = lam("morrisG", () => ({ color: "#2f5a3a" }));
  b.add(new THREE.CylinderGeometry(0.62, 0.62, 2.6, 24, 1, true).translate(x, 1.6, z), lam("morrisP", () => ({ map: posterHD() })));
  b.add(new THREE.CylinderGeometry(0.7, 0.75, 0.3, 24).translate(x, 0.15, z), Gn);
  b.add(new THREE.CylinderGeometry(0.72, 0.66, 0.2, 24).translate(x, 2.95, z), Gn);
  b.add(new THREE.SphereGeometry(0.62, 20, 10, 0, TAU, 0, Math.PI / 2).scale(1, 0.75, 1).translate(x, 3.05, z), Gn);
  b.add(new THREE.SphereGeometry(0.12, 10, 8).translate(x, 3.6, z), Gn);
};
export const bench = (b: Batch, x: number, z: number, ry = 0) => {
  const Wd = lam("benchW", () => ({ color: "#3a6a4a" })), Ir = lam("lampIron", () => ({ color: "#2a2a30" })), m = M4(x, 0, z, ry);
  for (const sx of [-0.7, 0.7]) b.add(boxGeo(V(sx - 0.04, 0, -0.25), V(sx + 0.04, 0.45, 0.25)), Ir, m);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(-0.85, 0.42, -0.24 + k * 0.12), V(0.85, 0.46, -0.16 + k * 0.12)), Wd, m);
  for (let k = 0; k < 3; k++) b.add(boxGeo(V(-0.85, 0.58 + k * 0.13, -0.27), V(0.85, 0.66 + k * 0.13, -0.23)), Wd, m);
};
export const streetLamp = (b: Batch, x: number, z: number, h = 3.6) => {
  const D = lam("lampIron", () => ({ color: "#2a2a30" }));
  b.add(new THREE.CylinderGeometry(0.16, 0.22, 0.6, 10).translate(x, 0.3, z), D);
  b.add(new THREE.CylinderGeometry(0.05, 0.08, h, 8).translate(x, h / 2, z), D);
  b.add(new THREE.CylinderGeometry(0.16, 0.1, 0.4, 6).translate(x, h + 0.2, z), lam("lampGlass", () => ({ color: "#f6e6a8", emissive: "#f6d27a", emissiveIntensity: 0.9 })));
  b.add(new THREE.ConeGeometry(0.22, 0.22, 6).translate(x, h + 0.5, z), D);
};
/** shop front awning sloping out from a facade at z (front +z), x centre, width w, top y */
export const awning = (b: Batch, x: number, z: number, w: number, y: number, name: string, a: string, c: string) => {
  const A = lam("awn" + name + a, () => ({ map: awningHD(name, a, c), side: THREE.DoubleSide }));
  b.add(quad(V(x - w / 2, y - 0.7, z + 1.2), V(x + w / 2, y - 0.7, z + 1.2), V(x + w / 2, y, z + 0.02), V(x - w / 2, y, z + 0.02), 1, 0.72, 0, 0), A);
  b.add(quad(V(x - w / 2, y - 1.0, z + 1.21), V(x + w / 2, y - 1.0, z + 1.21), V(x + w / 2, y - 0.7, z + 1.21), V(x - w / 2, y - 0.7, z + 1.21), 1, 1, 0, 0.72), A);
};
/** Haussmann dressing in front of an existing facade box: iron balconies, mansard roof with dormers, cornice */
export const haussmann = (b: Batch, x: number, z: number, w: number, h: number, d: number) => {
  const Ir = lam("balcIron", () => ({ color: "#26262c" })), Sl = lam("mansard", () => ({ color: "#5a6070" })), St = lam("cornice", () => ({ color: "#efe3c8" }));
  for (const fy of [2.9, Math.min(h - 1.2, 2.9 * 3)]) {
    b.add(boxGeo(V(x - w / 2 + 0.2, fy, z), V(x + w / 2 - 0.2, fy + 0.12, z + 0.6)), St);
    b.add(boxGeo(V(x - w / 2 + 0.2, fy + 0.95, z + 0.54), V(x + w / 2 - 0.2, fy + 1.0, z + 0.6)), Ir);
    for (let xx = x - w / 2 + 0.25; xx < x + w / 2 - 0.2; xx += 0.18) b.add(boxGeo(V(xx, fy + 0.12, z + 0.56), V(xx + 0.025, fy + 0.95, z + 0.585)), Ir);
  }
  b.add(boxGeo(V(x - w / 2 - 0.1, h - 0.1, z - d), V(x + w / 2 + 0.1, h + 0.3, z + 0.35)), St);
  const m = 2.6;
  b.add(quad(V(x - w / 2, h + 0.3, z + 0.2), V(x + w / 2, h + 0.3, z + 0.2), V(x + w / 2, h + 0.3 + m, z - 1.0), V(x - w / 2, h + 0.3 + m, z - 1.0)), Sl);
  b.add(boxGeo(V(x - w / 2, h + 0.3, z - d), V(x + w / 2, h + 0.3 + m, z - 1.0)), Sl);
  for (let k = 0; k < Math.floor(w / 2.4); k++) {
    const dx = x - w / 2 + 1.2 + k * 2.4;
    b.add(boxGeo(V(dx - 0.4, h + 0.6, z - 0.6), V(dx + 0.4, h + 1.8, z - 0.2)), St);
    b.add(boxGeo(V(dx - 0.28, h + 0.75, z - 0.19), V(dx + 0.28, h + 1.6, z - 0.17)), lam("dormWin", () => ({ color: "#3a4a62" })));
  }
  for (let k = 0; k < 2; k++) b.add(boxGeo(V(x - w / 2 + 1 + k * (w - 2.6), h + 2.4, z - 3), V(x - w / 2 + 1.6 + k * (w - 2.6), h + 3.6, z - 2.4)), lam("chimney", () => ({ color: "#b8604a" })));
};
/** NYC fire escape on a facade */
export const fireEscape = (b: Batch, x: number, z: number, w: number, h: number) => {
  const Ir = lam("fireEsc", () => ({ color: "#1e1e24" }));
  for (let fy = 3.2; fy < h - 1; fy += 3) {
    b.add(boxGeo(V(x - w / 2, fy, z), V(x + w / 2, fy + 0.06, z + 0.9)), Ir);
    b.add(boxGeo(V(x - w / 2, fy + 0.95, z + 0.86), V(x + w / 2, fy + 1.0, z + 0.9)), Ir);
    for (let xx = x - w / 2; xx <= x + w / 2; xx += 0.5) b.add(boxGeo(V(xx, fy, z + 0.86), V(xx + 0.03, fy + 1, z + 0.89)), Ir);
    const dir = Math.round(fy / 3) % 2 ? 1 : -1;
    b.add(new THREE.BoxGeometry(3.6, 0.05, 0.45).rotateZ(dir * 0.82).translate(x + dir * 0.2, fy + 1.5, z + 0.45), Ir);
  }
};
export const waterTower = (b: Batch, x: number, y: number, z: number) => {
  const Wd = lam("wtWood", () => ({ color: "#7a5a3a" })), Ir = lam("fireEsc", () => ({ color: "#1e1e24" }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(boxGeo(V(x + sx * 0.9 - 0.06, y, z + sz * 0.9 - 0.06), V(x + sx * 0.9 + 0.06, y + 1.6, z + sz * 0.9 + 0.06)), Ir);
  b.add(new THREE.CylinderGeometry(1.3, 1.3, 2.4, 16).translate(x, y + 2.8, z), Wd);
  b.add(new THREE.ConeGeometry(1.45, 1.0, 16).translate(x, y + 4.5, z), Wd);
};
export const lifeRing = (b: Batch, x: number, y: number, z: number) => {
  b.add(new THREE.TorusGeometry(0.32, 0.08, 8, 20), lam("ringO", () => ({ color: "#e8602a" })), M4(x, y, z));
};
export const lifeboat = (b: Batch, x: number, y: number, z: number, L = 5) => {
  b.add(new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2).scale(L / 2, 0.8, 0.9).translate(x, y, z), lam("boatW", () => ({ color: "#f4f1ea" })));
  b.add(boxGeo(V(x - L / 2 + 0.3, y - 0.02, z - 0.85), V(x + L / 2 - 0.3, y + 0.08, z + 0.85)), lam("boatTop", () => ({ color: "#a8784a" })));
  for (const sx of [-1, 1]) b.add(new THREE.TorusGeometry(1.0, 0.05, 6, 12, Math.PI / 2).rotateY(Math.PI / 2).translate(x + sx * (L / 2 - 0.5), y + 0.4, z - 0.7), lam("davit", () => ({ color: "#f4f1ea" })));
};
export { rep };
