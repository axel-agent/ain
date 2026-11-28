const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const f = 'file:///home/user/ain/schmacher-werbevideo/3d/daily/d9_titles.html';
  for (const id of ['p1','p2','p3','p4','p5','p6','p7','p8','end_s','end_r']) {
    await p.goto(`${f}?s=${id}`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: `/home/user/ain/schmacher-werbevideo/3d/daily/d9_titles/${id}.png`, omitBackground: true }); }
  await b.close(); })();
