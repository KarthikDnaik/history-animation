// Places and cast of "The Pig War" (1859, 9:16 short). Cameras sit on +z looking toward -z (+x = screen right).
// Direction sheet: San Juan Island, Pacific Northwest. Palette: fir green, sea blue, British red, Union navy, pig pink.
// One key moment per shot, on a narration word. Anticipation -> release -> settle on hops / impacts. Staging on twos.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, beamBetween, cart, tent } from "./props3d";
import { Kit, quad } from "./build";
import { rep, ctex, stoneHD, roofHD, grassHD, planksHD, beamHD } from "./paint";
import { signHD, wbox, panelHD, drapes, chandelier2, painting, rug, bookcase, chair, table2, pottedPalm } from "./decor";
import { Pen, SKINS, INK, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxCal, fxSay, henSide, rrect, txt, tw, curve, ellPts, DEF_LIGHT, thickAngle } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart, SHOTS, FPS } from "./story";

type P2 = [number, number];
// ---------------- cast (1859) ----------------
const CUTLAR: Outfit = { jacket: "#a8402e", pants: "#3a4a6a", boots: "#4a3020", hat: "slouch", hatCol: "#7a5a3a", moustache: "#5a3a22", skin: SKINS[1], belt: "#3a2a1e" };
const GRIFFIN: Outfit = { jacket: "#2f6a43", pants: "#5a4a3a", boots: "#2a1e16", hat: "tophat", hatCol: "#2a2a30", moustache: "#c0622a", skin: SKINS[0], buttons: "#e8c45a" };
const BRITOFF: Outfit = { jacket: "#c8323a", pants: "#23232e", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#e8c45a", sash: "#e8c45a", sword: true, moustache: "#4a3020", skin: SKINS[2], build: "stout" };
const PICKETT: Outfit = { jacket: "#2a3f78", pants: "#7d94c0", boots: INK, hat: "slouch", hatCol: "#1e1e26", buttons: "#e8c45a", sash: "#d8443a", sword: true, moustache: "#6a4a2a", skin: SKINS[1] };
const ADMIRAL: Outfit = { jacket: "#1e2a4a", pants: "#f1efe6", boots: INK, hat: "tricorne", hatCol: "#1e1e24", trim: "#e8c45a", buttons: "#e8c45a", moustache: "#d8d4cc", skin: SKINS[0], build: "stout" };
const KAISER: Outfit = { jacket: "#2a3550", pants: "#1e1e2a", boots: INK, hat: "pickel", hatCol: "#1e1e24", trim: "#e8c45a", buttons: "#e8c45a", sash: "#e8a33a", moustache: "#eeeae2", skin: SKINS[0], build: "stout" };
const US = (v: number): Outfit => ({ jacket: "#2f4a8a", pants: "#8aa0c8", boots: INK, hat: "slouch", hatCol: "#1e1e26", belt: "#1e1e24", buttons: "#e8c45a", rifle: true, skin: SKINS[v % 4], moustache: v % 2 ? "#4a3426" : undefined });
const RED = (v: number): Outfit => ({ jacket: "#c8323a", pants: "#23232e", boots: INK, hat: "shako", hatCol: "#1e1e24", belt: "#f1efe6", buttons: "#e8c45a", rifle: true, skin: SKINS[(v + 1) % 4], moustache: v % 2 ? undefined : "#5a3a22" });

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

// ---------------- the pig ----------------
type PigOpts = { phase?: number; mode?: "stand" | "walk" | "eat" | "dead" | "ghost"; eye?: "dot" | "happy" | "blink" | "x" | "shock" | "look"; chew?: number };
/** a round cartoon pig facing screen-right, 600 x 1000 design space (trotters on y = 975) */
const pigSide = (p: Pen, o: PigOpts = {}) => {
  const { phase = 0, mode = "stand", chew = 0 } = o, eye = mode === "dead" ? "x" : o.eye ?? "dot";
  const g = p.g, two = Math.PI * 2, light = DEF_LIGHT, th = thickAngle(light);
  const ghost = mode === "ghost";
  const PK = ghost ? "#fbf7ff" : "#f6aab8", PS = ghost ? "#d6cdea" : "#d9808f", SN = ghost ? "#f0e8fb" : "#ef93a4", HF = "#6a3a3e";
  g.save();
  g.translate(14, 975 * 0.12); g.scale(0.88, 0.88); // keep the snout + potato inside the 600-wide card (was clipped at x = 600)
  if (ghost) g.globalAlpha = 0.88;
  if (mode === "dead") { g.translate(0, 1690); g.scale(1, -1); }
  const limb = (pts: P2[], w: number, col: string) => { p.stroke(pts, w + 16, INK); p.stroke(pts, w, col); };
  const sw = (ph: number) => (mode === "walk" ? Math.sin(two * (phase + ph)) : 0);
  const legs: [number, number][] = [[175, 0], [225, 0.5], [395, 0.5], [445, 0]];
  if (ghost) { // little wings
    for (const s of [0, 1]) { const W2 = ellPts(250 + 40 * s, 600 - 20 * s, 90, 55, 0, 360, -30 - 20 * s); p.poly(W2, "#ffffff", 9); }
  }
  for (const [k, [x, ph]] of legs.entries()) if (k % 2 === 1) { const s = sw(ph); limb([[x, 820], [x + 22 * s, 960]], 54, PS); p.ell(x + 22 * s, 962, 28, 14, HF, 7); }
  // curly tail
  const tl: P2[] = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * two * 1.3 + phase * 3, r = 34 - 18 * i / 24; tl.push([100 - 30 + r * Math.cos(a) - 10 * i / 24, 690 + r * Math.sin(a)]); }
  p.stroke(tl, 26, INK); p.stroke(tl, 12, PK);
  const body = ellPts(300, 765, 222, 158);
  p.shadedFill(body, PK, PS, light, 270, 0.4);
  if (!ghost) p.clip(body, () => { for (const [x, y, rx, ry] of [[200, 690, 34, 22], [330, 840, 44, 20], [250, 790, 18, 14]]) p.ell(x, y, rx, ry, "rgba(201,138,106,0.55)", 0); });
  p.inkRing(body, 12, th);
  for (const [k, [x, ph]] of legs.entries()) if (k % 2 === 0) { const s = sw(ph); limb([[x, 830], [x + 22 * s, 960]], 58, PK); p.ell(x + 22 * s, 962, 30, 15, HF, 7); }
  // head
  const eat = mode === "eat", hx = 505, hy = (eat ? 790 : 690) + (eat ? 10 * Math.sin(chew * two) : 0);
  for (const s of [0, 1]) { const E: P2[] = [[hx - 70 + 50 * s, hy - 70], [hx - 95 + 60 * s, hy - 175], [hx - 10 + 50 * s, hy - 95]]; p.poly(E, s ? PK : PS, 9); if (s) p.poly([[hx - 30, hy - 82], [hx - 40, hy - 148], [hx + 18, hy - 96]], SN, 0); }
  const H = ellPts(hx, hy, 118, 108);
  p.shadedFill(H, PK, PS, light, 100, 0.4); p.inkRing(H, 10, th);
  p.ell(hx - 40, hy + 40, 26, 16, ghost ? "#f4d8ec" : "#f58aa0", 0); // cheek
  const Sn = ellPts(hx + 100, hy + 28, 50, 44);
  p.shadedFill(Sn, SN, PS, light, 60, 0.4); p.inkRing(Sn, 9, th);
  p.ell(hx + 88, hy + 26, 8, 13, "#7a3a44", 0); p.ell(hx + 116, hy + 26, 8, 13, "#7a3a44", 0);
  if (eat) { p.ell(hx + 112, hy + 92, 40, 30, "#b98a52", 8); p.ell(hx + 100, hy + 84, 6, 5, "#7a5a32", 0); }
  else if (eye === "shock") p.ell(hx + 70, hy + 90, 18, 22, "#5a1e28", 7);
  else p.arc(hx + 60, hy + 70, 30, 18, 20, 160, 7);
  const ex = [hx + 10, hx + 56], ey = [hy - 30, hy - 36];
  for (let i = 0; i < 2; i++) {
    const x = ex[i], y = ey[i];
    if (eye === "x") { p.stroke([[x - 14, y - 14], [x + 14, y + 14]], 8); p.stroke([[x + 14, y - 14], [x - 14, y + 14]], 8); }
    else if (eye === "happy") p.arc(x, y + 4, 15, 12, 200, 340, 8);
    else if (eye === "blink") p.stroke([[x - 14, y], [x + 14, y]], 8);
    else if (eye === "shock") { p.ell(x, y, 19, 23, "#ffffff", 6); p.dot(x, y, 5); }
    else { p.ell(x, y, 15, 18, "#ffffff", 6); p.dot(x + (eye === "look" ? -6 : 4), y + 2, 7); }
  }
  if (ghost) { p.ell(hx - 10, hy - 160, 80, 22, null, 0); p.arc(hx - 10, hy - 160, 80, 22, 0, 360, 22, INK); p.arc(hx - 10, hy - 160, 80, 22, 0, 360, 12, "#f6d04a"); }
  g.restore();
};
const pigAt = (c: Ctx, o: PigOpts, x: number, z: number, scale = 0.62, mirror = false, y = 0, shadow = true) => {
  const key = `pig${o.mode ?? "stand"}${o.eye ?? ""}${q(o.phase ?? 0, 8)}${q(o.chew ?? 0, 4)}`;
  beast(c, key, (p) => pigSide(p, o), x, z, scale / 0.88, mirror, y, shadow);
};
const hens = (c: Ctx, xs: [number, number][]) => xs.forEach(([x, z], k) => { const ph = q((c.t * 0.6 + hh(k, 3)) % 1, 8); beast(c, `hen${k}${ph}`, (p) => henSide(p, { mode: ph < 0.5 ? "peck" : "walk", phase: ph }), x, z, 0.32, k % 2 === 1); });

// ---------------- effect drawings ----------------
const paper = (p: Pen, col = "#f8f1dc") => p.poly(rrect(20, 20, 500, 620, 10), col, 9);
const fxWarrant = (p: Pen) => {
  paper(p);
  txt(p, "ARREST", 260, 92, 64, "#5a1e1e", "900", "center", "Georgia, serif");
  txt(p, "WARRANT", 260, 156, 64, "#5a1e1e", "900", "center", "Georgia, serif");
  const g = p.g; g.font = "32px Georgia, serif"; g.fillStyle = "#2a2010"; g.textAlign = "left";
  g.fillText("Name: Lyman Cutlar", 50, 250); g.fillText("Crime: shot a pig", 50, 300); g.fillText("By order of the Crown", 50, 350);
  for (let j = 0; j < 3; j++) p.stroke([[50, 410 + 44 * j], [470, 410 + 44 * j]], 4, "#a8a088");
  p.ell(400, 560, 50, 50, "#b8283a", 8); txt(p, "VR", 400, 562, 40, "#f0c0b0", "900", "center", "Georgia, serif");
};
/** orders, torn apart by k (0 whole .. 1 two halves flying) */
const fxOrders = (k: number) => (p: Pen) => {
  const g = p.g;
  const draw = () => {
    paper(p, "#f4ecd4");
    txt(p, "ADMIRALTY", 260, 90, 52, "#1e2a4a", "900", "center", "Georgia, serif");
    txt(p, "ORDERS", 260, 150, 52, "#1e2a4a", "900", "center", "Georgia, serif");
    txt(p, "ATTACK", 260, 290, 96, "#b8283a", "900");
    txt(p, "THE AMERICANS!", 260, 370, 44, "#b8283a", "900");
    for (let j = 0; j < 3; j++) p.stroke([[60, 450 + 40 * j], [460, 450 + 40 * j]], 4, "#a8a088");
  };
  if (k <= 0) { draw(); return; }
  for (const s of [-1, 1]) {
    g.save(); g.translate(260 + s * 70 * k, 320 + 40 * k); g.rotate(s * 0.35 * k); g.translate(-260, -320);
    g.beginPath(); const tear = (y: number) => 260 + 18 * Math.sin(y * 0.09);
    if (s < 0) { g.moveTo(0, 0); for (let y = 0; y <= 640; y += 20) g.lineTo(tear(y), y); g.lineTo(0, 640); }
    else { g.moveTo(520, 0); for (let y = 0; y <= 640; y += 20) g.lineTo(tear(y), y); g.lineTo(520, 640); }
    g.closePath(); g.clip(); draw(); g.restore();
  }
};
/** the island map on the Kaiser's desk; k = USA stamp */
const fxIsland = (k: number) => (p: Pen) => {
  p.poly(rrect(14, 14, 686, 506, 12), "#efe2bc", 10);
  const g = p.g; g.fillStyle = "#a8cce0"; g.fillRect(40, 40, 620, 440);
  g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 3; for (let y = 70; y < 480; y += 34) { g.beginPath(); g.moveTo(50, y); for (let x = 50; x < 650; x += 30) g.lineTo(x, y + 4 * Math.sin(x * 0.1)); g.stroke(); }
  const isl: P2[] = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = 120 + 26 * Math.sin(a * 3) + 14 * Math.sin(a * 7); isl.push([350 + 1.25 * r * Math.cos(a), 270 + 0.9 * r * Math.sin(a)]); }
  p.poly(isl, "#8ab86a", 8);
  for (let i = 0; i < 9; i++) p.ell(300 + 60 * Math.cos(i), 250 + 40 * Math.sin(i * 1.7), 14, 18, "#3f7a3a", 0);
  txt(p, "SAN JUAN", 350, 280, 54, "#2a3a2a", "900", "center", "Georgia, serif");
  txt(p, "CANADA", 120, 80, 34, "#3a4a6a", "900", "center", "Georgia, serif"); txt(p, "U.S.A.", 590, 460, 34, "#3a4a6a", "900", "center", "Georgia, serif");
  g.setLineDash([16, 12]); g.strokeStyle = "#b8283a"; g.lineWidth = 6; g.beginPath(); g.moveTo(170, 40); g.bezierCurveTo(210, 200, 180, 340, 230, 480); g.stroke(); g.setLineDash([]);
  if (k > 0) {
    const s = 1 + 0.6 * (1 - k); g.save(); g.globalAlpha = Math.min(1, k * 1.5); g.translate(360, 380); g.rotate(-0.15); g.scale(s, s);
    g.strokeStyle = "#2f6ab5"; g.lineWidth = 10; g.strokeRect(-130, -48, 260, 96); g.fillStyle = "#2f6ab5"; g.font = "900 70px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("USA", 0, 4); g.restore();
  }
};
const fxGrave = (p: Pen) => {
  p.poly([[60, 480], [60, 170], ...ellPts(200, 170, 140, 130, 180, 360).slice(1), [340, 480]] as P2[], "#a8acb4", 10);
  p.poly([[78, 470], [78, 180], [100, 180], [100, 470]], "#c4c8ce", 0);
  txt(p, "HERE LIES", 200, 180, 36, "#3a3e46", "900", "center", "Georgia, serif");
  txt(p, "THE PIG", 200, 250, 50, "#3a3e46", "900", "center", "Georgia, serif");
  txt(p, "1859", 200, 320, 40, "#3a3e46", "900", "center", "Georgia, serif");
  txt(p, "R.I.P.", 200, 400, 34, "#5a5e66", "900", "center", "Georgia, serif");
  for (let k = 0; k < 9; k++) p.ell(30 + 42 * k, 482, 30, 16, "#4f8a3a", 6);
  for (const [x, c] of [[90, "#f4f1ea"], [150, "#f2c21a"], [300, "#e85a7a"], [345, "#f4f1ea"]] as [number, string][]) { p.stroke([[x, 470], [x, 420]], 6, "#3f7a32"); p.ell(x, 412, 14, 14, c, 5); }
};
const fxRope = (p: Pen) => { p.band([[10, 40], [990, 40]], "#c8a46a", 22, 7, "round"); for (let x = 30; x < 990; x += 26) p.stroke([[x, 31], [x + 14, 49]], 4, "#8a6a3a"); p.ell(500, 40, 22, 30, "#d8443a", 6); };
const fxPotatoes = (p: Pen) => { for (const [x, y, r] of [[80, 120, 50], [170, 130, 44], [130, 80, 40], [230, 115, 38]] as number[][]) { p.ell(x, y, r, r * 0.75, "#b98a52", 8); p.ell(x - 10, y - 6, 5, 4, "#7a5a32", 0); p.ell(x + 12, y + 8, 4, 3, "#7a5a32", 0); } };
const fxCake = (p: Pen) => {
  p.poly(rrect(60, 160, 340, 280, 14), "#f4e2c0", 9); p.poly(rrect(100, 80, 300, 170, 12), "#f8f0e0", 9);
  for (let x = 70; x < 340; x += 40) p.ell(x, 160, 22, 14, "#e85a7a", 0);
  p.poly([[180, 82], [180, 30], [200, 30], [200, 82]], "#2f4a8a", 5); p.poly([[200, 30], [250, 40], [200, 52]], "#c8323a", 4);
  txt(p, "PEACE", 200, 230, 46, "#7a3a2a", "900", "center", "Georgia, serif");
};

// ---------------- textures ----------------
const usFlag = () => ctex("usFlag", 512, 288, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#c0353a"; g.fillRect(0, i * 288 / 13, 512, 288 / 13 + 1); }
  g.fillStyle = "#24356e"; g.fillRect(0, 0, 220, 155); g.fillStyle = "#f4f1ea";
  for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) { const x = 16 + k * 26.5, y = 22 + r * 37; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4 : 9; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.fill(); }
});
const union = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = "#1e3570"; g.fillRect(0, 0, w, h);
  const L = (x0: number, y0: number, x1: number, y1: number, lw: number, c: string) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  L(0, 0, w, h, h * 0.2, "#f4f1ea"); L(w, 0, 0, h, h * 0.2, "#f4f1ea"); L(0, 0, w, h, h * 0.07, "#c8323a"); L(w, 0, 0, h, h * 0.07, "#c8323a");
  L(w / 2, 0, w / 2, h, h * 0.33, "#f4f1ea"); L(0, h / 2, w, h / 2, h * 0.33, "#f4f1ea"); L(w / 2, 0, w / 2, h, h * 0.2, "#c8323a"); L(0, h / 2, w, h / 2, h * 0.2, "#c8323a");
};
const ukFlag = () => ctex("ukFlag", 512, 256, (g) => union(g, 512, 256));
const ensign = (hbc = false) => ctex("ensign" + hbc, 512, 256, (g) => {
  g.fillStyle = "#c0353a"; g.fillRect(0, 0, 512, 256); g.save(); union(g, 256, 128); g.restore();
  if (hbc) { g.fillStyle = "#f4f1ea"; g.font = "900 70px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H B C", 380, 190); }
});
const deFlag = () => ctex("deFlag", 256, 512, (g) => {
  ["#1e1e22", "#f4f1ea", "#c0353a"].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 150 + 40, 256, 150); });
  g.fillStyle = "#d8b84a"; g.fillRect(0, 0, 256, 40); for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 490); g.lineTo(x + 16, 512); g.lineTo(x + 32, 490); g.fill(); }
  g.fillRect(0, 490, 256, 6);
});
const seaTex = () => ctex("sea", 512, 512, (g, r) => {
  g.fillStyle = "#2f74a8"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "120,190,230" : "20,70,120"},${0.15 + 0.2 * r()})`; const x = 512 * r(), y = 512 * r(); g.fillRect(x, y, 20 + 60 * r(), 2 + 3 * r()); }
  for (let k = 0; k < 70; k++) { g.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * r()})`; const x = 512 * r(), y = 512 * r(); g.fillRect(x, y, 8 + 22 * r(), 2); }
});
const sandTex = () => ctex("sand", 512, 512, (g, r) => {
  g.fillStyle = "#d8c49a"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 5000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "250,240,210" : "120,100,70"},${0.1 + 0.15 * r()})`; g.fillRect(512 * r(), 512 * r(), 2 + 4 * r(), 2 + 3 * r()); }
  for (let k = 0; k < 30; k++) { g.fillStyle = "rgba(90,80,60,0.5)"; g.beginPath(); g.ellipse(512 * r(), 512 * r(), 4 + 8 * r(), 3 + 5 * r(), r() * 3, 0, Math.PI * 2); g.fill(); }
});
const soilTex = () => ctex("soil", 512, 512, (g, r) => {
  g.fillStyle = "#6a4a30"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 6000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "150,110,70" : "40,26,16"},${0.2 + 0.3 * r()})`; const s = 2 + 7 * r(); g.beginPath(); g.ellipse(512 * r(), 512 * r(), s, s * 0.7, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const plankWall = (key: string, base: string) => ctex("pw" + key, 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 32) { g.fillStyle = base; g.fillRect(x, 0, 32, 512); g.fillStyle = `rgba(${r() < 0.5 ? "255,230,200" : "40,20,10"},${0.08 + 0.1 * r()})`; g.fillRect(x, 0, 32, 512); g.fillStyle = "rgba(30,15,8,0.6)"; g.fillRect(x + 30, 0, 2, 512); for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(40,20,10,0.3)"; g.fillRect(x + 4 + 20 * r(), 512 * r(), 2, 30 + 60 * r()); } }
});
const marble = () => ctex("marble", 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#ece6da" : "#6a5a5a"; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = "rgba(120,110,100,0.25)"; g.lineWidth = 2; for (let k = 0; k < 40; k++) { let x = 512 * r(), y = 512 * r(); g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 6; i++) { x += 30 * (r() - 0.3); y += 30 * (r() - 0.5); g.lineTo(x, y); } g.stroke(); }
});
const chartTex = () => ctex("chartT", 512, 384, (g) => { const pen = new Pen(g as unknown as CanvasRenderingContext2D); g.save(); g.scale(512 / 700, 384 / 520); fxIsland(0)(pen); g.restore(); });
const seaView = () => ctex("seaView", 256, 384, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "#7ab4e8"); gr.addColorStop(0.55, "#d8ecf8"); gr.addColorStop(0.56, "#3a80b8"); gr.addColorStop(1, "#2a6a9a");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 384); g.fillStyle = "rgba(255,255,255,0.6)"; for (let k = 0; k < 40; k++) g.fillRect(256 * r(), 220 + 160 * r(), 10 + 20 * r(), 2);
  g.fillStyle = "#4a6a5a"; g.beginPath(); g.moveTo(0, 212); g.quadraticCurveTo(80, 190, 150, 210); g.lineTo(150, 214); g.lineTo(0, 214); g.fill();
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
    for (let i = 0; i < pos.count; i++) { const x = base[3 * i], y = base[3 * i + 1]; pos.setZ(i, (x / w) * 0.13 * w * Math.sin(x * 3.2 / w * 2 - t * 7 + y * 0.8)); pos.setY(i, y - 0.04 * w * (x / w) ** 2); }
    pos.needsUpdate = true; m.geometry.computeVertexNormals();
  }
};
const flagpole = (s: SetBuild, x: number, z: number, H: number, key: string, tex: () => THREE.Texture, w: number) => {
  s.b.add(new THREE.CylinderGeometry(0.05, 0.08, H, 8).translate(x, H / 2, z), C("#e8e4dc"));
  s.b.add(new THREE.SphereGeometry(0.1, 10, 8).translate(x, H + 0.05, z), C("#d8b84a"));
  flag(s, key, x + 0.05, H - 0.1, z, w, w * 0.56, tex);
};
const fir = (b: Batch, x: number, z: number, H: number, seed: number, y = 0) => {
  b.add(new THREE.CylinderGeometry(0.06 * H / 4, 0.12 * H / 4, H * 0.3, 7).translate(x, y + H * 0.15, z), C("#5a3a26"));
  for (let k = 0; k < 4; k++) b.add(new THREE.ConeGeometry(H * (0.27 - 0.05 * k), H * 0.38, 8).rotateY(seed + k).translate(x, y + H * (0.33 + 0.17 * k), z), lam("fir" + ((k + Math.floor(seed)) % 3), () => ({ color: ["#2f5a3a", "#3a6a42", "#284e36"][(k + Math.floor(seed)) % 3] })));
};
const mountains = (b: Batch, z: number, n: number, seed: number) => {
  for (let k = 0; k < n; k++) {
    const x = -900 + (1800 * k) / (n - 1) + 120 * (hh(seed + k, 1) - 0.5), H = 140 + 220 * hh(seed + k, 2), R = H * 1.4;
    b.add(new THREE.ConeGeometry(R, H, 7).translate(x, H / 2 - 20, z - 200 * hh(seed + k, 3)), lam("mtn", () => ({ color: "#7d8fb0" })));
    b.add(new THREE.ConeGeometry(R * 0.32, H * 0.32, 7).translate(x, H - 20 - H * 0.16 + 1, z - 200 * hh(seed + k, 3)), lam("snow", () => ({ color: "#f4f6fa" })));
  }
};
const SEA = () => lam("seaM", () => ({ map: seaTex() }));
const sea = (b: Batch, y = 0) => b.add(plane(-2000, 2000, -2000, 2000, 24, y), SEA());
const rock = (b: Batch, x: number, y: number, z: number, s: number, seed: number) => b.add(new THREE.DodecahedronGeometry(s, 0).scale(1.3, 0.7, 1).rotateY(seed).translate(x, y, z), lam("rock" + (seed % 2), () => ({ color: ["#8a8a88", "#7a7c80"][seed % 2] })));
/** muzzle-loading cannon on a wooden carriage, barrel along local -z */
const cannon = (b: Batch, x: number, z: number, ry: number, s = 1, y = 0) => {
  const m = M4(x, y, z, ry, s), Wd = C("#6a4426"), Ir = C("#2a2a30");
  b.add(boxGeo(V(-0.24, 0.28, -0.5), V(0.24, 0.52, 0.5)), Wd, m);
  b.add(beamBetween(V(0, 0.4, 0.4), V(0, 0.06, 1.5), 0.08, 5), Wd, m);
  for (const sx of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16).rotateZ(Math.PI / 2).translate(sx * 0.33, 0.42, 0), Wd, m);
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8).rotateZ(Math.PI / 2).translate(sx * 0.36, 0.42, 0), Ir, m);
  }
  b.add(new THREE.CylinderGeometry(0.11, 0.17, 1.7, 14).rotateX(Math.PI / 2).translate(0, 0.66, -0.4), Ir, m);
  b.add(new THREE.TorusGeometry(0.12, 0.035, 6, 14).translate(0, 0.66, -1.25), Ir, m);
  b.add(new THREE.SphereGeometry(0.17, 10, 8).translate(0, 0.66, 0.45), Ir, m);
};
const balls = (b: Batch, x: number, z: number) => { let n = 0; for (let l = 0; l < 3; l++) for (let i = 0; i < 3 - l; i++) for (let j = 0; j < 3 - l; j++) { b.add(new THREE.SphereGeometry(0.1, 10, 8).translate(x + 0.2 * i + 0.1 * l, 0.1 + 0.16 * l, z + 0.2 * j + 0.1 * l), C("#26262c")); n++; } };
const barrel = (b: Batch, x: number, z: number, h = 0.8, y = 0) => { b.add(new THREE.CylinderGeometry(0.3, 0.3, h, 14).translate(x, y + h / 2, z), C("#8a5a34")); for (const yy of [0.15, h - 0.15]) b.add(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 14).translate(x, y + yy, z), C("#3a3a3e")); };
const crate = (b: Batch, x: number, z: number, s = 0.6, ry = 0, y = 0) => { b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s, s / 2)), lam("crateW", () => ({ map: plankWall("cr", "#a8784a") })), M4(x, y, z, ry)); };
/** split-rail fence: zigzag of rails along a line */
const fence = (b: Batch, x0: number, z0: number, x1: number, z1: number, n: number) => {
  const Wd = C("#8a6a48");
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, o0 = i % 2 ? 0.25 : -0.25, o1 = i % 2 ? -0.25 : 0.25;
    const a = V(x0 + (x1 - x0) * u0 + o0, 0, z0 + (z1 - z0) * u0), c = V(x0 + (x1 - x0) * u1 + o1, 0, z0 + (z1 - z0) * u1);
    for (const y of [0.35, 0.65, 0.95]) b.add(beamBetween(V(a.x, y, a.z), V(c.x, y + 0.05, c.z), 0.05, 5), Wd);
    b.add(new THREE.CylinderGeometry(0.06, 0.07, 1.15, 6).translate(a.x, 0.57, a.z), C("#6a4a32"));
  }
};
/** log cabin, door facing +z */
const logCabin = (b: Batch, x: number, z: number, w: number, d: number, h: number) => {
  const L = [C("#8a5a36"), C("#7a4e2e"), C("#946240")];
  let i = 0;
  for (let y = 0.15; y < h; y += 0.29, i++) {
    for (const sz of [-1, 1]) b.add(new THREE.CylinderGeometry(0.15, 0.15, w + 0.35, 8).rotateZ(Math.PI / 2).translate(x, y, z + sz * d / 2), L[i % 3]);
    for (const sx of [-1, 1]) b.add(new THREE.CylinderGeometry(0.15, 0.15, d + 0.35, 8).rotateX(Math.PI / 2).translate(x + sx * w / 2, y + 0.14, z), L[(i + 1) % 3]);
  }
  const G = lam("gable", () => ({ map: plankWall("gab", "#7a5232"), side: THREE.DoubleSide })), R = lam("shingle", () => ({ map: rep(roofHD("#6a4a32"), 2, 2), side: THREE.DoubleSide }));
  const rh = 1.5;
  for (const sz of [-1, 1]) b.add(quad(V(x - w / 2, h, z + sz * d / 2), V(x + w / 2, h, z + sz * d / 2), V(x, h + rh, z + sz * d / 2), V(x, h + rh, z + sz * d / 2)), G);
  for (const sx of [-1, 1]) b.add(quad(V(x + sx * (w / 2 + 0.5), h - 0.3, z + d / 2 + 0.6), V(x + sx * (w / 2 + 0.5), h - 0.3, z - d / 2 - 0.4), V(x, h + rh + 0.05, z - d / 2 - 0.4), V(x, h + rh + 0.05, z + d / 2 + 0.6)), R);
  b.add(boxGeo(V(x - 0.45, 0, z + d / 2 + 0.1), V(x + 0.45, 1.95, z + d / 2 + 0.18)), C("#5a3820"));
  b.add(new THREE.SphereGeometry(0.04, 8, 6).translate(x + 0.3, 1.0, z + d / 2 + 0.22), C("#d8b84a"));
  for (const sx of [-1, 1]) { // windows with shutters + a lit pane
    const wx = x + sx * w * 0.3;
    b.add(boxGeo(V(wx - 0.45, 0.9, z + d / 2 + 0.1), V(wx + 0.45, 1.75, z + d / 2 + 0.14)), lam("pane", () => ({ color: "#bcd8e8", emissive: "#a8c8e0", emissiveIntensity: 0.4 })));
    b.add(boxGeo(V(wx - 0.5, 0.86, z + d / 2 + 0.12), V(wx + 0.5, 0.92, z + d / 2 + 0.2)), C("#4a2e18"));
    for (const s2 of [-1, 1]) b.add(boxGeo(V(wx + s2 * 0.5 - 0.17, 0.9, z + d / 2 + 0.12), V(wx + s2 * 0.5 + 0.17, 1.75, z + d / 2 + 0.17)), C("#3f6a4a"));
  }
  // porch
  b.add(boxGeo(V(x - w / 2, 0, z + d / 2 + 0.15), V(x + w / 2, 0.18, z + d / 2 + 1.5)), lam("porchP", () => ({ map: planksHD() })));
  for (const sx of [-1, 1]) b.add(new THREE.CylinderGeometry(0.07, 0.07, h - 0.3, 6).translate(x + sx * (w / 2 - 0.1), (h - 0.3) / 2, z + d / 2 + 1.4), C("#6a4426"));
  // stone chimney
  b.add(boxGeo(V(x + w / 2 + 0.1, 0, z - 0.5), V(x + w / 2 + 0.85, h + rh + 0.8, z + 0.3)), lam("chim", () => ({ map: rep(stoneHD("chimSt", ["#9a9488", "#8a8478", "#a8a294", "#7e786c"]), 1, 3) })));
};
/** plank barn, door facing +z */
const barn = (b: Batch, x: number, z: number, w: number, d: number, h: number) => {
  wbox(b, lam("barnW", () => ({ map: plankWall("barn", "#9a3a2a") })), x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2, 3, 3);
  const R = lam("barnR", () => ({ map: rep(roofHD("#4a4a4e"), 2, 2), side: THREE.DoubleSide })), G = lam("barnG", () => ({ map: plankWall("barn", "#9a3a2a"), side: THREE.DoubleSide }));
  for (const sz of [-1, 1]) b.add(quad(V(x - w / 2, h, z + sz * d / 2), V(x + w / 2, h, z + sz * d / 2), V(x, h + 2, z + sz * d / 2), V(x, h + 2, z + sz * d / 2)), G);
  for (const sx of [-1, 1]) b.add(quad(V(x + sx * (w / 2 + 0.3), h - 0.2, z + d / 2 + 0.3), V(x + sx * (w / 2 + 0.3), h - 0.2, z - d / 2 - 0.3), V(x, h + 2.05, z - d / 2 - 0.3), V(x, h + 2.05, z + d / 2 + 0.3)), R);
  b.add(boxGeo(V(x - 1.1, 0, z + d / 2), V(x + 1.1, 2.6, z + d / 2 + 0.06)), C("#6a2a1e"));
  for (const sx of [-1, 1]) b.add(beamBetween(V(x + sx * 1.05, 0.1, z + d / 2 + 0.08), V(x - sx * 1.05, 2.5, z + d / 2 + 0.08), 0.05, 4), C("#f1e8d6"));
  b.add(boxGeo(V(x - 1.8, h - 0.3, z + d / 2 + 0.02), V(x + 1.8, h + 0.35, z + d / 2 + 0.1)), lam("sgHBC", () => ({ map: signHD("HUDSON'S BAY CO.", "#2a2a30", "#fff6d8") })));
  for (let k = 0; k < 3; k++) b.add(new THREE.CylinderGeometry(0.45, 0.45, 1.0, 14).rotateZ(Math.PI / 2).translate(x + w / 2 + 0.8, 0.45 + 0.85 * (k === 2 ? 1 : 0), z + d / 2 - 0.6 - (k === 2 ? 0.5 : k)), lam("hay", () => ({ color: "#d8b45a" })));
};
/** potato patch: soil bed, ridged rows, leafy plants with white flowers */
const potatoPatch = (b: Batch, x0: number, x1: number, z0: number, z1: number) => {
  b.add(plane(x0, x1, z1, z0, 2, 0.012), lam("soilM", () => ({ map: soilTex() })));
  const R = lam("ridge", () => ({ map: soilTex() })), Lf = [C("#4f8a3a"), C("#5e9a42"), C("#3f7a32")];
  let k = 0;
  for (let x = x0 + 0.35; x < x1; x += 0.72) {
    b.add(new THREE.CylinderGeometry(0.24, 0.24, z0 - z1 - 0.2, 10, 1).rotateX(Math.PI / 2).scale(1, 0.42, 1).translate(x, 0, (z0 + z1) / 2), R);
    for (let z = z1 + 0.3; z < z0 - 0.2; z += 0.48, k++) {
      for (let j = 0; j < 4; j++) b.add(new THREE.IcosahedronGeometry(0.075 + 0.035 * hh(k, j), 0).translate(x + 0.12 * Math.cos(j * 1.7 + k), 0.16 + 0.09 * j % 0.27, z + 0.12 * Math.sin(j * 1.7 + k)), Lf[(k + j) % 3]);
      if (k % 3 === 0) b.add(new THREE.SphereGeometry(0.035, 6, 5).translate(x, 0.36, z), C("#f8f4ec"));
    }
  }
};
const scarecrow = (b: Batch, x: number, z: number) => {
  b.add(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 6).translate(x, 1.1, z), C("#7a5a3a"));
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6).rotateZ(Math.PI / 2).translate(x, 1.55, z), C("#7a5a3a"));
  b.add(boxGeo(V(x - 0.32, 0.95, z - 0.12), V(x + 0.32, 1.65, z + 0.12)), C("#5a7aa8"));
  b.add(new THREE.SphereGeometry(0.2, 10, 8).translate(x, 1.92, z), C("#d8c08a"));
  b.add(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12).translate(x, 2.06, z), C("#7a5a3a")); b.add(new THREE.CylinderGeometry(0.15, 0.18, 0.2, 10).translate(x, 2.17, z), C("#7a5a3a"));
};
const woodpile = (b: Batch, x: number, z: number) => { for (let l = 0; l < 4; l++) for (let k = 0; k < 6 - l; k++) b.add(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 7).rotateX(Math.PI / 2).translate(x + 0.24 * k + 0.12 * l, 0.12 + 0.21 * l, z), C(["#a8784a", "#9a6a3e"][(k + l) % 2])); };
/** a Royal Navy ship of the line / frigate: black hull, ochre gun band with ports, three masts with set sails */
const manOWar = (b: Batch, x: number, z: number, ry: number, L: number, y = 0) => {
  const m = M4(x, y, z, ry), hw = L * 0.14, hh2 = L * 0.15, H = C("#1e1e24"), Band = C("#d8b45a"), Port = C("#0e0e12");
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2, hh2 * 1.25); shape.lineTo(-L / 2 + L * 0.05, -hh2 * 0.4); shape.lineTo(L / 2 - L * 0.16, -hh2 * 0.4); shape.lineTo(L / 2, hh2 * 1.0); shape.closePath();
  b.add(new THREE.ExtrudeGeometry(shape, { depth: 2 * hw, bevelEnabled: false }).translate(0, 0, -hw), H, m);
  for (const sz of [-1, 1]) {
    b.add(boxGeo(V(-L / 2 + 0.6, hh2 * 0.45, sz * hw - 0.03), V(L / 2 - 0.9, hh2 * 0.72, sz * hw + 0.03)), Band, m);
    for (let k = 0; k < Math.floor(L / 1.3); k++) b.add(boxGeo(V(-L / 2 + 1.0 + k * 1.3, hh2 * 0.5, sz * hw - 0.05), V(-L / 2 + 1.35 + k * 1.3, hh2 * 0.67, sz * hw + 0.05)), Port, m);
  }
  b.add(boxGeo(V(-L / 2 + 0.2, hh2 * 1.0, -hw + 0.05), V(L / 2 - 0.2, hh2 * 1.04, hw - 0.05)), lam("deckP", () => ({ map: planksHD() })), m);
  b.add(boxGeo(V(-L / 2, hh2 * 1.0, -hw), V(-L / 2 + L * 0.18, hh2 * 1.5, hw)), H, m); // quarterdeck / stern castle
  b.add(boxGeo(V(-L / 2 - 0.02, hh2 * 1.2, -hw * 0.7), V(-L / 2 + 0.02, hh2 * 1.4, hw * 0.7)), Band, m);
  b.add(beamBetween(V(L / 2 - 0.3, hh2 * 1.0, 0), V(L / 2 + L * 0.2, hh2 * 1.7, 0), 0.08, 6), C("#4a3020"), m);
  const Sail = lam("sail", () => ({ color: "#f4eee0", side: THREE.DoubleSide })), Mast = C("#4a3020"), Rig = C("#2a2420");
  const masts = [-L * 0.28, 0, L * 0.26], tops: THREE.Vector3[] = [];
  masts.forEach((mx, i) => {
    const mh = L * (i === 1 ? 1.05 : 0.88);
    b.add(new THREE.CylinderGeometry(0.07 * L / 10, 0.12 * L / 10, mh, 8).translate(mx, hh2 + mh / 2, 0), Mast, m);
    tops.push(V(mx, hh2 + mh, 0));
    for (let k = 0; k < 3; k++) {
      const yb = hh2 + mh * (0.28 + 0.24 * k), sh = mh * 0.2, sw = hw * (3.4 - 0.7 * k), bulge = 0.25 * sw / 3;
      b.add(new THREE.CylinderGeometry(0.04 * L / 10, 0.04 * L / 10, sw * 1.05, 6).rotateX(Math.PI / 2).translate(mx, yb + sh, 0), Mast, m);
      b.add(quad(V(mx + bulge, yb, -sw / 2), V(mx + bulge, yb, sw / 2), V(mx, yb + sh, sw / 2), V(mx, yb + sh, -sw / 2)), Sail, m);
      b.add(quad(V(mx + bulge * 1.4, yb + sh * 0.45, -sw / 2 * 0.98), V(mx + bulge * 1.4, yb + sh * 0.45, sw / 2 * 0.98), V(mx + bulge, yb, sw / 2), V(mx + bulge, yb, -sw / 2)), Sail, m);
    }
  });
  b.add(quad(V(L / 2 + L * 0.18, hh2 * 1.7, 0), V(L / 2 - 0.2, hh2 * 1.1, 0), V(masts[2], hh2 + L * 0.7, 0), V(masts[2], hh2 + L * 0.7, 0)), Sail, m); // jib
  for (const tp of tops) { b.add(beamBetween(tp, V(L / 2 + L * 0.2, hh2 * 1.7, 0), 0.015, 3), Rig, m); for (const sz of [-1, 1]) b.add(beamBetween(tp, V(tp.x - 0.5, hh2 * 1.0, sz * hw), 0.015, 3), Rig, m); }
  b.add(beamBetween(tops[0], V(-L / 2, hh2 * 1.5, 0), 0.015, 3), Rig, m);
  // red ensign at the stern and a long pennant at the main top
  b.add(quad(V(-L / 2 - 0.1, hh2 * 1.5 + L * 0.02, 0), V(-L / 2 - 0.1 - L * 0.16, hh2 * 1.5 + L * 0.01, 0), V(-L / 2 - 0.1 - L * 0.16, hh2 * 1.5 + L * 0.1, 0), V(-L / 2 - 0.1, hh2 * 1.5 + L * 0.11, 0)), lam("ensM", () => ({ map: ensign(), side: THREE.DoubleSide })), m);
  b.add(quad(V(0, hh2 + L * 1.05, 0), V(-L * 0.3, hh2 + L * 1.0, 0), V(-L * 0.3, hh2 + L * 1.01, 0), V(0, hh2 + L * 1.05 + 0.15, 0)), C("#c0353a"), m);
  // bow wave
  b.add(new THREE.TorusGeometry(hw * 1.2, 0.08 * L / 10, 4, 18, Math.PI).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2).translate(L / 2 - L * 0.12, -hh2 * 0.4 + 0.05, 0), C("#f4f8fa"), m);
};
const SHIPS: [number, number, number, number][] = [[11, -20, 0.5, 13], [18, -32, 0.55, 15], [9, -44, 0.35, 14], [24, -52, 0.5, 16], [13, -66, 0.45, 15]];

// ---------------- sets ----------------
const farm = (s: SetBuild) => {
  const { b } = s;
  sea(b, -0.6);
  b.add(plane(-140, 140, -70, 40, 6), lam("grassF", () => ({ map: grassHD() })));
  b.add(plane(-160, 160, -78, -70, 4, -0.2), lam("sandF", () => ({ map: sandTex() })));
  potatoPatch(b, -2.6, 2.6, -0.6, -7.0);
  logCabin(b, -7.2, -10, 5.2, 4, 2.6);
  woodpile(b, -4.4, -7.6); scarecrow(b, -1.6, -6.4);
  b.add(new THREE.CylinderGeometry(0.32, 0.36, 0.5, 12).translate(-3.8, 0.25, -5.4), C("#8a6a48")); // stump
  b.add(beamBetween(V(-3.8, 0.5, -5.4), V(-3.55, 1.05, -5.25), 0.025), C("#9a6a3a")); b.add(boxGeo(V(-3.6, 0.42, -5.48), V(-3.42, 0.6, -5.4)), C("#7a8288"));
  barrel(b, -4.8, -8.2); barrel(b, -4.2, -8.5, 0.7);
  b.add(new THREE.TorusGeometry(0.45, 0.05, 6, 18).translate(-9.8, 0.45, -7.6), C("#6a4426")); // wagon wheel leaning
  fence(b, 3.4, 2.5, 3.4, -16, 8);
  barn(b, 9.5, -11, 6.5, 5, 3.4);
  flagpole(s, 6.4, -6.5, 7.5, "hbc", () => ensign(true), 1.8);
  b.add(boxGeo(V(5.6, 0, -4.2), V(7.6, 0.5, -3.6)), lam("trough", () => ({ map: plankWall("tr", "#7a5a3a") })));
  b.add(boxGeo(V(5.7, 0.42, -4.1), V(7.5, 0.46, -3.7)), lam("troughW", () => ({ color: "#5a9ac8", emissive: "#4a8ab8", emissiveIntensity: 0.2 })));
  crate(b, 8.4, -6.6); crate(b, 8.9, -6.2, 0.5, 0.4); barrel(b, 7.7, -7.2);
  for (let k = -14; k <= 14; k++) fir(b, k * 3.6 + 2 * hh(k, 1), -20 - 9 * hh(k, 2), 8 + 6 * hh(k, 3), k);
  for (let k = 0; k < 12; k++) fir(b, -18 - 4 * hh(k, 4), -2 - 3.2 * k, 7 + 5 * hh(k, 5), k + 40);
  for (let k = 0; k < 10; k++) fir(b, 18 + 5 * hh(k, 6), -2 - 3.6 * k, 7 + 5 * hh(k, 7), k + 70);
  for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(40 + 30 * hh(k, 8), 12, 8).scale(1, 0.25, 1).translate(-300 + 110 * k, -6, -260 - 60 * hh(k, 9)), lam("islet", () => ({ color: "#3f6a4a" })));
  mountains(b, -700, 9, 3);
  for (let k = 0; k < 8; k++) b.add(new THREE.SphereGeometry(0.3 + 0.2 * hh(k, 3), 8, 6).scale(1.2, 0.5, 1).translate(-6 + 1.7 * k, 0.05, 1.5 + 1.2 * hh(k, 4)), C("#7a7c74"));
};
const camp = (s: SetBuild) => {
  const { b } = s;
  sea(b, -9);
  b.add(plane(-160, 160, -20, 40, 6), lam("grassC", () => ({ map: grassHD() })));
  wbox(b, lam("cliff", () => ({ map: rep(earthHD("cliffE", ["#8a7058", "#7a6048", "#9a8064", "#6a5440"], "#5f7a36"), 1, 1) })), -160, -9, -24, 160, 0, -20, 6, 6);
  for (let k = -6; k <= 6; k++) b.add(boxGeo(V(k * 1.9 - 0.8, 0, -17.6), V(k * 1.9 + 0.8, 0.9, -16.4)), lam("earthwork", () => ({ map: rep(earthHD("ewk", ["#9a7a58", "#8a6a4a", "#a88a64", "#7a5c40"], "#6f8a3e"), 1, 1) }))); // redoubt
  for (let k = -6; k <= 7; k++) cannon(b, k * 1.9 - 0.95, -15.6, 0, 0.9);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = -11 + k * 4.4 + (r % 2) * 2.2, z = -5 - r * 3.4; if (Math.abs(x) > 2.4 || r > 0) tent(b, x, z, 0, 0.8); }
  flagpole(s, 0.6, -9.5, 11, "us", usFlag, 3.0);
  // campfire, stacked rifles, drum, crates, wagon, cannonballs
  for (let k = 0; k < 9; k++) b.add(new THREE.DodecahedronGeometry(0.12, 0).translate(3.4 + 0.45 * Math.cos(k * 0.7), 0.06, -2.4 + 0.45 * Math.sin(k * 0.7)), C("#7a7a76"));
  for (let k = 0; k < 3; k++) b.add(beamBetween(V(3.4 + 0.4 * Math.cos(k * 2.1), 0.05, -2.4 + 0.4 * Math.sin(k * 2.1)), V(3.4 - 0.3 * Math.cos(k * 2.1), 0.2, -2.4 - 0.3 * Math.sin(k * 2.1)), 0.06), C("#5a3a22"));
  for (let k = 0; k < 3; k++) b.add(beamBetween(V(3.4 + 0.6 * Math.cos(k * 2.1), 0, -2.4 + 0.6 * Math.sin(k * 2.1)), V(3.4, 1.4, -2.4), 0.025), C("#3a3a3e"));
  b.add(new THREE.SphereGeometry(0.2, 10, 8).scale(1, 0.85, 1).translate(3.4, 0.75, -2.4), C("#2a2a2e"));
  for (const [rx, rz] of [[-3.2, -2.8], [6.2, -3.4]]) for (let k = 0; k < 4; k++) b.add(beamBetween(V(rx + 0.45 * Math.cos(k * 1.57), 0, rz + 0.45 * Math.sin(k * 1.57)), V(rx, 1.35, rz), 0.03, 4), C("#4a3424"));
  b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 16).translate(-1.8, 0.21, -1.8), lam("drumB", () => ({ color: "#2f4a8a" }))); for (const yy of [0.03, 0.39]) b.add(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 16).translate(-1.8, yy, -1.8), C("#c0353a"));
  crate(b, -5.6, -2.2); crate(b, -5.0, -2.5, 0.5, 0.5); crate(b, -5.3, -2.2, 0.45, 0.2, 0.6); barrel(b, 5.6, -1.6); barrel(b, 6.2, -1.9, 0.7);
  cart(b, -8.2, -2.6, 0.3); balls(b, 7.4, -14.6); balls(b, -9.2, -14.6);
  for (let k = -12; k <= 12; k++) fir(b, k * 6 + 3 * hh(k, 1), 6 + 8 * hh(k, 2), 9 + 5 * hh(k, 3), k);
  for (let k = 0; k < 8; k++) fir(b, -16 - 5 * hh(k, 4), -2 - 2 * k, 8 + 5 * hh(k, 5), k + 30);
  for (let k = 0; k < 8; k++) fir(b, 16 + 5 * hh(k, 6), -2 - 2 * k, 8 + 5 * hh(k, 7), k + 50);
  for (let k = 0; k < 4; k++) manOWar(b, -60 + 45 * k, -150 - 40 * hh(k, 2), 0.3 + 0.3 * hh(k, 1), 15, -9);
  for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(50 + 30 * hh(k, 8), 12, 8).scale(1, 0.25, 1).translate(-350 + 120 * k, -14, -330 - 60 * hh(k, 9)), lam("islet", () => ({ color: "#3f6a4a" })));
  mountains(b, -800, 9, 7);
  // party dressing (shot 18): bunting, picnic table with cake, crossed flags, a tug-of-war line
  sub(s, "party", (pb) => {
    const Bn = [C("#c0353a"), C("#f4f1ea"), C("#2f4a8a")];
    for (const [x0, x1, z] of [[-6, 6, -3.2], [-6, 6, -6.2]]) {
      for (const x of [x0, x1]) pb.add(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 6).translate(x, 1.7, z), C("#8a6a48"));
      for (let k = 0; k < 24; k++) { const u = (k + 0.5) / 24, x = x0 + (x1 - x0) * u, y = 3.3 - 0.6 * 4 * u * (1 - u); pb.add(new THREE.ConeGeometry(0.16, 0.34, 3).rotateX(Math.PI).translate(x, y - 0.17, z), Bn[k % 3]); }
    }
    table2(pb, 4.6, -4.4, 2.4, 1.0, 0.78, "#7a5232", "#f4f1ea", false);
    for (let k = 0; k < 6; k++) pb.add(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 10).translate(3.7 + 0.35 * k, 0.85, -4.1 - 0.3 * (k % 2)), C(["#c9ccd2", "#d8b84a"][k % 2]));
  });
};
const bay = (s: SetBuild) => {
  const { b } = s;
  sea(b, 0);
  b.add(plane(-200, 2.6, -220, 40, 4, 0.06), lam("sandB", () => ({ map: sandTex() })));
  b.add(plane(-200, -3.5, -220, 40, 6, 0.75), lam("grassB", () => ({ map: grassHD() })));
  b.add(quad(V(-3.5, 0.75, 40), V(-1.8, 0.06, 40), V(-1.8, 0.06, -220), V(-3.5, 0.75, -220), 1, 40), lam("slope", () => ({ map: rep(sandTex(), 1, 1) })));
  for (let k = 0; k < 16; k++) rock(b, 2.4 + 2 * hh(k, 1), 0.05, 4 - 4.5 * k + 2 * hh(k, 2), 0.25 + 0.45 * hh(k, 3), k);
  for (let k = 0; k < 8; k++) rock(b, -1.4 + 2 * hh(k, 4), 0.1, -1 - 6 * k, 0.15 + 0.25 * hh(k, 5), k + 1);
  b.add(new THREE.CylinderGeometry(0.16, 0.2, 3.4, 8).rotateZ(Math.PI / 2).rotateY(0.6).translate(2.2, 0.2, -8.5), C("#b8a890")); // driftwood
  // the American battery on the bluff, aimed at the bay
  for (let k = 0; k < 5; k++) cannon(b, -5.2 - 0.3 * (k % 2), -1.5 - 2.6 * k, -Math.PI / 2 + 0.35, 1, 0.75);
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-4.6, 0.75, -2.6 - 2.6 * k), V(-4.0, 1.3, -0.8 - 2.6 * k)), lam("gab", () => ({ color: "#c8b48a" }))); // gabions / sandbags
  balls(b, -7.6, -3.8); barrel(b, -7.8, -6.2, 0.8, 0.75);
  flagpole(s, -8.6, -9, 9, "usB", usFlag, 2.4);
  for (let k = 0; k < 18; k++) fir(b, -10 - 6 * hh(k, 1) - (k % 3) * 4, 6 - 4 * k, 8 + 6 * hh(k, 2), k, 0.75);
  for (let k = 0; k < 9; k++) b.add(new THREE.SphereGeometry(60 + 40 * hh(k, 8), 12, 8).scale(1, 0.22, 1).translate(-100 + 140 * k, -12, -300 - 80 * hh(k, 9)), lam("islet", () => ({ color: "#3f6a4a" })));
  mountains(b, -800, 9, 11);
  SHIPS.forEach(([x, z, ry, L], i) => sub(s, "ship" + i, (sb) => manOWar(sb, 0, 0, ry, L, 0)).position.set(x, 0, z));
};
const cabin = (s: SetBuild) => {
  const { b } = s, H = 2.7;
  const Wl = lam("cabW", () => ({ map: panelHD("cab", "#6a4426") }));
  b.add(plane(-4, 4, -4.2, 6, 2.4), lam("cabF", () => ({ map: planksHD() })));
  wbox(b, Wl, -4, 0, -4.4, 4, H, -4.2, 2.5, 2.5);
  for (const sd of [-1, 1]) wbox(b, Wl, sd > 0 ? 4 : -4.2, 0, -4.4, sd > 0 ? 4.2 : -4, H, 6, 2.5, 2.5);
  b.add(boxGeo(V(-4.2, H, -4.4), V(4.2, H + 0.1, 6)), C("#d8c8a8"));
  for (let z = -3.8; z < 6; z += 1.1) b.add(boxGeo(V(-4.2, H - 0.18, z - 0.1), V(4.2, H, z + 0.1)), lam("cabBeam", () => ({ map: beamHD() })));
  // stern windows (sea outside)
  for (let k = 0; k < 5; k++) {
    const x = -3.0 + 1.5 * k;
    b.add(boxGeo(V(x - 0.6, 0.85, -4.2), V(x + 0.6, 2.2, -4.15)), C("#3a2414"));
    b.add(quad(V(x - 0.52, 0.93, -4.14), V(x + 0.52, 0.93, -4.14), V(x + 0.52, 2.12, -4.14), V(x - 0.52, 2.12, -4.14)), lam("seaV", () => ({ map: seaView(), emissive: "#ffffff", emissiveMap: seaView(), emissiveIntensity: 0.9 })));
    b.add(boxGeo(V(x - 0.02, 0.93, -4.13), V(x + 0.02, 2.12, -4.1)), C("#d8b45a")); b.add(boxGeo(V(x - 0.52, 1.5, -4.13), V(x + 0.52, 1.54, -4.1)), C("#d8b45a"));
  }
  b.add(boxGeo(V(-4, 0, -4.2), V(4, 0.75, -3.7)), C("#5a3820")); // window seat
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-3.6 + 1.3 * k, 0.75, -4.1), V(-3.0 + 1.3 * k, 0.9, -3.75)), C(["#7a2632", "#2f4a6a"][k % 2]));
  // chart table
  table2(b, 0, -1.7, 2.2, 1.2, 0.8, "#5a3420", undefined, false);
  b.add(quad(V(-0.8, 0.81, -1.2), V(0.8, 0.81, -1.2), V(0.8, 0.81, -2.2), V(-0.8, 0.81, -2.2)), lam("chartM", () => ({ map: chartTex() })));
  b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 10).translate(0.85, 0.92, -1.45), C("#d8b84a")); // telescope stand / candle
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8).rotateZ(Math.PI / 2).rotateY(0.4).translate(-0.6, 0.84, -1.4), C("#c9a24a")); // telescope
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12).translate(0.6, 0.92, -2.05), lam("decanter", () => ({ color: "#8a2a3a", emissive: "#5a1a2a", emissiveIntensity: 0.3 })));
  chair(b, 0, -3.35, Math.PI, "#3a2414", "#7a2632");
  // hanging lantern
  b.add(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4).translate(0, H - 0.25, -1.7), C("#2a2a2a"));
  b.add(boxGeo(V(-0.12, H - 0.85, -1.82), V(0.12, H - 0.5, -1.58)), lam("lantern", () => ({ color: "#ffe6a0", emissive: "#ffcc66", emissiveIntensity: 1.4 })));
  bookcase(b, -3.2, -3.0, 1.4, 2.3, "#3a2414");
  // a cannon at a side gunport, a globe, a sea-chest, rug, painting
  cannon(b, 3.2, -0.8, -Math.PI / 2, 0.8);
  b.add(boxGeo(V(4.0, 0.7, -1.3), V(4.05, 1.4, -0.4)), C("#0e0e12"));
  b.add(new THREE.SphereGeometry(0.3, 16, 12).translate(-2.6, 1.15, -0.6), lam("globe", () => ({ color: "#d8c890" }))); b.add(new THREE.CylinderGeometry(0.05, 0.12, 0.85, 8).translate(-2.6, 0.42, -0.6), C("#5a3420"));
  b.add(boxGeo(V(1.6, 0, -3.6), V(2.6, 0.55, -3.0)), lam("chest", () => ({ map: plankWall("chest", "#6a3a22") })));
  rug(b, "cab", ["#7a2632", "#2a3a5a", "#d8b84a", "#e8dcc0"], 0, -1.4, 3.6, 2.6);
  painting(b, 2.8, 2.15, -4.15, 0.9, 0.6, 4);
};
const palace = (s: SetBuild) => {
  const { b } = s, H = 6;
  b.add(plane(-8, 8, -6.2, 8, 2.5), lam("marbleF", () => ({ map: marble() })));
  const Wl = lam("palW", () => ({ map: panelHD("pal", "#e8dcc0") }));
  wbox(b, Wl, -8, 0, -6.4, 8, H, -6.2, 3, 3);
  for (const sd of [-1, 1]) wbox(b, Wl, sd > 0 ? 8 : -8.2, 0, -6.4, sd > 0 ? 8.2 : -8, H, 8, 3, 3);
  b.add(boxGeo(V(-8.2, H, -6.4), V(8.2, H + 0.2, 8)), C("#f1e8d6"));
  for (const x of [-4.5, 0, 4.5]) { // tall windows with drapes
    b.add(quad(V(x - 1.0, 1.0, -6.18), V(x + 1.0, 1.0, -6.18), V(x + 1.0, 4.8, -6.18), V(x - 1.0, 4.8, -6.18)), lam("winP", () => ({ color: "#d8ecf6", emissive: "#c8e4f4", emissiveIntensity: 0.7 })));
    for (let k = 1; k < 4; k++) b.add(boxGeo(V(x - 1.0, 1.0 + 0.95 * k, -6.17), V(x + 1.0, 1.04 + 0.95 * k, -6.14)), C("#e8dcc0"));
    b.add(boxGeo(V(x - 0.02, 1.0, -6.17), V(x + 0.02, 4.8, -6.14)), C("#e8dcc0"));
    drapes(b, x, 2.4, -6.05, 5.2, "#8a1e2a");
  }
  for (const x of [-6.6, -2.25, 2.25, 6.6]) for (const z of [-5.4, -1.0, 3.4]) {
    if (Math.abs(x) < 3 && z > -5) continue;
    b.add(new THREE.CylinderGeometry(0.32, 0.36, H - 0.6, 16).translate(x, H / 2, z), lam("colM", () => ({ color: "#f4efe4" })));
    b.add(boxGeo(V(x - 0.5, 0, z - 0.5), V(x + 0.5, 0.3, z + 0.5)), C("#e0d8c8")); b.add(boxGeo(V(x - 0.5, H - 0.3, z - 0.5), V(x + 0.5, H, z + 0.5)), lam("gold", () => ({ color: "#d8b84a" })));
  }
  b.add(plane(-1.2, 1.2, -6.2, 8, 2.4, 0.01), C("#9a1e2a")); for (const sx of [-1, 1]) b.add(plane(sx * 1.2 - 0.06, sx * 1.2 + 0.06, -6.2, 8, 2.4, 0.012), lam("gold", () => ({ color: "#d8b84a" })));
  table2(b, 0, -2.4, 2.6, 1.3, 0.82, "#4a2a18", "#2f5a3a", false);
  b.add(quad(V(-0.9, 0.83, -1.9), V(0.9, 0.83, -1.9), V(0.9, 0.83, -2.9), V(-0.9, 0.83, -2.9)), lam("chartM", () => ({ map: chartTex() })));
  b.add(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8).translate(1.0, 0.92, -2.0), C("#d8b84a")); b.add(boxGeo(V(-1.15, 0.83, -2.2), V(-0.95, 0.88, -2.0)), C("#3a2a4a"));
  // high-backed chair (throne) behind the desk
  b.add(boxGeo(V(-0.5, 0.48, -3.9), V(0.5, 0.56, -3.3)), C("#7a1e2a")); b.add(boxGeo(V(-0.55, 0.0, -3.98), V(0.55, 2.6, -3.88)), lam("gold", () => ({ color: "#d8b84a" }))); b.add(boxGeo(V(-0.45, 0.6, -3.88), V(0.45, 2.45, -3.85)), C("#7a1e2a"));
  for (const x of [-3.2, 3.2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), lam("deB", () => ({ map: deFlag(), side: THREE.DoubleSide }))); m.position.set(x, 3.6, -6.1); s.root.add(m); }
  chandelier2(b, -2.5, 4.4, -1.5, 1.1); chandelier2(b, 2.5, 4.4, -1.5, 1.1); chandelier2(b, 0, 4.4, 3, 1.1);
  painting(b, -6.6, 3.2, -6.15, 1.2, 0.9, 3); painting(b, 6.6, 3.2, -6.15, 1.2, 0.9, 5);
  pottedPalm(b, -3.6, -5.2, 1.8); pottedPalm(b, 3.6, -5.2, 1.8);
  rug(b, "pal", ["#7a1e2a", "#d8b84a", "#2a3550", "#f1e8d6"], 0, -2.2, 4.2, 2.8);
  for (const x of [-1.8, 1.8]) b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6).translate(x, 1.0, -2.0), C("#d8b84a"));
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = { farm, camp, bay, cabin, palace };

// ---------------- dynamic ----------------
const shotT0 = (id: number) => SHOTS[id - 1].a / FPS;
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  farm: (s, t) => waveFlags(s, t),
  camp: (s, t, id) => { waveFlags(s, t); s.dyn.party.visible = id === 18; },
  bay: (s, t, id) => {
    waveFlags(s, t);
    const n = id === 10 ? 3 : 5;
    SHIPS.forEach(([x, z], i) => {
      const g = s.dyn["ship" + i], arrive = id === 10 ? 1 - smooth((t - shotT0(10) + 0.4 * i) / 1.6) : 0;
      g.visible = i < n; g.position.set(x + 34 * arrive, 0.12 * Math.sin(t * 1.3 + i), z); g.rotation.z = 0.015 * Math.sin(t * 1.1 + i * 2);
    });
  },
};

// ---------------- staging ----------------
type StageFn = (c: Ctx) => void;
const CUT = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, scale = 1) => pose(c, 1, CUTLAR, "cut", x, z, fo, scale);
const GRIF = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 2, GRIFFIN, "grif", x, z, fo);
const BOFF = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 3, BRITOFF, "boff", x, z, fo);
const PICK = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 4, PICKETT, "pick", x, z, fo);
const ADM = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 5, ADMIRAL, "adm", x, z, fo);
const KAIS = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 6, KAISER, "kais", x, z, fo);
const usS = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 20 + (k % 3), US(k % 3), `us${k % 3}`, x, z, fo, scale, y);
const ukS = (c: Ctx, k: number, x: number, z: number, fo: FrontOpts & Act, scale = 1, y = 0) => pose(c, 30 + (k % 3), RED(k % 3), `uk${k % 3}`, x, z, fo, scale, y);
/** redcoats lining the ship rails (small, distant) */
const decks = (c: Ctx, n: number, expr: FrontOpts["expr"] = "stern") => {
  SHIPS.slice(0, n).forEach(([x, z, ry, L], i) => {
    const g = 0; for (let k = 0; k < 6; k++) { const u = (k - 2.5) / 6 * L * 0.7, px = x + u * Math.cos(ry), pz = z - u * Math.sin(ry) + 0.8; ukS(c, k + i, px, pz, { mode: "stand", expr, look: -1, prop: k % 2 ? "rifleH" : null }, 0.8, L * 0.15 + 0.15 + g); }
  });
};
const usBattery = (c: Ctx, expr: FrontOpts["expr"], aim = true, sit = false) => {
  for (let k = 0; k < 5; k++) usS(c, k, -4.0 - 0.6 * (k % 2), -0.4 - 2.6 * k, { mode: sit ? "sit" : "stand", expr, look: 1, prop: aim && !sit ? "rifleH" : null }, 1, 0.75);
};
const PIG0: [number, number] = [-0.6, -3.0];
const yearFlip = (c: Ctx, t0: number, t1: number, y0: number, y1: number, p: V3, s = 0.5) => {
  if (c.t < t0 - LEAD) return;
  const y = y0 + Math.min(y1 - y0, Math.floor((y1 - y0) * clamp01((c.t - t0) / (t1 - t0))));
  card(c, `cal${y}`, 300, 340, (pen) => fxCal(pen, String(y), y === y1), p, s * pop(c.t, t0), 1.13 * s * pop(c.t, t0), { rot: 0.04 });
};
/** the standoff (shots 1, 13, 17, 21) */
const standoff = (c: Ctx, sit = false) => { usBattery(c, sit ? "dazed" : "stern", true, sit); decks(c, 5, sit ? "dazed" : "stern"); };

export const STAGE: Record<number, StageFn> = {
  // 1 In 1859, America and Britain almost went to war... over a pig.
  1: (c) => {
    const t = c.t;
    standoff(c);
    pigAt(c, { mode: "eat", chew: (t * 2.2) % 1, eye: after(t, A(0, "pig.")) ? "shock" : "dot" }, PIG0[0], PIG0[1], 0.62, false, 0.08);   // beach sand sits at y 0.06
    if (after(t, A(0, "1859"))) stay(c, A(0, "1859"), "cal1859", 300, 340, (p) => fxCal(p, "1859", true), [-1.2, 2.7, -3.0], 0.55, 0.62, 0.05);
    word(c, A(0, "war,"), "WAR!", [2.6, 3.4, -6], 1.6, 0.9, "#ffb0a0");
    if (after(t, A(0, "pig."))) sayB(c, A(0, "pig.") + 0.1, "OINK?", [0.25, 1.3, -3.1], 0.6, 1.0);
  },
  // 2 On a tiny island between the US and Canada,
  2: (c) => {
    const t = c.t;
    banner(c, A(1, "tiny"), "SAN JUAN ISLAND", [0, 9, -12], 9, "#2f6a43", 2.2);
    if (after(t, A(1, "between"))) banner(c, A(1, "between"), "USA  vs  BRITISH CANADA", [0, 7.0, -12], 8, "#2f4a8a", 1.6);
    pigAt(c, { mode: "walk", phase: (t * 1.4) % 1 }, -0.4 + 0.4 * Math.sin(t * 0.3), -3.4, 0.62);
    CUT(c, -1.8, -2.2, { mode: "stand", expr: "neutral", look: 0.5 });
    hens(c, [[-4.2, -6.4], [-3.6, -7.0]]);
  },
  // 3 an American farmer named Lyman Cutlar
  3: (c) => {
    const t = c.t;
    CUT(c, -1.0, -2.1, { mode: "stand", expr: after(t, A(1, "lyman")) ? "grin" : "smile", look: 0.4, dy: hop(t, A(1, "lyman"), 0.06, 0.25) });
    banner(c, A(1, "american"), "LYMAN CUTLAR", [-1.0, 2.85, -2.0], 1.4, "#2f4a8a", 2.2);
    if (after(t, A(1, "farmer"))) word(c, A(1, "farmer"), "FARMER", [-0.2, 2.45, -1.9], 0.65, 1.2);
    hens(c, [[-2.6, -3.8], [-3.1, -4.4]]);
  },
  // 4 found a pig eating his potatoes. Again.
  4: (c) => {
    const t = c.t, ag = after(t, A(1, "again,"));
    pigAt(c, { mode: "eat", chew: (t * 2.4) % 1, eye: ag ? "look" : "happy" }, 0.5, -3.5, 0.66);
    stay(c, A(1, "potatoes,"), "potatoes", 300, 180, fxPotatoes, [1.05, 0.12, -3.3], 0.42, 0.25);
    if (after(t, A(1, "potatoes,"))) word(c, A(1, "potatoes,"), "MUNCH!", [1.3, 1.25, -3.4], 0.6, 0.8);
    CUT(c, -1.4, -2.0, { mode: "stand", expr: ag ? "stern" : "shock", look: 0.8, prop: ag ? "point" : null, dy: hop(t, A(1, "again,"), 0.12, 0.3), lean: jolt(t, A(1, "again,"), -0.08) });
    if (ag) sayB(c, A(1, "again,"), "AGAIN?!", [-1.6, 2.5, -1.8], 0.8, 1.2);
  },
  // 5 So he shot it.
  5: (c) => {
    const t = c.t, sh = A(1, "shot");
    CUT(c, -1.4, -2.0, { mode: "stand", expr: after(t, sh) ? "grin" : "stern", look: 0.8, prop: "rifleH", lean: jolt(t, sh, -0.12) });
    pigAt(c, { mode: after(t, sh + 0.15) ? "dead" : "eat", chew: (t * 2.4) % 1, eye: "shock" }, 0.5, -3.5, 0.66, false, 0, true);
    if (after(t, sh)) { word(c, sh, "BANG!", [-0.3, 2.0, -2.4], 0.9, 0.7, "#ffd28a"); puff(c, sh, [-0.85, 1.25, -1.9], 0.6, 0.5); puff(c, sh + 0.15, [0.5, 0.45, -3.4], 0.7, 0.5); }
    hens(c, [[1.8 + 3 * ramp(t, sh, 0.6), -4.2], [2.2 + 3 * ramp(t, sh, 0.5), -4.8]]);
  },
  // 6 The pig belonged to an Irishman, working for a British company.
  6: (c) => {
    const t = c.t;
    GRIF(c, 6.2, -3.4, { mode: "stand", expr: after(t, A(2, "irishman,")) ? "smug" : "neutral", look: -0.4, prop: after(t, A(2, "british")) ? "book" : null, dy: hop(t, A(2, "irishman,"), 0.06, 0.25) });
    banner(c, A(2, "irishman,"), "CHARLES GRIFFIN", [6.2, 2.85, -3.3], 1.4, "#2f6a43", 1.8);
    if (after(t, A(2, "british"))) banner(c, A(2, "british"), "HUDSON'S BAY CO. (BRITISH)", [6.2, 2.85, -3.3], 1.6, "#c0353a", 1.8);
    hens(c, [[7.6, -5.0], [8.1, -5.6]]);
  },
  // 7 Cutlar offered ten dollars. The owner said, "A hundred." Cutlar said, "No."
  7: (c) => {
    const t = c.t, t10 = A(3, "10"), t100 = A(3, "100"), tno = A(3, "no.");
    CUT(c, 2.3, -2.6, { mode: "stand", expr: after(t, tno) ? "stern" : "smile", look: 0.7, prop: after(t, t10) && !after(t, t100) ? "bills" : after(t, tno) ? "shrug" : null, lean: jolt(t, tno, 0.06) });
    GRIF(c, 4.6, -2.9, { mode: "stand", expr: after(t, tno) ? "shock" : after(t, t100) ? "smug" : "neutral", look: -0.7, dy: hop(t, t100, 0.07, 0.25) });
    sayB(c, t10, "$10?", [2.6, 2.45, -2.4], 0.6, t100 - t10);
    sayB(c, t100, "$100!", [4.9, 2.45, -2.6], 0.65, tno - t100);
    if (after(t, tno)) sayB(c, tno, "NO.", [2.0, 2.4, -2.3], 0.55, 1.0);
  },
  // 8 The British threatened to arrest him.
  8: (c) => {
    const t = c.t, ar = A(4, "arrest");
    CUT(c, -1.6, -2.3, { mode: "stand", expr: after(t, ar) ? "nervous" : "neutral", look: 0.8, prop: after(t, ar) ? "handsUp" : null, dy: hop(t, ar, 0.08, 0.25) });
    BOFF(c, 0.4, -2.7, { mode: "stand", expr: "stern", look: -0.8, prop: "leaflet" });
    [0, 1].forEach((k) => ukS(c, k, 1.4 + 0.8 * k, -3.6 - 0.4 * k, { mode: "stand", expr: "stern", look: -0.8 }));
    if (after(t, ar)) stay(c, ar, "warrant", 520, 640, fxWarrant, [-0.25, 2.1, -2.0], 0.55, 0.68, 0.06);
  },
  // 9 So the US Army sent in sixty-four soldiers.
  9: (c) => {
    const t = c.t;
    const xs = -9 + 6 * ramp(t, A(4, "so"), 2.4);
    PICK(c, xs + 1.6, -2.0, { mode: "march", phase: (t * 1.4) % 1, expr: "stern", look: 1, prop: "swordUp" });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) usS(c, k + r, xs - 0.9 * k, -2.6 - 0.8 * r, { mode: "march", phase: (t * 1.4 + 0.5 * (k % 2)) % 1, expr: "stern", look: 1 });
    if (after(t, A(4, "64"))) banner(c, A(4, "64"), "64 SOLDIERS", [-0.5, 3.0, -2.4], 1.6, "#2f4a8a", 1.6);
  },
  // 10 Britain answered with three warships.
  10: (c) => {
    const t = c.t;
    usBattery(c, after(t, A(4, "three")) ? "shock" : "neutral", false);
    if (after(t, A(4, "three"))) banner(c, A(4, "three"), "+ 3 WARSHIPS", [5, 5.5, -16], 4.5, "#c0353a", 1.6);
  },
  // 11 Within weeks, it was four hundred and sixty Americans with fourteen cannons...
  11: (c) => {
    const t = c.t;
    PICK(c, 0.2, -1.4, { mode: "stand", expr: "grin", look: 0.3, prop: "swordUp" });
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) usS(c, k + r, -6.4 + 1.5 * k + 0.75 * (r % 2), -3.0 - 2.4 * r, { mode: "stand", expr: "stern", look: 0 });
    if (after(t, A(5, "460"))) banner(c, A(5, "460"), "460 AMERICANS", [0, 3.6, -3], 2.4, "#2f4a8a", 1.7);
    if (after(t, A(5, "14"))) banner(c, A(5, "14"), "14 CANNONS", [2, 2.5, -15.2], 3.0, "#3a3a44", 1.6);
  },
  // 12 versus over two thousand British troops, and five warships.
  12: (c) => {
    const t = c.t;
    decks(c, 5, "stern");
    if (after(t, A(5, "2,000"))) banner(c, A(5, "2,000"), "2,000+ BRITISH TROOPS", [16, 9, -24], 9, "#c0353a", 1.8);
    if (after(t, A(5, "five"))) word(c, A(5, "five"), "5 WARSHIPS", [14, 5.5, -20], 6, 1.0, "#ffd0c8");
  },
  // 13 All pointing at each other. Over a pig.
  13: (c) => {
    const t = c.t, pg = A(6, "pig.");
    standoff(c);
    if (after(t, A(6, "over"))) { const u = ramp(t, A(6, "over"), 1.0); pigAt(c, { mode: "ghost", eye: "happy" }, PIG0[0], PIG0[1], 0.62, false, 0.2 + 0.9 * u + 0.06 * Math.sin(t * 4), false); }
    if (after(t, pg)) word(c, pg, "OVER A PIG.", [-0.5, 2.3, -3.4], 1.1, 1.0);
  },
  // 14 Then the British admiral was ordered to attack.
  14: (c) => {
    const t = c.t;
    ADM(c, 0.0, -2.85, { mode: "stand", expr: after(t, A(7, "attack,")) ? "shock" : "neutral", look: 0.2, prop: "leaflet" });
    if (after(t, A(7, "admiral"))) banner(c, A(7, "admiral"), "REAR ADMIRAL BAYNES", [0, 2.3, -1.9], 1.3, "#1e2a4a", 1.6);
    if (after(t, A(7, "ordered"))) stay(c, A(7, "ordered"), "orders0", 520, 640, fxOrders(0), [0.65, 1.75, -1.9], 0.55, 0.68, -0.05);
  },
  // 15 He refused.
  15: (c) => {
    const t = c.t, rf = A(7, "refused.");
    ADM(c, 0.0, -2.85, { mode: "stand", expr: after(t, rf) ? "smug" : "stern", look: 0.2, prop: after(t, rf) ? "shrug" : "leaflet", lean: jolt(t, rf, 0.05) });
    const k = after(t, rf) ? clamp01((t - rf + LEAD) / 0.5) : 0;
    card(c, `orders${q(k, 8)}`, 520, 640, fxOrders(q(k, 8)), [0.65, 1.75 - 0.6 * k * k, -1.9], 0.55, 0.68, { rot: -0.05 });
    if (after(t, rf)) word(c, rf, "NO.", [-0.6, 2.5, -2.3], 0.75, 1.0);
  },
  // 16 He said he would not start a war between two great nations... over a squabble about a pig.
  16: (c) => {
    const t = c.t;
    ADM(c, 0.0, -2.85, { mode: "stand", expr: after(t, A(8, "squabble")) ? "laugh" : "stern", look: 0.2, prop: after(t, A(8, "start")) ? "point" : null, dy: hop(t, A(8, "pig."), 0.06, 0.25) });
    sayB(c, A(8, "start"), "A WAR? BETWEEN TWO EMPIRES?", [-0.55, 2.55, -2.4], 0.95, A(8, "over") - A(8, "start"));
    if (after(t, A(8, "over"))) sayB(c, A(8, "over"), "OVER A PIG?!", [-0.55, 2.55, -2.4], 0.8, 1.6);
    if (after(t, A(8, "pig."))) { pigAt(c, { mode: "ghost", eye: "happy" }, 1.1, -2.2, 0.4, false, 1.1 + 0.05 * Math.sin(t * 4), false); }
  },
  // 17 So both armies just... stayed. For twelve years.
  17: (c) => {
    const t = c.t;
    standoff(c, true);
    yearFlip(c, A(9, "for"), A(9, "years.") + 0.6, 1860, 1872, [-0.6, 2.9, -2.4], 1.1);
    if (after(t, A(9, "12"))) banner(c, A(9, "12"), "12 YEARS", [-0.6, 4.3, -2.4], 2.4, "#3a3a44", 1.4);
    if (after(t, A(9, "stayed"))) card(c, `zzz${q((t * 0.8) % 1, 4)}`, 600, 300, (p) => fxWord(p, "Zzz", "#e8f0ff"), [-3.4, 2.6, -2.6], 1.1, 0.55);
  },
  // 18 They threw parties, and held sports days together.
  18: (c) => {
    const t = c.t, pull = 0.12 * Math.sin(t * 5);
    [0, 1, 2].forEach((k) => usS(c, k, -2.2 - 0.75 * k + pull, -4.6, { mode: "stand", expr: "grin", look: -1, lean: 0.25 }));
    [0, 1, 2].forEach((k) => ukS(c, k, 0.6 + 0.75 * k + pull, -4.6, { mode: "stand", expr: "laugh", look: 1, lean: -0.25 }));
    card(c, "rope", 1000, 80, fxRope, [-0.8 + pull, 1.0, -4.55], 3.6, 0.29);
    PICK(c, 3.2, -3.0, { mode: "stand", expr: "laugh", look: 0.6, prop: "salute" });
    BOFF(c, 4.0, -3.2, { mode: "stand", expr: "laugh", look: -0.6, prop: "shrug" });
    card(c, "cake", 400, 300, fxCake, [4.6, 1.05, -4.4], 0.5, 0.38);
    if (after(t, A(9, "parties"))) confetti(c, A(9, "parties"), [0.4, 2.4, -3.8], 3.2);
    if (after(t, A(9, "sports"))) banner(c, A(9, "sports"), "SPORTS DAY: USA vs UK", [-0.6, 3.1, -4.2], 1.9, "#e07a1a", 2.0);
  },
  // 19 In 1872, the German Kaiser was asked to settle it... and he gave the island to America.
  19: (c) => {
    const t = c.t, gv = A(10, "gave");
    KAIS(c, 0.0, -3.4, { mode: "stand", expr: after(t, gv) ? "smug" : "stern", look: 0.2, prop: after(t, A(10, "settle")) && !after(t, gv + 0.6) ? "stamp" : null, lean: jolt(t, gv, 0.05) });
    if (after(t, A(10, "1872,"))) stay(c, A(10, "1872,"), "cal1872", 300, 340, (p) => fxCal(p, "1872", true), [-1.6, 2.6, -3.0], 0.55, 0.62, 0.05);
    if (after(t, A(10, "kaiser"))) banner(c, A(10, "kaiser"), "KAISER WILHELM I", [0, 3.05, -3.0], 1.6, "#1e1e22", 1.8);
    const k = after(t, gv) ? clamp01((t - gv + LEAD) / 0.1) : 0;
    if (after(t, A(10, "settle"))) card(c, `isl${q(k, 6)}`, 700, 520, fxIsland(q(k, 6)), [0.0, 1.75, -2.0], 0.95, 0.7, { rot: -0.03 });
    if (k > 0) { puff(c, gv, [0.1, 1.6, -1.95], 0.4, 0.4); word(c, A(10, "america."), "USA!", [0.9, 2.5, -1.9], 0.7, 1.2, "#b8d8ff"); }
    [-2.4, 2.4].forEach((x, i) => pose(c, 40, { ...KAISER, sash: undefined, build: undefined, moustache: "#3a2a1e", jacket: "#3a4560" }, "guard", x, -4.6, { mode: "stand", expr: "stern", look: i ? -0.3 : 0.3, prop: "rifleH" }));
  },
  // 20 Total casualties of the war? One pig.
  20: (c) => {
    const t = c.t, one = A(11, "one");
    card(c, "grave", 400, 500, fxGrave, [0.5, 0.55, -3.4], 0.88, 1.1);
    CUT(c, -0.45, -2.9, { mode: "stand", expr: "sad", look: 0.6 });
    GRIF(c, 1.45, -3.0, { mode: "stand", expr: "sad", look: -0.6 });
    if (after(t, A(11, "total"))) banner(c, A(11, "total"), "TOTAL CASUALTIES:", [0.5, 2.95, -3.0], 1.6, "#3a3a44", 2.4);
    if (after(t, one)) { pigAt(c, { mode: "ghost", eye: "happy" }, 0.5, -3.5, 0.5, false, 1.25 + 0.06 * Math.sin(t * 4), false); word(c, one, "1 PIG", [0.5, 2.45, -2.9], 0.9, 1.4, "#ffd0e0"); }
    hens(c, [[-2.4, -4.8]]);
  },
  // 21 Send this to the friend who overreacts about everything.  (ends on shot 1's opening frame)
  21: (c) => {
    const t = c.t;
    standoff(c);
    pigAt(c, { mode: "eat", chew: (t * 2.2) % 1, eye: "dot" }, PIG0[0], PIG0[1], 0.62, false, 0.08);
    banner(c, A(12, "send"), "SEND THIS TO THAT FRIEND", [0.2, 3.3, -3.2], 2.2, "#e07a1a", 1.9);
    if (after(t, A(12, "overreacts"))) sayB(c, A(12, "overreacts"), "WHO OVERREACTS", [0.2, 2.6, -3.0], 1.2, 1.1);
  },
};
