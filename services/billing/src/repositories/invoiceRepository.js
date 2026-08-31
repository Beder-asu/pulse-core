const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const invoiceInclude = { status: true, items: true };

const findStatusByName = (name) => prisma.invoiceStatus.findUnique({ where: { name } });
const findAll = (patientId) => prisma.invoice.findMany({
  where: patientId ? { patientId } : {},
  include: invoiceInclude,
  orderBy: { createdAt: 'desc' }
});
const findById = (id) => prisma.invoice.findUnique({ where: { id }, include: { status: true } });
const create = (data) => prisma.invoice.create({ data, include: invoiceInclude });
const update = (id, data) => prisma.invoice.update({ where: { id }, data, include: invoiceInclude });

module.exports = { findStatusByName, findAll, findById, create, update };
