-- Single-row config table: id is pinned to 1 (default + CHECK), so there is
-- always exactly one settings row, never more.
CREATE TABLE settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  overdue_threshold_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO settings (id) VALUES (1);
