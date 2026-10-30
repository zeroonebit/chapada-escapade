#!/usr/bin/env node
// tests/serve.cjs — servidor estático mínimo pra suíte Playwright.
// Serve a raiz do repo (index.html + js/ + assets/) em 127.0.0.1:<porta>.
// Zero dependências: o jogo não tem build, só precisa de um HTTP server.
// Uso: node tests/serve.cjs 8787
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || 8787);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.cjs':  'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.wav':  'audio/wav',
    '.mp3':  'audio/mpeg',
    '.ogg':  'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt':  'text/plain; charset=utf-8',
    '.md':   'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
    let urlPath;
    try {
        urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch (e) {
        res.writeHead(400); res.end('bad request'); return;
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const file = path.normalize(path.join(ROOT, urlPath));
    // Nunca sai da raiz do repo
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }

    fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
        const ext = path.extname(file).toLowerCase();
        const headers = {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Content-Length': st.size,
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
        };
        if (req.method === 'HEAD') { res.writeHead(200, headers); res.end(); return; }
        res.writeHead(200, headers);
        fs.createReadStream(file).pipe(res);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[serve] ${ROOT} em http://127.0.0.1:${PORT}/`);
});
