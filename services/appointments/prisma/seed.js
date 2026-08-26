const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  for (const name of ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']) {
    await prisma.appointmentStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
