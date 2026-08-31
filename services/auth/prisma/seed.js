const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DEMO_IDS } = require('../../../packages/common/src/demo-data');

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DEMO_USER_PASSWORD) {
    throw new Error('DEMO_USER_PASSWORD must be set before seeding demo auth users');
  }
  const password = await bcrypt.hash(process.env.DEMO_USER_PASSWORD, 10);
  const users = [
    { id: DEMO_IDS.users.patientAmina, email: 'patient@hospital.com', role: 'PATIENT' },
    { id: DEMO_IDS.users.patientMariam, email: 'mariam.patient@hospital.com', role: 'PATIENT' },
    { id: DEMO_IDS.users.patientYoussef, email: 'youssef.patient@hospital.com', role: 'PATIENT' },
    { id: DEMO_IDS.users.doctorOmar, email: 'doctor@hospital.com', role: 'DOCTOR' },
    { id: DEMO_IDS.users.doctorSalma, email: 'salma.doctor@hospital.com', role: 'DOCTOR' },
    { id: DEMO_IDS.users.staff, email: 'staff@hospital.com', role: 'STAFF' },
    { id: DEMO_IDS.users.admin, email: 'admin@hospital.com', role: 'ADMIN' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password, role: user.role },
      create: { ...user, password },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
