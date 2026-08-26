const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, getMyAppointments, getDoctorAppointments } = require('../controllers/appointmentController');
const { protect } = require('@pulsecore/common');

router.post('/', protect, bookAppointment);
router.get('/', protect, getAppointments);
router.get('/my', protect, getMyAppointments);
router.get('/doctor/:doctorId', protect, getDoctorAppointments);

module.exports = router;
