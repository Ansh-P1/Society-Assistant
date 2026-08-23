const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { getDashboard } = require('../controllers/adminDashboardController');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), getDashboard);

module.exports = router;
