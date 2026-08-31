const express = require('express');
const router = express.Router();
const { getInvoices, getPatientInvoices, createInvoice, payInvoice } = require('../controllers/billingController');
const { protect, authorize } = require('@pulsecore/common');

router.get('/invoices', protect, authorize('STAFF', 'ADMIN'), getInvoices);
router.get('/invoices/patient/:patientId', protect, authorize('STAFF', 'ADMIN'), getPatientInvoices);
router.post('/invoices', protect, authorize('STAFF', 'ADMIN'), createInvoice);
router.put('/invoices/:id/pay', protect, authorize('STAFF', 'ADMIN'), payInvoice);

module.exports = router;
