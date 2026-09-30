import type { D1Database } from "@cloudflare/workers-types";
import type { APIContext } from "astro";
import { getAppEnv } from "./env";
import type {
  AuthSession,
  GuestbookEntry,
  RawGuestbookRow,
  RawSessionRow,
} from "./types/guestbook";

export const getD1 = (_context?: APIContext): D1Database | null => {
  const env = getAppEnv();
  return env.DB || null;
};

const mapRowToEntry = (row: RawGuestbookRow): GuestbookEntry => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  githubUsername: row.github_username,
  githubAvatarUrl: row.github_avatar_url,
  isAnonymous: Boolean(row.is_anonymous),
  message: row.message,
  createdAt: row.created_at,
});

const mapRowToSession = (row: RawSessionRow): AuthSession => ({
  id: row.id,
  githubUserId: row.github_user_id,
  githubUsername: row.github_username,
  name: row.name,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
});

export const fetchGuestbookEntries = async (
  db: D1Database,
  limit = 50,
  cursor?: number | null,
): Promise<{ entries: GuestbookEntry[]; nextCursor: number | null }> => {
  const safeLimit = Math.min(Math.max(1, limit), 100);

  let query: string;
  let params: (string | number)[];

  if (cursor && cursor > 0) {
    query = `
      SELECT id, user_id, name, github_username, github_avatar_url, is_anonymous, message, created_at
      FROM guestbook_entries
      WHERE created_at < ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    params = [cursor, safeLimit + 1];
  } else {
    query = `
      SELECT id, user_id, name, github_username, github_avatar_url, is_anonymous, message, created_at
      FROM guestbook_entries
      ORDER BY created_at DESC
      LIMIT ?
    `;
    params = [safeLimit + 1];
  }

  const result = await db
    .prepare(query)
    .bind(...params)
    .all<RawGuestbookRow>();
  const rows = result.results || [];
  const hasMore = rows.length > safeLimit;
  const items = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at : null;

  return {
    entries: items.map(mapRowToEntry),
    nextCursor,
  };
};

export const findGuestbookEntryById = async (
  db: D1Database,
  id: string,
): Promise<GuestbookEntry | null> => {
  const row = await db
    .prepare(
      `SELECT id, user_id, name, github_username, github_avatar_url, is_anonymous, message, created_at
       FROM guestbook_entries
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<RawGuestbookRow>();

  return row ? mapRowToEntry(row) : null;
};

export const findRecentDuplicateEntry = async (
  db: D1Database,
  message: string,
  windowMs = 60000,
): Promise<GuestbookEntry | null> => {
  const since = Date.now() - windowMs;
  const row = await db
    .prepare(
      `SELECT id, user_id, name, github_username, github_avatar_url, is_anonymous, message, created_at
       FROM guestbook_entries
       WHERE message = ? AND created_at >= ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(message, since)
    .first<RawGuestbookRow>();

  return row ? mapRowToEntry(row) : null;
};

export const insertGuestbookEntry = async (
  db: D1Database,
  entry: GuestbookEntry,
): Promise<void> => {
  await db
    .prepare(
      `INSERT INTO guestbook_entries (
        id, user_id, name, github_username, github_avatar_url, is_anonymous, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.id,
      entry.userId,
      entry.name,
      entry.githubUsername,
      entry.githubAvatarUrl,
      entry.isAnonymous ? 1 : 0,
      entry.message,
      entry.createdAt,
    )
    .run();
};

export const deleteGuestbookEntryById = async (db: D1Database, id: string): Promise<boolean> => {
  const result = await db.prepare("DELETE FROM guestbook_entries WHERE id = ?").bind(id).run();

  return (result.meta?.changes ?? 0) > 0;
};

export const insertAuthSession = async (db: D1Database, session: AuthSession): Promise<void> => {
  await db
    .prepare(
      `INSERT INTO auth_sessions (
        id, github_user_id, github_username, name, avatar_url, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      session.id,
      session.githubUserId,
      session.githubUsername,
      session.name,
      session.avatarUrl,
      session.createdAt,
      session.expiresAt,
    )
    .run();
};

export const findAuthSessionById = async (
  db: D1Database,
  sessionId: string,
): Promise<AuthSession | null> => {
  const now = Date.now();
  const row = await db
    .prepare(
      `SELECT id, github_user_id, github_username, name, avatar_url, created_at, expires_at
       FROM auth_sessions
       WHERE id = ? AND expires_at > ?
       LIMIT 1`,
    )
    .bind(sessionId, now)
    .first<RawSessionRow>();

  return row ? mapRowToSession(row) : null;
};

export const deleteAuthSessionById = async (db: D1Database, sessionId: string): Promise<void> => {
  await db.prepare("DELETE FROM auth_sessions WHERE id = ?").bind(sessionId).run();
};
