const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const patients = [
    {
      userId: DEMO_IDS.users.patientAmina,
      firstName: 'Amina',
      lastName: 'Hassan',
      dateOfBirth: new Date('1991-04-12'),
      contactNumber: '+20 100 555 0188',
      address: '12 Nile Corniche, Cairo',
      bloodGroup: 'O+',
    },
    {
      userId: DEMO_IDS.users.patientMariam,
      firstName: 'Mariam',
      lastName: 'Fouad',
      dateOfBirth: new Date('1985-09-23'),
      contactNumber: '+20 100 555 0214',
      address: '8 Tahrir Street, Giza',
      bloodGroup: 'A+',
    },
    {
      userId: DEMO_IDS.users.patientYoussef,
      firstName: 'Youssef',
      lastName: 'Adel',
      dateOfBirth: new Date('2000-01-17'),
      contactNumber: '+20 100 555 0321',
      address: '41 Mostafa El Nahas Street, Cairo',
      bloodGroup: 'B-',
    },
  ];

  for (const patient of patients) {
    await prisma.patientProfile.upsert({
      where: { userId: patient.userId },
      update: patient,
      create: patient,
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
