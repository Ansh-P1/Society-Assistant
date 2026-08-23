const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { uploadPhoto } = require('../middleware/upload');
const { createComplaint, listMine, getById } = require('../controllers/complaintController');

const router = express.Router();

router.post('/', authenticate, requireRole('resident'), uploadPhoto, createComplaint);

// /mine must come before /:id, or Express would match "mine" as an :id.
router.get('/mine', authenticate, requireRole('resident'), listMine);
// Both roles allowed here - getById itself enforces that a resident may
// only fetch their own complaint, while an admin may fetch any.
router.get('/:id', authenticate, requireRole('resident', 'admin'), getById);

module.exports = router;
