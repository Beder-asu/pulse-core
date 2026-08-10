const { Invoice, ProcessedEvent } = require('../models/Billing');
const { logger } = require('@pulsecore/common');

// @desc    Get patient invoices
// @route   GET /api/billing/invoices/patient/:patientId
// @access  Private
const getPatientInvoices = async (req, res, next) => {
  try {
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      res.status(403);
      throw new Error('Not authorized to view these records');
    }

    const invoices = await Invoice.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// @desc    Pay invoice
// @route   PUT /api/billing/invoices/:id/pay
// @access  Private
const payInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      res.status(400);
      throw new Error('Invoice is already paid');
    }

    invoice.status = 'paid';
    invoice.paidAt = Date.now();
    const updated = await invoice.save();
    
    logger.info(`Invoice paid: ${invoice._id}`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientInvoices,
  payInvoice
};
