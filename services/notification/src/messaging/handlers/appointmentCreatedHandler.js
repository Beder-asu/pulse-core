const { logger } = require('@pulsecore/common');
const notificationService = require('../../services/notificationService');

const createAppointmentCreatedHandler = ({ notifications, serviceLogger }) => async (eventPayload) => {
  if (eventPayload.event !== 'AppointmentCreated') return;
  const { appointmentId, patientId, patientName, doctorName, date, timeSlot } = eventPayload.payload;
  serviceLogger.info(`Received AppointmentCreated event via Kafka for appointment ${appointmentId}`);
  await notifications.createAppointmentNotification({
    eventId: eventPayload.eventId || appointmentId,
    patientId,
    patientName,
    doctorName,
    date,
    timeSlot
  });
};

module.exports = createAppointmentCreatedHandler({ notifications: notificationService, serviceLogger: logger });
module.exports.createAppointmentCreatedHandler = createAppointmentCreatedHandler;
