// North Atlantic map plate (d3-geo + Natural Earth 50m land via world-atlas): cream land, teal sea, graticule,
// the Titanic's route drawing on from Southampton toward New York, the ship marker, the iceberg X, Carpathia's dash.
import React from "react";
import { geoConicConformal, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import land50 from "world-atlas/land-50m.json";
import { INK, RED, YEL, SANS, SERIF, clamp01, easeOut, pop } from "./kit";

const MW = 1000, MH = 1240;
const proj = geoConicConformal().parallels([38, 55]).rotate([28, 0]).center([0, 47]).scale(1500).translate([MW / 2, MH / 2]).clipExtent([[-40, -40], [MW + 40, MH + 40]]);
const path = geoPath(proj);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = feature(land50 as any, (land50 as any).objects.land) as any;
const LAND_D = path(LAND) ?? "";
const GRAT_D = path(geoGraticule10()) ?? "";
export const PLACES = {
  southampton: [-1.4, 50.9], queenstown: [-8.3, 51.85], newyork: [-74.0, 40.7], wreck: [-49.95, 41.73], carpathia: [-47.4, 41.0], halifax: [-63.6, 44.65],
} as const;
const P = (k: keyof typeof PLACES) => proj(PLACES[k] as [number, number])!;
const routeLL: [number, number][] = (() => {
  const legs: [number, number][][] = [[[-1.4, 50.9], [-5.5, 49.9]], [[-5.5, 49.9], [-8.3, 51.6]], [[-8.3, 51.6], [-49.95, 41.73]]];
  const out: [number, number][] = [];
  for (const [a, b] of legs) { const f = geoInterpolate(a, b); for (let i = 0; i <= 40; i++) out.push(f(i / 40)); }
  return out;
})();
const ROUTE = routeLL.map((ll) => proj(ll)!);
const routeD = (p: number) => { const n = Math.max(2, Math.round(p * (ROUTE.length - 1)) + 1); return "M" + ROUTE.slice(0, n).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L"); };
const toNY = (() => { const f = geoInterpolate([-49.95, 41.73], [-74.0, 40.7]); return Array.from({ length: 30 }, (_, i) => proj(f(i / 29))!); })();

export const AtlanticMap: React.FC<{ t: number; tRoute: number; tIce: number; tCarp?: number; night?: boolean }> = ({ t, tRoute, tIce, tCarp = 1e9, night = true }) => {
  const p = easeOut((t - tRoute) / 2.6), [sx, sy] = ROUTE[Math.min(ROUTE.length - 1, Math.round(p * (ROUTE.length - 1)))];
  const sea = night ? "#2a4d63" : "#9cc3c9", landC = night ? "#d9cfb6" : "#efe6d2", grat = night ? "rgba(220,235,255,0.14)" : "rgba(29,42,68,0.12)";
  const [wx, wy] = P("wreck"), [nx, ny] = P("newyork"), [hx, hy] = P("southampton"), [cx, cy] = P("carpathia");
  const ice = pop(t, tIce), carp = easeOut((t - tCarp) / 1.4);
  return (
    <div style={{ width: MW, height: MH, background: "#fbf7ee", padding: 16, boxSizing: "content-box", boxShadow: "0 30px 50px rgba(10,14,28,0.4)" }}>
      <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`} style={{ display: "block", background: sea }}>
        <path d={GRAT_D} fill="none" stroke={grat} strokeWidth={1.5} />
        <path d={LAND_D} fill={landC} stroke={INK} strokeWidth={2.2} />
        {/* dotted ghost of the planned route to New York */}
        <path d={"M" + toNY.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={p >= 1 ? 1 : 0} />
        <path d={routeD(p)} fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        {carp > 0 && <path d={`M${cx + 120},${cy + 90} L${cx + 120 - 120 * carp},${cy + 90 - 90 * carp}`} stroke="#ff9a6a" strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round" />}
        {[["SOUTHAMPTON", hx, hy, -1]].map(([s, x, y, side]) => (
          <g key={s as string}><circle cx={x as number} cy={y as number} r={9} fill={INK} stroke="#fff" strokeWidth={3} />
            <text x={(x as number) + (side as number) * 18} y={(y as number) + 44} fill={night ? "#f1e7d0" : INK} fontFamily={SANS} fontWeight={800} fontSize={30} textAnchor={(side as number) < 0 ? "end" : "start"}>{s as string}</text></g>
        ))}
        {/* the ship */}
        {p > 0 && <g transform={`translate(${sx},${sy})`}><circle r={16} fill={RED} stroke="#fff" strokeWidth={4} /><circle r={30 + 8 * Math.sin(t * 6)} fill="none" stroke={RED} strokeWidth={3} opacity={0.6} /></g>}
        {ice > 0 && <g transform={`translate(${wx},${wy - 70}) scale(${ice})`}>
          <path d="M-46,30 L-26,-28 L-6,-6 L10,-52 L34,-10 L50,30 Z" fill="#eef7ff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-40,62 L40,0 M-40,0 L40,62" stroke={RED} strokeWidth={12} strokeLinecap="round" transform="translate(0,26) scale(0.7)" opacity={clamp01((t - tIce - 0.2) / 0.1)} />
        </g>}
        {carp > 0.95 && <text x={cx + 30} y={cy + 140} fill="#ffd8c4" fontFamily={SERIF} fontWeight={700} fontStyle="italic" fontSize={30}>Carpathia</text>}
      </svg>
    </div>
  );
};
