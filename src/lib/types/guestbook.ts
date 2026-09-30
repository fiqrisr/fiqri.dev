export type GuestbookEntry = {
  id: string;
  userId: string | null;
  name: string;
  githubUsername: string | null;
  githubAvatarUrl: string | null;
  isAnonymous: boolean;
  message: string;
  createdAt: number;
};

export type RawGuestbookRow = {
  id: string;
  user_id: string | null;
  name: string;
  github_username: string | null;
  github_avatar_url: string | null;
  is_anonymous: number;
  message: string;
  created_at: number;
};

export type RawSessionRow = {
  id: string;
  github_user_id: string;
  github_username: string;
  name: string | null;
  avatar_url: string | null;
  created_at: number;
  expires_at: number;
};

export type AuthUser = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export type AuthSession = {
  id: string;
  githubUserId: string;
  githubUsername: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: number;
  expiresAt: number;
};

export type GuestbookResponse = {
  entries: GuestbookEntry[];
  nextCursor: number | null;
};

export type CreateGuestbookInput = {
  message: string;
  name?: string;
  turnstileToken?: string;
};
