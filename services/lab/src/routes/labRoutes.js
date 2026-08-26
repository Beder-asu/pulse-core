const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getPatientOrders, updateOrderResult } = require('../controllers/labController');
const { protect, authorize } = require('@pulsecore/common');

// Only doctors can create orders
router.post('/orders', protect, authorize('DOCTOR', 'ADMIN'), createOrder);
router.get('/orders', protect, getOrders);

// Patients or staff can view orders
router.get('/orders/patient/:patientId', protect, getPatientOrders);

// Only lab staff/admins can update results (assuming 'STAFF' role for lab techs)
router.put('/orders/:id/result', protect, authorize('STAFF', 'ADMIN'), updateOrderResult);

module.exports = router;
