const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { uploadPhoto } = require('../middleware/upload');
const { createComplaint } = require('../controllers/complaintController');

const router = express.Router();

router.post('/', authenticate, requireRole('resident'), uploadPhoto, createComplaint);

module.exports = router;
