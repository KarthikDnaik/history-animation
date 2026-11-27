// Animation helpers for the 2D puppets (reference motion: snappy pop-ins with overshoot, rise-from-bottom, slow creeping
// cameras, held poses with small breathing/bob, blinks, quick 3-4 frame pose changes).
import { at as atS, FPS } from "../pig/story";
export { FPS };
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ease = (u: number) => { const x = clamp01(u); return x * x * (3 - 2 * x); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
/** frame of a narration word (absolute) */
export const at = (line: number, w: string) => Math.round(atS(line, w) * FPS);
/** back-out overshoot pop 0 -> 1 over n frames starting f0 (scale 0 -> 1.12 -> 1) */
export const pop = (f: number, f0: number, n = 7) => {
  if (f < f0) return 0;
  const u = clamp01((f - f0 + 1) / n), c = 2.2;
  return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2;
};
/** quick pose switch: 0 before f0, 1 after f0+n (ease) */
export const sw = (f: number, f0: number, n = 4) => ease((f - f0 + 1) / n);
/** rise from below: returns y offset (px) */
export const rise = (f: number, f0: number, dist = 500, n = 9) => (1 - easeOut((f - f0 + 1) / n)) * dist;
/** breathing / idle bob */
export const bob = (f: number, amp = 4, per = 46, ph = 0) => Math.sin(((f + ph) / per) * Math.PI * 2) * amp;
/** blink every ~3 s (seeded), 3 frames */
export const blink = (f: number, seed = 0) => { const p = 84 + (seed * 37) % 40, k = (f + seed * 13) % p; return k >= p - 3; };
/** talking mouth (0..1) between frames a and b */
export const talk = (f: number, a: number, b: number, seed = 0) => (f >= a && f < b ? 0.25 + 0.75 * Math.abs(Math.sin((f + seed) * 0.9) * Math.sin((f + seed) * 0.37 + 1)) : 0);
/** piecewise keys: [[frame, value], ...] eased */
export const keys = (f: number, k: [number, number][]) => {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (f < k[i][0]) return lerp(k[i - 1][1], k[i][1], ease((f - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
};
/** shake (impact): decays over n frames */
export const shake = (f: number, f0: number, amp = 14, n = 8) => { const k = f - f0; return k >= 0 && k < n ? (k % 2 ? -1 : 1) * amp * (1 - k / n) : 0; };
