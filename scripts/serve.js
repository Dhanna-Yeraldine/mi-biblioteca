/**
 * Servidor estático mínimo, sin dependencias.
 * Hace falta porque los módulos ES (import/export) no cargan desde file://.
 * Uso: npm start  →  http://localhost:3000  (cambia el puerto con PORT=4000)
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname);
  const filePath = normalize(join(ROOT, relativePath));

  // Evita salir de la carpeta del proyecto con rutas como /../../secreto.txt
  if (!filePath.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
    response.writeHead(403).end('Prohibido');
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`Mi Biblioteca corriendo en http://localhost:${PORT}`);
});
