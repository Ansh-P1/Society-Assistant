CREATE TYPE complaint_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE complaint_status AS ENUM ('Open', 'In Progress', 'Resolved');

CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES users(id),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  photo_url VARCHAR(500),
  priority complaint_priority NOT NULL DEFAULT 'Low',
  status complaint_status NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
