-- Append-only: application code must only INSERT into this table, never
-- UPDATE or DELETE a row. See .claude/skills/db-schema and
-- .claude/skills/complaint-lifecycle for the full rationale.
CREATE TABLE complaint_status_history (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id),
  from_status complaint_status,
  to_status complaint_status NOT NULL,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
