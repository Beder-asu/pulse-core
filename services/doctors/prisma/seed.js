const { PrismaClient } = require('@prisma/client');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  const cardiology = await prisma.department.upsert({
    where: { name: 'Cardiology' },
    update: { description: 'Heart and vascular care' },
    create: { name: 'Cardiology', description: 'Heart and vascular care' },
  });
  const generalMedicine = await prisma.department.upsert({
    where: { name: 'General Medicine' },
    update: { description: 'Comprehensive adult medical care' },
    create: { name: 'General Medicine', description: 'Comprehensive adult medical care' },
  });
  const cardiologySpecialization = await prisma.specialization.upsert({
    where: { name: 'Clinical Cardiology' },
    update: { description: 'Diagnosis and treatment of cardiovascular disease' },
    create: { name: 'Clinical Cardiology', description: 'Diagnosis and treatment of cardiovascular disease' },
  });
  const internalMedicine = await prisma.specialization.upsert({
    where: { name: 'Internal Medicine' },
    update: { description: 'Primary adult clinical care' },
    create: { name: 'Internal Medicine', description: 'Primary adult clinical care' },
  });

  const doctors = [
    {
      userId: DEMO_IDS.users.doctorOmar,
      firstName: 'Omar',
      lastName: 'Nabil',
      departmentId: cardiology.id,
      specializationId: cardiologySpecialization.id,
      contactNumber: '+20 100 555 0112',
      isAvailable: true,
    },
    {
      userId: DEMO_IDS.users.doctorSalma,
      firstName: 'Salma',
      lastName: 'Khalil',
      departmentId: generalMedicine.id,
      specializationId: internalMedicine.id,
      contactNumber: '+20 100 555 0148',
      isAvailable: true,
    },
  ];

  for (const doctor of doctors) {
    await prisma.doctorProfile.upsert({
      where: { userId: doctor.userId },
      update: doctor,
      create: doctor,
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
