import type { APIRoute } from "astro";
import { destroySession } from "../../../lib/auth";
import { getSecurityHeaders, verifyCsrfOrigin } from "../../../lib/guestbook-validation";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  if (!verifyCsrfOrigin(context.request)) {
    return new Response(JSON.stringify({ error: "Cross-site requests forbidden" }), {
      status: 403,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  const cookie = await destroySession(context);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: getSecurityHeaders({
      "Cache-Control": "no-store",
      "Set-Cookie": cookie,
    }),
  });
};

export const GET: APIRoute = async (context) => {
  const cookie = await destroySession(context);
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/guestbook",
      "Set-Cookie": cookie,
    },
  });
};
