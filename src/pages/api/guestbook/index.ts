import type { APIRoute } from "astro";
import { getAuthenticatedUser } from "../../../lib/auth";
import {
  fetchGuestbookEntries,
  findRecentDuplicateEntry,
  getD1,
  insertGuestbookEntry,
} from "../../../lib/db";
import { getAppEnv } from "../../../lib/env";
import {
  getSecurityHeaders,
  isSafeHttpsUrl,
  isValidGitHubUsername,
  MAX_BODY_BYTES,
  parsePaginationParams,
  sanitizeMessage,
  sanitizeName,
  verifyCsrfOrigin,
} from "../../../lib/guestbook-validation";
import { verifyTurnstileToken } from "../../../lib/turnstile";
import type { GuestbookEntry } from "../../../lib/types/guestbook";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getD1(context);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  const url = new URL(context.request.url);
  const { limit, cursor } = parsePaginationParams(
    url.searchParams.get("limit"),
    url.searchParams.get("cursor"),
  );

  try {
    const result = await fetchGuestbookEntries(db, limit, cursor);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: getSecurityHeaders({
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
      }),
    });
  } catch (error) {
    console.error("Failed to fetch guestbook entries:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch entries" }), {
      status: 500,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }
};

export const POST: APIRoute = async (context) => {
  const db = getD1(context);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  if (!verifyCsrfOrigin(context.request)) {
    return new Response(JSON.stringify({ error: "Cross-site requests forbidden" }), {
      status: 403,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  const contentLength = context.request.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload exceeds size limit" }), {
      status: 413,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
      status: 415,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return new Response(JSON.stringify({ error: "Request body must be a JSON object" }), {
      status: 400,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  const input = body as Record<string, unknown>;
  const messageResult = sanitizeMessage(input.message);
  if (!messageResult.valid) {
    return new Response(JSON.stringify({ error: messageResult.error }), {
      status: 400,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }
  const sanitizedMessage = messageResult.message;

  const duplicate = await findRecentDuplicateEntry(db, sanitizedMessage, 60000);
  if (duplicate) {
    return new Response(
      JSON.stringify({
        error: "An identical message was recently submitted. Please wait before reposting.",
      }),
      {
        status: 429,
        headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
      },
    );
  }

  const user = await getAuthenticatedUser(context);
  let entry: GuestbookEntry;

  if (user) {
    const nameResult = sanitizeName(user.name || user.username);
    const safeUsername = isValidGitHubUsername(user.username) ? user.username : null;
    const safeAvatar = isSafeHttpsUrl(user.avatarUrl) ? user.avatarUrl : null;

    entry = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: nameResult.name,
      githubUsername: safeUsername,
      githubAvatarUrl: safeAvatar,
      isAnonymous: false,
      message: sanitizedMessage,
      createdAt: Date.now(),
    };
  } else {
    const env = getAppEnv();
    const secretKey = env.TURNSTILE_SECRET_KEY;
    const clientIp =
      context.request.headers.get("cf-connecting-ip") ||
      context.request.headers.get("x-forwarded-for");
    const turnstileToken =
      typeof input.turnstileToken === "string" ? input.turnstileToken.trim() : "";

    const turnstileResult = await verifyTurnstileToken(turnstileToken, secretKey, clientIp);
    if (!turnstileResult.success) {
      return new Response(
        JSON.stringify({ error: turnstileResult.error || "Turnstile verification failed" }),
        {
          status: 400,
          headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
        },
      );
    }

    const nameResult = sanitizeName(input.name, "Anonymous");

    entry = {
      id: crypto.randomUUID(),
      userId: null,
      name: nameResult.name,
      githubUsername: null,
      githubAvatarUrl: null,
      isAnonymous: true,
      message: sanitizedMessage,
      createdAt: Date.now(),
    };
  }

  try {
    await insertGuestbookEntry(db, entry);
    return new Response(JSON.stringify(entry), {
      status: 201,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  } catch (error) {
    console.error("Failed to insert guestbook entry:", error);
    return new Response(JSON.stringify({ error: "Failed to save entry" }), {
      status: 500,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }
};
