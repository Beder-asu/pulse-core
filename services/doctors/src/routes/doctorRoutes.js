const express = require('express');
const router = express.Router();
const { createProfile, getDoctors, getDoctorById } = require('../controllers/doctorController');
const { protect } = require('@pulsecore/common');

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Doctors Service OK' });
});
router.post('/profile', protect, createProfile);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

module.exports = router;
