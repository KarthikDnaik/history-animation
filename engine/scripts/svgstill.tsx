// Fast 2D style iteration: render a pig2d scene at frame f to PNG without bundling Remotion.
// usage: npx tsx scripts/svgstill.tsx <SceneName> <frame> <out.png> [scale]
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as S from "../src/videos/pig2d/scenes";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
(async () => {
  const [name, f, out, sc] = process.argv.slice(2);
  const Comp = (S as any)[name];
  const svg = renderToStaticMarkup(<Comp f={+f} />);
  const html = `<!doctype html><html><head><style>html,body{margin:0;background:#000}
  @font-face{font-family:'Luckiest';src:url(data:font/woff2;base64,${require('fs').readFileSync('/home/claude/shorts/public/fonts/Luckiest.woff2').toString('base64')})}@font-face{font-family:'Inter Display';src:url(file:///usr/share/fonts/opentype/inter/InterDisplay-Black.otf);font-weight:900}</style></head><body>${svg}</body></html>`;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: +(sc || 0.5) });
  await p.setContent(html); await p.evaluate(() => (document as any).fonts.ready); await p.waitForTimeout(150); await p.screenshot({ path: out }); await b.close(); console.log(out);
})();
