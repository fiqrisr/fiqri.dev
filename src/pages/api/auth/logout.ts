import type { APIRoute } from "astro";
import { destroySession } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const cookie = await destroySession(context);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
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
