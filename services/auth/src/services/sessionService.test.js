const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessionService } = require('./sessionService');

const user = { id: 'user-id', email: 'patient@example.com', role: 'PATIENT' };
const fixedNow = new Date('2026-08-29T00:00:00.000Z');
const later = new Date('2026-09-28T00:00:00.000Z');

test('session issue stores only a refresh hash and returns both credentials', async () => {
  let stored;
  const service = createSessionService({
    access: { generate: () => 'access-token' },
    refresh: { generate: () => 'raw-refresh', hash: () => 'sha256-digest', expiresAt: () => later },
    storedTokens: { create: async (data) => { stored = data; } },
    now: () => fixedNow
  });

  const result = await service.issue(user);
  assert.equal(stored.tokenHash, 'sha256-digest');
  assert.notEqual(stored.tokenHash, result.refreshToken);
  assert.deepEqual(result, { token: 'access-token', refreshToken: 'raw-refresh', refreshExpiresAt: later });
});

test('refresh rotates once and returns the current database user role', async () => {
  let rotation;
  const service = createSessionService({
    access: { generate: (id, role) => `${id}:${role}` },
    refresh: { generate: () => 'next-refresh', hash: (value) => `hash:${value}`, expiresAt: () => later },
    storedTokens: {
      findByHash: async () => ({ id: 'current', userId: user.id, user, expiresAt: later, revokedAt: null }),
      rotate: async (data) => { rotation = data; },
      revokeAllForUser: async () => {}
    },
    now: () => fixedNow
  });

  const result = await service.refresh('current-refresh');
  assert.equal(rotation.currentId, 'current');
  assert.equal(rotation.tokenHash, 'hash:next-refresh');
  assert.equal(result.token, 'user-id:PATIENT');
  assert.equal(result.refreshToken, 'next-refresh');
});

test('reused revoked refresh token revokes the active token family', async () => {
  let revokedUser;
  const service = createSessionService({
    access: { generate: () => 'unused' },
    refresh: { generate: () => 'unused', hash: () => 'hash', expiresAt: () => later },
    storedTokens: {
      findByHash: async () => ({ id: 'old', userId: user.id, user, expiresAt: later, revokedAt: fixedNow }),
      revokeAllForUser: async (userId) => { revokedUser = userId; }
    },
    now: () => fixedNow
  });

  await assert.rejects(service.refresh('replayed'), { statusCode: 401 });
  assert.equal(revokedUser, user.id);
});

test('logout is idempotent when no refresh cookie exists', async () => {
  let calls = 0;
  const service = createSessionService({
    access: {}, refresh: { hash: () => 'hash' },
    storedTokens: { revokeByHash: async () => { calls += 1; } },
    now: () => fixedNow
  });
  await service.revoke(null);
  assert.equal(calls, 0);
});
