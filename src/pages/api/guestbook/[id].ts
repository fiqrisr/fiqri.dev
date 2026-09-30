import type { APIRoute } from "astro";
import { getAuthenticatedUser } from "../../../lib/auth";
import { deleteGuestbookEntryById, findGuestbookEntryById, getD1 } from "../../../lib/db";

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  const db = getD1(context);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing entry ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await getAuthenticatedUser(context);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const entry = await findGuestbookEntryById(db, id);
    if (!entry) {
      return new Response(JSON.stringify({ error: "Entry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isOwner = entry.userId !== null && entry.userId === user.id;
    const canDelete = user.isAdmin || isOwner;

    if (!canDelete) {
      return new Response(
        JSON.stringify({ error: "You are not authorized to delete this entry" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await deleteGuestbookEntryById(db, id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete entry";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
