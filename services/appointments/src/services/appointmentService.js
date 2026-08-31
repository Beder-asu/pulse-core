const { logger } = require('@pulsecore/common');
const appointmentRepository = require('../repositories/appointmentRepository');
const doctorClient = require('../clients/doctorClient');
const patientClient = require('../clients/patientClient');
const appointmentCreatedPublisher = require('../messaging/publishers/appointmentCreatedPublisher');
const { validateNewAppointment, validateAppointmentFilters } = require('../validators/appointmentValidator');
const { createServiceError } = require('../errors/serviceError');
const appointmentAccessPolicy = require('../policies/appointmentAccessPolicy');

const createAppointmentService = ({ appointments, doctors, patients, publisher, access, serviceLogger, kafkaRequired }) => ({
  bookAppointment: async ({ requester, patientId, doctorId, date, timeSlot, reasonForVisit, statusId, authHeader }) => {
    access.assertCanBook(requester, patientId);
    const appointmentDate = validateNewAppointment({ patientId, doctorId, date, timeSlot, reasonForVisit });

    const doctor = await doctors.getById(doctorId, authHeader);
    if (!doctor) throw createServiceError('Doctor not found', 404);
    const doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || null;

    const patient = await patients.getById(patientId, authHeader);
    if (!patient) throw createServiceError('Patient not found', 404);
    const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || null;

    let activeStatusId = statusId;
    if (!activeStatusId) {
      const scheduledStatus = await appointments.findStatusByName('SCHEDULED');
      if (!scheduledStatus) throw new Error('SCHEDULED status not found in dynamic enum table');
      activeStatusId = scheduledStatus.id;
    }

    const existing = await appointments.findActiveSlot({ doctorId, date: appointmentDate, timeSlot });
    if (existing && existing.status.name !== 'CANCELLED') {
      throw createServiceError('Time slot is already booked', 400);
    }

    const appointment = await appointments.create({
      patientId,
      doctorId,
      date: appointmentDate,
      timeSlot,
      statusId: activeStatusId,
      reasonForVisit
    });

    let notificationQueued = false;
    try {
      await publisher.publish({
        appointmentId: appointment.id,
        patientId,
        patientName,
        doctorId,
        doctorName,
        date,
        timeSlot
      });
      notificationQueued = true;
    } catch (eventError) {
      if (kafkaRequired()) throw eventError;
      serviceLogger.warn('Appointment created, but Kafka event publishing failed', { error: eventError.message });
    }

    serviceLogger.info(`Appointment booked: ${appointment.id} for patient ${patientId}`);
    return { ...appointment, notificationQueued };
  },

  getAppointments: ({ requester, filters }) => {
    const validatedFilters = validateAppointmentFilters(filters);
    return appointments.findAll(access.listScope(requester, validatedFilters));
  },
  getPatientAppointments: ({ requester, patientId }) => {
    access.assertCanReadPatient(requester, patientId);
    return appointments.findByPatient(patientId);
  },
  getDoctorAppointments: ({ requester, doctorId }) => {
    access.assertCanReadDoctor(requester, doctorId);
    return appointments.findByDoctor(doctorId);
  }
});

module.exports = createAppointmentService({
  appointments: appointmentRepository,
  doctors: doctorClient,
  patients: patientClient,
  publisher: appointmentCreatedPublisher,
  access: appointmentAccessPolicy,
  serviceLogger: logger,
  kafkaRequired: () => process.env.KAFKA_REQUIRED === 'true'
});
module.exports.createAppointmentService = createAppointmentService;
