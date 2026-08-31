const test = require('node:test');
const assert = require('node:assert/strict');

const patients = require('../services/patients/src/policies/patientAccessPolicy');
const doctors = require('../services/doctors/src/policies/doctorAccessPolicy');
const appointments = require('../services/appointments/src/policies/appointmentAccessPolicy');
const lab = require('../services/lab/src/policies/labAccessPolicy');
const billing = require('../services/billing/src/policies/billingAccessPolicy');
const pharmacy = require('../services/pharmacy/src/policies/pharmacyAccessPolicy');

const principal = (role, id = role.toLowerCase()) => ({ role, id });

test('patient records are self-scoped while clinical and operational roles are global', () => {
  assert.deepEqual(patients.readScope(principal('PATIENT', 'patient-a')), { userId: 'patient-a' });
  assert.deepEqual(patients.readScope(principal('DOCTOR')), {});
  assert.throws(() => patients.assertCanReadProfile(principal('PATIENT', 'patient-a'), { userId: 'patient-b' }), { statusCode: 403 });
});

test('doctor profiles can only be self-created unless provisioned operationally', () => {
  assert.doesNotThrow(() => doctors.assertCanCreate(principal('DOCTOR', 'doctor-a'), 'doctor-a'));
  assert.throws(() => doctors.assertCanCreate(principal('DOCTOR', 'doctor-a'), 'doctor-b'), { statusCode: 403 });
  assert.doesNotThrow(() => doctors.assertCanCreate(principal('ADMIN'), 'doctor-b'));
});

test('appointment filters cannot widen patient or doctor ownership', () => {
  assert.deepEqual(appointments.listScope(principal('PATIENT', 'patient-a'), { patientId: 'patient-b' }), { patientId: 'patient-a' });
  assert.deepEqual(appointments.listScope(principal('DOCTOR', 'doctor-a'), { doctorId: 'doctor-b', patientId: 'patient-a' }), { doctorId: 'doctor-a', patientId: 'patient-a' });
  assert.throws(() => appointments.assertCanBook(principal('PATIENT', 'patient-a'), 'patient-b'), { statusCode: 403 });
});

test('lab queries scope patients to self and doctors to their own orders', () => {
  assert.deepEqual(lab.listScope(principal('PATIENT', 'patient-a'), { patientId: 'patient-b' }), { patientId: 'patient-a' });
  assert.deepEqual(lab.listScope(principal('DOCTOR', 'doctor-a'), { patientId: 'patient-a' }), { doctorId: 'doctor-a', patientId: 'patient-a' });
  assert.throws(() => lab.assertCanReadPatient(principal('PATIENT', 'patient-a'), 'patient-b'), { statusCode: 403 });
});

test('billing is operational-only and pharmacy scopes doctors to authored prescriptions', () => {
  assert.throws(() => billing.assertOperational(principal('PATIENT')), { statusCode: 403 });
  assert.doesNotThrow(() => billing.assertOperational(principal('STAFF')));
  assert.deepEqual(pharmacy.prescriptionScope(principal('DOCTOR', 'doctor-a'), 'patient-a'), { doctorId: 'doctor-a', patientId: 'patient-a' });
  assert.throws(() => pharmacy.assertCanViewInventory(principal('PATIENT')), { statusCode: 403 });
  assert.throws(() => pharmacy.assertCanDispense(principal('DOCTOR')), { statusCode: 403 });
});
