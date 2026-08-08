-- ============================================================================
-- SkillSwap — SQLite schema (mirrors prisma/schema.prisma 1:1)
-- Applied idempotently at boot by db/init.ts via lib/db.ts.
--
-- Production note: prisma/schema.prisma in this repo is the canonical
-- PostgreSQL schema. This file is the SQLite mirror used by the local/dev
-- runtime so the app runs with zero external services.
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  username           TEXT NOT NULL UNIQUE,
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT,
  image              TEXT,
  bio                TEXT,
  headline           TEXT,
  location           TEXT,
  timezone           TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  languages          TEXT NOT NULL DEFAULT 'English',
  availability       TEXT,
  online_pref        TEXT NOT NULL DEFAULT 'ONLINE',
  credits            INTEGER NOT NULL DEFAULT 0,
  rating             REAL NOT NULL DEFAULT 0,
  total_reviews      INTEGER NOT NULL DEFAULT 0,
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  hours_taught       INTEGER NOT NULL DEFAULT 0,
  role               TEXT NOT NULL DEFAULT 'USER',
  status             TEXT NOT NULL DEFAULT 'ACTIVE',
  verified           INTEGER NOT NULL DEFAULT 0,
  reset_token        TEXT,
  reset_token_expiry TEXT,
  email_verified     TEXT,
  last_active_at     TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role);

CREATE TABLE IF NOT EXISTS skills (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT,
  popularity  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category, popularity);

CREATE TABLE IF NOT EXISTS user_skills (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id         TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  level            TEXT NOT NULL DEFAULT 'INTERMEDIATE',
  years_experience INTEGER NOT NULL DEFAULT 0,
  description      TEXT,
  UNIQUE (user_id, skill_id, type)
);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id, type);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);

CREATE TABLE IF NOT EXISTS matches (
  id                   TEXT PRIMARY KEY,
  user_a_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score  INTEGER NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'PENDING',
  requested_skill_id   TEXT REFERENCES skills(id),
  offered_skill_id     TEXT REFERENCES skills(id),
  request_message      TEXT,
  responded_at         TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_a_id, user_b_id)
);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id, status);

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  teacher_id    TEXT NOT NULL REFERENCES users(id),
  learner_id    TEXT NOT NULL REFERENCES users(id),
  skill_id      TEXT NOT NULL REFERENCES skills(id),
  title         TEXT,
  description   TEXT,
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  duration      INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'REQUESTED',
  credits       INTEGER NOT NULL DEFAULT 1,
  session_type  TEXT NOT NULL DEFAULT 'ONLINE',
  meeting_url   TEXT,
  location      TEXT,
  cancelled_by  TEXT,
  cancel_reason TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON sessions(learner_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);

CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY,
  user_a_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_a_id, user_b_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  attachment      TEXT,
  attachment_type TEXT,
  read_at         TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL,
  comment     TEXT,
  tags        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (session_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  type          TEXT NOT NULL,
  description   TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  session_id    TEXT REFERENCES sessions(id),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at);

CREATE TABLE IF NOT EXISTS reports (
  id               TEXT PRIMARY KEY,
  reporter_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id       TEXT REFERENCES sessions(id),
  type             TEXT NOT NULL DEFAULT 'USER',
  reason           TEXT NOT NULL,
  details          TEXT,
  status           TEXT NOT NULL DEFAULT 'OPEN',
  admin_note       TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
