const { pool } = require('../db');

const MIN_THRESHOLD_DAYS = 1;
const MAX_THRESHOLD_DAYS = 365;

async function getSettings(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT overdue_threshold_days, updated_at FROM settings WHERE id = 1',
    );
    res.json({ settings: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { overdue_threshold_days: overdueThresholdDays } = req.body;

    if (
      !Number.isInteger(overdueThresholdDays)
      || overdueThresholdDays < MIN_THRESHOLD_DAYS
      || overdueThresholdDays > MAX_THRESHOLD_DAYS
    ) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `overdue_threshold_days must be an integer between ${MIN_THRESHOLD_DAYS} and ${MAX_THRESHOLD_DAYS}`,
        },
      });
    }

    const { rows } = await pool.query(
      `UPDATE settings
       SET overdue_threshold_days = $1, updated_at = now()
       WHERE id = 1
       RETURNING overdue_threshold_days, updated_at`,
      [overdueThresholdDays],
    );

    res.json({ settings: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
