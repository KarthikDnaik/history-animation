// Editing layer learned from the reference reels (2026-11-10): motion-blur whips on in-scene cuts, spin-blur on place /
// time jumps, lower-third name tags, a black impact card for the biggest punchline, a mood grade for the dark beat.
// Everything is a pure function of the frame, keyed to narration words, so picture and sound (cues.json) agree.
import { SHOTS, at, atN, lineStart, lineEnd, fr } from "./story";

export type TKind = "whip" | "spin";
export type Trans = { f: number; kind: TKind; dir: 1 | -1 };
/** whip: 4 frames smearing out + 4 smearing in (~0.27 s); spin: 6 + 6 (~0.4 s). Cut lands on frame f. */
export const TLEN: Record<TKind, [number, number]> = { whip: [4, 4], spin: [6, 6] };

// Full 30 fps pass over the references: ~90 % of cuts are HARD cuts on a word; a motion-blur whip is used about once
// per 15 s on an energetic beat, a spin-blur only for a big jump in time. So: hard cuts by default, 3 whips, 2 spins.
const WHIP_AT = new Set([8, 10, 21]);
const SPIN_AT = new Set([4, 12, 18]);
export const TRANS: Trans[] = SHOTS.filter((s) => WHIP_AT.has(s.id) || SPIN_AT.has(s.id))
  .map((s, i) => ({ f: s.a, kind: SPIN_AT.has(s.id) ? "spin" : "whip", dir: i % 2 ? 1 : -1 }) as Trans);
/** hard cuts (for the sound pass: a light swish on place changes, nothing on same-set cuts) */
export const HARD: { f: number; place: boolean }[] = SHOTS.slice(1).filter((s) => !WHIP_AT.has(s.id) && !SPIN_AT.has(s.id))
  .map((s) => ({ f: s.a, place: SHOTS[s.id - 2].set !== s.set }));

/** frame -> { kind, dir, u } where u (0..1) is the blur strength, out = before the cut */
export const transAt = (f: number) => {
  for (const t of TRANS) {
    const [a, b] = TLEN[t.kind], k = f - t.f;
    if (k >= -a && k < 0) { const u = (k + a + 1) / a; return { ...t, out: true, u: u * u }; }
    if (k >= 0 && k < b) { const u = 1 - k / b; return { ...t, out: false, u: u * u }; }
  }
  return null;
};

/** lower-third name tags (fact-checked: Griffin ran the HBC's Belle Vue farm and owned the pig; Pickett led the 64
 *  men of the 9th Infantry; Rear Admiral Baynes refused Governor Douglas; Wilhelm I arbitrated in 1872) */
export type Tag = { a: number; b: number; name: string; sub: string; col: string };
const T = (a: number, dur: number, name: string, sub: string, col: string): Tag => ({ a: fr(a), b: fr(a + dur), name, sub, col });
// only where the scene has no name banner of its own (Cutlar, Griffin, Baynes and the Kaiser already get one)
export const TAGS: Tag[] = []; // every name already has an in-scene banner

/** dip to black on the biggest punchline (reference: "HALF A MILLION OF THEM"): the picture fades out over 8 f while
 *  the red caption stays, holds on black, then fades up over 6 f into the next shot */
export const IMPACT = { a: fr(atN(7, "he", 1) - 0.05), b: SHOTS[20].a, pre: "HE SURVIVED", text: "HE SURVIVED\nBOTH.", out: 8, up: 6, pig: fr(at(7, "both.") - 1 / 30) };

/** mood grade: the order to attack goes cold and dark; "He refused." snaps back to colour */
export const MOOD = { a: SHOTS[14].a, b: SHOTS[15].a }; // the freezing-water beat: cold, played straight

/** for the sound pass */
export const EDIT_CUES = { TRANS, HARD, TAGS, IMPACT, MOOD };
