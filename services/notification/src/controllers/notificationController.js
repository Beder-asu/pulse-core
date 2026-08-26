const { PrismaClient } = require('@prisma/client');
const { logger } = require('@pulsecore/common');

const prisma = new PrismaClient();

const createAppointmentNotification = async ({ eventId, patientId, doctorId, date, timeSlot }) => {
  const type = await prisma.notificationType.findUnique({ where: { name: 'APPOINTMENT_BOOKED' } });
  const channel = await prisma.notificationChannel.findUnique({ where: { name: 'IN_APP' } });

  if (!type || !channel) {
    throw new Error('Notification lookup data is not initialized');
  }

  return prisma.notification.upsert({
    where: { eventId },
    update: {},
    create: {
      eventId,
      userId: patientId,
      patientId,
      typeId: type.id,
      channelId: channel.id,
      title: 'Appointment confirmed',
      message: `Appointment with ${doctorId} on ${date} at ${timeSlot} is confirmed.`,
      emailSent: false
    }
  });
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: { type: true, channel: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });

    if (!notification || notification.userId !== req.user.id) {
      res.status(404);
      throw new Error('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
      include: { type: true, channel: true }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointmentNotification,
  getNotifications,
  markAsRead
};
