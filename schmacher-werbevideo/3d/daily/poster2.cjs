// node poster2.cjs <outPrefix> [kick] [h1] [h2]   Env: V=1 (9:16), HERO=<Bild relativ zu daily/>, CUT=<Schnittbild>
// Kräftige, dunkle Vorlage (Stilregel ab 28.11.2026) -> <outPrefix>_Schmacher.jpg / _Russinov.jpg
const { chromium } = require('playwright'); const path = require('path');
const [out, kick, h1, h2] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: process.env.V ? 1920 : 1350 } });
  for (const [k, n] of [['s', 'Schmacher'], ['r', 'Russinov']]) {
    const o = { b: k }; if (kick) o.kick = kick; if (h1) o.h1 = h1; if (h2) o.h2 = h2; if (process.env.V) o.v = '1'; if (process.env.HERO) o.hero = process.env.HERO; if (process.env.CUT) o.cut = process.env.CUT;
    await p.goto('file://' + path.join(__dirname, 'poster2.html') + '?' + new URLSearchParams(o)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}_${n}.jpg`, type: 'jpeg', quality: 92 }); }
  await b.close(); })();
