import type { APIContext } from "astro";
import { deleteAuthSessionById, findAuthSessionById, getD1, insertAuthSession } from "./db";
import { getAppEnv } from "./env";
import type { AuthSession, AuthUser } from "./types/guestbook";

export const SESSION_COOKIE_NAME = "guestbook_session";
export const OAUTH_STATE_COOKIE_NAME = "oauth_state";
const DEFAULT_ADMIN_USERNAME = "fiqrisr";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const getAdminUsername = (_context?: APIContext): string => {
  const env = getAppEnv();
  return (env.ADMIN_GITHUB_USERNAME || DEFAULT_ADMIN_USERNAME).toLowerCase();
};

export const parseCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const createSessionCookie = (sessionId: string, expiresAt: number): string => {
  const expiresDate = new Date(expiresAt).toUTCString();
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; Expires=${expiresDate}; HttpOnly; SameSite=Lax; Secure`;
};

export const createLogoutCookie = (): string => {
  return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`;
};

export const createStateCookie = (state: string): string => {
  const maxAge = 600; // 10 minutes
  return `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
};

export const getAuthenticatedUser = async (context: APIContext): Promise<AuthUser | null> => {
  const db = getD1(context);
  if (!db) return null;

  const cookieHeader = context.request.headers.get("Cookie");
  const sessionId = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!sessionId) return null;

  const session = await findAuthSessionById(db, sessionId);
  if (!session) return null;

  const adminUsername = getAdminUsername(context);
  const isAdmin = session.githubUsername.toLowerCase() === adminUsername;

  return {
    id: session.githubUserId,
    username: session.githubUsername,
    name: session.name,
    avatarUrl: session.avatarUrl,
    isAdmin,
  };
};

export const createNewSession = async (
  context: APIContext,
  githubUser: { id: string | number; login: string; name: string | null; avatar_url: string },
): Promise<{ sessionId: string; cookie: string }> => {
  const db = getD1(context);
  if (!db) {
    throw new Error("D1 database is not available");
  }

  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  const session: AuthSession = {
    id: sessionId,
    githubUserId: String(githubUser.id),
    githubUsername: githubUser.login,
    name: githubUser.name || githubUser.login,
    avatarUrl: githubUser.avatar_url,
    createdAt: now,
    expiresAt,
  };

  await insertAuthSession(db, session);
  return {
    sessionId,
    cookie: createSessionCookie(sessionId, expiresAt),
  };
};

export const destroySession = async (context: APIContext): Promise<string> => {
  const db = getD1(context);
  const cookieHeader = context.request.headers.get("Cookie");
  const sessionId = parseCookie(cookieHeader, SESSION_COOKIE_NAME);

  if (db && sessionId) {
    await deleteAuthSessionById(db, sessionId);
  }

  return createLogoutCookie();
};

export type GitHubOAuthTokens = {
  access_token: string;
  token_type: string;
  scope: string;
};

export type GitHubUserProfile = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

export const exchangeCodeForToken = async (
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<GitHubOAuthTokens> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    error?: string;
    error_description?: string;
  } & GitHubOAuthTokens;
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data;
};

export const fetchGitHubUserProfile = async (accessToken: string): Promise<GitHubUserProfile> => {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "fiqri-dev-guestbook",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  return (await response.json()) as GitHubUserProfile;
};
