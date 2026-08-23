const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  listComplaints, updatePriority, updateStatus, getOverdueCount,
} = require('../controllers/adminComplaintController');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), listComplaints);
// Static path first, in case a /:id route is ever added to this router later.
router.get('/overdue-count', authenticate, requireRole('admin'), getOverdueCount);
router.patch('/:id/priority', authenticate, requireRole('admin'), updatePriority);
router.patch('/:id/status', authenticate, requireRole('admin'), updateStatus);

module.exports = router;
