const express = require('express');
const router = express.Router();
const { createProfile, getPatientProfile, getPatients, getPatientById } = require('../controllers/patientController');
const { protect } = require('@pulsecore/common');

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Patients Service OK' });
});
router.post('/profile', protect, createProfile);
router.get('/profile', protect, getPatientProfile);
router.get('/', protect, getPatients);
router.get('/:id', protect, getPatientById);

module.exports = router;
