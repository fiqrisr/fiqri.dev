import { mock } from "bun:test";

mock.module("cloudflare:workers", () => ({
  env: {
    ADMIN_GITHUB_USERNAME: "fiqrisr",
  },
}));
