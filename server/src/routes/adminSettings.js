const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), getSettings);
router.patch('/', authenticate, requireRole('admin'), updateSettings);

module.exports = router;
