import http from 'node:http';
import { readFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };

export function createGameServer({ autoStop = false, closeDelay = 5000, startupTimeout = 90000, onStop = () => {} } = {}) {
  const sessions = new Set();
  let shutdownTimer, startupTimer, hasOpened = false, stopping = false;
  const cancelShutdown = () => { clearTimeout(shutdownTimer); shutdownTimer = undefined; };
  const stop = () => {
    if (stopping) return;
    stopping = true;
    cancelShutdown(); clearTimeout(startupTimer);
    for (const session of sessions) session.end();
    server.close(() => onStop());
    // Browsers may preconnect a replacement socket after an SSE disconnect.
    // It has no request yet, so closeIdleConnections alone cannot close it.
    server.closeAllConnections();
  };
  const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/__session/status') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ managed: autoStop, clients: sessions.size })); return;
    }
    if (pathname === '/__session/live') {
      if (!autoStop || stopping) { res.writeHead(204); res.end(); return; }
      hasOpened = true;
      clearTimeout(startupTimer); cancelShutdown();
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders(); res.write(': night-window-open\n\n');
      sessions.add(res);
      const ping = setInterval(() => res.write(': still-here\n\n'), 15000);
      res.on('close', () => {
        clearInterval(ping); sessions.delete(res);
        if (autoStop && hasOpened && sessions.size === 0 && !stopping) {
          cancelShutdown(); shutdownTimer = setTimeout(stop, closeDelay);
        }
      });
      return;
    }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
  });
  server.on('listening', () => {
    if (autoStop && !hasOpened) startupTimer = setTimeout(stop, startupTimeout);
  });
  server.on('close', () => { cancelShutdown(); clearTimeout(startupTimer); });
  return { server, stop };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const autoStop = process.env.AFTER_HOURS_AUTO_STOP === '1';
  const pidFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '.after-hours-server.json');
  const { server, stop } = createGameServer({ autoStop, onStop: async () => {
    try {
      const record = JSON.parse(await readFile(pidFile, 'utf8'));
      if (record.pid === process.pid) await unlink(pidFile);
    } catch {}
    console.log('夜航窗口已关闭，服务已停止。浏览器存档会保留。');
  } });
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  server.listen(port, '127.0.0.1', () => console.log(`夜航已启动：http://127.0.0.1:${port}\n${autoStop ? '关闭所有夜航专用窗口后自动停止。' : '按 Ctrl+C 停止。'}`));
  server.on('error', err => { console.error(err.message); process.exitCode = 1; });
}
