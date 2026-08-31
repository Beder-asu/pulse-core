const assert = require('node:assert/strict');
const { DEMO_IDS } = require('../packages/common/src/demo-data');

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost/api';

const request = async (path, { token, cookie, headers = {}, body, ...options } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    cookie: response.headers.get('set-cookie')?.split(';')[0] || null
  };
};

const expectStatus = async (status, path, options) => {
  const result = await request(path, options);
  assert.equal(result.status, status, `${options?.method || 'GET'} ${path}: ${JSON.stringify(result.body)}`);
  return result;
};

const login = async (email) => expectStatus(200, '/auth/login', {
  method: 'POST',
  body: { email, password: 'replace-with-local-demo-password' }
});

const assertEvery = (items, predicate, message) => assert(items.every(predicate), message);

const main = async () => {
  // Public callers cannot forge SYSTEM even when they know header names.
  await expectStatus(401, '/patients', {
    headers: { 'X-Internal-Call': 'true', 'X-Internal-Secret': 'replace-with-long-random-internal-service-secret' }
  });

  const patient = await login('patient@hospital.com');
  const patientId = DEMO_IDS.users.patientAmina;
  const otherPatientId = DEMO_IDS.users.patientMariam;
  const patientProfiles = (await expectStatus(200, '/patients', { token: patient.body.token })).body;
  assertEvery(patientProfiles, (profile) => profile.userId === patientId, 'patient profile list leaked another patient');
  await expectStatus(403, `/patients/${otherPatientId}`, { token: patient.body.token });
  const patientAppointments = (await expectStatus(200, `/appointments?patientId=${otherPatientId}`, { token: patient.body.token })).body;
  assertEvery(patientAppointments, (item) => item.patientId === patientId, 'patient widened appointment scope');
  const patientLabs = (await expectStatus(200, `/lab/orders?patientId=${otherPatientId}`, { token: patient.body.token })).body;
  assertEvery(patientLabs, (item) => item.patientId === patientId, 'patient widened lab scope');
  await expectStatus(403, '/pharmacy/inventory', { token: patient.body.token });
  await expectStatus(403, '/billing/invoices', { token: patient.body.token });
  await expectStatus(403, '/appointments', {
    method: 'POST', token: patient.body.token,
    body: { patientId: otherPatientId, doctorId: DEMO_IDS.users.doctorOmar }
  });

  const doctor = await login('doctor@hospital.com');
  const doctorId = DEMO_IDS.users.doctorOmar;
  const doctorAppointments = (await expectStatus(200, '/appointments', { token: doctor.body.token })).body;
  assertEvery(doctorAppointments, (item) => item.doctorId === doctorId, 'doctor appointment scope leaked another doctor');
  const doctorLabs = (await expectStatus(200, '/lab/orders', { token: doctor.body.token })).body;
  assertEvery(doctorLabs, (item) => item.doctorId === doctorId, 'doctor lab scope leaked another doctor');
  const doctorPrescriptions = (await expectStatus(200, '/pharmacy/prescriptions', { token: doctor.body.token })).body;
  assertEvery(doctorPrescriptions, (item) => item.doctorId === doctorId, 'doctor prescription scope leaked another doctor');
  await expectStatus(403, `/appointments/doctor/${DEMO_IDS.users.doctorSalma}`, { token: doctor.body.token });
  await expectStatus(403, '/billing/invoices', { token: doctor.body.token });
  await expectStatus(403, '/appointments', { method: 'POST', token: doctor.body.token, body: {} });

  const staff = await login('staff@hospital.com');
  await expectStatus(200, '/patients', { token: staff.body.token });
  await expectStatus(200, '/billing/invoices', { token: staff.body.token });
  await expectStatus(200, '/pharmacy/inventory', { token: staff.body.token });
  await expectStatus(403, '/lab/orders', { method: 'POST', token: staff.body.token, body: {} });

  const admin = await login('admin@hospital.com');
  await expectStatus(200, '/appointments', { token: admin.body.token });
  await expectStatus(200, '/lab/orders', { token: admin.body.token });
  await expectStatus(200, '/billing/invoices', { token: admin.body.token });

  // Refresh credentials rotate once. Replaying the old cookie invalidates the
  // replacement family, then a fresh login can be explicitly logged out.
  const firstRefresh = await expectStatus(200, '/auth/refresh', { method: 'POST', cookie: patient.cookie });
  assert.notEqual(firstRefresh.body.token, patient.body.token);
  assert(firstRefresh.cookie, 'refresh response must rotate the cookie');
  await expectStatus(401, '/auth/refresh', { method: 'POST', cookie: patient.cookie });
  await expectStatus(401, '/auth/refresh', { method: 'POST', cookie: firstRefresh.cookie });

  const freshPatient = await login('patient@hospital.com');
  await expectStatus(204, '/auth/logout', { method: 'POST', cookie: freshPatient.cookie });
  await expectStatus(401, '/auth/refresh', { method: 'POST', cookie: freshPatient.cookie });

  console.log('Security gateway test passed: role scopes, internal-call defense, refresh rotation, replay revocation, and logout');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
