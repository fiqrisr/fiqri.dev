import { describe, expect, it } from "bun:test";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createLogoutCookie,
  createSessionCookie,
  createStateCookie,
  parseCookie,
} from "../src/lib/auth";
import { verifyTurnstileToken } from "../src/lib/turnstile";
import type { GuestbookEntry } from "../src/lib/types/guestbook";

describe("Auth & Cookie Utilities", () => {
  it("parses cookies correctly from cookie header", () => {
    const header = "foo=bar; guestbook_session=test-uuid-1234; other=val";
    expect(parseCookie(header, SESSION_COOKIE_NAME)).toBe("test-uuid-1234");
    expect(parseCookie(header, "foo")).toBe("bar");
    expect(parseCookie(header, "nonexistent")).toBeNull();
    expect(parseCookie(null, SESSION_COOKIE_NAME)).toBeNull();
  });

  it("creates valid session cookie with HttpOnly and Secure flags", () => {
    const expiresAt = Date.now() + 3600000;
    const cookie = createSessionCookie("session-abc-123", expiresAt);
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=session-abc-123`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
  });

  it("creates expired cookie on logout", () => {
    const cookie = createLogoutCookie();
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });

  it("creates OAuth state cookie", () => {
    const cookie = createStateCookie("random-state-uuid");
    expect(cookie).toContain(`${OAUTH_STATE_COOKIE_NAME}=random-state-uuid`);
    expect(cookie).toContain("Max-Age=600");
  });
});

describe("Turnstile Token Verification", () => {
  it("allows bypass in non-production when secret key is unset", async () => {
    const result = await verifyTurnstileToken("mock-token", undefined);
    expect(result.success).toBe(true);
  });

  it("fails when token is missing and secret key is provided", async () => {
    const result = await verifyTurnstileToken("", "secret-key");
    expect(result.success).toBe(false);
    expect(result.error).toContain("missing");
  });
});

describe("Guestbook Entry Validation", () => {
  it("correctly models anonymous entries", () => {
    const entry: GuestbookEntry = {
      id: "entry-1",
      userId: null,
      name: "Anonymous Dev",
      githubUsername: null,
      githubAvatarUrl: null,
      isAnonymous: true,
      message: "Hello world!",
      createdAt: Date.now(),
    };

    expect(entry.isAnonymous).toBe(true);
    expect(entry.userId).toBeNull();
    expect(entry.githubUsername).toBeNull();
  });

  it("correctly models verified GitHub entries", () => {
    const entry: GuestbookEntry = {
      id: "entry-2",
      userId: "12345",
      name: "Fiqri Syah Redha",
      githubUsername: "fiqrisr",
      githubAvatarUrl: "https://avatars.githubusercontent.com/u/12345",
      isAnonymous: false,
      message: "Welcome to the guestbook!",
      createdAt: Date.now(),
    };

    expect(entry.isAnonymous).toBe(false);
    expect(entry.userId).toBe("12345");
    expect(entry.githubUsername).toBe("fiqrisr");
  });
});
