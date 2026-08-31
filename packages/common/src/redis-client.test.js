const test = require('node:test');
const assert = require('node:assert/strict');
const { RedisJsonCache } = require('./redis-client');

const silentLogger = { warn: () => {} };

const createFakeClient = (values = new Map()) => ({
  isOpen: false,
  isReady: false,
  on: () => {},
  async connect() {
    this.isOpen = true;
    this.isReady = true;
  },
  async get(key) {
    return values.has(key) ? values.get(key) : null;
  },
  async set(key, value) {
    values.set(key, value);
  },
  async del(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.reduce((count, key) => count + Number(values.delete(key)), 0);
  },
  async disconnect() {
    this.isOpen = false;
    this.isReady = false;
  },
  async quit() {
    this.isOpen = false;
    this.isReady = false;
  }
});

test('RedisJsonCache reads and writes JSON values through one lazy connection', async () => {
  const values = new Map();
  let clientsCreated = 0;
  const cache = new RedisJsonCache({
    url: 'redis://test',
    cacheName: 'test-cache',
    clientFactory: () => {
      clientsCreated += 1;
      return createFakeClient(values);
    },
    serviceLogger: silentLogger
  });

  assert.equal(await cache.getJson('missing'), undefined);
  assert.equal(await cache.setJson('doctor', { id: 'doctor-id' }, 60), true);
  assert.deepEqual(await cache.getJson('doctor'), { id: 'doctor-id' });
  assert.equal(clientsCreated, 1);
  assert.equal(cache.status(), 'ready');
});

test('RedisJsonCache fails open and waits before retrying an unavailable cache', async () => {
  let connectAttempts = 0;
  let now = 1000;
  const cache = new RedisJsonCache({
    url: 'redis://unavailable',
    cacheName: 'test-cache',
    retryCooldownMs: 5000,
    now: () => now,
    clientFactory: () => ({
      isOpen: false,
      on: () => {},
      connect: async () => {
        connectAttempts += 1;
        throw new Error('connection refused');
      }
    }),
    serviceLogger: silentLogger
  });

  assert.equal(await cache.getJson('doctor'), undefined);
  assert.equal(await cache.getJson('doctor'), undefined);
  assert.equal(connectAttempts, 1);
  assert.equal(cache.status(), 'degraded');

  now += 5001;
  assert.equal(await cache.getJson('doctor'), undefined);
  assert.equal(connectAttempts, 2);
});

test('RedisJsonCache removes malformed cached JSON instead of returning it', async () => {
  const values = new Map([['broken', '{not-json']]);
  const cache = new RedisJsonCache({
    url: 'redis://test',
    cacheName: 'test-cache',
    clientFactory: () => createFakeClient(values),
    serviceLogger: silentLogger
  });

  assert.equal(await cache.getJson('broken'), undefined);
  assert.equal(values.has('broken'), false);
});
