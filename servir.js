// Servidor local mínimo para a prévia: `node servir.js` → http://localhost:5180
// Precisa dele porque módulos ES (<script type="module">) não carregam com o
// index.html aberto direto do disco.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
const PORTA = Number(process.env.PORT) || 5180;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const arq = path.resolve(RAIZ, '.' + p);
  if (!arq.startsWith(RAIZ) || arq.includes(`${path.sep}.git`)) { res.writeHead(404); return res.end(); }
  fs.readFile(arq, (erro, dados) => {
    if (erro) { res.writeHead(404); return res.end('não encontrado'); }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(dados);
  });
}).listen(PORTA, () => console.log(`Fluxograma Fácil em http://localhost:${PORTA}`));
