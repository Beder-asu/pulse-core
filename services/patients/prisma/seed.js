const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.patientProfile.upsert({
    where: { userId: 'PAT-123' },
    update: {},
    create: {
      userId: 'PAT-123',
      firstName: 'Amina',
      lastName: 'Hassan',
      dateOfBirth: new Date('1991-04-12'),
      contactNumber: '+20 100 555 0188',
      address: '12 Nile Corniche, Cairo',
      bloodGroup: 'O+',
    },
  });
}

main()
  .finally(async () => prisma.$disconnect());
