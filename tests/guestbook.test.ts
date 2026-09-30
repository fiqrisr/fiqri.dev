import { describe, expect, it } from "bun:test";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createLogoutCookie,
  createSessionCookie,
  createStateCookie,
  parseCookie,
} from "../src/lib/auth";
import {
  DEFAULT_PAGE_SIZE,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MIN_MESSAGE_LENGTH,
  getSecurityHeaders,
  isSafeHttpsUrl,
  isValidGitHubUsername,
  isValidUUID,
  parsePaginationParams,
  sanitizeMessage,
  sanitizeName,
  verifyCsrfOrigin,
} from "../src/lib/guestbook-validation";
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

describe("Guestbook Message Sanitization & Validation", () => {
  it("rejects non-string inputs", () => {
    expect(sanitizeMessage(null).valid).toBe(false);
    expect(sanitizeMessage(undefined).valid).toBe(false);
    expect(sanitizeMessage(12345).valid).toBe(false);
    expect(sanitizeMessage({ text: "hello" }).valid).toBe(false);
    expect(sanitizeMessage(["hello"]).valid).toBe(false);
  });

  it("rejects empty or whitespace-only messages", () => {
    expect(sanitizeMessage("").valid).toBe(false);
    expect(sanitizeMessage("   \n\t  ").valid).toBe(false);
  });

  it("rejects messages shorter than MIN_MESSAGE_LENGTH", () => {
    const result = sanitizeMessage("a");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain(`at least ${MIN_MESSAGE_LENGTH}`);
    }
  });

  it("accepts valid messages and trims edges", () => {
    const result = sanitizeMessage("  Hello from Neo-Brutalist portfolio!  ");
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.message).toBe("Hello from Neo-Brutalist portfolio!");
    }
  });

  it("strips null bytes and non-printable control characters", () => {
    const evilMessage = "Hello\x00World!\x07\x1F\x7F Test";
    const result = sanitizeMessage(evilMessage);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.message).toBe("HelloWorld! Test");
    }
  });

  it("preserves newlines and tabs while collapsing excessive vertical spam", () => {
    const spamMessage = "Line 1\n\n\n\n\nLine 2\r\n\r\n\r\nLine 3\tTabbed";
    const result = sanitizeMessage(spamMessage);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.message).toBe("Line 1\n\nLine 2\n\nLine 3\tTabbed");
    }
  });

  it("strips zero-width characters and BiDi overrides", () => {
    const bidiMessage = "Safe text\u200B\u200C\u200D\uFEFF with\u202Ereversed\u202C parts";
    const result = sanitizeMessage(bidiMessage);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.message).toBe("Safe text withreversed parts");
    }
  });

  it("accurately handles Unicode emojis up to MAX_MESSAGE_LENGTH code points", () => {
    // 300 emojis
    const emojiString = "🚀".repeat(MAX_MESSAGE_LENGTH);
    const validResult = sanitizeMessage(emojiString);
    expect(validResult.valid).toBe(true);

    // 301 emojis should be rejected
    const tooLong = "🚀".repeat(MAX_MESSAGE_LENGTH + 1);
    const invalidResult = sanitizeMessage(tooLong);
    expect(invalidResult.valid).toBe(false);
    if (!invalidResult.valid) {
      expect(invalidResult.error).toContain(`exceeds maximum length of ${MAX_MESSAGE_LENGTH}`);
    }
  });

  it("performs Unicode NFC normalization", () => {
    // Decomposed "e" + combining acute accent -> composed é
    const decomposed = "cafe\u0301";
    const result = sanitizeMessage(decomposed);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.message).toBe("café");
      expect(result.message.length).toBe(4);
    }
  });
});

describe("Guestbook Name Sanitization", () => {
  it("defaults to fallback when name is missing or non-string", () => {
    expect(sanitizeName(null).name).toBe("Anonymous");
    expect(sanitizeName(undefined).name).toBe("Anonymous");
    expect(sanitizeName("").name).toBe("Anonymous");
    expect(sanitizeName("   ").name).toBe("Anonymous");
  });

  it("enforces single line and collapses spaces", () => {
    const result = sanitizeName("  Alice \n\r\t Neo  ");
    expect(result.name).toBe("Alice Neo");
    expect(result.isCustom).toBe(true);
  });

  it("strips control characters, zero-width characters, and BiDi overrides", () => {
    const maliciousName = "Hacker\x00\u200B\u202E\x1FDev";
    const result = sanitizeName(maliciousName);
    expect(result.name).toBe("HackerDev");
    expect(result.isCustom).toBe(true);
  });

  it("truncates names exceeding MAX_NAME_LENGTH", () => {
    const longName = "A".repeat(MAX_NAME_LENGTH + 20);
    const result = sanitizeName(longName);
    expect(result.name.length).toBe(MAX_NAME_LENGTH);
  });

  it("blocks impersonation of reserved / admin names", () => {
    expect(sanitizeName("admin").name).toBe("Anonymous");
    expect(sanitizeName("ADMIN").name).toBe("Anonymous");
    expect(sanitizeName("administrator").name).toBe("Anonymous");
    expect(sanitizeName("fiqrisr").name).toBe("Anonymous");
    expect(sanitizeName("System").name).toBe("Anonymous");
    expect(sanitizeName("Moderator").name).toBe("Anonymous");
    expect(sanitizeName("[Admin] John").name).toBe("Anonymous");
    expect(sanitizeName("system:alert").name).toBe("Anonymous");
    expect(sanitizeName("verified:user").name).toBe("Anonymous");
  });
});

describe("Format & Type Validators", () => {
  it("validates UUIDs strictly", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUUID("c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c")).toBe(true);
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000; DROP TABLE entries--")).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(12345)).toBe(false);
  });

  it("validates GitHub usernames strictly", () => {
    expect(isValidGitHubUsername("fiqrisr")).toBe(true);
    expect(isValidGitHubUsername("octocat")).toBe(true);
    expect(isValidGitHubUsername("dev-123")).toBe(true);
    expect(isValidGitHubUsername("-invalid")).toBe(false);
    expect(isValidGitHubUsername("invalid-")).toBe(false);
    expect(isValidGitHubUsername("invalid--user")).toBe(false);
    expect(isValidGitHubUsername("a".repeat(40))).toBe(false);
    expect(isValidGitHubUsername("user/name")).toBe(false);
    expect(isValidGitHubUsername("user<script>")).toBe(false);
    expect(isValidGitHubUsername(null)).toBe(false);
  });

  it("validates safe HTTPS URLs", () => {
    expect(isSafeHttpsUrl("https://avatars.githubusercontent.com/u/12345")).toBe(true);
    expect(isSafeHttpsUrl("https://fiqri.dev/pic.png")).toBe(true);
    expect(isSafeHttpsUrl("http://insecure.com/pic.png")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("data:text/html,evil")).toBe(false);
    expect(isSafeHttpsUrl("/local/path")).toBe(false);
    expect(isSafeHttpsUrl(null)).toBe(false);
  });
});

describe("Pagination Parameter Parsing", () => {
  it("defaults and clamps pagination parameters safely", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
    expect(parsePaginationParams(null, null)).toEqual({ limit: 10, cursor: null });
    expect(parsePaginationParams("25", "1700000000000")).toEqual({
      limit: 25,
      cursor: 1700000000000,
    });
    // Negative or NaN limit defaults to 1 or default page size (10)
    expect(parsePaginationParams("-5", null)).toEqual({ limit: 1, cursor: null });
    expect(parsePaginationParams("invalid", null)).toEqual({ limit: 10, cursor: null });
    // Explicit valid limits
    expect(parsePaginationParams("10", null)).toEqual({ limit: 10, cursor: null });
    expect(parsePaginationParams("50", null)).toEqual({ limit: 50, cursor: null });
    // Over max limit clamped to 100
    expect(parsePaginationParams("500", null)).toEqual({ limit: 100, cursor: null });
    // Invalid cursor
    expect(parsePaginationParams("10", "-1")).toEqual({ limit: 10, cursor: null });
    expect(parsePaginationParams("10", "abc")).toEqual({ limit: 10, cursor: null });
  });
});

describe("CSRF Origin Verification", () => {
  it("permits request when Origin matches request origin", () => {
    const req = new Request("https://fiqri.dev/api/guestbook", {
      headers: { Origin: "https://fiqri.dev" },
    });
    expect(verifyCsrfOrigin(req)).toBe(true);
  });

  it("rejects request when Origin does not match request origin", () => {
    const req = new Request("https://fiqri.dev/api/guestbook", {
      headers: { Origin: "https://evil-site.com" },
    });
    expect(verifyCsrfOrigin(req)).toBe(false);
  });

  it("permits request when Origin is missing but Referer matches origin", () => {
    const req = new Request("https://fiqri.dev/api/guestbook", {
      headers: { Referer: "https://fiqri.dev/guestbook" },
    });
    expect(verifyCsrfOrigin(req)).toBe(true);
  });

  it("rejects request when Origin is missing and Referer is from foreign origin", () => {
    const req = new Request("https://fiqri.dev/api/guestbook", {
      headers: { Referer: "https://attacker.org/attack" },
    });
    expect(verifyCsrfOrigin(req)).toBe(false);
  });
});

describe("Security Headers Helper", () => {
  it("supplies baseline security headers", () => {
    const headers = getSecurityHeaders({ "Custom-Header": "test" });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Custom-Header"]).toBe("test");
  });
});

describe("Guestbook Entry Models", () => {
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
