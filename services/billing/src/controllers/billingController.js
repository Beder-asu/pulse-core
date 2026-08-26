const { PrismaClient } = require('@prisma/client');
const { logger } = require('@pulsecore/common');

const prisma = new PrismaClient();

const invoiceInclude = { status: true, items: true };

const getDraftStatus = async () => {
  const status = await prisma.invoiceStatus.findUnique({ where: { name: 'ISSUED' } });
  if (!status) throw new Error("ISSUED status not found");
  return status;
};

// @desc    Get invoices
// @route   GET /api/billing/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patientId) where.patientId = req.query.patientId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient invoices
// @route   GET /api/billing/invoices/patient/:patientId
// @access  Private
const getPatientInvoices = async (req, res, next) => {
  try {
    if (req.user.role === 'PATIENT' && req.user.id !== req.params.patientId) {
      res.status(403);
      throw new Error('Not authorized to view these records');
    }

    const invoices = await prisma.invoice.findMany({
      where: { patientId: req.params.patientId },
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// @desc    Create an invoice
// @route   POST /api/billing/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
  try {
    const { patientId, items } = req.body;

    if (!patientId || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Patient and at least one invoice item are required');
    }

    for (const item of items) {
      if (!item.description || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0) {
        res.status(400);
        throw new Error('Each invoice item requires a description and a positive amount');
      }
    }

    const issuedStatus = await getDraftStatus();
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const manualSourceId = `manual-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        totalAmount,
        statusId: issuedStatus.id,
        issuedAt: new Date(),
        items: {
          create: items.map((item, index) => ({
            sourceId: item.sourceId || `${manualSourceId}-${index}`,
            sourceType: item.sourceType || 'MANUAL',
            description: item.description,
            amount: Number(item.amount)
          }))
        }
      },
      include: invoiceInclude
    });

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};

// @desc    Pay invoice
// @route   PUT /api/billing/invoices/:id/pay
// @access  Private
const payInvoice = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { status: true }
    });

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    if (invoice.status.name === 'PAID') {
      res.status(400);
      throw new Error('Invoice is already paid');
    }

    const paidStatus = await prisma.invoiceStatus.findUnique({ where: { name: 'PAID' } });
    if (!paidStatus) throw new Error("PAID status not found");

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        statusId: paidStatus.id,
        paidAt: new Date()
      },
      include: invoiceInclude
    });

    logger.info(`Invoice paid: ${invoice.id}`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getPatientInvoices,
  createInvoice,
  payInvoice
};
