import { env as cfEnv } from "cloudflare:workers";
import type { D1Database } from "@cloudflare/workers-types";

export type AppEnv = {
  DB?: D1Database;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_GITHUB_USERNAME?: string;
};

export const getAppEnv = (): AppEnv => {
  const env = (typeof cfEnv !== "undefined" && cfEnv ? cfEnv : {}) as unknown as AppEnv;

  if (typeof process !== "undefined" && process.env) {
    return {
      DB: env.DB,
      GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
      TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY,
      TURNSTILE_SECRET_KEY: env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY,
      ADMIN_GITHUB_USERNAME:
        env.ADMIN_GITHUB_USERNAME || process.env.ADMIN_GITHUB_USERNAME || "fiqrisr",
    };
  }

  return {
    ...env,
    ADMIN_GITHUB_USERNAME: env.ADMIN_GITHUB_USERNAME || "fiqrisr",
  };
};
