// The 21 shots of the 2D Pig War, staged like the reference reels: tight framing, characters filling the frame,
// pop-in props and labels on the narration words, rise-from-bottom entrances, slow creeping camera, quick pose swaps.
import React from "react";
import { Defs, Part, INK, Floor, ell } from "./art";
import { Bean, CUTLAR, Pig, Potato, REDCOAT, BLUECOAT, PICKETT, GRIFFIN, ADMIRAL, KAISER, GhostPig } from "./chars";
import { Flag, Cannon, Ship, Bubble, Burst, Label, Paper, Bill, Grave, Rifle, Leafy, COMIC } from "./props";
import { FarmBG, MapBG, StoreBG, CampBG, BayBG, CabinBG, PalaceBG, GraveBG, Bunting, Cloud, W, H } from "./sets";
import { SHOTS } from "../pig/story";
import { at, pop, sw, rise, bob, blink, talk, keys, shake, lerp, ease, clamp01 } from "./rig";

type Cam = { x?: number; y?: number; z?: number; r?: number; cx?: number; cy?: number };
export const Frame: React.FC<{ children: React.ReactNode; cam?: Cam; dark?: number }> = ({ children, cam = {}, dark = 0 }) => {
  const z = cam.z ?? 1, cx = cam.cx ?? W / 2, cy = cam.cy ?? H * 0.55;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <Defs />
      <g filter="url(#grade)">
        <g transform={`translate(${cx + (cam.x ?? 0)},${cy + (cam.y ?? 0)}) rotate(${cam.r ?? 0}) scale(${z}) translate(${-cx},${-cy})`}>{children}</g>
      </g>
      <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c8" stopOpacity="0.22" /><stop offset="0.5" stopColor="#fff2c8" stopOpacity="0" /><stop offset="1" stopColor="#2a1838" stopOpacity="0.26" /></linearGradient>
      <rect width={W} height={H} fill="url(#sun)" />
      <rect width={W} height={H} fill="url(#vign)" />
      {dark > 0 && <rect width={W} height={H} fill="#0a0612" opacity={dark} />}
      <rect width={W} height={H} fill="url(#grain)" opacity={0.06} style={{ mixBlendMode: "overlay" }} />
    </svg>
  );
};
/** slow creep: zoom 1 -> 1+k over the shot (never ending on a face: centre sits at chest/prop level) */
const creep = (f: number, k = 0.04, n = 150) => 1 + k * ease(f / n) + 0.00008 * f;

type SP = { F: number; f: number };
const S = (id: number) => SHOTS[id - 1];

/* 1 ─ "In 1859, America and Britain almost went to war... over a pig." */
const S1: React.FC<SP> = ({ F, f }) => {
  const y59 = at(0, "1859"), am = at(0, "america"), br = at(0, "britain"), war = at(0, "war"), pg = at(0, "pig");
  const angry = F >= war, down = F >= pg - 2;
  return (
    <Frame cam={{ z: creep(f, 0.05), x: shake(F, war, 10), cy: 1150 }}>
      <BayBG f={F} horizon={1000} />
      <Ship x={-120} y={1040} s={0.42} f={F} flag="us" /><Ship x={1200} y={1030} s={0.42} f={F} flip />
      <Flag x={60} y={rise(F, am, 600) + 380} s={1.25} kind="us" f={F} pole={900} />
      <Flag x={720} y={rise(F, br, 600) + 380} s={1.25} kind="uk" f={F} pole={900} />
      <path d="M-600,1520 C200,1490 800,1500 1700,1490 L1700,2600 L-600,2600 Z" fill="#e3cf9a" stroke={INK} strokeWidth={8} />
      <Bean idle={F} x={250} y={1480 + bob(f, 4)} s={1.35} o={BLUECOAT} expr={down ? "shock" : angry ? "yell" : "angry"} look={down ? 0.5 : 0.75} tilt={down ? 14 : 4}
        lh={[-90, -80]} lpose="fist" rh={angry && !down ? [190, -260] : [170, -60]} rpose="fist" lean={angry && !down ? 6 : 0} blink={blink(F, 1)} />
      <Bean idle={F} x={830} y={1480 + bob(f, 4, 46, 20)} s={1.35} o={REDCOAT} expr={down ? "shock" : angry ? "yell" : "angry"} look={down ? -0.5 : -0.75} tilt={down ? -14 : -4}
        lh={angry && !down ? [-190, -260] : [-170, -60]} lpose="fist" rh={[90, -80]} rpose="fist" lean={angry && !down ? -6 : 0} blink={blink(F, 2)} />
      <Pig x={545} y={1560 + rise(F, pg - 3, 600, 8)} s={0.95} expr="happy" chew={0} tail={Math.sin(F * 0.4)} />
      <Label x={540} y={330} text="1859" size={170} k={pop(F, y59)} col="#ffd23a" />
    </Frame>
  );
};

/* 2 ─ "On a tiny island between the U.S. and Canada," */
const S2: React.FC<SP> = ({ F, f }) => {
  const tiny = at(1, "tiny"), us = at(1, "u.s."), ca = at(1, "canada");
  const hl = sw(F, tiny, 8);
  return (
    <Frame cam={{ z: 0.92 + 0.18 * ease((F - tiny) / 70), cx: 560, cy: 1000 }}>
      <MapBG f={F} hl={hl} />
      <Label x={560} y={860} text={"SAN JUAN\nISLAND"} size={70} k={pop(F, tiny + 4)} />
      <Label x={860} y={1300} text="U.S.A." size={96} k={pop(F, us)} col="#9ec5ff" rot={-6} />
      <Flag x={830} y={1360} s={0.55} kind="us" f={F} pole={200} />
      <Label x={250} y={300} text={"BRITISH\nCANADA"} size={84} k={pop(F, ca)} col="#ffb3b3" rot={4} />
      <g transform={`translate(150,${480 + rise(F, ca, 400)})`}><Flag x={0} y={0} s={0.55} kind="uk" f={F} pole={200} /></g>
    </Frame>
  );
};

/* 3 ─ "an American farmer named Lyman Cutlar" */
const S3: React.FC<SP> = ({ F, f }) => {
  const s0 = S(3).a, ly = at(1, "lyman");
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1200 }}>
      <FarmBG f={F} horizon={1100} />
      <Bean idle={F} x={560} y={1500 + rise(F, s0, 700, 8) + bob(f, 5)} s={1.6} o={CUTLAR} expr="happy" look={0.15} talk={0} blink={blink(F, 3)}
        lh={[-150, -10]} rh={[150, -330 + bob(f, 6, 30)]} rpose="open" tilt={bob(f, 3, 60)} />
      <Potato x={560 + 150 * 1.6 + 30} y={1500 - 330 * 1.6 - 60 + bob(f, 6, 30) * 1.6} s={1.6} a={-20} />
      <Label x={60} y={260} text="LYMAN CUTLAR" size={96} k={pop(F, ly)} anchor="start" />
      <Label x={64} y={350} text="POTATO FARMER" size={52} k={pop(F, ly + 6)} col="#ffd23a" anchor="start" />
    </Frame>
  );
};

/* 4 ─ "found a pig eating his potatoes. Again." */
const S4: React.FC<SP> = ({ F, f }) => {
  const again = at(1, "again,"), t = F / 30;
  const mad = F >= again - 2;
  return (
    <Frame cam={{ z: creep(f, 0.035), x: shake(F, again, 8, 6), cy: 1300 }}>
      <FarmBG f={F} />
      <Bean idle={F} x={800} y={1560 + bob(f, 3)} s={1.75} o={CUTLAR} expr={mad ? "yell" : "angry"} look={-0.65} tilt={-5 + Math.sin(t * 2) * 1.5}
        lh={mad ? [-150, -330] : [-225, -185]} lpose={mad ? "open" : "point"} rh={mad ? [150, -330] : [120, 40]} legs={false} blink={!mad && blink(F, 4)} />
      <Pig x={290} y={1690} s={1.35} chew={(Math.sin(t * 14) + 1) / 2} headDip={0.5 + 0.5 * Math.sin(t * 7)} tail={Math.sin(t * 9)} expr={mad ? "happy" : "munch"} />
      <Potato x={560} y={1730} s={1.2} a={-12} bite /><Potato x={90} y={1770} s={1} a={20} />
      <Bubble x={560} y={520} w={420} h={230} text="AGAIN?!" size={96} tx={200} ty={190} k={pop(F, again)} shout />
    </Frame>
  );
};

/* 5 ─ "So he shot it." */
const S5: React.FC<SP> = ({ F, f }) => {
  const shot = at(1, "shot");
  const fired = F >= shot;
  return (
    <Frame cam={{ z: creep(f, 0.05) + (fired ? 0.03 * Math.exp(-(F - shot) / 6) : 0), x: shake(F, shot, 22, 9), y: shake(F, shot, 10, 9), cy: 1200 }}>
      <FarmBG f={F} />
      <g transform={`translate(${fired ? -10 * Math.exp(-(F - shot) / 5) : 0},0)`}>
        <Bean idle={F} x={720} y={1580} s={1.7} o={CUTLAR} expr={fired ? "squint" : "smug"} look={-0.7} lh={[-230, -170]} lpose="fist" rh={[-60, -150]} rpose="fist" legs={false} blink={false} />
        <Rifle x={720 - 40 * 1.7} y={1580 - 160 * 1.7} a={186} s={1.5} />
      </g>
      {fired && F < shot + 14 && <g opacity={1 - (F - shot) / 14}><circle cx={40} cy={1300} r={60 + (F - shot) * 14} fill="#efe8dc" opacity={0.8} filter="url(#blur8)" /></g>}
      <Burst x={300} y={1130} r={190} text="BANG!" k={pop(F, shot, 6)} rot={-10} />
      {fired && <GhostPig x={260} y={1700 - Math.min(400, (F - shot - 6) * 14)} s={0.8} f={F} />}
    </Frame>
  );
};

/* 6 ─ "The pig belonged to an Irishman. Working for a British company," */
const S6: React.FC<SP> = ({ F, f }) => {
  const iri = at(2, "irishman."), wk = at(2, "working"), brit = at(2, "british");
  const pull = ease((F - wk) / 30);
  return (
    <Frame cam={{ z: lerp(1.3, 1.0, pull) * creep(f, 0.02), cx: 560, cy: lerp(1350, 1100, pull) }}>
      <StoreBG f={F} />
      <Bean idle={F} x={540} y={1640 + bob(f, 4)} s={1.25} o={GRIFFIN} expr={F >= brit ? "smug" : "sad"} look={0.1} tilt={F >= brit ? 5 : -3} blink={blink(F, 5)}
        lh={[-70, -40]} rh={[70, -40]} />
      {/* framed portrait of the late pig */}
      <g transform={`translate(540,${1640 - 60 * 1.25}) rotate(${F >= brit ? 0 : -4}) scale(0.9)`}>
        <Part d="M-110,-120 L110,-120 L110,110 L-110,110 Z" fill="#c9a04a" sw={9} off={[8, 10]} />
        <rect x={-84} y={-94} width={168} height={178} fill="#bfe0f0" stroke={INK} strokeWidth={6} />
        <Pig x={0} y={10} s={0.3} expr="happy" />
        <path d="M-110,-120 L110,110 M110,-120 L-110,110" stroke="#1f1d24" strokeWidth={0} />
        <rect x={-110} y={-130} width={40} height={16} fill="#1f1d24" transform="rotate(-30,-110,-130)" />
      </g>
      <Label x={540} y={470} text="CHARLES GRIFFIN" size={86} k={pop(F, iri)} />
      <Label x={540} y={552} text="IRISHMAN" size={52} k={pop(F, iri + 6)} col="#7fe08a" />
      <Label x={540} y={660} text="BRITISH COMPANY" size={80} k={pop(F, brit)} col="#ffb3b3" />
    </Frame>
  );
};

/* 7 ─ "Cutlar offered $10. The owner said $100. Cutlar said no." */
const S7: React.FC<SP> = ({ F, f }) => {
  const off = at(3, "offered"), ten = at(3, "$10."), hun = at(3, "$100."), no = at(3, "no.");
  const said = at(3, "said");
  return (
    <Frame cam={{ z: creep(f, 0.03), cy: 1250, x: shake(F, hun, 8, 6) }}>
      <FarmBG f={F} horizon={1080} />
      <Bean idle={F} x={280} y={1600 + bob(f, 4)} s={1.45} o={CUTLAR} expr={F >= no - 2 ? "smug" : "happy"} look={0.6} blink={blink(F, 6)}
        lh={F >= no - 2 ? [60, -120] : [-120, -20]} rh={F >= no - 2 ? [-60, -110] : F >= off ? [170, -190] : [130, -20]} rpose={F >= off && F < no - 2 ? "open" : "fist"} lpose="fist" />
      <Bean idle={F} x={820} y={1600 + bob(f, 4, 46, 17)} s={1.45} o={GRIFFIN} expr={F >= hun - 2 ? "yell" : "smug"} look={-0.6} tilt={F >= said ? 8 : 0} blink={blink(F, 7)}
        lh={F >= hun - 2 ? [-90, -400] : [-120, -20]} lpose={F >= hun - 2 ? "point" : "rest"} rh={[110, -40]} />
      {F >= off && F < no - 2 && <Bill x={280 + 200 * 1.45} y={1600 - 215 * 1.45} s={1.1} a={-10} amt="10" />}
      <Bubble x={300} y={560} w={330} h={190} text="$10?" size={80} tx={20} ty={200} k={F < hun ? pop(F, ten) : 0} />
      <Bubble x={760} y={520} w={400} h={230} text="$100!" size={110} tx={60} ty={220} k={F < no ? pop(F, hun) : 0} shout col="#c22a30" />
      <Bubble x={320} y={560} w={300} h={200} text="NO." size={110} tx={20} ty={210} k={pop(F, no)} />
    </Frame>
  );
};

/* 8 ─ "The British threatened to arrest him." */
const S8: React.FC<SP> = ({ F, f }) => {
  const thr = at(4, "threatened"), arr = at(4, "arrest");
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1150 }}>
      <FarmBG f={F} horizon={1050} />
      <Bean idle={F} x={300} y={1300 + bob(f, 3)} s={0.95} o={CUTLAR} expr={F >= arr ? "shock" : "neutral"} look={0.5} blink={blink(F, 8)} lh={[-100, -60]} rh={[100, -60]} />
      {F >= arr && <g><path d="M380,980 q10,30 0,44" stroke="#7fc6ff" strokeWidth={10} fill="none" strokeLinecap="round" /></g>}
      <Bean idle={F} x={760} y={1780 + rise(F, S(8).a, 600, 9) + bob(f, 3)} s={1.7} o={REDCOAT} expr="angry" look={-0.55} blink={blink(F, 9)}
        lh={[-200, -230]} lpose="open" rh={[120, -40]} rpose="fist" legs={false} talk={talk(F, thr, arr + 10)} />
      <Paper x={760 - 210 * 1.7} y={1780 - 280 * 1.7} s={1.15} a={-8} title="ARREST" sub="WARRANT: L. CUTLAR" k={pop(F, arr - 2)} stamp="WANTED" />
    </Frame>
  );
};

/* 9 ─ "So the U.S. Army sent in 64 soldiers," */
const S9: React.FC<SP> = ({ F, f }) => {
  const army = at(4, "army"), sf = at(4, "64");
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1200 }}>
      <CampBG f={F} />
      {[...Array(9)].map((_, i) => {
        const row = i < 5 ? 0 : 1, x = row ? 180 + (i - 5) * 240 : 60 + i * 240, y = row ? 1290 : 1180;
        return <Bean idle={F} key={i} x={x} y={y + rise(F, sf - 8 + i * 2, 500, 7) + bob(f, 3, 40, i * 9)} s={row ? 0.7 : 0.55} o={BLUECOAT} expr="neutral" look={0.1 * (i % 3 - 1)} blink={blink(F, 20 + i)}
          lh={[-110, 10]} rh={[150, -330]} rpose="open" />;
      })}
      <Bean idle={F} x={560} y={1760 + rise(F, S(9).a, 700, 8) + bob(f, 4)} s={1.6} o={PICKETT} expr="grin" look={0.2} blink={blink(F, 10)}
        lh={[-120, 0]} rh={[100, -390]} rpose="open" />
      <Label x={540} y={420} text="64 SOLDIERS" size={110} k={pop(F, sf)} col="#9ec5ff" />
    </Frame>
  );
};

/* 10 ─ "Britain answered with three warships." */
const S10: React.FC<SP> = ({ F, f }) => {
  const three = at(4, "three"), ws = at(4, "warships.");
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1100 }}>
      <BayBG f={F} horizon={950} />
      {[0, 1, 2].map((i) => {
        const f0 = S(10).a + i * 8, x = [250, 640, 980][i] + (1 - ease((F - f0) / 26)) * 900;
        return <Ship key={i} x={x} y={1150 + i * 150} s={0.62 + i * 0.12} f={F + i * 20} flip />;
      })}
      <Label x={540} y={420} text="3 WARSHIPS" size={120} k={pop(F, ws)} col="#ffb3b3" />
    </Frame>
  );
};

/* 11 ─ "Within weeks, it was 460 Americans with 14 cannons," */
const S11: React.FC<SP> = ({ F, f }) => {
  const wk = at(5, "weeks,"), n = at(5, "460"), c = at(5, "14");
  return (
    <Frame cam={{ z: creep(f, 0.03), cy: 1200 }}>
      <CampBG f={F} />
      {[...Array(30)].map((_, i) => {
        const row = Math.floor(i / 10), x = 40 + (i % 10) * 112 + (row % 2) * 56, y = 1150 + row * 90;
        return <Bean idle={F} key={i} x={x} y={y + rise(F, wk + (i % 10) * 2 + row * 6, 400, 6)} s={0.32 + row * 0.06} o={BLUECOAT} expr={(i * 7) % 5 === 0 ? "grin" : "neutral"} look={0} blink={blink(F, 30 + i)}
          lh={[-110, 10]} rh={[110, 10]} />;
      })}
      {[...Array(4)].map((_, i) => <Cannon key={i} x={60 + i * 330 - (1 - ease((F - c - i * 3) / 12)) * 1200} y={1640 + (i % 2) * 70} s={0.95} />)}
      <Label x={540} y={400} text="460" size={190} k={pop(F, n)} col="#9ec5ff" />
      <Label x={540} y={560} text="14 CANNONS" size={90} k={pop(F, c)} col="#ffd23a" />
    </Frame>
  );
};

/* 12 ─ "versus over 2,000 British troops and five warships," */
const S12: React.FC<SP> = ({ F, f }) => {
  const two = at(5, "2,000"), five = at(5, "five");
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1150 }}>
      <BayBG f={F} horizon={900} />
      {[...Array(5)].map((_, i) => <Ship key={i} x={-100 + i * 300} y={1010 + (i % 2) * 60 + rise(F, five + i * 3, 400, 8)} s={0.36 + (i % 2) * 0.06} f={F + i * 13} flip={i % 2 === 0} />)}
      <path d="M-600,1260 C200,1240 800,1250 1700,1240 L1700,2600 L-600,2600 Z" fill="#e3cf9a" stroke={INK} strokeWidth={8} />
      {[...Array(36)].map((_, i) => {
        const row = Math.floor(i / 9), x = 10 + (i % 9) * 132 + (row % 2) * 66, y = 1360 + row * 140;
        return <Bean idle={F} key={i} x={x} y={y + rise(F, S(12).a + row * 5 + (i % 9), 500, 6)} s={0.34 + row * 0.08} o={REDCOAT} expr="angry" look={-0.3} blink={blink(F, 60 + i)}
          lh={[-110, 10]} rh={[110, 10]} />;
      })}
      <Label x={540} y={380} text="2,000" size={190} k={pop(F, two)} col="#ffb3b3" />
      <Label x={540} y={540} text="+5 WARSHIPS" size={90} k={pop(F, five)} col="#ffd23a" />
    </Frame>
  );
};

/* 13 ─ "all pointing at each other. Over a pig." */
const S13: React.FC<SP> = ({ F, f }) => {
  const pt = at(6, "pointing"), ov = at(6, "over");
  const inn = (k: number) => 1 - ease((F - S(13).a - k) / 10);
  return (
    <Frame cam={{ z: creep(f, 0.05), cy: 1200 }}>
      <BayBG f={F} horizon={950} />
      <path d="M-600,1250 C200,1230 800,1240 1700,1230 L1700,2600 L-600,2600 Z" fill="#e3cf9a" stroke={INK} strokeWidth={8} />
      <Flag x={-20} y={560} kind="us" f={F} pole={700} /><Flag x={860} y={560} kind="uk" f={F} pole={700} />
      {[0, 1, 2].map((i) => <Bean idle={F} key={`b${i}`} x={60 + i * 120 - inn(i) * 600} y={1290 + i * 20} s={0.55} o={BLUECOAT} expr="angry" look={0.6} lh={[-100, 0]} rh={[200, -200]} rpose="point" blink={blink(F, 40 + i)} />)}
      {[0, 1, 2].map((i) => <Bean idle={F} key={`r${i}`} x={1020 - i * 120 + inn(i) * 600} y={1290 + i * 20} s={0.55} o={REDCOAT} expr="angry" look={-0.6} lh={[-200, -200]} lpose="point" rh={[100, 0]} blink={blink(F, 50 + i)} />)}
      <Cannon x={250 - inn(4) * 700} y={1620} s={1.5} recoil={0} />
      <Cannon x={830 + inn(4) * 700} y={1620} s={1.5} flip />
      <Label x={540} y={400} text="POINTING..." size={110} k={pop(F, pt)} col="#ffd23a" />
      {F >= ov - 4 && <GhostPig x={545} y={1100 + rise(F, ov - 4, -500, 14)} s={0.85} f={F} expr="shock" />}
    </Frame>
  );
};

/* 14 ─ "Then the British admiral was ordered to attack." */
const S14: React.FC<SP> = ({ F, f }) => {
  const adm = at(7, "admiral"), ord = at(7, "ordered"), atk = at(7, "attack.");
  return (
    <Frame cam={{ z: creep(f, 0.05), cy: 1200 }}>
      <CabinBG f={F} />
      <Bean idle={F} x={540} y={1440 + bob(f, 3)} s={1.55} o={ADMIRAL} expr={F >= atk ? "shock" : "neutral"} look={0} blink={blink(F, 11)}
        lh={[-160, 0]} rh={[160, 0]} legs={false} />
      <Part d="M-600,1420 L1700,1420 L1700,1480 L-600,1480 Z" fill="#8a5a36" sw={9} off={[0, 10]} />
      <Paper x={540} y={1620 + rise(F, ord, 700, 9)} s={1.05} a={-4} title="ATTACK!" sub="ORDERS: ADMIRALTY" />
      <Label x={60} y={300} text={"REAR ADMIRAL\nBAYNES"} size={80} k={pop(F, adm)} anchor="start" />
    </Frame>
  );
};

/* 15 ─ "He refused." */
const S15: React.FC<SP> = ({ F, f }) => {
  const rf = at(7, "refused.");
  const torn = F >= rf, k = torn ? ease((F - rf) / 10) : 0;
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1150, x: shake(F, rf, 10, 6) }}>
      <CabinBG f={F} />
      <Bean idle={F} x={540} y={1500 + bob(f, 3)} s={1.75} o={ADMIRAL} expr={torn ? "smug" : "bored"} look={0.1} blink={blink(F, 12)}
        lh={torn ? [-240, -260] : [-90, -200]} rh={torn ? [240, -260] : [90, -200]} lpose="fist" rpose="fist" legs={false} />
      <g transform={`translate(${540 - 30 - k * 360},${1500 - 230 * 1.75 + k * 120}) rotate(${-k * 40})`}>
        <clipPath id="torn1"><path d="M-170,-220 L10,-220 L-20,-120 L20,-20 L-30,80 L10,220 L-170,220 Z" /></clipPath>
        <g clipPath="url(#torn1)"><Paper x={0} y={0} s={0.9} title="ATTACK!" /></g>
      </g>
      <g transform={`translate(${540 - 30 + k * 360},${1500 - 230 * 1.75 + k * 120}) rotate(${k * 40})`}>
        <clipPath id="torn2"><path d="M170,-220 L10,-220 L-20,-120 L20,-20 L-30,80 L10,220 L170,220 Z" /></clipPath>
        <g clipPath="url(#torn2)"><Paper x={0} y={0} s={0.9} title="ATTACK!" /></g>
      </g>
      <Burst x={820} y={560} r={120} text="RIP!" k={pop(F, rf, 6)} rot={8} />
    </Frame>
  );
};

/* 16 ─ "He said he would not start a war between two great nations... over a squabble about a pig." */
const S16: React.FC<SP> = ({ F, f }) => {
  const two = at(8, "two"), sq = at(8, "squabble");
  return (
    <Frame cam={{ z: creep(f, 0.05, 200), cy: 1150 }}>
      <CabinBG f={F} />
      <Flag x={80} y={300 + rise(F, two, 900)} s={1.1} kind="us" f={F} pole={900} />
      <Flag x={740} y={300 + rise(F, two + 4, 900)} s={1.1} kind="uk" f={F} pole={900} />
      <Bean idle={F} x={500} y={1560 + bob(f, 3)} s={1.6} o={ADMIRAL} expr={F >= sq - 2 ? "smug" : "happy"} look={F >= sq ? 0.5 : 0} tilt={F >= sq ? 8 : -4} blink={blink(F, 13)}
        lh={[-10, -170]} lpose="rest" rh={F >= sq - 2 ? [190, -230] : [180, -380]} rpose={F >= sq - 2 ? "point" : "open"} legs={false} talk={talk(F, S(16).a, sq - 4)} />
      {F >= sq - 4 && <GhostPig x={930} y={1180 + rise(F, sq - 4, 500, 9)} s={0.5} f={F} expr="happy" />}
    </Frame>
  );
};

/* 17 ─ "So both armies just... stayed. For twelve years." */
const S17: React.FC<SP> = ({ F, f }) => {
  const st = at(9, "stayed"), tw = at(9, "12"), end = S(17).b;
  const yr = Math.min(1872, 1859 + Math.max(0, Math.floor(((F - tw) / Math.max(1, end - tw - 10)) * 13)));
  const flip = F >= tw && yr < 1872 ? (F % 4) / 4 : 0;
  return (
    <Frame cam={{ z: creep(f, 0.03, 220), cy: 1200 }}>
      <CampBG f={F} />
      {/* calendar on a post */}
      <g transform="translate(540,620)">
        <Part d="M-10,0 L10,0 L12,700 L-12,700 Z" fill="#6b4a33" sw={6} />
        <Part d="M-170,-180 L170,-180 L170,170 L-170,170 Z" fill="#f4f1ea" sw={9} off={[10, 12]} />
        <rect x={-170} y={-180} width={340} height={80} fill="#c8323a" stroke={INK} strokeWidth={8} />
        <text x={0} y={60} textAnchor="middle" fontFamily={COMIC} fontSize={120} fill={INK}>{yr}</text>
        {flip > 0 && <path d={`M-170,-100 L170,-100 L170,${-100 + 260 * (1 - flip)} L-170,${-100 + 260 * (1 - flip)} Z`} fill="#fff" stroke={INK} strokeWidth={6} opacity={0.9} />}
      </g>
      {[[240, BLUECOAT, 0.4], [840, REDCOAT, -0.4]].map(([x, o, lk], i) => (
        <g key={i}>
          <Part d={`M${(x as number) - 120},1640 L${(x as number) + 120},1640 L${(x as number) + 120},1800 L${(x as number) - 120},1800 Z`} fill="#a77b4a" sw={8} />
          <Bean idle={F} x={x as number} y={1650 + bob(f, 2, 70, i * 30)} s={1.05} legs={false} o={o as typeof BLUECOAT} expr={F >= st ? "bored" : "neutral"} look={lk as number} tilt={F >= tw ? (i ? -10 : 10) : 0} blink={blink(F, 14 + i)}
            lh={[-70, -20]} rh={[70, -20]} />
        </g>
      ))}
      <Label x={540} y={1000} text="12 YEARS" size={110} k={pop(F, tw)} col="#ffd23a" />
      {/* cobwebs creep in */}
      <g opacity={clamp01((F - tw - 40) / 40)} stroke="#f4f1ea" strokeWidth={4} fill="none">
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M0,${80 + k * 70} Q${60 + k * 40},${60 + k * 60} ${80 + k * 70},0`} />)}
        <path d="M0,0 L320,320 M0,160 L200,200 M160,0 L200,200" />
      </g>
    </Frame>
  );
};

/* 18 ─ "They threw parties, and held sports days together." */
const S18: React.FC<SP> = ({ F, f }) => {
  const pa = at(9, "parties"), sp = at(9, "sports");
  const hop = (k: number) => Math.abs(Math.sin((F + k) * 0.32)) * 70;
  return (
    <Frame cam={{ z: creep(f, 0.03), cy: 1200 }}>
      <CampBG f={F} />
      <Bunting y={360} f={F} /><Bunting y={560} f={F + 10} cols={["#2d3f86", "#f4f1ea", "#c8323a"]} />
      {F < sp - 2 ? (<g>
        <Bean idle={F} x={330} y={1620 + bob(f, 6, 18)} s={1.3} o={BLUECOAT} expr="grin" look={0.5} lh={[-120, 0]} rh={[180, -340]} rpose="fist" blink={blink(F, 15)} />
        <Bean idle={F} x={760} y={1620 + bob(f, 6, 18, 9)} s={1.3} o={REDCOAT} expr="grin" look={-0.5} lh={[-180, -340]} lpose="fist" rh={[120, 0]} blink={blink(F, 16)} />
        {[[330 + 180 * 1.3, 1620 - 340 * 1.3], [760 - 180 * 1.3, 1620 - 340 * 1.3]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y - 60})`}><Part d="M-34,-60 L34,-60 L30,40 L-30,40 Z" fill="#e9c35a" sw={7} /><path d="M-34,-60 C-30,-84 30,-84 34,-60" fill="#fff" stroke={INK} strokeWidth={6} /></g>
        ))}
        <Burst x={545} y={1000} r={90} text="CHEERS!" k={pop(F, pa)} rot={-4} />
      </g>) : (<g>
        {[[330, BLUECOAT, 0], [760, REDCOAT, 11]].map(([x, o, k], i) => (
          <g key={i} transform={`translate(0,${-hop(k as number)})`}>
            <Bean idle={F} x={x as number} y={1560} s={1.2} o={o as typeof BLUECOAT} expr="grin" look={0} lh={[-110, -20]} rh={[110, -20]} legs={false} blink={blink(F, 17 + i)} />
            <Part d={`M${(x as number) - 160},${1500} L${(x as number) + 160},1500 L${(x as number) + 150},1800 L${(x as number) - 150},1800 Z`} fill="#c9ab76" sw={9} off={[16, 18]} />
          </g>
        ))}
        <Label x={540} y={1000} text="SACK RACE!" size={100} k={pop(F, sp)} col="#ffd23a" />
      </g>)}
    </Frame>
  );
};

/* 19 ─ "In 1872, the German Kaiser was asked to settle it... and he gave the island to America." */
const S19: React.FC<SP> = ({ F, f }) => {
  const y72 = at(10, "1872,"), ks = at(10, "kaiser"), gv = at(10, "gave"), am = at(10, "america.");
  return (
    <Frame cam={{ z: creep(f, 0.04, 200), cy: 1200 }}>
      <PalaceBG f={F} />
      <Bean idle={F} x={540} y={1500 + bob(f, 3)} s={1.4} o={KAISER} expr={F >= gv ? "smug" : "bored"} look={F >= gv ? 0.4 : 0} blink={blink(F, 18)}
        lh={[-160, 0]} rh={F >= gv - 2 ? [230, -260] : [160, 0]} rpose={F >= gv - 2 ? "point" : "rest"} talk={talk(F, ks + 10, gv - 4)} />
      <Label x={540} y={330} text="1872" size={170} k={pop(F, y72)} col="#ffd23a" />
      <Label x={540} y={480} text="KAISER WILHELM I" size={74} k={pop(F, ks)} />
      <g transform={`translate(860,${980 + rise(F, gv, 600, 9)}) scale(${pop(F, gv)})`}>
        <Part d="M-150,-110 L150,-110 L150,110 L-150,110 Z" fill="#f4f1ea" sw={9} off={[10, 12]} />
        <Part d="M-90,-30 C-80,-60 -10,-70 30,-50 C80,-30 100,10 80,40 C60,70 0,80 -40,70 C-90,60 -110,20 -90,-30 Z" fill="#f2c94c" sw={7} off={[8, 8]} />
        <Flag x={20} y={-200} s={0.4} kind="us" f={F} pole={150} />
        <text x={0} y={100} textAnchor="middle" fontFamily={COMIC} fontSize={34} fill={INK}>SAN JUAN</text>
      </g>
      <Label x={860} y={1240} text="→ U.S.A." size={80} k={pop(F, am)} col="#9ec5ff" />
    </Frame>
  );
};

/* 20 ─ "Total casualties of the war? One pig." */
const S20: React.FC<SP> = ({ F, f }) => (
  <Frame cam={{ z: creep(f, 0.04), cy: 1250 }}>
    <GraveBG f={F} />
    <Grave x={540} y={1460} s={1.5} />
    {[...Array(5)].map((_, i) => <g key={i} transform={`translate(${380 + i * 80},1470)`}><path d="M0,0 L0,-60" stroke="#3d6a2c" strokeWidth={6} /><circle cx={0} cy={-66} r={16} fill={["#f2c94c", "#e8657a", "#f4f1ea"][i % 3]} stroke={INK} strokeWidth={5} /></g>)}
    <Bean idle={F} x={170} y={1680 + bob(f, 2)} s={1.15} o={BLUECOAT} expr="sad" look={0.5} lh={[-60, -120]} rh={[60, -120]} blink={blink(F, 19)} />
    <Bean idle={F} x={910} y={1680 + bob(f, 2, 46, 12)} s={1.15} o={REDCOAT} expr="sad" look={-0.5} lh={[-60, -120]} rh={[60, -120]} blink={blink(F, 20)} />
    <Label x={540} y={420} text={"TOTAL\nCASUALTIES:"} size={110} k={pop(F, at(11, "casualties"))} />
  </Frame>
);

/* 21 ─ "Send this to the friend who overreacts about everything." */
const S21: React.FC<SP> = ({ F, f }) => {
  const fr2 = at(12, "friend"), ov = at(12, "overreacts");
  return (
    <Frame cam={{ z: creep(f, 0.04), cy: 1150 }}>
      <BayBG f={F} horizon={1000} />
      <path d="M-600,1520 C200,1490 800,1500 1700,1490 L1700,2600 L-600,2600 Z" fill="#e3cf9a" stroke={INK} strokeWidth={8} />
      <GhostPig x={540} y={1180} s={1.5} f={F} expr="happy" />
      <Bean idle={F} x={170} y={1700} s={1.05} o={BLUECOAT} expr={F >= ov ? "yell" : "neutral"} look={0.5} lh={[-60, -120]} rh={F >= ov ? [150, -320] : [60, -120]} rpose="fist" blink={blink(F, 21)} />
      <Bean idle={F} x={910} y={1700} s={1.05} o={REDCOAT} expr={F >= ov ? "yell" : "neutral"} look={-0.5} lh={F >= ov ? [-150, -320] : [-60, -120]} lpose="fist" rh={[60, -120]} blink={blink(F, 22)} />
      <Label x={540} y={420} text="SEND TO" size={110} k={pop(F, fr2)} col="#ffd23a" />
      <Label x={540} y={540} text="THAT FRIEND" size={110} k={pop(F, fr2 + 5)} col="#ffd23a" />
    </Frame>
  );
};

export const SHOT2D: Record<number, React.FC<SP>> = { 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16, 17: S17, 18: S18, 19: S19, 20: S20, 21: S21 };
/** render the shot covering absolute frame F */
export const ShotAt: React.FC<{ F: number }> = ({ F }) => {
  const s = SHOTS.find((x) => F >= x.a && F < x.b) ?? SHOTS[SHOTS.length - 1];
  const C = SHOT2D[s.id];
  return <C F={F} f={F - s.a} />;
};
