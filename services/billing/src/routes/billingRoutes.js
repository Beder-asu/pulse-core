const express = require('express');
const router = express.Router();
const { getPatientInvoices, payInvoice } = require('../controllers/billingController');
const { protect } = require('@pulsecore/common');

router.get('/invoices/patient/:patientId', protect, getPatientInvoices);
router.put('/invoices/:id/pay', protect, payInvoice);

module.exports = router;
