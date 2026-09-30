import type { APIRoute } from "astro";
import { createStateCookie } from "../../../lib/auth";
import { getAppEnv } from "../../../lib/env";
export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getAppEnv();
  const clientId = env.GITHUB_CLIENT_ID || "";

  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID is not configured", { status: 500 });
  }

  const state = crypto.randomUUID();
  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "read:user");
  authUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": createStateCookie(state),
    },
  });
};
