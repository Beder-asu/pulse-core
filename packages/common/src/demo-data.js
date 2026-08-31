const DEMO_IDS = Object.freeze({
  users: Object.freeze({
    patientAmina: '01991f5e-7c00-7001-8000-000000000001',
    patientMariam: '01991f5e-7c00-7002-8000-000000000002',
    patientYoussef: '01991f5e-7c00-7003-8000-000000000003',
    doctorOmar: '01991f5e-7c00-7101-9000-000000000001',
    doctorSalma: '01991f5e-7c00-7102-9000-000000000002',
    staff: '01991f5e-7c00-7201-a000-000000000001',
    admin: '01991f5e-7c00-7301-b000-000000000001',
  }),
  appointments: Object.freeze({
    upcoming: '01991f5f-0000-7001-8000-000000000001',
    completed: '01991f5f-0000-7002-8000-000000000002',
  }),
  labOrders: Object.freeze({
    pending: '01991f60-0000-7001-8000-000000000001',
    completed: '01991f60-0000-7002-8000-000000000002',
  }),
  prescriptions: Object.freeze({
    pending: '01991f61-0000-7001-8000-000000000001',
    dispensed: '01991f61-0000-7002-8000-000000000002',
  }),
  prescriptionItems: Object.freeze({
    pending: '01991f61-1000-7001-8000-000000000001',
    dispensed: '01991f61-1000-7002-8000-000000000002',
  }),
  invoices: Object.freeze({
    issued: '01991f62-0000-7001-8000-000000000001',
    paid: '01991f62-0000-7002-8000-000000000002',
  }),
  invoiceItems: Object.freeze({
    issued: '01991f62-1000-7001-8000-000000000001',
    paid: '01991f62-1000-7002-8000-000000000002',
  }),
  notifications: Object.freeze({
    appointment: '01991f63-0000-7001-8000-000000000001',
    labResult: '01991f63-0000-7002-8000-000000000002',
  }),
  events: Object.freeze({
    appointment: '01991f64-0000-7001-8000-000000000001',
    labResult: '01991f64-0000-7002-8000-000000000002',
  }),
});

module.exports = { DEMO_IDS };
