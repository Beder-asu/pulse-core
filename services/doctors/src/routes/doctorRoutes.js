const express = require('express');
const router = express.Router();
const { registerDoctor, loginDoctor, getDoctors } = require('../controllers/doctorController');
const { protect } = require('@pulsecore/common');

router.post('/register', registerDoctor);
router.post('/login', loginDoctor);
router.get('/', getDoctors);

module.exports = router;
