// Render many frames of the 2D Pig War (ShotAt) in one browser session. usage: npx tsx scripts/svgsheet.tsx <outdir> <scale> f1 f2 ...
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShotAt } from "../src/videos/pig2d/shots";
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
(async () => {
  const [dir, sc, ...fs_] = process.argv.slice(2);
  fs.mkdirSync(dir, { recursive: true });
  const font = fs.readFileSync("/home/claude/shorts/public/fonts/Luckiest.woff2").toString("base64");
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: +sc });
  for (const f of fs_.map(Number)) {
    const svg = renderToStaticMarkup(<ShotAt F={f} />);
    await p.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:#000}@font-face{font-family:'Luckiest';src:url(data:font/woff2;base64,${font})}</style></head><body>${svg}</body></html>`);
    await p.evaluate(() => (document as any).fonts.ready);
    await p.screenshot({ path: `${dir}/f_${String(f).padStart(4, "0")}.png` });
  }
  await b.close();
})();
