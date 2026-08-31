const notificationRepository = require('../repositories/notificationRepository');
const { formatAppointmentMessage } = require('../formatters/appointmentNotificationFormatter');
const { createServiceError } = require('@pulsecore/common');

const createNotificationService = ({ notifications }) => ({
  createAppointmentNotification: async ({ eventId, patientId, patientName, doctorName, date, timeSlot }) => {
    const type = await notifications.findTypeByName('APPOINTMENT_BOOKED');
    const channel = await notifications.findChannelByName('IN_APP');
    if (!type || !channel) throw new Error('Notification lookup data is not initialized');

    return notifications.upsertByEventId({
      eventId,
      data: {
        eventId,
        userId: patientId,
        patientId,
        typeId: type.id,
        channelId: channel.id,
        title: 'Appointment confirmed',
        message: formatAppointmentMessage({ patientName, doctorName, date, timeSlot }),
        emailSent: false
      }
    });
  },

  getNotifications: (requester) => {
    const canViewOperationalFeed = ['ADMIN', 'STAFF'].includes(requester.role);
    return notifications.findAll(canViewOperationalFeed ? undefined : requester.id);
  },

  markAsRead: async ({ id, requester }) => {
    const notification = await notifications.findById(id);
    const canManageOperationalFeed = ['ADMIN', 'STAFF'].includes(requester.role);
    if (!notification || (!canManageOperationalFeed && notification.userId !== requester.id)) {
      throw createServiceError('Notification not found', 404);
    }
    return notifications.markAsRead(id);
  }
});

module.exports = createNotificationService({ notifications: notificationRepository });
module.exports.createNotificationService = createNotificationService;
