const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const findAll = () => prisma.inventory.findMany();
const decrementIfAvailable = (tx, id, requestedUnits) => tx.inventory.updateMany({
  where: { id, stockQuantity: { gte: requestedUnits } },
  data: { stockQuantity: { decrement: requestedUnits } }
});
const findById = (tx, id) => tx.inventory.findUnique({ where: { id } });

module.exports = { findAll, decrementIfAvailable, findById };
