import type { APIRoute } from "astro";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getAppEnv } from "../../../lib/env";
export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getAppEnv();
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY || "";

  try {
    const user = await getAuthenticatedUser(context);
    return new Response(
      JSON.stringify({
        authenticated: Boolean(user),
        user,
        turnstileSiteKey,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
        turnstileSiteKey,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
