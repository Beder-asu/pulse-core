const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

const create = ({ email, password, role }) => prisma.user.create({
  data: { email, password, role }
});

module.exports = { findByEmail, create };
