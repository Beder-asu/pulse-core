const express = require('express');
const router = express.Router();
const { registerPatient, loginPatient, getPatientProfile } = require('../controllers/patientController');
const { protect } = require('@pulsecore/common');

router.post('/register', registerPatient);
router.post('/login', loginPatient);
router.get('/profile', protect, getPatientProfile);

module.exports = router;
