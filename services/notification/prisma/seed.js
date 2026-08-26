const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  for (const name of ['APPOINTMENT_BOOKED', 'LAB_RESULTS_READY', 'INVOICE_ISSUED']) {
    await prisma.notificationType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of ['IN_APP', 'EMAIL', 'BOTH']) {
    await prisma.notificationChannel.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
