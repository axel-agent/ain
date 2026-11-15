// Rendert Einzelbilder: node render.cjs <out-dir> <t0> <t1> <fps> [scale] [ao] | node render.cjs --still t1,t2,...
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const a = process.argv.slice(2);
  const still = a[0] === '--still';
  const out = still ? a[2] || 'out/stills' : a[0]; fs.mkdirSync(out, { recursive: true });
  const scale = still ? (a[3] || '1') : (a[4] || '1'), ao = still ? (a[4] || '1') : (a[5] || '1');
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text()); }); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(`http://localhost:${port}/index.html?scale=${scale}&ao=${ao === '0' ? 0 : 1}`);
  await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  await p.waitForTimeout(500);
  const times = still ? a[1].split(',').map(Number) : (() => { const t0 = +a[1], t1 = +a[2], fps = +a[3]; const r = []; for (let f = Math.round(t0 * fps); f < Math.round(t1 * fps); f++) r.push(f / fps); return r; })();
  const fps = still ? 0 : +a[3];
  for (const t of times) {
    const st = Date.now();
    await p.evaluate(t => window.renderAt(t), t);
    const name = still ? `t${t.toFixed(2)}.jpg` : `f${String(Math.round(t * fps)).padStart(5, '0')}.jpg`;
    await p.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    console.log(name, ((Date.now() - st) / 1000).toFixed(1) + 's');
  }
  await b.close(); srv.close();
})();
