import type { APIRoute } from "astro";
import {
  createNewSession,
  exchangeCodeForToken,
  fetchGitHubUserProfile,
  OAUTH_STATE_COOKIE_NAME,
  parseCookie,
} from "../../../lib/auth";
import { getAppEnv } from "../../../lib/env";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/guestbook?error=${encodeURIComponent(errorParam)}` },
    });
  }

  if (!code || !state) {
    return new Response("Missing code or state parameter", { status: 400 });
  }

  const cookieHeader = context.request.headers.get("Cookie");
  const storedState = parseCookie(cookieHeader, OAUTH_STATE_COOKIE_NAME);

  if (!storedState || storedState !== state) {
    return new Response("Invalid OAuth state parameter", { status: 400 });
  }

  const env = getAppEnv();
  const clientId = env.GITHUB_CLIENT_ID || "";
  const clientSecret = env.GITHUB_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return new Response("GitHub OAuth credentials not configured", { status: 500 });
  }

  try {
    const redirectUri = `${url.origin}/api/auth/callback`;
    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri);
    const profile = await fetchGitHubUserProfile(tokenData.access_token);
    const { cookie } = await createNewSession(context, profile);

    const clearStateCookie = `${OAUTH_STATE_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`;

    const headers = new Headers();
    headers.set("Location", "/guestbook");
    headers.append("Set-Cookie", cookie);
    headers.append("Set-Cookie", clearStateCookie);

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OAuth error";
    return new Response(null, {
      status: 302,
      headers: { Location: `/guestbook?error=${encodeURIComponent(message)}` },
    });
  }
};
