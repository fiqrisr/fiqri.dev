import type { APIRoute } from "astro";
import { getAuthenticatedUser } from "../../../lib/auth";
import { deleteGuestbookEntryById, findGuestbookEntryById, getD1 } from "../../../lib/db";
import {
  getSecurityHeaders,
  isValidUUID,
  verifyCsrfOrigin,
} from "../../../lib/guestbook-validation";

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
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

  const { id } = context.params;
  if (!id || !isValidUUID(id)) {
    return new Response(JSON.stringify({ error: "Invalid entry ID format" }), {
      status: 400,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  const user = await getAuthenticatedUser(context);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }

  try {
    const entry = await findGuestbookEntryById(db, id);
    if (!entry) {
      return new Response(JSON.stringify({ error: "Entry not found" }), {
        status: 404,
        headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
      });
    }

    const isOwner = entry.userId !== null && entry.userId === user.id;
    const canDelete = user.isAdmin || isOwner;

    if (!canDelete) {
      return new Response(
        JSON.stringify({ error: "You are not authorized to delete this entry" }),
        {
          status: 403,
          headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
        },
      );
    }

    await deleteGuestbookEntryById(db, id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  } catch (error) {
    console.error("Failed to delete guestbook entry:", error);
    return new Response(JSON.stringify({ error: "Failed to delete entry" }), {
      status: 500,
      headers: getSecurityHeaders({ "Cache-Control": "no-store" }),
    });
  }
};
