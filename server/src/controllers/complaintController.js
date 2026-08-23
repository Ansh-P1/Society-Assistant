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

const COMPLAINT_COLUMNS =
  'id, resident_id, category, description, photo_url, priority, status, created_at, resolved_at';

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

async function listMine(req, res, next) {
  try {
    const residentId = req.user.id;
    const { page, limit, offset } = parsePagination(req.query);

    const [{ rows }, countResult] = await Promise.all([
      pool.query(
        `SELECT ${COMPLAINT_COLUMNS}
         FROM complaints
         WHERE resident_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [residentId, limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM complaints WHERE resident_id = $1', [residentId]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'id must be a number' },
      });
    }

    const complaintResult = await pool.query(
      `SELECT c.id, c.resident_id, u.name AS resident_name, c.category, c.description,
              c.photo_url, c.priority, c.status, c.created_at, c.resolved_at
       FROM complaints c
       JOIN users u ON u.id = c.resident_id
       WHERE c.id = $1`,
      [id],
    );
    const complaint = complaintResult.rows[0];

    if (!complaint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Complaint not found' },
      });
    }
    // Admins can view any complaint; residents only their own.
    if (req.user.role !== 'admin' && complaint.resident_id !== req.user.id) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You do not have access to this complaint' },
      });
    }

    const historyResult = await pool.query(
      `SELECT h.id, h.from_status, h.to_status, h.actor_id, u.name AS actor_name, h.note, h.changed_at
       FROM complaint_status_history h
       JOIN users u ON u.id = h.actor_id
       WHERE h.complaint_id = $1
       ORDER BY h.changed_at ASC`,
      [id],
    );

    res.json({ complaint, history: historyResult.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { createComplaint, listMine, getById };
