const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const f = 'file:///home/user/ain/schmacher-werbevideo/3d/daily/d4_titles.html';
  for (const id of ['g0','r7','r6','r5','r4','r3','r2','r1','tc','td','te','tz','end_s','end_r']) {
    await p.goto(`${f}?s=${id}`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: `/home/user/ain/schmacher-werbevideo/3d/daily/d4_titles/${id}.png`, omitBackground: true }); }
  await b.close(); })();
