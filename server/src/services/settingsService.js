const { pool } = require('../db');

// Matches the settings migration's default - used only if the singleton row
// is somehow missing (it's inserted by the migration and never deleted).
const DEFAULT_OVERDUE_THRESHOLD_DAYS = 7;

async function getOverdueThresholdDays() {
  const { rows } = await pool.query('SELECT overdue_threshold_days FROM settings WHERE id = 1');
  return rows[0] ? rows[0].overdue_threshold_days : DEFAULT_OVERDUE_THRESHOLD_DAYS;
}

module.exports = { getOverdueThresholdDays, DEFAULT_OVERDUE_THRESHOLD_DAYS };
