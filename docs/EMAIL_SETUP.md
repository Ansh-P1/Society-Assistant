# Email Setup

The app sends email via [Nodemailer](https://nodemailer.com/) over plain
SMTP (`server/src/services/emailService.js`), not a provider-specific SDK.
That means any SMTP-capable free-tier provider works as a drop-in
replacement by just changing the `EMAIL_*` env vars — no code changes.

The default/recommended option below is a **Gmail app password**, because
it needs nothing beyond a Gmail account you already have — no third-party
signup, approval wait, or API key.

## Option A (recommended): Gmail app password

1. Turn on 2-Step Verification on the Gmail account you want to send from,
   if it isn't already: [myaccount.google.com/security](https://myaccount.google.com/security) → **2-Step Verification**.
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Create a new app password — name it something like "Society Tracker".
   Google generates a 16-character password.
4. Set these in `server/.env`:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-address@gmail.com
   EMAIL_PASS=the-16-char-app-password   # no spaces
   EMAIL_FROM=your-address@gmail.com
   ```

Gmail's free sending limit is around 500 messages/day, which is far more
than a single society needs.

## Option B: any other SMTP provider

Since the integration is plain SMTP, these all work the same way — just
substitute their host/port/credentials:

- **[Mailtrap](https://mailtrap.io/)** — free "sandbox" inbox that never
  actually delivers to real addresses, useful for local development
  without spamming real residents while testing.
- **[Brevo](https://www.brevo.com/)** (formerly Sendinblue) — free tier
  includes an SMTP relay.
- **SendGrid** — free tier also exposes an SMTP relay (`smtp.sendgrid.net`,
  user `apikey`, password = your API key).

Each provider's dashboard shows its SMTP host/port and how to generate
credentials — drop those into the same four `EMAIL_*` vars.

## Verifying it works

1. Set the env vars above in `server/.env`, then `npm run dev`.
2. Trigger either notification path:
   - Change a complaint's status: `PATCH /api/admin/complaints/:id/status`
     (or through the admin UI) — emails the complaint's resident.
   - Post an important notice: `POST /api/notices` with
     `"is_important": true` (or through the admin UI) — emails every
     resident.
3. Watch the server console:
   - `[email] Sent "..." to ...` — delivered.
   - `[email] Failed to send "..." to ...: <reason>` — check the error
     message (usually bad credentials or a blocked port).
   - `[email] Skipped "..." to ... - EMAIL_* env vars not configured` —
     `EMAIL_HOST`/`EMAIL_USER` are blank, so sending was skipped entirely
     rather than attempted and failed.

Email sending is fire-and-forget and wrapped in its own error handling
(see `emailService.js`), so none of this ever affects the API response —
a missing or wrong `EMAIL_PASS` will never break a status update or
notice post, it just means no email goes out (and you'll see it in the
logs above).
