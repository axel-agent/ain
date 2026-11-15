// Rendert jede Titelkarte aus titlesV.html als transparentes 1080x1920-PNG nach titlesV/<id>.png
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'titlesV.html')); await p.waitForTimeout(400);
  for (const id of ['hook', 'slogan', 'code', 'lager', 'hoehe', 'buero', 'hallen', 'end']) {
    await p.evaluate(id => { document.querySelectorAll('.on').forEach(e => e.classList.remove('on')); document.getElementById(id).classList.add('on'); }, id);
    await p.screenshot({ path: path.join(__dirname, 'titlesV', id + '.png'), omitBackground: true });
  }
  await b.close();
})();
