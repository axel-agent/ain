const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const f = 'file:///home/user/ain/schmacher-werbevideo/3d/daily/d6_titles.html';
  for (const id of ['z1','z2','z3','z4','z5','z6','z7','z8','end_s','end_r']) {
    await p.goto(`${f}?s=${id}`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: `/home/user/ain/schmacher-werbevideo/3d/daily/d6_titles/${id}.png`, omitBackground: true }); }
  await b.close(); })();
