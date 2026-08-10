const express = require('express');
const router = express.Router();
const { getInventory, createPrescription, dispensePrescription } = require('../controllers/pharmacyController');
const { protect, authorize } = require('@pulsecore/common');

router.get('/inventory', protect, getInventory);
router.post('/prescriptions', protect, authorize('doctor', 'admin'), createPrescription);
router.put('/prescriptions/:id/dispense', protect, authorize('staff', 'admin'), dispensePrescription);

module.exports = router;
