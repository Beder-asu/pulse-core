const { createServiceError } = require('@pulsecore/common');
const { requireOptionalUuidV7 } = require('@pulsecore/common');

const validateNewAppointment = ({ patientId, doctorId, date, timeSlot, reasonForVisit }) => {
  if (!patientId || !doctorId || !date || !timeSlot || !reasonForVisit) {
    throw createServiceError('Patient, doctor, date, time slot, and reason are required', 400);
  }

  const appointmentDate = new Date(date);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw createServiceError('Appointment date is invalid', 400);
  }
  return appointmentDate;
};

const validateAppointmentFilters = ({ patientId, doctorId } = {}) => ({
  patientId: requireOptionalUuidV7(patientId, 'patientId'),
  doctorId: requireOptionalUuidV7(doctorId, 'doctorId')
});

module.exports = { validateNewAppointment, validateAppointmentFilters };
