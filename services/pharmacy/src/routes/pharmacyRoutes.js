const express = require('express');
const router = express.Router();
const { getInventory, getPrescriptions, createPrescription, dispensePrescription } = require('../controllers/pharmacyController');
const { protect, authorize } = require('@pulsecore/common');

router.get('/inventory', protect, getInventory);
router.get('/prescriptions', protect, getPrescriptions);
router.post('/prescriptions', protect, authorize('DOCTOR', 'ADMIN'), createPrescription);
router.put('/prescriptions/:id/dispense', protect, authorize('STAFF', 'ADMIN'), dispensePrescription);

module.exports = router;
