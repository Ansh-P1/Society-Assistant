const { pool } = require('../db');
const { CATEGORIES } = require('../constants/categories');

const MAX_DESCRIPTION_LENGTH = 2000;

async function createComplaint(req, res, next) {
  try {
    const { category, description } = req.body;

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `category must be one of: ${CATEGORIES.join(', ')}` },
      });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'description is required' },
      });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `description must be under ${MAX_DESCRIPTION_LENGTH} characters`,
        },
      });
    }

    const residentId = req.user.id;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO complaints (resident_id, category, description, photo_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, resident_id, category, description, photo_url, priority, status, created_at, resolved_at`,
        [residentId, category, description.trim(), photoUrl],
      );
      const complaint = rows[0];

      // First history row for this complaint: from_status is null because
      // there's no prior status - creation itself is the first event.
      await client.query(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, actor_id, note)
         VALUES ($1, NULL, 'Open', $2, $3)`,
        [complaint.id, residentId, 'Complaint raised'],
      );

      await client.query('COMMIT');
      res.status(201).json({ complaint });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { createComplaint };
