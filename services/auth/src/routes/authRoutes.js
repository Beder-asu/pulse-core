const express = require('express');
const router = express.Router();
const { protect, authorize } = require('@pulsecore/common');
const { register, login, refresh, logout, logoutAll } = require('../controllers/authController');

router.post('/register', protect, authorize('STAFF', 'ADMIN'), register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;
