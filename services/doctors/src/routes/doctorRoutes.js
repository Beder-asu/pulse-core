const express = require('express');
const router = express.Router();
const { createProfile, getDoctors, getDoctorById } = require('../controllers/doctorController');
const { protect } = require('@pulsecore/common');
const doctorProfileCache = require('../cache/doctorProfileCache');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Doctors Service OK',
    cache: doctorProfileCache.status()
  });
});
router.post('/profile', protect, createProfile);
router.get('/', protect, getDoctors);
router.get('/:id', protect, getDoctorById);

module.exports = router;
