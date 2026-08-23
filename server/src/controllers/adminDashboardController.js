const { pool } = require('../db');
const { STATUSES } = require('../constants/statuses');
const { CATEGORIES } = require('../constants/categories');
const { countOverdueComplaints } = require('./adminComplaintController');

async function getDashboard(req, res, next) {
  try {
    const [statusResult, categoryResult, overdueCount] = await Promise.all([
      pool.query('SELECT status, COUNT(*) FROM complaints GROUP BY status'),
      pool.query('SELECT category, COUNT(*) FROM complaints GROUP BY category'),
      countOverdueComplaints(),
    ]);

    // Zero-fill every known status/category first, so the response always
    // has a predictable, complete shape - the frontend never has to guess
    // which keys exist (e.g. "Resolved: 0" is still explicit).
    const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    statusResult.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const byCategory = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
    categoryResult.rows.forEach((row) => {
      byCategory[row.category] = parseInt(row.count, 10);
    });

    res.json({
      by_status: byStatus,
      by_category: byCategory,
      overdue_count: overdueCount,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
