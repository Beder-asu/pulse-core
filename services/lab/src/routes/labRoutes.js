const express = require('express');
const router = express.Router();
const { createOrder, getPatientOrders, updateOrderResult } = require('../controllers/labController');
const { protect, authorize } = require('@pulsecore/common');

// Only doctors can create orders
router.post('/orders', protect, authorize('doctor', 'admin'), createOrder);

// Patients or staff can view orders
router.get('/orders/patient/:patientId', protect, getPatientOrders);

// Only lab staff/admins can update results (assuming 'staff' role for lab techs)
router.put('/orders/:id/result', protect, authorize('staff', 'admin'), updateOrderResult);

module.exports = router;
