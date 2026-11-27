// Theatre.js (@theatre/core) camera moves: keyframes with real bezier easing (anticipation / overshoot-settle / ease-out),
// evaluated headlessly per frame by setting the sequence position, so every frame is a pure function of time.
// cams.ts registers moves at module load; the project (one sheet, one object per move) is created on first use.
import { getProject, types, ISheetObject } from "@theatre/core";
import { V3, Shot, FPS } from "./story";

export type Ease = "io" | "out" | "back" | "in" | "antic" | "lin";
export type TKey = { t: number; pos: V3; look: V3; fov?: number; roll?: number; ease?: Ease };
// cubic-bezier control points (P1, P2) per easing, applied to the segment that ENDS on the key
const BZ: Record<Ease, [number, number, number, number]> = {
  io: [0.42, 0, 0.58, 1], out: [0.33, 1, 0.68, 1], back: [0.34, 1.56, 0.64, 1], in: [0.32, 0, 0.67, 0],
  antic: [0.36, 0, 0.66, -0.56], lin: [0.25, 0.25, 0.75, 0.75],
};
const PROPS = ["px", "py", "pz", "lx", "ly", "lz", "fov", "roll"] as const;
type Move = { name: string; f0: number; keys: TKey[] };
const MOVES: Move[] = [];
let OBJ: Record<string, ISheetObject<Record<(typeof PROPS)[number], number>>> | null = null;
let SEQ: { position: number } | null = null;

const vals = (k: TKey) => [k.pos[0], k.pos[1], k.pos[2], k.look[0], k.look[1], k.look[2], k.fov ?? 44, k.roll ?? 0];
const build = () => {
  const tracksByObject: Record<string, unknown> = {};
  let len = 1;
  for (const m of MOVES) {
    const trackData: Record<string, unknown> = {}, trackIdByPropPath: Record<string, string> = {};
    PROPS.forEach((p, pi) => {
      const id = `${m.name}_${p}`;
      trackIdByPropPath[`["${p}"]`] = id;
      trackData[id] = {
        type: "BasicKeyframedTrack",
        keyframes: m.keys.map((k, i) => {
          const next = m.keys[i + 1], inE = BZ[k.ease ?? "io"], outE = BZ[next?.ease ?? "io"];
          len = Math.max(len, k.t + 1);
          // handles: [left x, left y, right x, right y]; the segment i -> i+1 uses right of i (P1) and left of i+1 (P2)
          return { id: `${id}_${i}`, position: k.t, connectedRight: !!next, type: "bezier", value: vals(k)[pi], handles: [inE[2], inE[3], outE[0], outE[1]] };
        }),
      };
    });
    tracksByObject[m.name] = { trackData, trackIdByPropPath };
  }
  const state = { sheetsById: { Main: { staticOverrides: { byObject: {} }, sequence: { subUnitsPerUnit: FPS, length: len, type: "PositionalSequence", tracksByObject } } }, definitionVersion: "0.4.0", revisionHistory: [] };
  const project = getProject("LarryCams", { state });
  const sheet = project.sheet("Main");
  OBJ = {};
  for (const m of MOVES) OBJ[m.name] = sheet.object(m.name, Object.fromEntries(PROPS.map((p) => [p, types.number(0)])) as Record<(typeof PROPS)[number], ReturnType<typeof types.number>>) as never;
  SEQ = sheet.sequence as unknown as { position: number };
};
/** a Theatre-driven camera move starting at frame f0; key times in seconds from f0 */
export const tcam = (name: string, f0: number, keys: TKey[]) => {
  MOVES.push({ name, f0, keys });
  return (f: number): Shot => {
    if (!OBJ) build();
    const t = Math.max(0, Math.min(keys[keys.length - 1].t, (f - f0) / FPS));
    SEQ!.position = t;
    const v = OBJ![name].value;
    return { pos: [v.px, v.py, v.pz], look: [v.lx, v.ly, v.lz], fov: v.fov, roll: v.roll };
  };
};
