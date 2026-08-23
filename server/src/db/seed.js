const bcrypt = require('bcryptjs');
const { pool } = require('./index');

const SEED_PASSWORD = 'password123';

async function insertUser(client, { name, email, role }) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const { rows } = await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name, email, passwordHash, role],
  );
  return rows[0].id;
}

async function insertComplaint(client, { residentId, category, description, priority, status, resolvedAt }) {
  const { rows } = await client.query(
    `INSERT INTO complaints (resident_id, category, description, priority, status, resolved_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [residentId, category, description, priority, status, resolvedAt || null],
  );
  return rows[0];
}

async function insertHistory(client, { complaintId, fromStatus, toStatus, actorId, note, changedAt }) {
  await client.query(
    `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, actor_id, note, changed_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, now()))`,
    [complaintId, fromStatus, toStatus, actorId, note, changedAt || null],
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminId = await insertUser(client, {
      name: 'Admin User',
      email: 'admin@society.test',
      role: 'admin',
    });
    const resident1Id = await insertUser(client, {
      name: 'Asha Kulkarni',
      email: 'asha@society.test',
      role: 'resident',
    });
    const resident2Id = await insertUser(client, {
      name: 'Ravi Mehta',
      email: 'ravi@society.test',
      role: 'resident',
    });

    // Complaint 1: still Open
    const complaint1 = await insertComplaint(client, {
      residentId: resident1Id,
      category: 'Plumbing',
      description: 'Kitchen sink is leaking continuously.',
      priority: 'Medium',
      status: 'Open',
    });
    await insertHistory(client, {
      complaintId: complaint1.id,
      fromStatus: null,
      toStatus: 'Open',
      actorId: resident1Id,
      note: 'Complaint raised',
      changedAt: complaint1.created_at,
    });

    // Complaint 2: In Progress
    const complaint2 = await insertComplaint(client, {
      residentId: resident2Id,
      category: 'Electrical',
      description: 'Common area light on 3rd floor not working.',
      priority: 'Low',
      status: 'In Progress',
    });
    await insertHistory(client, {
      complaintId: complaint2.id,
      fromStatus: null,
      toStatus: 'Open',
      actorId: resident2Id,
      note: 'Complaint raised',
      changedAt: complaint2.created_at,
    });
    await insertHistory(client, {
      complaintId: complaint2.id,
      fromStatus: 'Open',
      toStatus: 'In Progress',
      actorId: adminId,
      note: 'Electrician scheduled',
    });

    // Complaint 3: Resolved
    const complaint3 = await insertComplaint(client, {
      residentId: resident1Id,
      category: 'Cleanliness',
      description: 'Garbage not collected from bin area for 3 days.',
      priority: 'High',
      status: 'Resolved',
      resolvedAt: new Date(),
    });
    await insertHistory(client, {
      complaintId: complaint3.id,
      fromStatus: null,
      toStatus: 'Open',
      actorId: resident1Id,
      note: 'Complaint raised',
      changedAt: complaint3.created_at,
    });
    await insertHistory(client, {
      complaintId: complaint3.id,
      fromStatus: 'Open',
      toStatus: 'Resolved',
      actorId: adminId,
      note: 'Garbage collected and area cleaned',
    });

    await client.query('COMMIT');
    console.log('Seed complete.');
    console.log(`All seeded users share the password: ${SEED_PASSWORD}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
