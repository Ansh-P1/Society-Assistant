const { pool } = require('../db');
const config = require('../config');
const { CATEGORIES } = require('../constants/categories');
const { STATUSES, PRIORITIES } = require('../constants/statuses');

const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

// Shared WHERE clause for both the page query and the count query - keep
// these two in sync, or the pagination totals will lie about what the page
// query actually returned.
const FILTER_WHERE = `
  ($1::text IS NULL OR c.status = $1::complaint_status)
  AND ($2::text IS NULL OR c.category = $2)
  AND ($3::text IS NULL OR c.created_at >= $3::timestamptz)
  AND ($4::text IS NULL OR c.created_at < ($4::timestamptz + interval '1 day'))
`;

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

async function listComplaints(req, res, next) {
  try {
    const { status, category, date_from: dateFrom, date_to: dateTo } = req.query;

    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${STATUSES.join(', ')}` },
      });
    }
    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `category must be one of: ${CATEGORIES.join(', ')}` },
      });
    }
    if (dateFrom && !DATE_FORMAT_RE.test(dateFrom)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'date_from must be in YYYY-MM-DD format' },
      });
    }
    if (dateTo && !DATE_FORMAT_RE.test(dateTo)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'date_to must be in YYYY-MM-DD format' },
      });
    }

    const { page, limit, offset } = parsePagination(req.query);
    const filterParams = [status || null, category || null, dateFrom || null, dateTo || null];

    const [{ rows }, countResult] = await Promise.all([
      pool.query(
        `SELECT
           c.id, c.resident_id, u.name AS resident_name, c.category, c.description,
           c.photo_url, c.priority, c.status, c.created_at, c.resolved_at,
           (c.status != 'Resolved' AND c.created_at < now() - ($5::text || ' days')::interval) AS is_overdue
         FROM complaints c
         JOIN users u ON u.id = c.resident_id
         WHERE ${FILTER_WHERE}
         ORDER BY is_overdue DESC, c.created_at DESC
         LIMIT $6 OFFSET $7`,
        [...filterParams, config.overdueThresholdDays, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*) FROM complaints c WHERE ${FILTER_WHERE}`,
        filterParams,
      ),
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

async function updatePriority(req, res, next) {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'id must be a number' },
      });
    }
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `priority must be one of: ${PRIORITIES.join(', ')}` },
      });
    }

    const { rows } = await pool.query(
      `UPDATE complaints SET priority = $1
       WHERE id = $2
       RETURNING id, resident_id, category, description, photo_url, priority, status, created_at, resolved_at`,
      [priority, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Complaint not found' },
      });
    }

    res.json({ complaint: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listComplaints, updatePriority };
