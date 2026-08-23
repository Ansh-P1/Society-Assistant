require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  dbUrl: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRET,
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  overdueThresholdDays: parseInt(process.env.OVERDUE_THRESHOLD_DAYS || '7', 10),
};

module.exports = config;
