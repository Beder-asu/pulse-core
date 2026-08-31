const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDoctorProfileCache,
  LIST_KEY,
  profileKey
} = require('./doctorProfileCache');

test('doctor cache applies domain keys and configured TTLs', async () => {
  const values = new Map();
  const writes = [];
  const cache = {
    getJson: async (key) => values.get(key),
    setJson: async (key, value, ttl) => {
      values.set(key, value);
      writes.push({ key, value, ttl });
      return true;
    },
    delete: async (...keys) => {
      keys.forEach((key) => values.delete(key));
      return keys.length;
    },
    status: () => 'ready'
  };
  const doctorCache = createDoctorProfileCache({
    cache,
    listTtlSeconds: 120,
    profileTtlSeconds: 240
  });
  const profile = { id: 'profile-id', userId: 'user-id' };

  await doctorCache.setList([profile]);
  await doctorCache.setProfile(profile);

  assert.deepEqual(await doctorCache.getList(), [profile]);
  assert.deepEqual(await doctorCache.getByIdentifier('user-id'), profile);
  assert.deepEqual(writes.map(({ key, ttl }) => ({ key, ttl })), [
    { key: LIST_KEY, ttl: 120 },
    { key: profileKey('profile-id'), ttl: 240 },
    { key: profileKey('user-id'), ttl: 240 }
  ]);
  assert.equal(doctorCache.status(), 'ready');
});

test('doctor cache invalidates the list and warms both aliases after creation', async () => {
  const calls = [];
  const cache = {
    getJson: async () => undefined,
    setJson: async (key, value, ttl) => calls.push(['set', key, value, ttl]),
    delete: async (...keys) => calls.push(['delete', ...keys]),
    status: () => 'ready'
  };
  const doctorCache = createDoctorProfileCache({ cache, profileTtlSeconds: 90 });
  const profile = { id: 'profile-id', userId: 'user-id' };

  await doctorCache.storeCreatedProfile(profile);

  assert.deepEqual(calls, [
    ['delete', LIST_KEY],
    ['set', profileKey('profile-id'), profile, 90],
    ['set', profileKey('user-id'), profile, 90]
  ]);
});
