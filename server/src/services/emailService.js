const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port) || 587,
  secure: Number(config.email.port) === 465,
  auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined,
});

// Fire-and-forget: this never rejects, so callers can invoke it without
// await and without a try/catch of their own. A broken mail provider or
// missing credentials must never break the API request that triggered the
// notification - failures are logged to the server console instead.
async function sendEmail({ to, subject, text }) {
  if (!config.email.host || !config.email.user) {
    console.warn(`[email] Skipped "${subject}" to ${to} - EMAIL_* env vars not configured`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.email.from || config.email.user,
      to,
      subject,
      text,
    });
    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

function sendStatusChangeEmail({
  to, residentName, complaint, fromStatus, toStatus, note,
}) {
  const subject = `Your complaint #${complaint.id} is now ${toStatus}`;
  const lines = [
    `Hi ${residentName},`,
    '',
    `Your complaint "${complaint.category}: ${complaint.description}" has changed status.`,
    fromStatus ? `${fromStatus} -> ${toStatus}` : `Status: ${toStatus}`,
  ];
  if (note) {
    lines.push('', `Note from the admin: ${note}`);
  }
  lines.push('', '- Society Maintenance Tracker');

  return sendEmail({ to, subject, text: lines.join('\n') });
}

function sendImportantNoticeEmail({ to, notice }) {
  const subject = `Important notice: ${notice.title}`;
  const text = [
    'A new important notice has been posted:',
    '',
    notice.title,
    '',
    notice.body,
    '',
    '- Society Maintenance Tracker',
  ].join('\n');

  return sendEmail({ to, subject, text });
}

module.exports = { sendEmail, sendStatusChangeEmail, sendImportantNoticeEmail };
