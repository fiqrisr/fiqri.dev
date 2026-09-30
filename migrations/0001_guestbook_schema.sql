-- D1 Migration: 0001_guestbook_schema.sql
-- Create guestbook_entries table
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  github_username TEXT,
  github_avatar_url TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook_entries(created_at DESC);

-- Create auth_sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  github_user_id TEXT NOT NULL,
  github_username TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON auth_sessions(expires_at);
