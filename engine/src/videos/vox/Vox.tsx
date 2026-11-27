// "The Baker Who Survived the Titanic", Vox-style edition (2026-11-17): the same voice, cues, captions and sound as
// the 3D cut; the picture is a 2.5D paper collage. Direction sheet:
//  look   cream/navy duotone engravings on textured paper, one yellow highlighter + one red marker accent
//  depth  every scene is 3-6 layers at real depths; the camera dollies / pans through them (parallax) with focus blur
//  life   pop-ins with overshoot, idle bob on twos, drawn-on marker strokes, dust in the air, waves that never stop
//  moment one key move per shot, on its word (A(line, word))
//  avoid  flat static slides, faces filling the frame, fake "real photos" (illustrations only), film stills, music
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TOTAL, SHOTS, FPS, at, atN, shotAt } from "../baker/story";
import { Captions } from "../baker/captions";
import { transAt, IMPACT, MOOD } from "../baker/edit";
import { Stage, Layer, Plate, Cut, Tape, Hi, Stroke, ring, Grain, Dust, Cam, pop, alive, TW, glide, easeOut, smooth, clamp01, hh,
  INK, RED, YEL, SERIF, SANS, H, W } from "./kit";
import { Chef, Loaf, Thermo, Clock, Elevator, Feet, Clapper, Stamp, Sticky, Waves, DeckChair } from "./icons";
import { AtlanticMap } from "./map";

export const VOX_FRAMES = TOTAL;
const A = (l: number, w: string, n = 0) => (n ? atN(l, w, n) : at(l, w));
const T0 = (id: number) => SHOTS[id - 1].a / FPS, T1 = (id: number) => SHOTS[id - 1].b / FPS;
/** camera keyframe lerp over the shot (glide) */
const camLerp = (id: number, t: number, a: Cam, b: Cam, ease = glide): Cam => {
  const u = ease((t - T0(id)) / Math.max(0.5, T1(id) - T0(id)));
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, roll: a.roll + (b.roll - a.roll) * u, focus: b.focus ?? a.focus };
};
type Scene = { cam: Cam; bg: string; tint?: string; body: React.ReactNode };
const at0 = (t: number, c: number) => t >= c - 2 / FPS;

// ---------------- the hook (shot 1, and the tail of shot 22 for the loop) ----------------
const HOOK_CAM: Cam = { x: 40, y: 0, z: 40, roll: -1.6 };
const hookBody = (ht: number, extra?: React.ReactNode) => {
  const panic = (k: number) => 9 * Math.sin(TW(ht) * 21 + k);
  return (<>
    <Layer z={-1000} y={-150} rot={-2}><Plate src="deck_n.jpg" w={1300} h={1950} tape={false} /></Layer>
    <Layer z={-420} x={-170 + panic(1)} y={380 + alive(ht, 2).dy} rot={-4 + alive(ht, 2).rot}><Plate src="crowd_n.jpg" w={900} h={520} /></Layer>
    <Layer z={0} x={170} y={-170 + alive(ht, 5, 0.6).dy} rot={3.5 + alive(ht, 5, 0.6).rot}><Plate src="baker_d.jpg" w={560} h={700} /></Layer>
    <Layer z={140} x={-40} y={-760} rot={-3}><Tape text="APRIL 15, 1912 · NORTH ATLANTIC" size={40} /></Layer>
    {extra}
  </>);
};

// ---------------- scenes ----------------
const SCENES: Record<number, (t: number, f: number) => Scene> = {
  // 1 The Titanic is sinking. Everyone is panicking.
  1: (t) => ({ cam: HOOK_CAM, bg: "paperN.jpg", body: hookBody(t, at0(t, A(0, "panicking.")) && (
    <Layer z={60} x={-260} y={160}><Stroke d="M0 0 C60 60 120 90 230 110 M200 70 L232 110 L186 132" w={240} h={140} t={t} t0={A(0, "panicking.")} col={RED} sw={11} /></Layer>)) }),
  // 2 And the chief baker? He's pouring himself a drink.
  2: (t) => ({ cam: camLerp(2, t, HOOK_CAM, { x: 170, y: -120, z: 520, roll: -0.6 }), bg: "paperN.jpg", body: hookBody(t, <>
    {at0(t, A(0, "baker?")) && <Layer z={180} x={160} y={-560} rot={-4} s={pop(t, A(0, "baker?"))}><Tape text="CHIEF BAKER" size={56} /></Layer>}
    {at0(t, A(0, "drink.")) && <Layer z={10} x={28} y={60}><Stroke d={ring(170, 190, 2)} w={170} h={190} t={t} t0={A(0, "drink.") - 0.1} col={RED} sw={9} len={700} /></Layer>}
  </>) }),
  // 3 Meet Charles Joughin.
  3: (t) => ({ cam: { x: 170, y: -40, z: 330 + 40 * smooth((t - T0(3)) / 1.5), roll: 0.6 }, bg: "paperN.jpg", body: hookBody(t, <>
    {at0(t, A(0, "meet")) && <Layer z={60} x={150} y={230} rot={-2} s={pop(t, A(0, "meet"))}>
      <div style={{ whiteSpace: "nowrap", background: "#fbf7ee", padding: "26px 40px", boxShadow: "0 20px 30px rgba(0,0,0,0.35)", fontFamily: SERIF, color: INK }}>
        <div style={{ fontSize: 68, fontWeight: 700 }}><Hi p={(t - A(0, "joughin.")) / 0.35}>Charles Joughin</Hi></div>
        <div style={{ fontSize: 36, fontStyle: "italic", marginTop: 6 }}>chief baker, RMS Titanic · 33</div>
      </div></Layer>}
  </>) }),
  // 4 April 1912. The unsinkable ship hits an iceberg.   (the map: route draws on, the ship marker, the iceberg)
  4: (t) => {
    const ice = A(1, "iceberg.");
    return { cam: camLerp(4, t, { x: 40, y: 0, z: -420, roll: 0 }, { x: -230, y: 60, z: 180, roll: -1 }), bg: "paperT.jpg", body: <>
      <Layer z={-250}><AtlanticMap t={t} tRoute={T0(4) + 0.15} tIce={ice} /></Layer>
      <Layer z={120} x={-230} y={-820} rot={-3} s={pop(t, A(1, "april,"))}><Tape text="APRIL 1912" size={60} /></Layer>
      {at0(t, A(1, "unsinkable")) && <Layer z={260} x={-120} y={-610} rot={3} s={pop(t, A(1, "unsinkable"))}>
        <div style={{ position: "relative" }}><Tape text="“UNSINKABLE”" size={62} font={SERIF} />
          <div style={{ position: "absolute", left: -10, top: 30 }}><Stroke d="M0 30 L470 10" w={480} h={50} t={t} t0={ice - 0.1} col={RED} sw={12} dur={0.25} /></div></div></Layer>}
      <Layer z={320} x={-210} y={360 + alive(t, 3).dy} rot={-4 + alive(t, 3).rot}><Plate src="liner_n.jpg" w={560} h={330} /></Layer>
    </> };
  },
  // 5 Charles runs the kitchen, with 13 bakers under him.
  5: (t) => {
    const c13 = A(1, "13");
    return { cam: camLerp(5, t, { x: -60, y: 0, z: -120, roll: 0.8 }, { x: 40, y: -60, z: 200, roll: -0.4 }), bg: "paperW.jpg", body: <>
      <Layer z={-700} y={-80} rot={1.5}><Plate src="galley_w.jpg" w={1300} h={1950} tape={false} /></Layer>
      <Layer z={60} x={0} y={-640} rot={-2} s={pop(t, c13)}><div style={{ display: "flex", alignItems: "baseline", gap: 24, whiteSpace: "nowrap", background: "#fbf7ee", padding: "6px 40px 18px", boxShadow: "0 18px 28px rgba(0,0,0,0.35)", fontFamily: SERIF, fontWeight: 700, color: INK }}><span style={{ fontSize: 200 }}><Hi p={(t - c13 - 0.1) / 0.3}>13</Hi></span><span style={{ fontSize: 96 }}>bakers</span></div></Layer>
      {Array.from({ length: 13 }, (_, k) => {
        const row = k < 5 ? 0 : k < 9 ? 1 : 2, col = k < 5 ? k : k < 9 ? k - 5 : k - 9, n = row ? 4 : 5;
        const x = (col - (n - 1) / 2) * 190, y = -230 + row * 250, s = pop(t, c13 + 0.06 * k), a = alive(t, k, 0.7);
        return <Layer key={k} z={180 - row * 40} x={x} y={y + a.dy} rot={a.rot} s={s}><Chef s={1.25} /></Layer>;
      })}
    </> };
  },
  // 6 His first move? Bread.
  6: (t) => {
    const b = A(1, "bread."), drop = clamp01((t - b + 0.25) / 0.3), bounce = drop < 1 ? -900 * (1 - drop) ** 2 : 40 * Math.exp(-6 * (t - b - 0.05)) * Math.sin(18 * (t - b));
    return { cam: camLerp(6, t, { x: 0, y: 0, z: 0, roll: 0 }, { x: 0, y: 30, z: 160, roll: 0.5 }), bg: "paperW.jpg", body: <>
      <Layer z={-900} y={-80}><Plate src="galley_w.jpg" w={1300} h={1950} tape={false} /></Layer>
      <Layer z={0} x={0} y={-640} rot={-2} s={pop(t, A(1, "move?"))}><Tape text="HIS FIRST MOVE?" size={58} /></Layer>
      {t > b - 0.3 && <Layer z={160} y={-60 + bounce} rot={-6 + 4 * Math.sin(TW(t) * 2)}><Plate src="bread_d.jpg" w={760} h={665} /></Layer>}
      {at0(t, b) && <Layer z={260} y={300} s={pop(t, b + 0.05)}><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 170, color: INK }}><Hi p={(t - b - 0.1) / 0.3}>Bread.</Hi></div></Layer>}
    </> };
  },
  // 7 He sends every baker up to the lifeboats, with four loaves each.
  7: (t) => {
    const s0 = A(1, "sends"), fo = A(1, "four");
    return { cam: camLerp(7, t, { x: -80, y: 0, z: -60, roll: -1 }, { x: 60, y: -40, z: 220, roll: 0.6 }), bg: "paperN.jpg", body: <>
      <Layer z={-1000} y={-200}><Plate src="deck_n.jpg" w={1300} h={1950} tape={false} /></Layer>
      <Layer z={-260} x={120} y={-330 + alive(t, 1).dy} rot={-3 + alive(t, 1).rot}><Plate src="lifeboat_n.jpg" w={900} h={525} /></Layer>
      {at0(t, A(1, "lifeboats,")) && <Layer z={60} x={160} y={-760} rot={3} s={pop(t, A(1, "lifeboats,"))}><Tape text="TO THE LIFEBOATS" size={52} /></Layer>}
      {Array.from({ length: 5 }, (_, k) => {
        const w = clamp01((t - s0 - 0.25 * k) / 3.4), x = -700 + 1250 * w - 120 * k, step = Math.sin(TW(t) * 12 + k) > 0 ? 1 : -1;
        return <Layer key={k} z={120 + 30 * (k % 2)} x={x} y={190 + 25 * (k % 2) - Math.abs(8 * Math.sin(TW(t) * 12 + k))}><Chef s={1.7} loaf col={INK} step={step} /></Layer>;
      })}
      {at0(t, fo) && <Layer z={300} y={-470} s={pop(t, fo)}><div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fbf7ee", padding: "18px 30px", boxShadow: "0 18px 28px rgba(0,0,0,0.35)" }}>
        {[0, 1, 2, 3].map((k) => <div key={k} style={{ transform: `scale(${pop(t, fo + 0.12 * k)})` }}><Loaf s={0.9} /></div>)}
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, color: INK }}>EACH</div></div></Layer>}
    </> };
  },
  // 8 Then he goes back to his cabin... for a drink.
  8: (t) => ({ cam: camLerp(8, t, { x: 0, y: 0, z: -200, roll: 1 }, { x: 80, y: -40, z: 260, roll: -0.5 }), bg: "paperW.jpg", body: <>
    <Layer z={-700} y={-100} rot={-1.5}><Plate src="cabin_w.jpg" w={1250} h={1870} tape={false} /></Layer>
    {at0(t, A(2, "cabin...")) && <Layer z={60} x={-170} y={-620} rot={-3} s={pop(t, A(2, "cabin..."))}><Tape text="BACK TO HIS CABIN..." size={50} /></Layer>}
    {at0(t, A(2, "drink.") - 0.3) && <Layer z={160} x={150} y={60 + alive(t, 4).dy} rot={-4 + alive(t, 4).rot} s={pop(t, A(2, "drink.") - 0.3)}><Plate src="baker_n.jpg" w={560} h={700} /></Layer>}
  </> }),
  // 9 Half a glass of liqueur, he said later. Legend says it was a lot more.
  9: (t) => {
    const lg = A(2, "legend");
    return { cam: camLerp(9, t, { x: -40, y: 0, z: 0, roll: 0 }, { x: 120, y: -80, z: 200, roll: 1.2 }), bg: "paperW.jpg", body: <>
      <Layer z={-900} y={-100}><Plate src="cabin_w.jpg" w={1250} h={1870} tape={false} /></Layer>
      <Layer z={100} x={-120} y={-80 + alive(t, 6).dy} rot={-3 + alive(t, 6).rot} s={pop(t, A(2, "half"))}><Cut src="glass_d.png" w={620} /></Layer>
      {at0(t, A(2, "liqueur,")) && <Layer z={180} x={250} y={-470} rot={4} s={pop(t, A(2, "liqueur,"))}><Tape text="½ GLASS" size={70} font={SERIF} /></Layer>}
      {at0(t, A(2, "later.")) && <Layer z={180} x={260} y={-360}><div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: INK, background: "#fbf7ee", padding: "6px 16px" }}>(his words)</div></Layer>}
      {at0(t, lg) && <Layer z={320} x={170} y={110} rot={-5} s={pop(t, lg)}><Sticky lines={["LEGEND SAYS:", "a lot more."]} w={500} /></Layer>}
    </> };
  },
  // 10 Back on deck, he starts throwing deck chairs into the ocean. About fifty of them.
  10: (t) => {
    const th = A(3, "throwing"), fi = A(3, "fifty");
    const n = t < fi ? Math.max(0, Math.floor((t - th) * 3)) : Math.min(50, Math.floor(8 + (t - fi) * 70));
    return { cam: camLerp(10, t, { x: 0, y: 0, z: -100, roll: -1.5 }, { x: -60, y: -60, z: 140, roll: 1 }), bg: "paperN.jpg", body: <>
      <Layer z={-1100} y={-150}><Plate src="sea_night_n.jpg" w={1350} h={2020} tape={false} /></Layer>
      {Array.from({ length: 7 }, (_, k) => {
        const u = (t - th - 0.45 * k) / 1.6; if (u < 0 || u > 1) return null;
        return <Layer key={k} z={300 - 1400 * u} x={-380 + 760 * u + 80 * Math.sin(k)} y={420 - 1100 * u + 1300 * u * u} rot={300 * u + 40 * k}><DeckChair s={1.9} /></Layer>;
      })}
      {t > th - 0.2 && <Layer z={240} x={-60} y={-640} rot={-4}><Tape text="DECK CHAIRS → SEA" size={50} /></Layer>}
      {t > th && <Layer z={300} x={240} y={-380} rot={5} s={1 + 0.08 * Math.max(0, Math.sin(TW(t) * 9))}><div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 160, color: YEL, WebkitTextStroke: `8px ${INK}`, paintOrder: "stroke fill" }}>×{n}</div></Layer>}
    </> };
  },
  // 11 So people in the water have something to float on.
  11: (t) => ({ cam: camLerp(11, t, { x: 0, y: -40, z: -200, roll: 0 }, { x: 80, y: 20, z: 160, roll: -1 }), bg: "paperN.jpg", body: <>
    <Layer z={-1100} y={-260}><Plate src="waves_n.jpg" w={1500} h={2200} tape={false} /></Layer>
    {[[-300, -500, -120], [260, -300, 30], [-140, -80, 160], [330, 60, 280]].map(([z, x, y], k) => (
      <Layer key={k} z={z} x={x} y={y + 18 * Math.sin(t * 1.6 + k)} rot={8 * Math.sin(t * 1.1 + k)}><div style={{ transform: k % 2 ? "scaleX(-1)" : undefined }}><DeckChair s={1.5} /></div></Layer>))}
    <Layer z={120} y={760}><Waves t={t} col="#1c3560" /></Layer>
    <Layer z={360} y={900}><Waves t={t} col="#10224a" amp={34} ph={2} /></Layer>
    {at0(t, A(3, "float")) && <Layer z={420} y={-560} rot={-3} s={pop(t, A(3, "float"))}><Tape text="SOMETHING TO FLOAT ON" size={52} /></Layer>}
  </> }),
  // 12 Then the ship tips up. He climbs to the very back and grabs the rail.
  12: (t) => {
    const tip = A(4, "tips"), ang = -12 * smooth((t - tip) / 1.2);
    return { cam: camLerp(12, t, { x: 0, y: 60, z: -150, roll: 0 }, { x: 40, y: -160, z: 180, roll: -3 }), bg: "paperN.jpg", body: <>
      <Layer z={-500} y={-60} rot={ang}><Plate src="sinking_n.jpg" w={1150} h={1720} tape={false} /></Layer>
      {at0(t, A(4, "back")) && <Layer z={100} x={-60} y={-560} rot={ang}><Stroke d={ring(330, 230, 4)} w={330} h={230} t={t} t0={A(4, "back")} col={YEL} sw={12} len={1200} /></Layer>}
      {at0(t, A(4, "back")) && <Layer z={200} x={250} y={-260} rot={4} s={pop(t, A(4, "back") + 0.2)}><Tape text="HE'S UP HERE" size={54} bg={YEL} /></Layer>}
      {at0(t, A(4, "rail.")) && <Layer z={250} x={120} y={-370}><Stroke d="M120 120 C80 60 30 30 -60 -20 M-40 30 L-62 -22 L-6 -36" w={160} h={160} t={t} t0={A(4, "rail.")} col={YEL} sw={10} /></Layer>}
    </> };
  },
  // 13 And as the Titanic goes down, he rides it... like an elevator.
  13: (t) => {
    const dn = A(4, "down,"), el = A(4, "elevator."), sink = smooth((t - dn) / Math.max(0.6, el - dn));
    const fl = t < dn ? "5" : t >= el ? "G" : String(Math.max(1, 5 - Math.floor(((t - dn) / Math.max(0.4, el - dn)) * 5)));
    return { cam: camLerp(13, t, { x: 0, y: -100, z: 0, roll: -3 }, { x: 0, y: 40, z: 160, roll: -1 }), bg: "paperN.jpg", body: <>
      <Layer z={-500} y={-60 + 900 * sink} rot={-12 + 4 * sink}><Plate src="sinking_n.jpg" w={1150} h={1720} tape={false} /></Layer>
      <Layer z={60} y={1100 - 520 * sink}><Waves t={t} col="#1c3560" amp={30} /></Layer>
      <Layer z={220} y={1250 - 520 * sink}><Waves t={t} col="#10224a" amp={36} ph={1.7} /></Layer>
      <Layer z={300} x={140} y={-470} rot={3}><Elevator floor={fl} lit={t >= el ? clamp01((t - el) / 0.6) : 0} /></Layer>
      {at0(t, el) && <Layer z={380} x={-20} y={-220} rot={-4} s={pop(t, el)}><Tape text="LIKE AN ELEVATOR" size={58} bg={YEL} /></Layer>}
    </> };
  },
  // 14 He said his head barely even got wet.
  14: (t) => ({ cam: camLerp(14, t, { x: 0, y: 0, z: -60, roll: 0.5 }, { x: 40, y: -40, z: 120, roll: -0.5 }), bg: "paperN.jpg", body: <>
    <Layer z={-1000} y={-200}><Plate src="sea_night_n.jpg" w={1350} h={2020} tape={false} /></Layer>
    <Layer z={0} y={120 + 14 * Math.sin(t * 1.5)} rot={2 * Math.sin(t * 1.1)}><Plate src="baker_d.jpg" w={560} h={700} /></Layer>
    <Layer z={140} y={520}><Waves t={t} col="#1c3560" amp={24} /></Layer>
    {at0(t, A(4, "head")) && <Layer z={260} x={0} y={-520} rot={-2} s={pop(t, A(4, "head"))}><div style={{ whiteSpace: "nowrap", background: "#fbf7ee", padding: "16px 30px", fontFamily: SANS, fontWeight: 900, fontSize: 64, color: INK, boxShadow: "0 18px 26px rgba(0,0,0,0.35)" }}>HEAD: <Hi p={(t - A(4, "wet.")) / 0.3}>BARELY WET</Hi></div></Layer>}
  </> }),
  // 15 The water was below freezing. Most people lasted only minutes.   (played straight, cold)
  15: (t) => {
    const fr = A(5, "freezing."), lvl = 0.62 - 0.4 * smooth((t - fr + 0.6) / 1.2);
    return { cam: camLerp(15, t, { x: 0, y: 0, z: -80, roll: 0 }, { x: 0, y: -40, z: 100, roll: 0 }), bg: "paperT.jpg", body: <>
      <Layer z={-1000} y={-150}><Plate src="sea_night_n.jpg" w={1350} h={2020} tape={false} /></Layer>
      <Layer z={0} x={-180} y={-150}><Thermo level={lvl} /></Layer>
      {at0(t, fr) && <Layer z={120} x={160} y={-420} s={pop(t, fr)}><div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 110, color: "#eaf4ff", lineHeight: 1 }}>-2°C<div style={{ fontSize: 60, opacity: 0.8 }}>28°F</div></div></Layer>}
      {at0(t, A(5, "minutes.")) && <Layer z={160} x={230} y={40} s={pop(t, A(5, "minutes."))}><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 64, color: "#eaf4ff", width: 420 }}>most lasted only <span style={{ color: "#ff8a7a" }}>minutes</span></div></Layer>}
    </> };
  },
  // 16 Charles says he just paddled around... for two hours.
  16: (t) => {
    const ho = A(5, "hours."), hrs = 2 * easeOut((t - A(5, "paddled")) / Math.max(0.6, ho - A(5, "paddled")));
    return { cam: camLerp(16, t, { x: 0, y: 0, z: -100, roll: -0.5 }, { x: 60, y: -60, z: 140, roll: 0.8 }), bg: "paperN.jpg", body: <>
      <Layer z={-1000} y={-200}><Plate src="sea_night_n.jpg" w={1350} h={2020} tape={false} /></Layer>
      <Layer z={0} x={-60} y={120 + 26 * Math.sin(t * 2.4)} rot={5 * Math.sin(t * 2.0)}><Plate src="baker_d.jpg" w={520} h={650} /></Layer>
      <Layer z={140} y={560}><Waves t={t} col="#1c3560" amp={30} /></Layer>
      <Layer z={220} x={110} y={-420} rot={4} s={0.85 * pop(t, A(5, "paddled"))}><Clock hours={hrs} label={t >= ho ? "2 HOURS?" : undefined} /></Layer>
    </> };
  },
  // 17 Historians aren't so sure.
  17: (t) => {
    const hi = A(5, "historians"), su = A(5, "sure."), slam = t < su ? 0 : Math.max(1, 2.2 - (t - su) * 12);
    return { cam: camLerp(17, t, { x: 60, y: -60, z: 140, roll: 0.8 }, { x: 0, y: -100, z: 260, roll: -0.6 }), bg: "paperN.jpg", body: <>
      <Layer z={-1000} y={-200}><Plate src="sea_night_n.jpg" w={1350} h={2020} tape={false} /></Layer>
      <Layer z={0} x={110} y={-470} rot={4} s={0.85}><Clock hours={2} label="2 HOURS?" /></Layer>
      {at0(t, hi) && <Layer z={240} x={-10} y={-60} rot={-5} s={pop(t, hi)}><Sticky lines={["HISTORIANS:", "probably under 30 minutes"]} w={560} /></Layer>}
      {at0(t, su) && <Layer z={360} x={40} y={-420} rot={-12} s={slam}><Stamp text="DOUBTFUL" size={90} /></Layer>}
    </> };
  },
  // 18 At dawn, a rescue ship picks him up. His only injury? Swollen feet.
  18: (t) => {
    const fe = A(6, "feet.");
    return { cam: camLerp(18, t, { x: 0, y: -60, z: -200, roll: 0.6 }, { x: 40, y: 0, z: 180, roll: -0.6 }), bg: "paperW.jpg", body: <>
      <Layer z={-900} y={-200}><Plate src="rescue_w.jpg" w={1300} h={1950} tape={false} /></Layer>
      <Layer z={-120} x={-60} y={300 + 14 * Math.sin(t * 1.4)} rot={2 * Math.sin(t)}><Plate src="lifeboat_w.jpg" w={880} h={515} /></Layer>
      {at0(t, A(6, "dawn,")) && <Layer z={120} x={-30} y={-650} rot={-3} s={pop(t, A(6, "dawn,"))}><Tape text="DAWN · RMS CARPATHIA" size={50} /></Layer>}
      {at0(t, fe) && <Layer z={300} x={140} y={-180} rot={3} s={pop(t, fe)}>
        <div style={{ background: "#fbf7ee", padding: 24, boxShadow: "0 24px 36px rgba(0,0,0,0.35)", textAlign: "center" }}>
          <Feet k={0.5 + 0.5 * Math.sin(TW(t) * 7)} />
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, color: INK }}><Hi p={(t - fe - 0.1) / 0.3}>SWOLLEN FEET</Hi></div></div></Layer>}
    </> };
  },
  // 19 And he wasn't done. Years later, another of his ships caught fire. Then another one sank.   (a vertical timeline)
  19: (t) => timeline(t, 19),
  20: (t) => timeline(t, 20),
  // 21 In the 1997 Titanic movie, he's the guy at the back rail, sipping from a flask.
  21: (t) => {
    const mv = A(8, "1997"), fl = A(8, "flask.");
    return { cam: camLerp(21, t, { x: 0, y: 0, z: -150, roll: -1 }, { x: 60, y: -60, z: 160, roll: 0.8 }), bg: "paperN.jpg", body: <>
      <Layer z={-800}><FilmStrip t={t} /></Layer>
      <Layer z={0} x={30} y={60 + alive(t, 8).dy} rot={-3 + alive(t, 8).rot}><Plate src="baker_n.jpg" w={600} h={750} /></Layer>
      {at0(t, mv) && <Layer z={220} x={10} y={-610} rot={-4} s={0.9 * pop(t, mv)}><Clapper open={1 - clamp01((t - mv - 0.35) / 0.12)} text="TITANIC (1997)" /></Layer>}
      {at0(t, A(8, "rail,")) && <Layer z={260} x={150} y={320} rot={3} s={pop(t, A(8, "rail,"))}><Tape text="THE BAKER IS IN IT" size={54} bg={YEL} /></Layer>}
      {at0(t, fl) && <Layer z={30} x={-120} y={260}><Stroke d={ring(200, 260, 7)} w={200} h={260} t={t} t0={fl - 0.1} col={RED} sw={10} len={900} /></Layer>}
    </> };
  },
  // 22 Send this to the friend who'd stay calm on a sinking ship.   (ends on shot 1's frame: loop)
  22: (t) => {
    const on = A(9, "on"), ht = t - (TOTAL - 1) / FPS;
    if (t >= on) return { cam: HOOK_CAM, bg: "paperN.jpg", body: hookBody(ht) };
    return { cam: camLerp(22, t, { x: 170, y: -100, z: 420, roll: -0.4 }, { x: 60, y: 0, z: 120, roll: -1.4 }), bg: "paperN.jpg", body: hookBody(ht,
      <Layer z={260} x={0} y={380} rot={-3} s={pop(t, A(9, "send"))}><Tape text="SEND THIS TO THE CALM ONE" size={52} bg={YEL} /></Layer>) };
  },
};
const FilmStrip: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ width: 760, height: 2600, background: "#141416", transform: `translateY(${(-(t * 90) % 400)}px)`, position: "relative", boxShadow: "0 30px 50px rgba(0,0,0,0.5)" }}>
    {Array.from({ length: 26 }, (_, k) => <React.Fragment key={k}>
      <div style={{ position: "absolute", left: 22, top: 20 + 100 * k, width: 40, height: 56, borderRadius: 8, background: "#e8e4d8" }} />
      <div style={{ position: "absolute", right: 22, top: 20 + 100 * k, width: 40, height: 56, borderRadius: 8, background: "#e8e4d8" }} /></React.Fragment>)}
    {Array.from({ length: 6 }, (_, k) => <div key={k} style={{ position: "absolute", left: 100, top: 30 + 420 * k, width: 560, height: 380, background: "#2a3448", opacity: 0.8 }} />)}
  </div>
);
const timeline = (t: number, id: number): Scene => {
  const fi = A(7, "fire."), sa = A(7, "sank."), bo = A(7, "both."), L0 = T0(19);
  const prog = smooth((t - L0) / 1.0);
  const ys = [-560, 0, 560], tt = [L0, fi, sa];
  let cy = ys[0];
  if (t >= fi - 0.5) cy = ys[0] + (ys[1] - ys[0]) * glide((t - fi + 0.5) / 0.6);
  if (t >= sa - 0.5) cy = ys[1] + (ys[2] - ys[1]) * glide((t - sa + 0.5) / 0.6);
  const out = id === 20 ? 1 : 0;
  const items: [string, string, string, string][] = [["1912", "RMS TITANIC", "liner_d.jpg", "SANK"], ["1916", "SS CONGRESS", "fireship_d.jpg", "FIRE"], ["1941", "SS OREGON", "liner_d.jpg", "SANK"]];
  return { cam: { x: 0, y: out ? 0 : cy * 0.9, z: out ? -650 : 40 + 30 * Math.sin(t * 0.5), roll: -0.6 + 0.4 * Math.sin(t * 0.4) }, bg: "paper.jpg", body: <>
    <Layer z={-60} x={-400} y={-760 + 750 * prog}><div style={{ width: 12, height: 1500 * prog, background: INK }} /></Layer>
    {items.map(([yr, nm, src, what], k) => at0(t, tt[k]) && (
      <React.Fragment key={k}>
        <Layer z={0} x={-400} y={ys[k]} s={pop(t, tt[k])}><div style={{ width: 64, height: 64, borderRadius: 99, background: k ? RED : INK, border: "8px solid #fbf7ee", boxShadow: "0 6px 10px rgba(0,0,0,0.3)" }} /></Layer>
        <Layer z={140} x={-260} y={ys[k] - 245} rot={-2} s={pop(t, tt[k] + 0.05)}><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 120, color: INK, whiteSpace: "nowrap" }}>{yr}</div></Layer>
        <Layer z={80} x={110} y={ys[k] + 10 + alive(t, k).dy} rot={(k % 2 ? 3 : -3) + alive(t, k).rot} s={pop(t, tt[k] + 0.12)}><Plate src={src} w={600} h={350} /></Layer>
        <Layer z={120} x={110} y={ys[k] + 225} s={pop(t, tt[k] + 0.2)}><div style={{ whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 900, fontSize: 50, color: INK, background: "#fbf7ee", padding: "6px 20px", boxShadow: "0 8px 14px rgba(0,0,0,0.25)" }}>{nm} · <span style={{ color: RED }}>{what}</span></div></Layer>
        {(id === 20 || t > bo) && <Layer z={200} x={250} y={ys[k] - 120} rot={-14} s={Math.max(1, 2 - (t - Math.max(tt[k], bo - 0.3)) * 10)}><Stamp text="SURVIVED" size={64} col="#1f8a4a" /></Layer>}
      </React.Fragment>))}
  </> };
};

// ---------------- composition ----------------
const Impact: React.FC<{ f: number }> = ({ f }) => {
  if (f < IMPACT.a || f >= IMPACT.b + IMPACT.up) return null;
  const k = f - IMPACT.a, black = f < IMPACT.b ? Math.min(1, (k + 1) / IMPACT.out) : 1 - (f - IMPACT.b + 1) / (IMPACT.up + 1);
  const kp = f >= IMPACT.pig ? f - IMPACT.pig : k, sc = kp < 3 ? [1.3, 0.95, 1.02][kp] : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#0d1322", opacity: black }} />
      {f < IMPACT.b && <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: "40%", width: "90%", textAlign: "center", transform: `translateY(-50%) scale(${sc})`, fontFamily: SERIF, fontWeight: 700, fontSize: 150, lineHeight: 1.05, color: "#f1e7d0", whiteSpace: "pre-line" }}>
          {f < IMPACT.pig ? "He survived" : <>He survived{"\n"}<span style={{ color: YEL }}>both.</span></>}</div></AbsoluteFill>}
    </AbsoluteFill>
  );
};
const sceneAt = (f: number) => { const s = shotAt(f); return SCENES[s.id](f / FPS, f); };
export const VoxShort: React.FC = () => {
  const f = useCurrentFrame();
  const sc = sceneAt(f), tr = transAt(f);
  let wrap = "", blur = 0;
  if (tr) {
    const u = tr.u, d = tr.dir * (tr.out ? 1 : -1);
    if (tr.kind === "whip") { wrap = `translateX(${d * 700 * u}px) scale(${1 + 0.06 * u})`; blur = 28 * u; }
    else { wrap = `rotate(${d * 28 * u}deg) scale(${1 + 0.35 * u})`; blur = 22 * u; }
  }
  const mood = f >= MOOD.a && f < MOOD.b ? Math.min(1, (f - MOOD.a + 1) / 6) : 0;
  return (
    <AbsoluteFill style={{ background: "#0d1322", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: wrap || undefined, filter: [blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "", mood ? `saturate(${1 - 0.35 * mood}) brightness(${1 - 0.12 * mood})` : ""].join(" ").trim() || undefined }}>
        <Stage cam={sc.cam} bg={sc.bg} tint={sc.tint}>
          {sc.body}
          <Dust t={f / FPS} />
        </Stage>
      </AbsoluteFill>
      <Grain f={f} />
      <Impact f={f} />
      <Captions y={0.8} />
    </AbsoluteFill>
  );
};
void hh; void H; void W;
