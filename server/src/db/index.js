const { Pool } = require('pg');
const config = require('../config');

// Hosted Postgres (Render, Supabase, Neon, Railway, ...) requires SSL;
// local dev Postgres normally doesn't support it at all. rejectUnauthorized
// is false because these providers use managed certs Node's default trust
// store doesn't chain to - this matches the standard pattern for pg on
// these platforms, not a relaxation specific to this app.
const isLocalDb = /localhost|127\.0\.0\.1/.test(config.dbUrl || '');

const pool = new Pool({
  connectionString: config.dbUrl,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

module.exports = { pool };
