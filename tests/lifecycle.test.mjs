import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createGameServer } from '../server.mjs';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function host(options = {}) {
  const game = createGameServer({ startupTimeout: 5000, ...options });
  const listening = once(game.server, 'listening');
  game.server.listen(0, '127.0.0.1');
  await listening;
  return { ...game, url: `http://127.0.0.1:${game.server.address().port}` };
}
async function openWindow(url) {
  const controller = new AbortController();
  const response = await fetch(`${url}/__session/live`, { signal: controller.signal });
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /night-window-open/);
  reader.releaseLock();
  return () => controller.abort();
}
async function status(url) { return (await fetch(`${url}/__session/status`)).json(); }

test('closing the only managed game window automatically closes the service', { timeout: 3000 }, async t => {
  const game = await host({ autoStop: true, closeDelay: 40 });
  t.after(game.stop);
  const closed = once(game.server, 'close');
  const closeWindow = await openWindow(game.url);
  assert.equal((await status(game.url)).clients, 1);
  closeWindow();
  await closed;
  await assert.rejects(fetch(game.url, { signal: AbortSignal.timeout(500) }));
});
test('refresh reconnects within the grace period, and another game window keeps the service alive', { timeout: 4000 }, async t => {
  const game = await host({ autoStop: true, closeDelay: 300 });
  t.after(game.stop);
  const first = await openWindow(game.url);
  first();
  await wait(35);
  const second = await openWindow(game.url);
  await wait(330);
  assert.equal(game.server.listening, true);
  assert.equal((await status(game.url)).clients, 1);
  const third = await openWindow(game.url);
  second();
  await wait(330);
  assert.equal(game.server.listening, true);
  assert.equal((await status(game.url)).clients, 1);
  const closed = once(game.server, 'close');
  third();
  await closed;
});
test('manual previews stay running and failed browser startup times out', { timeout: 3000 }, async t => {
  const manual = await host({ autoStop: false, startupTimeout: 30 });
  t.after(manual.stop);
  await wait(60);
  assert.equal(manual.server.listening, true);
  assert.equal((await status(manual.url)).managed, false);
  assert.equal((await fetch(`${manual.url}/__session/live`)).status, 204);
  const managed = await host({ autoStop: true, startupTimeout: 40 });
  t.after(managed.stop);
  const closed = once(managed.server, 'close');
  assert.equal((await fetch(managed.url)).status, 200);
  await closed;
  assert.equal(managed.server.listening, false);
});
