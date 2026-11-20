// node poster.cjs <hero relativ zu daily/> <tag> <line> <outPrefix>  -> <outPrefix>_Schmacher.jpg / _Russinov.jpg
const { chromium } = require('playwright'); const path = require('path');
const [hero, tag, line, out] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: process.env.V ? 1920 : 1350 } });
  for (const [k, n] of [['s', 'Schmacher'], ['r', 'Russinov']]) {
    const u = 'file://' + path.join(__dirname, 'poster.html') + '?' + new URLSearchParams(Object.assign({ b: k, hero, tag, line }, process.env.V ? { v: '1' } : {}, process.env.CUT ? { cut: process.env.CUT } : {}));
    await p.goto(u); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}_${n}.jpg`, type: 'jpeg', quality: 92 }); }
  await b.close(); })();
