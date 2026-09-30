/// <reference path="../.astro/types.d.ts" />
import type { Runtime as CloudflareRuntime } from "@astrojs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

export type CloudflareEnv = {
  DB: D1Database;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_GITHUB_USERNAME?: string;
};

declare global {
  namespace App {
    interface Locals extends CloudflareRuntime<CloudflareEnv> {}
  }
}
