const express = require('express');
const router = express.Router();
const { getInvoices, getPatientInvoices, createInvoice, payInvoice } = require('../controllers/billingController');
const { protect } = require('@pulsecore/common');

router.get('/invoices', protect, getInvoices);
router.get('/invoices/patient/:patientId', protect, getPatientInvoices);
router.post('/invoices', protect, createInvoice);
router.put('/invoices/:id/pay', protect, payInvoice);

module.exports = router;
