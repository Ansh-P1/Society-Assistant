const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { listComplaints, updatePriority } = require('../controllers/adminComplaintController');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), listComplaints);
router.patch('/:id/priority', authenticate, requireRole('admin'), updatePriority);

module.exports = router;
