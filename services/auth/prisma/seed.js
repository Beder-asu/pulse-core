const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('replace-with-local-demo-password', 10);
  const users = [
    { id: 'PAT-123', email: 'patient@hospital.com', role: 'PATIENT' },
    { id: 'DOC-123', email: 'doctor@hospital.com', role: 'DOCTOR' },
    { id: 'STAFF-123', email: 'staff@hospital.com', role: 'STAFF' },
    { id: 'ADMIN-123', email: 'admin@hospital.com', role: 'ADMIN' },
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
