const test = require('node:test');
const assert = require('node:assert/strict');
const { createRegistrationService } = require('./registrationService');
const { createAuthenticationService } = require('./authenticationService');

const silentLogger = { info: () => {} };

test('registration preserves validation order and response contract', async () => {
  const service = createRegistrationService({
    users: {
      findByEmail: async () => null,
      create: async (data) => ({ id: 'user-id', email: data.email, role: data.role })
    },
    passwords: { hash: async () => 'hashed-password' },
    serviceLogger: silentLogger
  });

  await assert.rejects(service.register({}), { message: 'Email and password are required', statusCode: 400 });
  await assert.rejects(service.register({ email: 'patient@example.com', password: 'short' }), { message: 'Password must be at least 8 characters', statusCode: 400 });
  assert.deepEqual(await service.register({ email: 'patient@example.com', password: 'replace-with-local-demo-password' }), {
    id: 'user-id',
    email: 'patient@example.com',
    role: 'PATIENT'
  });

  const privilegedAttempt = await service.register({ email: 'other@example.com', password: 'replace-with-local-demo-password', role: 'ADMIN' });
  assert.equal(privilegedAttempt.role, 'PATIENT');
});

test('authentication preserves invalid-credential and success behavior', async () => {
  const service = createAuthenticationService({
    users: { findByEmail: async () => ({ id: 'user-id', email: 'admin@example.com', role: 'ADMIN', password: 'hash' }) },
    passwords: { compare: async (password) => password === 'replace-with-local-demo-password' },
    sessions: { issue: async () => ({ token: 'signed-token', refreshToken: 'refresh', refreshExpiresAt: new Date(0) }) },
    serviceLogger: silentLogger
  });

  await assert.rejects(service.login({}), { message: 'Email and password are required', statusCode: 400 });
  await assert.rejects(service.login({ email: 'admin@example.com', password: 'wrong' }), { message: 'Invalid email or password', statusCode: 401 });
  assert.deepEqual(await service.login({ email: 'admin@example.com', password: 'replace-with-local-demo-password' }), {
    id: 'user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
    token: 'signed-token',
    refreshToken: 'refresh',
    refreshExpiresAt: new Date(0)
  });
});
