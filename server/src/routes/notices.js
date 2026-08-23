const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { createNotice, listNotices } = require('../controllers/noticeController');

const router = express.Router();

router.post('/', authenticate, requireRole('admin'), createNotice);
// No role restriction - both residents and admins read the notice board.
router.get('/', authenticate, listNotices);

module.exports = router;
