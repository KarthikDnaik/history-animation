// The race clock shared by staging (sets.ts) and cameras (cams.ts): where Sweet Kiss is along the course in each race shot.
import { SHOTS, FPS, at } from "./story";
export const FINISH = 34;
export const kissX = (rt: number) => -64 + 12.5 * rt;
const t0 = (id: number) => SHOTS[id - 1].a / FPS;
const t1 = (id: number) => SHOTS[id - 1].b / FPS;
const RT0 = 7.36;   // hook: Sweet Kiss at x = 28, slow motion to the post
export const RT: Record<number, (t: number) => number> = {
  1: (t) => RT0 + 0.25 * t,
  10: (t) => Math.max(0, t - t0(10) - 0.5) * 0.85,
  11: (t) => 2.4 + 0.5 * (t - t0(11)),
  12: (t) => 2.8 + 0.6 * (t - t0(12)),
  13: (t) => 3.0 + 0.9 * (t - t0(13)),
  14: (t) => (FINISH + 64) / 12.5 + 1.04 * (t - at(6, "first!")),
  23: (t) => RT0 + 0.25 * (t - t1(23)),
};
export const kissAt = (id: number, t: number) => kissX(RT[id](t));
