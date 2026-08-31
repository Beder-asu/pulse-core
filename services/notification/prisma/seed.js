const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const types = {};
  for (const name of ['APPOINTMENT_BOOKED', 'LAB_RESULTS_READY', 'INVOICE_ISSUED']) {
    types[name] = await prisma.notificationType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const channels = {};
  for (const name of ['IN_APP', 'EMAIL', 'BOTH']) {
    channels[name] = await prisma.notificationChannel.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const notifications = [
    {
      id: DEMO_IDS.notifications.appointment,
      eventId: DEMO_IDS.events.appointment,
      userId: DEMO_IDS.users.patientAmina,
      patientId: DEMO_IDS.users.patientAmina,
      typeId: types.APPOINTMENT_BOOKED.id,
      channelId: channels.IN_APP.id,
      title: 'Appointment confirmed',
      message: 'Your cardiology appointment is confirmed for tomorrow at 10:00 AM.',
      isRead: false,
      emailSent: false,
    },
    {
      id: DEMO_IDS.notifications.labResult,
      eventId: DEMO_IDS.events.labResult,
      userId: DEMO_IDS.users.patientMariam,
      patientId: DEMO_IDS.users.patientMariam,
      typeId: types.LAB_RESULTS_READY.id,
      channelId: channels.BOTH.id,
      title: 'Lab results ready',
      message: 'Your Complete Blood Count results are available for review.',
      isRead: true,
      emailSent: true,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { eventId: notification.eventId },
      update: notification,
      create: notification,
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
