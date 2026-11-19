// Schnittansicht fürs Vorschaubild: node cut.cjs <w> <h> <cam> <tgt> <fov> <out.jpg>  → druckt Bildschirmpositionen der Beschriftungspunkte (JSON)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname; const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
const PTS = { buero: [23.4, 3.7, -12.6], wc: [26.84, 5.0, -10.0], kueche: [26.84, 3.9, -12.15], lager: [27.0, 4.2, -4.0], halle: [22.7, 0.05, -4.6], tor: [25.09, 3.6, -0.15] };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const [w, h, cam, tgt, fov, out] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto(`http://localhost:${port}/index.html?scale=1.5&ao=1&w=${w}&h=${h}&notitles=1&film=2&cut=1${process.env.SIDE ? '&side=1' : ''}&cam=${cam}&tgt=${tgt}&fov=${fov}`);
  await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 }); await p.waitForTimeout(500);
  await p.evaluate(() => window.renderAt(1.0));
  await p.screenshot({ path: out, type: 'jpeg', quality: 95, timeout: 300000 });
  const pr = await p.evaluate(P => { const k = Object.keys(P); const v = window.cutProject(Object.values(P)); return Object.fromEntries(k.map((x, i) => [x, v[i].map(Math.round)])); }, PTS);
  console.log(JSON.stringify(pr)); await b.close(); srv.close();
})();
