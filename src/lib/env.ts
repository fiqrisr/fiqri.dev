import { env as cfEnv } from "cloudflare:workers";
import type { D1Database } from "@cloudflare/workers-types";

export type AppEnv = {
  DB?: D1Database;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_GITHUB_USERNAME?: string;
  GUESTBOOK_ALLOW_ANONYMOUS?: string;
};

const getRuntimeEnv = (context: unknown): AppEnv => {
  if (
    context &&
    typeof context === "object" &&
    "locals" in context &&
    context.locals &&
    typeof context.locals === "object" &&
    "runtime" in context.locals &&
    context.locals.runtime &&
    typeof context.locals.runtime === "object" &&
    "env" in context.locals.runtime &&
    context.locals.runtime.env &&
    typeof context.locals.runtime.env === "object"
  ) {
    return context.locals.runtime.env as AppEnv;
  }
  return {};
};

export const getAppEnv = (context?: unknown): AppEnv => {
  const cf = (typeof cfEnv !== "undefined" && cfEnv ? cfEnv : {}) as unknown as AppEnv;
  const runtime = getRuntimeEnv(context);
  const meta = (
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {}
  ) as Record<string, string | undefined>;
  const proc = (typeof process !== "undefined" && process.env ? process.env : {}) as Record<
    string,
    string | undefined
  >;
  return {
    DB: runtime.DB || cf.DB,
    GITHUB_CLIENT_ID:
      runtime.GITHUB_CLIENT_ID ||
      cf.GITHUB_CLIENT_ID ||
      meta.GITHUB_CLIENT_ID ||
      proc.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET:
      runtime.GITHUB_CLIENT_SECRET ||
      cf.GITHUB_CLIENT_SECRET ||
      meta.GITHUB_CLIENT_SECRET ||
      proc.GITHUB_CLIENT_SECRET,
    TURNSTILE_SITE_KEY:
      runtime.TURNSTILE_SITE_KEY ||
      cf.TURNSTILE_SITE_KEY ||
      meta.TURNSTILE_SITE_KEY ||
      proc.TURNSTILE_SITE_KEY ||
      meta.PUBLIC_TURNSTILE_SITE_KEY ||
      proc.PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY:
      runtime.TURNSTILE_SECRET_KEY ||
      cf.TURNSTILE_SECRET_KEY ||
      meta.TURNSTILE_SECRET_KEY ||
      proc.TURNSTILE_SECRET_KEY,
    ADMIN_GITHUB_USERNAME:
      runtime.ADMIN_GITHUB_USERNAME ||
      cf.ADMIN_GITHUB_USERNAME ||
      meta.ADMIN_GITHUB_USERNAME ||
      proc.ADMIN_GITHUB_USERNAME ||
      "fiqrisr",
    GUESTBOOK_ALLOW_ANONYMOUS:
      runtime.GUESTBOOK_ALLOW_ANONYMOUS ||
      cf.GUESTBOOK_ALLOW_ANONYMOUS ||
      meta.GUESTBOOK_ALLOW_ANONYMOUS ||
      proc.GUESTBOOK_ALLOW_ANONYMOUS ||
      meta.PUBLIC_GUESTBOOK_ALLOW_ANONYMOUS ||
      proc.PUBLIC_GUESTBOOK_ALLOW_ANONYMOUS,
  };
};

export const isAnonymousGuestbookAllowed = (envOrContext?: AppEnv | unknown): boolean => {
  const currentEnv =
    envOrContext && typeof envOrContext === "object" && "GUESTBOOK_ALLOW_ANONYMOUS" in envOrContext
      ? (envOrContext as AppEnv)
      : getAppEnv(envOrContext);
  const rawValue = currentEnv.GUESTBOOK_ALLOW_ANONYMOUS;
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return true;
  }
  const normalized = String(rawValue).trim().toLowerCase();
  return !["false", "0", "no", "off", "disabled"].includes(normalized);
};
