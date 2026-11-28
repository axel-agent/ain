// Prüft je Bild, ob das Fassadenschild sichtbar ist: VW=.. VH=.. QS=.. node probe.cjs <t0> <t1> <fps>
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const [t0, t1, fps] = process.argv.slice(2).map(Number);
  const VW = +(process.env.VW || 1920), VH = +(process.env.VH || 1080), EXTRA = process.env.QS || '';
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 320, height: 180 } });
  await p.goto(`http://localhost:${port}/index.html?scale=0.2&ao=0&w=${VW}&h=${VH}&probe=1${EXTRA}`);
  await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const fr = await p.evaluate(([t0, t1, fps]) => { const r = []; for (let f = Math.round(t0 * fps); f < Math.round(t1 * fps); f++) if (window.renderAt(f / fps)) r.push(f); return r; }, [t0, t1, fps]);
  // zu Bereichen zusammenfassen
  const rg = []; for (const f of fr) { if (rg.length && rg[rg.length - 1][1] === f - 1) rg[rg.length - 1][1] = f; else rg.push([f, f]); }
  console.log(JSON.stringify(rg)); await b.close(); srv.close();
})();
