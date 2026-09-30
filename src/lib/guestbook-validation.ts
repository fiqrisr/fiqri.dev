export const MAX_MESSAGE_LENGTH = 300;
export const MIN_MESSAGE_LENGTH = 2;
export const MAX_NAME_LENGTH = 50;
export const MAX_BODY_BYTES = 32 * 1024; // 32 KB
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const RESERVED_NAMES = Object.freeze([
  "admin",
  "administrator",
  "fiqrisr",
  "system",
  "moderator",
  "root",
  "verified",
  "guestbook",
  "owner",
  "staff",
  "support",
  "bot",
]);

// biome-ignore lint/suspicious/noControlCharactersInRegex: Strip non-printable ASCII control characters to prevent terminal/rendering injection
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
// Invisible zero-width and format control characters
const ZERO_WIDTH_CHARS_REGEX = /[\u200B-\u200D\uFEFF]/g;
// Bidirectional text overrides (prevents spoofing and display alteration)
const BIDI_OVERRIDES_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
// Valid UUID v4 / general UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Valid GitHub username format
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export type SanitizeMessageResult =
  | {
      valid: true;
      message: string;
    }
  | {
      valid: false;
      error: string;
    };

export const sanitizeMessage = (raw: unknown): SanitizeMessageResult => {
  if (typeof raw !== "string") {
    return { valid: false, error: "Message must be a text string" };
  }

  // Normalize Unicode representation to canonical composition
  let cleaned = raw.normalize("NFC");

  // Remove null bytes, non-printable control characters, zero-width chars, and bidi overrides
  cleaned = cleaned
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(ZERO_WIDTH_CHARS_REGEX, "")
    .replace(BIDI_OVERRIDES_REGEX, "");

  // Normalize line endings to LF (\n)
  cleaned = cleaned.replace(/\r\n|\r/g, "\n");

  // Prevent vertical flood / layout vandalism: collapse 3+ consecutive newlines to 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim outer whitespace
  cleaned = cleaned.trim();

  // Strip empty lines at the start or end, while preserving internal paragraphs
  if (cleaned.length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }

  // Count code points rather than UTF-16 code units (accurately measures emojis)
  const codePoints = Array.from(cleaned);

  if (codePoints.length < MIN_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters long`,
    };
  }

  if (codePoints.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  return { valid: true, message: cleaned };
};

export type SanitizeNameResult = {
  name: string;
  isCustom: boolean;
};

export const sanitizeName = (raw: unknown, defaultName = "Anonymous"): SanitizeNameResult => {
  if (typeof raw !== "string") {
    return { name: defaultName, isCustom: false };
  }

  let cleaned = raw.normalize("NFC");

  // Single-line enforcement: replace newlines and tabs with spaces
  cleaned = cleaned.replace(/[\r\n\t]/g, " ");

  // Remove control characters, zero-width spaces, and bidi overrides
  cleaned = cleaned
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(ZERO_WIDTH_CHARS_REGEX, "")
    .replace(BIDI_OVERRIDES_REGEX, "");

  // Collapse multiple consecutive spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  if (cleaned.length === 0) {
    return { name: defaultName, isCustom: false };
  }

  // Clamp code points to MAX_NAME_LENGTH
  const codePoints = Array.from(cleaned);
  const truncated = codePoints.slice(0, MAX_NAME_LENGTH).join("");

  // Check for impersonation of admin/system/reserved personas
  const lowerName = truncated.toLowerCase();
  const isReserved =
    RESERVED_NAMES.includes(lowerName) ||
    lowerName.startsWith("[admin") ||
    lowerName.startsWith("system:") ||
    lowerName.startsWith("verified:");

  if (isReserved) {
    return { name: defaultName, isCustom: false };
  }

  return { name: truncated, isCustom: true };
};

export const isValidUUID = (id: unknown): boolean => {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id);
};

export const isValidGitHubUsername = (username: unknown): boolean => {
  if (typeof username !== "string") return false;
  return GITHUB_USERNAME_REGEX.test(username);
};

export const isSafeHttpsUrl = (url: unknown): boolean => {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const parsePaginationParams = (
  limitParam: string | null,
  cursorParam: string | null,
): { limit: number; cursor: number | null } => {
  let limit = DEFAULT_PAGE_SIZE;
  if (limitParam !== null) {
    const parsedLimit = Number.parseInt(limitParam, 10);
    if (Number.isFinite(parsedLimit)) {
      limit = Math.min(Math.max(1, parsedLimit), MAX_PAGE_SIZE);
    }
  }

  let cursor: number | null = null;
  if (cursorParam !== null) {
    const parsedCursor = Number.parseInt(cursorParam, 10);
    if (Number.isFinite(parsedCursor) && parsedCursor > 0) {
      cursor = parsedCursor;
    }
  }

  return { limit, cursor };
};

export const verifyCsrfOrigin = (request: Request): boolean => {
  const originHeader = request.headers.get("Origin");
  if (!originHeader) {
    // If no Origin header is present, check Referer header if available
    const refererHeader = request.headers.get("Referer");
    if (!refererHeader) {
      // In same-origin or direct requests without Origin/Referer, allow
      return true;
    }
    try {
      const refererUrl = new URL(refererHeader);
      const requestUrl = new URL(request.url);
      return refererUrl.origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  try {
    const requestUrl = new URL(request.url);
    return originHeader === requestUrl.origin;
  } catch {
    return false;
  }
};

export const getSecurityHeaders = (
  extraHeaders: Record<string, string> = {},
): Record<string, string> => {
  return {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...extraHeaders,
  };
};
