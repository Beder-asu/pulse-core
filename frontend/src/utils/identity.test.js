import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPatientNameMap,
  buildDoctorNameMap,
  resolvePatientName,
  resolveDoctorName
} from './identity.js';

test('identity maps resolve both profile and Auth user identifiers', () => {
  const patientNames = buildPatientNameMap([{ id: 'patient-profile', userId: 'patient-user', firstName: 'Amina', lastName: 'Hassan' }]);
  const doctorNames = buildDoctorNameMap([{ id: 'doctor-profile', userId: 'doctor-user', firstName: 'Omar', lastName: 'Khalil' }]);

  assert.equal(resolvePatientName(patientNames, 'patient-profile'), 'Amina Hassan');
  assert.equal(resolvePatientName(patientNames, 'patient-user'), 'Amina Hassan');
  assert.equal(resolveDoctorName(doctorNames, 'doctor-profile'), 'Dr. Omar Khalil');
  assert.equal(resolveDoctorName(doctorNames, 'doctor-user'), 'Dr. Omar Khalil');
});

test('identity resolution never exposes an unresolved identifier', () => {
  assert.equal(resolvePatientName(new Map(), '01991f5e-raw-id'), 'Unknown patient');
  assert.equal(resolveDoctorName(new Map(), '01991f5e-raw-id'), 'Unknown doctor');
});
