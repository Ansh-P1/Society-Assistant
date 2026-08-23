const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { listComplaints, updatePriority, updateStatus } = require('../controllers/adminComplaintController');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), listComplaints);
router.patch('/:id/priority', authenticate, requireRole('admin'), updatePriority);
router.patch('/:id/status', authenticate, requireRole('admin'), updateStatus);

module.exports = router;
