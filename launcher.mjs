import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeFile, readFile, unlink, access, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const pidFile = path.join(root, '.after-hours-server.json');
const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;
const stop = process.argv.includes('--stop');
const noOpen = process.argv.includes('--no-open');
const browserProfile = path.join(root, '.night-browser');

async function findBrowser() {
  const candidates = [
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  for (const candidate of candidates) { try { await access(candidate); return candidate; } catch {} }
  throw new Error('未找到 Edge 或 Chrome。请安装其中一个浏览器后再双击启动。');
}

async function stopRecordedServer() {
  let info;
  try { info = JSON.parse(await readFile(pidFile, 'utf8')); }
  catch { return false; }
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const expected = path.join(root, 'server.mjs');
  if (!Number.isInteger(info.pid) || info.pid <= 0 || info.server !== expected || (info.port ?? 4173) !== port) throw new Error('服务记录无效或端口不匹配，未停止任何程序。');
  const script = `$p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${info.pid}'; if ($p) { $p.CommandLine }`;
  const { stdout } = await promisify(execFile)('powershell.exe', ['-NoProfile', '-Command', script], { windowsHide: true });
  if (stdout.trim()) {
    if (!stdout.includes(expected)) throw new Error('服务进程已变化，未停止其他程序。');
    process.kill(info.pid);
  }
  await unlink(pidFile).catch(() => {});
  for (let i = 0; i < 30; i++) { if (await check() === 'offline') break; await new Promise(resolve => setTimeout(resolve, 100)); }
  return true;
}

async function check() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (!response.ok || !(await response.text()).includes('<title>夜航 AFTER HOURS · VRChat 人生模拟器</title>')) return 'occupied';
    try {
      const status = await fetch(new URL('__session/status', url), { signal: AbortSignal.timeout(1500) });
      return status.ok && (await status.json()).managed ? 'managed' : 'ready';
    } catch { return 'ready'; }
  } catch (error) { return error.cause?.code === 'ECONNREFUSED' ? 'offline' : 'unknown'; }
}

try {
  if (stop) {
    console.log(await stopRecordedServer() ? '夜航服务已停止。你的浏览器存档会保留。' : '没有找到由启动器运行的服务。');
  } else {
    const browserPath = noOpen ? null : await findBrowser();
    let status = await check();
    if (status === 'occupied') throw new Error(`端口 ${port} 被其他服务占用，请关闭占用程序或更换端口。`);
    if (status === 'ready' && !noOpen) {
      if (!await stopRecordedServer()) throw new Error('当前服务是手动启动的。请先关闭原服务窗口，再双击启动夜航。');
      status = await check();
    }
    if (!['ready', 'managed'].includes(status)) {
      const server = path.join(root, 'server.mjs');
      const child = spawn(process.execPath, [server], { cwd: root, detached: true, windowsHide: true, stdio: 'ignore', env: { ...process.env, AFTER_HOURS_AUTO_STOP: noOpen ? '0' : '1' } });
      await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
      child.unref();
      await writeFile(pidFile, JSON.stringify({ pid: child.pid, server, port, managed: !noOpen }));
      for (let i = 0; i < 40; i++) {
        status = await check();
        if (['ready', 'managed'].includes(status)) break;
        if (status === 'occupied') throw new Error(`端口 ${port} 被其他服务占用。`);
        await new Promise(resolve => setTimeout(resolve, 125));
      }
      if (!['ready', 'managed'].includes(status)) throw new Error('服务未能启动，请确认 Node.js 可用，并检查端口是否被占用。');
    }
    console.log(`夜航已就绪：${url}\n${noOpen ? '手动预览模式；请使用停止夜航关闭服务。' : '关闭所有夜航专用窗口后，服务会在约 5 秒内自动停止。'}`);
    if (!noOpen) {
      await mkdir(browserProfile, { recursive: true });
      const browser = spawn(browserPath, [`--app=${url}?desktop=1`, `--user-data-dir=${browserProfile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-mode'], { detached: true, windowsHide: false, stdio: 'ignore' });
      try {
        await new Promise((resolve, reject) => { browser.once('spawn', resolve); browser.once('error', reject); });
        browser.unref();
      } catch (error) { await stopRecordedServer(); throw error; }
    }
  }
} catch (error) {
  console.error(error.message);
  await appendFile(path.join(root, '启动错误.log'), `${new Date().toISOString()} ${error.message}\n`).catch(() => {});
  process.exitCode = 1;
}
