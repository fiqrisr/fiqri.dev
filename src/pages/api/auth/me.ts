import type { APIRoute } from "astro";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getAppEnv, isAnonymousGuestbookAllowed } from "../../../lib/env";
export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getAppEnv();
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY || "";
  const allowAnonymous = isAnonymousGuestbookAllowed(env);
  try {
    const user = await getAuthenticatedUser(context);
    return new Response(
      JSON.stringify({
        authenticated: Boolean(user),
        user,
        turnstileSiteKey,
        allowAnonymous,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
        turnstileSiteKey,
        allowAnonymous,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      },
    );
  }
};
