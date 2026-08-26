const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const cardiology = await prisma.department.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: { name: 'Cardiology', description: 'Heart and vascular care' },
  });

  const internalMedicine = await prisma.specialization.upsert({
    where: { name: 'Internal Medicine' },
    update: {},
    create: { name: 'Internal Medicine', description: 'Primary adult clinical care' },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: 'DOC-123' },
    update: {
      departmentId: cardiology.id,
      specializationId: internalMedicine.id,
      isAvailable: true,
    },
    create: {
      userId: 'DOC-123',
      firstName: 'Omar',
      lastName: 'Nabil',
      departmentId: cardiology.id,
      specializationId: internalMedicine.id,
      contactNumber: '+20 100 555 0112',
      isAvailable: true,
    },
  });
}

main()
  .finally(async () => prisma.$disconnect());
