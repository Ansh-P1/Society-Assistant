const { pool } = require('../db');
const { sendImportantNoticeEmail } = require('../services/emailService');

const MAX_TITLE_LENGTH = 255;
const MAX_BODY_LENGTH = 2000;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}

async function createNotice(req, res, next) {
  try {
    const { title, body, is_important: isImportantRaw } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'title is required' },
      });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `title must be under ${MAX_TITLE_LENGTH} characters` },
      });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'body is required' },
      });
    }
    if (body.length > MAX_BODY_LENGTH) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `body must be under ${MAX_BODY_LENGTH} characters` },
      });
    }
    if (isImportantRaw !== undefined && typeof isImportantRaw !== 'boolean') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'is_important must be a boolean' },
      });
    }

    const isImportant = isImportantRaw === true;

    const { rows } = await pool.query(
      `INSERT INTO notices (admin_id, title, body, is_important)
       VALUES ($1, $2, $3, $4)
       RETURNING id, admin_id, title, body, is_important, posted_at`,
      [req.user.id, title.trim(), body.trim(), isImportant],
    );

    const notice = rows[0];

    if (notice.is_important) {
      // Fire-and-forget: notify every resident, never block or fail the
      // response - see the note on sendEmail in emailService.js.
      pool.query("SELECT email FROM users WHERE role = 'resident'")
        .then(({ rows: residents }) => {
          residents.forEach((resident) => {
            sendImportantNoticeEmail({ to: resident.email, notice });
          });
        })
        .catch((err) => console.error('[email] Failed to look up residents for notice email:', err.message));
    }

    res.status(201).json({ notice });
  } catch (err) {
    next(err);
  }
}

async function listNotices(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);

    const [{ rows }, countResult] = await Promise.all([
      pool.query(
        `SELECT n.id, n.admin_id, u.name AS posted_by_name, n.title, n.body, n.is_important, n.posted_at
         FROM notices n
         JOIN users u ON u.id = n.admin_id
         ORDER BY n.is_important DESC, n.posted_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM notices'),
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

module.exports = { createNotice, listNotices };
