const invoiceService = require('../services/invoiceService');

const forwardError = (error, res, next) => {
  if (error.statusCode) res.status(error.statusCode);
  next(error);
};

// @desc    Get invoices
// @route   GET /api/billing/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    res.json(await invoiceService.getInvoices({ requester: req.user, patientId: req.query.patientId }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Get patient invoices
// @route   GET /api/billing/invoices/patient/:patientId
// @access  Private
const getPatientInvoices = async (req, res, next) => {
  try {
    res.json(await invoiceService.getPatientInvoices({ requester: req.user, patientId: req.params.patientId }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Create an invoice
// @route   POST /api/billing/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
  try {
    res.status(201).json(await invoiceService.createInvoice({ ...req.body, requester: req.user }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

// @desc    Pay invoice
// @route   PUT /api/billing/invoices/:id/pay
// @access  Private
const payInvoice = async (req, res, next) => {
  try {
    res.json(await invoiceService.payInvoice({ requester: req.user, id: req.params.id }));
  } catch (error) {
    forwardError(error, res, next);
  }
};

module.exports = {
  getInvoices,
  getPatientInvoices,
  createInvoice,
  payInvoice
};
