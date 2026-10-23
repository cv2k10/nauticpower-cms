-- Site content and settings, stored as JSON documents. A missing row means "use the bundled defaults".
CREATE TABLE kv (
  key        TEXT PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE enquiries (
  id         TEXT PRIMARY KEY,
  ref        TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  trades     TEXT NOT NULL DEFAULT '[]',
  job_type   TEXT NOT NULL,
  site_mode  TEXT NOT NULL,
  name       TEXT NOT NULL,
  contact    TEXT NOT NULL,
  location   TEXT NOT NULL DEFAULT '',
  details    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  priority   TEXT NOT NULL DEFAULT 'standard',
  read       INTEGER NOT NULL DEFAULT 0,
  notes      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_enquiries_created ON enquiries (created_at DESC);
CREATE INDEX idx_enquiries_status ON enquiries (status);

-- Monthly sequence for NP-YYYYMM-NNN references.
CREATE TABLE ref_counters (
  ym  TEXT PRIMARY KEY,
  seq INTEGER NOT NULL
);

CREATE TABLE admin_auth (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  hash            TEXT NOT NULL,
  salt            TEXT NOT NULL,
  iterations      INTEGER NOT NULL,
  session_version INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT NOT NULL
);

CREATE TABLE login_attempts (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX idx_login_attempts ON login_attempts (ip, at);

CREATE TABLE media (
  key          TEXT PRIMARY KEY,
  filename     TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  created_at   TEXT NOT NULL
);
