const test = require('node:test');
const assert = require('node:assert/strict');
const { createPatientProfileService } = require('./patientProfileService');

const silentLogger = { info: () => {} };

test('patient profile service preserves creation and lookup behavior', async () => {
  const created = [];
  const service = createPatientProfileService({
    patients: {
      findByUserId: async (id) => id === 'existing' ? { id: 'profile' } : null,
      create: async (data) => { created.push(data); return { id: 'profile-id', ...data }; },
      findAll: async () => [{ id: 'profile-id' }],
      findByIdOrUserId: async (id) => id === 'missing' ? null : { id, userId: id }
    },
    access: { assertCanCreate: () => {}, readScope: () => ({}), assertCanReadProfile: () => {} },
    serviceLogger: silentLogger
  });

  const requester = { id: 'user-id', role: 'PATIENT' };
  await assert.rejects(service.createProfile({ requester, userId: 'user-id' }), { message: 'First name and last name are required', statusCode: 400 });
  await assert.rejects(service.createProfile({ requester, userId: 'existing', firstName: 'A', lastName: 'B' }), { message: 'Profile already exists', statusCode: 400 });
  const profile = await service.createProfile({ requester, userId: 'user-id', firstName: 'A', lastName: 'B', dateOfBirth: '1990-01-01' });
  assert.equal(profile.id, 'profile-id');
  assert(created[0].dateOfBirth instanceof Date);
  await assert.rejects(service.getCurrentProfile({ id: 'missing', role: 'PATIENT' }), { message: 'Patient profile not found', statusCode: 404 });
  await assert.rejects(service.getProfileById({ requester, id: 'missing' }), { message: 'Patient profile not found', statusCode: 404 });
});
