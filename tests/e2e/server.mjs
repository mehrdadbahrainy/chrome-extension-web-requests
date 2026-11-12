import { createServer } from 'node:http';
const port = 4173;
const server = createServer((req, res) => {
  if (req.url?.startsWith('/api/ping')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.url?.startsWith('/api/missing')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><html><head><title>E2E target</title></head><body><h1>Request fixture</h1></body></html>');
});
server.listen(port, '127.0.0.1', () => console.log('E2E HTTP server ready on ' + port));
