// Rendert Titelkarten als transparente PNGs: node make_titles.cjs [V|16]
// V: titlesV.html -> titlesV/*.png (1080x1920) · 16: titles16.html -> titles16/*.png (1920x1080)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const CFG = {
  '16m': ['titles16m.html', 'titles16m', 1920, 1080, ['cover', 'hook', 'slogan', 'code', 'units', 'tech', 'end', 'endcta', 'stell', 'deins', 'lager2', 'buero2', 'kueche', 'hallen2', 'lager3', 'tor', 'end3', 'end3cta', 'cover2']],
  Vm: ['titlesVm.html', 'titlesVm', 1080, 1920, ['cover', 'hook', 'slogan', 'code', 'lager', 'hoehe', 'buero', 'hallen', 'end', 'endcta', 'stell', 'deins', 'lager2', 'buero2', 'kueche', 'hallen2', 'lager3', 'tor', 'end3', 'end3cta', 'cover2']],
  '45m': ['titles45m.html', 'titles45m', 1080, 1350, ['cover2']], V: ['titlesV.html', 'titlesV', 1080, 1920, ['cover', 'hook', 'slogan', 'code', 'lager', 'hoehe', 'buero', 'hallen', 'end', 'endcta', 'stell', 'deins', 'lager2', 'buero2', 'kueche', 'hallen2', 'end2', 'lager3', 'tor', 'end3', 'end3cta', 'cover2']],
              45: ['titles45.html', 'titles45', 1080, 1350, ['cover2']],
              16: ['titles16.html', 'titles16', 1920, 1080, ['cover', 'hook', 'slogan', 'code', 'units', 'tech', 'end', 'endcta', 'stell', 'deins', 'lager2', 'buero2', 'kueche', 'hallen2', 'end2', 'lager3', 'tor', 'end3', 'end3cta', 'cover2']] };
(async () => {
  const b = await chromium.launch();
  for (const k of process.argv.length > 2 ? process.argv.slice(2) : ['V', '16']) {
    const [file, dir, w, h, ids] = CFG[k]; fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + path.join(__dirname, file)); await p.waitForTimeout(500);
    for (const id of ids) {
      await p.evaluate(id => { document.body.className = (id === 'end' || id === 'end2' || id === 'end3') ? 'nocta' : id === 'endcta' ? 'ctaonly' : '';
        document.querySelectorAll('.on').forEach(e => e.classList.remove('on')); document.getElementById(id === 'endcta' ? 'end' : id === 'end3cta' ? 'end3' : id).classList.add('on'); }, id);
      await p.screenshot({ path: path.join(__dirname, dir, id + '.png'), omitBackground: true });
    }
    await p.close();
  }
  await b.close();
})();
