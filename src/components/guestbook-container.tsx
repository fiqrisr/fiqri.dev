import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AuthUser, GuestbookEntry, GuestbookResponse } from "../lib/types/guestbook";
import { GuestbookAuthBar } from "./guestbook-auth-bar";
import { GuestbookForm } from "./guestbook-form";
import { GuestbookList } from "./guestbook-list";

export type GuestbookContainerProps = {
  initialEntries?: GuestbookEntry[];
  turnstileSiteKey?: string;
};
const PAGE_SIZE = 10;

export const GuestbookContainer = ({
  initialEntries = [],
  turnstileSiteKey,
}: GuestbookContainerProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [activeSiteKey, setActiveSiteKey] = useState<string>(turnstileSiteKey || "");
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isEntriesLoading, setIsEntriesLoading] = useState<boolean>(initialEntries.length === 0);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [cursorMap, setCursorMap] = useState<Record<number, number | null>>({ 1: null });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        setOauthError(err);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("error");
        window.history.replaceState({}, "", newUrl.pathname + (newUrl.search || ""));
      }
    }
  }, []);

  const fetchEntries = useCallback(async (targetPage = 1, cursor: number | null = null) => {
    setIsEntriesLoading(true);
    try {
      const url = new URL("/api/guestbook", window.location.origin);
      url.searchParams.set("limit", String(PAGE_SIZE));
      if (cursor && cursor > 0) {
        url.searchParams.set("cursor", cursor.toString());
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = (await response.json()) as GuestbookResponse;
        setEntries(data.entries);
        setNextCursor(data.nextCursor);
        if (typeof data.totalCount === "number") {
          setTotalCount(data.totalCount);
        }
        setPage(targetPage);
        setCursorMap((prev) => ({
          ...prev,
          [targetPage]: cursor,
          ...(data.nextCursor ? { [targetPage + 1]: data.nextCursor } : {}),
        }));
      }
    } catch {
      // keep initial entries on error
    } finally {
      setIsEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = (await response.json()) as {
            authenticated: boolean;
            user: AuthUser | null;
            turnstileSiteKey?: string;
          };
          setUser(data.user);
          if (data.turnstileSiteKey) {
            setActiveSiteKey(data.turnstileSiteKey);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchSession();
    fetchEntries(1, null);
  }, [fetchEntries]);

  const handleEntryCreated = (newEntry: GuestbookEntry) => {
    setTotalCount((prev) => (prev !== undefined ? prev + 1 : undefined));
    if (page === 1) {
      setEntries((prev) => [newEntry, ...prev].slice(0, PAGE_SIZE));
      fetchEntries(1, null);
    } else {
      fetchEntries(1, null);
    }
  };

  const handleNextPage = () => {
    if (isEntriesLoading || !nextCursor) return;
    const targetPage = page + 1;
    fetchEntries(targetPage, nextCursor);
  };

  const handlePrevPage = () => {
    if (isEntriesLoading || page <= 1) return;
    const targetPage = page - 1;
    const targetCursor = cursorMap[targetPage] ?? null;
    fetchEntries(targetPage, targetCursor);
  };
  const handleDeleteEntry = async (id: string) => {
    const response = await fetch(`/api/guestbook/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Failed to delete message");
    }
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    setTotalCount((prev) => (prev !== undefined ? Math.max(0, prev - 1) : undefined));

    if (entries.length <= 1 && page > 1) {
      const prevPage = page - 1;
      const prevCursor = cursorMap[prevPage] ?? null;
      fetchEntries(prevPage, prevCursor);
    } else {
      const currentCursor = cursorMap[page] ?? null;
      fetchEntries(page, currentCursor);
    }
  };
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch {}
  };

  return (
    <div className="space-y-8">
      {oauthError && (
        <div
          role="alert"
          className="border-2 border-black bg-hazard text-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 font-mono text-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>[ AUTH_NOTICE: {oauthError} ]</span>
          </div>
          <button
            type="button"
            onClick={() => setOauthError(null)}
            className="underline hover:text-secondary uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      <GuestbookAuthBar user={user} isLoading={isAuthLoading} onLogout={handleLogout} />

      <GuestbookForm
        user={user}
        turnstileSiteKey={activeSiteKey}
        onEntryCreated={handleEntryCreated}
      />

      <GuestbookList
        entries={entries}
        currentUser={user}
        onDeleteEntry={handleDeleteEntry}
        isLoading={isEntriesLoading}
        page={page}
        totalCount={totalCount}
        totalPages={
          totalCount !== undefined ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : undefined
        }
        hasNextPage={Boolean(nextCursor)}
        hasPrevPage={page > 1}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />
    </div>
  );
};
