const test = require('node:test');
const assert = require('node:assert/strict');
const { createDoctorProfileService } = require('./doctorProfileService');

const silentLogger = { info: () => {} };

test('doctor profile service preserves validation, duplicate, and lookup behavior', async () => {
  const cacheWrites = [];
  const service = createDoctorProfileService({
    doctors: {
      findByUserId: async (id) => id === 'existing' ? { id: 'profile' } : null,
      create: async (data) => ({ id: 'profile-id', ...data }),
      findAll: async () => [{ id: 'profile-id' }],
      findByIdOrUserId: async (id) => id === 'missing' ? null : { id }
    },
    access: { assertCanCreate: () => {} },
    serviceLogger: silentLogger,
    profileCache: {
      getList: async () => undefined,
      setList: async (profiles) => cacheWrites.push(['list', profiles]),
      getByIdentifier: async () => undefined,
      setProfile: async (profile) => cacheWrites.push(['profile', profile]),
      storeCreatedProfile: async (profile) => cacheWrites.push(['created', profile])
    }
  });

  const requester = { id: 'user-id', role: 'DOCTOR' };
  await assert.rejects(service.createProfile({ requester, userId: 'user-id' }), { message: 'First name, last name, department, and specialization are required', statusCode: 400 });
  await assert.rejects(service.createProfile({ requester, userId: 'existing', firstName: 'A', lastName: 'B', departmentId: 'department', specializationId: 'specialization' }), { message: 'Profile already exists', statusCode: 400 });
  const profile = await service.createProfile({ requester, userId: 'user-id', firstName: 'A', lastName: 'B', departmentId: 'department', specializationId: 'specialization' });
  assert.equal(profile.id, 'profile-id');
  assert.equal(cacheWrites.some(([operation]) => operation === 'created'), true);
  await assert.rejects(service.getProfileById('missing'), { message: 'Doctor profile not found', statusCode: 404 });
});

test('doctor profile service uses cache-aside reads and does not query on cache hits', async () => {
  let listQueries = 0;
  let profileQueries = 0;
  const cachedList = [{ id: 'cached-list-profile' }];
  const cachedProfile = { id: 'cached-profile' };
  const service = createDoctorProfileService({
    doctors: {
      findAll: async () => {
        listQueries += 1;
        return [];
      },
      findByIdOrUserId: async () => {
        profileQueries += 1;
        return null;
      }
    },
    access: { assertCanCreate: () => {} },
    serviceLogger: silentLogger,
    profileCache: {
      getList: async () => cachedList,
      setList: async () => {},
      getByIdentifier: async () => cachedProfile,
      setProfile: async () => {},
      storeCreatedProfile: async () => {}
    }
  });

  assert.equal(await service.getProfiles(), cachedList);
  assert.equal(await service.getProfileById('cached-profile'), cachedProfile);
  assert.equal(listQueries, 0);
  assert.equal(profileQueries, 0);
});

test('doctor profile service fills the cache after database misses', async () => {
  const profile = { id: 'profile-id', userId: 'user-id' };
  const writes = [];
  const service = createDoctorProfileService({
    doctors: {
      findAll: async () => [profile],
      findByIdOrUserId: async () => profile
    },
    access: { assertCanCreate: () => {} },
    serviceLogger: silentLogger,
    profileCache: {
      getList: async () => undefined,
      setList: async (value) => writes.push(['list', value]),
      getByIdentifier: async () => undefined,
      setProfile: async (value) => writes.push(['profile', value]),
      storeCreatedProfile: async () => {}
    }
  });

  assert.deepEqual(await service.getProfiles(), [profile]);
  assert.equal((await service.getProfileById('profile-id')).id, 'profile-id');
  assert.equal(writes.filter(([kind]) => kind === 'list').length, 1);
  assert.equal(writes.filter(([kind]) => kind === 'profile').length, 2);
});
