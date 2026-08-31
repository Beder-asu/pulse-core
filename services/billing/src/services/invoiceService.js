const { logger, uuidv7 } = require('@pulsecore/common');
const invoiceRepository = require('../repositories/invoiceRepository');
const { validateNewInvoice, validateInvoicePatientFilter } = require('../validators/invoiceValidator');
const { createServiceError } = require('../errors/serviceError');
const billingAccessPolicy = require('../policies/billingAccessPolicy');

const createInvoiceService = ({ invoices, access, createId, serviceLogger, now }) => ({
  getInvoices: ({ requester, patientId }) => {
    access.assertOperational(requester);
    return invoices.findAll(validateInvoicePatientFilter(patientId));
  },

  getPatientInvoices: ({ requester, patientId }) => {
    access.assertOperational(requester);
    return invoices.findAll(patientId);
  },

  createInvoice: async ({ requester, patientId, items }) => {
    access.assertOperational(requester);
    validateNewInvoice({ patientId, items });
    const issuedStatus = await invoices.findStatusByName('ISSUED');
    if (!issuedStatus) throw new Error('ISSUED status not found');

    return invoices.create({
      patientId,
      totalAmount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      statusId: issuedStatus.id,
      issuedAt: now(),
      items: {
        create: items.map((item) => ({
          sourceId: item.sourceId || createId(),
          sourceType: item.sourceType || 'MANUAL',
          description: item.description,
          amount: Number(item.amount)
        }))
      }
    });
  },

  payInvoice: async ({ requester, id }) => {
    access.assertOperational(requester);
    const invoice = await invoices.findById(id);
    if (!invoice) throw createServiceError('Invoice not found', 404);
    if (invoice.status.name === 'PAID') throw createServiceError('Invoice is already paid', 400);

    const paidStatus = await invoices.findStatusByName('PAID');
    if (!paidStatus) throw new Error('PAID status not found');
    const updated = await invoices.update(id, { statusId: paidStatus.id, paidAt: now() });
    serviceLogger.info(`Invoice paid: ${invoice.id}`);
    return updated;
  }
});

module.exports = createInvoiceService({ invoices: invoiceRepository, access: billingAccessPolicy, createId: uuidv7, serviceLogger: logger, now: () => new Date() });
module.exports.createInvoiceService = createInvoiceService;
