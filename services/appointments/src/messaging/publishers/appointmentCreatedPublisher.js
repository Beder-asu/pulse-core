const { kafkaPublisher, uuidv7 } = require('@pulsecore/common');

const createAppointmentCreatedPublisher = ({ broker, createId }) => ({
  publish: ({ appointmentId, patientId, patientName, doctorId, doctorName, date, timeSlot }) => broker.publish('hospital.events', {
    eventId: createId(),
    event: 'AppointmentCreated',
    payload: { appointmentId, patientId, patientName, doctorId, doctorName, date, timeSlot }
  })
});

module.exports = createAppointmentCreatedPublisher({ broker: kafkaPublisher, createId: uuidv7 });
module.exports.createAppointmentCreatedPublisher = createAppointmentCreatedPublisher;
