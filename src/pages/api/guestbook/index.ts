import type { APIRoute } from "astro";
import { getAuthenticatedUser } from "../../../lib/auth";
import { fetchGuestbookEntries, getD1, insertGuestbookEntry } from "../../../lib/db";
import { getAppEnv } from "../../../lib/env";
import { verifyTurnstileToken } from "../../../lib/turnstile";
import type { CreateGuestbookInput, GuestbookEntry } from "../../../lib/types/guestbook";

export const prerender = false;

const MAX_MESSAGE_LENGTH = 300;
const MAX_NAME_LENGTH = 50;

export const GET: APIRoute = async (context) => {
  const db = getD1(context);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(context.request.url);
  const limitParam = url.searchParams.get("limit");
  const cursorParam = url.searchParams.get("cursor");

  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const cursor = cursorParam ? Number.parseInt(cursorParam, 10) : null;

  try {
    const result = await fetchGuestbookEntries(db, limit, cursor);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch entries";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async (context) => {
  const db = getD1(context);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: CreateGuestbookInput;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawMessage = (body.message || "").trim();
  if (rawMessage.length === 0) {
    return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      JSON.stringify({ error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const user = await getAuthenticatedUser(context);
  let entry: GuestbookEntry;

  if (user) {
    entry = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: user.name || user.username,
      githubUsername: user.username,
      githubAvatarUrl: user.avatarUrl,
      isAnonymous: false,
      message: rawMessage,
      createdAt: Date.now(),
    };
  } else {
    const env = getAppEnv();
    const secretKey = env.TURNSTILE_SECRET_KEY;
    const clientIp = context.request.headers.get("cf-connecting-ip");

    const turnstileResult = await verifyTurnstileToken(body.turnstileToken, secretKey, clientIp);
    if (!turnstileResult.success) {
      return new Response(
        JSON.stringify({ error: turnstileResult.error || "Turnstile verification failed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const rawName = (body.name || "").trim();
    const displayName = rawName.length > 0 ? rawName.slice(0, MAX_NAME_LENGTH) : "Anonymous";

    entry = {
      id: crypto.randomUUID(),
      userId: null,
      name: displayName,
      githubUsername: null,
      githubAvatarUrl: null,
      isAnonymous: true,
      message: rawMessage,
      createdAt: Date.now(),
    };
  }

  try {
    await insertGuestbookEntry(db, entry);
    return new Response(JSON.stringify(entry), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save entry";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
