const notificationRepository = require('../repositories/notificationRepository');
const patientClient = require('../clients/patientClient');
const doctorClient = require('../clients/doctorClient');
const { getDoctorLabel } = require('../formatters/appointmentNotificationFormatter');

const createLegacyNotificationRepairService = ({ notifications, patients, doctors }) => ({
  repair: async () => {
    if (!patients.isConfigured() || !doctors.isConfigured()) return 0;

    const legacyNotifications = await notifications.findAppointmentNotificationsForRepair();
    let repairedCount = 0;

    for (const notification of legacyNotifications) {
      if (notification.message.startsWith('Appointment for ')) continue;

      const patient = await patients.getById(notification.patientId);
      if (!patient) continue;
      const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ');
      if (!patientName) continue;

      const namedMessage = notification.message.match(/^Your appointment with (.+)$/i);
      if (namedMessage) {
        await notifications.updateMessage(notification.id, `Appointment for ${patientName} with ${namedMessage[1]}`);
        repairedCount += 1;
        continue;
      }

      const legacyMessage = notification.message.match(/^Appointment with ([0-9a-f-]{36}) on (.+)$/i);
      if (!legacyMessage) {
        if (notification.message.startsWith('Your cardiology appointment ')) {
          await notifications.updateMessage(notification.id, notification.message.replace('Your cardiology appointment', `Cardiology appointment for ${patientName}`));
          repairedCount += 1;
        }
        continue;
      }

      const doctor = await doctors.getById(legacyMessage[1]);
      if (!doctor) continue;
      const doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
      if (!doctorName) continue;

      await notifications.updateMessage(notification.id, `Appointment for ${patientName} with ${getDoctorLabel(doctorName)} on ${legacyMessage[2]}`);
      repairedCount += 1;
    }

    return repairedCount;
  }
});

module.exports = createLegacyNotificationRepairService({
  notifications: notificationRepository,
  patients: patientClient,
  doctors: doctorClient
});
module.exports.createLegacyNotificationRepairService = createLegacyNotificationRepairService;
