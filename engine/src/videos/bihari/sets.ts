// Places and cast of "The Man Declared Dead" (Lal Bihari, 9:16 short). Cameras sit on +z looking toward -z (+x = screen right).
// Direction sheet: 1970s-80s small-town Uttar Pradesh. Palette: government green, limewash, saffron, paper-yellow; the red of
// stamp ink is kept for DECEASED / REJECTED / ALIVE marks only. One key moment per shot, on a narration word. Anticipation ->
// release -> settle on every big move (stamp slams, hops). Staging runs on twos (world.ts).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, M4, plane, earthHD, beamBetween, cart } from "./props3d";
import { Kit, quad } from "./build";
import { rep, ctex, stoneHD, roofHD } from "./paint";
import { pottedPalm, signHD, wbox } from "./decor";
import { Pen, SKINS, fxPuff, fxConfetti, Outfit, FrontOpts, fxWord, fxBanner, fxDoc, fxIdea, fxCal, fxSay, cowSide, henSide, rrect, txt, tw } from "./toon";
import { Stage, CamInfo, person, blob, lidAt, hh, q, Who, tier } from "./cast";
import { V3, smooth, clamp01, LEAD, SetId, at, atN, lineStart } from "./story";

// ---------------- cast (Azamgarh, 1976-1994) ----------------
const DESI = ["#b97c50", "#a86e46", "#c98d5e", "#9a6440"];
const LB: Outfit = { jacket: "#f3eee0", pants: "#ebe4d2", boots: "#6b4a2e", hat: "hair", hair: "#1d1410", moustache: "#1d1410", skin: DESI[2] };
const UNCLE: Outfit = { jacket: "#8a6a3e", pants: "#efe8d6", boots: "#5a3a22", hat: "turban", hatCol: "#e8e0cc", trim: "#c9a24a", moustache: "#d8d4cc", skin: DESI[3], build: "stout" };
const OFFICIAL: Outfit = { jacket: "#c8b48a", pants: "#c8b48a", boots: "#2a1e16", hat: "hair", hair: "#2a2220", moustache: "#2a2220", skin: DESI[1], build: "stout", buttons: "#8a7650" };
const CLERK: Outfit = { jacket: "#f1f0ea", pants: "#5a5e66", boots: "#2a1e16", hat: "hair", hair: "#1d1410", moustache: "#1d1410", skin: DESI[0] };
const WIFE: Outfit = { jacket: "#e8a33a", dress: "#b8323a", pants: "#b8323a", boots: "#6b4a2e", hat: "hair", hair: "#1d1410", skin: DESI[2] };
const COP = (v: number): Outfit => ({ jacket: "#b49a62", pants: "#b49a62", boots: "#2a1e16", hat: "peaked", hatCol: "#8a5a2a", belt: "#5a3a1e", buttons: "#e8c45a", moustache: "#1d1410", skin: DESI[v % 4], build: v % 2 ? "stout" : undefined });
const VILL = (v: number): Outfit => v % 3 === 1
  ? { jacket: ["#e25a4a", "#3f7ab8", "#7a5ac9"][(v >> 1) % 3], dress: ["#e8a33a", "#c94a7a", "#2f8a6a"][(v >> 1) % 3], pants: "#3b3f52", boots: "#6b4a2e", hat: "hair", hair: "#1d1410", skin: DESI[(v + 1) % 4] }
  : { jacket: ["#f4efe2", "#9ab8d0", "#e8d8a8", "#c8d8b8"][v % 4], pants: "#efe8d6", boots: "#6b4a2e", hat: v % 4 === 3 ? "turban" : "hair", hatCol: ["#f4eedf", "#e8a33a"][v % 2], trim: "#f4eedf", hair: "#1d1410", skin: DESI[(v + 2) % 4], moustache: v % 2 ? "#1d1410" : undefined };
const MOURNER = (v: number): Outfit => ({ ...VILL(v * 2), jacket: "#f4f1ea", pants: "#f4f1ea", dress: v % 3 === 1 ? "#f4f1ea" : undefined, hatCol: "#f4f1ea" });

type Ctx = { cam: CamInfo; t: number; out: Stage };
const after = (t: number, c: number) => t >= c - LEAD;
// ---------------- life: card-level motion ----------------
type Act = { lean?: number; dy?: number };
const sway = (t: number, i: number, amp0 = 0.03, hz0 = 0.5) => { const amp = amp0 * 0.45, hz = hz0 * 0.7; return amp * Math.sin(2 * Math.PI * (hz * t + hh(i, 5))) + 0.4 * amp * Math.sin(2 * Math.PI * (1.7 * hz * t + hh(i, 6))); };
const jolt = (t: number, at0: number, amp: number) => { const u = (t - at0 + LEAD) / 0.12; return u < 0 ? 0 : 0.7 * amp * u * Math.exp(1 - u); };
/** hop with anticipation (a small crouch first) and a settle bounce */
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
/** lit animal card (cow, hen): an actor drawn with a creature function, sized by distance */
const beast = (c: Ctx, key: string, draw: (p: Pen) => void, x: number, z: number, scale = 1, mirror = false) => {
  const d = c.cam.pos.distanceTo(new THREE.Vector3(x, 1, z)) / scale;
  c.out.places.push({ key: `${key}|${tier(d)[0]}`, draw, x, y: 0, z, scale, mirror, size: tier(d) });
  blob(c.out, x, 0, z, scale * 1.2);
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

// ---------------- effect drawings ----------------
/** wooden rubber stamp, 200 x 300: knob, neck, base with a red ink rim */
const fxStamp = (p: Pen) => {
  p.ell(100, 50, 44, 40, "#7a4a2a", 9); p.ell(88, 40, 16, 12, "#a8724a", 0);
  p.poly(rrect(80, 80, 120, 190, 6), "#8a5a34", 8);
  p.poly(rrect(30, 190, 170, 250, 8), "#5a3a22", 9);
  p.poly(rrect(34, 248, 166, 272, 4), "#c0353a", 7);
};
/** the certificate on the desk: fxDoc with a death-register title */
const DOC_LINES = ["Name: LAL BIHARI", "Village: Khalilabad", "Dist.: Azamgarh, U.P."];
const certDraw = (stamp: number, txt0 = "DECEASED", col = "#c0353a") => (p: Pen) => fxDoc(p, "REGISTER OF DEATHS", DOC_LINES, txt0, stamp, col, 252);
/** ALIVE over a struck-out DECEASED */
const aliveDraw = (k: number) => (p: Pen) => {
  fxDoc(p, "REGISTER OF DEATHS", DOC_LINES, "DECEASED", 1, "#c0353a", 252);
  if (k > 0) {
    const g = p.g; g.save(); g.strokeStyle = "#1e1a16"; g.lineWidth = 12; g.beginPath(); g.moveTo(240, 220); g.lineTo(480, 290); g.stroke(); g.restore();
    const s = 1 + 0.6 * (1 - k); g.save(); g.globalAlpha = Math.min(1, k * 1.5); g.translate(170, 300); g.rotate(0.12); g.scale(s, s);
    g.strokeStyle = "#2f8a3a"; g.lineWidth = 9; g.strokeRect(-104, -38, 208, 76); g.fillStyle = "#2f8a3a"; g.font = "900 52px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ALIVE", 0, 2); g.restore();
  }
};
/** fan of rupee notes, 400 x 240 */
const fxRupees = (p: Pen) => {
  for (let k = 0; k < 3; k++) {
    const g = p.g; g.save(); g.translate(200, 200); g.rotate(-0.35 + 0.3 * k); g.translate(-200, -200);
    p.poly(rrect(70, 60, 330, 190, 8), ["#b8a0d8", "#9ac0a0", "#d8b080"][k], 8); p.poly(rrect(84, 74, 316, 176, 4), null, 3);
    txt(p, "₹100", 200, 128, 52, "#3a2a4a", "900", "center", "Georgia, serif"); g.restore();
  }
};
/** a hand-painted name board, 700 x 260 */
const fxNameBoard = (s1: string, s2: string) => (p: Pen) => {
  p.poly(rrect(20, 20, 680, 240, 10), "#2f5a8a", 10); p.poly(rrect(38, 38, 662, 222, 6), null, 4, );
  tw(p, s1, 350, 100, 600, 70, "#fff3d0", "900", "Georgia, serif");
  if (s2) tw(p, s2, 350, 180, 600, 64, "#ffd24a", "900", "Georgia, serif");
};
/** a letter signed 'the late Lal Bihari', 520 x 640 */
const fxLateLetter = (k: number) => (p: Pen) => {
  p.poly(rrect(20, 20, 500, 620, 10), "#f8f1dc", 9);
  const g = p.g; g.fillStyle = "#2a2010"; g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.font = "bold 34px Georgia, serif"; g.fillText("To: The Collector,", 56, 90); g.fillText("      Azamgarh", 56, 132);
  for (let j = 0; j < 6; j++) p.stroke([[56, 200 + 44 * j], [460 - 60 * (j % 3), 200 + 44 * j]], 5, "#9a8f78");
  g.font = "italic 36px Georgia, serif"; g.fillText("Yours faithfully,", 56, 500);
  if (k > 0) { g.save(); g.globalAlpha = Math.min(1, k * 2); g.font = "italic 900 46px Georgia, serif"; g.fillStyle = "#1e3a8a"; g.fillText("(Late) Lal Bihari", 56, 570); g.restore(); }
};
/** pension form, 520 x 640 */
const fxPension = (k: number) => (p: Pen) => {
  p.poly(rrect(20, 20, 500, 620, 10), "#eef2e0", 9);
  txt(p, "WIDOW PENSION", 260, 86, 46, "#2a3a2a", "900", "center", "Georgia, serif");
  txt(p, "APPLICATION", 260, 136, 40, "#2a3a2a", "900", "center", "Georgia, serif");
  const g = p.g; g.font = "30px Georgia, serif"; g.fillStyle = "#2a2010"; g.textAlign = "left";
  g.fillText("Husband: Lal Bihari", 50, 230); g.fillText("Status: DECEASED", 50, 280); g.fillText("Applicant: his wife", 50, 330);
  for (let j = 0; j < 3; j++) p.stroke([[50, 380 + 44 * j], [470, 380 + 44 * j]], 4, "#a8b098");
  if (k > 0) {
    const s = 1 + 0.6 * (1 - k); g.save(); g.globalAlpha = Math.min(1, k * 1.5); g.translate(270, 500); g.rotate(-0.2); g.scale(s, s);
    g.strokeStyle = "#c0353a"; g.lineWidth = 9; g.strokeRect(-150, -42, 300, 84); g.fillStyle = "#c0353a"; g.font = "900 56px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("REJECTED", 0, 2); g.restore();
  }
};
/** election poster, 520 x 700 */
const fxPoster = (p: Pen) => {
  p.poly(rrect(20, 20, 500, 680, 8), "#f4e9c8", 9);
  p.poly(rrect(20, 20, 500, 150, 8), "#e07a1a", 9);
  txt(p, "VOTE FOR", 260, 100, 64, "#fff6e0", "900");
  p.ell(260, 300, 110, 120, "#d8c49a", 8); txt(p, "?", 260, 310, 150, "#5a4a2a", "900");
  txt(p, "LAL BIHARI", 260, 480, 66, "#1e2a5a", "900", "center", "Georgia, serif");
  txt(p, "(DEAD)", 260, 570, 76, "#c0353a", "900");
};
/** a grawlix speech bubble, 600 x 360 */
const fxCurse = (p: Pen) => fxSay(p, "#@%&!!");
/** hoe (phawda), 160 x 600: long handle, iron blade */
const fxHoe = (p: Pen) => { p.band([[80, 40], [80, 520]], "#9a6a3a", 26, 7, "round"); p.poly([[30, 500], [130, 500], [140, 590], [20, 590]], "#7a8288", 8); };
/** marigold garland (a U of orange beads), 500 x 400 */
const fxGarland = (p: Pen) => { for (let k = 0; k <= 16; k++) { const a = Math.PI * (k / 16); p.ell(250 - 200 * Math.cos(a), 60 + 280 * Math.sin(a), 30, 28, k % 2 ? "#f2a01a" : "#e87a12", 6); } };
/** loudspeaker-cone megaphone, 300 x 200 */
const fxMegaphone = (p: Pen) => { p.poly([[40, 80], [210, 20], [210, 180], [40, 120]], "#e8e4dc", 9); p.ell(214, 100, 26, 82, "#c9ccd2", 8); p.poly(rrect(60, 116, 100, 180, 6), "#3a3a40", 7); };

// ---------------- textures ----------------
/** limewashed government-office wall: pale green above, oil-painted dark green dado, damp stains, peeling patches */
const limeWall = (key: string, top: string, dado: string) => ctex("lime" + key, 1024, 1024, (g, r) => {
  g.fillStyle = top; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "40,60,40"},${0.03 + 0.04 * r()})`; const s = 4 + 30 * r(); g.fillRect(1024 * r(), 1024 * r(), s, s * (0.5 + r())); }
  for (let k = 0; k < 6; k++) { const x = 1024 * r(), w = 60 + 160 * r(); const gr = g.createLinearGradient(0, 0, 0, 500); gr.addColorStop(0, "rgba(90,80,50,0.0)"); gr.addColorStop(1, "rgba(90,80,50,0.22)"); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + w * 0.2, 300, x - w * 0.3, 420, x + w * 0.5, 560); g.lineTo(x + w, 0); g.fill(); }
  for (let k = 0; k < 9; k++) { // peeling patches showing brick-red plaster
    const x = 1024 * r(), y = 1024 * r(), rr = 14 + 38 * r();
    g.fillStyle = "#c8a080"; g.beginPath(); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, d = rr * (0.6 + 0.5 * r()); g.lineTo(x + d * Math.cos(a), y + d * 0.7 * Math.sin(a)); } g.fill();
    g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 2; g.stroke();
  }
  g.fillStyle = dado; g.fillRect(0, 700, 1024, 324); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(0, 700, 1024, 8);
  g.fillStyle = "#2a3a2e"; g.fillRect(0, 694, 1024, 10);
  for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(0,0,0,${0.03 + 0.05 * r()})`; g.fillRect(1024 * r(), 704 + 320 * r(), 2 + 8 * r(), 2 + 4 * r()); }
});
/** speckled terrazzo floor tiles */
const terrazzo = (key: string, base: string) => ctex("terr" + key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 14000; k++) { g.fillStyle = ["#f4efe2", "#3a3a3a", "#9a5a3a", "#6a6a60", "#d8c8a8"][Math.floor(r() * 5)]; const s = 1.5 + 4 * r(); g.fillRect(1024 * r(), 1024 * r(), s, s); }
  g.strokeStyle = "rgba(40,40,30,0.35)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, 1024); g.stroke(); g.beginPath(); g.moveTo(0, i * 256); g.lineTo(1024, i * 256); g.stroke(); }
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(60,40,20,${0.04 + 0.05 * r()})`; g.beginPath(); g.ellipse(1024 * r(), 1024 * r(), 30 + 90 * r(), 20 + 50 * r(), r() * 3, 0, Math.PI * 2); g.fill(); }
});
/** a file bundle face: buff card, red tape, a paper label, frayed paper edges */
const fileTex = () => ctex("fileB", 512, 512, (g, r) => {
  for (let y = 0; y < 512; y += 16) { g.fillStyle = ["#e2cf9e", "#d6c08a", "#ead9ae", "#cdb67e", "#f0e4c0"][Math.floor(r() * 5)]; g.fillRect(0, y, 512, 16); g.fillStyle = "rgba(90,70,30,0.35)"; g.fillRect(0, y + 14, 512, 2); for (let k = 0; k < 6; k++) g.fillRect(512 * r(), y, 3 + 10 * r(), 2); }
  g.fillStyle = "#b8323a"; g.fillRect(232, 0, 46, 512); g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(232, 0, 6, 512);
});
/** sun-faded mud plaster with handprint-style motifs near the door */
const mudWall = (key: string, base: string) => ctex("mud" + key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 4000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,240,210" : "90,60,30"},${0.04 + 0.06 * r()})`; const s = 3 + 24 * r(); g.beginPath(); g.ellipse(1024 * r(), 1024 * r(), s, s * 0.6, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(90,60,30,0.25)"; g.lineWidth = 2; for (let k = 0; k < 30; k++) { let x = 1024 * r(), y = 1024 * r(); g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 5; i++) { x += 30 * (r() - 0.5); y += 24 * r(); g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = "#c95a3a"; for (let k = 0; k < 6; k++) { const x = 140 + 140 * k, y = 760; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(x - 16 + 8 * i, y - 30 - 10 * Math.sin(i * 0.8), 5, 14, 0, 0, Math.PI * 2); g.fill(); } g.beginPath(); g.ellipse(x, y, 20, 22, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(80,50,25,0.5)"; g.fillRect(0, 960, 1024, 64);
});
/** woven jute charpai top */
const weave = () => ctex("weave", 256, 256, (g) => {
  g.fillStyle = "#c8a46a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = (i + j) % 2 ? "#a8844a" : "#dcb87a"; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); }
});
/** mustard field: green rows with yellow flower heads */
const mustard = () => ctex("mustard", 1024, 1024, (g, r) => {
  g.fillStyle = "#6a8a2e"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 9000; k++) { g.fillStyle = ["#f2d22a", "#e8c21a", "#f8e04a", "#8aa83a"][Math.floor(r() * 4)]; const s = 3 + 7 * r(); g.beginPath(); g.arc(1024 * r(), 1024 * r(), s, 0, Math.PI * 2); g.fill(); }
});
/** dusty road */
const dustRoad = () => ctex("dustRoad", 1024, 1024, (g, r) => {
  g.fillStyle = "#b8a080"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 6000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "230,210,180" : "90,70,50"},${0.05 + 0.08 * r()})`; const s = 2 + 14 * r(); g.fillRect(1024 * r(), 1024 * r(), s, s * 0.6); }
  g.strokeStyle = "rgba(80,60,40,0.18)"; g.lineWidth = 10; for (const x of [330, 380, 640, 690]) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 30, 340, x - 30, 680, x, 1024); g.stroke(); }
});
/** painted shop facade: colour wash, rolling shutter, weathering */
const shopTex = (key: string, wall: string) => ctex("shop" + key, 512, 512, (g, r) => {
  g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 1500; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "60,40,30"},${0.04 + 0.05 * r()})`; const s = 3 + 20 * r(); g.fillRect(512 * r(), 512 * r(), s, s * 0.7); }
  g.fillStyle = "rgba(60,40,30,0.25)"; for (let k = 0; k < 8; k++) { const x = 512 * r(); g.fillRect(x, 0, 6 + 10 * r(), 120 + 200 * r()); }
});
const shutterTex = () => ctex("shutter", 256, 256, (g) => { g.fillStyle = "#7a8288"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 10) { g.fillStyle = "#5a6268"; g.fillRect(0, y, 256, 3); g.fillStyle = "#9aa2a8"; g.fillRect(0, y + 3, 256, 2); } });
const buntingTex = () => ctex("bunting", 512, 64, (g) => { for (let k = 0; k < 8; k++) { g.fillStyle = ["#e07a1a", "#f4f1ea", "#2f8a3a", "#e8c21a"][k % 4]; g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 64, 0); g.lineTo(k * 64 + 32, 60); g.fill(); } });
const calTex = (year: string) => ctex("wallcal" + year, 256, 320, (g) => {
  g.fillStyle = "#fffdf6"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#c0353a"; g.fillRect(0, 0, 256, 70);
  g.fillStyle = "#fff"; g.font = "900 50px sans-serif"; g.textAlign = "center"; g.fillText(year, 128, 54);
  g.fillStyle = "#3a3a3a"; g.font = "22px sans-serif"; for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) g.fillText(String(1 + i * 7 + j > 31 ? "" : 1 + i * 7 + j), 22 + j * 35, 110 + i * 42);
});
const clockTex = () => ctex("clockFace", 256, 256, (g) => {
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#1e1e24"; g.lineWidth = 6;
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(128 + 100 * Math.cos(a), 128 + 100 * Math.sin(a)); g.lineTo(128 + 116 * Math.cos(a), 128 + 116 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 150); g.stroke();
});

// ---------------- builders ----------------
export type SetBuild = { b: Batch; root: THREE.Object3D; kit: Kit; dyn: Record<string, THREE.Object3D> };
const C = (col: string) => lam("c" + col, () => ({ color: col }));
/** box with a face texture (front faces +z) */
const tbox = (b: Batch, mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), mat);
/** a stack of tied file bundles, base centre (x, z) */
const fileStack = (b: Batch, x: number, z: number, n: number, seed: number, w = 0.42, d = 0.3) => {
  const F = lam("files", () => ({ map: fileTex() }));
  let y = 0;
  for (let k = 0; k < n; k++) {
    const h = 0.06 + 0.07 * hh(seed + k, 1), dx = 0.05 * (hh(seed + k, 2) - 0.5), ry = 0.12 * (hh(seed + k, 3) - 0.5);
    b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), F, M4(x + dx, y, z, ry));
    y += h;
  }
  return y;
};
/** ceiling fan, dynamic (rotated in POSE) */
const fan = (s: SetBuild, x: number, y: number, z: number, key: string) => {
  const g = new THREE.Group(), M = lam("fanM", () => ({ color: "#7a7268" }));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 14), M));
  for (let k = 0; k < 3; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.14).translate(0.4, -0.02, 0), M); bl.rotation.y = (k * Math.PI * 2) / 3; bl.rotation.x = 0.08; g.add(bl); }
  g.position.set(x, y, z); s.root.add(g); s.dyn[key] = g;
  s.b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6).translate(x, y + 0.3, z), M);
};
/** steel almirah (cupboard) */
const almirah = (b: Batch, x: number, z: number, h = 1.95) => {
  const S = lam("steel", () => ({ color: "#6e7a80" }));
  b.add(boxGeo(V(x - 0.48, 0, z - 0.25), V(x + 0.48, h, z + 0.25)), S);
  b.add(boxGeo(V(x - 0.004, 0.05, z + 0.25), V(x + 0.004, h - 0.05, z + 0.26)), C("#4a5258"));
  for (const sx of [-1, 1]) b.add(boxGeo(V(x + sx * 0.06 - 0.015, 0.9, z + 0.25), V(x + sx * 0.06 + 0.015, 1.12, z + 0.29)), C("#c9ccd2"));
  fileStack(b, x - 0.15, z, 3, x * 7, 0.38, 0.28); b.add(boxGeo(V(x + 0.05, h, z - 0.15), V(x + 0.4, h + 0.32, z + 0.15)), lam("files", () => ({ map: fileTex() })));
};
/** wooden window with iron bars and blue shutters in a wall at depth z (facing +z) */
const barredWindow = (b: Batch, x: number, y: number, z: number, w: number, h: number) => {
  const Wd = C("#5a3a22"), Bl = C("#3f6fb5"), Ir = C("#2a2a30");
  b.add(boxGeo(V(x - w / 2 - 0.08, y - 0.08, z), V(x + w / 2 + 0.08, y + h + 0.08, z + 0.1)), Wd);
  b.add(quad(V(x - w / 2, y, z + 0.11), V(x + w / 2, y, z + 0.11), V(x + w / 2, y + h, z + 0.11), V(x - w / 2, y + h, z + 0.11)), lam("winSky", () => ({ color: "#d8ecf6", emissive: "#c8e4f4", emissiveIntensity: 0.55 })));
  for (let xx = x - w / 2 + 0.1; xx < x + w / 2; xx += 0.13) b.add(new THREE.CylinderGeometry(0.012, 0.012, h, 6).translate(xx, y + h / 2, z + 0.14), Ir);
  for (const sd of [-1, 1]) b.add(boxGeo(V(x + sd * (w / 2 + 0.08) + (sd < 0 ? -w / 2 : 0), y, z + 0.1), V(x + sd * (w / 2 + 0.08) + (sd > 0 ? w / 2 : 0), y + h, z + 0.16)), Bl);
};
/** the revenue office / bank interior shell */
const officeShell = (s: SetBuild, key: string, top: string, dado: string, floor: string, H = 3.9) => {
  const { b } = s, Wl = lam("wall" + key, () => ({ map: limeWall(key, top, dado) }));
  b.add(plane(-5.2, 5.2, -4.6, 9, 2.6), lam("floor" + key, () => ({ map: terrazzo(key, floor) })));
  wbox(b, Wl, -5.2, 0, -4.9, 5.2, H, -4.6, 3.9, 3.9);
  for (const sd of [-1, 1]) wbox(b, Wl, sd > 0 ? 5.2 : -5.5, 0, -4.9, sd > 0 ? 5.5 : -5.2, H, 9, 3.9, 3.9);
  b.add(boxGeo(V(-5.5, H, -4.9), V(5.5, H + 0.1, 9)), C("#e8e4d8"));
  for (const z of [-3.2, -0.5, 2.2]) b.add(boxGeo(V(-5.5, H - 0.22, z - 0.14), V(5.5, H, z + 0.14)), C("#d8d2c4")); // ceiling beams
  // tube light
  b.add(boxGeo(V(-0.6, 3.05, -4.58), V(0.6, 3.1, -4.5)), C("#d8d8d0"));
  b.add(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8).rotateZ(Math.PI / 2).translate(0, 3.02, -4.48), lam("tube", () => ({ color: "#f8fff8", emissive: "#e8fff0", emissiveIntensity: 1.6 })));
  // electric conduit and switchboard
  b.add(boxGeo(V(-4.0, 3.1, -4.58), V(4.0, 3.13, -4.55)), C("#3a3a3a"));
  b.add(boxGeo(V(-4.03, 1.3, -4.58), V(-4.0, 3.13, -4.55)), C("#3a3a3a"));
  b.add(boxGeo(V(-4.2, 1.15, -4.6), V(-3.8, 1.45, -4.52)), C("#2a2a2a")); for (let k = 0; k < 4; k++) b.add(boxGeo(V(-4.15 + 0.08 * k, 1.28, -4.52), V(-4.1 + 0.08 * k, 1.36, -4.49)), C("#f4f1ea"));
};
/** charpai: rope-woven cot */
const charpai = (b: Batch, x: number, z: number, ry = 0, h = 0.48) => {
  const m = M4(x, 0, z, ry), Wd = C("#7a4a28");
  for (const [sx, sz] of [[-0.9, -0.45], [0.9, -0.45], [-0.9, 0.45], [0.9, 0.45]]) b.add(new THREE.CylinderGeometry(0.05, 0.04, h, 8).translate(sx, h / 2, sz), Wd, m);
  for (const sz of [-0.45, 0.45]) b.add(boxGeo(V(-0.95, h - 0.06, sz - 0.04), V(0.95, h, sz + 0.04)), Wd, m);
  for (const sx of [-0.92, 0.92]) b.add(boxGeo(V(sx - 0.04, h - 0.06, -0.45), V(sx + 0.04, h, 0.45)), Wd, m);
  b.add(boxGeo(V(-0.88, h - 0.04, -0.41), V(0.88, h - 0.02, 0.41)), lam("weave", () => ({ map: rep(weave(), 4, 2) })), m);
};
/** neem tree: trunk + clustered leaf balls */
const neem = (b: Batch, x: number, z: number, H: number, seed: number) => {
  b.add(new THREE.CylinderGeometry(0.16 * H / 6, 0.32 * H / 6, H * 0.55, 9).translate(x, H * 0.275, z), C("#6a4a32"));
  for (let k = 0; k < 9; k++) {
    const a = k * 2.4 + seed, r = (0.25 + 0.5 * hh(seed + k, 1)) * H * 0.32;
    b.add(new THREE.IcosahedronGeometry(H * (0.16 + 0.07 * hh(seed + k, 2)), 1).translate(x + r * Math.cos(a), H * (0.62 + 0.25 * hh(seed + k, 3)), z + r * Math.sin(a) * 0.7),
      lam("neem" + (k % 3), () => ({ color: ["#4f8a3a", "#5e9a42", "#467e34"][k % 3] })));
  }
};
/** village house: mud-plaster walls, clay-tile pitched roof, wooden door, tiny window */
const mudHouse = (b: Batch, x: number, z: number, w: number, d: number, h: number, i: number) => {
  const base = ["#d8b48a", "#cfa47a", "#e0c094", "#c89a70"][i % 4];
  wbox(b, lam("mud" + i, () => ({ map: mudWall("m" + i, base) })), x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2, 3.2, 3.2);
  const R = lam("tiles", () => ({ map: rep(roofHD("#b5583a"), 2, 2) }));
  b.add(new THREE.CylinderGeometry(d * 0.62, d * 0.62, w + 0.5, 3, 1).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).scale(1, 0.48, 1).translate(x, h + d * 0.62 * 0.24, z), R);
  b.add(boxGeo(V(x - 0.42, 0, z + d / 2), V(x + 0.42, 1.85, z + d / 2 + 0.06)), C("#6a4426"));
  b.add(boxGeo(V(x - 0.5, 1.85, z + d / 2), V(x + 0.5, 1.98, z + d / 2 + 0.1)), C("#4a2e18"));
  b.add(boxGeo(V(x + w / 2 - 0.9, 1.1, z + d / 2), V(x + w / 2 - 0.4, 1.55, z + d / 2 + 0.05)), C("#2a2a30"));
  b.add(boxGeo(V(x - w / 2 - 0.05, 0, z + d / 2 - 0.05), V(x + w / 2 + 0.05, 0.25, z + d / 2 + 0.35)), C("#b8946a")); // plinth
};
/** hand pump */
const handPump = (b: Batch, x: number, z: number) => {
  const I = C("#3a4a5a");
  b.add(boxGeo(V(x - 0.5, 0, z - 0.5), V(x + 0.5, 0.12, z + 0.5)), lam("slab", () => ({ map: rep(stoneHD("pumpSt", ["#b8b0a0", "#a8a090", "#c4bcac", "#a09888"]), 1, 1) })));
  b.add(new THREE.CylinderGeometry(0.08, 0.1, 1.0, 10).translate(x, 0.62, z), I);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6).rotateZ(Math.PI / 2).translate(x + 0.18, 0.95, z + 0.05), I);
  b.add(beamBetween(V(x, 1.1, z), V(x - 0.7, 1.32, z), 0.025), I);
};
/** an electric pole with cross-arm; returns the wire anchor */
const pole = (b: Batch, x: number, z: number, h = 6.5) => {
  b.add(new THREE.CylinderGeometry(0.07, 0.1, h, 8).translate(x, h / 2, z), C("#6a6a66"));
  b.add(boxGeo(V(x - 0.6, h - 0.5, z - 0.04), V(x + 0.6, h - 0.42, z + 0.04)), C("#5a5a56"));
  return V(x, h - 0.46, z);
};
/** sagging wire */
const wire = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, sag = 0.5) => {
  const n = 10; let p = a.clone();
  for (let i = 1; i <= n; i++) { const u = i / n, q2 = V(a.x + (c.x - a.x) * u, a.y + (c.y - a.y) * u - sag * 4 * u * (1 - u), a.z + (c.z - a.z) * u); b.add(beamBetween(p, q2, 0.008, 3), C("#1e1e22")); p = q2; }
};
/** two-storey bazaar building with a shop at the bottom */
const shopBldg = (b: Batch, x: number, z: number, w: number, h: number, wall: string, sign: string, signBg: string, i: number, open = true) => {
  wbox(b, lam("shopw" + i, () => ({ map: shopTex("s" + i, wall) })), x - w / 2, 0, z - 3, x + w / 2, h, z, 3, 3);
  b.add(boxGeo(V(x - w / 2 + 0.2, 0, z), V(x + w / 2 - 0.2, 2.5, z + 0.04)), open ? C("#2a2420") : lam("shut", () => ({ map: rep(shutterTex(), 2, 1) })));
  b.add(boxGeo(V(x - w / 2 + 0.1, 2.6, z), V(x + w / 2 - 0.1, 3.2, z + 0.08)), lam("sign" + sign, () => ({ map: signHD(sign, signBg, "#fff6d8") })));
  b.add(boxGeo(V(x - w / 2, 3.3, z), V(x + w / 2, 3.42, z + 0.9)), C("#d8d0c0")); // balcony slab
  for (let xx = x - w / 2 + 0.1; xx <= x + w / 2; xx += 0.25) b.add(boxGeo(V(xx - 0.015, 3.42, z + 0.86), V(xx + 0.015, 4.3, z + 0.9)), C("#3a4a5a"));
  b.add(boxGeo(V(x - w / 2, 4.28, z + 0.84), V(x + w / 2, 4.34, z + 0.92)), C("#3a4a5a"));
  for (const sx of [-0.28, 0.28]) b.add(boxGeo(V(x + sx * w - 0.35, 3.7, z + 0.01), V(x + sx * w + 0.35, 4.6, z + 0.05)), C(["#3f6fb5", "#2f8a6a", "#8a3a3a"][i % 3]));
  if (open) for (let k = 0; k < 4; k++) b.add(boxGeo(V(x - w / 2 + 0.4 + k * (w - 0.8) / 4, 0.8 + 0.4 * (k % 2), z - 0.6), V(x - w / 2 + 0.7 + k * (w - 0.8) / 4, 1.3 + 0.4 * (k % 2), z - 0.3)), C(["#e8c21a", "#c0353a", "#3f7ab8", "#e07a1a"][k]));
  // tarpaulin awning
  b.add(quad(V(x - w / 2, 2.55, z), V(x + w / 2, 2.55, z), V(x + w / 2, 2.2, z + 1.2), V(x - w / 2, 2.2, z + 1.2)), lam("tarp" + (i % 3), () => ({ color: ["#2f6ab5", "#c0353a", "#e8a33a"][i % 3], side: THREE.DoubleSide })));
};
const sign = (b: Batch, txt0: string, bg: string, x: number, y: number, z: number, w: number, h: number) => b.add(boxGeo(V(x - w / 2, y, z), V(x + w / 2, y + h, z + 0.05)), lam("sg" + txt0, () => ({ map: signHD(txt0, bg, "#fff6d8") })));

const village = (s: SetBuild) => {
  const { b } = s;
  b.add(plane(-300, 300, -300, 60, 1), lam("vField", () => ({ map: rep(mustard(), 60, 60) })));
  b.add(plane(-14, 14, -12, 9, 1, 0.01), lam("vYard", () => ({ map: rep(earthHD("upEarth", ["#c8a478", "#b8946a", "#d2b088", "#a8906a"], "#7f9a46"), 5, 4) })));
  [[-6.2, -9.5, 4.6, 3.6, 3.0], [0.4, -10.2, 5.4, 3.8, 3.3], [6.6, -9.3, 4.2, 3.4, 2.9], [-12, -8.6, 4.2, 3.4, 2.9], [12.4, -8.8, 4.4, 3.4, 3.1]].forEach(([x, z, w, d, h], i) => mudHouse(b, x, z, w, d, h, i));
  neem(b, -3.4, -6.2, 7.5, 1); neem(b, 9.5, -14, 9, 4); neem(b, -16, -15, 8, 7);
  for (let k = -12; k <= 12; k++) neem(b, k * 9 + 3 * hh(k, 1), -42 - 8 * hh(k, 2), 8 + 4 * hh(k, 3), k * 3);
  handPump(b, 3.8, -5.2);
  charpai(b, -1.8, -4.4, 0.2);
  // cow-dung cakes on a wall-side stack, a clay pot line, a bicycle-less lean-to
  for (let k = 0; k < 14; k++) b.add(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10).rotateX(Math.PI / 2).translate(4.4 + 0.3 * (k % 7), 0.35 + 0.28 * Math.floor(k / 7), -7.55), C("#6a4a2a"));
  for (let k = 0; k < 4; k++) b.add(new THREE.SphereGeometry(0.2, 12, 8).scale(1, 0.85, 1).translate(-4.6 + 0.45 * k, 0.17, -7.4), C(["#b85a32", "#a84a2a"][k % 2]));
  // thatch lean-to
  for (const sx of [-1, 1]) b.add(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6).translate(-9 + sx * 1.2, 1.1, -5.4), C("#7a5a3a"));
  b.add(quad(V(-10.4, 2.2, -5.5), V(-7.6, 2.2, -5.5), V(-7.6, 2.6, -7.2), V(-10.4, 2.6, -7.2)), lam("thatch", () => ({ color: "#c8a85a", side: THREE.DoubleSide })));
  // lived-in dressing: tulsi planter, clothesline, haystack, bullock cart, chulha, brass pots, a broom, window shutters, niches
  b.add(boxGeo(V(-0.6, 0, -6.6), V(0.0, 0.8, -6.0)), lam("tulsiP", () => ({ map: mudWall("tp", "#e0c8a0") })));
  for (let k = 0; k < 7; k++) b.add(new THREE.IcosahedronGeometry(0.13, 0).translate(-0.3 + 0.12 * Math.cos(k * 2.4), 0.9 + 0.08 * k, -6.3 + 0.1 * Math.sin(k * 2.4)), C("#3f7a32"));
  const lp1 = V(-8.6, 1.9, -7.1), lp2 = V(-4.2, 1.9, -7.4);
  for (const p0 of [lp1, lp2]) b.add(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6).translate(p0.x, 0.95, p0.z), C("#7a5a3a"));
  wire(b, lp1, lp2, 0.25);
  ["#c0353a", "#e8a33a", "#2f8a6a", "#3f6fb5", "#f4f1ea", "#c94a7a"].forEach((col, k) => { const u = (k + 0.7) / 6.6, x = lp1.x + (lp2.x - lp1.x) * u, z = lp1.z + (lp2.z - lp1.z) * u, y = 1.9 - 0.25 * 4 * u * (1 - u); b.add(quad(V(x - 0.28, y - 0.75, z), V(x + 0.28, y - 0.75, z), V(x + 0.28, y, z), V(x - 0.28, y, z)), lam("cloth" + col, () => ({ color: col, side: THREE.DoubleSide }))); });
  b.add(new THREE.ConeGeometry(1.3, 2.4, 14).translate(8.8, 1.2, -5.6), lam("hay", () => ({ color: "#d8b45a" })));
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6).translate(8.8, 1.4, -5.6), C("#6a4a2a"));
  cart(b, -9.4, -3.0, 0.5);
  b.add(new THREE.CylinderGeometry(0.4, 0.45, 0.4, 14, 1, true).translate(-5.6, 0.2, -6.9), lam("chulha", () => ({ color: "#a8784a", side: THREE.DoubleSide })));
  for (let k = 0; k < 3; k++) b.add(new THREE.SphereGeometry(0.14, 12, 8).scale(1, 0.9, 1).translate(4.3 + 0.32 * k, 0.24, -4.6), lam("brass", () => ({ color: "#d8a83a" })));
  b.add(beamBetween(V(-2.9, 0, -7.9), V(-2.6, 1.3, -8.1), 0.025), C("#c8a85a"));
  [[-6.2, -7.68, 4.6], [0.4, -8.28, 5.4], [6.6, -7.58, 4.2]].forEach(([hx, hz, w], i) => {
    for (const sx of [-1, 1]) b.add(boxGeo(V(hx + sx * (w / 2 - 0.65) - 0.32, 1.05, hz + 0.02), V(hx + sx * (w / 2 - 0.65) + 0.32, 1.65, hz + 0.08)), C(["#3f6fb5", "#2f8a6a", "#8a3a3a"][i]));
    b.add(boxGeo(V(hx - w / 2 + 0.3, 2.3, hz + 0.02), V(hx - w / 2 + 0.6, 2.62, hz + 0.1)), C("#5a3a22"));            // niche
    b.add(new THREE.SphereGeometry(0.05, 8, 6).translate(hx - w / 2 + 0.45, 2.36, hz + 0.1), lam("diya", () => ({ color: "#ffd890", emissive: "#ffb040", emissiveIntensity: 1.6 })));
    for (let k = 0; k < 5; k++) b.add(new THREE.ConeGeometry(0.03, 0.14, 5).rotateX(Math.PI).translate(hx + w / 2 - 0.4 - 0.07 * k, 2.25 - 0.06 * (k % 2), hz + 0.08), C("#c0201a"));   // dried chillies
  });
  // low mud boundary wall + the tiny plot with ridges (shot 6/16)
  b.add(boxGeo(V(-14, 0, -7.0), V(-7.5, 0.7, -6.7)), lam("mud9", () => ({ map: mudWall("m9", "#c8a07a") })));
  b.add(plane(1.4, 5.4, -3.6, -0.4, 1, 0.02), lam("plot", () => ({ map: rep(earthHD("plotEarth", ["#8a6a44", "#7a5a3a", "#94744c", "#6e5034"], "#6a8a3a"), 2, 2) })));
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(1.5, 0, -3.4 + 0.55 * k), V(5.3, 0.1, -3.3 + 0.55 * k)), C("#7a5a3a"));
  for (const [x0, z0, x1, z1] of [[1.4, -3.6, 5.4, -3.6], [1.4, -0.4, 5.4, -0.4], [1.4, -3.6, 1.4, -0.4], [5.4, -3.6, 5.4, -0.4]]) b.add(beamBetween(V(x0, 0.45, z0), V(x1, 0.45, z1), 0.02, 4), C("#a8845a"));
  for (const [x, z] of [[1.4, -3.6], [5.4, -3.6], [1.4, -0.4], [5.4, -0.4]]) b.add(new THREE.CylinderGeometry(0.035, 0.04, 0.6, 6).translate(x, 0.3, z), C("#8a6a44"));
  for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) b.add(new THREE.ConeGeometry(0.07, 0.22, 5).translate(1.75 + 0.42 * k, 0.21, -3.35 + 0.55 * r), C(["#5e9a42", "#4f8a3a"][(r + k) % 2]));
};

const street = (s: SetBuild, rally: boolean) => {
  const { b } = s;
  b.add(plane(-300, 300, -300, 60, 1, -0.02), lam("stGround", () => ({ map: rep(earthHD("stEarth", ["#c8b090", "#b8a080", "#d2bc9c", "#a8987a"], "#8a9a5a"), 40, 40) })));
  b.add(plane(-30, 30, -5, 10, 1, 0.0), lam("dustRoad", () => ({ map: rep(dustRoad(), 6, 2) })));
  b.add(boxGeo(V(-30, 0, -6.0), V(30, 0.18, -5.0)), C("#9a948a")); // kerb / footpath
  const SH: [string, string, string][] = [["SHARMA TEA STALL", "#7a3a2a", "#e8c8a0"], ["AZAMGARH TAILORS", "#2f5a8a", "#b8d0e0"], ["POLICE STATION", "#8a2a2a", "#e8dcc8"], ["BOOK DEPOT", "#2f6a43", "#e8d8a8"], ["MEDICAL HALL", "#1e5a7a", "#f0c8c8"], ["KIRANA STORE", "#8a5a1a", "#d8e0b0"]];
  SH.forEach(([n, bg, wall], i) => shopBldg(b, -12.5 + 5 * i, -6, 4.8, 5.4 + 0.6 * (i % 2), wall, n, bg, i, n !== "POLICE STATION"));
  // the police station: veranda, flag post, red board
  b.add(boxGeo(V(-3.0, 0, -5.6), V(2.0, 0.3, -4.6)), C("#c8bca8"));
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 5.5, 6).translate(2.6, 2.75, -5.2), C("#d8d8d0"));
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(2.64, 4.7 - 0.2 * k, -5.2), V(3.6, 4.9 - 0.2 * k, -5.18)), C(["#e07a1a", "#f4f1ea", "#2f8a3a", "#2f8a3a"][Math.min(k, 2)]));
  // poles and tangled wires
  const ps = [-14, -7, 0, 7, 14].map((x) => pole(b, x, -4.6));
  for (let i = 0; i + 1 < ps.length; i++) for (let w = 0; w < 3; w++) wire(b, ps[i].clone().add(V(-0.5 + 0.5 * w, 0, 0)), ps[i + 1].clone().add(V(-0.5 + 0.5 * w, 0, 0)), 0.4 + 0.25 * w);
  for (let i = 0; i < ps.length; i++) wire(b, ps[i], V(-12 + 5 * i + 1.3, 4.4, -6.0), 0.3);
  cart(b, 9.5, -3.6, 0.3);
  // tea-stall bench and kettle stove
  b.add(boxGeo(V(-14.2, 0.42, -4.6), V(-12, 0.48, -4.2)), C("#7a4a28"));
  for (const x of [-14, -12.2]) b.add(boxGeo(V(x - 0.04, 0, -4.55), V(x + 0.04, 0.42, -4.25)), C("#5a3a22"));
  b.add(new THREE.CylinderGeometry(0.22, 0.26, 0.6, 12).translate(-10.8, 0.3, -4.8), C("#3a3a3a"));
  b.add(new THREE.SphereGeometry(0.14, 12, 8).translate(-10.8, 0.72, -4.8), C("#c9ccd2"));
  neem(b, 18, -9, 9, 2); neem(b, -19, -10, 8, 5);
  for (let k = -10; k <= 10; k++) b.add(boxGeo(V(k * 8 - 3, 0, -30 - 6 * hh(k, 1)), V(k * 8 + 3, 4 + 6 * hh(k, 2), -24 - 6 * hh(k, 1))), C(["#d8c8a8", "#c8b898", "#e0d0b0"][(k + 30) % 3]));
  if (rally) {
    // a small plank stage with bunting, loudspeaker horns on a bamboo pole, banners
    b.add(boxGeo(V(-1.6, 0, -2.8), V(1.6, 0.7, -1.2)), C("#8a5a34"));
    for (let k = 0; k < 6; k++) b.add(boxGeo(V(-1.6, 0.7, -2.8 + 0.27 * k), V(1.6, 0.72, -2.78 + 0.27 * k)), C("#6a4426"));
    b.add(quad(V(-1.6, 0.1, -1.19), V(1.6, 0.1, -1.19), V(1.6, 0.68, -1.19), V(-1.6, 0.68, -1.19)), lam("stageBan", () => ({ map: signHD("VOTE LAL BIHARI", "#e07a1a", "#fff6d8") })));
    for (const sx of [-1, 1]) b.add(new THREE.CylinderGeometry(0.04, 0.04, 3.6, 6).translate(sx * 1.6, 1.8, -2.8), C("#b8a060"));
    for (let k = 0; k < 6; k++) b.add(quad(V(-1.6 + 0.533 * k, 3.4, -2.79), V(-1.067 + 0.533 * k, 3.4, -2.79), V(-1.067 + 0.533 * k, 3.15 + 0.08 * Math.sin(k), -2.79), V(-1.6 + 0.533 * k, 3.15 + 0.08 * Math.sin(k), -2.79)), lam("bunt", () => ({ map: buntingTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })));
    for (const [hx, hy, ry] of [[-1.6, 3.6, 0.5], [1.6, 3.6, -0.5]]) b.add(new THREE.ConeGeometry(0.22, 0.5, 12, 1, true).rotateX(-Math.PI / 2).rotateY(ry).translate(hx, hy, -2.6), lam("horn", () => ({ color: "#d8d8d0", side: THREE.DoubleSide })));
    // the PM's rally far down the road: a huge stage and a sea of people (silhouettes)
    // the PM's rally far down the road (-x): a huge stage, a tall banner, a sea of people
    b.add(boxGeo(V(-80, 0, -8), V(-72, 2.4, 7)), C("#e8e0d0"));
    b.add(quad(V(-79.5, 2.4, 7), V(-79.5, 2.4, -8), V(-79.5, 10, -8), V(-79.5, 10, 7)), lam("bigBan", () => ({ map: signHD("MASS RALLY", "#2f8a3a", "#fff6d8"), side: THREE.DoubleSide })));
    for (const zz of [-8, 7]) b.add(new THREE.CylinderGeometry(0.15, 0.15, 11, 6).translate(-79.5, 5.5, zz), C("#d8d8d0"));
    for (let k = 0; k < 420; k++) { const x = -70 + 42 * hh(k, 1), z = -6 + 12 * hh(k, 2); b.add(new THREE.CapsuleGeometry(0.22, 0.7, 3, 6).translate(x, 0.65, z), C(["#f4f1ea", "#e07a1a", "#3f6fb5", "#c0353a", "#e8c21a", "#f4f1ea"][k % 6])); b.add(new THREE.SphereGeometry(0.17, 8, 6).translate(x, 1.42, z), C(k % 2 ? "#1d1410" : "#a86e46")); }
    for (let k = 0; k < 12; k++) { const x = -70 + 4 * k; b.add(new THREE.CylinderGeometry(0.03, 0.03, 4, 5).translate(x, 2, 6.5), C("#b8a060")); b.add(quad(V(x, 3.2, 6.5), V(x + 0.9, 3.2, 6.5), V(x + 0.9, 4, 6.5), V(x, 4, 6.5)), lam("flagS" + (k % 3), () => ({ color: ["#e07a1a", "#f4f1ea", "#2f8a3a"][k % 3], side: THREE.DoubleSide }))); }
  }
};

export const BUILD: Record<SetId, (s: SetBuild) => void> = {
  office: (s) => {
    const { b } = s;
    officeShell(s, "rev", "#bcd2b4", "#3c5a48", "#b8b0a0");
    barredWindow(b, 2.6, 1.0, -4.6, 1.6, 1.9);
    sign(b, "TEHSIL OFFICE  AZAMGARH", "#2f4a3a", -0.9, 3.25, -4.58, 3.6, 0.5);
    // the desk: green baize, files, stamp pad, brass bell
    const T = C("#5a3420");
    b.add(boxGeo(V(-1.15, 0.72, -2.55), V(1.15, 0.79, -1.55)), lam("baize", () => ({ color: "#2f5a3a" })));
    b.add(boxGeo(V(-1.12, 0.0, -2.52), V(-0.6, 0.72, -1.6)), T); b.add(boxGeo(V(0.6, 0.0, -2.52), V(1.12, 0.72, -1.6)), T);
    b.add(boxGeo(V(-0.6, 0.45, -2.52), V(0.6, 0.72, -2.45)), T);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(0.62, 0.12 + 0.2 * k, -1.59), V(1.1, 0.28 + 0.2 * k, -1.56)), C("#6a4026"));
    fileStack(b, -0.75, -2.25, 9, 11); fileStack(b, -0.3, -2.35, 5, 23); fileStack(b, 0.85, -2.3, 7, 31);
    b.add(boxGeo(V(-0.95, 0.79, -1.85), V(-0.75, 0.81, -1.7)), C("#3a2a4a")); // ink pad
    b.add(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0.75, 0.79, -1.8), C("#d8b84a"));
    b.add(boxGeo(V(-0.3, 0.79, -2.1), V(0.35, 0.8, -1.95)), C("#f4efe2"));
    b.add(new THREE.CylinderGeometry(0.035, 0.028, 0.09, 12).translate(0.62, 0.835, -1.95), lam("chai", () => ({ color: "#c8843a" })));
    b.add(new THREE.CylinderGeometry(0.008, 0.008, 0.15, 6).rotateZ(Math.PI / 2).rotateY(0.6).translate(-0.28, 0.8, -1.75), C("#1e3a8a"));
    b.add(boxGeo(V(0.45, 0.79, -2.3), V(0.62, 0.83, -2.22)), C("#3a2a1a"));
    // official's chair (high back)
    b.add(boxGeo(V(-0.32, 0.45, -3.2), V(0.32, 0.5, -2.7)), T); b.add(boxGeo(V(-0.32, 0.5, -3.22), V(0.32, 1.45, -3.16)), C("#4a2a18"));
    // walls of files along the back and sides, almirahs, a visitors' bench
    for (let k = 0; k < 7; k++) fileStack(b, -4.6 + 0.48 * k, -4.25, 10 + Math.floor(12 * hh(k, 4)), 40 + k * 13);
    for (let k = 0; k < 5; k++) fileStack(b, -4.7, -3.4 + 0.45 * k, 6 + Math.floor(10 * hh(k, 5)), 90 + k * 7, 0.3, 0.42);
    almirah(b, 4.4, -4.2); almirah(b, 3.35, -4.2, 1.8);
    b.add(boxGeo(V(-3.6, 0.42, -0.8), V(-1.8, 0.48, -0.4)), C("#6a4026")); for (const x of [-3.5, -1.9]) b.add(boxGeo(V(x - 0.04, 0, -0.75), V(x + 0.04, 0.42, -0.45)), C("#4a2a18"));
    // wall calendar (1976 / 1994 swapped by shot in POSE), clock, a notice board
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), lam("wallcal1976", () => ({ map: calTex("1976") })));
    cal.position.set(-2.4, 2.1, -4.58); s.root.add(cal); s.dyn.cal = cal;
    b.add(new THREE.CircleGeometry(0.26, 24).translate(0.9, 2.55, -4.58), lam("clock", () => ({ map: clockTex() })));
    b.add(boxGeo(V(1.0, 1.3, -4.6), V(1.9, 1.95, -4.57)), C("#8a6a44")); for (let k = 0; k < 5; k++) b.add(boxGeo(V(1.06 + 0.17 * k, 1.38 + 0.12 * (k % 2), -4.57), V(1.2 + 0.17 * k, 1.85 - 0.1 * (k % 3), -4.56)), C(["#f4efe2", "#f2e6b8", "#e8f0f4"][k % 3]));
    fan(s, 0, 3.5, -1.6, "fan"); fan(s, -2.8, 3.5, 1.2, "fan2");
    pottedPalm(b, 4.6, -0.6, 1.3);
    // spittoon-free corner: a water pot (matka) on a stand with a steel tumbler
    b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12).translate(-4.5, 0.25, 0.8), C("#5a3a22"));
    b.add(new THREE.SphereGeometry(0.28, 14, 10).scale(1, 0.9, 1).translate(-4.5, 0.74, 0.8), C("#b05a32"));
    b.add(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10).translate(-4.2, 0.56, 0.8), C("#c9ccd2"));
  },
  bank: (s) => {
    const { b } = s;
    officeShell(s, "bank", "#e8dcc0", "#6a4426", "#c8bca8", 4.2);
    sign(b, "AZAMGARH CO-OPERATIVE BANK", "#1e3a6a", 0, 3.4, -4.58, 4.6, 0.5);
    // counter with a brass grille and a window
    const Tk = C("#6a4026"), Br = C("#c9a24a");
    b.add(boxGeo(V(-4.0, 0, -1.95), V(4.0, 1.05, -1.6)), lam("counterW", () => ({ color: "#7a4a28" })));
    b.add(boxGeo(V(-4.05, 1.05, -2.0), V(4.05, 1.1, -1.55)), C("#4a2a18"));
    for (let x = -4.0; x <= 4.0; x += 0.1) if (Math.abs(x + 0.05) > 0.45) b.add(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 5).translate(x, 1.6, -1.78), Br);
    b.add(boxGeo(V(-4.0, 2.1, -1.82), V(4.0, 2.16, -1.74)), Br);
    b.add(boxGeo(V(-0.6, 2.16, -1.8), V(0.5, 2.46, -1.76)), lam("sgLOANS", () => ({ map: signHD("LOANS", "#7a1e1e", "#fff6d8") })));
    // ledgers, cash box, behind-counter shelves of files
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(-1.6 + 0.12 * k, 1.1, -1.95), V(-1.5 + 0.12 * k, 1.42, -1.7)), C(["#7a1e1e", "#1e3a5a", "#7a1e1e", "#2f4a2a"][k]));
    b.add(boxGeo(V(0.9, 1.1, -1.95), V(1.4, 1.3, -1.7)), C("#3a4a3a"));
    for (let k = 0; k < 6; k++) fileStack(b, -3.6 + 1.3 * k, -4.25, 8 + Math.floor(10 * hh(k, 8)), 200 + k * 11);
    almirah(b, 3.9, -3.6);
    b.add(new THREE.CircleGeometry(0.3, 24).translate(-2.6, 2.7, -4.58), lam("clock", () => ({ map: clockTex() })));
    barredWindow(b, -3.0, 1.1, -4.6, 1.2, 1.6);
    fan(s, 0, 3.8, -0.4, "fan"); fan(s, 0, 3.8, -3.2, "fan2");
    // a waiting bench in front of the counter
    b.add(boxGeo(V(2.0, 0.42, -0.9), V(3.8, 0.48, -0.5)), C("#6a4026"));
    for (const x of [2.1, 3.7]) b.add(boxGeo(V(x - 0.04, 0, -0.85), V(x + 0.04, 0.42, -0.55)), C("#4a2a18"));
  },
  village: (s) => village(s),
  street: (s) => street(s, false),
  rally: (s) => street(s, true),
};

// ---------------- dynamic ----------------
export const POSE: Partial<Record<SetId, (s: SetBuild, t: number, id: number) => void>> = {
  office: (s, t, id) => {
    s.dyn.fan.rotation.y = t * 3.2; s.dyn.fan2.rotation.y = t * 3.0 + 1;
    const cal = s.dyn.cal as THREE.Mesh, y = id >= 15 ? "1994" : "1976";
    cal.material = lam("wallcal" + y, () => ({ map: calTex(y) }));
  },
  bank: (s, t) => { s.dyn.fan.rotation.y = t * 3.2; s.dyn.fan2.rotation.y = t * 3.0 + 1; },
};

// ---------------- staging ----------------
type StageFn = (c: Ctx) => void;
const LAL = (c: Ctx, x: number, z: number, fo: FrontOpts & Act, y = 0, scale = 1) => pose(c, 1, LB, "lb", x, z, fo, scale, y);
const UNC = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 2, UNCLE, "uncle", x, z, fo);
const OFF = (c: Ctx, x: number, z: number, fo: FrontOpts & Act) => pose(c, 3, OFFICIAL, "official", x, z, fo);
/** desk-top camera windows (cams.ts deskTop setups), in seconds */
const deskCam = (id: number, t: number) => id === 1 ? t < A(0, "1976,") + 0.27 || t >= A(0, "a") - 0.07 : id === 15 ? t >= A(12, "finally") - 0.07 && t < A(12, "alive.") + 0.4 : id === 18 ? t >= A(15, "can") - 0.07 : false;
/** the desk-top document + stamp rig: stamp hovers at h(t) above the paper; impact at tImp (anticipation lift before) */
const DOC: V3 = [0.15, 0.802, -1.78];
const stampH = (t: number, tImp: number, hover = 0.34) => {
  const u = t - tImp + LEAD;
  if (u < -0.5) return hover;
  if (u < -0.12) return hover + 0.12 * smooth((u + 0.5) / 0.38);       // anticipation: lift
  if (u < 0) return (hover + 0.12) * (-u / 0.12) ** 2;                        // slam
  if (u < 0.25) return 0.012 * Math.sin(Math.PI * u / 0.25);                 // settle bounce
  if (u < 0.6) return 0;
  return Math.min(hover, 0.5 * (u - 0.6));                                    // lift away
};
const deskDoc = (c: Ctx, tImp: number, draw: (k: number) => (p: Pen) => void, key: string, showStamp = true, hover = 0.34) => {
  const k = after(c.t, tImp) ? clamp01((c.t - tImp + LEAD) / 0.1) : 0;
  card(c, `${key}${q(k, 6)}`, 520, 380, draw(q(k, 6)), DOC, 0.52, 0.38, { flat: true, rot: 0.06 });
  if (showStamp) { const h = stampH(c.t, tImp, hover); card(c, "stamp", 200, 300, fxStamp, [DOC[0] + 0.12, DOC[1] + 0.13 + h, DOC[2] + 0.02], 0.17, 0.255); }
  if (k > 0) puff(c, tImp, [DOC[0] + 0.12, DOC[1] + 0.05, DOC[2] + 0.05], 0.3, 0.35);
};
/** years ticking 1976 -> 1994 on a flipping calendar */
const yearFlip = (c: Ctx, t0: number, t1: number, p: V3, s = 0.5) => {
  if (c.t < t0 - LEAD) return;
  const y = 1976 + Math.min(18, Math.floor(18 * clamp01((c.t - t0) / (t1 - t0))));
  card(c, `cal${y}`, 300, 340, (pen) => fxCal(pen, String(y), y === 1994), p, s * pop(c.t, t0), 1.13 * s * pop(c.t, t0), { rot: 0.04 });
};
const hens = (c: Ctx, xs: [number, number][]) => xs.forEach(([x, z], k) => { const ph = q((c.t * 0.6 + hh(k, 3)) % 1, 8); beast(c, `hen${k}${ph}`, (p) => henSide(p, { mode: ph < 0.5 ? "peck" : "walk", phase: ph }), x, z, 0.32, k % 2 === 1); });
const cow = (c: Ctx, x: number, z: number, mirror = false) => { const ph = q((c.t * 0.25) % 1, 6); beast(c, `cow${ph}`, (p) => cowSide(p, { mode: "graze", phase: ph, spots: 0 }), x, z, 0.95, mirror); };

export const STAGE: Record<number, StageFn> = {
  // 1 In 1976, the Indian government declared a man dead.
  1: (c) => {
    const t = c.t;
    deskDoc(c, A(0, "dead."), (k) => certDraw(k), "cert");
    if (!deskCam(1, t)) OFF(c, 0.0, -2.75, { mode: "stand", expr: after(t, A(0, "declared")) ? "stern" : "neutral", look: 0.3, prop: after(t, A(0, "declared")) && !after(t, A(0, "dead.") + 0.5) ? "stamp" : null, lean: jolt(t, A(0, "dead."), 0.05) });
    if (after(t, A(0, "1976,"))) stay(c, A(0, "1976,"), "cal1976", 300, 340, (p) => fxCal(p, "1976", true), [-1.35, 1.75, -2.6], 0.5, 0.56, 0.05);
  },
  // 2 He spent the next 18 years trying to prove he was alive.
  2: (c) => {
    const t = c.t, al = after(t, A(0, "alive."));
    LAL(c, -0.25, -1.9, { mode: "stand", expr: al ? "shock" : "nervous", look: 0.6, prop: "handsUp", dy: hop(t, A(0, "prove"), 0.1, 0.3) + hop(t, A(0, "alive."), 0.14, 0.32) });
    // an official walks past reading a file, ignoring him
    const wx = -2.6 + 4.6 * ramp(t, A(0, "spent"), 3.2);
    OFF(c, wx, -3.1, { mode: wx > -2.5 && wx < 1.9 ? "stroll" : "stand", phase: (t * 1.1) % 1, expr: "neutral", look: 1, prop: "book" });
    yearFlip(c, A(0, "next"), A(0, "trying") + 0.8, [0.42, 2.45, -1.9], 0.44);
    if (al) sayB(c, A(0, "alive."), "I'M ALIVE!", [-0.4, 2.55, -1.8], 0.95, 1.4);
    hens(c, [[1.6, -3.0], [2.1, -2.6]]);
  },
  // 3 Lal Bihari was 20, standing in a bank in Azamgarh, asking for a small loan.
  3: (c) => {
    const t = c.t;
    LAL(c, -0.45, -1.15, { mode: "stand", expr: after(t, A(1, "asking")) ? "smile" : "neutral", look: 0.5, prop: after(t, A(1, "loan.")) ? "leaflet" : null, dy: hop(t, A(1, "loan."), 0.05, 0.25) });
    pose(c, 4, CLERK, "clerk", 0.5, -2.35, { mode: "stand", expr: "neutral", look: -0.4 });
    banner(c, A(1, "lal"), "LAL BIHARI, AGE 20", [-0.3, 2.65, -1.3], 1.5, "#2f4a8a", 2.4);
    banner(c, A(1, "azamgarh,"), "AZAMGARH, U.P.", [0.2, 2.65, -1.3], 1.3, "#2f6a43", 1.8);
    if (after(t, A(1, "small"))) sayB(c, A(1, "small"), "A SMALL LOAN?", [-0.75, 2.2, -1.0], 0.8, 1.2);
  },
  // 4 The clerk checked the records and said, "Sorry... you're dead."
  4: (c) => {
    const t = c.t, dd = after(t, A(2, "dead."));
    LAL(c, -0.45, -1.15, { mode: "stand", expr: dd ? "shock" : "smile", look: 0.5, lean: jolt(t, A(2, "dead."), -0.1), dy: hop(t, A(2, "dead."), 0.06, 0.2) });
    pose(c, 4, CLERK, "clerk", 0.5, -2.35, { mode: "stand", expr: after(t, A(2, "sorry,")) ? "sad" : "neutral", look: -0.6, prop: after(t, A(2, "checked")) && !after(t, A(2, "sorry,")) ? "book" : null });
    if (after(t, A(2, "sorry,"))) sayB(c, A(2, "sorry,"), "SORRY...", [0.55, 2.55, -2.0], 0.85, 1.0);
    if (dd) { sayB(c, A(2, "you're"), "YOU'RE DEAD.", [0.05, 2.3, -1.9], 0.9, 1.4); word(c, A(2, "dead.") + 0.2, "DEAD?!", [-0.55, 1.9, -0.9], 0.6, 1.0); }
  },
  // 5 His uncle had bribed an official 300 rupees to kill him -- on paper --
  5: (c) => {
    const t = c.t, br = after(t, A(3, "bribed")), kl = after(t, A(3, "kill"));
    UNC(c, -0.55, -1.25, { mode: "stand", expr: kl ? "grin" : "smug", look: 0.7, prop: br && !after(t, A(3, "300")) ? "bills" : null });
    OFF(c, 0.35, -2.75, { mode: "stand", expr: br ? "smug" : "neutral", look: -0.5, prop: kl && !after(t, A(3, "paper,") + 0.3) ? "stamp" : br ? "bills" : null, lean: jolt(t, A(3, "kill"), 0.06) });
    if (after(t, A(3, "300"))) { stay(c, A(3, "300"), "rupees", 400, 240, fxRupees, [0.0, 0.98, -1.9], 0.5, 0.3, -0.05); banner(c, A(3, "300"), "₹300 BRIBE", [0, 2.6, -1.6], 1.3, "#c0353a", 1.6); }
    if (kl) { const k = clamp01((t - A(3, "kill") + LEAD) / 0.1); card(c, `cert5${q(k, 6)}`, 520, 380, certDraw(q(k, 6)), [0.1, 2.0, -1.2], 0.7, 0.51, { rot: 0.04 }); }
    if (after(t, A(3, "on"))) word(c, A(3, "on"), "ON PAPER", [0.45, 2.45, -1.4], 0.8, 0.9);
  },
  // 6 just to grab his land. Less than one acre.
  6: (c) => {
    const t = c.t, ls = after(t, A(3, "less"));
    UNC(c, 3.4, -1.9, { mode: "stand", expr: "grin", look: -0.3, prop: "salute", dy: hop(t, A(3, "grab"), 0.08, 0.3) });
    if (ls) banner(c, A(3, "less"), "LESS THAN 1 ACRE", [3.4, 2.6, -1.4], 1.5, "#8a5a1a", 2.0);
    if (after(t, A(3, "grab"))) word(c, A(3, "grab"), "MINE!", [2.7, 2.3, -1.6], 0.7, 0.9);
    hens(c, [[1.2, -4.4], [0.6, -4.9]]); cow(c, -2.6, -6.0, true);
  },
  // 7 Heh, so Lal Bihari got creative.
  7: (c) => {
    const t = c.t, cr = after(t, A(4, "creative."));
    LAL(c, 0, -1.9, { mode: "stand", expr: cr ? "smug" : "pained", look: 0, headTilt: cr ? 0 : 6, dy: hop(t, A(4, "creative."), 0.06, 0.25) });
    if (cr) { stay(c, A(4, "creative."), "idea", 300, 320, fxIdea, [0.3, 2.5, -1.85], 0.4, 0.43); }
    cow(c, -2.4, -4.8);
  },
  // 8 He changed his name to Lal Bihari Mritak. Lal Bihari, the Dead.
  8: (c) => {
    const t = c.t, mr = after(t, A(5, "mritak,")), dd = after(t, A(5, "dead."));
    LAL(c, 1.05, -7.3, { mode: "stand", expr: mr ? "smug" : "grin", look: -0.6, prop: "point" });
    card(c, `nb${mr ? 1 : 0}`, 700, 260, fxNameBoard("LAL BIHARI", mr ? "\"MRITAK\"" : ""), [0.4, 2.42, -8.22], 1.5, 0.56, { yaw: 0 });
    if (dd) banner(c, A(5, "dead."), "MRITAK = \"THE DEAD\"", [0.6, 3.15, -7.0], 1.5, "#3a2a4a", 1.6);
  },
  // 9 He signed his letters "the late Lal Bihari."
  9: (c) => {
    const t = c.t, lt = after(t, A(6, "late"));
    LAL(c, -1.8, -4.4, { mode: "sit", expr: lt ? "smug" : "neutral", look: 0.3, prop: "quill" }, 0.42);
    const k = lt ? clamp01((t - A(6, "late") + LEAD) / 0.5) : 0;
    card(c, `late${q(k, 8)}`, 520, 640, fxLateLetter(q(k, 8)), [-1.15, 0.53, -4.25], 0.4, 0.49, { flat: true, rot: 0.25 });
  },
  // 10 He held his own funeral.
  10: (c) => {
    const t = c.t, fu = after(t, A(7, "funeral."));
    LAL(c, -1.8, -4.4, { mode: "sit", expr: fu ? "grin" : "innocent", look: 0.5, prop: fu ? "salute" : null }, 0.42);
    card(c, "garland", 500, 400, fxGarland, [-1.8, 1.0, -4.3], 0.42, 0.34);
    [[-3.2, -4.6], [-0.4, -4.8], [-2.6, -5.6], [-1.0, -5.7], [0.4, -3.9]].forEach(([x, z], k) => pose(c, 10 + k, MOURNER(k), `mourn${k}`, x, z, { mode: "stand", expr: fu ? "shock" : "sad", look: x < -1.8 ? 1 : -1, lean: jolt(t, A(7, "funeral."), 0.05) }));
    for (let k = 0; k < 10; k++) stay(c, A(7, "held") + 0.05 * k, `petal${k}`, 60, 60, (p) => p.ell(30, 30, 22, 22, k % 2 ? "#f2a01a" : "#e87a12", 5), [-2.6 + 0.18 * k, 0.03, -3.8 + 0.1 * (k % 3)], 0.07, 0.07);
  },
  // 11 His wife applied for a widow's pension... while he stood right next to her.
  11: (c) => {
    const t = c.t, st = after(t, A(8, "stood")), rj = A(8, "her.");
    pose(c, 5, WIFE, "wife", -0.35, -1.35, { mode: "stand", expr: "innocent", look: 0.4, prop: "leaflet" });
    LAL(c, -1.05, -1.25, { mode: "stand", expr: st ? "grin" : "neutral", look: 0.3, prop: st ? "salute" : null, dy: hop(t, A(8, "right"), 0.06, 0.25) });
    OFF(c, 0.55, -2.75, { mode: "stand", expr: after(t, rj) ? "stern" : "neutral", look: -0.6, prop: after(t, A(8, "pension,")) && !after(t, rj + 0.6) ? "stamp" : null, lean: jolt(t, rj, 0.05) });
    const k = after(t, rj) ? clamp01((t - rj + LEAD) / 0.1) : 0;
    if (after(t, A(8, "widow's"))) card(c, `pens${q(k, 6)}`, 520, 640, fxPension(q(k, 6)), [0.25, 1.9, -1.5], 0.55, 0.68, { rot: 0.05 });
    if (st) word(c, A(8, "next"), "HI!", [-1.2, 2.25, -1.1], 0.5, 0.9);
  },
  // 12 He insulted policemen, hoping to get arrested -- because an arrest is proof you exist.
  12: (c) => {
    const t = c.t, ins = after(t, A(9, "insulted"));
    LAL(c, -0.6, -2.4, { mode: "stand", expr: ins ? "laugh" : "grin", look: 0.8, prop: ins ? "point" : null, dy: hop(t, A(9, "insulted"), 0.08, 0.25) + hop(t, A(9, "arrested,"), 0.08, 0.25) });
    [0, 1].forEach((k) => pose(c, 20 + k, COP(k), `cop${k}`, 0.4 + 0.75 * k, -3.6 - 0.2 * k, { mode: "stand", expr: after(t, A(9, "hoping")) ? (k ? "dazed" : "neutral") : "neutral", look: -0.6, prop: k === 0 && after(t, A(9, "because")) ? "shrug" : null }));
    if (ins) sayB(c, A(9, "insulted"), "#@%&!!", [-0.5, 2.55, -2.2], 0.85, 1.2);
    if (after(t, A(9, "arrested,"))) sayB(c, A(9, "arrested,"), "ARREST ME!", [-0.6, 2.55, -2.2], 0.9, 1.0);
    if (after(t, A(9, "proof"))) banner(c, A(9, "proof"), "ARREST = PROOF YOU EXIST", [0, 2.75, -2.4], 1.7, "#2f4a8a", 1.8);
  },
  // 13 Nothing worked.
  13: (c) => {
    const t = c.t;
    LAL(c, -1.1, -4.95, { mode: "sit", expr: "sad", look: 0.4 }, 0.18);
    const wx = 0.6 + 2.6 * ramp(t, A(10, "nothing"), 1.6);
    [0, 1].forEach((k) => pose(c, 20 + k, COP(k), `cop${k}`, wx + 0.7 * k, -3.6 - 0.2 * k, { mode: "stroll", phase: (t * 1.1 + 0.5 * k) % 1, expr: "neutral", look: 1 }));
  },
  // 14 So he ran for Parliament -- against Prime Minister Rajiv Gandhi. A dead man.
  14: (c) => {
    const t = c.t, ag = after(t, A(11, "against")), dm = after(t, A(11, "dead"));
    LAL(c, 0, -2.0, { mode: "stand", expr: dm ? "grin" : "laugh", look: 0.3, prop: "point" }, 0.72);
    card(c, "mega", 300, 200, fxMegaphone, [0.38, 2.05, -1.9], 0.3, 0.2);
    card(c, "poster", 520, 700, fxPoster, [-2.6, 1.9, -5.6], 0.9, 1.21, { yaw: 0 });
    card(c, "poster2", 520, 700, fxPoster, [2.4, 1.9, -5.6], 0.9, 1.21, { yaw: 0 });
    [[-1.5, -0.6], [1.4, -0.5], [0.95, 0.5]].forEach(([x, z], k) => pose(c, 30 + k, VILL(k), `fan${k}`, x, z, { mode: "stand", expr: dm ? "dazed" : "smile", look: x < 0 ? 1 : -1, prop: !dm && k === 1 ? "salute" : null }));
    if (ag) banner(c, A(11, "against"), "VS. THE PRIME MINISTER", [-40, 7.0, -0.5], 9, "#2f8a3a", 2.4);
    if (dm) word(c, A(11, "dead"), "A DEAD MAN", [0.1, 2.75, -1.7], 0.9, 1.0);
  },
  // 15 In 1994, the government finally admitted it. He's alive.
  15: (c) => {
    const t = c.t, al = A(12, "alive.");
    const k = after(t, al) ? clamp01((t - al + LEAD) / 0.1) : 0;
    card(c, `alive${q(k, 6)}`, 520, 380, aliveDraw(q(k, 6)), DOC, 0.52, 0.38, { flat: true, rot: 0.06 });
    const h = stampH(t, al); card(c, "stamp", 200, 300, fxStamp, [DOC[0] - 0.03, DOC[1] + 0.13 + h, DOC[2] + 0.02], 0.17, 0.255);
    if (k > 0) puff(c, al, [DOC[0], DOC[1] + 0.05, DOC[2] + 0.05], 0.3, 0.35);
    if (!deskCam(15, t)) OFF(c, 0.0, -2.75, { mode: "stand", expr: after(t, A(12, "admitted")) ? "sad" : "neutral", look: 0.3, prop: after(t, A(12, "admitted")) ? "stamp" : null });
    LAL(c, -0.95, -1.35, { mode: "stand", expr: after(t, al) ? "laugh" : "nervous", look: 0.5, prop: after(t, al) ? "handsUp" : null, dy: hop(t, al, 0.16, 0.34) });
    if (after(t, A(12, "1994,"))) stay(c, A(12, "1994,"), "cal1994", 300, 340, (p) => fxCal(p, "1994", true), [1.05, 1.95, -2.4], 0.42, 0.47, -0.05);
    if (after(t, al)) { confetti(c, al, [-0.4, 2.2, -1.6], 2.2); word(c, al, "ALIVE!", [-0.9, 2.55, -1.3], 0.75, 1.3, "#b8f0a0"); }
  },
  // 16 And the land he fought 18 years for? He let his uncle keep farming it.
  16: (c) => {
    const t = c.t, lt = after(t, A(13, "let"));
    LAL(c, 0.7, -0.6, { mode: "stand", expr: lt ? "smile_closed" : "neutral", look: 0.8, prop: lt ? "shrug" : null });
    const ph = q((t * 0.8) % 1, 8), dig = Math.sin(ph * Math.PI * 2);
    UNC(c, 3.4, -2.2, { mode: "stand", expr: "grin", look: -0.4, lean: 0.06 * dig });
    card(c, `hoe${ph}`, 160, 600, fxHoe, [3.15, 0.75 + 0.12 * dig, -2.0], 0.22, 0.85, { rot: 0.5 + 0.25 * dig });
    hens(c, [[-1.0, -3.4], [-1.6, -3.9], [-0.5, -4.2]]); cow(c, -3.2, -6.5);
    if (after(t, A(13, "18"))) stay(c, A(13, "18"), "y18", 300, 340, (p) => fxCal(p, "18 YRS", true), [-0.35, 2.25, -1.4], 0.42, 0.47, -0.04);
  },
  // 17 Send this to the friend who says paperwork doesn't matter...
  17: (c) => {
    const t = c.t;
    LAL(c, -0.2, -1.2, { mode: "stand", expr: "smug", look: 0, prop: after(t, A(14, "friend")) ? "point" : "leaflet" });
    banner(c, A(14, "send"), "SEND THIS TO THAT FRIEND", [-0.1, 2.7, -1.2], 1.55, "#e07a1a", 2.4);
    if (after(t, A(14, "paperwork"))) sayB(c, A(14, "paperwork"), "\"PAPERWORK DOESN'T MATTER\"", [-0.35, 2.2, -1.0], 0.95, 1.5);
  },
  // 18 ...because one piece of paper can kill a man. (stamp hovers: loops into shot 1)
  18: (c) => {
    const t = c.t, a0 = A(15, "because");
    const u = clamp01((t - a0) / 1.1), fy = DOC[1] + 0.9 * (1 - u) ** 2;
    card(c, `cert${0}`, 520, 380, certDraw(0), [DOC[0] + 0.3 * (1 - u) * Math.sin(u * 5), u >= 1 ? DOC[1] : fy, DOC[2]], 0.52, 0.38, u >= 1 ? { flat: true, rot: 0.06 } : { rot: 0.4 * (1 - u) * Math.sin(u * 7) });
    const h = 0.34 + 0.9 * (1 - ramp(t, A(15, "kill"), 0.9));
    card(c, "stamp", 200, 300, fxStamp, [DOC[0] + 0.12, DOC[1] + 0.13 + h, DOC[2] + 0.02], 0.17, 0.255);
    if (!deskCam(18, t)) OFF(c, 0.0, -2.75, { mode: "stand", expr: "stern", look: 0.3, prop: after(t, A(15, "kill")) ? "stamp" : null });
  },
};
