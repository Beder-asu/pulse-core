const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const prescriptionInclude = { status: true, medications: { include: { inventory: true } } };

const findStatusByName = (name) => prisma.prescriptionStatus.findUnique({ where: { name } });
const findAll = (where = {}) => prisma.prescription.findMany({
  where,
  include: prescriptionInclude,
  orderBy: { createdAt: 'desc' }
});
const create = (data) => prisma.prescription.create({ data, include: prescriptionInclude });
const findByIdForDispensing = (id) => prisma.prescription.findUnique({
  where: { id },
  include: { status: true, medications: true }
});
const runTransaction = (operation) => prisma.$transaction(operation);
const updateInTransaction = (tx, id, data) => tx.prescription.update({
  where: { id },
  data,
  include: prescriptionInclude
});

module.exports = { findStatusByName, findAll, create, findByIdForDispensing, runTransaction, updateInTransaction };
