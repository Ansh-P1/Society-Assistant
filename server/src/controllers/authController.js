const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const config = require('../config');
const { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } = require('../utils/validation');

const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'name is required' },
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'a valid email is required' },
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'resident')
       RETURNING id, name, email, role`,
      [name.trim(), normalizedEmail, passwordHash],
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'a valid email is required' },
      });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'password is required' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];

    // Same error for "no such user" and "wrong password" - don't leak which one it was.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const token = signToken(user);

    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
