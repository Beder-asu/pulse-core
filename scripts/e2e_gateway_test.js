const assert = require('assert');

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost/api';
const unique = new Date().toISOString().replace(/[-:.TZ]/g, '');
const patientId = `PAT-E2E-${unique}`;
const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

let token;

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
};

const expectOk = async (path, options) => {
  const result = await request(path, options);
  assert(
    result.response.ok,
    `${options?.method || 'GET'} ${path} failed with ${result.response.status}: ${JSON.stringify(result.body)}`
  );
  return result.body;
};

const expectStatus = async (status, path, options) => {
  const result = await request(path, options);
  assert.strictEqual(
    result.response.status,
    status,
    `${options?.method || 'GET'} ${path} expected ${status}, got ${result.response.status}: ${JSON.stringify(result.body)}`
  );
  return result.body;
};

const main = async () => {
  for (const service of ['auth', 'patients', 'doctors', 'appointments', 'lab', 'pharmacy', 'billing', 'notifications']) {
    const health = await expectOk(`/${service}/health`);
    assert.match(health.status, /OK$/);
  }

  const login = await expectOk('/auth/login', {
    method: 'POST',
    body: { email: 'admin@hospital.com', password: 'replace-with-local-demo-password' }
  });
  assert(login.token, 'login response must include a JWT');
  token = login.token;

  await expectStatus(401, '/patients');

  const doctors = await expectOk('/doctors');
  assert(doctors.some((doctor) => doctor.userId === 'DOC-123'), 'seeded doctor DOC-123 must be available');

  const inventory = await expectOk('/pharmacy/inventory');
  assert(inventory.length > 0, 'seeded pharmacy inventory must be available');
  const medicine = inventory[0];

  const patient = await expectOk('/patients/profile', {
    method: 'POST',
    body: {
      userId: patientId,
      firstName: 'Automated',
      lastName: `Patient ${unique}`,
      dateOfBirth: '1990-01-01',
      contactNumber: '+20 100 000 0000',
      address: 'E2E Test Ward',
      bloodGroup: 'A+'
    }
  });
  assert.strictEqual(patient.userId, patientId);

  const appointment = await expectOk('/appointments', {
    method: 'POST',
    body: {
      patientId,
      doctorId: 'DOC-123',
      date: appointmentDate,
      timeSlot: `${unique.slice(-4, -2)}:${unique.slice(-2)}`,
      reasonForVisit: 'Automated end-to-end verification'
    }
  });
  assert.strictEqual(appointment.patientId, patientId);
  await expectStatus(400, '/appointments', {
    method: 'POST',
    body: {
      patientId,
      doctorId: 'DOC-123',
      date: appointmentDate,
      timeSlot: appointment.timeSlot,
      reasonForVisit: 'Duplicate slot should fail'
    }
  });

  const lab = await expectOk('/lab/orders', {
    method: 'POST',
    body: { patientId, testName: 'CBC', notes: 'E2E order' }
  });
  assert.strictEqual(lab.patientId, patientId);
  const completedLab = await expectOk(`/lab/orders/${lab.id}/result`, {
    method: 'PUT',
    body: { result: 'Within expected range' }
  });
  assert.strictEqual(completedLab.status.name, 'COMPLETED');

  await expectStatus(400, '/pharmacy/prescriptions', {
    method: 'POST',
    body: { patientId, medications: [{ medicineId: medicine.id, dosage: '1 tablet' }] }
  });
  const prescription = await expectOk('/pharmacy/prescriptions', {
    method: 'POST',
    body: {
      patientId,
      notes: 'E2E prescription',
      medications: [{
        medicineId: medicine.id,
        dosage: '1 tablet',
        frequency: 'daily',
        durationDays: 1
      }]
    }
  });
  const dispensed = await expectOk(`/pharmacy/prescriptions/${prescription.id}/dispense`, { method: 'PUT' });
  assert.strictEqual(dispensed.status.name, 'DISPENSED');

  await expectStatus(400, '/billing/invoices', {
    method: 'POST',
    body: { patientId, items: [{ description: '', amount: -1 }] }
  });
  const invoice = await expectOk('/billing/invoices', {
    method: 'POST',
    body: { patientId, items: [{ description: 'E2E invoice item', amount: 123.45 }] }
  });
  assert.strictEqual(invoice.status.name, 'ISSUED');
  const paid = await expectOk(`/billing/invoices/${invoice.id}/pay`, { method: 'PUT' });
  assert.strictEqual(paid.status.name, 'PAID');

  const [patientRecord, appointments, labs, prescriptions, invoices] = await Promise.all([
    expectOk(`/patients/${patientId}`),
    expectOk(`/appointments?patientId=${patientId}`),
    expectOk(`/lab/orders?patientId=${patientId}`),
    expectOk(`/pharmacy/prescriptions?patientId=${patientId}`),
    expectOk(`/billing/invoices?patientId=${patientId}`)
  ]);

  assert.strictEqual(patientRecord.userId, patientId);
  assert(appointments.some((item) => item.id === appointment.id));
  assert(labs.some((item) => item.id === lab.id));
  assert(prescriptions.some((item) => item.id === prescription.id));
  assert(invoices.some((item) => item.id === invoice.id));

  console.log(`E2E gateway test passed for ${patientId}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
