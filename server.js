const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = __dirname;
const recordsDir = path.join(root, 'records');
const port = process.env.PORT || 8080;
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
fs.mkdirSync(recordsDir, { recursive: true });
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/records') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 15_000_000) req.destroy(); });
    req.on('end', () => { try { const record = JSON.parse(body); const safeId = String(record.id || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '_'); fs.writeFileSync(path.join(recordsDir, `${safeId}.json`), JSON.stringify(record, null, 2), 'utf8'); res.writeHead(201, { 'Content-Type':'application/json' }); res.end(JSON.stringify({ ok:true })); } catch (error) { res.writeHead(400); res.end('Invalid JSON'); } });
    return;
  }
  const requestPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(root) || filePath.includes(`${path.sep}records${path.sep}`)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (error, data) => { if (error) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' }); res.end(data); });
}).listen(port, () => console.log(`RMA demo: http://localhost:${port}`));
