const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const findTypeByName = (name) => prisma.notificationType.findUnique({ where: { name } });
const findChannelByName = (name) => prisma.notificationChannel.findUnique({ where: { name } });
const upsertByEventId = ({ eventId, data }) => prisma.notification.upsert({
  where: { eventId },
  update: {},
  create: data
});
const findAll = (userId) => prisma.notification.findMany({
  where: userId ? { userId } : {},
  include: { type: true, channel: true },
  orderBy: { createdAt: 'desc' },
  take: 50
});
const findById = (id) => prisma.notification.findUnique({ where: { id } });
const markAsRead = (id) => prisma.notification.update({
  where: { id },
  data: { isRead: true },
  include: { type: true, channel: true }
});
const findAppointmentNotificationsForRepair = () => prisma.notification.findMany({
  where: { type: { name: 'APPOINTMENT_BOOKED' } },
  select: { id: true, patientId: true, message: true }
});
const updateMessage = (id, message) => prisma.notification.update({
  where: { id },
  data: { message }
});

module.exports = {
  findTypeByName,
  findChannelByName,
  upsertByEventId,
  findAll,
  findById,
  markAsRead,
  findAppointmentNotificationsForRepair,
  updateMessage
};
